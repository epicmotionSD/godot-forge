import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLANS } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Map Stripe price ID → plan ID
function planIdForPrice(priceId: string): string {
  for (const [id, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId === priceId) return id;
  }
  return "starter";
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  switch (event.type) {
    // New subscription created (checkout completed)
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.subscription) break;

      const subscription = await getStripe().subscriptions.retrieve(
        session.subscription as string
      );
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      const priceId = subscription.items.data[0]?.price?.id;

      await supabase
        .from("profiles")
        .update({
          plan: planIdForPrice(priceId),
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
        })
        .eq("id", userId);

      break;
    }

    // Subscription updated (upgrade/downgrade, renewal)
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      const priceId = subscription.items.data[0]?.price?.id;
      const isActive = ["active", "trialing"].includes(subscription.status);

      await supabase
        .from("profiles")
        .update({
          plan: isActive ? planIdForPrice(priceId) : "starter",
          stripe_subscription_id: subscription.id,
        })
        .eq("id", userId);

      break;
    }

    // Subscription cancelled or expired
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      await supabase
        .from("profiles")
        .update({
          plan: "starter",
          stripe_subscription_id: null,
        })
        .eq("id", userId);

      break;
    }
  }

  return NextResponse.json({ received: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PLANS } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId } = await request.json();
  if (!priceId) {
    return NextResponse.json(
      { error: "priceId required" },
      { status: 400 }
    );
  }

  // Validate the price ID matches a known plan
  const validPriceIds = Object.values(PLANS)
    .map((p) => p.stripePriceId)
    .filter(Boolean);
  if (!validPriceIds.includes(priceId)) {
    return NextResponse.json(
      { error: "Invalid price" },
      { status: 400 }
    );
  }

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/settings?checkout=success`,
    cancel_url: `${origin}/dashboard/settings?checkout=cancelled`,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}

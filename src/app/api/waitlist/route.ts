import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = body?.email;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing Supabase environment variables");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        source: "landing_page",
      }),
    });

    if (response.status === 409) {
      return NextResponse.json({ message: "Already on the list!" });
    }

    if (!response.ok) {
      const text = await response.text();
      console.error("Supabase error:", response.status, text);
      if (text.includes("duplicate") || text.includes("unique")) {
        return NextResponse.json({ message: "Already on the list!" });
      }
      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
    }

    return NextResponse.json({ message: "You're on the list!" });
  } catch (err) {
    console.error("Waitlist signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

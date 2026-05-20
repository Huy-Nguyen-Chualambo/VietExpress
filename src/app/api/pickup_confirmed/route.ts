import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

type PickupConfirmedPayload = {
  orderId: string;
  driverId: string;
  pickedUpAt: string;
  notes?: string;
  status: string;
};

function assertValidPayload(payload: PickupConfirmedPayload) {
  const missing: string[] = [];
  if (!payload.orderId) missing.push("orderId");
  if (!payload.driverId) missing.push("driverId");
  if (!payload.pickedUpAt) missing.push("pickedUpAt");
  if (!payload.status) missing.push("status");
  return missing;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "employee") {
    return NextResponse.json(
      { ok: false, error: "Unauthorized. Staff role required." },
      { status: 401 }
    );
  }

  const payload = (await request.json()) as PickupConfirmedPayload;
  const missing = assertValidPayload(payload);

  if (missing.length) {
    return NextResponse.json(
      { ok: false, error: `Missing: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const webhookUrl = process.env.PICKUP_CONFIRMED_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { ok: false, error: "PICKUP_CONFIRMED_WEBHOOK_URL is not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId: payload.orderId,
      driverId: payload.driverId,
      pickedUpAt: payload.pickedUpAt,
      notes: payload.notes || "",
      status: payload.status,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { ok: false, error: "Webhook call failed", details: text },
      { status: 502 }
    );
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: true, data });
}

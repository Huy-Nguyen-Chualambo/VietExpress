import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  const payload = (await request.json()) as PickupConfirmedPayload;
  const missing = assertValidPayload(payload);

  if (missing.length) {
    return NextResponse.json(
      { ok: false, error: `Missing: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const baseUrl = process.env.N8N_WEBHOOK_BASE_URL || "http://localhost:5678/webhook-test/pickup-confirmed";
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, error: "N8N_WEBHOOK_BASE_URL is not configured" },
      { status: 500 }
    );
  }

  const url = `${baseUrl.replace(/\/$/, "")}/xac-nhan-lay-hang`;

  const res = await fetch(url, {
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

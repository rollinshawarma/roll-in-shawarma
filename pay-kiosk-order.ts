// Supabase Edge Function: pay-kiosk-order
//
// Kiosk "Scan to Pay" on our own page. The kiosk saves the order and
// creates its Square order (create-order-checkout, payOnPhone), then shows
// a QR code for  rollinshawarma.com/pay.html?ref=Kiosk123&t=<order id>.
// The customer's phone shows the cart and pays with Apple Pay, Google Pay
// or card through Square's Web Payments SDK; the phone hands this function
// a one-time Square token and this function charges it for the Square
// order's own total. Card numbers never touch our site or our database.
//
// The payment webhook then marks the order paid, sends it to the kitchen
// and emails the receipt, exactly like every other payment, and the kiosk
// screen (which is polling) shows "Order confirmed".
//
// What it checks before charging:
//   * the order id and reference match (the id is a secret only the QR has)
//   * it's a kiosk Scan to Pay order, still unpaid, under 30 minutes old
//   * the Square order is still open, matches the reference, and its total
//     equals our saved total
// A declined card leaves the order open so the customer can try again.
//
// ---- SETUP (Supabase Dashboard, no CLI needed) ----
// 1. Edge Functions -> Deploy a new function -> Via Editor
// 2. Name it exactly:  pay-kiosk-order
// 3. Paste this whole file in
// 4. Turn OFF "Verify JWT with legacy secret" (customers' phones call it)
// 5. Deploy. Uses the existing SQUARE_ACCESS_TOKEN / SQUARE_ENVIRONMENT
//    secrets; nothing new to add.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const PAY_WINDOW_MIN = 30;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// The caller's network as our host saw it (Cloudflare's header, else the
// LAST x-forwarded-for entry, which the proxy adds).
function callerIp(req: Request): string {
  const xff = (req.headers.get("x-forwarded-for") || "").split(",").map((x) => x.trim()).filter(Boolean);
  return (req.headers.get("cf-connecting-ip") || xff[xff.length - 1] || "unknown").trim().slice(0, 64);
}

function paymentErrorMessage(errors: any): string {
  const code = Array.isArray(errors) && errors[0]?.code;
  switch (code) {
    case "INSUFFICIENT_FUNDS": return "Your card was declined for insufficient funds. You haven't been charged. Try another card.";
    case "CARD_EXPIRED": return "That card has expired. You haven't been charged. Try another card.";
    case "CVV_FAILURE": return "The security code (CVV) didn't match. You haven't been charged. Please check it and try again.";
    case "ADDRESS_VERIFICATION_FAILURE": return "The ZIP code didn't match. You haven't been charged. Please check it and try again.";
    case "INVALID_EXPIRATION":
    case "GENERIC_DECLINE":
    case "CARD_DECLINED":
    case "TRANSACTION_LIMIT":
      return "Your payment was declined. You haven't been charged. Try another card.";
    default:
      return "Your payment didn't go through. You haven't been charged. Please try again.";
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    let body: any;
    try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
    const ref = typeof body?.ref === "string" ? body.ref.trim() : "";
    const orderId = typeof body?.t === "string" ? body.t.trim() : "";
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const verificationToken = typeof body?.verificationToken === "string" ? body.verificationToken.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().slice(0, 200) : "";
    if (!/^Kiosk\d{3,6}$/.test(ref) || !UUID_RE.test(orderId) || !token || token.length > 1024 || verificationToken.length > 2048) {
      return json({ error: "This payment link isn't valid. Please scan the code on the kiosk again." }, 400);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 20 attempts per 10 minutes per network: enough for a few declined
    // cards, not enough to test stolen ones.
    const { data: allowed, error: rlErr } = await supabase.rpc("rl_hit", { p_bucket: "kiosk-pay", p_key: callerIp(req), p_window_sec: 600, p_max: 20 });
    if (rlErr) console.error("rate limit check failed:", rlErr.message);
    else if (allowed === false) return json({ error: "Too many tries. Please wait a few minutes, or pay at the window.", code: "RATE_LIMITED" }, 429);

    const { data: order } = await supabase.from("orders")
      .select("id, reference_code, status, order_source, payment_method, square_order_id, square_payment_link_id, total_amount, created_at, customer_email")
      .eq("id", orderId).eq("reference_code", ref).maybeSingle();
    if (!order || order.order_source !== "kiosk" || order.payment_method !== "phone" || !order.square_order_id || order.square_payment_link_id) {
      return json({ error: "We couldn't find this order. Please scan the code on the kiosk again." }, 404);
    }
    const thanks = `https://rollinshawarma.com/thank-you.html?ref=${encodeURIComponent(ref)}&t=${order.id}`;
    if (order.status === "paid") return json({ paid: true, already: true, redirectUrl: thanks });
    if (order.status !== "pending") return json({ error: "This order was cancelled. Please start a new order on the kiosk.", code: "EXPIRED" }, 410);
    if (Date.now() - new Date(order.created_at).getTime() > PAY_WINDOW_MIN * 60000) {
      return json({ error: "This payment code has expired. Please start a new order on the kiosk.", code: "EXPIRED" }, 410);
    }

    const SQUARE_ACCESS_TOKEN = Deno.env.get("SQUARE_ACCESS_TOKEN");
    if (!SQUARE_ACCESS_TOKEN) return json({ error: "Payments aren't set up yet. Please pay at the window." }, 500);
    const BASE = (Deno.env.get("SQUARE_ENVIRONMENT") || "sandbox").toLowerCase() === "production"
      ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
    const headers = { "Square-Version": "2026-08-19", "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`, "Content-Type": "application/json" };

    // The Square order is the source of truth for what gets charged.
    const oRes = await fetch(`${BASE}/v2/orders/${encodeURIComponent(order.square_order_id)}`, { headers });
    const sq = (await oRes.json().catch(() => null))?.order;
    const totalCents = Math.round(Number(order.total_amount) * 100);
    if (!oRes.ok || !sq) {
      console.error(`RetrieveOrder failed for ${ref}`);
      return json({ error: "We couldn't reach the payment system. You haven't been charged. Please try again." }, 502);
    }
    if (sq.state === "COMPLETED" || Number(sq.net_amount_due_money?.amount ?? 1) === 0) return json({ paid: true, already: true, redirectUrl: thanks });
    if (sq.state !== "OPEN" || sq.reference_id !== ref || Number(sq.total_money?.amount) !== totalCents || (sq.tenders || []).length) {
      console.error(`Square order mismatch for ${ref}: state=${sq.state} ref=${sq.reference_id} total=${sq.total_money?.amount} ours=${totalCents}`);
      return json({ error: "We couldn't confirm your total. You haven't been charged. Please pay at the window." }, 409);
    }

    const payRes = await fetch(`${BASE}/v2/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        source_id: token,
        ...(verificationToken ? { verification_token: verificationToken } : {}),
        amount_money: { amount: totalCents, currency: "USD" },
        order_id: sq.id,
        location_id: sq.location_id,
        reference_id: ref,
        buyer_email_address: order.customer_email || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined),
        autocomplete: true,
      }),
    });
    const payData = await payRes.json().catch(() => null);
    if (!payRes.ok || payData?.payment?.status !== "COMPLETED") {
      console.error(`CreatePayment failed for ${ref}:`, JSON.stringify(payData?.errors?.map((e: any) => e.code) || payData?.payment?.status));
      return json({ error: paymentErrorMessage(payData?.errors), code: "PAYMENT_DECLINED" }, 402);
    }

    // A receipt email the wallet shared, if the kiosk didn't have one.
    if (!order.customer_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await supabase.from("orders").update({ customer_email: email }).eq("id", order.id).then(() => {}, () => {});
    }
    return json({ paid: true, redirectUrl: thanks });
  } catch (err) {
    console.error("[pay-kiosk-order] error:", err);
    return json({ error: "Something went wrong. If the kiosk shows your order confirmed, you're all set. Otherwise, please try again." }, 500);
  }
});

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Crown, Loader2 } from "lucide-react";
import styles from "./premium-keepsake.module.css";
import { z } from "zod";

interface RazorpayResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  theme: { color: string };
  timeout: number;
  handler: (payment: RazorpayResult) => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void; on: (event: string, callback: () => void) => void };
  }
}

let checkoutScript: Promise<void> | null = null;

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScript) return checkoutScript;
  checkoutScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); checkoutScript = null; reject(new Error("Checkout could not load. Please try again.")); };
    document.head.appendChild(script);
  });
  return checkoutScript;
}

const statusSchema = z.object({ paid: z.boolean(), available: z.boolean() });

export function PremiumKeepsake({ invitationId, compact = false, initialPaid = false, onActivated }: {
  invitationId: string;
  compact?: boolean;
  initialPaid?: boolean;
  onActivated?: () => void;
}) {
  const [paid, setPaid] = useState(initialPaid);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const verifying = useRef(false);
  const completed = useRef(initialPaid);
  const activated = useRef(onActivated);
  useEffect(() => { activated.current = onActivated; }, [onActivated]);

  const updateStatus = useCallback((status: z.infer<typeof statusSchema>) => {
    setPaid(status.paid);
    completed.current = status.paid;
    if (status.paid) { setMessage(""); activated.current?.(); }
  }, []);

  const checkStatus = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`/api/payments/premium?invitationId=${encodeURIComponent(invitationId)}`, { cache: "no-store", signal });
    if (!response.ok) throw new Error("Could not check payment status. Please retry.");
    return statusSchema.parse(await response.json());
  }, [invitationId]);

  useEffect(() => {
    const controller = new AbortController();
    checkStatus(controller.signal).then(updateStatus).catch((error: unknown) => {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Please retry.");
    });
    return () => controller.abort();
  }, [checkStatus, updateStatus]);

  async function verifyPayment(payment: RazorpayResult) {
    verifying.current = true;
    setBusy(true);
    setMessage("Confirming your payment…");
    try {
      const response = await fetch("/api/payments/premium", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, ...payment }),
      });
      const result: { paid?: boolean; error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || "Verification is pending. Please check again before paying.");
      if (result.paid) { completed.current = true; setPaid(true); setMessage(""); activated.current?.(); }
      else setMessage("Your payment is awaiting confirmation. Check status below before paying again.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please check payment status before paying again.");
    } finally { verifying.current = false; setBusy(false); }
  }

  async function startCheckout() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await loadCheckout();
      const response = await fetch("/api/payments/premium", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitationId }),
      });
      const order: { paid?: boolean; error?: string; keyId?: string; orderId?: string; amount?: number; currency?: string } = await response.json();
      if (!response.ok) throw new Error(order.error || "Checkout is unavailable. Please retry.");
      if (order.paid) { completed.current = true; setPaid(true); activated.current?.(); setBusy(false); return; }
      if (!window.Razorpay || !order.keyId || !order.orderId || order.amount !== 9900 || order.currency !== "INR") throw new Error("Could not open checkout. Please retry.");
      const checkout = new window.Razorpay({
        key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency,
        name: "GetMyInvite", description: "Keep this invitation forever · one-time payment",
        theme: { color: "#855f18" },
        timeout: 900,
        handler: (payment) => { void verifyPayment(payment); },
        modal: { ondismiss: () => { if (!verifying.current && !completed.current) { setBusy(false); setMessage("Checkout closed. Check status if a payment was made."); } } },
      });
      checkout.on("payment.failed", () => { setMessage("Payment was not completed. You can retry; your free invitation is unchanged."); });
      checkout.open();
    } catch (error) { setBusy(false); setMessage(error instanceof Error ? error.message : "Please try again."); }
  }

  async function refreshStatus() {
    setChecking(true);
    setMessage("");
    try { updateStatus(await checkStatus()); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Please retry."); }
    finally { setChecking(false); }
  }

  return (
    <section aria-label="Premium invitation keepsake" className={[styles.card, compact ? styles.compact : "", paid ? styles.paid : ""].join(" ")}>
      <div className={styles.header}>
        <h3 className={styles.title}><Crown size={17} aria-hidden="true" /> {paid ? "Kept forever" : "Keep it forever"}</h3>
        <span className={styles.badge}>{paid ? <><Check size={12} aria-hidden="true" /> Premium</> : "Optional"}</span>
      </div>
      <p className={styles.description}>{paid ? "Your invitation, photos and RSVPs are protected from automatic expiry." : "Save your invitation, photos and guest list beyond the celebration."}</p>
      {!paid && <>
        <button type="button" disabled={busy || checking} onClick={() => void startCheckout()} className={styles.button}>
          {(busy || checking) && <Loader2 size={15} aria-hidden="true" className={styles.spinner} />}
          {busy ? "Opening secure checkout…" : "Keep forever · ₹99"}
        </button>
        <p className={styles.note}>Pay once. No subscription. Secured by Razorpay.</p>
        <details className={styles.retention}>
          <summary>What happens on the free plan?</summary>
          <p>Published invitations expire 7 days after the last event. Unpublished drafts expire 7 days after creation. Premium removes automatic expiry; you can still delete your invitation yourself.</p>
        </details>
      </>}
      {message && <div className={styles.message} role="status">{message}<button type="button" disabled={busy || checking} onClick={() => void refreshStatus()}>Check payment status</button></div>}
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Crown, Heart, Infinity as InfinityIcon, Loader2, ShieldCheck } from "lucide-react";
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
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const verifying = useRef(false);
  const completed = useRef(initialPaid);
  const activated = useRef(onActivated);
  useEffect(() => { activated.current = onActivated; }, [onActivated]);

  const updateStatus = useCallback((status: z.infer<typeof statusSchema>) => {
    setPaid(status.paid);
    completed.current = status.paid;
    setAvailable(status.available === true);
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
    }).finally(() => { if (!controller.signal.aborted) setChecking(false); });
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

  return (
    <section aria-label="Premium invitation keepsake" className={`${styles.card} ${compact ? styles.compact : ""} ${paid ? styles.paid : ""}`}>
      <div className={styles.header}><span className={styles.eyebrow}><Crown size={13} aria-hidden="true" /> {paid ? "Your forever keepsake" : "A little forever"}</span>{paid && <span className={styles.badge}><Check size={12} aria-hidden="true" /> Premium</span>}</div>
      <div className={styles.content}>
        <div>
          <h3 className={styles.title}>{paid ? "Your story stays." : "The day ends. The memories stay."}</h3>
          <p className={styles.description}>{paid ? "This invitation, its photos and your RSVP list are protected from automatic expiry." : "Keep this invitation, your photos and your guest list beyond the celebration."}</p>
        </div>
        {!paid && <div className={styles.price}>₹99<span>one time · per invitation</span></div>}
      </div>
      {!compact && <div className={styles.benefits}><span><InfinityIcon size={15} aria-hidden="true" /> No automatic expiry</span><span><Heart size={14} aria-hidden="true" /> Photos & RSVPs preserved</span></div>}
      {paid ? (
        <p className={styles.confirmed}><ShieldCheck size={16} aria-hidden="true" /> Kept forever. You can still delete it yourself.</p>
      ) : (
        <>
          <button type="button" disabled={busy || checking || !available} onClick={() => void startCheckout()} className={styles.button}>
            {(busy || checking) && <Loader2 size={15} aria-hidden="true" className={styles.spinner} />}
            {checking ? "Checking…" : busy ? "Completing payment…" : available ? "Keep forever · ₹99" : "Premium coming soon"}
          </button>
          <p className={styles.note}>{available ? "One payment. No subscription. Secure checkout by Razorpay." : "Free publishing is available now. No payment is required."}</p>
          <p className={styles.retention}>Free invitations expire after 7 days past the last event. Unpublished free drafts expire 7 days after creation.</p>
        </>
      )}
      {message && <div className={styles.message} role="status">{message}<button type="button" disabled={busy} onClick={() => {
        setChecking(true);
        checkStatus().then(updateStatus).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Please retry.")).finally(() => setChecking(false));
      }}>Check status</button></div>}
    </section>
  );
}

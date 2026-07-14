"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useWizardStore } from "@/lib/store";
import { checkSlugAvailabilityAction, publishInvitation, suggestAvailableSlugAction } from "@/app/actions";

interface StepPublishProps {
  onPublishSuccess: (slug: string) => void;
}

export function StepPublish({ onPublishSuccess }: StepPublishProps) {
  const { invitationId, data } = useWizardStore();
  const currentSlug = useWizardStore((state) => (state as any).slug || "");
  const currentStatus = useWizardStore((state) => (state as any).status || "draft");
  const updateStoreMetadata = useWizardStore((state) => {
    return (state as any).updateData ? (state as any).updateData : () => {};
  });

  const [slug, setSlug] = useState(currentSlug);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showQR, setShowQR] = useState(false);
  const storePrivacy = useWizardStore((state) => (state as any).privacy || "public");
  const storeSetPrivacy = useWizardStore((state) => (state as any).setPrivacy || (() => {}));
  const [privacy, setPrivacy] = useState<"public" | "unlisted">(storePrivacy);
  const [randomSuffix, setRandomSuffix] = useState("");
  const [baseSlug, setBaseSlug] = useState("");

  // Sync privacy state with store when hydrations occur
  useEffect(() => {
    setPrivacy(storePrivacy);
  }, [storePrivacy]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derive slug suggestion from partner names if slug is empty or is the default timestamp slug
  useEffect(() => {
    const isDefaultSlug = currentSlug.startsWith("wedding-");
    if ((!currentSlug || isDefaultSlug) && data) {
      const p1 = data.partner1.firstName;
      const p2 = data.partner2.firstName;
      if (p1 && p2) {
        suggestAvailableSlugAction(p1, p2, invitationId).then((res) => {
          if (res.ok && res.slug) {
            setBaseSlug(res.slug);
            setSlug(res.slug);
          }
        });
      }
    } else if (currentSlug) {
      setBaseSlug(currentSlug);
    }
  }, [currentSlug, data, invitationId]);

  const handlePrivacyChange = (newPrivacy: "public" | "unlisted") => {
    setPrivacy(newPrivacy);
    
    if (newPrivacy === "unlisted") {
      let suffix = randomSuffix;
      if (!suffix) {
        suffix = Math.random().toString(36).substring(2, 10);
        setRandomSuffix(suffix);
      }
      
      const cleanBase = baseSlug || slug;
      const cleanBaseWithoutSuffix = cleanBase.replace(/-[a-z0-9]{8}$/, "");
      const newSlug = `${cleanBaseWithoutSuffix}-${suffix}`;
      setSlug(newSlug);
    } else {
      const cleanBase = baseSlug || slug;
      const cleanBaseWithoutSuffix = cleanBase.replace(/-[a-z0-9]{8}$/, "");
      setSlug(cleanBaseWithoutSuffix);
    }
  };

  // Check slug availability when it changes (debounced)
  useEffect(() => {
    if (!slug) {
      setAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      setErrorMsg("");
      try {
        const res = await checkSlugAvailabilityAction(slug, invitationId);
        if (res.ok) {
          setAvailable(res.available ?? false);
        } else {
          setAvailable(false);
          setErrorMsg(res.error || "Slug is invalid");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, invitationId]);

  const handlePublish = async () => {
    if (!available && currentSlug !== slug) {
      alert("Please choose an available URL slug first.");
      return;
    }

    setPublishing(true);
    setErrorMsg("");

    try {
      const res = await publishInvitation(invitationId, slug, privacy);
      if (res.ok) {
        // Success - update store values
        storeSetPrivacy(privacy);
        alert(currentStatus === "published" ? "Settings updated successfully! Your live page is up to date." : "Your invitation is now live!");
        onPublishSuccess(slug);
      } else {
        setErrorMsg(res.error || "Failed to publish invitation");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong during publishing");
    } finally {
      setPublishing(false);
    }
  };

  const domainUrl = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}` : "";
  const publicUrl = `${domainUrl}/${slug}`;

  // Generate QR Code
  useEffect(() => {
    if (currentStatus === "published" && canvasRef.current && slug) {
      QRCode.toCanvas(canvasRef.current, publicUrl, {
        width: 150,
        margin: 2,
        color: {
          dark: "#855f18",
          light: "#ffffff",
        },
      }).catch((err) => console.error("QR generation failed", err));
    }
  }, [currentStatus, publicUrl, slug]);

  const handleWhatsAppShare = () => {
    const text = `Join us at our wedding! View our invitation site and RSVP here: ${publicUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#eae6df] pb-4">
        <h2 className="text-xl font-serif font-bold text-[#1a1a1a]">Step 7 — Publish Invitation</h2>
        <p className="text-xs text-[#666]">Choose your shareable web link and publish it live</p>
      </div>

      {currentStatus === "published" && (
        <div className="bg-white border border-[#eae6df] rounded-2xl p-6 shadow-md text-center space-y-6">
          <div className="space-y-2">
            <span className="text-4xl">🎉</span>
            <h3 className="font-serif text-2xl font-bold text-[#855f18]">Your Invitation is Live!</h3>
            <p className="text-xs text-[#666]">It is published to the world and ready to receive RSVPs</p>
          </div>

          {/* Published URL */}
          <div className="p-4 bg-[#faf8f5] border border-[#eae6df] rounded-xl flex items-center justify-between gap-4">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#855f18] underline break-all text-left"
            >
              {publicUrl}
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                alert("Link copied to clipboard!");
              }}
              className="px-3 py-1.5 bg-[#855f18]/10 text-[#855f18] hover:bg-[#855f18]/25 text-xs font-semibold rounded active:scale-95 transition-all flex-shrink-0"
            >
              Copy Link
            </button>
          </div>

          {/* QR Code and Social Actions */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="px-4 py-2 bg-[#25D366] text-white hover:opacity-90 text-xs font-bold rounded-lg transition-all"
              >
                Share on WhatsApp
              </button>
              <button
                onClick={() => setShowQR(!showQR)}
                className="px-4 py-2 border border-[#eae6df] hover:bg-[#faf8f5] text-[#1a1a1a] text-xs font-bold rounded-lg transition-all"
              >
                {showQR ? "Hide QR Code" : "Show QR Code"}
              </button>
            </div>

            {showQR && (
              <div className="p-4 border border-[#eae6df] rounded-xl bg-white shadow-md flex flex-col items-center">
                <canvas ref={canvasRef} />
                <span className="text-[10px] text-[#777] mt-2 uppercase font-bold tracking-wider">Scan to Open</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-[#eae6df] rounded-2xl p-6 shadow-md space-y-6">
        <h3 className="font-serif text-lg font-bold text-[#855f18] border-b border-[#faf8f5] pb-2">
          {currentStatus === "published" ? "Link & Privacy Settings" : "Link Settings"}
        </h3>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider mb-2">
            Choose URL Slug (link path)
          </label>
          <div className="flex items-center">
            <span className="px-3 py-2 bg-[#faf8f5] border border-r-0 border-[#eae6df] text-xs text-[#777] rounded-l">
              getmyinvite.in/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              disabled={publishing}
              className="flex-1 px-3 py-2 border border-[#eae6df] rounded-r text-xs focus:outline-none focus:border-[#855f18] disabled:opacity-50"
              placeholder="couple-names"
            />
          </div>

          {/* Check slug availability output status */}
          <div className="mt-2 flex items-center gap-2">
            {checking && <span className="text-[10px] text-gray-500">Checking availability...</span>}
            {!checking && (available === true || currentSlug === slug) && (
              <span className="text-[10px] text-green-600 font-bold">✓ This link slug is available</span>
            )}
            {!checking && available === false && currentSlug !== slug && (
              <span className="text-[10px] text-red-600 font-bold">✗ Link slug is unavailable or invalid</span>
            )}
          </div>

          {/* Privacy Settings Options */}
          <div className="mt-4 border-t border-[#eae6df] pt-4 space-y-3">
            <label className="block text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
              Privacy Option
            </label>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Public Option */}
              <label className="flex items-start gap-3 p-3 border border-[#eae6df] hover:bg-[#faf8f5] rounded-xl cursor-pointer transition-all">
                <input
                  type="radio"
                  name="privacy"
                  checked={privacy === "public"}
                  onChange={() => handlePrivacyChange("public")}
                  disabled={publishing}
                  className="mt-0.5 text-[#855f18] focus:ring-[#855f18]"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#1a1a1a]">Public (Recommended)</span>
                  <p className="text-[10px] text-[#666] leading-relaxed">
                    Your invitation will have a clean URL (e.g. <code>getmyinvite.in/priya-and-arjun</code>), is searchable on Google, and is indexed on the sitemap.
                  </p>
                </div>
              </label>

              {/* Unlisted Option */}
              <label className="flex items-start gap-3 p-3 border border-[#eae6df] hover:bg-[#faf8f5] rounded-xl cursor-pointer transition-all">
                <input
                  type="radio"
                  name="privacy"
                  checked={privacy === "unlisted"}
                  onChange={() => handlePrivacyChange("unlisted")}
                  disabled={publishing}
                  className="mt-0.5 text-[#855f18] focus:ring-[#855f18]"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#1a1a1a]">Unlisted / Private</span>
                  <p className="text-[10px] text-[#666] leading-relaxed">
                    Appends a random suffix to make your URL unguessable (e.g. <code>getmyinvite.in/priya-and-arjun-k3xq9f2p</code>). Excluded from search indexing and sitemaps.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={handlePublish}
          disabled={publishing || checking || (available === false && currentSlug !== slug)}
          className="w-full py-3 bg-[#855f18] text-white hover:bg-[#6c4c12] font-bold rounded uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
        >
          {publishing 
            ? (currentStatus === "published" ? "Updating Settings..." : "Publishing Site...") 
            : (currentStatus === "published" ? "Update Settings" : "Publish Invitation")}
        </button>
      </div>
      )}
    </div>
  );
}

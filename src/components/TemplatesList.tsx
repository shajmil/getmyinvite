"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { templateRegistry } from "@/templates/registry";
import { createNewInvitationAction } from "@/app/actions";

interface TemplatesListProps {
  isLoggedIn: boolean;
}

export function TemplatesList({ isLoggedIn }: TemplatesListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const templates = Object.values(templateRegistry);

  const handleUseTemplate = async (templateId: string) => {
    if (!isLoggedIn) {
      router.push(`/sign-up?callbackUrl=${encodeURIComponent("/templates")}`);
      return;
    }

    setLoadingId(templateId);
    try {
      const res = await createNewInvitationAction(templateId);
      if (res.ok && res.id) {
        router.push(`/dashboard/invitations/${res.id}/edit`);
      } else {
        alert(res.error || "Failed to start draft. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {templates.map((temp) => (
        <div
          key={temp.id}
          className="bg-white border border-[#eae6df] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300"
        >
          {/* Thumbnail Placeholder */}
          <div className="aspect-video bg-[#faf8f5] border-b border-[#eae6df] flex flex-col items-center justify-center p-6 text-center relative group">
            <span className="font-serif italic font-bold text-3xl text-[#855f18]/60">{temp.name}</span>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
              <Link
                href={`/test-templates?template=${temp.id}`}
                className="px-4 py-2 bg-white text-black hover:bg-var(--bg-cream) text-xs font-bold rounded-lg uppercase tracking-wider transition-all"
              >
                Live Preview
              </Link>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">{temp.name} Theme</h3>
              <p className="text-xs text-[#666] leading-relaxed mt-1">{temp.description}</p>
            </div>

            <div className="border-t border-[#faf8f5] pt-4 flex gap-3">
              <button
                disabled={loadingId !== null}
                onClick={() => handleUseTemplate(temp.id)}
                className="flex-1 py-2.5 bg-[#855f18] text-white hover:bg-[#6c4c12] text-xs font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50 text-center active:scale-[0.98]"
              >
                {loadingId === temp.id ? "Starting..." : "Use This Template"}
              </button>
              <Link
                href={`/test-templates?template=${temp.id}`}
                className="px-4 py-2.5 border border-[#eae6df] hover:bg-[#faf8f5] text-xs font-bold uppercase tracking-wider rounded-lg transition-all text-center flex items-center justify-center"
              >
                Preview
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

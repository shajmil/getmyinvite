"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, MessageCircle, X } from "lucide-react";

export function SupportPopup() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const isEditorPage = /^\/dashboard\/invitations\/[^/]+\/edit$/.test(pathname);
  const isBuilderPage = pathname === "/" || pathname === "/templates" ||
    pathname === "/sign-in" || pathname === "/sign-up" ||
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (!isBuilderPage) return null;

  return (
    <aside
      aria-label="GetMyInvite support"
      className={`fixed left-3 z-40 max-w-[calc(100vw-24px)] sm:left-6 ${
        isEditorPage
          ? "bottom-[calc(80px+env(safe-area-inset-bottom))]"
          : "bottom-[calc(12px+env(safe-area-inset-bottom))] sm:bottom-6"
      }`}
    >
      {isOpen ? (
        <div className="w-72 max-w-[calc(100vw-24px)] rounded-2xl border border-[#eae6df] bg-[#fffdf9] p-5 shadow-[0_8px_32px_rgba(26,26,26,0.12)]">
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#855f18]/10 text-[#855f18]">
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
            </span>
            <button
              type="button"
              aria-label="Dismiss support message"
              onClick={() => setIsOpen(false)}
              className="-mr-2 -mt-2 flex h-9 w-9 items-center justify-center rounded-full text-[#666] transition-colors hover:bg-[#f5f0eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#855f18]"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-3 font-serif text-lg text-[#1a1a1a]">Need a little hand?</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#666]">
            Facing any issues? Feel free to message me on Instagram. I’m happy to help!
          </p>
          <a
            href="https://www.instagram.com/shajmil.vj/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Message Shajmil on Instagram (opens in a new tab)"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#855f18] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6c4c12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#855f18]"
          >
            Message me on Instagram
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Open support message"
          title="Need a hand?"
          onClick={() => setIsOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-gradient-to-r from-[#855f18] to-[#b38f4d] text-white shadow-lg transition-colors hover:from-[#6c4c12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#855f18]"
        >
          <MessageCircle aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </aside>
  );
}

"use client";

import React, { useState } from "react";
import { Code, X, Heart } from "lucide-react";

export function DeveloperCredits() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#855f18] to-[#b38f4d] text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer border border-white/20"
        >
          <Code className="w-4 h-4 animate-pulse group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-semibold tracking-wider">Meet the Dev</span>
        </button>
      )}

      {/* Credit Card modal */}
      {isOpen && (
        <div className="w-80 bg-white/95 backdrop-blur-md border border-[#eae6df] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 relative animate-in fade-in zoom-in-95 duration-300">
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-[#777] hover:text-[#1a1a1a] p-1 rounded-lg hover:bg-[#faf8f5] active:scale-90 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#855f18] to-[#b38f4d] flex items-center justify-center text-white font-serif text-lg font-bold shadow-md">
                S
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#1a1a1a]">Shajmil</h4>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[#855f18]">Full Stack Creator</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 border-t border-[#eae6df] pt-3">
              <h5 className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1">
                Are you amazed? <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-ping" />
              </h5>
              <p className="text-xs text-[#666] leading-relaxed">
                Yes, I designed and developed this entire wedding invitation builder platform from scratch!
              </p>
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <a
                href="https://www.linkedin.com/in/shajmil/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#eae6df] hover:border-[#855f18] hover:bg-[#faf8f5] transition-all group"
              >
                <svg className="w-4 h-4 text-[#666] group-hover:text-[#0077b5] group-hover:scale-110 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                <span className="text-[9px] font-semibold text-[#777] mt-1 group-hover:text-[#1a1a1a]">LinkedIn</span>
              </a>

              <a
                href="https://github.com/shajmil"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#eae6df] hover:border-[#855f18] hover:bg-[#faf8f5] transition-all group"
              >
                <svg className="w-4 h-4 text-[#666] group-hover:text-[#1a1a1a] group-hover:scale-110 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                <span className="text-[9px] font-semibold text-[#777] mt-1 group-hover:text-[#1a1a1a]">GitHub</span>
              </a>

              <a
                href="https://www.instagram.com/shajmil.vj/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-[#eae6df] hover:border-[#855f18] hover:bg-[#faf8f5] transition-all group"
              >
                <svg className="w-4 h-4 text-[#666] group-hover:text-[#e1306c] group-hover:scale-110 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                <span className="text-[9px] font-semibold text-[#777] mt-1 group-hover:text-[#1a1a1a]">Instagram</span>
              </a>
            </div>

            <div className="text-[9px] text-[#999] text-center pt-2">
              Powered by Next.js, Drizzle &amp; Neon
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

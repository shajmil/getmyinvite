"use client";

import React, { useState, useEffect } from "react";
import { Heart, Sparkles, Award } from "lucide-react";

interface WeddingLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
  progress?: number;
  interactive?: boolean;
}

const WEDDING_QUOTES = [
  "“Two souls with but a single thought, two hearts that beat as one.”",
  "“Once in a while, right in the middle of an ordinary life, love gives us a fairytale.”",
  "“Love doesn't make the world go round. Love is what makes the ride worthwhile.”",
  "“Together is a beautiful place to be.”",
  "“Every love story is beautiful, but ours is my favorite.”",
  "“To love and be loved is to feel the sun from both sides.”",
  "“In all the world, there is no heart for me like yours.”",
];

export function WeddingLoader({
  message = "Creating Your Wedding Invitation",
  subMessage = "Crafting timeless memories for your big day...",
  fullScreen = true,
  progress,
  interactive = true,
}: WeddingLoaderProps) {
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const [tapCount, setTapCount] = useState<number>(0);

  // Automatically cycle through romantic quotes every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % WEDDING_QUOTES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Interactive Tap Handler: Spawns floating heart sparkles on tap/click
  const handleRingTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!interactive) return;

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = clientX ? clientX - rect.left : rect.width / 2;
    const y = clientY ? clientY - rect.top : rect.height / 2;

    const newHeart = {
      id: Date.now() + Math.random(),
      x,
      y,
      size: Math.floor(Math.random() * 16) + 16,
    };

    setHearts((prev) => [...prev.slice(-12), newHeart]);
    setTapCount((prev) => prev + 1);

    // Cycle quote on tap for extra engagement
    setQuoteIndex((prev) => (prev + 1) % WEDDING_QUOTES.length);
  };

  const content = (
    <div className="flex flex-col items-center justify-center text-center p-6 max-w-sm sm:max-w-md w-full mx-auto select-none space-y-6">
      
      {/* Interactive Intertwined Rings & Heart Central Emblem */}
      <div
        onClick={handleRingTap}
        className="relative cursor-pointer group flex items-center justify-center p-4"
        title={interactive ? "Tap for wedding sparkles & love notes!" : undefined}
      >
        {/* Glowing Outer Rings Animation */}
        <div className="absolute w-28 h-28 rounded-full border-2 border-[#d4af37]/30 animate-ping opacity-75" />
        <div className="absolute w-32 h-32 rounded-full border border-dashed border-[#d4af37]/40 animate-spin-slow" />
        <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-[#d4af37]/20 via-[#f4efe6]/10 to-transparent blur-md group-hover:scale-110 transition-transform duration-300" />

        {/* Center Interlocking Wedding Rings & Heart Graphic */}
        <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-[#292621] border-2 border-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.4)] group-hover:border-white transition-all transform group-active:scale-90">
          <div className="relative flex items-center justify-center">
            {/* Left Ring */}
            <div className="w-8 h-8 rounded-full border-2 border-[#d4af37] shadow-sm transform -translate-x-1 animate-pulse" />
            {/* Right Ring */}
            <div className="w-8 h-8 rounded-full border-2 border-[#f4efe6] shadow-sm transform translate-x-1 animate-pulse" />
            {/* Center Heart */}
            <Heart className="absolute w-5 h-5 text-[#e11d48] fill-[#e11d48] animate-bounce" />
          </div>
        </div>

        {/* Floating Heart Particles from Interaction */}
        {hearts.map((h) => (
          <span
            key={h.id}
            className="absolute pointer-events-none text-rose-500 animate-float-heart font-bold"
            style={{
              left: h.x,
              top: h.y,
              fontSize: `${h.size}px`,
            }}
          >
            ♥
          </span>
        ))}

        {/* Interactive Tap Tooltip Indicator for Mobile */}
        {interactive && (
          <span className="absolute -bottom-2 bg-[#d4af37] text-black text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-md animate-bounce">
            Tap for Love Notes
          </span>
        )}
      </div>

      {/* Main Heading */}
      <div className="space-y-2">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#f4efe6] tracking-wide leading-tight">
          {message}
        </h2>
        <p className="text-xs text-[#d4af37] font-medium tracking-wide">
          {subMessage}
        </p>
      </div>

      {/* Progress Bar (if progress numeric value is provided) */}
      {typeof progress === "number" && (
        <div className="w-full bg-[#292621] rounded-full h-2 overflow-hidden border border-[#3d372e] p-0.5 shadow-inner">
          <div
            className="bg-gradient-to-r from-[#d4af37] via-[#f4efe6] to-[#d4af37] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(212,175,55,0.8)]"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {/* Romantic Quote Carousel */}
      <div className="bg-[#292621]/80 border border-[#3d372e] rounded-xl p-4 w-full shadow-lg relative overflow-hidden backdrop-blur-xs">
        <div className="flex items-center justify-center gap-1 text-[#d4af37] mb-1.5 text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-serif italic font-semibold text-[11px]">Wedding Love Note</span>
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <p className="font-serif text-xs sm:text-sm italic text-gray-200 leading-relaxed min-h-[40px] flex items-center justify-center transition-all duration-500">
          {WEDDING_QUOTES[quoteIndex]}
        </p>
        {tapCount > 0 && (
          <p className="text-[9px] text-[#d4af37] mt-1 font-semibold">
            {tapCount} love blessing{tapCount > 1 ? "s" : ""} added!
          </p>
        )}
      </div>

      {/* Animated Loading Dots */}
      <div className="flex items-center gap-1.5 pt-1">
        <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>

    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0e0c]/90 backdrop-blur-md transition-all duration-300">
        {content}
      </div>
    );
  }

  return content;
}

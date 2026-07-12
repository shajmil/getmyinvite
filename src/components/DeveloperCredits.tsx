"use client";

import React, { useState, useEffect, useRef } from "react";
import { Code, X, Heart } from "lucide-react";

export function DeveloperCredits() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Coordinate position of the floating button
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeCorner, setActiveCorner] = useState<"TL" | "TR" | "BL" | "BR">("BR");
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const dragPositionStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Initialize position in bottom right corner on mount
  useEffect(() => {
    setIsMounted(true);
    const initX = window.innerWidth - 170;
    const initY = window.innerHeight - 70;
    setPosition({ x: initX, y: initY });
  }, []);

  // Recalculate bounds and snap position on window resize
  useEffect(() => {
    if (!isMounted) return;
    const handleResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let newX = 24;
      let newY = 24;

      if (activeCorner === "TR" || activeCorner === "BR") {
        newX = vw - 170;
      }
      if (activeCorner === "BL" || activeCorner === "BR") {
        newY = vh - 70;
      }
      setPosition({ x: newX, y: newY });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMounted, activeCorner]);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: clientX, y: clientY };
    dragPositionStart.current = { ...position };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStart.current.x;
    const deltaY = clientY - dragStart.current.y;
    
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMoved.current = true;
    }
    
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // Maintain a safe margin within the screen bounds
    const newX = Math.max(10, Math.min(vw - 160, dragPositionStart.current.x + deltaX));
    const newY = Math.max(10, Math.min(vh - 60, dragPositionStart.current.y + deltaY));
    
    setPosition({ x: newX, y: newY });
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (!hasMoved.current) {
      setIsOpen(true);
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    const corners = [
      { id: "TL" as const, x: 24, y: 24 },
      { id: "TR" as const, x: vw - 170, y: 24 },
      { id: "BL" as const, x: 24, y: vh - 70 },
      { id: "BR" as const, x: vw - 170, y: vh - 70 },
    ];

    let closest = corners[3]; // Default to BR
    let minDist = Infinity;

    corners.forEach((c) => {
      const dist = Math.pow(position.x - c.x, 2) + Math.pow(position.y - c.y, 2);
      if (dist < minDist) {
        minDist = dist;
        closest = c;
      }
    });

    setActiveCorner(closest.id);
    setPosition({ x: closest.x, y: closest.y });
  };

  // Capture global mouse/touch events while dragging is active
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onMouseUp = () => {
      handleEnd();
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, position]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 select-none">
      <style>{`
        @keyframes dev-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-dev-float {
          animation: dev-float 3s ease-in-out infinite;
        }
      `}</style>

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleStart(e.clientX, e.clientY);
          }}
          onTouchStart={(e) => {
            if (e.touches[0]) {
              handleStart(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          className={`fixed pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#855f18] to-[#b38f4d] text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 group cursor-grab active:cursor-grabbing border border-white/20 ${
            isDragging ? "transition-none" : "transition-all duration-300 ease-out animate-dev-float"
          }`}
        >
          <Code className="w-4 h-4 animate-pulse group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-semibold tracking-wider">Meet the Dev</span>
        </button>
      )}

      {/* Credit Card Modal */}
      {isOpen && (
        <div
          style={{
            left: activeCorner === "TL" || activeCorner === "BL" ? "24px" : "auto",
            right: activeCorner === "TR" || activeCorner === "BR" ? "24px" : "auto",
            top: activeCorner === "TL" || activeCorner === "TR" ? "24px" : "auto",
            bottom: activeCorner === "BL" || activeCorner === "BR" ? "24px" : "auto",
          }}
          className="fixed pointer-events-auto w-80 bg-white/95 backdrop-blur-md border border-[#eae6df] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 animate-in fade-in zoom-in-95 duration-300"
        >
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

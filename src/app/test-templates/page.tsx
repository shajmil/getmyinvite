"use client";

import React, { useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { templateRegistry } from "@/templates/registry";
import { demoInvitationData } from "@/templates/demo-data";

interface IframePreviewProps {
  children: React.ReactNode;
}

function IframePreview({ children }: IframePreviewProps) {
  const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!iframeRef) return;
    const doc = iframeRef.contentDocument;
    if (!doc) return;

    const setupIframe = () => {
      const doc = iframeRef.contentDocument;
      if (!doc || !doc.body) return;

      // Clear head to avoid duplicates
      doc.head.innerHTML = "";

      // Copy styles
      document.querySelectorAll("style, link[rel='stylesheet']").forEach((el) => {
        doc.head.appendChild(el.cloneNode(true));
      });

      // Viewport meta
      const meta = doc.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1.0";
      doc.head.appendChild(meta);

      // Base URL for relative paths
      const base = doc.createElement("base");
      base.href = window.location.origin;
      doc.head.appendChild(base);

      // Document styles
      doc.documentElement.style.height = "100%";
      doc.body.style.margin = "0";
      doc.body.style.padding = "0";
      doc.body.style.height = "100%";
      doc.body.style.width = "100%";
      doc.body.style.overflowX = "hidden";

      // Intercept hash link clicks to prevent base URL navigation inside the preview iframe
      doc.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest("a");
        if (anchor) {
          const href = anchor.getAttribute("href");
          if (href?.startsWith("#")) {
            e.preventDefault();
            const id = href.slice(1);
            if (id) {
              const element = doc.getElementById(id);
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
              }
            }
          }
        }
      });

      setMountNode(doc.body);
    };

    setupIframe();
  }, [iframeRef]);

  return (
    <iframe
      ref={setIframeRef}
      style={{ border: "none", width: "100%", height: "100%" }}
      title="preview-frame"
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}

function TestTemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateParam = searchParams.get("template") as "barcelona" | "classic" | null;
  
  // Deriving active template state directly from search parameters to prevent conflicting updates
  const selectedTemplate = (templateParam && templateRegistry[templateParam]) ? templateParam : "barcelona";
  const [selectedScheme, setSelectedScheme] = useState<string>("");

  const registryEntry = templateRegistry[selectedTemplate];
  const activeSchemeId = selectedScheme || registryEntry.colorSchemes[0].id;

  // Sync color scheme when active template updates
  useEffect(() => {
    setSelectedScheme(registryEntry.colorSchemes[0].id);
  }, [selectedTemplate, registryEntry]);

  const TemplateComponent = registryEntry.component;

  // Transition template by updating URL query params, keeping URL as single source of truth
  const handleTemplateChange = (tempId: "barcelona" | "classic") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("template", tempId);
    router.push(`/test-templates?${params.toString()}`);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col font-sans">
      {/* Sleek Dark Top Control Header Bar */}
      <header className="h-16 bg-[#131519]/95 backdrop-blur-md border-b border-white/10 px-4 md:px-6 flex items-center justify-between flex-shrink-0 z-[100] select-none text-white shadow-md">
        
        {/* Left: Symmetrical Close Button */}
        <Link
          href="/templates"
          className="flex items-center gap-1.5 text-white/70 hover:text-white hover:scale-105 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
          title="Exit Preview"
        >
          <X className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Exit Preview</span>
        </Link>

        {/* Center: Template Switcher (Visible and Accessible on Both) */}
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => handleTemplateChange("barcelona")}
            className={`px-3 py-1.5 rounded-md transition-all text-xs font-bold cursor-pointer ${
              selectedTemplate === "barcelona" ? "bg-white text-black" : "hover:bg-white/5 text-white/80"
            }`}
          >
            Barcelona
          </button>
          <button
            onClick={() => handleTemplateChange("classic")}
            className={`px-3 py-1.5 rounded-md transition-all text-xs font-bold cursor-pointer ${
              selectedTemplate === "classic" ? "bg-white text-black" : "hover:bg-white/5 text-white/80"
            }`}
          >
            Classic
          </button>
        </div>

        {/* Right: Color Scheme Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold hidden md:inline">Palette:</span>
          <select
            value={activeSchemeId}
            onChange={(e) => setSelectedScheme(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg py-1.5 px-3 text-xs text-white outline-none cursor-pointer hover:bg-white/15 transition-all"
          >
            {registryEntry.colorSchemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id} className="bg-neutral-900 text-white">
                {scheme.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Template Scrollable Frame (Renders cleanly below the Header Bar) */}
      <div className="flex-1 relative">
        <IframePreview>
          <TemplateComponent data={demoInvitationData} colorSchemeId={activeSchemeId} isPreview={true} />
        </IframePreview>
      </div>
    </div>
  );
}

export default function TestTemplatesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="animate-spin w-8 h-8 border-4 border-[#855f18] border-t-transparent rounded-full" />
      </div>
    }>
      <TestTemplatesContent />
    </Suspense>
  );
}

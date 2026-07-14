"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { templateRegistry } from "@/templates/registry";
import { demoInvitationData } from "@/templates/demo-data";

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
    <div className="min-h-screen flex flex-col font-sans">
      {/* Premium Close Preview Pill (Top Right) */}
      <Link
        href="/templates"
        className="fixed top-6 right-6 z-50 pointer-events-auto flex items-center gap-1.5 px-4 py-2.5 bg-black/80 hover:bg-black backdrop-blur-md text-white rounded-full border border-white/20 hover:scale-105 active:scale-95 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.3)] text-[10px] font-bold uppercase tracking-wider cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
        <span>Exit Preview</span>
      </Link>

      {/* Top Left Floating Control Bar */}
      <div className="fixed top-6 left-6 z-50 bg-black/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col gap-4 text-xs font-semibold max-w-[240px]">
        <div>
          <label className="block uppercase tracking-wider mb-1.5 text-[9px] text-white/50 font-bold">Template</label>
          <div className="grid grid-cols-2 gap-1 bg-white/10 p-1 rounded-lg">
            <button
              onClick={() => handleTemplateChange("barcelona")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                selectedTemplate === "barcelona" ? "bg-white text-black" : "hover:bg-white/5 text-white/80"
              }`}
            >
              Barcelona
            </button>
            <button
              onClick={() => handleTemplateChange("classic")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                selectedTemplate === "classic" ? "bg-white text-black" : "hover:bg-white/5 text-white/80"
              }`}
            >
              Classic
            </button>
          </div>
        </div>

        <div>
          <label className="block uppercase tracking-wider mb-1.5 text-[9px] text-white/50 font-bold">Color Palette</label>
          <select
            value={activeSchemeId}
            onChange={(e) => setSelectedScheme(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white outline-none cursor-pointer"
          >
            {registryEntry.colorSchemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id} className="bg-neutral-900 text-white">
                {scheme.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[9px] text-white/40 border-t border-white/10 pt-2 leading-relaxed font-medium">
          Testing with standard demo data matching the Zod model. RSVP form runs in preview mode.
        </div>
      </div>

      {/* Main Template Frame */}
      <div className="flex-1">
        <TemplateComponent data={demoInvitationData} colorSchemeId={activeSchemeId} isPreview={true} />
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

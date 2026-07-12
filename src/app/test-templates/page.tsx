"use client";

import React, { useState } from "react";
import { templateRegistry } from "@/templates/registry";
import { demoInvitationData } from "@/templates/demo-data";

export default function TestTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<"barcelona" | "classic">("barcelona");
  const [selectedScheme, setSelectedScheme] = useState<string>("");

  const registryEntry = templateRegistry[selectedTemplate];
  const activeSchemeId = selectedScheme || registryEntry.colorSchemes[0].id;

  const TemplateComponent = registryEntry.component;

  // Handle template change
  const handleTemplateChange = (tempId: "barcelona" | "classic") => {
    setSelectedTemplate(tempId);
    setSelectedScheme(templateRegistry[tempId].colorSchemes[0].id);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Floating Control Bar */}
      <div className="fixed top-20 left-6 z-50 bg-black/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white shadow-2xl flex flex-col gap-4 text-xs font-semibold max-w-[240px]">
        <div>
          <label className="block uppercase tracking-wider mb-1 text-[10px] text-white/60">Template</label>
          <div className="grid grid-cols-2 gap-1 bg-white/10 p-1 rounded-lg">
            <button
              onClick={() => handleTemplateChange("barcelona")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedTemplate === "barcelona" ? "bg-white text-black" : "hover:bg-white/5"
              }`}
            >
              Barcelona
            </button>
            <button
              onClick={() => handleTemplateChange("classic")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedTemplate === "classic" ? "bg-white text-black" : "hover:bg-white/5"
              }`}
            >
              Classic
            </button>
          </div>
        </div>

        <div>
          <label className="block uppercase tracking-wider mb-1 text-[10px] text-white/60">Color Palette</label>
          <select
            value={activeSchemeId}
            onChange={(e) => setSelectedScheme(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white outline-none"
          >
            {registryEntry.colorSchemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id} className="bg-neutral-800 text-white">
                {scheme.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[10px] text-white/40 border-t border-white/10 pt-2 leading-relaxed">
          Testing with standard demo data matching the Zod model. RSVP form is running in demo mock mode.
        </div>
      </div>

      {/* Main Template Frame */}
      <div className="flex-1">
        <TemplateComponent data={demoInvitationData} colorSchemeId={activeSchemeId} isPreview={true} />
      </div>
    </div>
  );
}

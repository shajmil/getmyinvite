"use client";

import Image from "next/image";
import React from "react";
import { useWizardStore } from "@/lib/store";
import { templateRegistry } from "@/templates/registry";

interface StepTemplateStyleProps {
  onUpdateTemplate: (templateId: string, colorSchemeId: string) => void;
}

export function StepTemplateStyle({ onUpdateTemplate }: StepTemplateStyleProps) {
  const { invitationId, data } = useWizardStore();
  const currentTemplateId = useWizardStore((state) => {
    // We get this from the state wrapper since Zustand handles invitation metadata in the wizard parent
    return (state as any).templateId || "barcelona";
  });
  const currentColorSchemeId = useWizardStore((state) => {
    return (state as any).colorSchemeId || "gold-light";
  });

  const templates = Object.values(templateRegistry);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#eae6df] pb-4">
        <h2 className="text-xl font-serif font-bold text-[#1a1a1a]">Step 6 — Template & Style</h2>
        <p className="text-xs text-[#666]">Select a theme template and choose your color palette</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {templates.map((temp) => {
          const isSelected = temp.id === currentTemplateId;
          const activeSchemeId = isSelected ? currentColorSchemeId : temp.colorSchemes[0].id;

          return (
            <div
              key={temp.id}
              className={`bg-white border rounded-2xl p-5 transition-all shadow-sm flex flex-col md:flex-row gap-5 items-start ${
                isSelected ? "border-[#855f18] ring-1 ring-[#855f18]" : "border-[#eae6df] hover:border-[#855f18]/45"
              }`}
            >
              {/* Thumbnail Placeholder Icon */}
              <div className="w-full md:w-36 aspect-video bg-[#faf8f5] rounded-xl flex items-center justify-center border border-[#eae6df] relative overflow-hidden">
                {(temp.id === "aurelia" || temp.id === "eternal-journey") ? <Image src={temp.thumbnail} alt={`${temp.name} premium invitation`} fill sizes="(max-width: 768px) 90vw, 50vw" className="object-cover" /> : (<span className="font-serif italic font-bold text-2xl text-[#855f18]/60">{temp.name}</span>)}
              </div>

              {/* Template details and scheme choices */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">{temp.name} Theme</h3>
                  <p className="text-xs text-[#666] leading-relaxed mt-1">{temp.description}</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#777] mb-2">Available Color Palettes</label>
                  <div className="flex flex-wrap gap-2">
                    {temp.colorSchemes.map((scheme) => {
                      const isSchemeSelected = isSelected && scheme.id === currentColorSchemeId;
                      return (
                        <button
                          key={scheme.id}
                          onClick={() => onUpdateTemplate(temp.id, scheme.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                            isSchemeSelected
                              ? "border-[#855f18] bg-[#855f18]/5 text-[#855f18]"
                              : "border-[#eae6df] hover:bg-[#faf8f5] text-[#1a1a1a]"
                          }`}
                        >
                          {/* Dot showing primary color */}
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block"
                            style={{ backgroundColor: scheme.cssVars["--gold"] || scheme.cssVars["--accent-color"] || scheme.primary }}
                          />
                          {scheme.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!isSelected && (
                  <button
                    onClick={() => onUpdateTemplate(temp.id, temp.colorSchemes[0].id)}
                    className="px-4 py-2 border border-[#855f18] text-[#855f18] hover:bg-[#855f18] hover:text-white text-xs font-bold rounded transition-all"
                  >
                    Select Theme
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWizardStore } from "@/lib/store";
import { saveInvitationDraft, updateInvitationSettingsAction } from "@/app/actions";
import { templateRegistry } from "@/templates/registry";

// Steps Imports
import { StepCouple } from "./wizard-steps/StepCouple";
import { StepWedding } from "./wizard-steps/StepWedding";
import { StepEvents } from "./wizard-steps/StepEvents";
import { StepStoryGallery } from "./wizard-steps/StepStoryGallery";
import { StepRSVPExtras } from "./wizard-steps/StepRSVPExtras";
import { StepTemplateStyle } from "./wizard-steps/StepTemplateStyle";
import { StepPublish } from "./wizard-steps/StepPublish";

interface WizardEditorProps {
  invitation: {
    id: string;
    slug: string;
    templateId: string;
    colorSchemeId: string;
    status: "draft" | "published";
    content: any;
  };
}

interface IframePreviewProps {
  children: React.ReactNode;
}

function IframePreview({ children }: IframePreviewProps) {
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const mountNode = contentRef?.contentDocument?.body;

  useEffect(() => {
    if (!contentRef) return;
    const doc = contentRef.contentDocument;
    if (!doc) return;

    const setupIframe = () => {
      const doc = contentRef.contentDocument;
      if (!doc) return;

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

      // Document styles
      doc.documentElement.style.height = "100%";
      doc.body.style.margin = "0";
      doc.body.style.padding = "0";
      doc.body.style.height = "100%";
      doc.body.style.width = "100%";
      doc.body.style.overflowX = "hidden";

      setIframeLoaded(true);
    };

    if (doc.readyState === "complete" || doc.readyState === "interactive") {
      setupIframe();
    } else {
      contentRef.onload = setupIframe;
    }
  }, [contentRef]);

  return (
    <iframe
      ref={setContentRef}
      style={{ border: "none", width: "100%", height: "100%" }}
      title="preview-frame"
    >
      {iframeLoaded && mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}

export function WizardEditor({ invitation }: WizardEditorProps) {
  const router = useRouter();
  
  // Zustand Store Hooks
  const {
    invitationId,
    data,
    currentStep,
    templateId,
    colorSchemeId,
    slug,
    status,
    saveStatus,
    setInvitationId,
    setData,
    setTemplateId,
    setColorSchemeId,
    setSlug,
    setStatus,
    setCurrentStep,
    setSaveStatus,
  } = useWizardStore();

  const [mounted, setMounted] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  
  // Reference to track first hydration to avoid instant autosave on mount
  const isHydrated = useRef(false);

  // 1. Initialise Zustand store from database props
  useEffect(() => {
    setInvitationId(invitation.id);
    setData(invitation.content);
    setTemplateId(invitation.templateId);
    setColorSchemeId(invitation.colorSchemeId);
    setSlug(invitation.slug);
    setStatus(invitation.status);
    setMounted(true);
    
    // Set hydrated reference after initial load
    setTimeout(() => {
      isHydrated.current = true;
    }, 100);
  }, [invitation, setInvitationId, setData, setTemplateId, setColorSchemeId, setSlug, setStatus]);

  // 2. Debounced autosave effect
  useEffect(() => {
    if (!mounted || !isHydrated.current || !data) return;

    setSaveStatus("saving");

    const timer = setTimeout(async () => {
      try {
        const res = await saveInvitationDraft(invitationId, data);
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        setSaveStatus("error");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [data, invitationId, mounted, setSaveStatus]);

  if (!mounted || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#855f18] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Handle template selection updates (persists to DB instantly as it is metadata)
  const handleUpdateTemplate = async (newTempId: string, newSchemeId: string) => {
    setTemplateId(newTempId);
    setColorSchemeId(newSchemeId);
    try {
      setSaveStatus("saving");
      const res = await updateInvitationSettingsAction(invitationId, {
        templateId: newTempId,
        colorSchemeId: newSchemeId,
      });
      if (res.ok) {
        setSaveStatus("saved");
      }
    } catch (err) {
      setSaveStatus("error");
    }
  };

  const handlePublishSuccess = (publishedSlug: string) => {
    setSlug(publishedSlug);
    setStatus("published");
  };

  // Steps rendering mapping
  const stepsCount = 7;
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <StepCouple />;
      case 1:
        return <StepWedding />;
      case 2:
        return <StepEvents />;
      case 3:
        return <StepStoryGallery />;
      case 4:
        return <StepRSVPExtras />;
      case 5:
        return <StepTemplateStyle onUpdateTemplate={handleUpdateTemplate} />;
      case 6:
        return <StepPublish onPublishSuccess={handlePublishSuccess} />;
      default:
        return null;
    }
  };

  const stepTitles = ["Couple", "Details", "Events", "Story", "RSVP", "Template", "Publish"];

  const ActiveTemplateComponent = templateRegistry[templateId]?.component || templateRegistry.barcelona.component;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* ----------------- TOP NAVIGATION BAR ----------------- */}
      <header className="h-16 bg-white border-b border-[#eae6df] px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#666] hover:text-[#1a1a1a] flex items-center gap-1.5 transition-colors border border-[#eae6df] px-3 py-1.5 rounded-lg bg-[#faf8f5]"
          >
            ← Exit
          </Link>
          <span className="h-4 w-px bg-[#eae6df]" />
          <h1 className="text-md font-serif font-bold text-[#1a1a1a]">
            Invitation Builder
          </h1>
        </div>

        {/* Autosave Status Badge */}
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#855f18]">
              <span className="w-1.5 h-1.5 bg-[#855f18] rounded-full animate-ping" />
              Autosaving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-green-600 font-medium">✓ Draft Saved</span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-red-600 font-medium">✗ Save Failed</span>
          )}
        </div>
      </header>

      {/* Progress Tracker bar */}
      <div className="h-1 w-full bg-[#eae6df] flex-shrink-0">
        <div
          className="h-full bg-[#855f18] transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / stepsCount) * 100}%` }}
        />
      </div>

      {/* ----------------- CONTENT SPLIT LAYOUT ----------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Form Panel */}
        <div className="w-full md:w-1/2 flex flex-col h-full border-r border-[#eae6df] bg-[#faf8f5]">
          {/* Step Badges Navigation */}
          <div className="px-6 py-4 bg-white border-b border-[#eae6df] overflow-x-auto flex gap-1.5 scrollbar-none flex-shrink-0">
            {stepTitles.map((title, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                  currentStep === i
                    ? "bg-[#855f18] text-white"
                    : "bg-[#faf8f5] text-[#666] hover:bg-[#eae6df]/50"
                }`}
              >
                {i + 1}. {title}
              </button>
            ))}
          </div>

          {/* Form Scroll Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {renderStepContent()}
          </div>

          {/* Bottom Nav Actions Bar */}
          <div className="h-20 bg-white border-t border-[#eae6df] px-6 flex items-center justify-between flex-shrink-0">
            <button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-5 py-2.5 border border-[#eae6df] text-xs font-semibold rounded-lg hover:bg-[#faf8f5] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              Back
            </button>

            <button
              disabled={currentStep === stepsCount - 1}
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-5 py-2.5 bg-[#855f18] text-white text-xs font-semibold rounded-lg hover:bg-[#6c4c12] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              Next Step
            </button>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="hidden md:flex w-1/2 bg-[#efede8] flex-col items-center justify-center p-6 relative h-full">
          {/* Device and Preview Controls Bar */}
          <div className="absolute top-4 right-4 bg-white border border-[#eae6df] rounded-xl p-1 shadow-lg flex items-center gap-1 z-30">
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                previewDevice === "mobile" ? "bg-[#855f18] text-white" : "text-[#666] hover:bg-[#faf8f5]"
              }`}
            >
              Mobile
            </button>
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                previewDevice === "desktop" ? "bg-[#855f18] text-white" : "text-[#666] hover:bg-[#faf8f5]"
              }`}
            >
              Desktop
            </button>
          </div>

          {/* Preview Container Frame */}
          <div
            className={`transition-all duration-500 ease-in-out shadow-2xl relative bg-white border border-[#eae6df] overflow-hidden ${
              previewDevice === "mobile"
                ? "w-[375px] h-[768px] rounded-[36px] border-[12px] border-[#1a1a1a]"
                : "w-full h-full rounded-2xl"
            }`}
          >
            {/* The Actual Template Client Render */}
            <div className="w-full h-full relative">
              <IframePreview>
                <ActiveTemplateComponent data={data} colorSchemeId={colorSchemeId} isPreview={true} />
              </IframePreview>
            </div>

            {/* Mobile Notch overlay */}
            {previewDevice === "mobile" && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-5 bg-[#1a1a1a] rounded-b-2xl z-40 flex justify-center items-center">
                <span className="w-2.5 h-2.5 bg-black/80 rounded-full mr-2" />
                <span className="w-12 h-1 bg-white/20 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

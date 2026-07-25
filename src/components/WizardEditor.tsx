"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { saveInvitationDraft, updateInvitationSettingsAction } from "@/app/actions";
import { templateRegistry } from "@/templates/registry";

import { WeddingLoader } from "./WeddingLoader";

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
    privacy: "public" | "unlisted";
    content: any;
  };
}

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
    setPrivacy,
  } = useWizardStore();

  const [mounted, setMounted] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Reference to track first hydration to avoid instant unsaved state on mount
  const isHydrated = useRef(false);

  // 1. Initialise Zustand store from database props
  useEffect(() => {
    setInvitationId(invitation.id);
    setData(invitation.content);
    setTemplateId(invitation.templateId);
    setColorSchemeId(invitation.colorSchemeId);
    setSlug(invitation.slug);
    setStatus(invitation.status);
    setPrivacy(invitation.privacy || "public");
    setMounted(true);
    setHasUnsavedChanges(false);
    
    // Set hydrated reference after initial load
    setTimeout(() => {
      isHydrated.current = true;
    }, 200);
  }, [invitation, setInvitationId, setData, setTemplateId, setColorSchemeId, setSlug, setStatus, setPrivacy]);

  // Track data edits to flag unsaved changes (no automatic DB writes until user clicks Update Draft)
  useEffect(() => {
    if (!mounted || !isHydrated.current || !data) return;
    setHasUnsavedChanges(true);
    setSaveStatus("idle");
  }, [data, mounted, setSaveStatus]);

  const handleSaveDraft = async () => {
    if (!data) return;
    setSaveStatus("saving");

    try {
      const res = await saveInvitationDraft(invitationId, data);
      if (res.ok) {
        setSaveStatus("saved");
        setHasUnsavedChanges(false);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      setSaveStatus("error");
    }
  };

  const stepsCount = templateId === "barcelona" ? 7 : 5;

  // Safety check: ensure currentStep index is within bounds if steps array shrinks
  useEffect(() => {
    if (currentStep >= stepsCount) {
      setCurrentStep(stepsCount - 1);
    }
  }, [templateId, stepsCount, currentStep, setCurrentStep]);

  if (!mounted || !data) {
    return (
      <WeddingLoader
        message="Loading Your Wedding Editor"
        subMessage="Preparing your design tools &amp; love story..."
        fullScreen
      />
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

  // Dynamically define steps based on template selection
  // Barcelona needs: Couple, Details, Events, Gallery, RSVP, Template, Publish (7 steps)
  // Classic needs: Couple, Details, RSVP, Template, Publish (5 steps)
  const steps = [
    { id: "couple", title: "Couple", component: <StepCouple /> },
    { id: "details", title: "Details", component: <StepWedding /> },
    ...(templateId === "barcelona"
      ? [
          { id: "events", title: "Events", component: <StepEvents /> },
          { id: "gallery", title: "Gallery", component: <StepStoryGallery /> },
        ]
      : []),
    { id: "rsvp", title: "RSVP", component: <StepRSVPExtras /> },
    { id: "template", title: "Template", component: <StepTemplateStyle onUpdateTemplate={handleUpdateTemplate} /> },
    { id: "publish", title: "Publish", component: <StepPublish onPublishSuccess={handlePublishSuccess} /> },
  ];

  const renderStepContent = () => {
    return steps[currentStep]?.component || null;
  };

  const stepTitles = steps.map((s) => s.title);

  const ActiveTemplateComponent = templateRegistry[templateId]?.component || templateRegistry.barcelona.component;

  return (
    <div className="flex-1 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden">
      {/* ----------------- TOP NAVIGATION BAR ----------------- */}
      <header className="h-14 sm:h-16 bg-white border-b border-[#eae6df] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#666] hover:text-[#1a1a1a] flex items-center gap-1 transition-colors border border-[#eae6df] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#faf8f5]"
          >
            ← Exit
          </Link>
          <span className="h-4 w-px bg-[#eae6df]" />
          <h1 className="text-sm sm:text-md font-serif font-bold text-[#1a1a1a]">
            Invitation Builder
          </h1>
        </div>

        {/* Manual Save / Update Controls & Status Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {saveStatus === "saving" && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#855f18]">
              <span className="w-1.5 h-1.5 bg-[#855f18] rounded-full animate-ping" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && !hasUnsavedChanges && (
            <span className="text-xs text-green-600 font-medium">✓ Saved</span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-red-600 font-medium">✗ Failed</span>
          )}
          {hasUnsavedChanges && saveStatus !== "saving" && (
            <span className="text-xs text-amber-700 font-medium hidden sm:inline">Unsaved Changes</span>
          )}

          <button
            onClick={handleSaveDraft}
            disabled={saveStatus === "saving" || !hasUnsavedChanges}
            className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-bold transition-all ${
              hasUnsavedChanges
                ? "bg-[#855f18] text-white hover:bg-[#6c4c12] shadow-sm cursor-pointer"
                : "bg-[#eae6df] text-[#888] cursor-default"
            }`}
          >
            {saveStatus === "saving" ? "Saving..." : "Update Draft"}
          </button>
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
        <div className="w-full md:w-1/2 flex flex-col h-full min-h-0 border-r border-[#eae6df] bg-[#faf8f5] relative">
          {/* Step Badges Navigation */}
          <div className="px-4 sm:px-6 py-3 bg-white border-b border-[#eae6df] overflow-x-auto flex gap-1.5 scrollbar-none flex-shrink-0">
            {stepTitles.map((title, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                  currentStep === i
                    ? "bg-[#855f18] text-white shadow-sm"
                    : "bg-[#faf8f5] text-[#666] hover:bg-[#eae6df]/50"
                }`}
              >
                {i + 1}. {title}
              </button>
            ))}
          </div>

          {/* Form Scroll Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 pb-28">
            {renderStepContent()}
          </div>

          {/* Bottom Nav Actions Bar (Sticky & Safe Area Optimized for Safari Mobile) */}
          <div
            className="sticky bottom-0 inset-x-0 z-30 bg-white/98 backdrop-blur-md border-t border-[#eae6df] px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-[0_-4px_16px_rgba(0,0,0,0.12)] flex-shrink-0"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center gap-1 px-4 py-2.5 sm:px-5 sm:py-2.5 border-2 border-[#855f18]/30 text-[#855f18] text-xs font-extrabold rounded-xl bg-white hover:bg-[#855f18]/10 hover:border-[#855f18] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs"
            >
              <ChevronLeft className="w-4 h-4 text-[#855f18]" />
              Back
            </button>

            {/* Mobile Current Step Counter Pill */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-extrabold text-[#855f18] tracking-widest font-mono">
                Step {currentStep + 1} of {stepsCount}
              </span>
              <span className="text-xs font-serif font-bold text-[#1a1a1a] max-w-[120px] sm:max-w-none truncate">
                {steps[currentStep]?.title}
              </span>
            </div>

            <button
              disabled={currentStep === stepsCount - 1}
              onClick={() => {
                if (hasUnsavedChanges) handleSaveDraft();
                setCurrentStep(currentStep + 1);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 sm:px-6 sm:py-2.5 bg-gradient-to-r from-[#855f18] to-[#6c4c12] text-white text-xs font-extrabold rounded-xl hover:shadow-lg hover:shadow-[#855f18]/25 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md"
            >
              <span>{currentStep === stepsCount - 1 ? "Finish" : "Next Step"}</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div
          className={`hidden md:flex w-1/2 bg-[#efede8] flex-col p-6 relative h-[70vh] transition-all duration-300 ${
            previewDevice === "mobile" ? "items-center justify-center" : "items-stretch justify-stretch"
          }`}
        >
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
            className={`transition-all duration-500 ease-in-out shadow-2xl bg-white border border-[#eae6df] overflow-hidden relative ${
              previewDevice === "mobile"
                ? "w-[375px] h-[768px] rounded-[36px] border-[12px] border-[#1a1a1a] z-10"
                : "flex-1 w-full rounded-2xl z-10"
            }`}
          >
            {/* The Actual Template Client Render */}
            <div className="absolute inset-0 w-full h-full">
              <IframePreview key={previewDevice}>
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

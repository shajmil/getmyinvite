"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Edit3, Sparkles } from "lucide-react";
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
  activeTab?: string;
  fullScreen?: boolean;
}

function IframePreview({ children, activeTab, fullScreen }: IframePreviewProps) {
  const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  const setupIframe = useCallback(() => {
    if (!iframeRef) return;
    const doc = iframeRef.contentDocument;
    if (!doc || !doc.body) return;

    // Clear head to avoid duplicates
    doc.head.innerHTML = "";

    // Copy styles
    document.querySelectorAll("style, link[rel='stylesheet']").forEach((el) => {
      doc.head.appendChild(el.cloneNode(true));
    });

    // Viewport meta — lock to 375px mobile width
    const meta = doc.createElement("meta");
    meta.name = "viewport";
    meta.content = fullScreen ? "width=device-width, initial-scale=1.0" : "width=375, initial-scale=1.0";
    doc.head.appendChild(meta);

    // Base URL for relative paths
    const base = doc.createElement("base");
    base.href = window.location.origin;
    doc.head.appendChild(base);

    // Document styles
    doc.documentElement.style.minHeight = "100%";
    doc.body.style.margin = "0";
    doc.body.style.padding = "0";
    doc.body.style.minHeight = "100%";
    doc.body.style.width = fullScreen ? "100%" : "375px";
    doc.body.style.overflowX = "hidden";
    doc.body.style.overflowY = "auto";

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
  }, [iframeRef, fullScreen]);

  useEffect(() => {
    setupIframe();
  }, [setupIframe, activeTab]);

  return (
    <iframe
      ref={setIframeRef}
      onLoad={setupIframe}
      style={{ border: "none", width: fullScreen ? "100%" : "375px", height: fullScreen ? "100%" : "812px" }}
      title="preview-frame"
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}

/* ── Phone frame preview panel ── */
const PHONE_W = 375;
const PHONE_H = 812;
const BEZEL = 14;
const FRAME_W = PHONE_W + BEZEL * 2;
const FRAME_H = PHONE_H + BEZEL * 2;

interface PreviewPanelProps {
  mobileTab: "edit" | "preview";
  setMobileTab: (tab: "edit" | "preview") => void;
  children: React.ReactNode;
}

function PreviewPanel({ mobileTab, setMobileTab, children }: PreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Compute the scale that fits the phone frame inside the container with padding
      const pad = 32;
      const sx = (width - pad) / FRAME_W;
      const sy = (height - pad) / FRAME_H;
      setScale(Math.min(sx, sy, 1));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${
        mobileTab === "preview"
          ? "flex w-full h-[100dvh]"
          : "hidden md:flex md:w-1/2 h-full"
      } bg-[#efede8] flex-col items-center justify-center relative overflow-hidden transition-all duration-300`}
    >
      {/* Mobile: Floating Back to Edit Pill */}
      <div className="flex md:hidden absolute top-3 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={() => setMobileTab("edit")}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#855f18] bg-white/95 backdrop-blur-md rounded-full border border-[#855f18]/30 shadow-lg active:scale-95 transition-all"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>← Edit Form</span>
        </button>
      </div>

      {/* Desktop: Scaled Phone Frame */}
      <div className="hidden md:block" style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
        <div
          style={{ width: FRAME_W, height: FRAME_H, borderRadius: 48, border: `${BEZEL}px solid #1a1a1a`, position: "relative", overflow: "hidden", background: "#fff", boxShadow: "0 30px 70px -20px rgba(0,0,0,0.35), 0 4px 15px rgba(0,0,0,0.12)" }}
        >
          {/* Dynamic Island / Notch */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 126, height: 34, background: "#1a1a1a", borderRadius: "0 0 18px 18px", zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#0d0d0d" }} />
            <span style={{ width: 44, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
          </div>
          {/* Home Indicator */}
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", width: 134, height: 5, borderRadius: 3, background: "rgba(0,0,0,0.15)", zIndex: 40 }} />
          {/* Iframe Content */}
          <div style={{ position: "absolute", inset: 0, width: PHONE_W, height: PHONE_H }}>
            <IframePreview activeTab={mobileTab}>
              {children}
            </IframePreview>
          </div>
        </div>
      </div>

      {/* Mobile: Full-screen preview (no phone frame) */}
      <div className="flex md:hidden w-full h-full pt-12">
        <IframePreview activeTab={mobileTab} fullScreen>
          {children}
        </IframePreview>
      </div>
    </div>
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

  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  
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

  const hasStoryAndEvents = templateId === "barcelona" || templateId === "aurelia" || templateId === "eternal-journey";
  const stepsCount = hasStoryAndEvents ? 7 : 5;

  // Reference for step badge buttons to auto-scroll horizontal stepper bar into view
  const stepBadgeRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Automatically scroll active step badge into view on step change
  useEffect(() => {
    if (!mounted) return;
    const activeBadge = stepBadgeRefs.current[currentStep];
    if (activeBadge) {
      activeBadge.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentStep, mounted]);

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
    ...(hasStoryAndEvents
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
      <header className="h-14 sm:h-16 bg-white border-b border-[#eae6df] px-3 sm:px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#666] hover:text-[#1a1a1a] flex items-center gap-1 transition-colors border border-[#eae6df] px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#faf8f5]"
          >
            ← Exit
          </Link>
          <span className="h-4 w-px bg-[#eae6df] hidden xs:inline" />
          <h1 className="text-xs sm:text-md font-serif font-bold text-[#1a1a1a] hidden xs:block">
            Invitation Builder
          </h1>
        </div>

        {/* Mobile Segmented Mode Switcher: Edit vs Preview */}
        <div className="flex md:hidden bg-[#faf8f5] p-0.5 rounded-xl border border-[#eae6df]">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg flex items-center gap-1 transition-all ${
              mobileTab === "edit"
                ? "bg-[#855f18] text-white shadow-xs"
                : "text-[#666] hover:text-[#1a1a1a]"
            }`}
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg flex items-center gap-1 transition-all ${
              mobileTab === "preview"
                ? "bg-[#855f18] text-white shadow-xs"
                : "text-[#666] hover:text-[#1a1a1a]"
            }`}
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
        </div>

        {/* Manual Save / Update Controls & Status Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {saveStatus === "saving" && (
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#855f18]">
              <span className="w-1.5 h-1.5 bg-[#855f18] rounded-full animate-ping" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && !hasUnsavedChanges && (
            <span className="text-[11px] sm:text-xs text-green-600 font-medium">✓ Saved</span>
          )}
          {saveStatus === "error" && (
            <span className="text-[11px] sm:text-xs text-red-600 font-medium">✗ Failed</span>
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
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        
        {/* Left Form Panel */}
        <div
          className={`${
            mobileTab === "edit" ? "flex" : "hidden"
          } md:flex w-full md:w-1/2 flex-col h-full min-h-0 border-r border-[#eae6df] bg-[#faf8f5] relative`}
        >
          {/* Step Badges Navigation */}
          <div className="px-4 sm:px-6 py-3 bg-white border-b border-[#eae6df] overflow-x-auto flex gap-1.5 scrollbar-none flex-shrink-0">
            {stepTitles.map((title, i) => (
              <button
                key={i}
                ref={(el) => { stepBadgeRefs.current[i] = el; }}
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
          <div className="flex-1 min-h-0 overflow-y-auto h-[calc(100vh-140px)] max-h-[calc(100vh-140px)] p-4 sm:p-6 md:p-8 space-y-6 pb-36">
            {renderStepContent()}
          </div>

          {/* Floating Quick Live Preview FAB for Mobile (Visible on mobile edit mode) */}
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className="fixed bottom-20 right-4 z-40 md:hidden flex items-center gap-2 px-4 py-2.5 bg-[#855f18] text-white text-xs font-extrabold rounded-full shadow-2xl hover:bg-[#6c4c12] active:scale-95 transition-all border-2 border-white/40 shadow-[#855f18]/30"
          >
            <Eye className="w-4 h-4 text-white" />
            <span>Live Preview</span>
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          </button>

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

            {/* Next / Step Action Button */}
            {currentStep < stepsCount - 1 ? (
              <button
                onClick={() => {
                  if (hasUnsavedChanges) handleSaveDraft();
                  setCurrentStep(currentStep + 1);
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 sm:px-6 sm:py-2.5 bg-gradient-to-r from-[#855f18] to-[#6c4c12] text-white text-xs font-extrabold rounded-xl hover:shadow-lg hover:shadow-[#855f18]/25 active:scale-95 transition-all shadow-md"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            ) : (
              <div className="w-20 sm:w-24" />
            )}
          </div>
        </div>

        {/* Right Preview Panel — Always shows a standard mobile preview (375×812) */}
        <PreviewPanel mobileTab={mobileTab} setMobileTab={setMobileTab}>
          <ActiveTemplateComponent data={data} colorSchemeId={colorSchemeId} isPreview={true} />
        </PreviewPanel>

      </div>
    </div>
  );
}

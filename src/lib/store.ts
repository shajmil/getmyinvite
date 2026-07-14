import { create } from "zustand";
import { InvitationData } from "./zod-schemas";

interface WizardState {
  invitationId: string;
  data: InvitationData | null;
  templateId: string;
  colorSchemeId: string;
  slug: string;
  status: "draft" | "published";
  privacy: "public" | "unlisted";
  currentStep: number;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string | null;
  
  setInvitationId: (id: string) => void;
  setData: (newData: InvitationData) => void;
  setTemplateId: (id: string) => void;
  setColorSchemeId: (id: string) => void;
  setSlug: (slug: string) => void;
  setStatus: (status: "draft" | "published") => void;
  setPrivacy: (privacy: "public" | "unlisted") => void;
  updateData: (fields: Partial<InvitationData>) => void;
  updateNestedData: <K extends keyof InvitationData>(
    key: K,
    fields: Partial<InvitationData[K]>
  ) => void;
  setCurrentStep: (step: number) => void;
  setSaveStatus: (status: "idle" | "saving" | "saved" | "error") => void;
  setSaveError: (error: string | null) => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  invitationId: "",
  data: null,
  templateId: "barcelona",
  colorSchemeId: "gold-light",
  slug: "",
  status: "draft",
  privacy: "public",
  currentStep: 0, 
  saveStatus: "idle",
  saveError: null,

  setInvitationId: (id) => set({ invitationId: id }),
  setData: (newData) => set({ data: newData }),
  setTemplateId: (id) => set({ templateId: id }),
  setColorSchemeId: (id) => set({ colorSchemeId: id }),
  setSlug: (slug) => set({ slug }),
  setStatus: (status) => set({ status }),
  setPrivacy: (privacy) => set({ privacy }),
  updateData: (fields) =>
    set((state) => ({
      data: state.data ? { ...state.data, ...fields } : null,
    })),
  updateNestedData: (key, fields) =>
    set((state) => {
      if (!state.data) return {};
      const target = state.data[key];
      const targetObj = typeof target === "object" && target !== null ? target : {};
      return {
        data: {
          ...state.data,
          [key]: {
            ...targetObj,
            ...fields,
          },
        },
      };
    }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setSaveError: (error) => set({ saveError: error }),
}));

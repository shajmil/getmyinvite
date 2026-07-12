"use client";

import React, { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { uploadFile } from "@/lib/compress";

export function StepCouple() {
  const { data, updateNestedData, updateData } = useWizardStore();
  const [uploading, setUploading] = useState<"partner1" | "partner2" | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadingHero, setUploadingHero] = useState<boolean>(false);
  const [heroProgress, setHeroProgress] = useState(0);

  if (!data) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, partnerKey: "partner1" | "partner2") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(partnerKey);
    setProgress(0);

    try {
      const { url } = await uploadFile(file, (percent) => setProgress(percent));
      updateNestedData(partnerKey, { photo: url });
    } catch (err) {
      alert("Failed to upload partner photo. Please try again.");
      console.error(err);
    } finally {
      setUploading(null);
    }
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    setHeroProgress(0);

    try {
      const { url } = await uploadFile(file, (percent) => setHeroProgress(percent));
      updateNestedData("hero", { ...(data.hero || {}), mainPhoto: url });
    } catch (err) {
      alert("Failed to upload background image. Please try again.");
      console.error(err);
    } finally {
      setUploadingHero(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#eae6df] pb-4">
        <h2 className="text-xl font-serif font-bold text-[#1a1a1a]">Step 1 — The Couple</h2>
        <p className="text-xs text-[#666]">Enter the details and photos of the happy couple</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider mb-2">
          Couple Tagline (e.g. Save The Date)
        </label>
        <input
          type="text"
          value={data.coupleTagline || ""}
          onChange={(e) => updateData({ coupleTagline: e.target.value })}
          className="w-full px-4 py-2 border border-[#eae6df] rounded bg-white text-sm focus:outline-none focus:border-[#855f18]"
          placeholder="Our Wedding Celebration"
        />
      </div>

      {/* Grid for Partner 1 & 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Partner 1 (Bride) */}
        <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-[#855f18] border-b border-[#faf8f5] pb-2">First Partner</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">First Name</label>
              <input
                type="text"
                value={data.partner1.firstName}
                onChange={(e) => updateNestedData("partner1", { firstName: e.target.value })}
                className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                placeholder="Sophia"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Last Name</label>
              <input
                type="text"
                value={data.partner1.lastName}
                onChange={(e) => updateNestedData("partner1", { lastName: e.target.value })}
                className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                placeholder="John"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Parents Line (Optional)</label>
            <input
              type="text"
              value={data.partner1.parents || ""}
              onChange={(e) => updateNestedData("partner1", { parents: e.target.value })}
              className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
              placeholder="D/o Mr. & Mrs. John"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Photo Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, "partner1")}
              className="w-full text-xs text-[#777] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
            />
            {uploading === "partner1" && (
              <p className="text-[10px] text-[#855f18] mt-1">Uploading: {progress}%</p>
            )}
          </div>
        </div>

        {/* Partner 2 (Groom) */}
        <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-[#855f18] border-b border-[#faf8f5] pb-2">Second Partner</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">First Name</label>
              <input
                type="text"
                value={data.partner2.firstName}
                onChange={(e) => updateNestedData("partner2", { firstName: e.target.value })}
                className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                placeholder="Garyson"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Last Name</label>
              <input
                type="text"
                value={data.partner2.lastName}
                onChange={(e) => updateNestedData("partner2", { lastName: e.target.value })}
                className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                placeholder="George"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Parents Line (Optional)</label>
            <input
              type="text"
              value={data.partner2.parents || ""}
              onChange={(e) => updateNestedData("partner2", { parents: e.target.value })}
              className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
              placeholder="S/o Mr. & Mrs. George"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Photo Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, "partner2")}
              className="w-full text-xs text-[#777] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
            />
            {uploading === "partner2" && (
              <p className="text-[10px] text-[#855f18] mt-1">Uploading: {progress}%</p>
            )}
          </div>
        </div>
      </div>

      {/* Hero welcome screen customization */}
      <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="font-serif text-lg font-semibold text-[#855f18] border-b border-[#faf8f5] pb-2">Hero Cover Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Hero Background Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleHeroUpload}
              className="w-full text-xs text-[#777] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
            />
            {uploadingHero && (
              <p className="text-[10px] text-[#855f18] mt-1">Uploading: {heroProgress}%</p>
            )}
            {data.hero?.mainPhoto && (
              <p className="text-[10px] text-green-600 mt-1 font-medium">✓ Background image loaded</p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Hero Quote / Motto (Optional)</label>
            <input
              type="text"
              value={data.hero?.quote || ""}
              onChange={(e) => updateNestedData("hero", { ...(data.hero || {}), quote: e.target.value })}
              className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
              placeholder="Love is patient, love is kind..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

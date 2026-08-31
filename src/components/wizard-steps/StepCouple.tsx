"use client";

import React, { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { uploadFile } from "@/lib/compress";
import { ImageCropModal, AspectRatioType, CropShapeType } from "@/components/ImageCropModal";
import { Crop, Trash2, Loader2, ArrowLeftRight } from "lucide-react";

export function StepCouple() {
  const { data, updateNestedData, updateData, templateId } = useWizardStore();
  const [uploading, setUploading] = useState<"partner1" | "partner2" | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadingHero, setUploadingHero] = useState<boolean>(false);
  const [heroProgress, setHeroProgress] = useState(0);
  const [uploadingCard, setUploadingCard] = useState<boolean>(false);
  const [cardProgress, setCardProgress] = useState(0);

  // State for interactive Crop Modal
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    imageSrc: string;
    title: string;
    aspectRatio: AspectRatioType;
    cropShape?: CropShapeType;
    onCropComplete: (
      blob: Blob,
      dataUrl?: string,
      onProgress?: (pct: number) => void
    ) => Promise<void>;
  } | null>(null);

  if (!data) return null;

  const openCropperForFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    title: string,
    aspectRatio: AspectRatioType,
    cropShape: CropShapeType,
    onComplete: (
      blob: Blob,
      dataUrl?: string,
      onProgress?: (pct: number) => void
    ) => Promise<void>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setCropModal({
          isOpen: true,
          imageSrc: evt.target.result as string,
          title,
          aspectRatio,
          cropShape,
          onCropComplete: onComplete,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const openCropperForExisting = (
    url: string,
    title: string,
    aspectRatio: AspectRatioType,
    cropShape: CropShapeType,
    onComplete: (
      blob: Blob,
      dataUrl?: string,
      onProgress?: (pct: number) => void
    ) => Promise<void>
  ) => {
    setCropModal({
      isOpen: true,
      imageSrc: url,
      title,
      aspectRatio,
      cropShape,
      onCropComplete: onComplete,
    });
  };

  const handlePartnerUpload = (e: React.ChangeEvent<HTMLInputElement>, partnerKey: "partner1" | "partner2") => {
    const partnerName = partnerKey === "partner1" ? "First Partner" : "Second Partner";
    openCropperForFile(
      e,
      `Crop & Frame ${partnerName} Photo`,
      1,
      "circle",
      async (croppedBlob, _, onProgress) => {
        setUploading(partnerKey);
        setProgress(0);
        try {
          const { url } = await uploadFile(croppedBlob, (pct) => {
            setProgress(pct);
            if (onProgress) onProgress(pct);
          });
          updateNestedData(partnerKey, { photo: url });
        } catch (err) {
          alert(`Failed to upload ${partnerName} photo.`);
          console.error(err);
        } finally {
          setUploading(null);
          setCropModal(null);
        }
      }
    );
  };

  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    openCropperForFile(
      e,
      "Crop & Frame Hero Background Image",
      1.7777777777777777, // 16:9
      "rect",
      async (croppedBlob, _, onProgress) => {
        setUploadingHero(true);
        setHeroProgress(0);
        try {
          const { url } = await uploadFile(croppedBlob, (pct) => {
            setHeroProgress(pct);
            if (onProgress) onProgress(pct);
          });
          updateNestedData("hero", { ...(data.hero || {}), mainPhoto: url });
        } catch (err) {
          alert("Failed to upload background image.");
          console.error(err);
        } finally {
          setUploadingHero(false);
          setCropModal(null);
        }
      }
    );
  };

  const handleCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    openCropperForFile(
      e,
      "Crop & Frame Digital Invitation Card Image",
      0.75, // 3:4 portrait
      "rect",
      async (croppedBlob, _, onProgress) => {
        setUploadingCard(true);
        setCardProgress(0);
        try {
          const { url } = await uploadFile(croppedBlob, (pct) => {
            setCardProgress(pct);
            if (onProgress) onProgress(pct);
          });
          updateNestedData("hero", { ...(data.hero || {}), invitationCardUrl: url });
        } catch (err) {
          alert("Failed to upload invitation card.");
          console.error(err);
        } finally {
          setUploadingCard(false);
          setCropModal(null);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Active Crop Modal */}
      {cropModal?.isOpen && (
        <ImageCropModal
          isOpen={cropModal.isOpen}
          imageSrc={cropModal.imageSrc}
          title={cropModal.title}
          aspectRatio={cropModal.aspectRatio}
          cropShape={cropModal.cropShape}
          onCropComplete={cropModal.onCropComplete}
          onCancel={() => setCropModal(null)}
        />
      )}

      <div className="flex items-center justify-between border-b border-[#eae6df] pb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#1a1a1a]">Step 1 — The Couple</h2>
          <p className="text-xs text-[#666]">Enter the details, roles, and photos of the couple</p>
        </div>
        <button
          type="button"
          onClick={() => {
            updateData({
              partner1: data.partner2,
              partner2: data.partner1,
            });
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#855f18]/10 text-[#855f18] hover:bg-[#855f18]/20 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
          title="Swap Groom and Bride order"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Swap Partner Order</span>
        </button>
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
        {/* Partner 1 */}
        <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#faf8f5] pb-2">
            <h3 className="font-serif text-lg font-semibold text-[#855f18]">First Partner</h3>
            <span className="text-[10px] font-bold uppercase bg-[#855f18]/10 text-[#855f18] px-2 py-0.5 rounded">
              {data.partner1.roleTitle || "The Bride"}
            </span>
          </div>
          
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

          {/* Role / Title Selection */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Role / Title</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={
                  ["The Bride", "The Groom", "Bride", "Groom", "The Bride-to-be", "The Groom-to-be", "Host"].includes(data.partner1.roleTitle || "The Bride")
                    ? (data.partner1.roleTitle || "The Bride")
                    : "custom"
                }
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    updateNestedData("partner1", { roleTitle: e.target.value });
                  }
                }}
                className="px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18] bg-white"
              >
                <option value="The Bride">The Bride</option>
                <option value="The Groom">The Groom</option>
                <option value="Bride">Bride</option>
                <option value="Groom">Groom</option>
                <option value="The Bride-to-be">The Bride-to-be</option>
                <option value="The Groom-to-be">The Groom-to-be</option>
                <option value="Host">Host</option>
                <option value="custom">Custom Title...</option>
              </select>
              <input
                type="text"
                value={data.partner1.roleTitle !== undefined ? data.partner1.roleTitle : "The Bride"}
                onChange={(e) => updateNestedData("partner1", { roleTitle: e.target.value })}
                className="px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                placeholder="e.g. The Bride"
              />
            </div>
          </div>

          {/* Relationship Prefix */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Parent Relationship Prefix</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={
                  ["Daughter of", "Son of", "D/o", "S/o", "Granddaughter of", "Grandson of", "Niece of", "Nephew of", "Child of"].includes(data.partner1.relationPrefix || "Daughter of")
                    ? (data.partner1.relationPrefix || "Daughter of")
                    : "custom"
                }
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    updateNestedData("partner1", { relationPrefix: e.target.value });
                  }
                }}
                className="px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18] bg-white"
              >
                <option value="Daughter of">Daughter of</option>
                <option value="Son of">Son of</option>
                <option value="D/o">D/o</option>
                <option value="S/o">S/o</option>
                <option value="Granddaughter of">Granddaughter of</option>
                <option value="Grandson of">Grandson of</option>
                <option value="Niece of">Niece of</option>
                <option value="Nephew of">Nephew of</option>
                <option value="Child of">Child of</option>
                <option value="custom">Custom Prefix...</option>
              </select>
              <input
                type="text"
                value={data.partner1.relationPrefix !== undefined ? data.partner1.relationPrefix : "Daughter of"}
                onChange={(e) => updateNestedData("partner1", { relationPrefix: e.target.value })}
                className="px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                placeholder="e.g. Daughter of"
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
              placeholder="Mrs. Toncy Bosco & John Bosco Kuzhikkadan"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Photo Upload (Crop &amp; Set)</label>
            {data.partner1.photo ? (
              <div className="flex items-center gap-3 mb-2">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#eae6df] group">
                  <img src={data.partner1.photo} alt="Partner 1" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      openCropperForExisting(
                        data.partner1.photo!,
                        "Re-crop First Partner Photo",
                        1,
                        "circle",
                        async (croppedBlob) => {
                          setUploading("partner1");
                          try {
                            const { url } = await uploadFile(croppedBlob);
                            updateNestedData("partner1", { photo: url });
                          } finally {
                            setUploading("null" as any);
                            setUploading(null);
                            setCropModal(null);
                          }
                        }
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#855f18]/10 text-[#855f18] hover:bg-[#855f18]/20 text-[11px] font-semibold rounded transition-colors"
                  >
                    <Crop className="w-3 h-3" /> Crop / Re-frame
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to remove this photo?")) {
                        updateNestedData("partner1", { photo: "" });
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-semibold rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePartnerUpload(e, "partner1")}
                className="w-full text-xs text-[#777] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
              />
            )}
            {uploading === "partner1" && (
              <p className="text-[10px] text-[#855f18] mt-1">Uploading: {progress}%</p>
            )}
          </div>
        </div>

        {/* Partner 2 */}
        <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#faf8f5] pb-2">
            <h3 className="font-serif text-lg font-semibold text-[#855f18]">Second Partner</h3>
            <span className="text-[10px] font-bold uppercase bg-[#855f18]/10 text-[#855f18] px-2 py-0.5 rounded">
              {data.partner2.roleTitle || "The Groom"}
            </span>
          </div>
          
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

          {/* Role / Title Selection */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Role / Title</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={
                  ["The Bride", "The Groom", "Bride", "Groom", "The Bride-to-be", "The Groom-to-be", "Host"].includes(data.partner2.roleTitle || "The Groom")
                    ? (data.partner2.roleTitle || "The Groom")
                    : "custom"
                }
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    updateNestedData("partner2", { roleTitle: e.target.value });
                  }
                }}
                className="px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18] bg-white"
              >
                <option value="The Groom">The Groom</option>
                <option value="The Bride">The Bride</option>
                <option value="Groom">Groom</option>
                <option value="Bride">Bride</option>
                <option value="The Groom-to-be">The Groom-to-be</option>
                <option value="The Bride-to-be">The Bride-to-be</option>
                <option value="Host">Host</option>
                <option value="custom">Custom Title...</option>
              </select>
              <input
                type="text"
                value={data.partner2.roleTitle !== undefined ? data.partner2.roleTitle : "The Groom"}
                onChange={(e) => updateNestedData("partner2", { roleTitle: e.target.value })}
                className="px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                placeholder="e.g. The Groom"
              />
            </div>
          </div>

          {/* Relationship Prefix */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Parent Relationship Prefix</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={
                  ["Daughter of", "Son of", "D/o", "S/o", "Granddaughter of", "Grandson of", "Niece of", "Nephew of", "Child of"].includes(data.partner2.relationPrefix || "Son of")
                    ? (data.partner2.relationPrefix || "Son of")
                    : "custom"
                }
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    updateNestedData("partner2", { relationPrefix: e.target.value });
                  }
                }}
                className="px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18] bg-white"
              >
                <option value="Son of">Son of</option>
                <option value="Daughter of">Daughter of</option>
                <option value="S/o">S/o</option>
                <option value="D/o">D/o</option>
                <option value="Grandson of">Grandson of</option>
                <option value="Granddaughter of">Granddaughter of</option>
                <option value="Nephew of">Nephew of</option>
                <option value="Niece of">Niece of</option>
                <option value="Child of">Child of</option>
                <option value="custom">Custom Prefix...</option>
              </select>
              <input
                type="text"
                value={data.partner2.relationPrefix !== undefined ? data.partner2.relationPrefix : "Son of"}
                onChange={(e) => updateNestedData("partner2", { relationPrefix: e.target.value })}
                className="px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                placeholder="e.g. Son of"
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
              placeholder="Mrs. Latha George & Konnoth Antony George"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Photo Upload (Crop &amp; Set)</label>
            {data.partner2.photo ? (
              <div className="flex items-center gap-3 mb-2">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#eae6df] group">
                  <img src={data.partner2.photo} alt="Partner 2" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      openCropperForExisting(
                        data.partner2.photo!,
                        "Re-crop Second Partner Photo",
                        1,
                        "circle",
                        async (croppedBlob) => {
                          setUploading("partner2");
                          try {
                            const { url } = await uploadFile(croppedBlob);
                            updateNestedData("partner2", { photo: url });
                          } finally {
                            setUploading(null);
                            setCropModal(null);
                          }
                        }
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#855f18]/10 text-[#855f18] hover:bg-[#855f18]/20 text-[11px] font-semibold rounded transition-colors"
                  >
                    <Crop className="w-3 h-3" /> Crop / Re-frame
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to remove this photo?")) {
                        updateNestedData("partner2", { photo: "" });
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-semibold rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePartnerUpload(e, "partner2")}
                className="w-full text-xs text-[#777] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
              />
            )}
            {uploading === "partner2" && (
              <p className="text-[10px] text-[#855f18] mt-1">Uploading: {progress}%</p>
            )}
          </div>
        </div>
      </div>

      {/* Hero welcome screen customization */}
      <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="font-serif text-lg font-semibold text-[#855f18] border-b border-[#faf8f5] pb-2">Hero Cover &amp; Invitation Settings</h3>
        <div className={`grid grid-cols-1 ${templateId === "classic" ? "md:grid-cols-2" : ""} gap-4`}>
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Hero Background Image</label>
            {data.hero?.mainPhoto ? (
              <div className="space-y-2 mb-2">
                <div className="relative w-full h-28 rounded-lg overflow-hidden border border-[#eae6df] group">
                  <img src={data.hero.mainPhoto} alt="Hero background" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openCropperForExisting(
                        data.hero.mainPhoto!,
                        "Re-crop Hero Background Image",
                        1.7777777777777777,
                        "rect",
                        async (croppedBlob) => {
                          setUploadingHero(true);
                          try {
                            const { url } = await uploadFile(croppedBlob);
                            updateNestedData("hero", { ...(data.hero || {}), mainPhoto: url });
                          } finally {
                            setUploadingHero(false);
                            setCropModal(null);
                          }
                        }
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1 bg-[#855f18]/10 text-[#855f18] hover:bg-[#855f18]/20 text-xs font-semibold rounded transition-colors"
                  >
                    <Crop className="w-3.5 h-3.5" /> Crop / Re-frame
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to remove this background image?")) {
                        updateNestedData("hero", { ...(data.hero || {}), mainPhoto: "" });
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroUpload}
                className="w-full text-xs text-[#777] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
              />
            )}
            {uploadingHero && (
              <p className="text-[10px] text-[#855f18] mt-1">Uploading: {heroProgress}%</p>
            )}
          </div>

          {templateId === "classic" && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Digital Invitation Card Image (Kalyana Kuri)</label>
              {data.hero?.invitationCardUrl ? (
                <div className="space-y-2 mb-2">
                  <div className="relative w-24 h-28 rounded-lg overflow-hidden border border-[#eae6df]">
                    <img src={data.hero.invitationCardUrl} alt="Invitation card" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openCropperForExisting(
                          data.hero.invitationCardUrl!,
                          "Re-crop Digital Invitation Card",
                          0.75,
                          "rect",
                          async (croppedBlob) => {
                            setUploadingCard(true);
                            try {
                              const { url } = await uploadFile(croppedBlob);
                              updateNestedData("hero", { ...(data.hero || {}), invitationCardUrl: url });
                            } finally {
                              setUploadingCard(false);
                              setCropModal(null);
                            }
                          }
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#855f18]/10 text-[#855f18] hover:bg-[#855f18]/20 text-[11px] font-semibold rounded transition-colors"
                    >
                      <Crop className="w-3 h-3" /> Crop / Re-frame
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to remove this card image?")) {
                          updateNestedData("hero", { ...(data.hero || {}), invitationCardUrl: "" });
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-semibold rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCardUpload}
                  className="w-full text-xs text-[#777] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
                />
              )}
              {uploadingCard && (
                <p className="text-[10px] text-[#855f18] mt-1">Uploading: {cardProgress}%</p>
              )}
            </div>
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
  );
}


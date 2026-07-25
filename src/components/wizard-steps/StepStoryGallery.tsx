"use client";

import React, { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { uploadFile } from "@/lib/compress";
import { ImageCropModal, AspectRatioType } from "@/components/ImageCropModal";
import { Crop, Trash2 } from "lucide-react";

export function StepStoryGallery() {
  const { data, updateData, templateId } = useWizardStore();
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState(0);

  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    imageSrc: string;
    title: string;
    aspectRatio: AspectRatioType;
    onCropComplete: (blob: Blob) => Promise<void>;
  } | null>(null);

  if (!data) return null;

  const handleStoryTimelineAdd = () => {
    const timeline = data.story?.timeline || [];
    const newPoint = {
      id: `st-${Date.now()}`,
      date: "Spring 2023",
      title: "New Story Event",
      text: "Brief text explaining this milestone...",
      photo: "",
    };

    updateData({
      story: {
        ...data.story,
        timeline: [...timeline, newPoint],
      },
    });
  };

  const handleStoryTimelineUpdate = (id: string, fields: any) => {
    const timeline = data.story?.timeline || [];
    updateData({
      story: {
        ...data.story,
        timeline: timeline.map((pt) => (pt.id === id ? { ...pt, ...fields } : pt)),
      },
    });
  };

  const handleStoryTimelineRemove = (id: string) => {
    const timeline = data.story?.timeline || [];
    updateData({
      story: {
        ...data.story,
        timeline: timeline.filter((pt) => pt.id !== id),
      },
    });
  };

  // Gallery file upload trigger with Crop modal
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (data.gallery.length + files.length > 20) {
      alert("You can upload a maximum of 20 images in the gallery.");
      return;
    }

    const firstFile = files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setCropModal({
          isOpen: true,
          imageSrc: evt.target.result as string,
          title: "Crop Gallery Image",
          aspectRatio: "free", // free aspect ratio by default for gallery
          onCropComplete: async (croppedBlob) => {
            setUploadingGallery(true);
            setGalleryProgress(10);
            try {
              const { url } = await uploadFile(croppedBlob, (pct) => setGalleryProgress(pct));
              const uploadedImages = [
                ...data.gallery,
                {
                  url,
                  alt: `Gallery photo ${data.gallery.length + 1}`,
                  order: data.gallery.length + 1,
                },
              ];
              updateData({ gallery: uploadedImages });
            } catch (err) {
              alert("Failed to upload gallery image.");
              console.error(err);
            } finally {
              setUploadingGallery(false);
              setCropModal(null);
            }
          },
        });
      }
    };
    reader.readAsDataURL(firstFile);
    e.target.value = "";
  };

  const handleReCropGalleryImage = (index: number) => {
    const img = data.gallery[index];
    if (!img) return;

    setCropModal({
      isOpen: true,
      imageSrc: img.url,
      title: `Re-crop Gallery Photo #${index + 1}`,
      aspectRatio: "free",
      onCropComplete: async (croppedBlob) => {
        setUploadingGallery(true);
        try {
          const { url } = await uploadFile(croppedBlob);
          const updatedGallery = data.gallery.map((item, i) =>
            i === index ? { ...item, url } : item
          );
          updateData({ gallery: updatedGallery });
        } catch (err) {
          alert("Failed to re-crop image.");
          console.error(err);
        } finally {
          setUploadingGallery(false);
          setCropModal(null);
        }
      },
    });
  };

  const handleRemoveGalleryImage = (index: number) => {
    const newGallery = data.gallery
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, order: i + 1 }));
    updateData({ gallery: newGallery });
  };

  const isBarcelona = templateId === "barcelona";

  return (
    <div className="space-y-6">
      {/* Active Crop Modal */}
      {cropModal?.isOpen && (
        <ImageCropModal
          isOpen={cropModal.isOpen}
          imageSrc={cropModal.imageSrc}
          title={cropModal.title}
          aspectRatio={cropModal.aspectRatio}
          onCropComplete={cropModal.onCropComplete}
          onCancel={() => setCropModal(null)}
        />
      )}

      <div className="border-b border-[#eae6df] pb-4">
        <h2 className="text-xl font-serif font-bold text-[#1a1a1a]">
          {isBarcelona ? "Step 4 — Media Gallery" : "Step 4 — Story & Gallery"}
        </h2>
        <p className="text-xs text-[#666]">
          {isBarcelona 
            ? "Upload up to 20 gallery memories for your wedding template carousel" 
            : "Share how you met and upload up to 20 gallery memories"}
        </p>
      </div>

      {/* Love Story Details */}
      {!isBarcelona && templateId !== "classic" && (
        <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-[#faf8f5] pb-2">
            <h3 className="font-serif text-lg font-semibold text-[#855f18]">Love Story Timeline</h3>
            <button
              onClick={handleStoryTimelineAdd}
              className="px-2.5 py-1 border border-[#855f18] text-[#855f18] hover:bg-[#855f18]/10 text-xs font-semibold rounded"
            >
              + Add Milestone
            </button>
          </div>

          {(data.story?.timeline || []).length === 0 ? (
            <p className="text-xs text-[#777] italic text-center py-4">No story timeline milestones added.</p>
          ) : (
            <div className="space-y-4">
              {data.story?.timeline.map((point, idx) => (
                <div key={point.id} className="border border-[#faf8f5] p-3 rounded-lg bg-[#faf8f5]/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#855f18]">Milestone #{idx + 1}</span>
                    <button
                      onClick={() => handleStoryTimelineRemove(point.id)}
                      className="text-[10px] text-red-600 hover:underline font-bold"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={point.date}
                      onChange={(e) => handleStoryTimelineUpdate(point.id, { date: e.target.value })}
                      className="px-2 py-1 border border-[#eae6df] rounded text-xs focus:outline-none"
                      placeholder="Date (e.g. Sept 2021)"
                    />
                    <input
                      type="text"
                      value={point.title}
                      onChange={(e) => handleStoryTimelineUpdate(point.id, { title: e.target.value })}
                      className="col-span-2 px-2 py-1 border border-[#eae6df] rounded text-xs focus:outline-none"
                      placeholder="Title (e.g. How we met)"
                    />
                  </div>
                  <textarea
                    value={point.text}
                    onChange={(e) => handleStoryTimelineUpdate(point.id, { text: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1 border border-[#eae6df] rounded text-xs focus:outline-none"
                    placeholder="Tell your story..."
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media Gallery Grid */}
      <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="font-serif text-lg font-semibold text-[#855f18] border-b border-[#faf8f5] pb-2">Media Gallery</h3>
        
        <div>
          <label className="block text-[10px] font-bold uppercase text-[#777] mb-2">Upload Photo Assets (Interactive Crop)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleGalleryUpload}
            className="w-full text-xs text-[#777] file:mr-2 file:py-2 file:px-3.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
          />
          {uploadingGallery && (
            <p className="text-[10px] text-[#855f18] mt-1.5 font-bold">Uploading: {galleryProgress}%</p>
          )}
        </div>

        {data.gallery.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {data.gallery.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg border border-[#eae6df] overflow-hidden group shadow-sm">
                <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                
                {/* Red Remove Button — Always visible (top-right badge) for touch/mobile */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Are you sure you want to remove this gallery photo?")) {
                      handleRemoveGalleryImage(idx);
                    }
                  }}
                  title="Remove Photo"
                  aria-label="Remove photo"
                  className="absolute top-1.5 right-1.5 z-10 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 active:scale-90 transition-all flex items-center justify-center border border-white/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Crop / Re-frame Action Bar */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 flex justify-center items-center">
                  <button
                    type="button"
                    onClick={() => handleReCropGalleryImage(idx)}
                    className="w-full py-1 px-2 bg-[#d4af37] text-black text-[10px] font-bold rounded flex items-center justify-center gap-1 shadow hover:bg-[#c29f2f] active:scale-95 transition-all"
                  >
                    <Crop className="w-3 h-3" /> Crop / Re-frame
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


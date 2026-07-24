"use client";

import React, { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { uploadFile } from "@/lib/compress";

export function StepStoryGallery() {
  const { data, updateData, templateId } = useWizardStore();
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState(0);

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

  // Gallery file upload trigger
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (data.gallery.length + files.length > 20) {
      alert("You can upload a maximum of 20 images in the gallery.");
      return;
    }

    setUploadingGallery(true);
    setGalleryProgress(0);

    const uploadedImages = [...data.gallery];

    try {
      for (let i = 0; i < files.length; i++) {
        setGalleryProgress(Math.round((i / files.length) * 100));
        const { url } = await uploadFile(files[i]);
        uploadedImages.push({
          url,
          alt: `Gallery photo ${uploadedImages.length + 1}`,
          order: uploadedImages.length + 1,
        });
      }
      updateData({ gallery: uploadedImages });
    } catch (err) {
      alert("Failed to upload some gallery images. Please try again.");
      console.error(err);
    } finally {
      setUploadingGallery(false);
    }
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

      {/* Love Story Details - Hidden for templates that don't display a story timeline */}
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
          <label className="block text-[10px] font-bold uppercase text-[#777] mb-2">Upload Photo Assets (WebP Crop on client)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleGalleryUpload}
            className="w-full text-xs text-[#777] file:mr-2 file:py-2 file:px-3.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
          />
          {uploadingGallery && (
            <p className="text-[10px] text-[#855f18] mt-1.5 font-bold">Uploading: {galleryProgress}%</p>
          )}
        </div>

        {data.gallery.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
            {data.gallery.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg border border-[#eae6df] overflow-hidden group">
                <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to remove this gallery photo? (Press Update Draft to save changes)")) {
                      handleRemoveGalleryImage(idx);
                    }
                  }}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

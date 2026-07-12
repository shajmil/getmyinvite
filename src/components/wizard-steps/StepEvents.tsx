"use client";

import React, { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { uploadFile } from "@/lib/compress";

export function StepEvents() {
  const { data, updateData } = useWizardStore();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  if (!data) return null;

  const handleAddEvent = () => {
    const newEvent = {
      id: `evt-${Date.now()}`,
      name: "New Event",
      date: data.wedding.date,
      time: "18:00",
      venue: data.wedding.venue.name,
      dressCode: "",
      note: "",
      photo: "",
    };

    updateData({
      events: [...data.events, newEvent],
    });
  };

  const handleRemoveEvent = (id: string) => {
    updateData({
      events: data.events.filter((evt) => evt.id !== id),
    });
  };

  const handleUpdateEvent = (id: string, fields: any) => {
    updateData({
      events: data.events.map((evt) => (evt.id === id ? { ...evt, ...fields } : evt)),
    });
  };

  const handleMoveEvent = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.events.length) return;

    const list = [...data.events];
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;

    updateData({ events: list });
  };

  const handleEventPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(id);
    setProgress(0);

    try {
      const { url } = await uploadFile(file, (percent) => setProgress(percent));
      handleUpdateEvent(id, { photo: url });
    } catch (err) {
      alert("Failed to upload event photo. Please try again.");
      console.error(err);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#eae6df] pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#1a1a1a]">Step 3 — Events List</h2>
          <p className="text-xs text-[#666]">Add separate events like Sangeet, Ceremony, or Reception</p>
        </div>
        <button
          onClick={handleAddEvent}
          className="px-3 py-1.5 bg-[#855f18] text-white hover:bg-[#6c4c12] text-xs font-semibold rounded active:scale-95 transition-all"
        >
          + Add Event
        </button>
      </div>

      {data.events.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-[#eae6df] rounded-xl">
          <p className="text-sm text-[#777] mb-3">No custom events added yet.</p>
          <button
            onClick={handleAddEvent}
            className="px-4 py-2 border border-[#855f18] text-[#855f18] hover:bg-[#855f18]/10 text-xs font-semibold rounded transition-all"
          >
            Create First Event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.events.map((event, idx) => (
            <div key={event.id} className="bg-white border border-[#eae6df] rounded-xl p-5 shadow-sm space-y-4 relative">
              {/* Event Header Controls */}
              <div className="flex justify-between items-center border-b border-[#faf8f5] pb-2">
                <span className="font-serif text-md font-semibold text-[#855f18]">Event #{idx + 1}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveEvent(idx, "up")}
                    className="p-1 bg-[#faf8f5] border border-[#eae6df] rounded text-[10px] disabled:opacity-30 hover:bg-var(--bg-cream)"
                  >
                    ▲
                  </button>
                  <button
                    disabled={idx === data.events.length - 1}
                    onClick={() => handleMoveEvent(idx, "down")}
                    className="p-1 bg-[#faf8f5] border border-[#eae6df] rounded text-[10px] disabled:opacity-30 hover:bg-var(--bg-cream)"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => handleRemoveEvent(event.id)}
                    className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-[10px] font-semibold transition-all ml-2"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Event Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Event Name</label>
                  <input
                    type="text"
                    value={event.name}
                    onChange={(e) => handleUpdateEvent(event.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                    placeholder="Sangeet / Ceremony"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Venue Location Name</label>
                  <input
                    type="text"
                    value={event.venue}
                    onChange={(e) => handleUpdateEvent(event.id, { venue: e.target.value })}
                    className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                    placeholder="Grand Plaza / Church"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Event Time</label>
                  <input
                    type="text"
                    value={event.time}
                    onChange={(e) => handleUpdateEvent(event.id, { time: e.target.value })}
                    className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                    placeholder="6:00 PM - 8:30 PM"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Dress Code (Optional)</label>
                  <input
                    type="text"
                    value={event.dressCode || ""}
                    onChange={(e) => handleUpdateEvent(event.id, { dressCode: e.target.value })}
                    className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                    placeholder="Traditional / Elegant"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    value={event.note || ""}
                    onChange={(e) => handleUpdateEvent(event.id, { note: e.target.value })}
                    className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                    placeholder="Dinner is served at 7 PM"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Event Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleEventPhotoUpload(e, event.id)}
                    className="w-full text-xs text-[#777] file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
                  />
                  {uploadingId === event.id && (
                    <p className="text-[10px] text-[#855f18] mt-1">Uploading: {progress}%</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

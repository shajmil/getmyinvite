"use client";

import React, { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { uploadFile } from "@/lib/compress";
import { Trash2 } from "lucide-react";

export function StepWedding() {
  const { data, updateNestedData, setData } = useWizardStore();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!data) return null;

  const handleVenuePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const { url } = await uploadFile(file, (percent) => setProgress(percent));
      updateNestedData("wedding", {
        venue: {
          ...data.wedding.venue,
          photo: url,
        },
      });
    } catch (err) {
      alert("Failed to upload venue photo. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleVenueChange = (fields: any) => {
    updateNestedData("wedding", {
      venue: {
        ...data.wedding.venue,
        ...fields,
      },
    });
  };

  const timezones = [
    "Asia/Kolkata",
    "Europe/London",
    "America/New_York",
    "America/Los_Angeles",
    "Asia/Dubai",
    "Asia/Singapore",
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[#eae6df] pb-4">
        <h2 className="text-xl font-serif font-bold text-[#1a1a1a]">Step 2 — Date & Venue</h2>
        <p className="text-xs text-[#666]">Enter the date, time, and main location for your wedding</p>
      </div>

      <div className="bg-white border border-[#eae6df] rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
        <h3 className="font-serif text-lg font-semibold text-[#855f18] border-b border-[#faf8f5] pb-2">
          Date &amp; Time Settings
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777] mb-1">
              Wedding Date
            </label>
            <input
              type="date"
              value={data.wedding.date}
              onChange={(e) => updateNestedData("wedding", { date: e.target.value })}
              className="w-full px-2.5 py-2 border border-[#eae6df] rounded bg-white text-xs text-[#1a1a1a] focus:outline-none focus:border-[#855f18]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777] mb-1">
              Time (24h)
            </label>
            <input
              type="time"
              value={data.wedding.time}
              onChange={(e) => updateNestedData("wedding", { time: e.target.value })}
              className="w-full px-2.5 py-2 border border-[#eae6df] rounded bg-white text-xs text-[#1a1a1a] focus:outline-none focus:border-[#855f18]"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777] mb-1">
              Timezone
            </label>
            <select
              value={data.wedding.timezone}
              onChange={(e) => updateNestedData("wedding", { timezone: e.target.value })}
              className="w-full px-2.5 py-2 border border-[#eae6df] rounded bg-white text-xs text-[#1a1a1a] focus:outline-none focus:border-[#855f18]"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="font-serif text-lg font-semibold text-[#855f18] border-b border-[#faf8f5] pb-2">Venue Location</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Venue Name</label>
            <input
              type="text"
              value={data.wedding.venue.name}
              onChange={(e) => handleVenueChange({ name: e.target.value })}
              className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
              placeholder="Infant Jesus Church"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">City</label>
            <input
              type="text"
              value={data.wedding.venue.city}
              onChange={(e) => handleVenueChange({ city: e.target.value })}
              className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
              placeholder="Thrissur, Kerala"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Address</label>
          <input
            type="text"
            value={data.wedding.venue.address}
            onChange={(e) => handleVenueChange({ address: e.target.value })}
            className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
            placeholder="Church Road, High Street"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Google Maps link (URL)</label>
          <input
            type="url"
            value={data.wedding.venue.mapUrl || ""}
            onChange={(e) => handleVenueChange({ mapUrl: e.target.value })}
            className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
            placeholder="https://maps.app.goo.gl/..."
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Venue Cover Image</label>
          {data.wedding.venue.photo ? (
            <div className="relative w-full h-36 rounded-lg overflow-hidden border border-[#eae6df] group mb-2 shadow-xs">
              <img src={data.wedding.venue.photo} alt="Venue Cover" className="w-full h-full object-cover" />
              
              {/* Top-Right Always-Visible Remove Trash Button */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to remove this venue cover image?")) {
                    handleVenueChange({ photo: "" });
                  }
                }}
                className="absolute top-2.5 right-2.5 z-20 bg-red-600/90 hover:bg-red-700 text-white p-2 rounded-full active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 text-xs font-bold"
                title="Remove Venue Image"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Remove</span>
              </button>

              {/* Desktop Hover Dark Overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={handleVenuePhotoUpload}
              className="w-full text-xs text-[#777] file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
            />
          )}
          {uploading && <p className="text-[10px] text-[#855f18] mt-1">Uploading: {progress}%</p>}
        </div>
      </div>
    </div>
  );
}

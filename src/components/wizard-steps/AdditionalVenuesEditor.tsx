"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useWizardStore } from "@/lib/store";
import { uploadFile } from "@/lib/compress";
import type { AdditionalVenue } from "@/lib/zod-schemas";

export function AdditionalVenuesEditor() {
  const wedding = useWizardStore((state) => state.data?.wedding);
  const updateWedding = useWizardStore((state) => state.updateNestedData);
  const [uploadingVenueId, setUploadingVenueId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  if (!wedding) return null;
  const venues = wedding.additionalVenues ?? [];

  function updateVenue(id: string, fields: Partial<AdditionalVenue>) {
    const currentVenues = useWizardStore.getState().data?.wedding.additionalVenues ?? [];
    updateWedding("wedding", {
      additionalVenues: currentVenues.map((venue) => venue.id === id ? { ...venue, ...fields } : venue),
    });
  }

  async function uploadVenuePhoto(id: string, file: File) {
    setUploadingVenueId(id);
    setUploadError("");
    try {
      const { url } = await uploadFile(file);
      updateVenue(id, { photo: url });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Could not upload the venue photo. Please try again.");
    } finally {
      setUploadingVenueId(null);
    }
  }

  const inputClassName = "w-full min-w-0 rounded-lg border border-[#eae6df] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#855f18]";

  return (
    <section aria-label="Additional wedding venues" className="space-y-4 rounded-xl border border-[#eae6df] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#855f18]">Additional venues <span className="font-sans text-xs font-normal text-[#666]">(optional)</span></h3>
          <p className="mt-1 text-xs text-[#666]">Add a reception hall or another celebration location.</p>
        </div>
        <button
          type="button"
          onClick={() => updateWedding("wedding", {
            additionalVenues: [...venues, { id: crypto.randomUUID(), name: "", address: "", city: "", label: "", mapUrl: "", photo: "" }],
          })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#855f18] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6c4c12]"
        >
          <Plus aria-hidden="true" className="h-4 w-4" /> Add venue
        </button>
      </div>
      {venues.map((venue, index) => (
        <fieldset key={venue.id} className="min-w-0 space-y-3 rounded-xl border border-[#eae6df] p-3 sm:p-4">
          <legend className="px-1 text-sm font-semibold text-[#1a1a1a]">Additional venue {index + 1}</legend>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => updateWedding("wedding", { additionalVenues: venues.filter((entry) => entry.id !== venue.id) })}
              aria-label={`Remove additional venue ${index + 1}`}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-700 hover:bg-red-50"
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
          <label className="block space-y-1 text-xs text-[#666]">
            <span>Label (optional)</span>
            <input value={venue.label ?? ""} onChange={(event) => updateVenue(venue.id, { label: event.target.value })} placeholder="e.g. Reception" className={inputClassName} />
          </label>
          <label className="block space-y-1 text-xs text-[#666]">
            <span>Venue name</span>
            <input value={venue.name} onChange={(event) => updateVenue(venue.id, { name: event.target.value })} placeholder="e.g. Rose Garden Hall" className={inputClassName} />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs text-[#666]">
              <span>Address</span>
              <input value={venue.address} onChange={(event) => updateVenue(venue.id, { address: event.target.value })} className={inputClassName} />
            </label>
            <label className="block space-y-1 text-xs text-[#666]">
              <span>City</span>
              <input value={venue.city} onChange={(event) => updateVenue(venue.id, { city: event.target.value })} className={inputClassName} />
            </label>
          </div>
          <label className="block space-y-1 text-xs text-[#666]">
            <span>Google Maps link (optional)</span>
            <input type="url" value={venue.mapUrl ?? ""} onChange={(event) => updateVenue(venue.id, { mapUrl: event.target.value })} placeholder="https://maps.app.goo.gl/..." className={inputClassName} />
          </label>
          {venue.name.trim() && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue.name, venue.address, venue.city].filter(Boolean).join(", "))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-semibold text-[#855f18] underline"
            >Find this venue on Google Maps ↗</a>
          )}
          <label className="block space-y-1 text-xs text-[#666]">
            <span>Venue photo (optional)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploadingVenueId !== null}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadVenuePhoto(venue.id, file);
                event.target.value = "";
              }}
              className="block w-full min-w-0 text-xs text-[#666] disabled:opacity-50"
            />
          </label>
          {uploadingVenueId === venue.id && <p role="status" className="text-xs text-[#855f18]">Uploading photo…</p>}
          {venue.photo && <button type="button" onClick={() => updateVenue(venue.id, { photo: "" })} className="text-xs text-red-700 underline">Remove venue photo</button>}
        </fieldset>
      ))}
      {uploadError && <p role="alert" className="text-sm text-red-700">{uploadError}</p>}
    </section>
  );
}

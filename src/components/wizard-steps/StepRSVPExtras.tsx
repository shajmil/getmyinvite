"use client";

import React, { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { uploadFile } from "@/lib/compress";

export function StepRSVPExtras() {
  const { data, updateNestedData, updateData } = useWizardStore();
  const [newMeal, setNewMeal] = useState("");
  const [uploadingContactId, setUploadingContactId] = useState<string | null>(null);
  const [uploadingKeyGuestId, setUploadingKeyGuestId] = useState<string | null>(null);

  if (!data) return null;

  const handleRSVPToggle = (checked: boolean) => {
    updateNestedData("rsvpConfig", { enabled: checked });
  };

  const handleAddMeal = () => {
    if (!newMeal.trim()) return;
    const currentMeals = data.rsvpConfig.mealChoices || [];
    updateNestedData("rsvpConfig", {
      mealChoices: [...currentMeals, newMeal.trim()],
    });
    setNewMeal("");
  };

  const handleRemoveMeal = (mealToRemove: string) => {
    const currentMeals = data.rsvpConfig.mealChoices || [];
    updateNestedData("rsvpConfig", {
      mealChoices: currentMeals.filter((m) => m !== mealToRemove),
    });
  };

  const handleAddContact = () => {
    const contacts = data.extras.contactPersons || [];
    const newContact = {
      id: `c-${Date.now()}`,
      name: "",
      phone: "",
      role: "Host",
      photo: "",
    };

    updateNestedData("extras", {
      contactPersons: [...contacts, newContact],
    });
  };

  const handleUpdateContact = (id: string, fields: any) => {
    const contacts = data.extras.contactPersons || [];
    updateNestedData("extras", {
      contactPersons: contacts.map((c) => (c.id === id ? { ...c, ...fields } : c)),
    });
  };

  const handleRemoveContact = (id: string) => {
    const contacts = data.extras.contactPersons || [];
    updateNestedData("extras", {
      contactPersons: contacts.filter((c) => c.id !== id),
    });
  };

  const handleContactPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingContactId(id);

    try {
      const { url } = await uploadFile(file);
      handleUpdateContact(id, { photo: url });
    } catch (err) {
      alert("Failed to upload contact photo. Please try again.");
      console.error(err);
    } finally {
      setUploadingContactId(null);
    }
  };

  const handleAddKeyGuest = () => {
    const keyGuests = data.extras.keyGuests || [];
    const newGuest = {
      id: `kg-${Date.now()}`,
      name: "",
      relationship: "Special Guest",
      photo: "",
    };

    updateNestedData("extras", {
      keyGuests: [...keyGuests, newGuest],
    });
  };

  const handleUpdateKeyGuest = (id: string, fields: any) => {
    const keyGuests = data.extras.keyGuests || [];
    updateNestedData("extras", {
      keyGuests: keyGuests.map((g) => (g.id === id ? { ...g, ...fields } : g)),
    });
  };

  const handleRemoveKeyGuest = (id: string) => {
    const keyGuests = data.extras.keyGuests || [];
    updateNestedData("extras", {
      keyGuests: keyGuests.filter((g) => g.id !== id),
    });
  };

  const handleKeyGuestPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingKeyGuestId(id);

    try {
      const { url } = await uploadFile(file);
      handleUpdateKeyGuest(id, { photo: url });
    } catch (err) {
      alert("Failed to upload photo for special guest. Please try again.");
      console.error(err);
    } finally {
      setUploadingKeyGuestId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#eae6df] pb-4">
        <h2 className="text-xl font-serif font-bold text-[#1a1a1a]">Step 5 — RSVP & Extras</h2>
        <p className="text-xs text-[#666]">Configure guest RSVP forms, special guests, and family contact details</p>
      </div>

      {/* RSVP Toggles & Form Config */}
      <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#faf8f5] pb-2">
          <h3 className="font-serif text-lg font-semibold text-[#855f18]">RSVP Guest Settings</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data.rsvpConfig.enabled}
              onChange={(e) => handleRSVPToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-[#eae6df] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#ccc] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#855f18]"></div>
          </label>
        </div>

        {data.rsvpConfig.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Response Deadline</label>
                <input
                  type="date"
                  value={data.rsvpConfig.deadline || ""}
                  onChange={(e) => updateNestedData("rsvpConfig", { deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                />
              </div>
              <div className="flex items-center pt-5">
                <input
                  type="checkbox"
                  id="allowPlusOnes"
                  checked={data.rsvpConfig.allowPlusOnes}
                  onChange={(e) => updateNestedData("rsvpConfig", { allowPlusOnes: e.target.checked })}
                  className="mr-2 accent-[#855f18]"
                />
                <label htmlFor="allowPlusOnes" className="text-xs text-[#1a1a1a] font-semibold">
                  Allow Plus Ones / Additional Guests
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Meal Choices</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newMeal}
                  onChange={(e) => setNewMeal(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-[#eae6df] rounded text-xs focus:outline-none"
                  placeholder="Veg / Non-Veg"
                />
                <button
                  type="button"
                  onClick={handleAddMeal}
                  className="px-3 py-1.5 bg-[#855f18] text-white hover:bg-[#6c4c12] text-xs font-semibold rounded"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(data.rsvpConfig.mealChoices || []).map((meal) => (
                  <span
                    key={meal}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-var(--bg-cream) text-[#855f18] text-[10px] font-bold rounded-full"
                  >
                    {meal}
                    <button
                      type="button"
                      onClick={() => handleRemoveMeal(meal)}
                      className="text-red-600 hover:text-red-800 ml-1 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wedding Hashtag & Footer Message */}
      <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
        <h3 className="font-serif text-lg font-semibold text-[#855f18] border-b border-[#faf8f5] pb-2">Wedding Hashtag &amp; Extras</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Wedding Hashtag</label>
            <div className="flex items-center">
              <span className="px-2.5 py-2 bg-[#eae6df]/50 border border-r-0 border-[#eae6df] rounded-l text-xs text-[#777] font-semibold">#</span>
              <input
                type="text"
                value={data?.extras?.hashtag || ""}
                onChange={(e) => updateNestedData("extras", { hashtag: e.target.value.replace(/^#/, "") })}
                className="w-full px-3 py-2 border border-[#eae6df] rounded-r text-xs focus:outline-none focus:border-[#855f18]"
                placeholder={
                  data.partner1?.firstName && data.partner2?.firstName
                    ? `${data.partner1.firstName.replace(/[^a-zA-Z0-9]/g, "")}${data.partner2.firstName.replace(/[^a-zA-Z0-9]/g, "")}2026`
                    : "ArunMeera2026"
                }
              />
            </div>
            <p className="text-[10px] text-[#777] mt-1">Leave empty to automatically use Bride &amp; Groom names</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Footer Message</label>
            <input
              type="text"
              value={data?.extras?.footerMessage || ""}
              onChange={(e) => updateNestedData("extras", { footerMessage: e.target.value })}
              className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
              placeholder="Thank you for sharing in our happiness!"
            />
          </div>
        </div>
      </div>

      {/* Special / Key Guests List */}
      <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-[#faf8f5] pb-2">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#855f18]">Special Guests</h3>
            <p className="text-[11px] text-[#777]">VIP guests, bridesmaids, groomsmen, or family members to highlight</p>
          </div>
          <button
            onClick={handleAddKeyGuest}
            className="px-2.5 py-1 border border-[#855f18] text-[#855f18] hover:bg-[#855f18]/10 text-xs font-semibold rounded"
          >
            + Add Special Guest
          </button>
        </div>

        {(data.extras.keyGuests || []).length === 0 ? (
          <p className="text-xs text-[#777] italic text-center py-4">No special guests added.</p>
        ) : (
          <div className="space-y-4">
            {data.extras.keyGuests.map((guest) => (
              <div key={guest.id} className="border border-[#faf8f5] p-3 rounded-lg bg-[#faf8f5]/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#855f18]">{guest.relationship || "Special Guest"}</span>
                  <button
                    onClick={() => handleRemoveKeyGuest(guest.id)}
                    className="text-[10px] text-red-600 hover:underline font-bold"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={guest.name}
                    onChange={(e) => handleUpdateKeyGuest(guest.id, { name: e.target.value })}
                    className="px-2 py-1 border border-[#eae6df] rounded text-xs focus:outline-none"
                    placeholder="Guest Name (e.g. Thobias & Henna)"
                  />
                  <input
                    type="text"
                    value={guest.relationship || ""}
                    onChange={(e) => handleUpdateKeyGuest(guest.id, { relationship: e.target.value })}
                    className="px-2 py-1 border border-[#eae6df] rounded text-xs focus:outline-none"
                    placeholder="Title/Relation (e.g. Best Friend)"
                  />
                </div>
                <div className="pt-1">
                  {guest.photo ? (
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border border-[#eae6df] group mb-1">
                      <img src={guest.photo} alt={guest.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleUpdateKeyGuest(guest.id, { photo: "" })}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleKeyGuestPhotoUpload(e, guest.id)}
                      className="w-full text-xs text-[#777] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
                    />
                  )}
                  {uploadingKeyGuestId === guest.id && (
                    <p className="text-[10px] text-[#855f18] mt-1">Uploading photo...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contacts List */}
      <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-[#faf8f5] pb-2">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#855f18]">Contact Persons</h3>
            <p className="text-[11px] text-[#777]">Hosts and family members for event enquiries</p>
          </div>
          <button
            onClick={handleAddContact}
            className="px-2.5 py-1 border border-[#855f18] text-[#855f18] hover:bg-[#855f18]/10 text-xs font-semibold rounded"
          >
            + Add Contact
          </button>
        </div>

        {(data.extras.contactPersons || []).length === 0 ? (
          <p className="text-xs text-[#777] italic text-center py-4">No contact persons added.</p>
        ) : (
          <div className="space-y-4">
            {data.extras.contactPersons.map((contact) => (
              <div key={contact.id} className="border border-[#faf8f5] p-3 rounded-lg bg-[#faf8f5]/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#855f18]">{contact.role || "Contact"}</span>
                  <button
                    onClick={() => handleRemoveContact(contact.id)}
                    className="text-[10px] text-red-600 hover:underline font-bold"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => handleUpdateContact(contact.id, { name: e.target.value })}
                    className="px-2 py-1 border border-[#eae6df] rounded text-xs focus:outline-none"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={contact.role}
                    onChange={(e) => handleUpdateContact(contact.id, { role: e.target.value })}
                    className="px-2 py-1 border border-[#eae6df] rounded text-xs focus:outline-none"
                    placeholder="Role (e.g. Host)"
                  />
                  <input
                    type="text"
                    value={contact.phone}
                    onChange={(e) => handleUpdateContact(contact.id, { phone: e.target.value })}
                    className="px-2 py-1 border border-[#eae6df] rounded text-xs focus:outline-none"
                    placeholder="Phone"
                  />
                </div>
                <div className="pt-1">
                  {contact.photo ? (
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border border-[#eae6df] group mb-1">
                      <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleUpdateContact(contact.id, { photo: "" })}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleContactPhotoUpload(e, contact.id)}
                      className="w-full text-xs text-[#777] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
                    />
                  )}
                  {uploadingContactId === contact.id && (
                    <p className="text-[10px] text-[#855f18] mt-1">Uploading...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

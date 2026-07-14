"use client";

import React, { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { uploadFile } from "@/lib/compress";

export function StepRSVPExtras() {
  const { data, updateNestedData, updateData } = useWizardStore();
  const [newMeal, setNewMeal] = useState("");
  const [uploadingContactId, setUploadingContactId] = useState<string | null>(null);

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
      name: "New Contact",
      phone: "+91 96456 85457",
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

  return (
    <div className="space-y-6">
      <div className="border-b border-[#eae6df] pb-4">
        <h2 className="text-xl font-serif font-bold text-[#1a1a1a]">Step 5 — RSVP & Extras</h2>
        <p className="text-xs text-[#666]">Configure guest RSVP forms, hashtags, and family contact details</p>
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

      {/* Extras: Hashtags, Dress Codes, Gift Notes - Hidden as they are not rendered by the active templates */}
      {false && (
        <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-[#855f18] border-b border-[#faf8f5] pb-2">Event Extras</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Wedding Hashtag</label>
              <input
                type="text"
                value={data?.extras?.hashtag || ""}
                onChange={(e) => updateNestedData("extras", { hashtag: e.target.value })}
                className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                placeholder="ArunMeera2026"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Overall Dress Code</label>
              <input
                type="text"
                value={data?.extras?.dressCode || ""}
                onChange={(e) => updateNestedData("extras", { dressCode: e.target.value })}
                className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none focus:border-[#855f18]"
                placeholder="Formals / Traditional"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[#777] mb-1">Gift Note / Note on Registry</label>
            <input
              type="text"
              value={data?.extras?.giftNote || ""}
              onChange={(e) => updateNestedData("extras", { giftNote: e.target.value })}
              className="w-full px-3 py-2 border border-[#eae6df] rounded text-xs focus:outline-none"
              placeholder="Your presence is our present..."
            />
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div className="bg-white border border-[#eae6df] rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-[#faf8f5] pb-2">
          <h3 className="font-serif text-lg font-semibold text-[#855f18]">Contact Persons</h3>
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleContactPhotoUpload(e, contact.id)}
                    className="w-full text-xs text-[#777] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-[#855f18]/10 file:text-[#855f18] hover:file:bg-[#855f18]/20 file:cursor-pointer"
                  />
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

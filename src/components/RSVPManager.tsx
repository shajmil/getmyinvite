"use client";

import React, { useState } from "react";

interface Guest {
  id: string;
  guestName: string;
  email: string | null;
  phone: string | null;
  attending: "yes" | "no" | "maybe";
  guestCount: number;
  mealChoice: string | null;
  message: string | null;
  createdAt: string;
}

interface RSVPManagerProps {
  invitationId: string;
  initialGuests: Guest[];
}

export function RSVPManager({ invitationId, initialGuests }: RSVPManagerProps) {
  const [guests] = useState<Guest[]>(initialGuests);
  const [activeTab, setActiveTab] = useState<"all" | "yes" | "maybe" | "no">("all");

  // Summary Metrics calculations
  const totalSubmissions = guests.length;
  const attendingGuests = guests.filter((g) => g.attending === "yes");
  const maybeGuests = guests.filter((g) => g.attending === "maybe");
  const declinedGuests = guests.filter((g) => g.attending === "no");

  const totalAttendingCount = attendingGuests.reduce((acc, curr) => acc + curr.guestCount, 0);

  // Meal Choice Breakdown
  const mealBreakdown: Record<string, number> = {};
  attendingGuests.forEach((g) => {
    if (g.mealChoice) {
      mealBreakdown[g.mealChoice] = (mealBreakdown[g.mealChoice] || 0) + g.guestCount;
    }
  });

  const filteredGuests = guests.filter((g) => {
    if (activeTab === "all") return true;
    return g.attending === activeTab;
  });

  const handleExportCSV = () => {
    const headers = [
      "Guest Name",
      "Email",
      "Phone",
      "Attending",
      "Guest Count",
      "Meal Choice",
      "Message",
      "Submitted At",
    ];

    const rows = guests.map((g) => [
      g.guestName,
      g.email || "N/A",
      g.phone || "N/A",
      g.attending.toUpperCase(),
      g.guestCount,
      g.mealChoice || "None",
      g.message || "",
      new Date(g.createdAt).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join(
        "\n"
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wedding-rsvps-${invitationId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ----------------- SUMMARY ANALYTICS CARDS ----------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eae6df] rounded-xl p-5 shadow-sm text-center">
          <span className="text-2xl block mb-1">💌</span>
          <span className="text-xl font-bold text-[#1a1a1a]">{totalSubmissions}</span>
          <span className="text-[10px] text-[#777] uppercase tracking-wider block font-semibold mt-1">
            Responses
          </span>
        </div>

        <div className="bg-white border border-[#eae6df] rounded-xl p-5 shadow-sm text-center">
          <span className="text-2xl block mb-1">🎉</span>
          <span className="text-xl font-bold text-green-600">{totalAttendingCount}</span>
          <span className="text-[10px] text-[#777] uppercase tracking-wider block font-semibold mt-1">
            Attending (inc. Plus Ones)
          </span>
        </div>

        <div className="bg-white border border-[#eae6df] rounded-xl p-5 shadow-sm text-center">
          <span className="text-2xl block mb-1">🤔</span>
          <span className="text-xl font-bold text-amber-600">{maybeGuests.length}</span>
          <span className="text-[10px] text-[#777] uppercase tracking-wider block font-semibold mt-1">
            Maybe count
          </span>
        </div>

        <div className="bg-white border border-[#eae6df] rounded-xl p-5 shadow-sm text-center">
          <span className="text-2xl block mb-1">❌</span>
          <span className="text-xl font-bold text-red-600">{declinedGuests.length}</span>
          <span className="text-[10px] text-[#777] uppercase tracking-wider block font-semibold mt-1">
            Declined
          </span>
        </div>
      </div>

      {/* ----------------- MEAL PREFERENCE BREAKDOWN ----------------- */}
      {Object.keys(mealBreakdown).length > 0 && (
        <div className="bg-white border border-[#eae6df] rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-serif text-md font-bold text-[#855f18] border-b border-[#faf8f5] pb-2">
            Meal Preference Breakdown
          </h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(mealBreakdown).map(([choice, count]) => (
              <div key={choice} className="px-3.5 py-2 bg-[#faf8f5] border border-[#eae6df] rounded-lg text-xs">
                <span className="font-semibold text-[#1a1a1a]">{choice}:</span>{" "}
                <span className="font-bold text-[#855f18]">{count} guests</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- GUEST LIST TABLE ----------------- */}
      <div className="bg-white border border-[#eae6df] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#faf8f5] pb-4">
          {/* Tab selector */}
          <div className="flex gap-1.5 overflow-x-auto">
            {[
              { label: "All Responses", val: "all" },
              { label: "Attending", val: "yes" },
              { label: "Maybe", val: "maybe" },
              { label: "Declined", val: "no" },
            ].map((tab) => (
              <button
                key={tab.val}
                onClick={() => setActiveTab(tab.val as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.val
                    ? "bg-[#855f18] text-white"
                    : "bg-[#faf8f5] text-[#666] hover:bg-[#eae6df]/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-[#855f18] text-[#855f18] hover:bg-[#855f18] hover:text-white text-xs font-bold rounded-lg transition-all"
          >
            Export to CSV
          </button>
        </div>

        {filteredGuests.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#777] italic">No guests matches this category filter.</div>
        ) : (
          <div className="overflow-x-auto border border-[#eae6df] rounded-lg">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#faf8f5] border-b border-[#eae6df] font-bold text-[#1a1a1a]">
                  <th className="p-3">Guest Name</th>
                  <th className="p-3">Attending</th>
                  <th className="p-3">Total Attending</th>
                  <th className="p-3">Meal Preference</th>
                  <th className="p-3">Phone / Email</th>
                  <th className="p-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="border-b border-[#eae6df] hover:bg-[#faf8f5]/60">
                    <td className="p-3 font-semibold text-[#1a1a1a]">{guest.guestName}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          guest.attending === "yes"
                            ? "bg-green-50 text-green-700"
                            : guest.attending === "maybe"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {guest.attending}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{guest.attending === "no" ? 0 : guest.guestCount}</td>
                    <td className="p-3 text-[#777]">{guest.mealChoice || "None"}</td>
                    <td className="p-3 space-y-0.5">
                      {guest.phone && <div className="text-gray-500">📞 {guest.phone}</div>}
                      {guest.email && <div className="text-gray-500">✉ {guest.email}</div>}
                      {!guest.phone && !guest.email && <span className="text-gray-400 italic">Not provided</span>}
                    </td>
                    <td className="p-3 text-[#555] italic max-w-xs truncate" title={guest.message || ""}>
                      {guest.message || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

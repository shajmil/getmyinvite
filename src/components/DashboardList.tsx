"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { createNewInvitationAction, deleteInvitationAction } from "@/app/actions";

interface InvitationListItem {
  id: string;
  slug: string;
  templateId: string;
  status: "draft" | "published";
  colorSchemeId: string;
  publishedAt: string | null;
  rsvpCount: number;
  partner1Name: string;
  partner2Name: string;
}

interface DashboardListProps {
  initialInvitations: InvitationListItem[];
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function DashboardList({ initialInvitations, user }: DashboardListProps) {
  const router = useRouter();
  const [invitations, setInvitations] = useState<InvitationListItem[]>(initialInvitations);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  const handleCreate = async (templateId: string) => {
    setCreating(true);
    try {
      const res = await createNewInvitationAction(templateId);
      if (res.ok && res.id) {
        router.push(`/dashboard/invitations/${res.id}/edit`);
      } else {
        alert(res.error || "Failed to create invitation draft.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setCreating(false);
      setShowCreateModal(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invitation? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteInvitationAction(id);
      if (res.ok) {
        setInvitations(invitations.filter((inv) => inv.id !== id));
      } else {
        alert(res.error || "Failed to delete invitation");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="h-16 bg-white border-b border-[#eae6df] px-6 flex items-center justify-between shadow-sm">
        <Link href="/" className="font-serif text-2xl font-bold text-[#1a1a1a] hover:opacity-85">
          GetMyInvite
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right text-xs">
            <span className="font-semibold text-[#1a1a1a]">{user.name}</span>
            <span className="text-gray-400">{user.email}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="px-3.5 py-1.5 border border-[#eae6df] hover:bg-[#faf8f5] text-xs font-semibold rounded-lg active:scale-95 transition-all text-[#666]"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Dashboard Space */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl w-full mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#1a1a1a]">My Invitations</h2>
            <p className="text-xs text-[#666]">Manage and build your wedding invitation websites</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#855f18] text-white hover:bg-[#6c4c12] text-xs font-bold rounded-lg uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            + Create Invite
          </button>
        </div>

        {/* Invitations Grid */}
        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-[#eae6df] rounded-2xl p-6 text-center">
            <span className="text-4xl mb-4">🕊️</span>
            <h3 className="font-serif text-xl font-bold text-[#1a1a1a] mb-2">No Invitations Yet</h3>
            <p className="text-sm text-[#666] max-w-xs mb-6">
              Create your first premium wedding invitation website in seconds. Choose a template, enter details, and share.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-[#855f18] text-white hover:bg-[#6c4c12] text-xs font-bold rounded-lg uppercase tracking-wider transition-all"
            >
              Start Creating
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="bg-white border border-[#eae6df] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300"
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-[#faf8f5] pb-2">
                    <span className="font-serif text-lg font-bold text-[#1a1a1a] truncate max-w-[70%]">
                      {inv.partner1Name} &amp; {inv.partner2Name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.status === "published"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-gray-50 text-gray-500 border border-gray-200"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#666]">
                    <div>
                      <span className="font-semibold text-neutral-800">Link URL: </span>
                      {inv.status === "published" ? (
                        <a
                          href={`/${inv.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#855f18] hover:underline"
                        >
                          makemyinvite.app/{inv.slug}
                        </a>
                      ) : (
                        <span>makemyinvite.app/{inv.slug} (draft)</span>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-800">Theme: </span>
                      <span className="capitalize">{inv.templateId}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-800">Total RSVPs: </span>
                      <span className="font-bold text-[#855f18]">{inv.rsvpCount}</span>
                    </div>
                  </div>
                </div>

                {/* Dashboard Card Actions */}
                <div className="bg-[#faf8f5] border-t border-[#eae6df] p-4 grid grid-cols-3 gap-2">
                  <Link
                    href={`/dashboard/invitations/${inv.id}/edit`}
                    className="py-2 border border-[#eae6df] bg-white text-center hover:bg-[#faf8f5] text-xs font-semibold rounded active:scale-95 transition-all text-[#1a1a1a]"
                  >
                    Edit Draft
                  </Link>
                  <Link
                    href={`/dashboard/invitations/${inv.id}/rsvps`}
                    className="py-2 border border-[#eae6df] bg-white text-center hover:bg-[#faf8f5] text-xs font-semibold rounded active:scale-95 transition-all text-[#1a1a1a]"
                  >
                    RSVPs
                  </Link>
                  <button
                    disabled={deletingId === inv.id}
                    onClick={() => handleDelete(inv.id)}
                    className="py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded active:scale-95 transition-all disabled:opacity-50"
                  >
                    {deletingId === inv.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ----------------- CREATE INVITATION MODAL ----------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-[#eae6df] rounded-2xl p-6 max-w-lg w-full shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black font-sans text-sm font-bold"
              disabled={creating}
            >
              ✕
            </button>

            <div className="text-center">
              <h3 className="font-serif text-2xl font-bold text-[#1a1a1a] mb-1">Pick a Starting Template</h3>
              <p className="text-xs text-[#666]">You can switch templates and styles at any time inside the builder</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Barcelona Selection Card */}
              <div className="border border-[#eae6df] hover:border-[#855f18] rounded-xl p-4 flex flex-col justify-between bg-white text-center gap-4">
                <div>
                  <h4 className="font-serif text-lg font-bold text-[#1a1a1a]">Barcelona</h4>
                  <p className="text-[10px] text-[#777] mt-1 leading-relaxed">
                    Parallax layout, animations, clean story timeline, image carousel.
                  </p>
                </div>
                <button
                  onClick={() => handleCreate("barcelona")}
                  disabled={creating}
                  className="w-full py-2 bg-[#855f18] text-white hover:bg-[#6c4c12] text-xs font-bold rounded uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  Choose Barcelona
                </button>
              </div>

              {/* Classic Selection Card */}
              <div className="border border-[#eae6df] hover:border-[#855f18] rounded-xl p-4 flex flex-col justify-between bg-white text-center gap-4">
                <div>
                  <h4 className="font-serif text-lg font-bold text-[#1a1a1a]">Classic</h4>
                  <p className="text-[10px] text-[#777] mt-1 leading-relaxed">
                    Immersive overlay modals, loops, custom backgrounds, audio backing.
                  </p>
                </div>
                <button
                  onClick={() => handleCreate("classic")}
                  disabled={creating}
                  className="w-full py-2 bg-[#855f18] text-white hover:bg-[#6c4c12] text-xs font-bold rounded uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  Choose Classic
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

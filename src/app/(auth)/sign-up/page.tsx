"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: callbackUrl,
      });

      if (res.error) {
        setError(res.error.message || "Failed to create account");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#faf8f5] px-4">
      <div className="w-full max-w-md bg-white border border-[#eae6df] rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-3xl font-serif text-[#1a1a1a] mb-2 hover:opacity-80">
            GetMyInvite
          </Link>
          <p className="text-sm text-[#666]">Create your free account to get started</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#faf8f5] border border-[#eae6df] rounded-xl text-sm focus:outline-none focus:border-[#855f18] transition-colors"
              placeholder="Arun Kumar"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#faf8f5] border border-[#eae6df] rounded-xl text-sm focus:outline-none focus:border-[#855f18] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#faf8f5] border border-[#eae6df] rounded-xl text-sm focus:outline-none focus:border-[#855f18] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#855f18] text-white rounded-xl text-sm font-semibold hover:bg-[#6c4c12] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>



        <p className="mt-8 text-center text-sm text-[#666]">
          Already have an account?{" "}
          <Link href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-[#855f18] hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="animate-spin w-8 h-8 border-4 border-[#855f18] border-t-transparent rounded-full" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}


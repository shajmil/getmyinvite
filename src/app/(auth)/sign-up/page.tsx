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

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#eae6df]"></span>
          </div>
          <span className="relative bg-white px-3 text-xs text-[#999] uppercase tracking-wider">or</span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3 border border-[#eae6df] hover:bg-[#faf8f5] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-[#1a1a1a]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.9 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.75 2.9C6.15 7.5 8.85 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.25c0-.82-.07-1.6-.2-2.35H12v4.5h6.48c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.7-4.95 3.7-8.6z"
            />
            <path
              fill="#FBBC05"
              d="M5.25 14.5c-.25-.75-.4-1.55-.4-2.5s.15-1.75.4-2.5L1.5 6.6C.55 8.5 0 10.7 0 13c0 2.3.55 4.5 1.5 6.4l3.75-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.15 0-5.85-2.46-6.75-5.36L1.5 15.86C3.4 19.7 7.35 23 12 23z"
            />
          </svg>
          Sign up with Google
        </button>

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


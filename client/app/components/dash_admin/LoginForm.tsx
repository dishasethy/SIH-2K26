"use client";

import { signIn } from "next-auth/react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Mail, Lock, ArrowRight, AlertTriangle } from "lucide-react";

interface AdminLoginFormProps {
  callbackUrl: string;
}

export default function AdminLoginForm({ callbackUrl }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_ADMIN_USER || "");
  const [password, setPassword] = useState(process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const submitHoverTl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    submitHoverTl.current = gsap.timeline({ paused: true })
      .to(submitBtnRef.current, { scale: 1.02, duration: 0.2, ease: "power1.out" })
      .to(submitBtnRef.current, { boxShadow: "0 0 15px rgba(16, 185, 129, 0.4)", duration: 0.2 }, 0);
  }, { scope: containerRef });

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid admin credential key or password.");
        setIsLoading(false);
        // Shake button on error
        gsap.fromTo(
          submitBtnRef.current,
          { x: -6 },
          { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" }
        );
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      console.error("Admin login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCredentialsSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Admin Credential Key
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <Mail className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. 9078"
              className="w-full rounded-xl neu-sunken py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Admin Secure Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <Lock className="h-4.5 w-4.5" />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="••••••••"
              className="w-full rounded-xl neu-sunken py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          submit-btn=""
          ref={submitBtnRef}
          type="submit"
          disabled={isLoading}
          onMouseEnter={() => submitHoverTl.current?.play()}
          onMouseLeave={() => submitHoverTl.current?.reverse()}
          className="flex w-full items-center justify-center gap-2 rounded-xl neu-green-flat py-3.5 text-sm font-bold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <span>Verify Admin Status</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

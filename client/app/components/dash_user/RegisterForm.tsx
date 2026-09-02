"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  User,
  Phone,
} from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();
  
  // Registration Mode: email registration or phone registration
  const [mode, setMode] = useState<"email" | "phone">("email");
  
  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // UI States
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // GSAP Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  
  const submitHoverTl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    submitHoverTl.current = gsap.timeline({ paused: true })
      .to(submitBtnRef.current, { scale: 1.02, duration: 0.2, ease: "power1.out" })
      .to(submitBtnRef.current, { boxShadow: "0 0 15px rgba(16, 185, 129, 0.4)", duration: 0.2 }, 0);

  }, { scope: containerRef, dependencies: [mode] });

  // Handle switching tabs
  const handleModeChange = (newMode: "email" | "phone") => {
    setMode(newMode);
    setError("");
    setSuccessMsg("");
  };

  // Submit email registration without a verification step.
  const handleEmailRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setSuccessMsg("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push(`/login?registered=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      // Shake submit button on error
      if (submitBtnRef.current) {
        gsap.fromTo(
          submitBtnRef.current,
          { x: -6 },
          { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Submit phone registration without a verification step.
  const handlePhoneRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!name || !phone || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/register/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Phone registration failed.");
      }

      setSuccessMsg("Phone registration successful! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
      if (submitBtnRef.current) {
        gsap.fromTo(
          submitBtnRef.current,
          { x: -6 },
          { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" }
        );
      }
    } finally {
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

      {/* Success Alert */}
      {successMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Mode Selection Tabs (Only show if not in email verification step) */}
      {(
        <div className="flex rounded-xl neu-tabs mb-6">
          <button
            type="button"
            onClick={() => handleModeChange("email")}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              mode === "email"
                ? "neu-tab-active text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Email signup
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("phone")}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              mode === "phone"
                ? "neu-tab-active text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Phone signup
          </button>
        </div>
      )}

      {/* EMAIL SIGNUP FLOW */}
      {mode === "email" && (
        <>
            <form onSubmit={handleEmailRegisterSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    placeholder="John Doe"
                    className="w-full rounded-xl neu-sunken py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Agency Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    placeholder="email@agency.gov"
                    className="w-full rounded-xl neu-sunken py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Secure Password
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
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
        </>
      )}

      {/* PHONE SIGNUP FLOW */}
      {mode === "phone" && (
        <form onSubmit={handlePhoneRegisterSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <User className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                placeholder="Jane Doe"
                className="w-full rounded-xl neu-sunken py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Phone Number
            </label>
            <div className="relative flex gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Phone className="h-4.5 w-4.5" />
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  placeholder="+1234567890"
                  className="w-full rounded-xl neu-sunken py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition-all focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Secure Password
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
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

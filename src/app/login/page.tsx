"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Factory,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  KeyRound,
  UserCheck,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to log in.");
      }

      setSuccess(
        `Welcome back, ${data.user.name}! Redirecting to Production ERP...`,
      );
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 800);
    } catch (err: any) {
      setError(
        err.message || "Invalid credentials. Please contact Super Admin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 text-slate-900 font-sans p-4 relative overflow-hidden">
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-3.5">
        {/* Branding Logo */}
        <div className="flex flex-col items-center text-center space-y-1.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 shadow-lg shadow-indigo-600/25 ring-4 ring-indigo-500/10">
            <Factory className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
              Production{" "}
              <span className="rounded-md bg-gradient-to-r from-indigo-500 to-sky-500 text-white px-1.5 py-0.5 text-[10px] font-bold shadow-xs">
                ERP
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Garments Planning & Floor MIS
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border border-slate-200/90 bg-white/95 shadow-xl shadow-slate-200/60 rounded-2xl overflow-hidden backdrop-blur-md">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-gradient-to-b from-slate-50/60 to-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-indigo-600" />
                  Sign In to System
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-500 mt-0.5">
                  Authorized personnel access only
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] border-emerald-200 bg-emerald-50 text-emerald-700 gap-1 font-mono font-bold px-1.5 py-0.5"
              >
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" />
                SECURE
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-3.5">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-in fade-in duration-200">
                <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-[11px] font-medium">{error}</div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700 animate-in fade-in duration-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3">
              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="name@production.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-9 pl-8 bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:bg-white focus:border-indigo-600 focus:ring-indigo-500/20 rounded-lg"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-9 pl-8 pr-8 bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:bg-white focus:border-indigo-600 focus:ring-indigo-500/20 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-9 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] gap-1.5 mt-1 rounded-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>Access Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          {/* Quick Demo Credentials Footer */}
          <CardFooter className="p-3.5 sm:p-4 border-t border-slate-100 flex flex-col gap-2 bg-slate-50/70">
            <div className="flex items-center justify-between w-full text-[11px]">
              <span className="font-bold text-slate-700">
                Quick Sign-In:
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Click to fill
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              {/* Super Admin Card */}
              <button
                type="button"
                onClick={() =>
                  fillCredentials("superadmin@gmail.com", "admin123")
                }
                className="flex items-center justify-between p-2 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group cursor-pointer shadow-2xs active:scale-[0.97]"
              >
                <span className="text-purple-700 font-bold text-[11px] flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-600" />
                  Admin
                </span>
                <span className="text-[9px] px-1 py-0.2 bg-purple-100 text-purple-700 rounded font-semibold uppercase">
                  Root
                </span>
              </button>

              {/* Planner User Card */}
              <button
                type="button"
                onClick={() => fillCredentials("user1@gmail.com", "12345678")}
                className="flex items-center justify-between p-2 rounded-lg border border-sky-200 bg-white hover:bg-sky-50 hover:border-sky-300 transition-all group cursor-pointer shadow-2xs active:scale-[0.97]"
              >
                <span className="text-sky-700 font-bold text-[11px] flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-sky-600" />
                  Planner
                </span>
                <span className="text-[9px] px-1 py-0.2 bg-sky-100 text-sky-700 rounded font-semibold uppercase">
                  User
                </span>
              </button>
            </div>
          </CardFooter>
        </Card>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-400 font-medium">
          Garments Production Planning & Analytics • SQ Birichina
        </div>
      </div>
    </div>
  );
}

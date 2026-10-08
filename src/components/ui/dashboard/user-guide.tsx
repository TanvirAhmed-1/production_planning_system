"use client";

import React, { useState } from "react";
import {
  BookOpen,
  UploadCloud,
  Trash2,
  Users,
  FileSpreadsheet,
  BarChart3,
  Activity,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Download,
  KeyRound
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface UserGuideProps {
  onNavigateTab?: (tab: string) => void;
}

export function UserGuide({ onNavigateTab }: UserGuideProps) {
  const [activeSection, setActiveSection] = useState<string>("all");

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-10 h-48 w-48 rounded-full bg-sky-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <BookOpen className="h-3.5 w-3.5" />
            <span>সিস্টেম ইউজার গাইড ও ম্যানুয়াল (User Manual)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            গার্মেন্টস প্রোডাকশন ইআরপি ব্যবহারের পূর্ণাঙ্গ নির্দেশিকা
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            এখানে ফাইল আপলোড প্রসেস, ডাটা ডিলিট/রিসেট, সুপার অ্যাডমিন ইউজার ম্যানেজমেন্ট এবং সকল ড্যাশবোর্ড ফিচারের ধাপে ধাপে বিস্তারিত সমাধান দেওয়া হলো।
          </p>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800/80">
          {[
            { id: "all", label: "সব বিষয় (All)", icon: Layers },
            { id: "login", label: "১. লগইন ও রোল", icon: KeyRound },
            { id: "users", label: "২. ইউজার ম্যানেজমেন্ট", icon: Users },
            { id: "upload", label: "৩. ফাইল আপলোড প্রসেস", icon: UploadCloud },
            { id: "delete", label: "৪. ডাটা ডিলিট ও রিসেট", icon: Trash2 },
            { id: "features", label: "৫. ড্যাশবোর্ড ফিচারসমূহ", icon: BarChart3 },
            { id: "faq", label: "৬. সাধারণ প্রশ্নোত্তর", icon: HelpCircle },
          ].map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 1: Login & Roles */}
      {(activeSection === "all" || activeSection === "login") && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    ১. সিস্টেমে লগইন ও পারমিশন রোল
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    লগইন লিঙ্ক: <code className="text-indigo-600 dark:text-indigo-400 font-mono font-semibold">/login</code>
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs bg-purple-50 dark:bg-purple-950/40 font-semibold">
                Authentication
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Super Admin Role Card */}
              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-bold text-purple-900 dark:text-purple-200">Super Administrator</span>
                  </div>
                  <Badge className="bg-purple-600 text-white text-[10px] font-bold">Full Control</Badge>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/40 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-purple-700 dark:text-purple-300">মূল দায়িত্ব ও অনুমতিসমূহ:</p>
                  <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400">
                    <li>নতুন ইউজার অ্যাকাউন্ট তৈরি ও রোল নির্ধারণ</li>
                    <li>ইউজার পাসওয়ার্ড রিসেট ও লগইন পারমিশন বন্ধ/চালু করা</li>
                    <li>সিস্টেমের যেকোনো ইম্পোর্ট ব্যাচ বা ডাটা ডিলিট ও কনফিগারেশন</li>
                  </ul>
                </div>
              </div>

              {/* Planner User Role Card */}
              <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-sm font-bold text-sky-900 dark:text-sky-200">Planner & Production User</span>
                  </div>
                  <Badge className="bg-sky-600 text-white text-[10px] font-bold">Floor & Planning</Badge>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/40 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-sky-700 dark:text-sky-300">মূল দায়িত্ব ও অনুমতিসমূহ:</p>
                  <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400">
                    <li>মাসিক এক্সেল প্রোডাকশন সাইন-অফ প্ল্যান আপলোড</li>
                    <li>প্রতিদিনের ফ্লোর একচুয়াল প্রোডাকশন ডাটা ইনজেশন</li>
                    <li>লাইন পারফরম্যান্স, অর্ডার ট্র্যাকিং ও এক্সেল রিপোর্ট এক্সপোর্ট</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p>
                <strong>জরুরি শর্ত:</strong> উন্মুক্ত সাধারণ রেজিস্ট্রেশন পুরোপুরি বন্ধ রাখা হয়েছে। কোনো নতুন ইউজার একাউন্ট প্রয়োজন হলে সুপার অ্যাডমিনের মাধ্যমে তৈরি করে নিতে হবে।
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 2: User Management Walkthrough */}
      {(activeSection === "all" || activeSection === "users") && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    ২. ইউজার তৈরি ও পরিচালনা পদ্ধতি (User Management)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    শুধুমাত্র Super Admin একাউন্ট দিয়ে নতুন ইউজার তৈরি ও ম্যানেজ করা যাবে
                  </CardDescription>
                </div>
              </div>
              {onNavigateTab && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigateTab("user-management")}
                  className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/50 gap-1.5 font-semibold"
                >
                  <span>User Management এ যান</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  ১
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add New User এ ক্লিক</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  সাইডবার থেকে <strong>User Management</strong> ট্যাবে গিয়ে উপরের ডানদিকের <strong>"+ Add New User"</strong> বাটনে চাপুন।
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  ২
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">তথ্য ও রোল সিলেক্ট</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  ইউজারের নাম, ইমেইল, পাসওয়ার্ড এবং সিস্টেম রোল (SUPER_ADMIN, PLANNER, VIEWER) সিলেক্ট করুন।
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  ৩
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">তাত্ক্ষণিক এক্টিভেশন</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong>Create Account</strong> বাটনে চাপামাত্রই ইউজার লিস্টে যুক্ত হবে এবং ঐ ক্রেডেনশিয়াল দিয়ে সরাসরি লগইন করা যাবে।
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3: File Upload Process */}
      {(activeSection === "all" || activeSection === "upload") && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    ৩. ফাইল আপলোড প্রসেস ও ডাটা সিঙ্ক (Excel Upload Process)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    উৎপাদন পরিকল্পনা (.xlsx) এবং ফ্লোর ট্র্যাকার (.xlsb) স্বয়ংক্রিয় প্রসেসিং
                  </CardDescription>
                </div>
              </div>
              {onNavigateTab && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigateTab("excel-import")}
                  className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50 gap-1.5 font-semibold"
                >
                  <span>Excel Upload পেইজে যান</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                ধাপে ধাপে ফাইল আপলোড করার নির্দেশিকা:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">ধাপ ১: ড্রপ বা সিলেক্ট</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    সাইডবারের <strong>Excel Upload</strong> পেইজে গিয়ে আপনার ফাইলটি টেনে এনে ড্রপ করুন অথবা <strong>Browse</strong> করে সিলেক্ট করুন।
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">ধাপ ২: স্মার্ট ভ্যালিডেশন</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    সিস্টেম স্বয়ংক্রিয়ভাবে এক্সেলে থাকা লাইন নম্বর, বায়ার, স্টাইল, এসএমভি এবং ১-৩১ তারিখের টার্গেট রিড করবে।
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">ধাপ ৩: ডাটা প্রিভিউ</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    স্ক্রিনে মোট লাইন সংখ্যা, মোট স্টাইল ও টোটাল পিসের হিসাব প্রিভিউ টেবিলে প্রদর্শন করবে।
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">ধাপ ৪: ডাটাবেজ সিঙ্ক</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong>"Import & Sync Database"</strong> বাটনে ক্লিক করলেই ডাটাবেজ আপডেট হবে এবং ড্যাশবোর্ডে নতুন ডাটা দেখা যাবে।
                  </p>
                </div>
              </div>
            </div>

            {/* Mandatory Upload Hierarchy Rule */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/40 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>বাধ্যতামূলক আপলোড নিয়ম (Upload Hierarchy Rule):</span>
              </div>
              <div className="space-y-1.5 text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed pl-6">
                <p>
                  ১. <strong>সর্বপ্রথম মূল Production Plan (.xlsx)</strong> ফাইলটি Excel Upload-এ আপলোড করে ডাটাবেজ তৈরি করে নিতে হবে।
                </p>
                <p>
                  ২. <strong>Actual Production Plan (.xlsb)</strong> ফাইলটি অবশ্যই <strong>Excel Upload ফিল্ডেই</strong> সংশ্লিষ্ট <strong>Production Plan-এর অধীনে (Under Parent Plan)</strong> আপলোড করতে হবে।
                </p>
                <p>
                  ৩. কোনো Production Plan ছাড়া আলাদাভাবে Actual Plan আপলোড করা যাবে না — কারণ একচুয়াল ফ্লোর আউটপুট স্বয়ংক্রিয়ভাবে মূল প্ল্যানের লাইন ও টার্গেটের সাথে লিংক হয়ে ভ্যারিয়েন্স ও এফিশিয়েন্সি হিসাব করে।
                </p>
                <p>
                  ৪. <strong>অটোমেটিক রিরাইট ও ডাটা আপডেট (Auto-Overwrite):</strong> যদি কোনো Production Plan-এর অধীনে আগে থেকেই Actual Production ডাটা থাকে এবং পরবর্তীতে নতুন Actual ফাইল আপলোড করা হয়, তবে <strong>যে যে তারিখের ডাটা নতুন ফাইলে রয়েছে, পূর্বের ফাইলের ঐ নির্দিষ্ট তারিখগুলোর ডাটা স্বয়ংক্রিয়ভাবে মুছে নতুন ডাটা দিয়ে রিরাইট/আপডেট হয়ে যাবে</strong>। কোনো ডুপ্লিকেট বা ভুল যোগফল হবে না।
                </p>
              </div>
            </div>

            {/* Supported file specifications */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">সাপোর্টেড এক্সেল ফরম্যাট ও কাঠামো:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span><strong>১. Production Plan (.xlsx):</strong> মাসিক সাইন-অফ প্ল্যান শিট (মাস্টার ডাটা)</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span><strong>২. Actual Production (.xlsb):</strong> প্ল্যানের অধীনে ফ্লোর আউটপুট শিট</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Data Delete & Reset Process */}
      {(activeSection === "all" || activeSection === "delete") && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    ৪. ডাটা ডিলিট ও রিসেট প্রসেস (Delete & Reset Data)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    ভুল আপলোড মুছে ফেলা অথবা পুরানো মাসের ব্যাচ ডাটা রিমুভ করার পদ্ধতি
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs bg-rose-50 dark:bg-rose-950/40 font-semibold">
                Data Safety
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2">
                <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-rose-600" />
                  সম্পূর্ণ ব্যাচ / ফাইল ডিলিট করার নিয়ম:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  <li>সাইডবার থেকে <strong>Excel Upload</strong> পেইজে যান।</li>
                  <li>পেইজের নিচের দিকে <strong>"Uploaded Import Batches"</strong> সেকশনে সকল আপলোডের হিস্ট্রি পাওয়া যাবে।</li>
                  <li>যে আপলোডটির ডাটা মুছতে চান, তার ডানপাশের লাল <strong>"Delete Batch"</strong> আইকনে চাপুন।</li>
                  <li>
                    কনফার্মেশন ডায়ালগ আসলে <strong>"Confirm Delete"</strong> চাপুন। ঐ নির্দিষ্ট Production Plan-এর সকল লাইন ও ডাটাবেজ রেকর্ডের সাথে সাথে এর সাথে যুক্ত সকল <strong>Actual Production Plan / ফ্লোর ট্র্যাকিং ডাটাও স্বয়ংক্রিয়ভাবে সম্পূর্ণ ডিলিট হয়ে যাবে</strong>।
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  নির্দিষ্ট লাইন বা এন্ট্রি মুছে ফেলা:
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                  <strong>Production Plan</strong> টেবিলে গিয়ে যেকোনো একক লাইনের ডানদিকের ড্রপডাউন মেনু থেকে <strong>"Delete Entry"</strong> নির্বাচন করে শুধুমাত্র ঐ লাইনের ডাটা মুছে ফেলা সম্ভব।
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5: All Dashboard Pages Overview */}
      {(activeSection === "all" || activeSection === "features") && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  ৫. ড্যাশবোর্ডের বিভিন্ন পেজ ও সুবিধার তালিকা
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  সিস্টেমের গুরুত্বপূর্ণ মডিউল ও এনালাইসিস টুলস
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Feature 1 */}
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                  <BarChart3 className="h-4 w-4" />
                  <span>Executive Dashboard</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  পুরো ফ্যাক্টরির টোটাল টার্গেট, একচুয়াল প্রোডাকশন, এফিশিয়েন্সি গড় (%) এবং বায়ার ভিত্তিক গ্রাফিক্যাল এনালাইসিস।
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 space-y-2">
                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-xs">
                  <Layers className="h-4 w-4" />
                  <span>Production Plan</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  লাইন-বাই-লাইন বায়ার, স্টাইল, এসএমভি, ম্যানপাওয়ার এবং ১ থেকে ৩১ তারিখ পর্যন্ত ডে-ওয়াইজ টার্গেটের মাস্টার শিট।
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  <Activity className="h-4 w-4" />
                  <span>Actual Production</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  ফ্লোরের সুইং ও ফিনিশিং আউটপুট এবং টার্গেটের সাথে ভ্যারিয়েন্স (লাভ/ঘাটতি) রিয়েল-টাইম ক্যালকুলেশন।
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-xs">
                  <Sparkles className="h-4 w-4" />
                  <span>Line Performance</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  প্রতিটি লাইনের এফিশিয়েন্সি রেটিং, টপ পারফর্মিং লাইন এবং লো-পারফর্মিং লাইনের তালিকা ও র‍্যাংকিং।
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                  <Download className="h-4 w-4" />
                  <span>Data Export & Print</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  যেকোনো টেবিল ও রিপোর্ট সরাসরি <strong>Excel (.xlsx)</strong>, <strong>PDF</strong> বা <strong>CSV</strong> ফরম্যাটে এক ক্লিকে ডাউনলোড।
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                  <Users className="h-4 w-4" />
                  <span>User Management</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  সুপার অ্যাডমিন দ্বারা নতুন স্টাফ একাউন্ট তৈরি, রোল ও পারমিশন কন্ট্রোল এবং পাসওয়ার্ড ম্যানেজমেন্ট।
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 6: FAQ & Quick Troubleshooting */}
      {(activeSection === "all" || activeSection === "faq") && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  ৬. সাধারণ প্রশ্নোত্তর ও ট্রাবলশুটিং (FAQ)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  জরুরি সমস্যার তাৎক্ষণিক সমাধান
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {[
              {
                q: "প্রশ্ন: লগইন করার পর 'Invalid Credentials' দেখাচ্ছে কেন?",
                a: "উত্তর: ইমেইল বা পাসওয়ার্ড সঠিক লিখেছেন কিনা চেক করুন। Super Admin এর জন্য superadmin@gmail.com / admin123 এবং Planner এর জন্য user1@gmail.com / 12345678 ব্যবহার করুন।"
              },
              {
                q: "প্রশ্ন: আমি নতুন ইউজার রেজিস্টার করতে পারছি না কেন?",
                a: "উত্তর: সিস্টেমের নিরাপত্তা বজায় রাখতে সাধারণ রেজিস্ট্রেশন বন্ধ। Super Admin হিসেবে লগইন করে User Management থেকে নতুন একাউন্ট তৈরি করুন।"
              },
              {
                q: "প্রশ্ন: ফাইল আপলোড করার পর ডাটা দেখাচ্ছে না কেন?",
                a: "উত্তর: ফাইল আপলোড করার পর প্রিভিউ স্ক্রিনে থাকা 'Import & Sync Database' বাটনে চাপ দিতে ভুলবেন না। এছাড়াও ব্রাউজারে Ctrl + F5 চেপে হার্ড রিফ্রেশ দিন।"
              },
              {
                q: "প্রশ্ন: ড্যাশবোর্ডের ডাটা কীভাবে প্রিন্ট বা ডাউনলোড করব?",
                a: "উত্তর: যেকোনো টেবিলের উপরের ডানপাশের 'Export' বাটনে ক্লিক করে Excel বা PDF নির্বাচন করলেই রেডিমেড ফাইল ডাউনলোড হয়ে যাবে।"
              }
            ].map((faq, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-colors space-y-1.5">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{faq.q}</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{faq.a}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

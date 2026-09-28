"use client";

import React, { useState } from "react";
import {
  User,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  ExternalLink,
  Code2,
  Sparkles,
  Layers,
  Cpu,
  Database,
  Terminal,
  CheckCircle2,
  Copy,
  Briefcase,
  GraduationCap,
  Award,
  Send,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 0 0 1.45-1.45 1.45 1.45 0 0 0-1.45-1.45 1.45 1.45 0 0 0-1.45 1.45c0 .8.65 1.45 1.45 1.45m1.39 9.74v-8.37H5.07v8.37h2.78z" />
    </svg>
  );
}

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function AboutUs() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopy = (text: string, type: "email" | "phone") => {
    navigator.clipboard.writeText(text);
    if (type === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const skills = [
    {
      category: "Frontend Development",
      icon: Code2,
      color: "from-sky-500 to-blue-600",
      items: [
        "React.js",
        "Next.js (App Router)",
        "TypeScript",
        "JavaScript (ES6+)",
        "Tailwind CSS",
        "HTML5 & CSS3",
        "Responsive Web Design",
        "Vite & Webpack",
      ],
    },
    {
      category: "Backend & Database",
      icon: Database,
      color: "from-emerald-500 to-teal-600",
      items: [
        "Node.js",
        "Express.js",
        "Prisma ORM",
        "PostgreSQL",
        "SQLite",
        "MongoDB",
        "RESTful API Architecture",
        "JSON & Data Pipelines",
      ],
    },
    {
      category: "Garments ERP & Production Systems",
      icon: Layers,
      color: "from-purple-500 to-indigo-600",
      items: [
        "Production Planning Engines",
        "Live 31-Day Excel Matrix Parser",
        "SAH & Efficiency Calculation Formulae",
        "Manpower & Machine Balancing",
        "Sign-off Summary Automation",
        "Garments MIS Analytics",
      ],
    },
    {
      category: "DevOps, Tools & Best Practices",
      icon: Terminal,
      color: "from-amber-500 to-orange-600",
      items: [
        "Git & GitHub Version Control",
        "Vercel & Netlify Deployment",
        "Docker Basics",
        "Postman API Testing",
        "State Management",
        "Performance Optimization",
      ],
    },
  ];

  const projects = [
    {
      title: "Garments Production ERP & MIS Platform",
      badge: "Flagship Enterprise ERP",
      desc: "Comprehensive production planning, live 31-day Excel sign-off spreadsheet parser, unit/line capacity editor, real-time SAH calculations, and daily production reports.",
      tags: ["Next.js", "TypeScript", "Prisma", "PostgreSQL/SQLite", "Tailwind CSS", "XLSX Engine"],
    },
    {
      title: "Personal Developer Portfolio SPA",
      badge: "Live Portfolio",
      desc: "Interactive developer portfolio featuring dynamic 3D background canvas animations, typing animations, responsive project showcases, and EmailJS integration.",
      tags: ["React.js", "HTML5 Canvas", "Tailwind CSS", "EmailJS", "Netlify"],
      link: "https://tanvirahmed1.netlify.app/",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Hero Card with Rich Aesthetics */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 md:p-10 shadow-xl">
        {/* Background Glowing Ambient Orbs */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-sky-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          {/* Avatar / Profile Graphic */}
          <div className="relative shrink-0 group">
            <div className="relative h-32 w-32 md:h-36 md:w-36 rounded-2xl overflow-hidden border-2 border-purple-500/60 shadow-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-1">
              <div className="h-full w-full rounded-xl bg-slate-900 flex items-center justify-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-pink-400 select-none">
                TA
              </div>
            </div>
            <span className="absolute -bottom-2 -right-2 flex h-7 items-center justify-center rounded-full bg-emerald-500 px-2 text-[10px] font-bold text-white shadow-md border-2 border-slate-900">
              ● Available
            </span>
          </div>

          {/* Intro Text */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-2.5 py-0.5 border-0">
                Full Stack Developer
              </Badge>
              <Badge className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold">
                Garments ERP Specialist
              </Badge>
              <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                Dhaka, Bangladesh
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
              Tanvir Ahmed
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Passionate Web Developer dedicated to crafting responsive, scalable, and intuitive web applications.
              Specialized in modern full-stack architectures, high-performance interactive dashboards, and industrial Garments Production Planning ERP engines.
            </p>

            {/* Quick Action Links */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <a
                href="https://tanvirahmed1.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-purple-500 hover:to-pink-500 transition-all active:scale-95"
              >
                <Globe className="h-4 w-4" />
                <span>Visit Portfolio</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>

              <a
                href="https://drive.google.com/file/d/1je5xW5yD0sCP3D0_fhDANhXqGYWk0S5M/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-750 hover:text-white transition-all active:scale-95"
              >
                <Download className="h-4 w-4 text-sky-400" />
                <span>Download CV</span>
              </a>

              <a
                href="https://github.com/TanvirAhmed-1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="GitHub Profile"
              >
                <GithubIcon className="h-4 w-4" />
                <span>GitHub</span>
              </a>

              <a
                href="https://www.linkedin.com/in/tanvir-ahmed-38088333a"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-slate-800 transition-colors"
                title="LinkedIn Profile"
              >
                <LinkedinIcon className="h-4 w-4" />
                <span>LinkedIn</span>
              </a>

              <a
                href="https://www.facebook.com/12TanvirAhmed"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-slate-800 transition-colors"
                title="Facebook Profile"
              >
                <FacebookIcon className="h-4 w-4" />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Contact Information & Professional Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Contact & Connectivity</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Reach out directly for collaboration, software development, or ERP solutions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            {/* Email */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</span>
                  <a
                    href="mailto:tanvir.79.ahmed@gmail.com"
                    className="font-bold text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 truncate block"
                  >
                    tanvir.79.ahmed@gmail.com
                  </a>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy("tanvir.79.ahmed@gmail.com", "email")}
                className="h-7 w-7 p-0 shrink-0 text-slate-400 hover:text-slate-600"
                title="Copy Email"
              >
                {copiedEmail ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone / WhatsApp</span>
                  <a
                    href="tel:+8801786924911"
                    className="font-bold text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 truncate block"
                  >
                    +880 1786 924911
                  </a>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy("+8801786924911", "phone")}
                className="h-7 w-7 p-0 shrink-0 text-slate-400 hover:text-slate-600"
                title="Copy Phone"
              >
                {copiedPhone ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Location</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Dhaka, Bangladesh
                </span>
              </div>
            </div>

            {/* Portfolio CTA */}
            <div className="p-4 rounded-xl bg-gradient-to-tr from-purple-500/10 via-indigo-500/5 to-pink-500/10 border border-purple-200 dark:border-purple-900/50 space-y-2">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                <Sparkles className="h-4 w-4" />
                <span>Looking for Web/ERP Engineering?</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Available for full-time roles, contract engineering, and enterprise software consultations.
              </p>
              <a
                href="mailto:tanvir.79.ahmed@gmail.com?subject=Project%20Inquiry%20from%20Production%20ERP"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white py-2 text-xs font-bold transition-all shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Message / Email</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Professional Summary & Architecture Highlights */}
        <div className="md:col-span-2 space-y-6">
          {/* Engineering Expertise */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Cpu className="h-4 w-4 text-sky-600" />
                <span>Technical Skills & Core Competencies</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Full-stack proficiency spanning modern JavaScript ecosystems, database architecture, and industrial analytics engines.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {skills.map((group) => {
                  const Icon = group.icon;
                  return (
                    <div
                      key={group.category}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr ${group.color} text-white shadow-2xs`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {group.category}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center rounded-md bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/80 shadow-2xs"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Featured Projects Highlight */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                <span>Featured Engineering Projects</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Selected production systems and web engineering builds.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {projects.map((proj) => (
                <div
                  key={proj.title}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {proj.title}
                      </h4>
                      <Badge className="bg-emerald-600 text-white text-[10px] py-0 font-semibold">
                        {proj.badge}
                      </Badge>
                    </div>
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Live Demo</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {proj.desc}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-200/60 dark:border-indigo-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Globe,
  Mail,
  Phone,
  MapPin,
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
  Send,
  Award,
  Zap,
  Check
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
        "SAH & Efficiency Formulae",
        "Manpower & Line Balancing",
        "Sign-off Summary Automation",
        "Garments MIS Analytics",
      ],
    },
    {
      category: "DevOps & Best Practices",
      icon: Terminal,
      color: "from-amber-500 to-orange-600",
      items: [
        "Git & GitHub Version Control",
        "Vercel & Cloud Deployment",
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
      desc: "Full-scale industrial ERP with live 31-day Excel sign-off spreadsheet parser, unit/line capacity editor, real-time SAH calculations, and dynamic production analytics.",
      tags: ["Next.js", "TypeScript", "Prisma", "PostgreSQL/SQLite", "Tailwind CSS", "XLSX Engine"],
    },
    {
      title: "Personal Developer Portfolio SPA",
      badge: "Live Portfolio",
      desc: "Interactive web portfolio featuring dynamic 3D background canvas animations, typing effects, responsive project showcases, and EmailJS integration.",
      tags: ["React.js", "HTML5 Canvas", "Tailwind CSS", "EmailJS", "Netlify"],
      link: "https://tanvirahmed1.netlify.app/",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Hero Card - Executive Luxury Presentation */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 md:p-10 shadow-xl">
        {/* Subtle Ambient Glows */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-10">
          {/* Full Portrait Photo Presentation */}
          <div className="relative shrink-0 flex flex-col items-center">
            <div className="relative w-60 sm:w-64 md:w-72 aspect-[4/5] rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-800 shadow-2xl ring-1 ring-white/10 p-1">
              <img
                src="/image.png"
                alt="Tanvir Ahmed - Full Stack Developer & Garments ERP Specialist"
                className="h-full w-full rounded-xl object-cover object-top transition-transform duration-500 hover:scale-102"
              />
            </div>
            
            {/* Status Badge */}
            <div className="mt-3.5 flex items-center gap-2 bg-slate-800/90 text-emerald-400 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Available for Full-Time & Projects</span>
            </div>
          </div>

          {/* Bio and Executive Overview */}
          <div className="flex-1 text-center lg:text-left space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <Badge className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-lg border-0 shadow-xs">
                Full Stack Developer
              </Badge>
              <Badge className="bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                Garments ERP Specialist
              </Badge>
              <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2.5 py-1 rounded-lg">
                Dhaka, Bangladesh
              </Badge>
            </div>

            {/* Name Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
                Tanvir Ahmed
              </h1>
              <p className="text-sm sm:text-base font-medium text-slate-400 mt-1">
                Software Engineer • Full Stack Web & Enterprise MIS Architect
              </p>
            </div>

            {/* Summary */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Passionate Web Developer dedicated to crafting responsive, scalable, and intuitive web applications.
              Specialized in modern full-stack architectures, high-performance interactive dashboards, and industrial Garments Production Planning ERP engines.
            </p>

            {/* Key Highlight Metrics (Harmonized, Clean Colors) */}
            <div className="grid grid-cols-3 gap-3 py-2 max-w-xl mx-auto lg:mx-0">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                <span className="text-lg sm:text-2xl font-black font-mono text-white block">3+ Years</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Dev Experience</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                <span className="text-lg sm:text-2xl font-black font-mono text-white block">100% Live</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">31-Day Excel Parser</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                <span className="text-lg sm:text-2xl font-black font-mono text-white block">10+ Modules</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ERP Analytics</span>
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <a
                href="https://tanvirahmed1.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition-all"
              >
                <Globe className="h-4 w-4" />
                <span>Visit Live Portfolio</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>

              <a
                href="https://drive.google.com/file/d/1je5xW5yD0sCP3D0_fhDANhXqGYWk0S5M/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white active:scale-95 transition-all shadow-xs"
              >
                <Download className="h-4 w-4 text-sky-400" />
                <span>Download CV</span>
              </a>

              <a
                href="https://github.com/TanvirAhmed-1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                title="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
                <span>GitHub</span>
              </a>

              <a
                href="https://www.linkedin.com/in/tanvir-ahmed-38088333a"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-sky-400 transition-colors"
                title="LinkedIn"
              >
                <LinkedinIcon className="h-4 w-4" />
                <span>LinkedIn</span>
              </a>

              <a
                href="https://www.facebook.com/12TanvirAhmed"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-blue-400 transition-colors"
                title="Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Contact & Skills & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information Card */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Contact & Connectivity</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Direct channels for software engineering & ERP consultations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5 text-xs">
            {/* Email */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</span>
                  <a
                    href="mailto:tanvir.79.ahmed@gmail.com"
                    className="font-bold text-slate-800 dark:text-slate-200 hover:text-purple-600 truncate block"
                  >
                    tanvir.79.ahmed@gmail.com
                  </a>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy("tanvir.79.ahmed@gmail.com", "email")}
                className="h-7 w-7 p-0 shrink-0 text-slate-400 hover:text-slate-700"
                title="Copy Email"
              >
                {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone / WhatsApp</span>
                  <a
                    href="tel:+8801786924911"
                    className="font-bold text-slate-800 dark:text-slate-200 hover:text-sky-600 truncate block"
                  >
                    +880 1786 924911
                  </a>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy("+8801786924911", "phone")}
                className="h-7 w-7 p-0 shrink-0 text-slate-400 hover:text-slate-700"
                title="Copy Phone"
              >
                {copiedPhone ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Location</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Dhaka, Bangladesh
                </span>
              </div>
            </div>

            {/* Direct Message CTA Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white space-y-2.5 shadow-md">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Sparkles className="h-4 w-4 text-purple-200" />
                <span>Hire / Collaborate</span>
              </div>
              <p className="text-[11px] text-purple-100 leading-relaxed">
                Available for full-time engineering roles, contract projects, and production systems consultation.
              </p>
              <a
                href="mailto:tanvir.79.ahmed@gmail.com?subject=Project%20Inquiry%20from%20Production%20ERP"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white text-purple-900 hover:bg-purple-50 py-2 text-xs font-bold transition-all shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Direct Message</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Technical Skills & Projects Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills Card */}
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Cpu className="h-4 w-4 text-sky-600" />
                <span>Technical Skills & Core Competencies</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Full-stack proficiency spanning JavaScript, database architectures, and industrial analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {skills.map((group) => {
                  const Icon = group.icon;
                  return (
                    <div
                      key={group.category}
                      className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-gradient-to-tr ${group.color} text-white shadow-2xs`}
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
                            className="inline-flex items-center rounded-md bg-white dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/80 shadow-2xs"
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
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                <span>Featured Engineering Projects</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Production-grade enterprise software builds
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {projects.map((proj) => (
                <div
                  key={proj.title}
                  className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
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

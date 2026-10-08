"use client";

import React, { useState } from "react";
import { UserPlus, Edit2, Trash2, Eye, EyeOff, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserItem, CreateUserData, EditUserData } from "./user-types";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateUserData) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}: CreateUserModalProps) {
  const [form, setForm] = useState<CreateUserData>({
    name: "",
    email: "",
    password: "",
    role: "PLANNER",
    department: "Production Planning",
    phone: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Create New User Account
              </h3>
              <p className="text-[11px] text-slate-500">
                Provision credentials with role-based access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Full Name *
            </label>
            <Input
              placeholder="e.g. Tanvir Ahmed"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="h-8.5 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Work Email Address *
            </label>
            <Input
              type="email"
              placeholder="name@production.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="h-8.5 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Initial Password *
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password (min 4 characters)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={4}
                className="h-8.5 text-xs pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Assigned System Role *
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as any })}
              className="w-full h-8.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="PLANNER">Planner (Production, Orders & Run Lines)</option>
              <option value="ADMIN">Admin (Upload & Master Management)</option>
              <option value="SUPER_ADMIN">Super Admin (Full System & User Control)</option>
              <option value="VIEWER">Viewer (Read-only Dashboard Access)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Department
              </label>
              <Input
                placeholder="e.g. IE & Planning"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="h-8.5 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <Input
                placeholder="+880 1700 000000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold px-4"
            >
              {isSubmitting ? "Creating..." : "Save & Provision User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: EditUserData | null;
  onSubmit: (formData: EditUserData) => Promise<void>;
  isSubmitting: boolean;
}

export function EditUserModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting
}: EditUserModalProps) {
  const [form, setForm] = useState<EditUserData | null>(initialData);

  React.useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  if (!isOpen || !form) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
              <Edit2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Edit User Account
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {form.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="h-8.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Assigned Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="PLANNER">Planner</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Login Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="ACTIVE">Active (Allowed)</option>
                <option value="INACTIVE">Inactive (Disabled)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Department
              </label>
              <Input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="h-8.5 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Phone
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Reset Password</span>
              <span className="text-[10px] text-slate-400 font-normal">Leave blank to keep current</span>
            </label>
            <Input
              type="password"
              placeholder="Enter new password to reset"
              value={form.newPassword || ""}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="h-8.5 text-xs"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold px-4"
            >
              {isSubmitting ? "Saving..." : "Update User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export function DeleteUserModal({
  isOpen,
  onClose,
  user,
  onConfirm,
  isSubmitting
}: DeleteUserModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Delete User Account?
            </h3>
            <p className="text-xs text-slate-500">
              This action will permanently revoke system access.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            {user.name}
          </span>
          <span className="text-slate-500 font-mono block">
            {user.email}
          </span>
          <span className="inline-block mt-1 text-[10px] font-bold text-purple-700 dark:text-purple-300">
            Role: {user.role}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="h-8 text-xs font-bold"
          >
            {isSubmitting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

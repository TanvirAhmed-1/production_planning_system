"use client";

import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  Building2,
  Phone,
  Calendar,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { UserItem, UserRole } from "./user-types";

interface UserManagementTableProps {
  users: UserItem[];
  loading: boolean;
  onEdit: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
}

export function UserManagementTable({
  users,
  loading,
  onEdit,
  onDelete
}: UserManagementTableProps) {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/80 font-bold gap-1 text-[10px] px-2 py-0.5"
          >
            <ShieldAlert className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            SUPER ADMIN
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge
            variant="outline"
            className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/80 font-semibold gap-1 text-[10px] px-2 py-0.5"
          >
            <ShieldCheck className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
            ADMIN
          </Badge>
        );
      case "PLANNER":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80 font-semibold gap-1 text-[10px] px-2 py-0.5"
          >
            <UserCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            PLANNER
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 font-medium gap-1 text-[10px] px-2 py-0.5"
          >
            <Eye className="h-3 w-3 text-slate-500" />
            VIEWER
          </Badge>
        );
    }
  };

  const getAvatarGradient = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "from-purple-600 to-indigo-600 text-white";
      case "ADMIN":
        return "from-indigo-500 to-blue-600 text-white";
      case "PLANNER":
        return "from-emerald-500 to-teal-600 text-white";
      default:
        return "from-slate-500 to-slate-700 text-white";
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table className="w-full min-w-[850px]">
        <TableHeader>
          <TableRow className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
            <TableHead className="font-bold py-3 pl-4">User Details</TableHead>
            <TableHead className="font-bold py-3">Role</TableHead>
            <TableHead className="font-bold py-3">Department & Contact</TableHead>
            <TableHead className="font-bold py-3 text-center">Status</TableHead>
            <TableHead className="font-bold py-3">Last Login</TableHead>
            <TableHead className="font-bold py-3">Created Date</TableHead>
            <TableHead className="font-bold py-3 text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-16 text-slate-400 text-xs">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2.5" />
                <span className="font-medium">Loading user directory...</span>
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                No user accounts match the current filter criteria.
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => {
              const initials = u.name
                .split(" ")
                .filter(Boolean)
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "U";

              return (
                <TableRow
                  key={u.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800/80 text-xs transition-colors"
                >
                  {/* User Details */}
                  <TableCell className="py-3 pl-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(
                          u.role
                        )} font-bold text-xs shadow-xs`}
                      >
                        {initials}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">
                          {u.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate block">
                          {u.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role Badge */}
                  <TableCell className="py-3">
                    {getRoleBadge(u.role)}
                  </TableCell>

                  {/* Department & Contact */}
                  <TableCell className="py-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{u.department || "Garments Operations"}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold text-[10px] px-2.5 py-0.5 rounded-full border ${
                        u.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          u.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                        }`}
                      />
                      {u.status}
                    </span>
                  </TableCell>

                  {/* Last Login */}
                  <TableCell className="py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {u.lastLoginAt ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{new Date(u.lastLoginAt).toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Never</span>
                    )}
                  </TableCell>

                  {/* Created Date */}
                  <TableCell className="py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3 text-right pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(u)}
                        className="h-7 px-2.5 text-xs font-semibold text-sky-700 hover:text-sky-800 border-sky-200 bg-sky-50/50 hover:bg-sky-100 dark:border-sky-800/80 dark:bg-sky-950/30 dark:text-sky-300 gap-1 transition-all"
                        title="Edit user details and credentials"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(u)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

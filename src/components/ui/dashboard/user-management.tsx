"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  X,
  Filter,
  Shield,
  Activity
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { UserItem, UserCounts, CreateUserData, EditUserData } from "./user-types";
import { UserStatsCards } from "./user-stats-cards";
import { UserManagementTable } from "./user-management-table";
import {
  CreateUserModal,
  EditUserModal,
  DeleteUserModal
} from "./user-management-modals";

export function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [counts, setCounts] = useState<UserCounts>({
    total: 0,
    superAdmins: 0,
    admins: 0,
    planners: 0,
    viewers: 0,
    active: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Feedback notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<EditUserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load users");
      }
      setUsers(data.users || []);
      setCounts(
        data.counts || {
          total: 0,
          superAdmins: 0,
          admins: 0,
          planners: 0,
          viewers: 0,
          active: 0
        }
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Create User
  const handleCreateUser = async (form: CreateUserData) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create user");
      }

      setSuccessMsg(data.message || "User account created successfully.");
      setIsCreateModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "Could not create user account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit User
  const handleEditUser = async (form: EditUserData) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/users/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update user");
      }

      setSuccessMsg(data.message || "User profile updated successfully.");
      setIsEditModalOpen(false);
      setEditUserData(null);
      await fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "Could not update user account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE"
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete user");
      }

      setSuccessMsg(data.message || "User deleted successfully.");
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "Could not delete user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (u: UserItem) => {
    setEditUserData({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      department: u.department || "",
      phone: u.phone || "",
      newPassword: ""
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (u: UserItem) => {
    setUserToDelete(u);
    setIsDeleteModalOpen(true);
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      (u.department && u.department.toLowerCase().includes(search)) ||
      (u.phone && u.phone.includes(search));

    const matchRole = selectedRole === "ALL" || u.role === selectedRole;
    const matchStatus = selectedStatus === "ALL" || u.status === selectedStatus;

    return matchSearch && matchRole && matchStatus;
  });

  const hasActiveFilters = searchTerm !== "" || selectedRole !== "ALL" || selectedStatus !== "ALL";

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedRole("ALL");
    setSelectedStatus("ALL");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Top Banner with Clean High-Contrast ERP Styling */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-950/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md ring-2 ring-purple-400/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  User Management & Access Control
                </h1>
                <Badge className="bg-purple-500/20 text-purple-200 border-purple-400/30 text-[10px] font-bold px-2 py-0.5">
                  🔒 SUPER ADMIN ONLY
                </Badge>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Role-based access provisioning, account governance, and credential lifecycle management.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-4 gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all self-start md:self-auto shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create New User</span>
          </Button>
        </div>

        {/* Condition Notice Box */}
        <div className="mt-3.5 pt-3 border-t border-indigo-900/60 flex items-center gap-2 text-xs text-indigo-200/90 bg-indigo-950/40 px-3.5 py-2 rounded-xl">
          <Info className="h-4 w-4 text-purple-300 shrink-0" />
          <span>
            <strong>Strict Policy:</strong> Public self-registration is disabled. <strong>Only the Super Administrator</strong> has authorization to provision accounts and assign roles.
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 hover:underline font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-600 hover:underline font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 KPI Stat Cards */}
      <UserStatsCards
        counts={counts}
        selectedRole={selectedRole}
        onSelectRole={(role) => setSelectedRole(role)}
      />

      {/* Users Table with Integrated Header Toolbar */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden">
        {/* Integrated Header Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-slate-50/40 dark:bg-slate-900/40">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                System User Directory
              </h3>
              <Badge
                variant="secondary"
                className="bg-purple-100/80 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 text-[11px] font-bold px-2 py-0.5"
              >
                {filteredUsers.length} Users
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage system permissions, reset passwords, and oversee operational access rights
            </p>
          </div>

          {/* Search and Filters Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search name, email, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8.5 pl-8 pr-7 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs rounded-lg"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
              <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500">Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-1"
              >
                <option value="ALL">All Roles ({users.length})</option>
                <option value="SUPER_ADMIN">Super Admin ({counts.superAdmins})</option>
                <option value="ADMIN">Admin ({counts.admins})</option>
                <option value="PLANNER">Planner ({counts.planners})</option>
                <option value="VIEWER">Viewer ({counts.viewers})</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
              <Activity className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-1"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Clear Filters Button (conditional) */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8.5 text-xs text-slate-500 hover:text-slate-800 px-2 gap-1 font-semibold"
                title="Reset all filters"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
              className="h-8.5 text-xs gap-1.5 border-slate-200 dark:border-slate-700 font-semibold bg-white dark:bg-slate-800 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <CardContent className="p-0">
          <UserManagementTable
            users={filteredUsers}
            loading={loading}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
        isSubmitting={isSubmitting}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditUserData(null);
        }}
        initialData={editUserData}
        onSubmit={handleEditUser}
        isSubmitting={isSubmitting}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        user={userToDelete}
        onConfirm={handleDeleteUser}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

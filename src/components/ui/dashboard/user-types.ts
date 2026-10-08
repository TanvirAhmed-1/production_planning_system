export type UserRole = "SUPER_ADMIN" | "ADMIN" | "PLANNER" | "VIEWER";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface UserItem {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  department: string | null;
  phone: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserCounts {
  total: number;
  superAdmins: number;
  admins: number;
  planners: number;
  viewers: number;
  active: number;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  phone: string;
}

export interface EditUserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  department: string;
  phone: string;
  newPassword?: string;
}

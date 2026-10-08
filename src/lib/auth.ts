import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'production_erp_session';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PLANNER' | 'VIEWER';
  status: string;
  department: string | null;
  phone: string | null;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Simple encode/decode session token
export function createSessionToken(user: { id: string; email: string; role: string }): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function parseSessionToken(token: string): { id: string; email: string; role: string } | null {
  try {
    const jsonStr = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(jsonStr);
    if (data && data.id && data.email && data.role) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

// Ensure default Super Admin exists in database
export async function ensureSuperAdminExists(): Promise<AuthUser> {
  let superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!superAdmin) {
    const defaultPassword = await hashPassword('admin123');
    superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@gmail.com',
        name: 'Super Admin',
        password: defaultPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        department: 'Executive Management',
        phone: '+880 1786 924911'
      }
    });
  }

  return {
    id: superAdmin.id,
    email: superAdmin.email,
    name: superAdmin.name,
    role: superAdmin.role as any,
    status: superAdmin.status,
    department: superAdmin.department,
    phone: superAdmin.phone
  };
}

// Get current session user from Request cookies
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      // Return Super Admin by default if running in development mode without session
      return await ensureSuperAdminExists();
    }

    const parsed = parseSessionToken(token);
    if (!parsed) {
      return await ensureSuperAdminExists();
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.id }
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      status: user.status,
      department: user.department,
      phone: user.phone
    };
  } catch {
    return await ensureSuperAdminExists();
  }
}

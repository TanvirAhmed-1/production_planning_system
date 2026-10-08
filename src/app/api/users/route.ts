import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

// GET /api/users - List all users (Only SUPER_ADMIN)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Only Super Admin can manage users.' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        phone: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    const counts = {
      total: users.length,
      superAdmins: users.filter(u => u.role === 'SUPER_ADMIN').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      planners: users.filter(u => u.role === 'PLANNER').length,
      viewers: users.filter(u => u.role === 'VIEWER').length,
      active: users.filter(u => u.status === 'ACTIVE').length
    };

    return NextResponse.json({
      success: true,
      users,
      counts
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user (ONLY SUPER_ADMIN condition!)
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // STRICT CONDITION: Only SUPER_ADMIN can create users!
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied: ONLY Super Admin is authorized to create and provision new accounts.'
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, name, password, role, department, phone } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, Email and Password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `User with email "${normalizedEmail}" already exists.` },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'PLANNER', 'VIEWER'];
    const assignedRole = validRoles.includes(role) ? role : 'PLANNER';

    // Hash password
    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: String(name).trim(),
        password: hashedPassword,
        role: assignedRole,
        status: 'ACTIVE',
        department: department ? String(department).trim() : 'Production Planning',
        phone: phone ? String(phone).trim() : null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        phone: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `User ${newUser.name} (${newUser.role}) created successfully by Super Admin.`,
      user: newUser
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

// PUT /api/users/[id] - Update user (ONLY SUPER_ADMIN)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. ONLY Super Admin can update user roles and status.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, role, status, department, phone, password } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Safety: prevent demoting own account if last SUPER_ADMIN
    if (targetUser.id === currentUser.id && role && role !== 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { success: false, message: 'Cannot demote the only remaining Super Admin account.' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = String(name).trim();
    if (role) {
      const validRoles = ['SUPER_ADMIN', 'ADMIN', 'PLANNER', 'VIEWER'];
      if (validRoles.includes(role)) updateData.role = role;
    }
    if (status) updateData.status = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (department !== undefined) updateData.department = department ? String(department).trim() : null;
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
    if (password && String(password).trim().length >= 4) {
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        phone: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.name} updated successfully.`,
      user: updatedUser
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (ONLY SUPER_ADMIN)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. ONLY Super Admin can delete users.' },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Safety: prevent deleting own account
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own active Super Admin account.' },
        { status: 400 }
      );
    }

    // Safety: prevent deleting last remaining Super Admin
    if (targetUser.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { success: false, message: 'Cannot delete the only remaining Super Admin account.' },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: `User "${targetUser.name}" (${targetUser.email}) was permanently deleted.`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

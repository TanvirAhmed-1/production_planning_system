const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuthAndUserManagement() {
  
  let superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!superAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@production.com',
        name: 'Super Admin (System)',
        password: hash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        department: 'Executive Management',
        phone: '+880 1786 924911'
      }
    });
  } else {
  }

  const isMatch = await bcrypt.compare('admin123', superAdmin.password);

  const plannerEmail = 'planner@production.com';
  let planner = await prisma.user.findUnique({ where: { email: plannerEmail } });
  if (!planner) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('planner123', salt);
    planner = await prisma.user.create({
      data: {
        email: plannerEmail,
        name: 'Senior Production Planner',
        password: hash,
        role: 'PLANNER',
        status: 'ACTIVE',
        department: 'IE & Planning',
        phone: '+880 1700 123456'
      }
    });
  } else {
  }

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      department: true,
      createdAt: true
    }
  });
  

  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@production.com',
      password: 'admin123'
    })
  });
  const loginData = await loginRes.json();

  const usersRes = await fetch('http://localhost:3001/api/users');
  const usersData = await usersRes.json();
    success: usersData.success,
    totalCount: usersData.counts?.total,
    superAdmins: usersData.counts?.superAdmins,
    planners: usersData.counts?.planners
  });

}

testAuthAndUserManagement()
  .catch(() => {})
  .finally(() => prisma.$disconnect());

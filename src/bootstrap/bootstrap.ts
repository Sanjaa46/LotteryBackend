import prisma from '../lib/prisma.js';
import { hashPassword } from '../utils/password.js';

async function bootstrapRoles() {
    const roles = ['admin', 'user'];

    for (const roleName of roles) {
        await prisma.role.upsert({
            where: {
                name: roleName,
            },
            update: {},
            create: {
                name: roleName,
            },
        });
    }

    console.log('Roles bootstrapped');
}

async function bootstrapAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD');
    }

    const existingAdmin = await prisma.user.findUnique({
        where: {
            email: adminEmail,
        },
    });

    if (existingAdmin) {
        console.log('Admin already exists');
        return;
    }

    const adminRole = await prisma.role.findUnique({
        where: {
            name: 'admin',
        },
    });

    if (!adminRole) {
        throw new Error('Admin role missing');
    }

    const hashedPassword = await hashPassword(adminPassword);

    await prisma.$transaction(async (tx) => {
        const admin = await tx.user.create({
            data: {
                email: adminEmail,
                passwordHash: hashedPassword,
            },
        });

        await tx.userRole.create({
            data: {
                userId: admin.id,
                roleId: adminRole.id,
            },
        });
    });

    console.log('Admin bootstrapped');
}

async function main() {
    await bootstrapRoles();
    await bootstrapAdmin();
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
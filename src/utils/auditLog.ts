import { Prisma } from '../generated/prisma/index.js';

// userId, action, entityType, entityId, oldValue, newValue, ipAddress, userAgent
export const createAuditLog = async (
    tx: Prisma.TransactionClient,
    {
        userId,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
    }: {
        userId: number;
        action: string;
        entityType: string;
        entityId: number;
        oldValue: any;
        newValue: any;
        ipAddress: string;
        userAgent: string;  
    }
) => {
    return await tx.auditLog.create({
        data: {
            userId,
            action,
            entityType,
            entityId,
            oldValue: JSON.stringify(oldValue),
            newValue: JSON.stringify(newValue),
            ipAddress,
            userAgent,
        },
    })
}
import prisma from './prismadb';

// Older deployments created a unique index on `userId` for payouts. That
// prevents multiple payout records per user and now causes P2002 errors when
// moderators register more than one payout. This helper drops the legacy
// index if it still exists so new records can be created successfully.
export async function dropLegacyUniqueUserIndex() {
  try {
    await prisma.$runCommandRaw({ dropIndexes: 'Payout', index: 'Payout_userId_key' });
  } catch (error: any) {
    // Mongo returns code 27 when an index is missing; ignore that and only
    // bubble up unexpected errors. Prisma can also surface this as P2010 with
    // an "index not found" message, so we look for that text before rethrowing.
    const code = error?.code ?? error?.error;
    const message: string | undefined = error?.meta?.message ?? error?.message;

    const isMissingIndex =
      code === 27 ||
      code === 'IndexNotFound' ||
      (code === 'P2010' && typeof message === 'string' && message.includes('index not found')) ||
      (typeof message === 'string' && message.includes('index not found'));

    if (!isMissingIndex) {
      throw error;
    }
  }
}
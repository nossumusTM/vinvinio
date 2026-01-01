import type { Prisma, Role } from '@prisma/client';

import prisma from '@/app/(marketplace)/libs/prismadb';

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

const normalizedFieldExpression = (field: string): Prisma.InputJsonObject => ({
  $toLower: {
    $reduce: {
      input: {
        $regexFindAll: {
          input: { $ifNull: [`$${field}`, ''] },
          regex: '[A-Za-z0-9]',
        },
      },
      initialValue: '',
      in: { $concat: ['$$value', '$$this.match'] },
    },
  },
});

export const normalizeHandle = (input: string) =>
  input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

type FindUserOptions = {
  role?: Role;
};

const extractIdFromAggregate = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const candidate = value as { $oid?: unknown };
    if (candidate && typeof candidate.$oid === 'string') {
      return candidate.$oid;
    }
  }

  return null;
};

export const findUserIdByHandle = async (
  input: string | null | undefined,
  options: FindUserOptions = {},
): Promise<string | null> => {
  const base = (input ?? '').trim();
  if (!base) {
    return null;
  }

  const sanitized = base.replace(/^@/, '').trim();
  if (!sanitized) {
    return null;
  }

  const or: Prisma.UserWhereInput[] = [];

  if (OBJECT_ID_RE.test(sanitized)) {
    or.push({ id: sanitized });
  }

  or.push({
    username: {
      equals: sanitized,
      mode: 'insensitive',
    },
  });

  or.push({
    email: {
      equals: sanitized,
      mode: 'insensitive',
    },
  });

  if (sanitized !== base) {
    or.push({
      username: {
        equals: base,
        mode: 'insensitive',
      },
    });
    
    or.push({
      email: {
        equals: base,
        mode: 'insensitive',
      },
    });
  }

  const roleFilter = options.role ? { role: options.role } : {};

  let directMatch: { id: string } | null = null;

  if (or.length > 0) {
    directMatch = await prisma.user.findFirst({
      where: {
        ...roleFilter,
        OR: or,
      },
      select: { id: true },
    });
  }

  if (directMatch?.id) {
    return directMatch.id;
  }

  const canonical = normalizeHandle(sanitized);
  if (!canonical) {
    return null;
  }

  const pipeline: Prisma.InputJsonValue[] = [
    ...(options.role
      ? [{ $match: { role: options.role } } as Prisma.InputJsonObject]
      : []),
    {
      $project: {
        _id: '$_id',
        normalizedUsername: normalizedFieldExpression('username'),
        normalizedLegalName: normalizedFieldExpression('legalName'),
        normalizedName: normalizedFieldExpression('name'),
        normalizedHostName: normalizedFieldExpression('hostName'),
      },
    } as Prisma.InputJsonObject,
    {
      $match: {
        $expr: {
          $or: [
            { $eq: ['$normalizedUsername', canonical] },
            { $eq: ['$normalizedLegalName', canonical] },
            { $eq: ['$normalizedName', canonical] },
            { $eq: ['$normalizedHostName', canonical] },
          ],
        },
      },
    } as Prisma.InputJsonObject,
    { $limit: 1 } as Prisma.InputJsonObject,
  ];

  type AggDoc = { _id?: unknown };

  const raw = (await prisma.user.aggregateRaw({
    pipeline,
  })) as unknown as AggDoc[];

  const [fallback] = Array.isArray(raw) ? raw : [];

  const fallbackId = extractIdFromAggregate(fallback?._id);

  if (fallbackId) {
    return fallbackId;
  }

  return null;
};

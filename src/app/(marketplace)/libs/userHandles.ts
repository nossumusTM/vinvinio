import type { Prisma, Role } from '@prisma/client';

import prisma from '@/app/(marketplace)/libs/prismadb';

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

const normalizedFieldExpression = (field: string): Record<string, unknown> => ({
  $toLower: {
    $regexReplace: {
      input: { $ifNull: [`$${field}`, ''] },
      regex: '[^A-Za-z0-9]',
      replacement: '',
      options: 'g',
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

  if (sanitized !== base) {
    or.push({
      username: {
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

  const pipeline: Record<string, unknown>[] = [
    ...(options.role
      ? [
          {
            $match: {
              role: options.role,
            },
          },
        ]
      : []),
    {
      $project: {
        _id: '$_id',
        normalizedUsername: normalizedFieldExpression('username'),
        normalizedLegalName: normalizedFieldExpression('legalName'),
        normalizedName: normalizedFieldExpression('name'),
        normalizedHostName: normalizedFieldExpression('hostName'),
      },
    },
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
    },
    { $limit: 1 },
  ];

  const [fallback] = (await prisma.user.aggregateRaw({
    pipeline,
  })) as Array<{ _id?: unknown }>;

  const fallbackId = extractIdFromAggregate(fallback?._id);

  if (fallbackId) {
    return fallbackId;
  }

  return null;
};

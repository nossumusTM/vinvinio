import type { IListingsParams } from './listings.types';

export const parseArrayParam = (value?: string | string[]): string[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const buildListingsWhereClause = (params: IListingsParams) => {
  const {
    userId,
    roomCount,
    guestCount,
    bathroomCount,
    locationValue,
    startDate,
    endDate,
    category,
    groupStyles,
    duration,
    environments,
    activityForms,
    seoKeywords,
    languages,
    statuses,
  } = params;

  const query: Record<string, any> = {};

  if (userId) {
    query.userId = userId;
  }

  const statusFilter = parseArrayParam(statuses);
  query.status = statusFilter.length > 0 ? { in: statusFilter } : 'approved';

  if (category) {
    const value = Array.isArray(category) ? category[0] : category;
    if (value) {
      query.category = {
        has: value,
      };
    }
  }

  const groupStyleFilter = parseArrayParam(groupStyles);
  if (groupStyleFilter.length > 0) {
    query.groupStyles = {
      hasSome: groupStyleFilter,
    };
  }

  if (typeof duration === 'string' && duration.trim().length > 0) {
    query.durationCategory = duration.trim();
  }

  const environmentFilter = parseArrayParam(environments);
  if (environmentFilter.length > 0) {
    query.environments = {
      hasSome: environmentFilter,
    };
  }

  const activityFormFilter = parseArrayParam(activityForms);
  if (activityFormFilter.length > 0) {
    query.activityForms = {
      hasSome: activityFormFilter,
    };
  }

  const keywordFilter = parseArrayParam(seoKeywords);
  if (keywordFilter.length > 0) {
    query.seoKeywords = {
      hasSome: keywordFilter,
    };
  }

  const languageFilter = parseArrayParam(languages);
  if (languageFilter.length > 0) {
    query.languages = {
      hasSome: languageFilter,
    };
  }

  if (roomCount) {
    query.roomCount = {
      gte: +roomCount,
    };
  }

  if (guestCount) {
    query.guestCount = {
      gte: +guestCount,
    };
  }

  if (bathroomCount) {
    query.bathroomCount = {
      gte: +bathroomCount,
    };
  }

  if (locationValue) {
    query.locationValue = locationValue;
  }

  if (startDate && endDate) {
    query.NOT = {
      reservations: {
        some: {
          OR: [
            {
              endDate: { gte: startDate },
              startDate: { lte: startDate },
            },
            {
              startDate: { lte: endDate },
              endDate: { gte: endDate },
            },
          ],
        },
      },
    };
  }

  return query;
};

export interface DateFilterPayload {
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  time?: string | null;
  year?: number | null;
}

interface DateBounds {
  from?: Date;
  to?: Date;
}

const isValidDate = (value: unknown): value is Date => {
  return value instanceof Date && !Number.isNaN(value.getTime());
};

const normalizeDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const resolveDateBounds = ({ startDate, endDate, time, year }: DateFilterPayload): DateBounds => {
  const bounds: DateBounds = {};

  const parsedStart = normalizeDate(startDate);
  const parsedEnd = normalizeDate(endDate) ?? parsedStart;

  if (parsedStart) {
    const from = new Date(parsedStart);
    if (time) {
      const [hours, minutes] = time.split(':').map((segment) => Number(segment));
      if (!Number.isNaN(hours)) {
        from.setHours(hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
      }
    } else {
      from.setHours(0, 0, 0, 0);
    }
    bounds.from = from;
  }

  if (parsedEnd) {
    const to = new Date(parsedEnd);
    if (time) {
      const [hours, minutes] = time.split(':').map((segment) => Number(segment));
      if (!Number.isNaN(hours)) {
        to.setHours(hours, Number.isNaN(minutes) ? 0 : minutes, 59, 999);
      }
    } else {
      to.setHours(23, 59, 59, 999);
    }
    bounds.to = to;
  }

  if (typeof year === 'number' && !Number.isNaN(year)) {
    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    if (!bounds.from || bounds.from < yearStart) {
      bounds.from = yearStart;
    }
    if (!bounds.to || bounds.to > yearEnd) {
      bounds.to = yearEnd;
    }
  }

  if (bounds.from && bounds.to && bounds.from > bounds.to) {
    const swap = bounds.from;
    bounds.from = bounds.to;
    bounds.to = swap;
  }

  if (bounds.from && !isValidDate(bounds.from)) {
    delete bounds.from;
  }
  if (bounds.to && !isValidDate(bounds.to)) {
    delete bounds.to;
  }

  return bounds;
};
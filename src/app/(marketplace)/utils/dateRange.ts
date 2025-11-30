import { format, isSameDay } from 'date-fns';

export const formatReservationDateRange = (
  startDateInput: string | Date,
  endDateInput?: string | Date | null,
) => {
  const startDate = new Date(startDateInput);
  const endDate = endDateInput ? new Date(endDateInput) : null;

  if (!Number.isFinite(startDate.getTime())) {
    return 'Invalid date';
  }

  const startLabel = format(startDate, 'MMM do');
  const startYear = format(startDate, 'yyyy');

  const hasValidEndDate = endDate && Number.isFinite(endDate.getTime());

  if (!hasValidEndDate) {
    return `${startLabel}, ${startYear}`;
  }

  const endLabel = format(endDate, 'MMM do');
  const endYear = format(endDate, 'yyyy');

  if (isSameDay(startDate, endDate)) {
    return `${startLabel}, ${startYear}`;
  }

  if (startYear === endYear) {
    return `${startLabel} - ${endLabel}, ${startYear}`;
  }

  return `${format(startDate, 'MMM do, yyyy')} - ${format(endDate, 'MMM do, yyyy')}`;
};

export default formatReservationDateRange;
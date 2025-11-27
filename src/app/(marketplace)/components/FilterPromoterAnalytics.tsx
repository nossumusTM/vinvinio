'use client';

import FilterHostAnalytics, { HostAnalyticsFilter } from './FilterHostAnalytics';

export type PromoterAnalyticsFilter = HostAnalyticsFilter;

interface FilterPromoterAnalyticsProps {
  filter: PromoterAnalyticsFilter;
  selectedDate: Date;
  onFilterChange: (filter: PromoterAnalyticsFilter) => void;
  onDateChange: (date: Date) => void;
}

const FilterPromoterAnalytics: React.FC<FilterPromoterAnalyticsProps> = ({
  filter,
  selectedDate,
  onFilterChange,
  onDateChange,
}) => {
  return (
    <FilterHostAnalytics
      filter={filter}
      selectedDate={selectedDate}
      onFilterChange={onFilterChange}
      onDateChange={onDateChange}
    />
  );
};

export default FilterPromoterAnalytics;
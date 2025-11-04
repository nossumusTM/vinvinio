'use client';

import { useMemo } from 'react';
import { DateRange, Range, RangeKeyDict } from 'react-date-range';
import clsx from 'clsx';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export interface SearchCalendarProps {
  value: Range;
  onChange: (value: RangeKeyDict) => void;
  minDate?: Date;
  disabledDates?: Date[];
  className?: string;
}

const SearchCalendar: React.FC<SearchCalendarProps> = ({
  value,
  onChange,
  minDate,
  disabledDates = [],
  className,
}) => {
  const ranges = useMemo(() => [value], [value]);

  return (
    <div
      className={clsx(
        'relative w-full rounded-[24px] bg-white/90 p-2 shadow-sm shadow-black/5',
        className,
      )}
    >
      <DateRange
        onChange={onChange}
        moveRangeOnFirstSelection={false}
        ranges={ranges}
        minDate={minDate ?? new Date()}
        direction="vertical"
        showDateDisplay={false}
        fixedHeight
        rangeColors={['#09090b']}
        disabledDates={disabledDates}
        weekdayDisplayFormat="EE"
      />
    </div>
  );
};

export default SearchCalendar;


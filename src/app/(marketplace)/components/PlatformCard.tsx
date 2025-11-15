'use client';

import { useState } from 'react';
import { Card, CardContent } from './navbar/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';

import { motion, AnimatePresence } from 'framer-motion';

import {
  MIN_PARTNER_COMMISSION,
  MAX_PARTNER_POINT_VALUE,
  getPuntiLabel,
} from "@/app/(marketplace)/constants/partner";

interface DataEntry {
  date: string;
  revenue: number;
  platformFee: number;
  bookingCount: number;
}

export type PlatformCardProps = {
  daily: DataEntry[];
  monthly: DataEntry[];
  yearly: DataEntry[];
  totalRevenue: number;

  // make these optional
  partnerCommission?: number;
  punti?: number;
  puntiShare?: number;
  puntiLabel?: string;
};

const PlatformCard: React.FC<PlatformCardProps> = ({
  daily,
  monthly,
  yearly,
  totalRevenue,
  partnerCommission = MIN_PARTNER_COMMISSION,
  punti = 0,
  puntiShare = 0,
  puntiLabel,
}) => {

  const resolvedPuntiLabel =
    typeof puntiLabel === "string" ? puntiLabel : getPuntiLabel(punti);

  const [view, setView] = useState<'daily' | 'monthly' | 'yearly' | 'all'>('daily');
  const [activeInfo, setActiveInfo] = useState<'dbc' | 'dpv' | 'atv' | null>(null);
  const { formatConverted, currency } = useCurrencyFormatter();

  const [activeMetric, setActiveMetric] = useState<'DBC' | 'DPV' | 'ATV' | null>(null);

  const metricDescriptions: Record<'DBC' | 'DPV' | 'ATV', string> = {
    DBC: 'D.B.C — Daily Booking Count (bookings in the last 24 hours).',
    DPV: 'D.P.V — Daily Profit Value (platform fee in the last 24 hours).',
    ATV: 'A.T.V — All Time Value (aggregated revenue for the selected period).',
  };

  const dataMap = {
    daily,
    monthly,
    yearly,
    all: [
        ...daily.map((d) => ({ ...d, period: 'Daily' })),
        ...monthly.map((m) => ({ ...m, period: 'Monthly' })),
        ...yearly.map((y) => ({ ...y, period: 'Yearly' })),
      ],
  };

  const currentData = dataMap[view];

  const parseEntryDate = (value: string) => {
    const normalized = value.includes('T') ? value : `${value}T00:00:00`;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const now = new Date();
  const twentyFourHoursAgo = now.getTime() - 24 * 60 * 60 * 1000;

  const lastTwentyFourHourEntries = daily.filter((entry) => {
    const entryDate = parseEntryDate(entry.date);
    if (!entryDate) {
      return false;
    }
    const timestamp = entryDate.getTime();
    return timestamp <= now.getTime() && timestamp >= twentyFourHoursAgo;
  });

  const bookingsLast24Hours = lastTwentyFourHourEntries.reduce(
    (acc, entry) => acc + (Number(entry.bookingCount) || 0),
    0
  );

  const profitLast24Hours = lastTwentyFourHourEntries.reduce(
    (acc, entry) => acc + (Number(entry.platformFee) || 0),
    0
  );

  const summaryLabel =
    view === 'daily'
      ? 'A.T.V'
      : view === 'monthly'
      ? 'M.R.V'
      : view === 'yearly'
      ? 'Y.R.V'
      : 'A.T.V';

  const summaryValue =
    view === 'all'
      ? totalRevenue
      : view === 'daily'
      ? totalRevenue
      : currentData.reduce((acc, cur) => acc + (Number(cur.revenue) || 0), 0);

  return (
    <Card className="w-full bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
      <CardContent>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div
            className="
              flex flex-col
              md:flex-row md:items-start md:justify-between
              gap-4 md:gap-6
              pt-4
            "
          >
            {/* LEFT — Title */}
            <div className="flex-1">
              <p className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wide">
                Platform Activity
              </p>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-2">
                Economic Overview
              </h2>
            </div>

            {/* RIGHT — Buttons + Values */}
            <div
              className="
                flex flex-col
                items-stretch
                md:items-end
                gap-3 md:gap-4
                w-full md:w-auto
              "
            >
              {/* Values row */}
              <div
                className="
                  flex flex-wrap
                  justify-center
                  gap-3 sm:gap-4 md:gap-6
                  w-full
                "
              >
               {/* D.B.C */}
<div className="relative flex flex-col items-center min-w-[90px]">
  <p
    className="
      text-[11px] sm:text-xs md:text-sm
      text-black
      bg-gradient-to-br from-gray-100 to-gray-200
      px-3 py-1.5 md:px-4 md:py-2
      font-semibold
      rounded-xl
      mb-1.5 md:mb-2
      select-none
      cursor-pointer
    "
    onMouseEnter={() => setActiveInfo('dbc')}
    onMouseLeave={() => setActiveInfo((prev) => (prev === 'dbc' ? null : prev))}
    onClick={() =>
      setActiveInfo((prev) => (prev === 'dbc' ? null : 'dbc'))
    }
  >
    D.B.C (24h)
  </p>
  <p className="text-base sm:text-lg md:text-xl font-semibold text-black">
    {bookingsLast24Hours}
  </p>

  <AnimatePresence>
    {activeInfo === 'dbc' && (
      <motion.div
        key="info-dbc"
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="
          absolute top-full mt-2
          w-44
          rounded-xl
          bg-black text-white
          text-[11px] sm:text-xs
          px-3 py-2
          shadow-lg
          z-20
        "
      >
        <span className="font-semibold">D.B.C</span> – Daily Booking Count
        over the last 24 hours.
      </motion.div>
    )}
  </AnimatePresence>
</div>

{/* D.P.V */}
<div className="relative flex flex-col items-center min-w-[90px]">
  <p
    className="
      text-[11px] sm:text-xs md:text-sm
      text-white
      bg-black
      shadow-lg
      px-3 py-1.5 md:px-4 md:py-2
      font-semibold
      rounded-xl
      mb-1.5 md:mb-2
      select-none
      cursor-pointer
    "
    onMouseEnter={() => setActiveInfo('dpv')}
    onMouseLeave={() => setActiveInfo((prev) => (prev === 'dpv' ? null : prev))}
    onClick={() =>
      setActiveInfo((prev) => (prev === 'dpv' ? null : 'dpv'))
    }
  >
    D.P.V (24h)
  </p>
  <p className="text-base sm:text-lg md:text-xl font-semibold text-black">
    {formatConverted(profitLast24Hours)}
  </p>

  <AnimatePresence>
    {activeInfo === 'dpv' && (
      <motion.div
        key="info-dpv"
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="
          absolute top-full mt-2
          w-48
          rounded-xl
          bg-black text-white
          text-[11px] sm:text-xs
          px-3 py-2
          shadow-lg
          z-20
        "
      >
        <span className="font-semibold">D.P.V</span> – Daily Profit Value
        earned by the platform in the last 24 hours.
      </motion.div>
    )}
  </AnimatePresence>
</div>

{/* A.T.V */}
<div className="relative flex flex-col items-center min-w-[90px]">
  <p
    className="
      text-[11px] sm:text-xs md:text-sm
      text-black
      bg-gradient-to-br from-gray-100 to-gray-200
      px-3 py-1.5 md:px-4 md:py-2
      font-semibold
      rounded-xl
      mb-1.5 md:mb-2
      select-none
      cursor-pointer
    "
    onMouseEnter={() => setActiveInfo('atv')}
    onMouseLeave={() => setActiveInfo((prev) => (prev === 'atv' ? null : prev))}
    onClick={() =>
      setActiveInfo((prev) => (prev === 'atv' ? null : 'atv'))
    }
  >
    {summaryLabel}
  </p>
  <p className="text-base sm:text-lg md:text-xl font-semibold text-black">
    {formatConverted(summaryValue)}
  </p>

  <AnimatePresence>
    {activeInfo === 'atv' && (
      <motion.div
        key="info-atv"
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="
          absolute top-full mt-2
          w-48
          rounded-xl
          bg-black text-white
          text-[11px] sm:text-xs
          px-3 py-2
          shadow-lg
          z-20
        "
      >
        <span className="font-semibold">{summaryLabel}</span> – All-time
        value or period revenue, depending on the view.
      </motion.div>
    )}
  </AnimatePresence>
</div>

              </div>

              {/* Buttons row */}
              <div className="flex flex-wrap gap-2 w-full justify-center md:justify-end">
                {(['daily', 'monthly', 'yearly', 'all'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setView(type)}
                    className={`
                      px-3 py-1.5 md:px-4 md:py-2
                      rounded-full
                      text-xs sm:text-sm
                      transition
                      ${
                        view === type
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={currentData}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="6 6" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(val) => formatConverted(val)}
                  label={{ value: `Revenue (${currency})`, angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                    formatter={(value: number, name: string) => {
                        if (name === 'bookingCount') {
                        return [value, 'Bookings'];
                        }

                        const formatted = formatConverted(Number(value));
                        if (name === 'platformFee') {
                        return [formatted, 'Platform Fee'];
                        }
                        if (name === 'revenue') {
                        return [formatted, 'Total Revenue'];
                        }
                        return [formatted, name];
                    }}
                    labelFormatter={(label: string) => `Date: ${label}`}
                    contentStyle={{
                        borderRadius: '10px',
                        fontSize: '14px',
                    }}
                    cursor={{ stroke: '#3604ff', strokeWidth: 1 }}
                />
                <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3604ff"
                    strokeWidth={2}
                    />
                    <Line
                    type="monotone"
                    dataKey="platformFee"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    />
                    <Line
                    type="monotone"
                    dataKey="bookingCount"
                    stroke="#10b981"
                    strokeWidth={2}
                    />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformCard;

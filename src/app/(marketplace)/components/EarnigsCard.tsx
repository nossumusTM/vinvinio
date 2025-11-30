'use client';

import { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent } from './navbar/Card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';

interface EarningsEntry {
  date: string; // ISO date or formatted date
  amount: number;
  books?: number;
}

interface EarningsCardProps {
  title?: string;
  dailyData: EarningsEntry[];
  monthlyData: EarningsEntry[];
  yearlyData: EarningsEntry[];
  totalEarnings: number; // ✅ new field
  revenueTotals?: Record<'daily' | 'monthly' | 'yearly' | 'all', number>;
  todaysProfit?: number;
  roleLabel: 'Host' | 'Promoter';
  hostShare?: number;
  sourceCurrency?: string;
}

const EarningsCard: React.FC<EarningsCardProps> = ({
  title,
  dailyData,
  monthlyData,
  yearlyData,
  roleLabel,
  totalEarnings,
  revenueTotals,
  todaysProfit,
  hostShare = 0,
  sourceCurrency
}) => {

  const [view, setView] = useState<'daily' |'monthly' | 'yearly' | 'all'>('daily');
  const [activeInfo, setActiveInfo] = useState<'profit' | 'total' | null>(null);
  const { formatConverted, currency, baseCurrency } = useCurrencyFormatter();
  const fromCurrency = sourceCurrency ?? baseCurrency;

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 60_000); // update every minute

    return () => clearInterval(id);
  }, []);

  // Normalize revenue so that the chart always shows *Pre-Withdrawal* values
  const commissionMultiplier =
    roleLabel === 'Promoter'
      ? 0.1
      : (() => {
          if (typeof hostShare !== 'number' || hostShare <= 0) return 1;
          return hostShare > 1 ? hostShare / 100 : hostShare;
        })();

  const dailyDataAdjusted = useMemo(
    () =>
      dailyData.map((e) => ({
        ...e,
        amount: e.amount * commissionMultiplier,
      })),
    [dailyData, commissionMultiplier],
  );

  const monthlyDataAdjusted = useMemo(
    () =>
      monthlyData.map((e) => ({
        ...e,
        amount: e.amount * commissionMultiplier,
      })),
    [monthlyData, commissionMultiplier],
  );

  const yearlyDataAdjusted = useMemo(
    () =>
      yearlyData.map((e) => ({
        ...e,
        amount: e.amount * commissionMultiplier,
      })),
    [yearlyData, commissionMultiplier],
  );

  const dataMap = {
    daily: dailyDataAdjusted,
    monthly: monthlyDataAdjusted,
    yearly: yearlyDataAdjusted,
  };

    const currentDataRaw = useMemo(() => {
    switch (view) {
      case 'daily':
        return dailyData;
      case 'monthly':
        return monthlyData;
      case 'yearly':
        return yearlyData;
      case 'all':
      default:
        // "All" → full timeline; prefer daily if available,
        // otherwise fall back to monthly, then yearly
        if (dailyData.length) return dailyData;
        if (monthlyData.length) return monthlyData;
        return yearlyData;
    }
  }, [view, dailyData, monthlyData, yearlyData]);

  const currentData = useMemo(() => {
    const data = [...currentDataRaw];

    data.sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();

      if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) {
        // fallback to string comparison if parsing fails
        return String(a.date).localeCompare(String(b.date));
      }

      return aTime - bTime; // oldest on the left, newest on the right
    });

    return data;
  }, [currentDataRaw]);

  const sortedData = useMemo(() => {
    const data = [...currentData];

    data.sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();

      if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) {
        // fallback to string comparison if date parsing fails
        return String(a.date).localeCompare(String(b.date));
      }

      return aTime - bTime; // oldest on the left, newest on the right
    });

    return data;
  }, [currentData]);

  const chartData = useMemo(
    () =>
      sortedData.map((entry) => ({
        ...entry,
        amount: entry.amount * commissionMultiplier, // Pre-Withdrawal Revenue
      })),
    [sortedData, commissionMultiplier],
  );

  const fallbackRevenueTotals = useMemo(
    () => ({
      daily: dailyData.reduce((sum, entry) => sum + entry.amount, 0),
      monthly: monthlyData.reduce((sum, entry) => sum + entry.amount, 0),
      yearly: yearlyData.reduce((sum, entry) => sum + entry.amount, 0),
      all: totalEarnings,
    }),
    [dailyData, monthlyData, totalEarnings, yearlyData],
  );

  const displayRevenueTotals = revenueTotals ?? fallbackRevenueTotals;

  const totalBase =
    view === 'all'
      ? totalEarnings
      : displayRevenueTotals[view];

  const totalDisplay = Number(totalBase.toFixed(2));

  // const commissionMultiplier = useMemo(() => {
  //   if (roleLabel === 'Promoter') {
  //     return 0.1; // 10% of total revenue
  //   }
  //   // hostShare might be 0.65 or 65 – normalize to 0–1
  //   if (typeof hostShare !== 'number' || hostShare <= 0) return 1; // fallback: 100%
  //   return hostShare > 1 ? hostShare / 100 : hostShare;
  // }, [roleLabel, hostShare]);

  const todaysProfitValue = useMemo(() => {
    const todayStr = now.toDateString();

    // 1️⃣ Prefer computing from detailed dailyData
    if (Array.isArray(dailyData) && dailyData.length > 0) {
      return dailyData.reduce((sum, entry) => {
        const entryDate = new Date(entry.date);
        if (Number.isNaN(entryDate.getTime())) return sum;

        if (entryDate.toDateString() === todayStr) {
          // use total revenue * role-specific share
          return sum + entry.amount * commissionMultiplier;
        }
        return sum;
      }, 0);
    }

    // 2️⃣ Fallback: if no dailyData, trust precomputed todaysProfit from backend
    if (typeof todaysProfit === 'number') {
      return todaysProfit;
    }

    return 0;
  }, [dailyData, todaysProfit, now, commissionMultiplier]);

  const revenueLabel = view === 'monthly'
    ? 'Total Revenue'
    : view === 'all'
    ? 'Total Revenue'
    : `${view.charAt(0).toUpperCase() + view.slice(1)} Total`;

  const isTouch = typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

    console.log('[EarningsCard] view, totalEarnings, totalBase, hostShare =', {
      view,
      totalEarnings,
      totalBase,
      hostShare,
    });

  return (
    <Card className="w-full bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
      <CardContent>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="pt-4 flex flex-col justify-between items-baseline sm:flex-row sm:justify-between sm:items-center">
            <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">{roleLabel} Earnings</p>
                <h2 className="text-lg md:text-2xl font-bold text-black mb-2">{title || 'Earnings Overview'}</h2>
            </div>

            <div className="mb-3 mt-3 flex flex-wrap gap-4 pt-3 sm:mb-0 sm:flex-row sm:justify-baseline">
              <div className="relative flex flex-col items-center justify-center">
               <p
                  className="select-none rounded-xl bg-gradient-to-r from-blue-200 to-cyan-200 p-3 text-sm text-white cursor-pointer"
                  onMouseEnter={() => {
                    if (!isTouch) setActiveInfo("profit");
                  }}
                  onMouseLeave={() => {
                    if (!isTouch) setActiveInfo((prev) => (prev === "profit" ? null : prev));
                  }}
                  onClick={() =>
                    setActiveInfo((prev) => (prev === "profit" ? null : "profit"))
                  }
                >
                  Today&#39;s Profit
                </p>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`profit-${todaysProfitValue}`}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="text-lg font-semibold text-black"
                  >
                    {formatConverted(todaysProfitValue, fromCurrency)}
                  </motion.span>
                </AnimatePresence>

                <AnimatePresence>
                  {activeInfo === 'profit' && (
                    <motion.div
                      key="info-profit"
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute top-full mt-2 w-52 rounded-xl bg-black text-white text-[11px] sm:text-xs px-3 py-2 shadow-lg z-20"
                    >
                      <span className="font-semibold">Today&#39;s Profit</span> – Your net
                      earnings recorded for today based on your host share.
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* <div className="relative flex flex-col items-center justify-center">
                <p
                  className="select-none rounded-xl bg-neutral-900 p-3 text-sm text-white cursor-pointer"
                  onClick={() =>
                    setActiveInfo((prev) => (prev === 'total' ? null : 'total'))
                  }
                >
                  {revenueLabel}
                </p>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`total-${view}-${totalDisplay}`}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="text-lg font-semibold text-black"
                  >
                    {formatConverted(totalBase, fromCurrency)}
                  </motion.span>
                </AnimatePresence>

                <AnimatePresence>
                  {activeInfo === 'total' && (
                    <motion.div
                      key="info-total"
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute top-full mt-2 w-56 rounded-xl bg-black text-white text-[11px] sm:text-xs px-3 py-2 shadow-lg z-20"
                    >
                      <span className="font-semibold">{revenueLabel}</span> – Net revenue
                      for the selected range; "All" shows your all-time earnings.
                    </motion.div>
                  )}
                </AnimatePresence>

              </div> */}
            </div>

            <div className="mt-4 flex gap-2 sm:mt-0">
              {(['daily', 'monthly', 'yearly', 'all'] as const).map((type) => (
                <motion.button
                  key={type}
                  onClick={() => setView(type)}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -2 }}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    view === type
                      ? 'bg-black text-white'
                      : 'bg-neutral-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </motion.button>
              ))}
            </div>
            </div>

          {/* Chart */}
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="6 6" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(val) => formatConverted(val, fromCurrency)} />
                <YAxis label={{ value: `Income (${currency})`, angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="left" tickFormatter={(val) => formatConverted(val, fromCurrency)} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val} books`} />
                <Tooltip
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'amount') {
                      return [formatConverted(value, fromCurrency), 'Income'];
                    }
                    if (name === 'books') {
                      return [`${value} ${value === 1 ? 'Booking' : 'Bookings'}`, 'Books'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label: string) => `Date: ${label}`}
                  contentStyle={{ borderRadius: '10px', fontSize: '14px' }}
                  cursor={{ stroke: '#3604ff', strokeWidth: 1 }}
                />
                <Line type="monotone" dataKey="amount" stroke="#3604ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="books" stroke="#00C49F" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsCard;
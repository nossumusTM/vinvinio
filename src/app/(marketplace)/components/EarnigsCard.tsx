'use client';

import { useMemo, useState } from 'react';
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
  roleLabel: 'Host' | 'Promoter';
}

const EarningsCard: React.FC<EarningsCardProps> = ({
  title,
  dailyData,
  monthlyData,
  yearlyData,
  roleLabel,
  totalEarnings
}) => {

  const [view, setView] = useState<'daily' | 'monthly' | 'yearly' | 'all'>('daily');
  const { formatConverted, currency } = useCurrencyFormatter();

  const dataMap = {
    daily: dailyData,
    monthly: monthlyData,
    yearly: yearlyData,
  };

  const currentData = view === 'all'
    ? Array.from(new Set([...dailyData.map((d) => d.date)]))
        .map((date) => dailyData.find((d) => d.date === date)!)
    : dataMap[view];

  const total = view === 'daily'
    ? totalEarnings
    : currentData.reduce((sum, entry) => sum + entry.amount, 0);

  const todaysProfitValue = useMemo(() => {
    const today = new Date().toDateString();
    return dailyData.find((d) => new Date(d.date).toDateString() === today)?.amount || 0;
  }, [dailyData]);

  const totalDisplay = Number(total.toFixed(2));
  const revenueLabel = view === 'daily'
    ? 'Total Revenue'
    : view === 'all'
    ? 'Total Revenue'
    : `${view.charAt(0).toUpperCase() + view.slice(1)} Total`;

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
              <div className="flex flex-col items-center justify-center">
                <p className="select-none rounded-xl bg-gradient-to-br from-[#08e2ff] to-[#3F00FF] p-3 text-sm text-white">
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
                    {formatConverted(todaysProfitValue)}
                  </motion.span>
                </AnimatePresence>
              </div>

              <div className="flex flex-col items-center justify-center">
                <p className="select-none rounded-xl bg-gradient-to-br from-gray-800 to-gray-700 p-3 text-sm text-white">
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
                    {formatConverted(totalDisplay)}
                  </motion.span>
                </AnimatePresence>
              </div>
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
              <LineChart data={currentData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="6 6" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(val) => formatConverted(val)} />
                <YAxis label={{ value: `Income (${currency})`, angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="left" tickFormatter={(val) => formatConverted(val)} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val} books`} />
                <Tooltip
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'amount') {
                      return [formatConverted(value), 'Income'];
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

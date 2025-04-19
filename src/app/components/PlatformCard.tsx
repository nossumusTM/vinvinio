'use client';

import { useState } from 'react';
import { Card, CardContent } from '../components/navbar/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/app/utils/format';

interface DataEntry {
  date: string;
  revenue: number;
  platformFee: number;
  bookingCount: number;
}

interface PlatformCardProps {
  daily: DataEntry[];
  monthly: DataEntry[];
  yearly: DataEntry[];
  totalRevenue: number;
}

const PlatformCard: React.FC<PlatformCardProps> = ({
  daily,
  monthly,
  yearly,
  totalRevenue
}) => {
  const [view, setView] = useState<'daily' | 'monthly' | 'yearly' | 'all'>('daily');

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

  const latest = currentData[currentData.length - 1] || {
    revenue: 0,
    platformFee: 0,
    bookingCount: 0,
  };

  const totals = [...daily, ...monthly, ...yearly].reduce(
    (acc, cur) => {
      acc.revenue += cur.revenue;
      acc.platformFee += cur.platformFee;
      acc.bookingCount += cur.bookingCount;
      return acc;
    },
    { revenue: 0, platformFee: 0, bookingCount: 0 }
  );

  return (
    <Card className="w-full bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
      <CardContent>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="pt-4 flex flex-col justify-between items-baseline sm:flex-row sm:justify-between sm:items-center">
    <div>
      <p className="text-sm text-gray-500 uppercase tracking-wide">Platform Activity</p>
      <h2 className="text-2xl font-bold text-black mb-2">Economic Overview</h2>
    </div>

    <div className="mb-3 md:mb-0 flex flex-wrap sm:flex-row sm:justify-baseline gap-6">
      <div className="flex flex-col items-center">
        <p className="text-sm text-gray-500">D.B.C</p>
        <p className="text-lg font-semibold text-black">
          {daily?.[daily.length - 1]?.bookingCount || 0}
        </p>
      </div>

      <div className="flex flex-col items-center">
        <p className="text-sm text-gray-500">D.P.V</p>
        <p className="text-lg font-semibold text-black">
          €{daily?.[daily.length - 1]?.platformFee?.toFixed(2) || '0.00'}
        </p>
      </div>

      <div className="flex flex-col items-center">
        <p className="text-sm text-gray-500">T.R.V</p>
        <p className="text-lg font-semibold text-black">
            €{view === 'all'
        ? totalRevenue.toFixed(2)               // ✅ true all-time revenue
        : currentData.reduce((acc, cur) => acc + cur.revenue, 0).toFixed(2)}
        </p>
      </div>
    </div>

    <div className="flex gap-2 mt-4 sm:mt-0">
    {(['daily', 'monthly', 'yearly', 'all'] as const).map((type) => (
        <button
            key={type}
            onClick={() => setView(type)}
            className={`px-4 py-2 mb-4 rounded-full text-sm transition ${
            view === type
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
        ))}
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
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labelMap: Record<string, string> = {
                      revenue: 'Total Revenue',
                      platformFee: 'Platform Fee',
                      bookingCount: 'Bookings',
                    };
                    return [`€${value}`, labelMap[name] ?? name];
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
                  name="Total Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="platformFee"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Platform Fee"
                />
                <Line
                  type="monotone"
                  dataKey="bookingCount"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Bookings"
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

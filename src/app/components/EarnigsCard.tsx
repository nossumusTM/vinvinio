'use client';

import { useState } from 'react';
import { Card, CardContent } from '../components/navbar/Card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/app/utils/format';

interface EarningsEntry {
  date: string; // ISO date or formatted date
  amount: number;
}

interface EarningsCardProps {
  title?: string;
  dailyData: EarningsEntry[];
  monthlyData: EarningsEntry[];
  yearlyData: EarningsEntry[];
  roleLabel: 'Host' | 'Promoter';
}

const EarningsCard: React.FC<EarningsCardProps> = ({
  title,
  dailyData,
  monthlyData,
  yearlyData,
  roleLabel,
}) => {
  const [view, setView] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

  const dataMap = {
    daily: dailyData,
    monthly: monthlyData,
    yearly: yearlyData,
  };

  const currentData = dataMap[view];

  return (
    <Card className="w-full bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
      <CardContent>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col justify-between items-baseline sm:flex-row sm:justify-between sm:items-center">
            <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">{roleLabel} Earnings</p>
                <h2 className="text-2xl font-bold text-black mb-2">{title || 'Earnings Overview'}</h2>
            </div>

            <div className="flex gap-2 mt-4 sm:mt-0">
                {(['daily', 'monthly', 'yearly'] as const).map((type) => (
                <button
                    key={type}
                    onClick={() => setView(type)}
                    className={`px-4 py-2 rounded-full text-sm transition ${
                    view === type
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
                ))}
            </div>
            </div>

          {/* Chart */}
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="6 6" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(val) => `€${val}`} />
                <YAxis label={{ value: 'Income (€)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                    formatter={(value: number) => [`€${value}`, 'Income']} // Label override
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label: string) => `Date: ${label}`}
                  contentStyle={{ borderRadius: '10px', fontSize: '14px' }}
                  cursor={{ stroke: '#3604ff', strokeWidth: 1 }}
                />
                <Line type="monotone" dataKey="amount" stroke="#3604ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsCard;

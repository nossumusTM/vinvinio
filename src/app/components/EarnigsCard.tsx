'use client';

import { useState } from 'react';
import { Card, CardContent } from '../components/navbar/Card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/app/utils/format';

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

  const dataMap = {
    daily: dailyData,
    monthly: monthlyData,
    yearly: yearlyData,
  };

  const currentData = view === 'all'
  ? Array.from(new Set([...dailyData.map(d => d.date)])) // Deduplicate if needed
      .map(date => dailyData.find(d => d.date === date)!)
  : dataMap[view];

  //   const total = currentData.reduce((sum, entry) => sum + entry.amount, 0);
  const total = view === 'daily'
    ? totalEarnings
    : currentData.reduce((sum, entry) => sum + entry.amount, 0);

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

            <div className="mb-3 md:mb-0 pt-3 flex flex-wrap sm:flex-row sm:justify-baseline gap-4">
                <div className="flex flex-col justify-center items-center">
                    <p className="text-sm text-white bg-gradient-to-br from-[#08e2ff] to-[#3F00FF] p-3 rounded-xl mb-2 select-none">Today&#39;s Profit</p>
                    <p className="text-lg font-semibold text-black">
                    {/* {formatCurrency(dailyData?.[dailyData.length - 1]?.amount || 0)} */}

                    {formatCurrency(
                        dailyData.find((d) => new Date(d.date).toDateString() === new Date().toDateString())?.amount || 0
                        )}
                    </p>
                </div>
                
                <div className="flex flex-col justify-center items-center">
                    <p className="text-sm text-white bg-gradient-to-br from-gray-800 to-gray-700 p-3 rounded-xl mb-2 select-none">
                    {view === 'daily'
                        ? 'Total Revenue'
                        : view === 'all'
                        ? 'Total Revenue'
                        : `${view.charAt(0).toUpperCase() + view.slice(1)} Total`}
                    </p>
                    <p className="text-lg font-semibold text-black">
                        {formatCurrency(Number(total.toFixed(2)))}
                    </p>
                </div>
            </div>

            <div className="flex gap-2 mt-4 sm:mt-0">
            {(['daily', 'monthly', 'yearly', 'all'] as const).map((type) => (
                <button
                    key={type}
                    onClick={() => setView(type)}
                    className={`px-4 py-2 rounded-full text-sm transition ${
                    view === type
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 text-gray-700 hover:bg-gray-200'
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
              <LineChart data={currentData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="6 6" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                {/* <YAxis tickFormatter={(val) => `€${val}`} /> */}
                <YAxis tickFormatter={(val) => `€${val.toFixed(2)}`} />
                <YAxis label={{ value: 'Income (€)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="left" tickFormatter={(val) => `€${val.toFixed(2)}`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val} books`} />
                {/* <Tooltip
                  formatter={(value: number) => [`€${value.toFixed(2)}`, 'Income']}
                  labelFormatter={(label: string) => `Date: ${label}`}
                  contentStyle={{ borderRadius: '10px', fontSize: '14px' }}
                  cursor={{ stroke: '#3604ff', strokeWidth: 1 }}
                /> */}
                <Tooltip
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'amount') {
                      return [`€${value.toFixed(2)}`, 'Income'];
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

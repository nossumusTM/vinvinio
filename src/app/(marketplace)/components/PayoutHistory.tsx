import { useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface EarningsEntry {
  date: string;
  amount: number;
  books?: number;
}

export interface PayoutRecord {
  id: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  phase?: number | null;
  period?: string | null;
  createdAt?: string | null;
}

interface PayoutHistoryProps {
  open: boolean;
  onClose: () => void;
  earnings: {
    monthly: EarningsEntry[];
    yearly: EarningsEntry[];
    currency?: string;
    totalEarnings?: number;
    revenueTotals?: Record<"daily" | "monthly" | "yearly" | "all", number>;
  };
  payouts?: PayoutRecord[];
  baseCurrency: string;
  formatConverted: (value: number, currency?: string) => string;
  currencySymbol: string;
}

const PayoutHistory: React.FC<PayoutHistoryProps> = ({
  open,
  onClose,
  earnings,
  payouts = [],
  baseCurrency,
  formatConverted,
  currencySymbol,
}) => {
  const [payoutHistoryFilter, setPayoutHistoryFilter] = useState<"month" | "year">("month");

  const formatPayoutPeriod = useCallback((period: string) => {
    if (!period) return "Unknown period";

    if (period.length === 4) return period;

    if (period.length === 7) {
      const [year, month] = period.split("-");
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
      return new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
    }

    const parsed = new Date(period);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
      }).format(parsed);
    }

    return period;
  }, []);

  const payoutHistoryEntries = useMemo(() => {
    const baseCurrencyForEarnings = earnings.currency ?? baseCurrency;

    const payoutStatusFor = (period: string, phase: number) =>
      payouts.find((record) => record.period === period && Number(record.phase) === phase);

    if (payoutHistoryFilter === "year") {
      const byYear = new Map<string, { amount: number; books: number; status?: PayoutRecord["status"] }>();

      earnings.yearly.forEach((entry) => {
        byYear.set(entry.date, {
          amount: entry.amount,
          books: entry.books ?? 0,
          status: payouts.some((payout) => payout.period?.startsWith(entry.date))
            ? "payout_sent"
            : "processing",
        });
      });

      return Array.from(byYear.entries()).map(([date, { amount, books, status }]) => ({
        id: date,
        label: formatPayoutPeriod(date),
        amountLabel: formatConverted(amount ?? 0, baseCurrencyForEarnings),
        count: books ?? 0,
        status: status ?? "processing",
        phaseLabel: "Full year",
      }));
    }

    return earnings.monthly.flatMap((entry) => {
      const baseLabel = formatPayoutPeriod(entry.date);
      const halfAmount = (entry.amount ?? 0) / 2;

      return [1, 2].map((phase) => {
        const existing = payoutStatusFor(entry.date, phase);
        const status = existing?.status ?? "processing";
        const displayAmount = existing?.amount ?? halfAmount;

        return {
          id: `${entry.date}-phase-${phase}`,
          label: `${baseLabel} — ${phase === 1 ? "First" : "Second"} phase`,
          amountLabel: formatConverted(displayAmount, existing?.currency ?? baseCurrencyForEarnings),
          count: entry.books ?? 0,
          status,
          phaseLabel: phase === 1 ? "Phase 1" : "Phase 2",
        };
      });
    });
  }, [baseCurrency, earnings.currency, earnings.monthly, earnings.yearly, formatConverted, formatPayoutPeriod, payoutHistoryFilter, payouts]);

  const totalPayoutLabel = formatConverted(
    earnings.revenueTotals?.all ?? earnings.totalEarnings ?? 0,
    earnings.currency ?? baseCurrency,
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="payout-history-backdrop"
            className="fixed inset-0 z-[100] flex h-screen min-h-screen w-full items-start bg-black/30 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={onClose}
          />

          <motion.aside
            key="payout-history-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed right-0 top-0 z-[101] m-[8px] flex h-[calc(100dvh-16px)] w-fit min-w-[360px] max-w-md flex-col rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="border-b border-neutral-100 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-neutral-900">Payout history</p>
                  <p className="text-xs text-neutral-500">Review recent deposits and totals.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:text-neutral-900"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full bg-neutral-100 p-1 text-xs font-medium text-neutral-700">
                  {["month", "year"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPayoutHistoryFilter(option as "month" | "year")}
                      className={`rounded-full px-3 py-1 transition ${
                        payoutHistoryFilter === option
                          ? "bg-black text-white"
                          : "text-neutral-700 hover:bg-white"
                      }`}
                    >
                      {option === "month" ? "Monthly" : "Yearly"}
                    </button>
                  ))}
                </div>

                <div className="ml-auto flex items-center gap-2 rounded-full bg-neutral-50 px-3 py-2 text-[11px] font-semibold uppercase text-neutral-600">
                  <span>All-time payouts ({currencySymbol})</span>
                  <span className="text-black">{totalPayoutLabel}</span>
                </div>
              </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-6 pr-7">
              {payoutHistoryEntries.length ? (
                payoutHistoryEntries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-neutral-500">{entry.label}</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{entry.amountLabel}</p>
                        <p className="text-xs text-neutral-500">{entry.count || 0} payout(s)</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
                              entry.status === "payout_sent"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                            }`}
                          >
                            <span
                              className={`block h-2 w-2 rounded-full ${
                                entry.status === "payout_sent" ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            {entry.status === "payout_sent" ? "Payout made" : "Processing"}
                          </span>
                          {entry.phaseLabel && (
                            <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-neutral-700">
                              {entry.phaseLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-600">
                        {payoutHistoryFilter === "year" ? "Yearly" : "Monthly"}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                  <p className="font-semibold text-neutral-700">No payout history yet</p>
                  <p className="mt-1 text-xs text-neutral-500">Your payouts will appear here once they are processed.</p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default PayoutHistory;
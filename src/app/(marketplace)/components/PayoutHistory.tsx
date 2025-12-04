import { useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AiOutlineBell, AiOutlineClose } from "react-icons/ai";

export type PayoutRecord = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  status?: "processing" | "payout_sent" | "payout_received" | string;
  phase?: number | null;
  period?: string | null;
  createdAt?: string | null;
  processedAt?: string | null;
  notes?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
};

interface PayoutHistoryProps {
  open: boolean;
  onClose: () => void;
  payouts?: PayoutRecord[];
  baseCurrency: string;
  formatConverted: (value: number, currency?: string) => string;
  currencySymbol: string;
}

const PayoutHistory: React.FC<PayoutHistoryProps> = ({
  open,
  onClose,
  payouts = [],
  baseCurrency,
  formatConverted,
  currencySymbol,
}) => {
  const [payoutHistoryFilter, setPayoutHistoryFilter] = useState<"month" | "year">("month");

  const parsePayoutDate = useCallback((record: PayoutRecord) => {
    if (record.period) {
      const normalizedPeriod = record.period.length === 4 ? `${record.period}-01` : record.period;
      const attempt = Date.parse(`${normalizedPeriod}-01T00:00:00Z`);
      if (!Number.isNaN(attempt)) {
        return new Date(attempt);
      }
    }

    if (record.processedAt) {
      const parsed = Date.parse(record.processedAt);
      if (!Number.isNaN(parsed)) return new Date(parsed);
    }

    if (record.createdAt) {
      const parsed = Date.parse(record.createdAt);
      if (!Number.isNaN(parsed)) return new Date(parsed);
    }

    return new Date();
  }, []);

  const formatPayoutPeriod = useCallback(
    (record: PayoutRecord, granularity: "month" | "year") => {
      const date = parsePayoutDate(record);
      if (Number.isNaN(date.getTime())) return "Unknown period";

      if (granularity === "year") {
        return new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          timeZone: "UTC",
        }).format(date);
      }

      return new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
    },
    [parsePayoutDate],
  );

  const sortedPayouts = useMemo(
    () =>
      [...payouts].sort((a, b) =>
        (Date.parse(b.processedAt ?? b.createdAt ?? "") || 0) - (Date.parse(a.processedAt ?? a.createdAt ?? "") || 0),
      ),
    [payouts],
  );

  const monthlyEntries = useMemo(
    () =>
      sortedPayouts.map((record) => {
        const label = formatPayoutPeriod(record, "month");
        const processedDate = parsePayoutDate(record);
        const processedLabel = Number.isNaN(processedDate.getTime())
          ? null
          : new Intl.DateTimeFormat(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(processedDate);

        return {
          id: record.id,
          label,
          amountLabel: formatConverted(record.amount ?? 0, record.currency ?? baseCurrency),
          status: record.status ?? "payout_received",
          phase: record.phase,
          notes: record.notes,
          attachmentUrl: record.attachmentUrl,
          attachmentName: record.attachmentName,
          processedLabel,
        };
      }),
    [baseCurrency, formatConverted, formatPayoutPeriod, parsePayoutDate, sortedPayouts],
  );

  const yearlyEntries = useMemo(() => {
    const grouped = new Map<string, { total: number; count: number }>();

    sortedPayouts.forEach((record) => {
      const date = parsePayoutDate(record);
      const year = Number.isNaN(date.getTime()) ? "Unknown" : date.getUTCFullYear().toString();
      const current = grouped.get(year) ?? { total: 0, count: 0 };

      grouped.set(year, {
        total: current.total + (Number(record.amount) || 0),
        count: current.count + 1,
      });
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([year, data]) => ({
        id: year,
        label: year,
        amountLabel: formatConverted(data.total, baseCurrency),
        status: "payout_received" as const,
        count: data.count,
      }));
  }, [baseCurrency, formatConverted, parsePayoutDate, sortedPayouts]);

  const payoutHistoryEntries = payoutHistoryFilter === "year" ? yearlyEntries : monthlyEntries;

  const totalPayoutLabel = useMemo(() => {
    const total = payouts.reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
    return formatConverted(total, baseCurrency);
  }, [baseCurrency, formatConverted, payouts]);

  const emptyState = (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
      <AiOutlineBell className="h-9 w-9 text-neutral-400" />
      <p className="mt-2 font-semibold text-neutral-700">No payout records yet</p>
      <p className="mt-1 text-xs text-neutral-500">Your payouts will appear here once they are processed.</p>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
         <motion.div
            key="payout-history-backdrop"
            className="fixed inset-0 z-[100] flex min-h-[100vh] w-full items-start bg-black/30 p-3"
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
              className="fixed right-0 top-0 z-[101] m-[8px] flex h-[calc(100dvh-16px)] w-fit min-w-[360px] max-w-md flex-col rounded-3xl bg-white p-1.5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >

            <header className="border-b border-neutral-100 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-neutral-900">Payout history</p>
                  <p className="text-xs text-neutral-500">Review payouts sent by moderators.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:text-neutral-900"
                  aria-label="Close payout history"
                >
                  <AiOutlineClose className="h-4 w-4" />
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
                        payoutHistoryFilter === option ? "bg-black text-white" : "text-neutral-700 hover:bg-white"
                      }`}
                    >
                      {option === "month" ? "Monthly" : "Yearly"}
                    </button>
                  ))}
                </div>

                <div className="ml-auto flex items-center gap-2 rounded-full bg-neutral-50 px-3 py-2 text-[11px] font-semibold uppercase text-neutral-600">
                  <span>All-time ({currencySymbol})</span>
                  <span className="text-black">{totalPayoutLabel}</span>
                </div>
              </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 pb-7 pt-6 pr-7">
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
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-neutral-500">{entry.label}</p>
                          <p className="mt-1 text-lg font-semibold text-neutral-900">{entry.amountLabel}</p>
                          {"count" in entry && (
                            <p className="text-xs text-neutral-500">{entry.count ?? 0} payout(s)</p>
                          )}
                          {"processedLabel" in entry && entry.processedLabel && (
                            <p className="text-xs text-neutral-500">Processed on {entry.processedLabel}</p>
                          )}
                        </div>

                        {"notes" in entry && entry.notes && (
                          <p className="text-xs text-neutral-600">{entry.notes}</p>
                        )}

                        {"attachmentUrl" in entry && entry.attachmentUrl && (
                          <a
                            href={entry.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-800 underline"
                          >
                            {entry.attachmentName || "View attachment"}
                          </a>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
                              entry.status === "payout_received" || entry.status === "payout_sent"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                            }`}
                          >
                            <span
                              className={`block h-2 w-2 rounded-full ${
                                entry.status === "payout_received" || entry.status === "payout_sent"
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            {entry.status === "payout_received" || entry.status === "payout_sent"
                              ? "Payout received"
                              : "Processing"}
                          </span>

                          {payoutHistoryFilter === "month" && "phase" in entry && entry.phase && (
                            <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-neutral-700">
                              {entry.phase === 1 ? "Phase 1" : `Phase ${entry.phase}`}
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
                emptyState
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default PayoutHistory;
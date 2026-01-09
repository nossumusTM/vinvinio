"use client";

import { useMemo } from "react";
import { getCurrencyOption } from "@/app/(marketplace)/constants/locale";
import useLocaleSettings from "@/app/(marketplace)/hooks/useLocaleSettings";

interface VinVoucherCardProps {
  name: string;
  balance: number;
  currency: string;
}

const VinVoucherCard = ({ name, balance, currency }: VinVoucherCardProps) => {
  const { locale } = useLocaleSettings();
  const currencyOption = getCurrencyOption(currency);

  const formattedBalance = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      }).format(balance);
    } catch {
      return `${balance.toFixed(2)} ${currency}`;
    }
  }, [balance, currency, locale]);

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] via-[#1f2937] to-black p-5 text-white shadow-[0_18px_35px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0,rgba(255,255,255,0.25),transparent_45%)]" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.3em] text-white/70">
            Gift Voucher
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
            Vinvin
          </span>
        </div>

        <div>
          <p className="text-lg font-semibold">{name}</p>
          <p className="mt-1 text-sm text-white/70">
            {currencyOption.symbol} · {currencyOption.currency}
          </p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">
              Balance
            </p>
            <p className="mt-2 text-2xl font-semibold">{formattedBalance}</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            Virtual
          </span>
        </div>
      </div>
    </div>
  );
};

export default VinVoucherCard;
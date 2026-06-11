"use client";

// OwnState — EMI calculator (Brick 09)
// Real amortised-loan formula. Defaults seed from the property price (rupees).

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

function formatINR(rupees: number): string {
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`;
}

export function EmiCalculator({ priceRupees }: { priceRupees: number }) {
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const { loan, emi, totalInterest, totalPayment } = useMemo(() => {
    const loan = Math.max(0, priceRupees * (1 - downPct / 100));
    const r = rate / 12 / 100;
    const n = years * 12;
    const emi =
      r === 0 ? loan / n : (loan * r * (1 + r) ** n) / ((1 + r) ** n - 1);
    const totalPayment = emi * n;
    return {
      loan,
      emi,
      totalInterest: totalPayment - loan,
      totalPayment,
    };
  }, [priceRupees, downPct, rate, years]);

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="text-base font-semibold">EMI calculator</h3>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Estimate your monthly payment.
      </p>

      <div className="mt-4 rounded-xl bg-brand-light/60 p-4 text-center">
        <div className="text-xs text-muted-foreground">Monthly EMI</div>
        <div className="text-2xl font-semibold text-brand-teal">
          {formatINR(emi)}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <Slider
          label="Down payment"
          value={downPct}
          min={0}
          max={80}
          step={5}
          suffix="%"
          onChange={setDownPct}
        />
        <Slider
          label="Interest rate"
          value={rate}
          min={5}
          max={15}
          step={0.1}
          suffix="%"
          onChange={setRate}
        />
        <Slider
          label="Tenure"
          value={years}
          min={1}
          max={30}
          step={1}
          suffix=" yrs"
          onChange={setYears}
        />
      </div>

      <dl className="mt-4 space-y-1.5 border-t pt-4 text-sm">
        <Row label="Loan amount" value={formatINR(loan)} />
        <Row label="Total interest" value={formatINR(totalInterest)} />
        <Row label="Total payable" value={formatINR(totalPayment)} strong />
      </dl>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-brand-teal"
      />
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn(strong ? "font-semibold" : "font-medium")}>{value}</dd>
    </div>
  );
}

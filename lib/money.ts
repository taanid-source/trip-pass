import type { Expense } from "./supabase";

export const CURRENCIES = ["₹", "$", "€"] as const;

export function formatMoney(amount: number, currency: string) {
  const rounded = Math.round(amount * 100) / 100;
  const whole = Number.isInteger(rounded);
  const formatted = rounded.toLocaleString(currency === "₹" ? "en-IN" : "en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
  return `${currency}${formatted}`;
}

export type Settlement = { from: string; to: string; amount: number };

// Net balance per person in cents (positive = is owed), using an equal split.
export function netBalances(members: string[], expenses: Expense[]) {
  const net = new Map<string, number>();
  for (const m of members) net.set(m, 0);

  for (const e of expenses) {
    const people = e.split_between ?? [];
    if (people.length === 0) continue;
    const cents = Math.round(Number(e.amount) * 100);
    const share = Math.floor(cents / people.length);
    let remainder = cents - share * people.length;

    net.set(e.paid_by, (net.get(e.paid_by) ?? 0) + cents);
    for (const p of people) {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      net.set(p, (net.get(p) ?? 0) - share - extra);
    }
  }
  return net;
}

// Greedily match the largest debtor with the largest creditor.
export function settleUp(members: string[], expenses: Expense[]): Settlement[] {
  const net = netBalances(members, expenses);
  const debtors = [...net].filter(([, v]) => v < 0).map(([name, v]) => ({ name, v: -v }));
  const creditors = [...net].filter(([, v]) => v > 0).map(([name, v]) => ({ name, v }));
  const result: Settlement[] = [];

  while (debtors.length && creditors.length) {
    debtors.sort((a, b) => b.v - a.v);
    creditors.sort((a, b) => b.v - a.v);
    const d = debtors[0];
    const c = creditors[0];
    const pay = Math.min(d.v, c.v);
    result.push({ from: d.name, to: c.name, amount: pay / 100 });
    d.v -= pay;
    c.v -= pay;
    if (d.v === 0) debtors.shift();
    if (c.v === 0) creditors.shift();
  }
  return result;
}

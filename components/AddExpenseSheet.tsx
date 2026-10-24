"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase, type Trip } from "@/lib/supabase";
import { Chip, Label, PrimaryButton, SecondaryButton, inputClass } from "@/components/ui";

export default function AddExpenseSheet({
  trip,
  me,
  onClose,
  onAdded,
}: {
  trip: Trip;
  me: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(trip.members.includes(me) ? me : trip.members[0]);
  const [split, setSplit] = useState<string[]>(trip.members);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setClosing(true);
    setTimeout(onClose, 160);
  }

  function toggle(name: string) {
    setSplit((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (split.length === 0) {
      setError("Pick at least one person to split with.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("expenses").insert({
      trip_id: trip.id,
      description: description.trim() || "Expense",
      amount: Math.round(value * 100) / 100,
      paid_by: paidBy,
      split_between: trip.members.filter((m) => split.includes(m)),
    });
    setSaving(false);
    if (error) {
      setError("Couldn't add that. Please try again.");
      return;
    }
    onAdded();
    close();
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6 ${closing ? "modal-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-expense-title"
    >
      <div className="modal-backdrop absolute inset-0 bg-black/25" onClick={close} />
      <div className="modal-panel relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[16px] border border-line bg-white shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] sm:max-w-[460px] sm:rounded-card">
        <div className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-line sm:hidden" />
        <h2 id="add-expense-title" className="px-5 pt-4 text-[16px] font-semibold tracking-[-0.01em] sm:px-6 sm:pt-5">
          Add an expense
        </h2>

        <form onSubmit={onSubmit}>
          <div className="space-y-4 px-5 pt-5 pb-5 sm:px-6">
            <div>
              <Label htmlFor="desc">What was it?</Label>
              <input
                id="desc"
                className={inputClass}
                placeholder="Dinner at the beach"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="amount">How much?</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-[14px] text-muted">
                    {trip.currency}
                  </span>
                  <input
                    id="amount"
                    className={`${inputClass} pl-7 font-mono tabular-nums`}
                    inputMode="decimal"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(",", "."))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paid">Who paid?</Label>
                <select
                  id="paid"
                  className={`${inputClass} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23737373' stroke-width='1.3'/%3E%3C/svg%3E")] bg-[position:right_0.75rem_center] bg-no-repeat pr-8`}
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                >
                  {trip.members.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Split between</Label>
              <div className="flex flex-wrap gap-1.5">
                {trip.members.map((m) => (
                  <Chip key={m} selected={split.includes(m)} onClick={() => toggle(m)}>
                    {m}
                  </Chip>
                ))}
              </div>
            </div>

            {error && <p className="text-[13px] text-ink">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-line bg-surface px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-6">
            <SecondaryButton type="button" onClick={close} className="flex-1 sm:flex-none">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving} className="flex-1 sm:flex-none sm:min-w-[88px]">
              {saving ? "Adding…" : "Add"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

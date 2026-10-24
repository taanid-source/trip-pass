"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { supabase, type Expense, type Trip } from "@/lib/supabase";
import { formatMoney, netBalances, settleUp } from "@/lib/money";
import AddExpenseSheet from "@/components/AddExpenseSheet";
import {
  AccentBadge,
  Arrow,
  Avatar,
  Card,
  Container,
  Person,
  PrimaryButton,
  SecondaryButton,
  TrashIcon,
  inputClass,
} from "@/components/ui";

type Status = "loading" | "missing" | "ready";

const storageKey = (id: string) => `trip-pass:${id}`;

export default function TripPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);

  const load = useCallback(async () => {
    const [tripRes, expRes] = await Promise.all([
      supabase.from("trips").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("expenses")
        .select("*")
        .eq("trip_id", id)
        .order("created_at", { ascending: false }),
    ]);
    if (tripRes.data) {
      setTrip(tripRes.data as Trip);
      setStatus("ready");
    } else {
      // Only show the broken-link state if we never loaded the trip.
      setStatus((s) => (s === "ready" ? s : "missing"));
    }
    if (expRes.data) setExpenses(expRes.data as Expense[]);
  }, [id]);

  useEffect(() => {
    setMe(localStorage.getItem(storageKey(id)));
    setMeLoaded(true);
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [id, load]);

  function pickName(name: string) {
    localStorage.setItem(storageKey(id), name);
    setMe(name);
  }

  if (status === "loading" || !meLoaded) {
    return <Centered><p className="text-[13px] text-muted">Loading…</p></Centered>;
  }

  if (status === "missing" || !trip) {
    return (
      <Centered>
        <Card className="w-full max-w-[420px] p-8 text-center">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">This trip link doesn&apos;t work.</h1>
          <p className="mt-2 text-muted">Ask the organizer to share it again.</p>
        </Card>
      </Centered>
    );
  }

  if (!me) {
    return <JoinView trip={trip} onPick={pickName} onTripUpdated={setTrip} />;
  }

  return <TripView trip={trip} expenses={expenses} me={me} reload={load} />;
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 items-center justify-center bg-surface px-4 py-16">{children}</div>;
}

function JoinView({
  trip,
  onPick,
  onTripUpdated,
}: {
  trip: Trip;
  onPick: (name: string) => void;
  onTripUpdated: (trip: Trip) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addMe(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError("");

    // Re-read members so we don't overwrite anyone who just joined.
    const { data: latest } = await supabase
      .from("trips")
      .select("members")
      .eq("id", trip.id)
      .single();
    const members: string[] = latest?.members ?? trip.members;
    const existing = members.find((m) => m.toLowerCase() === name.toLowerCase());
    if (existing) {
      onPick(existing);
      return;
    }

    setSaving(true);
    const updated = [...members, name];
    const { error } = await supabase.from("trips").update({ members: updated }).eq("id", trip.id);
    setSaving(false);
    if (error) {
      setError("Couldn't add your name. Please try again.");
      return;
    }
    onTripUpdated({ ...trip, members: updated });
    onPick(name);
  }

  return (
    <Centered>
      <Card className="w-full max-w-[520px] p-6 sm:p-10">
        <p className="text-[13px] text-muted">You&apos;re invited to</p>
        <h1 className="mt-1 text-[32px] leading-tight font-semibold tracking-[-0.02em]">{trip.name}</h1>

        <h2 className="mt-8 mb-3 text-[14px] font-medium">Which one is you?</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {trip.members.map((m) => (
            <button
              key={m}
              onClick={() => onPick(m)}
              className="flex h-16 min-w-0 items-center rounded-control border border-line bg-white px-3 text-left text-[15px] font-medium transition-colors outline-none hover:border-ink focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={m} size={40} />
                <span className="truncate">{m}</span>
              </span>
            </button>
          ))}
        </div>

        {showNew ? (
          <form onSubmit={addMe} className="mt-5 flex gap-2">
            <input
              className={inputClass}
              placeholder="Your name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <PrimaryButton type="submit" disabled={saving || !newName.trim()} className="shrink-0">
              {saving ? "Joining…" : "Join"}
            </PrimaryButton>
          </form>
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="mt-5 text-[14px] font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
          >
            I&apos;m not on the list
          </button>
        )}
        {error && <p className="mt-2 text-[13px] text-ink">{error}</p>}

        <p className="mt-8 border-t border-line pt-5 text-xs text-muted">No sign-up needed.</p>
      </Card>
    </Centered>
  );
}

function TripView({
  trip,
  expenses,
  me,
  reload,
}: {
  trip: Trip;
  expenses: Expense[];
  me: string;
  reload: () => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const settlements = useMemo(() => settleUp(trip.members, expenses), [trip.members, expenses]);
  const myBalance = useMemo(
    () => (netBalances(trip.members, expenses).get(me) ?? 0) / 100,
    [trip.members, expenses, me],
  );
  const money = (n: number) => formatMoney(n, trip.currency);
  const openSheet = () => setSheetOpen(true);

  async function remove(expenseId: string) {
    await supabase.from("expenses").delete().eq("id", expenseId);
    reload();
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="truncate text-[26px] font-semibold tracking-[-0.02em] sm:text-[32px]">{trip.name}</h1>
          <AccentBadge>Trip Pass · Unlimited</AccentBadge>
        </div>
        <PrimaryButton onClick={openSheet} className="w-full sm:w-auto">
          Add expense
        </PrimaryButton>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Total spent" className="border-ink bg-ink text-white" labelClassName="text-[#A3A3A3]">
          {money(total)}
        </Stat>
        {myBalance > 0 ? (
          <Stat label="Your balance" className="border-accent-soft-line bg-accent-soft text-accent" labelClassName="text-accent/75">
            You&apos;re owed {money(myBalance)}
          </Stat>
        ) : myBalance < 0 ? (
          <Stat label="Your balance" className="border-[#FFE4CC] bg-owe-soft text-owe" labelClassName="text-owe/75">
            You owe {money(-myBalance)}
          </Stat>
        ) : (
          <Stat label="Your balance" className="border-[#D3F5DE] bg-even-soft text-even" labelClassName="text-even/75">
            You&apos;re even
          </Stat>
        )}
        <Stat label="Expenses">{expenses.length}</Stat>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] lg:grid-rows-[auto_1fr]">
        <Card className="lg:col-start-2 lg:row-start-1">
          <CardHeader title="Who owes whom" />
          {settlements.length === 0 ? (
            <p className="px-5 pb-5 text-muted">Everyone is even.</p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {settlements.map((s) => (
                <li key={`${s.from}-${s.to}`} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Person name={s.from} />
                    <Arrow />
                    <Person name={s.to} />
                  </span>
                  <span
                    className={`shrink-0 font-mono tabular-nums ${
                      s.to === me ? "text-accent" : s.from === me ? "text-owe" : "text-ink"
                    }`}
                  >
                    {money(s.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <CardHeader title="Expenses" />
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center border-t border-line px-5 py-16 text-center">
              <p className="text-muted">No expenses yet.</p>
              <SecondaryButton onClick={openSheet} className="mt-4">
                Add the first one
              </SecondaryButton>
            </div>
          ) : (
            <div role="table" className="border-t border-line">
              <div
                role="row"
                className="hidden grid-cols-[minmax(0,1fr)_120px_80px_120px_40px] items-center gap-4 border-b border-line bg-surface px-5 py-2.5 text-xs font-medium text-muted sm:grid"
              >
                <span role="columnheader">What</span>
                <span role="columnheader">Paid by</span>
                <span role="columnheader">Split</span>
                <span role="columnheader" className="text-right">Amount</span>
                <span />
              </div>
              <div className="divide-y divide-line">
                {expenses.map((e) => {
                  const ways = `${e.split_between.length} ${e.split_between.length === 1 ? "way" : "ways"}`;
                  return (
                    <div
                      key={e.id}
                      role="row"
                      className="group grid grid-cols-[minmax(0,1fr)_auto_32px] items-center gap-x-3 px-5 py-3 transition-colors hover:bg-surface sm:grid-cols-[minmax(0,1fr)_120px_80px_120px_40px] sm:gap-4"
                    >
                      <div role="cell" className="min-w-0">
                        <p className="truncate font-medium">{e.description}</p>
                        <p className="mt-0.5 truncate text-[13px] text-muted sm:hidden">
                          Paid by {e.paid_by} · split {ways}
                        </p>
                      </div>
                      <span role="cell" className="hidden min-w-0 sm:flex">
                        <Person name={e.paid_by} />
                      </span>
                      <span role="cell" className="hidden text-muted sm:block">{ways}</span>
                      <span role="cell" className="text-right font-mono tabular-nums">
                        {money(Number(e.amount))}
                      </span>
                      <span role="cell" className="flex justify-end">
                        <button
                          onClick={() => remove(e.id)}
                          aria-label={`Delete ${e.description}`}
                          title="Delete"
                          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted transition outline-none hover:bg-line hover:text-ink focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-accent/25 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <EndCard tripId={trip.id} me={me} />
      </div>

      {sheetOpen && (
        <AddExpenseSheet trip={trip} me={me} onClose={() => setSheetOpen(false)} onAdded={reload} />
      )}
    </Container>
  );
}

function CardHeader({ title }: { title: string }) {
  return <h2 className="px-5 py-4 text-[14px] font-semibold">{title}</h2>;
}

function Stat({
  label,
  children,
  className = "bg-white",
  labelClassName = "text-muted",
}: {
  label: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div className={`rounded-card border border-line px-5 py-4 ${className}`}>
      <p className={`text-[13px] ${labelClassName}`}>{label}</p>
      <p className="mt-2 truncate text-[24px] leading-tight font-semibold tracking-[-0.02em] tabular-nums sm:text-[28px]">
        {children}
      </p>
    </div>
  );
}

function EndCard({ tripId, me }: { tripId: string; me: string }) {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const { error } = await supabase
      .from("signups")
      .insert({ trip_id: tripId, name: me, email: email.trim() });
    setSaving(false);
    if (error) {
      setError("Couldn't save. Please try again.");
      return;
    }
    setSaved(true);
  }

  return (
    <Card className="p-5 lg:col-start-2 lg:row-start-2">
      <h2 className="text-[14px] font-semibold">Trip done?</h2>
      {saved ? (
        <p className="mt-2 text-ink">Saved. You&apos;re all set.</p>
      ) : (
        <>
          <p className="mt-1 text-muted">Add your email to keep your balances.</p>
          <form onSubmit={onSubmit} className="mt-4 space-y-2.5">
            <input
              type="email"
              required
              className={inputClass}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {error && <p className="text-[13px] text-ink">{error}</p>}
            <PrimaryButton type="submit" disabled={saving} className="w-full">
              {saving ? "Saving…" : "Save my balances"}
            </PrimaryButton>
          </form>
        </>
      )}
    </Card>
  );
}

"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CURRENCIES } from "@/lib/money";
import {
  AccentBadge,
  Arrow,
  Avatar,
  Card,
  CheckIcon,
  Container,
  Label,
  Person,
  PrimaryButton,
  Segmented,
  SecondaryButton,
  inputClass,
} from "@/components/ui";

type Currency = (typeof CURRENCIES)[number];

const SAMPLE = [
  { from: "Riya", to: "Arjun", amount: "₹1,240" },
  { from: "Kabir", to: "Arjun", amount: "₹860" },
  { from: "Meera", to: "Riya", amount: "₹300" },
];

export default function Home() {
  const router = useRouter();
  const [tripName, setTripName] = useState("");
  const [myName, setMyName] = useState("");
  const [friendInput, setFriendInput] = useState("");
  const [friends, setFriends] = useState<string[]>([]);
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addFriend() {
    const name = friendInput.trim();
    if (!name) return;
    const taken = [...friends, myName.trim()].some((n) => n.toLowerCase() === name.toLowerCase());
    if (!taken) setFriends([...friends, name]);
    setFriendInput("");
  }

  function onFriendKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addFriend();
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const name = tripName.trim();
    const me = myName.trim();
    if (!name || !me) {
      setError("Add a trip name and your name.");
      return;
    }
    const pending = friendInput.trim();
    const members = [me, ...friends, ...(pending ? [pending] : [])].filter(
      (n, i, arr) => arr.findIndex((m) => m.toLowerCase() === n.toLowerCase()) === i,
    );

    setSubmitting(true);
    const { data, error } = await supabase
      .from("trips")
      .insert({ name, currency, members })
      .select("id")
      .single();

    if (error || !data) {
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
      return;
    }
    localStorage.setItem(`trip-pass:${data.id}`, me);
    router.push(`/t/${data.id}`);
  }

  return (
    <div className="flex flex-1 items-center py-10 lg:py-12">
      <Container className="grid items-center gap-10 lg:grid-cols-[55fr_45fr] lg:gap-16">
        <section>
          <h1 className="text-[36px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[48px]">
            One link for the whole trip.
          </h1>
          <p className="mt-4 max-w-[460px] text-[16px] leading-relaxed text-muted">
            Your friends add what they paid. No app, no sign-up. At the end, you see exactly who owes
            whom.
          </p>
          <ul className="mt-6 space-y-2.5 text-[14px]">
            {[
              "Unlimited expenses during the trip",
              "Friends join with a link",
              "Pay once. No subscription.",
            ].map((line) => (
              <li key={line} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-surface">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {line}
              </li>
            ))}
          </ul>

          <div className="mt-8 max-w-[460px] rounded-[20px] bg-accent p-6">
            <p className="mb-3 text-[13px] font-medium text-white">What your group sees at the end</p>
            <Card className="border-transparent">
              <div className="flex items-center justify-between px-4 pt-3.5 pb-3">
                <p className="text-[13px] font-medium">Who owes whom</p>
                <p className="text-xs text-muted">Goa, March</p>
              </div>
              <div className="divide-y divide-line border-t border-line">
                {SAMPLE.map((s) => (
                  <div key={s.from} className="flex items-center justify-between gap-3 px-4 py-3 text-[14px]">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Person name={s.from} />
                      <Arrow />
                      <Person name={s.to} />
                    </span>
                    <span className="font-mono tabular-nums">{s.amount}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <Card className="p-5 sm:p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <Label htmlFor="trip">Trip name</Label>
                <input
                  id="trip"
                  className={inputClass}
                  placeholder="Goa, March"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                />
              </div>
              <div className="sm:w-[148px]">
                <Label>Currency</Label>
                <Segmented options={CURRENCIES} value={currency} onChange={setCurrency} label="Currency" />
              </div>
            </div>

            <div>
              <Label htmlFor="me">Your name</Label>
              <input
                id="me"
                className={inputClass}
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                autoComplete="given-name"
              />
            </div>

            <div>
              <Label htmlFor="friend">Who&apos;s coming?</Label>
              <div className="flex gap-2">
                <input
                  id="friend"
                  className={inputClass}
                  placeholder="Add a name"
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
                  onKeyDown={onFriendKey}
                  enterKeyHint="done"
                />
                <SecondaryButton type="button" onClick={addFriend} className="shrink-0">
                  Add
                </SecondaryButton>
              </div>
              {friends.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {friends.map((f) => (
                    <span
                      key={f}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface pr-1 pl-0.5 text-[13px]"
                    >
                      <Avatar name={f} size={26} />
                      {f}
                      <button
                        type="button"
                        onClick={() => setFriends(friends.filter((x) => x !== f))}
                        aria-label={`Remove ${f}`}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-line hover:text-ink"
                      >
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
                          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-control border border-accent-soft-line bg-accent-soft px-3.5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium">Trip Pass</span>
                <AccentBadge>$3.99 once</AccentBadge>
              </div>
              <span className="text-[13px] text-muted">30 days, unlimited</span>
            </div>

            <div className="pt-1">
              {error && <p className="mb-3 text-[13px] text-ink">{error}</p>}
              <PrimaryButton type="submit" disabled={submitting} className="h-11 w-full">
                {submitting ? "Starting…" : "Start trip"}
              </PrimaryButton>
              <p className="mt-2.5 text-center text-xs text-muted">Prototype. No payment is taken.</p>
            </div>
          </form>
        </Card>
      </Container>
    </div>
  );
}

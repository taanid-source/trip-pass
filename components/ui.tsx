import type { ButtonHTMLAttributes, ReactNode } from "react";

const focusRing =
  "outline-none focus-visible:ring-3 focus-visible:ring-accent/25 focus-visible:border-accent";

export const inputClass = `h-10 w-full rounded-control border border-line bg-white px-3 text-[14px] text-ink placeholder:text-[#A3A3A3] transition-colors outline-none focus:border-accent focus:ring-3 focus:ring-accent/15`;

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1120px] px-4 sm:px-8 ${className}`}>{children}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-line bg-white ${className}`}>{children}</div>
  );
}

export function PrimaryButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`h-10 rounded-control bg-accent px-4 text-[14px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 ${focusRing} ${className}`}
    />
  );
}

export function SecondaryButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`h-10 rounded-control border border-line bg-white px-4 text-[14px] font-medium text-ink transition-colors hover:bg-surface disabled:opacity-50 ${focusRing} ${className}`}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink">
      {children}
    </label>
  );
}

export function AccentBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-accent px-2.5 text-xs font-medium whitespace-nowrap text-white">
      {children}
    </span>
  );
}

const AVATAR_COLORS = [
  ["#E0E7FF", "#3730A3"],
  ["#FEF3C7", "#92400E"],
  ["#FCE7F3", "#9D174D"],
  ["#CCFBF1", "#115E59"],
  ["#EDE9FE", "#5B21B6"],
  ["#FFE4E6", "#9F1239"],
];

function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name.trim().toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const [bg, fg] = avatarColor(name);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.42) }}
    >
      {name.trim().charAt(0)}
    </span>
  );
}

export function Person({ name, size }: { name: string; size?: number }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar name={name} size={size} />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function Arrow() {
  return <span aria-label="pays" className="shrink-0 text-muted">→</span>;
}

export function Chip({
  children,
  selected,
  onClick,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`h-8 rounded-full border px-3 text-[13px] transition-colors ${focusRing} ${
        selected ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex h-10 rounded-control border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`flex-1 rounded-[8px] px-3 text-[14px] transition-colors ${focusRing} ${
            value === o ? "border border-line bg-white font-medium text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path
        d="M2.5 4.5h11M6.5 4.5V3h3v1.5M4 4.5l.6 8.5h6.8l.6-8.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Container, SecondaryButton } from "@/components/ui";

export default function Nav() {
  const pathname = usePathname();
  const onTrip = pathname.startsWith("/t/");

  return (
    <header className="border-b border-line bg-white">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-[15px] font-semibold tracking-[-0.01em]">
          Trip Pass
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden h-6 items-center rounded-full bg-surface px-2.5 text-xs text-muted ring-1 ring-line sm:inline-flex">
            Concept for Splitwise
          </span>
          {onTrip && <CopyLink />}
        </div>
      </Container>
    </header>
  );
}

function CopyLink() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SecondaryButton onClick={copy} className="h-8 min-w-[92px] px-3 text-[13px]">
      {copied ? "Copied" : "Copy link"}
    </SecondaryButton>
  );
}

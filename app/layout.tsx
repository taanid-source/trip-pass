import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import { Container } from "@/components/ui";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Trip Pass",
  description: "One link for the whole trip.",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans text-[14px] antialiased">
        <Nav />
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-line">
          <Container className="py-5 text-xs text-muted">
            Concept prototype for a Splitwise case study. Not affiliated with Splitwise.
          </Container>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ReactQueryProvider from "@/providers/ReactQueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "미묘히 어드민",
  description: "Admin dashboard for managing shop products and users",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full">
      <body className={`${inter.className} h-full`}>
        <NuqsAdapter>
          <ReactQueryProvider>
            {children}
            <Toaster />
          </ReactQueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}

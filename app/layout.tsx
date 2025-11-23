import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import ReactQueryProvider from "@/providers/ReactQueryProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Shop Admin Dashboard",
  description: "Admin dashboard for managing shop products and users",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <NuqsAdapter>
          <ReactQueryProvider>
            {children}
            <Toaster />
          </ReactQueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}

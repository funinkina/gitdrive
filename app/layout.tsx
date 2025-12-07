import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"

const _DM_Sans = DM_Sans({ subsets: ["latin"], weight: ["400", "600"] })

export const metadata: Metadata = {
  title: "GitDrive - GitHub as Cloud Storage",
  description: "Use GitHub as a small cloud storage drive.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${_DM_Sans.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}

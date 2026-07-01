import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HoistsProvider } from "@/context/HoistsContext";
import { RepairsProvider } from "@/context/RepairsContext";
import { CustomersProvider } from "@/context/CustomersContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hoistec",
  description: "Construction Hoist Management System",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8f9fa]">
        <HoistsProvider>
          <RepairsProvider>
            <CustomersProvider>
              {children}
            </CustomersProvider>
          </RepairsProvider>
        </HoistsProvider>
      </body>
    </html>
  );
}
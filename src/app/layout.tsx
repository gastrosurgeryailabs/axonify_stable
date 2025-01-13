import type { Metadata } from "next";
import "./global.css";
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { cn } from "@/lib/utils"
import { Inter } from 'next/font/google';
import Providers from "@/components/Providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "AxonCare",
  description: "Your health guardians",
  icons: {
    icon: [
      {
        url: '/logo.png',
        href: '/logo.png',
        sizes: '42x55',
        type: 'image/png',
      }
    ],
    shortcut: '/logo.png',
    apple: {
      url: '/logo.png',
      sizes: '42x55',
      type: 'image/png',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'antialiased min-h-screen')} suppressHydrationWarning>
        <Providers>
          <div className="fixed top-0 left-0 right-0 z-50">
            <Navbar />
          </div>
          <div className="flex flex-col min-h-screen">
            <div className="h-16" aria-hidden="true" />
            <main className="flex-1 relative overflow-y-auto">
              <div className="min-h-[calc(100vh-8rem)] w-full">
                {children}
              </div>
            </main>
            <div className="h-16" aria-hidden="true" />
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

// Forced redeploy - triggering Vercel build
import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { HardwareProvider } from '@/components/HardwareProvider';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Scribe — Personal Knowledge Graph',
  description: 'A note-taking app with AI-powered semantic graph visualisation.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#fafafa',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfairDisplay.variable}`}>
      <body className="antialiased bg-[var(--bg-app)] text-[var(--ink)] flex overflow-hidden w-screen h-screen" suppressHydrationWarning>
        <HardwareProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <main className="flex-1 overflow-hidden relative">
              {children}
            </main>
          </div>
          <MobileNav />
        </HardwareProvider>
      </body>
    </html>
  );
}

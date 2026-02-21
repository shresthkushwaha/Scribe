import type { Metadata } from 'next';
import { Inter, DM_Serif_Display } from 'next/font/google';
import './globals.css';
import { HardwareProvider } from '@/components/HardwareProvider';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Scribe — Personal Knowledge Graph',
  description: 'A note-taking app with AI-powered semantic graph visualisation.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#f5f3ee',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
      <body className="antialiased font-sans bg-[var(--bg)] text-[var(--text-1)] flex overflow-hidden w-screen h-screen" suppressHydrationWarning>
        <HardwareProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <main className="flex-1 overflow-y-auto pb-16 md:pb-0 scroll-smooth">
              {children}
            </main>
          </div>
          <MobileNav />
        </HardwareProvider>
      </body>
    </html>
  );
}

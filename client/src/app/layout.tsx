import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/shared/components/Providers';

export const metadata: Metadata = {
  title: 'Quality Intelligence',
  description: 'Inspect. Analyze. Improve.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

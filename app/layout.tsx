import "./globals.css";
import type { Metadata } from 'next';
import ClientShell from '@app/components/ClientShell';

export const metadata: Metadata = {
  title: 'Silent Auction',
  description: 'Browse active auctions and place bids.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}

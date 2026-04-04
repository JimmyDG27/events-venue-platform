import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Venue Booking Platform',
  description: 'Discover and book unique event venues',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

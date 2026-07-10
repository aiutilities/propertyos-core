import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = {
  title: 'PropertyOS',
  description: 'PropertyOS admin portal'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

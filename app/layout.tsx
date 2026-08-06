// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { HoistsProvider } from '@/context/HoistsContext';
import { RepairsProvider } from '@/context/RepairsContext';
import { CustomersProvider } from '@/context/CustomersContext';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Hoistec - Construction Hoist Management',
  description: 'Manage construction hoists, repairs, and wind safety',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <HoistsProvider>
          <RepairsProvider>
            <CustomersProvider>
              <ClientLayout>{children}</ClientLayout>
            </CustomersProvider>
          </RepairsProvider>
        </HoistsProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { StoreProvider } from './StoreProvider'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Solas Restaurante',
  description: 'Painel de gerenciamento do Solas Restaurante',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
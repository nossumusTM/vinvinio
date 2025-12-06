import type { ReactNode } from 'react';
import MarketplaceRootLayout, { metadata as marketplaceMetadata } from './(marketplace)/layout';

type RootLayoutProps = {
  children: ReactNode;
};

export const metadata = marketplaceMetadata;

export default function RootLayout({ children }: RootLayoutProps) {
  return <MarketplaceRootLayout>{children}</MarketplaceRootLayout>;
}
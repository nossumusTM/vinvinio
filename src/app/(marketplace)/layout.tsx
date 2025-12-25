// import { Nunito } from 'next/font/google';

import Script from 'next/script';

import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

import { Suspense } from 'react';
import Loader from './components/Loader';

export const dynamic = 'force-dynamic';
import dynamicImport from 'next/dynamic';

import LoginModal from '@/app/(marketplace)/components/modals/LoginModal';
import RegisterModal from '@/app/(marketplace)/components/modals/RegisterModal';
import SearchModal from '@/app/(marketplace)/components/modals/SearchModal';
import SearchExperienceModal from './components/modals/SearchExperienceModal';
import LocaleModal from './components/modals/LocaleModal';
import RentModal from '@/app/(marketplace)/components/modals/RentModal';
import PromoteModal from './components/modals/PromoteModal';
import ForgetPasswordModal from './components/modals/ForgetPasswordModal';
import Messenger from './components/Messenger';
import LocaleHydrator from './components/LocaleHydrator';

import ToasterProvider from '@/app/(marketplace)/providers/ToasterProvider';
import AnnouncementModal from './components/AnnouncementModal';

import PageReadyProvider from './components/PageReadyProvider';
import GateShell from './components/GateShell';
import FullScreenLoader from './components/FullScreenLoader';

import './globals.css';
import ClientOnly from './components/ClientOnly';
import getCurrentUser from './actions/getCurrentUser';
import Footer from './components/Footer';

import SessionProviderWrapper from './providers/SessionProviderWrapper';

export const metadata = {
  title: 'Vinvin - Experience World Beyond the Ordinary | 2025',
  description: 'Beyond Experiences & More',
  icons: {
    icon: '/favicon-2026.ico?',
  },
};

// const font = Nunito({
//   subsets: ['latin'],
// });

const NavBar = dynamicImport(
  () => import('@/app/(marketplace)/components/navbar/NavBar'),
  { ssr: false },
);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en">
      <body className={`font-snpro min-h-screen flex flex-col overflow-x-hidden`}>
        <Script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          // strategy="beforeInteractive"
          strategy="afterInteractive"
        />

        <ClientOnly>
          <LocaleHydrator />
          <ToasterProvider />
          <NavBar currentUser={currentUser} />
          {/* <AnnouncementModal /> */}
          <LoginModal />
          <RegisterModal />
          <ForgetPasswordModal />
          <SearchExperienceModal />
          {/* <LocaleModal /> */}
          {/* <SearchModal /> */}
          <RentModal />
          <PromoteModal currentUser={currentUser} />
          {currentUser && <Messenger currentUser={currentUser} />}
        </ClientOnly>
        <SessionProviderWrapper>
          <Suspense fallback={<Loader />}>
            <main className="flex flex-col flex-1 pb-0 pt-28">
              <div className="flex-1">
                {children}
                </div>
                <div className="w-full pt-20 mt-auto">
                {/* <Footer currentUser={currentUser} /> */}
              </div>
            </main>
          </Suspense>
        </SessionProviderWrapper>

        <ClientOnly>
          <LocaleModal />
        </ClientOnly>

      </body>
    </html>
  );
}

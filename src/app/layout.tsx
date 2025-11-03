// import { Nunito } from 'next/font/google';

import Script from 'next/script';

import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

export const dynamic = 'force-dynamic';

import NavBar from '@/app/components/navbar/NavBar';
import LoginModal from '@/app/components/modals/LoginModal';
import RegisterModal from '@/app/components/modals/RegisterModal';
import SearchModal from '@/app/components/modals/SearchModal';
import SearchExperienceModal from './components/modals/SearchExperienceModal';
import LocaleModal from './components/modals/LocaleModal';
import RentModal from '@/app/components/modals/RentModal';
import PromoteModal from './components/modals/PromoteModal';
import ForgetPasswordModal from './components/modals/ForgetPasswordModal';
import Messenger from './components/Messenger';
import LocaleHydrator from './components/LocaleHydrator';

import ToasterProvider from '@/app/providers/ToasterProvider';
import AnnouncementModal from './components/AnnouncementModal';

import './globals.css';
import ClientOnly from './components/ClientOnly';
import getCurrentUser from './actions/getCurrentUser';
import Footer from './components/Footer';

import SessionProviderWrapper from './providers/SessionProviderWrapper';

export const metadata = {
  title: 'Vuola - Experience World Beyond the Ordinary | 2025',
  description: 'Beyond Experiences & More',
  icons: {
    icon: '/favicon.ico', // ✅ tells Next.js where to find it
  },
};

// const font = Nunito({
//   subsets: ['latin'],
// });

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
          <LocaleModal />
          {/* <SearchModal /> */}
          <RentModal />
          <PromoteModal currentUser={currentUser} />
          {currentUser && <Messenger currentUser={currentUser} />}
        </ClientOnly>

        {/* <div className="pb-20 pt-28 min-h-screen"> */}
        <SessionProviderWrapper>
          <main className="flex-grow pb-0 pt-28">
            {children}
          </main>
        </SessionProviderWrapper>

        <div className="w-full pt-20">
          <Footer currentUser={currentUser}/>
        </div>
      </body>
    </html>
  );
}

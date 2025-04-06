import { Nunito } from 'next/font/google';
import Script from 'next/script';
export const dynamic = 'force-dynamic';

import NavBar from '@/app/components/navbar/NavBar';
import LoginModal from '@/app/components/modals/LoginModal';
import RegisterModal from '@/app/components/modals/RegisterModal';
import SearchModal from '@/app/components/modals/SearchModal';
import RentModal from '@/app/components/modals/RentModal';
import PromoteModal from './components/modals/PromoteModal';
import Messenger from './components/Messenger';

import ToasterProvider from '@/app/providers/ToasterProvider';

import './globals.css';
import ClientOnly from './components/ClientOnly';
import getCurrentUser from './actions/getCurrentUser';
import ExperienceModal from './components/modals/ExperienceModal';
import Footer from './components/Footer';

export const metadata = {
  title: 'Vuoiaggio | Wanna Go? Let`&apos;`s Go!',
  description: 'Wanna Go? Let`&apos;`s Go!',
};

const font = Nunito({
  subsets: ['latin'],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en">
      <body className={font.className}>
        <Script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          strategy="beforeInteractive"
        />

        <ClientOnly>
          <ToasterProvider />
          <NavBar currentUser={currentUser} />
          <LoginModal />
          <RegisterModal />
          <SearchModal />
          <RentModal />
          <ExperienceModal />
          <PromoteModal currentUser={currentUser} />
          <Messenger userId={currentUser?.id} />
        </ClientOnly>

        {/* ✅ Main page content comes first */}
        <div className="pb-20 pt-28 min-h-screen">
          {children}
        </div>

        {/* ✅ Footer at the bottom */}
        <div className="w-full pt-20">
          <Footer />
        </div>
      </body>
    </html>
  );
}

import { Nunito } from 'next/font/google';
import Script from 'next/script';

import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

export const dynamic = 'force-dynamic';

import NavBar from '@/app/components/navbar/NavBar';
import LoginModal from '@/app/components/modals/LoginModal';
import RegisterModal from '@/app/components/modals/RegisterModal';
import SearchModal from '@/app/components/modals/SearchModal';
import RentModal from '@/app/components/modals/RentModal';
import PromoteModal from './components/modals/PromoteModal';
import ForgetPasswordModal from './components/modals/ForgetPasswordModal';
import Messenger from './components/Messenger';

import ToasterProvider from '@/app/providers/ToasterProvider';
import AnnouncementModal from './components/AnnouncementModal';

import './globals.css';
import ClientOnly from './components/ClientOnly';
import getCurrentUser from './actions/getCurrentUser';
import ExperienceModal from './components/modals/ExperienceModal';
import Footer from './components/Footer';

export const metadata = {
  title: 'Vuoiaggio | Wanna Go? Let\'s Go!',
  description: 'Wanna Go? Let\'s Go!',
  icons: {
    icon: '/favicon.ico', // ✅ tells Next.js where to find it
  },
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
      <body className={`${font.className} min-h-screen flex flex-col overflow-x-hidden`}>
        <Script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          strategy="beforeInteractive"
        />

        <ClientOnly>
          <ToasterProvider />
          <NavBar currentUser={currentUser} />
          <AnnouncementModal />
          <LoginModal />
          <RegisterModal />
          <ForgetPasswordModal />
          <SearchModal />
          <RentModal />
          <ExperienceModal currentUser={currentUser}/>
          <PromoteModal currentUser={currentUser} />
          {currentUser && <Messenger currentUser={currentUser} />}
        </ClientOnly>

        {/* <div className="pb-20 pt-28 min-h-screen"> */}
        <main className="flex-grow pb-0 pt-28">
          {children}
        </main>

        <div className="w-full pt-20">
          <Footer currentUser={currentUser}/>
        </div>
      </body>
    </html>
  );
}

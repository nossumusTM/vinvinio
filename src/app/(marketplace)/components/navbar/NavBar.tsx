'use client'

import Link from "next/link";
import { useState, useEffect } from "react";
import { SafeUser } from "@/app/(marketplace)/types";

import Categories from "./Categories";
import Container from "../Container";
import Logo from "./Logo";
import Search from "./Search";
import SearchExperience from "./SearchExperience";
import LocaleButton from "./LocaleButton";
import UserMenu from "./UserMenu";
import { usePathname } from 'next/navigation';

import { motion, type Variants } from 'framer-motion';
import { LuLifeBuoy } from "react-icons/lu";

interface NavBarProps {
    currentUser?: SafeUser | null;
}

const NavBar: React.FC<NavBarProps> = ({ currentUser }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  const pathname = usePathname();
  const isListingPage = pathname?.startsWith('/listings/') || pathname?.startsWith('/services/');
  const isCheckoutPage = pathname?.startsWith('/checkout');
  const isHomePage = pathname === '/';
  const keepVisible = isListingPage || isCheckoutPage;

  const navbarVariants: Variants = {
    hidden:   { y: -120, opacity: 0 },
    shown:    { y: 0,    opacity: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },      // cubic-bezier
    offscreen:{ y: -120,               transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
  };

//   useEffect(() => {

//     if (isListingPage) {
//       setVisible(true);
//       return;
//     }

//   if (!isListingPage) return;

//   const handleScroll = () => {
//     const currentScroll = window.scrollY;
//     setVisible(prevScrollPos > currentScroll || currentScroll < 5);
//     setPrevScrollPos(currentScroll);
//   };

//   window.addEventListener('scroll', handleScroll);
//   return () => window.removeEventListener('scroll', handleScroll);
// }, [isListingPage, prevScrollPos]);

// replace your useEffect with this, using keepVisible
useEffect(() => {
  if (keepVisible || isHomePage) {
    setVisible(true);
    return;
  }

  let lastY = 0;
  let visibleNow = true;
  let ticking = false;
  const THRESHOLD = 8;

  const onScroll = () => {
    const y = window.scrollY;
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const delta = y - lastY;

      let nextVisible = visibleNow;
      if (y < 5) nextVisible = true;
      else if (Math.abs(delta) > THRESHOLD) {
        nextVisible = delta < 0;
      }

      if (nextVisible !== visibleNow) {
        visibleNow = nextVisible;
        setVisible(nextVisible);
      }

      lastY = y;
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, [keepVisible, isHomePage]);

if (!hasMounted) {
    // avoid SSR + initial hydration for the whole navbar subtree
    return null;
  }

  return (
    // <div
    //   className={`fixed w-full bg-white z-50 shadow-sm transition-transform duration-300 ${
    //     visible ? 'translate-y-0' : '-translate-y-[120%]'
    //   }`}
    // >
    <motion.div
      initial="hidden"
      animate={visible ? 'shown' : 'offscreen'}
      variants={navbarVariants}
      className={`fixed w-full z-50 shadow-sm
        `}
    >
      <div
        className={`fixed w-full z-50 shadow-sm transition-transform duration-300
          bg-white/50 backdrop-blur-md supports-[backdrop-filter]:bg-white/40
          ${visible ? 'translate-y-0' : '-translate-y-[120%]'}
        `}
      >
        {/* <div className="p-4 pt-6 md:py-6 border-b-[1px]"> */}
        <div className="p-4 pt-6 md:py-6 shadow-sm">
          <Container>
            <motion.div layout className="flex items-center justify-between w-full relative gap-4">
              {/* Centered logo on desktop, left on mobile */}
              <div className="flex-shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2">
                <Logo />
              </div>

              {/* Search left on desktop, centered on mobile/tablet */}
              <motion.div layout className="flex justify-center md:justify-start min-w-[180px] will-change-[width]">
                <SearchExperience />
              </motion.div>

              {/* User Menu always on right */}
              <div className="flex-shrink-0 flex items-center gap-3 justify-center items-center z-10">
                {/* Desktop: show Locale here */}
                <div className="hidden md:block">
                  <Link
                    href="/help-center"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/70 px-2 py-1 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 shadow-md px-4 py-3 hover:shadow-lg"
                  >
                    {/* <span className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent shadow-md"> */}
                      <LuLifeBuoy className="h-4 w-4" />
                    {/* </span> */}
                    <span>Help Center</span>
                  </Link>
                </div>

                {/* <div className="hidden md:block">
                  <LocaleButton />
                </div> */}

                {/* Mobile: Locale is rendered inside the user menu */}
                <UserMenu currentUser={currentUser} showLocaleInMenu />
              </div>
            </motion.div>
          </Container>
        </div>

        <div className="relative z-100">
          <Categories />
        </div>
      </div>
    </motion.div>
  );
};

export default NavBar;
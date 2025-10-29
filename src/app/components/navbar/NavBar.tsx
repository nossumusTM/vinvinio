'use client'

import { useState, useEffect } from "react";
import { SafeUser } from "@/app/types";

import Categories from "./Categories";
import Container from "../Container";
import Logo from "./Logo";
import Search from "./Search";
import SearchExperience from "./SearchExperience";
import UserMenu from "./UserMenu";
import { usePathname } from 'next/navigation';

interface NavBarProps {
    currentUser?: SafeUser | null;
}

const NavBar: React.FC<NavBarProps> = ({ currentUser }) => {

  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  const pathname = usePathname();
  // add next to isListingPage
  const isListingPage = pathname?.startsWith('/listings/') || pathname?.startsWith('/tours/');
  const isCheckoutPage = pathname?.startsWith('/checkout');
  const keepVisible = isListingPage || isCheckoutPage;

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
  // Keep navbar always visible on listing & checkout pages
  if (keepVisible) {
    setVisible(true);
    return;
  }

  let lastY = 0;
  let visibleNow = true;
  let ticking = false;
  const THRESHOLD = 8; // ignore tiny scrolls

  const onScroll = () => {
    const y = window.scrollY;
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const delta = y - lastY;

      let nextVisible = visibleNow;
      if (y < 5) nextVisible = true;           // near top: show
      else if (Math.abs(delta) > THRESHOLD) {
        nextVisible = delta < 0;               // up: show, down: hide
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
  }, [keepVisible]);

  return (
    // <div
    //   className={`fixed w-full bg-white z-50 shadow-sm transition-transform duration-300 ${
    //     visible ? 'translate-y-0' : '-translate-y-[120%]'
    //   }`}
    // >
    <div
      className={`fixed w-full z-50 shadow-sm transition-transform duration-300
        bg-white/50 backdrop-blur-md supports-[backdrop-filter]:bg-white/40
        ${visible ? 'translate-y-0' : '-translate-y-[120%]'}
      `}
    >
      {/* <div className="p-4 pt-6 md:py-6 border-b-[1px]"> */}
      <div className="p-4 pt-6 md:py-6">
        <Container>
          <div className="flex items-center justify-between w-full relative gap-4">
            {/* Centered logo on desktop, left on mobile */}
            <div className="flex-shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2">
              <Logo />
            </div>

            {/* Search left on desktop, centered on mobile/tablet */}
            <div className="flex-1 flex justify-center md:justify-start">
              <SearchExperience />
            </div>

            {/* User Menu always on right */}
            <div className="flex-shrink-0 flex justify-end z-10">
              <UserMenu currentUser={currentUser} />
            </div>
          </div>
        </Container>
      </div>

      <div className="relative z-0">
        <Categories />
      </div>
    </div>
  );
};

export default NavBar;
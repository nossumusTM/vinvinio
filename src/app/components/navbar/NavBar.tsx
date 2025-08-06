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
  const isListingPage = pathname?.startsWith('/listings/');

  useEffect(() => {
  if (!isListingPage) return;

  const handleScroll = () => {
    const currentScroll = window.scrollY;
    setVisible(prevScrollPos > currentScroll || currentScroll < 5);
    setPrevScrollPos(currentScroll);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [isListingPage, prevScrollPos]);

  return (
    <div
      className={`fixed w-full bg-white z-50 shadow-sm transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-[120%]'
      }`}
    >
      <div className="p-4 pt-6 md:py-6 border-b-[1px]">
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
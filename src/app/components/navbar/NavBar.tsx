import { SafeUser } from "@/app/types";

import Categories from "./Categories";
import Container from "../Container";
import Logo from "./Logo";
import Search from "./Search";
import UserMenu from "./UserMenu";
import AnnouncementBar from "../AnnouncementBar";

interface NavBarProps {
    currentUser?: SafeUser | null;
}

const NavBar: React.FC<NavBarProps> = ({ currentUser }) => {
    return (
      <div className="fixed w-full bg-white z-50 shadow-sm">
        <AnnouncementBar />
       <div className="p-4 pt-6 md:py-6 border-b-[1px]">
          <Container>
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <Logo />
                </div>
              <div className="relative z-10">
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
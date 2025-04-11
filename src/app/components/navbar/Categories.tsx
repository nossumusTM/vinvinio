'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import clsx from "clsx";
import { TbBeach, TbMountain, TbPool, TbScooterElectric, TbCar, TbPhoto, TbBurger, TbShoppingBag } from 'react-icons/tb';
import { motion, AnimatePresence } from 'framer-motion';
import { SiFiat, SiVespa } from "react-icons/si";
import { GrRestaurant } from "react-icons/gr";
import { BiPhotoAlbum } from "react-icons/bi";
import { LuShoppingBag } from "react-icons/lu";
import { MdOutlineTour } from "react-icons/md";
import {
    GiBarn,
    GiBoatFishing,
    GiCactus,
    GiCastle,
    GiCaveEntrance,
    GiForestCamp,
    GiIsland,
    GiWindmill
} from 'react-icons/gi';
import { FaSkiing } from 'react-icons/fa';
import { BsSnow } from 'react-icons/bs';
import { IoDiamond } from 'react-icons/io5';
import { MdOutlineVilla } from 'react-icons/md';

import CategoryBox from "../CategoryBox";
import Container from '../Container';

import { useState } from 'react';
import { LuChevronUp } from 'react-icons/lu';

export const categories = [
    {
        label: 'La Bella Tour',
        icon: SiFiat,
        description: 'Aventine Hill Tour in Vintage Fiat 500 Convoy',
    },
    {
        label: 'Photo Muse',
        icon: BiPhotoAlbum,
        description: 'Capture the timeless beauty of one of the most iconic landmarks'
    },
    {
        label: 'Viva Vespa!',
        icon: SiVespa,
        description: 'Vespa Sidecar Tour with Pickup, Drop-off',
    },
    {
        label: 'Alla Italiana',
        icon: LuShoppingBag,
        description: "Discover Italy’s finest fashion and artisanal treasures on an exclusive shopping tour."
    },
    // {
    //     label: 'Cooking Class',
    //     icon: GrRestaurant,
    //     description: 'Guided Food & Wine Tour in Trastevere'
    // },
    {
        label: 'Walking Art',
        icon: MdOutlineTour,
        description: "Experience the city's heartbeat through unique stories hidden behind the scenes"
    },
    // {
    //     label: 'Lake',
    //     icon: GiBoatFishing,
    //     description: 'This property is near a lake!'
    // },
    // {
    //     label: 'Skiing',
    //     icon: FaSkiing,
    //     description: 'This property has skiing activies!'
    // },
    // {
    //     label: 'Castles',
    //     icon: GiCastle,
    //     description: 'This property is an ancient castle!'
    // },
    // {
    //     label: 'Caves',
    //     icon: GiCaveEntrance,
    //     description: 'This property is in a spooky cave!'
    // },
    // {
    //     label: 'Camping',
    //     icon: GiForestCamp,
    //     description: 'This property offers camping activities!'
    // },
    // {
    //     label: 'Arctic',
    //     icon: BsSnow,
    //     description: 'This property is in arctic environment!'
    // },
    // {
    //     label: 'Desert',
    //     icon: GiCactus,
    //     description: 'This property is in the desert!'
    // },
    // {
    //     label: 'Barns',
    //     icon: GiBarn,
    //     description: 'This property is in a barn!'
    // },
    // {
    //     label: 'Lux',
    //     icon: IoDiamond,
    //     description: 'This property is brand new and luxurious!'
    // },
    // {
    //     label: 'Caves',
    //     icon: GiCaveEntrance,
    //     description: 'This property is in a spooky cave!'
    // },
    // {
    //     label: 'Camping',
    //     icon: GiForestCamp,
    //     description: 'This property offers camping activities!'
    // },
    // {
    //     label: 'Arctic',
    //     icon: BsSnow,
    //     description: 'This property is in arctic environment!'
    // },
    // {
    //     label: 'Desert',
    //     icon: GiCactus,
    //     description: 'This property is in the desert!'
    // },
    // {
    //     label: 'Barns',
    //     icon: GiBarn,
    //     description: 'This property is in a barn!'
    // },
]

const Categories = () => {
    const params = useSearchParams();
    const category = params?.get('category');
    const pathname = usePathname();
    const isMainPage = pathname === '/';
    const [visible, setVisible] = useState(true);

    if (!isMainPage) {
        return null;
    }

    // return (
    //     <div className="w-full overflow-x-auto">
    //       <Container>
    //       <div
    //         className="
    //             pt-4
    //             flex 
    //             flex-row 
    //             items-center 
    //             gap-2
    //             overflow-x-auto
    //             scroll-smooth
    //             scrollbar-thin
    //             snap-x 
    //             snap-mandatory
    //             w-full
    //             sm:w-auto
    //         "
    //         >
    //           {categories.map((item) => (
    //             <CategoryBox
    //               key={item.label}
    //               label={item.label}
    //               icon={item.icon}
    //               selected={category === item.label}
    //             />
    //           ))}
    //         </div>
    //       </Container>
    //     </div>
    //   );
    
    return (
      <div className="w-full relative">
        <AnimatePresence initial={false}>
          {visible && (
            <motion.div
              key="categories"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={clsx(
                "overflow-hidden relative z-0", // 👈 Ensure it's behind UserMenu
                !visible && "pointer-events-none" // 👈 Prevent blocking clicks
              )}
            >
              <Container>
                <div
                  className="
                    pt-4
                    flex 
                    flex-row 
                    items-center 
                    gap-2
                    overflow-x-auto
                    scroll-smooth
                    scrollbar-thin
                    snap-x 
                    snap-mandatory
                    w-full
                    sm:w-auto
                  "
                >
                  {categories.map((item) => (
                    <CategoryBox
                      key={item.label}
                      label={item.label}
                      icon={item.icon}
                      selected={category === item.label}
                    />
                  ))}
                </div>
              </Container>
            </motion.div>
          )}
        </AnimatePresence>
    
        {/* Toggle Button (stays fixed in position) */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-12px] z-10">
          <div
            onClick={() => setVisible((prev) => !prev)}
            className="bg-white border shadow-md rounded-full p-1 cursor-pointer transition-transform duration-300"
          >
            <motion.div
              animate={{ rotate: visible ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <LuChevronUp size={15} strokeWidth={3} color="#000" />
            </motion.div>
          </div>
        </div>
      </div>
    );     
}

export default Categories;
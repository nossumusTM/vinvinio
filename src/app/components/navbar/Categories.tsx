'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { TbBeach, TbMountain, TbPool, TbScooterElectric, TbCar, TbPhoto, TbBurger, TbShoppingBag } from 'react-icons/tb';
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


export const categories = [
    {
        label: 'Fiat Tour',
        icon: SiFiat,
        description: 'Aventine Hill Tour in Vintage Fiat 500 Convoy',
    },
    {
        label: 'Lookbook',
        icon: BiPhotoAlbum,
        description: 'Capture the timeless beauty of one of the most iconic landmarks'
    },
    {
        label: 'Vespa Tour',
        icon: SiVespa,
        description: 'Vespa Sidecar Tour with Pickup, Drop-off',
    },
    {
        label: 'Shopping',
        icon: LuShoppingBag,
        description: "Discover Italy’s finest fashion and artisanal treasures on an exclusive shopping tour."
    },
    {
        label: 'Food Guide',
        icon: GrRestaurant,
        description: 'Guided Food & Wine Tour in Trastevere'
    },
    {
        label: 'Tour Guide',
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

    if (!isMainPage) {
        return null;
    }

    return (
        <div className="w-full overflow-x-auto">
          <Container>
          <div
            className="
                pt-4
                flex 
                flex-row 
                items-center 
                gap-0
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
        </div>
      );
      
}

export default Categories;
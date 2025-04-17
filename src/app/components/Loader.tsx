'use client';

import { PuffLoader, CircleLoader, BarLoader } from "react-spinners";

const Loader = () => {
    return (
        <div
            className="
      h-[70vh]
      flex 
      flex-col 
      justify-center 
      items-center 
    "
        >
            <BarLoader
                color="#0066ff"
            />
        </div>
    );
}

export default Loader;
'use client';

import { PuffLoader, CircleLoader } from "react-spinners";

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
            <PuffLoader
                size={100}
                color="#0066ff"
            />
        </div>
    );
}

export default Loader;
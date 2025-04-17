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
            <CircleLoader
                size={100}
                color="#04aaff"
            />
        </div>
    );
}

export default Loader;
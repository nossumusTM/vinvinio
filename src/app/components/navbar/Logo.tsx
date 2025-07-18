// 'use client';

// import Image from "next/image";
// import { useRouter } from "next/navigation";

// const Logo = () => {
//     const router = useRouter();

//     return (
//         <div onClick={() => router.push('/')}>
//             <Image
//                 onClick={() => router.push('/')}
//                 // className="hidden md:block cursor-pointer"
//                 className="block cursor-pointer"
//                 src="/images/vuolalogo1.png"
//                 height="150"
//                 width="150"
//                 alt="Logo"
//                 priority
//             />
//         </div>
//     );
// }

// export default Logo;

'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";

const Logo = () => {
  const router = useRouter();

  return (
    <div onClick={() => router.push('/')} className="cursor-pointer">
      {/* Desktop Logo (shown on md and up) */}
      <Image
        src="/images/vuolalogo1.png"
        alt="Vuola Logo Desktop"
        width={150}
        height={150}
        priority
        className="hidden md:block"
      />

      {/* Mobile Logo (shown below md breakpoint) */}
      <Image
        src="/images/vuola-logo-mobile1.png"
        alt="Vuola Logo Mobile"
        width={90}
        height={90}
        priority
        className="block md:hidden mr-2"
      />
    </div>
  );
};

export default Logo;
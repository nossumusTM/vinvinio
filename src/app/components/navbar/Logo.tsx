'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";

const Logo = () => {
    const router = useRouter();

    return (
        <div onClick={() => router.push('/')}>
            <Image
                onClick={() => router.push('/')}
                // className="hidden md:block cursor-pointer"
                className="block cursor-pointer shadow-md p-2 rounded-full"
                src="/images/vuoiaggiologo.png"
                height="60"
                width="60"
                alt="Logo"
            />
        </div>
    );
}

export default Logo;
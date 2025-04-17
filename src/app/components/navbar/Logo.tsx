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
                className="block cursor-pointer"
                src="/images/vuoiaggiologo.png"
                height="80"
                width="80"
                alt="Logo"
            />
        </div>
    );
}

export default Logo;
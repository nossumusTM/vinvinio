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
                height="40"
                width="40"
                alt="Logo"
                priority
            />
        </div>
    );
}

export default Logo;
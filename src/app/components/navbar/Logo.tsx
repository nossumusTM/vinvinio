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
                className="block cursor-pointer ml-2"
                src="/images/vuoiaggiologo.png"
                height="44"
                width="44"
                alt="Logo"
            />
        </div>
    );
}

export default Logo;
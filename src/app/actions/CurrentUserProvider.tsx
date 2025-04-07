'use client';

import { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';
import { SafeUser } from '@/app/types';
import { useRouter } from 'next/navigation';

interface Props {
  children: (currentUser: SafeUser | null) => JSX.Element;
}

const CurrentUserProvider = ({ children }: Props) => {
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/users/me', {
        credentials: 'same-origin',
      });
      const data = await res.json();
      setCurrentUser(data?.id ? data : null);
    };

    fetchUser();
  }, [router]); // trigger on route changes too

  return children(currentUser);
};

export default CurrentUserProvider;
import { redirect } from 'next/navigation';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import ModerClient from './ModerClient';

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'moder') {
    redirect('/');
  }

  return <ModerClient currentUser={currentUser} />;
}

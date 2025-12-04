import { redirect } from 'next/navigation';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

import ModerationQueueClient from './ModerationQueueClient';

export const dynamic = 'force-dynamic';

export default async function ModerationQueuePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'moder') {
    redirect('/');
  }

  return <ModerationQueueClient />;
}
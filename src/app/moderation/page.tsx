import getCurrentUser from '@/app/actions/getCurrentUser';
import ModerClient from './ModerClient';

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  const currentUser = await getCurrentUser();

  return <ModerClient currentUser={currentUser} />;
}

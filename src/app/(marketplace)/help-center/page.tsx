import getCurrentUser from '../actions/getCurrentUser';
import HelpCenterContent from '../components/help-center/HelpCenterContent';

export const metadata = {
  title: 'Help Center | Vuola',
  description: 'Find answers, chat with an Operator, and explore policies for safe travel with Vuola.',
};

export default async function HelpCenterPage() {
  const currentUser = await getCurrentUser();

  return <HelpCenterContent currentUser={currentUser} />;
}
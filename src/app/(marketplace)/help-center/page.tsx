import getCurrentUser from '../actions/getCurrentUser';
import HelpCenterContent from '../components/help-center/HelpCenterContent';

export const metadata = {
  title: 'Help Center | Vinvin',
  description: 'Find answers, chat with an Operator, and explore policies for safe service use with Vinvin.',
};

export default async function HelpCenterPage() {
  const currentUser = await getCurrentUser();

  return <HelpCenterContent currentUser={currentUser} />;
}

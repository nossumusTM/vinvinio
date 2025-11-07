import { redirect } from "next/navigation";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";

export const dynamic = 'force-dynamic';

const HostSelfCardPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'host') {
    redirect('/');
  }

  const username = currentUser.username;
  if (!username) {
    redirect('/profile');
  }

  redirect(`/hosts/${encodeURIComponent(username)}`);
};

export default HostSelfCardPage;


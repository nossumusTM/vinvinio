import ClientOnly from "@/app/(marketplace)/components/ClientOnly";
import EmptyState from "@/app/(marketplace)/components/EmptyState";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import SocialCardClient from "./SocialCardClient";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

const SocialCardPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  if (currentUser.role !== 'customer') {
    return (
      <ClientOnly>
        <EmptyState
          title="Unavailable"
          subtitle="The social card is currently available for users only."
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <SocialCardClient currentUser={currentUser} />
    </ClientOnly>
  );
};

export default SocialCardPage;

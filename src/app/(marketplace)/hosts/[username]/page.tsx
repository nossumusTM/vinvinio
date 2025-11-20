import ClientOnly from "@/app/(marketplace)/components/ClientOnly";
import EmptyState from "@/app/(marketplace)/components/EmptyState";
import getHostCardData from "@/app/(marketplace)/actions/getHostCardData";
import HostCardClient from "./HostCardClient";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";

interface HostCardPageProps {
  params: {
    username: string;
  };
}

export const dynamic = 'force-dynamic';

const HostCardPage = async ({ params }: HostCardPageProps) => {
  const identifier = params.username;
  const currentUser = await getCurrentUser();
  const data = await getHostCardData(identifier, currentUser?.id);

  if (!data) {
    return (
      <ClientOnly>
        <EmptyState
          title="Host not found"
          subtitle="We couldn’t locate the host card you were looking for."
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <HostCardClient
        host={data.host}
        listings={data.listings}
        reviews={data.reviews}
        currentUser={currentUser}
        isFollowing={data.isFollowing}
      />
    </ClientOnly>
  );
};

export default HostCardPage;


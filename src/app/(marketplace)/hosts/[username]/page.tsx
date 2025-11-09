import ClientOnly from "@/app/(marketplace)/components/ClientOnly";
import EmptyState from "@/app/(marketplace)/components/EmptyState";
import getHostCardData from "@/app/(marketplace)/actions/getHostCardData";
import HostCardClient from "./HostCardClient";

interface HostCardPageProps {
  params: {
    username: string;
  };
}

export const dynamic = 'force-dynamic';

const HostCardPage = async ({ params }: HostCardPageProps) => {
  const identifier = params.username;
  const data = await getHostCardData(identifier);

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
      <HostCardClient host={data.host} listings={data.listings} reviews={data.reviews} />
    </ClientOnly>
  );
};

export default HostCardPage;


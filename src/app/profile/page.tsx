import getReferralBookings from "../actions/getReferralBookings";
import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";
import { redirect } from "next/navigation";
export const dynamic = 'force-dynamic';
import getCurrentUser from "@/app/actions/getCurrentUser";

import ProfileClient from "./ProfileClient";

const ProfilePage = async () => {
  const currentUser = await getCurrentUser();

//   if (!currentUser) {
//     return (
//       <ClientOnly>
//         <EmptyState
//           title="Unauthorized"
//           subtitle="Please login to view your profile"
//         />
//       </ClientOnly>
//     );
//   }

    if (!currentUser) {
            redirect('/');
    }

  const referralBookings = await getReferralBookings(currentUser.referenceId || '');

  return (
    <ClientOnly>
      <ProfileClient currentUser={currentUser} referralBookings={referralBookings} />
    </ClientOnly>
  );
};

export default ProfilePage;
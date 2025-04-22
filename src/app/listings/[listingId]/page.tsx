
// import getListingById from "@/app/actions/getListingById";
// import getReservations from "@/app/actions/getReservations";
// export const dynamic = 'force-dynamic';
// import getCurrentUser from "@/app/actions/getCurrentUser";

// import ClientOnly from "@/app/components/ClientOnly";
// import EmptyState from "@/app/components/EmptyState";

// import ListingClient from "./ListingClient";

// interface IParams {
//     listingId?: string;
// }

// const ListingPage = async ({ params }: { params: IParams }) => {

//     const listing = await getListingById(params);
//     // const reservations = await getReservations(params);
//     // const currentUser = await getCurrentUser();
//     const currentUser = await getCurrentUser();

//     const reservations = await getReservations({
//     userId: currentUser?.id,
//     listingId: params.listingId,
//     });


//     if (!listing) {
//         return (
//             <ClientOnly>
//                 <EmptyState />
//             </ClientOnly>
//         );
//     }

//     return (
//         <ClientOnly>
//             <ListingClient
//                 listing={listing}
//                 reservations={reservations}
//                 currentUser={currentUser}
//             />
//         </ClientOnly>
//     );
// }

// export default ListingPage;

import getListingById from "@/app/actions/getListingById";
import getListingReservations from "@/app/actions/getListingReservations"; // ✅ updated
export const dynamic = 'force-dynamic';
import getCurrentUser from "@/app/actions/getCurrentUser";

import ClientOnly from "@/app/components/ClientOnly";
import EmptyState from "@/app/components/EmptyState";

import ListingClient from "./ListingClient";

interface IParams {
  listingId?: string;
}

const ListingPage = async ({ params }: { params: IParams }) => {
  const listing = await getListingById(params);
  const currentUser = await getCurrentUser();

  const reservations = await getListingReservations(params.listingId!); // ✅ updated

  if (!listing) {
    return (
      <ClientOnly>
        <EmptyState />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <ListingClient
        listing={listing}
        reservations={reservations}
        currentUser={currentUser}
      />
    </ClientOnly>
  );
};

export default ListingPage;

import EmptyState from "@/app/components/EmptyState";
import ClientOnly from "@/app/components/ClientOnly";

import { redirect } from "next/navigation";

 "@/app/actions/getCurrentUser";
import getListings from "@/app/actions/getListings";

import PropertiesClient from "./PropertiesClient";

const PropertiesPage = async () => {
    const currentUser = await getCurrentUser();

    // if (!currentUser) {
    //     return <EmptyState
    //         title="Unauthorized"
    //         subtitle="Please login"
    //     />
    // }

    if (!currentUser) {
            redirect('/');
    }

    const listings = await getListings({ userId: currentUser.id });

    if (listings.length === 0) {
        return (
            <ClientOnly>
                <EmptyState
                    title="No properties found"
                    subtitle="Looks like you have no properties."
                />
            </ClientOnly>
        );
    }

    return (
        <ClientOnly>
            <PropertiesClient
                listings={listings}
                currentUser={currentUser}
            />
        </ClientOnly>
    );
}

export default PropertiesPage;
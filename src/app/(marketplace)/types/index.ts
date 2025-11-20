// import { Listing, Reservation, User, $Enums } from "@prisma/client";
// import { ListingStatus } from '@prisma/client';

// export type SafeListing = Omit<Listing, "createdAt" | "updatedAt"> & {
//   createdAt: string;
//   updatedAt: string;
//   hostDescription: string | null;
//   experienceHour: number | null;
//   meetingPoint: string | null;
//   languages: string[]; // Assuming this is non-null in your DB
//   locationType: string[]; // Assuming this is non-null in your DB
//   locationDescription: string | null;
//   groupStyles: string[];
//   durationCategory: string | null;
//   environments: string[];
//   activityForms: string[];
//   seoKeywords: string[];
//   pricingType: Listing["pricingType"];
//   groupPrice: number | null;
//   groupSize: number | null;
//   customPricing: { minGuests: number; maxGuests: number; price: number }[] | null;
//   user: SafeUser;
//   slug?: string | null;
//   primaryCategory?: string | null;
//   status: Listing["status"];
// };

// export type SafeReservation = Omit<
//   Reservation,
//   "createdAt" | "startDate" | "endDate" | "listing"
// > & {
//   createdAt: string;
//   startDate: string;
//   endDate: string;
//   guestCount: number;
//   guestContact?: string;
//   user: SafeUser;
//   // listing: SafeListing & {
//   //   user: SafeUser;
//   // };
//   listing: SafeListing;
// };

// export type SafeUser = Omit<
//   User,
//   "createdAt" | "updatedAt" | "emailVerified" | "hashedPassword"
// > & {
//   createdAt: string;
//   updatedAt: string;
//   emailVerified: string | null;

//   phone?: string | null;
//   contact?: string | null;
//   legalName?: string | null;
//   address?: string | null;
//   hostName?: string | null;
//   bio?: string | null;
//   profession?: string | null;
  
//   visitedCountries?: string[];
//   visitedCities?: string[];

//   hobbies?: string[];          
//   preferredContacts?: string[];

//   identityVerified: boolean;

//   referenceId?: string | null; 
//   favoriteIds?: string[];      

// };

import type { Listing, Reservation, User } from "@prisma/client";

/** Utility to make intersections read nicely in IDEs */
type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type SocialCardVisibility = {
  image?: boolean;
  name?: boolean;
  email?: boolean;
  phone?: boolean;
  bio?: boolean;
  countries?: boolean;
  cities?: boolean;
  profession?: boolean;
  hobbies?: boolean;
  contacts?: boolean;
};

export type SocialCardVisitedPlace = {
  city?: string | null;
  countryCode: string;
  countryName: string;
};

/* ------------------------- SafeUser (relaxed) ------------------------- */

type SafeUserStrict = Omit<
  User,
  "createdAt" | "updatedAt" | "emailVerified" | "hashedPassword" | "passwordUpdatedAt"
> & {
  createdAt: string;
  updatedAt: string;
  emailVerified: string | null;

  // 🔧 make this optional+nullable so older rows / partial shapes are fine
  alternateRole?: User["role"] | null;

  phone: string | null;
  contact: string | null;
  legalName: string | null;
  address: string | null;
  hostName: string | null;
  username: string | null;
  bio: string | null;
  profession: string | null;

  visitedCountries: string[];
  visitedCities: string[];

  hobbies: string[];
  preferredContacts: string[];

  identityVerified: boolean;

  phoneVerified: boolean;

  passwordUpdatedAt: string | null;

  referenceId: string | null;
  favoriteIds: string[];

  isSuspended: boolean;
  suspendedAt: Date | string | null;
  socialCardVisibility: SocialCardVisibility | null;
  socialCardIsPublic: boolean;
  visitedPlaces: SocialCardVisitedPlace[] | null;
  partnerCommission: number;
  followersCount: number;
  allTimeBookingCount: number;
};

/**
 * Easy-mode: core identity stays required; everything else is optional.
 * `alternateRole` is *not* in the required core anymore.
 */
export type SafeUser = Simplify<
  Pick<SafeUserStrict, "id" | "role" | "createdAt" | "updatedAt" | "emailVerified"> &
  Partial<Omit<SafeUserStrict, "id" | "role" | "createdAt" | "updatedAt" | "emailVerified">>
>;

/* ------------------------ SafeListing (relaxed) ----------------------- */

/** Accept whatever your schema currently has for these fields */
type Pricingish = Listing extends { pricingType: infer P } ? P | null : string | null;
type Statusish  = (Listing extends { status: infer S } ? S : string) | 'awaiting_reapproval';

export type SafeListing = Simplify<
  Omit<Listing, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;

    // Keep your custom fields, but make them permissive
    hostDescription?: string | null;
    experienceHour?: number | null;
    hoursInAdvance?: number | null;
    meetingPoint?: string | null;

    languages?: string[];
    locationType?: string[];
    locationDescription?: string | null;
    groupStyles?: string[];
    durationCategory?: string | null;
    environments?: string[];
    activityForms?: string[];
    seoKeywords?: string[];

    // Tolerate any current UI enum/union/string for pricing
    pricingType?: Pricingish;

    groupPrice?: number | null;
    groupSize?: number | null;
    customPricing?: { minGuests: number; maxGuests: number; price: number }[] | null;

    slug?: string | null;
    primaryCategory?: string | null;

    likesCount?: number;
    likedByCurrentUser?: boolean;

    status: Statusish;
    user: SafeUser;
  }
>;

/* ----------------------- SafeReservation (relaxed) -------------------- */

export type SafeReservation = Simplify<
  Omit<Reservation, "createdAt" | "startDate" | "endDate" | "listing"> & {
    createdAt: string;
    startDate: string;
    endDate: string;
    guestCount: number;
    guestContact?: string;
    user: SafeUser;
    listing: SafeListing;
  }
>;

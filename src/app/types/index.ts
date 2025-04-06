// import { Listing, Reservation, User } from "@prisma/client";

// export type SafeListing = Omit<Listing, "createdAt"> & {
//   createdAt: string;
//   hostDescription?: string | undefined;
//   experienceHour?: number | undefined;
//   meetingPoint?: string;
//   languages?: string[];
//   locationType?: string[];
//   locationDescription?: string;
// };

// export type SafeReservation = Omit<
//   Reservation,
//   "createdAt" | "startDate" | "endDate" | "listing"
// > & {
//   createdAt: string;
//   startDate: string;
//   endDate: string;
//   guestCount: number;
//   user: SafeUser; // ✅ Add this
//   listing: SafeListing & {
//     user: SafeUser;
//   };
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
// };

import { Listing, Reservation, User } from "@prisma/client";

export type SafeListing = Omit<Listing, "createdAt"> & {
  createdAt: string;
  hostDescription: string | null;
  experienceHour: number | null;
  meetingPoint: string | null;
  languages: string[]; // Assuming this is non-null in your DB
  locationType: string[]; // Assuming this is non-null in your DB
  locationDescription: string | null;
};

export type SafeReservation = Omit<
  Reservation,
  "createdAt" | "startDate" | "endDate" | "listing"
> & {
  createdAt: string;
  startDate: string;
  endDate: string;
  guestCount: number;
  user: SafeUser;
  listing: SafeListing & {
    user: SafeUser;
  };
};

export type SafeUser = Omit<
  User,
  "createdAt" | "updatedAt" | "emailVerified" | "hashedPassword"
> & {
  createdAt: string;
  updatedAt: string;
  emailVerified: string | null;
  phone: string | null;
  contact: string | null;
  legalName: string | null;
  address: string | null;
  hostName: string | null;
};
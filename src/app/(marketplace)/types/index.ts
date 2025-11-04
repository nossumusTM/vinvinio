import { Listing, Reservation, User } from "@prisma/client";
import { ListingStatus } from '@prisma/client';

export type SafeListing = Omit<Listing, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
  hostDescription: string | null;
  experienceHour: number | null;
  meetingPoint: string | null;
  languages: string[]; // Assuming this is non-null in your DB
  locationType: string[]; // Assuming this is non-null in your DB
  locationDescription: string | null;
  groupStyles: string[];
  durationCategory: string | null;
  environments: string[];
  activityForms: string[];
  seoKeywords: string[];
  pricingType: string | null;
  groupPrice: number | null;
  groupSize: number | null;
  customPricing: { minGuests: number; maxGuests: number; price: number }[] | null;
  user: SafeUser;
  slug?: string | null;
  status: ListingStatus;
};

export type SafeReservation = Omit<
  Reservation,
  "createdAt" | "startDate" | "endDate" | "listing"
> & {
  createdAt: string;
  startDate: string;
  endDate: string;
  guestCount: number;
  guestContact?: string;
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
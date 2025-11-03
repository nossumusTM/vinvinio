export interface IListingsParams {
  userId?: string;
  guestCount?: number;
  roomCount?: number;
  bathroomCount?: number;
  startDate?: string;
  endDate?: string;
  locationValue?: string;
  category?: string;
  sort?: 'rating' | 'priceLow' | 'priceHigh' | 'random';
  skip?: number;
  take?: number;
  groupStyles?: string[] | string;
  duration?: string;
  environments?: string[] | string;
  activityForms?: string[] | string;
  seoKeywords?: string[] | string;
  languages?: string[] | string;
  statuses?: string[] | string;
}

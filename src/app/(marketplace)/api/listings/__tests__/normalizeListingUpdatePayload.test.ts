import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ListingValidationError,
  normalizeListingUpdatePayload,
} from '../validation';

const basePayload = {
  title: 'Evening food tour',
  description: 'Taste the best food in town.',
  imageSrc: ['https://example.com/one.jpg'],
  category: ['Food & Drink'],
  guestCount: 4,
  location: 'rome-it',
  price: 199,
  experienceHour: 2,
  hostDescription: 'A fun host',
  meetingPoint: 'Central station',
  languages: ['English'],
  locationType: ['city'],
  locationDescription: 'Meet downtown',
  groupStyles: ['group'],
  durationCategory: 'short',
  environments: ['city'],
  activityForms: ['walking'],
  seoKeywords: ['food-tour'],
  pricingType: 'fixed',
  customPricing: null,
};

const existingListing = { status: 'approved', primaryCategory: 'Food & Drink' } as const;

describe('normalizeListingUpdatePayload', () => {
  it('defaults to fixed pricing when an invalid mode is provided', () => {
    const result = normalizeListingUpdatePayload(
      { ...basePayload, pricingType: 'nonsense' },
      existingListing,
    );

    assert.equal(result.pricingMode, 'fixed');
    assert.equal(result.data.customPricing.mode, 'fixed');
    assert.equal(result.data.price, 199);
    assert.equal(result.nextStatus, 'revision');
  });

  it('throws when custom pricing tiers are invalid', () => {
    assert.throws(
      () =>
        normalizeListingUpdatePayload(
          {
            ...basePayload,
            pricingType: 'custom',
            customPricing: [
              { minGuests: 0, maxGuests: 2, price: 50 },
              { minGuests: 3, maxGuests: 0, price: 75 },
            ],
          },
          existingListing,
        ),
      ListingValidationError,
    );
  });

  it('throws when group pricing lacks a price or group size', () => {
    assert.throws(
      () =>
        normalizeListingUpdatePayload(
          {
            ...basePayload,
            pricingType: 'group',
            groupPrice: 0,
            groupSize: 8,
          },
          existingListing,
        ),
      ListingValidationError,
    );

    assert.throws(
      () =>
        normalizeListingUpdatePayload(
          {
            ...basePayload,
            pricingType: 'group',
            groupPrice: 450,
            groupSize: null,
          },
          existingListing,
        ),
      ListingValidationError,
    );
  });

  it('returns normalized custom pricing tiers sorted by min guests', () => {
    const result = normalizeListingUpdatePayload(
      {
        ...basePayload,
        pricingType: 'custom',
        customPricing: [
          { minGuests: 5, maxGuests: 7, price: 120 },
          { minGuests: 1, maxGuests: 3, price: 80 },
        ],
      },
      { status: 'pending', primaryCategory: 'Food & Drink' },
    );

    assert.equal(result.pricingMode, 'custom');
    assert.deepEqual(result.data.customPricing.tiers, [
      { minGuests: 1, maxGuests: 3, price: 80 },
      { minGuests: 5, maxGuests: 7, price: 120 },
    ]);
    assert.equal(result.nextStatus, 'pending');
  });
});

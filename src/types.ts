export type User = { email: string; password: string };

export type ListingType = "auction" | "buy";

export type Listing = {
  id: number;
  title: string;
  category: string; // includes Housing variants
  type: ListingType;
  price?: number;
  currentBid?: number;
  photos: string[];      // blob/object URLs
  owner: string;         // email
  createdAt: number;
};

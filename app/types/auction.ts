import { Bid } from './bid';

export type AuctionDTO = {
  id: number;
  item_name: string;
  description: string;
  auction_start: string;
  auction_end: string;
  starting_bid: number;
  image_path: string;
};

export type Auction = {
  id: string;
  name: string;
  description: string;
  imageUrl: URL;
  start: Date;
  end: Date;
  isActive: boolean;
  highestBid: Bid | null;
  startingBid: number;
};

export type PlaceBidRequest = {
  bid_amount: number;
};

export type CreateAuctionRequest = {
  item_name: string;
  description: string;
  auction_start: string;
  auction_end: string;
  starting_bid: number;
  image_path: string;
};

'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useApiClient, configureHeaders } from '@app/components/ApiClient';
import { useAuth } from '@app/providers/Auth';
import { Auction, AuctionDTO, Bid, BidDTO, PlaceBidRequest } from '@app/types';

type AuctionBids = {
  auction: string;
  bids: Bid[];
};

interface AuctionsContextType {
  auctions: Auction[];
  auctionBids: AuctionBids[];
  getAuctionDetails: (auctionId: string) => Promise<Auction>;
  getHighestBidForAuction: (auctionId: string) => Bid | null;
  getBidsForAuction: (auctionId: string) => Bid[];
  fetchBidsForAuction: (auctionId: string) => Promise<void>;
  placeBid: (auctionId: string, bid: PlaceBidRequest) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

const AuctionsContext = createContext<AuctionsContextType | undefined>(undefined);

export function useAuctions() {
  const context = useContext(AuctionsContext);
  if (context === undefined) {
    throw new Error('useAuctions must be used within an AuctionsProvider');
  }
  return context;
}

export default function AuctionsProvider({ children }: { children: ReactNode }) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [auctionBids, setAuctionBids] = useState<AuctionBids[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { token } = useAuth();
  const { apiClient, isConfigured } = useApiClient();

  const mapAuction = ({ id, item_name, description, auction_start, auction_end, starting_bid, image_path }: AuctionDTO): Auction => {
    const current = new Date();
    const start = new Date(`${auction_start}Z`);
    const end = new Date(`${auction_end}Z`);

    return {
      id: id.toString(),
      name: item_name,
      description,
      imageUrl: URL.canParse(image_path)
        ? new URL(image_path)
        : new URL(image_path, window.location.origin),
      start,
      end,
      isActive: current >= start && current < end,
      startingBid: starting_bid,
      highestBid: null,
    };
  };

  const mapBid = ({ id, auction_id, user_id, bid_time, bid_amount }: BidDTO): Bid => ({
    id,
    auctionId: auction_id.toString(),
    userId: user_id.toString(),
    time: new Date(bid_time),
    amount: bid_amount,
  });

  // Get all bids for a specific auction (from state)
  const getBidsForAuction = useCallback((auctionId: string): Bid[] => {
    const bidCollection = auctionBids.find(col => col.auction === auctionId);
    return bidCollection?.bids || [];
  }, [auctionBids]);

  // Get highest bid for a specific auction (from state)
  const getHighestBidForAuction = useCallback((auctionId: string): Bid | null => {
    const bids = getBidsForAuction(auctionId);
    if (bids.length === 0) return null;

    return bids.reduce((highest, current) =>
        current.amount > highest.amount ? current : highest,
      bids[0]
    );
  }, [getBidsForAuction]);

  // Fetch bids for a specific auction
  const fetchBidsForAuction = useCallback(async (auctionId: string): Promise<void> => {
    if (!token) throw new Error('Authentication required');
    if (!isConfigured) throw new Error('API client not configured yet');

    try {
      setLoading(true);
      configureHeaders(apiClient, token);

      const response = await apiClient.get(`/api/v1/auctions/${auctionId}/bids`);
      const bidData = response.data.map(mapBid);

      setAuctionBids(prevBids => {
        // Find if we already have bids for this auction
        const existingIndex = prevBids.findIndex(item => item.auction === auctionId);

        if (existingIndex >= 0) {
          // Update existing bids for this auction
          const newBids = [...prevBids];
          newBids[existingIndex] = { auction: auctionId, bids: bidData };
          return newBids;
        } else {
          // Add new bids for this auction
          return [...prevBids, { auction: auctionId, bids: bidData }];
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch bids'));
    } finally {
      setLoading(false);
    }
  }, [token, apiClient, isConfigured]);

  async function getAuctionDetails(auctionId: string): Promise<Auction> {
    if (!token) throw new Error('Authentication required');
    if (!isConfigured) throw new Error('API client not configured yet');

    try {
      configureHeaders(apiClient, token);
      const response = await apiClient.get(`/api/v1/auctions/${auctionId}`);
      const auctionData = response.data;
      const mappedAuction = mapAuction(auctionData);

      // Optionally fetch bids for this auction if needed
      await fetchBidsForAuction(auctionId);

      return mappedAuction;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch auction details'));
      throw err;
    }
  }

  async function placeBid(auctionId: string, bid: PlaceBidRequest): Promise<void> {
    if (!token) throw new Error('Authentication required');
    if (!isConfigured) throw new Error('[AuctionsProvider] API client not configured yet');

    try {
      configureHeaders(apiClient, token);
      const response = await apiClient.post(`/api/v1/auctions/${auctionId}/bids`, bid);
      if (response.status !== 201){
        console.warn(response.data);
      }
      await fetchBidsForAuction(auctionId);

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to place bid'));
      throw err;
    }
  }

  // Fetch all auctions
  useEffect(() => {
    const fetchAuctions = async () => {
      if (!isConfigured) {
        console.debug('[AuctionsProvider] API client not configured yet, skipping all auctions fetch');
        return;
      }

      try {
        setLoading(true);
        if (token) {
          configureHeaders(apiClient, token);
        }

        const response = await apiClient.get('/api/v1/auctions');
        const auctionsData = response.data.map(mapAuction);
        setAuctions(auctionsData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch auctions'));
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [token, isConfigured]);


  const value = {
    auctions,
    auctionBids,
    getAuctionDetails,
    getHighestBidForAuction,
    getBidsForAuction,
    fetchBidsForAuction,
    placeBid,
    loading,
    error
  };

  return (
    <AuctionsContext.Provider value={value}>
      {children}
    </AuctionsContext.Provider>
  );
}
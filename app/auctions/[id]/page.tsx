'use client'
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Flex,
  FlexItem,
  PageSection,
  Skeleton,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { TimesCircleIcon } from '@patternfly/react-icons/dist/esm/icons/times-circle-icon';
import DetailsPage from '@patternfly/react-component-groups/dist/dynamic/DetailsPage';
import BidsDataList from './bids-data-list';
import PlaceBidModal from './place-bid-modal';
import { AuctionDescriptionList, SkeletonDescriptionList } from '@app/components/Auction';
import { useAuctions } from '@app/providers/Auctions';
import { useAuth } from '@app/providers/Auth';
import { useConfig } from '@app/providers/Config';
import { Auction} from '@app/types';

export default function AuctionDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const config = useConfig();
  const auctionId = params.id as string;

  const { getAuctionDetails, getHighestBidForAuction, placeBid } = useAuctions();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [placeBidModalIsOpen, setPlaceBidModalIsOpen] = useState(false);
  const [placingBid, setPlacingBid] = useState(false);

  // Use an effect with just auctionId as dependency
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!auctionId) return;

      try {
        setLoading(true);
        const auctionData = await getAuctionDetails(auctionId);

        if (isMounted) {
          setAuction(auctionData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load auction details:', err);
          setError(err instanceof Error ? err : new Error('Failed to load auction details'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [auctionId]); // Only depend on auctionId, not on getAuctionDetails

  const togglePlaceBidModalIsOpen = useCallback(
    () => setPlaceBidModalIsOpen(!placeBidModalIsOpen),
    [placeBidModalIsOpen],
  );

  const handlePlaceBid = async (bidAmount: number) => {
    if (!auction) return;

    try {
      setPlacingBid(true);
      await placeBid(auction.id, { bid_amount: bidAmount });

      // Optionally refresh auction data after successful bid
      const refreshedAuction = await getAuctionDetails(auction.id);
      setAuction(refreshedAuction);
    } catch (err) {
      console.error('Failed to place bid:', err);
      // Optionally show an error message
    } finally {
      setPlacingBid(false); // This will trigger the modal to close via the useEffect
    }
  };


  // Show loading state
  if (loading) {
    return (
      <PageSection hasBodyWrapper={false}>
        <DetailsPage
          pageHeading={{
            title: 'Loading auction details...',
            label: {
              variant: 'outline',
              color: 'grey',
              children: <Skeleton screenreaderText="Loading auction status" />,
              icon: <CheckCircleIcon color="var(--pf-t--color--grey--60)" />,
            },
          }}
          actionButtons={[
            {
              children: "Place a bid",
              onClick: togglePlaceBidModalIsOpen,
              tooltip: "Place a bid",
              isDisabled: true,
            },
          ]}
          tabs={[
            {
              eventKey: 'details',
              title: "Details",
              children: (
                <Flex
                  className="details-tab"
                  spaceItems={{ default: 'spaceItemsLg' }}
                  direction={{ default: 'column' }}
                >
                  <FlexItem>
                    <SkeletonDescriptionList />
                  </FlexItem>
                </Flex>
              ),
            },
          ]}
        />
      </PageSection>
    );
  }

  // Show error state
  if (error) {
    return (
      <PageSection hasBodyWrapper={false}>
        <DetailsPage
          pageHeading={{
            title: 'Error loading auction',
            label: {
              variant: 'outline',
              color: 'red',
              children: 'Error',
              icon: <TimesCircleIcon color="var(--pf-t--color--red--60)" />,
            },
          }}
          tabs={[
            {
              eventKey: 'details',
              title: "Details",
              children: (
                <Flex
                  className="details-tab"
                  spaceItems={{ default: 'spaceItemsLg' }}
                  direction={{ default: 'column' }}
                >
                  <FlexItem>
                    <p>{error.message}</p>
                  </FlexItem>
                </Flex>
              ),
            },
          ]}
        />
      </PageSection>
    );
  }

  // Show auction data (when it's loaded)
  const tabs = [
    {
      eventKey: 'details',
      title: 'Details',
      children: (
        <Flex
          className="details-tab"
          spaceItems={{ default: 'spaceItemsLg' }}
          direction={{ default: 'column' }}
        >
          <FlexItem>
            {auction && <AuctionDescriptionList auction={auction} />}
          </FlexItem>
        </Flex>
      ),
    }
  ]

  if (user?.groups?.includes(config.ADMIN_GROUP_NAME ? config.ADMIN_GROUP_NAME :  'admin')) {
    tabs.push(
      {
        eventKey: 'bids',
        title: 'Bids',
        children: (
          <Flex
            className="bids-tab"
            spaceItems={{ default: 'spaceItemsLg' }}
            direction={{ default: 'column' }}
          >
            <FlexItem>
              {auction && <BidsDataList auctionId={auctionId} />}
            </FlexItem>
          </Flex>
        )
      }
    )
  }

  return (
    <PageSection hasBodyWrapper={false}>
      <DetailsPage
        pageHeading={{
          title: auction?.name || '',
          label: auction?.isActive
            ? {
              variant: 'outline',
              color: 'green',
              children: 'Open',
              icon: <CheckCircleIcon color="var(--pf-t--color--green--60)" />,
            }
            : {
              variant: 'outline',
              color: 'red',
              children: "Closed",
              icon: <TimesCircleIcon color="var(--pf-t--color--red--60)" />,
            },
        }}
        actionButtons={[
          {
            children: 'Place a bid',
            onClick: togglePlaceBidModalIsOpen,
            tooltip: 'Place a bid',
            isDisabled: !auction?.isActive,
          },
        ]}
        tabs={tabs}
      />

      {/* Place Bid Modal */}
      {auction && placeBidModalIsOpen && (
        <PlaceBidModal
          isOpen={placeBidModalIsOpen}
          onClose={togglePlaceBidModalIsOpen}
          startingBid={auction.startingBid}
          currentHighestBid={getHighestBidForAuction(auctionId)?.amount}
          onPlaceBid={ handlePlaceBid }
          placingBid={placingBid}
        />
      )}
    </PageSection>
  );
}
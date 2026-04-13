'use client'

import { useAuctions } from '@app/providers/Auctions';
import { useAuth } from '@app/providers/Auth';
import { useConfig } from '@app/providers/Config';
// import './page.css';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
  EmptyState,
  Flex,
  FlexItem,
  Gallery,
  Grid,
  GridItem,
  PageSection,
} from '@patternfly/react-core';
import { useState } from 'react';
import { redirect } from 'next/navigation';
import CreateAuctionModal from './create-auction-modal';
import { CreateAuctionRequest } from '@app/types';

export default function Auctions() {
  const { auctions, createAuction, loading } = useAuctions();
  const { user } = useAuth();
  const config = useConfig();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCreateAuction = user?.groups?.some(
    (g) => g === config.ADMIN_GROUP_NAME || g === 'auctioneer',
  );

  const handleCreateAuction = async (auction: CreateAuctionRequest) => {
    try {
      setIsSubmitting(true);
      await createAuction(auction);
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CreateAuctionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAuction={handleCreateAuction}
        isSubmitting={isSubmitting}
      />

        <PageSection hasBodyWrapper={false}>
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <Content component={ContentVariants.h1}>Auctions</Content>
            </FlexItem>
            {canCreateAuction && (
              <FlexItem>
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                  Create Auction
                </Button>
              </FlexItem>
            )}
          </Flex>
        </PageSection>
        <PageSection hasBodyWrapper={false} className="auctions-page" isFilled>
          {auctions.length === 0 ? (
            <EmptyState titleText={`No auctions avaiable`} />
          ) : (
            <Gallery
              hasGutter
              minWidths={{
                default: '100%',
                xl: '600px',
              }}
            >
              {auctions?.map(
                ({
                  id,
                  name,
                  description,
                  startingBid,
                  start,
                  end,
                  imageUrl,
                }) => (
                  <Card key={id} id={`auction-card-${id}`} isClickable>
                    <Grid>
                      <GridItem>
                        <CardHeader
                          selectableActions={{
                            onClickAction: () => redirect(`/auctions/${id}`),
                            selectableActionId: id,
                            selectableActionAriaLabelledby: `auction-card-${id}`,
                            name,
                          }}
                        >
                          <img src={imageUrl.toString()} alt={description} />
                        </CardHeader>
                      </GridItem>
                      <GridItem>
                        {/* TODO refactor to use ServiceCard component */}
                        <CardTitle>{name}</CardTitle>
                        <CardBody>
                          {description}
                          <br />
                          <br />
                          <strong>Starting Bid:</strong> ${startingBid}
                          <br />
                          <br />
                          <strong>Auction Opens:</strong> {String(start)}
                          <br />
                          <strong>Auction Closes:</strong> {String(end)}
                        </CardBody>
                      </GridItem>
                    </Grid>
                  </Card>
                ),
              )}
            </Gallery>
          )}
        </PageSection>
    </>
  );
};

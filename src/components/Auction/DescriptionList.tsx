import { Trans } from '@lingui/macro';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { Auction } from '@/types';

export type AuctionDescriptionListProps = {
  auction: Auction;
};

export default ({ auction }: AuctionDescriptionListProps) => {
  return (
    <DescriptionList isHorizontal>
      <DescriptionListGroup>
        <DescriptionListTerm>
          <Trans>Description</Trans>
        </DescriptionListTerm>
        <DescriptionListDescription>
          {auction?.description}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          <Trans>Highest bid amount</Trans>
        </DescriptionListTerm>
        <DescriptionListDescription>
          ${auction?.highestBid?.amount ?? 0}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <img src={auction?.imageUrl.toString()} />
      </DescriptionListGroup>
    </DescriptionList>
  );
};

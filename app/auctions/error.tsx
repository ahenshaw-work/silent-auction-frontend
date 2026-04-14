'use client'

import { Button, Content, ContentVariants } from '@patternfly/react-core';
import ErrorState from '@patternfly/react-component-groups/dist/dynamic/ErrorState';
import UnavailableContent from '@patternfly/react-component-groups/dist/dynamic/UnavailableContent';
import { useRouter } from 'next/navigation';

export default function Error({ error }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter();
  const bodyText = process.env.NODE_ENV !== 'production' ? error.stack : undefined;

  return 'message' in error ? (
    <ErrorState
      titleText={error.message}
      bodyText={bodyText}
      customFooter={
        <Button onClick={() => router.push('/auctions')}>
          <Content component={ContentVariants.p}>Refresh</Content>
        </Button>
      }
    />
  ) : (
    <UnavailableContent />
  );
}

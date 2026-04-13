'use client'

import {
  ActionGroup,
  Button,
  DatePicker,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  ModalBody,
  ModalHeader,
  NumberInput,
  TextArea,
  TextInput,
  TimePicker,
} from '@patternfly/react-core';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';
import { useCallback, useEffect, useState } from 'react';
import { CreateAuctionRequest } from '@app/types';

export type CreateAuctionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateAuction: (auction: CreateAuctionRequest) => void;
  isSubmitting: boolean;
};

// Combines a local Date and a "HH:MM" time string into a UTC LocalDateTime string
// (YYYY-MM-DDTHH:mm:ss) as expected by the backend
const toUtcLocalDateTime = (date: Date, timeStr: string): string => {
  const [hourStr, minuteStr] = timeStr.split(':');
  const local = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    parseInt(hourStr, 10),
    parseInt(minuteStr, 10),
    0,
  );
  return local.toISOString().replace('Z', '').split('.')[0];
};

export default function CreateAuctionModal({
  isOpen,
  onClose,
  onCreateAuction,
  isSubmitting,
}: CreateAuctionModalProps) {
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('');
  const [startingBid, setStartingBid] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState('');
  // Incremented on each open to force DatePicker/TimePicker to remount with fresh state
  const [pickerKey, setPickerKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setItemName('');
      setDescription('');
      setStartDate(undefined);
      setStartTime('');
      setEndDate(undefined);
      setEndTime('');
      setStartingBid(0);
      setImageUrl('');
      setPickerKey((k) => k + 1);
    }
  }, [isOpen]);

  const isValid =
    itemName.trim() &&
    description.trim() &&
    startDate &&
    startTime &&
    endDate &&
    endTime &&
    startingBid > 0;

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isValid || !startDate || !endDate) return;
      onCreateAuction({
        item_name: itemName,
        description,
        auction_start: toUtcLocalDateTime(startDate, startTime),
        auction_end: toUtcLocalDateTime(endDate, endTime),
        starting_bid: startingBid,
        image_path: imageUrl, // field name matches backend CreateAuctionRequest
      });
    },
    [itemName, description, startDate, startTime, endDate, endTime, startingBid, imageUrl, onCreateAuction, isValid],
  );

  const handleTimeChange = (setter: (t: string) => void) =>
    (_event: React.FormEvent<HTMLInputElement>, _time: string, hour?: number, minute?: number, _seconds?: number, isTimeValid?: boolean) => {
      if (isTimeValid && hour !== undefined && minute !== undefined) {
        setter(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
      } else {
        setter('');
      }
    };

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="create-auction-modal-title"
      aria-describedby="create-auction-modal-description"
    >
      <ModalHeader
        title="Create Auction"
        labelId="create-auction-modal-title"
        descriptorId="create-auction-modal-description"
      />
      <ModalBody>
        <Form id="create-auction-form" onSubmit={onSubmit}>
          <FormGroup label="Item Name" isRequired fieldId="item-name">
            <TextInput
              id="item-name"
              value={itemName}
              onChange={(_event, value) => setItemName(value)}
              isRequired
            />
          </FormGroup>
          <FormGroup label="Description" isRequired fieldId="description">
            <TextArea
              id="description"
              value={description}
              onChange={(_event, value) => setDescription(value)}
              isRequired
              resizeOrientation="vertical"
            />
          </FormGroup>
          <FormGroup label="Auction Start" isRequired fieldId="auction-start-date">
            <Flex>
              <FlexItem>
                <DatePicker
                  key={`start-date-${pickerKey}`}
                  id="auction-start-date"
                  aria-label="Auction start date"
                  onChange={(_event, _value, date) => setStartDate(date)}
                />
              </FlexItem>
              <FlexItem>
                <TimePicker
                  key={`start-time-${pickerKey}`}
                  id="auction-start-time"
                  aria-label="Auction start time"
                  onChange={handleTimeChange(setStartTime)}
                  is24Hour
                />
              </FlexItem>
            </Flex>
          </FormGroup>
          <FormGroup label="Auction End" isRequired fieldId="auction-end-date">
            <Flex>
              <FlexItem>
                <DatePicker
                  key={`end-date-${pickerKey}`}
                  id="auction-end-date"
                  aria-label="Auction end date"
                  onChange={(_event, _value, date) => setEndDate(date)}
                />
              </FlexItem>
              <FlexItem>
                <TimePicker
                  key={`end-time-${pickerKey}`}
                  id="auction-end-time"
                  aria-label="Auction end time"
                  onChange={handleTimeChange(setEndTime)}
                  is24Hour
                />
              </FlexItem>
            </Flex>
          </FormGroup>
          <FormGroup label="Starting Bid" isRequired fieldId="starting-bid">
            <NumberInput
              id="starting-bid"
              value={startingBid}
              onMinus={() => setStartingBid(Math.max(0, startingBid - 1))}
              onChange={(event) => setStartingBid(Number((event.target as HTMLInputElement).value))}
              onPlus={() => setStartingBid(startingBid + 1)}
              min={0}
              unitPosition="before"
              unit="$"
            />
          </FormGroup>
          <FormGroup label="Image URL" fieldId="image-url">
            <TextInput
              id="image-url"
              value={imageUrl}
              onChange={(_event, value) => setImageUrl(value)}
            />
          </FormGroup>
          <ActionGroup>
            <Button
              type="submit"
              variant="primary"
              isDisabled={!isValid || isSubmitting}
            >
              Create
            </Button>
            <Button variant="link" onClick={onClose}>
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </ModalBody>
    </Modal>
  );
}

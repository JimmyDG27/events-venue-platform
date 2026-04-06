'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { FavoriteButton } from './FavoriteButton';
import { ScheduleViewingModal } from './ScheduleViewingModal';

interface VenueActionsProps {
  venueId: string;
  venueName: string;
}

export function VenueActions({ venueId, venueName }: VenueActionsProps) {
  const t = useTranslations('venueDetail');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-3">
        <Link href={`/venues/${venueId}/request`} className="block">
          <Button variant="primary" size="lg" className="w-full">
            {t('requestAvailability')}
          </Button>
        </Link>

        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => setModalOpen(true)}
        >
          {t('scheduleViewing')}
        </Button>

        <FavoriteButton venueId={venueId} />
      </div>

      <ScheduleViewingModal
        venueId={venueId}
        venueName={venueName}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

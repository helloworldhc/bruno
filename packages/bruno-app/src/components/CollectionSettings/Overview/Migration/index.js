import React from 'react';
import { useDispatch } from 'react-redux';
import { IconFileCode, IconTransform } from '@tabler/icons';
import { showMigrateToYmlModal } from 'providers/ReduxStore/slices/collection-migration';
import Button from 'ui/Button';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const Migration = ({ collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Only show for bru format collections
  if (collection.format !== 'bru') {
    return null;
  }

  const handleMigrateClick = () => {
    dispatch(
      showMigrateToYmlModal({
        collectionUid: collection.uid,
        collectionPathname: collection.pathname,
        collectionName: collection.name
      })
    );
  };

  return (
    <StyledWrapper>
      <div className="migration-section">
        <div className="text-lg font-medium flex items-center gap-2 mb-4">
          <IconTransform size={20} stroke={1.5} />
          {t('COLLECTION_SETTINGS.MIGRATION', 'Migration')}
        </div>

        <div className="flex items-start">
          <div className="icon-box migration flex-shrink-0 p-3 rounded-lg">
            <IconFileCode className="w-5 h-5" stroke={1.5} />
          </div>
          <div className="ml-4">
            <div className="font-medium">{t('COLLECTION_SETTINGS.MIGRATE_TO_YML', 'Migrate to YML file format')}</div>
            <div className="my-1 text-muted text-sm">
              {t('COLLECTION_SETTINGS.MIGRATE_TO_YML_DESC', 'This collection is stored in BRU format. Switch to YML.')}{' '}
              <a
                href="https://blog.usebruno.com/making-yaml-the-default-in-bruno-v3.1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:underline"
              >
                {t('COMMON.LEARN_MORE', 'Learn More')} &#x2197;
              </a>
            </div>
            <Button
              data-testid="migrate-collection-to-yml-button"
              size="sm"
              color="primary"
              className="mt-2"
              onClick={handleMigrateClick}
            >
              {t('COLLECTION_SETTINGS.CONVERT_TO_YML', 'Convert to YML')}
            </Button>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default Migration;

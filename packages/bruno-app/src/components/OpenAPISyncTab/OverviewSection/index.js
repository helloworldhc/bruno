import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getTotalRequestCountInCollection } from 'utils/collections/';
import { countEndpoints } from '../utils';
import moment from 'moment';
import { IconCheck } from '@tabler/icons';
import Button from 'ui/Button';
import Help from 'components/Help';

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

const OverviewSection = ({ collection, storedSpec, collectionDrift, specDrift, remoteDrift, onTabSelect, error, onOpenSettings }) => {
  const { t } = useTranslation();
  const openApiSyncConfig = collection?.brunoConfig?.openapi?.[0];

  const reduxError = useSelector((state) => state.openapiSync?.collectionUpdates?.[collection.uid]?.error);
  const specMeta = useSelector((state) => state.openapiSync?.storedSpecMeta?.[collection.uid] || null);
  const activeError = error || reduxError;

  const version = specMeta?.version;
  const endpointCount = specMeta?.endpointCount ?? null;
  const lastSyncDate = openApiSyncConfig?.lastSyncDate;
  const groupBy = openApiSyncConfig?.groupBy || 'tags';
  const autoCheckEnabled = openApiSyncConfig?.autoCheck !== false;
  const autoCheckInterval = openApiSyncConfig?.autoCheckInterval || 5;

  const summaryCards = useMemo(() => [
    {
      key: 'total',
      label: t('OPENAPI.TOTAL_IN_COLLECTION', 'Total in Collection'),
      color: 'blue',
      tooltip: t('OPENAPI.TOTAL_ENDPOINTS_TOOLTIP', 'Total endpoints in your collection')
    },
    {
      key: 'inSync',
      label: t('OPENAPI.IN_SYNC_WITH_SPEC', 'In Sync with Spec'),
      color: 'green',
      tooltip: t('OPENAPI.IN_SYNC_TOOLTIP', 'Endpoints that currently match the latest spec from the source')
    },
    {
      key: 'changed',
      label: t('OPENAPI.CHANGED_IN_COLLECTION', 'Changed in Collection'),
      color: 'muted',
      tooltip: t('OPENAPI.CHANGED_TOOLTIP', 'Endpoints modified, deleted, or added locally since last sync'),
      tab: 'collection-changes'
    },
    {
      key: 'pending',
      label: t('OPENAPI.SPEC_UPDATES_PENDING', 'Spec Updates Pending'),
      color: 'amber',
      tooltip: t('OPENAPI.PENDING_TOOLTIP', 'Spec changes available to sync to your collection'),
      tab: 'spec-updates'
    }
  ], [t]);

  // Endpoint Summary counts
  // Total: from collection items in Redux; In Sync: from remote spec comparison
  // Changed/Conflicts: compare against stored spec in AppData (0 on initial sync)
  const hasDriftData = collectionDrift && !collectionDrift.noStoredSpec;

  const totalInCollection = getTotalRequestCountInCollection(collection);

  const inSyncCount = remoteDrift
    ? (remoteDrift.inSync?.length || 0)
    : null;

  const changedInCollection = hasDriftData
    ? (collectionDrift.modified?.length || 0) + (collectionDrift.missing?.length || 0) + (collectionDrift.localOnly?.length || 0)
    : 0;

  const specUpdatesPending = hasDriftData
    ? (specDrift?.added?.length || 0) + (specDrift?.modified?.length || 0) + (specDrift?.removed?.length || 0)
    : (remoteDrift?.modified?.length || 0) + (remoteDrift?.missing?.length || 0);

  // Conflict count: endpoints modified in both spec and collection
  const conflictCount = hasDriftData && specDrift?.modified
    ? (() => {
        const localModifiedIds = new Set((collectionDrift.modified || []).map((ep) => ep.id));
        return specDrift.modified.filter((ep) => localModifiedIds.has(ep.id)).length;
      })()
    : 0;

  const summaryValues = {
    total: totalInCollection,
    inSync: inSyncCount,
    changed: changedInCollection,
    pending: activeError ? null : specDrift ? specUpdatesPending : null
  };

  const details = [
    { label: t('OPENAPI.SPEC_VERSION', 'Spec Version'), value: version ? `v${version}` : '–' },
    { label: t('OPENAPI.ENDPOINTS_IN_SPEC', 'Endpoints in Spec'), value: endpointCount != null ? endpointCount : '–' },
    { label: t('OPENAPI.LAST_SYNCED_AT', 'Last Synced At'), value: lastSyncDate ? moment(lastSyncDate).fromNow() : '–', tooltip: lastSyncDate ? moment(lastSyncDate).format('MMMM D, YYYY [at] h:mm A') : undefined },
    { label: t('OPENAPI.FOLDER_GROUPING', 'Folder Grouping'), value: capitalize(groupBy) },
    { label: t('OPENAPI.AUTO_CHECK_FOR_UPDATES_LABEL', 'Auto Check for Updates'), value: autoCheckEnabled ? t('OPENAPI.EVERY_N_MIN', { count: autoCheckInterval, defaultValue: `Every ${autoCheckInterval} min` }) : t('OPENAPI.DISABLED', 'Disabled') }
  ];

  const hasCollectionChanges = changedInCollection > 0;
  const hasSpecUpdates = specUpdatesPending > 0;

  const bannerState = useMemo(() => {
    const versionInfo = (specDrift?.storedVersion && specDrift?.newVersion && specDrift.storedVersion !== specDrift.newVersion)
      ? ` (v${specDrift.storedVersion} → v${specDrift.newVersion})`
      : '';

    if (activeError) {
      return {
        variant: 'danger',
        title: t('OPENAPI.FAILED_TO_CHECK_UPDATES', 'Failed to check for spec updates'),
        subtitle: activeError,
        buttons: ['open-settings']
      };
    }
    if (specDrift?.storedSpecMissing && !lastSyncDate) {
      return {
        variant: 'warning',
        title: t('OPENAPI.INITIAL_SYNC_REQUIRED', 'Initial sync required — your collection differs from the spec'),
        subtitle: t('OPENAPI.INITIAL_SYNC_DESC', 'Review the changes and sync to bring your collection up to date.'),
        buttons: ['review']
      };
    }
    if (hasSpecUpdates && hasCollectionChanges) {
      return {
        variant: 'warning',
        title: t('OPENAPI.SPEC_AND_COLLECTION_UPDATES', { versionInfo, defaultValue: `OpenAPI spec has new updates${versionInfo} and the collection has changes` }),
        subtitle: t('OPENAPI.SPEC_AND_COLLECTION_UPDATES_DESC', 'New or changed requests are available. Some collection changes may be overwritten.'),
        buttons: ['sync', 'changes']
      };
    }
    if (hasSpecUpdates) {
      return {
        variant: 'warning',
        title: t('OPENAPI.SPEC_NEW_UPDATES', { versionInfo, defaultValue: `OpenAPI spec has new updates${versionInfo}` }),
        subtitle: t('OPENAPI.SPEC_NEW_UPDATES_DESC', 'New or changed requests are available.'),
        buttons: ['sync']
      };
    }
    if (specDrift?.storedSpecMissing && lastSyncDate) {
      return {
        variant: 'warning',
        title: t('OPENAPI.LAST_SYNCED_NOT_FOUND', 'Last synced spec not found'),
        subtitle: t('OPENAPI.LAST_SYNCED_NOT_FOUND_DESC', 'The last synced spec is missing in the storage. Restore the latest spec from the source to track collection changes.'),
        buttons: ['spec-details']
      };
    }
    if (!hasDriftData) return null;
    if (hasCollectionChanges) {
      return {
        variant: 'muted',
        title: t('OPENAPI.COLLECTION_HAS_CHANGES', 'Collection has changes not in the spec'),
        subtitle: t('OPENAPI.COLLECTION_HAS_CHANGES_DESC', 'Some requests have been modified or removed and no longer match the spec.'),
        buttons: ['changes']
      };
    }
    return null;
  }, [activeError, hasDriftData, hasSpecUpdates, hasCollectionChanges, specDrift?.storedSpecMissing, specDrift?.storedVersion, specDrift?.newVersion, lastSyncDate, t]);

  return (
    <div className="overview-section">
      {bannerState && (
        <div className={`overview-status-banner ${bannerState.variant}`}>
          <div className="banner-text">
            <div className="banner-title-row">
              {bannerState.variant === 'success'
                ? <IconCheck size={16} className="status-check-icon" />
                : <div className={`status-dot ${bannerState.variant}`} />}
              <span className="banner-title">{bannerState.title}</span>
            </div>
            {bannerState.subtitle && (
              <p className="banner-subtitle">{bannerState.subtitle}</p>
            )}
          </div>
          {bannerState.buttons.length > 0 && (
            <div className="banner-button-row">
              {bannerState.buttons.includes('changes') && (
                <Button
                  size="sm"
                  variant={bannerState.buttons.includes('sync') ? 'outline' : 'filled'}
                  color={bannerState.buttons.includes('sync') ? 'secondary' : 'primary'}
                  onClick={() => onTabSelect('collection-changes')}
                >
                  {t('OPENAPI.VIEW_COLLECTION_CHANGES', 'View Collection Changes')}
                </Button>
              )}
              {(bannerState.buttons.includes('sync') || bannerState.buttons.includes('review')) && (
                <Button size="sm" onClick={() => onTabSelect('spec-updates')}>
                  {t('OPENAPI.REVIEW_AND_SYNC_COLLECTION', 'Review and Sync Collection')}
                </Button>
              )}
              {bannerState.buttons.includes('spec-details') && (
                <Button variant="outline" size="sm" onClick={() => onTabSelect('spec-updates')}>
                  {t('OPENAPI.GO_TO_SPEC_UPDATES', 'Go to Spec Updates')}
                </Button>
              )}
              {bannerState.buttons.includes('open-settings') && (
                <Button variant="outline" size="sm" onClick={onOpenSettings}>
                  {t('OPENAPI.UPDATE_CONNECTION_SETTINGS', 'Update connection settings')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <h4 className="overview-section-title mt-5">{t('OPENAPI.ENDPOINT_SUMMARY', 'Endpoint Summary')}</h4>
      <div className="sync-summary-cards">
        {summaryCards.map(({ key, label, tooltip, tab, color }) => {
          const count = summaryValues[key];
          const resolvedColor = count > 0 ? color : 'muted';
          const isClickable = tab && count > 0;
          return (
            <div
              className={`summary-card${isClickable ? ' clickable' : ''}`}
              key={key}
              onClick={isClickable ? () => onTabSelect(tab) : undefined}
            >
              <span className="card-info-icon">
                <Help icon="info" size={12} placement="top" width={220}>{tooltip}</Help>
              </span>
              <div className="summary-count-row">
                <span className={`summary-count ${resolvedColor}`}>{count != null ? count : '–'}</span>
                {key === 'pending' && conflictCount > 0 && (
                  <span className="conflict-annotation">{t('OPENAPI.CONFLICT_ANNOTATION', { count: conflictCount, defaultValue: `(${conflictCount} ${conflictCount === 1 ? 'conflict' : 'conflicts'})` })}</span>
                )}
              </div>
              <div className="summary-label">
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <h4 className="overview-section-title mt-7">{t('OPENAPI.LAST_SYNCED_SPEC_DETAILS', 'Last Synced Spec Details')}</h4>
      <div className="spec-details-grid">
        {details.map(({ label, value, tooltip }) => (
          <div className="spec-detail-item" key={label}>
            <div className="spec-detail-label">{label}</div>
            <div className="spec-detail-value">
              {value}
              {tooltip && (
                <Help icon="info" size={11} placement="top" width={200}>{tooltip}</Help>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewSection;

import React, { useState, useMemo } from 'react';
import Modal from 'components/Modal';
import Button from 'ui/Button';
import { IconCheck, IconAlertTriangle, IconFileExport } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import ExportToPostman from 'components/Sidebar/Collections/Collection/ExportCollection/ExportToPostman';
import exportOpenCollection from 'utils/exporters/opencollection';
import { cloneDeep } from 'lodash';
import { transformCollectionToSaveToExportAsFile } from 'utils/collections/index';
import { useSelector } from 'react-redux';
import { findCollectionByUid, areItemsLoading } from 'utils/collections/index';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const EXPORT_FORMATS = {
  ZIP: 'zip',
  YAML: 'yaml',
  POSTMAN: 'postman'
};

const ShareCollection = ({ onClose, collectionUid }) => {
  const { t } = useTranslation();
  const collection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));
  const isCollectionLoading = areItemsLoading(collection);
  const [selectedFormat, setSelectedFormat] = useState(EXPORT_FORMATS.ZIP);
  const [isExporting, setIsExporting] = useState(false);
  const [showPostmanExportModal, setShowPostmanExportModal] = useState(false);

  const hasNonExportableRequestTypes = useMemo(() => {
    let types = new Set();
    const checkItem = (item) => {
      if (item.type === 'grpc-request') {
        types.add('gRPC');
        return true;
      }
      if (item.type === 'ws-request') {
        types.add('WebSocket');
        return true;
      }
      if (item.items) {
        return item.items.some(checkItem);
      }
      return false;
    };
    return {
      has: collection?.items?.filter(checkItem).length || false,
      types: [...types]
    };
  }, [collection]);

  const handleExportZip = async () => {
    try {
      const { ipcRenderer } = window;
      const result = await ipcRenderer.invoke('renderer:export-collection-zip', collection.pathname, collection.name);
      if (result.success) {
        toast.success(t('SHARE_COLLECTION.EXPORT_SUCCESS', 'Collection exported successfully'));
      }
    } catch (error) {
      toast.error(t('SHARE_COLLECTION.EXPORT_FAILED', 'Failed to export collection: {{error}}', { error: error.message }));
    }
  };

  const handleExportYaml = () => {
    const collectionCopy = cloneDeep(collection);
    exportOpenCollection(transformCollectionToSaveToExportAsFile(collectionCopy));
  };

  const handlePostmanModalClose = () => {
    setShowPostmanExportModal(false);
    onClose();
  };

  const handleProceed = async () => {
    if (isCollectionLoading || isExporting) return;

    if (selectedFormat === EXPORT_FORMATS.POSTMAN) {
      setShowPostmanExportModal(true);
      return;
    }

    setIsExporting(true);
    try {
      switch (selectedFormat) {
        case EXPORT_FORMATS.ZIP:
          await handleExportZip();
          break;
        case EXPORT_FORMATS.YAML:
          handleExportYaml();
          break;
      }
      onClose();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = isCollectionLoading || isExporting;

  if (showPostmanExportModal) {
    return (
      <ExportToPostman
        collection={collection}
        onClose={handlePostmanModalClose}
        onExported={handlePostmanModalClose}
      />
    );
  }

  return (
    <>
      <Modal size="lg" title={t('SHARE_COLLECTION.TITLE', 'Share Collection')} handleCancel={onClose} hideFooter>
        <StyledWrapper className="flex flex-col">
          <p className="text-sm mb-4">
            Bruno uses{' '}
            <a
              href="https://opencollection.com"
              target="_blank"
              rel="noopener noreferrer"
              className="opencollection-link"
            >
              OpenCollection
            </a>
            {' '}- An open format for API collections
          </p>

          {/* Bruno Format Section */}
          <div className="section-title">{t('SHARE_COLLECTION.BRUNO_FORMAT', 'Bruno Format')}</div>
          <div className="bruno-format-grid mb-6">
            {/* ZIP Option */}
            <div
              className={`format-card ${selectedFormat === EXPORT_FORMATS.ZIP ? 'selected' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && setSelectedFormat(EXPORT_FORMATS.ZIP)}
            >
              <div className="card-header">
                <span className="card-title">{t('SHARE_COLLECTION.BRUNO_ZIP', 'Bruno Collection (ZIP)')}</span>
                <span className="recommended-badge">{t('SHARE_COLLECTION.RECOMMENDED', 'Recommended')}</span>
              </div>
              <p className="card-description">{t('SHARE_COLLECTION.BRUNO_ZIP_DESC', 'OpenCollection format organized as folders and files')}</p>
              <div className="feature-list">
                <div className="feature-item">
                  <IconCheck size={14} className="checkmark" />
                  <span>{t('SHARE_COLLECTION.FEATURE_FOLDER_STRUCTURE', 'Folder structure with individual .yml files')}</span>
                </div>
                <div className="feature-item">
                  <IconCheck size={14} className="checkmark" />
                  <span>{t('SHARE_COLLECTION.FEATURE_COLLABORATE', 'Collaborate with your team via pull requests')}</span>
                </div>
                <div className="feature-item">
                  <IconCheck size={14} className="checkmark" />
                  <span>{t('SHARE_COLLECTION.FEATURE_EXTRACT', 'Extract and open directly in Bruno')}</span>
                </div>
              </div>
              <p className="best-for">{t('SHARE_COLLECTION.BEST_FOR_TEAM', 'Best for: Team collaboration, version control, publishing')}</p>
            </div>

            {/* Single File YAML Option */}
            <div
              className={`format-card ${selectedFormat === EXPORT_FORMATS.YAML ? 'selected' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && setSelectedFormat(EXPORT_FORMATS.YAML)}
            >
              <div className="card-header">
                <span className="card-title">{t('SHARE_COLLECTION.SINGLE_FILE_YAML', 'Single File (YAML)')}</span>
              </div>
              <p className="card-description">{t('SHARE_COLLECTION.SINGLE_FILE_YAML_DESC', 'OpenCollection format bundled into one .yml file')}</p>
              <div className="feature-list">
                <div className="feature-item">
                  <IconCheck size={14} className="checkmark" />
                  <span>{t('SHARE_COLLECTION.FEATURE_SINGLE_FILE', 'Everything in a single YAML file')}</span>
                </div>
                <div className="feature-item">
                  <IconCheck size={14} className="checkmark" />
                  <span>{t('SHARE_COLLECTION.FEATURE_PASTE_GIST', 'Paste in a gist or attach to an issue')}</span>
                </div>
              </div>
              <p className="best-for">{t('SHARE_COLLECTION.BEST_FOR_QUICK', 'Best for: Quick sharing as a single file')}</p>
            </div>
          </div>

          <div className="section-title">{t('SHARE_COLLECTION.OTHER_FORMAT', 'Other Format')}</div>
          <div className="other-format-grid">
            <div
              className={`other-format-card ${selectedFormat === EXPORT_FORMATS.POSTMAN ? 'selected' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && setSelectedFormat(EXPORT_FORMATS.POSTMAN)}
              data-testid="export-format-postman"
            >
              <div className="format-icon">
                <IconFileExport size={28} strokeWidth={1.5} />
              </div>
              <div className="format-info">
                <div className="format-name">Postman</div>
                <div className="format-description">{t('SHARE_COLLECTION.EXPORT_FOR_POSTMAN', 'Export for Postman')}</div>
              </div>
            </div>
          </div>

          {selectedFormat === EXPORT_FORMATS.POSTMAN && hasNonExportableRequestTypes.has && (
            <div className="flex items-center mt-4 p-3 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
              <IconAlertTriangle size={16} className="mr-2 flex-shrink-0" style={{ color: '#f59e0b' }} />
              <span className="text-sm" style={{ color: '#f59e0b' }}>
                {t('SHARE_COLLECTION.NON_EXPORTABLE_WARNING', 'Note: {{types}} requests in this collection will not be exported', { types: hasNonExportableRequestTypes.types.join(', ') })}
              </span>
            </div>
          )}

          <div className="modal-footer">
            <Button
              onClick={handleProceed}
              disabled={isDisabled}
              loading={isExporting}
            >
              {isExporting ? t('COMMON.EXPORTING', 'Exporting...') : t('COMMON.PROCEED', 'Proceed')}
            </Button>
          </div>
        </StyledWrapper>
      </Modal>
    </>
  );
};

export default ShareCollection;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconArrowRight, IconAlertTriangle } from '@tabler/icons';

import Modal from 'components/Modal';
import Portal from 'components/Portal';
import { findCollectionByUid, getCollectionVersion, isOpenCollectionFormat } from 'utils/collections/index';
import { saveCollectionVersion } from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper, { ModalTitle } from './StyledWrapper';
import { useTranslation, Trans } from 'react-i18next';

const CollectionNotFound = ({ onClose }) => {
  const { t } = useTranslation();
  return (
    <Portal>
      <Modal size="sm" title={t('CHANGE_VERSION.TITLE', 'Change Collection Version')} confirmText={t('COMMON.CLOSE', 'Close')} handleConfirm={onClose} hideCancel>
        <StyledWrapper className="w-[480px]">
          <div className="flex items-center gap-2 text-warning">
            <IconAlertTriangle size={16} className="shrink-0" />
            <span>{t('CHANGE_VERSION.COLLECTION_NOT_FOUND', 'Collection not found. It may have been deleted or is no longer available.')}</span>
          </div>
        </StyledWrapper>
      </Modal>
    </Portal>
  );
};

const ChangeCollectionVersion = ({ collectionUid, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const collection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));

  const currentVersion = getCollectionVersion(collection);
  const isYml = isOpenCollectionFormat(collection);
  const targetKey = isYml ? 'info.version' : 'collectionVersion';
  const targetFile = isYml ? 'opencollection.yml' : 'bruno.json';
  const [newVersion, setNewVersion] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const trimmedVersion = newVersion.trim();
  const canSubmit = useMemo(
    () => trimmedVersion.length > 0 && trimmedVersion !== currentVersion,
    [trimmedVersion, currentVersion]
  );

  const handleConfirm = () => {
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    dispatch(saveCollectionVersion(collectionUid, trimmedVersion))
      .then(() => onClose())
      .catch(() => setIsSaving(false));
  };

  if (!collection) {
    return <CollectionNotFound onClose={onClose} />;
  }

  return (
    <Portal>
      <Modal
        size="md"
        customHeader={<ModalTitle>{t('CHANGE_VERSION.TITLE', 'Change Collection Version')}</ModalTitle>}
        confirmText={isSaving ? t('COMMON.UPDATING', 'Updating...') : t('CHANGE_VERSION.UPDATE_VERSION', 'Update Version')}
        cancelText={t('COMMON.CANCEL', 'Cancel')}
        handleConfirm={handleConfirm}
        handleCancel={onClose}
        confirmDisabled={!canSubmit || isSaving}
        dataTestId="change-version"
      >
        <StyledWrapper className="w-[560px]">
          <div className="subheader" data-testid="change-version-collection">
            {t('COMMON.COLLECTION', 'Collection')}: <span className="collection-name">{collection.name}</span>
          </div>

          <div className="version-card">
            <div className="version-row">
              <div className="version-col">
                <div className="col-label">{t('CHANGE_VERSION.CURRENT_VERSION', 'Current Version')}</div>
                <div className="current-value" data-testid="change-version-current">
                  {currentVersion || <span className="text-muted italic">{t('COMMON.NOT_SET', 'Not Set')}</span>}
                </div>
              </div>

              <IconArrowRight size={18} className="arrow" stroke={1.5} />

              <div className="version-col">
                <div className="col-label">{t('CHANGE_VERSION.NEW_VERSION', 'New Version')}</div>
                <input
                  ref={inputRef}
                  type="text"
                  className="textbox w-full new-version-input"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  placeholder={t('CHANGE_VERSION.VERSION_PLACEHOLDER', 'e.g. v1.0.0')}
                  maxLength={50}
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  data-testid="change-version-input"
                />
              </div>
            </div>

            <p className="preview m-0" data-testid="change-version-preview">
              <Trans
                i18nKey="CHANGE_VERSION.UPDATES_PREVIEW"
                defaults="Updates <0>{{targetKey}}</0> in {{targetFile}} from "
                values={{ targetKey, targetFile }}
                components={[<strong key="targetKey" />]}
              />
              <span className="old">{currentVersion || <span className="text-muted italic not-set">({t('COMMON.NOT_SET', 'Not Set')})</span>}</span>
              <IconArrowRight size={13} className="preview-arrow" stroke={1.5} />
              <span className="new">{trimmedVersion || '…'}</span>
            </p>
          </div>
        </StyledWrapper>
      </Modal>
    </Portal>
  );
};

export default ChangeCollectionVersion;

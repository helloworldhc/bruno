import React, { useMemo } from 'react';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { IconAlertCircle } from '@tabler/icons';
import { removeCollection } from 'providers/ReduxStore/slices/collections/actions';
import { findCollectionByUid, flattenItems, isItemARequest, hasRequestChanges } from 'utils/collections/index';
import filter from 'lodash/filter';
import ConfirmCollectionCloseDrafts from './ConfirmCollectionCloseDrafts';
import StyledWrapper from './StyledWrapper';
import Portal from 'ui/Portal';
import { useTranslation } from 'react-i18next';

const RemoveCollection = ({ onClose, collectionUid }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const collection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));

  // Detect drafts in the collection
  const drafts = useMemo(() => {
    if (!collection) return [];
    const items = flattenItems(collection.items);
    return filter(items, (item) => isItemARequest(item) && hasRequestChanges(item));
  }, [collection]);

  const onConfirm = () => {
    if (!collection) {
      toast.error('Collection not found');
      onClose();
      return;
    }
    dispatch(removeCollection(collection.uid))
      .then(() => {
        toast.success(t('COMMON.SUCCESS', 'Collection removed from workspace'));
        onClose();
      })
      .catch(() => toast.error('An error occurred while removing the collection'));
  };

  if (!collection) {
    return <div>Collection not found</div>;
  }

  // If there are drafts, show the draft confirmation modal
  if (drafts.length > 0) {
    return <ConfirmCollectionCloseDrafts onClose={onClose} collection={collection} collectionUid={collectionUid} />;
  }

  // Otherwise, show the standard remove confirmation modal
  return (
    <StyledWrapper>
      <Portal>
        <Modal
          size="sm"
          title={t('COMMON.CLOSE', 'Remove Collection')}
          confirmText={t('COMMON.CLOSE', 'Remove')}
          confirmButtonColor="danger"
          handleConfirm={onConfirm}
          handleCancel={onClose}
        >
          <p className="mb-4">{t('COMMON.CONFIRM_CLOSE_COLLECTION', 'Are you sure you want to close following collection in Bruno?')}</p>
          <div className="collection-info-card">
            <div className="collection-name">{collection.name}</div>
            <div className="collection-path">{collection.pathname}</div>
          </div>
          <p className="mt-4 text-muted text-sm">
            {t('COMMON.CLOSE_COLLECTION_HELP', 'It will still be available in the filesystem at the above location and can be re-opened later.')}
          </p>
        </Modal>
      </Portal>
    </StyledWrapper>
  );
};

export default RemoveCollection;

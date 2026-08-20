import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { flattenItems, isItemARequest, hasRequestChanges, findCollectionByUid } from 'utils/collections';
import { pluralizeWord } from 'utils/common';
import { saveRequest, saveMultipleRequests, moveCollectionToWorkspace } from 'providers/ReduxStore/slices/collections/actions';
import { deleteRequestDraft } from 'providers/ReduxStore/slices/collections';
import { IconAlertTriangle, IconDeviceFloppy } from '@tabler/icons';
import Modal from 'components/Modal';
import toast from 'react-hot-toast';
import Button from 'ui/Button';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const MAX_UNSAVED_REQUESTS_TO_SHOW = 5;

const ConfirmMoveDrafts = ({ onClose, collection, collectionUid }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isMoving, setIsMoving] = useState(false);

  const latestCollection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));

  const activeCollection = latestCollection || collection;

  const currentDrafts = useMemo(() => {
    if (!activeCollection) return [];
    const items = flattenItems(activeCollection.items);
    return items
      ?.filter((item) => isItemARequest(item) && hasRequestChanges(item) && !item.isTransient)
      .map((item) => {
        return {
          ...item,
          collectionUid: collectionUid
        };
      });
  }, [activeCollection, collectionUid]);

  const currentTransientDrafts = useMemo(() => {
    if (!activeCollection) return [];
    const items = flattenItems(activeCollection.items);
    return items
      ?.filter((item) => isItemARequest(item) && hasRequestChanges(item) && item.isTransient)
      .map((item) => {
        return {
          ...item,
          collectionUid: collectionUid
        };
      });
  }, [activeCollection, collectionUid]);

  const allDrafts = useMemo(() => {
    return [...currentDrafts, ...currentTransientDrafts];
  }, [currentDrafts, currentTransientDrafts]);

  const moveAndClose = () => {
    dispatch(moveCollectionToWorkspace(collectionUid))
      .then(() => {
        toast.success(t('MOVE_TO_WORKSPACE.COLLECTION_MOVED', 'Collection moved into workspace'));
        onClose();
      })
      .catch((err) => {
        toast.error(err?.message || t('MOVE_TO_WORKSPACE.MOVE_ERROR', 'An error occurred while moving the collection'));
        setIsMoving(false);
      });
  };

  const handleSaveAll = () => {
    if (isMoving) {
      return;
    }
    // If there are transient drafts, we can't proceed with batch save
    if (currentTransientDrafts.length > 0) {
      toast.error(t('MOVE_TO_WORKSPACE.SAVE_TRANSIENT_FIRST', 'Please save or discard transient requests first'));
      return;
    }
    setIsMoving(true);
    // Save only non-transient drafts, then move
    if (currentDrafts.length > 0) {
      dispatch(saveMultipleRequests(currentDrafts))
        .then(() => moveAndClose())
        .catch(() => {
          toast.error(t('REQUEST.REQUEST_SAVE_ERROR', 'Failed to save requests!'));
          setIsMoving(false);
        });
    } else {
      moveAndClose();
    }
  };

  const handleDiscardAll = () => {
    if (isMoving) {
      return;
    }
    setIsMoving(true);
    // Discard all drafts (both regular and transient), then move
    allDrafts.forEach((draft) => {
      dispatch(deleteRequestDraft({
        collectionUid: collectionUid,
        itemUid: draft.uid
      }));
    });

    moveAndClose();
  };

  const handleSaveTransient = (draft) => {
    dispatch(saveRequest(draft.uid, collectionUid));
  };

  if (!currentDrafts.length && !currentTransientDrafts.length) {
    return null;
  }

  return (
    <StyledWrapper>
      <Modal
        size="md"
        title={t('MOVE_TO_WORKSPACE.TITLE', 'Move into Workspace')}
        handleCancel={onClose}
        disableEscapeKey={true}
        disableCloseOnOutsideClick={true}
        closeModalFadeTimeout={150}
        hideFooter={true}
      >
        <div className="flex items-center">
          <IconAlertTriangle size={32} strokeWidth={1.5} className="warning-text" />
          <h1 className="ml-2 text-lg font-medium">{t('COMMON.HOLD_ON', 'Hold on..')}</h1>
        </div>
        <p className="mt-4">
          {t('CONFIRM_MOVE_DRAFTS.UNSAVED_CHANGES', 'You have unsaved changes in {{count}} {{requests}}.', {
            count: allDrafts.length,
            requests: pluralizeWord('request', allDrafts.length)
          })}
        </p>

        {/* Regular (saved) requests with changes */}
        {currentDrafts.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">
              {t('CONFIRM_MOVE_DRAFTS.SAVED_REQUESTS', 'Saved {{requests}} ({{count}})', {
                requests: pluralizeWord('Request', currentDrafts.length),
                count: currentDrafts.length
              })}
            </p>
            <ul className="ml-2">
              {currentDrafts.slice(0, MAX_UNSAVED_REQUESTS_TO_SHOW).map((item) => {
                return (
                  <li key={item.uid} className="mt-1 text-xs draft-list-item">
                    • {item.filename || item.name}
                  </li>
                );
              })}
            </ul>
            {currentDrafts.length > MAX_UNSAVED_REQUESTS_TO_SHOW && (
              <p className="ml-2 mt-1 text-xs draft-list-item">
                {t('CONFIRM_MOVE_DRAFTS.ADDITIONAL_NOT_SHOWN', '...{{count}} additional {{requests}} not shown', {
                  count: currentDrafts.length - MAX_UNSAVED_REQUESTS_TO_SHOW,
                  requests: pluralizeWord('request', currentDrafts.length - MAX_UNSAVED_REQUESTS_TO_SHOW)
                })}
              </p>
            )}
          </div>
        )}

        {/* Transient (unsaved) requests */}
        {currentTransientDrafts.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">
              {t('CONFIRM_MOVE_DRAFTS.TRANSIENT_REQUESTS', 'Transient {{requests}} ({{count}})', {
                requests: pluralizeWord('Request', currentTransientDrafts.length),
                count: currentTransientDrafts.length
              })}
            </p>
            <p className="text-xs transient-hint mb-3">
              {t('CONFIRM_MOVE_DRAFTS.TRANSIENT_HINT', 'These requests need to be saved individually before moving the collection.')}
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {currentTransientDrafts.map((item) => {
                return (
                  <div
                    key={item.uid}
                    className="flex items-center justify-between py-2 px-3 transient-item"
                  >
                    <span className="text-sm transient-item-name truncate mr-3">{item.name}</span>
                    <Button
                      data-testid="move-workspace-save-transient-draft"
                      color="primary"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveTransient(item)}
                      disabled={isMoving}
                      icon={<IconDeviceFloppy size={14} strokeWidth={1.5} />}
                    >
                      {t('COMMON.SAVE', 'Save')}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <div>
            <Button data-testid="move-workspace-discard-all" color="danger" onClick={handleDiscardAll} disabled={isMoving}>
              {t('CONFIRM_MOVE_DRAFTS.DISCARD_ALL_AND_MOVE', 'Discard All and Move')}
            </Button>
          </div>
          <div>
            <Button data-testid="move-workspace-cancel" className="mr-2" color="secondary" variant="ghost" onClick={onClose} disabled={isMoving}>
              {t('COMMON.CANCEL', 'Cancel')}
            </Button>
            <Button
              data-testid="move-workspace-save-and-move"
              onClick={handleSaveAll}
              disabled={currentTransientDrafts.length > 0 || isMoving}
              title={currentTransientDrafts.length > 0 ? t('MOVE_TO_WORKSPACE.SAVE_TRANSIENT_FIRST', 'Please save or discard transient requests first') : ''}
            >
              {isMoving ? t('COMMON.MOVING', 'Moving...') : currentDrafts.length > 1 ? t('CONFIRM_MOVE_DRAFTS.SAVE_ALL_AND_MOVE', 'Save All and Move') : t('CONFIRM_MOVE_DRAFTS.SAVE_AND_MOVE', 'Save and Move')}
            </Button>
          </div>
        </div>
      </Modal>
    </StyledWrapper>
  );
};

export default ConfirmMoveDrafts;

import React from 'react';
import Modal from 'components/Modal';
import Portal from 'components/Portal';
import { useDispatch } from 'react-redux';
import { deleteResponseExample } from 'providers/ReduxStore/slices/collections';
import { saveRequest, closeTabs } from 'providers/ReduxStore/slices/collections/actions';
import { useTranslation, Trans } from 'react-i18next';

const DeleteResponseExampleModal = ({ onClose, example, item, collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onConfirm = (e) => {
    e.stopPropagation();
    dispatch(closeTabs({ tabUids: [example.uid] }));
    dispatch(deleteResponseExample({
      itemUid: item.uid,
      collectionUid: collection.uid,
      exampleUid: example.uid
    }));
    dispatch(saveRequest(item.uid, collection.uid, true))
      .then(() => {
        onClose();
      });
  };

  return (
    <Portal>
      <Modal
        size="sm"
        title={t('RESPONSE_EXAMPLE.DELETE_EXAMPLE', 'Delete Example')}
        confirmText={t('COMMON.DELETE', 'Delete')}
        cancelText={t('COMMON.CANCEL', 'Cancel')}
        handleConfirm={onConfirm}
        handleCancel={onClose}
        confirmButtonColor="danger"
      >
        <Trans
          i18nKey="RESPONSE_EXAMPLE.DELETE_CONFIRM"
          defaults="Are you sure you want to delete the example <1>{{name}}</1>?"
          values={{ name: example.name }}
          components={{
            1: <span className="font-medium" />
          }}
        />
      </Modal>
    </Portal>
  );
};

export default DeleteResponseExampleModal;

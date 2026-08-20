import React from 'react';
import Modal from 'components/Modal';
import { useSelector, useDispatch } from 'react-redux';
import { ignoreFolder, closeTabs } from 'providers/ReduxStore/slices/collections/actions';
import { recursivelyGetAllItemUids } from 'utils/collections';
import toast from 'react-hot-toast';
import { useTranslation, Trans } from 'react-i18next';

const IgnoreCollectionItem = ({ onClose, item, collectionUid }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const collection = useSelector((state) => state.collections.collections?.find((c) => c.uid === collectionUid));
  const isYamlCollection = collection?.format === 'yml' || Boolean(collection?.brunoConfig?.opencollection);
  const configFileName = isYamlCollection ? 'opencollection.yml' : 'bruno.json';

  const onConfirm = () => {
    dispatch(ignoreFolder(item.uid, collectionUid))
      .then(() => {
        const tabUids = [...recursivelyGetAllItemUids(item.items), item.uid];
        dispatch(closeTabs({ tabUids }));
        toast.success(t('IGNORE_COLLECTION_ITEM.FOLDER_IGNORED', 'Folder ignored'));
      })
      .catch((error) => {
        console.error('Error ignoring folder', error);
        toast.error(error?.message || t('IGNORE_COLLECTION_ITEM.IGNORE_ERROR', 'Error ignoring folder'));
      });
    onClose();
  };

  return (
    <Modal
      size="md"
      title={t('IGNORE_COLLECTION_ITEM.TITLE', 'Ignore Folder')}
      confirmText={t('IGNORE_COLLECTION_ITEM.IGNORE', 'Ignore')}
      handleConfirm={onConfirm}
      handleCancel={onClose}
    >
      <Trans
        i18nKey="IGNORE_COLLECTION_ITEM.DESCRIPTION"
        defaults="Ignoring <0>{{name}}</0> will hide it from this {{collectionType}} collection by adding it to the <1>ignore</1> list in <2>{{configFileName}}</2>. The folder and its files are not deleted. To restore it later, remove the entry from the <3>ignore</3> list in <4>{{configFileName}}</4>."
        values={{
          name: item.name,
          collectionType: isYamlCollection ? 'opencollection (YAML)' : 'Bruno (JSON)',
          configFileName
        }}
        components={[
          <span key="0" className="font-medium" />,
          <span key="1" className="font-medium" />,
          <span key="2" className="font-medium" />,
          <span key="3" className="font-medium" />,
          <span key="4" className="font-medium" />
        ]}
      />
    </Modal>
  );
};

export default IgnoreCollectionItem;

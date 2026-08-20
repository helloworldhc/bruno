import React, { useState } from 'react';
import get from 'lodash/get';
import { uuid } from 'utils/common';
import Modal from 'components/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { addTab } from 'providers/ReduxStore/slices/tabs';
import { runCollectionFolder } from 'providers/ReduxStore/slices/collections/actions';
import { flattenItems } from 'utils/collections';
import StyledWrapper from './StyledWrapper';
import { areItemsLoading } from 'utils/collections';
import RunnerTags from 'components/RunnerResults/RunnerTags/index';
import { getRequestItemsForCollectionRun } from 'utils/collections/index';
import Button from 'ui/Button';
import { useTranslation } from 'react-i18next';

const RunCollectionItem = ({ collectionUid, item, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [delay, setDelay] = useState('');

  const collection = useSelector((state) => state.collections.collections?.find((c) => c.uid === collectionUid));
  const isCollectionRunInProgress = collection?.runnerResult?.info?.status && (collection?.runnerResult?.info?.status !== 'ended');

  // tags for the collection run
  const tags = get(collection, 'runnerTags', { include: [], exclude: [] });

  const onSubmit = (recursive) => {
    dispatch(
      addTab({
        uid: uuid(),
        collectionUid: collection.uid,
        type: 'collection-runner'
      })
    );
    if (!isCollectionRunInProgress) {
      dispatch(runCollectionFolder(collection.uid, item ? item.uid : null, recursive, delay ? Number(delay) : null, tags));
    }
    onClose();
  };

  const handleViewRunner = (e) => {
    e.preventDefault();
    dispatch(
      addTab({
        uid: uuid(),
        collectionUid: collection.uid,
        type: 'collection-runner'
      })
    );
    onClose();
  };

  const isFolderLoading = areItemsLoading(item);

  const requestItemsForRecursiveFolderRun = getRequestItemsForCollectionRun({ recursive: true, tags, items: item ? item.items : collection.items });
  const totalRequestItemsCountForRecursiveFolderRun = requestItemsForRecursiveFolderRun.length;
  const shouldDisableRecursiveFolderRun = totalRequestItemsCountForRecursiveFolderRun <= 0;

  const requestItemsForFolderRun = getRequestItemsForCollectionRun({ recursive: false, tags, items: item ? item.items : collection.items });
  const totalRequestItemsCountForFolderRun = requestItemsForFolderRun.length;
  const shouldDisableFolderRun = totalRequestItemsCountForFolderRun <= 0;

  return (
    <StyledWrapper>
      <Modal size="md" title={t('RUN_COLLECTION_ITEM.TITLE', 'Collection Runner')} hideFooter={true} handleCancel={onClose}>
        <div>
          <div className="mb-1">
            <span className="font-medium">{t('RUN_COLLECTION_ITEM.RUN', 'Run')}</span>
            <span className="ml-1 text-xs">({t('RUN_COLLECTION_ITEM.REQUESTS_COUNT', '{{count}} requests', { count: totalRequestItemsCountForFolderRun })})</span>
          </div>
          <div className="mb-3 description">{t('RUN_COLLECTION_ITEM.RUN_DESC', 'This will only run the requests in this folder.')}</div>
          <div className="mb-1">
            <span className="font-medium">{t('RUN_COLLECTION_ITEM.RECURSIVE_RUN', 'Recursive Run')}</span>
            <span className="ml-1 text-xs">({t('RUN_COLLECTION_ITEM.REQUESTS_COUNT', '{{count}} requests', { count: totalRequestItemsCountForRecursiveFolderRun })})</span>
          </div>
          <div className={`description ${isFolderLoading ? 'mb-2' : 'mb-6'}`}>{t('RUN_COLLECTION_ITEM.RECURSIVE_RUN_DESC', 'This will run all the requests in this folder and all its subfolders.')}</div>
          {isFolderLoading ? <div className="mb-8 warning">{t('RUN_COLLECTION_ITEM.REQUESTS_LOADING_WARNING', 'Requests in this folder are still loading.')}</div> : null}
          {isCollectionRunInProgress ? <div className="mb-6 warning">{t('RUN_COLLECTION_ITEM.RUN_IN_PROGRESS_WARNING', 'A Collection Run is already in progress.')}</div> : null}

          <hr className="divider" />

          {/* Timings */}
          <div className="flex flex-col items-start gap-2 mb-8">
            <label htmlFor="runner-delay" className="block text-sm">{t('RUN_COLLECTION_ITEM.DELAY_LABEL', 'Delay between requests (ms)')}</label>
            <input
              id="runner-delay"
              type="number"
              className="textbox w-1/2"
              placeholder={t('RUNNER.DELAY_PLACEHOLDER', 'e.g. 5')}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
            />
          </div>

          {/* Tags for the collection run */}
          <RunnerTags collectionUid={collection.uid} className="mb-6" />

          <div className="flex justify-end bruno-modal-footer">
            <Button type="button" color="secondary" variant="ghost" onClick={onClose} className="mr-3">
              {t('COMMON.CANCEL', 'Cancel')}
            </Button>
            {
              isCollectionRunInProgress
                ? (
                    <Button type="submit" onClick={handleViewRunner}>
                      {t('RUN_COLLECTION_ITEM.VIEW_RUN', 'View Run')}
                    </Button>
                  )
                : (
                    <>
                      <Button type="submit" disabled={shouldDisableRecursiveFolderRun} onClick={() => onSubmit(true)} className="mr-3">
                        {t('RUN_COLLECTION_ITEM.RECURSIVE_RUN', 'Recursive Run')}
                      </Button>
                      <Button type="submit" disabled={shouldDisableFolderRun} onClick={() => onSubmit(false)}>
                        {t('RUN_COLLECTION_ITEM.RUN', 'Run')}
                      </Button>
                    </>
                  )
            }
          </div>
        </div>
      </Modal>
    </StyledWrapper>
  );
};

export default RunCollectionItem;

import React from 'react';
import { useDispatch } from 'react-redux';
import StyledWrapper from './StyledWrapper';
import { clearRequestTimeline } from 'providers/ReduxStore/slices/collections/index';
import { useTranslation } from 'react-i18next';

const ClearTimeline = ({ collection, item }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const clearResponse = () =>
    dispatch(
      clearRequestTimeline({
        itemUid: item.uid,
        collectionUid: collection.uid
      })
    );

  return (
    <StyledWrapper className="flex items-center">
      <button type="button" onClick={clearResponse} className="text-link hover:underline whitespace-nowrap" title={t('TIMELINE.CLEAR_TIMELINE', 'Clear Timeline')}>
        {t('TIMELINE.CLEAR_TIMELINE', 'Clear Timeline')}
      </button>
    </StyledWrapper>
  );
};

export default ClearTimeline;

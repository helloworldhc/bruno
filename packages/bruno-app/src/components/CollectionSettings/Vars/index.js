import React, { useRef } from 'react';
import get from 'lodash/get';
import VarsTable from './VarsTable';
import StyledWrapper from './StyledWrapper';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import { useDispatch } from 'react-redux';
import Button from 'ui/Button';
import { usePersistedState } from 'hooks/usePersistedState';
import { useTrackScroll } from 'hooks/useTrackScroll';
import { useTranslation } from 'react-i18next';

const Vars = ({ collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isDraft = !!collection.draft?.root;
  const requestVars = isDraft ? get(collection, 'draft.root.request.vars.req', []) : get(collection, 'root.request.vars.req', []);
  const responseVars = isDraft ? get(collection, 'draft.root.request.vars.res', []) : get(collection, 'root.request.vars.res', []);
  const handleSave = () => dispatch(saveCollectionSettings(collection.uid));

  const wrapperRef = useRef(null);
  const [scroll, setScroll] = usePersistedState({ key: `collection-vars-scroll-${collection.uid}`, default: 0 });
  useTrackScroll({ ref: wrapperRef, selector: '.collection-settings-content', onChange: setScroll, initialValue: scroll });

  return (
    <StyledWrapper className="w-full flex flex-col" ref={wrapperRef}>
      <div className="flex-1">
        <div className="mb-3 title text-xs">{t('REQUEST.PRE_REQUEST', 'Pre Request')}</div>
        <VarsTable collection={collection} vars={requestVars} varType="request" initialScroll={scroll} isDraft={isDraft} />
      </div>
      <div className="flex-1">
        <div className="mt-3 mb-3 title text-xs">{t('REQUEST.POST_RESPONSE', 'Post Response')}</div>
        <VarsTable collection={collection} vars={responseVars} varType="response" initialScroll={scroll} isDraft={isDraft} />
      </div>
      <div className="mt-6">
        <Button type="submit" size="sm" onClick={handleSave}>
          {t('COMMON.SAVE', 'Save')}
        </Button>
      </div>
    </StyledWrapper>
  );
};

export default Vars;

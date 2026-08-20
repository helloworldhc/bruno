import React, { useRef } from 'react';
import get from 'lodash/get';
import VarsTable from './VarsTable';
import StyledWrapper from './StyledWrapper';
import { saveFolderRoot } from 'providers/ReduxStore/slices/collections/actions';
import { useDispatch } from 'react-redux';
import Button from 'ui/Button';
import { usePersistedState } from 'hooks/usePersistedState';
import { useTrackScroll } from 'hooks/useTrackScroll';
import { useTranslation } from 'react-i18next';

const Vars = ({ collection, folder }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isDraft = Boolean(folder.draft);
  const requestVars = isDraft ? get(folder, 'draft.request.vars.req', []) : get(folder, 'root.request.vars.req', []);
  const responseVars = isDraft ? get(folder, 'draft.request.vars.res', []) : get(folder, 'root.request.vars.res', []);
  const handleSave = () => dispatch(saveFolderRoot(collection.uid, folder.uid));

  const wrapperRef = useRef(null);
  const [scroll, setScroll] = usePersistedState({ key: `folder-vars-scroll-${folder.uid}`, default: 0 });
  useTrackScroll({ ref: wrapperRef, selector: '.folder-settings-content', onChange: setScroll, initialValue: scroll });

  return (
    <StyledWrapper className="w-full flex flex-col" ref={wrapperRef}>
      <div>
        <div className="mb-3 title text-xs">{t('REQUEST.PRE_REQUEST', 'Pre Request')}</div>
        <VarsTable folder={folder} collection={collection} vars={requestVars} varType="request" initialScroll={scroll} isDraft={isDraft} />
      </div>
      <div>
        <div className="mt-3 mb-3 title text-xs">{t('REQUEST.POST_RESPONSE', 'Post Response')}</div>
        <VarsTable folder={folder} collection={collection} vars={responseVars} varType="response" initialScroll={scroll} isDraft={isDraft} />
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

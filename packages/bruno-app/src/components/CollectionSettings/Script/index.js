import React, { useEffect, useRef } from 'react';
import get from 'lodash/get';
import find from 'lodash/find';
import { useDispatch, useSelector } from 'react-redux';
import CodeEditor from 'components/CodeEditor';
import { updateCollectionRequestScript, updateCollectionResponseScript } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import { updateScriptPaneTab } from 'providers/ReduxStore/slices/tabs';
import { useTheme } from 'providers/Theme';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'components/Tabs';
import StatusDot from 'components/StatusDot';
import { flattenItems, isItemARequest } from 'utils/collections';
import StyledWrapper from './StyledWrapper';
import Button from 'ui/Button';
import { usePersistedState } from 'hooks/usePersistedState';
import { useFocusErrorLine } from 'hooks/useFocusErrorLine';
import { useTranslation } from 'react-i18next';

const Script = ({ collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const preRequestEditorRef = useRef(null);
  const postResponseEditorRef = useRef(null);
  const requestScript = collection.draft?.root ? get(collection, 'draft.root.request.script.req', '') : get(collection, 'root.request.script.req', '');
  const responseScript = collection.draft?.root ? get(collection, 'draft.root.request.script.res', '') : get(collection, 'root.request.script.res', '');

  const tabs = useSelector((state) => state.tabs.tabs);
  const focusedTab = find(tabs, (t) => t.uid === collection.uid);
  const scriptPaneTab = focusedTab?.scriptPaneTab;

  const getDefaultTab = () => {
    const hasPreRequestScript = requestScript && requestScript.trim().length > 0;
    return hasPreRequestScript ? 'pre-request' : 'post-response';
  };

  const activeTab = scriptPaneTab || getDefaultTab();

  const setActiveTab = (tab) => {
    dispatch(updateScriptPaneTab({ uid: collection.uid, scriptPaneTab: tab }));
  };

  const { displayedTheme } = useTheme();
  const preferences = useSelector((state) => state.app.preferences);

  const [preReqScroll, setPreReqScroll] = usePersistedState({
    key: `collection-script-pre-req-scroll-${collection.uid}`,
    default: { left: 0, top: 0 }
  });
  const [postResScroll, setPostResScroll] = usePersistedState({
    key: `collection-script-post-res-scroll-${collection.uid}`,
    default: { left: 0, top: 0 }
  });

  const onRequestScriptEdit = (value) => {
    dispatch(
      updateCollectionRequestScript({
        script: value,
        collectionUid: collection.uid
      })
    );
  };

  const onResponseScriptEdit = (value) => {
    dispatch(
      updateCollectionResponseScript({
        script: value,
        collectionUid: collection.uid
      })
    );
  };

  const handleSave = () => dispatch(saveCollectionSettings(collection.uid));

  useEffect(() => {
    dispatch(
      updateScriptPaneTab({
        uid: collection.uid,
        scriptPaneTab: activeTab
      })
    );
  }, []);

  const items = flattenItems(collection.items || []);
  const currentItem = items.find((i) => i.uid === collection.uid);

  useFocusErrorLine({
    editorRef: preRequestEditorRef,
    errorMessage: currentItem?.preRequestScriptErrorMessage,
    isActive: activeTab === 'pre-request'
  });

  useFocusErrorLine({
    editorRef: postResponseEditorRef,
    errorMessage: currentItem?.postResponseScriptErrorMessage,
    isActive: activeTab === 'post-response'
  });

  const hasPreRequestScriptError = items.some((i) => isItemARequest(i) && i.preRequestScriptErrorMessage);
  const hasPostResponseScriptError = items.some((i) => isItemARequest(i) && i.postResponseScriptErrorMessage);

  return (
    <StyledWrapper className="w-full flex flex-col h-full">
      <div className="text-xs mb-4 text-muted">
        {t('COLLECTION_SETTINGS.SCRIPT_DESC', 'Write pre and post-request scripts that will run before and after any request in this collection is sent.')}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pre-request">
            {t('REQUEST.PRE_REQUEST', 'Pre Request')}
            {requestScript && requestScript.trim().length > 0 && (
              <StatusDot type={hasPreRequestScriptError ? 'error' : 'default'} />
            )}
          </TabsTrigger>
          <TabsTrigger value="post-response">
            {t('REQUEST.POST_RESPONSE', 'Post Response')}
            {responseScript && responseScript.trim().length > 0 && (
              <StatusDot type={hasPostResponseScriptError ? 'error' : 'default'} />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pre-request" className="mt-2" dataTestId="collection-pre-request-script-editor">
          <div className="relative h-full">
            <CodeEditor
              ref={preRequestEditorRef}
              collection={collection}
              docKey="collection-script:pre-request"
              value={requestScript || ''}
              theme={displayedTheme}
              onEdit={onRequestScriptEdit}
              mode="javascript"
              onSave={handleSave}
              font={get(preferences, 'font.codeFont', 'default')}
              fontSize={get(preferences, 'font.codeFontSize')}
              showHintsFor={['req', 'bru']}
              scriptType="pre-request"
              initialScroll={preReqScroll}
              onScroll={setPreReqScroll}
            />
          </div>
        </TabsContent>

        <TabsContent value="post-response" className="mt-2" dataTestId="collection-post-response-script-editor">
          <div className="relative h-full">
            <CodeEditor
              ref={postResponseEditorRef}
              collection={collection}
              docKey="collection-script:post-response"
              value={responseScript || ''}
              theme={displayedTheme}
              onEdit={onResponseScriptEdit}
              mode="javascript"
              onSave={handleSave}
              font={get(preferences, 'font.codeFont', 'default')}
              fontSize={get(preferences, 'font.codeFontSize')}
              showHintsFor={['req', 'res', 'bru']}
              scriptType="post-response"
              initialScroll={postResScroll}
              onScroll={setPostResScroll}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-12">
        <Button type="submit" size="sm" onClick={handleSave}>
          {t('COMMON.SAVE', 'Save')}
        </Button>
      </div>
    </StyledWrapper>
  );
};

export default Script;

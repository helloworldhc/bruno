import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  createMockResponse,
  deleteMockResponse,
  generateMockResponsesFromSpec,
  loadMockResponses,
  loadMockResponsesFromSpec,
  saveMockResponse,
  syncMockResponsesFromExamples
} from 'providers/ReduxStore/slices/mock-server/index';
import { addTab, closeTabs, updateTabMeta } from 'providers/ReduxStore/slices/tabs';
import { removeMockResponseEditor } from 'providers/ReduxStore/slices/collections';
import {
  buildMockServerTryUrl,
  collectCollectionExamples,
  copyExampleToMockResponse,
  resolveMockResponseLocation,
  syncMockResponsesFromExamples as mergeMockResponsesFromExamples,
  syncMockResponsesFromSpec as mergeMockResponsesFromSpec
} from 'utils/mock-server/mock-responses';
import { resolveInstanceSpec } from 'utils/mock-server/mock-server-instances';
import { IconCopy, IconPlus, IconServer2, IconTrash } from '@tabler/icons';
import CreateMockResponseModal from '../CreateMockResponseModal';
import GenerateFromSpecModal from '../GenerateFromSpecModal';
import MockConfirmModal from 'components/MockServer/MockConfirmModal';
import MockSearchInput from 'components/MockServer/MockSearchInput';
import Button from 'ui/Button';
import ActionIcon from 'ui/ActionIcon';
import ListGroup from 'ui/ListGroup';
import StyledWrapper from './StyledWrapper';

const MockResponsesList = ({ instance, collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [deletingResponse, setDeletingResponse] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSpecModal, setShowSyncSpecModal] = useState(false);
  const [isSyncingSpec, setIsSyncingSpec] = useState(false);
  const collections = useSelector((state) => state.collections.collections);
  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);
  const apiSpecs = useSelector((state) => state.apiSpec.apiSpecs);
  const responses = useSelector((state) => state.mockServer.mockResponses[instance.uid] || []);
  const serverState = useSelector((state) => state.mockServer.servers[instance.uid]);
  const mockServerPort = serverState?.port || instance.port;

  const resolvedCollection = useMemo(() => (
    collection || collections.find((item) => item.uid === instance.collectionUid) || null
  ), [collection, collections, instance.collectionUid]);

  const activeWorkspace = useMemo(() => (
    workspaces.find((workspace) => workspace.uid === activeWorkspaceUid) || null
  ), [workspaces, activeWorkspaceUid]);

  const location = useMemo(() => (
    resolveMockResponseLocation(instance, workspaces, activeWorkspace)
  ), [instance, workspaces, activeWorkspace]);

  const spec = useMemo(() => (
    resolveInstanceSpec(instance, apiSpecs)
  ), [instance, apiSpecs]);

  useEffect(() => {
    dispatch(loadMockResponses(location));
  }, [dispatch, location.mockServerUid, location.workspacePath]);

  const isCollectionServer = instance.sourceType === 'collection';
  const isSpecServer = instance.sourceType === 'spec';

  const filteredResponses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return responses;
    }

    return responses.filter((response) => (
      (response.name || '').toLowerCase().includes(query)
      || (response.request?.url || '').toLowerCase().includes(query)
      || (response.request?.method || '').toLowerCase().includes(query)
    ));
  }, [responses, searchQuery]);

  const openResponseTab = (response) => {
    dispatch(addTab({
      uid: response.uid,
      type: 'mock-response',
      mockServerUid: instance.uid,
      collectionUid: resolvedCollection?.uid || instance.collectionUid,
      responseName: response.name,
      tabName: response.name,
      preview: false
    }));
  };

  const handleCreate = async ({ name, description, statusCode, bodyType, exampleSelection }) => {
    try {
      if (exampleSelection) {
        const response = copyExampleToMockResponse(exampleSelection.example, exampleSelection.item);
        response.name = name;
        response.description = description;

        const result = await dispatch(saveMockResponse({
          ...location,
          response
        })).unwrap();

        openResponseTab(result.response);
        toast.success(t('MOCK_SERVER.CREATED_FROM_EXAMPLE', 'Mock response created from example'));
        return;
      }

      const result = await dispatch(createMockResponse({
        ...location,
        name,
        description,
        statusCode,
        bodyType
      })).unwrap();

      openResponseTab(result.response);
      toast.success(t('MOCK_SERVER.RESPONSE_CREATED', 'Mock response created'));
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.CREATE_RESPONSE_ERROR', 'Failed to create mock response'));
      // rethrow so CreateMockResponseModal keeps itself open with the entered values
      throw err;
    }
  };

  const handleGenerateFromSpec = () => {
    if (!spec?.pathname) {
      toast.error(t('MOCK_SERVER.SPEC_NOT_FOUND', 'Could not locate the API spec file'));
      return;
    }

    setShowGenerateModal(true);
  };

  const handleConfirmGenerateFromSpec = async ({ generateFromSchema }) => {
    setIsGenerating(true);
    try {
      const result = await dispatch(generateMockResponsesFromSpec({
        ...location,
        specPathname: spec.pathname,
        generateFromSchema
      })).unwrap();

      toast.success(t('MOCK_SERVER.GENERATED_FROM_SPEC_SUCCESS', 'Generated {{count}} mock responses from spec', { count: result.createdCount }));
      setShowGenerateModal(false);
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.GENERATE_FROM_SPEC_ERROR', 'Failed to generate mock responses from spec'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmSync = async () => {
    if (!resolvedCollection) {
      return;
    }

    setIsSyncing(true);
    try {
      const examples = collectCollectionExamples(resolvedCollection);
      const { updated, createdCount, updatedCount } = mergeMockResponsesFromExamples(responses, examples);

      await dispatch(syncMockResponsesFromExamples({
        ...location,
        responses: updated
      })).unwrap();

      updated.forEach((response) => {
        dispatch(updateTabMeta({
          uid: response.uid,
          tabName: response.name,
          responseName: response.name
        }));
      });

      setShowSyncModal(false);
      toast.success(t('MOCK_SERVER.SYNC_EXAMPLES_SUCCESS', 'Synced mock responses ({{created}} added, {{updated}} updated)', { created: createdCount, updated: updatedCount }));
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.SYNC_EXAMPLES_ERROR', 'Failed to sync with collection examples'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncWithSpec = () => {
    if (!spec?.pathname) {
      toast.error(t('MOCK_SERVER.SPEC_NOT_FOUND', 'Could not locate the API spec file'));
      return;
    }

    setShowSyncSpecModal(true);
  };

  const handleConfirmSyncWithSpec = async () => {
    if (!spec?.pathname) {
      return;
    }

    setIsSyncingSpec(true);
    try {
      const specResponses = await dispatch(loadMockResponsesFromSpec({
        specPathname: spec.pathname,
        generateFromSchema: true
      })).unwrap();

      const { updated, createdCount, updatedCount } = mergeMockResponsesFromSpec(responses, specResponses);

      await dispatch(syncMockResponsesFromExamples({
        ...location,
        responses: updated
      })).unwrap();

      updated.forEach((response) => {
        dispatch(updateTabMeta({
          uid: response.uid,
          tabName: response.name,
          responseName: response.name
        }));
      });

      setShowSyncSpecModal(false);
      toast.success(t('MOCK_SERVER.SYNC_SPEC_SUCCESS', 'Synced with spec ({{created}} added, {{updated}} updated)', { created: createdCount, updated: updatedCount }));
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.SYNC_SPEC_ERROR', 'Failed to sync with API spec'));
    } finally {
      setIsSyncingSpec(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingResponse) {
      return;
    }

    setIsDeleting(true);
    try {
      await dispatch(deleteMockResponse({
        ...location,
        responseUid: deletingResponse.uid
      })).unwrap();

      dispatch(closeTabs({ tabUids: [deletingResponse.uid] }));
      dispatch(removeMockResponseEditor({ responseUid: deletingResponse.uid }));
      setDeletingResponse(null);
      toast.success(t('MOCK_SERVER.RESPONSE_DELETED', 'Mock response deleted'));
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.DELETE_RESPONSE_ERROR', 'Failed to delete mock response'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyUrl = async (response) => {
    try {
      const url = buildMockServerTryUrl({
        port: mockServerPort,
        requestUrl: response.request?.url,
        params: response.request?.params
      });
      await navigator.clipboard.writeText(url);
      toast.success(t('MOCK_SERVER.URL_COPIED', 'URL copied'));
    } catch {
      toast.error(t('COMMON.FAILED_TO_COPY', 'Failed to copy to clipboard'));
    }
  };

  return (
    <StyledWrapper>
      {deletingResponse ? (
        <MockConfirmModal
          title={t('MOCK_SERVER.DELETE_MOCK_RESPONSE', 'Delete Mock Response')}
          confirmText={isDeleting ? t('MOCK_SERVER.DELETING', 'Deleting...') : t('COMMON.DELETE', 'Delete')}
          confirmDisabled={isDeleting}
          confirmButtonColor="danger"
          dataTestId="delete-mock-response-modal"
          onClose={() => {
            if (!isDeleting) {
              setDeletingResponse(null);
            }
          }}
          onConfirm={handleConfirmDelete}
        >
          {t('MOCK_SERVER.CONFIRM_DELETE_RESPONSE', 'Are you sure you want to delete the mock response')}
          {' '}
          <span className="font-medium">{deletingResponse?.name}</span>
          ?
        </MockConfirmModal>
      ) : null}

      {showGenerateModal ? (
        <GenerateFromSpecModal
          specName={spec?.name || instance.specPath}
          isGenerating={isGenerating}
          onClose={() => {
            if (!isGenerating) {
              setShowGenerateModal(false);
            }
          }}
          onConfirm={handleConfirmGenerateFromSpec}
        />
      ) : null}

      {showSyncModal ? (
        <MockConfirmModal
          title={t('MOCK_SERVER.SYNC_WITH_COLLECTION_EXAMPLES', 'Sync with Collection Examples')}
          confirmText={isSyncing ? t('MOCK_SERVER.SYNCING', 'Syncing...') : t('MOCK_SERVER.SYNC', 'Sync')}
          confirmDisabled={isSyncing}
          dataTestId="sync-mock-examples-modal"
          onClose={() => {
            if (!isSyncing) {
              setShowSyncModal(false);
            }
          }}
          onConfirm={handleConfirmSync}
        >
          <p>
            {t('MOCK_SERVER.SYNC_EXAMPLES_DESC_1', 'Mock responses that match collection examples will be overwritten with the latest example data.')}
          </p>
          <p className="mt-3 text-sm opacity-80">
            {t('MOCK_SERVER.SYNC_EXAMPLES_DESC_2', 'Custom mock responses without a matching example will be kept.')}
          </p>
        </MockConfirmModal>
      ) : null}

      {showSyncSpecModal ? (
        <MockConfirmModal
          title={t('MOCK_SERVER.SYNC_WITH_API_SPEC', 'Sync with API Spec')}
          confirmText={isSyncingSpec ? t('MOCK_SERVER.SYNCING', 'Syncing...') : t('MOCK_SERVER.SYNC', 'Sync')}
          confirmDisabled={isSyncingSpec}
          dataTestId="mock-response-sync-spec-modal"
          onClose={() => {
            if (!isSyncingSpec) {
              setShowSyncSpecModal(false);
            }
          }}
          onConfirm={handleConfirmSyncWithSpec}
        >
          <p>
            {t('MOCK_SERVER.SYNC_SPEC_DESC_1', 'Mock responses matching an endpoint in')}
            {' '}
            <span className="font-medium">{spec?.name || instance.specPath || t('MOCK_SERVER.THIS_API_SPEC', 'this API spec')}</span>
            {' '}
            {t('MOCK_SERVER.SYNC_SPEC_DESC_2', 'will be overwritten with the latest spec data (bodies generated from schema).')}
          </p>
          <p className="mt-3 text-sm opacity-80">
            {t('MOCK_SERVER.SYNC_SPEC_DESC_2_KEPT', 'Custom mock responses without a matching endpoint will be kept.')}
          </p>
        </MockConfirmModal>
      ) : null}

      {showCreateModal ? (
        <CreateMockResponseModal
          collection={isSpecServer ? null : resolvedCollection}
          existingResponses={responses}
          onCreate={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      ) : null}

      <div className="actions">
        <div className="actions-toolbar">
          <Button
            size="sm"
            icon={<IconPlus size={14} stroke={1.75} />}
            onClick={() => setShowCreateModal(true)}
            data-testid="mock-response-create-btn"
          >
            {t('MOCK_SERVER.NEW_MOCK_RESPONSE', 'New Mock Response')}
          </Button>

          {isCollectionServer ? (
            <Button
              color="secondary"
              size="sm"
              onClick={() => setShowSyncModal(true)}
              disabled={!resolvedCollection}
              data-testid="mock-response-sync-examples-btn"
            >
              {t('MOCK_SERVER.SYNC_WITH_EXAMPLES', 'Sync with Examples')}
            </Button>
          ) : null}

          {isSpecServer ? (
            <Button
              color="secondary"
              size="sm"
              onClick={handleGenerateFromSpec}
              disabled={isGenerating || !spec?.pathname}
              data-testid="mock-response-generate-from-spec-btn"
            >
              {isGenerating ? t('MOCK_SERVER.GENERATING', 'Generating...') : t('MOCK_SERVER.GENERATE_FROM_API_SPEC', 'Generate from API Spec')}
            </Button>
          ) : null}

          {isSpecServer && responses.length > 0 ? (
            <Button
              color="secondary"
              size="sm"
              onClick={handleSyncWithSpec}
              disabled={!spec?.pathname}
              data-testid="mock-response-sync-spec-btn"
            >
              {t('MOCK_SERVER.SYNC_WITH_SPEC', 'Sync with Spec')}
            </Button>
          ) : null}
        </div>

        {responses.length > 0 ? (
          <MockSearchInput
            className="response-search"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('MOCK_SERVER.SEARCH_RESPONSES_PLACEHOLDER', 'Search by name, method, or endpoint')}
            data-testid="mock-response-search-input"
          />
        ) : null}
      </div>

      <ListGroup
        maxWidth="100%"
        items={filteredResponses}
        getKey={(response) => response.uid}
        emptyState={{
          icon: <IconServer2 size={22} stroke={1.5} aria-hidden="true" />,
          title: responses.length ? t('MOCK_SERVER.NO_MATCHING_MOCK_RESPONSES', 'No matching mock responses') : t('MOCK_SERVER.NO_MOCK_RESPONSES_YET', 'No mock responses yet'),
          text: responses.length
            ? t('MOCK_SERVER.NO_RESPONSES_MATCH_SEARCH', 'No mock response matches your search.')
            : isSpecServer
              ? t('MOCK_SERVER.SPEC_SERVER_EMPTY_HELP', 'Generate them from your API spec, or create one manually and add rules to match requests.')
              : t('MOCK_SERVER.COLLECTION_SERVER_EMPTY_HELP', 'Create one to define the routes and responses this mock server serves.')
        }}
        renderItem={(response) => (
          <ListGroup.Item
            leading={<IconServer2 size={14} stroke={1.5} className="response-item-icon" aria-hidden="true" />}
            actions={(
              <>
                <ActionIcon
                  label={t('MOCK_SERVER.COPY_MOCK_URL', 'Copy mock URL')}
                  onClick={() => handleCopyUrl(response)}
                  data-testid={`mock-response-copy-${response.uid}`}
                >
                  <IconCopy size={15} stroke={1.5} aria-hidden="true" />
                </ActionIcon>
                <ActionIcon
                  label={t('MOCK_SERVER.DELETE_MOCK_RESPONSE', 'Delete mock response')}
                  onClick={() => setDeletingResponse(response)}
                  data-testid={`mock-response-delete-${response.uid}`}
                >
                  <IconTrash size={15} stroke={1.5} aria-hidden="true" />
                </ActionIcon>
              </>
            )}
            className="response-item"
          >
            <button
              type="button"
              className="response-item-open"
              onClick={() => openResponseTab(response)}
              data-testid={`mock-response-open-${response.uid}`}
            >
              <div className="response-item-name">{response.name}</div>
              <div className="response-item-endpoint">
                {(response.request?.method || 'GET').toUpperCase()} {response.request?.url}
              </div>
              <div className="response-item-rules">
                {response.rules?.conditions?.length
                  ? t('MOCK_SERVER.RULES_COUNT_OPERATOR', { count: response.rules.conditions.length, op: response.rules.operator || 'AND', defaultValue: `${response.rules.conditions.length} rule(s), ${response.rules.operator || 'AND'}` })
                  : t('MOCK_SERVER.NO_RULES_DEFAULT_MATCH', 'No rules (default match)')}
              </div>
            </button>
          </ListGroup.Item>
        )}
      />
    </StyledWrapper>
  );
};

export default MockResponsesList;

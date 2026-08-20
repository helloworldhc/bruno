import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { startMockServer, stopMockServer, refreshMockRoutes, loadMockResponses, syncMockServerState } from 'providers/ReduxStore/slices/mock-server/index';
import { IconRefresh, IconCopy, IconCheck, IconPlayerPlay, IconPlayerStop, IconSettings } from '@tabler/icons';
import toast from 'react-hot-toast';
import RouteTable from './RouteTable';
import RequestLog from './RequestLog';
import CreateMockServerModal from 'components/MockServer/CreateMockServerModal';
import DeleteMockServerModal from 'components/MockServer/DeleteMockServerModal';
import {
  findMockServerInstance,
  getMockServerInstances,
  checkMockServerPortAvailable,
  getMockServerPortError,
  getMockServerNameError,
  isMockServerNameTaken,
  resolveInstanceSpec,
  saveMockServerInstance,
  resolveMockServerStartPayload,
  resolveMockServerWorkspacePath,
  updateMockServerTabName,
  toMockServerDelayInputValue,
  blockMockServerDelayKeys
} from 'utils/mock-server/mock-server-instances';
import MockResponsesList from 'components/MockServer/MockResponse/MockResponsesList';
import Tab from 'components/Tab';
import ActionIcon from 'ui/ActionIcon';
import Button from 'ui/Button';
import { resolveMockResponseLocation, countMockRoutes } from 'utils/mock-server/mock-responses';
import StyledWrapper from './StyledWrapper';

const MockServerLogCount = ({ mockServerUid }) => {
  const logCount = useSelector((state) => (state.mockServer.requestLogs[mockServerUid] || []).length);

  if (!logCount) {
    return null;
  }

  return <sup className="ml-1 font-medium">{logCount}</sup>;
};

const MockServerDashboard = ({ instance, collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mockServerUid = instance.uid;
  const [activeTab, setActiveTab] = useState('responses');
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(null);
  const [delayDraft, setDelayDraft] = useState(null);
  const [portError, setPortError] = useState(null);
  const apiSpecs = useSelector((state) => state.apiSpec.apiSpecs);
  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);
  const storedInstance = useSelector((state) => (
    findMockServerInstance(state, mockServerUid) || instance
  ));
  const workspaceInstances = useSelector((state) => getMockServerInstances(state, activeWorkspaceUid));
  const mockResponses = useSelector((state) => state.mockServer.mockResponses[mockServerUid]) || [];
  const routeCount = useMemo(() => countMockRoutes(mockResponses), [mockResponses]);
  const exampleCount = mockResponses.length;

  const activeWorkspace = useMemo(() => (
    workspaces.find((workspace) => workspace.uid === activeWorkspaceUid) || null
  ), [workspaces, activeWorkspaceUid]);

  const location = useMemo(() => (
    resolveMockResponseLocation(instance, workspaces, activeWorkspace)
  ), [instance, workspaces, activeWorkspace]);

  const serverState = useSelector((state) => state.mockServer.servers[mockServerUid]) || {
    status: 'stopped',
    port: null,
    baseUrl: null,
    globalDelay: instance.globalDelay || 0
  };

  const isRunning = serverState.status === 'running';
  const isStarting = serverState.status === 'starting';
  const isStopping = serverState.status === 'stopping';
  const baseUrl = isRunning ? serverState.baseUrl : null;
  const activePort = isRunning ? serverState.port : storedInstance.port;
  const activeDelay = isRunning ? (serverState.globalDelay || 0) : (storedInstance.globalDelay || 0);
  const nameValue = nameDraft ?? storedInstance.name;
  const delayValue = delayDraft ?? activeDelay;

  useEffect(() => {
    validatePort(activePort);
  }, [activePort]);

  const validatePort = async (value = activePort) => {
    const trimmed = String(value).trim();

    if (!trimmed) {
      const error = 'Port is required';
      setPortError(error);
      return error;
    }

    const nextPort = Number(trimmed);
    if (!Number.isInteger(nextPort) || nextPort < 1 || nextPort > 65535) {
      const error = 'Port must be between 1 and 65535';
      setPortError(error);
      return error;
    }

    const portCheck = await checkMockServerPortAvailable(nextPort, workspaceInstances, {
      excludeUid: mockServerUid
    });
    const error = getMockServerPortError(portCheck, nextPort);
    setPortError(error);
    return error;
  };

  useEffect(() => {
    dispatch(syncMockServerState(location));
  }, [dispatch, location.mockServerUid, location.workspacePath]);

  const handleStart = async () => {
    try {
      const error = await validatePort();
      if (error) {
        toast.error(error);
        return;
      }

      const payload = resolveMockServerStartPayload(storedInstance, {
        collection,
        apiSpecs,
        workspacePath: resolveMockServerWorkspacePath(storedInstance, workspaces, activeWorkspace)
      });
      const result = await dispatch(startMockServer(payload)).unwrap();
      await dispatch(syncMockServerState(location));
      toast.success(`Mock server started at ${result.baseUrl}`);
    } catch (err) {
      toast.error(err.message || 'Failed to start mock server');
    }
  };

  const handleStop = async () => {
    try {
      await dispatch(stopMockServer({ mockServerUid })).unwrap();
      await dispatch(syncMockServerState(location));
      toast.success(t('MOCK_SERVER.SERVER_STOPPED', 'Mock server stopped'));
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.STOP_ERROR', 'Failed to stop mock server'));
    }
  };

  const handleRefresh = async () => {
    try {
      await dispatch(refreshMockRoutes({ mockServerUid })).unwrap();
      await dispatch(loadMockResponses(location));
      toast.success(t('MOCK_SERVER.ROUTES_REFRESHED', 'Routes refreshed'));
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.REFRESH_ROUTES_ERROR', 'Failed to refresh routes'));
    }
  };

  const handleCopyUrl = async () => {
    if (!baseUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(baseUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('MOCK_SERVER.URL_COPIED', 'URL copied'));
    } catch {
      toast.error(t('COMMON.FAILED_TO_COPY', 'Failed to copy to clipboard'));
    }
  };

  const handleNameBlur = async () => {
    if (nameDraft === null) {
      return;
    }

    const trimmed = nameDraft.trim();
    if (trimmed === storedInstance.name) {
      setNameDraft(null);
      return;
    }

    const nameError = getMockServerNameError(trimmed);
    if (nameError) {
      toast.error(nameError);
      setNameDraft(null);
      return;
    }

    if (isMockServerNameTaken(workspaceInstances, trimmed, mockServerUid)) {
      toast.error(t('MOCK_SERVER.NAME_EXISTS', 'A mock server with this name already exists'));
      setNameDraft(null);
      return;
    }

    const nextInstance = { ...storedInstance, name: trimmed };
    try {
      await dispatch(saveMockServerInstance(nextInstance));
      dispatch(updateMockServerTabName(nextInstance));
      setNameDraft(null);
      toast.success(t('MOCK_SERVER.NAME_UPDATED', 'Mock server name updated'));
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.UPDATE_NAME_ERROR', 'Failed to update mock server name'));
      setNameDraft(null);
    }
  };

  const handleDelayChange = (event) => {
    setDelayDraft(toMockServerDelayInputValue(event.target.value));
  };

  const handleDelayBlur = async () => {
    if (delayDraft === null) {
      return;
    }

    const parsed = typeof delayDraft === 'number' ? delayDraft : (parseInt(delayDraft, 10) || 0);
    const normalized = Math.max(0, parsed);
    if (normalized === (storedInstance.globalDelay || 0)) {
      setDelayDraft(null);
      return;
    }

    const nextInstance = { ...storedInstance, globalDelay: normalized };
    try {
      await dispatch(saveMockServerInstance(nextInstance));
      setDelayDraft(null);
      toast.success(t('MOCK_SERVER.DELAY_UPDATED', 'Delay updated'));
    } catch (err) {
      toast.error(err.message || t('MOCK_SERVER.UPDATE_DELAY_ERROR', 'Failed to update delay'));
      setDelayDraft(null);
    }
  };

  const statusDotClass = isRunning
    ? 'running'
    : isStarting
      ? 'starting'
      : isStopping
        ? 'stopping'
        : serverState.status === 'error'
          ? 'error'
          : 'stopped';

  const statusLabel = isRunning
    ? t('MOCK_SERVER.RUNNING', 'Running')
    : isStarting
      ? t('MOCK_SERVER.STARTING', 'Starting...')
      : isStopping
        ? t('MOCK_SERVER.STOPPING', 'Stopping...')
        : serverState.status === 'error'
          ? t('COMMON.ERROR', 'Error')
          : t('MOCK_SERVER.STOPPED', 'Stopped');

  const getTabPanel = (tab) => {
    switch (tab) {
      case 'responses':
        return <MockResponsesList instance={instance} collection={collection} />;
      case 'routes':
        return <RouteTable mockServerUid={mockServerUid} />;
      case 'log':
        return <RequestLog mockServerUid={mockServerUid} location={location} />;
      default:
        return null;
    }
  };

  const sourceLabel = useMemo(() => {
    if (instance.sourceType === 'manual') {
      return t('MOCK_SERVER.SOURCE_STANDALONE', 'Standalone');
    }

    if (instance.sourceType === 'spec') {
      const spec = resolveInstanceSpec(instance, apiSpecs);
      if (spec?.pathname) {
        return spec.name || spec.filename || spec.pathname;
      }
      return spec.name || spec.filename || spec.pathname || t('MOCK_SERVER.API_SPEC', 'API Spec');
    }

    return collection?.name || t('MOCK_SERVER.COLLECTION', 'Collection');
  }, [apiSpecs, collection?.name, instance, t]);

  return (
    <StyledWrapper className="flex flex-col h-full relative px-4 py-4 overflow-hidden" data-testid="mock-server-dashboard" data-mock-server-uid={mockServerUid}>
      {settingsOpen && (
        <CreateMockServerModal
          editingInstance={instance}
          onClose={() => setSettingsOpen(false)}
          onDelete={() => {
            setSettingsOpen(false);
            setDeleteOpen(true);
          }}
        />
      )}
      {deleteOpen && (
        <DeleteMockServerModal
          instance={instance}
          onClose={() => setDeleteOpen(false)}
        />
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <input
            type="text"
            className="mock-server-name-input"
            aria-label={t('MOCK_SERVER.MOCK_SERVER_NAME', 'Mock server name')}
            value={nameValue}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
            data-testid="mock-server-title-input"
          />
          <div className="source-label" data-testid="mock-server-source-label">
            {t('MOCK_SERVER.SOURCE_LABEL', { source: sourceLabel, defaultValue: `Source: ${sourceLabel}` })}
          </div>
        </div>
        <ActionIcon
          label={t('MOCK_SERVER.MOCK_SERVER_SETTINGS', 'Mock server settings')}
          onClick={() => setSettingsOpen(true)}
          data-testid="mock-server-settings-btn"
        >
          <IconSettings size={16} stroke={1.5} aria-hidden="true" />
        </ActionIcon>
      </div>

      <div className="server-bar" data-testid="mock-server-controls">
        <div className="server-bar-main">
          <div className="status-indicator">
            <div className={`status-dot ${statusDotClass}`} data-testid="mock-server-status-dot" />
            <span className="status-text" data-testid="mock-server-status-text">{statusLabel}</span>
          </div>

          {isRunning && baseUrl && (
            <button className="copy-url-btn" onClick={handleCopyUrl} title={t('MOCK_SERVER.COPY_MOCK_SERVER_URL', 'Copy mock server URL')} data-testid="mock-server-copy-url">
              {copied ? <IconCheck size={13} strokeWidth={2} /> : <IconCopy size={13} strokeWidth={1.5} />}
              <span className="url-text">{baseUrl}</span>
            </button>
          )}

          {isRunning && (
            <div className="server-stats" data-testid="mock-server-stats">
              <span>{t('MOCK_SERVER.ROUTES_COUNT', { count: routeCount, defaultValue: `${routeCount} routes` })}</span>
              <span>{t('MOCK_SERVER.RESPONSES_COUNT', { count: exampleCount, defaultValue: `${exampleCount} responses` })}</span>
            </div>
          )}

          <div className="server-controls">
            <div className="control-group">
              <label htmlFor="mock-server-delay-input">{t('MOCK_SERVER.DELAY_MS', 'Delay (ms)')}</label>
              <input
                id="mock-server-delay-input"
                type="number"
                value={delayValue}
                onChange={handleDelayChange}
                onKeyDown={blockMockServerDelayKeys}
                onBlur={handleDelayBlur}
                disabled={isRunning || isStarting || isStopping}
                min={0}
                step={100}
                data-testid="mock-server-delay-input"
              />
            </div>

            {!isRunning && !isStopping ? (
              <Button
                size="sm"
                icon={<IconPlayerPlay size={14} stroke={1.5} />}
                onClick={handleStart}
                disabled={isStarting || Boolean(portError)}
                data-testid="mock-server-start-btn"
              >
                {isStarting ? t('MOCK_SERVER.STARTING', 'Starting...') : t('MOCK_SERVER.START_SERVER', 'Start Server')}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  color="danger"
                  size="sm"
                  icon={<IconPlayerStop size={14} stroke={1.5} />}
                  onClick={handleStop}
                  disabled={isStopping}
                  data-testid="mock-server-stop-btn"
                >
                  {isStopping ? t('MOCK_SERVER.STOPPING', 'Stopping...') : t('MOCK_SERVER.STOP_SERVER', 'Stop Server')}
                </Button>
                {!isStopping && (
                  <ActionIcon label={t('MOCK_SERVER.REFRESH_ROUTES', 'Refresh routes')} onClick={handleRefresh} data-testid="mock-server-refresh-btn">
                    <IconRefresh size={16} stroke={1.5} aria-hidden="true" />
                  </ActionIcon>
                )}
              </>
            )}
          </div>
        </div>

        {isRunning && storedInstance.port && serverState.port && Number(storedInstance.port) !== Number(serverState.port) && (
          <div className="server-notice" data-testid="mock-server-port-mismatch">
            {t('MOCK_SERVER.PORT_MISMATCH_NOTICE', {
              configured: storedInstance.port,
              running: serverState.port,
              defaultValue: `Configured port ${storedInstance.port} differs from the running port ${serverState.port}.`
            })}
          </div>
        )}

        {serverState.error && (
          <div className="server-error" data-testid="mock-server-error">{serverState.error}</div>
        )}
      </div>

      <div className="flex flex-wrap items-center tabs" role="tablist">
        <Tab
          name="responses"
          label={t('MOCK_SERVER.RESPONSES', 'Responses')}
          isActive={activeTab === 'responses'}
          onClick={setActiveTab}
          data-testid="mock-server-tab-responses"
        />
        <Tab
          name="routes"
          label={t('MOCK_SERVER.ROUTES', 'Routes')}
          count={routeCount}
          isActive={activeTab === 'routes'}
          onClick={setActiveTab}
          data-testid="mock-server-tab-routes"
        />
        <Tab
          name="log"
          label={<>{t('MOCK_SERVER.REQUEST_LOG', 'Request Log')}<MockServerLogCount mockServerUid={mockServerUid} /></>}
          isActive={activeTab === 'log'}
          onClick={setActiveTab}
          data-testid="mock-server-tab-log"
        />
      </div>

      <section className="mt-4 h-full overflow-auto">
        {getTabPanel(activeTab)}
      </section>
    </StyledWrapper>
  );
};

export default MockServerDashboard;

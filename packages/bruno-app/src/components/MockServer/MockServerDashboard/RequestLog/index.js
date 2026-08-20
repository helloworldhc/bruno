import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { IconInfoCircle, IconTrash } from '@tabler/icons';
import { clearMockLog, syncMockServerState } from 'providers/ReduxStore/slices/mock-server/index';
import { subscribeMockServerLog } from 'utils/mock-server/mock-server-log-subscription';
import FilterDropdown from 'components/FilterDropdown';
import Button from 'ui/Button';
import MethodBadge from 'ui/MethodBadge';
import StyledWrapper from './StyledWrapper';

const getStatusClass = (statusCode, matched) => {
  if (!matched) return 'status-unmatched';
  if (statusCode >= 200 && statusCode < 300) return 'status-2xx';
  if (statusCode >= 300 && statusCode < 400) return 'status-3xx';
  if (statusCode >= 400 && statusCode < 500) return 'status-4xx';
  if (statusCode >= 500) return 'status-5xx';
  return '';
};

const formatTimestamp = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      + '.' + String(d.getMilliseconds()).padStart(3, '0');
  } catch {
    return iso;
  }
};

const formatConditionValue = (value) => {
  if (value === null || value === undefined) {
    return '(missing)';
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  return String(value);
};

const formatCondition = (condition) => {
  if (!condition?.target) {
    return 'No rules (fallback)';
  }

  const key = condition.key ? ` ${condition.key}` : '';
  return `${condition.target}${key} ${condition.operator} ${formatConditionValue(condition.expected)}`;
};

const getSelectionReasonLabel = (selectionReason, t) => {
  if (selectionReason === 'specific_rules') {
    return t ? t('MOCK_SERVER.SELECTION_SPECIFIC_RULES', 'Selected because specific rules matched') : 'Selected because specific rules matched';
  }

  if (selectionReason === 'fallback') {
    return t ? t('MOCK_SERVER.SELECTION_FALLBACK', 'Selected as fallback response') : 'Selected as fallback response';
  }

  return null;
};

const getMatchedMockResponseName = (entry) => (
  entry?.matchedMockResponseName
  || entry?.matchedExampleName
  || entry?.matchTrace?.selectedResponseName
  || null
);

const getFailureLabel = (failureReason, t) => {
  if (failureReason === 'no_route') {
    return t ? t('MOCK_SERVER.FAILURE_NO_ROUTE', 'No route matched this request') : 'No route matched this request';
  }

  if (failureReason === 'no_rule_match') {
    return t ? t('MOCK_SERVER.FAILURE_NO_RULE_MATCH', 'Route matched, but no response rules passed') : 'Route matched, but no response rules passed';
  }

  return null;
};

const MatchTracePanel = ({ entry }) => {
  const { t } = useTranslation();
  const trace = entry?.matchTrace;

  if (!trace) {
    return (
      <div className="match-trace-panel" data-testid="mock-server-match-trace">
        <div className="match-trace-empty">{t('MOCK_SERVER.NO_MATCH_TRACE', 'No match trace for this entry.')}</div>
      </div>
    );
  }

  const failureLabel = getFailureLabel(trace.failureReason, t);
  const selectionReasonLabel = getSelectionReasonLabel(trace.selectionReason, t);

  return (
    <div className="match-trace-panel" data-testid="mock-server-match-trace">
      <div className="match-trace-header">
        <span className="match-trace-route">{trace.routeKey || `${entry.method} ${entry.path}`}</span>
        {entry.matched
          ? (
              <span className="match-trace-result match-trace-result-success">
                {t('MOCK_SERVER.MATCHED', 'Matched')}: {trace.selectedResponseName || getMatchedMockResponseName(entry)}
                {selectionReasonLabel ? ` (${selectionReasonLabel})` : ''}
              </span>
            )
          : <span className="match-trace-result match-trace-result-fail">{failureLabel || t('MOCK_SERVER.NO_MATCH', 'No match')}</span>}
      </div>

      {trace.availableRoutes?.length ? (
        <div className="match-trace-section">
          <div className="match-trace-section-title">{t('MOCK_SERVER.AVAILABLE_ROUTES', 'Available routes')}</div>
          <ul className="match-trace-list">
            {trace.availableRoutes.map((route) => (
              <li key={route}>{route}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {trace.candidates?.length ? (
        <div className="match-trace-section">
          <div className="match-trace-section-title">{t('MOCK_SERVER.RESPONSES_CONSIDERED', 'Responses considered')}</div>
          {trace.candidates.map((candidate) => (
            <div
              key={candidate.responseUid || candidate.responseName}
              className={`match-trace-candidate ${candidate.selected ? 'is-selected' : ''}`}
            >
              <div className="match-trace-candidate-header">
                <span>{candidate.responseName}</span>
                {candidate.isFallback ? <span className="match-trace-badge">{t('MOCK_SERVER.FALLBACK', 'fallback')}</span> : null}
                {candidate.selected ? <span className="match-trace-badge selected">{t('MOCK_SERVER.SELECTED', 'selected')}</span> : null}
                {candidate.matched && !candidate.selected ? (
                  <span className="match-trace-badge skipped">{t('MOCK_SERVER.MATCHED_NOT_SELECTED', 'matched, not selected')}</span>
                ) : null}
              </div>

              {candidate.conditions?.length ? (
                <ul className="match-trace-conditions">
                  {candidate.conditions.map((condition, index) => (
                    <li
                      key={`${candidate.responseUid || candidate.responseName}-${index}`}
                      className={condition.pass ? 'pass' : 'fail'}
                    >
                      <span className="match-trace-condition-status">{condition.pass ? 'pass' : 'fail'}</span>
                      <span>{formatCondition(condition)}</span>
                      {!condition.pass ? (
                        <span className="match-trace-actual">got {formatConditionValue(condition.actual)}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="match-trace-fallback-note">{t('MOCK_SERVER.MATCHES_ANY_REQUEST', 'Matches any request on this route')}</div>
              )}

              {!candidate.matched && candidate.ruleOperator && candidate.conditions?.length ? (
                <div className="match-trace-operator">
                  {t('MOCK_SERVER.RULE_GROUP', 'Rule group')}: {candidate.ruleOperator}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const RequestLog = ({ mockServerUid, location }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const logs = useSelector((state) => state.mockServer.requestLogs[mockServerUid]) || [];
  const [matchFilter, setMatchFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedLogUid, setSelectedLogUid] = useState(null);
  const [collapsedLogUid, setCollapsedLogUid] = useState(null);

  const matchFilterOptions = useMemo(() => [
    { value: 'matched', label: t('MOCK_SERVER.MATCHED', 'Matched') },
    { value: 'unmatched', label: t('MOCK_SERVER.UNMATCHED', 'Unmatched') }
  ], [t]);

  const statusFilterOptions = useMemo(() => [
    { value: '2xx', label: '2xx Success' },
    { value: '3xx', label: '3xx Redirect' },
    { value: '4xx', label: '4xx Client Error' },
    { value: '5xx', label: '5xx Server Error' }
  ], []);

  useEffect(() => {
    const unsubscribe = subscribeMockServerLog(mockServerUid);
    dispatch(syncMockServerState(location));

    return unsubscribe;
  }, [dispatch, mockServerUid, location.workspacePath]);

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      if (matchFilter === 'matched' && !entry.matched) return false;
      if (matchFilter === 'unmatched' && entry.matched) return false;

      if (statusFilter) {
        const code = entry.statusCode;
        if (statusFilter === '2xx' && (code < 200 || code >= 300)) return false;
        if (statusFilter === '3xx' && (code < 300 || code >= 400)) return false;
        if (statusFilter === '4xx' && (code < 400 || code >= 500)) return false;
        if (statusFilter === '5xx' && (code < 500 || code >= 600)) return false;
      }

      return true;
    });
  }, [logs, matchFilter, statusFilter]);

  const displayedLogs = useMemo(() => [...filteredLogs].reverse(), [filteredLogs]);

  const autoExpandUid = displayedLogs[0]?.matchTrace ? displayedLogs[0].uid : null;
  const isSelectionVisible = selectedLogUid && displayedLogs.some((entry) => entry.uid === selectedLogUid);
  const expandedLogUid = isSelectionVisible
    ? selectedLogUid
    : (collapsedLogUid === autoExpandUid ? null : autoExpandUid);

  const handleClear = () => {
    dispatch(clearMockLog({ mockServerUid }));
    setSelectedLogUid(null);
    setCollapsedLogUid(null);
  };

  const toggleTrace = (uid) => {
    const isExpanded = expandedLogUid === uid;
    setSelectedLogUid(isExpanded ? null : uid);
    setCollapsedLogUid(isExpanded ? uid : null);
  };

  if (logs.length === 0) {
    return (
      <StyledWrapper className="h-full w-full">
        <div className="text-xs text-muted empty-state">
          {t('MOCK_SERVER.NO_REQUESTS_LOGGED_YET', 'No requests logged yet. Send requests to the mock server to see them here.')}
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper className="h-full w-full">
      <div className="flex items-center gap-2 mb-4">
        <FilterDropdown
          label={t('MOCK_SERVER.MATCH', 'Match')}
          options={matchFilterOptions}
          value={matchFilter}
          onChange={setMatchFilter}
          allLabel={t('MOCK_SERVER.ALL_REQUESTS', 'All Requests')}
          testId="mock-server-match-filter"
        />
        <FilterDropdown
          label={t('MOCK_SERVER.STATUS', 'Status')}
          options={statusFilterOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          allLabel={t('MOCK_SERVER.ALL_STATUS', 'All Status')}
          testId="mock-server-status-filter"
        />
        <div className="flex-grow" />
        <span className="text-xs text-muted" data-testid="mock-server-log-count">
          {t('MOCK_SERVER.REQUESTS_COUNT', { count: logs.length, defaultValue: `${logs.length} requests` })}
        </span>
        <Button
          variant="ghost"
          color="secondary"
          size="xs"
          icon={<IconTrash size={14} stroke={1.5} />}
          onClick={handleClear}
          data-testid="mock-server-log-clear"
        >
          {t('COMMON.CLEAR', 'Clear')}
        </Button>
      </div>

      <div className="log-table-container">
        <table>
          <colgroup>
            <col style={{ width: '36px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '80px' }} />
            <col />
            <col style={{ width: '140px' }} />
            <col style={{ width: '70px' }} />
            <col style={{ width: '70px' }} />
            <col style={{ width: '80px' }} />
          </colgroup>
          <thead>
            <tr>
              <th aria-label={t('MOCK_SERVER.MATCH_TRACE', 'Match trace')} />
              <th>{t('MOCK_SERVER.TIME', 'Time')}</th>
              <th>{t('MOCK_SERVER.METHOD', 'Method')}</th>
              <th>{t('MOCK_SERVER.PATH', 'Path')}</th>
              <th>{t('MOCK_SERVER.MOCK_RESPONSE', 'Mock Response')}</th>
              <th>{t('MOCK_SERVER.STATUS', 'Status')}</th>
              <th>{t('MOCK_SERVER.DELAY', 'Delay')}</th>
              <th>{t('MOCK_SERVER.DURATION', 'Duration')}</th>
            </tr>
          </thead>
          <tbody>
            {displayedLogs.map((entry) => {
              const isExpanded = expandedLogUid === entry.uid;

              return (
                <React.Fragment key={entry.uid}>
                  <tr className={isExpanded ? 'log-row-expanded' : undefined}>
                    <td>
                      <button
                        type="button"
                        className={`inspect-btn ${isExpanded ? 'is-active' : ''}`}
                        onClick={() => toggleTrace(entry.uid)}
                        aria-label={t('MOCK_SERVER.SHOW_MATCH_TRACE', 'Show match trace')}
                        aria-expanded={isExpanded}
                        data-testid={`mock-server-log-inspect-${entry.uid}`}
                      >
                        <IconInfoCircle size={16} stroke={1.5} />
                      </button>
                    </td>
                    <td><span className="log-timestamp">{formatTimestamp(entry.timestamp)}</span></td>
                    <td><MethodBadge method={entry.method} className="method-badge" /></td>
                    <td><span className="log-path">{entry.path}</span></td>
                    <td>
                      {entry.matched
                        ? <span>{getMatchedMockResponseName(entry) || '-'}</span>
                        : <span className="no-match-label">{t('MOCK_SERVER.NO_MATCH', 'No Match')}</span>}
                    </td>
                    <td>
                      <span className={`status-code ${getStatusClass(entry.statusCode, entry.matched)}`}>
                        {entry.statusCode}
                      </span>
                    </td>
                    <td><span>{entry.delay > 0 ? `${entry.delay}ms` : '-'}</span></td>
                    <td><span>{entry.duration}ms</span></td>
                  </tr>
                  {isExpanded ? (
                    <tr className="log-trace-row">
                      <td colSpan={8}>
                        <MatchTracePanel entry={entry} />
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </StyledWrapper>
  );
};

export default RequestLog;

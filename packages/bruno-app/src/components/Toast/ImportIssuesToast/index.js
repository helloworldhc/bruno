import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { IconAlertCircle, IconBrandGithub, IconCopy, IconX } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import i18n from 'i18n';
import { useTranslation } from 'react-i18next';

const GITHUB_ISSUES_URL = 'https://github.com/usebruno/bruno/issues/new';
const MAX_URL_LENGTH = 8000;

const ImportIssuesToastContent = ({ t: toastInstance, issues, summary }) => {
  const { t } = useTranslation();
  const [includeItems, setIncludeItems] = useState(false);
  const hasSourceItems = issues.some((i) => i.sourceItem);

  const issuesSummary = issues.map((i) => `[${i.severity.toUpperCase()}] ${i.path} — ${i.message}`).join('\n');

  const buildIssueBody = () => {
    const sections = [
      '### Description',
      'Postman collection import completed with issues. Some items could not be converted.',
      '',
      '### Import Issues',
      '```',
      issuesSummary,
      '```'
    ];

    if (includeItems) {
      const itemsWithSource = issues.filter((i) => i.sourceItem);
      if (itemsWithSource.length > 0) {
        const itemsJson = itemsWithSource
          .map((i) => `// ${i.path}\n${JSON.stringify(i.sourceItem, null, 2)}`)
          .join('\n\n');
        sections.push(
          '',
          '### Failed Items',
          '> **Please redact any sensitive information (API keys, tokens, passwords, internal URLs) before submitting.**',
          '```json',
          itemsJson,
          '```'
        );
      }
    }

    sections.push(
      '',
      '### Steps to Reproduce',
      '1. Import the attached Postman collection (redact sensitive data before attaching)',
      '2. ',
      '',
      '### Additional Context',
      ''
    );

    return sections.join('\n');
  };

  const isUrlTooLong = useMemo(() => {
    const title = `Postman import: ${summary}`;
    const body = buildIssueBody();
    const params = new URLSearchParams({ title, body, labels: 'bug' });
    return `${GITHUB_ISSUES_URL}?${params.toString()}`.length > MAX_URL_LENGTH;
  }, [issues, summary, includeItems]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(issuesSummary);
      toast.success(i18n.t('COMMON.COPIED_TO_CLIPBOARD', 'Copied to clipboard'), { duration: 2000 });
    } catch (err) {
      toast.error(i18n.t('COMMON.FAILED_TO_COPY', 'Failed to copy to clipboard'), { duration: 3000 });
    }
  };

  const handleReport = async () => {
    const title = `Postman import: ${summary}`;
    const body = buildIssueBody();

    if (!isUrlTooLong) {
      const params = new URLSearchParams({ title, body, labels: 'bug' });
      window.open(`${GITHUB_ISSUES_URL}?${params.toString()}`, '_blank');
      return;
    }

    try {
      await navigator.clipboard.writeText(body);
      toast.success(i18n.t('IMPORT_ISSUES_TOAST.ISSUE_DETAILS_COPIED', 'Issue details copied — paste them into the GitHub issue body'), { duration: 5000 });
    } catch (err) {
      toast.error(i18n.t('COMMON.FAILED_TO_COPY', 'Failed to copy to clipboard'), { duration: 3000 });
    }
    const params = new URLSearchParams({ title, labels: 'bug' });
    window.open(`${GITHUB_ISSUES_URL}?${params.toString()}`, '_blank');
  };

  return (
    <StyledWrapper
      data-testid="import-issues-toast"
      style={{
        opacity: toastInstance.visible ? 1 : 0,
        transform: toastInstance.visible ? 'translateX(0)' : 'translateX(100%)'
      }}
    >
      <div className="toast-accent" />
      <div className="toast-body">
        <button
          type="button"
          className="toast-close"
          aria-label={i18n.t('COMMON.CLOSE', 'Close')}
          data-testid="import-issues-toast-close"
          onClick={() => toast.dismiss(toastInstance.id)}
        >
          <IconX size={14} />
        </button>
        <div className="toast-title" data-testid="import-issues-toast-title">
          {i18n.t('IMPORT_ISSUES_TOAST.TITLE', 'Imported with issues: {{summary}}', { summary })}
        </div>
        <div className="toast-hint">{i18n.t('TOAST.DEVTOOLS_HINT', 'Open DevTools console to see which items failed and why.')}</div>
        {hasSourceItems && (
          <label className="toast-checkbox">
            <input
              type="checkbox"
              checked={includeItems}
              onChange={(e) => setIncludeItems(e.target.checked)}
              data-testid="import-issues-include-items-checkbox"
            />
            <div className="toast-checkbox-text">
              <span className="toast-checkbox-label">{i18n.t('TOAST.INCLUDE_FAILED_REQUEST_DATA', 'Include failed request data')}</span>
              <span className="toast-checkbox-desc">{i18n.t('TOAST.INCLUDE_FAILED_REQUEST_DATA_DESC', 'Attaches the raw Postman request items that failed. May contain API keys, tokens, or internal URLs.')}</span>
            </div>
          </label>
        )}
        {isUrlTooLong && (
          <div className="toast-warning" data-testid="import-issues-url-too-long-warning">
            <IconAlertCircle size={14} className="toast-warning-icon" />
            <span>{i18n.t('IMPORT_ISSUES_TOAST.URL_TOO_LONG_WARNING', 'Issue details are too long to embed in the URL. Clicking "Report on GitHub" will copy them to your clipboard — paste it once the GitHub issue page opens.')}</span>
          </div>
        )}
        <div className="toast-actions">
          <button className="toast-btn" onClick={handleReport} data-testid="import-issues-report-btn">
            <IconBrandGithub size={13} />
            {i18n.t('COMMON.REPORT_ON_GITHUB', 'Report on GitHub')}
          </button>
          <button className="toast-btn" onClick={handleCopy} data-testid="import-issues-copy-btn">
            <IconCopy size={13} />
            {i18n.t('COMMON.COPY_ISSUES', 'Copy Issues')}
          </button>
        </div>
      </div>
    </StyledWrapper>
  );
};

/**
 * Show an import issues toast in the bottom-right corner.
 * Aggregates all issues into a single toast — does not stack.
 */
let activeImportToastId = null;

export const showImportIssuesToast = (issues) => {
  if (activeImportToastId) {
    toast.dismiss(activeImportToastId);
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const parts = [];
  if (errors.length > 0) parts.push(i18n.t('IMPORT_ISSUES_TOAST.ITEMS_SKIPPED', '{{count}} item(s) skipped', { count: errors.length }));
  if (warnings.length > 0) parts.push(i18n.t('IMPORT_ISSUES_TOAST.WARNINGS_COUNT', '{{count}} warning(s)', { count: warnings.length }));
  const summary = parts.join(', ');

  activeImportToastId = toast.custom(
    (t) => (
      <ImportIssuesToastContent t={t} issues={issues} summary={summary} />
    ),
    { duration: Infinity, position: 'bottom-right' }
  );

  return activeImportToastId;
};

export default ImportIssuesToastContent;

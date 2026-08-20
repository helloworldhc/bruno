import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  IconAlertTriangle,
  IconBan,
  IconCheck,
  IconCircleCheck,
  IconCode,
  IconCopy,
  IconLoader2,
  IconPackage,
  IconShieldLock,
  IconTerminal2
} from '@tabler/icons';
import Modal from 'components/Modal';
import Button from 'ui/Button';
import { saveCollectionSecurityConfig } from 'providers/ReduxStore/slices/collections/actions';
import { findCollectionByPathname } from 'utils/collections';
import StyledWrapper from './StyledWrapper';
import { useTranslation, Trans } from 'react-i18next';

const PackageList = ({ items }) => (
  <ul className="pkg-list">
    {items.map((name) => (
      <li key={name} className="pkg-list-item">
        <IconPackage size={12} strokeWidth={1.75} />
        <span>{name}</span>
      </li>
    ))}
  </ul>
);

// Renders "`a` and `b`" / "`a`, `b` and `c`" / "`a`, `b` and 3 more" as inline
// code spans for use inside a sentence.
const renderPackageExamples = (names = [], t) => {
  const shown = names.slice(0, 3);
  const remainder = names.length - shown.length;
  const andText = t ? t('COMMON.AND', ' and ') : ' and ';
  const andMoreText = t ? t('COMMON.AND_MORE', ' and {{count}} more', { count: remainder }) : ` and ${remainder} more`;
  return shown.map((name, idx) => {
    let separator = '';
    if (idx > 0) {
      separator = idx === shown.length - 1 && remainder === 0 ? andText : ', ';
    }
    return (
      <Fragment key={name}>
        {separator}
        <code>{name}</code>
        {idx === shown.length - 1 && remainder > 0 ? andMoreText : ''}
      </Fragment>
    );
  });
};

// Maps an install result's errorCode to a user-facing message. Falls back to a
// generic exit-code message for plain non-zero exits.
const getInstallFailureMessage = (result, t) => {
  switch (result?.errorCode) {
    case 'NPM_NOT_FOUND':
      return t('POSTMAN_PACKAGES.NPM_NOT_FOUND', 'npm was not found on your PATH. Install Node.js/npm, then retry or run the command manually.');
    case 'TIMEOUT':
      return t('POSTMAN_PACKAGES.TIMEOUT', 'npm install timed out. Try running the command manually in a terminal.');
    case 'SPAWN_FAILED':
    case 'SPAWN_ERROR':
      return t('POSTMAN_PACKAGES.SPAWN_FAILED', 'Could not start npm install. Try running the command manually.');
    default:
      return t('POSTMAN_PACKAGES.GENERIC_FAILED', `npm install failed (exit code ${result?.exitCode}). Try the manual command above.`, {
        exitCode: result?.exitCode
      });
  }
};

const PostmanPackageReport = ({ report, collectionPath, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const collections = useSelector((state) => state.collections.collections);
  const collection = useMemo(
    () => findCollectionByPathname(collections, collectionPath),
    [collections, collectionPath]
  );
  const sandboxMode = collection?.securityConfig?.jsSandboxMode || 'safe';
  const isDeveloperMode = sandboxMode === 'developer';

  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState(null);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const needsInstall = report?.needsInstall || [];
  const unsupported = report?.unsupported || [];
  const devMode = report?.devMode || [];

  const installCommand = useMemo(
    () => (needsInstall.length ? `npm install --save ${needsInstall.join(' ')}` : ''),
    [needsInstall]
  );

  const needsDevModeOnly
    = needsInstall.length === 0 && devMode.length > 0 && !isDeveloperMode;
  const hasActionable
    = needsInstall.length > 0 || unsupported.length > 0 || needsDevModeOnly;

  useEffect(() => {
    if (report && !hasActionable) onClose();
  }, [report, hasActionable, onClose]);

  if (!report || !hasActionable) return null;

  const installDone = installResult && installResult.success;
  const installFailed = installResult && !installResult.success;
  const installFailureMessage = installFailed ? getInstallFailureMessage(installResult, t) : '';

  const handleInstall = async () => {
    if (!collectionPath) {
      toast.error(t('POSTMAN_PACKAGES.PATH_NOT_AVAILABLE', 'Cannot install: collection path not available.'));
      return;
    }
    if (needsInstall.length === 0) return;

    setInstalling(true);
    setInstallResult(null);
    try {
      const result = await window.ipcRenderer.invoke(
        'renderer:install-postman-packages',
        collectionPath,
        needsInstall
      );
      setInstallResult(result);
      if (result.success) {
        toast.success(
          t('POSTMAN_PACKAGES.INSTALLED_SUCCESS', 'Installed {{count}} package{{plural}}', {
            count: needsInstall.length,
            plural: needsInstall.length === 1 ? '' : 's'
          })
        );
      } else {
        toast.error(t('POSTMAN_PACKAGES.INSTALL_FAILED_DETAILS', 'npm install failed. See details below.'));
      }
    } catch (err) {
      console.error('Install failed:', err);
      setInstallResult({ success: false, stderr: err?.message || String(err), exitCode: -1 });
      toast.error(t('POSTMAN_PACKAGES.FAILED_START_INSTALL', 'Failed to start npm install'));
    } finally {
      setInstalling(false);
    }
  };

  const handleSwitchToDeveloperMode = () => {
    if (!collection?.uid) {
      toast.error(t('POSTMAN_PACKAGES.COLLECTION_LOCATE_ERROR', 'Could not locate the imported collection to switch modes.'));
      return;
    }
    setSwitchingMode(true);
    dispatch(saveCollectionSecurityConfig(collection.uid, { jsSandboxMode: 'developer' }))
      .then(() => toast.success(t('POSTMAN_PACKAGES.DEV_MODE_ENABLED', 'Developer Mode enabled')))
      .catch((err) => {
        console.error(err);
        toast.error(t('POSTMAN_PACKAGES.SWITCH_MODE_ERROR', 'Failed to switch sandbox mode'));
      })
      .finally(() => setSwitchingMode(false));
  };

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t('COMMON.COULD_NOT_COPY', 'Could not copy to clipboard'));
    }
  };

  const isDismissAction = installDone || needsInstall.length === 0;
  const confirmText = installDone
    ? t('COMMON.DONE', 'Done')
    : installing
      ? t('POSTMAN_PACKAGES.INSTALLING', 'Installing…')
      : needsInstall.length > 0
        ? t('POSTMAN_PACKAGES.INSTALL_PACKAGES_BTN', `Install ${needsInstall.length} package${needsInstall.length === 1 ? '' : 's'}`, {
            count: needsInstall.length,
            plural: needsInstall.length === 1 ? '' : 's'
          })
        : t('COMMON.DONE', 'Done');
  const handleConfirm = isDismissAction ? onClose : handleInstall;

  return (
    <StyledWrapper>
      <Modal
        size="md"
        title={t('POSTMAN_PACKAGES.MODAL_TITLE', 'Install packages')}
        confirmText={confirmText}
        cancelText={t('COMMON.SKIP', 'Skip')}
        hideCancel={installDone || (needsInstall.length === 0 && !installFailed)}
        confirmDisabled={installing}
        confirmButtonColor={isDismissAction ? 'secondary' : 'primary'}
        handleConfirm={handleConfirm}
        handleCancel={onClose}
        dataTestId="postman-package-report-modal"
        disableCloseOnOutsideClick
      >
        {needsInstall.length > 0 && (
          <div className="pkg-section">
            <div className="pkg-section-head">
              <span className="pkg-section-title">{t('POSTMAN_PACKAGES.PACKAGES_USED_IN_SCRIPTS', 'Packages used in scripts')}</span>
              <span className="pkg-section-count">{needsInstall.length}</span>
            </div>
            {!installing && !installDone && (
              <p className="pkg-section-help">
                {t('POSTMAN_PACKAGES.REFERENCED_HELP', "These npm packages are referenced by scripts in your imported collection but aren't installed in this collection's folder.")}
              </p>
            )}
            <PackageList items={needsInstall} />

            {!installing && !installDone && (
              <div className="pkg-cmd-block">
                <div className="pkg-cmd-label">
                  <IconTerminal2 size={12} strokeWidth={1.75} />
                  <span>{t('POSTMAN_PACKAGES.OR_INSTALL_MANUALLY', 'Or install manually')}</span>
                </div>
                <div className="pkg-cmd-row">
                  <code className="pkg-cmd-code">{installCommand}</code>
                  <button
                    type="button"
                    className="pkg-cmd-copy"
                    onClick={handleCopyCommand}
                    aria-label={t('COMMON.COPY_COMMAND', 'Copy command')}
                  >
                    {copied ? <IconCheck size={14} strokeWidth={1.75} /> : <IconCopy size={14} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>
            )}

            {installing && (
              <div className="pkg-inline-status pkg-inline-info">
                <IconLoader2 size={14} strokeWidth={1.75} className="pkg-spin" />
                <span>{t('POSTMAN_PACKAGES.INSTALLING_COUNT', `Installing ${needsInstall.length} package${needsInstall.length === 1 ? '' : 's'}…`, {
                  count: needsInstall.length,
                  plural: needsInstall.length === 1 ? '' : 's'
                })}</span>
              </div>
            )}

            {installDone && (
              <div className="pkg-inline-status pkg-inline-success">
                <IconCircleCheck size={14} strokeWidth={1.75} />
                <span>
                  {t('POSTMAN_PACKAGES.INSTALLED_INTO_COLLECTION', `Installed ${(installResult.installed || needsInstall).length} package${(installResult.installed || needsInstall).length === 1 ? '' : 's'} into this collection.`, {
                    count: (installResult.installed || needsInstall).length,
                    plural: (installResult.installed || needsInstall).length === 1 ? '' : 's'
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        {needsDevModeOnly && !installDone && !installing && (
          <div className="pkg-section pkg-devmode">
            <div className="pkg-devmode-head">
              <IconAlertTriangle size={18} strokeWidth={1.75} />
              <span className="pkg-devmode-title">{t('POSTMAN_PACKAGES.SCRIPTS_USE_DEV_LIBRARIES', 'Scripts use libraries that need Developer Mode')}</span>
            </div>
            <p className="pkg-devmode-desc">
              <Trans
                i18nKey="POSTMAN_PACKAGES.DEV_MODE_REASON"
                defaults="Your imported scripts call {{packages}}, which need <0>Developer Mode</0> to run."
                components={[<strong key="dev" />]}
              >
                Your imported scripts call {renderPackageExamples(devMode, t)}
                {', '}which need <strong>Developer Mode</strong> to run.
              </Trans>
            </p>
            <PackageList items={devMode} />
            <div className="pkg-devmode-trust">
              <IconShieldLock size={15} strokeWidth={1.75} />
              <span>{t('POSTMAN_PACKAGES.ONLY_ENABLE_TRUSTED', 'Only enable Developer Mode for collections you trust.')}</span>
            </div>
            <Button
              color="primary"
              size="sm"
              loading={switchingMode}
              icon={<IconCode size={15} strokeWidth={2} />}
              onClick={handleSwitchToDeveloperMode}
              data-testid="switch-to-developer-mode"
            >
              {t('POSTMAN_PACKAGES.SWITCH_TO_DEV_MODE', 'Switch to Developer Mode')}
            </Button>
          </div>
        )}

        {unsupported.length > 0 && !installDone && !installing && (
          <div className="pkg-section pkg-section-danger">
            <div className="pkg-section-head">
              <IconBan size={14} strokeWidth={1.75} />
              <span className="pkg-section-title">{t('POSTMAN_PACKAGES.NOT_SUPPORTED_IN_BRUNO', 'Not supported in Bruno')}</span>
              <span className="pkg-section-count">{unsupported.length}</span>
            </div>
            <p className="pkg-section-help">
              {t('POSTMAN_PACKAGES.UNSUPPORTED_HELP', 'Postman-specific packages without a Bruno equivalent. Scripts that call these will fail at runtime.')}
            </p>
            <PackageList items={unsupported} />
          </div>
        )}

        {installDone && (
          isDeveloperMode ? (
            <div className="pkg-status pkg-status-success">
              <IconCircleCheck size={14} strokeWidth={1.75} />
              <span>
                <Trans
                  i18nKey="POSTMAN_PACKAGES.DEV_MODE_RUNNING"
                  defaults="This collection runs in <0>Developer Mode</0> - your scripts can use these packages right away."
                  components={[<strong key="dev" />]}
                >
                  This collection runs in <strong>Developer Mode</strong> - your scripts can use these packages right away.
                </Trans>
              </span>
            </div>
          ) : (
            <div className="pkg-section pkg-devmode">
              <div className="pkg-devmode-head">
                <IconAlertTriangle size={18} strokeWidth={1.75} />
                <span className="pkg-devmode-title">{t('POSTMAN_PACKAGES.EXTERNAL_MODULES_DEV_MODE', 'External modules require Developer Mode')}</span>
              </div>
              <p className="pkg-devmode-desc">
                <Trans
                  i18nKey="POSTMAN_PACKAGES.SAFE_MODE_HINT"
                  defaults="Custom npm packages (such as {{packages}}) are installed, but this collection is currently running in <0>Safe Mode</0>."
                  components={[<strong key="safe" />]}
                >
                  Custom npm packages (such as {renderPackageExamples(installResult.installed || needsInstall, t)})
                  {' '}are installed, but this collection is currently running in <strong>Safe Mode</strong>.
                </Trans>
              </p>
              <div className="pkg-devmode-trust">
                <IconShieldLock size={15} strokeWidth={1.75} />
                <span>{t('POSTMAN_PACKAGES.ONLY_ENABLE_TRUSTED', 'Only enable Developer Mode for collections you trust.')}</span>
              </div>
              <Button
                color="primary"
                size="sm"
                loading={switchingMode}
                icon={<IconCode size={15} strokeWidth={2} />}
                onClick={handleSwitchToDeveloperMode}
                data-testid="switch-to-developer-mode"
              >
                {t('POSTMAN_PACKAGES.SWITCH_TO_DEV_MODE', 'Switch to Developer Mode')}
              </Button>
            </div>
          )
        )}

        {installFailed && (
          <div className="pkg-status pkg-status-danger" data-testid="postman-package-install-error">
            <div className="pkg-status-head">
              <IconAlertTriangle size={14} strokeWidth={1.75} />
              <span>{installFailureMessage}</span>
            </div>
            {(installResult.stderr || installResult.stdout) && (
              <pre className="pkg-status-log">
                {(installResult.stderr || installResult.stdout).slice(-1200)}
              </pre>
            )}
          </div>
        )}
      </Modal>
    </StyledWrapper>
  );
};

export default PostmanPackageReport;

import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  browseDirectory,
  cloneGitRepository,
  openMultipleCollections,
  scanForBrunoFiles
} from 'providers/ReduxStore/slices/collections/actions';
import { removeGitOperationProgress } from 'providers/ReduxStore/slices/app';
import Modal from 'components/Modal';
import SelectionFooter from 'components/SelectionFooter';
import path, { getRelativePath } from 'utils/common/path';
import Portal from 'components/Portal';
import { IconRefresh, IconAlertCircle, IconBrandGit } from '@tabler/icons';
import { uuid } from 'utils/common/index';
import StyledWrapper from './StyledWrapper';
import SelectionList from 'components/SelectionList';
import Button from 'ui/Button';
import { getRepoNameFromUrl } from 'utils/git';
import GitNotFoundModal from 'components/Git/GitNotFoundModal/index';
import SkippedPathsWarning from 'components/SkippedPathsWarning';
import toast from 'react-hot-toast';
import get from 'lodash/get';
import { useTranslation } from 'react-i18next';

const CloneGitRepository = ({ onClose, onFinish, collectionRepositoryUrl = null }) => {
  const { t } = useTranslation();
  const [collectionPaths, setCollectionPaths] = useState([]);
  const [skippedCollectionPaths, setSkippedCollectionPaths] = useState([]);
  const [selectedCollectionPaths, setSelectedCollectionPaths] = useState([]);
  const [processUid, setProcessUid] = useState(uuid());
  const [steps, setSteps] = useState([]);
  const [view, setView] = useState('form');

  const progressData = useSelector((state) => state.app.gitOperationProgress[processUid]);
  const { gitVersion } = useSelector((state) => state.app);
  const { workspaces, activeWorkspaceUid } = useSelector((state) => state.workspaces);
  const preferences = useSelector((state) => state.app.preferences);
  const activeWorkspace = workspaces.find((w) => w.uid === activeWorkspaceUid);
  const isDefaultWorkspace = !activeWorkspace || activeWorkspace.type === 'default';
  const defaultLocation = isDefaultWorkspace
    ? get(preferences, 'general.defaultLocation', '')
    : (activeWorkspace?.pathname ? path.join(activeWorkspace.pathname, 'collections') : '');
  const inputRef = useRef();
  const dispatch = useDispatch();

  useEffect(() => {
    if (progressData) {
      setSteps((prev) =>
        prev.map((step) =>
          step.step === 'clone' && !step?.completed
            ? { ...step, title: t('GIT.CLONING_REPOSITORY', 'Cloning repository'), completed: false, info: progressData.progressData }
            : step
        )
      );
    }
  }, [progressData, t]);

  useEffect(() => {
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  }, []);

  const cloneInProgress = () => {
    setSteps((prev) => [
      ...prev,
      {
        step: 'clone',
        title: t('GIT.CLONING_REPOSITORY', 'Cloning repository'),
        completed: false
      }
    ]);
  };

  const cloneFinished = () => {
    toast.success(t('GIT.CLONED_SUCCESSFULLY', 'Repository cloned successfully'));
    setSteps((prev) =>
      prev.map((step) =>
        step.step === 'clone'
          ? { ...step, title: t('GIT.CLONING_SUCCESSFUL', 'Cloning successful'), completed: true, info: '' }
          : step
      )
    );
  };

  const cloneError = () => {
    setSteps((prev) =>
      prev.map((step) =>
        step.step === 'clone'
          ? { ...step, title: t('GIT.CLONING_FAILED', 'Cloning failed'), completed: true, error: true }
          : step
      )
    );
  };

  const scanInProgress = () => {
    setSteps((prev) => [
      ...prev,
      {
        step: 'scan',
        title: t('GIT.SEARCHING_COLLECTIONS', 'Searching for Bruno collections'),
        completed: false
      }
    ]);
  };

  const scanFinished = () => {
    setSteps((prev) =>
      prev.map((step) =>
        step.step === 'scan'
          ? { ...step, title: t('GIT.SEARCHING_COMPLETED', 'Search completed'), completed: true }
          : step
      )
    );
  };

  const scanError = () => {
    setSteps((prev) =>
      prev.map((step) =>
        step.step === 'scan'
          ? { ...step, title: t('GIT.SEARCHING_FAILED', 'Search failed'), completed: true, error: true }
          : step
      )
    );
  };

  const isScanCompleted = () => {
    return steps.some((step) => step.step === 'scan' && step.completed);
  };

  const isConfirmDisabled = () => {
    if (view === 'form') {
      return !formik.isValid || !formik.values.repositoryUrl || !formik.values.collectionLocation;
    }
    if (view === 'progress') {
      if (isScanCompleted() && collectionPaths?.length > 0) {
        return selectedCollectionPaths.length === 0;
      }
      return false;
    }
  };

  const isFooterHidden = () => {
    return steps.some((step) => !step.completed);
  };

  const isError = () => {
    return steps.some((step) => step.error);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      repositoryUrl: collectionRepositoryUrl || '',
      collectionLocation: defaultLocation || ''
    },
    validationSchema: Yup.object({
      repositoryUrl: Yup.string()
        .min(1, t('GIT.URL_REQUIRED', 'URL is required'))
        .required(t('GIT.URL_REQUIRED', 'URL is required')),
      collectionLocation: Yup.string().min(1, t('CREATE_COLLECTION.LOCATION_REQUIRED', 'location is required')).required(t('CREATE_COLLECTION.LOCATION_REQUIRED', 'location is required'))
    }),
    onSubmit: async (values) => {
      setView('progress');
      cloneInProgress();
      try {
        const repoPath = await dispatch(cloneGitRepository(values.repositoryUrl, values.collectionLocation, processUid));
        cloneFinished();
        scanInProgress();
        const { items, skippedItems } = await dispatch(scanForBrunoFiles(repoPath));
        setCollectionPaths(items);
        setSkippedCollectionPaths(skippedItems);
        setSelectedCollectionPaths(items.map((item) => item.pathname));
        scanFinished();
      } catch (err) {
        toast.error(err ? err.message : t('GIT.ERROR_OCCURRED', 'An error occurred while cloning the repository'));
        if (!steps.some((step) => step.step === 'clone' && step.completed)) {
          cloneError();
        } else {
          scanError();
        }
      } finally {
        dispatch(removeGitOperationProgress({ processUid }));
      }
    }
  });

  const browse = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        if (typeof dirPath === 'string') {
          formik.setFieldValue('collectionLocation', dirPath);
        }
      })
      .catch(() => {
        formik.setFieldValue('collectionLocation', '');
      });
  };

  const handleCollectionSelect = (collectionPathname) => {
    setSelectedCollectionPaths((prevSelected) =>
      prevSelected.includes(collectionPathname)
        ? prevSelected.filter((pathname) => pathname !== collectionPathname)
        : [...prevSelected, collectionPathname]
    );
  };

  const handleSelectAllCollections = (e, filteredCollectionPaths) => {
    setSelectedCollectionPaths((prevSelected) =>
      e.target.checked
        ? Array.from(new Set([...prevSelected, ...filteredCollectionPaths]))
        : prevSelected.filter((pathname) => !filteredCollectionPaths.includes(pathname))
    );
  };

  const handleBackButtonClick = () => {
    setView('form');
    setSteps([]);
  };

  const renderFooterLeft = () => {
    if (isError() && !isScanCompleted()) {
      return (
        <Button
          type="button"
          variant="ghost"
          color="secondary"
          onClick={handleBackButtonClick}
          data-testid="clone-git-repository-modal-back-btn"
        >
          {t('COMMON.BACK', 'Back')}
        </Button>
      );
    }
    if (isScanCompleted() && collectionPaths?.length > 0) {
      return (
        <SelectionFooter>
          <span>{selectedCollectionPaths.length}</span> {t('COLLECTION.OF_TOTAL_SELECTED', 'of {{total}} selected', { total: collectionPaths.length })}
        </SelectionFooter>
      );
    }
    return null;
  };

  const handleConfirm = () => {
    const buttonAction = getConfirmAction();
    switch (buttonAction) {
      case 'clone':
        formik.handleSubmit();
        break;
      case 'close':
        onClose();
        break;
      case 'open':
        if (collectionPaths.length > 0 && selectedCollectionPaths.length > 0) {
          dispatch(openMultipleCollections(selectedCollectionPaths));
          onClose();
          onFinish();
        }
        break;
      default:
        break;
    }
  };

  const getConfirmAction = () =>
    !steps.length
      ? 'clone'
      : steps.some((step) => !step.completed || step.error || (isScanCompleted() && !collectionPaths?.length))
        ? 'close'
        : 'open';

  const getConfirmText = () => {
    const action = getConfirmAction();
    switch (action) {
      case 'clone': return t('COMMON.CLONE', 'Clone');
      case 'close': return t('COMMON.CLOSE', 'Close');
      case 'open': return t('COMMON.OPEN', 'Open');
      default: return t('COMMON.CONFIRM', 'Confirm');
    }
  };

  if (!gitVersion) {
    return <GitNotFoundModal onClose={onClose} />;
  }

  return (
    <Portal id="clone-repository-portal">
      <Modal
        size="md"
        title={t('GIT.CLONE_GIT_REPOSITORY', 'Clone Git Repository')}
        confirmText={getConfirmText()}
        cancelText={t('COMMON.CANCEL', 'Cancel')}
        handleConfirm={handleConfirm}
        handleCancel={onClose}
        confirmDisabled={isConfirmDisabled()}
        hideFooter={isFooterHidden()}
        hideCancel={isError() || (isScanCompleted() && !collectionPaths?.length)}
        footerLeft={renderFooterLeft()}
      >
        <StyledWrapper>
          {view === 'form' && (
            <form className="bruno-form" onSubmit={(e) => e.preventDefault()}>
              <div>
                {collectionRepositoryUrl
                  ? (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <IconBrandGit className="w-6 h-6 text-purple-500" stroke={1.5} />
                        </div>
                        <div className="ml-4">
                          <div className="font-semibold text-sm">{getRepoNameFromUrl(collectionRepositoryUrl)}</div>
                          <div className="mt-1 text-xs text-muted font-mono">
                            {collectionRepositoryUrl}
                          </div>
                        </div>
                      </div>
                    )
                  : (
                      <>
                        <label htmlFor="repository-url" className="flex items-center font-semibold">
                          {t('GIT.REPOSITORY_URL', 'Git Repository URL')}
                        </label>
                        <input
                          id="repository-url"
                          type="text"
                          name="repositoryUrl"
                          ref={inputRef}
                          className="block textbox mt-2 w-full"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          onChange={formik.handleChange}
                          value={formik.values.repositoryUrl || ''}
                        />
                      </>
                    )}
                {formik.touched.repositoryUrl && formik.errors.repositoryUrl && (
                  <div className="text-red-500">{formik.errors.repositoryUrl}</div>
                )}
                <label htmlFor="collection-location" className="block font-semibold mt-3">
                  {t('COMMON.LOCATION', 'Location')}
                </label>
                <input
                  id="collection-location"
                  type="text"
                  name="collectionLocation"
                  readOnly
                  className="block textbox mt-2 w-full cursor-pointer"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  value={formik.values.collectionLocation || ''}
                  onClick={browse}
                />
                {formik.touched.collectionLocation && formik.errors.collectionLocation && (
                  <div className="text-red-500">{formik.errors.collectionLocation}</div>
                )}
                <div className="mt-1">
                  <span className="text-link cursor-pointer hover:underline" onClick={browse}>
                    {t('COMMON.BROWSE', 'Browse')}
                  </span>
                </div>
              </div>
            </form>
          )}
          {view === 'progress' && (
            <>
              {steps.some((step) => !step.completed || step.error) && (
                <div className="clone-progress-steps">
                  <ul>
                    {steps.filter((step) => !step.completed || step.error).map((step, index) => (
                      <li key={index} className="flex-col items-center space-x-2 mt-1">
                        <div className="flex">
                          {step.error ? (
                            <IconAlertCircle className="clone-step-error-icon" size={18} strokeWidth={1.5} />
                          ) : (
                            <IconRefresh className="clone-step-progress-icon animate-spin" size={18} strokeWidth={1.5} />
                          )}
                          <span className="ml-2">{step.title}</span>
                        </div>
                        {step.info && (
                          <div className="w-full mt-2">
                            <pre className="info-box ml-4">{step.info}</pre>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {isScanCompleted() && (
                <div className="w-full min-w-0 flex flex-col gap-3">
                  <SkippedPathsWarning paths={skippedCollectionPaths} itemNoun="collections" />
                  {collectionPaths.length === 0 && (
                    <div className="scan-warning flex items-start gap-2">
                      <IconAlertCircle className="scan-warning-icon" size={18} strokeWidth={1.5} />
                      <div>{t('GIT.NO_COLLECTIONS_FOUND_IN_REPO', 'No Bruno collections were found in this repository.')}</div>
                    </div>
                  )}
                  {collectionPaths.length > 0 && (
                    <SelectionList
                      title={t('CREATE_COLLECTION.TITLE', 'Collections')}
                      searchPlaceholder={t('SIDEBAR.SEARCH_COLLECTIONS', 'Search Collections')}
                      items={collectionPaths}
                      selectedItems={selectedCollectionPaths}
                      onSelectAll={handleSelectAllCollections}
                      onItemToggle={handleCollectionSelect}
                      getItemId={(collection) => collection.pathname}
                      renderItemTitle={(collection) => collection.name}
                      renderItemDescription={(collection) => getRelativePath(formik.values.collectionLocation, collection.pathname)}
                      visibleRows={8}
                      rowHeight={60}
                      rowGap={4}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </StyledWrapper>
      </Modal>
    </Portal>
  );
};

export default CloneGitRepository;

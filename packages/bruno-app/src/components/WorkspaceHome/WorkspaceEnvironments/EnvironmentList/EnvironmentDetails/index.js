import { IconCopy, IconEdit, IconTrash, IconCheck, IconX, IconSearch, IconDeviceFloppy } from '@tabler/icons';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resolveEnvironmentInheritance } from '@usebruno/common/utils';
import {
  renameGlobalEnvironment,
  saveGlobalEnvironmentExtends,
  updateGlobalEnvironmentColor
} from 'providers/ReduxStore/slices/global-environments';
import { updateTabState } from 'providers/ReduxStore/slices/tabs';
import { validateName, validateNameError } from 'utils/common/regex';
import toast from 'react-hot-toast';
import CopyEnvironment from '../../CopyEnvironment';
import DeleteEnvironment from '../../DeleteEnvironment';
import EnvironmentVariables from './EnvironmentVariables';
import InheritsFrom from 'components/Environments/Common/InheritsFrom';
import MissingInheritedEnvironmentWarning from 'components/Environments/Common/MissingInheritedEnvironmentWarning';
import ColorPicker from 'components/ColorPicker';
import ActionIcon from 'ui/ActionIcon';
import ResponsiveTabs from 'ui/ResponsiveTabs';
import useEnvironmentTabs from 'hooks/useEnvironmentTabs';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const EnvironmentDetails = ({ environment, setIsModified, collection, searchQuery, setSearchQuery, isSearchExpanded, setIsSearchExpanded, debouncedSearchQuery, searchInputRef }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const globalEnvs = useSelector((state) => state?.globalEnvironments?.globalEnvironments);
  const globalEnvironmentDraft = useSelector((state) => state.globalEnvironments.globalEnvironmentDraft);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openCopyModal, setOpenCopyModal] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const activeTab = useSelector((state) => state.tabs.tabs.find((t) => t.uid === activeTabUid)?.tabState?.environment?.tab) || 'variables';
  const setActiveTab = (tab) => dispatch(updateTabState({ uid: activeTabUid, tabState: { environment: { tab } } }));

  const inheritedEnvironmentVariables = useMemo(() => {
    const draft = globalEnvironmentDraft?.environmentUid === environment.uid ? globalEnvironmentDraft : null;
    const liveEnvironment = { ...environment, variables: draft?.variables || environment.variables || [] };
    const { inheritedVariables } = resolveEnvironmentInheritance({
      environments: globalEnvs || [],
      targetEnvironment: liveEnvironment
    });
    return inheritedVariables;
  }, [environment, globalEnvironmentDraft, globalEnvs]);

  const tabs = useEnvironmentTabs({ environment, draft: globalEnvironmentDraft, inheritedEnvironmentVariables });

  const inheritedEnvironmentVariablesForActiveTab = useMemo(
    () => inheritedEnvironmentVariables.filter((variable) => !!variable.secret === (activeTab === 'secrets')),
    [inheritedEnvironmentVariables, activeTab]
  );

  // Use the immediate query on a tab switch (debounced value lags and briefly
  // flashes the unfiltered table).
  const prevTabRef = useRef(activeTab);
  const tabJustChanged = prevTabRef.current !== activeTab;
  useEffect(() => {
    prevTabRef.current = activeTab;
  }, [activeTab]);
  const tableSearchQuery = tabJustChanged ? searchQuery : debouncedSearchQuery;

  const inputRef = useRef(null);
  const rightContentRef = useRef(null);

  const validateEnvironmentName = (name) => {
    if (!name || name.trim() === '') {
      return t('ENVIRONMENTS.NAME_REQUIRED', 'Name is required');
    }

    if (name.length < 1) {
      return 'Must be at least 1 character';
    }

    if (name.length > 255) {
      return 'Must be 255 characters or less';
    }

    if (!validateName(name)) {
      return validateNameError(name);
    }

    const trimmedName = name.toLowerCase().trim();
    const isDuplicate = (globalEnvs || []).some((env) =>
      env?.uid !== environment.uid && env?.name?.toLowerCase().trim() === trimmedName);
    if (isDuplicate) {
      return t('ENVIRONMENTS.GLOBAL_ENV_EXISTS', 'Environment already exists');
    }

    return null;
  };

  const handleRenameClick = () => {
    setIsRenaming(true);
    setNewName(environment.name);
    setNameError('');
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleSaveRename = () => {
    const error = validateEnvironmentName(newName);
    if (error) {
      setNameError(error);
      return;
    }

    dispatch(renameGlobalEnvironment({ name: newName, environmentUid: environment.uid }))
      .then(() => {
        toast.success(t('ENVIRONMENTS.ENV_RENAMED_SUCCESS', 'Environment renamed!'));
        setIsRenaming(false);
        setNewName('');
        setNameError('');
      })
      .catch(() => {
        toast.error(t('ENVIRONMENTS.ENV_RENAME_ERROR', 'An error occurred while renaming the environment'));
      });
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setNewName('');
    setNameError('');
  };

  const handleEnvNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const handleColorChange = (color) => {
    dispatch(updateGlobalEnvironmentColor(environment.uid, color))
      .then(() => {
        toast.success(t('ENVIRONMENTS.ENV_COLOR_UPDATED_SUCCESS', 'Environment color updated!'));
      })
      .catch(() => {
        toast.error(t('ENVIRONMENTS.ENV_COLOR_UPDATED_ERROR', 'An error occurred while updating the environment color'));
      });
  };

  const handleExtendsChange = (inheritedEnvironmentName) => {
    dispatch(
      saveGlobalEnvironmentExtends({ environmentUid: environment.uid, extends: inheritedEnvironmentName })
    )
      .then(() => {
        toast.success(
          inheritedEnvironmentName
            ? t('ENVIRONMENTS.INHERITING_FROM', 'Inheriting variables from {{name}}', { name: inheritedEnvironmentName })
            : t('ENVIRONMENTS.STOPPED_INHERITING', 'Stopped inheriting variables')
        );
      })
      .catch((err) => {
        console.error(err);
        toast.error(t('ENVIRONMENTS.SAVE_INHERIT_ERROR', 'An error occurred while saving the inherited environment'));
      });
  };

  const handleSaveAll = () => {
    window.dispatchEvent(new Event('environment-save-all'));
  };

  const handleSearchIconClick = () => {
    setIsSearchExpanded(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchExpanded(false);
    }
  };

  return (
    <StyledWrapper>
      {openDeleteModal && (
        <DeleteEnvironment
          environment={environment}
          onClose={() => setOpenDeleteModal(false)}
        />
      )}

      {openCopyModal && (
        <CopyEnvironment
          environment={environment}
          onClose={() => setOpenCopyModal(false)}
        />
      )}

      <div className="header">
        <div className="title-section">
          {isRenaming ? (
            <>
              <input
                ref={inputRef}
                type="text"
                className="title-input"
                data-testid="env-rename-input"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setNameError('');
                }}
                onKeyDown={handleEnvNameKeyDown}
                onBlur={handleSaveRename}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <div className="inline-rename-actions">
                <button
                  className="inline-action-btn save"
                  onClick={handleSaveRename}
                  onMouseDown={(e) => e.preventDefault()}
                  title={t('COMMON.SAVE', 'Save')}
                >
                  <IconCheck size={14} strokeWidth={2} />
                </button>
                <button
                  className="inline-action-btn cancel"
                  onClick={handleCancelRename}
                  onMouseDown={(e) => e.preventDefault()}
                  title={t('COMMON.CANCEL', 'Cancel')}
                >
                  <IconX size={14} strokeWidth={2} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="title" data-testid="env-details-title">{environment.name}</h2>
              <ColorPicker color={environment.color} onChange={handleColorChange} />
            </div>
          )}
        </div>
        {nameError && isRenaming && <div className="title-error">{nameError}</div>}
        <div className="actions">
          <InheritsFrom
            environment={environment}
            environments={globalEnvs || []}
            inheritedEnvironmentName={environment.extends}
            onChange={handleExtendsChange}
          />
          <ActionIcon label={t('COMMON.SAVE_ALL', 'Save All')} onClick={handleSaveAll} data-testid="save-all-env">
            <IconDeviceFloppy size={15} strokeWidth={1.5} />
          </ActionIcon>
          <ActionIcon label={t('COMMON.RENAME', 'Rename')} onClick={handleRenameClick} data-testid="env-rename-action">
            <IconEdit size={15} strokeWidth={1.5} />
          </ActionIcon>
          <ActionIcon label={t('COMMON.COPY', 'Copy')} onClick={() => setOpenCopyModal(true)} data-testid="env-copy-action">
            <IconCopy size={15} strokeWidth={1.5} />
          </ActionIcon>
          <ActionIcon label={t('COMMON.DELETE', 'Delete')} onClick={() => setOpenDeleteModal(true)} colorOnHover="danger" data-testid="env-delete-action">
            <IconTrash size={15} strokeWidth={1.5} />
          </ActionIcon>
        </div>
      </div>

      <MissingInheritedEnvironmentWarning environment={environment} environments={globalEnvs || []} />

      <div className="tabs-container">
        <ResponsiveTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabSelect={setActiveTab}
          rightContent={(
            <div ref={rightContentRef} className="env-search-container">
              {isSearchExpanded ? (
                <div className="search-input-wrapper">
                  <IconSearch size={14} strokeWidth={1.5} className="search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={activeTab === 'secrets' ? t('ENVIRONMENTS.SEARCH_SECRETS', 'Search secrets...') : t('ENVIRONMENTS.SEARCH_VARIABLES', 'Search variables...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={handleSearchBlur}
                    className="search-input"
                    data-testid="env-search-input"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  {searchQuery && (
                    <button
                      className="clear-search"
                      onClick={handleClearSearch}
                      onMouseDown={(e) => e.preventDefault()}
                      title={t('COMMON.CLEAR_SEARCH', 'Clear search')}
                      data-testid="env-clear-search"
                    >
                      <IconX size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              ) : (
                <ActionIcon label={t('COMMON.SEARCH', 'Search')} onClick={handleSearchIconClick} data-testid="env-search-action">
                  <IconSearch size={15} strokeWidth={1.5} />
                </ActionIcon>
              )}
            </div>
          )}
          rightContentRef={rightContentRef}
        />
      </div>

      <div className="content">
        <EnvironmentVariables
          environment={environment}
          setIsModified={setIsModified}
          collection={collection}
          inheritedEnvironmentVariables={inheritedEnvironmentVariablesForActiveTab}
          searchQuery={tableSearchQuery}
          variableType={activeTab}
        />
      </div>
    </StyledWrapper>
  );
};

export default EnvironmentDetails;

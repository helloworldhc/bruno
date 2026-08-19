import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Modal from 'components/Modal';
import SearchInput from 'components/SearchInput';
import Button from 'ui/Button';
import { IconFolder, IconChevronRight, IconCheck, IconX, IconEye, IconEyeOff, IconEdit, IconArrowBackUp } from '@tabler/icons';
import PathDisplay from 'components/PathDisplay/index';
import Help from 'components/Help';
import filter from 'lodash/filter';
import toast from 'react-hot-toast';
import StyledWrapper from './StyledWrapper';
import CollectionListItem from './CollectionListItem';
import FolderBreadcrumbs from './FolderBreadcrumbs';
import useCollectionFolderTree from 'hooks/useCollectionFolderTree';
import { removeSaveTransientRequestModal } from 'providers/ReduxStore/slices/collections';
import { addTab } from 'providers/ReduxStore/slices/tabs';
import { insertTaskIntoQueue } from 'providers/ReduxStore/slices/app';
import { newFolder, closeTabs, mountCollection, createCollection, browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import { sanitizeName, validateName, validateNameError } from 'utils/common/regex';
import { resolveRequestFilename } from 'utils/common/platform';
import path, { normalizePath } from 'utils/common/path';
import { transformRequestToSaveToFilesystem, findCollectionByUid, findItemInCollection, getDefaultRequestPaneTab } from 'utils/collections';
import { DEFAULT_COLLECTION_FORMAT } from 'utils/common/constants';
import { itemSchema } from '@usebruno/schema';
import { uuid } from 'utils/common';
import { formatIpcError } from 'utils/common/error';
import get from 'lodash/get';
import { useTranslation } from 'react-i18next';

const SaveTransientRequest = ({ item: itemProp, collection: collectionProp, isOpen = false, onClose, closeAfterSave = false }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const latestCollection = useSelector((state) =>
    collectionProp ? findCollectionByUid(state.collections.collections, collectionProp.uid) : null
  );
  const latestItem = latestCollection && itemProp ? findItemInCollection(latestCollection, itemProp.uid) : itemProp;

  const item = itemProp;
  const collection = collectionProp;

  const { workspaces, activeWorkspaceUid } = useSelector((state) => state.workspaces);
  const activeWorkspace = workspaces.find((w) => w.uid === activeWorkspaceUid);
  const allCollections = useSelector((state) => state.collections.collections);
  const isScratchCollection = activeWorkspace?.scratchCollectionUid === collection?.uid;
  const preferences = useSelector((state) => state.app.preferences);
  const isDefaultWorkspace = activeWorkspace?.type === 'default';
  const defaultCollectionLocation = isDefaultWorkspace
    ? get(preferences, 'general.defaultLocation', '')
    : (activeWorkspace?.pathname ? path.join(activeWorkspace.pathname, 'collections') : '');

  const availableCollections = useMemo(() => {
    if (!isScratchCollection || !activeWorkspace) return [];

    return (activeWorkspace.collections || []).map((wc) => {
      const fullCollection = allCollections.find((c) => normalizePath(c.pathname) === normalizePath(wc.path));
      // Use stable deterministic UID based on path to avoid duplicate Redux entries
      const stableUid = wc.path ? `pending-${wc.path.replace(/[^a-zA-Z0-9]/g, '-')}` : uuid();
      return fullCollection || { ...wc, uid: stableUid, mountStatus: 'unmounted' };
    }).filter((c) => !workspaces.some((w) => w.scratchCollectionUid === c.uid));
  }, [isScratchCollection, activeWorkspace, allCollections, workspaces]);

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    dispatch(removeSaveTransientRequestModal({ itemUid: item.uid }));
  };
  const [requestName, setRequestName] = useState(item?.name || '');
  const [searchText, setSearchText] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDirectoryName, setNewFolderDirectoryName] = useState('');
  const [showFilesystemName, setShowFilesystemName] = useState(false);
  const [isEditingFolderFilename, setIsEditingFolderFilename] = useState(false);
  const [pendingFolderNavigation, setPendingFolderNavigation] = useState(null);

  // State for new collection creation
  const [newCollection, setNewCollection] = useState({ show: false, name: '', location: '', format: DEFAULT_COLLECTION_FORMAT });

  const [selectedTargetCollectionPath, setSelectedTargetCollectionPath] = useState(null);
  const [isSelectingCollection, setIsSelectingCollection] = useState(isScratchCollection);
  const folderTreeCollectionUid = selectedTargetCollectionPath
    ? availableCollections.find((c) => (c.path || c.pathname) === selectedTargetCollectionPath)?.uid
    : collection?.uid;

  const {
    currentFolders,
    breadcrumbs,
    selectedFolderUid,
    isAtRoot,
    navigateIntoFolder,
    navigateToBreadcrumb,
    navigateToRoot,
    reset
  } = useCollectionFolderTree(folderTreeCollectionUid);

  const resetForm = useCallback(() => {
    setRequestName(item?.name || '');
    setSearchText('');
    reset();
    setShowNewFolderInput(false);
    setNewFolderName('');
    setNewFolderDirectoryName('');
    setShowFilesystemName(false);
    setIsEditingFolderFilename(false);
    setPendingFolderNavigation(null);
    setSelectedTargetCollectionPath(null);
    setIsSelectingCollection(isScratchCollection);
    // Reset new collection state
    setNewCollection({ show: false, name: '', location: '', format: DEFAULT_COLLECTION_FORMAT });
  }, [item?.name, isScratchCollection, reset]);

  useEffect(() => {
    if (isOpen && item) {
      resetForm();
    }
  }, [isOpen, item, resetForm]);

  useEffect(() => {
    if (pendingFolderNavigation && currentFolders.length > 0) {
      const createdFolder = currentFolders.find((f) => f.name === pendingFolderNavigation);
      if (createdFolder) {
        navigateIntoFolder(createdFolder.uid);
        setPendingFolderNavigation(null);
      }
    }
  }, [currentFolders, pendingFolderNavigation, navigateIntoFolder]);

  const filteredFolders = useMemo(() => {
    if (!searchText.trim()) {
      return currentFolders;
    }
    return filter(currentFolders, (f) => f.name.toLowerCase().includes(searchText.toLowerCase()));
  }, [currentFolders, searchText]);

  const handleCancel = () => {
    handleClose();
  };

  const handleConfirm = () => {
    const trimmedName = requestName.trim();
    if (!trimmedName) {
      toast.error(t('NEW_REQUEST.NAME_REQUIRED', 'Request name is required'));
      return;
    }

    if (!validateName(trimmedName)) {
      toast.error(validateNameError(trimmedName));
      return;
    }

    // Determine target collection
    let targetCollection = collection;
    if (isScratchCollection) {
      if (!selectedTargetCollectionPath) {
        toast.error(t('SAVE_TRANSIENT_REQUEST.SELECT_COLLECTION_ERROR', 'Please select a collection to save to'));
        return;
      }
      targetCollection = allCollections.find(
        (c) => normalizePath(c.pathname) === normalizePath(selectedTargetCollectionPath)
      );
      if (!targetCollection) {
        toast.error(t('SAVE_TRANSIENT_REQUEST.COLLECTION_NOT_FOUND', 'Target collection not found'));
        return;
      }
    }

    const currentFilename = sanitizeName(trimmedName);
    const existingFilenames = currentFolders
      .map((i) => i.filename)
      .filter((filename) => Boolean(filename));

    let resolvedFilename;
    try {
      resolvedFilename = resolveRequestFilename(
        currentFilename,
        existingFilenames,
        targetCollection?.format || DEFAULT_COLLECTION_FORMAT
      );
    } catch (err) {
      toast.error(err.message);
      return;
    }

    const baseRequestItem = latestItem || item;
    const requestData = {
      ...baseRequestItem,
      name: trimmedName,
      filename: resolvedFilename
    };

    if (isScratchCollection) {
      const sourceItemUid = item.uid;
      const targetCollectionUid = targetCollection.uid;
      const targetFolderUid = selectedFolderUid;

      const itemToSave = transformRequestToSaveToFilesystem(requestData);

      itemSchema
        .validate(itemToSave)
        .then(() => {
          window.ipcRenderer
            .invoke('renderer:save-request-to-collection', {
              item: itemToSave,
              targetCollectionUid,
              targetFolderUid
            })
            .then((result) => {
              if (result && result.error) {
                toast.error(formatIpcError(result.error));
                return;
              }
              const savedItemUid = result?.itemUid;
              if (savedItemUid) {
                dispatch(
                  insertTaskIntoQueue({
                    uid: uuid(),
                    type: 'SAVE_TRANSIENT_REQUEST',
                    itemUid: savedItemUid,
                    collectionUid: targetCollectionUid
                  })
                );
                dispatch(closeTabs({ tabUids: [sourceItemUid] }));
                dispatch(
                  addTab({
                    uid: savedItemUid,
                    collectionUid: targetCollectionUid,
                    requestPaneTab: getDefaultRequestPaneTab(itemToSave)
                  })
                );
              }
              handleClose();
            })
            .catch((err) => {
              toast.error(formatIpcError(err));
            });
        })
        .catch((err) => {
          console.error(err);
          toast.error(err.message);
        });
    } else {
      dispatch(
        insertTaskIntoQueue({
          uid: uuid(),
          type: 'SAVE_TRANSIENT_REQUEST',
          itemUid: item.uid,
          collectionUid: collection.uid,
          targetFolderUid: selectedFolderUid,
          data: requestData
        })
      );
      if (closeAfterSave) {
        dispatch(closeTabs({ tabUids: [item.uid] }));
      }
      handleClose();
    }
  };

  const handleShowNewFolder = () => {
    setShowNewFolderInput(true);
    setNewFolderName('');
    setNewFolderDirectoryName('');
    setShowFilesystemName(false);
    setIsEditingFolderFilename(false);
  };

  const handleCancelNewFolder = () => {
    setShowNewFolderInput(false);
    setNewFolderName('');
    setNewFolderDirectoryName('');
    setShowFilesystemName(false);
    setIsEditingFolderFilename(false);
  };

  const handleNewFolderNameChange = (value) => {
    setNewFolderName(value);
    if (!isEditingFolderFilename) {
      setNewFolderDirectoryName(sanitizeName(value));
    }
  };

  const handleCreateNewFolder = () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) {
      toast.error(t('NEW_FOLDER.NAME_REQUIRED', 'Folder name is required'));
      return;
    }

    if (!validateName(trimmedName)) {
      toast.error(validateNameError(trimmedName));
      return;
    }

    const effectiveCollectionUid = folderTreeCollectionUid || collection.uid;

    if (showFilesystemName) {
      const trimmedDirName = newFolderDirectoryName.trim();
      if (!trimmedDirName) {
        toast.error(t('NEW_FOLDER.DIRECTORY_NAME_REQUIRED', 'Directory name is required'));
        return;
      }
      if (!validateName(trimmedDirName)) {
        toast.error(validateNameError(trimmedDirName));
        return;
      }
      dispatch(newFolder(trimmedName, trimmedDirName, effectiveCollectionUid, selectedFolderUid));
    } else {
      dispatch(newFolder(trimmedName, sanitizeName(trimmedName), effectiveCollectionUid, selectedFolderUid));
    }

    setPendingFolderNavigation(trimmedName);
    handleCancelNewFolder();
  };

  const handleSelectCollection = (coll) => {
    const collPath = coll.path || coll.pathname;
    setSelectedTargetCollectionPath(collPath);
    if (coll.mountStatus !== 'mounted') {
      dispatch(mountCollection(coll.uid));
    } else {
      setIsSelectingCollection(false);
    }
  };

  const handleShowNewCollection = () => {
    setNewCollection({
      show: true,
      name: '',
      location: defaultCollectionLocation,
      format: DEFAULT_COLLECTION_FORMAT
    });
  };

  const handleCancelNewCollection = () => {
    setNewCollection({ show: false, name: '', location: '', format: DEFAULT_COLLECTION_FORMAT });
  };

  const handleBrowseCollectionLocation = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        if (typeof dirPath === 'string' && dirPath.length > 0) {
          setNewCollection((prev) => ({ ...prev, location: dirPath }));
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleCreateNewCollection = async () => {
    const trimmedName = newCollection.name.trim();
    if (!trimmedName) {
      toast.error(t('CREATE_COLLECTION.NAME_REQUIRED', 'Collection name is required'));
      return;
    }
    if (!validateName(trimmedName)) {
      toast.error(validateNameError(trimmedName));
      return;
    }
    if (!newCollection.location) {
      toast.error(t('CREATE_COLLECTION.LOCATION_REQUIRED', 'Location is required'));
      return;
    }
    try {
      await dispatch(createCollection(trimmedName, sanitizeName(trimmedName), newCollection.location, { format: newCollection.format, source: 'save-transient-request', entryPoint: 'save-transient-request' }));
      toast.success(t('CREATE_COLLECTION.COLLECTION_CREATED', 'Collection created!'));
      handleCancelNewCollection();
    } catch (err) {
      toast.error(err?.message || 'An error occurred while creating the collection');
    }
  };

  const handleFolderClick = (folderUid) => {
    navigateIntoFolder(folderUid);
    setSearchText('');
  };

  const handleBreadcrumbNavigate = useCallback((index) => {
    navigateToBreadcrumb(index);
    setSearchText('');
  }, [navigateToBreadcrumb]);

  if (!isOpen) {
    return null;
  }

  const showNewFolderFooterButton = !showNewFolderInput && !isSelectingCollection && (filteredFolders.length > 0 && !searchText.trim());

  return (
    <StyledWrapper>
      <Modal
        size="sm"
        title={isSelectingCollection ? t('SAVE_TRANSIENT_REQUEST.SELECT_COLLECTION', 'Select Collection') : t('SAVE_TRANSIENT_REQUEST.SAVE_REQUEST', 'Save Request')}
        handleCancel={handleCancel}
        handleConfirm={handleConfirm}
        confirmText={t('COMMON.SAVE', 'Save')}
        cancelText={t('COMMON.CANCEL', 'Cancel')}
        hideFooter={true}
        dataTestId="save-transient-request-modal"
      >
        <div className="save-request-form">
          <div className="form-section">
            <label htmlFor="request-name" className="form-label">
              {t('NEW_REQUEST.NAME_LABEL', 'Request Name')}
            </label>
            <input
              id="request-name"
              data-testid="save-transient-request-name"
              type="text"
              className="form-input textbox"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              autoFocus={!isSelectingCollection}
              onFocus={(e) => e.target.select()}
            />
          </div>

          <div className="collections-section">
            <div className="collections-label">
              {isSelectingCollection ? t('SAVE_TRANSIENT_REQUEST.SELECT_COLLECTION_TO_SAVE', 'Select a collection to save to') : t('SAVE_TRANSIENT_REQUEST.SAVE_TO_COLLECTIONS', 'Save to Collections')}
            </div>

            {isScratchCollection && (
              <div className="collection-name">
                <span
                  className={isSelectingCollection ? '' : 'collection-name-breadcrumb'}
                  onClick={!isSelectingCollection ? () => {
                    setIsSelectingCollection(true);
                    setSelectedTargetCollectionPath(null);
                    reset();
                  } : undefined}
                >
                  {t('SIDEBAR.COLLECTIONS', 'Collections')}
                </span>
                {!isSelectingCollection && (
                  <>
                    <IconChevronRight size={16} strokeWidth={1.5} className="collection-name-chevron" />
                    <FolderBreadcrumbs
                      collectionName={(availableCollections.find((c) => (c.path || c.pathname) === selectedTargetCollectionPath) || collection).name}
                      breadcrumbs={breadcrumbs}
                      isAtRoot={isAtRoot}
                      onNavigateToRoot={navigateToRoot}
                      onNavigateToBreadcrumb={handleBreadcrumbNavigate}
                    />
                  </>
                )}
              </div>
            )}

            {isSelectingCollection ? (
              <div className="collection-list">
                {availableCollections.length > 0 || newCollection.show ? (
                  <ul className="collection-list-items">
                    {availableCollections.map((coll) => {
                      const collPath = coll.path || coll.pathname;
                      return (
                        <CollectionListItem
                          key={collPath}
                          collectionUid={coll.uid}
                          collectionPath={collPath}
                          collectionName={coll.name}
                          isSelected={selectedTargetCollectionPath === collPath}
                          onSelect={() => handleSelectCollection(coll)}
                        />
                      );
                    })}
                    {newCollection.show && (
                      <li className="new-collection-item">
                        <div className="new-collection-field">
                          <label className="new-collection-label">
                            {t('COMMON.COLLECTION_NAME', 'Collection Name')}
                          </label>
                          <input
                            ref={(node) => node?.focus()}
                            type="text"
                            className="new-collection-input"
                            placeholder={t('CREATE_COLLECTION.NAME_PLACEHOLDER', 'Enter collection name')}
                            value={newCollection.name}
                            onChange={(e) => setNewCollection((prev) => ({ ...prev, name: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCreateNewCollection();
                              } else if (e.key === 'Escape') {
                                e.stopPropagation();
                                handleCancelNewCollection();
                              }
                            }}
                          />
                        </div>

                        <div className="new-collection-field">
                          <label className="new-collection-label flex items-center">
                            {t('COMMON.LOCATION', 'Location')}
                            <Help width={250} placement="top">
                              <p>
                                {t('CREATE_COLLECTION.LOCATION_HELP_1', 'Bruno stores your collections on your computer\'s filesystem.')}
                              </p>
                              <p className="mt-2">
                                {t('IMPORT_COLLECTION.LOCATION_HELP_2', 'Choose the location where you want to store this collection.')}
                              </p>
                            </Help>
                          </label>
                          <div className="new-collection-location-row">
                            <input
                              type="text"
                              className="new-collection-input cursor-pointer"
                              placeholder={t('CREATE_COLLECTION.LOCATION_PLACEHOLDER', 'Select location')}
                              value={newCollection.location}
                              readOnly
                              onClick={handleBrowseCollectionLocation}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              color="secondary"
                              size="sm"
                              rounded="sm"
                              onClick={handleBrowseCollectionLocation}
                            >
                              {t('COMMON.BROWSE', 'Browse')}
                            </Button>
                          </div>
                        </div>

                        <div className="new-collection-field">
                          <label className="new-collection-label flex items-center">
                            {t('COLLECTION_SETTINGS.FILE_FORMAT', 'File Format')}
                            <Help width={300} placement="top">
                              <p>
                                {t('COLLECTION_SETTINGS.FILE_FORMAT_DESC', 'Choose the file format for storing requests in this collection.')}
                              </p>
                              <p className="mt-2">
                                <strong>{t('CREATE_COLLECTION.FORMAT_OPENCOLLECTION_HELP', 'OpenCollection (YAML): Industry-standard YAML format (.yml files)')}</strong>
                              </p>
                              <p className="mt-1">
                                <strong>{t('CREATE_COLLECTION.FORMAT_BRU_HELP', 'BRU: Bruno\'s native file format (.bru files)')}</strong>
                              </p>
                            </Help>
                          </label>
                          <select
                            className="new-collection-select"
                            value={newCollection.format}
                            onChange={(e) => setNewCollection((prev) => ({ ...prev, format: e.target.value }))}
                          >
                            <option value="yml">{t('CREATE_COLLECTION.FORMAT_YAML', 'OpenCollection (YAML)')}</option>
                            <option value="bru">{t('CREATE_COLLECTION.FORMAT_BRU', 'BRU Format (.bru)')}</option>
                          </select>
                        </div>

                        <div className="new-collection-actions-footer">
                          <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelNewCollection}
                          >
                            {t('COMMON.CANCEL', 'Cancel')}
                          </Button>
                          <Button
                            type="button"
                            color="primary"
                            size="sm"
                            onClick={handleCreateNewCollection}
                          >
                            {t('COMMON.CREATE', 'Create')}
                          </Button>
                        </div>
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="collection-empty-state">
                    <p>{t('SAVE_TRANSIENT_REQUEST.NO_COLLECTIONS_YET', 'No Collections Yet')}</p>
                    <p className="collection-empty-state-subtitle">{t('SAVE_TRANSIENT_REQUEST.NO_COLLECTIONS_SUBTITLE', 'Collections help you organize your requests. Create your first one to save this request.')}</p>
                    <Button
                      type="button"
                      color="primary"
                      variant="outline"
                      icon={<IconFolder size={16} strokeWidth={1.5} />}
                      onClick={handleShowNewCollection}
                      className="mt-4"
                    >
                      {t('CREATE_COLLECTION.TITLE', 'New Collection')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {!isScratchCollection && (
                  <div className="collection-name">
                    <FolderBreadcrumbs
                      collectionName={collection.name}
                      breadcrumbs={breadcrumbs}
                      isAtRoot={isAtRoot}
                      onNavigateToRoot={navigateToRoot}
                      onNavigateToBreadcrumb={handleBreadcrumbNavigate}
                    />
                  </div>
                )}

                <div className="search-container">
                  <SearchInput
                    searchText={searchText}
                    setSearchText={setSearchText}
                    placeholder={t('SAVE_TRANSIENT_REQUEST.SEARCH_FOR_FOLDER', 'Search for folder')}
                    autoFocus={false}
                  />
                </div>

                <div className="folder-list">
                  {filteredFolders.length > 0 || showNewFolderInput ? (
                    <ul className="folder-list-items">
                      {filteredFolders.map((folder) => (
                        <li
                          key={folder.uid}
                          className={`folder-item ${selectedFolderUid === folder.uid ? 'selected' : ''}`}
                          onClick={() => handleFolderClick(folder.uid)}
                        >
                          <div className="folder-item-content">
                            <IconFolder size={16} strokeWidth={1.5} />
                            <span className="folder-item-name">{folder.name}</span>
                          </div>
                          <IconChevronRight size={16} strokeWidth={1.5} />
                        </li>
                      ))}
                      {showNewFolderInput && (
                        <li className="new-folder-item">
                          <div className="new-folder-header">
                            <IconFolder size={16} strokeWidth={1.5} />
                            <label className="new-folder-header-label">
                              {showFilesystemName ? t('NEW_FOLDER.NAME_IN_BRUNO', 'New Folder name (in bruno)') : t('NEW_FOLDER.NAME_LABEL', 'New Folder Name')}
                            </label>
                          </div>
                          <div className="new-folder-input-row">
                            <input
                              ref={(node) => node?.focus()}
                              type="text"
                              className="new-folder-input"
                              placeholder={t('NEW_FOLDER.UNTITLED_PLACEHOLDER', 'Untitled new folder')}
                              value={newFolderName}
                              onChange={(e) => handleNewFolderNameChange(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleCreateNewFolder();
                                } else if (e.key === 'Escape') {
                                  e.stopPropagation();
                                  handleCancelNewFolder();
                                }
                              }}
                            />
                            <div className="new-folder-actions">
                              <button
                                type="button"
                                className="new-folder-action-btn"
                                onClick={handleCancelNewFolder}
                                title={t('COMMON.CANCEL', 'Cancel')}
                              >
                                <IconX size={16} strokeWidth={1.5} />
                              </button>
                              <button
                                type="button"
                                className="new-folder-action-btn"
                                onClick={handleCreateNewFolder}
                                title={t('NEW_FOLDER.CREATE_FOLDER', 'Create Folder')}
                              >
                                <IconCheck size={16} strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>

                          {showFilesystemName && (
                            <div className="new-folder-filesystem-wrapper">
                              <div className="flex items-center justify-between">
                                <label className="new-folder-filesystem-label flex items-center font-medium">
                                  {t('NEW_FOLDER.FOLDER_NAME_ON_FILESYSTEM', 'Folder Name (on filesystem)')}
                                  <Help width={300} placement="top">
                                    <p>
                                      {t('NEW_FOLDER.FOLDER_NAME_HELP', 'You can choose to save the folder as a different name on your file system versus what is displayed in the app.')}
                                    </p>
                                  </Help>
                                </label>
                                {isEditingFolderFilename ? (
                                  <IconArrowBackUp
                                    className="cursor-pointer opacity-50 hover:opacity-80"
                                    size={16}
                                    strokeWidth={1.5}
                                    onClick={() => setIsEditingFolderFilename(false)}
                                  />
                                ) : (
                                  <IconEdit
                                    className="cursor-pointer opacity-50 hover:opacity-80"
                                    size={16}
                                    strokeWidth={1.5}
                                    onClick={() => setIsEditingFolderFilename(true)}
                                  />
                                )}
                              </div>
                              {isEditingFolderFilename ? (
                                <div className="relative flex flex-row gap-1 items-center justify-between">
                                  <input
                                    type="text"
                                    className="block textbox mt-2 w-full"
                                    placeholder={t('NEW_FOLDER.NAME_LABEL', 'Folder Name')}
                                    value={newFolderDirectoryName}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck="false"
                                    onChange={(e) => setNewFolderDirectoryName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleCreateNewFolder();
                                      } else if (e.key === 'Escape') {
                                        e.stopPropagation();
                                        handleCancelNewFolder();
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="relative flex flex-row gap-1 items-center justify-between">
                                  <PathDisplay
                                    iconType="folder"
                                    baseName={newFolderDirectoryName}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            className="new-folder-toggle-filesystem-btn"
                            onClick={() => {
                              setShowFilesystemName(!showFilesystemName);
                              setNewFolderDirectoryName(sanitizeName(newFolderName));
                              setIsEditingFolderFilename(false);
                            }}
                          >
                            {showFilesystemName ? (
                              <>
                                <IconEyeOff size={16} strokeWidth={1.5} />
                                <span>{t('NEW_REQUEST.HIDE_FILESYSTEM_NAME', 'Hide filesystem name')}</span>
                              </>
                            ) : (
                              <>
                                <IconEye size={16} strokeWidth={1.5} />
                                <span>{t('NEW_REQUEST.SHOW_FILESYSTEM_NAME', 'Show filesystem name')}</span>
                              </>
                            )}
                          </button>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <div className="folder-empty-state">
                      <div className="flex flex-col items-center">
                        <span>
                          {searchText.trim() ? t('SAVE_TRANSIENT_REQUEST.NO_FOLDERS_FOUND', 'No folders found') : t('SAVE_TRANSIENT_REQUEST.NO_FOLDERS_AVAILABLE', 'No folders available') }
                        </span>
                        <Button
                          type="button"
                          color="primary"
                          variant="ghost"
                          icon={<IconFolder size={16} strokeWidth={1.5} />}
                          onClick={handleShowNewFolder}
                        >
                          {t('NEW_FOLDER.TITLE', 'New Folder')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="custom-modal-footer">
          <div className="footer-left">
            {showNewFolderFooterButton && (
              <Button
                type="button"
                color="primary"
                variant="ghost"
                icon={<IconFolder size={16} strokeWidth={1.5} />}
                onClick={handleShowNewFolder}
              >
                {t('NEW_FOLDER.TITLE', 'New Folder')}
              </Button>
            )}
            {isSelectingCollection && !newCollection.show && availableCollections.length > 0 && (
              <Button
                type="button"
                color="primary"
                variant="ghost"
                icon={<IconFolder size={16} strokeWidth={1.5} />}
                onClick={handleShowNewCollection}
              >
                {t('CREATE_COLLECTION.TITLE', 'New Collection')}
              </Button>
            )}
          </div>
          <div className="footer-right">
            <Button type="button" color="secondary" variant="ghost" onClick={handleCancel}>
              {t('COMMON.CANCEL', 'Cancel')}
            </Button>
            {!isSelectingCollection && (
              <Button type="button" color="primary" onClick={handleConfirm} data-testid="save-transient-request-submit">
                {t('COMMON.SAVE', 'Save')}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </StyledWrapper>
  );
};

export default SaveTransientRequest;

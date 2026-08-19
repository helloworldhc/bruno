import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  IconSearch,
  IconX,
  IconFolder,
  IconBox,
  IconFileText,
  IconBook
} from '@tabler/icons';
import { flattenItems, isItemARequest, isItemAFolder, findParentItemInCollection } from 'utils/collections';
import { addTab, focusTab } from 'providers/ReduxStore/slices/tabs';
import { toggleCollectionItem, toggleCollection } from 'providers/ReduxStore/slices/collections';
import { mountCollection } from 'providers/ReduxStore/slices/collections/actions';
import { getDefaultRequestPaneTab } from 'utils/collections';
import { normalizePath } from 'utils/common/path';
import { normalizeQuery, isValidQuery, highlightText, sortResults, getTypeLabel, getItemPath } from './utils/searchUtils';
import { SEARCH_TYPES, MATCH_TYPES, SEARCH_CONFIG, DOCUMENTATION_RESULT } from './constants';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const GlobalSearchModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const dispatch = useDispatch();

  const allCollections = useSelector((state) => state.collections.collections);
  const { workspaces, activeWorkspaceUid } = useSelector((state) => state.workspaces);
  const tabs = useSelector((state) => state.tabs.tabs);

  const activeWorkspace = workspaces.find((w) => w.uid === activeWorkspaceUid);

  const collections = useMemo(() => {
    if (!activeWorkspace) return allCollections;

    const workspacePaths = new Set(
      activeWorkspace.collections?.map((wc) => normalizePath(wc.path)) || []
    );
    return allCollections.filter((c) => workspacePaths.has(normalizePath(c.pathname)));
  }, [activeWorkspace, allCollections, workspaces]);

  const createCollectionResults = () => {
    const collectionResults = collections.map((collection) => ({
      type: SEARCH_TYPES.COLLECTION,
      item: collection,
      name: collection.name,
      path: collection.name,
      matchType: MATCH_TYPES.COLLECTION,
      collectionUid: collection.uid
    }));

    collectionResults.sort((a, b) => a.name.localeCompare(b.name));
    return [DOCUMENTATION_RESULT, ...collectionResults];
  };

  const searchInCollections = (searchTerms, enablePathMatch) => {
    const results = [];

    // Check for documentation match
    const queryLower = searchTerms.join(' ');
    if (['documentation', 'docs', 'bruno docs'].some((term) => term.includes(queryLower))) {
      results.push(DOCUMENTATION_RESULT);
    }

    collections.forEach((collection) => {
      // Search collection name
      if (searchTerms.every((term) => collection.name.toLowerCase().includes(term))) {
        results.push({
          type: SEARCH_TYPES.COLLECTION,
          item: collection,
          name: collection.name,
          path: collection.name,
          matchType: MATCH_TYPES.COLLECTION,
          collectionUid: collection.uid
        });
      }

      // Search collection items
      const flattenedItems = flattenItems(collection.items);
      flattenedItems.forEach((item) => {
        const itemPath = getItemPath(item, collection, findParentItemInCollection);
        const itemPathLower = itemPath.toLowerCase();

        if (isItemARequest(item)) {
          const nameMatch = searchTerms.every((term) => (item.name || '').toLowerCase().includes(term));
          const urlMatch = searchTerms.every((term) => (item.request?.url || '').toLowerCase().includes(term));
          const pathMatch = enablePathMatch && searchTerms.every((term) => itemPathLower.includes(term));

          if (nameMatch || urlMatch || pathMatch) {
            const isGrpcRequest = item.request?.type === 'grpc';
            let method = item.request?.method || '';

            if (isGrpcRequest) {
              method = item.request?.methodType || 'unary';
            }

            let matchType = MATCH_TYPES.REQUEST;
            if (nameMatch) matchType = MATCH_TYPES.REQUEST;
            else if (urlMatch) matchType = MATCH_TYPES.URL;
            else if (pathMatch) matchType = MATCH_TYPES.PATH;

            results.push({
              type: SEARCH_TYPES.REQUEST,
              item,
              name: item.name,
              path: itemPath,
              method,
              matchType,
              collectionUid: collection.uid
            });
          }
        } else if (isItemAFolder(item)) {
          const nameMatch = searchTerms.every((term) => item.name.toLowerCase().includes(term));
          const pathMatch = enablePathMatch && searchTerms.every((term) => itemPathLower.includes(term));

          if (nameMatch || pathMatch) {
            results.push({
              type: SEARCH_TYPES.FOLDER,
              item,
              name: item.name,
              path: itemPath,
              matchType: nameMatch ? MATCH_TYPES.FOLDER : MATCH_TYPES.PATH,
              collectionUid: collection.uid
            });
          }
        }
      });
    });

    return sortResults(results);
  };

  const performSearch = useCallback((searchQuery) => {
    const normalizedQuery = normalizeQuery(searchQuery);

    if (!isValidQuery(normalizedQuery)) {
      setResults(createCollectionResults());
      setSelectedIndex(0);
      return;
    }

    const searchTerms = normalizedQuery.toLowerCase().split(' ').filter(Boolean);
    const enablePathMatch = normalizedQuery.includes('/');
    const searchResults = searchInCollections(searchTerms, enablePathMatch);

    setResults(searchResults);
    setSelectedIndex(0);
  }, [collections]);

  const handleQueryChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, SEARCH_CONFIG.DEBOUNCE_DELAY);
  };

  useEffect(() => {
    if (isOpen) {
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
      }, SEARCH_CONFIG.FOCUS_DELAY);

      setResults(createCollectionResults());
      setSelectedIndex(0);

      return () => clearTimeout(focusTimer);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen, collections]);

  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: SEARCH_CONFIG.SCROLL_BEHAVIOR,
          block: SEARCH_CONFIG.SCROLL_BLOCK
        });
      }
    }
  }, [selectedIndex, results.length]);

  const openItemInTree = (result) => {
    if (result.type === SEARCH_TYPES.COLLECTION) {
      const collection = collections.find((c) => c.uid === result.collectionUid);
      if (collection && collection.collapsed) {
        dispatch(toggleCollection(result.collectionUid));
      }
    } else if (result.type === SEARCH_TYPES.FOLDER) {
      const collection = collections.find((c) => c.uid === result.collectionUid);
      if (collection) {
        if (collection.collapsed) {
          dispatch(toggleCollection(result.collectionUid));
        }

        const expandParents = (itemId) => {
          const parent = findParentItemInCollection(collection, itemId);
          if (parent) {
            if (parent.collapsed) {
              dispatch(toggleCollectionItem(parent.uid));
            }
            expandParents(parent.uid);
          }
        };

        expandParents(result.item.uid);

        if (result.item.collapsed) {
          dispatch(toggleCollectionItem(result.item.uid));
        }
      }
    }
  };

  const openItemInTab = (result) => {
    if (result.type === SEARCH_TYPES.REQUEST) {
      const collection = collections.find((c) => c.uid === result.collectionUid);
      if (collection) {
        const existingTab = tabs.find((t) => t.uid === result.item.uid);
        if (existingTab) {
          dispatch(focusTab({ uid: existingTab.uid }));
        } else {
          dispatch(addTab({
            uid: result.item.uid,
            collectionUid: result.collectionUid,
            requestPaneTab: getDefaultRequestPaneTab(result.item)
          }));
        }

        if (collection.collapsed) {
          dispatch(toggleCollection(result.collectionUid));
        }

        const expandParents = (itemId) => {
          const parent = findParentItemInCollection(collection, itemId);
          if (parent) {
            if (parent.collapsed) {
              dispatch(toggleCollectionItem(parent.uid));
            }
            expandParents(parent.uid);
          }
        };

        expandParents(result.item.uid);
      }
    } else if (result.type === SEARCH_TYPES.DOCUMENTATION) {
      window.open('https://docs.usebruno.com', '_blank');
    }
  };

  const handleMountCollection = (collection) => {
    dispatch(mountCollection(collection.uid));
  };

  const handleResultSelection = (result) => {
    if (result.type === SEARCH_TYPES.REQUEST) {
      openItemInTab(result);
    } else if (result.type === SEARCH_TYPES.DOCUMENTATION) {
      openItemInTab(result);
    } else {
      openItemInTree(result);
    }
    onClose();
  };

  const handleKeyNavigation = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (results.length > 0 && results[selectedIndex]) {
          handleResultSelection(results[selectedIndex]);
        } else if (results.length === 0 && query) {
          const normalizedQuery = normalizeQuery(query).toLowerCase();
          const unmountedCollection = allCollections.find(
            (c) => c.name.toLowerCase().includes(normalizedQuery)
          );
          if (unmountedCollection) {
            handleMountCollection(unmountedCollection);
            onClose();
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults(createCollectionResults());
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  const getResultIcon = (type) => {
    switch (type) {
      case SEARCH_TYPES.COLLECTION:
        return <IconBox size={16} className="text-gray-400" aria-hidden="true" />;
      case SEARCH_TYPES.FOLDER:
        return <IconFolder size={16} className="text-gray-400" aria-hidden="true" />;
      case SEARCH_TYPES.REQUEST:
        return <IconFileText size={16} className="text-gray-400" aria-hidden="true" />;
      case SEARCH_TYPES.DOCUMENTATION:
        return <IconBook size={16} className="text-gray-400" aria-hidden="true" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <StyledWrapper>
      <div
        className="command-k-modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="command-k-modal-container"
        role="dialog"
        aria-modal="true"
        aria-label="Global Search"
      >
        <div className="command-k-modal" onClick={(e) => e.stopPropagation()}>
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {results.length > 0 && query
              ? `${results.length} result${results.length === 1 ? '' : 's'} found`
              : query && results.length === 0
                ? 'No results found'
                : ''}
          </div>
          <div className="command-k-header">
            <div className="search-input-container">
              <IconSearch size={20} className="search-icon" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                placeholder={t('GLOBAL_SEARCH.INPUT_PLACEHOLDER', 'Search collections, requests, or documentation...')}
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyNavigation}
                className="search-input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="clear-button"
                  aria-label="Clear search query"
                  type="button"
                >
                  <IconX size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div
            className="command-k-results"
            ref={resultsRef}
            role="listbox"
            aria-label="Search results"
          >
            {results.length === 0 && query ? (
              <div className="no-results">
                <p>
                  {t('GLOBAL_SEARCH.NO_RESULTS_FOR', 'No results found for "{{query}}".', { query })}
                  <br />
                  <span className="block mt-2">
                    {t('GLOBAL_SEARCH.NOT_MOUNTED_HINT', 'The item might not exist yet, or its collection isn’t mounted. Press Enter here (or open it from the sidebar) to mount the collection automatically.')}
                  </span>
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="empty-state">
                <p>
                  {t('GLOBAL_SEARCH.NO_COLLECTIONS_MOUNTED', 'No collections are currently mounted or visible.')}
                  <br />
                  <span className="block mt-2">
                    {t('GLOBAL_SEARCH.MOUNT_COLLECTION_HINT', 'Mount a collection via the sidebar or this search modal, then try again.')}
                  </span>
                </p>
              </div>
            ) : (
              results.map((result, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={`${result.type}-${result.item.id || result.item.uid}-${index}`}
                    className={`result-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleResultSelection(result)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="result-icon">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="result-content">
                      <div className="result-name">
                        {highlightText(result.name, query)}
                      </div>
                      <div className="result-path">
                        {result.type === SEARCH_TYPES.REQUEST
                          ? highlightText(result.item.request?.url || '', query)
                          : highlightText(result.path, query)}
                      </div>
                    </div>
                    {result.type === SEARCH_TYPES.REQUEST && result.method && (
                      <div className="method-badge">{result.method.toUpperCase()}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="command-k-footer">
            <div className="keyboard-hints" role="region" aria-label="Keyboard shortcuts">
              <span aria-label="Use up and down arrows to navigate">
                <span className="keycap" aria-hidden="true">↑</span>
                <span className="keycap" aria-hidden="true">↓</span>
                <span className="hint-label">{t('GLOBAL_SEARCH.TO_NAVIGATE', 'to navigate')}</span>
              </span>
              <span aria-label="Press Enter to select">
                <span className="keycap" aria-hidden="true">↵</span>
                <span className="hint-label">{t('GLOBAL_SEARCH.TO_SELECT', 'to select')}</span>
              </span>
              <span aria-label="Press Escape to close">
                <span className="keycap" aria-hidden="true">esc</span>
                <span className="hint-label">{t('GLOBAL_SEARCH.TO_CLOSE', 'to close')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default GlobalSearchModal;

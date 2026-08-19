import React, { useState, useCallback, useRef } from 'react';
import get from 'lodash/get';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from 'providers/Theme';
import { setCollectionHeaders } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import { updateTableColumnWidths } from 'providers/ReduxStore/slices/tabs';
import SingleLineEditor from 'components/SingleLineEditor';
import EditableTable from 'components/EditableTable';
import { createDescriptionColumn } from 'components/EditableTable/descriptionColumn';
import StyledWrapper from './StyledWrapper';
import { headers as StandardHTTPHeaders } from 'know-your-http-well';
import { MimeTypes } from 'utils/codemirror/autocompleteConstants';
import BulkEditor from 'components/BulkEditor/index';
import Button from 'ui/Button';
import { headerNameRegex, headerValueRegex } from 'utils/common/regex';
import { usePersistedState } from 'hooks/usePersistedState';
import { useTrackScroll } from 'hooks/useTrackScroll';
import { useTranslation } from 'react-i18next';

const headerAutoCompleteList = StandardHTTPHeaders.map((e) => e.header);

const Headers = ({ collection }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const headers = collection.draft?.root
    ? get(collection, 'draft.root.request.headers', [])
    : get(collection, 'root.request.headers', []);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  const activeTab = tabs.find((t) => t.uid === activeTabUid);
  const collectionHeadersWidths = get(activeTab, 'tableColumnWidths.collection-headers', {});

  const [scroll, setScroll] = usePersistedState(`collection-headers-scroll-${collection.uid}`, {
    scrollTop: 0,
    scrollLeft: 0
  });
  const wrapperRef = useRef(null);
  useTrackScroll(wrapperRef, scroll, setScroll);

  const handleHeadersChange = (newHeaders) => {
    dispatch(
      setCollectionHeaders({
        headers: newHeaders,
        collectionUid: collection.uid
      })
    );
  };

  const handleColumnWidthsChange = (tableId, widths) => {
    dispatch(
      updateTableColumnWidths({
        tabUid: activeTabUid,
        tableId,
        columnWidths: widths
      })
    );
  };

  const toggleBulkEditMode = () => {
    setIsBulkEditMode(!isBulkEditMode);
  };

  const handleSave = () => {
    dispatch(saveCollectionSettings(collection.uid));
  };

  const getRowError = (row) => {
    if (!row.name) return null;
    if (!headerNameRegex.test(row.name)) {
      return 'Header name contains invalid characters';
    }
    if (row.value && !headerValueRegex.test(row.value)) {
      return 'Header value contains invalid characters';
    }
    return null;
  };

  const descriptionColumn = createDescriptionColumn({
    theme: storedTheme,
    onSave: handleSave,
    collection,
    nameFromRowIndex: true
  });

  const columns = [
    {
      key: 'name',
      name: t('COMMON.NAME', 'Name'),
      isKeyField: true,
      placeholder: t('COMMON.NAME', 'Name'),
      width: '20%',
      render: ({ value, onChange }) => (
        <SingleLineEditor
          value={value || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={(newValue) => onChange(newValue.replace(/[\r\n]/g, ''))}
          autocomplete={headerAutoCompleteList}
          collection={collection}
          placeholder={!value ? t('COMMON.NAME', 'Name') : ''}
        />
      )
    },
    {
      key: 'value',
      name: t('COMMON.VALUE', 'Value'),
      placeholder: t('COMMON.VALUE', 'Value'),
      render: ({ value, onChange }) => (
        <SingleLineEditor
          value={value || ''}
          theme={storedTheme}
          onSave={handleSave}
          onChange={onChange}
          collection={collection}
          autocomplete={MimeTypes}
          placeholder={!value ? t('COMMON.VALUE', 'Value') : ''}
        />
      )
    },
    descriptionColumn
  ];

  const defaultRow = {
    name: '',
    value: '',
    description: ''
  };

  if (isBulkEditMode) {
    return (
      <StyledWrapper className="h-full w-full">
        <div className="text-xs mb-4 text-muted">
          {t('COLLECTION_SETTINGS.HEADERS_DESC', 'Add request headers that will be sent with every request in this collection.')}
        </div>
        <BulkEditor
          params={headers}
          onChange={handleHeadersChange}
          onToggle={toggleBulkEditMode}
          onSave={handleSave}
        />
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper className="h-full w-full" ref={wrapperRef}>
      <div className="text-xs mb-4 text-muted">
        {t('COLLECTION_SETTINGS.HEADERS_DESC', 'Add request headers that will be sent with every request in this collection.')}
      </div>
      <EditableTable
        tableId="collection-headers"
        testId="collection-headers"
        columns={columns}
        rows={headers}
        onChange={handleHeadersChange}
        defaultRow={defaultRow}
        getRowError={getRowError}
        columnWidths={collectionHeadersWidths}
        onColumnWidthsChange={(widths) => handleColumnWidthsChange('collection-headers', widths)}
        initialScroll={scroll}
      />
      <div className="flex justify-end mt-2">
        <button className="text-link select-none" data-testid="bulk-edit-toggle" onClick={toggleBulkEditMode}>
          {t('REQUEST.BULK_EDIT', 'Bulk Edit')}
        </button>
      </div>
      <div className="mt-6">
        <Button type="submit" size="sm" onClick={handleSave}>
          {t('COMMON.SAVE', 'Save')}
        </Button>
      </div>
    </StyledWrapper>
  );
};

export default Headers;

import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from 'providers/Theme';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import { updateTableColumnWidths } from 'providers/ReduxStore/slices/tabs';
import MultiLineEditor from 'components/MultiLineEditor';
import InfoTip from 'components/InfoTip';
import DataTypeSelector from 'components/DataTypeSelector';
import VarValueCell from 'components/VarValueCell';
import { valueToString } from '@usebruno/common/utils';
import EditableTable from 'components/EditableTable';
import { createDescriptionColumn } from 'components/EditableTable/descriptionColumn';
import StyledWrapper from './StyledWrapper';
import toast from 'react-hot-toast';
import { variableNameRegex } from 'utils/common/regex';
import { setCollectionVars, moveCollectionVar } from 'providers/ReduxStore/slices/collections/index';
import { useTranslation } from 'react-i18next';

const VarsTable = ({ collection, vars, varType, initialScroll = 0, isDraft }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);

  // Get column widths from Redux
  const focusedTab = tabs?.find((t) => t.uid === activeTabUid);
  const collectionVarsWidths = focusedTab?.tableColumnWidths?.['collection-vars'] || {};

  const handleColumnWidthsChange = (tableId, widths) => {
    dispatch(updateTableColumnWidths({ uid: activeTabUid, tableId, widths }));
  };

  const onSave = () => dispatch(saveCollectionSettings(collection.uid));

  const handleVarsChange = useCallback((updatedVars) => {
    dispatch(setCollectionVars({ collectionUid: collection.uid, vars: updatedVars, type: varType }));
  }, [dispatch, collection.uid, varType]);

  const handleReorder = useCallback(({ updateReorderedItem }) => {
    dispatch(moveCollectionVar({ type: varType, collectionUid: collection.uid, updateReorderedItem }));
  }, [dispatch, varType, collection.uid]);

  const getRowError = useCallback((row, index, key) => {
    if (key !== 'name') return null;
    if (!row.name || row.name.trim() === '') return null;
    if (!variableNameRegex.test(row.name)) {
      return t('COMMON.VARIABLE_NAME_ERROR', 'Variable contains invalid characters. Must only contain alphanumeric characters, "-", "_", "."');
    }
    return null;
  }, [t]);

  const descriptionColumn = createDescriptionColumn({
    theme: storedTheme,
    onSave,
    collection,
    nameFromRowIndex: true
  });

  const nameLabel = t('COMMON.NAME', 'Name');
  const valueLabel = t('COMMON.VALUE', 'Value');
  const exprLabel = t('COMMON.EXPR', 'Expr');

  const columns = [
    {
      key: 'name',
      name: nameLabel,
      isKeyField: true,
      sortable: true,
      placeholder: nameLabel,
      width: '25%'
    },
    {
      key: 'value',
      name: varType === 'request' ? valueLabel : (
        <div className="flex items-center">
          <span>{exprLabel}</span>
          <InfoTip content={t('COMMON.JS_TEMPLATE_LITERAL_HINT', 'You can write any valid JS Template Literal here')} infotipId={`collection-${varType}-var`} />
        </div>
      ),
      placeholder: varType === 'request' ? valueLabel : exprLabel,
      render: ({ row, value, onChange, isLastEmptyRow, rowIndex }) => (
        <VarValueCell
          editor={(
            <MultiLineEditor
              value={valueToString(value)}
              name={`${rowIndex}.value`}
              theme={storedTheme}
              onSave={onSave}
              onChange={onChange}
              collection={collection}
              placeholder={value == null || (typeof value === 'string' && value.trim() === '') ? (varType === 'request' ? valueLabel : exprLabel) : ''}
            />
          )}
          renderTypeSelector={!isLastEmptyRow && varType === 'request'
            ? ({ compact }) => (
                <DataTypeSelector
                  compact={compact}
                  variable={row}
                  theme={storedTheme}
                  collection={collection}
                  onChange={(fields) => {
                    const updated = (vars || []).map((v) => v.uid === row.uid ? { ...v, ...fields } : v);
                    handleVarsChange(updated);
                  }}
                />
              )
            : null}
        />
      )
    },
    descriptionColumn
  ];

  const defaultRow = {
    name: '',
    value: '',
    description: '',
    ...(varType === 'response' ? { local: false } : {})
  };

  return (
    <StyledWrapper className="w-full">
      <EditableTable
        tableId="collection-vars"
        testId={`collection-vars-${varType === 'response' ? 'res' : 'req'}`}
        columns={columns}
        rows={vars || []}
        onChange={handleVarsChange}
        reorderable
        onReorder={handleReorder}
        sortStorageKey={`collection-vars-sort::${collection.uid}::${varType}`}
        isDraft={isDraft}
        defaultRow={defaultRow}
        getRowError={getRowError}
        columnWidths={collectionVarsWidths}
        onColumnWidthsChange={(widths) => handleColumnWidthsChange('collection-vars', widths)}
        initialScroll={initialScroll}
      />
    </StyledWrapper>
  );
};

export default VarsTable;

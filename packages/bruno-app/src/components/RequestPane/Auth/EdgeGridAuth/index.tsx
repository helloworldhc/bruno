import { IconAdjustmentsHorizontal, IconInfoCircle } from '@tabler/icons';
import get from 'lodash/get';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import SensitiveFieldWarning from 'components/SensitiveFieldWarning';
import SingleLineEditor from 'components/SingleLineEditor';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import { sendRequest } from 'providers/ReduxStore/slices/collections/actions';
import { useTheme } from 'providers/Theme';
import StyledWrapper from './StyledWrapper';

interface AkamaiEdgeGridAuthValues {
  accessToken?: string;
  clientToken?: string;
  clientSecret?: string;
  baseURL?: string | null;
  nonce?: string | null;
  timestamp?: string | null;
  headersToSign?: string | null;
  maxBodySize?: number | null;
}

type EdgeGridField = keyof AkamaiEdgeGridAuthValues;

// Coerce the Max Body Size editor string into the numeric value the model stores (empty/invalid -> null).
const toMaxBodySize = (value: string): number | null => {
  if (value === '' || value == null) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

interface AkamaiEdgeGridAuthProps {
  item: any;
  collection: any;
  request: any;
  updateAuth: (payload: any) => any;
  save: () => void;
}

interface EdgeGridFieldConfig {
  key: EdgeGridField;
  labelKey: string;
  defaultLabel: string;
  tooltipKey?: string;
  defaultTooltip?: string;
  isSecret?: boolean;
}

const FIELDS: EdgeGridFieldConfig[] = [
  { key: 'accessToken', labelKey: 'AUTH.ACCESS_TOKEN', defaultLabel: 'Access Token', isSecret: true },
  { key: 'clientToken', labelKey: 'AUTH.CLIENT_TOKEN', defaultLabel: 'Client Token', isSecret: true },
  { key: 'clientSecret', labelKey: 'AUTH.CLIENT_SECRET', defaultLabel: 'Client Secret', isSecret: true },
  { key: 'baseURL', labelKey: 'AUTH.BASE_URL', defaultLabel: 'Base URL', tooltipKey: 'AUTH.BASE_URL_TOOLTIP', defaultTooltip: 'Defaults to the request URL if not specified.' },
  {
    key: 'nonce',
    labelKey: 'AUTH.NONCE',
    defaultLabel: 'Nonce',
    tooltipKey: 'AUTH.NONCE_TOOLTIP',
    defaultTooltip: 'A unique nonce is required per request. Defaults to an auto-generated UUID v4 if not provided.'
  },
  {
    key: 'timestamp',
    labelKey: 'AUTH.TIMESTAMP',
    defaultLabel: 'Timestamp',
    tooltipKey: 'AUTH.TIMESTAMP_TOOLTIP',
    defaultTooltip:
      'UTC timestamp of when the request is signed (yyyyMMddTHH:mm:ss+0000). Defaults to current time if not provided.'
  },
  {
    key: 'headersToSign',
    labelKey: 'AUTH.HEADERS_TO_SIGN',
    defaultLabel: 'Headers to Sign',
    tooltipKey: 'AUTH.HEADERS_TO_SIGN_TOOLTIP',
    defaultTooltip: 'Comma-separated list of headers to include in the signature.'
  },
  {
    key: 'maxBodySize',
    labelKey: 'AUTH.MAX_BODY_SIZE',
    defaultLabel: 'Max Body Size',
    tooltipKey: 'AUTH.MAX_BODY_SIZE_TOOLTIP',
    defaultTooltip: 'Maximum message body size to include in the signature, in bytes. Defaults to 131072.'
  }
];

// Fields shown up front vs. those grouped under the "Advanced Settings" section
const BASIC_FIELDS = FIELDS.slice(0, 3);
const ADVANCED_FIELDS = FIELDS.slice(3);

const EdgeGridAuth: React.FC<AkamaiEdgeGridAuthProps> = ({ item, collection, updateAuth, request, save }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();

  const edgeGridAuth: AkamaiEdgeGridAuthValues = get(request, 'auth.akamaiEdgegrid') || {};
  const requestUrl = get(request, 'url', '');
  const { isSensitive } = useDetectSensitiveField(collection);

  const handleRun = () => dispatch(sendRequest(item, collection.uid));

  const handleSave = () => {
    save();
  };

  const handleFieldChange = (field: EdgeGridField, value: string) => {
    const content: AkamaiEdgeGridAuthValues = {
      accessToken: edgeGridAuth.accessToken || '',
      clientToken: edgeGridAuth.clientToken || '',
      clientSecret: edgeGridAuth.clientSecret || '',
      nonce: edgeGridAuth.nonce || '',
      timestamp: edgeGridAuth.timestamp || '',
      baseURL: edgeGridAuth.baseURL || '',
      headersToSign: edgeGridAuth.headersToSign || '',
      maxBodySize: edgeGridAuth.maxBodySize ?? null
    };

    if (field === 'maxBodySize') {
      content.maxBodySize = toMaxBodySize(value);
    } else {
      (content as Record<string, unknown>)[field] = value || '';
    }

    dispatch(
      updateAuth({
        mode: 'akamai-edgegrid',
        collectionUid: collection.uid,
        itemUid: item.uid,
        content
      })
    );
  };

  const renderField = ({ key, labelKey, defaultLabel, tooltipKey, defaultTooltip, isSecret }: EdgeGridFieldConfig) => {
    const rawValue = key === 'baseURL' ? edgeGridAuth.baseURL || requestUrl : edgeGridAuth[key];
    const fieldValue = rawValue === null || rawValue === undefined ? '' : String(rawValue);
    const { showWarning, warningMessage } = isSecret ? isSensitive(rawValue) : { showWarning: false, warningMessage: '' };
    return (
      <div key={key}>
        <label>
          {t(labelKey, defaultLabel)}
          {tooltipKey && (
            <span className="field-info">
              <IconInfoCircle size={16} />
              <span className="field-tooltip">{t(tooltipKey, defaultTooltip)}</span>
            </span>
          )}
        </label>
        <div className="single-line-editor-wrapper">
          <SingleLineEditor
            value={fieldValue}
            theme={storedTheme}
            onSave={handleSave}
            onChange={(val: string) => handleFieldChange(key, val)}
            onRun={handleRun}
            collection={collection}
            item={item}
            isSecret={isSecret}
            isCompact
          />
          {showWarning && (
            <SensitiveFieldWarning fieldName={`edgegrid-${key}`} warningMessage={warningMessage} />
          )}
        </div>
      </div>
    );
  };

  return (
    <StyledWrapper className="mt-2 w-full">
      {BASIC_FIELDS.map(renderField)}

      <div className="advanced-settings-header">
        <span className="advanced-settings-icon">
          <IconAdjustmentsHorizontal size={16} />
        </span>
        <span>{t('AUTH.ADVANCED_SETTINGS', 'Advanced Settings')}</span>
      </div>

      <>
        {ADVANCED_FIELDS.map(renderField)}
      </>
    </StyledWrapper>
  );
};

export default EdgeGridAuth;

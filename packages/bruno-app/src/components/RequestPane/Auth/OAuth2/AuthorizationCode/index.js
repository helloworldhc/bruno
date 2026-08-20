import React from 'react';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import get from 'lodash/get';
import { useTheme } from 'providers/Theme';
import { useDispatch, useSelector } from 'react-redux';
import { IconCaretDown, IconSettings, IconKey, IconHelp, IconAdjustmentsHorizontal } from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import SingleLineEditor from 'components/SingleLineEditor';
import StyledWrapper from './StyledWrapper';
import { inputsConfig } from './inputsConfig';
import Oauth2TokenViewer from '../Oauth2TokenViewer/index';
import Oauth2ActionButtons from '../Oauth2ActionButtons/index';
import AdditionalParams from '../AdditionalParams/index';
import SensitiveFieldWarning from 'components/SensitiveFieldWarning';
import { savePreferences } from 'providers/ReduxStore/slices/app';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const OAuth2AuthorizationCode = ({ save, item = {}, request, handleRun, updateAuth, collection, folder }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const preferences = useSelector((state) => state.app.preferences);
  const { storedTheme, theme } = useTheme();
  const tooltipStyle = {
    backgroundColor: theme?.background?.surface0,
    color: theme?.text
  };
  const useSystemBrowser = get(preferences, 'request.oauth2.useSystemBrowser', false);
  const { isSensitive } = useDetectSensitiveField(collection);
  const oAuth = get(request, 'auth.oauth2', {});
  const {
    callbackUrl,
    authorizationUrl,
    accessTokenUrl,
    clientId,
    clientSecret,
    scope,
    credentialsPlacement,
    state,
    pkce,
    credentialsId,
    tokenPlacement,
    tokenHeaderPrefix,
    tokenQueryKey,
    refreshTokenUrl,
    autoRefreshToken,
    autoFetchToken,
    tokenSource,
    additionalParameters
  } = oAuth;

  const refreshTokenUrlAvailable = refreshTokenUrl?.trim() !== '';
  const isAutoRefreshDisabled = !refreshTokenUrlAvailable;

  const handleSave = () => { save(); };

  const handleChange = (key, value) => {
    dispatch(
      updateAuth({
        mode: 'oauth2',
        collectionUid: collection.uid,
        itemUid: item.uid,
        content: {
          grantType: 'authorization_code',
          callbackUrl,
          authorizationUrl,
          accessTokenUrl,
          clientId,
          clientSecret,
          state,
          scope,
          pkce,
          credentialsPlacement,
          credentialsId,
          tokenPlacement,
          tokenHeaderPrefix,
          tokenQueryKey,
          refreshTokenUrl,
          autoRefreshToken,
          autoFetchToken,
          tokenSource,
          additionalParameters,
          [key]: value
        }
      })
    );
  };

  const handlePKCEToggle = (e) => {
    dispatch(
      updateAuth({
        mode: 'oauth2',
        collectionUid: collection.uid,
        itemUid: item.uid,
        content: {
          grantType: 'authorization_code',
          callbackUrl,
          authorizationUrl,
          accessTokenUrl,
          clientId,
          clientSecret,
          state,
          scope,
          credentialsPlacement,
          credentialsId,
          tokenPlacement,
          tokenHeaderPrefix,
          tokenQueryKey,
          autoFetchToken,
          tokenSource,
          additionalParameters,
          pkce: !Boolean(oAuth?.['pkce'])
        }
      })
    );
  };

  const handleUseSystemBrowserToggle = (e) => {
    const newValue = e.target.checked;
    dispatch(
      savePreferences({
        ...preferences,
        request: {
          ...preferences.request,
          oauth2: {
            ...preferences.request.oauth2,
            useSystemBrowser: newValue
          }
        }
      })
    )
      .then(() => {
        toast.success(t('AUTH.PREFERENCE_UPDATED_SUCCESS', 'Preference updated successfully'));
      })
      .catch((err) => {
        console.error(err);
        toast.error(t('AUTH.FAILED_UPDATE_PREFERENCE', 'Failed to update preference'));
      });
  };

  return (
    <StyledWrapper className="mt-2 flex w-full gap-4 flex-col">
      <Oauth2TokenViewer handleRun={handleRun} collection={collection} item={item} url={accessTokenUrl} credentialsId={credentialsId} />
      <div className="flex items-center gap-2.5 mt-2">
        <div className="flex items-center px-2.5 py-1.5 oauth2-icon-container rounded-md">
          <IconSettings size={14} className="oauth2-icon" />
        </div>
        <span className="oauth2-section-label">
          {t('AUTH.CONFIGURATION', 'Configuration')}
        </span>
      </div>
      <div className="flex items-center gap-4 w-full" key="input-callbackUrl">
        <label className="block min-w-[140px]">{t('AUTH.CALLBACK_URL', 'Callback URL')}</label>
        <div className="flex flex-col gap-1 w-full">
          <div className="single-line-editor-wrapper flex-1 flex items-center">
            <SingleLineEditor
              value={callbackUrl}
              theme={storedTheme}
              onSave={handleSave}
              onChange={(val) => handleChange('callbackUrl', val)}
              onRun={handleRun}
              collection={collection}
              item={item}
              placeholder={useSystemBrowser ? 'https://oauth.usebruno.com/callback' : undefined}
              isCompact
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 w-full" key="input-use-system-browser">
        <label className="block min-w-[140px]"></label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(useSystemBrowser)}
            onChange={handleUseSystemBrowserToggle}
            className="cursor-pointer"
          />
          <label
            className="block cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              handleUseSystemBrowserToggle({ target: { checked: !useSystemBrowser } });
            }}
          >
            {t('AUTH.USE_SYSTEM_BROWSER', 'Use system browser for OAuth')}
          </label>
        </div>
      </div>
      {inputsConfig.map((input) => {
        const { key, label, labelKey, isSecret, tooltip, tooltipKey } = input;
        const value = oAuth[key] || '';
        const { showWarning, warningMessage } = isSensitive(value);

        return (
          <div className="flex items-center gap-4 w-full" key={`input-${key}`}>
            <label className="min-w-[140px] flex items-center gap-4">
              {labelKey ? t(labelKey, label) : label}
              {tooltip && (
                <div className="relative group cursor-pointer inline-flex items-center">
                  <IconHelp size={16} className="text-gray-500" />
                  <span className="group-hover:opacity-100 pointer-events-none opacity-0 max-w-60 absolute left-0 top-full mt-1 w-max p-2 text-xs rounded-md transition-opacity duration-200 z-10" style={tooltipStyle}>
                    {tooltipKey ? t(tooltipKey, tooltip) : tooltip}
                  </span>
                </div>
              )}
            </label>
            <div className="single-line-editor-wrapper flex-1 flex items-center">
              <SingleLineEditor
                value={value}
                theme={storedTheme}
                onSave={handleSave}
                onChange={(val) => handleChange(key, val)}
                onRun={handleRun}
                collection={collection}
                item={item}
                isSecret={isSecret}
                isCompact
              />
              {isSecret && showWarning && <SensitiveFieldWarning fieldName={key} warningMessage={warningMessage} />}
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 w-full" key="input-credentials-placement">
        <label className="block min-w-[140px]">{t('AUTH.ADD_CREDENTIALS_TO', 'Add Credentials to')}</label>
        <div className="inline-flex items-center cursor-pointer token-placement-selector">
          <MenuDropdown
            items={[
              { id: 'body', label: t('AUTH.REQUEST_BODY', 'Request Body'), onClick: () => handleChange('credentialsPlacement', 'body') },
              { id: 'basic_auth_header', label: t('AUTH.BASIC_AUTH_HEADER', 'Basic Auth Header'), onClick: () => handleChange('credentialsPlacement', 'basic_auth_header') }
            ]}
            selectedItemId={credentialsPlacement}
            placement="bottom-end"
          >
            <div className="flex items-center justify-end token-placement-label select-none">
              {credentialsPlacement == 'body' ? t('AUTH.REQUEST_BODY', 'Request Body') : t('AUTH.BASIC_AUTH_HEADER', 'Basic Auth Header')}
              <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
            </div>
          </MenuDropdown>
        </div>
      </div>
      <div className="flex flex-row w-full gap-4" key="pkce">
        <label className="block">{t('AUTH.USE_PKCE', 'Use PKCE')}</label>
        <input
          className="cursor-pointer"
          type="checkbox"
          checked={Boolean(oAuth?.['pkce'])}
          onChange={handlePKCEToggle}
        />
      </div>
      <div className="flex items-center gap-2.5 mt-2">
        <div className="flex items-center px-2.5 py-1.5 oauth2-icon-container rounded-md">
          <IconKey size={14} className="oauth2-icon" />
        </div>
        <span className="oauth2-section-label">
          {t('AUTH.TOKEN', 'Token')}
        </span>
      </div>
      <div className="flex items-center gap-4 w-full" key="input-token-type">
        <label className="block min-w-[140px]">{t('AUTH.TOKEN_SOURCE', 'Token Source')}</label>
        <div className="inline-flex items-center cursor-pointer token-placement-selector">
          <MenuDropdown
            items={[
              { id: 'access_token', label: t('AUTH.ACCESS_TOKEN', 'Access Token'), onClick: () => handleChange('tokenSource', 'access_token') },
              { id: 'id_token', label: t('AUTH.ID_TOKEN', 'ID Token'), onClick: () => handleChange('tokenSource', 'id_token') }
            ]}
            selectedItemId={tokenSource}
            placement="bottom-end"
          >
            <div className="flex items-center justify-end token-placement-label select-none">
              {tokenSource === 'id_token' ? t('AUTH.ID_TOKEN', 'ID Token') : t('AUTH.ACCESS_TOKEN', 'Access Token')}
              <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
            </div>
          </MenuDropdown>
        </div>
      </div>
      <div className="flex items-center gap-4 w-full" key="input-token-name">
        <label className="block min-w-[140px]">{t('AUTH.TOKEN_ID', 'Token ID')}</label>
        <div className="single-line-editor-wrapper flex-1">
          <SingleLineEditor
            value={oAuth['credentialsId'] || ''}
            theme={storedTheme}
            onSave={handleSave}
            onChange={(val) => handleChange('credentialsId', val)}
            onRun={handleRun}
            collection={collection}
            item={item}
            isCompact
          />
        </div>
      </div>
      <div className="flex items-center gap-4 w-full" key="input-token-placement">
        <label className="block min-w-[140px]">{t('AUTH.ADD_TOKEN_TO', 'Add token to')}</label>
        <div className="inline-flex items-center cursor-pointer token-placement-selector">
          <MenuDropdown
            items={[
              { id: 'header', label: t('AUTH.HEADER', 'Header'), onClick: () => handleChange('tokenPlacement', 'header') },
              { id: 'url', label: 'URL', onClick: () => handleChange('tokenPlacement', 'url') }
            ]}
            selectedItemId={tokenPlacement}
            placement="bottom-end"
          >
            <div className="flex items-center justify-end token-placement-label select-none">
              {tokenPlacement == 'url' ? 'URL' : t('AUTH.HEADERS', 'Headers')}
              <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
            </div>
          </MenuDropdown>
        </div>
      </div>
      {
        tokenPlacement === 'header'
          ? (
              <div className="flex items-center gap-4 w-full" key="input-token-prefix" data-testid="token-header-prefix">
                <label className="block min-w-[140px]">{t('AUTH.HEADER_PREFIX', 'Header Prefix')}</label>
                <div className="single-line-editor-wrapper flex-1">
                  <SingleLineEditor
                    value={oAuth['tokenHeaderPrefix'] || ''}
                    theme={storedTheme}
                    onSave={handleSave}
                    onChange={(val) => handleChange('tokenHeaderPrefix', val)}
                    onRun={handleRun}
                    collection={collection}
                    isCompact
                  />
                </div>
              </div>
            )
          : (
              <div className="flex items-center gap-4 w-full" key="input-token-query-param-key" data-testid="token-query-param-key">
                <label className="block min-w-[140px]">{t('AUTH.QUERY_PARAM_KEY', 'Query Param Key')}</label>
                <div className="single-line-editor-wrapper flex-1">
                  <SingleLineEditor
                    value={oAuth['tokenQueryKey'] || ''}
                    theme={storedTheme}
                    onSave={handleSave}
                    onChange={(val) => handleChange('tokenQueryKey', val)}
                    onRun={handleRun}
                    collection={collection}
                    isCompact
                  />
                </div>
              </div>
            )
      }
      <div className="flex items-center gap-2.5 mt-4 mb-2">
        <div className="flex items-center px-2.5 py-1.5 oauth2-icon-container rounded-md">
          <IconAdjustmentsHorizontal size={14} className="oauth2-icon" />
        </div>
        <span className="oauth2-section-label">
          {t('AUTH.ADVANCED_SETTINGS', 'Advanced Settings')}
        </span>
      </div>

      <div className="flex items-center gap-4 w-full mb-4">
        <label className="block min-w-[140px]">{t('AUTH.REFRESH_TOKEN_URL', 'Refresh Token URL')}</label>
        <div className="single-line-editor-wrapper flex-1">
          <SingleLineEditor
            value={get(request, 'auth.oauth2.refreshTokenUrl', '')}
            theme={storedTheme}
            onSave={handleSave}
            onChange={(val) => handleChange('refreshTokenUrl', val)}
            collection={collection}
            item={item}
            isCompact
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 mt-4">
        <div className="flex items-center px-2.5 py-1.5 oauth2-icon-container rounded-md">
          <IconSettings size={14} className="oauth2-icon" />
        </div>
        <span className="font-medium">{t('COMMON.SETTINGS', 'Settings')}</span>
      </div>

      {/* Automatically Fetch Token */}
      <div className="flex items-center gap-4 w-full">
        <input
          type="checkbox"
          checked={Boolean(autoFetchToken)}
          onChange={(e) => handleChange('autoFetchToken', e.target.checked)}
          className="cursor-pointer ml-1"
        />
        <label className="block min-w-[140px]">{t('AUTH.AUTO_FETCH_TOKEN', 'Automatically fetch token if not found')}</label>
        <div className="flex items-center gap-2">
          <div className="relative group cursor-pointer">
            <IconHelp size={16} className="text-gray-500" />
            <span className="group-hover:opacity-100 pointer-events-none opacity-0 max-w-60 absolute left-0 bottom-full mb-1 w-max p-2 text-xs rounded-md transition-opacity duration-200" style={tooltipStyle}>
              {t('AUTH.AUTO_FETCH_TOKEN_TOOLTIP', 'Automatically fetch a new token when you try to access a resource and don\'t have one.')}
            </span>
          </div>
        </div>
      </div>

      {/* Auto Refresh Token (With Refresh URL) */}
      <div className="flex items-center gap-4 w-full">
        <input
          type="checkbox"
          checked={Boolean(autoRefreshToken)}
          onChange={(e) => handleChange('autoRefreshToken', e.target.checked)}
          className={`cursor-pointer ml-1 ${isAutoRefreshDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isAutoRefreshDisabled}
        />
        <label className={`block min-w-[140px] ${isAutoRefreshDisabled ? 'text-gray-500' : ''}`}>{t('AUTH.AUTO_REFRESH_TOKEN', 'Auto refresh token (with refresh URL)')}</label>
        <div className="flex items-center gap-2">
          <div className="relative group cursor-pointer">
            <IconHelp size={16} className="text-gray-500" />
            <span className="group-hover:opacity-100 pointer-events-none opacity-0 max-w-60 absolute left-0 bottom-full mb-1 w-max p-2 text-xs rounded-md transition-opacity duration-200" style={tooltipStyle}>
              {t('AUTH.AUTO_REFRESH_TOKEN_TOOLTIP', 'Automatically refresh your token using the refresh URL when it expires.')}
            </span>
          </div>
        </div>
      </div>
      <AdditionalParams
        item={item}
        request={request}
        collection={collection}
        updateAuth={updateAuth}
        handleSave={handleSave}
      />
      <Oauth2ActionButtons item={item} request={request} collection={collection} url={accessTokenUrl} credentialsId={credentialsId} />
    </StyledWrapper>
  );
};

export default OAuth2AuthorizationCode;

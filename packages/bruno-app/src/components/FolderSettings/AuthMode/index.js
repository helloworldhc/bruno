import React, { useMemo, useCallback } from 'react';
import get from 'lodash/get';
import { IconCaretDown } from '@tabler/icons';
import MenuDropdown from 'ui/MenuDropdown';
import StatusBadge from 'ui/StatusBadge/index';
import { useDispatch } from 'react-redux';
import { updateFolderAuthMode } from 'providers/ReduxStore/slices/collections';
import { humanizeRequestAuthMode } from 'utils/collections';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const AuthMode = ({ collection, folder }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const authMode = folder.draft ? get(folder, 'draft.request.auth.mode') : get(folder, 'root.request.auth.mode');

  const onModeChange = useCallback((value) => {
    dispatch(
      updateFolderAuthMode({
        mode: value,
        collectionUid: collection.uid,
        folderUid: folder.uid
      })
    );
  }, [dispatch, collection.uid, folder.uid]);

  const menuItems = useMemo(() => [
    {
      id: 'awsv4',
      label: t('REQUEST.AUTH_AWS_SIGV4', 'AWS Sig v4'),
      onClick: () => onModeChange('awsv4')
    },
    {
      id: 'basic',
      label: t('REQUEST.AUTH_BASIC', 'Basic Auth'),
      onClick: () => onModeChange('basic')
    },
    {
      id: 'bearer',
      label: t('REQUEST.AUTH_BEARER', 'Bearer Token'),
      onClick: () => onModeChange('bearer')
    },
    {
      id: 'digest',
      label: t('REQUEST.AUTH_DIGEST', 'Digest Auth'),
      onClick: () => onModeChange('digest')
    },
    {
      id: 'ntlm',
      label: t('REQUEST.AUTH_NTLM', 'NTLM Auth'),
      onClick: () => onModeChange('ntlm')
    },
    {
      id: 'oauth1',
      label: 'OAuth 1.0',
      onClick: () => onModeChange('oauth1')
    },
    {
      id: 'oauth2',
      label: t('REQUEST.AUTH_OAUTH2', 'OAuth 2.0'),
      onClick: () => onModeChange('oauth2')
    },
    {
      id: 'wsse',
      label: t('REQUEST.AUTH_WSSE', 'WSSE Auth'),
      onClick: () => onModeChange('wsse')
    },
    {
      id: 'apikey',
      label: t('REQUEST.AUTH_API_KEY', 'API Key'),
      onClick: () => onModeChange('apikey')
    },
    {
      id: 'akamai-edgegrid',
      label: (
        <span className="flex items-center gap-2">
          Akamai EdgeGrid
          <StatusBadge status="info" size="xs">Beta</StatusBadge>
        </span>
      ),
      ariaLabel: t('AUTH.AKAMAI_EDGEGRID_BETA', 'Akamai EdgeGrid (Beta)'),
      onClick: () => onModeChange('akamai-edgegrid')
    },
    {
      id: 'inherit',
      label: t('COMMON.INHERIT', 'Inherit'),
      onClick: () => onModeChange('inherit')
    },
    {
      id: 'none',
      label: t('REQUEST.AUTH_NONE', 'No Auth'),
      onClick: () => onModeChange('none')
    }
  ], [onModeChange, t]);

  return (
    <StyledWrapper>
      <div className="inline-flex items-center cursor-pointer auth-mode-selector" data-testid="auth-mode-selector">
        <MenuDropdown
          items={menuItems}
          placement="bottom-end"
          selectedItemId={authMode}
          showTickMark={true}
          data-testid="auth-mode-dropdown"
        >
          <div className="flex items-center justify-center auth-mode-label select-none" data-testid="auth-mode-label">
            {humanizeRequestAuthMode(authMode)} <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
          </div>
        </MenuDropdown>
      </div>
    </StyledWrapper>
  );
};

export default AuthMode;

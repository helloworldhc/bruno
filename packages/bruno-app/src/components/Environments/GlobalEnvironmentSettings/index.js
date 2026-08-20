import React from 'react';
import { useSelector } from 'react-redux';
import WorkspaceEnvironments from 'components/WorkspaceHome/WorkspaceEnvironments';
import { useTranslation } from 'react-i18next';

const GlobalEnvironmentSettings = () => {
  const { t } = useTranslation();
  const activeWorkspaceUid = useSelector((state) => state.workspaces.activeWorkspaceUid);
  const workspace = useSelector((state) =>
    state.workspaces.workspaces.find((w) => w.uid === activeWorkspaceUid)
  );

  return <WorkspaceEnvironments workspace={workspace} />;
};

export default GlobalEnvironmentSettings;

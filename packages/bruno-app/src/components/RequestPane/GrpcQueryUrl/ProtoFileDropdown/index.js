import React, { forwardRef, useState } from 'react';
import { IconFile, IconChevronDown } from '@tabler/icons';
import { getBasename } from 'utils/common/path';
import { useTheme } from 'providers/Theme';
import { useDispatch } from 'react-redux';
import { updateRequestProtoPath } from 'providers/ReduxStore/slices/collections';
import { openCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import toast from 'react-hot-toast';
import Dropdown from 'components/Dropdown/index';
import ToggleSwitch from 'components/ToggleSwitch/index';
import { TabNavigation, ProtoFilesTab, ImportPathsTab } from '../Tabs';
import useProtoFileManagement from 'hooks/useProtoFileManagement/index';
import StyledWrapper from './StyledWrapper';
import { useTranslation } from 'react-i18next';

const ProtoFileDropdown = ({
  collection,
  item,
  isReflectionMode,
  protoFilePath,
  showProtoDropdown,
  setShowProtoDropdown,
  onProtoDropdownCreate,
  onReflectionModeToggle,
  onProtoFileLoad
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('protofiles'); // 'protofiles' or 'importpaths'
  const protoFileManagement = useProtoFileManagement(collection, protoFilePath);
  const invalidProtoFiles = protoFileManagement.protoFiles.filter((file) => !file.exists);
  const invalidImportPaths = protoFileManagement.importPaths.filter((path) => !path.exists);

  const handleSelectProtoFile = async (e) => {
    e.stopPropagation();
    const { success, filePath, error } = await protoFileManagement.browseForProtoFile();
    if (!success) {
      if (error) {
        toast.error(t('GRPC.FAILED_BROWSE_PROTO', 'Failed to browse for proto file: {{message}}', { message: error.message }));
      }
      return;
    }

    const { success: addSuccess, relativePath, alreadyExists, error: addError } = await protoFileManagement.addProtoFileFromRequest(filePath);
    if (!addSuccess) {
      if (addError) {
        toast.error(t('GRPC.FAILED_ADD_PROTO', 'Failed to add proto file: {{message}}', { message: addError.message }));
      }
      return;
    }

    if (alreadyExists) {
      toast.error(t('GRPC.PROTO_ALREADY_EXISTS', 'Proto file already exists in collection settings'));
    } else {
      toast.success(t('GRPC.ADDED_PROTO_SUCCESS', 'Added proto file to collection'));
    }

    dispatch(updateRequestProtoPath({
      protoPath: relativePath,
      itemUid: item.uid,
      collectionUid: collection.uid
    }));

    setShowProtoDropdown(false);

    onProtoFileLoad(relativePath);
  };

  const handleSelectCollectionProtoFile = (protoFile) => {
    if (!protoFile || !protoFile.exists) {
      toast.error(t('GRPC.PROTO_NOT_FOUND', 'Proto file not found'));
      return;
    }

    setShowProtoDropdown(false);

    dispatch(updateRequestProtoPath({
      protoPath: protoFile.path,
      itemUid: item.uid,
      collectionUid: collection.uid
    }));

    onProtoFileLoad(protoFile.path);
  };

  const handleBrowseImportPath = async (e) => {
    e.stopPropagation();
    const { success, directoryPath, error } = await protoFileManagement.browseForImportDirectory();
    if (!success) {
      if (error) {
        toast.error(t('GRPC.FAILED_BROWSE_IMPORT', 'Failed to browse for import directory: {{message}}', { message: error.message }));
      }
      return;
    }

    const { success: addSuccess, error: addError } = await protoFileManagement.addImportPathFromRequest(directoryPath);
    if (!addSuccess) {
      if (addError) {
        toast.error(t('GRPC.FAILED_ADD_IMPORT', 'Failed to add import path: {{message}}', { message: addError.message }));
      }
      return;
    }

    toast.success(t('GRPC.ADDED_IMPORT_SUCCESS', 'Added import path to collection'));
  };

  const handleToggleImportPath = async (index) => {
    const { success, enabled, error } = await protoFileManagement.toggleImportPathFromRequest(index);
    if (!success) {
      if (error) {
        toast.error(t('GRPC.FAILED_TOGGLE_IMPORT', 'Failed to toggle import path: {{message}}', { message: error.message }));
      }
      return;
    }

    toast.success(t('GRPC.IMPORT_PATH_STATUS', 'Import path {{status}}', { status: enabled ? 'enabled' : 'disabled' }));
  };

  const handleOpenCollectionProtobufSettings = (e) => {
    e.stopPropagation();
    dispatch(openCollectionSettings(collection.uid, 'protobuf'));
  };

  const ProtoFileDropdownIcon = forwardRef((props, ref) => {
    return (
      <div ref={ref} className="proto-file-dropdown-container" onClick={() => setShowProtoDropdown((prev) => !prev)} data-testid="grpc-proto-file-dropdown-icon">
        {!isReflectionMode && (
          <IconFile size={20} strokeWidth={1.5} className="proto-file-dropdown-icon" />
        )}
        <span className="proto-file-dropdown-text">
          {isReflectionMode ? t('GRPC.USING_REFLECTION', 'Using Reflection') : (protoFilePath ? getBasename(collection.pathname, protoFilePath) : t('GRPC.SELECT_PROTO_FILE', 'Select Proto File'))}
        </span>
        <IconChevronDown className="proto-file-dropdown-caret" size={14} strokeWidth={2} />
      </div>
    );
  });

  return (
    <StyledWrapper>
      <div className="proto-file-dropdown">
        <Dropdown
          onCreate={onProtoDropdownCreate}
          icon={<ProtoFileDropdownIcon />}
          placement="bottom-end"
          visible={showProtoDropdown}
          onClickOutside={() => setShowProtoDropdown(false)}
          data-testid="grpc-proto-file-dropdown"
        >
          <div className="proto-file-dropdown-content">
            <div className="proto-file-dropdown-mode-section" data-testid="grpc-mode-toggle">
              <div className="proto-file-dropdown-mode-controls">
                <span>{t('GRPC.MODE', 'Mode')}</span>
                <div className="proto-file-dropdown-mode-options">
                  <span className={`proto-file-dropdown-mode-option ${!isReflectionMode ? 'proto-file-dropdown-mode-option--active' : ''}`} style={{ color: !isReflectionMode ? theme.primary.text : undefined }}>
                    {t('GRPC.PROTO_FILE', 'Proto File')}
                  </span>
                  <ToggleSwitch
                    isOn={isReflectionMode}
                    handleToggle={onReflectionModeToggle}
                    size="2xs"
                    activeColor={theme.primary.solid}
                  />
                  <span className={`proto-file-dropdown-mode-option ${isReflectionMode ? 'proto-file-dropdown-mode-option--active' : ''}`} style={{ color: isReflectionMode ? theme.primary.text : undefined }}>
                    {t('GRPC.REFLECTION', 'Reflection')}
                  </span>
                </div>
              </div>
            </div>

            {!isReflectionMode && (
              <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                collectionProtoFiles={protoFileManagement.protoFiles}
                collectionImportPaths={protoFileManagement.importPaths}
              />
            )}

            {!isReflectionMode && (
              <>
                {activeTab === 'protofiles' && (
                  <ProtoFilesTab
                    collectionProtoFiles={protoFileManagement.protoFiles}
                    invalidProtoFiles={invalidProtoFiles}
                    protoFilePath={protoFilePath}
                    collection={collection}
                    onSelectCollectionProtoFile={handleSelectCollectionProtoFile}
                    onOpenCollectionProtobufSettings={handleOpenCollectionProtobufSettings}
                    onSelectProtoFile={handleSelectProtoFile}
                    setShowProtoDropdown={setShowProtoDropdown}
                  />
                )}

                {activeTab === 'importpaths' && (
                  <ImportPathsTab
                    collectionImportPaths={protoFileManagement.importPaths}
                    invalidImportPaths={invalidImportPaths}
                    onOpenCollectionProtobufSettings={handleOpenCollectionProtobufSettings}
                    onBrowseImportPath={handleBrowseImportPath}
                    onToggleImportPath={handleToggleImportPath}
                  />
                )}
              </>
            )}

            {isReflectionMode && (
              <div className="proto-file-dropdown-reflection-message">
                {t('GRPC.USING_REFLECTION_MESSAGE', 'Using server reflection to discover gRPC methods.')}
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </StyledWrapper>
  );
};

export default ProtoFileDropdown;

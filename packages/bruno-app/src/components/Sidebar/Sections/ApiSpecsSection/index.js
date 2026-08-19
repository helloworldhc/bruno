import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { IconFileCode, IconPlus } from '@tabler/icons';

import { openApiSpec } from 'providers/ReduxStore/slices/apiSpec';
import MenuDropdown from 'ui/MenuDropdown';
import ActionIcon from 'ui/ActionIcon';
import CreateApiSpec from 'components/Sidebar/ApiSpecs/CreateApiSpec';
import ApiSpecs from 'components/Sidebar/ApiSpecs';
import SidebarSection from 'components/Sidebar/SidebarSection';
import { useTranslation } from 'react-i18next';

const ApiSpecsSection = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [createApiSpecModalOpen, setCreateApiSpecModalOpen] = useState(false);

  const handleOpenApiSpec = () => {
    dispatch(openApiSpec()).catch((err) => {
      console.error(err);
      toast.error(t('API_SPEC.ERROR_OPENING', 'An error occurred while opening the API spec'));
    });
  };

  const addDropdownItems = [
    {
      id: 'create-api-spec',
      leftSection: IconPlus,
      label: t('API_SPEC.CREATE_API_SPEC', 'Create API Spec'),
      onClick: () => {
        setCreateApiSpecModalOpen(true);
      }
    },
    {
      id: 'open-api-spec',
      leftSection: IconFileCode,
      label: t('API_SPEC.OPEN_API_SPEC', 'Open API Spec'),
      onClick: () => {
        handleOpenApiSpec();
      }
    }
  ];

  const sectionActions = (
    <>
      <MenuDropdown
        data-testid="api-specs-header-add-menu"
        items={addDropdownItems}
        placement="bottom-end"
      >
        <ActionIcon
          label={t('API_SPEC.ADD_NEW_API_SPEC', 'Add new API Spec')}
        >
          <IconPlus size={14} stroke={1.5} aria-hidden="true" />
        </ActionIcon>
      </MenuDropdown>
    </>
  );

  return (
    <>
      {createApiSpecModalOpen && (
        <CreateApiSpec
          onClose={() => setCreateApiSpecModalOpen(false)}
        />
      )}
      <SidebarSection
        id="api-specs"
        title={t('API_SPEC.API_SPECS', 'API Specs')}
        icon={IconFileCode}
        actions={sectionActions}
        className="api-specs-section"
      >
        <ApiSpecs />
      </SidebarSection>
    </>
  );
};

export default ApiSpecsSection;

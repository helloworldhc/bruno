import classnames from 'classnames';
import { IconDotsVertical } from '@tabler/icons';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Dropdown from 'components/Dropdown';
import { TABS } from '../hooks/useNotifications';

const MenuIcon = () => {
  const { t } = useTranslation();
  return (
    <span className="notif-menu-trigger" aria-label={t('NOTIFICATIONS.MENU_ARIA', 'Notifications menu')}>
      <IconDotsVertical size={16} strokeWidth={1.5} />
    </span>
  );
};

const NotificationTabs = ({ activeTab, unreadCount, onTabChange, onMarkAllRead, onClearAll }) => {
  const { t } = useTranslation();
  const dropdownTippyRef = useRef(null);
  const onDropdownCreate = (ref) => (dropdownTippyRef.current = ref);
  const hideDropdown = () => dropdownTippyRef.current?.hide();

  // Clicks inside the detail iframe don't bubble to the parent document, so
  // tippy's outside-click dismissal never fires. Closing on iframe focus covers it.
  useEffect(() => {
    const onWindowBlur = () => {
      if (document.activeElement?.tagName === 'IFRAME') {
        hideDropdown();
      }
    };
    window.addEventListener('blur', onWindowBlur);
    return () => window.removeEventListener('blur', onWindowBlur);
  }, []);

  return (
    <div className="notif-tabs">
      <div className="notif-tab-group">
        <button
          type="button"
          className={classnames('notif-tab', { active: activeTab === TABS.ALL })}
          onClick={() => onTabChange(TABS.ALL)}
        >
          {t('NOTIFICATIONS.ALL', 'All')}
        </button>
        <button
          type="button"
          className={classnames('notif-tab', { active: activeTab === TABS.UNREAD })}
          onClick={() => onTabChange(TABS.UNREAD)}
        >
          {t('NOTIFICATIONS.UNREAD', 'Unread')}
          {unreadCount > 0 && <span className="notif-tab-badge">{unreadCount}</span>}
        </button>
      </div>
      <Dropdown icon={<MenuIcon />} placement="bottom-end" onCreate={onDropdownCreate}>
        <div
          className={classnames('dropdown-item', { disabled: unreadCount === 0 })}
          onClick={() => {
            if (unreadCount === 0) return;
            hideDropdown();
            onMarkAllRead();
          }}
        >
          {t('NOTIFICATIONS.MARK_ALL_AS_READ', 'Mark all as read')}
        </div>
        <div
          className="dropdown-item"
          onClick={() => {
            hideDropdown();
            onClearAll();
          }}
        >
          {t('NOTIFICATIONS.CLEAR_ALL', 'Clear all')}
        </div>
      </Dropdown>
    </div>
  );
};

export default NotificationTabs;

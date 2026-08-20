import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CollapsibleDiffRow from '../CollapsibleDiffRow';
import StyledWrapper from './StyledWrapper';

/**
 * VisualDiffContent - Presentational component for rendering visual diffs
 *
 * This is a reusable component that renders the visual diff UI.
 * It can be used by:
 * - Git VisualDiffViewer (for git diffs)
 * - OpenAPI ChangeSection (for spec diffs)
 *
 * Props:
 * - oldData: The "before" data
 * - newData: The "after" data
 * - sections: Array of section configs { key, title, Component, hasContent }
 * - sectionHasChanges: Function (sectionKey, oldData, newData) => boolean
 * - oldLabel: Label for the left/old pane (default: "Before")
 * - newLabel: Label for the right/new pane (default: "After")
 * - hideUnchanged: Hide sections without changes entirely (default: false)
 */
const VisualDiffContent = ({
  oldData,
  newData,
  sections,
  sectionHasChanges,
  oldLabel,
  newLabel,
  hideUnchanged = false
}) => {
  const { t } = useTranslation();
  const effectiveOldLabel = oldLabel || t('GIT.BEFORE', 'Before');
  const effectiveNewLabel = newLabel || t('GIT.AFTER', 'After');
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (sectionKey) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Auto-collapse unchanged sections (collapsed but still visible)
  useEffect(() => {
    if (!sectionHasChanges || (!oldData && !newData)) return;

    const initialCollapsed = {};
    sections.forEach(({ key }) => {
      const hasChanges = sectionHasChanges(key, oldData, newData);
      initialCollapsed[key] = !hasChanges;
    });

    setCollapsedSections(initialCollapsed);
  }, [oldData, newData, sections, sectionHasChanges]);

  if (!oldData && !newData) {
    return (
      <StyledWrapper>
        <div className="empty-state">
          {t('GIT.NO_CONTENT_TO_DISPLAY', 'No content to display')}
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <div className="diff-header-labels">
        <div className="diff-label-left">{effectiveOldLabel}</div>
        <div className="diff-label-right">{effectiveNewLabel}</div>
      </div>
      <div className="visual-diff-content">
        <div className="diff-sections">
          {sections.map(({ key, title, Component, hasContent: checkContent }) => {
            const hasOld = oldData && checkContent(oldData);
            const hasNew = newData && checkContent(newData);

            if (!hasOld && !hasNew) {
              return null;
            }

            // Hide sections without changes entirely when hideUnchanged is enabled
            if (hideUnchanged && sectionHasChanges && !sectionHasChanges(key, oldData, newData)) {
              return null;
            }

            return (
              <CollapsibleDiffRow
                key={key}
                title={title}
                isCollapsed={collapsedSections[key] || false}
                onToggle={() => toggleSection(key)}
                hasOldContent={hasOld}
                hasNewContent={hasNew}
                oldContent={
                  <Component oldData={oldData} newData={newData} showSide="old" />
                }
                newContent={
                  <Component oldData={oldData} newData={newData} showSide="new" />
                }
              />
            );
          })}
        </div>
      </div>
    </StyledWrapper>
  );
};

export default VisualDiffContent;

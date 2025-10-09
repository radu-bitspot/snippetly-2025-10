import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Navbar,
  Alignment,
  AnchorButton,
  Button,
  NavbarDivider,
  EditableText,
  Popover,
} from '@blueprintjs/core';

import FaGithub from '@meronex/icons/fa/FaGithub';
import FaDiscord from '@meronex/icons/fa/FaDiscord';
import FaTwitter from '@meronex/icons/fa/FaTwitter';
import BiCodeBlock from '@meronex/icons/bi/BiCodeBlock';
import MdcCloudAlert from '@meronex/icons/mdc/MdcCloudAlert';
import MdcCloudCheck from '@meronex/icons/mdc/MdcCloudCheck';
import MdcCloudSync from '@meronex/icons/mdc/MdcCloudSync';
import styled from 'polotno/utils/styled';

import { useProject } from '../project';

import { FileMenu } from './file-menu';
import { DownloadButton } from './download-button';
import { PostProcessButton } from './post-process-button';
import { UserMenu } from './user-menu';
import { CloudWarning } from '../cloud-warning';

const NavbarContainer = styled('div')`
  white-space: nowrap;

  @media screen and (max-width: 500px) {
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 100vw;
  }
`;

const NavInner = styled('div')`
  @media screen and (max-width: 500px) {
    display: flex;
  }
`;

const Status = observer(({ project }) => {
  const Icon = !project.cloudEnabled
    ? MdcCloudAlert
    : project.status === 'saved'
    ? MdcCloudCheck
    : MdcCloudSync;
  return (
    <Popover
      content={
        <div style={{ padding: '10px', maxWidth: '300px' }}>
          {!project.cloudEnabled && (
            <CloudWarning style={{ padding: '10px' }} />
          )}
          {project.cloudEnabled && project.status === 'saved' && (
            <>
              Your design is safely saved in the cloud
            </>
          )}
          {project.cloudEnabled &&
            (project.status === 'saving' || project.status === 'has-changes') &&
            'Saving...'}
        </div>
      }
      interactionKind="hover"
    >
      <div style={{ padding: '0 5px' }}>
        <Icon className="bp5-icon" style={{ fontSize: '25px', opacity: 0.8 }} />
      </div>
    </Popover>
  );
});

export default observer(({ store, onBackToHome }) => {
  const project = useProject();

  return (
    <NavbarContainer className="bp5-navbar">
      <NavInner>
        <Navbar.Group align={Alignment.LEFT}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingRight: '20px',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginRight: '15px',
                letterSpacing: '-0.5px',
              }}
            >
              Snippetly Studio
            </div>
          </div>
          <NavbarDivider />
          <Button
            icon="document"
            text="New Design"
            onClick={() => {
              if (window.confirm('Create a new design? Unsaved changes will be lost.')) {
                window.location.reload();
              }
            }}
            style={{
              marginRight: '10px',
              background: '#ffffff',
              color: '#000000',
              fontWeight: '600',
              fontSize: '14px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '2px solid #000000',
              transition: 'all 0.3s ease',
            }}
          />
          {onBackToHome && (
            <>
              <Button
                icon="flash"
                text="✨ Simple Mode"
                onClick={onBackToHome}
                style={{ 
                  marginRight: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '15px',
                  padding: '8px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              />
              <NavbarDivider />
            </>
          )}
          <FileMenu store={store} project={project} />
          <div
            style={{
              paddingLeft: '20px',
              maxWidth: '200px',
            }}
          >
            <EditableText
              value={window.project.name}
              placeholder="Design name"
              onChange={(name) => {
                window.project.name = name;
                window.project.requestSave();
              }}
            />
          </div>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          {/* Removed cloud status and Help button as requested */}
          <DownloadButton store={store} />
          <UserMenu store={store} project={project} />
        </Navbar.Group>
      </NavInner>
    </NavbarContainer>
  );
});

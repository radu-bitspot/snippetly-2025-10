import React from 'react';
import { observer } from 'mobx-react-lite';
import { Spinner } from '@blueprintjs/core';

import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { SidePanel, DEFAULT_SECTIONS } from 'polotno/side-panel';
import { Workspace } from 'polotno/canvas/workspace';
import { PagesTimeline } from 'polotno/pages-timeline';
import { setTranslations } from 'polotno/config';

import { loadFile } from './file';

import { QrSection } from './sections/qr-section';
import { QuotesSection } from './sections/quotes-section';
import { IconsSection } from './sections/icons-section';
import { ShapesSection } from './sections/shapes-section';
import { StableDiffusionSection } from './sections/stable-diffusion-section';
import { MyDesignsSection } from './sections/my-designs-section';
import { SummarizeSection } from './sections/summarize-section';
import { UploadSection } from './sections/upload-section';

import { useProject } from './project';

import fr from './translations/fr';
import en from './translations/en';
import id from './translations/id';
import ru from './translations/ru';
import ptBr from './translations/pt-br';
import zhCh from './translations/zh-ch';

import Topbar from './topbar/topbar';

// Import Auth Provider and components
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import LoadingScreen from './components/LoadingScreen';

// load default translations
setTranslations(en);

// Creez un array complet nou pentru secțiuni pentru a evita conflictele
console.log('🔧 Creez secțiuni noi...');

// Găsesc secțiunile de bază (text, background, etc.) fără upload și my-designs
const originalSections = DEFAULT_SECTIONS.filter(section => {
  const isUpload = section.name === 'upload' || 
                   section.name === 'Upload' ||
                   (section.Tab && section.Tab.name === 'upload');
  const isMyDesigns = section.name === 'my-designs';
  return !isUpload && !isMyDesigns;
});

// Înlocuiesc elements cu shapes în copie
const cleanedSections = originalSections.map(section => {
  if (section.name === 'elements') {
    return ShapesSection;
  }
  return section;
});

// Creez array-ul final fără să modific DEFAULT_SECTIONS direct
const FINAL_SECTIONS = [
  MyDesignsSection,      // Prima secțiune
  UploadSection,         // Upload personalizat  
  ...cleanedSections,    // Secțiunile de bază
  IconsSection,          // Icoane
  QuotesSection,         // Citate
  QrSection,             // QR codes
  StableDiffusionSection, // AI art
  SummarizeSection       // Summarize
];

console.log('✅ Secțiuni finale:', FINAL_SECTIONS.map(s => s.name || 'unnamed'));

const isStandalone = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone
  );
};

const getOffsetHeight = () => {
  let safeAreaInsetBottom = 0;

  if (isStandalone()) {
    const safeAreaInsetBottomString = getComputedStyle(
      document.documentElement
    ).getPropertyValue('env(safe-area-inset-bottom)');
    if (safeAreaInsetBottomString) {
      safeAreaInsetBottom = parseFloat(safeAreaInsetBottomString);
    }

    if (!safeAreaInsetBottom) {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (/iPhone|iPad|iPod/i.test(userAgent) && !window.MSStream) {
        safeAreaInsetBottom = 20;
      }
    }
  }

  return window.innerHeight - safeAreaInsetBottom;
};

const useHeight = () => {
  const [height, setHeight] = React.useState(getOffsetHeight());
  React.useEffect(() => {
    window.addEventListener('resize', () => {
      setHeight(getOffsetHeight());
    });
  }, []);
  return height;
};

// Main Polotno Studio Component - only shown when authenticated
const PolotnoStudio = observer(({ store }) => {
  const project = useProject();
  const height = useHeight();

  React.useEffect(() => {
    if (project.language.startsWith('fr')) {
      setTranslations(fr, { validate: true });
    } else if (project.language.startsWith('id')) {
      setTranslations(id, { validate: true });
    } else if (project.language.startsWith('ru')) {
      setTranslations(ru, { validate: true });
    } else if (project.language.startsWith('pt')) {
      setTranslations(ptBr, { validate: true });
    } else if (project.language.startsWith('zh')) {
      setTranslations(zhCh, { validate: true });
    } else {
      setTranslations(en, { validate: true });
    }
  }, [project.language]);

  React.useEffect(() => {
    project.firstLoad();
  }, []);

  // Handle paste from external sources (Ctrl+V with text from clipboard)
  React.useEffect(() => {
    const handlePaste = (e) => {
      const activeElement = document.activeElement;
      const isEditingText = activeElement.tagName === 'TEXTAREA' || 
                           activeElement.tagName === 'INPUT' ||
                           activeElement.isContentEditable ||
                           activeElement.getAttribute('contenteditable') === 'true';
      
      if (isEditingText) {
        return;
      }

      let text = null;
      
      if (e.clipboardData) {
        text = e.clipboardData.getData('text/plain');
      }
      
      if (text && text.trim() && !text.startsWith('{') && !text.includes('"type"')) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('📋 External text detected:', text.substring(0, 50));
        
        const width = Math.min(400, store.width - 40);
        const newElement = store.activePage.addElement({
          type: 'text',
          text: text.trim(),
          width,
          x: store.width / 2 - width / 2,
          y: store.height / 2 - 50,
          fontFamily: 'Inter',
          fontSize: 16,
          lineHeight: 1.4,
          align: 'left',
          fill: '#000000'
        });
        
        if (newElement) {
          store.selectElements([newElement.id]);
        }
        
        console.log('✅ Text pasted from external clipboard');
        return false;
      }
    };

    document.addEventListener('paste', handlePaste, true);
    return () => document.removeEventListener('paste', handlePaste, true);
  }, [store]);

  const handleDrop = (ev) => {
    ev.preventDefault();

    if (ev.dataTransfer.files.length !== ev.dataTransfer.items.length) {
      return;
    }
    for (let i = 0; i < ev.dataTransfer.files.length; i++) {
      loadFile(ev.dataTransfer.files[i], store);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: height + 'px',
        display: 'flex',
        flexDirection: 'column',
      }}
      onDrop={handleDrop}
    >
      <Topbar store={store} />
      <div style={{ height: 'calc(100% - 50px)' }}>
        <PolotnoContainer className="polotno-app-container">
          <SidePanelWrap>
            <SidePanel store={store} sections={FINAL_SECTIONS} defaultSection={"my-designs"} />
          </SidePanelWrap>
          <WorkspaceWrap>
            <Toolbar store={store} />
            <Workspace store={store} components={{ Watermark: () => null }} />
            <ZoomButtons store={store} />
            <PagesTimeline store={store} />
          </WorkspaceWrap>
        </PolotnoContainer>
      </div>
      {project.status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
            }}
          >
            <Spinner />
          </div>
        </div>
      )}
    </div>
  );
});

// Auth-protected App Content
const AppContent = ({ store }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <PolotnoStudio store={store} />;
};

// Main App component with AuthProvider
const App = ({ store }) => {
  return (
    <AuthProvider>
      <AppContent store={store} />
    </AuthProvider>
  );
};

export default App;

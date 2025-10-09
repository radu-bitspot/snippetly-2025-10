import React from 'react';
import { observer } from 'mobx-react-lite';
import { Spinner } from '@blueprintjs/core';

import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { SidePanel, DEFAULT_SECTIONS} from 'polotno/side-panel';
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
import LandingPage from './pages/LandingPage';

// load default translations
setTranslations(en);

// Creez un array complet nou pentru secțiuni pentru a evita conflictele

// Găsesc secțiunile de bază (text, background, etc.) fără upload și my-designs
const originalSections = DEFAULT_SECTIONS.filter(section => {
  const isUpload = section.name === 'upload' || 
                   section.name === 'Upload' ||
                   (section.Tab && section.Tab.name === 'upload');
  const isMyDesigns = section.name === 'my-designs';
  return !isUpload && !isMyDesigns;
});

// Înlocuiesc elements cu shapes în copie
const toBeRemovedSections = ['templates', 'photos', 'background', 'elements'];
const cleanedSections = originalSections
  .filter(section => !toBeRemovedSections.includes(section.name));

const FINAL_SECTIONS = [
  SummarizeSection,       // Summarize
  MyDesignsSection,      // Prima secțiune
  UploadSection,         // Upload personalizat
  ShapesSection,  
  StableDiffusionSection, // AI art
  ...cleanedSections,    // Secțiunile de bază
];

const isStandalone = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone
  );
};

const getOffsetHeight = () => {
  let safeAreaInsetBottom = 0;

  if (isStandalone()) {
    // Try to get the safe area inset using env() variables
    const safeAreaInsetBottomString = getComputedStyle(
      document.documentElement
    ).getPropertyValue('env(safe-area-inset-bottom)');
    if (safeAreaInsetBottomString) {
      safeAreaInsetBottom = parseFloat(safeAreaInsetBottomString);
    }

    // Fallback values for specific devices if env() is not supported
    if (!safeAreaInsetBottom) {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (/iPhone|iPad|iPod/i.test(userAgent) && !window.MSStream) {
        // This is an approximation; you might need to adjust this value based on testing
        safeAreaInsetBottom = 20; // Example fallback value for iPhone
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
  const [showLanding, setShowLanding] = React.useState(true); // Start with Simple Mode (landing page)
  const [selectedTemplate, setSelectedTemplate] = React.useState(null);
  const [defaultSection, setDefaultSection] = React.useState("my-designs"); // Dynamic default section

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

  const handleStartFromTemplate = async (template) => {
    setSelectedTemplate(template);
    
    // If a design is selected, DUPLICATE it (don't modify original!)
    if (template.selectedDesign) {
      console.log('📂 Duplicating design:', template.selectedDesign.id);
      
      // Load the design structure
      const { storeJSON } = await api.loadById({ id: template.selectedDesign.id });
      
      // Clear store and load the JSON (this duplicates the design)
      store.clear();
      if (storeJSON) {
        store.loadJSON(storeJSON);
        console.log('📂 Design structure duplicated, pages:', store.pages.length);
      }
      
      // Now apply AI content to pages
      if (template.content && template.content.length > 0) {
        const pages = store.pages || [];
        console.log('📝 Applying AI content to', pages.length, 'pages');
        
        pages.forEach((page, pageIndex) => {
          const slideIndex = pageIndex % template.content.length;
          const slideContent = template.content[slideIndex];
          
          if (slideContent) {
            const content = slideContent.variations?.[0]?.content || 
                           slideContent.content || 
                           slideContent.text;
            
            console.log('📝 Slide content for page', pageIndex + 1, ':', content?.substring(0, 50) + '...');
            
            // Find text elements and replace content
            const textElements = page.children?.filter(el => el.type === 'text') || [];
            if (textElements.length > 0 && content) {
              textElements[0].set({ text: content });
              console.log('✅ Page', pageIndex + 1, 'updated with AI content');
            } else if (content) {
              // If no text element, create one
              page.addElement({
                type: 'text',
                text: content,
                x: 50,
                y: 100,
                width: store.width - 100,
                fontSize: 20,
                fill: '#2d3748',
                lineHeight: 1.5
              });
              console.log('✅ Page', pageIndex + 1, 'created text element with AI content');
            }
          }
        });
      }
      
      // Set as NEW design (no ID = will create new on save)
      project.id = '';
      project.name = template.title || 'Duplicated Design';
      
      // Set tags
      const tags = [...(template.selectedDesign.tags || [])];
      if (template.outputType && !tags.includes(template.outputType)) {
        tags.push(template.outputType);
      }
      project.tags = tags;
      console.log('📋 New design tags:', tags);
      
    } else {
      // Clear the store and add pages based on template
      store.clear();
      
      // Set page dimensions if format is provided
      if (template.format) {
        store.setSize(template.format.width, template.format.height);
      }
      
      // Add the number of pages specified in template
      for (let i = 0; i < template.slides; i++) {
        store.addPage();

      // Skip adding content if this is a blank template
      if (template.id === 'blank') {
        continue; // Just create empty pages
      }

      // Add template-specific content
      const page = store.pages[i];

      // If we have AI-generated content, use it
      if (template.content && template.content.length > 0) {
        console.log(`📝 Processing page ${i + 1} of ${template.slides}`);
        console.log('📝 Available content slides:', template.content.length);

        // Ciclează prin slide-uri dacă sunt mai multe pagini decât slide-uri
        const slideIndex = i % template.content.length;
        const slideContent = template.content[slideIndex];

        console.log(`📝 Slide ${i + 1} using content index ${slideIndex}:`, slideContent);

        if (slideContent) {
          // Extrage conținutul (poate avea variations pentru diferite tone-uri)
          const content = slideContent.variations?.[0]?.content ||
                         slideContent.content ||
                         slideContent.text ||
                         `Slide ${i + 1}`;

          const title = slideContent.title ||
                       slideContent.variations?.[0]?.title ||
                       null;

          console.log(`📝 Extracted - Title: "${title}", Content: "${content?.substring(0, 100)}..."`);

          // Add title if exists
          if (title) {
            page.addElement({
              type: 'text',
              text: title,
              x: 50,
              y: 50,
              width: store.width - 100,
              fontSize: 40,
              fontWeight: 'bold',
              fill: '#2d3748',
              align: 'center'
            });
            console.log(`✅ Added title to page ${i + 1}`);
          }

          // Add main content
          if (content) {
            page.addElement({
              type: 'text',
              text: content,
              x: 50,
              y: title ? 150 : 100,
              width: store.width - 100,
              fontSize: 20,
              fill: '#4a5568',
              lineHeight: 1.5,
              align: 'left'
            });
            console.log(`✅ Added content to page ${i + 1}`);
          } else {
            console.warn(`⚠️ No content found for page ${i + 1}`);
          }
        } else {
          console.warn(`⚠️ No slide content at index ${slideIndex} for page ${i + 1}`);
        }
        } else {
          console.log(`📝 Page ${i + 1} - No AI content available, creating blank page`);
        }
      }
      
      // Set as NEW design (no ID = will create new on save)
      project.id = '';
      project.name = template.title || 'Untitled Presentation';

      // Set tags based on template
      const tags = [];
      if (template.format) {
        tags.push(template.format.id); // 'instagram', 'facebook', 'tiktok', etc.
      }
      if (template.outputType) {
        tags.push(template.outputType); // 'story-teaser', 'key-points', etc.
      }
      project.tags = tags;
      console.log('📋 Project tags set:', tags);
    }
    
    // Hide landing page and show editor FIRST
    setShowLanding(false);

    // Prevent auto-save from creating a brand-new draft immediately
    // Take a snapshot of current store so first autosave is skipped until user edits
    try {
      project.lastSavedJSON = JSON.stringify(store.toJSON());
      if (project.saveTimeout) {
        clearTimeout(project.saveTimeout);
        project.saveTimeout = null;
      }
      project.status = 'saved';
    } catch (e) {
      console.warn('Could not sync lastSavedJSON after template start:', e);
    }

    // If we have AI content, prepare it for Summarize tab
    if (template.content && template.content.length > 0) {
      console.log('🤖 AI content detected, preparing Summarize tab...');

      // Set default section to summarize when AI content is present
      setDefaultSection("summarize");

      // Wait for workspace to mount, then trigger Summarize tab
      setTimeout(() => {
        try {
          // Store AI response in localStorage for Summarize tab to pick up
          const aiData = {
            slides: template.content,
            title: template.title,
            outputType: template.outputType,
            timestamp: Date.now(),
            autoApply: true // Flag to auto-apply on Summarize tab
          };

          localStorage.setItem('summarize_ai_handoff', JSON.stringify(aiData));
          console.log('🤖 AI data stored for Summarize tab:', aiData);

          // Dispatch event to notify Summarize tab
          window.dispatchEvent(new CustomEvent('aiContentReady', { detail: aiData }));
          console.log('🤖 Event dispatched: aiContentReady');

        } catch (e) {
          console.error('❌ Failed to prepare AI content:', e);
        }
      }, 100);
    }

    // DON'T auto-save here - let the normal auto-save mechanism handle it
    // This prevents creating duplicate designs on refresh
    console.log('⏭️ Skipping immediate save - auto-save will handle it if needed');
  };

  const handleSkipToEditor = () => {
    setShowLanding(false);
  };

  const handleBackToLanding = () => {
    setShowLanding(true);
  };

  // Show landing page first
  if (showLanding) {
    return (
      <LandingPage 
        onStart={handleStartFromTemplate}
      />
    );
  }

  const handleDrop = (ev) => {
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    // skip the case if we dropped DOM element from side panel
    // in that case Safari will have more data in "items"
    if (ev.dataTransfer.files.length !== ev.dataTransfer.items.length) {
      return;
    }
    // Use DataTransfer interface to access the file(s)
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
      <Topbar store={store} onBackToHome={handleBackToLanding} />
      <div style={{ height: 'calc(100% - 50px)' }}>
        <PolotnoContainer className="polotno-app-container">
          <SidePanelWrap>
            <SidePanel store={store} sections={FINAL_SECTIONS} defaultSection={defaultSection} />
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

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show main app if authenticated
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

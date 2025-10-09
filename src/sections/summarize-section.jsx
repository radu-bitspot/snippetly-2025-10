import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { TextArea, Card, Button, InputGroup } from '@blueprintjs/core';

import { SectionTab } from 'polotno/side-panel';

// ============================================
// CONSTANTE - Configurări de bază ale aplicației
// ============================================

// Tipurile de output disponibile pentru AI - ce poate să genereze
const OUTPUT_TYPES = [
  { id: 'story-teaser', name: 'Story Teaser', description: 'Engaging story preview' },
  { id: 'key-points-carousel', name: 'Key Points Carousel', description: 'Bulleted points in carousel format' },
  { id: 'did-you-know', name: 'Did You Know?', description: 'Interesting facts format' },
  { id: 'timeline', name: 'Timeline', description: 'Chronological format' }
];

// Tonurile disponibile pentru conținut - stilul de scriere
const TONE_TYPES = [
  { value: 'FORMAL-AUTORITAR', label: 'Formal Autoritar' },
  { value: 'ACCESIBIL-EDUCAȚIONAL', label: 'Accesibil Educațional' },
  { value: 'MOBILIZATOR-CETĂȚENESC', label: 'Mobilizator Cetățenesc' },
  { value: 'CRITIC-REVELATOR', label: 'Critic Revelator' }
];

// URL-ul webhook-ului pentru generarea de conținut AI
const WEBHOOK_URL = 'http://79.137.67.72:5678/webhook/4ae9444d-23e0-4743-a197-1bc1e423df8f';
// Numărul minim de caractere necesar pentru procesare
const MIN_CHARS = 20;

// ============================================
// STILURI - Aspectul vizual al componentelor
// ============================================

const styles = {
  container: { height: '100%', display: 'flex', flexDirection: 'column' },
  section: { padding: '15px' },
  title: { fontSize: '14px', marginBottom: '10px', opacity: 0.8 },
  input: { width: '100%', marginBottom: '15px' },
  dropdown: { width: '100%', padding: '8px', fontSize: '14px', backgroundColor: '#30404d', color: '#f5f8fa', border: '1px solid #394b59', borderRadius: '4px', marginBottom: '5px' },
  buttonGroup: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' },
  textArea: { width: '100%', minHeight: '100px', marginBottom: '8px', resize: 'vertical' },
  counter: { fontSize: '12px', opacity: 0.7, marginBottom: '15px', textAlign: 'right' },
  error: { color: '#f55656', fontSize: '12px', marginTop: '8px', padding: '8px', background: 'rgba(245, 86, 86, 0.1)', borderRadius: '4px' },
  responseSection: { padding: '15px', borderTop: '1px solid #394b59', flex: 1, overflow: 'auto' },
  contentBox: { width: '100%', minHeight: '60px', padding: '8px', backgroundColor: '#30404d', border: '1px solid #394b59', borderRadius: '4px', color: '#f5f8fa', fontSize: '14px', lineHeight: '1.4', whiteSpace: 'pre-wrap', marginBottom: '8px' },
  addButton: { marginTop: '5px', backgroundColor: '#26de81', color: '#ffffff', fontWeight: '600' },
  emptyState: { padding: '20px', textAlign: 'center', opacity: 0.6, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

// ============================================
// HOOKS PERSONALIZATE - Logica reutilizabilă
// ============================================

// Hook pentru gestionarea stării aplicației - toate variabilele într-un loc
const useAppState = () => {
  const [state, setState] = useState({
    loading: false,              // Dacă se încarcă ceva
    inputText: '',              // Textul introdus de user
    title: '',                  // Titlul pentru conținut
    outputType: 'story-teaser', // Tipul de output selectat
    selectedTone: 'FORMAL-AUTORITAR', // Tonul selectat
    responseData: null,         // Răspunsul de la AI
    storyTeasers: [],          // Lista de story teasers din DB
    selectedStoryTeaser: '',   // Story teaser-ul selectat
    loadingTeasers: false,     // Dacă se încarcă teasers
    error: ''                  // Mesajul de eroare
  });

  // Funcție pentru a actualiza state-ul - evită multiple setState
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return [state, updateState];
};

// Hook pentru persistența datelor - salvează/încarcă din localStorage
const usePersistence = () => {
  // Salvează datele în localStorage cu timestamp
  const save = useCallback((data) => {
    try {
      localStorage.setItem('summarize_state', JSON.stringify({ ...data, timestamp: Date.now() }));
    } catch (e) { console.warn('Save failed:', e); }
  }, []);

  // Restaurează datele din localStorage (doar dacă sunt mai noi de 24h)
  const restore = useCallback(() => {
    try {
      const saved = localStorage.getItem('summarize_state');
      if (!saved) return null;
      const data = JSON.parse(saved);
      // Verifică dacă datele nu sunt prea vechi (24 ore)
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('summarize_state');
        return null;
      }
      return data;
    } catch (e) { return null; }
  }, []);

  // Șterge datele salvate
  const clear = useCallback(() => {
    localStorage.removeItem('summarize_state');
  }, []);

  return { save, restore, clear };
};

// Hook pentru apelurile API - comunicarea cu serverul
const useAPI = () => {
  // Determină URL-ul de bază în funcție de environment
  const getBaseUrl = () => window.location.hostname === 'localhost' ? '/api' : 'http://79.137.67.72:8000/api';
  // Ia token-ul de autentificare din localStorage
  const getToken = () => localStorage.getItem('authToken');

  // Funcție pentru a încărca toate story teasers din baza de date
  const fetchTeasers = useCallback(async () => {
    const token = getToken();
    if (!token) return []; // Fără token = fără date

    try {
      let allTeasers = [];
      let nextUrl = `${getBaseUrl()}/story-teasers/`;
      
      // Iterează prin toate paginile de date (pagination)
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) break;
        const data = await response.json();
        
        // Gestionează diferite formate de răspuns
        if (data.results) {
          // Format cu paginare
          allTeasers = [...allTeasers, ...data.results];
          nextUrl = data.next;
        } else if (Array.isArray(data)) {
          // Format fără paginare
          allTeasers = [...allTeasers, ...data];
          nextUrl = null;
        } else break;
      }
      return allTeasers;
    } catch (error) {
      console.error('Fetch teasers error:', error);
      return [];
    }
  }, []);

  // Funcție pentru generarea de conținut cu AI prin webhook
  const generateSummary = useCallback(async (inputText, title, outputType) => {
    const token = getToken();
    let userId = null;

    // Încearcă să ia ID-ul utilizatorului pentru tracking
    if (token) {
      try {
        const userResponse = await fetch(`${getBaseUrl()}/auth/user/`, {
          headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData.id;
        }
      } catch (e) { console.warn('User fetch failed:', e); }
    }

    // Trimite cererea către webhook-ul AI
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: inputText,               // Textul de procesat
        title: title || 'Summary',    // Titlul conținutului
        type: outputType,             // Tipul de output dorit
        timestamp: new Date().toISOString(),
        userId,                       // ID-ul utilizatorului
        userToken: token              // Token-ul pentru autentificare
      })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    
    // Tracking pentru analytics - monitorizează generările AI
    if (window.store?.trackAIGeneration) {
      window.store.trackAIGeneration('content_summarization', result, {
        inputText: inputText.substring(0, 100) + '...',
        title, outputType, timestamp: new Date().toISOString()
      });
    }

    // Procesează răspunsul în diferite formate posibile
    if (Array.isArray(result) && result.length > 0 && result[0].output) {
      return result[0].output;
    } else if (result.output) {
      return result.output;
    } else {
      // Fallback pentru răspunsuri simple
      return { title: title || 'Summary', description: result.summary || result.text || 'Summary generated' };
    }
  }, []);

  return { fetchTeasers, generateSummary };
};

// Hook pentru integrarea cu canvas-ul - adaugă/modifică text pe pagini
const useCanvas = (store) => {
  // Funcție pentru a adăuga text pe canvas
  const addToCanvas = useCallback((text) => {
    if (!text) return;

    // Caută un element text selectat în diferite moduri
    let selectedTextElement = 
      store.selectedElements?.find(el => el.type === 'text') ||      // Prin selectedElements
      store.selection?.find(el => el.type === 'text') ||            // Prin selection
      store.activePage?.children?.filter(el => el.type === 'text')?.find(el => el.selected || el.isSelected); // Din pagina activă

    // Dacă există un element text selectat, înlocuiește textul
    if (selectedTextElement) {
      try {
        selectedTextElement.set({ text });
        console.log('✓ Text replaced');
        return;
      } catch (error) {
        console.error('Replace failed:', error);
      }
    }

    // Dacă nu există element selectat, creează unul nou
    try {
      const width = Math.min(400, store.width - 40); // Lățime adaptivă
      const newElement = store.activePage.addElement({
        type: 'text',
        text,
        width,
        x: store.width / 2 - width / 2,    // Centrat pe orizontală
        y: store.height / 2 - 50,          // Centrat pe verticală
        fontFamily: 'Inter',
        fontSize: 16,
        lineHeight: 1.4,
        align: 'left',
        fill: '#000000'
      });
      
      // Selectează elementul nou creat
      if (newElement && store.selectElements) {
        store.selectElements([newElement.id]);
      }
      console.log('✓ New text element created');
    } catch (error) {
      console.error('Create element failed:', error);
    }
  }, [store]);

  // Funcție pentru înlocuirea textului din toate paginile cu slide-urile generate
  const replaceAllPagesWithSlides = useCallback((slides, selectedTone) => {
    // Verificări de bază
    if (!slides || slides.length === 0) {
      console.warn('No slides available for replacement');
      return;
    }

    const pages = store.pages || [];
    if (pages.length === 0) {
      console.warn('No pages available');
      return;
    }

    console.log(`🚀 Starting replacement: ${slides.length} slides → ${pages.length} pages`);
    
    let replacedCount = 0;
    
    // Iterează prin toate paginile
    pages.forEach((page, pageIndex) => {
      // Ciclează prin slide-uri dacă sunt mai multe pagini decât slide-uri
      const slideIndex = pageIndex % slides.length;
      const slide = slides[slideIndex];
      
      // Extrage conținutul pentru tonul selectat
      const content = slide.variations?.find(v => v.toneType === selectedTone)?.content || 
                     slide.content || 
                     `Slide ${slide.slideNumber} content`;

      if (!content) {
        console.warn(`No content for slide ${slideIndex + 1}`);
        return;
      }

      // Caută primul element text din această pagină
      const textElements = page.children?.filter(el => el.type === 'text') || [];
      
      if (textElements.length > 0) {
        // Înlocuiește primul element text existent
        try {
          textElements[0].set({ text: content });
          replacedCount++;
          console.log(`✓ Page ${pageIndex + 1}: Replaced with slide ${slide.slideNumber}`);
        } catch (error) {
          console.error(`✗ Page ${pageIndex + 1}: Replace failed:`, error);
        }
      } else {
        // Creează un element text nou pe această pagină
        try {
          const width = Math.min(400, store.width - 40);
          page.addElement({
            type: 'text',
            text: content,
            width,
            x: store.width / 2 - width / 2,
            y: store.height / 2 - 50,
            fontFamily: 'Inter',
            fontSize: 16,
            lineHeight: 1.4,
            align: 'left',
            fill: '#000000'
          });
          replacedCount++;
          console.log(`✓ Page ${pageIndex + 1}: Created new text with slide ${slide.slideNumber}`);
        } catch (error) {
          console.error(`✗ Page ${pageIndex + 1}: Create failed:`, error);
        }
      }
    });

    console.log(`🎉 Replacement complete: ${replacedCount}/${pages.length} pages updated`);
    
    // Tracking pentru analytics
    if (store.trackAnalytics) {
      store.trackAnalytics('bulk_page_replacement', {
        totalPages: pages.length,
        totalSlides: slides.length,
        replacedPages: replacedCount,
        selectedTone,
        source: 'ai_summarization'
      });
    }
  }, [store]);

  return { addToCanvas, replaceAllPagesWithSlides };
};

// ============================================
// COMPONENTA PRINCIPALĂ - Panelul de sumarizare
// ============================================
export const SummarizePanel = observer(({ store }) => {
  // Importă toate hook-urile personalizate
  const [state, updateState] = useAppState();                      // Starea aplicației
  const { save, restore, clear } = usePersistence();               // Persistența datelor
  const { fetchTeasers, generateSummary } = useAPI();              // Apelurile API
  const { addToCanvas, replaceAllPagesWithSlides } = useCanvas(store); // Canvas integration

  // Inițializarea componentei la primul render
  useEffect(() => {
    store.loadFont('Inter'); // Încarcă fontul Inter pentru canvas

    // Funcție pentru încărcarea datelor și restaurarea stării
    const loadData = async () => {
      updateState({ loadingTeasers: true });
      const teasers = await fetchTeasers();  // Încarcă story teasers din DB
      updateState({ storyTeasers: teasers, loadingTeasers: false });

      // Check for AI handoff from Landing Page
      const aiHandoff = localStorage.getItem('summarize_ai_handoff');
      if (aiHandoff) {
        try {
          const aiData = JSON.parse(aiHandoff);
          console.log('🤖 Summarize tab: AI handoff detected:', aiData);

          // Set the response data with AI content
          const responseData = {
            slides: aiData.slides,
            title: aiData.title
          };

          updateState({
            responseData,
            title: aiData.title || '',
            outputType: aiData.outputType || 'story-teaser',
            selectedTone: 'ACCESIBIL-EDUCAȚIONAL'
          });

          // Clear the handoff data
          localStorage.removeItem('summarize_ai_handoff');

          // Auto-apply to all pages if flag is set
          if (aiData.autoApply && aiData.slides && aiData.slides.length > 0) {
            console.log('🤖 Auto-applying AI content to all pages...');
            setTimeout(() => {
              replaceAllPagesWithSlides(aiData.slides, 'ACCESIBIL-EDUCAȚIONAL');
            }, 500);
          }

        } catch (e) {
          console.error('🤖 Failed to process AI handoff:', e);
        }
      } else {
        // Restaurează starea salvată anterior (dacă există și nu e AI handoff)
        const saved = restore();
        if (saved) {
          updateState({
            selectedStoryTeaser: saved.selectedStoryTeaser || '',
            responseData: saved.responseData || null,
            title: saved.title || '',
            outputType: saved.outputType || 'story-teaser'
          });
        }
      }
    };

    loadData();
  }, [store, fetchTeasers, restore, updateState, replaceAllPagesWithSlides]);

  // ============================================
  // FUNCȚII DE GESTIONARE A EVENIMENTELOR
  // ============================================

  // Funcția pentru generarea de conținut cu AI
  const handleGenerate = async () => {
    // Validează input-ul utilizatorului
    if (!state.inputText.trim() || state.inputText.length < MIN_CHARS) {
      updateState({ error: `Enter at least ${MIN_CHARS} characters` });
      return;
    }

    // Setează starea de loading și resetează erorile
    updateState({ loading: true, error: '', responseData: null });

    try {
      // Apelează API-ul pentru generarea de conținut
      const result = await generateSummary(state.inputText, state.title, state.outputType);
      updateState({ responseData: result });
      // Salvează rezultatul pentru persistență
      save({ selectedStoryTeaser: '', responseData: result, title: state.title, outputType: state.outputType });
    } catch (error) {
      console.error('Generation error:', error);
      updateState({ error: `Failed: ${error.message}` });
      
      // Fallback - creează un summary simplu local dacă API-ul nu funcționează
      const sentences = state.inputText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const fallback = { title: state.title || 'Summary', description: sentences.slice(0, 3).join('. ') + '.' };
      updateState({ responseData: fallback });
      save({ selectedStoryTeaser: '', responseData: fallback, title: state.title, outputType: state.outputType });
    } finally {
      updateState({ loading: false }); // Oprește loading-ul indiferent de rezultat
    }
  };

  // Funcția pentru selectarea unui story teaser din dropdown
  const handleTeaserSelect = (teaserId) => {
    if (!teaserId) {
      // Dacă nu e selectat nimic, resetează totul
      updateState({ selectedStoryTeaser: '', responseData: null });
      clear();
      return;
    }

    // Caută teaser-ul selectat în lista încărcată
    const teaser = state.storyTeasers.find(t => t.id === teaserId);
    if (teaser) {
      // Extrage conținutul JSON sau creează unul de fallback
      const responseData = teaser.content_json || { title: teaser.title, description: 'No content available' };
      updateState({
        selectedStoryTeaser: teaserId,
        responseData,
        title: teaser.title || '',
        outputType: teaser.type || 'story-teaser',
        error: ''
      });
      // Salvează selecția pentru persistență
      save({ selectedStoryTeaser: teaserId, responseData, title: teaser.title, outputType: teaser.type });
    }
  };

  // Funcția pentru ștergerea completă a conținutului
  const handleClear = () => {
    updateState({
      responseData: null,
      inputText: '',
      title: '',
      error: '',
      selectedStoryTeaser: ''
    });
    clear(); // Șterge și din localStorage
  };

  // Funcție helper pentru extragerea conținutului unui slide cu tonul specificat
  const getSlideContent = (slideNumber, toneType) => {
    const slide = state.responseData?.slides?.find(s => s.slideNumber === slideNumber);
    const variation = slide?.variations?.find(v => v.toneType === toneType);
    return variation?.content || '';
  };

  // ============================================
  // VALORI CALCULATE - Derivate din state pentru UI
  // ============================================
  const selectedType = OUTPUT_TYPES.find(type => type.id === state.outputType); // Tipul de output selectat
  const isDisabled = !state.inputText.trim() || state.inputText.length < MIN_CHARS; // Dacă butonul Generate e disabled
  const charCount = state.inputText.length; // Numărul de caractere din input
  const hasMultiplePages = store.pages && store.pages.length > 1; // Dacă sunt multiple pagini în canvas
  const hasSlides = state.responseData?.slides && state.responseData.slides.length > 0; // Dacă există slide-uri generate

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <div style={styles.title}>Enter title, select type, and paste text</div>

        <InputGroup
          placeholder="Enter title (optional)"
          value={state.title}
          onChange={(e) => updateState({ title: e.target.value })}
          style={styles.input}
        />

        {/* Database Selection */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.7, display: 'flex', justifyContent: 'space-between' }}>
            <span>Load from Database:</span>
            <Button
              small minimal
              onClick={async () => {
                updateState({ loadingTeasers: true });
                const teasers = await fetchTeasers();
                updateState({ storyTeasers: teasers, loadingTeasers: false });
              }}
              loading={state.loadingTeasers}
              style={{ fontSize: '10px', padding: '2px 6px', minHeight: '20px' }}
            >
              🔄 Refresh
            </Button>
          </div>
          <select
            value={state.selectedStoryTeaser}
            onChange={(e) => handleTeaserSelect(e.target.value)}
            disabled={state.loadingTeasers}
            style={styles.dropdown}
          >
            <option value="">
              {state.loadingTeasers ? 'Loading...' : `Select from ${state.storyTeasers.length} teasers`}
            </option>
            {state.storyTeasers.map((teaser, index) => (
              <option key={teaser.id} value={teaser.id}>
                {index + 1}. {teaser.title} ({teaser.type}) - {new Date(teaser.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
          {state.selectedStoryTeaser && (
            <Button small minimal onClick={() => handleTeaserSelect('')} style={{ marginTop: '5px' }}>
              Clear Selection
            </Button>
          )}
        </div>

        {/* Output Type Selection */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.7 }}>Output Type:</div>
          <div style={styles.buttonGroup}>
            {OUTPUT_TYPES.map((type) => (
              <Button
                key={type.id}
                onClick={() => updateState({ outputType: type.id })}
                active={type.id === state.outputType}
                small minimal
                title={type.description}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                {type.name}
              </Button>
            ))}
          </div>
          {selectedType && (
            <div style={{ fontSize: '11px', opacity: 0.6, fontStyle: 'italic' }}>
              {selectedType.description}
            </div>
          )}
        </div>

        <TextArea
          placeholder={`Paste text here (min ${MIN_CHARS} chars)`}
          value={state.inputText}
          onChange={(e) => updateState({ inputText: e.target.value })}
          style={styles.textArea}
        />

        <div style={styles.counter}>
          {charCount}/{MIN_CHARS} characters
          {charCount < MIN_CHARS && <span style={{ color: '#f55656', marginLeft: '8px' }}>(Need {MIN_CHARS - charCount} more)</span>}
          {charCount >= MIN_CHARS && <span style={{ color: '#26de81', marginLeft: '8px' }}>✓</span>}
        </div>

        <Button
          fill intent="primary"
          onClick={handleGenerate}
          loading={state.loading}
          disabled={isDisabled}
        >
          {state.loading ? 'Processing...' : `Generate ${selectedType?.name || 'Summary'}`}
        </Button>

        {state.error && <div style={styles.error}>{state.error}</div>}
      </div>

      {state.responseData && (
        <div style={styles.responseSection}>
                     {/* Tone Selection */}
           {state.responseData.slides && (
             <div style={{ marginBottom: '15px' }}>
               <div style={{ fontSize: '12px', marginBottom: '5px', opacity: 0.7 }}>
                 Select Tone: ({state.selectedTone})
               </div>
               <select
                 value={state.selectedTone}
                 onChange={(e) => updateState({ selectedTone: e.target.value })}
                 style={styles.dropdown}
               >
                 {TONE_TYPES.map((tone) => (
                   <option key={tone.value} value={tone.value}>{tone.label}</option>
                 ))}
               </select>
               
               {/* Replace All Pages Button */}
               {hasMultiplePages && hasSlides && (
                 <div style={{ marginTop: '10px' }}>
                   <Button
                     fill
                     intent="warning"
                     onClick={() => replaceAllPagesWithSlides(state.responseData.slides, state.selectedTone)}
                     style={{
                       backgroundColor: '#ff9500',
                       color: '#ffffff',
                       fontWeight: '600',
                       border: '1px solid #ff9500'
                     }}
                   >
                     🔄 Replace All {store.pages.length} Pages with Slides
                   </Button>
                   <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px', fontStyle: 'italic' }}>
                     Each page will get content from slide {state.responseData.slides.length} slides available
                   </div>
                 </div>
               )}
               
               {!hasMultiplePages && hasSlides && (
                 <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '8px', fontStyle: 'italic' }}>
                   💡 Add more pages to use "Replace All Pages" feature
                 </div>
               )}
             </div>
           )}

          {/* Content Sections */}
          {[
            { key: 'slides', isSlides: true },
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description' },
            { key: 'videoScript', label: 'Video Script' },
            { key: 'postDescription', label: 'Post Description' }
          ].map(({ key, label, isSlides }) => {
            if (isSlides && state.responseData.slides) {
              return state.responseData.slides.map((slide) => {
                const content = getSlideContent(slide.slideNumber, state.selectedTone);
                return (
                  <div key={`${slide.slideNumber}-${state.selectedTone}`} style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '12px', marginBottom: '5px', fontWeight: '500' }}>
                      Slide {slide.slideNumber} ({slide.slideType}) - {state.selectedTone}:
                    </div>
                    <div style={styles.contentBox}>{content || 'No content for this tone'}</div>
                    <Button
                      small intent="success"
                      onClick={() => addToCanvas(content)}
                      style={styles.addButton}
                      disabled={!content}
                    >
                      ✨ Add Slide {slide.slideNumber} to Canvas
                    </Button>
                  </div>
                );
              });
            } else if (state.responseData[key] && !isSlides) {
              return (
                <div key={key} style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '12px', marginBottom: '5px', fontWeight: '500' }}>{label}:</div>
                  <div style={styles.contentBox}>{state.responseData[key]}</div>
                  <Button
                    small intent="success"
                    onClick={() => addToCanvas(state.responseData[key])}
                    style={styles.addButton}
                  >
                    ✨ Add {label} to Canvas
                  </Button>
                </div>
              );
            }
            return null;
          })}

          <Button fill minimal onClick={handleClear} style={{ marginTop: '15px' }}>
            Clear All
          </Button>
        </div>
      )}

      {!state.responseData && !state.loading && (
        <div style={styles.emptyState}>
          <div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>📝</div>
            <div style={{ fontSize: '14px' }}>Select type and enter text to generate content</div>
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================
// EXPORTUL SECȚIUNII - Definirea tab-ului și panelului
// ============================================
export const SummarizeSection = {
  name: 'summarize',                    // Numele unic al secțiunii
  Tab: (props) => (                     // Tab-ul din sidebar
    <SectionTab name="Summarize" {...props}>
      📝
    </SectionTab>
  ),
  Panel: SummarizePanel,                // Componenta principală a panelului
}; 
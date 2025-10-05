import * as mobx from 'mobx';
import { createContext, useContext } from 'react';
import { storage } from './storage';

import * as api from './api';

export const ProjectContext = createContext({});

export const useProject = () => useContext(ProjectContext);

const getFromStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
};

class Project {
  id = '';
  name = '';
  user = {};
  skipSaving = false;
  cloudEnabled = false;
  status = 'saved'; // or 'has-changes' or 'saving' or 'loading'
  language = getFromStorage('polotno-language') || navigator.language || 'en';
  designsLength = 0;

  constructor({ store }) {
    console.log('🏗️ Creating Project with store:', store);
    mobx.makeAutoObservable(this);
    this.store = store;

    console.log('🏗️ Setting up change listener...');
    store.on('change', () => {
      console.log('🏗️ Store change event fired! Current elements:', this.store.activePage?.children?.length || 0);
      this.requestSave();
    });

    setInterval(() => {
      mobx.runInAction(() => {
        this.cloudEnabled = window.puter?.auth?.isSignedIn();
      });
    }, 100);
    
    console.log('🏗️ Project initialization complete');
  }

  setLanguage(lang) {
    this.language = lang;
    setToStorage('polotno-language', lang);
  }

  requestSave() {
    console.log('🔄 Changes detected, requesting save...');
    this.status = 'has-changes';
    if (this.saveTimeout) {
      console.log('🔄 Save already pending, skipping...');
      return;
    }
    console.log('🔄 Setting up save timeout (5 seconds)...');
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      console.log('🔄 Save timeout triggered, calling save()...');
      this.save();
    }, 5000);
  }

  async firstLoad() {
    const deprecatedDesign = await storage.getItem('polotno-state');
    if (deprecatedDesign) {
      this.store.loadJSON(deprecatedDesign);
      await storage.removeItem('polotno-state');
      await this.save();
      return;
    }
    const lastDesignId = await storage.getItem('polotno-last-design-id');
    if (lastDesignId) {
      await this.loadById(lastDesignId);
    }
  }

  async loadById(id) {
    console.log('📂 Loading design by ID:', id);
    this.id = id;
    await storage.setItem('polotno-last-design-id', id);
    this.status = 'loading';
    try {
      console.log('📂 Calling API loadById...');
      const { storeJSON, name } = await api.loadById({
        id,
      });
      console.log('📂 API response - name:', name, 'storeJSON size:', storeJSON ? JSON.stringify(storeJSON).length : 'null');
      
      if (storeJSON) {
        console.log('📂 Loading JSON into store...');
        this.store.loadJSON(storeJSON);
        console.log('📂 Store loaded, current pages:', this.store.pages.length);
      }
      this.name = name;
      console.log('📂 Design loaded successfully:', { id, name });
    } catch (e) {
      console.error('📂 Load failed:', e);
      this.id = '';
      this.name = 'Untitled Design';
      await storage.removeItem('polotno-last-design-id');
    }
    this.status = 'saved';
    console.log('📂 Load process completed, current ID:', this.id);
  }

  updateUrlWithProjectId() {
    if (!this.id || this.id === 'local') {
      window.history.replaceState({}, null, `/`);
      return;
    }
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.search);
    params.set('id', this.id);
    window.history.replaceState({}, null, `/design/${this.id}`);
  }

  async save() {
    console.log('💾 Starting save process...');
    console.log('💾 Current design ID:', this.id);
    console.log('💾 Current design name:', this.name);
    
    this.status = 'saving';
    const storeJSON = this.store.toJSON();
    console.log('💾 Store JSON generated, size:', JSON.stringify(storeJSON).length);
    
    const maxWidth = 200;
    const canvas = this.store.pages.length
      ? await this.store._toCanvas({
          pixelRatio: maxWidth / this.store.activePage?.computedWidth,
          pageId: this.store.activePage?.id,
          // two options for faster preview
          quickMode: true,
          _skipTimeout: true,
        })
      : // if there is no page, create a dummy canvas
        document.createElement('canvas');
    
    console.log('💾 Canvas created:', canvas.width + 'x' + canvas.height);
    console.log('💾 Current page elements when generating preview:', this.store.activePage?.children?.length || 0);
    
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9);
    });
    
    console.log('💾 Preview blob created, size:', blob.size);
    
    try {
      console.log('💾 Calling API saveDesign...');
      const res = await api.saveDesign({
        storeJSON,
        preview: blob,
        id: this.id,
        name: this.name,
      });
      
      console.log('💾 API response:', res);
      
      if (res.status === 'saved') {
        this.id = res.id;
        await storage.setItem('polotno-last-design-id', res.id);
        console.log('💾 Design saved successfully with ID:', res.id);
        
        // Notificare că design-ul a fost salvat cu succes - pentru a actualiza preview-ul în lista de design-uri
        window.dispatchEvent(new CustomEvent('designSaved', { 
          detail: { 
            id: res.id, 
            name: this.name,
            preview: blob,
            timestamp: Date.now()
          } 
        }));
        console.log('💾 Design saved event dispatched with timestamp:', Date.now());
      }
    } catch (e) {
      console.error('💾 Save failed:', e);
    }
    this.status = 'saved';
    console.log('💾 Save process completed');
  }

  async duplicate() {
    this.id = '';
    this.save();
  }

  async clear() {
    this.store.clear();
    this.store.addPage();
    await storage.removeItem('polotno-last-design-id');
  }

  async createNewDesign({ name } = {}) {
    await this.clear();
    this.name = name || 'Untitled Design';
    this.id = '';
    console.log('saving');
    await this.save();
    console.log('saving done');
  }

  async signIn() {
    await window.puter.auth.signIn();
    this.designsLength = await api.backupFromLocalToCloud();
  }
}

export const createProject = (...args) => new Project(...args);

// DEBUG: Helper functions for testing
window.debugProject = {
  testSave: () => {
    if (window.project) {
      console.log('🧪 Testing manual save...');
      window.project.save();
    } else {
      console.log('🧪 Project not found on window object');
    }
  },
  testChange: () => {
    if (window.project) {
      console.log('🧪 Testing change detection...');
      window.project.requestSave();
    } else {
      console.log('🧪 Project not found on window object');
    }
  },
  getProjectInfo: () => {
    if (window.project) {
      console.log('🧪 Project info:', {
        id: window.project.id,
        name: window.project.name,
        status: window.project.status,
        storePages: window.project.store.pages.length
      });
    } else {
      console.log('🧪 Project not found on window object');
    }
  }
};

export default createProject;

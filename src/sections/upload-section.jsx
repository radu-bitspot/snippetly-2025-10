import React from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@blueprintjs/core';
import { Upload, Trash } from '@blueprintjs/icons';
import {
  ImagesGrid,
  UploadSection as DefaultUploadSection,
} from 'polotno/side-panel';
import { getImageSize, getCrop } from 'polotno/utils/image';
import { dataURLtoBlob } from '../blob';
import { CloudWarning } from '../cloud-warning';
import { useProject } from '../project';
import { listAssets, uploadAsset, deleteAsset } from '../api';

// ============================================
// FUNCȚII HELPER - Utilitare pentru procesarea fișierelor
// ============================================

// Determină tipul fișierului pe baza extensiei
const getType = (file) => {
  const { type } = file;
  if (type.includes('svg')) return 'svg';
  if (type.includes('video')) return 'video';
  return 'image';
};

// Generează un preview thumbnail pentru imagini (200px width)
const getImageFilePreview = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Creează un canvas pentru resize
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = (200 * img.height) / img.width; // Păstrează aspectul
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL()); // Returnează data URL
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Determină URL-ul API-ului în funcție de environment
const getApiBaseUrl = () => 
  window.location.hostname === 'localhost' ? '/api' : 'http://79.137.67.72:8000/api';

// Creează header-ele de autentificare pentru API calls
const getAuthHeaders = () => ({
  'Authorization': `Token ${localStorage.getItem('authToken')}`,
});

// ============================================
// STILURI - Aspectul vizual al componentelor
// ============================================

const styles = {
  // Stilul pentru tab-urile de navigare (Upload/Database)
  tab: (isActive) => ({
    flex: 1,
    padding: '8px 12px',
    backgroundColor: isActive ? '#137cbd' : '#394b59', // Albastru dacă activ
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  }),
  
  // Stilul pentru mesajele de status (succes/avertisment)
  message: (isSuccess) => ({
    marginBottom: '15px',
    padding: '8px 12px',
    backgroundColor: isSuccess ? 'rgba(38, 222, 129, 0.1)' : 'rgba(255, 193, 6, 0.1)',
    border: `1px solid ${isSuccess ? 'rgba(38, 222, 129, 0.3)' : 'rgba(255, 193, 6, 0.3)'}`,
    borderRadius: '4px',
    fontSize: '12px',
    color: isSuccess ? '#26de81' : '#ffc106', // Verde pentru succes, galben pentru warning
  }),
  
  // Stilul pentru secțiunile de conținut
  section: {
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: 'rgba(48, 64, 77, 0.3)', // Fundal semi-transparent
    borderRadius: '4px',
    border: '1px solid #394b59',
  },
  
  // Stilul pentru header-ele secțiunilor
  header: {
    fontSize: '12px',
    marginBottom: '8px',
    opacity: 0.7,
    display: 'flex',
    justifyContent: 'space-between', // Spațiu între titlu și butoane
    alignItems: 'center',
    fontWeight: '500',
  },
};

// ============================================
// HOOK PERSONALIZAT - Gestionarea datelor API
// ============================================

// Hook pentru gestionarea imaginilor din cloud și din baza de date
const useApiData = () => {
  const [uploadedImages, setUploadedImages] = React.useState([]); // Imaginile din cloud storage
  const [databaseImages, setDatabaseImages] = React.useState([]); // Imaginile din DB
  const [isLoading, setIsLoading] = React.useState(false);        // Starea de loading

  // Încarcă imaginile din cloud storage (Puter API)
  const loadUploadedImages = async () => {
    setIsLoading(true);
    const images = await listAssets(); // Apelează API-ul cloud
    setUploadedImages(images);
    setIsLoading(false);
  };

  // Încarcă imaginile din baza de date Django
  const loadDatabaseImages = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setDatabaseImages([]); // Fără token = fără imagini
        return;
      }

      // API-ul filtrează automat după utilizator
      const response = await fetch(`${getApiBaseUrl()}/upload-image/`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        // Transformă datele în formatul așteptat de componente
        const images = (data.results || data).map(img => ({
          ...img,
          src: img.file || img.object_url,     // URL-ul imaginii
          preview: img.file || img.object_url, // URL pentru preview
          type: 'image',
          source: 'database'                   // Marchează sursa
        }));
        setDatabaseImages(images);
      }
    } catch (error) {
      console.error('Error fetching database images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Returnează toate funcțiile și starea pentru componente
  return {
    uploadedImages,
    databaseImages,
    isLoading,
    loadUploadedImages,
    loadDatabaseImages,
    setUploadedImages,
    setDatabaseImages,
  };
};

// ============================================
// COMPONENTA SELECTOR DE IMAGINI - Afișează și gestionează imaginile
// ============================================

// Componentă unificată pentru selectarea imaginilor din orice sursă
const ImageSelector = ({ images, onDelete, onSelect, store, title, isLoading }) => {
  // Afișează mesaj dacă nu sunt imagini
  if (images.length === 0 && !isLoading) {
    return (
      <div style={{ fontSize: '11px', opacity: 0.6, fontStyle: 'italic', padding: '8px' }}>
        📷 No images found
      </div>
    );
  }

  // Funcția pentru selectarea unei imagini și adăugarea pe canvas
  const handleImageSelect = async (item, pos, element) => {
    const { src, type } = item;
    // Alege funcția de măsurare în funcție de tip
    const getSizeFunc = getImageSize;
    let { width, height } = await getSizeFunc(src);

    // Dacă există un element SVG selectat, setează ca mască
    if (element?.type === 'svg' && element.contentEditable && type === 'image') {
      element.set({ maskSrc: src });
      return;
    }

    // Dacă există o imagine selectată, înlocuiește-o cu crop calculat
    if (element?.type === 'image' && element.contentEditable && type === 'image') {
      const crop = getCrop(element, { width, height });
      element.set({ src, ...crop });
      return;
    }

    // Calculează scala pentru a încadra în canvas
    const scale = Math.min(store.width / width, store.height / height, 1);
    width *= scale;
    height *= scale;

    // Calculează poziția centrată (sau folosește poziția specificată)
    const x = (pos?.x || store.width / 2) - width / 2;
    const y = (pos?.y || store.height / 2) - height / 2;

    // Adaugă elementul pe pagina activă
    store.activePage?.addElement({ type, src, x, y, width, height });

    // Tracking pentru analytics - monitorizează utilizarea imaginilor
    store.trackAnalytics?.(
      item.source === 'database' ? 'database_image_used' : 'upload_image_used',
      { imageId: item.id, source: item.source, timestamp: new Date().toISOString() }
    );
  };

  // Render-ul componentei
  return (
    <div>
      {title && <div style={styles.header}>{title}</div>}
      {/* Grid-ul de imagini cu funcționalitate completă */}
      <ImagesGrid
        images={images}
        getPreview={(image) => image.preview || image.src} // URL pentru thumbnail
        isLoading={isLoading}
        onSelect={handleImageSelect}                       // Callback pentru selectare
        getCredit={(image) => (                           // Componentă pentru butoane în overlay
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Badge pentru imaginile din database */}
            {image.source === 'database' && (
              <span style={{ fontSize: '10px', backgroundColor: '#137cbd', color: 'white', padding: '2px 4px', borderRadius: '2px' }}>
                DB
              </span>
            )}
            {/* Butonul de ștergere */}
            <Button
              icon={<Trash />}
              onClick={(e) => {
                e.stopPropagation(); // Previne selectarea imaginii la click pe delete
                onDelete(image);
              }}
              small
              minimal
              intent="danger"
              title={`Delete ${image.original_filename || 'image'}`}
            />
          </div>
        )}
      />
    </div>
  );
};

// ============================================
// COMPONENTA PRINCIPALĂ - Panelul de upload imagini
// ============================================

export const UploadPanel = observer(({ store }) => {
  // Starea locală a componentei
  const [activeTab, setActiveTab] = React.useState('upload');  // Tab-ul activ (upload/database)
  const [isUploading, setUploading] = React.useState(false);   // Dacă se încarcă fișiere
  const [message, setMessage] = React.useState('');            // Mesajul de status
  const project = useProject();                                // Hook pentru gestionarea proiectului
  
  // Importă funcțiile și starea din hook-ul personalizat
  const {
    uploadedImages,      // Imaginile din cloud
    databaseImages,      // Imaginile din DB
    isLoading,           // Starea de loading
    loadUploadedImages,  // Funcția de încărcare cloud
    loadDatabaseImages,  // Funcția de încărcare DB
    setUploadedImages,   // Setter pentru cloud images
    setDatabaseImages,   // Setter pentru DB images
  } = useApiData();

  // Funcție helper pentru afișarea mesajelor temporare
  const showMessage = (text, duration = 3000) => {
    setMessage(text);
    setTimeout(() => setMessage(''), duration); // Auto-hide după 3 secunde
  };

  // ============================================
  // FUNCȚII DE GESTIONARE A UPLOAD-ULUI
  // ============================================

  // Salvează fișierul în baza de date Django după upload în cloud
  const uploadToDjangoDatabase = async (file, puterResult) => {
    try {
      const formData = new FormData();
      formData.append('file', file);                    // Fișierul original
      formData.append('object_url', puterResult.src);   // URL-ul din cloud
      formData.append('source', 'polotno_upload');      // Marchează sursa

      const response = await fetch(`${getApiBaseUrl()}/upload-image/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      return response.ok; // Returnează true dacă s-a salvat cu succes
    } catch (error) {
      console.error('Database save error:', error);
      return false;
    }
  };

  // Funcția principală pentru procesarea fișierelor selectate
  const handleFileInput = async (e) => {
    setUploading(true);
    const files = Array.from(e.target.files);
    let uploadedCount = 0;      // Contorul pentru cloud uploads
    let databaseSaveCount = 0;  // Contorul pentru salvări în DB

    // Procesează fiecare fișier individual
    for (const file of files) {
      const type = getType(file);
      // Generează preview în funcție de tip
      const previewDataURL = await getImageFilePreview(file);
      
      const preview = dataURLtoBlob(previewDataURL);
      // Upload în cloud storage (Puter)
      const puterResult = await uploadAsset({ file, preview, type });
      uploadedCount++;

      // Încearcă să salveze și în baza de date
      const djangoSuccess = await uploadToDjangoDatabase(file, puterResult);
      if (djangoSuccess) databaseSaveCount++;
    }

    // Reîncarcă listele de imagini
    await loadUploadedImages();
    await loadDatabaseImages();
    setUploading(false);
    e.target.value = null; // Resetează input-ul pentru următoarea selecție

    // Afișează mesajul de status corespunzător
    const total = files.length;
    if (databaseSaveCount === total) {
      showMessage(`✅ ${total} image${total !== 1 ? 's' : ''} uploaded to Cloud & Database!`);
    } else {
      showMessage(`⚠️ ${total} uploaded to Cloud, ${databaseSaveCount} saved to Database`);
    }
  };

  // Funcția pentru ștergerea unei imagini (din DB sau din cloud)
  const handleDelete = async (image) => {
    // Confirmarea utilizatorului înainte de ștergere
    if (!window.confirm(`Delete "${image.original_filename || 'this image'}"?`)) return;

    if (image.source === 'database') {
      // Șterge din baza de date Django
      try {
        const response = await fetch(`${getApiBaseUrl()}/upload-image/${image.id}/`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          // Actualizează lista locală fără această imagine
          setDatabaseImages(prev => prev.filter(img => img.id !== image.id));
          showMessage(`✅ Image deleted from database`);
        } else {
          showMessage(`❌ Failed to delete: ${response.statusText}`);
        }
      } catch (error) {
        showMessage(`❌ Error: ${error.message}`);
      }
    } else {
      // Șterge din cloud storage (Puter)
      setUploadedImages(prev => prev.filter(i => i.id !== image.id));
      await deleteAsset({ id: image.id });
      await loadUploadedImages(); // Reîncarcă lista pentru sincronizare
    }
  };

  // Effect pentru încărcarea inițială a datelor
  React.useEffect(() => {
    loadUploadedImages(); // Încarcă imaginile din cloud
    loadDatabaseImages(); // Încarcă imaginile din DB
  }, [project.cloudEnabled]); // Re-execută când se schimbă cloud settings

  // Determină care imagini să afișeze în funcție de tab-ul activ
  const allImages = activeTab === 'database' 
    ? [...databaseImages, ...uploadedImages]  // Tab database: toate imaginile
    : uploadedImages;                         // Tab upload: doar din cloud

  // ============================================
  // RENDER-UL COMPONENTEI PRINCIPALE
  // ============================================
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Tab-urile de navigare */}
      <div style={{ display: 'flex', marginBottom: '15px', border: '1px solid #394b59', borderRadius: '4px', overflow: 'hidden' }}>
        <button style={styles.tab(activeTab === 'upload')} onClick={() => setActiveTab('upload')}>
          📤 Upload New
        </button>
        <button style={styles.tab(activeTab === 'database')} onClick={() => setActiveTab('database')}>
          🗃️ From Database
        </button>
      </div>

      {/* Butonul principal de upload */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="input-file">
          <Button
            icon={<Upload />}
            style={{ width: '100%' }}
            onClick={() => document.querySelector('#input-file')?.click()} // Trigger input-ul ascuns
            loading={isUploading}
            intent="primary"
          >
            {isUploading ? 'Uploading...' : 'Upload Images'}
          </Button>
          {/* Input-ul ascuns pentru selectarea fișierelor */}
          <input
            type="file"
            id="input-file"
            style={{ display: 'none' }}
            onChange={handleFileInput}
            multiple                    // Permite selecția multiplă
            accept="image/*"    // Acceptă doar imagini
          />
        </label>
      </div>

      {/* Mesajele de status */}
      {message && <div style={styles.message(message.includes('✅'))}>{message}</div>}

      {/* Secțiunea de refresh pentru database */}
      {activeTab === 'database' && (
        <div style={styles.section}>
          <div style={styles.header}>
            <span>🗃️ My Images ({databaseImages.length}):</span>
            <Button
              small
              minimal
              onClick={loadDatabaseImages}  // Reîncarcă imaginile din DB
              loading={isLoading}
              title="Refresh"
            >
              🔄
            </Button>
          </div>
        </div>
      )}

      {/* Avertismentul pentru cloud storage */}
      <CloudWarning />

      {/* Grid-ul cu imaginile */}
      <ImageSelector
        images={allImages}
        onDelete={handleDelete}                                                          // Callback pentru ștergere
        onSelect={() => {}}                                                             // Placeholder pentru select
        store={store}                                                                   // Store-ul Polotno
        title={activeTab === 'database' ? `📀 All Images (${allImages.length}):` : null} // Titlul condițional
        isLoading={isLoading}
      />
    </div>
  );
});

// ============================================
// EXPORTUL SECȚIUNII - Definirea tab-ului și panelului
// ============================================

const UploadSection = {
  name: 'upload',                    // Numele unic al secțiunii
  Tab: DefaultUploadSection.Tab,     // Folosește tab-ul default din Polotno
  Panel: UploadPanel,                // Componenta personalizată a panelului
};

export { UploadSection };
import React from 'react';
import { observer } from 'mobx-react-lite';
import { InputGroup, Button, HTMLSelect, ButtonGroup } from '@blueprintjs/core';
import { Clean, Plus, Upload, Trash } from '@blueprintjs/icons';

import { SectionTab } from 'polotno/side-panel';
import { getImageSize } from 'polotno/utils/image';
import { t } from 'polotno/utils/l10n';

import { ImagesGrid } from 'polotno/side-panel/images-grid';
import { getCrop } from 'polotno/utils/image';
import { dataURLtoBlob } from '../blob';
import { useAuth } from '../context/AuthContext';
import { DESIGN_TEMPLATES, getDesignPrompt, getDesignOptions, DEFAULT_DESIGN_TYPE, addCustomTemplate, deleteCustomTemplate } from '../config/designTemplates';
import AddDesignModal from '../components/AddDesignModal';

// Webhook URL constant - folosesc IP-ul public direct pentru webhook
const WEBHOOK_URL = 'http://79.137.67.72:5678/webhook/2cded8da-f039-4e57-b6b1-c9d0fce8b059';

// API configuration - using proxy for CORS
const getApiBaseUrl = () => '/api';

const getAuthHeaders = () => ({
  'Authorization': `Token ${localStorage.getItem('authToken')}`,
});

const GenerateTab = observer(({ store }) => {
  const { user } = useAuth(); // Get the authenticated user
  const promptRef = React.useRef(null);
  const [images, setImages] = React.useState([]);
  const [isUploading, setUploading] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [designType, setDesignType] = React.useState(DEFAULT_DESIGN_TYPE);
  const [customDesignType, setCustomDesignType] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [designOptions, setDesignOptions] = React.useState(getDesignOptions());

  // Function to show temporary messages
  const showMessage = (text, duration = 3000) => {
    setMessage(text);
    setTimeout(() => setMessage(''), duration);
  };

  // Function to refresh design options after adding/deleting
  const refreshDesignOptions = () => {
    setDesignOptions(getDesignOptions());
  };

  // Function to handle adding new design template
  const handleAddDesignTemplate = async (templateData) => {
    try {
      addCustomTemplate(templateData);
      refreshDesignOptions();
      showMessage(`✅ Stilul "${templateData.name}" a fost adăugat cu succes!`);
    } catch (error) {
      console.error('Error adding design template:', error);
      showMessage(`❌ Eroare la adăugarea stilului: ${error.message}`);
    }
  };

  // Function to handle deleting design template
  const handleDeleteDesignTemplate = (templateKey) => {
    if (window.confirm('Ești sigur că vrei să ștergi acest stil?')) {
      deleteCustomTemplate(templateKey);
      refreshDesignOptions();
      
      // If deleted template was selected, switch to default
      if (designType === templateKey) {
        setDesignType(DEFAULT_DESIGN_TYPE);
      }
      
      showMessage('✅ Stilul a fost șters cu succes!');
    }
  };

  // Function to send image to webhook
  const sendToWebhook = async (file, metadata) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('designType', metadata.designType);
      formData.append('prompt', metadata.prompt);
      formData.append('source', 'ai-img-section');
      formData.append('timestamp', new Date().toISOString());
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.statusText}`);
      }
      
      console.log('Webhook response:', await response.text());
      return true;
    } catch (error) {
      console.error('Error sending to webhook:', error);
      return false;
    }
  };

  // Function to save to Django database
  const uploadToDjangoDatabase = async (file, imageUrl, metadata) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('object_url', imageUrl);
      formData.append('source', 'ai_img_upload');
      formData.append('design_type', metadata.designType);
      formData.append('prompt', metadata.prompt);

      const response = await fetch(`${getApiBaseUrl()}/upload-image/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        return responseData; // Return the full response data which should contain the database URL
      }
      return null;
    } catch (error) {
      console.error('Database save error:', error);
      return null;
    }
  };

  const getImageFilePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target.result;
        // now we need to render that image into smaller canvas and get data url
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 200;
          canvas.height = (200 * img.height) / img.width;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL());
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInput = async (e) => {
    const { target } = e;
    setUploading(true);
    const newImages = [];
    let databaseSuccessCount = 0;
    
    for (const file of target.files) {
      if (file.type.indexOf('image') >= 0) {
        const preview = await getImageFilePreview(file);
        const imageUrl = URL.createObjectURL(file);
        
        // Prepare metadata
        const metadata = {
          designType: designType === 'custom' ? customDesignType : designType,
          prompt: promptRef.current?.value || '',
          fileName: file.name
        };
        
        // Save to database only (no webhook on upload)
        const databaseResponse = await uploadToDjangoDatabase(file, imageUrl, metadata);
        const databaseSuccess = databaseResponse !== null;
        if (databaseSuccess) databaseSuccessCount++;
        
        newImages.push({
          id: Date.now() + Math.random(),
          src: imageUrl,
          preview: preview,
          name: file.name,
          designType: metadata.designType,
          prompt: metadata.prompt,
          webhookSent: false, // Nu se trimite la webhook la încărcare
          savedToDb: databaseSuccess,
          databaseUrl: databaseResponse?.url || databaseResponse?.object_url || null // Store the database URL
        });
      }
    }
    
    setImages([...images, ...newImages]);
    setUploading(false);
    target.value = null;
    
    // Show status message - doar despre database
    const total = newImages.length;
    if (databaseSuccessCount === total) {
      showMessage(`✅ ${total} imagine${total !== 1 ? 'i' : 'a'} încărcată! Salvată în baza de date.`);
    } else {
      showMessage(`⚠️ ${total} încărcate local. Baza de date: ${databaseSuccessCount}/${total}`);
    }
  };

  const handleDelete = (imageToDelete) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      setImages(images.filter((img) => img.id !== imageToDelete.id));
      // Clean up object URL to prevent memory leaks
      URL.revokeObjectURL(imageToDelete.src);
    }
  };

  const handleGenerate = async () => {
    if (!promptRef.current?.value) {
      showMessage('❌ Te rog introdu un prompt mai întâi');
      return;
    }

    setLoading(true);
    
    try {
      // Get current design type
      const currentDesignType = designType;
      
      // Get prompt using the design template system
      const userPrompt = promptRef.current.value;
      const prompt = getDesignPrompt(designType, userPrompt);
      
      // Prepare data to send to webhook
      const webhookData = {
        action: 'generate_request',
        prompt: prompt,
        designType: currentDesignType,
        timestamp: new Date().toISOString(),
        source: 'ai-img-generate',
        userId: user?.id || null // Use the user ID from AuthContext
      };

      // If there are uploaded images, include their database URLs
      const uploadedImageUrls = images
        .filter(img => img.savedToDb && img.databaseUrl)
        .map(img => ({
          url: img.databaseUrl, // Use the database URL instead of local src
          name: img.name,
          designType: img.designType,
          prompt: img.prompt
        }));

      if (uploadedImageUrls.length > 0) {
        webhookData.existingImages = uploadedImageUrls;
        webhookData.imageCount = uploadedImageUrls.length;
      }

      // Debug: Log the payload being sent
      console.log('Sending webhook payload:', webhookData);

      // Send to webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(webhookData)
      });

      console.log('Webhook response status:', response.status);
      
      if (response.ok) {
        const result = await response.text();
        console.log('🔍 RAW webhook response:', result);
        
        try {
          // Încearcă să parseze răspunsul ca JSON
          const responseData = JSON.parse(result);
          console.log('🔍 PARSED webhook response:', responseData);
          
          // Verifică dacă răspunsul e un array (de la n8n)
          if (Array.isArray(responseData) && responseData.length > 0) {
            const imageData = responseData[0];
            console.log('🔍 IMAGE DATA from array:', imageData);
            console.log('🔍 Available fields:', Object.keys(imageData));
            
            // Folosește image_data_url pentru a adăuga pe canvas
            if (imageData.image_data_url) {
              console.log('🔍 Using image_data_url:', imageData.image_data_url);
              console.log('🔍 URL starts with:', imageData.image_data_url.substring(0, 50));
              console.log('🔍 URL is data URL?', imageData.image_data_url.startsWith('data:'));
              console.log('🔍 URL is http/https?', imageData.image_data_url.startsWith('http'));
              
              // Verifică dacă este data URL sau trebuie să construim URL-ul
              let finalImageUrl = imageData.image_data_url;
              
              // Dacă nu e data URL și nu începe cu http, construiește URL-ul cu baza de date
              if (!finalImageUrl.startsWith('data:') && !finalImageUrl.startsWith('http')) {
                // Presupunem că e un path relativ către baza de date
                finalImageUrl = `http://79.137.67.72:8000${finalImageUrl.startsWith('/') ? '' : '/'}${finalImageUrl}`;
                console.log('🔍 Constructed full URL:', finalImageUrl);
              }
              
              await addGeneratedImageToCanvas(finalImageUrl);
              showMessage(`✅ Imagine generată și adăugată pe canvas!`);
            } else if (imageData.file || imageData.url) {
              // Fallback la file sau url dacă image_data_url nu există
              let imageUrl = imageData.file || imageData.url;
              console.log('🔍 Using fallback URL:', imageUrl);
              console.log('🔍 Fallback URL starts with:', imageUrl.substring(0, 50));
              
              // Același tratament pentru URL-uri incomplete
              if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
                imageUrl = `http://79.137.67.72:8000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
                console.log('🔍 Constructed fallback URL:', imageUrl);
              }
              
              await addGeneratedImageToCanvas(imageUrl);
              showMessage(`✅ Imagine adăugată pe canvas!`);
            } else {
              console.log('❌ No image URL found in response');
              console.log('🔍 Full imageData object:', JSON.stringify(imageData, null, 2));
              showMessage(`❌ Nu s-a găsit URL-ul imaginii în răspuns`);
            }
          } else if (responseData.generated_image_url || responseData.image_url || responseData.url) {
            // Fallback pentru formatul vechi
            let generatedImageUrl = responseData.generated_image_url || responseData.image_url || responseData.url;
            console.log('🔍 Using legacy format URL:', generatedImageUrl);
            console.log('🔍 Legacy URL starts with:', generatedImageUrl.substring(0, 50));
            
            // Construiește URL-ul complet dacă e necesar
            if (!generatedImageUrl.startsWith('data:') && !generatedImageUrl.startsWith('http')) {
              generatedImageUrl = `http://79.137.67.72:8000${generatedImageUrl.startsWith('/') ? '' : '/'}${generatedImageUrl}`;
              console.log('🔍 Constructed legacy URL:', generatedImageUrl);
            }
            
            await addGeneratedImageToCanvas(generatedImageUrl);
            showMessage(`✅ Imagine generată și adăugată pe canvas!`);
          } else {
            console.log('❌ No recognizable image URL format found');
            console.log('🔍 Full response object:', JSON.stringify(responseData, null, 2));
            showMessage(`❌ Format de răspuns necunoscut - verifică console pentru detalii`);
          }
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          console.log('🔍 Raw response that failed to parse:', result);
          showMessage(`❌ Răspuns invalid de la webhook - verifică console`);
        }
      } else {
        // Get error details from response
        const errorText = await response.text();
        console.error('Webhook error response:', errorText);
        throw new Error(`Webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

    } catch (error) {
      console.error('Generate webhook error:', error);
      showMessage(`❌ Eroare la trimiterea cererii: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru a adăuga imaginea generată pe canvas
  const addGeneratedImageToCanvas = async (imageUrl) => {
    try {
      console.log('🎨 Attempting to add image to canvas:', imageUrl);
      console.log('🎨 Store width/height:', store.width, store.height);
      console.log('🎨 Active page exists:', !!store.activePage);
      
      // Verifică dacă URL-ul imaginii este valid
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error(`URL invalid pentru imagine: ${imageUrl}`);
      }
      
      // Test dacă imaginea se poate încărca
      console.log('🎨 Testing image load...');
      const testImg = new Image();
      
      // Setează crossOrigin doar pentru URL-uri externe
      if (imageUrl.startsWith('http') && !imageUrl.startsWith(window.location.origin)) {
        testImg.crossOrigin = 'anonymous';
        console.log('🎨 Set crossOrigin for external URL');
      }
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('🎨 Image load timeout after 10 seconds');
          reject(new Error('Timeout la încărcarea imaginii'));
        }, 10000);
        
        testImg.onload = () => {
          clearTimeout(timeout);
          console.log('🎨 Image loaded successfully:', testImg.width + 'x' + testImg.height);
          resolve();
        };
        testImg.onerror = (e) => {
          clearTimeout(timeout);
          console.error('🎨 Image failed to load:', e);
          console.error('🎨 Failed URL was:', imageUrl);
          reject(new Error(`Imaginea nu se poate încărca de la: ${imageUrl}`));
        };
        testImg.src = imageUrl;
      });
      
      // Obține dimensiunile imaginii folosind polotno utils
      console.log('🎨 Getting image size with polotno utils...');
      const { width, height } = await getImageSize(imageUrl);
      console.log('🎨 Image dimensions:', width + 'x' + height);
      
      // Calculează poziția centrală
      const x = (store.width / 2) - (width / 2);
      const y = (store.height / 2) - (height / 2);
      console.log('🎨 Calculated position:', x, y);
      
      // Verifică dacă avem o pagină activă
      if (!store.activePage) {
        throw new Error('Nu există o pagină activă pe canvas');
      }
      
      // Adaugă imaginea pe pagina activă
      console.log('🎨 Adding element to active page...');
      store.activePage.addElement({
        type: 'image',
        src: imageUrl,
        width,
        height,
        x,
        y,
      });
      
      console.log('✅ Imagine generată adăugată cu succes pe canvas:', imageUrl);
    } catch (error) {
      console.error('❌ Eroare detaliată la adăugarea imaginii pe canvas:', error);
      console.error('❌ Error stack:', error.stack);
      showMessage(`⚠️ Eroare la adăugarea pe canvas: ${error.message}`);
    }
  };

  return (
    <>
      <div style={{ height: '40px', paddingTop: '5px', fontWeight: 'bold' }}>
        Generate images with AI
      </div>

      {/* Design Type Selection */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <label style={{ fontWeight: 'bold' }}>
            Choose design type
          </label>
          <div>
            <Button
              icon={<Plus />}
              onClick={() => setIsAddModalOpen(true)}
              small
              minimal
              intent="primary"
              title="Adaugă stil nou"
            >
              Adaugă stil
            </Button>
          </div>
        </div>
        <HTMLSelect
          fill
          value={designType}
          onChange={(e) => setDesignType(e.target.value)}
        >
          {designOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label} {option.isCustom ? '(Custom)' : ''}
            </option>
          ))}
        </HTMLSelect>
      </div>

      {/* Custom Design Type Input */}
      {designType === 'custom' && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Custom design type
          </label>
          <InputGroup
            placeholder="Enter your custom design type"
            value={customDesignType}
            onChange={(e) => setCustomDesignType(e.target.value)}
          />
        </div>
      )}

      {/* Design Template Info */}
      {DESIGN_TEMPLATES()[designType] && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: 'rgba(24, 131, 215, 0.1)', 
          border: '1px solid rgba(24, 131, 215, 0.3)',
          borderRadius: '4px',
          fontSize: '12px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <strong>{DESIGN_TEMPLATES()[designType].name}:</strong> {DESIGN_TEMPLATES()[designType].description}
            </div>
            {DESIGN_TEMPLATES()[designType].isCustom && (
              <Button
                icon="trash"
                onClick={() => handleDeleteDesignTemplate(designType)}
                minimal
                small
                intent="danger"
                title="Șterge stilul custom"
                style={{ marginLeft: '10px' }}
              />
            )}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {message && (
        <div style={{
          marginBottom: '15px',
          padding: '8px 12px',
          backgroundColor: message.includes('✅') ? 'rgba(38, 222, 129, 0.1)' : 'rgba(255, 193, 6, 0.1)',
          border: `1px solid ${message.includes('✅') ? 'rgba(38, 222, 129, 0.3)' : 'rgba(255, 193, 6, 0.3)'}`,
          borderRadius: '4px',
          fontSize: '12px',
          color: message.includes('✅') ? '#26de81' : '#ffc106'
        }}>
          {message}
        </div>
      )}

      {/* Input Image Option */}
      {/* <div style={{ marginBottom: '15px' }}>
        <a
          href="#"
          style={{ color: '#4a90e2', textDecoration: 'none' }}
          onClick={(e) => {
            e.preventDefault();
            setShowInputImage(!showInputImage);
          }}
        >
          <Plus size={14} style={{ marginRight: '5px' }} />
          Add input image (optional)
        </a>
        {showInputImage && (
          <div style={{ marginTop: '10px' }}>
            <Button intent="primary" text="Upload image" minimal small />
          </div>
        )}
      </div> */}

      {/* Prompt Input */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Your prompt
        </label>
        <InputGroup
          placeholder="Type your prompt here"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleGenerate();
            }
          }}
          style={{ marginBottom: '5px' }}
          inputRef={promptRef}
        />
      </div>



      {/* Negative Prompt Option */}
      {/* <div style={{ marginBottom: '15px' }}>
        <a
          href="#"
          style={{ color: '#4a90e2', textDecoration: 'none' }}
          onClick={(e) => {
            e.preventDefault();
            setShowNegativePrompt(!showNegativePrompt);
          }}
        >
          <Plus size={14} style={{ marginRight: '5px' }} />
          Add negative prompt (optional)
        </a>
        {showNegativePrompt && (
          <div style={{ marginTop: '10px' }}>
            <InputGroup
              placeholder="Enter things to exclude from the image"
              inputRef={negativePromptRef}
            />
          </div>
        )}
      </div> */}

      {/* Aspect Ratio Selection */}
      {/* <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Aspect ratio
        </label>
        <ButtonGroup fill style={{ display: 'flex' }}>
          <Button
            text="Square"
            active={aspectRatio === 'square'}
            style={{ flex: 1, maxWidth: '33.3%', borderRadius: 0 }}
            onClick={() => setAspectRatio('square')}
          />
          <Button
            text="Landscape"
            active={aspectRatio === 'landscape'}
            style={{ flex: 1, maxWidth: '33.3%', borderRadius: 0 }}
            onClick={() => setAspectRatio('landscape')}
          />
          <Button
            text="Portrait"
            active={aspectRatio === 'portrait'}
            style={{ flex: 1, maxWidth: '33.3%', borderRadius: 0 }}
            onClick={() => setAspectRatio('portrait')}
          />
        </ButtonGroup>
      </div> */}

      {/* Images Count Selection */}
      {/* <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Images to generate
        </label>
        <ButtonGroup fill style={{ display: 'flex' }}>
          <Button
            text="1"
            active={imagesCount === 1}
            style={{ flex: 1, maxWidth: '25%', borderRadius: 0 }}
            onClick={() => setImagesCount(1)}
          />
          <Button
            text="2"
            active={imagesCount === 2}
            style={{ flex: 1, maxWidth: '25%', borderRadius: 0 }}
            onClick={() => setImagesCount(2)}
          />
          <Button
            text="3"
            active={imagesCount === 3}
            style={{ flex: 1, maxWidth: '25%', borderRadius: 0 }}
            onClick={() => setImagesCount(3)}
          />
          <Button
            text="4"
            active={imagesCount === 4}
            style={{ flex: 1, maxWidth: '25%', borderRadius: 0 }}
            onClick={() => setImagesCount(4)}
          />
        </ButtonGroup>
      </div> */}

      {/* Upload Section */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="input-file">
          <Button
            icon={<Upload />}
            style={{ width: '100%', marginBottom: '10px' }}
            onClick={() => {
              document.querySelector('#input-file')?.click();
            }}
            loading={isUploading}
            intent="success"
          >
            Upload Images
          </Button>
          <input
            type="file"
            id="input-file"
            style={{ display: 'none' }}
            onChange={handleFileInput}
            multiple
            accept="image/*"
          />
        </label>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        intent="primary"
        loading={loading}
        style={{ width: '100%', marginBottom: '20px', borderRadius: '4px' }}
      >
        {loading ? 'Sending to Webhook...' : 'Generate with AI'}
      </Button>

      {/* Images Grid */}
      {images.length > 0 && (
        <ImagesGrid
          shadowEnabled={false}
          images={images}
          getPreview={(item) => item.preview || item.src || item}
          isLoading={isUploading}
          getCredit={(image) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '10px' }}>
                {image.savedToDb && (
                  <span style={{ color: '#137cbd' }}>💾 DB ✓</span>
                )}
                <span style={{ color: '#666', fontSize: '9px' }}>
                  Apasă Generate pentru webhook
                </span>
              </div>
              <Button
                icon={<Trash />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(image);
                }}
                minimal
                small
                intent="danger"
                title={`Delete ${image.name}`}
              />
            </div>
          )}
          onSelect={async (item, pos, element) => {
            const src = item.src || item;
            if (element && element.type === 'svg' && element.contentEditable) {
              element.set({ maskSrc: src });
              return;
            }

            if (
              element &&
              element.type === 'image' &&
              element.contentEditable
            ) {
              element.set({ src: src });
              return;
            }

            const { width, height } = await getImageSize(src);
            const x = (pos?.x || store.width / 2) - width / 2;
            const y = (pos?.y || store.height / 2) - height / 2;
            store.activePage?.addElement({
              type: 'image',
              src: src,
              width,
              height,
              x,
              y,
            });
          }}
          rowsNumber={2}
        />
      )}

      {/* Message Display */}
      {message && (
        <div style={{ 
          marginTop: '10px', 
          padding: '8px', 
          backgroundColor: message.includes('❌') ? 'rgba(245, 86, 86, 0.1)' : 'rgba(15, 153, 96, 0.1)',
          border: `1px solid ${message.includes('❌') ? 'rgba(245, 86, 86, 0.3)' : 'rgba(15, 153, 96, 0.3)'}`,
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {message}
        </div>
      )}

      {/* Add Design Modal */}
      <AddDesignModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddDesignTemplate}
      />
    </>
  );
});

const StableDiffusionPanel = observer(({ store }) => {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <GenerateTab store={store} />
    </div>
  );
});

// define the new custom section
export const StableDiffusionSection = {
  name: 'stable-diffusion',
  Tab: (props) => (
    <SectionTab name="AI Img" {...props}>
      <Clean />
    </SectionTab>
  ),
  // we need observer to update component automatically on any store changes
  Panel: StableDiffusionPanel,
};

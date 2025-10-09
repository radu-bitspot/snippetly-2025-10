import { nanoid } from 'nanoid';
import { storage } from './storage';

// Django API configuration
const getApiBaseUrl = () => {
  // Always use full server URL to avoid proxy issues with images/previews
  return 'http://79.137.67.72:8000/api';
};

// For reference: Old proxy-based approach (kept as comment)
// const getApiBaseUrl = () => {
//   if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
//     return '/api'; // Use Vite proxy in development
//   }
//   return 'http://79.137.67.72:8000/api';
// };

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  
  return {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json',
  };
};

const getAuthFormHeaders = () => ({
  'Authorization': `Token ${localStorage.getItem('authToken')}`,
});

// Helper function to convert blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};



// Django API functions for designs
export async function listDesigns() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/designs/`, {
      headers: getAuthHeaders(),
    });
    
    console.log('📡 API Response status:', response.status);
    console.log('📡 API Response headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      const data = await response.json();
      console.log('📋 Raw API data:', data);
      
      const mappedData = data.results ? data.results.map(design => ({
        id: design.id,
        name: design.name,
        userId: design.user || design.user_id || design.owner || design.created_by,
        tags: design.tags || [],
        // Folosim endpoint-ul de preview direct din Django cu URL complet
        previewURL: design.id ? `${getApiBaseUrl()}/designs/${design.id}/preview/?v=${design.updated_at ? new Date(design.updated_at).getTime() : Date.now()}` : null,
        createdAt: design.created_at,
        updatedAt: design.updated_at,
      })) : data.map(design => ({
        id: design.id,
        name: design.name,
        userId: design.user || design.user_id || design.owner || design.created_by,
        tags: design.tags || [],
        // Folosim endpoint-ul de preview direct din Django cu URL complet
        previewURL: design.id ? `${getApiBaseUrl()}/designs/${design.id}/preview/?v=${design.updated_at ? new Date(design.updated_at).getTime() : Date.now()}` : null,
        createdAt: design.created_at,
        updatedAt: design.updated_at,
      }));
      
      console.log('📋 Mapped designs:', mappedData);
      
      // ⚠️ FILTRU TEMPORAR PE FRONTEND - TREBUIE FIXAT PE BACKEND!
      const currentUserId = localStorage.getItem('userId');
      const totalDesigns = mappedData.length;
      
      const filteredDesigns = mappedData.filter(design => {
        // Dacă design-ul nu are userId, îl arătăm (backward compatibility)
        if (!design.userId) {
          console.warn('⚠️ Design fără userId detectat:', design.id, '- Backend-ul NU trimite user info!');
          return true;
        }
        // Convertește ambele la string pentru comparație sigură
        return String(design.userId) === String(currentUserId);
      });
      
      if (filteredDesigns.length !== totalDesigns) {
        console.warn(
          `🔒 SECURITY WARNING: Backend returnează design-uri de la alți useri!\n` +
          `   Total primit: ${totalDesigns}\n` +
          `   Filtrat pe frontend: ${filteredDesigns.length}\n` +
          `   ⚠️ TREBUIE FIXAT PE BACKEND: get_queryset() trebuie să filtreze pe user!`
        );
      }
      
      console.log('📋 Designs după filtrare pe user:', filteredDesigns);
      return filteredDesigns;
    } else if (response.status === 401) {
      // Authentication error - return empty but show clear message
      const errorText = await response.text();
      console.warn('⚠️ Authentication required:', errorText);
      return { error: 'authentication_required', message: 'Trebuie să te autentifici pentru a vedea design-urile' };
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to fetch designs:', response.status, errorText);
      return { error: 'api_error', message: `Eroare API: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Error fetching designs:', error);
    return { error: 'network_error', message: 'Eroare de rețea - verifică conexiunea' };
  }
}

export async function deleteDesign({ id }) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/designs/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete design: ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting design:', error);
    throw error;
  }
}

export async function loadById({ id }) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/designs/${id}/`, {
      headers: getAuthHeaders(),
    });
    
    if (response.ok) {
      const design = await response.json();
      
      // Parse store JSON
      let storeJSON = design.store_json;
      if (typeof storeJSON === 'string') {
        storeJSON = JSON.parse(storeJSON);
      }
      
      return { 
        storeJSON, 
        name: design.name,
        id: design.id 
      };
    } else {
      throw new Error(`Failed to load design: ${response.status}`);
    }
  } catch (error) {
    console.error('Error loading design:', error);
    throw error;
  }
}

export async function saveDesign({ storeJSON, preview, name, id, tags }) {
  console.log('💾 Saving design to database...');
  
  try {
    // Convert preview blob to base64 if it's a blob
    let previewData = preview;
    if (preview instanceof Blob) {
      previewData = await blobToBase64(preview);
    }
    
    const designData = {
      name: name || 'Untitled Design',
      store_json: typeof storeJSON === 'string' ? storeJSON : JSON.stringify(storeJSON),
      preview_data: previewData,
      tags: tags || [], // Array of tags: ['instagram', 'story-teaser', etc.]
    };
    
    let response;
    let designId = id;
    
    if (id) {
      // Update existing design
      response = await fetch(`${getApiBaseUrl()}/designs/${id}/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(designData),
      });
    } else {
      // Create new design
      response = await fetch(`${getApiBaseUrl()}/designs/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(designData),
      });
    }
    
    if (response.ok) {
      const result = await response.json();
      designId = result.id;
      console.log('✅ Design saved successfully:', designId);
      return { id: designId, status: 'saved' };
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to save design:', response.status, errorText);
      throw new Error(`Failed to save design: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error saving design:', error);
    throw error;
  }
}

export const getPreview = async ({ id }) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/designs/${id}/preview/`, {
      headers: getAuthHeaders(),
      mode: 'cors',
    });
    
    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } else {
      console.warn(`Preview not available for design ${id}, status: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching preview for design ${id}:`, error);
    return null;
  }
};

// Function for updating the name of an existing design
export const updateDesign = async ({ id, name }) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/designs/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    
    if (response.ok) {
      return { id, status: 'updated' };
    } else {
      throw new Error(`Failed to update design: ${response.status}`);
    }
  } catch (error) {
    console.error('Error updating design:', error);
    throw error;
  }
};

// Helper function that needs to be defined before use
const batchCall = (asyncFunction) => {
  let cachedPromise = null;
  return async (...args) => {
    if (!cachedPromise) {
      cachedPromise = asyncFunction(...args).catch((error) => {
        // Reset cachedPromise on error to allow retry
        cachedPromise = null;
        throw error;
      });
    }
    return cachedPromise;
  };
};

// Legacy cloud functions (kept for backward compatibility but now use localStorage as fallback)
const isSignedIn = () => {
  return window.puter?.auth?.isSignedIn();
};

const withTimeout =
  (fn, name) =>
  async (...args) => {
    const startTime = Date.now();
    const timeoutId = setTimeout(async () => {
      // Log timeout error with Sentry
      const error = new Error('API call timeout');
      try {
        const req = await fetch('https://api.puter.com/version');
        const version = await req.json();

        window.Sentry?.captureException(error, {
          extra: {
            function: name,
            arguments: args,
            elapsedTime: Date.now() - startTime,
            user: await window.puter?.auth?.getUser(),
            version,
            size: JSON.stringify(args).length,
          },
        });
      } catch (e) {
        window.Sentry?.captureException(
          new Error('Failed to log error to Sentry: ' + e.message)
        );
      }
    }, 15000);

    try {
      const result = await fn(...args);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

const writeFile = withTimeout(async function writeFile(fileName, data) {
  if (isSignedIn()) {
    await window.puter.fs.write(fileName, data, { createMissingParents: true });
  } else {
    await storage.setItem(fileName, data);
  }
}, 'writeFile');

const readFile = withTimeout(async function readFile(fileName) {
  if (isSignedIn()) {
    return await window.puter.fs.read(fileName);
  }
  return await storage.getItem(fileName);
}, 'readFile');

const deleteFile = withTimeout(async function deleteFile(fileName) {
  if (isSignedIn()) {
    return await window.puter.fs.delete(fileName);
  }
  return await storage.removeItem(fileName);
}, 'deleteFile');

const readKv = withTimeout(async function readKv(key) {
  if (isSignedIn()) {
    return await window.puter.kv.get(key);
  } else {
    return await storage.getItem(key);
  }
}, 'readKv');

const writeKv = withTimeout(async function writeKv(key, value) {
  if (isSignedIn()) {
    return await window.puter.kv.set(key, value);
  } else {
    return await storage.setItem(key, value);
  }
}, 'writeKv');

export async function backupFromLocalToCloud() {
  const localDesigns = (await storage.getItem('designs-list')) || [];
  for (const design of localDesigns) {
    const storeJSON = await storage.getItem(`designs/${design.id}.json`);
    const preview = await storage.getItem(`designs/${design.id}.jpg`);
    await writeFile(`designs/${design.id}.json`, storeJSON);
    await writeFile(`designs/${design.id}.jpg`, preview);
  }
  const cloudDesigns = (await window.puter.kv.get('designs-list')) || [];
  cloudDesigns.push(...localDesigns);
  await window.puter.kv.set('designs-list', cloudDesigns);
  await storage.removeItem('designs-list');
  for (const design of localDesigns) {
    await storage.removeItem(`designs/${design.id}.json`);
    await storage.removeItem(`designs/${design.id}.jpg`);
  }
  return cloudDesigns.length;
}

export const listAssets = async () => {
  const list = (await readKv('assets-list')) || [];
  for (const asset of list) {
    asset.src = await getAssetSrc({ id: asset.id });
    asset.preview = await getAssetPreviewSrc({ id: asset.id });
  }
  return list;
};

export const getAssetSrc = async ({ id }) => {
  if (window.puter.auth.isSignedIn()) {
    const subdomain = await getPublicSubDomain();
    return `https://${subdomain}.puter.site/${id}`;
  } else {
    const file = await readFile(`uploads/${id}`);
    return URL.createObjectURL(file);
  }
};

export const getAssetPreviewSrc = async ({ id }) => {
  if (window.puter.auth.isSignedIn()) {
    const subdomain = await getPublicSubDomain();
    return `https://${subdomain}.puter.site/${id}-preview`;
  } else {
    const file = await readFile(`uploads/${id}-preview`);
    console.log('file', file);
    return URL.createObjectURL(file);
  }
};

export const uploadAsset = async ({ file, preview, type }) => {
  const list = await listAssets();
  const id = nanoid(10);
  await writeFile(`uploads/${id}`, file);
  await writeFile(`uploads/${id}-preview`, preview);
  list.push({ id, type });
  await writeKv('assets-list', list);

  const src = await getAssetSrc({ id });
  const previewSrc = await getAssetPreviewSrc({ id });
  return { id, src, preview: previewSrc };
};

export const deleteAsset = async ({ id }) => {
  const list = await listAssets();
  const newList = list.filter((asset) => asset.id !== id);
  await writeKv('assets-list', newList);
};

let subDomainCache = null;
const getPublicSubDomain = batchCall(async () => {
  if (subDomainCache) {
    return subDomainCache;
  }
  // fist we need to validate domain
  const sites = await window.puter.hosting.list();
  const user = await window.puter.auth.getUser();
  const prefix = user.username + '-pltn-pld';
  let subdomain = prefix;
  const existingDomain = sites.find(
    (site) => site.subdomain.indexOf(prefix) >= 0
  );

  if (existingDomain) {
    subDomainCache = existingDomain.subdomain;
    return existingDomain.subdomain;
  }
  let attempt = 1;
  while (attempt < 10) {
    const postfix = attempt > 1 ? `-${attempt}` : '';
    subdomain = `${prefix}${postfix}`;
    try {
      await window.puter.fs.mkdir('uploads', { createMissingParents: true });
      await window.puter.hosting.create(subdomain, 'uploads');
      break;
    } catch (error) {
      attempt++;
      continue;
    }
  }
  if (attempt >= 10) {
    throw new Error('Failed to create subdomain');
  }
  subDomainCache = subdomain;
  return subdomain;
});

// Configurații pentru diferite tipuri de design cu prompt-uri predefinite

// Stiluri default (hardcoded)
const DEFAULT_TEMPLATES = {
  'colaj-digital': {
    name: 'Colaj Digital Editorial',
    description: 'Stilul va combina fotografii alb-negru cu accente colorate, texturi de hârtie și elemente grafice dinamice. Prompt-ul tău va fi integrat ca temă principală în acest stil.',
    prompt: `Creează o imagine stil colaj digital, cu o estetică modernă și editorială, care combină fotografii alb-negru cu accente puternice colorate și elemente grafice dinamice. Include decupaje stil hârtie ruptă, texturi discrete tip hârtie reciclată sau ziar, contururi groase și stilizate în jurul personajelor principale și obiectelor. Adaugă fundaluri monocromatice în culori vibrante și contrastante precum albastru intens, roșu închis sau galben puternic. Integrează subtil elemente grafice precum benzi adezive, săgeți sau simboluri minimaliste, pentru a accentua ideea de dinamică și noutate.

Elemente-cheie:
- Fotografii monocrome (alb-negru) stilizate
- Accente colorate intense și contrastante  
- Texturi de hârtie și colaj
- Elemente grafice stil decupaj și benzi adezive
- Fundaluri colorate puternic, fără detalii excesive
- Contur alb sau colorat evidențiat în jurul personajelor și obiectelor

Tema/subiect: {userPrompt}`
  },
  
  'retro-synthwave': {
    name: 'Retro Synthwave',
    description: 'Stil retro-futurist anii \'80 cu neon, grid-uri și gradienți vibranți în nuanțe de roz și cyan.',
    prompt: `Creează o imagine în stil retro synthwave anii '80, cu o estetică cyber-futuristă. Include elemente precum:

Elemente vizuale:
- Gradienți vibranți în nuanțe de roz neon, cyan, violet și magenta
- Grid-uri geometrice și linii perspective care se pierd în infinit
- Efecte de lumină neon și glow intense
- Texturi metalice și chrome reflectorizante
- Fundaluri cu soare sau lună în gradient către orizont
- Forme geometrice simple și stilizate

Culori dominante:
- Roz neon (#FF0080)
- Cyan electric (#00FFFF) 
- Violet (#8A2BE2)
- Negru profund pentru contrast

Tema/subiect: {userPrompt}`
  },

  'minimalist-geometric': {
    name: 'Geometric Minimalist',
    description: 'Design minimalist cu forme geometrice simple, spații albe și accent pe o singură culoare vibrantă.',
    prompt: `Creează o imagine în stil geometric minimalist, cu un design curat și simplu. Include următoarele caracteristici:

Principii de design:
- Spații albe generoase și respirație vizuală
- Forme geometrice simple: cercuri, pătrate, triunghiuri
- Maxim 2-3 culori în întreaga compoziție
- Linii curate și contururi precise
- Simetrie sau echilibru asimetric calculat
- Fără texturi complexe sau detalii excesive

Paleta de culori:
- Predominant alb sau gri foarte deschis
- O culoare vibrantă ca accent (albastru, roșu, galben)
- Negru pentru contururi și text (dacă e necesar)

Tema/subiect: {userPrompt}`
  },

  'watercolor-artistic': {
    name: 'Acuarelă Artistică',
    description: 'Stil acuarelă cu pete de culoare, tranziții moi și texturi organice pictate manual.',
    prompt: `Creează o imagine în stil acuarelă artistică, cu tehnica tradițională de pictură în acuarelă. Include:

Tehnici acuarelă:
- Pete și împrăștierea naturală a culorilor
- Gradienți moi și tranziții fluide între nuanțe
- Texturi organice și efecte de uscare a vopselei
- Contururi suave, nu linii dure
- Suprapuneri transparente de culoare
- Zone unde hârtia albă rămâne vizibilă

Paleta de culori:
- Nuanțe naturale și armonioase
- Efecte de transparență și luminozitate
- Culori care se contopesc organic
- Accente de culoare pură în anumite zone

Tema/subiect: {userPrompt}`
  }
};

// Custom templates stored in localStorage
const CUSTOM_TEMPLATES_KEY = 'custom_design_templates';

// Function to get custom templates from localStorage
const getCustomTemplates = () => {
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading custom templates:', error);
    return {};
  }
};

// Function to save custom templates to localStorage
const saveCustomTemplates = (templates) => {
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving custom templates:', error);
  }
};

// Function to get all templates (default + custom)
export const DESIGN_TEMPLATES = () => ({
  ...DEFAULT_TEMPLATES,
  ...getCustomTemplates()
});

// Function to add a new custom template
export const addCustomTemplate = (templateData) => {
  const customTemplates = getCustomTemplates();
  
  customTemplates[templateData.key] = {
    name: templateData.name,
    description: templateData.description,
    prompt: templateData.prompt,
    isCustom: true
  };
  
  saveCustomTemplates(customTemplates);
  return true;
};

// Function to delete a custom template
export const deleteCustomTemplate = (templateKey) => {
  const customTemplates = getCustomTemplates();
  
  if (customTemplates[templateKey]) {
    delete customTemplates[templateKey];
    saveCustomTemplates(customTemplates);
    return true;
  }
  
  return false;
};

// Helper function pentru a obține prompt-ul complet
export const getDesignPrompt = (designType, userPrompt) => {
  const templates = DESIGN_TEMPLATES();
  const template = templates[designType];
  if (!template || !userPrompt) return userPrompt;
  
  return template.prompt.replace('{userPrompt}', userPrompt);
};

// Helper function pentru a obține lista de design-uri
export const getDesignOptions = () => {
  const templates = DESIGN_TEMPLATES();
  return Object.entries(templates).map(([key, value]) => ({
    value: key,
    label: value.name,
    description: value.description,
    isCustom: value.isCustom || false
  }));
};

// Design-ul implicit
export const DEFAULT_DESIGN_TYPE = 'colaj-digital'; 
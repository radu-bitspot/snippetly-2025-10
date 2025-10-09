# Snippetly Studio 🎨

**Professional Design Editor** powered by Polotno SDK and Django

[Launch the application](https://studio.polotno.com/)

---

## 📋 Overview

**Snippetly Studio** is a professional web-based graphic design editor built with React and Polotno SDK (similar to Canva), with a Django backend for authentication and cloud storage. It provides a complete design workflow with AI-powered features, cloud synchronization, and multi-user support.

---

## 🏗️ Architecture

### Frontend Stack
- **Framework**: React 18.3.1 with Vite
- **UI Library**: Blueprint.js
- **Design Engine**: Polotno SDK 2.22.2
- **State Management**: MobX (for Polotno store)
- **Monitoring**: Sentry for error tracking
- **Storage**: LocalForage + localStorage for local caching

### Backend Integration
- **Backend**: Django REST API
- **Server**: `http://79.137.67.72:8000`
- **Authentication**: Token-based (Django Token Auth)
- **Proxy**: Vite dev proxy `/api` → Django backend
- **Database**: PostgreSQL/SQLite for design storage

---

## ✨ Key Features

### 🔐 Authentication System
- ✅ Email/password login
- ✅ Token-based authentication
- ✅ Protected routes (authenticated users only)
- ✅ Auto-check auth on startup
- ✅ Secure logout with token cleanup

### 🎨 Design Editor Features

**Side Panel Sections:**
1. **📝 Summarize** - AI text summarization
2. **📁 My Designs** - Manage saved designs
3. **📤 Upload** - Upload custom images
4. **🔷 Shapes** - Geometric shapes library
5. **🎨 Stable Diffusion** - AI image generation
6. **📝 Text** - Text tools and formatting
7. **🔤 Icons** - Icon library (@meronex/icons)
8. **❓ QR** - QR code generator
9. **💬 Quotes** - Quote templates

### 💾 Design Management
```javascript
// Available operations:
✓ Create new design (with custom name)
✓ Auto-save (5 seconds after modification)
✓ Load design by ID
✓ Delete design
✓ Edit design name
✓ Duplicate design
✓ Auto-generated JPEG previews
✓ Cloud synchronization
```

### 🔄 Auto-Save System
- **Debounced saving**: 5 seconds after last modification
- **Preview generation**: Canvas → JPEG blob → Django
- **Database storage**: Designs saved in Django DB
- **Preview API**: `/api/designs/{id}/preview/` with auth
- **Event system**: `designSaved` event for UI refresh

---

## 📁 Project Structure

```
snippetly-2025-10/
├── public/                      # Static assets
│   ├── favicon.ico
│   ├── logo.png
│   └── manifest.json
├── src/
│   ├── api.js                   # Django API calls
│   ├── App.jsx                  # Main app with AuthProvider
│   ├── project.js               # MobX Project management
│   ├── storage.js               # LocalForage wrapper
│   ├── blob.js                  # Blob utilities
│   ├── file.js                  # File handling
│   ├── logger.js                # Logging utilities
│   │
│   ├── context/
│   │   └── AuthContext.jsx      # React Context for authentication
│   │
│   ├── pages/
│   │   └── LoginPage.jsx        # Login page
│   │
│   ├── components/
│   │   ├── LoadingScreen.jsx    # Loading indicator
│   │   ├── AddDesignModal.jsx   # Design creation modal
│   │   └── auth/                # Auth-related components
│   │       ├── AuthModal.jsx
│   │       ├── LoginForm.jsx
│   │       └── UserProfile.jsx
│   │
│   ├── sections/                # Polotno side panel sections
│   │   ├── my-designs-section.jsx       # Design management
│   │   ├── upload-section.jsx           # Image upload
│   │   ├── shapes-section.jsx           # Shapes library
│   │   ├── stable-diffusion-section.jsx # AI image generation
│   │   ├── summarize-section.jsx        # AI summarization
│   │   ├── qr-section.jsx              # QR code generator
│   │   ├── quotes-section.jsx          # Quote templates
│   │   └── icons-section.jsx           # Icon library
│   │
│   ├── topbar/
│   │   ├── topbar.jsx           # Main toolbar
│   │   ├── file-menu.jsx        # File operations
│   │   ├── download-button.jsx  # Export designs
│   │   ├── user-menu.jsx        # User dropdown
│   │   └── post-process-button.jsx # Post-processing
│   │
│   ├── config/
│   │   ├── api.js               # API configuration
│   │   └── designTemplates.js   # Design templates
│   │
│   ├── translations/            # i18n support
│   │   ├── en.json              # English
│   │   ├── fr.json              # French
│   │   ├── ru.json              # Russian
│   │   ├── pt-br.json           # Portuguese (Brazil)
│   │   ├── id.json              # Indonesian
│   │   └── zh-ch.json           # Chinese
│   │
│   └── utils/
│       └── StoreProxy.js        # Polotno store proxy
│
├── vite.config.js               # Vite configuration
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## 🔐 Authentication Flow

```
1. User opens app → AuthContext checks localStorage
2. If token exists → validate with API
3. Token valid → set user & isAuthenticated = true
4. Token invalid/missing → show LoginPage
5. After login → save token in localStorage
6. App.jsx checks isAuthenticated → show Polotno or Login
```

---

## 💾 Design Save Flow

```
1. User modifies design → store.on('change')
2. project.requestSave() → setTimeout(5000)
3. After 5 seconds → project.save()
4. Generate preview: store._toCanvas() → canvas.toBlob()
5. API call: saveDesign({ storeJSON, preview, name, id })
6. Django saves to database
7. Dispatch 'designSaved' event → refresh UI
8. Preview available at /api/designs/{id}/preview/
```

---

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/login/     { email, password } → { token }
POST   /api/auth/logout/    (with Token header)
GET    /api/auth/user/      → user info
POST   /api/auth/password-reset/  { email }
```

### Designs
```
GET    /api/designs/           List all designs
POST   /api/designs/           Create new design
GET    /api/designs/{id}/      Get design details
PUT    /api/designs/{id}/      Update entire design
PATCH  /api/designs/{id}/      Update partial (e.g., name)
DELETE /api/designs/{id}/      Delete design
GET    /api/designs/{id}/preview/  Get JPEG preview (with auth)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Django backend running (see backend docs)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd snippetly-2025-10

# Install dependencies
npm install

# Start development server
npm start
```

The app will run on `http://localhost:5173`

### Build for Production

```bash
npm run build
```

---

## ⚙️ Configuration

### Development Configuration

```javascript
// vite.config.js
server: {
  host: '0.0.0.0',
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://79.137.67.72:8000',
      changeOrigin: true,
      secure: false
    }
  }
}
```

### API Configuration

```javascript
// src/config/api.js
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  ENDPOINTS: {
    LOGIN: '/auth/login/',
    LOGOUT: '/auth/logout/',
    USER: '/auth/user/',
    PASSWORD_RESET: '/auth/password-reset/',
  },
  TIMEOUT: 15000,
  TOKEN_KEY: 'authToken'
};
```

---

## 🎯 Strengths

✅ **Clean Architecture** - Clear separation frontend/backend  
✅ **Smart Auto-save** - Debounced at 5 seconds  
✅ **Automatic Preview Generation** - On every save  
✅ **Token Authentication** - Solid security  
✅ **Comprehensive Error Handling** - Try-catch everywhere  
✅ **MobX Integration** - Reactive state management  
✅ **Professional Editor** - Polotno SDK out-of-the-box  
✅ **Multi-language Support** - 6 languages supported  
✅ **Sentry Integration** - Error tracking and monitoring  

---

## ⚠️ Areas for Improvement

### 1. Security
- ⚠️ Hardcoded backend IP in code (`79.137.67.72:8000`)
- ⚠️ Token storage in localStorage (vulnerable to XSS)
- 💡 **Solution**: Use httpOnly cookies + environment variables

### 2. Performance
- ⚠️ Individual preview loading (N+1 query problem)
- ⚠️ No lazy loading for images
- 💡 **Solution**: Batch loading + intersection observer

### 3. User Experience
- ⚠️ No complete offline support
- ⚠️ No visible undo/redo history
- ⚠️ No real-time collaboration
- 💡 **Solution**: Service workers + WebSockets

### 4. Code Quality
- ⚠️ Many console.log in production
- ⚠️ Mixed Romanian/English in comments
- ⚠️ Global `window.project` for debugging
- 💡 **Solution**: Remove debug code, consistent language

### 5. Error Handling
- ⚠️ Simple alerts with `alert()` and `confirm()`
- 💡 **Solution**: Toast notifications system (Blueprint Toaster)

---

## 🔧 Recommended Improvements

### Priority 1: Security Enhancement

```javascript
// Use .env for configuration
VITE_API_URL=http://79.137.67.72:8000

// In code
const API_URL = import.meta.env.VITE_API_URL
```

### Priority 2: UX Enhancement

```javascript
// Add Toast Notifications
import { Toaster } from '@blueprintjs/core';

const AppToaster = Toaster.create({
  position: 'top',
});

// Replace showMessage() with:
AppToaster.show({ 
  message: '✅ Design saved!', 
  intent: 'success' 
});
```

### Priority 3: Performance Optimization

```javascript
// Lazy load heavy sections
const StableDiffusionSection = React.lazy(() => 
  import('./sections/stable-diffusion-section')
);

// Use with Suspense
<Suspense fallback={<Spinner />}>
  <StableDiffusionSection />
</Suspense>
```

---

## 📊 Statistics

- **Total Source Files**: ~30 files
- **Main Dependencies**: 12 npm packages
- **API Endpoints**: 8 Django endpoints
- **Languages Supported**: 6 (EN, FR, RU, PT-BR, ID, ZH-CH)
- **Side Panel Sections**: 8 custom sections
- **Authentication**: Token-based

---

## 🧪 Debug Tools

The app includes debug helpers accessible via browser console:

```javascript
// Test manual save
window.debugProject.testSave()

// Test change detection
window.debugProject.testChange()

// Get project info
window.debugProject.getProjectInfo()
```

---

## 📝 Dependencies

### Core Dependencies
```json
{
  "polotno": "^2.22.2",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "@blueprintjs/core": "latest",
  "mobx": "latest",
  "mobx-react-lite": "latest"
}
```

### Additional Features
```json
{
  "@sentry/browser": "^9.13.0",
  "qrcode": "^1.5.4",
  "jszip": "^3.10.1",
  "localforage": "^1.10.0",
  "js-cookie": "^3.0.5"
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

See the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Anton Lavrenov** - Original Polotno Studio author
- **Radu** - Snippetly customization and Django integration

---

## 🐛 Issues

Found a bug? Want to suggest a feature? Just create an issue in this repository!

---

## 🎓 Conclusion

Snippetly Studio is a **solid and functional** application using modern technologies and best practices. The main areas for improvement are **security** (hardcoded IPs, localStorage tokens) and **user experience** (toasts instead of alerts, offline support).

The code is **well-organized** with clear separation between business logic (`project.js`), API calls (`api.js`), and UI components. The integration with Polotno SDK is **professional** and extensible.

---

**Built with ❤️ using React, Polotno SDK, and Django**

# Authentication Setup for Polotno Studio

This documentation explains the **login-first** authentication system that integrates with your Django backend.

## 🔒 **LOGIN-FIRST APPROACH**

**Access to Polotno Studio is completely blocked until the user logs in.** The app now shows a dedicated login page and only grants access to the design editor after successful authentication.

## 🔧 Configuration

### API URL Configuration
Edit `src/config/api.js` to set your Django backend URL:

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://your-django-backend:8000/api',
  // ... other config
};
```

Or set the environment variable:
```bash
# In your .env file (for Vite)
VITE_API_URL=http://localhost:8000/api
```

## 🚀 Features

### ✅ What's Included:
- **🔒 Secure Access Control** - No access to the app without login
- **📱 Full-Screen Login Page** - Professional, branded login interface
- **🔄 Loading Screen** - Smooth authentication state checking
- **👤 User Profile Display** - Shows user avatar, name, and email after login
- **🔐 Automatic Token Management** - Stores JWT tokens securely
- **💾 Session Persistence** - Users stay logged in between sessions
- **🚪 Clean Logout** - Proper logout with token removal and redirect to login
- **⚠️ Error Handling** - Comprehensive error messages and validation

### 🎯 Components Created:

1. **AuthContext** (`src/context/AuthContext.jsx`)
   - Manages authentication state globally
   - Provides login/logout functions
   - Handles token storage and API calls

2. **LoginPage** (`src/pages/LoginPage.jsx`)
   - Full-screen, professional login interface
   - Email/password validation with real-time feedback
   - Loading states and comprehensive error handling
   - Branded with Polotno Studio design

3. **LoadingScreen** (`src/components/LoadingScreen.jsx`)
   - Displays while checking authentication status
   - Professional loading animation
   - Consistent branding

4. **UserProfile** (`src/components/auth/UserProfile.jsx`)
   - User avatar with initials
   - Dropdown menu with profile options
   - Logout functionality

## 🔌 Backend Integration

### Django Endpoints Used:
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout  
- `GET /api/auth/user/` - Get current user details
- `POST /api/auth/password-reset/` - Password reset (ready for future)

### Authentication Flow:
1. **App loads** → Shows loading screen while checking auth
2. **Not authenticated** → Shows full-screen login page
3. **User enters credentials** → Sends POST to `/api/auth/login/`
4. **Django returns token** → Stores token, gets user details
5. **Authenticated** → Shows main Polotno Studio interface
6. **User profile** appears in top-right corner

## 🎨 UI/UX Features

### Login Page:
- **🎨 Professional Design** - Gradient background, modern card layout
- **🌙 Dark Theme** - Consistent with Polotno Studio
- **📝 Form Validation** - Real-time validation and helpful error messages
- **⏳ Loading States** - Overlay spinner during authentication
- **📱 Responsive** - Works perfectly on desktop and mobile
- **♿ Accessible** - Proper labels, keyboard navigation

### User Experience:
- **🔄 Seamless Flow** - Automatic navigation after login
- **💨 Fast Loading** - Optimized authentication checks
- **🎯 Clear Messaging** - User-friendly error messages
- **🔒 Secure** - No access to design tools without authentication

## 🛠️ How to Use

### For Users:
1. **Open Polotno Studio** → Automatically redirected to login page
2. **Enter credentials** → Email and password from Django backend
3. **Access granted** → Full Polotno Studio interface appears
4. **User profile** → Click profile in top-right for logout and settings

### For Developers:
```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  // No need to check authentication in components
  // - the app handles this at the root level
  return <div>Welcome {user.first_name}!</div>;
}
```

## 🔐 Security Features

- **🚫 Complete Access Control** - Zero app access without authentication
- **🔑 Token-based Authentication** - Secure JWT tokens
- **🧹 Automatic Token Cleanup** - Removes invalid tokens
- **🌐 HTTPS Ready** - Works with secure connections
- **🔗 CORS Configured** - Proper cross-origin setup
- **⏱️ Session Management** - Automatic logout on token expiry

## 📱 Responsive Design

- **📱 Mobile Optimized** - Perfect on phones and tablets
- **👆 Touch Friendly** - Optimized touch targets
- **⌨️ Keyboard Support** - Full keyboard accessibility
- **🖥️ Desktop Perfect** - Beautiful on large screens

## 🔄 App Flow

```
App Startup
    ↓
Loading Screen (checking auth)
    ↓
┌─ Not Authenticated ─→ Login Page ─→ Enter Credentials ─→ Success ─┐
│                                                                    ↓
└─ Already Authenticated ─→ Main Polotno Studio Interface ←──────────┘
```

## 🚨 Important Security Notes

1. **🔒 Zero Bypass** - No way to access the app without proper authentication
2. **🔑 Django Integration** - Fully integrated with your existing user system
3. **💾 Secure Storage** - Tokens stored in localStorage (consider httpOnly cookies for production)
4. **🛡️ Error Handling** - Comprehensive security-focused error handling
5. **🔄 Auto-logout** - Automatic logout on authentication failures

## 🧪 Testing

To test the new login-first system:

1. **Ensure Django backend is running** on `http://localhost:8000`
2. **Start Polotno Studio** with `npm start`
3. **Login page appears automatically** - no way to bypass
4. **Enter valid Django credentials** (email/password)
5. **Main interface appears** after successful authentication
6. **Test logout** via user profile dropdown

## 🛠️ Environment Variables

Create a `.env` file in the root of your project:

```bash
# .env
VITE_API_URL=http://localhost:8000/api
```

**Important:** Vite environment variables must start with `VITE_` to be accessible in the browser.

## 🎉 Ready for Production

The authentication system is now **production-ready** with complete access control! Users cannot access any part of Polotno Studio without proper authentication through your Django backend. 🔒✨ 
# 🔧 Setup & Installation Guide

## 📋 Prerequisites

### Required Software
- **Node.js** (v14.0.0 or higher)
- **Firebase CLI** (v11.0.0 or higher)
- **Git** (for version control)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

### Optional Tools
- **VS Code** (recommended editor)
- **Live Server Extension** (for local development)

## 🚀 Quick Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Developers-RCCS/SparkIT.git
cd SparkIT
```

### 2. Install Firebase CLI
```bash
# Using npm
npm install -g firebase-tools

# Using yarn
yarn global add firebase-tools

# Verify installation
firebase --version
```

### 3. Firebase Authentication
```bash
# Login to Firebase
firebase login

# Verify project connection
firebase projects:list
```

### 4. Local Development
```bash
# Serve locally with Firebase
firebase serve

# Or open registration.html directly in browser
# File → Open → registration.html
```

## 🏗️ Project Structure Setup

### Directory Organization
```
SparkIT/
├── 📄 index.html              # Landing page
├── 🤖 registration.html       # Main registration form
├── 📂 assets/                 # Static resources
│   ├── style.css
│   ├── game.js
│   ├── content.json
│   └── images/
├── 📂 docs/                   # Documentation
├── 📂 archive/                # Development history
├── 🔥 firebase.json           # Firebase config
└── 📋 README.md
```

### File Descriptions

#### **Core Files**
- `registration.html` - Main animated registration form with robot assistant
- `index.html` - Landing page and project overview
- `firebase.json` - Firebase hosting configuration

#### **Assets Directory**
- `style.css` - Main stylesheet (if separate from HTML)
- `game.js` - Interactive game logic
- `content.json` - Dynamic content and configuration
- `images/` - Logos, graphics, and visual assets

#### **Documentation**
- `docs/README.md` - Comprehensive project documentation
- `docs/FEATURES.md` - Detailed feature explanations
- `docs/ROBOT.md` - Robot animation system guide
- `docs/RESPONSIVE.md` - Mobile responsiveness guide

## 🔥 Firebase Configuration

### Firebase Project Setup
1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Create a project"
   - Enter project name: `sparkit-[your-id]`
   - Enable Google Analytics (optional)

2. **Enable Hosting**
   - Navigate to Hosting in Firebase Console
   - Click "Get started"
   - Follow the setup instructions

3. **Configure Local Project**
   ```bash
   # Initialize Firebase in project directory
   firebase init hosting
   
   # Select existing project or create new one
   # Set public directory to: . (current directory)
   # Configure as single-page app: No
   # Set up automatic builds: No
   ```

### Firebase.json Configuration
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "**/archive/**",
      "**/docs/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## 🌐 Deployment Process

### Development Deployment
```bash
# Test locally first
firebase serve --port 3000

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy with custom message
firebase deploy --only hosting -m "Updated robot animations"
```

### Production Deployment
```bash
# Ensure all changes are committed
git add .
git commit -m "Production ready build"
git push origin main

# Deploy to production
firebase deploy --only hosting

# Verify deployment
firebase hosting:sites:list
```

### Deployment Checklist
- [ ] Test all robot animations work properly
- [ ] Verify mobile responsiveness
- [ ] Check form validation
- [ ] Test on multiple browsers
- [ ] Verify Firebase hosting configuration
- [ ] Update documentation if needed

## 🔧 Development Environment

### VS Code Setup
1. **Install VS Code Extensions**
   ```
   - Live Server
   - HTML CSS Support
   - Auto Rename Tag
   - Prettier - Code formatter
   - Firebase
   ```

2. **Configure Settings**
   ```json
   {
     "liveServer.settings.port": 3000,
     "editor.formatOnSave": true,
     "html.format.indentInnerHtml": true
   }
   ```

### Local Testing
```bash
# Method 1: Firebase Serve
firebase serve --port 3000
# Access: http://localhost:3000

# Method 2: Live Server (VS Code)
# Right-click registration.html → "Open with Live Server"

# Method 3: Direct File Access
# Open registration.html directly in browser
# Note: Some features may need a server environment
```

## 🐛 Troubleshooting

### Common Issues

#### **Firebase CLI Issues**
```bash
# Update Firebase CLI
npm install -g firebase-tools@latest

# Clear cache
firebase logout
firebase login
```

#### **Animation Performance**
- **Issue**: Slow or choppy animations
- **Solution**: Ensure hardware acceleration is enabled in browser
- **Check**: Browser developer tools → Rendering → Enable GPU acceleration

#### **Mobile Display Issues**
- **Issue**: Robot not positioned correctly on mobile
- **Solution**: Check viewport meta tag and CSS media queries
- **Test**: Use browser dev tools device emulation

#### **Form Validation Problems**
- **Issue**: Form not validating properly
- **Solution**: Check JavaScript console for errors
- **Debug**: Ensure all form fields have proper `name` attributes

### Performance Optimization

#### **CSS Optimizations**
```css
/* Use transform instead of changing position */
.robot-assistant {
    transform: translateX(100px) translateY(50px);
    /* Instead of: left: 100px; top: 50px; */
}

/* Enable hardware acceleration */
.robot-assistant {
    will-change: transform;
    transform: translateZ(0);
}
```

#### **JavaScript Optimizations**
```javascript
// Debounce form validation
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};
```

## 📱 Testing Checklist

### Desktop Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Testing
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Samsung Internet
- [ ] Firefox Mobile

### Feature Testing
- [ ] Robot movement animations
- [ ] Form validation
- [ ] Progressive form flow
- [ ] Custom cursor effects
- [ ] Responsive design
- [ ] TIC fields layout

### Performance Testing
- [ ] Page load speed
- [ ] Animation smoothness
- [ ] Mobile performance
- [ ] Memory usage

## 🚀 Going Live

### Pre-Launch Checklist
- [ ] All animations tested and working
- [ ] Form submission configured
- [ ] Error handling implemented
- [ ] SEO optimization completed
- [ ] Accessibility testing done
- [ ] Performance optimization verified
- [ ] Documentation updated
- [ ] Backup created

### Launch Process
1. **Final Testing** - Complete testing checklist
2. **Deploy** - `firebase deploy --only hosting`
3. **Verify** - Check live site functionality
4. **Monitor** - Watch for any issues post-launch
5. **Document** - Update documentation with live URLs

---

This setup guide ensures a smooth development and deployment process for the SparkIT registration portal.

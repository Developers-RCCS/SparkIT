# SparkIT — ICT Literacy Initiative Game

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://sparkit-53038.web.app)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An interactive game-based platform for Sri Lanka's ICT literacy initiative, featuring a side-scrolling highway experience with immersive workshops and registration system.

## 🚀 Features

- **Interactive Highway**: Drive through a futuristic highway with branching paths
- **SparkIT Flash Timeline**: Underground vertical mode with workshop milestones
- **Lightning Effects**: Dynamic visual effects with robot companion
- **Registration System**: Phase 1 registration with local storage
- **Mobile Responsive**: Touch controls and adaptive design
- **Accessibility**: Screen reader support and keyboard navigation

## 🎮 Game Controls

### Desktop
- **Movement**: Arrow keys (←/→) or A/D keys
- **Interact**: E key or Enter at branches
- **Timeline**: Down/S key at Phase 1 sign to enter SparkIT Flash
- **Exit Timeline**: Up/W key at top
- **Photo Mode**: F key
- **Pause**: P key
- **Help**: H key
- **Theme Toggle**: T key
- **Close Panels**: Esc key

### Mobile
- **Movement**: Touch the left/right arrow buttons
- **Interact**: Touch the center interaction button
- **Gestures**: Swipe left/right for movement, up/down in timeline

## 🏗️ Technical Architecture

### File Structure
```
SparkIT/
├── index.html              # Main HTML structure
├── assets/
│   ├── game.js             # Core game engine (2259 lines)
│   ├── style.css           # Styling and animations
│   ├── content.json        # Game content and configuration
│   └── images/             # Logo and asset files
├── firebase.json           # Firebase hosting configuration
└── README.md              # This file
```

### Technologies Used
- **HTML5 Canvas** - Main rendering engine
- **Vanilla JavaScript** - Game logic and interactions
- **CSS3** - Styling, animations, and responsive design
- **Firebase Hosting** - Deployment platform
- **Local Storage** - Client-side data persistence

## 🛠️ Development Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for development)
- Firebase CLI (for deployment)

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/Developers-RCCS/SparkIT.git
   cd SparkIT
   ```

2. Start a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. Open `http://localhost:8000` in your browser

### Firebase Deployment
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login and deploy:
   ```bash
   firebase login
   firebase deploy
   ```

## 🎯 Game Mechanics

### Highway Mode (Default)
- Drive along a horizontal highway
- Visit interactive branches for different content
- Experience dynamic lightning effects at Phase 1 sign
- Collect achievements and track progress

### Timeline Mode (SparkIT Flash)
- Vertical underground drilling experience
- Visit workshop milestones:
  - **Workshop 1**: Game Development
  - **Workshop 2**: Capture The Flag (CTF)
  - **Workshop 3**: Programming & Algorithms
- Collect energy orbs and complete hack challenges
- Robot companion transforms based on workshop themes

### Phase System
- **Phase 1**: Registration and foundation building
- **Phase 2**: Advanced topic exploration (locked)
- **Phase 3**: Final showcase and competitions (locked)

## 🎨 Visual Features

### Robot Companion
- Custom animated cursor that follows mouse/touch
- Expressive modes based on game context
- Workshop-specific transformations
- Underground hard-hat mode

### Effects & Animations
- Lightning strikes with particle systems
- Parallax background layers
- Liquid card interactions in panels
- Smooth camera transitions
- Dynamic day/night themes

## 📱 Mobile Optimization

### Responsive Design
- Adaptive canvas rendering
- Touch-friendly controls
- Orientation change handling
- Performance optimization for low-end devices

### Accessibility Features
- Screen reader navigation
- Keyboard-only operation
- High contrast support
- Reduced motion options
- Touch target size compliance

## 🔧 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 80+ | Full support |
| Firefox | 75+ | Full support |
| Safari | 13+ | Full support |
| Edge | 80+ | Full support |
| Mobile Safari | 13+ | Touch optimized |
| Chrome Mobile | 80+ | Touch optimized |

## 📊 Performance

### Optimization Features
- Canvas rendering with DPR scaling
- Particle system culling
- Event listener cleanup
- Memory leak prevention
- Adaptive performance modes

### Metrics
- Target: 60fps on mid-range devices
- Memory usage: <30MB sustained
- Loading time: <2 seconds on 3G

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly across browsers
5. Submit a pull request

### Code Style
- Use consistent indentation (2 spaces)
- Comment complex game logic
- Follow existing naming conventions
- Test on mobile devices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎓 Educational Context

SparkIT is designed to:
- Bridge the digital literacy gap in Sri Lankan schools
- Provide hands-on ICT education through gamification
- Create engaging workshops in programming, robotics, and cybersecurity
- Establish sustainable ICT societies in educational institutions

## 🏆 Acknowledgments

- **RCCS Team** - Development and design
- **SparkIT Initiative** - Educational framework
- **Sri Lankan ICT Community** - Inspiration and support

## 📞 Support

For technical issues or questions:
- **Email**: hello@sparkit.example
- **GitHub Issues**: [Create an issue](https://github.com/Developers-RCCS/SparkIT/issues)
- **Documentation**: [Wiki](https://github.com/Developers-RCCS/SparkIT/wiki)

---

**Made with ❤️ for Sri Lanka's digital future**

# ArchiTech Cybersecurity Website - Development Context

## Project Overview

This is the ArchiTech cybersecurity company website, a modern, interactive web application built with HTML, CSS, and JavaScript. The project focuses on providing an engaging user experience with advanced JavaScript features while maintaining performance and accessibility.

## Key Technologies

- **Core Web Technologies**: HTML5, CSS3, JavaScript (ES6+)
- **Architecture**: Modular ES6 JavaScript with organized directory structure
- **No Build Tools**: Direct deployment without bundlers like Webpack or build systems like npm
- **Performance**: Advanced performance optimizations including lazy loading
- **UX/UI**: Enhanced navigation, interactive components, and accessibility features

## Project Structure

```
/autohtml-project
├── index.html                 # Main homepage
├── signup.html               # User registration page
├── login.html                # User login page
├── css/
│   ├── style.css             # Main stylesheet
│   └── auth.css              # Authentication styles
├── js/
│   ├── main.js               # Main production JavaScript (simplified without Firebase)
│   └── modules/
│       ├── performance/
│       │   ├── lazy-loading.js           # Advanced lazy loading system
│       │   └── performance-optimizer.js  # Performance enhancements
│       ├── ux-enhancements/
│       │   ├── enhanced-navigation.js    # Tab navigation and dropdown enhancements
│       │   └── feedback-system.js        # Notification system
│       ├── interactivity/
│       │   └── price-calculator.js       # Interactive pricing calculator
│       ├── personalization/
│       │   └── personalization-manager.js # User preferences
│       ├── api-integrations/
│       │   └── analytics-integration.js   # Analytics integration
│       ├── spa/
│       │   └── router.js                 # SPA-like routing
│       ├── cms/
│       │   └── content-manager.js        # Lightweight CMS
│       └── mobile/
│           └── mobile-optimizer.js       # Mobile/PWA optimizations
└── images/                   # Image assets
```

## Key JavaScript Modules

### 1. Main Application (`js/main.js`)
- Production version without Firebase dependencies
- Navigation dropdown functionality
- Header scroll effects
- Smooth scrolling for anchor links
- Intersection Observer for fade-in animations
- Production message system for signup

### 2. Interactive Price Calculator (`js/modules/interactivity/price-calculator.js`)
- Real-time pricing updates
- Plan selection (Basic, Professional, Enterprise)
- User count slider
- Duration options with discounts
- Add-on services
- Price comparison features
- Configuration saving and sharing

### 3. Enhanced Navigation (`js/modules/ux-enhancements/enhanced-navigation.js`)
- Tab-based navigation system
- Keyboard navigation support
- Swipe gestures for mobile
- Dropdown enhancements
- Accessibility features (ARIA)

### 4. Lazy Loading (`js/modules/performance/lazy-loading.js`)
- Image lazy loading with Intersection Observer
- Background image lazy loading
- Content lazy loading (iframes, videos, components)
- Data Saver API integration
- Fallback for older browsers

## Firebase Integration

The project includes a Firebase authentication system that can be enabled:
- User registration and login functionality
- Both modal (homepage) and dedicated page implementations
- Firestore database integration for user data
- Configuration in `js/firebase-config.js`

## Development Guidelines

### Performance
- Use lazy loading for images and content below the fold
- Implement performance optimizations using `performance-optimizer.js`
- Monitor Core Web Vitals and loading metrics

### Accessibility (WCAG 2.1 AA)
- Keyboard navigation support
- Screen reader compatibility
- Proper ARIA attributes
- Focus management

### UX Enhancements
- Smooth animations and transitions
- Real-time feedback and notifications
- Responsive design for all devices
- Touch gesture support for mobile

### Security
- Content Security Policy (CSP) compliance
- HTTPS only resources
- Input sanitization
- GDPR compliant cookie consent

## Building and Running

This is a static website that runs directly in the browser:
1. Open `index.html` in a web browser
2. No build process or dependencies required
3. For Firebase features, configure `js/firebase-config.js` with your Firebase project credentials

## Development Conventions

- Modular ES6 JavaScript architecture
- Semantic HTML structure
- CSS custom properties for theming
- Progressive enhancement approach
- Mobile-first responsive design
- Performance-first development

## Key Features Implemented

- Interactive pricing calculator with real-time updates
- Tab-based navigation system with keyboard and touch support
- Advanced lazy loading for all media and content
- Production-ready authentication system (Firebase)
- Performance monitoring and optimization
- Accessibility compliance (WCAG 2.1 AA)
- Mobile-optimized experience with PWA features

# 🎮 Invasor

## 📋 Table of Contents
- [📖 About](#-about)
- [🚀 Getting Started](#-getting-started)
- [🔨 How to Build / How to Run](#-how-to-build--how-to-run)
- [🏗️ Project Structure](#️-project-structure)
- [🎯 Features](#-features)
- [🎮 Game Mechanics](#-game-mechanics)
- [📚 Dependencies](#-dependencies)
- [🐳 Docker Deployment](#-docker-deployment)
- [💡 Usage](#-usage)
- [🔧 Configuration](#-configuration)
- [📱 Offline Strategy](#-offline-strategy)
- [📄 License](#-license)

## 📖 About
Invasor is a modern emoji-based Space Invaders Progressive Web App that brings the classic arcade experience to the browser. Built with vanilla JavaScript and featuring adaptive network-first caching, the game provides reliable offline gameplay with automatic updates and a responsive design that works seamlessly across desktop and mobile devices.

## 🚀 Getting Started

### Prerequisites
- Node.js (v23 or higher)
- npm package manager
- Modern web browser with Service Worker support
- Docker (optional, for containerized deployment)

### 📦 Installation
```bash
git clone <repository-url>
cd invasor
npm install
```

## 🔨 How to Build / How to Run

### Development Mode
```bash
# Start the development server
node server.js
```
The game will be available at `http://localhost:3000`

### Production Mode
```bash
# Install dependencies
npm install

# Start the production server
PORT=3000 node server.js
```

### Environment Variables
```bash
# Cache version for service worker
CACHE_VERSION=v2

# App name for cache management
APP_NAME=invasor

# Service worker timeouts (milliseconds)
SW_FIRST_TIME_TIMEOUT=20000
SW_RETURNING_USER_TIMEOUT=5000
SW_ENABLE_LOGS=true
```

## 🏗️ Project Structure
```
invasor/
├── index.html           # Main game interface
├── main.js              # Core game logic and mechanics
├── styles.js            # Responsive styling and CSS injection
├── server.js            # Express server with cache management
├── service-worker.js    # Advanced PWA caching strategy
├── manifest.json        # PWA manifest configuration
├── package.json         # Project dependencies
├── dockerfile           # Docker containerization
├── .gitignore          # Git ignore patterns
├── LICENSE             # MIT license
└── .github/workflows/  # CI/CD automation
    └── main.yml        # Docker build and push workflow
```

## 🎯 Features

### 🎮 Core Gameplay
- **Classic Space Invaders Mechanics**: Defend against waves of emoji invaders
- **Emoji-Based Graphics**: Modern twist with colorful emoji sprites
- **Progressive Difficulty**: Enemy speed increases as numbers decrease
- **Barrier System**: Destructible cover with visual damage indicators
- **Bonus System**: Special enemies grant rapid-fire power-ups
- **Time & Score Tracking**: Real-time performance metrics
- **High Score Persistence**: Local storage of best performances

### 🎯 Game Elements
- **Player Ship**: 🛌 (with facing direction animations)
- **Basic Enemies**: 👾 (standard invaders)
- **Special Enemies**: 👻 (ghosts) and 🐙 (squids with burst fire)
- **Projectiles**: 🐝 (player bullets) and 🔶 (enemy bullets)
- **Barriers**: Various building emojis with HP-based damage visualization
- **Explosions**: Type-specific effects (💥, 🔥, ⚡)

### 📱 Cross-Platform Support
- **Responsive Design**: Scales perfectly on all screen sizes
- **Touch Controls**: Virtual joystick for mobile devices
- **Keyboard Support**: Arrow keys and WASD controls
- **Auto-Fire**: Continuous shooting for modern gameplay
- **Gesture Support**: Drag and drop interactions

### 🔄 Progressive Web App Features
- **Offline Playability**: Complete game functionality without internet
- **Installable**: Add to home screen on mobile devices
- **Auto-Updates**: Intelligent background updates
- **Cache Rescue**: Automatic recovery from cache corruption
- **Network Adaptation**: Smart timeout handling for slow connections

## 🎮 Game Mechanics

### Scoring System
- **Basic Enemies (👾)**: 15 points
- **Special Enemies (👻/🐙)**: 60 points
- **Time Bonus**: Up to 1000 points based on completion speed
- **Grace Period**: Full bonus for first 20 seconds
- **Decay Rate**: -50 points per second after grace period

### Power-Up System
- **Bonus Trigger**: Destroying special enemies
- **Effect**: Increased fire rate (70ms vs 180ms cooldown)
- **Duration**: 4 seconds of rapid fire
- **Visual Indicator**: "BONUS: Continuous Fire" HUD element

### Enemy Behavior
- **Formation Movement**: Grid-based horizontal marching
- **Directional Changes**: Descent when hitting screen edges
- **Shooting Patterns**: 
  - Basic enemies: Aimed shots at player
  - Special enemies: 3-shot bursts with reload cycles
- **Speed Scaling**: Faster movement as numbers dwindle

### Control Schemes
- **Desktop**: Arrow keys or WASD for movement
- **Mobile**: Virtual joystick with responsive touch areas
- **Auto-Fire**: Continuous shooting (no manual fire button needed)

## 📚 Dependencies

### Core Framework
- **Express**: `^4.18.2` - Lightweight web server

### Development Tools
- **Node.js 23 Alpine**: Container base image
- **GitHub Actions**: Automated CI/CD pipeline

### Browser APIs Used
- **Service Workers**: Advanced caching and offline functionality
- **Canvas API**: Joystick rendering and touch interaction
- **LocalStorage**: High score persistence
- **FileSystem API**: Asset management
- **Pointer Events**: Cross-device input handling

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t invasor:latest .
```

### Run Container
```bash
# Development
docker run -p 3000:3000 invasor:latest

# Production with custom port
docker run -p 8080:3000 -e PORT=3000 invasor:latest
```

### Docker Hub Deployment
```bash
# Automated via GitHub Actions
# Manually trigger workflow in repository actions tab
```

### Container Specifications
- **Base Image**: Node.js 23 Alpine Linux
- **Working Directory**: `/app`
- **Exposed Port**: 3000
- **Auto-Install**: Dependencies installed during build

## 💡 Usage

### Game Controls
- **Desktop**:
  - `Arrow Keys` or `WASD`: Move player ship
  - Auto-fire enabled (no manual shooting required)
- **Mobile**:
  - Virtual joystick: Touch and drag to move
  - Auto-fire enabled

### Game Progression
1. **Start**: Game begins automatically after brief intro
2. **Objective**: Eliminate all enemy invaders
3. **Defense**: Use barriers for cover (they degrade with damage)
4. **Bonus**: Target special enemies for power-ups
5. **Victory**: Clear all enemies to advance
6. **Game Over**: Enemy reaches player level or lives depleted

### Performance Optimization
- **Scaling System**: Automatic viewport adaptation
- **Sprite Management**: Efficient DOM manipulation
- **Frame Rate**: Optimized 60fps gameplay
- **Memory Management**: Automatic cleanup of game objects

## 🔧 Configuration

### Cache Version Management
```javascript
// Update CACHE_VERSION to deploy new version
const CACHE_VERSION = process.env.CACHE_VERSION || 'v2';
```

### Service Worker Timeouts
```javascript
// First-time user timeout (slow networks)
FIRST_TIME_TIMEOUT: 20000, // 20 seconds

// Returning user timeout (quick fallback)
RETURNING_USER_TIMEOUT: 5000, // 5 seconds
```

### Game Constants
```javascript
// Customizable game parameters in main.js
PLAYER_MOVE_SPEED_PX_PER_SEC: 360,
ENEMY_MOVE_INTERVAL_MS: 420,
PLAYER_SHOT_COOLDOWN_MS: 180,
BONUS_DURATION_MS: 4000,
```

## 📱 Offline Strategy

### Adaptive Network-First Caching
- **New Users**: Extended timeout (20s) to ensure complete download
- **Returning Users**: Quick timeout (5s) with instant cache fallback
- **Network Failure**: Automatic serving from cache
- **Atomic Updates**: All-or-nothing cache replacement
- **Version Management**: Automatic cleanup of old cache versions

### Cache Rescue System
- **Lock Detection**: Identifies users stuck on old versions
- **Automatic Recovery**: Unregisters old service workers
- **Force Refresh**: Ensures users get latest version
- **Error Handling**: Graceful fallbacks for SW failures

### Asset Management
```javascript
// Critical assets cached for offline play
const ASSETS = [
  '/', '/index.html', '/main.js', '/styles.js',
  '/manifest.json', '/icon-512.png', '/icon-192.png',
  '/favicon.ico'
];
```

## 📄 License
MIT License - see [LICENSE](LICENSE) file for details.

---

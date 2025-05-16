# Find the Artifact

A minimalist browser game demonstrating Seismic authentication and data storage capabilities.

## Features

- Authentication via Seismic
- User data retrieval
- Game state persistence using Seismic Data API
- Minimalist game with simple 2D movement
- Responsive design

## Tech Stack

- **Frontend**: React + Vite
- **Game Engine**: Phaser 3
- **Authentication**: Seismic SDK
- **Data Storage**: Seismic Data API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/seismic-game.git
cd seismic-game
```

2. Install dependencies:
```bash
npm install
```

3. Replace placeholder images:
   - Place proper images in `public/assets/` for:
     - `player.png`
     - `artifact.png`
     - `tileset.png`

### Development

Start the development server:
```bash
npm run dev
```

### Building for Production

Build the project:
```bash
npm run build
```

## Game Instructions

1. Click "Login with Seismic" to authenticate
2. Use WASD or arrow keys to move the character
3. Find the hidden artifact on the map
4. Your progress is saved automatically when you find the artifact
5. When you return to the game, your progress will be loaded

## Note About Assets

The assets in the `public/assets/` directory are placeholders. Replace them with actual PNG images before deploying the game.

## Deployment

This project is designed to be deployed on Vercel without requiring any backend setup.

## License

This project is licensed under the MIT License.

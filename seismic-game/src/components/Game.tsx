import { useState, useEffect, useRef } from 'react'
import { seismic } from '../lib/seismic'
import './Game.css'

interface GameProps {
  isLoggedIn: boolean
}

interface Player {
  x: number
  y: number
  direction: string
  steps: number
  movements: { x: number, y: number }[]
}

interface Artifact {
  x: number
  y: number
  found: boolean
}

const GRID_SIZE = 15
const TILE_SIZE = 40

const generateArtifactPosition = () => {
  return {
    x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
    y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
    found: false
  }
}

const Game: React.FC<GameProps> = ({ isLoggedIn }) => {
  const [player, setPlayer] = useState<Player>({
    x: Math.floor(GRID_SIZE / 2),
    y: Math.floor(GRID_SIZE / 2),
    direction: 'down',
    steps: 0,
    movements: []
  })
  
  const [artifact, setArtifact] = useState<Artifact>(generateArtifactPosition())
  const [showTransactions, setShowTransactions] = useState<boolean>(false)
  const [achievements, setAchievements] = useState<string[]>([])
  const gameContainerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (isLoggedIn) {
      // Load game data from Seismic
      const loadGameData = async () => {
        try {
          const gameData = await seismic.getGameData()
          if (gameData) {
            setPlayer(gameData.player)
            setArtifact(gameData.artifact)
            setAchievements(gameData.achievements || [])
          }
        } catch (error) {
          console.error('Failed to load game data:', error)
          // If loading fails, reset to defaults
          resetGame()
        }
      }
      
      loadGameData()
    } else {
      // Reset game when logged out
      resetGame()
    }
  }, [isLoggedIn])
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLoggedIn) return

      let newX = player.x
      let newY = player.y
      let direction = player.direction
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newY = Math.max(0, player.y - 1)
          direction = 'up'
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          newY = Math.min(GRID_SIZE - 1, player.y + 1)
          direction = 'down'
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newX = Math.max(0, player.x - 1)
          direction = 'left'
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          newX = Math.min(GRID_SIZE - 1, player.x + 1)
          direction = 'right'
          break
        case 't':
        case 'T':
          setShowTransactions(!showTransactions)
          seismic.logTransaction('TOGGLE_DEBUG', { showTransactions: !showTransactions })
          return
        default:
          return
      }
      
      if (newX !== player.x || newY !== player.y) {
        const newMovements = [...player.movements, { x: newX, y: newY }]
        const newSteps = player.steps + 1
        
        const newPlayer = {
          ...player,
          x: newX,
          y: newY,
          direction,
          steps: newSteps,
          movements: newMovements
        }
        
        setPlayer(newPlayer)
        
        // Check if player found the artifact
        if (newX === artifact.x && newY === artifact.y && !artifact.found) {
          foundArtifact()
        }
        
        // Save player data to Seismic after each move
        saveGameData(newPlayer, artifact, achievements)
        
        // Check for achievements
        checkAchievements(newSteps, newMovements)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [player, artifact, isLoggedIn, showTransactions, achievements])
  
  const foundArtifact = () => {
    const updatedArtifact = { ...artifact, found: true }
    setArtifact(updatedArtifact)
    
    // Add achievement for finding artifact
    if (!achievements.includes('Found Artifact')) {
      const newAchievements = [...achievements, 'Found Artifact']
      setAchievements(newAchievements)
      
      seismic.logTransaction('ACHIEVEMENT_UNLOCKED', { achievement: 'Found Artifact' })
      
      saveGameData(player, updatedArtifact, newAchievements)
    }
  }
  
  const checkAchievements = (steps: number, movements: { x: number, y: number }[]) => {
    const newAchievements = [...achievements]
    let achievementAdded = false
    
    // Steps achievements
    if (steps >= 50 && !newAchievements.includes('50 Steps')) {
      newAchievements.push('50 Steps')
      achievementAdded = true
    }
    
    if (steps >= 100 && !newAchievements.includes('100 Steps')) {
      newAchievements.push('100 Steps')
      achievementAdded = true
    }
    
    // Explorer achievement - visit at least 30 unique tiles
    const uniqueTiles = new Set(movements.map(m => `${m.x},${m.y}`))
    if (uniqueTiles.size >= 30 && !newAchievements.includes('Explorer')) {
      newAchievements.push('Explorer')
      achievementAdded = true
    }
    
    if (achievementAdded) {
      setAchievements(newAchievements)
      
      seismic.logTransaction('ACHIEVEMENTS_UPDATED', { achievements: newAchievements })
      
      saveGameData(player, artifact, newAchievements)
    }
  }
  
  const saveGameData = async (
    currentPlayer: Player, 
    currentArtifact: Artifact, 
    currentAchievements: string[]
  ) => {
    if (!isLoggedIn) return
    
    try {
      await seismic.saveGameData({
        player: currentPlayer,
        artifact: currentArtifact,
        achievements: currentAchievements
      })
    } catch (error) {
      console.error('Failed to save game data:', error)
    }
  }
  
  const resetGame = () => {
    const initialPlayer = {
      x: Math.floor(GRID_SIZE / 2),
      y: Math.floor(GRID_SIZE / 2),
      direction: 'down',
      steps: 0,
      movements: []
    }
    
    const initialArtifact = generateArtifactPosition()
    
    setPlayer(initialPlayer)
    setArtifact(initialArtifact)
    setAchievements([])
    
    if (isLoggedIn) {
      saveGameData(initialPlayer, initialArtifact, [])
    }
  }
  
  // Render game grid
  const renderGrid = () => {
    const grid = []
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isPlayer = player.x === x && player.y === y
        const isArtifact = artifact.x === x && artifact.y === y
        const isVisited = player.movements.some(m => m.x === x && m.y === y)
        
        let tileClass = 'game-tile'
        if (isPlayer) {
          tileClass += ' player'
          tileClass += ` player-${player.direction}`
        } else if (isArtifact && !artifact.found) {
          tileClass += ' artifact'
        } else if (isArtifact && artifact.found) {
          tileClass += ' artifact-found'
        } else if (isVisited) {
          tileClass += ' visited'
        }
        
        grid.push(
          <div
            key={`${x}-${y}`}
            className={tileClass}
            style={{
              left: x * TILE_SIZE,
              top: y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE
            }}
          />
        )
      }
    }
    
    return grid
  }
  
  // Render player movement path
  const renderPath = () => {
    if (player.movements.length < 2) return null
    
    const points = player.movements
      .map(pos => `${pos.x * TILE_SIZE + TILE_SIZE/2},${pos.y * TILE_SIZE + TILE_SIZE/2}`)
      .join(' ')
    
    return (
      <svg className="movement-path" width={GRID_SIZE * TILE_SIZE} height={GRID_SIZE * TILE_SIZE}>
        <polyline
          points={points}
          fill="none"
          stroke="rgba(0, 255, 255, 0.6)"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      </svg>
    )
  }
  
  // Render transactions list if debug mode is on
  const renderTransactions = () => {
    if (!showTransactions) return null;
    
    const transactions = seismic.getTransactions();
    const lastFiveTransactions = transactions.slice(-5).reverse();
    
    return (
      <div className="transaction-list">
        <h3>Recent Transactions</h3>
        <ul>
          {lastFiveTransactions.map((tx, index) => (
            <li key={index} className={tx.confirmed ? 'confirmed' : 'pending'}>
              <span className="tx-type">{tx.type}</span>
              <span className="tx-time">{new Date(tx.timestamp).toLocaleTimeString()}</span>
              {tx.confirmed && <span className="tx-block">Block: {tx.blockNumber}</span>}
              <span className="tx-status">{tx.confirmed ? 'Confirmed' : 'Pending'}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
  return (
    <div className="game-container" ref={gameContainerRef}>
      <div className="blockchain-status">
        {showTransactions && (
          <div className="debug-mode">Debug Mode: Transaction Visibility ON</div>
        )}
        {renderTransactions()}
      </div>
      
      <div className="game-grid" style={{ width: GRID_SIZE * TILE_SIZE, height: GRID_SIZE * TILE_SIZE }}>
        {renderPath()}
        {renderGrid()}
      </div>
      
      {artifact.found && (
        <div className="artifact-found-message">
          Congratulations! You found the artifact!
          <button onClick={resetGame}>Play Again</button>
        </div>
      )}
      
      {!isLoggedIn && (
        <div className="login-overlay">
          <div className="login-message">
            Login with Seismic to play and save your progress
          </div>
        </div>
      )}
    </div>
  )
}

export default Game 
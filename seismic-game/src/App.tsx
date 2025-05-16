import { useState, useEffect } from 'react'
import './App.css'
import { seismic } from './lib/seismic'
import Game from './components/Game'
import BlockchainInfo from './components/BlockchainInfo'
import PlayerStats from './components/PlayerStats'
import DevnetSetup from './components/DevnetSetup'
import EncryptionControls from './components/EncryptionControls'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [userName, setUserName] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Check if the user is already logged in
    const checkLoginStatus = async () => {
      setIsLoading(true)
      const loggedIn = seismic.isLoggedIn()
      if (loggedIn) {
        const user = seismic.getUser()
        if (user) {
          setUserName(user.name)
        }
      }
      setIsLoggedIn(loggedIn)
      setIsLoading(false)
    }

    checkLoginStatus()
  }, [])

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const user = await seismic.login()
      setIsLoggedIn(true)
      setUserName(user.name)
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await seismic.logout()
      setIsLoggedIn(false)
      setUserName('')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Find the Artifact</h1>
        <div className="seismic-badge">Powered by Seismic</div>
        {isLoggedIn ? (
          <div className="user-info">
            <span>Welcome, {userName}!</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button 
            className="login-button" 
            onClick={handleLogin}
          >
            Login with Seismic
          </button>
        )}
      </header>

      <main className="app-content">
        {isLoggedIn && <DevnetSetup isLoggedIn={isLoggedIn} />}
        {isLoggedIn && <BlockchainInfo isLoggedIn={isLoggedIn} />}
        {isLoggedIn && <EncryptionControls isLoggedIn={isLoggedIn} userName={userName} />}
        {isLoggedIn && <PlayerStats isLoggedIn={isLoggedIn} />}
        <Game isLoggedIn={isLoggedIn} />
      </main>

      <footer className="app-footer">
        {isLoggedIn && (
          <div className="game-instructions">
            <h2>Instructions:</h2>
            <p>Use WASD or arrow keys to move your character</p>
            <p>Find the artifact hidden on the map</p>
            <p>Press T key to see Seismic blockchain transactions</p>
          </div>
        )}
        <div className="seismic-info">
          <p>This demo showcases Seismic's encrypted blockchain technology</p>
          <p>All game data is securely stored and encrypted using Seismic</p>
          <p><a href="https://docs.seismic.systems/appendix/devnet" target="_blank" rel="noopener noreferrer">Learn more about Seismic Devnet</a></p>
        </div>
      </footer>
    </div>
  )
}

export default App 
import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useNetwork, useDisconnect } from 'wagmi'
import { Container, Row, Col, Card, Button, Form, Badge, InputGroup, Alert } from 'react-bootstrap'

const App = () => {
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()
  const { disconnect } = useDisconnect()
  const { data: balanceData } = useBalance({
    address: address,
    watch: true,
  })

  const [transactionHistory, setTransactionHistory] = useState([])

  // Load transaction history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('transactionHistory')
      if (savedHistory) {
        setTransactionHistory(JSON.parse(savedHistory))
      }
    } catch (error) {
      console.error('Failed to load transaction history:', error)
      localStorage.removeItem('transactionHistory')
    }
  }, [])

  return (
    <>
      <header className="bg-dark text-white p-3">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <h1><i className="bi bi-shield-lock-fill me-2"></i>Seismic Transaction Sender</h1>
            <ConnectButton />
          </div>
        </Container>
      </header>

      <main className="container py-5">
        <Row>
          <Col md={6} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h3 className="card-title mb-0">Network Information</h3>
              </Card.Header>
              <Card.Body>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Network
                    <Badge bg="info">{isConnected ? chain?.name || 'Unknown' : 'Not Connected'}</Badge>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Chain ID
                    <span>{isConnected ? chain?.id || '?' : '?'}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Native Token
                    <span>{isConnected ? chain?.nativeCurrency?.symbol || 'ETH' : 'ETH'}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Status
                    <Badge bg={isConnected ? 'success' : 'secondary'}>
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h3 className="card-title mb-0">Wallet Information</h3>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Your Address</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      readOnly
                      value={address || ''}
                      placeholder="Connect your wallet"
                    />
                    <Button 
                      variant="outline-secondary"
                      onClick={() => navigator.clipboard.writeText(address)}
                      disabled={!address}
                    >
                      <i className="bi bi-clipboard"></i>
                    </Button>
                  </InputGroup>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Balance</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      readOnly
                      value={balanceData ? balanceData?.formatted : '--'}
                      placeholder="--"
                    />
                    <span className="input-group-text">
                      {balanceData?.symbol || 'ETH'}
                    </span>
                  </InputGroup>
                </Form.Group>
                
                <div className="mt-3">
                  <a 
                    href="https://faucet-2.seismicdev.net/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline-info w-100"
                  >
                    Get Test ETH from Faucet
                  </a>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {isConnected ? (
          <Row>
            <Col lg={8} className="mx-auto">
              <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <h3 className="card-title mb-0">Send Transaction</h3>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Recipient Address (Optional)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="0x... (leave empty to send to your own wallet)"
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Amount (ETH)</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="0.01"
                        step="0.0001"
                        min="0"
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="enable-encryption"
                        label="Use Seismic Encryption"
                        defaultChecked
                      />
                      <Form.Text className="text-muted">
                        When enabled, transaction data will be encrypted using Seismic's privacy technology
                      </Form.Text>
                    </Form.Group>
                    
                    <div className="d-grid">
                      <Button variant="success" size="lg">
                        Send Transaction
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <Row className="mt-4">
            <Col className="text-center">
              <Alert variant="info">
                <i className="bi bi-info-circle me-2"></i>
                Connect your wallet to send transactions
              </Alert>
            </Col>
          </Row>
        )}
      </main>
    </>
  )
}

export default App 
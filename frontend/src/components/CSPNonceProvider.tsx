// CSP Nonce Provider Component
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react'
import securityHeadersManager from '../services/SecurityHeadersManager'

interface CSPNonceContextType {
  nonce: string
  updateNonce: () => void
}

const CSPNonceContext = createContext<CSPNonceContextType | undefined>(undefined)

export const CSPNonceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [nonce, setNonce] = useState('')

  const updateNonce = useCallback(() => {
    const newNonce = securityHeadersManager.generateNonce()
    setNonce(newNonce)
    securityHeadersManager.updateCSPWithNonce(newNonce)
  }, [])

  useEffect(() => {
    updateNonce() // Generate initial nonce
  }, [updateNonce])

  const contextValue = useMemo(() => ({ nonce, updateNonce }), [nonce, updateNonce])

  return (
    <CSPNonceContext.Provider value={contextValue}>
      {children}
    </CSPNonceContext.Provider>
  )
}

export const useCSPNonce = (): CSPNonceContextType => {
  const context = useContext(CSPNonceContext)
  if (!context) {
    throw new Error('useCSPNonce must be used within a CSPNonceProvider')
  }
  return context
}
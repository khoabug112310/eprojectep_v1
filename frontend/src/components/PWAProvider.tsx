import React, { createContext, useContext, type ReactNode, useMemo } from 'react'
import { usePWA } from '../hooks/usePWA'

interface PWAContextType {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isUpdateAvailable: boolean
  install: () => Promise<void>
  update: () => Promise<void>
  showInstallPrompt: () => Promise<void>
  enableNotifications: () => Promise<boolean>
  shareContent: (data: ShareData) => Promise<void>
}

interface ShareData {
  title?: string
  text?: string
  url?: string
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

interface PWAProviderProps {
  children: ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const pwaState = usePWA()
  
  const contextValue = useMemo(() => pwaState, [pwaState])

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
    </PWAContext.Provider>
  )
}

export function usePWAContext(): PWAContextType {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error('usePWAContext must be used within a PWAProvider')
  }
  return context
}

export default PWAProvider
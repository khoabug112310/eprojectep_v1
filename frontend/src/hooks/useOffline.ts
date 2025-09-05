// Offline Detection and Management Hook
// Provides comprehensive offline capabilities for CineBook

import React from 'react';

export interface OfflineAction {
  id: string;
  type: 'booking' | 'review' | 'profile-update' | 'favorite';
  data: any;
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: number;
  pendingActions: OfflineAction[];
  syncInProgress: boolean;
}

export interface UseOfflineReturn {
  isOnline: boolean;
  wasOffline: boolean;
  pendingActions: OfflineAction[];
  syncInProgress: boolean;
  addOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  syncPendingActions: () => Promise<void>;
  clearPendingActions: () => void;
  getOfflineStatus: () => OfflineState;
}

const STORAGE_KEY = 'cinebook-offline-actions';
const SYNC_INTERVAL = 30000; // 30 seconds

class OfflineManager {
  private state: OfflineState;
  private subscribers: Set<(state: OfflineState) => void>;
  private syncTimer: NodeJS.Timeout | null;
  private db: IDBDatabase | null;

  constructor() {
    this.state = {
      isOnline: navigator.onLine,
      wasOffline: false,
      lastOnlineTime: Date.now(),
      pendingActions: [],
      syncInProgress: false
    };
    
    this.subscribers = new Set();
    this.syncTimer = null;
    this.db = null;
    
    this.initializeDatabase();
    this.loadPendingActions();
    this.setupEventListeners();
    this.startSyncTimer();
  }

  // Initialize IndexedDB for offline actions
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('cinebook-offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('actions')) {
          const store = db.createObjectStore('actions', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Setup online/offline event listeners
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Detect connection changes via API calls
    this.setupConnectionDetection();
  }

  // Advanced connection detection
  private setupConnectionDetection(): void {
    setInterval(async () => {
      if (navigator.onLine) {
        try {
          const response = await fetch('/api/health', {
            method: 'HEAD',
            cache: 'no-cache'
          });
          
          if (response.ok && !this.state.isOnline) {
            this.handleOnline();
          } else if (!response.ok && this.state.isOnline) {
            this.handleOffline();
          }
        } catch {
          if (this.state.isOnline) {
            this.handleOffline();
          }
        }
      }
    }, 10000); // Check every 10 seconds
  }

  // Handle online event
  private handleOnline(): void {
    const wasOffline = !this.state.isOnline;
    
    this.updateState({
      isOnline: true,
      wasOffline,
      lastOnlineTime: Date.now()
    });

    if (wasOffline) {
      console.log('[Offline] Connection restored, syncing pending actions');
      this.syncPendingActions();
    }
  }

  // Handle offline event
  private handleOffline(): void {
    this.updateState({
      isOnline: false,
      wasOffline: true
    });
    
    console.log('[Offline] Connection lost, entering offline mode');
  }

  // Update state and notify subscribers
  private updateState(updates: Partial<OfflineState>): void {
    this.state = { ...this.state, ...updates };
    this.notifySubscribers();
  }

  // Notify all subscribers of state changes
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // Subscribe to state changes
  subscribe(callback: (state: OfflineState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Add offline action
  async addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const offlineAction: OfflineAction = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0
    };

    // Store in IndexedDB
    if (this.db) {
      await this.storeActionInDB(offlineAction);
    }

    // Update state
    this.updateState({
      pendingActions: [...this.state.pendingActions, offlineAction]
    });

    console.log('[Offline] Action queued:', offlineAction.type, offlineAction.id);
  }

  // Store action in IndexedDB
  private async storeActionInDB(action: OfflineAction): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.put(action);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Load pending actions from IndexedDB
  private async loadPendingActions(): Promise<void> {
    if (!this.db) {
      await this.initializeDatabase();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const request = store.getAll();

      request.onsuccess = () => {
        this.updateState({
          pendingActions: request.result || []
        });
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Sync pending actions with server
  async syncPendingActions(): Promise<void> {
    if (this.state.syncInProgress || !this.state.isOnline) {
      return;
    }

    this.updateState({ syncInProgress: true });

    try {
      const actionsToSync = [...this.state.pendingActions];
      const syncResults: Array<{ action: OfflineAction; success: boolean; error?: Error }> = [];

      for (const action of actionsToSync) {
        try {
          await this.syncSingleAction(action);
          syncResults.push({ action, success: true });
          
          // Remove successful action
          await this.removeActionFromDB(action.id);
          
        } catch (error) {
          console.error('[Offline] Failed to sync action:', action.id, error);
          
          // Increment retry count
          action.retryCount++;
          
          if (action.retryCount >= action.maxRetries) {
            // Remove failed action that exceeded max retries
            await this.removeActionFromDB(action.id);
            syncResults.push({ 
              action, 
              success: false, 
              error: error instanceof Error ? error : new Error(String(error))
            });
          } else {
            // Update retry count in DB
            await this.storeActionInDB(action);
            syncResults.push({ 
              action, 
              success: false, 
              error: error instanceof Error ? error : new Error(String(error))
            });
          }
        }
      }

      // Update pending actions (remove successful ones)
      const remainingActions = this.state.pendingActions.filter(action => 
        !syncResults.some(result => result.action.id === action.id && result.success)
      );

      this.updateState({
        pendingActions: remainingActions,
        syncInProgress: false
      });

      // Notify about sync results
      if (syncResults.length > 0) {
        this.notifySyncResults(syncResults);
      }

    } catch (error) {
      console.error('[Offline] Sync failed:', error);
      this.updateState({ syncInProgress: false });
    }
  }

  // Sync a single action
  private async syncSingleAction(action: OfflineAction): Promise<void> {
    const response = await fetch(action.url, {
      method: action.method,
      headers: action.headers,
      body: action.method !== 'GET' ? JSON.stringify(action.data) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Remove action from IndexedDB
  private async removeActionFromDB(actionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.delete(actionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Notify about sync results
  private notifySyncResults(results: Array<{ action: OfflineAction; success: boolean; error?: Error }>): void {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[Offline] Sync completed: ${successful} successful, ${failed} failed`);
    
    // You could dispatch custom events here for UI notifications
    window.dispatchEvent(new CustomEvent('offline-sync-complete', {
      detail: { successful, failed, results }
    }));
  }

  // Clear all pending actions
  async clearPendingActions(): Promise<void> {
    if (this.db) {
      const transaction = this.db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      await store.clear();
    }

    this.updateState({ pendingActions: [] });
  }

  // Start sync timer
  private startSyncTimer(): void {
    this.syncTimer = setInterval(() => {
      if (this.state.isOnline && this.state.pendingActions.length > 0) {
        this.syncPendingActions();
      }
    }, SYNC_INTERVAL);
  }

  // Stop sync timer
  stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current state
  getState(): OfflineState {
    return { ...this.state };
  }
}

// Singleton instance
const offlineManager = new OfflineManager();

// React hook for offline management
export function useOffline(): UseOfflineReturn {
  const [state, setState] = React.useState<OfflineState>(offlineManager.getState());

  React.useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setState);
    return unsubscribe;
  }, []);

  const addOfflineAction = React.useCallback(
    (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
      offlineManager.addOfflineAction({
        ...action,
        maxRetries: action.maxRetries || 3
      });
    },
    []
  );

  const syncPendingActions = React.useCallback(() => {
    return offlineManager.syncPendingActions();
  }, []);

  const clearPendingActions = React.useCallback(() => {
    return offlineManager.clearPendingActions();
  }, []);

  const getOfflineStatus = React.useCallback(() => {
    return offlineManager.getState();
  }, []);

  return {
    isOnline: state.isOnline,
    wasOffline: state.wasOffline,
    pendingActions: state.pendingActions,
    syncInProgress: state.syncInProgress,
    addOfflineAction,
    syncPendingActions,
    clearPendingActions,
    getOfflineStatus
  };
}

export default OfflineManager;
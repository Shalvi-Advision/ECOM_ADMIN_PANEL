import type { ReactNode } from 'react';

import { useState, useEffect, useContext, useCallback, createContext } from 'react';

// Context type definition
interface StoreCodeContextType {
  storeCode: string | null;
  setStoreCode: (code: string | null) => void;
  isLoading: boolean;
}

// Create context with default values
const StoreCodeContext = createContext<StoreCodeContextType>({
  storeCode: null,
  setStoreCode: () => {},
  isLoading: true,
});

// Custom hook to use the context
export const useStoreCode = () => {
  const context = useContext(StoreCodeContext);
  if (!context) {
    throw new Error('useStoreCode must be used within StoreCodeProvider');
  }
  return context;
};

// Provider component props
interface StoreCodeProviderProps {
  children: ReactNode;
}

// LocalStorage key
const STORAGE_KEY = 'selected_store_code';

// Provider component
export function StoreCodeProvider({ children }: StoreCodeProviderProps) {
  const [storeCode, setStoreCodeState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load store code from localStorage on mount
  useEffect(() => {
    try {
      const savedStoreCode = localStorage.getItem(STORAGE_KEY);
      if (savedStoreCode) {
        setStoreCodeState(savedStoreCode);
      }
    } catch (error) {
      console.error('Error loading store code from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update store code and persist to localStorage
  const setStoreCode = useCallback((code: string | null) => {
    setStoreCodeState(code);
    try {
      if (code) {
        localStorage.setItem(STORAGE_KEY, code);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving store code to localStorage:', error);
    }
  }, []);

  const value = {
    storeCode,
    setStoreCode,
    isLoading,
  };

  return <StoreCodeContext.Provider value={value}>{children}</StoreCodeContext.Provider>;
}

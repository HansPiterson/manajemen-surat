import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Safe wrapper helper functions to prevent SecurityError in blocked environments
const getSafeLocalStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved || fallback;
  } catch (e) {
    console.warn("Access to localStorage is blocked. Falling back to in-memory state.", e);
    return fallback;
  }
};

const setSafeLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // Silently catch error
  }
};

const removeSafeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // Silently catch error
  }
};

export function ThemeProvider({ children }) {
  // Check local storage or system preference
  const [theme, setTheme] = useState(() => {
    const saved = getSafeLocalStorage('theme', null);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      removeSafeLocalStorage('theme'); // clear so it falls back to system check
    } else {
      root.classList.add(theme);
      setSafeLocalStorage('theme', theme);
    }
  }, [theme]);

  // Listen for system theme changes if set to system
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!getSafeLocalStorage('theme', null)) {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

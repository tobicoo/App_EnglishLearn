import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const THEME_KEY = 'app_theme';

const lightTheme = {
  background: '#f8f9fa',
  surface: '#ffffff',
  card: '#f7f7f7',
  text: '#3c3c3c',
  textSecondary: '#afafaf',
  border: '#e5e5e5',
  inputBg: '#f7f7f7',
  headerBg: '#ffffff',
  tabBarBg: '#ffffff',
  statCardBg1: '#fff4e6',
  statCardBg2: '#e6f7ff',
  statCardBg3: '#ffe6e6',
  statCardBg4: '#e6ffe6',
};

const darkTheme = {
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2a2a2a',
  text: '#e0e0e0',
  textSecondary: '#8a8a8a',
  border: '#333333',
  inputBg: '#2a2a2a',
  headerBg: '#1a1a1a',
  tabBarBg: '#1a1a1a',
  statCardBg1: '#3d2e1a',
  statCardBg2: '#1a2e3d',
  statCardBg3: '#3d1a1a',
  statCardBg4: '#1a3d1a',
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'dark') setIsDark(true);
      } catch (e) {
        // ignore
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    try {
      await AsyncStorage.setItem(THEME_KEY, newVal ? 'dark' : 'light');
    } catch (e) {
      // ignore
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

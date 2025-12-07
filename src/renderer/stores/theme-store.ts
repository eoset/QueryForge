/**
 * Theme Store - Manages theme state for QueryForge
 * Handles built-in themes, custom theme imports, and Monaco editor theming
 */

import { create } from 'zustand';
import type { ThemeDefinition, ThemeFileFormat } from '../../shared/types/theme';
import { ALL_BUILT_IN_THEMES, getMonacoThemeName, getAppThemeTypeFromBase } from '../themes/built-in-themes';
import { applyThemeColors, clearThemeColors } from '../themes/theme-colors';

interface ThemeState {
  activeTheme: ThemeDefinition;
  customThemes: ThemeDefinition[];
  allThemes: ThemeDefinition[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveTheme: (themeId: string) => Promise<void>;
  importTheme: (file: File) => Promise<void>;
  deleteCustomTheme: (themeId: string) => Promise<void>;
  getMonacoTheme: () => string;
  getAppThemeType: () => 'dark' | 'light';
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  activeTheme: ALL_BUILT_IN_THEMES[0], // Default (Dark)
  customThemes: [],
  allThemes: ALL_BUILT_IN_THEMES,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    // Only initialize once
    if (get().isInitialized) {
      return;
    }

    if (!window.electronAPI) {
      set({ isLoading: false, isInitialized: true });
      return;
    }

    try {
      const settings = await window.electronAPI.uiSettings.getThemeSettings();
      const customThemes = settings.customThemes || [];
      const allThemes = [...ALL_BUILT_IN_THEMES, ...customThemes];
      const activeTheme = allThemes.find(t => t.id === settings.activeThemeId) || ALL_BUILT_IN_THEMES[0];

      set({
        customThemes,
        allThemes,
        activeTheme,
        isLoading: false,
        isInitialized: true,
      });

      // Apply theme to DOM
      document.documentElement.setAttribute('data-theme', activeTheme.type);
      
      // Apply Monaco theme colors to CSS variables
      if (activeTheme.isDefault) {
        // Default themes use the CSS stylesheet values
        clearThemeColors();
      } else {
        applyThemeColors(activeTheme);
      }
    } catch (error) {
      console.error('Failed to initialize theme store:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  setActiveTheme: async (themeId: string) => {
    const { allThemes } = get();
    const theme = allThemes.find(t => t.id === themeId);
    if (!theme) return;

    set({ activeTheme: theme });
    document.documentElement.setAttribute('data-theme', theme.type);
    
    // Apply Monaco theme colors to CSS variables
    if (theme.isDefault) {
      // Default themes use the CSS stylesheet values
      clearThemeColors();
    } else {
      applyThemeColors(theme);
    }

    if (window.electronAPI) {
      try {
        await window.electronAPI.uiSettings.setActiveTheme(themeId);
        // Also update legacy theme setting for backwards compatibility
        await window.electronAPI.uiSettings.setTheme(theme.type);
      } catch (error) {
        console.error('Failed to save active theme:', error);
      }
    }
  },

  importTheme: async (file: File) => {
    const text = await file.text();
    let themeData: ThemeFileFormat;

    try {
      themeData = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON file');
    }

    // Validate required fields
    if (!themeData.base) {
      throw new Error('Theme file must include a "base" property (vs, vs-dark, hc-black, or hc-light)');
    }

    const validBases = ['vs', 'vs-dark', 'hc-black', 'hc-light'];
    if (!validBases.includes(themeData.base)) {
      throw new Error(`Invalid base theme: "${themeData.base}". Must be one of: ${validBases.join(', ')}`);
    }

    // Create theme definition
    const theme: ThemeDefinition = {
      id: `custom-${Date.now()}`,
      name: themeData.name || file.name.replace(/\.json$/i, ''),
      type: getAppThemeTypeFromBase(themeData.base),
      isBuiltIn: false,
      isDefault: false,
      editor: {
        base: themeData.base,
        inherit: themeData.inherit ?? true,
        rules: themeData.rules || [],
        colors: themeData.colors || {},
      },
      app: themeData.app, // Optional app-level colors
    };

    const { customThemes } = get();
    const newCustomThemes = [...customThemes, theme];
    const allThemes = [...ALL_BUILT_IN_THEMES, ...newCustomThemes];

    set({ customThemes: newCustomThemes, allThemes });

    if (window.electronAPI) {
      try {
        await window.electronAPI.uiSettings.addCustomTheme(theme);
      } catch (error) {
        console.error('Failed to save custom theme:', error);
        throw error;
      }
    }
  },

  deleteCustomTheme: async (themeId: string) => {
    const { customThemes, activeTheme } = get();
    const newCustomThemes = customThemes.filter(t => t.id !== themeId);
    const allThemes = [...ALL_BUILT_IN_THEMES, ...newCustomThemes];

    // If deleting active theme, switch to default
    let newActiveTheme = activeTheme;
    if (activeTheme.id === themeId) {
      newActiveTheme = ALL_BUILT_IN_THEMES[0];
      document.documentElement.setAttribute('data-theme', newActiveTheme.type);
      // Default theme uses CSS stylesheet values
      clearThemeColors();
    }

    set({ customThemes: newCustomThemes, allThemes, activeTheme: newActiveTheme });

    if (window.electronAPI) {
      try {
        await window.electronAPI.uiSettings.removeCustomTheme(themeId);
        if (activeTheme.id === themeId) {
          await window.electronAPI.uiSettings.setActiveTheme(newActiveTheme.id);
          await window.electronAPI.uiSettings.setTheme(newActiveTheme.type);
        }
      } catch (error) {
        console.error('Failed to delete custom theme:', error);
      }
    }
  },

  getMonacoTheme: () => {
    const { activeTheme } = get();
    return getMonacoThemeName(activeTheme);
  },

  getAppThemeType: () => {
    return get().activeTheme.type;
  },
}));

/**
 * Hook to get the current Monaco theme name
 * Use this in editor components to get the correct theme
 */
export function useMonacoTheme(): string {
  return useThemeStore(state => getMonacoThemeName(state.activeTheme));
}

/**
 * Hook to get the current app theme type (dark/light)
 */
export function useAppThemeType(): 'dark' | 'light' {
  return useThemeStore(state => state.activeTheme.type);
}


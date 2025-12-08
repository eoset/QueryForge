import Store from 'electron-store';
import type { ThemeDefinition, StoredThemeSettings } from '../../shared/types/theme';

interface WindowBounds {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

export type Theme = 'dark' | 'light';

interface UISettingsData {
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  windowBounds?: WindowBounds;
  theme: Theme;
  themeSettings: StoredThemeSettings;
}

const store = new Store<UISettingsData>({
  name: 'ui-settings',
  defaults: {
    leftSidebarWidth: 250,
    rightSidebarWidth: 300,
    windowBounds: {
      width: 1200,
      height: 800,
    },
    theme: 'dark',
    themeSettings: {
      activeThemeId: 'default-dark',
      customThemes: [],
    },
  },
}) as Store<UISettingsData> & {
  get(key: 'leftSidebarWidth'): number;
  set(key: 'leftSidebarWidth', value: number): void;
  get(key: 'rightSidebarWidth'): number;
  set(key: 'rightSidebarWidth', value: number): void;
  get(key: 'windowBounds'): WindowBounds | undefined;
  set(key: 'windowBounds', value: WindowBounds): void;
  get(key: 'theme'): Theme;
  set(key: 'theme', value: Theme): void;
  get(key: 'themeSettings'): StoredThemeSettings;
  set(key: 'themeSettings', value: StoredThemeSettings): void;
};

export function getLeftSidebarWidth(): number {
  return store.get('leftSidebarWidth') || 250;
}

export function setLeftSidebarWidth(width: number): void {
  store.set('leftSidebarWidth', width);
}

export function getRightSidebarWidth(): number {
  return store.get('rightSidebarWidth') || 300;
}

export function setRightSidebarWidth(width: number): void {
  store.set('rightSidebarWidth', width);
}

export function getWindowBounds(): WindowBounds | undefined {
  return store.get('windowBounds');
}

export function setWindowBounds(bounds: WindowBounds): void {
  store.set('windowBounds', bounds);
}

export function getTheme(): Theme {
  return store.get('theme') || 'dark';
}

export function setTheme(theme: Theme): void {
  store.set('theme', theme);
}

// Theme settings functions
export function getThemeSettings(): StoredThemeSettings {
  return store.get('themeSettings') || { activeThemeId: 'default-dark', customThemes: [] };
}

export function setThemeSettings(settings: StoredThemeSettings): void {
  store.set('themeSettings', settings);
}

export function addCustomTheme(theme: ThemeDefinition): void {
  const settings = getThemeSettings();
  // Remove existing theme with same ID if exists
  const filtered = settings.customThemes.filter(t => t.id !== theme.id);
  settings.customThemes = [...filtered, theme];
  setThemeSettings(settings);
}

export function removeCustomTheme(themeId: string): void {
  const settings = getThemeSettings();
  settings.customThemes = settings.customThemes.filter(t => t.id !== themeId);
  // If active theme was deleted, revert to default
  if (settings.activeThemeId === themeId) {
    settings.activeThemeId = 'default-dark';
  }
  setThemeSettings(settings);
}

export function setActiveThemeId(themeId: string): void {
  const settings = getThemeSettings();
  settings.activeThemeId = themeId;
  setThemeSettings(settings);
}

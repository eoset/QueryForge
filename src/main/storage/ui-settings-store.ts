import Store from 'electron-store';

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


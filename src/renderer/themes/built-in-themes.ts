/**
 * Built-in themes registry for QueryForge
 * Default themes are never overwritten and always available
 * Includes all themes from the monaco-themes package (v0.3.3)
 */

import type { ThemeDefinition, MonacoThemeBase } from '../../shared/types/theme';

// Raw theme data type from monaco-themes JSON files
interface RawMonacoTheme {
  base: string;
  inherit: boolean;
  rules: Array<{
    token: string;
    foreground?: string;
    background?: string;
    fontStyle?: string;
  }>;
  colors: { [key: string]: string };
}

// Load theme JSON files using require (works with webpack)
/* eslint-disable @typescript-eslint/no-var-requires */
const Active4D = require('monaco-themes/themes/Active4D.json') as RawMonacoTheme;
const AllHallowsEve = require('monaco-themes/themes/All Hallows Eve.json') as RawMonacoTheme;
const Amy = require('monaco-themes/themes/Amy.json') as RawMonacoTheme;
const BirdsOfParadise = require('monaco-themes/themes/Birds of Paradise.json') as RawMonacoTheme;
const Blackboard = require('monaco-themes/themes/Blackboard.json') as RawMonacoTheme;
const BrillianceBlack = require('monaco-themes/themes/Brilliance Black.json') as RawMonacoTheme;
const BrillianceDull = require('monaco-themes/themes/Brilliance Dull.json') as RawMonacoTheme;
const ChromeDevTools = require('monaco-themes/themes/Chrome DevTools.json') as RawMonacoTheme;
const CloudsMidnight = require('monaco-themes/themes/Clouds Midnight.json') as RawMonacoTheme;
const Clouds = require('monaco-themes/themes/Clouds.json') as RawMonacoTheme;
const Cobalt = require('monaco-themes/themes/Cobalt.json') as RawMonacoTheme;
const Dawn = require('monaco-themes/themes/Dawn.json') as RawMonacoTheme;
const DominionDay = require('monaco-themes/themes/Dominion Day.json') as RawMonacoTheme;
const Dreamweaver = require('monaco-themes/themes/Dreamweaver.json') as RawMonacoTheme;
const Eiffel = require('monaco-themes/themes/Eiffel.json') as RawMonacoTheme;
const EspressoLibre = require('monaco-themes/themes/Espresso Libre.json') as RawMonacoTheme;
const GitHub = require('monaco-themes/themes/GitHub.json') as RawMonacoTheme;
const IDLE = require('monaco-themes/themes/IDLE.json') as RawMonacoTheme;
const idleFingers = require('monaco-themes/themes/idleFingers.json') as RawMonacoTheme;
const iPlastic = require('monaco-themes/themes/iPlastic.json') as RawMonacoTheme;
const Katzenmilch = require('monaco-themes/themes/Katzenmilch.json') as RawMonacoTheme;
const krTheme = require('monaco-themes/themes/krTheme.json') as RawMonacoTheme;
const KuroirTheme = require('monaco-themes/themes/Kuroir Theme.json') as RawMonacoTheme;
const LAZY = require('monaco-themes/themes/LAZY.json') as RawMonacoTheme;
const MagicWB = require('monaco-themes/themes/MagicWB (Amiga).json') as RawMonacoTheme;
const MerbivoreSoft = require('monaco-themes/themes/Merbivore Soft.json') as RawMonacoTheme;
const Merbivore = require('monaco-themes/themes/Merbivore.json') as RawMonacoTheme;
const monoindustrial = require('monaco-themes/themes/monoindustrial.json') as RawMonacoTheme;
const MonokaiBright = require('monaco-themes/themes/Monokai Bright.json') as RawMonacoTheme;
const Monokai = require('monaco-themes/themes/Monokai.json') as RawMonacoTheme;
const NightOwl = require('monaco-themes/themes/Night Owl.json') as RawMonacoTheme;
const OceanicNext = require('monaco-themes/themes/Oceanic Next.json') as RawMonacoTheme;
const PastelsOnDark = require('monaco-themes/themes/Pastels on Dark.json') as RawMonacoTheme;
const SlushAndPoppies = require('monaco-themes/themes/Slush and Poppies.json') as RawMonacoTheme;
const SolarizedDark = require('monaco-themes/themes/Solarized-dark.json') as RawMonacoTheme;
const SolarizedLight = require('monaco-themes/themes/Solarized-light.json') as RawMonacoTheme;
const SpaceCadet = require('monaco-themes/themes/SpaceCadet.json') as RawMonacoTheme;
const Sunburst = require('monaco-themes/themes/Sunburst.json') as RawMonacoTheme;
const TextmateMacClassic = require('monaco-themes/themes/Textmate (Mac Classic).json') as RawMonacoTheme;
const TomorrowNightBlue = require('monaco-themes/themes/Tomorrow-Night-Blue.json') as RawMonacoTheme;
const TomorrowNightBright = require('monaco-themes/themes/Tomorrow-Night-Bright.json') as RawMonacoTheme;
const TomorrowNightEighties = require('monaco-themes/themes/Tomorrow-Night-Eighties.json') as RawMonacoTheme;
const TomorrowNight = require('monaco-themes/themes/Tomorrow-Night.json') as RawMonacoTheme;
const Tomorrow = require('monaco-themes/themes/Tomorrow.json') as RawMonacoTheme;
const Twilight = require('monaco-themes/themes/Twilight.json') as RawMonacoTheme;
const UpstreamSunburst = require('monaco-themes/themes/Upstream Sunburst.json') as RawMonacoTheme;
const VibrantInk = require('monaco-themes/themes/Vibrant Ink.json') as RawMonacoTheme;
const XcodeDefault = require('monaco-themes/themes/Xcode_default.json') as RawMonacoTheme;
const Zenburnesque = require('monaco-themes/themes/Zenburnesque.json') as RawMonacoTheme;
/* eslint-enable @typescript-eslint/no-var-requires */

// Default themes (never overwritten, always at the top of the list)
export const DEFAULT_DARK_THEME: ThemeDefinition = {
  id: 'default-dark',
  name: 'Default (Dark)',
  type: 'dark',
  isBuiltIn: true,
  isDefault: true,
  // No editor property = use Monaco's built-in 'vs-dark'
};

export const DEFAULT_LIGHT_THEME: ThemeDefinition = {
  id: 'default-light',
  name: 'Default (Light)',
  type: 'light',
  isBuiltIn: true,
  isDefault: true,
  // No editor property = use Monaco's built-in 'light'
};

// Monaco built-in themes (basic)
export const MONACO_CORE_THEMES: ThemeDefinition[] = [
  {
    id: 'monaco-vs',
    name: 'Visual Studio',
    type: 'light',
    isBuiltIn: true,
    isDefault: false,
  },
  {
    id: 'monaco-vs-dark',
    name: 'Visual Studio Dark',
    type: 'dark',
    isBuiltIn: true,
    isDefault: false,
  },
  {
    id: 'monaco-hc-black',
    name: 'High Contrast (Dark)',
    type: 'dark',
    isBuiltIn: true,
    isDefault: false,
  },
  {
    id: 'monaco-hc-light',
    name: 'High Contrast (Light)',
    type: 'light',
    isBuiltIn: true,
    isDefault: false,
  },
];

// Helper to create a theme definition from monaco-themes data
function createMonacoTheme(id: string, name: string, themeData: RawMonacoTheme): ThemeDefinition {
  // Cast the base to our expected type (all monaco-themes use 'vs' or 'vs-dark')
  const base = themeData.base as MonacoThemeBase;
  
  return {
    id,
    name,
    type: base === 'vs' || base === 'hc-light' ? 'light' : 'dark',
    isBuiltIn: true,
    isDefault: false,
    editor: {
      base,
      inherit: themeData.inherit,
      rules: themeData.rules,
      colors: themeData.colors,
    },
  };
}

// All themes from monaco-themes package (v0.3.3)
export const MONACO_PACKAGE_THEMES: ThemeDefinition[] = [
  // Popular themes first
  createMonacoTheme('monokai', 'Monokai', Monokai),
  createMonacoTheme('monokai-bright', 'Monokai Bright', MonokaiBright),
  createMonacoTheme('night-owl', 'Night Owl', NightOwl),
  createMonacoTheme('oceanic-next', 'Oceanic Next', OceanicNext),
  createMonacoTheme('github', 'GitHub', GitHub),
  createMonacoTheme('solarized-dark', 'Solarized Dark', SolarizedDark),
  createMonacoTheme('solarized-light', 'Solarized Light', SolarizedLight),
  createMonacoTheme('tomorrow', 'Tomorrow', Tomorrow),
  createMonacoTheme('tomorrow-night', 'Tomorrow Night', TomorrowNight),
  createMonacoTheme('tomorrow-night-blue', 'Tomorrow Night Blue', TomorrowNightBlue),
  createMonacoTheme('tomorrow-night-bright', 'Tomorrow Night Bright', TomorrowNightBright),
  createMonacoTheme('tomorrow-night-eighties', 'Tomorrow Night Eighties', TomorrowNightEighties),
  createMonacoTheme('cobalt', 'Cobalt', Cobalt),
  createMonacoTheme('twilight', 'Twilight', Twilight),
  
  // Alphabetical order for the rest
  createMonacoTheme('active4d', 'Active4D', Active4D),
  createMonacoTheme('all-hallows-eve', 'All Hallows Eve', AllHallowsEve),
  createMonacoTheme('amy', 'Amy', Amy),
  createMonacoTheme('birds-of-paradise', 'Birds of Paradise', BirdsOfParadise),
  createMonacoTheme('blackboard', 'Blackboard', Blackboard),
  createMonacoTheme('brilliance-black', 'Brilliance Black', BrillianceBlack),
  createMonacoTheme('brilliance-dull', 'Brilliance Dull', BrillianceDull),
  createMonacoTheme('chrome-devtools', 'Chrome DevTools', ChromeDevTools),
  createMonacoTheme('clouds', 'Clouds', Clouds),
  createMonacoTheme('clouds-midnight', 'Clouds Midnight', CloudsMidnight),
  createMonacoTheme('dawn', 'Dawn', Dawn),
  createMonacoTheme('dominion-day', 'Dominion Day', DominionDay),
  createMonacoTheme('dreamweaver', 'Dreamweaver', Dreamweaver),
  createMonacoTheme('eiffel', 'Eiffel', Eiffel),
  createMonacoTheme('espresso-libre', 'Espresso Libre', EspressoLibre),
  createMonacoTheme('idle', 'IDLE', IDLE),
  createMonacoTheme('idle-fingers', 'idleFingers', idleFingers),
  createMonacoTheme('iplastic', 'iPlastic', iPlastic),
  createMonacoTheme('katzenmilch', 'Katzenmilch', Katzenmilch),
  createMonacoTheme('kr-theme', 'krTheme', krTheme),
  createMonacoTheme('kuroir-theme', 'Kuroir Theme', KuroirTheme),
  createMonacoTheme('lazy', 'LAZY', LAZY),
  createMonacoTheme('magic-wb', 'MagicWB (Amiga)', MagicWB),
  createMonacoTheme('merbivore', 'Merbivore', Merbivore),
  createMonacoTheme('merbivore-soft', 'Merbivore Soft', MerbivoreSoft),
  createMonacoTheme('monoindustrial', 'monoindustrial', monoindustrial),
  createMonacoTheme('pastels-on-dark', 'Pastels on Dark', PastelsOnDark),
  createMonacoTheme('slush-and-poppies', 'Slush and Poppies', SlushAndPoppies),
  createMonacoTheme('spacecadet', 'SpaceCadet', SpaceCadet),
  createMonacoTheme('sunburst', 'Sunburst', Sunburst),
  createMonacoTheme('textmate-mac-classic', 'Textmate (Mac Classic)', TextmateMacClassic),
  createMonacoTheme('upstream-sunburst', 'Upstream Sunburst', UpstreamSunburst),
  createMonacoTheme('vibrant-ink', 'Vibrant Ink', VibrantInk),
  createMonacoTheme('xcode-default', 'Xcode Default', XcodeDefault),
  createMonacoTheme('zenburnesque', 'Zenburnesque', Zenburnesque),
];

// All built-in themes combined
export const ALL_BUILT_IN_THEMES: ThemeDefinition[] = [
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  ...MONACO_CORE_THEMES,
  ...MONACO_PACKAGE_THEMES,
];

/**
 * Maps a theme ID to the Monaco editor theme name
 * For built-in themes, this returns the Monaco theme identifier
 * For custom themes, this returns the theme ID (which will be registered with defineTheme)
 */
export function getMonacoThemeName(theme: ThemeDefinition): string {
  switch (theme.id) {
    case 'default-dark':
    case 'monaco-vs-dark':
      return 'vs-dark';
    case 'default-light':
    case 'monaco-vs':
      return 'vs';
    case 'monaco-hc-black':
      return 'hc-black';
    case 'monaco-hc-light':
      return 'hc-light';
    default:
      // Monaco-themes and custom themes use their ID as the Monaco theme name
      return theme.id;
  }
}

/**
 * Determines the app theme type (dark/light) from a Monaco base theme
 */
export function getAppThemeTypeFromBase(base: string): 'dark' | 'light' {
  return base === 'vs' || base === 'hc-light' ? 'light' : 'dark';
}

/**
 * Registers all monaco-themes with the Monaco editor
 * Should be called in beforeMount of the Editor component
 */
export function registerAllThemes(monaco: typeof import('monaco-editor')): void {
  MONACO_PACKAGE_THEMES.forEach((theme) => {
    if (theme.editor) {
      monaco.editor.defineTheme(theme.id, {
        base: theme.editor.base,
        inherit: theme.editor.inherit,
        rules: theme.editor.rules,
        colors: theme.editor.colors,
      });
    }
  });
}

// Mock electron-store before importing the module
const mockStore = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => mockStore);
});

// Import after mocks are set up
let getLeftSidebarWidth: () => number;
let setLeftSidebarWidth: (width: number) => void;
let getRightSidebarWidth: () => number;
let setRightSidebarWidth: (width: number) => void;
let getWindowBounds: () => { width: number; height: number; x?: number; y?: number } | undefined;
let setWindowBounds: (bounds: { width: number; height: number; x?: number; y?: number }) => void;

describe('ui-settings-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Re-import the module to reset state
    const uiSettingsStore = require('../../../src/main/storage/ui-settings-store');
    getLeftSidebarWidth = uiSettingsStore.getLeftSidebarWidth;
    setLeftSidebarWidth = uiSettingsStore.setLeftSidebarWidth;
    getRightSidebarWidth = uiSettingsStore.getRightSidebarWidth;
    setRightSidebarWidth = uiSettingsStore.setRightSidebarWidth;
    getWindowBounds = uiSettingsStore.getWindowBounds;
    setWindowBounds = uiSettingsStore.setWindowBounds;
  });

  describe('getLeftSidebarWidth', () => {
    it('should return stored width', () => {
      mockStore.get.mockReturnValue(300);
      const result = getLeftSidebarWidth();
      expect(result).toBe(300);
    });

    it('should return default width when no value is stored', () => {
      mockStore.get.mockReturnValue(null);
      const result = getLeftSidebarWidth();
      expect(result).toBe(250);
    });

    it('should return default width when store returns 0', () => {
      mockStore.get.mockReturnValue(0);
      const result = getLeftSidebarWidth();
      expect(result).toBe(250);
    });
  });

  describe('setLeftSidebarWidth', () => {
    it('should save width to store', () => {
      setLeftSidebarWidth(350);
      expect(mockStore.set).toHaveBeenCalledWith('leftSidebarWidth', 350);
    });

    it('should save minimum width', () => {
      setLeftSidebarWidth(100);
      expect(mockStore.set).toHaveBeenCalledWith('leftSidebarWidth', 100);
    });

    it('should save large width', () => {
      setLeftSidebarWidth(500);
      expect(mockStore.set).toHaveBeenCalledWith('leftSidebarWidth', 500);
    });
  });

  describe('getRightSidebarWidth', () => {
    it('should return stored width', () => {
      mockStore.get.mockReturnValue(400);
      const result = getRightSidebarWidth();
      expect(result).toBe(400);
    });

    it('should return default width when no value is stored', () => {
      mockStore.get.mockReturnValue(null);
      const result = getRightSidebarWidth();
      expect(result).toBe(300);
    });

    it('should return default width when store returns 0', () => {
      mockStore.get.mockReturnValue(0);
      const result = getRightSidebarWidth();
      expect(result).toBe(300);
    });
  });

  describe('setRightSidebarWidth', () => {
    it('should save width to store', () => {
      setRightSidebarWidth(450);
      expect(mockStore.set).toHaveBeenCalledWith('rightSidebarWidth', 450);
    });
  });

  describe('getWindowBounds', () => {
    it('should return stored window bounds', () => {
      const bounds = { width: 1400, height: 900, x: 100, y: 50 };
      mockStore.get.mockReturnValue(bounds);
      
      const result = getWindowBounds();
      expect(result).toEqual(bounds);
    });

    it('should return undefined when no bounds are stored', () => {
      mockStore.get.mockReturnValue(undefined);
      
      const result = getWindowBounds();
      expect(result).toBeUndefined();
    });

    it('should return bounds without position', () => {
      const bounds = { width: 1400, height: 900 };
      mockStore.get.mockReturnValue(bounds);
      
      const result = getWindowBounds();
      expect(result).toEqual(bounds);
    });
  });

  describe('setWindowBounds', () => {
    it('should save window bounds with position', () => {
      const bounds = { width: 1400, height: 900, x: 100, y: 50 };
      setWindowBounds(bounds);
      
      expect(mockStore.set).toHaveBeenCalledWith('windowBounds', bounds);
    });

    it('should save window bounds without position', () => {
      const bounds = { width: 1400, height: 900 };
      setWindowBounds(bounds);
      
      expect(mockStore.set).toHaveBeenCalledWith('windowBounds', bounds);
    });
  });
});

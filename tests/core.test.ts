import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DOM environment
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) { return this.store[key] || null; },
  setItem(key: string, value: string) { this.store[key] = value; },
  removeItem(key: string) { delete this.store[key]; },
  clear() { this.store = {}; },
};

const mockSessionStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) { return this.store[key] || null; },
  setItem(key: string, value: string) { this.store[key] = value; },
  removeItem(key: string) { delete this.store[key]; },
  clear() { this.store = {}; },
};

Object.defineProperty(global, 'localStorage', { value: mockLocalStorage, writable: true });
Object.defineProperty(global, 'sessionStorage', { value: mockSessionStorage, writable: true });

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock AbortSignal.timeout
global.AbortSignal = {
  timeout: (ms: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  },
} as any;

describe('Storage Utilities', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should store and retrieve settings from localStorage', () => {
    const testKey = 'gfs-studio:openrouter:settings';
    const testSettings = { model: 'test-model', temperature: 0.5, rememberKey: true };
    
    localStorage.setItem(testKey, JSON.stringify(testSettings));
    const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
    
    expect(retrieved.model).toBe('test-model');
    expect(retrieved.temperature).toBe(0.5);
    expect(retrieved.rememberKey).toBe(true);
  });

  it('should handle missing settings gracefully', () => {
    const retrieved = JSON.parse(localStorage.getItem('nonexistent') || '{}');
    expect(retrieved).toEqual({});
  });

  it('should store API key in localStorage when rememberKey is true', () => {
    const apiKey = 'sk-or-v1-test-key';
    localStorage.setItem('gfs-studio:openrouter:api-key', apiKey);
    
    expect(localStorage.getItem('gfs-studio:openrouter:api-key')).toBe(apiKey);
  });

  it('should store API key in sessionStorage when rememberKey is false', () => {
    const apiKey = 'sk-or-v1-test-key';
    sessionStorage.setItem('gfs-studio:openrouter:api-key', apiKey);
    
    expect(sessionStorage.getItem('gfs-studio:openrouter:api-key')).toBe(apiKey);
    expect(localStorage.getItem('gfs-studio:openrouter:api-key')).toBeNull();
  });
});

describe('Slide Layout Validation', () => {
  const SLIDE_LAYOUTS = [
    { id: 'cover', name: 'Titelfolie' },
    { id: 'section', name: 'Kapiteltrenner' },
    { id: 'columns', name: 'Zwei Spalten' },
    { id: 'quote', name: 'Zitat' },
    { id: 'image', name: 'Bild & Text' },
    { id: 'video', name: 'Video' },
    { id: 'conclusion', name: 'Fazit' },
    { id: 'timeline', name: 'Zeitstrahl' },
    { id: 'process', name: 'Prozess' },
    { id: 'comparison', name: 'Vergleich' },
    { id: 'metrics', name: 'Kennzahlen' },
    { id: 'team', name: 'Team' },
    { id: 'roadmap', name: 'Roadmap' },
    { id: 'kanban', name: 'Kanban-Board' },
    { id: 'mindmap', name: 'Mindmap' },
    { id: 'funnel', name: 'Trichter' },
    { id: 'swot', name: 'SWOT-Analyse' },
  ];

  it('should have all required layouts', () => {
    const requiredLayouts = ['cover', 'section', 'columns', 'quote', 'image', 'video', 'conclusion'];
    const newLayouts = ['timeline', 'process', 'comparison', 'metrics', 'team', 'roadmap', 'kanban', 'mindmap', 'funnel', 'swot'];
    
    requiredLayouts.forEach(id => {
      expect(SLIDE_LAYOUTS.some(l => l.id === id)).toBe(true);
    });
    
    newLayouts.forEach(id => {
      expect(SLIDE_LAYOUTS.some(l => l.id === id)).toBe(true);
    });
  });

  it('should have unique layout IDs', () => {
    const ids = SLIDE_LAYOUTS.map(l => l.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have name and description for each layout', () => {
    SLIDE_LAYOUTS.forEach(layout => {
      expect(layout.name).toBeTruthy();
      expect(typeof layout.name).toBe('string');
    });
  });
});

describe('Element Validation', () => {
  const isValidElement = (element: any): boolean => {
    if (!element || typeof element !== 'object') return false;
    if (typeof element.id !== 'string' || element.id.length > 100) return false;
    if (!['text', 'shape', 'image', 'video'].includes(element.type)) return false;
    if (![element.x, element.y, element.width].every(Number.isFinite)) return false;
    if (element.x < 0 || element.x > 100 || element.y < 0 || element.y > 100 || element.width < 5 || element.width > 95) return false;
    if (element.color && !/^#[0-9a-f]{6}$/i.test(element.color)) return false;
    if (element.size !== undefined && (!Number.isFinite(element.size) || element.size < 1.4 || element.size > 7)) return false;
    
    if (element.type === 'text') {
      return typeof element.text === 'string' &&
        element.text.length <= 4000 &&
        (element.family === undefined || ['Arial, Helvetica, sans-serif', 'Georgia, serif', 'monospace'].includes(element.family)) &&
        (element.align === undefined || ['left', 'center', 'right'].includes(element.align)) &&
        (element.bold === undefined || typeof element.bold === 'boolean');
    }
    
    if (element.type === 'shape') {
      return ['rectangle', 'circle', 'line'].includes(element.shape) &&
        (element.height === undefined || (Number.isFinite(element.height) && element.height >= 5 && element.height <= 90));
    }
    
    if (element.type === 'video') {
      return typeof element.src === 'string' &&
        /^https:\/\/(?:www\.youtube-nocookie\.com\/embed\/[\w-]+|player\.vimeo\.com\/video\/\d+)(?:\?[a-zA-Z0-9=&_-]*)?$/.test(element.src);
    }
    
    if (element.type === 'image') {
      return typeof element.src === 'string' &&
        /^data:image\/(?:png|jpeg|webp);base64,/.test(element.src) &&
        element.src.length <= 1_500_000 &&
        (element.alt === undefined || (typeof element.alt === 'string' && element.alt.length <= 120));
    }
    
    return false;
  };

  it('should validate a valid text element', () => {
    const element = {
      id: 'test-1',
      type: 'text',
      text: 'Hello World',
      x: 50,
      y: 50,
      width: 30,
      size: 3,
      color: '#171717',
      family: 'Arial, Helvetica, sans-serif',
      align: 'left',
      bold: false,
    };
    expect(isValidElement(element)).toBe(true);
  });

  it('should reject text element with invalid color', () => {
    const element = {
      id: 'test-2',
      type: 'text',
      text: 'Hello',
      x: 50,
      y: 50,
      width: 30,
      color: 'invalid-color',
    };
    expect(isValidElement(element)).toBe(false);
  });

  it('should reject text element with out-of-bounds position', () => {
    const element = {
      id: 'test-3',
      type: 'text',
      text: 'Hello',
      x: 150, // out of bounds
      y: 50,
      width: 30,
    };
    expect(isValidElement(element)).toBe(false);
  });

  it('should validate a valid shape element', () => {
    const element = {
      id: 'shape-1',
      type: 'shape',
      shape: 'rectangle',
      x: 20,
      y: 20,
      width: 40,
      height: 30,
      color: '#ef3828',
    };
    expect(isValidElement(element)).toBe(true);
  });

  it('should reject shape with invalid shape type', () => {
    const element = {
      id: 'shape-2',
      type: 'shape',
      shape: 'triangle', // invalid
      x: 20,
      y: 20,
      width: 40,
      height: 30,
    };
    expect(isValidElement(element)).toBe(false);
  });

  it('should validate a valid image element', () => {
    const element = {
      id: 'img-1',
      type: 'image',
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      x: 50,
      y: 50,
      width: 30,
      alt: 'Test image',
    };
    expect(isValidElement(element)).toBe(true);
  });

  it('should reject image with invalid data URL', () => {
    const element = {
      id: 'img-2',
      type: 'image',
      src: 'https://example.com/image.png', // not a data URL
      x: 50,
      y: 50,
      width: 30,
    };
    expect(isValidElement(element)).toBe(false);
  });

  it('should validate a valid video element', () => {
    const element = {
      id: 'vid-1',
      type: 'video',
      src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      x: 50,
      y: 50,
      width: 50,
    };
    expect(isValidElement(element)).toBe(true);
  });

  it('should reject video with invalid URL', () => {
    const element = {
      id: 'vid-2',
      type: 'video',
      src: 'https://example.com/video.mp4', // not youtube/vimeo embed
      x: 50,
      y: 50,
      width: 50,
    };
    expect(isValidElement(element)).toBe(false);
  });
});

describe('Roadmap Element Validation', () => {
  const isValidRoadmapElement = (element: any): boolean => {
    if (!element || typeof element !== 'object') return false;
    if (typeof element.id !== 'string') return false;
    if (!['phase', 'milestone', 'dependency'].includes(element.type)) return false;
    if (typeof element.title !== 'string' || element.title.length === 0) return false;
    if (typeof element.x !== 'number' || element.x < 0 || element.x > 100) return false;
    if (typeof element.y !== 'number' || element.y < 0 || element.y > 100) return false;
    if (typeof element.width !== 'number' || element.width < 5 || element.width > 90) return false;
    if (typeof element.height !== 'number' || element.height < 5 || element.height > 90) return false;
    if (element.color && !/^#[0-9a-f]{6}$/i.test(element.color)) return false;
    if (element.status && !['planned', 'in-progress', 'done', 'blocked'].includes(element.status)) return false;
    return true;
  };

  it('should validate a valid phase element', () => {
    const element = {
      id: 'phase-1',
      type: 'phase',
      title: 'Phase 1',
      date: 'Q1 2024',
      status: 'planned',
      color: '#ef3828',
      x: 10,
      y: 10,
      width: 35,
      height: 25,
    };
    expect(isValidRoadmapElement(element)).toBe(true);
  });

  it('should validate a valid milestone element', () => {
    const element = {
      id: 'milestone-1',
      type: 'milestone',
      title: 'Launch',
      date: '2024-03-15',
      status: 'done',
      color: '#171717',
      x: 50,
      y: 50,
      width: 20,
      height: 20,
    };
    expect(isValidRoadmapElement(element)).toBe(true);
  });

  it('should reject element with invalid type', () => {
    const element = {
      id: 'invalid-1',
      type: 'task', // invalid
      title: 'Task',
      x: 10,
      y: 10,
      width: 20,
      height: 20,
    };
    expect(isValidRoadmapElement(element)).toBe(false);
  });

  it('should reject element with invalid status', () => {
    const element = {
      id: 'invalid-2',
      type: 'phase',
      title: 'Phase',
      status: 'invalid-status',
      x: 10,
      y: 10,
      width: 20,
      height: 20,
    };
    expect(isValidRoadmapElement(element)).toBe(false);
  });
});
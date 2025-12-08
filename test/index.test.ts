import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuraCursor, AuraCursorOptions } from '../src/index';

describe('AuraCursor', () => {
  let cursor: AuraCursor;
  let rafId = 0;
  const rafCallbacks: Map<number, FrameRequestCallback> = new Map();

  beforeEach(() => {
    if (typeof process !== 'undefined' && !process.env.VITEST) {
      process.env.VITEST = 'true';
    }
    
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true, configurable: true });
    
    (window as Window & { __AURA_CURSOR_FORCE_DESKTOP__?: boolean }).__AURA_CURSOR_FORCE_DESKTOP__ = true;
    
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true, configurable: true });
    Object.defineProperty(navigator, 'userAgent', { 
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
      writable: true, 
      configurable: true 
    });
    
    rafId = 0;
    rafCallbacks.clear();
    global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      const id = ++rafId;
      rafCallbacks.set(id, cb);
      setTimeout(() => {
        const callback = rafCallbacks.get(id);
        if (callback) {
          callback(performance.now());
        }
      }, 0);
      return id;
    });
    
    global.cancelAnimationFrame = vi.fn((id: number) => {
      rafCallbacks.delete(id);
    });
  });

  afterEach(() => {
    if (cursor) {
      cursor.destroy();
    }
    document.body.innerHTML = '';
  });

  describe('Initialization', () => {
    it('should create an instance with default options', () => {
      cursor = new AuraCursor();
      expect(cursor).toBeInstanceOf(AuraCursor);
    });

    it('should create an instance with custom options', () => {
      const options: AuraCursorOptions = {
        size: 30,
        color: '#ff0000',
        opacity: 0.8,
        speed: 0.2,
      };
      cursor = new AuraCursor(options);
      expect(cursor).toBeInstanceOf(AuraCursor);
    });

    it('should initialize the cursor when init() is called', () => {
      cursor = new AuraCursor();
      cursor.init();
      
      const cursorElement = document.querySelector('.aura-cursor');
      expect(cursorElement).toBeTruthy();
    });

    it('should not create multiple elements when calling init() multiple times', () => {
      cursor = new AuraCursor();
      cursor.init();
      cursor.init();
      cursor.init();
      
      const cursorElements = document.querySelectorAll('.aura-cursor');
      expect(cursorElements.length).toBe(1);
    });
  });

  describe('Destruction', () => {
    it('should remove the cursor when destroy() is called', () => {
      cursor = new AuraCursor();
      cursor.init();
      
      expect(document.querySelector('.aura-cursor')).toBeTruthy();
      
      cursor.destroy();
      
      expect(document.querySelector('.aura-cursor')).toBeFalsy();
    });

    it('should cancel the animation when destroying', () => {
      cursor = new AuraCursor();
      cursor.init();
      
      expect(global.requestAnimationFrame).toHaveBeenCalled();
      
      cursor.destroy();
      
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Options update', () => {
    it('should update the cursor options', () => {
      cursor = new AuraCursor({ size: 20, color: '#000000' });
      cursor.init();
      
      cursor.updateOptions({ size: 40, color: '#ff0000' });
      
      const cursorElement = document.querySelector('.aura-cursor') as HTMLElement;
      expect(cursorElement.style.width).toBe('40px');
      expect(cursorElement.style.height).toBe('40px');
      expect(cursorElement.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });
  });

  describe('Default options', () => {
    it('should use default values when options are not provided', async () => {
      cursor = new AuraCursor();
      cursor.init();
      
      const cursorElement = document.querySelector('.aura-cursor') as HTMLElement;
      expect(cursorElement).toBeTruthy();
      expect(cursorElement.style.width).toBe('20px');
      expect(cursorElement.style.height).toBe('20px');
      expect(cursorElement.style.backgroundColor).toBe('rgb(0, 0, 0)');
      expect(cursorElement.style.opacity).toBe('0');
      
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });
      window.dispatchEvent(mouseEvent);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(cursorElement.style.opacity).toBe('0.5');
    });
  });
});

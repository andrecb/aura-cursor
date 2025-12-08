export interface AuraCursorHoverEffectOptions {
  /**
   * Circle color when hovering over interactive elements
   * @default undefined (uses default color or hoverColor)
   */
  color?: string;
  /**
   * Circle opacity when hovering over interactive elements (0 to 1)
   * @default undefined (uses default opacity)
   */
  opacity?: number;
  /**
   * Scale multiplier when hovering over interactive elements
   * Multiplies the base size (e.g., 1.5 = 150% of base size)
   * @default 1.5
   */
  scale?: number;
}

export interface AuraCursorOptions {
  /**
   * Circle size in pixels
   * @default 20
   */
  size?: number;
  /**
   * Circle color
   * @default '#000000'
   */
  color?: string;
  /**
   * Circle opacity (0 to 1)
   * @default 0.5
   */
  opacity?: number;
  /**
   * Mouse follow speed (0 to 1)
   * Higher values make the circle follow the mouse faster
   * @default 0.3
   */
  speed?: number;
  /**
   * Whether to hide the default cursor
   * @default false
   */
  hideDefaultCursor?: boolean;
  /**
   * Additional CSS class for the cursor element
   * @default ''
   */
  className?: string;
  /**
   * Whether to apply the cursor only on interactive elements (links, buttons, etc)
   * @default false
   */
  interactiveOnly?: boolean;
  /**
   * Options for hover effects when cursor is over interactive elements (links, buttons, etc)
   * @default undefined (no special styling)
   */
  hoverEffect?: AuraCursorHoverEffectOptions;
  /**
   * Show cursor as outline (border only) with center dot
   * @default false
   */
  outlineMode?: boolean;
  /**
   * Border width in pixels when outline mode is enabled
   * @default 2
   */
  outlineWidth?: number;
  /**
   * Color for the center dot in outline mode or when hideDefaultCursor is enabled
   * If not provided, uses the primary color
   * @default undefined (uses primary color)
   */
  centerDotColor?: string;
  /**
   * Color when hovering over interactive elements
   * If not provided, uses the primary color or hoverEffect color
   * @default undefined (uses primary color or hoverEffect color)
   */
  hoverColor?: string;
  /**
   * Size of the center dot in pixels when hideDefaultCursor is enabled or in outline mode
   * @default 3
   */
  centerDotSize?: number;
  /**
   * Color for the center dot when hovering over interactive elements
   * Works in both outline mode and when hideDefaultCursor is enabled
   * If not provided, uses centerDotColor or the primary color
   * @default undefined (uses centerDotColor or primary color)
   */
  centerDotHoverColor?: string;
}

export class AuraCursor {
  private cursorElement: HTMLDivElement | null = null;
  private cursorDot: HTMLDivElement | null = null;
  private centerDot: HTMLDivElement | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private currentX = 0;
  private currentY = 0;
  private targetX = 0;
  private targetY = 0;
  private centerDotX = 0;
  private centerDotY = 0;
  private outlineCircleX = 0;
  private outlineCircleY = 0;
  private animationFrameId: number | null = null;
  private isActive = false;
  private isPointer = false;
  private isHoveringInteractive = false;
  private isOnInteractiveElement = false;
  private isMouseInWindow = true;
  private options: Required<Omit<AuraCursorOptions, 'hoverEffect' | 'centerDotColor' | 'hoverColor' | 'centerDotSize' | 'centerDotHoverColor'>> & { 
    centerDotColor?: string;
    hoverColor?: string;
    centerDotSize?: number;
    centerDotHoverColor?: string;
    hoverEffect?: AuraCursorHoverEffectOptions;
  };
  private baseOptions: Required<Omit<AuraCursorOptions, 'hoverEffect' | 'centerDotColor' | 'hoverColor' | 'centerDotSize' | 'centerDotHoverColor'>> & {
    centerDotColor?: string;
    hoverColor?: string;
    centerDotSize?: number;
    centerDotHoverColor?: string;
  };
  private pointerElementsCache: WeakMap<HTMLElement, boolean> = new WeakMap();
  private resizeHandler: (() => void) | null = null;

  constructor(options: AuraCursorOptions = {}) {
    this.baseOptions = {
      size: options.size ?? 20,
      color: options.color ?? '#000000',
      opacity: options.opacity ?? 0.5,
      speed: options.speed ?? 0.3,
      hideDefaultCursor: options.hideDefaultCursor ?? false,
      className: options.className ?? '',
      interactiveOnly: options.interactiveOnly ?? false,
      outlineMode: options.outlineMode ?? false,
      outlineWidth: options.outlineWidth ?? 2,
      centerDotColor: options.centerDotColor,
      hoverColor: options.hoverColor,
      centerDotSize: options.centerDotSize ?? 3,
      centerDotHoverColor: options.centerDotHoverColor,
    };
    this.options = {
      ...this.baseOptions,
      hoverEffect: options.hoverEffect,
    };
  }

  /**
   * Checks if the current device is a mobile/touch device
   */
  private isMobileDevice(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    return hasTouch || (isSmallScreen && isMobileUserAgent);
  }

  /**
   * Initializes the custom cursor
   */
  public init(): void {
    if (this.isActive || typeof window === 'undefined') {
      return;
    }

    if (this.isMobileDevice()) {
      return;
    }

    this.createCursorElement();
    this.attachEventListeners();
    this.animate();
    this.isActive = true;

    if (this.options.hideDefaultCursor) {
      this.hideDefaultCursor();
    }

    this.setupResizeListener();
  }

  /**
   * Removes the custom cursor
   */
  public destroy(): void {
    if (!this.isActive) {
      return;
    }

    this.removeEventListeners();
    this.removeResizeListener();
    this.removeCursorElement();
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.options.hideDefaultCursor) {
      this.showDefaultCursor();
    }

    this.isActive = false;
  }

  /**
   * Updates the cursor options
   */
  public updateOptions(options: Partial<AuraCursorOptions>): void {
    if (options.hoverEffect !== undefined) {
      this.options.hoverEffect = options.hoverEffect;
    }
    
    const hideDefaultCursorChanged = options.hideDefaultCursor !== undefined && 
      options.hideDefaultCursor !== this.baseOptions.hideDefaultCursor;
    
    if (options.size !== undefined) this.baseOptions.size = options.size;
    if (options.color !== undefined) this.baseOptions.color = options.color;
    if (options.opacity !== undefined) this.baseOptions.opacity = options.opacity;
    if (options.speed !== undefined) this.baseOptions.speed = options.speed;
    if (options.hideDefaultCursor !== undefined) this.baseOptions.hideDefaultCursor = options.hideDefaultCursor;
    if (options.className !== undefined) this.baseOptions.className = options.className;
    if (options.interactiveOnly !== undefined) this.baseOptions.interactiveOnly = options.interactiveOnly;
    if (options.outlineMode !== undefined) {
      this.baseOptions.outlineMode = options.outlineMode;
      if (this.isActive) {
        this.removeCursorElement();
        this.createCursorElement();
        this.applyStyles();
      }
    }
    if (options.outlineWidth !== undefined) {
      this.baseOptions.outlineWidth = options.outlineWidth;
      if (this.isActive && this.options.outlineMode) {
        this.applyStyles();
      }
    }
    if (options.centerDotColor !== undefined) {
      this.baseOptions.centerDotColor = options.centerDotColor;
      if (this.isActive && this.options.outlineMode) {
        this.applyStyles();
      }
    }
    if (options.hoverColor !== undefined) {
      this.baseOptions.hoverColor = options.hoverColor;
      if (this.isActive) {
        this.applyStyles();
      }
    }
    if (options.centerDotSize !== undefined) {
      this.baseOptions.centerDotSize = options.centerDotSize;
      if (this.isActive && (this.options.hideDefaultCursor || this.options.outlineMode)) {
        this.applyStyles();
      }
    }
    if (options.centerDotHoverColor !== undefined) {
      this.baseOptions.centerDotHoverColor = options.centerDotHoverColor;
      if (this.isActive && this.options.hideDefaultCursor) {
        this.applyStyles();
      }
    }
    
    this.options = {
      ...this.baseOptions,
      hoverEffect: this.options.hoverEffect,
    };
    
    if (hideDefaultCursorChanged) {
      if (this.options.hideDefaultCursor && !this.options.outlineMode) {
        this.hideDefaultCursor();
        const existingCenterDots = document.querySelectorAll('.aura-cursor-center-dot');
        existingCenterDots.forEach((element) => {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
        if (!this.centerDot) {
          this.centerDot = document.createElement('div');
          this.centerDot.className = 'aura-cursor-center-dot';
          document.body.appendChild(this.centerDot);
          this.applyStyles();
        }
      } else {
        this.showDefaultCursor();
        const existingCenterDots = document.querySelectorAll('.aura-cursor-center-dot');
        existingCenterDots.forEach((element) => {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
        if (this.centerDot && this.centerDot.parentNode) {
          this.centerDot.parentNode.removeChild(this.centerDot);
          this.centerDot = null;
        }
      }
    }
    
    if (options.outlineMode !== undefined && this.isActive) {
      if (this.options.outlineMode) {
        if (!this.cursorDot) {
          this.cursorDot = document.createElement('div');
          this.cursorDot.className = 'aura-cursor-dot';
          document.body.appendChild(this.cursorDot);
        }
        if (this.centerDot && this.centerDot.parentNode) {
          this.centerDot.parentNode.removeChild(this.centerDot);
          this.centerDot = null;
        }
        this.applyStyles();
      } else {
        if (this.cursorDot && this.cursorDot.parentNode) {
          this.cursorDot.parentNode.removeChild(this.cursorDot);
          this.cursorDot = null;
        }
        if (this.options.hideDefaultCursor && !this.centerDot) {
          this.centerDot = document.createElement('div');
          this.centerDot.className = 'aura-cursor-center-dot';
          document.body.appendChild(this.centerDot);
        }
        this.applyStyles();
      }
    }
    
    if (this.cursorElement) {
      this.applyStyles();
    }
  }

  /**
   * Creates the cursor DOM element
   */
  private createCursorElement(): void {
    const existingCursors = document.querySelectorAll('.aura-cursor, .aura-cursor-dot, .aura-cursor-center-dot');
    existingCursors.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    this.cursorElement = document.createElement('div');
    this.cursorElement.className = `aura-cursor ${this.options.className}`.trim();
    
    this.applyStyles();
    
    document.body.appendChild(this.cursorElement);
    
    if (this.options.outlineMode) {
      this.cursorDot = document.createElement('div');
      this.cursorDot.className = 'aura-cursor-dot';
      document.body.appendChild(this.cursorDot);
      this.applyStyles();
    }
    
    if (this.options.hideDefaultCursor && !this.options.outlineMode) {
      if (!this.centerDot) {
        this.centerDot = document.createElement('div');
        this.centerDot.className = 'aura-cursor-center-dot';
        document.body.appendChild(this.centerDot);
        this.applyStyles();
      }
    } else if (this.centerDot && this.centerDot.parentNode) {
      this.centerDot.parentNode.removeChild(this.centerDot);
      this.centerDot = null;
    }
    
    let initialX = window.innerWidth / 2;
    let initialY = window.innerHeight / 2;
    
    if (typeof document !== 'undefined') {
      const doc = document as Document & { __auraCursorLastMouseEvent?: MouseEvent };
      const lastMouseEvent = doc.__auraCursorLastMouseEvent;
      if (lastMouseEvent && lastMouseEvent.clientX !== undefined && lastMouseEvent.clientY !== undefined) {
        initialX = lastMouseEvent.clientX;
        initialY = lastMouseEvent.clientY;
      }
    }
    
    this.currentX = initialX;
    this.currentY = initialY;
    this.targetX = initialX;
    this.targetY = initialY;
    this.centerDotX = initialX;
    this.centerDotY = initialY;
    this.outlineCircleX = initialX;
    this.outlineCircleY = initialY;
    
    this.cursorElement.style.opacity = '0';
    if (this.cursorDot) {
      this.cursorDot.style.opacity = '0';
    }
    if (this.centerDot) {
      this.centerDot.style.opacity = '0';
    }
    
    this.updateCursorPosition();
  }

  /**
   * Applies styles to the cursor element
   */
  private applyStyles(): void {
    if (!this.cursorElement) return;

    const size = this.baseOptions.size;
    
    let color = this.baseOptions.color;
    if (this.isHoveringInteractive || this.isPointer) {
      if (this.baseOptions.hoverColor) {
        color = this.baseOptions.hoverColor;
      } else if (this.isPointer && this.options.hoverEffect?.color) {
        color = this.options.hoverEffect.color;
      }
    }
    
    const opacity = this.isPointer && this.options.hoverEffect?.opacity !== undefined
      ? this.options.hoverEffect.opacity 
      : this.baseOptions.opacity;

    const scale = this.isPointer && this.options.hoverEffect?.scale
      ? this.options.hoverEffect.scale
      : 1;

    this.cursorElement.style.position = 'fixed';
    this.cursorElement.style.width = `${size}px`;
    this.cursorElement.style.height = `${size}px`;
    this.cursorElement.style.borderRadius = '50%';
    this.cursorElement.style.pointerEvents = 'none';
    this.cursorElement.style.zIndex = '9999';
    this.cursorElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
    this.cursorElement.style.transition = 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease, opacity 0.3s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), border 0.3s ease';
    this.cursorElement.style.left = '0px';
    this.cursorElement.style.top = '0px';
    this.cursorElement.style.boxShadow = 'none';
    this.cursorElement.style.outline = 'none';

    if (this.options.outlineMode) {
      const outlineSize = size;
      this.cursorElement.style.width = `${outlineSize}px`;
      this.cursorElement.style.height = `${outlineSize}px`;
      this.cursorElement.style.backgroundColor = 'transparent';
      this.cursorElement.style.border = `${this.options.outlineWidth}px solid ${color}`;
      this.cursorElement.style.opacity = String(opacity);
      this.cursorElement.style.boxShadow = 'none';
      this.cursorElement.style.outline = 'none';
      this.cursorElement.style.zIndex = '9999';
      
      if (this.cursorDot) {
        let dotColor: string;
        if (this.isHoveringInteractive || this.isPointer) {
          if (this.baseOptions.centerDotHoverColor) {
            dotColor = this.baseOptions.centerDotHoverColor;
          } else if (this.baseOptions.centerDotColor) {
            dotColor = this.baseOptions.centerDotColor;
          } else if (this.baseOptions.hoverColor) {
            dotColor = this.baseOptions.hoverColor;
          } else {
            dotColor = this.baseOptions.color;
          }
        } else {
          if (this.baseOptions.centerDotColor) {
            dotColor = this.baseOptions.centerDotColor;
          } else {
            dotColor = this.baseOptions.color;
          }
        }
        const baseSize = this.baseOptions.centerDotSize ?? 3;
        const dotSize = `${baseSize}px`;
        
        this.cursorDot.style.cssText = '';
        this.cursorDot.style.position = 'fixed';
        this.cursorDot.style.width = dotSize;
        this.cursorDot.style.height = dotSize;
        this.cursorDot.style.borderRadius = '50%';
        this.cursorDot.style.backgroundColor = dotColor;
        this.cursorDot.style.border = '0';
        this.cursorDot.style.outline = '0';
        this.cursorDot.style.boxShadow = 'none';
        this.cursorDot.style.opacity = '1';
        this.cursorDot.style.zIndex = '10001';
        this.cursorDot.style.pointerEvents = 'none';
        this.cursorDot.style.margin = '0';
        this.cursorDot.style.padding = '0';
        this.cursorDot.style.display = 'block';
        this.cursorDot.style.transform = 'translate(-50%, -50%)';
        this.cursorDot.style.transition = 'background-color 0.3s ease';
        this.cursorDot.style.left = `${this.centerDotX}px`;
        this.cursorDot.style.top = `${this.centerDotY}px`;
      }
    } else {
      this.cursorElement.style.backgroundColor = color;
      this.cursorElement.style.opacity = String(opacity);
      this.cursorElement.style.border = 'none';
      
      if (this.cursorDot) {
        this.cursorDot.style.display = 'none';
      }
    }
    
    if (this.centerDot) {
      if (this.options.hideDefaultCursor && !this.options.outlineMode) {
        const centerDotSize = this.baseOptions.centerDotSize ?? 3;
        let centerDotColor: string;
        
        if (this.isHoveringInteractive || this.isPointer) {
          centerDotColor = this.baseOptions.centerDotHoverColor || this.baseOptions.centerDotColor || this.baseOptions.color;
        } else {
          centerDotColor = this.baseOptions.centerDotColor || this.baseOptions.color;
        }
        
        this.centerDot.style.width = `${centerDotSize}px`;
        this.centerDot.style.height = `${centerDotSize}px`;
        this.centerDot.style.borderRadius = '50%';
        this.centerDot.style.backgroundColor = centerDotColor;
        this.centerDot.style.border = 'none';
        this.centerDot.style.outline = 'none';
        this.centerDot.style.boxShadow = 'none';
        this.centerDot.style.opacity = '1';
        this.centerDot.style.zIndex = '10000';
        this.centerDot.style.pointerEvents = 'none';
        this.centerDot.style.margin = '0';
        this.centerDot.style.padding = '0';
        this.centerDot.style.display = 'block';
        this.centerDot.style.transition = 'background-color 0.3s ease';
        this.updateCenterDotPosition();
      } else {
        this.centerDot.style.display = 'none';
      }
    }
  }


  /**
   * Updates the visual position of the cursor
   */
  private updateCursorPosition(): void {
    if (!this.cursorElement) return;
    
    if (this.options.outlineMode) {
      this.cursorElement.style.left = `${this.outlineCircleX}px`;
      this.cursorElement.style.top = `${this.outlineCircleY}px`;
    } else {
      this.cursorElement.style.left = `${this.currentX}px`;
      this.cursorElement.style.top = `${this.currentY}px`;
    }
  }

  /**
   * Updates the center dot position to follow the mouse directly (no delay)
   * The center dot follows the mouse instantly while the outer circle follows with interpolation
   */
  private updateCenterDotPosition(): void {
    if (!this.centerDot || !this.options.hideDefaultCursor || this.options.outlineMode) return;

    this.centerDot.style.position = 'fixed';
    this.centerDot.style.left = `${this.centerDotX}px`;
    this.centerDot.style.top = `${this.centerDotY}px`;
    this.centerDot.style.transform = 'translate(-50%, -50%)';
    this.centerDot.style.display = 'block';
    this.centerDot.style.border = 'none';
    this.centerDot.style.outline = 'none';
    this.centerDot.style.boxShadow = 'none';
  }

  /**
   * Updates the cursor dot position in outline mode to follow the mouse directly (no delay)
   */
  private updateCursorDotPosition(): void {
    if (!this.cursorDot || !this.options.outlineMode) return;

    this.cursorDot.style.left = `${this.centerDotX}px`;
    this.cursorDot.style.top = `${this.centerDotY}px`;
    this.cursorDot.style.border = '0';
    this.cursorDot.style.outline = '0';
    this.cursorDot.style.boxShadow = 'none';
  }

  /**
   * Animation loop using requestAnimationFrame
   */
  private animate = (): void => {
    if (this.options.outlineMode) {
      this.centerDotX = this.targetX;
      this.centerDotY = this.targetY;
      
      const distance = Math.sqrt(
        Math.pow(this.targetX - this.outlineCircleX, 2) + 
        Math.pow(this.targetY - this.outlineCircleY, 2)
      );
      
      const baseSpeed = this.options.speed * 0.5;
      const adaptiveSpeed = distance > 50 
        ? Math.min(baseSpeed * 2, 0.8)
        : baseSpeed;
      
      this.outlineCircleX += (this.targetX - this.outlineCircleX) * adaptiveSpeed;
      this.outlineCircleY += (this.targetY - this.outlineCircleY) * adaptiveSpeed;
      
      this.updateCursorPosition();
      this.updateCursorDotPosition();
    } else {
      const distance = Math.sqrt(
        Math.pow(this.targetX - this.currentX, 2) + 
        Math.pow(this.targetY - this.currentY, 2)
      );
      
      const adaptiveSpeed = distance > 50 
        ? Math.min(this.options.speed * 2, 0.8)
        : this.options.speed;
      
      this.currentX += (this.targetX - this.currentX) * adaptiveSpeed;
      this.currentY += (this.targetY - this.currentY) * adaptiveSpeed;
      this.updateCursorPosition();
    }
    
    this.updateCenterDotPosition();

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Checks if an element or any of its ancestors has cursor: pointer
   * This function checks the original CSS even when global cursor: none is applied
   */
  private hasPointerCursor(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      if (!(current instanceof HTMLElement)) {
        break;
      }
      
      if (this.pointerElementsCache.has(current)) {
        const cached = this.pointerElementsCache.get(current);
        if (cached) {
          return true;
        }
        current = current.parentElement;
        continue;
      }
      
      const computedStyle = window.getComputedStyle(current, null);
      let cursor = computedStyle.cursor;
      
      if (cursor === 'none' && this.options.hideDefaultCursor && this.styleElement?.parentNode) {
        const globalStyleParent = this.styleElement.parentNode;
        globalStyleParent.removeChild(this.styleElement);
        
        const originalComputed = window.getComputedStyle(current, null);
        cursor = originalComputed.cursor;
        globalStyleParent.appendChild(this.styleElement);
      }
      
      const hasPointer = cursor === 'pointer';
      this.pointerElementsCache.set(current, hasPointer);
      
      if (hasPointer) {
        return true;
      }
      
      current = current.parentElement;
    }
    
    return false;
  }

  /**
   * Checks if an element is interactive (clickable)
   */
  private isInteractiveElement(element: HTMLElement): boolean {
    if (!element || !(element instanceof HTMLElement)) {
      return false;
    }
    
    if (this.hasPointerCursor(element)) {
      return true;
    }
    
    const inputElement = element.tagName === 'INPUT' ? (element as HTMLInputElement) : null;
    const isInputRange = inputElement?.type === 'range';
    const isInputColor = inputElement?.type === 'color';
    const isInputCheckbox = inputElement?.type === 'checkbox';
    const isInteractiveInput = isInputRange || isInputColor || isInputCheckbox;
    
    return (
      element.tagName === 'A' ||
      element.tagName === 'BUTTON' ||
      element.getAttribute('role') === 'button' ||
      element.onclick !== null ||
      isInteractiveInput ||
      element.closest('a, button, [role="button"], [onclick], input[type="range"], input[type="color"], input[type="checkbox"]') !== null
    );
  }


  /**
   * Handles mouse leaving the window/document area
   */
  private handleMouseLeave = (e: MouseEvent): void => {
    if (!e.relatedTarget || (e.relatedTarget as Node).nodeName === 'HTML') {
      this.isMouseInWindow = false;
      this.hideCursor();
    }
  };

  /**
   * Handles mouse entering the window/document area
   */
  private handleMouseEnter = (): void => {
    this.isMouseInWindow = true;
    if (this.cursorElement) {
      this.applyStyles();
    }
  };

  /**
   * Handles window blur (when window loses focus, e.g., mouse goes to address bar)
   */
  private handleWindowBlur = (): void => {
    this.isMouseInWindow = false;
    this.hideCursor();
  };

  /**
   * Handles window focus (when window gains focus)
   */
  private handleWindowFocus = (): void => {
    this.isMouseInWindow = true;
    if (this.cursorElement) {
      this.applyStyles();
    }
  };

  /**
   * Hides the cursor
   */
  private hideCursor(): void {
    if (this.cursorElement) {
      this.cursorElement.style.opacity = '0';
    }
    if (this.cursorDot) {
      this.cursorDot.style.opacity = '0';
    }
    if (this.centerDot) {
      this.centerDot.style.opacity = '0';
    }
  }

  /**
   * Handles mouse movement
   */
  private handleMouseMove = (e: MouseEvent): void => {
    if (typeof document !== 'undefined') {
      const doc = document as Document & { __auraCursorLastMouseEvent?: MouseEvent };
      doc.__auraCursorLastMouseEvent = e;
    }
    
    if (!this.isMouseInWindow) {
      return;
    }

    if (this.cursorElement && this.cursorElement.style.opacity === '0') {
      this.applyStyles();
    }

    const target = e.target;
    if (!target || !(target instanceof HTMLElement)) {
      return;
    }
    
    const isInteractive = this.isInteractiveElement(target);
    
    const wasOnInteractive = this.isOnInteractiveElement;
    this.isOnInteractiveElement = isInteractive;
    
    if (this.options.interactiveOnly) {
      if (!isInteractive) {
        if (wasOnInteractive && this.cursorElement) {
          this.hideCursor();
        }
        return;
      } else {
        if (!wasOnInteractive && this.cursorElement) {
          this.applyStyles();
        }
      }
    } else {
      if (this.cursorElement && this.cursorElement.style.opacity === '0') {
        this.applyStyles();
      }
    }

    if (this.isHoveringInteractive !== isInteractive) {
      this.isHoveringInteractive = isInteractive;
      this.applyStyles();
    }

    if (this.options.hoverEffect) {
      const isPointerElement = this.isInteractiveElement(target);

      if (this.isPointer !== isPointerElement) {
        this.isPointer = isPointerElement;
        this.applyStyles();
      }
    }

    this.targetX = e.clientX;
    this.targetY = e.clientY;
    
    if (this.options.outlineMode) {
      this.centerDotX = e.clientX;
      this.centerDotY = e.clientY;
      this.updateCursorDotPosition();
    }
    
    if (this.options.hideDefaultCursor) {
      this.centerDotX = e.clientX;
      this.centerDotY = e.clientY;
      this.updateCenterDotPosition();
    }
  };

  /**
   * Attaches event listeners
   */
  private attachEventListeners(): void {
    window.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseleave', this.handleMouseLeave);
    document.addEventListener('mouseenter', this.handleMouseEnter);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
  }

  /**
   * Removes event listeners
   */
  private removeEventListeners(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    document.removeEventListener('mouseenter', this.handleMouseEnter);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
  }

  /**
   * Sets up resize listener to handle mobile/desktop transitions
   */
  private setupResizeListener(): void {
    if (typeof window === 'undefined' || this.resizeHandler) {
      return;
    }

    this.resizeHandler = () => {
      if (this.isMobileDevice()) {
        if (this.isActive) {
          this.removeEventListeners();
          this.removeCursorElement();
          
          if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
          }

          if (this.options.hideDefaultCursor) {
            this.showDefaultCursor();
          }

          this.isActive = false;
        }
      } else {
        if (!this.isActive) {
          this.createCursorElement();
          this.attachEventListeners();
          this.animate();
          this.isActive = true;

          if (this.options.hideDefaultCursor) {
            this.hideDefaultCursor();
          }
        }
      }
    };

    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('orientationchange', this.resizeHandler);
  }

  /**
   * Removes resize listener
   */
  private removeResizeListener(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('orientationchange', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  /**
   * Removes the cursor element from the DOM
   */
  private removeCursorElement(): void {
    if (this.cursorElement) {
      if (this.cursorElement.parentNode) {
        this.cursorElement.parentNode.removeChild(this.cursorElement);
      }
      this.cursorElement = null;
    }
    if (this.cursorDot) {
      if (this.cursorDot.parentNode) {
        this.cursorDot.parentNode.removeChild(this.cursorDot);
      }
      this.cursorDot = null;
    }
    if (this.centerDot) {
      if (this.centerDot.parentNode) {
        this.centerDot.parentNode.removeChild(this.centerDot);
      }
      this.centerDot = null;
    }
    
    const orphanedCursors = document.querySelectorAll('.aura-cursor, .aura-cursor-dot, .aura-cursor-center-dot');
    orphanedCursors.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  }

  /**
   * Hides the default cursor by adding a global style
   */
  private hideDefaultCursor(): void {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'aura-cursor-hide-default';
      this.styleElement.textContent = '* { cursor: none !important; }';
      document.head.appendChild(this.styleElement);
      this.pointerElementsCache = new WeakMap();
    }
  }

  /**
   * Shows the default cursor by removing the global style
   */
  private showDefaultCursor(): void {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
      this.pointerElementsCache = new WeakMap();
    }
  }
}


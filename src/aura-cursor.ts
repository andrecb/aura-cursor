export interface AuraCursorPointerOptions {
  /**
   * Circle size in pixels when hovering over pointer elements
   * @default undefined (uses default size)
   */
  size?: number;
  /**
   * Circle color when hovering over pointer elements
   * @default undefined (uses default color)
   */
  color?: string;
  /**
   * Circle opacity when hovering over pointer elements (0 to 1)
   * @default undefined (uses default opacity)
   */
  opacity?: number;
  /**
   * Scale multiplier when hovering over pointer elements
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
   * Options for when cursor is over pointer elements
   * @default undefined (no special styling)
   */
  pointer?: AuraCursorPointerOptions;
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
   * Color for the center dot in outline mode
   * If not provided, uses the primary color
   * @default undefined (uses primary color)
   */
  cursorDotColor?: string;
  /**
   * Color when hovering over interactive elements
   * If not provided, uses the primary color or pointer color
   * @default undefined (uses primary color or pointer color)
   */
  hoverColor?: string;
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
  private options: Required<Omit<AuraCursorOptions, 'pointer' | 'cursorDotColor' | 'hoverColor'>> & { 
    cursorDotColor?: string;
    hoverColor?: string;
    pointer?: AuraCursorPointerOptions;
  };
  private baseOptions: Required<Omit<AuraCursorOptions, 'pointer' | 'cursorDotColor' | 'hoverColor'>> & {
    cursorDotColor?: string;
    hoverColor?: string;
  };
  private pointerElementsCache: WeakMap<HTMLElement, boolean> = new WeakMap();

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
      cursorDotColor: options.cursorDotColor,
      hoverColor: options.hoverColor,
    };
    this.options = {
      ...this.baseOptions,
      pointer: options.pointer,
    };
  }

  /**
   * Initializes the custom cursor
   */
  public init(): void {
    if (this.isActive || typeof window === 'undefined') {
      return;
    }

    this.createCursorElement();
    this.attachEventListeners();
    this.animate();
    this.isActive = true;

    if (this.options.hideDefaultCursor) {
      this.hideDefaultCursor();
    }
  }

  /**
   * Removes the custom cursor
   */
  public destroy(): void {
    if (!this.isActive) {
      return;
    }

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

  /**
   * Updates the cursor options
   */
  public updateOptions(options: Partial<AuraCursorOptions>): void {
    if (options.pointer !== undefined) {
      this.options.pointer = options.pointer;
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
    if (options.cursorDotColor !== undefined) {
      this.baseOptions.cursorDotColor = options.cursorDotColor;
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
    
    this.options = {
      ...this.baseOptions,
      pointer: this.options.pointer,
    };
    
    if (hideDefaultCursorChanged) {
      if (this.options.hideDefaultCursor) {
        this.hideDefaultCursor();
        if (!this.centerDot) {
          this.centerDot = document.createElement('div');
          this.centerDot.className = 'aura-cursor-center-dot';
          document.body.appendChild(this.centerDot);
          this.applyStyles();
        }
      } else {
        this.showDefaultCursor();
        if (this.centerDot && this.centerDot.parentNode) {
          this.centerDot.parentNode.removeChild(this.centerDot);
          this.centerDot = null;
        }
      }
    }
    
    if (options.outlineMode !== undefined && this.isActive) {
      if (this.options.outlineMode && !this.cursorDot) {
        this.cursorDot = document.createElement('div');
        this.cursorDot.className = 'aura-cursor-dot';
        document.body.appendChild(this.cursorDot);
        this.applyStyles();
      } else if (!this.options.outlineMode && this.cursorDot) {
        if (this.cursorDot.parentNode) {
          this.cursorDot.parentNode.removeChild(this.cursorDot);
        }
        this.cursorDot = null;
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
    
    if (this.options.hideDefaultCursor) {
      this.centerDot = document.createElement('div');
      this.centerDot.className = 'aura-cursor-center-dot';
      document.body.appendChild(this.centerDot);
      this.applyStyles();
    }
    
    this.currentX = window.innerWidth / 2;
    this.currentY = window.innerHeight / 2;
    this.targetX = this.currentX;
    this.targetY = this.currentY;
    this.centerDotX = this.currentX;
    this.centerDotY = this.currentY;
    this.outlineCircleX = this.currentX;
    this.outlineCircleY = this.currentY;
    this.updateCursorPosition();
  }

  /**
   * Applies styles to the cursor element
   */
  private applyStyles(): void {
    if (!this.cursorElement) return;

    const size = this.isPointer && this.options.pointer?.size 
      ? this.options.pointer.size 
      : this.baseOptions.size;
    
    let color = this.baseOptions.color;
    if (this.isHoveringInteractive || this.isPointer) {
      if (this.baseOptions.hoverColor) {
        color = this.baseOptions.hoverColor;
      } else if (this.isPointer && this.options.pointer?.color) {
        color = this.options.pointer.color;
      }
    }
    
    const opacity = this.isPointer && this.options.pointer?.opacity !== undefined
      ? this.options.pointer.opacity 
      : this.baseOptions.opacity;

    const scale = this.isPointer && this.options.pointer?.scale
      ? this.options.pointer.scale
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
        let dotColor = this.baseOptions.cursorDotColor || this.baseOptions.color;
        if ((this.isHoveringInteractive || this.isPointer) && this.baseOptions.hoverColor) {
          dotColor = this.baseOptions.hoverColor;
        }
        const primaryOpacity = this.baseOptions.opacity;
        const dotSize = (this.isPointer || this.isHoveringInteractive) ? '6px' : '4px';
        
        this.cursorDot.style.cssText = '';
        this.cursorDot.style.position = 'fixed';
        this.cursorDot.style.width = dotSize;
        this.cursorDot.style.height = dotSize;
        this.cursorDot.style.borderRadius = '50%';
        this.cursorDot.style.backgroundColor = dotColor;
        this.cursorDot.style.border = '0';
        this.cursorDot.style.outline = '0';
        this.cursorDot.style.boxShadow = 'none';
        this.cursorDot.style.opacity = String(primaryOpacity);
        this.cursorDot.style.zIndex = '10001';
        this.cursorDot.style.pointerEvents = 'none';
        this.cursorDot.style.margin = '0';
        this.cursorDot.style.padding = '0';
        this.cursorDot.style.display = 'block';
        this.cursorDot.style.transform = 'translate(-50%, -50%)';
        this.cursorDot.style.transition = 'width 0.3s ease, height 0.3s ease, background-color 0.3s ease';
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
      if (this.options.hideDefaultCursor) {
        this.centerDot.style.width = '3px';
        this.centerDot.style.height = '3px';
        this.centerDot.style.borderRadius = '50%';
        this.centerDot.style.backgroundColor = color;
        this.centerDot.style.border = 'none';
        this.centerDot.style.outline = 'none';
        this.centerDot.style.boxShadow = 'none';
        this.centerDot.style.opacity = '1';
        this.centerDot.style.zIndex = '10000';
        this.centerDot.style.pointerEvents = 'none';
        this.centerDot.style.margin = '0';
        this.centerDot.style.padding = '0';
        this.centerDot.style.display = 'block';
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
    if (!this.centerDot || !this.options.hideDefaultCursor) return;

    this.centerDot.style.position = 'fixed';
    this.centerDot.style.left = `${this.centerDotX}px`;
    this.centerDot.style.top = `${this.centerDotY}px`;
    this.centerDot.style.transform = 'translate(-50%, -50%)';
    this.centerDot.style.transition = 'none';
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
    if (!this.isMouseInWindow) {
      return;
    }

    const target = e.target as HTMLElement;
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

    if (this.options.pointer) {
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
   * Removes the cursor element from the DOM
   */
  private removeCursorElement(): void {
    if (this.cursorElement && this.cursorElement.parentNode) {
      this.cursorElement.parentNode.removeChild(this.cursorElement);
      this.cursorElement = null;
    }
    if (this.cursorDot) {
      this.cursorDot = null;
    }
    if (this.centerDot) {
      this.centerDot = null;
    }
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


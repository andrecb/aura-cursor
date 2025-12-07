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
  private animationFrameId: number | null = null;
  private isActive = false;
  private isPointer = false;
  private options: Required<Omit<AuraCursorOptions, 'pointer'>> & { pointer?: AuraCursorPointerOptions };
  private baseOptions: Required<Omit<AuraCursorOptions, 'pointer'>>;
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
    
    this.options = {
      ...this.baseOptions,
      pointer: this.options.pointer,
    };
    
    if (hideDefaultCursorChanged) {
      if (this.options.hideDefaultCursor) {
        this.hideDefaultCursor();
        if (!this.centerDot && this.cursorElement) {
          this.centerDot = document.createElement('div');
          this.centerDot.className = 'aura-cursor-center-dot';
          this.cursorElement.appendChild(this.centerDot);
        }
      } else {
        this.showDefaultCursor();
        if (this.centerDot && this.centerDot.parentNode) {
          this.centerDot.parentNode.removeChild(this.centerDot);
          this.centerDot = null;
        }
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
    
    if (this.options.outlineMode) {
      this.cursorDot = document.createElement('div');
      this.cursorDot.className = 'aura-cursor-dot';
      this.cursorElement.appendChild(this.cursorDot);
    }
    
    if (this.options.hideDefaultCursor) {
      this.centerDot = document.createElement('div');
      this.centerDot.className = 'aura-cursor-center-dot';
      this.cursorElement.appendChild(this.centerDot);
    }
    
    this.applyStyles();
    
    document.body.appendChild(this.cursorElement);
    
    this.currentX = window.innerWidth / 2;
    this.currentY = window.innerHeight / 2;
    this.targetX = this.currentX;
    this.targetY = this.currentY;
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
    
    const color = this.isPointer && this.options.pointer?.color 
      ? this.options.pointer.color 
      : this.baseOptions.color;
    
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

    if (this.options.outlineMode) {
      this.cursorElement.style.backgroundColor = 'transparent';
      this.cursorElement.style.border = `${this.options.outlineWidth}px solid ${color}`;
      this.cursorElement.style.opacity = String(opacity);
      
      if (this.cursorDot) {
        this.cursorDot.style.position = 'absolute';
        this.cursorDot.style.width = '4px';
        this.cursorDot.style.height = '4px';
        this.cursorDot.style.borderRadius = '50%';
        this.cursorDot.style.backgroundColor = color;
        this.cursorDot.style.top = '50%';
        this.cursorDot.style.left = '50%';
        this.cursorDot.style.transform = 'translate(-50%, -50%)';
        this.cursorDot.style.opacity = String(opacity);
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
        this.centerDot.style.opacity = '1';
        this.centerDot.style.zIndex = '10000';
        this.centerDot.style.pointerEvents = 'none';
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
    
    this.cursorElement.style.left = `${this.currentX}px`;
    this.cursorElement.style.top = `${this.currentY}px`;
  }

  /**
   * Updates the center dot position to be in the center of the outer circle
   * The center dot stays in the center of cursorElement (which follows the mouse with interpolation)
   */
  private updateCenterDotPosition(): void {
    if (!this.centerDot || !this.options.hideDefaultCursor) return;

    this.centerDot.style.position = 'absolute';
    this.centerDot.style.top = '50%';
    this.centerDot.style.left = '50%';
    this.centerDot.style.transform = 'translate(-50%, -50%)';
    this.centerDot.style.transition = 'none';
    this.centerDot.style.display = 'block';
  }

  /**
   * Animation loop using requestAnimationFrame
   */
  private animate = (): void => {
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
   * Handles mouse movement
   */
  private handleMouseMove = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    
    if (this.options.interactiveOnly) {
      if (!this.isInteractiveElement(target)) {
        return;
      }
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
  };

  /**
   * Attaches event listeners
   */
  private attachEventListeners(): void {
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  /**
   * Removes event listeners
   */
  private removeEventListeners(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
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

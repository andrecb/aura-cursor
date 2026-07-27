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

type AuraCursorResolvedOptions = Required<
  Omit<
    AuraCursorOptions,
    | 'hoverEffect'
    | 'centerDotColor'
    | 'hoverColor'
    | 'centerDotSize'
    | 'centerDotHoverColor'
  >
> & {
  centerDotColor?: string;
  hoverColor?: string;
  centerDotSize?: number;
  centerDotHoverColor?: string;
  hoverEffect?: AuraCursorHoverEffectOptions;
};

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], [onclick], input[type="range"], input[type="color"], input[type="checkbox"]';
const CURSOR_SELECTOR = '.aura-cursor, .aura-cursor-dot, .aura-cursor-center-dot';
const IDLE_EPSILON_SQ = 0.01;
const FAST_DISTANCE_SQ = 2500;
const CURSOR_TRANSITION =
  'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease, opacity 0.3s ease, border 0.3s ease';

function removeNode(node: Element | null): void {
  node?.parentNode?.removeChild(node);
}

function removeOrphanedCursors(): void {
  document.querySelectorAll(CURSOR_SELECTOR).forEach(removeNode);
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
  private currentScale = 1;
  private animationFrameId: number | null = null;
  private isActive = false;
  private isPointer = false;
  private isHoveringInteractive = false;
  private isOnInteractiveElement = false;
  private isMouseInWindow = true;
  private options: AuraCursorResolvedOptions;
  private baseOptions: Omit<AuraCursorResolvedOptions, 'hoverEffect'>;
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

  private isMobileDevice(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    if (typeof process !== 'undefined' && process.env?.VITEST === 'true') {
      const forceDesktop = (
        window as Window & { __AURA_CURSOR_FORCE_DESKTOP__?: boolean }
      ).__AURA_CURSOR_FORCE_DESKTOP__;
      if (forceDesktop === true) {
        return false;
      }
    }

    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const isMobileUserAgent =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    return hasTouch || (isSmallScreen && isMobileUserAgent);
  }

  public init(): void {
    if (this.isActive || typeof window === 'undefined') {
      return;
    }

    if (this.isMobileDevice()) {
      return;
    }

    this.createCursorElement();
    this.attachEventListeners();
    this.startAnimation();
    this.isActive = true;

    if (this.options.hideDefaultCursor) {
      this.hideDefaultCursor();
    }

    this.setupResizeListener();
  }

  public destroy(): void {
    if (!this.isActive) {
      return;
    }

    this.removeEventListeners();
    this.removeResizeListener();
    this.removeCursorElement();
    this.stopAnimation();

    if (this.options.hideDefaultCursor) {
      this.showDefaultCursor();
    }

    this.isActive = false;
  }

  public updateOptions(options: Partial<AuraCursorOptions>): void {
    if (options.hoverEffect !== undefined) {
      this.options.hoverEffect = options.hoverEffect;
    }

    const hideDefaultCursorChanged =
      options.hideDefaultCursor !== undefined &&
      options.hideDefaultCursor !== this.baseOptions.hideDefaultCursor;
    const outlineModeChanged =
      options.outlineMode !== undefined &&
      options.outlineMode !== this.baseOptions.outlineMode;

    if (options.size !== undefined) this.baseOptions.size = options.size;
    if (options.color !== undefined) this.baseOptions.color = options.color;
    if (options.opacity !== undefined) this.baseOptions.opacity = options.opacity;
    if (options.speed !== undefined) this.baseOptions.speed = options.speed;
    if (options.hideDefaultCursor !== undefined)
      this.baseOptions.hideDefaultCursor = options.hideDefaultCursor;
    if (options.className !== undefined)
      this.baseOptions.className = options.className;
    if (options.interactiveOnly !== undefined)
      this.baseOptions.interactiveOnly = options.interactiveOnly;
    if (options.outlineMode !== undefined)
      this.baseOptions.outlineMode = options.outlineMode;
    if (options.outlineWidth !== undefined)
      this.baseOptions.outlineWidth = options.outlineWidth;
    if (options.centerDotColor !== undefined)
      this.baseOptions.centerDotColor = options.centerDotColor;
    if (options.hoverColor !== undefined)
      this.baseOptions.hoverColor = options.hoverColor;
    if (options.centerDotSize !== undefined)
      this.baseOptions.centerDotSize = options.centerDotSize;
    if (options.centerDotHoverColor !== undefined)
      this.baseOptions.centerDotHoverColor = options.centerDotHoverColor;

    this.options = {
      ...this.baseOptions,
      hoverEffect: this.options.hoverEffect,
    };

    if (!this.isActive) {
      return;
    }

    if (outlineModeChanged) {
      this.removeCursorElement();
      this.createCursorElement();
      return;
    }

    if (hideDefaultCursorChanged) {
      this.syncCenterDotForHideDefaultCursor();
    }

    if (this.cursorElement) {
      if (options.className !== undefined) {
        this.cursorElement.className =
          `aura-cursor ${this.options.className}`.trim();
      }
      this.applyVisualStyles();
    }
  }

  private syncCenterDotForHideDefaultCursor(): void {
    if (this.options.hideDefaultCursor && !this.options.outlineMode) {
      this.hideDefaultCursor();
      this.ensureCenterDot();
    } else {
      this.showDefaultCursor();
      if (!this.options.outlineMode) {
        removeNode(this.centerDot);
        this.centerDot = null;
        removeOrphanedCursors();
      }
    }
  }

  private ensureCenterDot(): void {
    document.querySelectorAll('.aura-cursor-center-dot').forEach((el) => {
      if (el !== this.centerDot) removeNode(el);
    });
    if (!this.centerDot) {
      this.centerDot = document.createElement('div');
      this.centerDot.className = 'aura-cursor-center-dot';
      document.body.appendChild(this.centerDot);
      this.applyCenterDotBaseStyles();
    }
  }

  private ensureCursorDot(): void {
    if (!this.cursorDot) {
      this.cursorDot = document.createElement('div');
      this.cursorDot.className = 'aura-cursor-dot';
      document.body.appendChild(this.cursorDot);
      this.applyCursorDotBaseStyles();
    }
  }

  private createCursorElement(): void {
    removeOrphanedCursors();
    this.cursorElement = null;
    this.cursorDot = null;
    this.centerDot = null;

    this.cursorElement = document.createElement('div');
    this.cursorElement.className =
      `aura-cursor ${this.options.className}`.trim();
    this.applyCursorBaseStyles();
    this.applyVisualStyles();
    document.body.appendChild(this.cursorElement);

    if (this.options.outlineMode) {
      this.ensureCursorDot();
      this.applyVisualStyles();
    } else if (this.options.hideDefaultCursor) {
      this.ensureCenterDot();
      this.applyVisualStyles();
    }

    let initialX = window.innerWidth / 2;
    let initialY = window.innerHeight / 2;

    const lastMouseEvent = (
      document as Document & { __auraCursorLastMouseEvent?: MouseEvent }
    ).__auraCursorLastMouseEvent;
    if (
      lastMouseEvent &&
      lastMouseEvent.clientX !== undefined &&
      lastMouseEvent.clientY !== undefined
    ) {
      initialX = lastMouseEvent.clientX;
      initialY = lastMouseEvent.clientY;
    }

    this.currentX = initialX;
    this.currentY = initialY;
    this.targetX = initialX;
    this.targetY = initialY;
    this.centerDotX = initialX;
    this.centerDotY = initialY;
    this.outlineCircleX = initialX;
    this.outlineCircleY = initialY;

    this.hideCursor();
    this.updateCursorPosition();
    this.updateCenterDotPosition();
    this.updateCursorDotPosition();
  }

  private applyCursorBaseStyles(): void {
    if (!this.cursorElement) return;
    const style = this.cursorElement.style;
    style.position = 'fixed';
    style.left = '0px';
    style.top = '0px';
    style.borderRadius = '50%';
    style.pointerEvents = 'none';
    style.zIndex = '9999';
    style.boxShadow = 'none';
    style.outline = 'none';
    style.margin = '0';
    style.padding = '0';
    style.display = 'block';
    style.willChange = 'transform';
    style.transition = CURSOR_TRANSITION;
  }

  private applyCursorDotBaseStyles(): void {
    if (!this.cursorDot) return;
    const style = this.cursorDot.style;
    style.position = 'fixed';
    style.left = '0px';
    style.top = '0px';
    style.borderRadius = '50%';
    style.border = '0';
    style.outline = '0';
    style.boxShadow = 'none';
    style.opacity = '1';
    style.zIndex = '10001';
    style.pointerEvents = 'none';
    style.margin = '0';
    style.padding = '0';
    style.display = 'block';
    style.willChange = 'transform';
    style.transition = 'background-color 0.3s ease';
  }

  private applyCenterDotBaseStyles(): void {
    if (!this.centerDot) return;
    const style = this.centerDot.style;
    style.position = 'fixed';
    style.left = '0px';
    style.top = '0px';
    style.borderRadius = '50%';
    style.border = 'none';
    style.outline = 'none';
    style.boxShadow = 'none';
    style.opacity = '1';
    style.zIndex = '10000';
    style.pointerEvents = 'none';
    style.margin = '0';
    style.padding = '0';
    style.display = 'block';
    style.willChange = 'transform';
    style.transition = 'background-color 0.3s ease';
  }

  private applyVisualStyles(): void {
    if (!this.cursorElement) return;

    const size = this.baseOptions.size;
    const hovering = this.isHoveringInteractive || this.isPointer;

    let color = this.baseOptions.color;
    if (hovering) {
      if (this.baseOptions.hoverColor) {
        color = this.baseOptions.hoverColor;
      } else if (this.isPointer && this.options.hoverEffect?.color) {
        color = this.options.hoverEffect.color;
      }
    }

    const opacity =
      this.isPointer && this.options.hoverEffect?.opacity !== undefined
        ? this.options.hoverEffect.opacity
        : this.baseOptions.opacity;

    this.currentScale =
      this.isPointer && this.options.hoverEffect?.scale
        ? this.options.hoverEffect.scale
        : 1;

    const displaySize = size * this.currentScale;
    const style = this.cursorElement.style;
    style.width = `${displaySize}px`;
    style.height = `${displaySize}px`;

    if (this.options.outlineMode) {
      style.backgroundColor = 'transparent';
      style.border = `${this.options.outlineWidth}px solid ${color}`;
      style.opacity = String(opacity);

      if (this.cursorDot) {
        const dotColor = hovering
          ? this.baseOptions.centerDotHoverColor ||
            this.baseOptions.centerDotColor ||
            this.baseOptions.hoverColor ||
            this.baseOptions.color
          : this.baseOptions.centerDotColor || this.baseOptions.color;
        const dotSize = `${this.baseOptions.centerDotSize ?? 3}px`;
        this.cursorDot.style.width = dotSize;
        this.cursorDot.style.height = dotSize;
        this.cursorDot.style.backgroundColor = dotColor;
        this.cursorDot.style.display = 'block';
        this.cursorDot.style.opacity = '1';
      }
    } else {
      style.backgroundColor = color;
      style.opacity = String(opacity);
      style.border = 'none';

      if (this.cursorDot) {
        this.cursorDot.style.display = 'none';
      }
    }

    if (this.centerDot) {
      if (this.options.hideDefaultCursor && !this.options.outlineMode) {
        const centerDotSize = this.baseOptions.centerDotSize ?? 3;
        const centerDotColor = hovering
          ? this.baseOptions.centerDotHoverColor ||
            this.baseOptions.centerDotColor ||
            this.baseOptions.color
          : this.baseOptions.centerDotColor || this.baseOptions.color;

        this.centerDot.style.width = `${centerDotSize}px`;
        this.centerDot.style.height = `${centerDotSize}px`;
        this.centerDot.style.backgroundColor = centerDotColor;
        this.centerDot.style.display = 'block';
        this.centerDot.style.opacity = '1';
      } else {
        this.centerDot.style.display = 'none';
      }
    }

    this.updateCursorPosition();
  }

  private updateCursorPosition(): void {
    if (!this.cursorElement) return;

    const x = this.options.outlineMode ? this.outlineCircleX : this.currentX;
    const y = this.options.outlineMode ? this.outlineCircleY : this.currentY;
    this.cursorElement.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  }

  private updateCenterDotPosition(): void {
    if (
      !this.centerDot ||
      !this.options.hideDefaultCursor ||
      this.options.outlineMode
    )
      return;

    this.centerDot.style.transform = `translate3d(${this.centerDotX}px, ${this.centerDotY}px, 0) translate(-50%, -50%)`;
  }

  private updateCursorDotPosition(): void {
    if (!this.cursorDot || !this.options.outlineMode) return;

    this.cursorDot.style.transform = `translate3d(${this.centerDotX}px, ${this.centerDotY}px, 0) translate(-50%, -50%)`;
  }

  private startAnimation(): void {
    if (this.animationFrameId !== null) return;
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private animate = (): void => {
    let settled = false;

    if (this.options.outlineMode) {
      this.centerDotX = this.targetX;
      this.centerDotY = this.targetY;

      const dx = this.targetX - this.outlineCircleX;
      const dy = this.targetY - this.outlineCircleY;
      const distSq = dx * dx + dy * dy;

      if (distSq < IDLE_EPSILON_SQ) {
        this.outlineCircleX = this.targetX;
        this.outlineCircleY = this.targetY;
        settled = true;
      } else {
        const baseSpeed = this.options.speed * 0.5;
        const adaptiveSpeed =
          distSq > FAST_DISTANCE_SQ ? Math.min(baseSpeed * 2, 0.8) : baseSpeed;
        this.outlineCircleX += dx * adaptiveSpeed;
        this.outlineCircleY += dy * adaptiveSpeed;
      }

      this.updateCursorPosition();
      this.updateCursorDotPosition();
    } else {
      const dx = this.targetX - this.currentX;
      const dy = this.targetY - this.currentY;
      const distSq = dx * dx + dy * dy;

      if (distSq < IDLE_EPSILON_SQ) {
        this.currentX = this.targetX;
        this.currentY = this.targetY;
        settled = true;
      } else {
        const adaptiveSpeed =
          distSq > FAST_DISTANCE_SQ
            ? Math.min(this.options.speed * 2, 0.8)
            : this.options.speed;
        this.currentX += dx * adaptiveSpeed;
        this.currentY += dy * adaptiveSpeed;
      }

      this.updateCursorPosition();
    }

    this.updateCenterDotPosition();

    if (settled) {
      this.animationFrameId = null;
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private hasPointerCursor(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      if (!(current instanceof HTMLElement)) {
        break;
      }

      if (this.pointerElementsCache.has(current)) {
        if (this.pointerElementsCache.get(current)) {
          return true;
        }
        current = current.parentElement;
        continue;
      }

      let cursor = window.getComputedStyle(current).cursor;

      if (
        cursor === 'none' &&
        this.options.hideDefaultCursor &&
        this.styleElement?.sheet
      ) {
        const sheet = this.styleElement.sheet;
        sheet.disabled = true;
        cursor = window.getComputedStyle(current).cursor;
        sheet.disabled = false;
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

  private isInteractiveElement(element: HTMLElement): boolean {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    const tag = element.tagName;
    if (tag === 'A' || tag === 'BUTTON') {
      return true;
    }

    if (element.getAttribute('role') === 'button' || element.onclick !== null) {
      return true;
    }

    if (tag === 'INPUT') {
      const type = (element as HTMLInputElement).type;
      if (type === 'range' || type === 'color' || type === 'checkbox') {
        return true;
      }
    }

    if (element.closest(INTERACTIVE_SELECTOR) !== null) {
      return true;
    }

    return this.hasPointerCursor(element);
  }

  private handleMouseLeave = (e: MouseEvent): void => {
    if (!e.relatedTarget || (e.relatedTarget as Node).nodeName === 'HTML') {
      this.isMouseInWindow = false;
      this.hideCursor();
    }
  };

  private handleMouseEnter = (): void => {
    this.isMouseInWindow = true;
    if (this.cursorElement) {
      this.applyVisualStyles();
    }
  };

  private handleWindowBlur = (): void => {
    this.isMouseInWindow = false;
    this.hideCursor();
  };

  private handleWindowFocus = (): void => {
    this.isMouseInWindow = true;
    if (this.cursorElement) {
      this.applyVisualStyles();
    }
  };

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

  private handleMouseMove = (e: MouseEvent): void => {
    (
      document as Document & { __auraCursorLastMouseEvent?: MouseEvent }
    ).__auraCursorLastMouseEvent = e;

    if (!this.isMouseInWindow) {
      return;
    }

    this.targetX = e.clientX;
    this.targetY = e.clientY;

    if (this.options.outlineMode || this.options.hideDefaultCursor) {
      this.centerDotX = e.clientX;
      this.centerDotY = e.clientY;
      if (this.options.outlineMode) {
        this.updateCursorDotPosition();
      }
      if (this.options.hideDefaultCursor) {
        this.updateCenterDotPosition();
      }
    }

    const target = e.target;
    const hasHtmlTarget = !!target && target instanceof HTMLElement;

    if (hasHtmlTarget) {
      const isInteractive = this.isInteractiveElement(target);
      const wasOnInteractive = this.isOnInteractiveElement;
      this.isOnInteractiveElement = isInteractive;

      if (this.options.interactiveOnly) {
        if (!isInteractive) {
          if (wasOnInteractive) {
            this.hideCursor();
          }
          return;
        }
        if (!wasOnInteractive && this.cursorElement) {
          this.applyVisualStyles();
        }
      } else if (this.cursorElement?.style.opacity === '0') {
        this.applyVisualStyles();
      }

      if (
        this.isHoveringInteractive !== isInteractive ||
        this.isPointer !== isInteractive
      ) {
        this.isHoveringInteractive = isInteractive;
        this.isPointer = isInteractive;
        this.applyVisualStyles();
      }
    } else if (
      !this.options.interactiveOnly &&
      this.cursorElement?.style.opacity === '0'
    ) {
      this.applyVisualStyles();
    }

    this.startAnimation();
  };

  private attachEventListeners(): void {
    window.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseleave', this.handleMouseLeave);
    document.addEventListener('mouseenter', this.handleMouseEnter);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
  }

  private removeEventListeners(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    document.removeEventListener('mouseenter', this.handleMouseEnter);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
  }

  private setupResizeListener(): void {
    if (typeof window === 'undefined' || this.resizeHandler) {
      return;
    }

    this.resizeHandler = () => {
      if (this.isMobileDevice()) {
        if (this.isActive) {
          this.removeEventListeners();
          this.removeCursorElement();
          this.stopAnimation();

          if (this.options.hideDefaultCursor) {
            this.showDefaultCursor();
          }

          this.isActive = false;
        }
      } else if (!this.isActive) {
        this.createCursorElement();
        this.attachEventListeners();
        this.startAnimation();
        this.isActive = true;

        if (this.options.hideDefaultCursor) {
          this.hideDefaultCursor();
        }
      }
    };

    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('orientationchange', this.resizeHandler);
  }

  private removeResizeListener(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('orientationchange', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  private removeCursorElement(): void {
    removeNode(this.cursorElement);
    this.cursorElement = null;
    removeNode(this.cursorDot);
    this.cursorDot = null;
    removeNode(this.centerDot);
    this.centerDot = null;
    removeOrphanedCursors();
  }

  private hideDefaultCursor(): void {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'aura-cursor-hide-default';
      this.styleElement.textContent = '* { cursor: none !important; }';
      document.head.appendChild(this.styleElement);
      this.pointerElementsCache = new WeakMap();
    }
  }

  private showDefaultCursor(): void {
    if (this.styleElement?.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
      this.pointerElementsCache = new WeakMap();
    }
  }
}

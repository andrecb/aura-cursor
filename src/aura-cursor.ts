export interface AuraCursorHoverEffectOptions {
  color?: string;
  opacity?: number;
  scale?: number;
}

export interface AuraCursorTrailOptions {
  length?: number;
  fade?: number;
  scale?: number;
}

export interface AuraCursorClickEffectOptions {
  scale?: number;
  duration?: number;
}

export interface AuraCursorMagneticOptions {
  strength?: number;
  padding?: number;
}

export type AuraCursorShape = 'circle' | 'square' | 'rounded';
export type AuraCursorEasing = 'linear' | 'easeOut';

export interface AuraCursorOptions {
  size?: number;
  color?: string;
  opacity?: number;
  speed?: number;
  lag?: number;
  easing?: AuraCursorEasing;
  hideDefaultCursor?: boolean;
  className?: string;
  interactiveOnly?: boolean;
  hoverEffect?: AuraCursorHoverEffectOptions;
  outlineMode?: boolean;
  outlineWidth?: number;
  centerDotColor?: string;
  hoverColor?: string;
  centerDotSize?: number;
  centerDotHoverColor?: string;
  trail?: AuraCursorTrailOptions;
  clickEffect?: boolean | AuraCursorClickEffectOptions;
  mixBlendMode?: string;
  blur?: number;
  zIndex?: number;
  borderRadius?: string | number;
  magnetic?: boolean | AuraCursorMagneticOptions;
  shape?: AuraCursorShape;
  customCursor?: HTMLElement | string;
  interactiveSelector?: string;
  excludeSelector?: string;
  onHoverInteractive?: (el: HTMLElement | null) => void;
  onClick?: (el: HTMLElement | null, event: MouseEvent) => void;
}

type AuraCursorResolvedOptions = Required<
  Omit<
    AuraCursorOptions,
    | 'hoverEffect'
    | 'centerDotColor'
    | 'hoverColor'
    | 'centerDotSize'
    | 'centerDotHoverColor'
    | 'trail'
    | 'clickEffect'
    | 'mixBlendMode'
    | 'blur'
    | 'borderRadius'
    | 'magnetic'
    | 'customCursor'
    | 'interactiveSelector'
    | 'excludeSelector'
    | 'onHoverInteractive'
    | 'onClick'
  >
> & {
  centerDotColor?: string;
  hoverColor?: string;
  centerDotSize?: number;
  centerDotHoverColor?: string;
  hoverEffect?: AuraCursorHoverEffectOptions;
  trail?: AuraCursorTrailOptions;
  clickEffect?: boolean | AuraCursorClickEffectOptions;
  mixBlendMode?: string;
  blur?: number;
  borderRadius?: string | number;
  magnetic?: boolean | AuraCursorMagneticOptions;
  customCursor?: HTMLElement | string;
  interactiveSelector?: string;
  excludeSelector?: string;
  onHoverInteractive?: (el: HTMLElement | null) => void;
  onClick?: (el: HTMLElement | null, event: MouseEvent) => void;
};

const DEFAULT_INTERACTIVE_SELECTOR =
  'a, button, [role="button"], [onclick], input[type="range"], input[type="color"], input[type="checkbox"]';
const CURSOR_SELECTOR =
  '.aura-cursor, .aura-cursor-dot, .aura-cursor-center-dot, .aura-cursor-trail';
const IDLE_EPSILON_SQ = 0.01;
const FAST_DISTANCE_SQ = 2500;
const CURSOR_TRANSITION =
  'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease, opacity 0.3s ease, border 0.3s ease, filter 0.3s ease';

function removeNode(node: Element | null): void {
  node?.parentNode?.removeChild(node);
}

function removeOrphanedCursors(): void {
  document.querySelectorAll(CURSOR_SELECTOR).forEach(removeNode);
}

function resolveBorderRadius(
  shape: AuraCursorShape,
  borderRadius?: string | number
): string {
  if (borderRadius !== undefined) {
    return typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
  }
  if (shape === 'square') return '0';
  if (shape === 'rounded') return '8px';
  return '50%';
}

export class AuraCursor {
  private cursorElement: HTMLDivElement | null = null;
  private cursorDot: HTMLDivElement | null = null;
  private centerDot: HTMLDivElement | null = null;
  private trailElements: HTMLDivElement[] = [];
  private trailPositions: Array<{ x: number; y: number }> = [];
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
  private clickScale = 1;
  private clickTimeout: ReturnType<typeof setTimeout> | null = null;
  private isClicking = false;
  private animationFrameId: number | null = null;
  private isActive = false;
  private isPointer = false;
  private isHoveringInteractive = false;
  private isOnInteractiveElement = false;
  private isMouseInWindow = true;
  private lastHoveredElement: HTMLElement | null = null;
  private options: AuraCursorResolvedOptions;
  private baseOptions: Omit<
    AuraCursorResolvedOptions,
    | 'hoverEffect'
    | 'trail'
    | 'clickEffect'
    | 'magnetic'
    | 'customCursor'
    | 'onHoverInteractive'
    | 'onClick'
  > & {
    trail?: AuraCursorTrailOptions;
    clickEffect?: boolean | AuraCursorClickEffectOptions;
    magnetic?: boolean | AuraCursorMagneticOptions;
    customCursor?: HTMLElement | string;
    onHoverInteractive?: (el: HTMLElement | null) => void;
    onClick?: (el: HTMLElement | null, event: MouseEvent) => void;
  };
  private pointerElementsCache: WeakMap<HTMLElement, boolean> = new WeakMap();
  private resizeHandler: (() => void) | null = null;

  constructor(options: AuraCursorOptions = {}) {
    this.baseOptions = this.resolveBaseOptions(options);
    this.options = {
      ...this.baseOptions,
      hoverEffect: options.hoverEffect,
    };
  }

  private resolveBaseOptions(
    options: AuraCursorOptions
  ): AuraCursor['baseOptions'] {
    return {
      size: options.size ?? 20,
      color: options.color ?? '#000000',
      opacity: options.opacity ?? 0.5,
      speed: options.speed ?? 0.3,
      lag: options.lag ?? 1,
      easing: options.easing ?? 'linear',
      hideDefaultCursor: options.hideDefaultCursor ?? false,
      className: options.className ?? '',
      interactiveOnly: options.interactiveOnly ?? false,
      outlineMode: options.outlineMode ?? false,
      outlineWidth: options.outlineWidth ?? 2,
      centerDotColor: options.centerDotColor,
      hoverColor: options.hoverColor,
      centerDotSize: options.centerDotSize ?? 3,
      centerDotHoverColor: options.centerDotHoverColor,
      mixBlendMode: options.mixBlendMode,
      blur: options.blur,
      zIndex: options.zIndex ?? 9999,
      borderRadius: options.borderRadius,
      shape: options.shape ?? 'circle',
      interactiveSelector: options.interactiveSelector,
      excludeSelector: options.excludeSelector,
      trail: options.trail,
      clickEffect: options.clickEffect,
      magnetic: options.magnetic,
      customCursor: options.customCursor,
      onHoverInteractive: options.onHoverInteractive,
      onClick: options.onClick,
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
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }

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
    const shapeChanged =
      options.shape !== undefined && options.shape !== this.baseOptions.shape;
    const customChanged = options.customCursor !== undefined;
    const trailChanged = options.trail !== undefined;

    const keys = Object.keys(options) as (keyof AuraCursorOptions)[];
    for (const key of keys) {
      if (key === 'hoverEffect') continue;
      if (options[key] !== undefined) {
        (this.baseOptions as Record<string, unknown>)[key] = options[key];
      }
    }

    this.options = {
      ...this.baseOptions,
      hoverEffect: this.options.hoverEffect,
    };

    if (!this.isActive) {
      return;
    }

    if (outlineModeChanged || shapeChanged || customChanged) {
      this.removeCursorElement();
      this.createCursorElement();
      return;
    }

    if (trailChanged) {
      this.setupTrailElements();
    }

    if (hideDefaultCursorChanged) {
      this.syncCenterDotForHideDefaultCursor();
    }

    if (this.cursorElement) {
      if (options.className !== undefined) {
        this.cursorElement.className =
          `aura-cursor ${this.options.className}`.trim();
      }
      this.applyCursorBaseStyles();
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

  private getTrailLength(): number {
    return Math.max(0, this.options.trail?.length ?? 0);
  }

  private setupTrailElements(): void {
    this.clearTrailElements();
    const length = this.getTrailLength();
    if (length === 0 || !this.cursorElement) return;

    const x = this.options.outlineMode ? this.outlineCircleX : this.currentX;
    const y = this.options.outlineMode ? this.outlineCircleY : this.currentY;

    for (let i = 0; i < length; i++) {
      const el = document.createElement('div');
      el.className = 'aura-cursor-trail';
      document.body.appendChild(el);
      this.applyTrailBaseStyles(el);
      this.trailElements.push(el);
      this.trailPositions.push({ x, y });
    }
  }

  private clearTrailElements(): void {
    this.trailElements.forEach(removeNode);
    this.trailElements = [];
    this.trailPositions = [];
  }

  private applyTrailBaseStyles(el: HTMLDivElement): void {
    const style = el.style;
    style.position = 'fixed';
    style.left = '0px';
    style.top = '0px';
    style.pointerEvents = 'none';
    style.zIndex = String((this.baseOptions.zIndex ?? 9999) - 1);
    style.margin = '0';
    style.padding = '0';
    style.display = 'block';
    style.willChange = 'transform, opacity';
    style.borderRadius = resolveBorderRadius(
      this.baseOptions.shape,
      this.baseOptions.borderRadius
    );
  }

  private createCursorElement(): void {
    removeOrphanedCursors();
    this.cursorElement = null;
    this.cursorDot = null;
    this.centerDot = null;
    this.trailElements = [];
    this.trailPositions = [];

    this.cursorElement = document.createElement('div');
    this.cursorElement.className =
      `aura-cursor ${this.options.className}`.trim();
    this.applyCustomCursorContent();
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

    this.setupTrailElements();

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

  private applyCustomCursorContent(): void {
    if (!this.cursorElement) return;
    const custom = this.baseOptions.customCursor;
    this.cursorElement.innerHTML = '';
    if (!custom) return;

    if (typeof custom === 'string') {
      this.cursorElement.innerHTML = custom;
    } else if (custom instanceof HTMLElement) {
      this.cursorElement.appendChild(custom.cloneNode(true));
    }
  }

  private applyCursorBaseStyles(): void {
    if (!this.cursorElement) return;
    const style = this.cursorElement.style;
    style.position = 'fixed';
    style.left = '0px';
    style.top = '0px';
    style.borderRadius = resolveBorderRadius(
      this.baseOptions.shape,
      this.baseOptions.borderRadius
    );
    style.pointerEvents = 'none';
    style.zIndex = String(this.baseOptions.zIndex ?? 9999);
    style.boxShadow = 'none';
    style.outline = 'none';
    style.margin = '0';
    style.padding = '0';
    style.display = 'block';
    style.willChange = 'transform';
    style.transition = CURSOR_TRANSITION;
    style.mixBlendMode = this.baseOptions.mixBlendMode || 'normal';
    style.filter =
      this.baseOptions.blur && this.baseOptions.blur > 0
        ? `blur(${this.baseOptions.blur}px)`
        : 'none';
  }

  private applyCursorDotBaseStyles(): void {
    if (!this.cursorDot) return;
    const style = this.cursorDot.style;
    const z = (this.baseOptions.zIndex ?? 9999) + 2;
    style.position = 'fixed';
    style.left = '0px';
    style.top = '0px';
    style.borderRadius = '50%';
    style.border = '0';
    style.outline = '0';
    style.boxShadow = 'none';
    style.opacity = '1';
    style.zIndex = String(z);
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
    const z = (this.baseOptions.zIndex ?? 9999) + 1;
    style.position = 'fixed';
    style.left = '0px';
    style.top = '0px';
    style.borderRadius = '50%';
    style.border = 'none';
    style.outline = 'none';
    style.boxShadow = 'none';
    style.opacity = '1';
    style.zIndex = String(z);
    style.pointerEvents = 'none';
    style.margin = '0';
    style.padding = '0';
    style.display = 'block';
    style.willChange = 'transform';
    style.transition = 'background-color 0.3s ease';
  }

  private getEffectiveScale(): number {
    return this.currentScale * this.clickScale;
  }

  private applyVisualStyles(): void {
    if (!this.cursorElement) return;

    const size = this.baseOptions.size;
    const hovering = this.isHoveringInteractive || this.isPointer;
    const hasCustom = !!this.baseOptions.customCursor;

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

    const displaySize = size * this.getEffectiveScale();
    const style = this.cursorElement.style;
    style.width = `${displaySize}px`;
    style.height = `${displaySize}px`;
    style.borderRadius = resolveBorderRadius(
      this.baseOptions.shape,
      this.baseOptions.borderRadius
    );
    style.mixBlendMode = this.baseOptions.mixBlendMode || 'normal';
    style.filter =
      this.baseOptions.blur && this.baseOptions.blur > 0
        ? `blur(${this.baseOptions.blur}px)`
        : 'none';

    if (hasCustom) {
      style.backgroundColor = 'transparent';
      style.border = 'none';
      style.opacity = String(opacity);
    } else if (this.options.outlineMode) {
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
    this.updateTrailStyles();
  }

  private updateTrailStyles(): void {
    if (this.trailElements.length === 0) return;

    const size = this.baseOptions.size;
    const fade = this.options.trail?.fade ?? 0.6;
    const trailScale = this.options.trail?.scale ?? 0.95;
    const hovering = this.isHoveringInteractive || this.isPointer;
    let color = this.baseOptions.color;
    if (hovering) {
      color =
        this.baseOptions.hoverColor ||
        this.options.hoverEffect?.color ||
        this.baseOptions.color;
    }
    const baseOpacity = this.baseOptions.opacity;

    this.trailElements.forEach((el, i) => {
      const t = (i + 1) / (this.trailElements.length + 1);
      const scale = Math.pow(trailScale, i + 1) * this.getEffectiveScale();
      const displaySize = size * scale;
      el.style.width = `${displaySize}px`;
      el.style.height = `${displaySize}px`;
      el.style.backgroundColor = this.options.outlineMode
        ? 'transparent'
        : color;
      el.style.border = this.options.outlineMode
        ? `${this.options.outlineWidth}px solid ${color}`
        : 'none';
      el.style.opacity = String(baseOpacity * fade * (1 - t));
      el.style.borderRadius = resolveBorderRadius(
        this.baseOptions.shape,
        this.baseOptions.borderRadius
      );
      el.style.mixBlendMode = this.baseOptions.mixBlendMode || 'normal';
    });
  }

  private updateCursorPosition(): void {
    if (!this.cursorElement) return;

    const x = this.options.outlineMode ? this.outlineCircleX : this.currentX;
    const y = this.options.outlineMode ? this.outlineCircleY : this.currentY;
    this.cursorElement.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  }

  private updateTrailPositions(): void {
    if (this.trailElements.length === 0) return;

    const x = this.options.outlineMode ? this.outlineCircleX : this.currentX;
    const y = this.options.outlineMode ? this.outlineCircleY : this.currentY;

    for (let i = this.trailPositions.length - 1; i > 0; i--) {
      this.trailPositions[i] = { ...this.trailPositions[i - 1] };
    }
    if (this.trailPositions.length > 0) {
      this.trailPositions[0] = { x, y };
    }

    this.trailElements.forEach((el, i) => {
      const pos = this.trailPositions[i];
      if (!pos) return;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
    });
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

  private getLerpFactor(distSq: number, baseSpeed: number): number {
    const lag = Math.max(0.05, this.options.lag || 1);
    let speed = baseSpeed / lag;
    if (distSq > FAST_DISTANCE_SQ) {
      speed = Math.min(speed * 2, 0.8);
    }
    if (this.options.easing === 'easeOut') {
      const t = Math.min(1, Math.sqrt(distSq) / 200);
      speed = speed * (0.35 + 0.65 * t);
    }
    return Math.min(Math.max(speed, 0.01), 1);
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
        const factor = this.getLerpFactor(distSq, this.options.speed * 0.5);
        this.outlineCircleX += dx * factor;
        this.outlineCircleY += dy * factor;
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
        const factor = this.getLerpFactor(distSq, this.options.speed);
        this.currentX += dx * factor;
        this.currentY += dy * factor;
      }

      this.updateCursorPosition();
    }

    this.updateCenterDotPosition();
    this.updateTrailPositions();

    if (settled && this.trailElements.length === 0 && !this.isClicking) {
      this.animationFrameId = null;
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private getMagneticConfig(): AuraCursorMagneticOptions | null {
    const magnetic = this.options.magnetic;
    if (!magnetic) return null;
    if (magnetic === true) return { strength: 0.35, padding: 40 };
    return {
      strength: magnetic.strength ?? 0.35,
      padding: magnetic.padding ?? 40,
    };
  }

  private applyMagnetic(
    clientX: number,
    clientY: number,
    element: HTMLElement
  ): { x: number; y: number } {
    const config = this.getMagneticConfig();
    if (!config) return { x: clientX, y: clientY };

    const rect = element.getBoundingClientRect();
    const padding = config.padding ?? 40;
    const expanded = {
      left: rect.left - padding,
      right: rect.right + padding,
      top: rect.top - padding,
      bottom: rect.bottom + padding,
    };

    if (
      clientX < expanded.left ||
      clientX > expanded.right ||
      clientY < expanded.top ||
      clientY > expanded.bottom
    ) {
      return { x: clientX, y: clientY };
    }

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const strength = Math.min(Math.max(config.strength ?? 0.35, 0), 1);
    return {
      x: clientX + (cx - clientX) * strength,
      y: clientY + (cy - clientY) * strength,
    };
  }

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

  private isExcluded(element: HTMLElement): boolean {
    const exclude = this.options.excludeSelector;
    if (!exclude) return false;
    try {
      return element.matches(exclude) || element.closest(exclude) !== null;
    } catch {
      return false;
    }
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    if (this.isExcluded(element)) {
      return false;
    }

    const customSelector = this.options.interactiveSelector;
    if (customSelector) {
      try {
        if (
          element.matches(customSelector) ||
          element.closest(customSelector) !== null
        ) {
          return true;
        }
      } catch {
        // invalid selector — fall through to defaults
      }
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

    if (element.closest(DEFAULT_INTERACTIVE_SELECTOR) !== null) {
      return true;
    }

    return this.hasPointerCursor(element);
  }

  private getClickEffect(): AuraCursorClickEffectOptions | null {
    const effect = this.options.clickEffect;
    if (!effect) return null;
    if (effect === true) return { scale: 0.75, duration: 150 };
    return {
      scale: effect.scale ?? 0.75,
      duration: effect.duration ?? 150,
    };
  }

  private handleMouseDown = (e: MouseEvent): void => {
    const effect = this.getClickEffect();
    const target =
      e.target instanceof HTMLElement ? e.target : this.lastHoveredElement;

    if (this.options.onClick) {
      this.options.onClick(target, e);
    }

    if (!effect) return;

    this.isClicking = true;
    this.clickScale = effect.scale ?? 0.75;
    this.applyVisualStyles();
    this.startAnimation();

    if (this.clickTimeout) clearTimeout(this.clickTimeout);
  };

  private handleMouseUp = (): void => {
    const effect = this.getClickEffect();
    if (!effect) return;

    const duration = effect.duration ?? 150;
    if (this.clickTimeout) clearTimeout(this.clickTimeout);
    this.clickTimeout = setTimeout(() => {
      this.clickScale = 1;
      this.isClicking = false;
      this.applyVisualStyles();
      this.clickTimeout = null;
    }, duration);
  };

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
    this.trailElements.forEach((el) => {
      el.style.opacity = '0';
    });
  }

  private notifyHoverChange(element: HTMLElement | null): void {
    if (this.lastHoveredElement === element) return;
    this.lastHoveredElement = element;
    this.options.onHoverInteractive?.(element);
  }

  private handleMouseMove = (e: MouseEvent): void => {
    (
      document as Document & { __auraCursorLastMouseEvent?: MouseEvent }
    ).__auraCursorLastMouseEvent = e;

    if (!this.isMouseInWindow) {
      return;
    }

    let nextX = e.clientX;
    let nextY = e.clientY;

    const target = e.target;
    const hasHtmlTarget = !!target && target instanceof HTMLElement;

    if (hasHtmlTarget) {
      const isInteractive = this.isInteractiveElement(target);
      const wasOnInteractive = this.isOnInteractiveElement;
      this.isOnInteractiveElement = isInteractive;

      if (isInteractive && this.getMagneticConfig()) {
        const snapped = this.applyMagnetic(e.clientX, e.clientY, target);
        nextX = snapped.x;
        nextY = snapped.y;
      }

      this.targetX = nextX;
      this.targetY = nextY;

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

      if (this.options.interactiveOnly) {
        if (!isInteractive) {
          if (wasOnInteractive) {
            this.hideCursor();
          }
          this.notifyHoverChange(null);
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

      this.notifyHoverChange(isInteractive ? target : null);
    } else {
      this.targetX = nextX;
      this.targetY = nextY;

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

      if (
        !this.options.interactiveOnly &&
        this.cursorElement?.style.opacity === '0'
      ) {
        this.applyVisualStyles();
      }
      this.notifyHoverChange(null);
    }

    this.startAnimation();
  };

  private attachEventListeners(): void {
    window.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseleave', this.handleMouseLeave);
    document.addEventListener('mouseenter', this.handleMouseEnter);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  private removeEventListeners(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    document.removeEventListener('mouseenter', this.handleMouseEnter);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
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
    this.clearTrailElements();
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

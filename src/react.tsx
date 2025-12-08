import { useEffect, useRef, useMemo } from 'react';
import { AuraCursor as AuraCursorClass, AuraCursorOptions } from './aura-cursor';

/**
 * React hook for AuraCursor
 * @param options - AuraCursor configuration options
 * @returns Object with cursor instance and control methods
 * 
 * @example
 * ```tsx
 * import { useAuraCursor } from 'aura-cursor';
 * 
 * function App() {
 *   const { cursor } = useAuraCursor({
 *     size: 20,
 *     color: '#000000',
 *     opacity: 0.5
 *   });
 * 
 *   return <div>Your app</div>;
 * }
 * ```
 */
export function useAuraCursor(options?: AuraCursorOptions) {
  const cursorRef = useRef<AuraCursorClass | null>(null);
  const optionsRef = useRef<AuraCursorOptions | undefined>(options);

  // Memoize options to avoid unnecessary re-renders
  const memoizedOptions = useMemo(() => options, [
    options?.size,
    options?.color,
    options?.opacity,
    options?.speed,
    options?.hideDefaultCursor,
    options?.className,
    options?.interactiveOnly,
    options?.outlineMode,
    options?.outlineWidth,
    options?.cursorDotColor,
    options?.hoverColor,
    options?.pointer?.size,
    options?.pointer?.color,
    options?.pointer?.opacity,
    options?.pointer?.scale,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Create cursor instance with initial options
    cursorRef.current = new AuraCursorClass(memoizedOptions);
    cursorRef.current.init();
    optionsRef.current = memoizedOptions;

    return () => {
      if (cursorRef.current) {
        cursorRef.current.destroy();
        cursorRef.current = null;
      }
    };
  }, []); // Only create once on mount

  // Update options when they change
  useEffect(() => {
    if (cursorRef.current && memoizedOptions !== undefined) {
      // Only update if options actually changed
      if (optionsRef.current !== memoizedOptions) {
        cursorRef.current.updateOptions(memoizedOptions);
        optionsRef.current = memoizedOptions;
      }
    }
  }, [memoizedOptions]);

  return {
    cursor: cursorRef.current,
    updateOptions: (newOptions: Partial<AuraCursorOptions>) => {
      if (cursorRef.current) {
        cursorRef.current.updateOptions(newOptions);
        optionsRef.current = { ...optionsRef.current, ...newOptions };
      }
    },
    destroy: () => {
      if (cursorRef.current) {
        cursorRef.current.destroy();
        cursorRef.current = null;
      }
    },
  };
}

/**
 * React component for AuraCursor
 */
export interface AuraCursorProps extends AuraCursorOptions {
  /**
   * Whether to enable the cursor
   * @default true
   */
  enabled?: boolean;
}

/**
 * AuraCursor React component
 * 
 * @example
 * ```tsx
 * import { AuraCursor } from 'aura-cursor';
 * 
 * function App() {
 *   return (
 *     <>
 *       <AuraCursor
 *         size={20}
 *         color="#000000"
 *         opacity={0.5}
 *         speed={0.3}
 *       />
 *       <div>Your app content</div>
 *     </>
 *   );
 * }
 * ```
 */
export function AuraCursor({ enabled = true, ...options }: AuraCursorProps): null {
  const cursorRef = useRef<AuraCursorClass | null>(null);
  const isInitializedRef = useRef(false);

  // Memoize options
  const memoizedOptions = useMemo(() => options, [
    options.size,
    options.color,
    options.opacity,
    options.speed,
    options.hideDefaultCursor,
    options.className,
    options.interactiveOnly,
    options.outlineMode,
    options.outlineWidth,
    options.cursorDotColor,
    options.hoverColor,
    options.pointer?.size,
    options.pointer?.color,
    options.pointer?.opacity,
    options.pointer?.scale,
  ]);

  // Initialize or destroy cursor based on enabled state
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (enabled && !isInitializedRef.current) {
      // Create and initialize cursor
      cursorRef.current = new AuraCursorClass(memoizedOptions);
      cursorRef.current.init();
      isInitializedRef.current = true;
    } else if (!enabled && isInitializedRef.current && cursorRef.current) {
      // Destroy cursor when disabled
      cursorRef.current.destroy();
      cursorRef.current = null;
      isInitializedRef.current = false;
    }

    return () => {
      if (cursorRef.current) {
        cursorRef.current.destroy();
        cursorRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [enabled, memoizedOptions]);

  // Update options when they change (only if enabled and initialized)
  useEffect(() => {
    if (enabled && cursorRef.current && isInitializedRef.current) {
      cursorRef.current.updateOptions(memoizedOptions);
    }
  }, [enabled, memoizedOptions]);

  return null;
}


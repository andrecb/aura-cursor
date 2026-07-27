import { useEffect, useRef, useMemo } from 'react';
import { AuraCursor as AuraCursorClass, AuraCursorOptions } from './aura-cursor';

export function useAuraCursor(options?: AuraCursorOptions) {
  const cursorRef = useRef<AuraCursorClass | null>(null);
  const optionsRef = useRef<AuraCursorOptions | undefined>(options);

  const memoizedOptions = useMemo(
    () => options,
    [
      options?.size,
      options?.color,
      options?.opacity,
      options?.speed,
      options?.lag,
      options?.easing,
      options?.hideDefaultCursor,
      options?.className,
      options?.interactiveOnly,
      options?.outlineMode,
      options?.outlineWidth,
      options?.centerDotColor,
      options?.hoverColor,
      options?.centerDotSize,
      options?.centerDotHoverColor,
      options?.hoverEffect?.color,
      options?.hoverEffect?.opacity,
      options?.hoverEffect?.scale,
      options?.trail?.length,
      options?.trail?.fade,
      options?.trail?.scale,
      options?.clickEffect,
      options?.mixBlendMode,
      options?.blur,
      options?.zIndex,
      options?.borderRadius,
      options?.magnetic,
      options?.shape,
      options?.customCursor,
      options?.interactiveSelector,
      options?.excludeSelector,
      options?.onHoverInteractive,
      options?.onClick,
    ]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    cursorRef.current = new AuraCursorClass(memoizedOptions);
    cursorRef.current.init();
    optionsRef.current = memoizedOptions;

    return () => {
      if (cursorRef.current) {
        cursorRef.current.destroy();
        cursorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (cursorRef.current && memoizedOptions !== undefined) {
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

export interface AuraCursorProps extends AuraCursorOptions {
  enabled?: boolean;
}

export function AuraCursor({ enabled = true, ...options }: AuraCursorProps): null {
  const cursorRef = useRef<AuraCursorClass | null>(null);
  const isInitializedRef = useRef(false);

  const memoizedOptions = useMemo(
    () => options,
    [
      options.size,
      options.color,
      options.opacity,
      options.speed,
      options.lag,
      options.easing,
      options.hideDefaultCursor,
      options.className,
      options.interactiveOnly,
      options.outlineMode,
      options.outlineWidth,
      options.centerDotColor,
      options.hoverColor,
      options.centerDotSize,
      options.centerDotHoverColor,
      options.hoverEffect?.color,
      options.hoverEffect?.opacity,
      options.hoverEffect?.scale,
      options.trail?.length,
      options.trail?.fade,
      options.trail?.scale,
      options.clickEffect,
      options.mixBlendMode,
      options.blur,
      options.zIndex,
      options.borderRadius,
      options.magnetic,
      options.shape,
      options.customCursor,
      options.interactiveSelector,
      options.excludeSelector,
      options.onHoverInteractive,
      options.onClick,
    ]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (enabled && !isInitializedRef.current) {
      cursorRef.current = new AuraCursorClass(memoizedOptions);
      cursorRef.current.init();
      isInitializedRef.current = true;
    } else if (!enabled && isInitializedRef.current && cursorRef.current) {
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

  useEffect(() => {
    if (enabled && cursorRef.current && isInitializedRef.current) {
      cursorRef.current.updateOptions(memoizedOptions);
    }
  }, [enabled, memoizedOptions]);

  return null;
}

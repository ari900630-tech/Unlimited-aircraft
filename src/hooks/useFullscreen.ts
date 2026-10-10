import { useState, useEffect, useCallback } from 'react';

// Vendor-prefixed fullscreen document type
interface VendorDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface VendorElement extends HTMLElement {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
  mozRequestFullScreen?: (options?: FullscreenOptions) => Promise<void>;
  msRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    const doc = document as VendorDocument;
    return !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  });

  const checkIsFullscreen = useCallback((): boolean => {
    if (typeof document === 'undefined') return false;
    const doc = document as VendorDocument;
    return !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  }, []);

  const toggleFullscreen = useCallback(async (): Promise<boolean> => {
    if (typeof document === 'undefined') return false;
    const doc = document as VendorDocument;
    const docEl = document.documentElement as VendorElement;

    const currentlyFull = checkIsFullscreen();

    try {
      if (!currentlyFull) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen({ navigationUI: 'hide' }).catch(() => {
            return docEl.requestFullscreen();
          });
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
        setIsFullscreen(true);
        return true;
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
        setIsFullscreen(false);
        return false;
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
      return false;
    }
  }, [checkIsFullscreen]);

  // Sync state with standard fullscreen events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(checkIsFullscreen());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [checkIsFullscreen]);

  // Double tap and double click global detection (consecutive taps anywhere on the screen)
  useEffect(() => {
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    const handlePointerUp = (e: PointerEvent | TouchEvent) => {
      // Determine client coordinates
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // Check if target should be ignored (e.g. fire weapon button or virtual joystick)
      const target = e.target as HTMLElement | null;
      if (target) {
        if (target.closest('[data-no-fullscreen="true"]')) {
          return;
        }
      }

      const now = Date.now();
      const timeDiff = now - lastTapTime;
      const dist = Math.hypot(clientX - lastTapX, clientY - lastTapY);

      if (timeDiff > 0 && timeDiff < 380 && dist < 50) {
        // Double tap confirmed - toggle fullscreen!
        toggleFullscreen();
        lastTapTime = 0; // reset
      } else {
        lastTapTime = now;
        lastTapX = clientX;
        lastTapY = clientY;
      }
    };

    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-no-fullscreen="true"]')) {
        return;
      }
      toggleFullscreen();
    };

    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('dblclick', handleDblClick);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('dblclick', handleDblClick);
    };
  }, [toggleFullscreen]);

  return {
    isFullscreen,
    toggleFullscreen,
  };
}

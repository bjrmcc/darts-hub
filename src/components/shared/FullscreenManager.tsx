import { useEffect, useState } from 'react';

const DISMISS_KEY = 'dh_ios_prompt_dismissed';

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isInStandalone() {
  return (navigator as { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}

function canRequestFullscreen() {
  return !isIOS() && !!document.documentElement.requestFullscreen;
}

export default function FullscreenManager() {
  const [showIosPrompt, setShowIosPrompt] = useState(
    () => isIOS() && !isInStandalone() && !localStorage.getItem(DISMISS_KEY)
  );

  useEffect(() => {
    // iOS handled by initial state above; nothing async needed
    if (isIOS()) return;

    // Android/Chrome: request fullscreen on first user interaction
    if (!canRequestFullscreen()) return;
    if (isInStandalone()) return;

    function handleFirstTouch() {
      document.documentElement.requestFullscreen?.().catch(() => {});
      document.removeEventListener('touchstart', handleFirstTouch);
      document.removeEventListener('click', handleFirstTouch);
    }

    document.addEventListener('touchstart', handleFirstTouch, { once: true });
    document.addEventListener('click', handleFirstTouch, { once: true });
    return () => {
      document.removeEventListener('touchstart', handleFirstTouch);
      document.removeEventListener('click', handleFirstTouch);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setShowIosPrompt(false);
  }

  if (!showIosPrompt) return null;

  return (
    <div className="fs-prompt">
      <span className="fs-prompt-text">
        Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong> for fullscreen
      </span>
      <button className="fs-prompt-close" onClick={dismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}

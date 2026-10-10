import React, { useState, useEffect } from 'react';

interface GameSplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export function GameSplashScreen({ onFinish, durationMs = 4500 }: GameSplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Fade out 600ms before duration ends so the transition into entry screen is silky smooth
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, Math.max(durationMs - 600, 1000));

    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      onFinish();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      onClick={() => {
        // Allow tap/click to skip smoothly if user chooses
        setIsFadingOut(true);
        setTimeout(() => {
          setIsVisible(false);
          onFinish();
        }, 300);
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden bg-[#0A0D14] h-[100dvh] w-full transition-opacity duration-600 ease-in-out cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 
        Full Screen Cover container:
        Matches 100dvh and 100vw while locking relative image coordinates (896x1200)
        so the spinning circle is positioned precisely on top of the loading section.
      */}
      <div className="relative min-w-full min-h-full aspect-[896/1200] flex items-center justify-center pointer-events-none">
        {/* Exact background with Wings of Israel emblem and LOADING... text */}
        <img
          src={`${import.meta.env.BASE_URL}src/assets/images/wings_splash_bg.jpg`}
          alt="Wings of Israel Splash"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />

        {/* 
          Active Spinning Loading Circle:
          Positioned precisely at the original circle's coordinate (X: 50%, Y: 80.1%).
          Strictly circular with no square bounding box or outline.
        */}
        <div
          className="absolute pointer-events-none flex items-center justify-center rounded-full overflow-visible border-0 outline-none"
          style={{
            top: '80.1%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '15.6%',
            aspectRatio: '1/1',
          }}
        >
          {/* Subtle soft circular aura directly underneath the ring */}
          <div className="absolute w-[80%] h-[80%] rounded-full bg-cyan-400/15 blur-sm pointer-events-none border-0" />

          {/* Authentic circular metallic spinner ring rotating smoothly at 60fps */}
          <img
            src={`${import.meta.env.BASE_URL}src/assets/images/wings_spinner_ring.png`}
            alt=""
            className="w-full h-full object-contain animate-spin-circle select-none pointer-events-none rounded-full border-0 outline-none"
            style={{
              animationDuration: '1.2s',
            }}
          />
        </div>
      </div>
    </div>
  );
}

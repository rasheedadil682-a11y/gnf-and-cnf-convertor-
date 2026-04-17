import { useState, useCallback, useRef, useEffect } from 'react';

export function useStepNavigation(steps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2000);
  const timerRef = useRef(null);
  const totalSteps = steps.length;

  const goToStep = useCallback((idx) => { setCurrentStep(Math.max(0, Math.min(idx, totalSteps - 1))); }, [totalSteps]);
  const nextStep = useCallback(() => { setCurrentStep(prev => { if (prev >= totalSteps - 1) { setIsPlaying(false); return prev; } return prev + 1; }); }, [totalSteps]);
  const prevStep = useCallback(() => { setCurrentStep(prev => Math.max(0, prev - 1)); }, []);
  const firstStep = useCallback(() => { setCurrentStep(0); setIsPlaying(false); }, []);
  const lastStep = useCallback(() => { setCurrentStep(totalSteps - 1); setIsPlaying(false); }, [totalSteps]);
  const togglePlay = useCallback(() => { setIsPlaying(prev => !prev); }, []);

  useEffect(() => {
    if (isPlaying) { timerRef.current = setInterval(() => { setCurrentStep(prev => { if (prev >= totalSteps - 1) { setIsPlaying(false); return prev; } return prev + 1; }); }, speed); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, speed, totalSteps]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      switch (e.key) {
        case 'ArrowRight': case 'n': e.preventDefault(); nextStep(); break;
        case 'ArrowLeft': case 'p': e.preventDefault(); prevStep(); break;
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'Home': e.preventDefault(); firstStep(); break;
        case 'End': e.preventDefault(); lastStep(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextStep, prevStep, togglePlay, firstStep, lastStep]);

  useEffect(() => { setCurrentStep(0); setIsPlaying(false); }, [steps]);

  return { currentStep, totalSteps, goToStep, nextStep, prevStep, firstStep, lastStep, isPlaying, togglePlay, speed, setSpeed, step: steps[currentStep] || null, isFirst: currentStep === 0, isLast: currentStep === totalSteps - 1 };
}

import { useNavigate } from 'react-router-dom';
import type { NavigateOptions } from 'react-router-dom';
import { useTransitionStore, TRANSITION_DELAYS, type TransitionVariant } from '../store/transitionStore';

export function useGoto() {
  const navigate = useNavigate();
  const setVariant = useTransitionStore((s) => s.setVariant);

  return function goto(
    path: string,
    opts?: NavigateOptions,
    variant: TransitionVariant = 'quick',
  ) {
    setVariant(variant);
    setTimeout(() => {
      navigate(path, opts);
      setVariant(null);
    }, TRANSITION_DELAYS[variant]);
  };
}

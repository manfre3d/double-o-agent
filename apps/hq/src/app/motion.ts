/**
 * True only when we can confirm motion is welcome: matchMedia exists (it
 * doesn't in unit tests) and the user has not asked for reduced motion.
 */
export function motionOk(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

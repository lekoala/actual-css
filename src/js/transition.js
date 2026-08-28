/*
 * CSS transition lifecycle.
 *
 * getAnimations() exposes both CSS transitions and keyframe animations.
 * Cleanup that belongs to a state transition must not wait for arbitrary
 * author animations, which may be infinite. CSSTransition instances expose
 * transitionProperty; using that structural contract avoids a global check
 * and keeps component JavaScript independent from the properties CSS owns.
 */

export function waitForTransitions(...elements) {
  const transitions = elements
    .filter(Boolean)
    .flatMap((element) =>
      typeof element.getAnimations === "function" ? element.getAnimations({ subtree: true }) : [],
    )
    .filter((animation) => typeof animation.transitionProperty === "string");

  return Promise.allSettled(transitions.map((transition) => transition.finished));
}

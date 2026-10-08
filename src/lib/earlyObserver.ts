import { revealMode, type RevealMode } from '@/lib/landingPresentation';

type Callback = (mode: RevealMode) => void;
const targets = new Map<HTMLElement, Callback>();
let observer: IntersectionObserver | undefined;
let frame = 0;

function check(node: HTMLElement) {
  const callback = targets.get(node);
  if (!callback) return;
  const rect = node.getBoundingClientRect();
  if (!rect.width && !rect.height) return;
  const mode = revealMode(rect.top, rect.bottom, innerHeight, 0);
  if (mode === 'wait') return;
  targets.delete(node); observer?.unobserve(node);
  node.dataset.revealMode = mode; callback(mode);
}
function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(() => { frame = 0; targets.forEach((_, node) => check(node)); });
}
function rebuild() {
  observer?.disconnect();
  observer = new IntersectionObserver(entries => entries.forEach(entry => check(entry.target as HTMLElement)), { rootMargin: `0px 0px ${Math.round(innerHeight * .2)}px 0px`, threshold: 0 });
  targets.forEach((_, node) => observer?.observe(node)); schedule();
}
/** One viewport observer and passive scroll scheduler for all editorial reveals. */
export function observeEarly(node: HTMLElement, callback: Callback) {
  if (!observer) {
    rebuild();
    addEventListener('resize', rebuild);
    addEventListener('scroll', schedule, { passive: true });
  }
  targets.set(node, callback); observer?.observe(node); schedule();
  return () => { targets.delete(node); observer?.unobserve(node); };
}
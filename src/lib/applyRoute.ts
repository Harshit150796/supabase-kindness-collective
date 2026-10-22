// One loader for the recipient application so links can start its download before the click.
let pending: Promise<unknown> | null = null;
export const loadApplyRecipient = () => import("../pages/ApplyRecipient");
export function prefetchApply() {
  if (!pending) pending = loadApplyRecipient().catch(() => { pending = null; });
  return pending;
}

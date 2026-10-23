/** A readiness bridge only: it never gates React or WebGL mounting. */
export function announceTreeReady() {
  window.__cdTreeReady = true;
  window.dispatchEvent(new Event('cd:tree-ready'));
}
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

if (document.documentElement.classList.contains('cd-intro') && window.__cdWebGL) void import('@/components/landing/Tree3DScene');
const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
createRoot(root).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

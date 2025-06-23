import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Tratamento global de erros para evitar unhandled rejections
window.addEventListener('unhandledrejection', (event) => {
  // Log do erro para debug, mas previne que apareça no console do usuário
  console.debug('Unhandled promise rejection handled:', event.reason);
  event.preventDefault();
});

// Tratamento global de erros JavaScript
window.addEventListener('error', (event) => {
  console.debug('Global error handled:', event.error);
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);

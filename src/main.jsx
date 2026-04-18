import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Portal from "./Portal.jsx";

const isPortal = window.location.pathname.startsWith("/portal");

if (isPortal) {
  // Student portal — mount on a separate root so styles don't bleed
  const el = document.getElementById("root");
  el.id = "portal-root";
  createRoot(el).render(<StrictMode><Portal /></StrictMode>);
} else {
  createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);
}

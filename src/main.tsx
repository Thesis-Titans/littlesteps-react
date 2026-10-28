import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./features/auth";
import "./styles/main.css";

const root = createRoot(document.getElementById("root")!);

// Component showcase for development only; the DEV check removes it from production builds.
if (import.meta.env.DEV && location.pathname === "/dev/components") {
  void import("./dev/ComponentShowcase").then(({ ComponentShowcase }) =>
    root.render(<StrictMode><ComponentShowcase /></StrictMode>)
  );
} else {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

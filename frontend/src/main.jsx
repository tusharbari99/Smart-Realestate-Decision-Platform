import { installPhoneInputGuard } from "./utils/phoneInputGuard";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import SiteUtilities from "./components/SiteUtilities";
import PersonalizationTracker from "./components/PersonalizationTracker";
import { CompareProvider } from "./context/CompareContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import "./index.css";
import BuyerAlertBootstrap from "./components/BuyerAlertBootstrap";
import BuyerSearchIntentTracker from "./components/BuyerSearchIntentTracker";
import BuyerVisitTracker from "./components/BuyerVisitTracker";

installPhoneInputGuard();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <SiteUtilities />
      <PersonalizationTracker />
      <BuyerSearchIntentTracker />
      <BuyerAlertBootstrap />
      <BuyerVisitTracker />
      <ErrorBoundary>
        <CompareProvider>
          <FavoritesProvider>
            <App />
          </FavoritesProvider>
        </CompareProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);

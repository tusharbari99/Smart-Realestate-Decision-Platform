import { lazy, Suspense } from "react";

const BuyerSmartSuggestions = lazy(
  () => import("./pages/BuyerSmartSuggestions"),
);

import { Route, Routes } from "react-router";

import AdminRoute from "./components/AdminRoute";
import BuyerRoute from "./components/BuyerRoute";
import DashboardRedirect from "./components/DashboardRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import SellerRoute from "./components/SellerRoute";

import SellerPropertyMedia from "./pages/SellerPropertyMedia";
import AdminPropertyEditRequests from "./pages/AdminPropertyEditRequests";
import AddProperty from "./pages/AddProperty";
import AdminDashboard from "./pages/AdminDashboard";
import Admin3DRequests from "./pages/Admin3DRequests";
import AdminInquiries from "./pages/AdminInquiries";
import AdminPendingProperties from "./pages/AdminPendingProperties";
import AdminProperties from "./pages/AdminProperties";
import AdminUsers from "./pages/AdminUsers";
import AdminSupportMessages from "./pages/AdminSupportMessages";
import Auth from "./pages/Auth";
import BuyerRecommendations from "./pages/BuyerRecommendations";
import BuyerDashboard from "./pages/BuyerDashboard";
import BuyerRequests from "./pages/BuyerRequests";
import Compare from "./pages/Compare";
import Home from "./pages/Home";
import Terms from "./pages/Terms";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import PricingPolicy from "./pages/PricingPolicy";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";
import Properties from "./pages/Properties";
import Profile from "./pages/Profile";
import PropertyDetails from "./pages/PropertyDetails";
import SavedProperties from "./pages/SavedProperties";
import SellerDashboard from "./pages/SellerDashboard";
import SellerEditProperty from "./pages/SellerEditProperty";
import SellerPropertyReport from "./pages/SellerPropertyReport";
import SellerHome from "./pages/SellerHome";
import BuyerNotifications from "./pages/BuyerNotifications";
import BuyerRecommendationSettings from "./pages/BuyerRecommendationSettings";
import BuyerRecentlyViewed from "./pages/BuyerRecentlyViewed";
import BuyerHiddenProperties from "./pages/BuyerHiddenProperties";
import BuyerPreferenceEditor from "./pages/BuyerPreferenceEditor";
import AdminNotificationControl from "./pages/AdminNotificationControl";
import MarketingEmailUnsubscribe from "./pages/MarketingEmailUnsubscribe";
import AdminHotBuyerLeads from "./pages/AdminHotBuyerLeads";
import AdminLeadPipeline from "./pages/AdminLeadPipeline";
import AdminPropertyBuyerInterest from "./pages/AdminPropertyBuyerInterest";
import AdminAnalytics from "./pages/AdminAnalytics";

import AdminPropertyMediaRequests from "./pages/AdminPropertyMediaRequests";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/properties" element={<Properties />} />
      <Route path="/auth" element={<Auth />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="/dashboard" element={<DashboardRedirect />} />

      <Route path="/how-it-works" element={<HowItWorks />} />

      <Route path="/about" element={<About />} />
      <Route path="/pricing-policy" element={<PricingPolicy />} />
      <Route path="/privacy" element={<Privacy />} />

      <Route path="/contact" element={<Contact />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/terms" element={<Terms />} />




      <Route
        path="/properties/:id"
        element={
          <ProtectedRoute>
            <PropertyDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buyer/dashboard"
        element={
          <BuyerRoute>
            <BuyerDashboard />
          </BuyerRoute>
        }
      />

      
      <Route
        path="/buyer/smart-suggestions"
        element={
          <BuyerRoute>
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">
                  Loading your suggestions...
                </div>
              }
            >
              <BuyerSmartSuggestions />
            </Suspense>
          </BuyerRoute>
        }
      />

      <Route
        path="/buyer/recommendations"
        element={
          <BuyerRoute>
            <BuyerRecommendations />
          </BuyerRoute>
        }
      />

      <Route
        path="/buyer/requests"
        element={
          <BuyerRoute>
            <BuyerRequests />
          </BuyerRoute>
        }
      />

      <Route
        path="/buyer/saved-properties"
        element={
          <BuyerRoute>
            <SavedProperties />
          </BuyerRoute>
        }
      />

      <Route
        path="/compare"
        element={
          <BuyerRoute>
            <Compare />
          </BuyerRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/3d-requests"
        element={
          <AdminRoute>
            <Admin3DRequests />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/support-messages"
        element={
          <AdminRoute>
            <AdminSupportMessages />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/properties"
        element={
          <AdminRoute>
            <AdminProperties />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/properties/pending"
        element={
          <AdminRoute>
            <AdminPendingProperties />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/inquiries"
        element={
          <AdminRoute>
            <AdminInquiries />
          </AdminRoute>
        }
      />

      <Route
        path="/seller/home"
        element={
          <SellerRoute>
            <SellerHome />
          </SellerRoute>
        }
      />

      <Route
        path="/seller/dashboard"
        element={
          <SellerRoute>
            <SellerDashboard />
          </SellerRoute>
        }
      />

      <Route
        path="/seller/add-property"
        element={
          <SellerRoute>
            <AddProperty />
          </SellerRoute>
        }
      />

            <Route
        path="/seller/properties/:id/report"
        element={<SellerPropertyReport />}
      />

            <Route
        path="/seller/properties/:id/edit"
        element={<SellerEditProperty />}
      />

            <Route
        path="/admin/property-edit-requests"
        element={<AdminPropertyEditRequests />}
      />

            <Route
        path="/seller/properties/:id/media"
        element={<SellerPropertyMedia />}
      />

      
      <Route
        path="/admin/property-media-requests"
        element={<AdminPropertyMediaRequests />}
      />

      <Route path="*" element={<NotFound />} />

    
      <Route
        path="/buyer/notifications"
        element={
          <BuyerRoute>
            <BuyerNotifications />
          </BuyerRoute>
        }
      />

      
      <Route
        path="/buyer/recommendation-settings"
        element={
          <BuyerRoute>
            <BuyerRecommendationSettings />
          </BuyerRoute>
        }
      />

      
      <Route
        path="/buyer/recently-viewed"
        element={
          <BuyerRoute>
            <BuyerRecentlyViewed />
          </BuyerRoute>
        }
      />

      
      <Route
        path="/buyer/hidden-properties"
        element={
          <BuyerRoute>
            <BuyerHiddenProperties />
          </BuyerRoute>
        }
      />

      
      <Route
        path="/buyer/property-preferences"
        element={
          <BuyerRoute>
            <BuyerPreferenceEditor />
          </BuyerRoute>
        }
      />

      
      <Route
        path="/admin/notification-control"
        element={
          <AdminRoute>
            <AdminNotificationControl />
          </AdminRoute>
        }
      />

      
      <Route
        path="/email-preferences/unsubscribe"
        element={<MarketingEmailUnsubscribe />}
      />

      
      <Route
        path="/admin/hot-buyer-leads"
        element={
          <AdminRoute>
            <AdminHotBuyerLeads />
          </AdminRoute>
        }
      />

      
      <Route
        path="/admin/lead-pipeline"
        element={
          <AdminRoute>
            <AdminLeadPipeline />
          </AdminRoute>
        }
      />

      
      <Route
        path="/admin/property-buyer-interest"
        element={
          <AdminRoute>
            <AdminPropertyBuyerInterest />
          </AdminRoute>
        }
      />

      
      <Route
        path="/admin/analytics"
        element={
          <AdminRoute>
            <AdminAnalytics />
          </AdminRoute>
        }
      />

      </Routes>
  );
}

export default App;

import { useEffect, useState } from "react";
import { ArrowUp, WifiOff } from "lucide-react";
import { useLocation } from "react-router";

const pageTitles = {
  "/": "The homeasy | Smart Real Estate",
  "/properties": "Properties | The homeasy",
  "/auth": "Login or Register | The homeasy",
  "/profile": "My Profile | The homeasy",
  "/about": "About Us | The homeasy",
  "/contact": "Contact Support | The homeasy",
  "/faq": "Help and FAQ | The homeasy",
  "/terms": "Terms and Conditions | The homeasy",
  "/privacy": "Privacy Policy | The homeasy",
  "/pricing-policy": "Pricing Policy | The homeasy",
  "/how-it-works": "How It Works | The homeasy",

  "/buyer/dashboard": "Buyer Dashboard | The homeasy",
  "/buyer/recommendations": "AI Recommendations | The homeasy",
  "/buyer/saved-properties": "Saved Properties | The homeasy",
  "/buyer/requests": "My Requests | The homeasy",
  "/compare": "Compare Properties | The homeasy",

  "/seller/dashboard": "Seller Dashboard | The homeasy",
  "/seller/add-property": "Add Property | The homeasy",

  "/admin/dashboard": "Admin Dashboard | The homeasy",
  "/admin/inquiries": "Buyer Requests | The homeasy",
  "/admin/properties": "Manage Properties | The homeasy",
  "/admin/properties/pending": "Pending Properties | The homeasy",
  "/admin/users": "Manage Users | The homeasy",
  "/admin/3d-requests": "3D Requests | The homeasy",
  "/admin/support-messages": "Support Inbox | The homeasy",
};

function getPageTitle(pathname) {
  if (/^\/properties\/\d+$/.test(pathname)) {
    return "Property Details | The homeasy";
  }

  if (/^\/seller\/properties\/\d+\/edit$/.test(pathname)) {
    return "Edit Property | The homeasy";
  }

  return pageTitles[pathname] || "The homeasy | Smart Real Estate";
}

function SiteUtilities() {
  const { pathname } = useLocation();

  const [online, setOnline] = useState(navigator.onLine);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    document.title = getPageTitle(pathname);
  }, [pathname]);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }

    function handleOffline() {
      setOnline(false);
    }

    function handleScroll() {
      setShowBackToTop(window.scrollY > 500);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }

  return (
    <>
      {!online && (
        <div className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 px-4 py-3 text-center text-sm font-bold text-slate-950 shadow-lg">
          <WifiOff size={18} />
          No internet connection. Some features may not work.
        </div>
      )}

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#0b84e5] text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#0675cc]"
        >
          <ArrowUp size={21} />
        </button>
      )}
    </>
  );
}

export default SiteUtilities;

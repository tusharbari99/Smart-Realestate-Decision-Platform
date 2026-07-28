import { Building2 } from "lucide-react";
import { Link } from "react-router";
import siteConfig from "../config/siteConfig";

function Footer() {
  return (
    <footer className="mt-12 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/homeasy-brand-logo.webp"
              alt="The homeasy logo"
              className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm"
            />

            <div>
              <p className="text-lg font-black">The homeasy</p>
              <p className="text-xs text-slate-400">
                Smart Real Estate
              </p>
            </div>
          </Link>

          <p className="mt-5 text-sm leading-7 text-slate-400">
            Search verified properties, compare options, and get
            complete buying support.
          </p>
        </div>

        <div>
          <h2 className="font-black">Explore</h2>

          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <Link className="block hover:text-white" to="/properties">
              Buy Property
            </Link>

            <Link
              className="block hover:text-white"
              to="/how-it-works"
            >
              How It Works
            </Link>

            <Link className="block hover:text-white" to="/about">
              About Us
            </Link>
          </div>
        </div>

        <div>
          <h2 className="font-black">Information</h2>

          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <Link
              className="block hover:text-white"
              to="/pricing-policy"
            >
              Pricing Policy
            </Link>

            <Link className="block hover:text-white" to="/privacy">
              Privacy Policy
            </Link>

            <Link className="block hover:text-white" to="/profile">
              My Profile
            </Link>

            <Link className="block hover:text-white" to="/terms">
              Terms and Conditions
            </Link>
          </div>
        </div>

        <div>
          <h2 className="font-black">Support</h2>

          <p className="mt-4 text-sm leading-7 text-slate-400">
            Our team supports property visits, price talks, and deal
            coordination.
          </p>

          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <a
              href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`}
              className="block hover:text-white"
            >
              {siteConfig.supportPhone}
            </a>

            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="block break-all hover:text-white"
            >
              {siteConfig.supportEmail}
            </a>

            <p>{siteConfig.officeLocation}</p>
          </div>

          <div className="mt-5 space-y-3 text-sm text-slate-400">
            <Link className="block hover:text-white" to="/contact">
              Contact Support
            </Link>

            <Link className="block hover:text-white" to="/faq">
              Frequently Asked Questions
            </Link>

            <Link
              className="block hover:text-white"
              to="/how-it-works"
            >
              View Full Process
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 px-4 py-5 text-center text-xs text-slate-500">
        © 2026 The homeasy. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;

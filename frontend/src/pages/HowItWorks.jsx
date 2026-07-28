import {
  BadgeCheck,
  Building2,
  Camera,
  FileCheck2,
  Handshake,
  Search,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const steps = [
  {
    number: "01",
    icon: Building2,
    title: "Seller Adds a Property",
    text: "The seller enters property details, price, location, and known issues.",
  },
  {
    number: "02",
    icon: BadgeCheck,
    title: "Our Team Verifies It",
    text: "Our company checks the property information before it goes live.",
  },
  {
    number: "03",
    icon: Camera,
    title: "3D Shoot Is Arranged",
    text: "The seller can request a professional 3D or 360° property shoot.",
  },
  {
    number: "04",
    icon: Sparkles,
    title: "AI Report Is Prepared",
    text: "The platform shows location benefits, possible risks, and estimated growth.",
  },
  {
    number: "05",
    icon: Search,
    title: "Buyer Finds the Right Property",
    text: "Buyers can search, compare, save, and get personal recommendations.",
  },
  {
    number: "06",
    icon: Handshake,
    title: "We Handle the Deal",
    text: "Our team manages site visits, price talks, paperwork, and final coordination.",
  },
];

function HowItWorks() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-300">
              Simple Property Buying
            </p>

            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              You Choose the Property.
              <span className="block text-blue-400">
                We Handle the Deal.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              From property verification to site visits and paperwork,
              our team supports the full buying process.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/properties"
                className="rounded-xl bg-[#0b84e5] px-6 py-3 font-extrabold text-white transition hover:bg-[#0675cc]"
              >
                Browse Properties
              </Link>

              <Link
                to="/seller/add-property"
                className="rounded-xl border border-slate-600 bg-white/10 px-6 py-3 font-extrabold text-white transition hover:bg-white/20"
              >
                List a Property
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-wider text-[#0b84e5]">
              The Full Process
            </p>

            <h2 className="mt-2 text-3xl font-black text-slate-900">
              How Smart Real Estate Works
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(({ number, icon: Icon, title, text }) => (
              <article
                key={number}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0b84e5]">
                    <Icon size={23} />
                  </div>

                  <span className="text-3xl font-black text-slate-100">
                    {number}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-black text-slate-900">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl bg-blue-600 p-7 text-white sm:p-9">
              <Sparkles size={30} />

              <h2 className="mt-5 text-2xl font-black">
                Smart Property Information
              </h2>

              <p className="mt-3 text-sm leading-7 text-blue-100">
                AI reports are estimates based on available property
                and location information. They help buyers compare
                options but do not guarantee future prices.
              </p>
            </article>

            <article className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
              <FileCheck2 size={30} />

              <h2 className="mt-5 text-2xl font-black">
                Clear Buying Support
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Our team supports property visits, price talks,
                documents, and final coordination. All charges and
                terms should be shared clearly before the deal.
              </p>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HowItWorks;

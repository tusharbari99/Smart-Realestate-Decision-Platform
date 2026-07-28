import {
  BadgeIndianRupee,
  CheckCircle2,
  Info,
  ShieldCheck,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

function PricingPolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-wider text-[#0b84e5]">
          Clear Pricing
        </p>

        <h1 className="mt-2 text-4xl font-black text-slate-900">
          Pricing Policy
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
          Property prices and platform charges should be clear before
          the buyer makes a decision.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <BadgeIndianRupee size={28} className="text-[#0b84e5]" />

            <h2 className="mt-5 text-xl font-black text-slate-900">
              Platform Price Range
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Buyers see a platform price range. This may include
              company service, marketing, verification, and deal support.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ShieldCheck size={28} className="text-emerald-600" />

            <h2 className="mt-5 text-xl font-black text-slate-900">
              Seller Agreement
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              The seller must accept the platform terms before the
              property is published.
            </p>
          </article>
        </div>

        <section className="mt-8 rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
          <Info size={28} className="text-blue-300" />

          <h2 className="mt-5 text-2xl font-black">
            Important Information
          </h2>

          <div className="mt-5 space-y-4">
            {[
              "The final deal amount may change after discussion.",
              "Government charges and document costs may be separate.",
              "Loan approval depends on the bank or finance company.",
              "All company charges should be shared before payment.",
            ].map((item) => (
              <p
                key={item}
                className="flex items-start gap-3 text-sm leading-6 text-slate-300"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />
                {item}
              </p>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default PricingPolicy;

import {
  BadgeCheck,
  Building2,
  Handshake,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        <section className="bg-slate-950 px-4 py-16 text-white sm:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-black uppercase tracking-wider text-blue-300">
              About The homeasy
            </p>

            <h1 className="mt-4 text-4xl font-black sm:text-5xl">
              A Smarter Way to Buy and Sell Property
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              We connect property owners and buyers while our team
              handles verification, site visits, price talks, and deal
              support.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Building2,
                title: "Verified Listings",
                text: "Property information is checked before publishing.",
              },
              {
                icon: Sparkles,
                title: "Smart Reports",
                text: "Buyers get clear location, growth, benefit, and risk information.",
              },
              {
                icon: SearchCheck,
                title: "Buyer Support",
                text: "Our team helps buyers find and compare suitable properties.",
              },
              {
                icon: Handshake,
                title: "Deal Support",
                text: "We help with visits, price talks, documents, and coordination.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0b84e5]">
                  <Icon size={23} />
                </div>

                <h2 className="mt-5 text-lg font-black text-slate-900">
                  {title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {text}
                </p>
              </article>
            ))}
          </div>

          <section className="mt-10 rounded-3xl bg-blue-600 p-7 text-white sm:p-10">
            <BadgeCheck size={30} />

            <h2 className="mt-5 text-3xl font-black">
              You Choose the Property. We Handle the Deal.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
              Sellers provide property details. Buyers choose the right
              property. Our company manages the process between them.
            </p>

            <Link
              to="/properties"
              className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-700"
            >
              Browse Properties
            </Link>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default About;

import { Link } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  FileCheck2,
  Headphones,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const trustCards = [
  {
    icon: ShieldCheck,
    title: "Verified Listing Process",
    description:
      "Every property is reviewed before it becomes visible to buyers.",
  },
  {
    icon: LockKeyhole,
    title: "Protected Seller Privacy",
    description:
      "Your private contact details are not displayed publicly.",
  },
  {
    icon: UserCheck,
    title: "Organized Buyer Interest",
    description:
      "Manage genuine buyer inquiries from one secure workspace.",
  },
  {
    icon: BarChart3,
    title: "Clear Property Activity",
    description:
      "Track listing status, buyer interest and important updates.",
  },
];

const steps = [
  {
    number: "01",
    icon: Building2,
    title: "Post your property",
    description:
      "Add property details, location, pricing and clear photographs.",
  },
  {
    number: "02",
    icon: FileCheck2,
    title: "Complete platform review",
    description:
      "The homeasy reviews the listing before it is published.",
  },
  {
    number: "03",
    icon: MessageSquareText,
    title: "Manage buyer interest",
    description:
      "Receive and manage property inquiries from your seller dashboard.",
  },
];

function getSellerName() {
  try {
    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;

    return (
      user?.name ||
      user?.full_name ||
      user?.username ||
      "Seller"
    );
  } catch {
    return "Seller";
  }
}

function SellerHome() {
  const sellerName = getSellerName();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* PROPERTY IMAGE HERO */}
        <section
          className="relative min-h-[690px] overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=88')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#043c70]/95 via-[#075aa8]/82 to-[#0878c9]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#043c70]/55 via-transparent to-black/10" />

          <div className="relative mx-auto grid min-h-[690px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-xl">
                <Sparkles size={17} />
                The homeasy Seller Experience
              </div>

              <p className="mt-7 text-sm font-black uppercase tracking-[0.22em] text-blue-100">
                Welcome, {sellerName}
              </p>

              <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.08] text-white sm:text-6xl">
                Give your property
                <span className="block text-sky-300">
                  the right digital presence.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
                Publish a verified property listing, protect your
                privacy and manage buyer interest through one trusted
                seller platform.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/seller/add-property"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-black text-[#075aa8] shadow-[0_14px_38px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Post Your Property
                  <ArrowRight size={19} />
                </Link>

                <Link
                  to="/seller/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/15 px-6 py-3.5 font-black text-white shadow-lg backdrop-blur-xl transition hover:bg-white/25"
                >
                  Open Seller Dashboard
                </Link>
              </div>

              <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-white/90">
                <span className="flex items-center gap-2">
                  <CheckCircle2
                    size={18}
                    className="text-emerald-300"
                  />
                  Transparent listing review
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2
                    size={18}
                    className="text-emerald-300"
                  />
                  Protected seller details
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2
                    size={18}
                    className="text-emerald-300"
                  />
                  Organized buyer inquiries
                </span>
              </div>
            </div>

            {/* GLASS TRUST PANEL */}
            <div className="rounded-[32px] border border-white/25 bg-white/[0.07] p-5 shadow-[0_20px_60px_rgba(0,35,75,0.20)] backdrop-blur-xl">
              <div className="rounded-[26px] border border-white/20 bg-blue-900/[0.10] p-6 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full border border-sky-100/20 bg-sky-300/[0.08] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-sky-100 backdrop-blur-lg">
                      Seller Protection Suite
                    </p>

                    <h2 className="mt-4 text-3xl font-black leading-tight text-white">
                      Your property.
                      <span className="block bg-gradient-to-r from-sky-200 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
                        Your visibility. Your control.
                      </span>
                    </h2>
                  </div>

                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/30 bg-emerald-300/20 text-emerald-200 backdrop-blur-xl">
                    <BadgeCheck size={27} />
                  </div>
                </div>

                <div className="mt-7 space-y-4">
                  {[
                    {
                      icon: BarChart3,
                      text: "See every listing update clearly, from review to publication.",
                    },
                    {
                      icon: LockKeyhole,
                      text: "Keep your phone number and personal details away from public view.",
                    },
                    {
                      icon: MessageSquareText,
                      text: "Review buyer interest in one organized seller workspace.",
                    },
                    {
                      icon: Headphones,
                      text: "Get guided platform support whenever your listing needs attention.",
                    },
                  ].map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.07] p-4 shadow-sm backdrop-blur-lg transition hover:bg-white/14"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-sky-100 backdrop-blur-lg">
                        <Icon size={20} />
                      </div>

                      <p className="text-[15px] font-bold leading-6 text-white drop-shadow-sm">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-200/25 bg-emerald-300/[0.08] p-4 backdrop-blur-lg">
                  <p className="text-sm font-extrabold leading-6 text-emerald-100 drop-shadow-sm">
                    Your property goes live only after The homeasy completes
                    the required verification and listing review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <section className="bg-gradient-to-b from-white to-blue-50/50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0875c1]">
                Built for seller trust
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                A safer and clearer way to list your property
              </h2>

              <p className="mt-4 text-lg leading-8 text-slate-600">
                The homeasy keeps the listing process organized,
                transparent and easy to manage.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {trustCards.map(
                ({ icon: Icon, title, description }) => (
                  <article
                    key={title}
                    className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-[0_12px_35px_rgba(30,100,170,0.10)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-[0_18px_45px_rgba(30,100,170,0.16)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-500/10 text-blue-600">
                      <Icon size={24} />
                    </div>

                    <h3 className="mt-5 text-xl font-black text-slate-900">
                      {title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {description}
                    </p>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

        {/* STEPS */}
        <section className="bg-white py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0875c1]">
                Simple selling journey
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                Three steps from listing to buyer interest
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-600">
                Know what happens at every stage and manage everything
                from your seller account.
              </p>

              <Link
                to="/seller/add-property"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#075aa8] to-[#168bd2] px-6 py-3.5 font-black text-white shadow-[0_12px_32px_rgba(7,90,168,0.26)] transition hover:-translate-y-0.5"
              >
                Start Property Listing
                <ArrowRight size={19} />
              </Link>
            </div>

            <div className="grid gap-5">
              {steps.map(
                ({ number, icon: Icon, title, description }) => (
                  <article
                    key={number}
                    className="flex gap-5 rounded-3xl border border-blue-100/80 bg-blue-50/45 p-6 shadow-[0_10px_30px_rgba(30,100,170,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-blue-50/80"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white/80 text-blue-600 shadow-sm">
                      <Icon size={25} />
                    </div>

                    <div>
                      <p className="text-xs font-black tracking-[0.2em] text-blue-600">
                        STEP {number}
                      </p>

                      <h3 className="mt-1 text-xl font-black text-slate-900">
                        {title}
                      </h3>

                      <p className="mt-2 leading-7 text-slate-600">
                        {description}
                      </p>
                    </div>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-blue-50/60 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-7 rounded-[32px] border border-blue-200/70 bg-white/70 p-8 shadow-[0_18px_50px_rgba(30,100,170,0.12)] backdrop-blur-2xl sm:p-10 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
                  Ready to begin?
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  Create your trusted property listing.
                </h2>

                <p className="mt-3 max-w-2xl text-slate-600">
                  Add your property and manage every important update
                  through The homeasy.
                </p>
              </div>

              <Link
                to="/seller/add-property"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#075aa8] px-6 py-3.5 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#0875c1]"
              >
                Post Property
                <ArrowRight size={19} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default SellerHome;

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const sections = [
  {
    title: "Information We Collect",
    text: "We may collect your name, email, phone number, account role, saved properties, property requests, and listing information.",
  },
  {
    title: "How We Use Information",
    text: "We use information to manage accounts, property listings, recommendations, buyer requests, site visits, and platform security.",
  },
  {
    title: "Buyer and Seller Contact",
    text: "Our company may use contact details to support a property request or listing.",
  },
  {
    title: "Account Security",
    text: "Passwords are stored in protected form. Users should keep their login details private.",
  },
  {
    title: "AI Information",
    text: "AI reports are estimates based on available data. They are not guaranteed financial, legal, or safety advice.",
  },
];

function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-wider text-[#0b84e5]">
          Your Information
        </p>

        <h1 className="mt-2 text-4xl font-black text-slate-900">
          Privacy Policy
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-500">
          This page explains how account and property information is
          used on the platform.
        </p>

        <div className="mt-10 space-y-5">
          {sections.map((section, index) => (
            <article
              key={section.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-black text-blue-500">
                {String(index + 1).padStart(2, "0")}
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-900">
                {section.title}
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                {section.text}
              </p>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Privacy;

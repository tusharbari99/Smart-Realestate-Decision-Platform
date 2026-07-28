import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const sections = [
  {
    title: "Platform Service",
    text: "The homeasy connects property sellers and buyers. Our team may support verification, marketing, site visits, price discussions, documents, and deal coordination.",
  },
  {
    title: "Property Information",
    text: "Sellers must provide correct property details, ownership information, prices, known issues, and documents. False information may cause a listing to be rejected or removed.",
  },
  {
    title: "Price and Charges",
    text: "The buyer-facing price may include company services and deal support. Final prices, government charges, taxes, and document costs must be confirmed before payment.",
  },
  {
    title: "AI Reports",
    text: "AI reports, scores, risks, and growth information are estimates. They do not guarantee future price, investment return, legal status, or property safety.",
  },
  {
    title: "Account Use",
    text: "Users must protect their login details and use the correct buyer, seller, or admin account. Misuse may lead to account suspension.",
  },
  {
    title: "Final Verification",
    text: "Buyers should verify legal documents, ownership, loans, approvals, and physical property condition before completing a deal.",
  },
];

function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-wider text-[#0b84e5]">
          Platform Rules
        </p>

        <h1 className="mt-2 text-4xl font-black text-slate-900">
          Terms and Conditions
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-500">
          These terms explain the basic responsibilities of buyers,
          sellers, and the platform.
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

export default Terms;

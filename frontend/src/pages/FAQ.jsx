import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const questions = [
  {
    question: "How does The homeasy work?",
    answer:
      "Sellers list properties, our company verifies them, and buyers can search, compare, save, and request support.",
  },
  {
    question: "Does the buyer contact the seller directly?",
    answer:
      "Our property team manages buyer requests, site visits, price talks, and deal coordination.",
  },
  {
    question: "Are AI growth reports guaranteed?",
    answer:
      "No. AI reports are estimates based on available property and location information.",
  },
  {
    question: "How can a seller request a 3D shoot?",
    answer:
      "The seller can select the 3D shoot option while adding a property or request it from the seller dashboard.",
  },
  {
    question: "How does the company earn money?",
    answer:
      "The platform may earn a service fee or commission for marketing, verification, buyer support, and deal management.",
  },
  {
    question: "Can a buyer schedule a site visit?",
    answer:
      "Yes. Open the property page, select Site Visit, enter your contact details, and send the request.",
  },
  {
    question: "Who verifies property documents?",
    answer:
      "The company may review basic documents, but buyers should complete full legal verification before the final deal.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-wider text-[#0b84e5]">
            Help Center
          </p>

          <h1 className="mt-2 text-4xl font-black text-slate-900">
            Frequently Asked Questions
          </h1>

          <p className="mt-4 text-sm text-slate-500">
            Simple answers about properties, requests, and platform
            services.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <article
                key={item.question}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenIndex(isOpen ? null : index)
                  }
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-black text-slate-900">
                    {item.question}
                  </span>

                  {isOpen ? (
                    <ChevronUp
                      size={20}
                      className="shrink-0 text-[#0b84e5]"
                    />
                  ) : (
                    <ChevronDown
                      size={20}
                      className="shrink-0 text-slate-400"
                    />
                  )}
                </button>

                {isOpen && (
                  <p className="border-t border-slate-100 px-5 py-4 text-sm leading-7 text-slate-500">
                    {item.answer}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default FAQ;

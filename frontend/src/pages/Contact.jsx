import { useState } from "react";
import {
  Building2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import siteConfig from "../config/siteConfig";
import api from "../services/api";

function Contact() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSending(true);
      setStatus(null);

      const response = await api.post(
        "/support/messages",
        form,
      );

      setStatus({
        type: "success",
        text:
          response.data?.message ||
          "Message received. Our team will contact you soon.",
      });

      setForm({
        name: "",
        phone: "",
        email: "",
        message: "",
      });
    } catch (error) {
      setStatus({
        type: "error",
        text:
          error.response?.data?.message ||
          "Could not send your message.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-wider text-[#0b84e5]">
            Contact Our Team
          </p>

          <h1 className="mt-2 text-4xl font-black text-slate-900">
            How Can We Help?
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
            Contact us for property support, site visits, listings,
            price talks, or account help.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="space-y-4">
            {[
              {
                icon: Phone,
                title: "Call Support",
                value: siteConfig.supportPhone,
              },
              {
                icon: Mail,
                title: "Email Support",
                value: siteConfig.supportEmail,
              },
              {
                icon: MapPin,
                title: "Office",
                value: siteConfig.officeLocation,
              },
            ].map(({ icon: Icon, title, value }) => (
              <article
                key={title}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0b84e5]">
                    <Icon size={22} />
                  </div>

                  <div>
                    <h2 className="font-black text-slate-900">
                      {title}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {value}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            <article className="rounded-3xl bg-slate-900 p-6 text-white">
              <Building2 size={27} className="text-blue-300" />

              <h2 className="mt-4 text-xl font-black">
                Property Support
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Our team helps with visits, price discussions,
                documents, and deal coordination.
              </p>
            </article>
          </section>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-center gap-3">
              <MessageSquare
                size={26}
                className="text-[#0b84e5]"
              />

              <h2 className="text-2xl font-black text-slate-900">
                Send a Message
              </h2>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                required
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Your name"
                className="rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500"
              />

              <input
                required
                type="tel"
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="Mobile number"
                className="rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500"
              />

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                placeholder="Email address"
                className="rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 sm:col-span-2"
              />

              <textarea
                required
                rows={5}
                name="message"
                value={form.message}
                onChange={updateField}
                placeholder="How can our team help you?"
                className="resize-none rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 sm:col-span-2"
              />
            </div>

            {status && (
              <p
                className={`mt-4 rounded-xl p-3 text-sm font-semibold ${
                  status.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {status.text}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-4 font-extrabold text-white disabled:opacity-60"
            >
              <Send size={18} />
              {sending ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Contact;

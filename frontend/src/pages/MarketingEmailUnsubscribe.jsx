import { useEffect, useState } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  MailX,
  TriangleAlert,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

import api from "../services/api";

function MarketingEmailUnsubscribe() {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState(
    "loading",
  );

  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    async function unsubscribe() {
      if (!token) {
        setStatus("error");
        setMessage(
          "This unsubscribe link is invalid.",
        );
        return;
      }

      try {
        const response = await api.post(
          `/personalization/marketing/unsubscribe/${encodeURIComponent(
            token,
          )}`,
        );

        setStatus("success");

        setMessage(
          response.data?.message ||
            "Marketing emails have been turned off.",
        );
      } catch (error) {
        setStatus("error");

        setMessage(
          error.response?.data?.message ||
            "Could not update your email preference.",
        );
      }
    }

    unsubscribe();
  }, [searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl sm:p-10">
        {status === "loading" && (
          <>
            <LoaderCircle
              size={48}
              className="mx-auto animate-spin text-[#0b84e5]"
            />

            <h1 className="mt-5 text-2xl font-black text-slate-900">
              Updating Email Preference
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Please wait for a moment.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <CheckCircle2 size={34} />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-900">
              Marketing Emails Stopped
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              {message}
            </p>

            <p className="mt-3 text-xs leading-6 text-slate-500">
              Important account and property-request
              communications may still be sent.
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex rounded-xl bg-[#0b84e5] px-5 py-3 text-sm font-black text-white"
            >
              Return to The homeasy
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <TriangleAlert size={34} />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-900">
              Link Could Not Be Used
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              {message}
            </p>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <MailX size={16} />
              You can also change this from Recommendation
              Settings after login.
            </div>

            <Link
              to="/auth"
              className="mt-7 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              Login to The homeasy
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

export default MarketingEmailUnsubscribe;

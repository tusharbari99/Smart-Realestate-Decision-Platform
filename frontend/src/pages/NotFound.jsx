import { ArrowLeft, Home, SearchX } from "lucide-react";
import { Link } from "react-router";

import Navbar from "../components/Navbar";

function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto flex min-h-[75vh] max-w-4xl items-center justify-center px-4 py-12 text-center sm:px-6">
        <div>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-[#0b84e5]">
            <SearchX size={38} />
          </div>

          <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[#0b84e5]">
            Error 404
          </p>

          <h1 className="mt-3 text-4xl font-black text-slate-900 sm:text-5xl">
            Page Not Found
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
            The page may have moved, or the address may be incorrect.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-6 py-3 font-extrabold text-white transition hover:bg-[#0675cc]"
            >
              <Home size={18} />
              Go to Home
            </Link>

            <Link
              to="/properties"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-extrabold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
            >
              <ArrowLeft size={18} />
              Browse Properties
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default NotFound;

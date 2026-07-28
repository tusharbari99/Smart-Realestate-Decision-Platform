import { Navigate, useLocation, useNavigate } from "react-router";
import { Building2, LogIn, ShieldAlert } from "lucide-react";

function getUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function BuyerRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = getUser();
  const redirectPath = `${location.pathname}${location.search}`;

  if (!token) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(redirectPath)}`}
        replace
      />
    );
  }

  if (user?.role !== "buyer") {
    function switchAccount() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      navigate(`/auth?redirect=${encodeURIComponent(redirectPath)}`, {
        replace: true,
      });
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <ShieldAlert size={31} />
          </div>

          <h1 className="mt-5 text-3xl font-black text-slate-900">
            Buyer account required
          </h1>

          <p className="mt-3 leading-7 text-slate-500">
            Personalized AI recommendations ke liye buyer account se login
            karna zaroori hai.
          </p>

          <button
            type="button"
            onClick={switchAccount}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-4 font-extrabold text-white"
          >
            <LogIn size={20} />
            Login with Buyer Account
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-4 font-extrabold text-slate-700"
          >
            <Building2 size={20} />
            Go to Home
          </button>
        </section>
      </main>
    );
  }

  return children;
}

export default BuyerRoute;

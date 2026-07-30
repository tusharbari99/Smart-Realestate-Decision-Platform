import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  Sparkles,
  User,
} from "lucide-react";

import api from "../services/api";

function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectPath = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "buyer",
    agencyName: "",
    serviceCity: "",
    registrationId: "",
  });

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function loginUser() {
    const response = await api.post("/auth/login", {
      email: form.email.trim(),
      password: form.password,
    });

    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    window.dispatchEvent(new Event("auth-changed"));

    const loggedInUser = response.data.user;

    const role = String(
      loggedInUser?.role ||
        loggedInUser?.user_type ||
        loggedInUser?.account_type ||
        "",
    ).toLowerCase();

    const hasCustomRedirect =
      redirectPath && redirectPath !== "/";

    const destination = hasCustomRedirect
      ? redirectPath
      : role === "admin"
        ? "/admin/dashboard"
        : role === "seller" || role === "broker"
          ? "/seller/dashboard"
          : role === "buyer"
            ? "/buyer/dashboard"
            : "/";

    navigate(destination, { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (mode === "register") {
        await api.post("/auth/register", {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: form.role,
          agencyName: form.agencyName.trim(),
          serviceCity: form.serviceCity.trim(),
          registrationId: form.registrationId.trim(),
        });

        setMessage("Account created successfully. Logging you in...");
      }

      await loginUser();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We could not complete your request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  return (
    <main className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-2">
      <section className="hidden min-h-screen bg-gradient-to-br from-[#032d57] via-[#075aa8] to-[#0b84e5] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
              src={`${import.meta.env.BASE_URL}homeasy-navbar-logo-v3.png?v=202607281035`}
              alt="The homeasy logo"
              className="h-16 w-16 shrink-0 max-w-none scale-[2.25] object-contain object-center mix-blend-screen brightness-110 contrast-110 drop-shadow-[0_4px_7px_rgba(0,0,0,0.25)]"
            />

          <div>
            <p className="text-xl font-black">The homeasy</p>
            <p className="text-xs text-blue-100">Smart Real Estate</p>
          </div>
        </Link>

        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
            <Sparkles size={17} />
            Intelligent property decisions
          </div>

          <h1 className="mt-6 text-5xl font-black leading-tight">
            Login to unlock the complete property report.
          </h1>

          <p className="mt-6 text-lg leading-8 text-blue-100">
            Full AI analysis, future development, price-growth outlook,
            shortcomings, nearby facilities, comparison and 3D tours are
            available only to registered users.
          </p>
        </div>

        <p className="text-sm text-blue-200">
          Your data is used only for platform access and property services.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-lg">
          <Link
            to="/"
            className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#075aa8]"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-9">
            <div className="lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#075aa8] text-white">
                  <Building2 size={24} />
                </div>

                <div>
                  <p className="text-xl font-black text-slate-900">
                    The homeasy
                  </p>
                  <p className="text-xs text-slate-500">
                    Smart Real Estate
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1 lg:mt-0">
              <button
                type="button"
                onClick={() => changeMode("login")}
                className={`rounded-lg px-4 py-3 text-sm font-extrabold transition ${
                  mode === "login"
                    ? "bg-white text-[#075aa8] shadow"
                    : "text-slate-500"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => changeMode("register")}
                className={`rounded-lg px-4 py-3 text-sm font-extrabold transition ${
                  mode === "register"
                    ? "bg-white text-[#075aa8] shadow"
                    : "text-slate-500"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="mt-7">
              <h2 className="text-3xl font-black text-slate-900">
                {mode === "login"
                  ? "Welcome back"
                  : "Create your account"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {mode === "login"
                  ? "Log in to view the complete property intelligence report."
                  : "Choose a Buyer, Seller or Broker Partner account."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {mode === "register" && (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Full Name
                    </span>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500">
                      <User size={19} className="text-slate-400" />

                      <input
                        required
                        name="name"
                        value={form.name}
                        onChange={updateField}
                        placeholder="Enter your full name"
                        className="min-h-13 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Phone Number
                    </span>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500">
                      <Phone size={19} className="text-slate-400" />

                      <input
                        name="phone"
                        value={form.phone}
                        onChange={updateField}
                        placeholder="Enter your phone number"
                        className="min-h-13 w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>
                </>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Email Address
                </span>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500">
                  <Mail size={19} className="text-slate-400" />

                  <input
                    required
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="Enter your email"
                    className="min-h-13 w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Password
                </span>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500">
                  <LockKeyhole size={19} className="text-slate-400" />

                  <input
                    required
                    minLength={6}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={updateField}
                    placeholder="Minimum 6 characters"
                    className="min-h-13 w-full bg-transparent text-sm outline-none"
                  />

                  <button
                    type="button"
                    aria-label="Show or hide password"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-slate-400"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </label>

              {mode === "register" && (
                <div>
                  <p className="mb-2 text-sm font-bold text-slate-700">
                    Account Type
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {["buyer", "seller", "broker"].map((role) => (
                      <label
                        key={role}
                        className={`cursor-pointer rounded-xl border p-4 transition ${
                          form.role === role
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={form.role === role}
                          onChange={updateField}
                          className="sr-only"
                        />

                        <span className="block font-extrabold capitalize text-slate-800">
                          {role === "broker" ? "Broker Partner" : role}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          {role === "buyer"
                            ? "Explore and compare verified properties."
                            : role === "seller"
                              ? "List and manage your own property."
                              : "List multiple local properties and receive partner benefits."}
                        </span>
                      </label>
                    ))}
                  </div>

                  {form.role === "broker" && (
                    <div className="mt-4 space-y-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                      <div>
                        <p className="font-extrabold text-slate-900">
                          The homeasy Broker Partner
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          Add multiple local properties and receive partner
                          discounts after verification.
                        </p>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-slate-700">
                          Agency / Business Name
                        </span>

                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500">
                          <Building2 size={19} className="text-slate-400" />
                          <input
                            required
                            name="agencyName"
                            value={form.agencyName}
                            onChange={updateField}
                            placeholder="Example: Rahul Properties"
                            className="min-h-13 w-full bg-transparent text-sm outline-none"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-slate-700">
                          Service City
                        </span>

                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500">
                          <Building2 size={19} className="text-slate-400" />
                          <input
                            required
                            name="serviceCity"
                            value={form.serviceCity}
                            onChange={updateField}
                            placeholder="Example: Pune"
                            className="min-h-13 w-full bg-transparent text-sm outline-none"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-slate-700">
                          Broker Registration / ID
                          <span className="ml-1 font-normal text-slate-400">
                            (Optional)
                          </span>
                        </span>

                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500">
                          <Building2 size={19} className="text-slate-400" />
                          <input
                            name="registrationId"
                            value={form.registrationId}
                            onChange={updateField}
                            placeholder="Enter registration number"
                            className="min-h-13 w-full bg-transparent text-sm outline-none"
                          />
                        </div>
                      </label>

                      <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-700">
                        Broker verification will remain pending until approved
                        by The homeasy team.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {mode === "register" && (
                <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                  <input required type="checkbox" className="mt-1" />

                  <span>
                    I agree to the Terms & Conditions, including the disclosed
                    platform price-range and service policy.
                  </span>
                </label>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                  {message}
                </div>
              )}

              <button
                disabled={loading}
                className="flex min-h-13 w-full items-center justify-center rounded-xl bg-[#0b84e5] px-5 font-extrabold text-white transition hover:bg-[#0675cc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Login & Continue"
                    : "Create Account & Continue"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Auth;

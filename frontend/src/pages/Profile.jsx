import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  KeyRound,
  LoaderCircle,
  LogOut,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);
  const [passwordStatus, setPasswordStatus] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get("/profile");
        const user = response.data?.user || {};

        setProfile({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "",
        });
      } catch (error) {
        setProfileStatus({
          type: "error",
          text:
            error.response?.data?.message ||
            "Could not load your profile.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function updateProfileField(event) {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updatePasswordField(event) {
    const { name, value } = event.target;

    setPasswords((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    try {
      setProfileSaving(true);
      setProfileStatus(null);

      const response = await api.patch("/profile", {
        name: profile.name,
        phone: profile.phone,
      });

      const existingUser = JSON.parse(
        localStorage.getItem("user") || "{}",
      );

      const updatedUser = {
        ...existingUser,
        ...(response.data?.user || {}),
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser),
      );

      window.dispatchEvent(new Event("auth-changed"));

      setProfileStatus({
        type: "success",
        text:
          response.data?.message ||
          "Profile updated successfully.",
      });
    } catch (error) {
      setProfileStatus({
        type: "error",
        text:
          error.response?.data?.message ||
          "Could not update your profile.",
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();

    if (
      passwords.new_password !==
      passwords.confirm_password
    ) {
      setPasswordStatus({
        type: "error",
        text: "New passwords do not match.",
      });
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordStatus(null);

      const response = await api.patch("/profile/password", {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });

      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setPasswordStatus({
        type: "success",
        text:
          response.data?.message ||
          "Password changed successfully.",
      });
    } catch (error) {
      setPasswordStatus({
        type: "error",
        text:
          error.response?.data?.message ||
          "Could not change your password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  }


  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.dispatchEvent(new Event("auth-changed"));

    navigate("/auth", {
      replace: true,
    });
  }

  const statusBox = (status) =>
    status && (
      <p
        className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
          status.type === "success"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-700"
        }`}
      >
        {status.text}
      </p>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-wider text-[#0b84e5]">
          Account Settings
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          My Profile
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage your account and password.
        </p>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <LoaderCircle
              size={38}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={saveProfile}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0b84e5]">
                  <UserRound size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Personal Details
                  </h2>

                  <p className="text-sm capitalize text-slate-500">
                    {profile.role} account
                  </p>
                </div>
              </div>

              <label className="mt-6 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Full Name
                </span>

                <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4">
                  <UserRound
                    size={18}
                    className="text-slate-400"
                  />

                  <input
                    required
                    name="name"
                    value={profile.name}
                    onChange={updateProfileField}
                    className="min-h-12 w-full outline-none"
                  />
                </div>
              </label>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Email
                </span>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
                  <Mail
                    size={18}
                    className="text-slate-400"
                  />

                  <input
                    readOnly
                    value={profile.email}
                    className="min-h-12 w-full bg-transparent text-slate-500 outline-none"
                  />
                </div>
              </label>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Phone Number
                </span>

                <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4">
                  <Phone
                    size={18}
                    className="text-slate-400"
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={updateProfileField}
                    placeholder="Enter phone number"
                    className="min-h-12 w-full outline-none"
                  />
                </div>
              </label>

              {statusBox(profileStatus)}

              <button
                type="submit"
                disabled={profileSaving}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-3 font-extrabold text-white disabled:opacity-60"
              >
                <Save size={18} />
                {profileSaving
                  ? "Saving..."
                  : "Save Profile"}
              </button>
            </form>

            <form
              onSubmit={changePassword}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <ShieldCheck size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Change Password
                  </h2>

                  <p className="text-sm text-slate-500">
                    Keep your account secure.
                  </p>
                </div>
              </div>

              {[
                {
                  name: "current_password",
                  label: "Current Password",
                },
                {
                  name: "new_password",
                  label: "New Password",
                },
                {
                  name: "confirm_password",
                  label: "Confirm New Password",
                },
              ].map((field) => (
                <label
                  key={field.name}
                  className="mt-4 block"
                >
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    {field.label}
                  </span>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4">
                    <KeyRound
                      size={18}
                      className="text-slate-400"
                    />

                    <input
                      required
                      minLength={8}
                      type="password"
                      name={field.name}
                      value={passwords[field.name]}
                      onChange={updatePasswordField}
                      className="min-h-12 w-full outline-none"
                    />
                  </div>
                </label>
              ))}

              {statusBox(passwordStatus)}

              <button
                type="submit"
                disabled={passwordSaving}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-extrabold text-white disabled:opacity-60"
              >
                <KeyRound size={18} />
                {passwordSaving
                  ? "Changing..."
                  : "Change Password"}
              </button>
            </form>
          </div>
        )}

        {!loading && (
          <section className="mt-6 rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Logout Account
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Sign out safely from your The homeasy account.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-red-700"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default Profile;

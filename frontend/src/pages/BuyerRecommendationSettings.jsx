import { useEffect, useState } from "react";
import {
  Bell,
  BrainCircuit,
  LoaderCircle,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../services/api";

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0b84e5]">
          <Icon size={21} />
        </div>

        <div>
          <h2 className="font-black text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked
            ? "bg-[#0b84e5]"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function BuyerRecommendationSettings() {
  const [settings, setSettings] = useState({
    personalization_enabled: true,
    email_alerts_enabled: true,
    sms_alerts_enabled: false,
    marketing_emails_enabled: true,
    marketing_email_frequency: "daily",
  });

  const [activityCount, setActivityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await api.get(
          "/personalization/preferences",
        );

        const preferences =
          response.data?.preferences || {};

        const saved = preferences.saved;

        if (saved) {
          setSettings({
            personalization_enabled:
              Boolean(saved.personalization_enabled),
            email_alerts_enabled:
              Boolean(saved.email_alerts_enabled),
            sms_alerts_enabled:
              Boolean(saved.sms_alerts_enabled),

            marketing_emails_enabled:
              saved.marketing_emails_enabled ===
              undefined
                ? true
                : Boolean(
                    saved.marketing_emails_enabled,
                  ),

            marketing_email_frequency:
              saved.marketing_email_frequency ||
              "daily",
          });
        }

        setActivityCount(
          Number(preferences.total_activities || 0),
        );
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Could not load recommendation settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateSetting(name, value) {
    setSettings((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }

  async function saveSettings() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const alertResponse = await api.patch(
        "/personalization/alert-settings",
        settings,
      );

      await api.patch(
        "/personalization/marketing-email-settings",
        {
          marketing_emails_enabled:
            settings.marketing_emails_enabled,

          marketing_email_frequency:
            settings.marketing_email_frequency,
        },
      );

      setMessage(
        alertResponse.data?.message ||
          "Recommendation settings updated.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not save recommendation settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function clearHistory() {
    const confirmed = window.confirm(
      "Clear your recommendation activity and property alerts?",
    );

    if (!confirmed) return;

    try {
      setClearing(true);
      setMessage("");
      setError("");

      const response = await api.delete(
        "/personalization/activity",
      );

      setActivityCount(0);

      localStorage.removeItem(
        "smartestate_buyer_visit_count",
      );

      localStorage.removeItem(
        "smartestate_first_buyer_visit_done",
      );

      sessionStorage.removeItem(
        "smartestate_suggestion_popup_shown_v2",
      );

      setMessage(
        response.data?.message ||
          "Recommendation history cleared.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not clear recommendation history.",
      );
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-300">
            <ShieldCheck size={18} />
            Privacy Controls
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Recommendation Settings
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Control how The homeasy uses your property activity
            to prepare suggestions and matching alerts.
          </p>

          <div className="mt-6 inline-flex rounded-xl bg-white/10 px-4 py-3">
            <span className="text-sm font-bold text-slate-200">
              Recorded activities:{" "}
              <strong className="text-white">
                {activityCount}
              </strong>
            </span>
          </div>
        </section>

        {message && (
          <p className="mt-6 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <LoaderCircle
              size={40}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : (
          <>
            <div className="mt-7 space-y-4">
              <ToggleRow
                icon={BrainCircuit}
                title="Personalized Recommendations"
                description="Use your views, saves, comparisons and requests to rank suitable properties."
                checked={
                  settings.personalization_enabled
                }
                onChange={(value) =>
                  updateSetting(
                    "personalization_enabled",
                    value,
                  )
                }
              />

              <ToggleRow
                icon={Mail}
                title="Email Property Alerts"
                description="Allow The homeasy to send matching property alerts to your registered email."
                checked={settings.email_alerts_enabled}
                onChange={(value) =>
                  updateSetting(
                    "email_alerts_enabled",
                    value,
                  )
                }
              />

              <ToggleRow
                icon={MessageSquareText}
                title="SMS Property Alerts"
                description="Allow matching property alerts on your registered phone number."
                checked={settings.sms_alerts_enabled}
                onChange={(value) =>
                  updateSetting(
                    "sms_alerts_enabled",
                    value,
                  )
                }
              />

              <ToggleRow
                icon={Mail}
                title="Personalized Marketing Emails"
                description="Receive selected property suggestions based on your browsing, searches, saves and comparisons."
                checked={
                  settings.marketing_emails_enabled
                }
                onChange={(value) =>
                  updateSetting(
                    "marketing_emails_enabled",
                    value,
                  )
                }
              />

              {settings.marketing_emails_enabled && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <label className="block">
                    <span className="text-sm font-black text-slate-900">
                      Marketing Email Frequency
                    </span>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Choose how often personalized property suggestions can be emailed.
                    </p>

                    <select
                      value={
                        settings.marketing_email_frequency
                      }
                      onChange={(event) =>
                        updateSetting(
                          "marketing_email_frequency",
                          event.target.value,
                        )
                      }
                      className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#0b84e5]"
                    >
                      <option value="daily">
                        Maximum once per day
                      </option>

                      <option value="three_days">
                        Maximum once every 3 days
                      </option>

                      <option value="weekly">
                        Maximum once per week
                      </option>
                    </select>
                  </label>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-3.5 text-sm font-black text-white disabled:opacity-60 sm:w-auto"
            >
              {saving ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Bell size={18} />
              )}

              Save Settings
            </button>

            <section className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
                  <Trash2 size={21} />
                </div>

                <div>
                  <h2 className="font-black text-red-900">
                    Clear Recommendation History
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-red-700">
                    This removes recorded property activity,
                    generated alerts and learned preferences.
                    Your saved properties and inquiries will not
                    be deleted.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={clearHistory}
                disabled={clearing}
                className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {clearing
                  ? "Clearing..."
                  : "Clear My History"}
              </button>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default BuyerRecommendationSettings;

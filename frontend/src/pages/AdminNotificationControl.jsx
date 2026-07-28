import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Download,
  LoaderCircle,
  Mail,
  Megaphone,
  Play,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

function StatCard({
  icon: Icon,
  title,
  value,
  description,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0b84e5]">
        <Icon size={21} />
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </article>
  );
}

function StatusBadge({ status }) {
  const normalized = String(
    status || "",
  ).toLowerCase();

  const styles = {
    sent: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
        styles[normalized] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {normalized || "unknown"}
    </span>
  );
}

function AdminNotificationControl() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [downloadingReport, setDownloadingReport] =
    useState("");
  const [
    emailAutomationEnabled,
    setEmailAutomationEnabled,
  ] = useState(true);
  const [
    updatingAutomation,
    setUpdatingAutomation,
  ] = useState(false);
  const [testRecipient, setTestRecipient] =
    useState("");
  const [sendingTest, setSendingTest] =
    useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadOverview() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/personalization/admin/notification-control",
      );

      setData(response.data);

      try {
        const automationResponse =
          await api.get(
            "/personalization/admin/notification-control/automation-status",
          );

        setEmailAutomationEnabled(
          Boolean(
            automationResponse.data
              ?.email_automation_enabled,
          ),
        );
      } catch (automationError) {
        console.error(
          "Could not load automation status:",
          automationError,
        );
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load notification control.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadEmailReport(type) {
    try {
      setDownloadingReport(type);
      setMessage("");
      setError("");

      const response = await api.get(
        "/personalization/admin/notification-control/report",
        {
          params: {
            type,
          },

          responseType: "blob",
        },
      );

      const contentDisposition =
        response.headers["content-disposition"] ||
        "";

      const fileNameMatch =
        contentDisposition.match(
          /filename="?([^"]+)"?/i,
        );

      const fileName =
        fileNameMatch?.[1] ||
        `smartestate-email-report-${type}.csv`;

      const fileUrl = URL.createObjectURL(
        response.data,
      );

      const link =
        document.createElement("a");

      link.href = fileUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(fileUrl);

      setMessage(
        "Email delivery report downloaded.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not download email report.",
      );
    } finally {
      setDownloadingReport("");
    }
  }

  async function toggleEmailAutomation() {
    try {
      setUpdatingAutomation(true);
      setMessage("");
      setError("");

      const nextValue =
        !emailAutomationEnabled;

      const response = await api.patch(
        "/personalization/admin/notification-control/automation-status",
        {
          email_automation_enabled:
            nextValue,
        },
      );

      setEmailAutomationEnabled(
        Boolean(
          response.data
            ?.email_automation_enabled,
        ),
      );

      setMessage(
        response.data?.message ||
          "Email automation updated.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not update email automation.",
      );
    } finally {
      setUpdatingAutomation(false);
    }
  }

  async function retryFailedEmails() {
    try {
      setRetrying(true);
      setMessage("");
      setError("");

      const response = await api.post(
        "/personalization/admin/notification-control/retry-failed",
      );

      const result = response.data?.result || {};
      const reset = response.data?.reset || {};

      setMessage(
        `Retried ${
          Number(reset.property_alerts || 0) +
          Number(reset.marketing || 0)
        } failed emails. Sent: ${
          Number(result.property_sent || 0) +
          Number(result.marketing_sent || 0)
        }.`,
      );

      await loadOverview();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not retry failed emails.",
      );
    } finally {
      setRetrying(false);
    }
  }

  async function runNow() {
    try {
      setRunning(true);
      setMessage("");
      setError("");

      const response = await api.post(
        "/personalization/admin/notification-control/run",
      );

      const propertyAlerts =
        response.data?.property_alerts || {};

      const marketing =
        response.data?.marketing || {};

      setMessage(
        `Property emails sent: ${
          propertyAlerts.sent || 0
        }, marketing emails sent: ${
          marketing.sent || 0
        }, new campaigns: ${
          marketing.created || 0
        }.`,
      );

      await loadOverview();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not run notification workers.",
      );
    } finally {
      setRunning(false);
    }
  }

  async function sendTestEmail(event) {
    event.preventDefault();

    const recipient = testRecipient.trim();

    if (!recipient) {
      setError(
        "Please enter an email address.",
      );
      return;
    }

    try {
      setSendingTest(true);
      setMessage("");
      setError("");

      const response = await api.post(
        "/personalization/admin/notification-control/test-email",
        {
          recipient,
        },
      );

      setMessage(
        response.data?.message ||
          "Test email sent successfully.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not send test email.",
      );
    } finally {
      setSendingTest(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const website =
    data?.website_notifications || {};

  const alerts =
    data?.property_alert_emails || {};

  const marketing =
    data?.marketing_emails || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-300">
            <Bell size={18} />
            Admin Control
          </p>

          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-black">
                Notification Control Center
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Monitor website alerts, property emails
                and personalized marketing campaigns.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadOverview}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-black text-white"
              >
                <RefreshCw
                  size={17}
                  className={
                    loading ? "animate-spin" : ""
                  }
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={retryFailedEmails}
                disabled={retrying}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
              >
                {retrying ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <RefreshCw size={17} />
                )}

                Retry Failed Emails
              </button>

              <button
                type="button"
                onClick={runNow}
                disabled={running}
                className="flex items-center gap-2 rounded-xl bg-[#0b84e5] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {running ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Play size={17} />
                )}

                Send Pending Now
              </button>
            </div>
          </div>
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-white">
                  Automatic Email Delivery
                </p>

                <p className="mt-1 text-xs text-slate-300">
                  {emailAutomationEnabled
                    ? "Property and marketing emails are being sent automatically."
                    : "Automatic emails are paused. Pending emails will remain saved."}
                </p>
              </div>

              <button
                type="button"
                onClick={toggleEmailAutomation}
                disabled={updatingAutomation}
                className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-black disabled:opacity-60 ${
                  emailAutomationEnabled
                    ? "bg-red-500 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {updatingAutomation
                  ? "Updating..."
                  : emailAutomationEnabled
                    ? "Pause Automation"
                    : "Resume Automation"}
              </button>
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
          <div className="flex min-h-96 items-center justify-center">
            <LoaderCircle
              size={42}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        ) : (
          <>
            <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                    Email Connection Test
                  </p>

                  <h2 className="mt-2 text-xl font-black text-slate-900">
                    Send a Test Email
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter an email address to confirm that
                    The homeasy email delivery is working.
                  </p>
                </div>

                <form
                  onSubmit={sendTestEmail}
                  className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl"
                >
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(event) =>
                      setTestRecipient(
                        event.target.value,
                      )
                    }
                    placeholder="Enter test email address"
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#0b84e5]"
                  />

                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                  >
                    {sendingTest ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Mail size={17} />
                    )}

                    {sendingTest
                      ? "Sending"
                      : "Send Test Email"}
                  </button>
                </form>
              </div>
            </section>

            <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                    Reports
                  </p>

                  <h2 className="mt-2 text-xl font-black text-slate-900">
                    Download Email Delivery Report
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Download email history as a CSV file
                    for Excel, records and analysis.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      downloadEmailReport("all")
                    }
                    disabled={
                      Boolean(downloadingReport)
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                  >
                    {downloadingReport === "all" ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Download size={17} />
                    )}

                    All Emails
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadEmailReport("property")
                    }
                    disabled={
                      Boolean(downloadingReport)
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-100 px-4 py-3 text-sm font-black text-blue-700 disabled:opacity-60"
                  >
                    <Download size={17} />
                    Property Alerts
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadEmailReport("marketing")
                    }
                    disabled={
                      Boolean(downloadingReport)
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-100 px-4 py-3 text-sm font-black text-violet-700 disabled:opacity-60"
                  >
                    <Download size={17} />
                    Marketing Emails
                  </button>
                </div>
              </div>
            </section>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Bell}
                title="Unread Website Alerts"
                value={website.unread || 0}
                description={`${website.total || 0} total alerts`}
              />

              <StatCard
                icon={Mail}
                title="Property Emails Sent"
                value={alerts.sent || 0}
                description={`${alerts.pending || 0} pending`}
              />

              <StatCard
                icon={Megaphone}
                title="Marketing Emails Sent"
                value={marketing.sent || 0}
                description={`${marketing.pending || 0} pending`}
              />

              <StatCard
                icon={TriangleAlert}
                title="Failed Emails"
                value={
                  Number(alerts.failed || 0) +
                  Number(marketing.failed || 0)
                }
                description="Can be retried using Send Pending Now"
              />
            </div>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-xl font-black text-slate-900">
                Recent Property Alert Emails
              </h2>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                      <th className="px-3 py-3">
                        Recipient
                      </th>
                      <th className="px-3 py-3">
                        Subject
                      </th>
                      <th className="px-3 py-3">
                        Status
                      </th>
                      <th className="px-3 py-3">
                        Sent At
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {(data?.recent_deliveries || []).map(
                      (item) => (
                        <tr
                          key={item.delivery_id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-3 py-4 font-bold text-slate-800">
                            {item.recipient}
                          </td>

                          <td className="px-3 py-4 text-slate-600">
                            {item.title}
                          </td>

                          <td className="px-3 py-4">
                            <StatusBadge
                              status={
                                item.delivery_status
                              }
                            />
                          </td>

                          <td className="px-3 py-4 text-slate-500">
                            {item.sent_at ||
                              "Not sent yet"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-xl font-black text-slate-900">
                Recent Personalized Campaigns
              </h2>

              <div className="mt-5 space-y-3">
                {(data?.recent_campaigns || []).map(
                  (campaign) => (
                    <article
                      key={campaign.campaign_id}
                      className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-black text-slate-900">
                          {campaign.subject}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {campaign.buyer_name ||
                            "Buyer"}{" "}
                          • {campaign.recipient}
                        </p>

                        <p className="mt-1 text-xs font-bold text-violet-700">
                          Activity score:{" "}
                          {campaign.activity_score || 0}
                        </p>
                      </div>

                      <StatusBadge
                        status={
                          campaign.delivery_status
                        }
                      />
                    </article>
                  ),
                )}

                {(data?.recent_campaigns || [])
                  .length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No personalized campaigns yet.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default AdminNotificationControl;

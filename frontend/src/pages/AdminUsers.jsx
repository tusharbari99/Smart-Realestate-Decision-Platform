import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Building2,
  LoaderCircle,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

import api from "../services/api";

const roleOptions = ["all", "buyer", "seller", "admin"];

function getCurrentUserId() {
  try {
    const savedUser = JSON.parse(
      localStorage.getItem("user") || "{}",
    );

    return Number(savedUser.user_id || savedUser.id);
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function AdminUsers() {
  const currentUserId = getCurrentUserId();

  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/users");

      setUsers(
        Array.isArray(response.data?.users)
          ? response.data.users
          : [],
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load users.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "all" ||
        String(user.role).toLowerCase() === roleFilter;

      const searchableText = [
        user.name,
        user.email,
        user.phone,
        user.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesRole &&
        (!keyword || searchableText.includes(keyword))
      );
    });
  }, [users, searchText, roleFilter]);

  async function toggleUserStatus(user) {
    const userId = Number(user.user_id);
    const isActive =
      user.is_active === true || Number(user.is_active) === 1;

    try {
      setUpdatingId(userId);
      setError("");
      setMessage("");

      await api.patch(`/admin/users/${userId}/active`, {
        is_active: !isActive,
      });

      setUsers((current) =>
        current.map((item) =>
          Number(item.user_id) === userId
            ? {
                ...item,
                is_active: isActive ? 0 : 1,
              }
            : item,
        ),
      );

      setMessage(
        isActive
          ? "User account deactivated."
          : "User account activated.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not update user account.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b84e5] text-white">
              <Building2 size={23} />
            </div>

            <div>
              <p className="text-lg font-black text-slate-900">
                User Management
              </p>

              <p className="text-xs font-semibold text-slate-500">
                Company Dashboard
              </p>
            </div>
          </Link>

          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
          >
            <ArrowLeft size={17} />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#0b84e5]">
              Platform Accounts
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              All Users
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage buyer, seller, and admin accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto]">
          <label className="flex items-center gap-3 rounded-xl border border-slate-300 px-4">
            <Search size={18} className="text-slate-400" />

            <input
              type="text"
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
              placeholder="Search name, email, or phone"
              className="min-h-12 w-full bg-transparent text-sm outline-none"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold capitalize text-slate-700 outline-none"
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role === "all" ? "All Roles" : role}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex min-h-80 items-center justify-center">
            <LoaderCircle
              size={38}
              className="animate-spin text-[#0b84e5]"
            />
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="mt-7 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center">
            <Users size={40} className="text-slate-400" />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              No users found
            </h2>
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => {
              const isActive =
                user.is_active === true ||
                Number(user.is_active) === 1;

              const isCurrentAdmin =
                Number(user.user_id) === currentUserId;

              return (
                <article
                  key={user.user_id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-lg font-black uppercase text-[#0b84e5]">
                      {String(user.name || "U").charAt(0)}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <h2 className="mt-4 text-lg font-black text-slate-900">
                    {user.name || "User"}
                  </h2>

                  <p className="mt-1 break-all text-sm text-slate-500">
                    {user.email}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {user.phone || "Phone not available"}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-y border-slate-100 py-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                      {user.role}
                    </span>

                    <span className="text-xs font-semibold text-slate-400">
                      Joined {formatDate(user.created_at)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={
                      updatingId === Number(user.user_id) ||
                      isCurrentAdmin
                    }
                    onClick={() => toggleUserStatus(user)}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isActive
                        ? "border border-red-300 bg-white text-red-600"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {isActive ? (
                      <UserX size={18} />
                    ) : (
                      <UserCheck size={18} />
                    )}

                    {isCurrentAdmin
                      ? "Current Admin"
                      : isActive
                        ? "Deactivate Account"
                        : "Activate Account"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminUsers;

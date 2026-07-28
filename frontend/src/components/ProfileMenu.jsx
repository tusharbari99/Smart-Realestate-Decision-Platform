import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

function getDashboardPath(role) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "seller") return "/seller/dashboard";
  return "/buyer/dashboard";
}

function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const role = user?.role || "buyer";
  const name = user?.name || "User";

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  function logout() {
    setOpen(false);

    if (onLogout) {
      onLogout();
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="Open account menu"
        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-left transition hover:bg-white/20"
      >
        <UserCircle size={19} />

        <div>
          <p className="max-w-28 truncate text-sm font-bold">
            {name}
          </p>

          <p className="text-[10px] capitalize text-blue-100">
            {role}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={`transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[100] mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
          <div className="border-b border-slate-100 p-4">
            <p className="truncate font-black text-slate-900">
              {name}
            </p>

            <p className="mt-1 text-xs capitalize text-slate-500">
              {role} account
            </p>
          </div>

          <div className="p-2">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold hover:bg-slate-100"
            >
              <UserCircle size={18} />
              My Profile
            </Link>

            <Link
              to={getDashboardPath(role)}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold hover:bg-slate-100"
            >
              <LayoutDashboard size={18} />
              My Dashboard
            </Link>

            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold hover:bg-slate-100"
            >
              <Settings size={18} />
              Account Settings
            </Link>
          </div>

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import NavPreviewLink from "./NavPreviewLink";
import BrandLogo from "./BrandLogo";
import {
  Building2,
  LogOut,
  Menu,
  Sparkles,
  UserCircle,
  X,
} from "lucide-react";

const navItems = [
  {
    label: "Buy",
    href: "/properties",
    roles: ["guest", "buyer"],
  },
  {
    label: "How It Works",
    href: "/how-it-works",
    roles: ["guest", "buyer"],
  },
  {
    label: "My Dashboard",
    href: "/buyer/dashboard",
    roles: ["buyer"],
  },
  {
    label: "AI Recommendations",
    href: "/buyer/recommendations",
    roles: ["buyer"],
  },
  
  
  {
    label: "Compare",
    href: "/compare",
    roles: ["buyer"],
  },
  {
    label: "Saved",
    href: "/buyer/saved-properties",
    roles: ["buyer"],
  },
  {
    label: "My Requests",
    href: "/buyer/requests",
    roles: ["buyer"],
  },
  {
    label: "Seller Dashboard",
    href: "/seller/dashboard",
    roles: ["seller"],
  },
  {
    label: "Company Dashboard",
    href: "/admin/dashboard",
    roles: ["admin"],
  },

];

function getNavItems(user) {
  const role = String(
    user?.role ||
      user?.user_type ||
      user?.account_type ||
      "",
  ).toLowerCase();

  return navItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
}

function getSavedUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(getSavedUser);

  const currentRole = String(
    user?.role ||
      user?.user_type ||
      user?.account_type ||
      "guest"
  ).toLowerCase();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setMenuOpen(false);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#075aa8] text-white shadow-lg">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to={
            currentRole === "seller"
              ? "/seller/home"
              : "/"
          }
          className="flex items-center gap-2"
        >
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
        {getNavItems(user).map((item) => {
          const isActive =
            location.pathname === item.href ||
            (
              item.href !== "/" &&
              location.pathname.startsWith(`${item.href}/`)
            );

          return (
            <NavPreviewLink
              key={item.label}
              item={item}
              active={isActive}
            />
          );
        })}
      </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user?.role === "seller" && (
          <Link
            to="/seller/dashboard"
            className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold transition hover:bg-white/20"
          >
            Post Property
          </Link>
        )}

          {!user ? (
            <Link
              to="/auth"
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#075aa8] transition hover:bg-blue-50"
            >
              <UserCircle size={19} />
              Login
            </Link>
          ) : (
            <>
              
<Link
              to="/profile"
              aria-label="Open profile"
              className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-4 py-2.5 backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
            >
              <UserCircle size={19} />

              <div>
                <p className="max-w-28 truncate text-sm font-bold">
                  {user.name || "User"}
                </p>

                <p className="text-[10px] capitalize text-blue-100">
                  {user.role || "buyer"}
                </p>
              </div>
            </Link>

            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setMenuOpen((current) => !current)}
          className="rounded-lg p-2 transition hover:bg-white/10 md:hidden"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-[#064f94] px-4 py-5 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1">
            {getNavItems(user).map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                {item.label}
              </a>
            ))}

            {user && (
              <div className="mt-3 rounded-xl bg-white/10 p-4">
                <p className="font-bold">{user.name || "User"}</p>

                <p className="mt-1 text-xs capitalize text-blue-100">
                  {user.role || "buyer"} account
                </p>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
              {user?.role === "seller" && (
              <Link
                to="/seller/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center rounded-lg border border-white/40 px-3 py-3 text-center text-sm font-semibold"
              >
                Post Property
              </Link>
            )}

              {!user ? (
                <Link
                  to="/auth"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-3 text-sm font-bold text-[#075aa8]"
                >
                  <UserCircle size={18} />
                  Login
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-3 text-sm font-bold text-[#075aa8]"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;

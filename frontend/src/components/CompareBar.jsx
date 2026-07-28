import { Link } from "react-router";
import { Scale, Trash2 } from "lucide-react";

import { useCompare } from "../context/CompareContext";

function CompareBar() {
  const { compareIds, clearCompare } = useCompare();

  if (compareIds.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl bg-[#032d57] p-4 text-white shadow-2xl sm:bottom-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <Scale size={22} />
          </div>

          <div>
            <p className="font-extrabold">
              {compareIds.length} of 3 properties selected
            </p>

            <p className="mt-1 text-xs text-blue-200">
              {compareIds.length < 2
                ? "Compare ke liye ek aur property select karo"
                : "Properties comparison ke liye ready hain"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearCompare}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/25 px-4 py-3 text-sm font-bold"
          >
            <Trash2 size={17} />
            Clear
          </button>

          {compareIds.length >= 2 ? (
            <Link
              to="/compare"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#075aa8] sm:flex-none"
            >
              <Scale size={18} />
              Compare Now
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="flex flex-1 items-center justify-center rounded-xl bg-white/15 px-5 py-3 text-sm font-bold text-white/60 sm:flex-none"
            >
              Select One More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompareBar;

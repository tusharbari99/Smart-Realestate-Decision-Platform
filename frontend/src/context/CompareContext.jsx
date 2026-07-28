import { createContext, useContext, useEffect, useState } from "react";

const CompareContext = createContext(null);
const STORAGE_KEY = "smartestate_compare_ids";

function readSavedIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    return Array.isArray(saved)
      ? saved.map(Number).filter(Number.isInteger).slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }) {
  const [compareIds, setCompareIds] = useState(readSavedIds);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  function isCompared(propertyId) {
    return compareIds.includes(Number(propertyId));
  }

  function addCompare(propertyId) {
    const id = Number(propertyId);

    if (!Number.isInteger(id)) {
      return {
        ok: false,
        message: "Invalid property.",
      };
    }

    if (compareIds.includes(id)) {
      return { ok: true };
    }

    if (compareIds.length >= 3) {
      return {
        ok: false,
        message: "Maximum 3 properties compare kar sakte ho.",
      };
    }

    setCompareIds((current) => [...current, id]);

    return { ok: true };
  }

  function removeCompare(propertyId) {
    const id = Number(propertyId);

    setCompareIds((current) =>
      current.filter((savedId) => savedId !== id),
    );
  }

  function toggleCompare(propertyId) {
    if (isCompared(propertyId)) {
      removeCompare(propertyId);

      return {
        ok: true,
        removed: true,
      };
    }

    return addCompare(propertyId);
  }

  function clearCompare() {
    setCompareIds([]);
  }

  return (
    <CompareContext.Provider
      value={{
        compareIds,
        isCompared,
        toggleCompare,
        removeCompare,
        clearCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);

  if (!context) {
    throw new Error("useCompare must be used inside CompareProvider.");
  }

  return context;
}

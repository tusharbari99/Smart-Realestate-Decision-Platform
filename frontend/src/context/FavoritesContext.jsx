import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const FavoritesContext = createContext(null);

function getSavedUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadFavorites() {
    const token = localStorage.getItem("token");
    const user = getSavedUser();

    const role = String(
      user?.role || user?.user_type || user?.account_type || "",
    ).toLowerCase();

    if (!token || role !== "buyer") {
      setFavoriteIds([]);
      return;
    }

    try {
      setLoading(true);

      const response = await api.get("/favorites");

      const favorites = Array.isArray(response.data)
        ? response.data
        : response.data.favorites ||
          response.data.data ||
          [];

      setFavoriteIds(
        favorites
          .map((property) =>
            Number(
              property.property_id ??
                property.id ??
                property.favorite_property_id,
            ),
          )
          .filter((id) => Number.isFinite(id)),
      );
    } catch (error) {
      console.error("Favourite loading error:", error);
      setFavoriteIds([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();

    function handleAuthChange() {
      loadFavorites();
    }

    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("focus", handleAuthChange);

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("focus", handleAuthChange);
    };
  }, []);

  function isFavorite(propertyId) {
    return favoriteIds.includes(Number(propertyId));
  }

  async function toggleFavorite(propertyId) {
    const id = Number(propertyId);
    const alreadySaved = isFavorite(id);

    if (alreadySaved) {
      setFavoriteIds((current) =>
        current.filter((savedId) => savedId !== id),
      );

      try {
        await api.delete(`/favorites/${id}`);
        return { saved: false };
      } catch (error) {
        await loadFavorites();
        throw error;
      }
    }

    setFavoriteIds((current) =>
      current.includes(id) ? current : [...current, id],
    );

    try {
      await api.post(`/favorites/${id}`);
      return { saved: true };
    } catch (error) {
      await loadFavorites();
      throw error;
    }
  }

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        loading,
        isFavorite,
        toggleFavorite,
        loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error(
      "useFavorites must be used inside FavoritesProvider.",
    );
  }

  return context;
}

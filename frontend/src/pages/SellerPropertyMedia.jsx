import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  useParams,
} from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Images,
  LoaderCircle,
  Star,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../services/api";

const API_ORIGIN = "http://localhost:5001";

function assetUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "{}",
    );
  } catch {
    return {};
  }
}

function SellerPropertyMedia() {
  const { id } = useParams();

  const [existingImages, setExistingImages] =
    useState([]);
  const [existingVideos, setExistingVideos] =
    useState([]);

  const [selectedImages, setSelectedImages] =
    useState([]);
  const [selectedVideos, setSelectedVideos] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] =
    useState(false);
  const [workingId, setWorkingId] =
    useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = getStoredUser();
  const token = localStorage.getItem("token");

  const role = String(
    user.role ||
      user.user_type ||
      user.account_type ||
      "",
  ).toLowerCase();

  const imagePreviews = useMemo(
    () =>
      selectedImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [selectedImages],
  );

  const videoPreviews = useMemo(
    () =>
      selectedVideos.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [selectedVideos],
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((item) =>
        URL.revokeObjectURL(item.url),
      );

      videoPreviews.forEach((item) =>
        URL.revokeObjectURL(item.url),
      );
    };
  }, [imagePreviews, videoPreviews]);

  async function loadMedia() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/property-media/seller/${id}`,
      );

      setExistingImages(
        response.data?.images || [],
      );

      setExistingVideos(
        response.data?.videos || [],
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not load property photos and videos.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedia();
  }, [id]);

  function chooseImages(event) {
    const files = Array.from(
      event.target.files || [],
    );

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        return false;
      }

      return file.size <= 10 * 1024 * 1024;
    });

    const remaining =
      10 - existingImages.length;

    setSelectedImages(
      validFiles.slice(0, Math.max(remaining, 0)),
    );

    setError(
      validFiles.length > remaining
        ? "A property can contain a maximum of 10 photos."
        : "",
    );
  }

  function chooseVideos(event) {
    const files = Array.from(
      event.target.files || [],
    );

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("video/")) {
        return false;
      }

      return file.size <= 120 * 1024 * 1024;
    });

    const remaining =
      3 - existingVideos.length;

    setSelectedVideos(
      validFiles.slice(0, Math.max(remaining, 0)),
    );

    setError(
      validFiles.length > remaining
        ? "A property can contain a maximum of 3 videos."
        : "",
    );
  }

  async function uploadMedia() {
    if (
      selectedImages.length === 0 &&
      selectedVideos.length === 0
    ) {
      setError(
        "Select at least one property photo or video.",
      );
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      selectedImages.forEach((file) => {
        formData.append("images", file, file.name);
      });

      selectedVideos.forEach((file) => {
        formData.append("videos", file, file.name);
      });

      const apiBase = String(
        import.meta.env.VITE_API_URL ||
          "http://localhost:5001/api",
      ).replace(/\/$/, "");

      const uploadResponse = await fetch(
        `${apiBase}/property-media/seller/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const responseData = await uploadResponse
        .json()
        .catch(() => ({}));

      if (!uploadResponse.ok) {
        throw new Error(
          responseData.message ||
            "Could not upload property media.",
        );
      }

      setSelectedImages([]);
      setSelectedVideos([]);

      setSuccess(
        responseData.message ||
          "Property photos and videos uploaded successfully.",
      );

      await loadMedia();
    } catch (requestError) {
      console.error(
        "Property media upload error:",
        requestError,
      );

      setError(
        requestError.message ||
          "Could not upload property media.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function setCover(imageId) {
    try {
      setWorkingId(`cover-${imageId}`);
      setError("");

      await api.patch(
        `/property-media/seller/${id}/images/${imageId}/primary`,
      );

      setSuccess("Cover photo updated.");
      await loadMedia();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not update cover photo.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function removeMedia(type, mediaId) {
    const confirmed = window.confirm(
      `Remove this property ${type}?`,
    );

    if (!confirmed) return;

    try {
      setWorkingId(`${type}-${mediaId}`);
      setError("");

      await api.delete(
        `/property-media/seller/${id}/${type}/${mediaId}`,
      );

      setSuccess(
        `${type === "image" ? "Photo" : "Video"} removed.`,
      );

      await loadMedia();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Could not remove property media.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  if (!token) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(
          `/seller/properties/${id}/media`,
        )}`}
        replace
      />
    );
  }

  if (role !== "seller") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/seller/dashboard"
          className="inline-flex items-center gap-2 font-bold text-[#075aa8]"
        >
          <ArrowLeft size={18} />
          Back to Seller Dashboard
        </Link>

        <section className="mt-7 rounded-3xl bg-gradient-to-br from-[#06345f] via-[#075aa8] to-[#1597e5] p-7 text-white shadow-xl sm:p-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <ImagePlus size={28} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-100">
                Property Media
              </p>

              <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                Add photos and videos
              </h1>

              <p className="mt-2 max-w-3xl text-blue-100">
                Clear photos and walkthrough videos help serious buyers
                understand the property before scheduling a visit.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-7 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-700">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <label className="cursor-pointer rounded-3xl border-2 border-dashed border-blue-200 bg-white p-8 text-center transition hover:border-blue-500">
            <Images
              size={42}
              className="mx-auto text-blue-600"
            />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              Select Property Photos
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Maximum 10 photos · Maximum 10 MB per photo
            </p>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={chooseImages}
              className="hidden"
            />
          </label>

          <label className="cursor-pointer rounded-3xl border-2 border-dashed border-violet-200 bg-white p-8 text-center transition hover:border-violet-500">
            <Video
              size={42}
              className="mx-auto text-violet-600"
            />

            <h2 className="mt-4 text-xl font-black text-slate-900">
              Select Property Videos
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Maximum 3 videos · Maximum 120 MB per video
            </p>

            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
              multiple
              onChange={chooseVideos}
              className="hidden"
            />
          </label>
        </section>

        {(imagePreviews.length > 0 ||
          videoPreviews.length > 0) && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">
              Selected Media
            </h2>

            {imagePreviews.length > 0 && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {imagePreviews.map((item) => (
                  <div
                    key={item.url}
                    className="overflow-hidden rounded-2xl border border-slate-200"
                  >
                    <img
                      src={item.url}
                      alt="Selected property"
                      className="h-40 w-full object-cover"
                    />

                    <p className="truncate p-3 text-xs font-bold text-slate-600">
                      {item.file.name}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {videoPreviews.length > 0 && (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {videoPreviews.map((item) => (
                  <div
                    key={item.url}
                    className="overflow-hidden rounded-2xl border border-slate-200"
                  >
                    <video
                      src={item.url}
                      controls
                      className="aspect-video w-full bg-black object-contain"
                    />

                    <p className="truncate p-3 text-xs font-bold text-slate-600">
                      {item.file.name}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={uploading}
              onClick={uploadMedia}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#075aa8] px-6 py-4 font-black text-white disabled:opacity-60"
            >
              {uploading ? (
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                />
              ) : (
                <Upload size={20} />
              )}

              {uploading
                ? "Uploading Media..."
                : "Upload Photos and Videos"}
            </button>
          </section>
        )}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">
            Uploaded Photos
          </h2>

          {loading ? (
            <LoaderCircle
              size={34}
              className="mt-6 animate-spin text-blue-600"
            />
          ) : existingImages.length === 0 ? (
            <p className="mt-4 text-slate-500">
              No property photos uploaded yet.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {existingImages.map((image) => (
                <div
                  key={image.image_id}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <div className="relative">
                    <img
                      src={assetUrl(image.image_url)}
                      alt="Property"
                      className="h-56 w-full object-cover"
                    />

                    {Number(image.is_primary) === 1 && (
                      <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">
                        Cover Photo
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3">
                    <button
                      type="button"
                      disabled={
                        Number(image.is_primary) === 1 ||
                        workingId ===
                          `cover-${image.image_id}`
                      }
                      onClick={() =>
                        setCover(image.image_id)
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-bold text-blue-700 disabled:opacity-40"
                    >
                      <Star size={16} />
                      Set Cover
                    </button>

                    <button
                      type="button"
                      disabled={
                        workingId ===
                        `image-${image.image_id}`
                      }
                      onClick={() =>
                        removeMedia(
                          "image",
                          image.image_id,
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-600 disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">
            Uploaded Videos
          </h2>

          {existingVideos.length === 0 ? (
            <p className="mt-4 text-slate-500">
              No property videos uploaded yet.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {existingVideos.map((video) => (
                <div
                  key={video.video_id}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <video
                    src={assetUrl(video.video_url)}
                    controls
                    preload="metadata"
                    className="aspect-video w-full bg-black object-contain"
                  />

                  <div className="flex items-center justify-between gap-3 p-4">
                    <p className="truncate text-sm font-bold text-slate-700">
                      {video.video_name ||
                        "Property walkthrough"}
                    </p>

                    <button
                      type="button"
                      disabled={
                        workingId ===
                        `video-${video.video_id}`
                      }
                      onClick={() =>
                        removeMedia(
                          "video",
                          video.video_id,
                        )
                      }
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-600"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default SellerPropertyMedia;

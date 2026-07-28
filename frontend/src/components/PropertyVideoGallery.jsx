import { useEffect, useState } from "react";
import {
  LoaderCircle,
  PlayCircle,
} from "lucide-react";

import api from "../services/api";

const API_ORIGIN = "http://localhost:5001";

function assetUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

function PropertyVideoGallery({ propertyId }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadVideos() {
      if (!propertyId) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(
          `/property-media/${propertyId}`,
        );

        if (active) {
          setVideos(response.data?.videos || []);
        }
      } catch {
        if (active) {
          setVideos([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadVideos();

    return () => {
      active = false;
    };
  }, [propertyId]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <LoaderCircle
          size={28}
          className="animate-spin text-blue-600"
        />
      </section>
    );
  }

  if (!videos.length) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <PlayCircle size={26} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-600">
              Property Walkthrough
            </p>

            <h2 className="text-2xl font-black text-slate-900">
              Photos come alive through video
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {videos.map((video) => (
            <div
              key={video.video_id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950"
            >
              <video
                src={assetUrl(video.video_url)}
                controls
                preload="metadata"
                playsInline
                className="aspect-video w-full object-contain"
              />

              <p className="bg-white px-4 py-3 text-sm font-bold text-slate-700">
                {video.video_name ||
                  "Property walkthrough video"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PropertyVideoGallery;

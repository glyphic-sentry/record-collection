// frontend/src/views/GalleryView.jsx
import React, { useMemo, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
const src =
  album?.cover_image ||
  (album?.id ? `/cover/${album.id}` : "/static/fallback.jpg");


function RecordCard({ album, onClick }) {
  const src = album?.cover_image || "/static/fallback.jpg";
  return (
    <button
      type="button"
      onClick={() => onClick?.(album)}
      style={{ padding: 8, cursor: "pointer", background: "transparent", border: "none" }}
      aria-label={`Open details for ${album?.artist ?? ""} – ${album?.title ?? ""}`}
    >
      <figure style={{ margin: 0, width: "100%" }}>
        <img
          src={src}
          alt={`${album?.title ?? "Record"} cover`}
          onError={(e) => { e.currentTarget.src = "/static/fallback.jpg"; }}
          style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 }}
          loading="lazy"
        />
        <figcaption style={{ marginTop: 8 }}>
          <div style={{
            fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
          }}>
            {album?.title ?? album?.name ?? "(untitled)"}
          </div>
          <div style={{
            opacity: 0.7, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
          }}>
            {album?.artist ?? album?.artists?.[0]?.name ?? ""}
          </div>
        </figcaption>
      </figure>
    </button>
  );
}

function Modal({ album, onClose }) {
  if (!album) return null;
  const discogsUrl = album?.id ? `https://www.discogs.com/release/${album.id}` : null;
  const cover = album?.cover_image || "/static/fallback.jpg";
  const back = album?.back_image || album?.back_thumb || null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "grid", placeItems: "center", zIndex: 1000, padding: 16
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(100%, 960px)", background: "#111", color: "#fff",
          borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: back ? "1fr 1fr" : "1fr", gap: 8 }}>
          <img src={cover} alt="front cover" style={{ width: "100%", objectFit: "cover" }} />
          {back && <img src={back} alt="back cover" style={{ width: "100%", objectFit: "cover" }} />}
        </div>

        <div style={{ padding: 16, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <h3 style={{ margin: 0 }}>{album.title}</h3>
              <div style={{ opacity: 0.8 }}>{album.artist}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                {[album.year, album.label, album.format, album.genre].filter(Boolean).join(" • ")}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {discogsUrl && (
                <a href={discogsUrl} target="_blank" rel="noreferrer" style={{ color: "#9ae6b4" }}>
                  View on Discogs ↗
                </a>
              )}
              <button onClick={onClose} style={{ color: "#ddd", background: "transparent", border: "1px solid #555", borderRadius: 8, padding: "6px 10px" }}>
                Close
              </button>
            </div>
          </div>

          {Array.isArray(album.tracklist) && album.tracklist.length > 0 && (
            <div>
              <h4 style={{ margin: "12px 0 6px" }}>Tracklist</h4>
              <ol style={{ margin: 0, paddingLeft: 18, columns: 2, columnGap: 24 }}>
                {album.tracklist.map((t, i) => <li key={i} style={{ marginBottom: 4 }}>{t}</li>)}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GalleryView({ items = [] }) {
  const [selected, setSelected] = useState(null);

  const settings = useMemo(() => ({
    dots: false,
    arrows: true,
    infinite: false,
    speed: 300,
    slidesToShow: 6,
    slidesToScroll: 6,
    responsive: [
      { breakpoint: 1536, settings: { slidesToShow: 5, slidesToScroll: 5 } },
      { breakpoint: 1280, settings: { slidesToShow: 4, slidesToScroll: 4 } },
      { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3 } },
      { breakpoint: 640,  settings: { slidesToShow: 2, slidesToScroll: 2 } },
      { breakpoint: 420,  settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  }), []);

  return (
    <div className="gallery-slider" style={{ padding: 16 }}>
      <Slider {...settings}>
        {items.map((album) => (
          <RecordCard key={album.id ?? album.title} album={album} onClick={setSelected} />
        ))}
      </Slider>

      <Modal album={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

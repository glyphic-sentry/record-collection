// frontend/src/views/GalleryView.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function resolveImg(album) {
  if (!album) return "/static/fallback.jpg";
  if (album.cover_image) return album.cover_image;
  if (album.id) return `/cover/${album.id}`; // self-healing endpoint
  return "/static/fallback.jpg";
}

function RecordCard({ album, onOpen, dragging }) {
  const src = resolveImg(album);
  const title = album?.title ?? album?.name ?? "(untitled)";
  const artist = album?.artist ?? album?.artists?.[0]?.name ?? "";

  const handleClick = useCallback(() => {
    if (dragging) return; // ignore click immediately after a drag
    onOpen?.(album);
  }, [dragging, onOpen, album]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="gallery-card"
      style={{
        padding: 8,
        cursor: "pointer",
        background: "transparent",
        border: "none",
        width: "100%",
      }}
      aria-label={`Open details for ${artist} – ${title}`}
    >
      <figure style={{ margin: 0, width: "100%" }}>
        <img
          src={src}
          alt={`${title} cover`}
          onError={(e) => { e.currentTarget.src = "/static/fallback.jpg"; }}
          style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 }}
          loading="lazy"
        />
        <figcaption style={{ marginTop: 8 }}>
          <div
            style={{
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={title}
          >
            {title}
          </div>
          <div
            style={{
              opacity: 0.7,
              fontSize: 12,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={artist}
          >
            {artist}
          </div>
        </figcaption>
      </figure>
    </button>
  );
}

function Modal({ album, onClose }) {
  if (!album) return null;

  const discogsUrl = album?.id ? `https://www.discogs.com/release/${album.id}` : null;
  const cover = album?.cover_image || (album?.id ? `/cover/${album.id}` : "/static/fallback.jpg");
  const back = album?.back_image || album?.back_thumb || (album?.id ? `/back/${album.id}` : null);
  const metaBits = [
    album?.year,
    album?.label,
    album?.format,
    Array.isArray(album?.genre) ? album.genre.join(", ") : album?.genre,
  ].filter(Boolean);

  // Esc to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);

import React, { useEffect, useState } from "react";

export default function GalleryView() {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAlbums(data);
        }
      })
      .catch((err) => {
        console.error("Error fetching album collection:", err);
      });
  }, []);

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-screen bg-gray-900 text-white">
      {albums.map((album) => (
        <div key={album.id} className="flex flex-col items-center">
          <img
  src={album.cover_image}
  alt={album.title}
  className="w-48 rounded shadow"
  onError={(e) => {
    // Prevent infinite loop by checking current src
    const fallbackSrc = album.thumb || "/fallback.jpg";
    if (e.target.src.endsWith(album.cover_image) || e.target.src.includes("/images/")) {
      e.target.src = fallbackSrc;
    } else {
      e.target.onerror = null; // disable further fallback
      e.target.src = "/fallback.jpg"; // final fallback
    }
  }}
/>

          <p className="mt-2 text-center text-sm">{album.title}</p>
        </div>
      ))}
    </div>
  );
}

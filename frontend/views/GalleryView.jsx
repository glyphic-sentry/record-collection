import React, { useEffect, useState } from "react";
import AlbumCard from "../components/AlbumCard";
import { useLocation, useNavigate } from "react-router-dom";

export default function GalleryView() {
  const [albums, setAlbums] = useState([]);
  const [order, setOrder] = useState(localStorage.getItem("order") || "recent");
  const [genreFilter, setGenreFilter] = useState(localStorage.getItem("genre") || "");
  const [formatFilter, setFormatFilter] = useState(localStorage.getItem("format") || "");
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const filtered = data.filter((album) => {
          const genreMatch = genreFilter ? album.genre === genreFilter : true;
          const formatMatch = formatFilter ? album.format === formatFilter : true;
          return genreMatch && formatMatch;
        });

        const sorted = filtered.sort((a, b) => {
          if (order === "recent") {
            return new Date(b.date_added) - new Date(a.date_added);
          } else {
            return a.title.localeCompare(b.title);
          }
        });

        setAlbums(sorted);
      });
  }, [order, genreFilter, formatFilter, location.key]);

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-4">
        <select value={order} onChange={(e) => {
          setOrder(e.target.value);
          localStorage.setItem("order", e.target.value);
        }}>
          <option value="recent">Recent</option>
          <option value="alpha">Alphabetical</option>
        </select>

        <select value={genreFilter} onChange={(e) => {
          setGenreFilter(e.target.value);
          localStorage.setItem("genre", e.target.value);
        }}>
          <option value="">All Genres</option>
          {[...new Set(albums.map(a => a.genre))].map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select value={formatFilter} onChange={(e) => {
          setFormatFilter(e.target.value);
          localStorage.setItem("format", e.target.value);
        }}>
          <option value="">All Formats</option>
          {[...new Set(albums.map(a => a.format))].map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto flex gap-4 py-4">
        {albums.map(album => (
          <div key={album.id} className="min-w-[150px] max-w-[200px]">
            <img
              src={album.cover_image}
              alt={album.title}
              className="rounded shadow"
              onError={(e) => {
                if (album.thumb) {
                  e.target.src = album.thumb;
                } else {
                  e.target.src = "/fallback.jpg";
                }
              }}
              onClick={() => setSelectedAlbum(album)}
            />
          </div>
        ))}
      </div>

      {selectedAlbum && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded max-w-md w-full relative">
            <button onClick={() => setSelectedAlbum(null)} className="absolute top-2 right-2">✖</button>
            <h2 className="text-xl font-bold mb-2">{selectedAlbum.title}</h2>
            <p>{selectedAlbum.artist}</p>
            <p>{selectedAlbum.year}</p>
            <p>{selectedAlbum.label}</p>
            <p>{selectedAlbum.format}</p>
            <p>{selectedAlbum.genre}</p>
          </div>
        </div>
      )}
    </div>
  );
}

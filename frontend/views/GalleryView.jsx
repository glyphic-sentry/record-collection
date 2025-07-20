import React, { useEffect, useState, useRef } from "react";

export default function GalleryView() {
  const [albums, setAlbums] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [search, setSearch] = useState("");
  const binRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch albums
  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = data.sort((a, b) =>
            new Date(b.date_added) - new Date(a.date_added)
          );
          setAlbums(sorted);
          setFilteredAlbums(sorted);
        }
      });
  }, []);

  // Filter albums by search
  useEffect(() => {
    const query = search.toLowerCase();
    setFilteredAlbums(
      albums.filter((a) =>
        `${a.title} ${a.artist}`.toLowerCase().includes(query)
      )
    );
    setCurrentIndex(0);
  }, [search, albums]);

  // Handle keyboard nav
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") {
        setCurrentIndex((i) => Math.min(i + 1, filteredAlbums.length - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        setSelectedAlbum(filteredAlbums[currentIndex]);
      } else if (e.key === "Escape") {
        setSelectedAlbum(null);
      } else if (e.key === "t") {
        toggleTheme();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filteredAlbums, currentIndex]);

  // Scroll active album into view
  useEffect(() => {
    if (binRef.current && binRef.current.children[currentIndex]) {
      binRef.current.children[currentIndex].scrollIntoView({
        behavior: "smooth",
        inline: "center",
      });
    }
  }, [currentIndex]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className={`${theme} min-h-screen transition-colors duration-300`}>
      <div className="bg-white dark:bg-gray-900 text-black dark:text-white min-h-screen p-4">
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Search albums..."
            className="w-full md:w-1/2 p-2 rounded border dark:bg-gray-800 dark:border-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={toggleTheme}
            className="ml-4 px-3 py-2 rounded bg-gray-200 dark:bg-gray-800 dark:text-white text-sm"
          >
            Toggle {theme === "dark" ? "Light" : "Dark"} Mode
          </button>
        </div>

        <div
          className="flex overflow-x-auto space-x-4 snap-x pb-4"
          ref={binRef}
        >
          {filteredAlbums.map((album, i) => (
            <div
              key={album.id}
              className={`flex-shrink-0 snap-center w-48 text-center transition-transform duration-300 ${
                i === currentIndex ? "scale-105" : "opacity-70"
              }`}
            >
              <img
                src={album.cover_image}
                alt={album.title}
                className="rounded shadow-lg w-full cursor-pointer"
                onClick={() => setSelectedAlbum(album)}
                onError={(e) => {
                  if (!e.target.src.endsWith("/fallback.jpg")) {
                    e.target.src = "/fallback.jpg";
                  } else {
                    e.target.onerror = null;
                  }
                }}
              />
              <p className="mt-2 text-sm font-semibold truncate">
                {album.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {album.artist}
              </p>
            </div>
          ))}
        </div>

        {selectedAlbum && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 text-black dark:text-white p-6 rounded max-w-md w-full relative">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="absolute top-2 right-2 text-xl"
              >
                ✖
              </button>
              <img
                src={selectedAlbum.cover_image}
                className="w-full mb-4 rounded"
                alt={selectedAlbum.title}
              />
              <h2 className="text-lg font-bold mb-1">{selectedAlbum.title}</h2>
              <p className="mb-1">{selectedAlbum.artist}</p>
              <p className="mb-1 text-sm">{selectedAlbum.year}</p>
              <p className="mb-1 text-sm">{selectedAlbum.label}</p>
              <p className="mb-1 text-sm">{selectedAlbum.format}</p>
              <p className="mb-1 text-sm">{selectedAlbum.genre}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

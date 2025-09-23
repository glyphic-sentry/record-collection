// frontend/src/views/GalleryView.jsx
import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function GalleryView() {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("recent");
  const [isDark, setIsDark] = useState(true);
  const [slidesToShow, setSlidesToShow] = useState(4);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const sliderRef = useRef(null);

  // Load album collection
  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  // Adjust number of slides based on screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const slides = Math.max(1, Math.min(Math.floor(width / 250), 6));
      setSlidesToShow(slides);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sort albums by title or date
  const sorted = [...albums].sort((a, b) => {
    if (sort === "alphabetical") {
      return a.title.localeCompare(b.title);
    }
    return new Date(b.date_added || 0) - new Date(a.date_added || 0);
  });

  // Filter albums by search term and genre
  const filtered = sorted.filter((album) => {
    const searchLower = search.trim().toLowerCase();
    const matchTerm =
      !searchLower ||
      album.title?.toLowerCase().includes(searchLower) ||
      album.artist?.toLowerCase().includes(searchLower) ||
      album.tracklist?.some((t) =>
        (typeof t === "string" ? t : t.title).toLowerCase().includes(searchLower)
      );
    const matchGenre = !genre || album.genre === genre;
    return matchTerm && matchGenre;
  });

  // Slider configuration
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow,
    slidesToScroll: 1,
    arrows: true,
    swipe: true,
    swipeToSlide: true,
  };

  // Modal handlers
  const openModal = (album) => setSelectedAlbum(album);
  const closeModal = () => setSelectedAlbum(null);

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      {/* Filter controls */}
      <div className="flex flex-wrap gap-2 justify-between items-center px-4 py-2">
        <input
          className="border rounded px-2 py-1 text-black w-full sm:w-1/3"
          placeholder="Search albums or tracks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-2 py-1 text-black"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">All genres</option>
          {[...new Set(albums.map((a) => a.genre).filter(Boolean))].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1 text-black"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="recent">Recent</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
        <button
          onClick={() => setIsDark(!isDark)}
          className="border rounded px-2 py-1"
        >
          Toggle {isDark ? "Light" : "Dark"} Mode
        </button>
      </div>

      {/* Carousel */}
      <div className="flex-grow flex justify-center items-center px-4 pb-4">
        <div className="w-full max-w-screen-lg overflow-visible">
          <Slider ref={sliderRef} {...settings}>
            {filtered.map((album) => (
              <div
                key={album.id}
                className="cursor-pointer flex flex-col items-center justify-center p-2"
                onClick={() => openModal(album)}
              >
                <div className="relative w-full h-72 md:h-60 sm:h-48 rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={album.cover_image || album.thumb}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-center mt-2 text-base font-medium w-full truncate">
                  {album.title}
                </p>
                <p className="text-center text-sm text-gray-400 w-full truncate">
                  {album.artist}
                </p>
              </div>
            ))}
          </Slider>
        </div>
      </div>

      {/* Modal for album details */}
      {selectedAlbum && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className={`relative max-w-xl w-full p-4 rounded-lg shadow-lg ${
              isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-lg font-bold text-gray-400 hover:text-gray-200"
            >
              ×
            </button>
            {/* Show back image if present, otherwise fallback to cover */}
            <img
              src={
                selectedAlbum.back_image ||
                selectedAlbum.cover_image ||
                selectedAlbum.back_thumb ||
                selectedAlbum.thumb
              }
              alt={selectedAlbum.title}
              className="w-full h-auto max-h-[60vh] object-contain rounded-md mb-4"
            />
            <h2 className="text-xl font-semibold">{selectedAlbum.title}</h2>
            <p className="text-lg">{selectedAlbum.artist}</p>
            <p className="text-sm text-gray-400">
              {[selectedAlbum.year, selectedAlbum.genre].filter(Boolean).join(" • ")}
            </p>
            {Array.isArray(selectedAlbum.tracklist) && selectedAlbum.tracklist.length > 0 && (
              <>
                <h3 className="mt-4 font-bold">Tracklist</h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedAlbum.tracklist.map((track, idx) => (
                    <li key={idx}>
                      {typeof track === "string" ? track : track.title}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {selectedAlbum.date_added && (
              <p className="mt-4 text-xs text-gray-500">
                Added:{" "}
                {new Date(selectedAlbum.date_added).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GalleryView;

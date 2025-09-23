// frontend/src/views/GalleryView.jsx
import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function GalleryView() {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("recent");
  const [isDark, setIsDark] = useState(true);
  const [slidesToShow, setSlidesToShow] = useState(3);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const sliderRef = useRef(null);

  // Fetch the collection on mount
  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  // Dynamically adjust the number of slides based on window width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Show fewer slides on narrow screens
      const slides = width < 640
        ? 1
        : width < 1024
        ? 2
        : 3;
      setSlidesToShow(slides);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sort albums by the selected option
  const sorted = [...albums].sort((a, b) => {
    if (sort === "alphabetical") {
      return a.title.localeCompare(b.title);
    }
    // Default: most recent first
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
    infinite: filtered.length > slidesToShow,
    speed: 500,
    slidesToShow,
    slidesToScroll: 1,
    arrows: true,
    swipe: true,
    adaptiveHeight: true,
    centerMode: true,
    centerPadding: "0px",
  };

  // Modal control functions
  const openModal = (album) => setSelectedAlbum(album);
  const closeModal = () => setSelectedAlbum(null);

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      {/* Controls for search, genre, sorting, and dark mode */}
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

      {/* Carousel container: centers the slider and prevents arrows from being cut off */}
      <div className="flex-grow flex justify-center items-center px-4 pb-4">
        <div className="w-full max-w-screen-lg overflow-visible">
          <Slider ref={sliderRef} {...settings}>
            {filtered.map((album) => (
              <div
                key={album.id}
                className="p-2 flex flex-col items-center cursor-pointer"
                onClick={() => openModal(album)}
              >
                {/* Give the slide a fixed height so the image can display */}
                <div className="w-full h-48 sm:h-64 md:h-[50vh]">
                  <img
                    src={album.cover_image || album.thumb}
                    alt={album.title}
                    className="w-full h-full object-contain rounded-xl shadow-lg"
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

      {/* Modal dialog for album details */}
      {selectedAlbum && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className={`relative max-w-xl w-full p-4 rounded-lg shadow-lg ${
              isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-lg font-bold text-gray-400 hover:text-gray-200"
            >
              ×
            </button>
            {/* Full-size cover image */}
            <img
              src={selectedAlbum.cover_image || selectedAlbum.thumb}
              alt={selectedAlbum.title}
              className="w-full h-auto max-h-[60vh] object-contain rounded-md mb-4"
            />
            {/* Album information */}
            <h2 className="text-xl font-semibold">{selectedAlbum.title}</h2>
            <p className="text-lg">{selectedAlbum.artist}</p>
            <p className="text-sm text-gray-400">
              {[selectedAlbum.year, selectedAlbum.genre]
                .filter(Boolean)
                .join(" • ")}
            </p>
            {/* Tracklist */}
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
            {/* Date added */}
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

import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../src/index.css";

/*
 * GalleryView renders a carousel of album art.  This implementation
 * addresses several usability and styling issues from the original component:
 *
 *  1. The original component wrapped each record cover in a solid background
 *     (white in light mode and dark grey in dark mode).  Because the Slick
 *     carousel cell can be wider than the image, this background produced a
 *     visible bar on the right side of each cover.  We replaced the wrapper
 *     with a full‑width card that uses a subtle gradient.  The card scales
 *     with the slide and gives the cover art a modern look while eliminating
 *     any visible gaps.  The album art itself is rendered with
 *     `object-contain` so it preserves its original aspect ratio.
 *  2. Slick‑carousel positions its navigation arrows absolutely relative to the
 *     slider container.  The parent wrapper used `overflow-hidden`, which
 *     clipped the arrows and made them hard to click.  Switching to
 *     `overflow-visible` allows the arrows to protrude past the container
 *     edges without being cut off.
 *  3. A custom mouse‑wheel handler translates vertical scroll into horizontal
 *     carousel navigation, preventing the page from scrolling while browsing
 *     the gallery.
 */

export default function GalleryView() {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [sort, setSort] = useState("recent");
  const [modalAlbum, setModalAlbum] = useState(null);
  const sliderRef = useRef(null);

  // Fetch the collection on mount
  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  // Sort albums based on the selected mode
  const sortedAlbums = [...albums].sort((a, b) => {
    if (sort === "alphabetical") {
      const artistCompare = a.artist.localeCompare(b.artist);
      if (artistCompare !== 0) return artistCompare;
      return a.title.localeCompare(b.title);
    }
    return new Date(b.date_added) - new Date(a.date_added);
  });

  // Filter albums by search and genre
  const filtered = sortedAlbums.filter((album) => {
    const matchSearch =
      album.title.toLowerCase().includes(search.toLowerCase()) ||
      album.artist.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "" || album.genre === genre;
    return matchSearch && matchGenre;
  });

  // Unique genres for the filter dropdown
  const genres = [...new Set(albums.map((a) => a.genre).filter(Boolean))];

  // Card background gradient depending on light/dark mode
  const cardBgClass = isDark
    ? "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900"
    : "bg-gradient-to-br from-white via-gray-100 to-gray-200";

  // Convert vertical scroll to horizontal slide navigation
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      sliderRef.current?.slickPrev();
    } else {
      sliderRef.current?.slickNext();
    }
  };

  // Slick carousel settings
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    swipe: true,
    swipeToSlide: true,
    centerMode: false,
    centerPadding: "0",
    waitForAnimate: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  // Close modal on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target.id === "modal-backdrop") {
      setModalAlbum(null);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-center ${
        isDark
          ? "bg-gradient-to-b from-black via-gray-900 to-black text-white"
          : "bg-gradient-to-b from-white via-gray-100 to-white text-black"
      }`}
    >
      {/* Controls for search, genre filter, sort mode and dark/light toggle */}
      <div className="flex flex-wrap gap-2 justify-between items-center px-4 py-2">
        <label htmlFor="search" className="sr-only">
          Search albums
        </label>
        <input
          id="search"
          className="border rounded px-2 py-1 text-black w-1/3"
          placeholder="Search albums..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <label htmlFor="genre" className="sr-only">
          Filter by genre
        </label>
        <select
          id="genre"
          className="border rounded px-2 py-1 text-black"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <label htmlFor="sort" className="sr-only">
          Sort albums
        </label>
        <select
          id="sort"
          className="border rounded px-2 py-1 text-black"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="recent">Recent</option>
          <option value="alphabetical">Alphabetical</option>
        </select>

        <button
          className="border rounded px-2 py-1"
          onClick={() => setIsDark(!isDark)}
        >
          Toggle {isDark ? "Light" : "Dark"} Mode
        </button>
      </div>

      {/* Carousel container: overflow-visible allows arrows to extend */}
      <div className="flex-grow flex items-center justify-center px-4 pt-4 overflow-visible">
        <Slider
          ref={sliderRef}
          {...settings}
          className="overflow-visible w-full"
          onWheel={handleWheel}
        >
          {filtered.map((album) => (
            <div
              key={album.id}
              className="px-2 cursor-pointer focus:outline-none flex flex-col items-center justify-center"
              onClick={() => setModalAlbum(album)}
            >
              {/* Modern card for the album art: large, responsive, gradient background */}
              <div
                className={`relative w-full h-72 rounded-xl overflow-hidden shadow-lg transform transition duration-300 hover:-translate-y-1 hover:scale-105 ${cardBgClass}`}
              >
                <img
                  src={album.cover_image}
                  alt={album.title}
                  className="w-full h-full object-contain"
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

      {/* Detail modal overlay */}
      {modalAlbum && (
        <div
          id="modal-backdrop"
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-300 animate-fadeIn"
        >
          <div className="bg-white text-black rounded p-4 max-w-md w-full relative overflow-y-auto max-h-[90vh] shadow-xl">
            <button
              className="absolute top-2 right-2 text-xl"
              onClick={() => setModalAlbum(null)}
              aria-label="Close modal"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-2">{modalAlbum.title}</h2>
            <p>
              <strong>Artist:</strong> {modalAlbum.artist}
            </p>
            <p>
              <strong>Year:</strong> {modalAlbum.year}
            </p>
            <p>
              <strong>Genre:</strong> {modalAlbum.genre}
            </p>
            <p>
              <strong>Label:</strong> {modalAlbum.label}
            </p>
            <p>
              <strong>Format:</strong> {modalAlbum.format}
            </p>
            <p>
              <strong>Date Added:</strong>{" "}
              {new Date(modalAlbum.date_added).toLocaleDateString()}
            </p>
            {modalAlbum.tracklist && modalAlbum.tracklist.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold">Tracklist:</p>
                <ul className="list-disc ml-5">
                  {modalAlbum.tracklist.map((track, i) => (
                    <li key={i}>{track.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

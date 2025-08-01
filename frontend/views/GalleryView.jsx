import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../src/index.css";

/*
 * GalleryView renders a carousel of album art.  This implementation
 * addresses a few usability and styling bugs present in the original
 * component:
 *
 *  1. The previous version wrapped each record cover in a div with a
 *     white background.  On dark mode this created an obvious white
 *     border on the right-hand side of every cover, which looked like
 *     extra whitespace.  The container around the image now uses a
 *     conditional background (dark grey when the theme is dark and
 *     white when the theme is light) so there is no stark contrast.
 *  2. Slick‑carousel positions its navigation arrows absolutely
 *     relative to the slider container.  The parent wrapper used
 *     `overflow-hidden`, which clipped the arrows and made them hard to
 *     click.  Swapping this for `overflow-visible` allows the arrows
 *     to protrude past the container edges without being cut off.
 *  3. Scrolling through the gallery with a mouse wheel previously
 *     scrolled the entire page.  A custom `handleWheel` handler has
 *     been added to translate vertical wheel events into horizontal
 *     carousel navigation.  This makes browsing the gallery feel
 *     natural and fixes the unpleasant scrolling behaviour reported by
 *     users.
 */

export default function GalleryView() {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [sort, setSort] = useState("recent");
  const [modalAlbum, setModalAlbum] = useState(null);
  // We no longer paginate the album list; all albums are passed to the
  // carousel.  Removing visibleCount prevents the slider from looping
  // prematurely once a small subset of items has been displayed.
  const sliderRef = useRef(null);

  // Fetch the collection once on mount
  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  // Sort albums based on the selected sort mode
  const sortedAlbums = [...albums].sort((a, b) => {
    if (sort === "alphabetical") {
      const artistCompare = a.artist.localeCompare(b.artist);
      if (artistCompare !== 0) return artistCompare;
      return a.title.localeCompare(b.title);
    }
    return new Date(b.date_added) - new Date(a.date_added);
  });

  // Filter albums based on the search and genre filters.  The
  // resulting list is passed directly to the carousel; we do not
  // limit the number of visible items so that all albums can be
  // browsed without restarting from the beginning.
  const filtered = sortedAlbums.filter((album) => {
    const matchSearch =
      album.title.toLowerCase().includes(search.toLowerCase()) ||
      album.artist.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "" || album.genre === genre;
    return matchSearch && matchGenre;
  });

  // Compute the list of unique genres for the filter dropdown
  const genres = [...new Set(albums.map((a) => a.genre).filter(Boolean))];

  /**
   * Translate vertical mouse wheel movement into horizontal carousel
   * navigation.  When the user scrolls up we move backwards, and
   * scrolling down moves forwards.  Calling `preventDefault()` stops
   * the page itself from scrolling and keeps focus on the gallery.
   */
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      sliderRef.current?.slickPrev();
    } else {
      sliderRef.current?.slickNext();
    }
  };

  // Slick carousel settings.  Centre mode has been disabled to
  // eliminate excess padding that showed up as white space on the
  // right-hand side of the covers.  All other behaviour matches the
  // original implementation.
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

  // Close modal when clicking outside of it
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

        <button className="border rounded px-2 py-1" onClick={() => setIsDark(!isDark)}>
          Toggle {isDark ? "Light" : "Dark"} Mode
        </button>
      </div>

      {/* The outer wrapper previously used `overflow-hidden` which clipped the carousel arrows.
          Switching to `overflow-visible` allows the arrows to extend beyond the container boundaries. */}
      <div className="flex-grow flex items-center justify-center px-4 pt-4 overflow-visible">
        <Slider ref={sliderRef} {...settings} className="overflow-visible w-full" onWheel={handleWheel}>
          {filtered.map((album) => (
            <div
              key={album.id}
              className="px-2 cursor-pointer focus:outline-none flex flex-col items-center justify-center"
              onClick={() => setModalAlbum(album)}
            >
              <div
                className={`${
                  isDark ? "bg-gray-800" : "bg-white"
                } rounded-xl overflow-hidden shadow-lg transform transition duration-300 hover:scale-105`}
              >
                <img src={album.cover_image} alt={album.title} className="h-64 w-64 object-cover" />
              </div>
              <p className="text-center mt-2 text-base font-medium w-full truncate">{album.title}</p>
              <p className="text-center text-sm text-gray-400 w-full truncate">{album.artist}</p>
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
              <strong>Date Added:</strong> {new Date(modalAlbum.date_added).toLocaleDateString()}
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

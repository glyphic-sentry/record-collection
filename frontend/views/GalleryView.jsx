import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../src/index.css";

export default function GalleryView() {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [sort, setSort] = useState("recent");
  const [modalAlbum, setModalAlbum] = useState(null);
  const sliderRef = useRef(null);
  const dragStartXRef = useRef(null);
  const draggingRef = useRef(false);
  const [slidesToShow, setSlidesToShow] = useState(4);

  // Fetch albums on mount
  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  // Dynamically adjust slidesToShow based on window width
  useEffect(() => {
    const updateSlides = () => {
      const width = window.innerWidth;
      let slides = Math.floor(width / 250);
      slides = Math.max(1, Math.min(slides, 6));
      setSlidesToShow(slides);
    };
    updateSlides();
    window.addEventListener("resize", updateSlides);
    return () => window.removeEventListener("resize", updateSlides);
  }, []);

  // Sort and filter albums
  const sorted = [...albums].sort((a, b) => {
    if (sort === "alphabetical") {
      const c = a.artist.localeCompare(b.artist);
      return c !== 0 ? c : a.title.localeCompare(b.title);
    }
    return new Date(b.date_added) - new Date(a.date_added);
  });
  const filtered = sorted.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.artist.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "" || a.genre === genre;
    return matchSearch && matchGenre;
  });

  const genres = [...new Set(albums.map((a) => a.genre).filter(Boolean))];

  // Theme styling
  const cardBgClass = isDark
    ? "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900"
    : "bg-gradient-to-br from-white via-gray-100 to-gray-200";
  const arrowBase = isDark ? "text-white" : "text-black";
  const arrowHover = isDark ? "hover:text-gray-400" : "hover:text-gray-600";

  // Convert vertical scroll to horizontal navigation
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) sliderRef.current?.slickPrev();
    else sliderRef.current?.slickNext();
  };

  // Slick settings using dynamic slidesToShow
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow,
    slidesToScroll: 1,
    arrows: false,
    swipe: true,
    swipeToSlide: true,
    centerMode: false,
    centerPadding: "0",
    waitForAnimate: false,
  };

  // Modal close handler
  const handleBackdropClick = (e) => {
    if (e.target.id === "modal-backdrop") setModalAlbum(null);
  };

  return (
    <div
      className={`min-h-full flex flex-col ${
        isDark
          ? "bg-gradient-to-b from-black via-gray-900 to-black text-white"
          : "bg-gradient-to-b from-white via-gray-100 to-white text-black"
      }`}
    >
      {/* Search and filter controls */}
      <div className="flex flex-wrap gap-2 justify-between items-center px-4 py-2">
        <input
          id="search"
          className="border rounded px-2 py-1 text-black w-1/3"
          placeholder="Search albums..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

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

      {/* Carousel wrapper with spacing (pt-4) */}
      <div
        className="flex-grow flex items-center justify-center px-4 pt-4 overflow-hidden"
        onWheel={handleWheel}
      >
        {/* Centered slider container */}
        <div className="relative w-full max-w-screen-xl mx-auto">
          {/* Custom navigation arrows */}
          <button
            type="button"
            className={`absolute top-1/2 -translate-y-1/2 left-2 z-10 text-3xl ${arrowBase} ${arrowHover}`}
            onClick={() => sliderRef.current?.slickPrev()}
            aria-label="Previous"
          >
            ❮
          </button>
          <button
            type="button"
            className={`absolute top-1/2 -translate-y-1/2 right-2 z-10 text-3xl ${arrowBase} ${arrowHover}`}
            onClick={() => sliderRef.current?.slickNext()}
            aria-label="Next"
          >
            ❯
          </button>

          <Slider ref={sliderRef} {...settings} className="overflow-hidden w-full">
            {filtered.map((album) => (
              <div
                key={album.id}
                className="cursor-pointer select-none focus:outline-none flex flex-col items-center justify-center"
                onMouseDown={(e) => {
                  dragStartXRef.current = e.clientX;
                  draggingRef.current = false;
                }}
                onMouseMove={(e) => {
                  if (
                    dragStartXRef.current !== null &&
                    Math.abs(e.clientX - dragStartXRef.current) > 5
                  ) {
                    draggingRef.current = true;
                  }
                }}
                onMouseUp={() => {
                  if (!draggingRef.current) setModalAlbum(album);
                  dragStartXRef.current = null;
                  draggingRef.current = false;
                }}
                onTouchStart={(e) => {
                  dragStartXRef.current = e.touches[0].clientX;
                  draggingRef.current = false;
                }}
                onTouchMove={(e) => {
                  if (
                    dragStartXRef.current !== null &&
                    Math.abs(e.touches[0].clientX - dragStartXRef.current) > 5
                  ) {
                    draggingRef.current = true;
                  }
                }}
                onTouchEnd={() => {
                  if (!draggingRef.current) setModalAlbum(album);
                  dragStartXRef.current = null;
                  draggingRef.current = false;
                }}
              >
                <div
                  className={`relative w-full h-72 md:h-60 sm:h-48 rounded-xl overflow-hidden shadow-lg ${cardBgClass}`}
                >
                  <img
                    src={album.cover_image}
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

      {/* Detail modal */}
      {modalAlbum && (
        <div
          id="modal-backdrop"
          onClick={(e) => {
            if (e.target.id === "modal-backdrop") setModalAlbum(null);
          }}
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

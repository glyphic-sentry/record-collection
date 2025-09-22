// frontend/src/views/GalleryView.jsx
import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../index.css"; // ensure global styles are available

export default function GalleryView() {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("recent");
  const [isDark, setIsDark] = useState(true);
  const [slidesToShow, setSlidesToShow] = useState(4);
  const sliderRef = useRef(null);

  // Fetch the album collection on mount
  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  // Adjust the number of slides based on window width
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

  // Sort albums by selected criterion
  const sorted = [...albums].sort((a, b) => {
    if (sort === "alphabetical") {
      return a.title.localeCompare(b.title);
    }
    // default: most recent first
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
        (typeof t === "string" ? t : t.title)
          .toLowerCase()
          .includes(searchLower)
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

  return (
    <div
      className={`min-h-full flex flex-col ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      {/* Search and filter controls */}
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
      <div className="relative w-full px-4 pb-4 overflow-hidden">
      {/* The ref is optional if you need to control the slider programmatically */}
        <Slider ref={sliderRef} {...settings}>
          {filtered.map((album) => (
            <div
              key={album.id}
              className="cursor-pointer flex flex-col items-center justify-center p-2"
            >
              <div className="relative w-full h-72 md:h-60 sm:h-48 rounded-xl overflow-hidden shadow-lg">
                {/* Use thumb if available, otherwise cover_image */}
                <img
                  src={album.thumb || album.cover_image}
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
  );
}

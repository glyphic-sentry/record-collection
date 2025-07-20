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
  const [visibleCount, setVisibleCount] = useState(10);
  const sliderRef = useRef(null);

  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        setVisibleCount((prev) => prev + 10);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sortedAlbums = [...albums].sort((a, b) => {
    if (sort === "alphabetical") {
      const artistCompare = a.artist.localeCompare(b.artist);
      if (artistCompare !== 0) return artistCompare;
      return a.title.localeCompare(b.title);
    }
    return new Date(b.date_added) - new Date(a.date_added);
  });

  const filtered = sortedAlbums.filter((album) => {
    const matchSearch = album.title.toLowerCase().includes(search.toLowerCase()) ||
                        album.artist.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "" || album.genre === genre;
    return matchSearch && matchGenre;
  }).slice(0, visibleCount);

  const genres = [...new Set(albums.map((a) => a.genre).filter(Boolean))];

  const settings = {
    dots: false,
    infinite: true,
    speed: 250,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    swipe: true,
    centerMode: true,
    centerPadding: "0",
    waitForAnimate: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  const handleBackdropClick = (e) => {
    if (e.target.id === "modal-backdrop") {
      setModalAlbum(null);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center ${isDark ? "bg-gradient-to-b from-black via-gray-900 to-black text-white" : "bg-gradient-to-b from-white via-gray-100 to-white text-black"}`}>
      <div className="flex flex-wrap gap-2 justify-between items-center px-4 py-2">
        <label htmlFor="search" className="sr-only">Search albums</label>
        <input
          id="search"
          className="border rounded px-2 py-1 text-black w-1/3"
          placeholder="Search albums..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <label htmlFor="genre" className="sr-only">Filter by genre</label>
        <select
          id="genre"
          className="border rounded px-2 py-1 text-black"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <label htmlFor="sort" className="sr-only">Sort albums</label>
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

      <div className="flex-grow flex items-center justify-center px-4 pt-4 overflow-hidden">
        <Slider ref={sliderRef} {...settings} className="overflow-visible w-full">
          {filtered.map((album) => (
            <div
              key={album.id}
              className="px-2 cursor-pointer focus:outline-none flex flex-col items-center justify-center"
              onClick={() => setModalAlbum(album)}
            >
              <img
                src={album.cover_image}
                alt={album.title}
                className="rounded shadow-md max-h-[60vh] w-auto object-contain"
              />
              <p className="text-center mt-2 text-sm w-full">{album.title}</p>
            </div>
          ))}
        </Slider>
      </div>

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
            <p><strong>Artist:</strong> {modalAlbum.artist}</p>
            <p><strong>Year:</strong> {modalAlbum.year}</p>
            <p><strong>Genre:</strong> {modalAlbum.genre}</p>
            <p><strong>Label:</strong> {modalAlbum.label}</p>
            <p><strong>Format:</strong> {modalAlbum.format}</p>
            <p><strong>Date Added:</strong> {new Date(modalAlbum.date_added).toLocaleDateString()}</p>
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

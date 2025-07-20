import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import AlbumCard from "../components/AlbumCard";
import { useLocation, useNavigate } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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

        const sorted = order === "alphabetical"
          ? filtered.sort((a, b) => a.title.localeCompare(b.title))
          : filtered.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));

        setAlbums(sorted);

        const query = new URLSearchParams(location.search);
        const albumId = query.get("id");
        if (albumId) {
          const index = sorted.findIndex((a) => a.id.toString() === albumId);
          if (index !== -1) setSelectedAlbum(sorted[index]);
        }
      });
  }, [order, genreFilter, formatFilter, location.search]);

  const settings = {
    infinite: true,
    speed: 600,
    cssEase: "ease-in-out",
    slidesToShow: 5,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "60px",
    swipeToSlide: true,
    adaptiveHeight: true,
    focusOnSelect: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          centerPadding: "20px",
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          centerPadding: "40px",
        },
      },
    ],
    afterChange: (index) => {
      if (albums[index]) navigate(`?id=${albums[index].id}`);
    },
  };

  const genres = Array.from(new Set(albums.map((a) => a.genre).filter(Boolean)));
  const formats = Array.from(new Set(albums.map((a) => a.format).filter(Boolean)));

  useEffect(() => localStorage.setItem("order", order), [order]);
  useEffect(() => localStorage.setItem("genre", genreFilter), [genreFilter]);
  useEffect(() => localStorage.setItem("format", formatFilter), [formatFilter]);

  return (
    <div className="w-full h-full bg-black text-white overflow-hidden relative">
      <div className="fixed top-0 left-0 w-full bg-black bg-opacity-90 z-30 p-4 flex flex-wrap gap-2 items-center justify-center">
        <select
          className="bg-gray-800 text-white p-2 rounded"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        >
          <option value="recent">Recent</option>
          <option value="alphabetical">Alphabetical</option>
        </select>

        <select
          className="bg-gray-800 text-white p-2 rounded"
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          className="bg-gray-800 text-white p-2 rounded"
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
        >
          <option value="">All Formats</option>
          {formats.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div className="w-full h-screen flex items-center justify-center px-4 pt-28">
        <div className="w-full max-w-md md:max-w-6xl">
          {albums.length === 0 ? (
            <p className="text-center text-gray-400">No albums to display.</p>
          ) : (
            <Slider {...settings}>
              {albums.map((album) => (
                <div key={album.id} onClick={() => setSelectedAlbum(album)} className="cursor-pointer px-2">
                  <div className="w-full max-w-[240px] mx-auto flex items-center justify-center">
                    <img
                      src={`/images/${album.id}.jpg`}
                      alt={album.title}
                      onError={(e) => {
                        if (album.thumb && album.thumb.startsWith("http")) {
                          e.currentTarget.src = album.thumb;
                        } else {
                          e.currentTarget.src = "/fallback.jpg";
                        }
                      }}
                      className="object-contain max-h-[300px] rounded shadow-lg"
                    />
                  </div>
                </div>
              ))}
            </Slider>
          )}
        </div>
      </div>

      {selectedAlbum && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedAlbum(null)}
        >
          <div
            className="bg-gray-900 text-white p-6 rounded-lg max-w-lg w-full relative animate-fadeIn shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-white text-xl"
              onClick={() => setSelectedAlbum(null)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-2">{selectedAlbum.title}</h2>
            <p className="mb-2">Artist: {selectedAlbum.artist}</p>
            <p className="mb-2">Label: {selectedAlbum.label}</p>
            <p className="mb-2">Year: {selectedAlbum.year}</p>
            <p className="mb-2">Genre: {selectedAlbum.genre || 'Unknown'}</p>
            <p className="mb-2">Format: {selectedAlbum.format || 'Unknown'}</p>
            <p className="mb-2">Date Added: {selectedAlbum.date_added}</p>
            <p className="mb-2">Bin: {selectedAlbum.bin || 'N/A'}</p>
            <p className="mb-2">Tracks: {selectedAlbum.tracklist?.join(', ') || 'N/A'}</p>
            <img
              src={`/images/${selectedAlbum.id}.jpg`}
              alt={selectedAlbum.title}
              onError={(e) => {
                if (selectedAlbum.thumb && selectedAlbum.thumb.startsWith("http")) {
                  e.currentTarget.src = selectedAlbum.thumb;
                } else {
                  e.currentTarget.src = "/fallback.jpg";
                }
              }}
              className="w-full mt-4 rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}

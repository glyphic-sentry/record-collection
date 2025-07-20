import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "..src/index.css";

export default function GalleryView() {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  const filtered = albums.filter((album) => {
    const matchSearch = album.title.toLowerCase().includes(search.toLowerCase()) ||
                        album.artist.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "" || album.genre === genre;
    return matchSearch && matchGenre;
  });

  const genres = [...new Set(albums.map((a) => a.genre).filter(Boolean))];

  const settings = {
    dots: false,
    infinite: true,
    speed: 400,
    slidesToShow: 4,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
    arrows: true,
    swipe: true,
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>      
      <div className="flex justify-between items-center px-4 py-2">
        <input
          className="border rounded px-2 py-1 text-black w-1/2"
          placeholder="Search albums..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="ml-2 border rounded px-2 py-1 text-black"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <button
          className="ml-4 border rounded px-2 py-1"
          onClick={() => setIsDark(!isDark)}
        >
          Toggle {isDark ? "Light" : "Dark"} Mode
        </button>
      </div>

      <div className="px-4 pt-4">
        <Slider {...settings}>
          {filtered.map((album) => (
            <div key={album.id} className="px-2">
              <img
                src={album.cover_image}
                alt={album.title}
                className="mx-auto rounded shadow-md w-full h-auto object-contain"
              />
              <p className="text-center mt-2 text-sm">{album.title}</p>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";

const AlbumCard = ({ album, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const info = album.basic_information;
  const title = info.title;
  const artist = info.artists?.[0]?.name || "Unknown Artist";
  const year = info.year || "Unknown Year";
  const genres = info.genres?.join(", ") || "Genre Unknown";
  const cover = info.cover_image || "";

  useEffect(() => {
    const img = new Image();
    img.src = cover;
    img.onload = () => setImageLoaded(true);
  }, [cover]);

  return (
    <div
      className="rounded-2xl shadow-md bg-gray-800 text-white p-3 w-48 cursor-pointer hover:shadow-xl transition"
      onClick={() => onClick(album)}
    >
      {imageLoaded ? (
        <img
          src={cover}
          alt={title}
          className="rounded-xl w-full h-48 object-cover mb-2"
        />
      ) : (
        <div className="w-full h-48 bg-gray-600 rounded-xl animate-pulse mb-2" />
      )}
      <h3 className="text-sm font-semibold truncate">{title}</h3>
      <p className="text-xs text-gray-400 truncate">{artist}</p>
      <p className="text-xs text-gray-500">
        {year} • {genres}
      </p>
    </div>
  );
};

export default AlbumCard;

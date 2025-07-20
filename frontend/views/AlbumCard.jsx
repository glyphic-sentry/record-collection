import { useEffect, useState } from "react";

export default function AlbumCard({ album }) {
  const info = album.basic_information;
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div
      className="bg-gray-800 rounded-lg p-2 shadow hover:shadow-lg transition cursor-pointer"
      onClick={() => setShowDetail((v) => !v)}
    >
      <img
        src={info.cover_image}
        alt={info.title}
        className="w-full h-40 object-cover rounded"
      />
      <h3 className="mt-2 text-sm font-semibold">{info.title}</h3>
      <p className="text-xs text-gray-400">{info.artists?.[0]?.name}</p>

      {showDetail && (
        <div className="mt-2 text-xs text-gray-300">
          <p>Year: {info.year}</p>
          <p>Genres: {info.genres?.join(", ")}</p>
          <p>Styles: {info.styles?.join(", ")}</p>
          <p>Label: {info.labels?.[0]?.name}</p>
          <p>Format: {info.formats?.map(f => f.name).join(", ")}</p>
        </div>
      )}
    </div>
  );
}

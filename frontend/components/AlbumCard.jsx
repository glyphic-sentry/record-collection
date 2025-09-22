import React, { useState, useEffect } from 'react';

export default function AlbumCard({ album, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const cover = album.cover_image || album.thumb || '';

  useEffect(() => {
    if (!cover) return;
    const img = new Image();
    img.src = cover;
    img.onload = () => setLoaded(true);
  }, [cover]);

  return (
    <button type="button" onClick={() => onClick?.(album)} className="block w-60 text-left rounded shadow hover:shadow-lg transition">
      {loaded ? (
        <img src={cover} alt={`${album.artist} – ${album.title}`} className="w-full h-60 object-cover rounded-t" loading="lazy" />
      ) : (
        <div className="w-full h-60 flex items-center justify-center bg-gray-200 rounded-t animate-pulse">
          Loading…
        </div>
      )}
      <div className="p-2">
        <h3 className="font-semibold truncate">{album.title}</h3>
        <p className="text-sm text-gray-600 truncate">{album.artist}</p>
        <p className="text-xs text-gray-500">{[album.year, album.genre].filter(Boolean).join(' • ')}</p>
      </div>
    </button>
  );
}

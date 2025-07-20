import React, { useEffect, useState } from "react";

export default function GalleryView() {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAlbums(data);
        }
      })
      .catch((err) => {
        console.error("Error fetching album collection:", err);
      });
  }, []);

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-screen bg-gray-900 text-white">
      {albums.map((album) => (
        <div key={album.id} class

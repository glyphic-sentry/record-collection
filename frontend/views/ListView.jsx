import React, { useEffect, useState } from "react";

export default function ListView() {
  const [albums, setAlbums] = useState([]);
  const [bins, setBins] = useState({});
  const [editing, setEditing] = useState({});
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetch("/api/collection").then((res) => res.json()).then(setAlbums);
    fetch("/api/bin").then((res) => res.json()).then(setBins);
  }, []);

  const handleBinUpdate = (id, bin) => {
    fetch(`/api/bin/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bin })
    }).then(() => {
      setBins((b) => ({ ...b, [id]: bin }));
      setEditing((e) => ({ ...e, [id]: false }));
    });
  };

  const handleBulkUpdate = (bin) => {
    selected.forEach((id) => handleBinUpdate(id, bin));
    setSelected([]);
    setBulkMode(false);
  };

  const toggleSelect = (id) => {
    setSelected((s) =>
      s.includes(id) ? s.filter((i) => i !== id) : [...s, id]
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-2">List View</h1>
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setBulkMode((v) => !v)}
          className="bg-blue-600 px-2 py-1 rounded"
        >
          {bulkMode ? "Cancel Bulk" : "Bulk Edit"}
        </button>
        {bulkMode && selected.length > 0 && (
          <>
            <span>{selected.length} selected</span>
            <input
              type="text"
              placeholder="New bin"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleBulkUpdate(e.target.value);
              }}
              className="text-black px-1"
            />
          </>
        )}
      </div>
      <table className="table-auto w-full text-left">
        <thead>
          <tr>
            {bulkMode && <th>Select</th>}
            <th>Artist</th>
            <th>Title</th>
            <th>Year</th>
            <th>Bin</th>
          </tr>
        </thead>
        <tbody>
          {albums.map((a) => {
            const id = a.id;
            const info = a.basic_information;
            return (
              <tr key={id} className="border-t border-gray-700">
                {bulkMode && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(id)}
                      onChange={() => toggleSelect(id)}
                    />
                  </td>
                )}
                <td>{info.artists?.[0]?.name}</td>
                <td>{info.title}</td>
                <td>{info.year}</td>
                <td>
                  {editing[id] ? (
                    <input
                      type="text"
                      defaultValue={bins[id] || ""}
                      onBlur={(e) => handleBinUpdate(id, e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleBinUpdate(id, e.target.value)
                      }
                      className="text-black px-1"
                    />
                  ) : (
                    <span onClick={() => setEditing({ ...editing, [id]: true })}>
                      {bins[id] || <em className="text-gray-400">Set bin</em>}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

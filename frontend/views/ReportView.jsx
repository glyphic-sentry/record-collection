import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ReportView() {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data));
  }, []);

  const genreStats = albums.reduce((acc, a) => {
    const genres = a.basic_information?.genres || [];
    genres.forEach((g) => {
      acc[g] = (acc[g] || 0) + 1;
    });
    return acc;
  }, {});

  const chartData = Object.entries(genreStats).map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Report View</h1>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#4F46E5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

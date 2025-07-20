import { useEffect, useState } from "react";

export default function useFilteredCollection(filters) {
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => {
        const { term, genre, year } = filters;
        const result = data.filter((a) => {
          const info = a.basic_information;
          const matchesTerm =
            !term ||
            info.title?.toLowerCase().includes(term.toLowerCase()) ||
            info.artists?.[0]?.name?.toLowerCase().includes(term.toLowerCase());
          const matchesGenre =
            !genre ||
            info.genres?.some((g) =>
              g.toLowerCase().includes(genre.toLowerCase())
            );
          const matchesYear = !year || info.year === Number(year);
          return matchesTerm && matchesGenre && matchesYear;
        });
        setFiltered(result);
      });
  }, [filters]);

  return filtered;
}

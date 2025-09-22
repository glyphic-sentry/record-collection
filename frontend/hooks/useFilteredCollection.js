import { useEffect, useState, useMemo } from 'react';

export default function useFilteredCollection(filters) {
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchCollection() {
      try {
        const res = await fetch('/api/collection');
        const data = await res.json();
        if (!cancelled) setAlbums(data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchCollection();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const { term, genre, year } = filters;
    return albums.filter(album => {
      const title = album.title?.toLowerCase() || '';
      const artist = album.artist?.toLowerCase() || '';
      const matchesTerm = !term || title.includes(term.toLowerCase()) || artist.includes(term.toLowerCase());
      const matchesGenre = !genre || (album.genre || '').toLowerCase().includes(genre.toLowerCase());
      const matchesYear = !year || album.year === Number(year);
      return matchesTerm && matchesGenre && matchesYear;
    });
  }, [albums, filters]);

  return { albums: filtered, isLoading, error };
}

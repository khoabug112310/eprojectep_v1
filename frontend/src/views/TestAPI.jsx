import React, { useState, useEffect } from 'react';
import { movieAPI, theaterAPI } from '../services/api';

const TestAPI = () => {
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesResponse, theatersResponse] = await Promise.all([
          movieAPI.getAll(),
          theaterAPI.getAll()
        ]);
        
        const moviesData = moviesResponse.data.data?.data || moviesResponse.data.data || [];
        const theatersData = theatersResponse.data.data?.data || theatersResponse.data.data || [];
        
        setMovies(moviesData);
        setTheaters(theatersData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data: ' + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-gold" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="text-gold">API Test</h1>
      <div className="row">
        <div className="col-md-6">
          <h2 className="text-gold">Movies</h2>
          <ul>
            {movies.slice(0, 5).map(movie => (
              <li key={movie.id} className="text-white">
                {movie.title} - {movie.language} - {movie.duration} min
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-6">
          <h2 className="text-gold">Theaters</h2>
          <ul>
            {theaters.slice(0, 5).map(theater => (
              <li key={theater.id} className="text-white">
                {theater.name} - {theater.city}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestAPI;
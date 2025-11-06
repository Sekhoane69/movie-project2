//a2839f66e59521655df6ee5dee2850da
// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import "./firebase"
import API_URL from './config';


const TMDB_API_KEY = 'a2839f66e59521655df6ee5dee2850da'; // Replace with your key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [page, setPage] = useState(1);

  
  // Load movies on mount
  useEffect(() => {
    if (currentPage === 'home') loadTopRated();
    if (currentPage === 'movies') loadPopularMovies();
  }, [currentPage, page]);

  // TMDB API Functions
  const loadTopRated = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      setMovies(data.results.slice(0, 8));
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const loadPopularMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`);
      const data = await response.json();
      setMovies(data.results);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const searchMovies = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadPopularMovies();
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${searchQuery}`);
      const data = await response.json();
      setMovies(data.results);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const loadMovieDetails = async (movieId) => {
    setLoading(true);
    try {
      const [movieResponse, reviewsResponse] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`),
        fetch(`${API_URL}/reviews/${movieId}`)
      ]);
      const movieData = await movieResponse.json();
      const reviewsData = await reviewsResponse.json();
      setSelectedMovie(movieData);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setCurrentPage('details');
    } catch (error) {
      console.error('Error:', error);
      setReviews([]);
    }
    setLoading(false);
  };

  // Review Functions
  const submitReview = async (e) => {
    e.preventDefault();
    const form = e.target;
    const reviewData = {
      movieId: selectedMovie.id.toString(),
      movieTitle: selectedMovie.title,
      rating: parseInt(form.rating.value),
      review: form.review.value,
      username: form.username.value
    };

    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit review');
      }
      
      localStorage.setItem('username', reviewData.username);
      setUsername(reviewData.username);
      form.reset();
      await loadMovieDetails(selectedMovie.id);
      alert('Review submitted!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit review. Make sure backend is running!');
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      const response = await fetch(`${API_URL}/reviews/${reviewId}`, { method: 'DELETE' });
      
      if (!response.ok) {
        throw new Error('Failed to delete review');
      }
      
      if (currentPage === 'details') {
        await loadMovieDetails(selectedMovie.id);
      }
      alert('Review deleted!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete review');
    }
  };

  const loadUserReviews = async (user) => {
  setLoading(true);
  try {
    const endpoint = user.trim()
      ? `${API_URL}/reviews/user/${user}`
      : `${API_URL}/reviews`;
      
    const response = await fetch(endpoint);
    const data = await response.json();
    setUserReviews(Array.isArray(data) ? data : []);
    setCurrentPage('myReviews');
  } catch (error) {
    console.error('Error:', error);
    setUserReviews([]);
  }
  setLoading(false);
};

  

  // Navigation Component
// Navbar with login/logout toggle
const Navbar = () => {
  const [tempUser, setTempUser] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!tempUser.trim()) return alert('Enter your username first!');
    localStorage.setItem('username', tempUser);
    setUsername(tempUser);
    alert(`Logged in as ${tempUser}`);
  };

  const handleLogout = () => {
    if (window.confirm("Log out and switch user?")) {
      localStorage.removeItem('username');
      setUsername('');
      alert('Logged out successfully!');
      setCurrentPage('home');
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <h1
          className="navbar-brand"
          onClick={() => setCurrentPage('home')}
          style={{ cursor: 'pointer' }}
        >
          🎬 Zile MoviesRev
        </h1>

        <ul className="navbar-nav">
          <li onClick={() => setCurrentPage('home')}>Home</li>
          <li onClick={() => setCurrentPage('movies')}>Movies</li>
          <li onClick={() => setCurrentPage('myReviews')}>My Reviews</li>
          <li onClick={() => setCurrentPage('about')}>About</li>
        </ul>

        {/* Login / Logout */}
        <div className="user-controls">
          {username ? (
            <div>
              <span style={{ marginRight: 10 }}>👤 {username}</span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'red',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Enter name..."
                value={tempUser}
                onChange={(e) => setTempUser(e.target.value)}
                style={{
                  marginRight: '8px',
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: '1px solid #ccc'
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#5b5be7',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Login
              </button>
            </form>
          )}
        </div>
      </div>
    </nav>
  );
};



  // Movie Card Component
  const MovieCard = ({ movie }) => (
    <div className="movie-card" onClick={() => loadMovieDetails(movie.id)}>
      <img
        src={movie.poster_path ? `${TMDB_IMAGE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
        alt={movie.title}
      />
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p>⭐ {movie.vote_average?.toFixed(1)} | {movie.release_date?.substring(0, 4)}</p>
      </div>
    </div>
  );

  // Review Card Component
  const ReviewCard = ({ review, showMovie = false }) => (
    <div className="review-card">
      {showMovie && (
        <h4 className="review-movie-title" onClick={() => loadMovieDetails(review.movieId)}>
          {review.movieTitle}
        </h4>
      )}
      <div className="review-header">
        <div>
          <h5>{review.username}</h5>
          <div className="rating">{'⭐'.repeat(review.rating)}</div>
        </div>
        {review.username === username && (
          <button className="btn-delete" onClick={() => deleteReview(review.id)}>
            Delete
          </button>
        )}
      </div>
      <p>{review.review}</p>
      <small>{new Date(review.createdAt).toLocaleDateString()}</small>
    </div>
  );

  // Home Page
  const HomePage = () => (
    <div>
      <div className="hero">
        <h1>Welcome to Ziles's MovieRev</h1>
        <p>Discover movies, share your thoughts, and read reviews from the community</p>
      </div>
      <div className="container">
        <h2>Top Rated Movies</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="movies-grid">
            {movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
          </div>
        )}
      </div>
    </div>
  );

  // Movies List Page
  const MoviesPage = () => (
    <div className="container">
      <h1>Browse Movies</h1>
      <form onSubmit={searchMovies} className="search-form">
        <input
          type="text"
          placeholder="Search for movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="movies-grid">
            {movies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
          </div>
          {!searchQuery && (
            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Movie Details Page
  const DetailsPage = () => {
    if (!selectedMovie) return null;
    return (
      <div className="details-page">
        <div className="container">
          <div className="movie-details">
            <img
              src={selectedMovie.poster_path ? `${TMDB_IMAGE_URL}${selectedMovie.poster_path}` : 'https://via.placeholder.com/500x750'}
              alt={selectedMovie.title}
            />
            <div className="movie-info-detailed">
              <h1>{selectedMovie.title}</h1>
              <p className="tagline">{selectedMovie.tagline}</p>
              <p><strong>Rating:</strong> ⭐ {selectedMovie.vote_average?.toFixed(1)} / 10</p>
              <p><strong>Release:</strong> {selectedMovie.release_date}</p>
              <p><strong>Runtime:</strong> {selectedMovie.runtime} min</p>
              <p><strong>Genres:</strong> {selectedMovie.genres?.map(g => g.name).join(', ')}</p>
              <p>{selectedMovie.overview}</p>
            </div>
          </div>

          <hr />

          <div className="reviews-section">
            <div className="review-form">
              <h3>Write a Review</h3>
              <form onSubmit={submitReview}>
                <input
                  type="text"
                  name="username"
                  placeholder="Your name"
                  defaultValue={username}
                  required
                />
                <label>
                  Rating: <span id="rating-value">5</span> ⭐
                </label>
                <input
                  type="range"
                  name="rating"
                  min="1"
                  max="5"
                  defaultValue="5"
                  onChange={(e) => document.getElementById('rating-value').textContent = e.target.value}
                />
                <textarea
                  name="review"
                  placeholder="Share your thoughts..."
                  rows="4"
                  required
                ></textarea>
                <button type="submit">Submit Review</button>
              </form>
            </div>

            <div className="reviews-list">
              <h3>Reviews ({reviews.length})</h3>
              {reviews.length === 0 ? (
                <p className="no-reviews">No reviews yet. Be the first!</p>
              ) : (
                reviews.map(review => <ReviewCard key={review.id} review={review} />)
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // My Reviews Page
  const MyReviewsPage = () => {
    const [searchUser, setSearchUser] = useState('');

    return (
      <div className="container">
        <h1>My Reviews</h1>
        <form onSubmit={(e) => { e.preventDefault(); loadUserReviews(searchUser); }} className="search-form">
          <input
            type="text"
            placeholder="Enter username..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : userReviews.length === 0 ? (
          <p className="no-reviews">No reviews found</p>
        ) : (
          <div>
            <h3>{userReviews.length} Reviews</h3>
            {userReviews.map(review => (
              <ReviewCard key={review.id} review={review} showMovie={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // About Page
  const AboutPage = () => (
    <div className="container">
      <h1>About MovieReview</h1>
      <div className="about-card">
        <h3>Our Mission</h3>
        <p>MovieReview brings movie enthusiasts together to share opinions and discover new films.</p>
      </div>
      <div className="about-card">
        <h3>Features</h3>
        <ul>
          <li>Browse thousands of movies from TMDB</li>
          <li>Write and manage reviews</li>
          <li>Rate movies with 5-star system</li>
          <li>Search for specific movies</li>
          <li>View community reviews</li>
        </ul>
      </div>
      <div className="about-card">
        <h3>Technology Stack</h3>
        <ul>
          <li><strong>Frontend:</strong> React, CSS, Bootstrap</li>
          <li><strong>Backend:</strong> Node.js, Express</li>
          <li><strong>Database:</strong> Firebase Firestore</li>
          <li><strong>API:</strong> TMDB</li>
        </ul>
      </div>
    </div>
  );

  // Render Current Page
  return (
    <div className="App">
      <Navbar />
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'movies' && <MoviesPage />}
      {currentPage === 'details' && <DetailsPage />}
      {currentPage === 'myReviews' && <MyReviewsPage />}
      {currentPage === 'about' && <AboutPage />}
    </div>
  );
}

export default App;
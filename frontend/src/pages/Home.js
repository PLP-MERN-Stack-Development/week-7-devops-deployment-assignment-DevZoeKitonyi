import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || '/api';

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to MERN Blog</h1>
        <p>A full-stack application built with MongoDB, Express, React, and Node.js</p>
      </div>

      <div className="posts-section">
        <h2>Recent Posts</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="no-posts">
            <p>No posts available yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map(post => (
              <div key={post._id} className="post-card">
                <h3>{post.title}</h3>
                <p className="post-content">{post.content}</p>
                <div className="post-meta">
                  <span>By: {post.author?.username || 'Anonymous'}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
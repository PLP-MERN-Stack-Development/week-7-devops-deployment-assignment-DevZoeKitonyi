import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [editingPost, setEditingPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
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

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/posts`, newPost);
      setPosts([response.data, ...posts]);
      setNewPost({ title: '', content: '' });
      setError('');
    } catch (error) {
      console.error('Failed to create post:', error);
      setError('Failed to create post');
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editingPost.title.trim() || !editingPost.content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/posts/${editingPost._id}`, {
        title: editingPost.title,
        content: editingPost.content
      });
      
      setPosts(posts.map(post => 
        post._id === editingPost._id ? response.data : post
      ));
      setEditingPost(null);
      setError('');
    } catch (error) {
      console.error('Failed to update post:', error);
      setError('Failed to update post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/posts/${postId}`);
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
      setError('Failed to delete post');
    }
  };

  const userPosts = posts.filter(post => post.author?._id === user?.id);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome to your Dashboard, {user?.username}!</h1>
        <p>Manage your posts and create new content</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="dashboard-content">
        <div className="create-post-section">
          <h2>Create New Post</h2>
          <form onSubmit={handleCreatePost} className="post-form">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="Enter post title..."
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="Write your post content..."
                rows="6"
                required
              />
            </div>
            <button type="submit" className="submit-button">
              Create Post
            </button>
          </form>
        </div>

        <div className="posts-section">
          <h2>Your Posts ({userPosts.length})</h2>
          
          {userPosts.length === 0 ? (
            <div className="no-posts">
              <p>You haven't created any posts yet. Create your first post above!</p>
            </div>
          ) : (
            <div className="posts-list">
              {userPosts.map(post => (
                <div key={post._id} className="post-item">
                  {editingPost && editingPost._id === post._id ? (
                    <form onSubmit={handleUpdatePost} className="edit-form">
                      <input
                        type="text"
                        value={editingPost.title}
                        onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                        className="edit-title"
                      />
                      <textarea
                        value={editingPost.content}
                        onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                        className="edit-content"
                        rows="4"
                      />
                      <div className="edit-actions">
                        <button type="submit" className="save-button">Save</button>
                        <button 
                          type="button" 
                          onClick={() => setEditingPost(null)}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h3>{post.title}</h3>
                      <p className="post-content">{post.content}</p>
                      <div className="post-meta">
                        <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                        <div className="post-actions">
                          <button 
                            onClick={() => setEditingPost(post)}
                            className="edit-button"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeletePost(post._id)}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
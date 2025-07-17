import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Custom hook for API calls
export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { immediate = true, method = 'GET', ...config } = options;

  const execute = useCallback(async (overrideConfig = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api({
        url,
        method,
        ...config,
        ...overrideConfig,
      });

      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, method, config]);

  useEffect(() => {
    if (immediate && method === 'GET') {
      execute();
    }
  }, [execute, immediate, method]);

  return { data, loading, error, execute };
};

// Custom hook for posts
export const usePosts = (params = {}) => {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async (queryParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/posts', {
        params: { ...params, ...queryParams }
      });

      if (queryParams.page > 1) {
        // Append for pagination
        setPosts(prev => [...prev, ...response.data.data]);
      } else {
        // Replace for new search/filter
        setPosts(response.data.data);
      }

      setPagination(response.data.pagination);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch posts';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [params]);

  const createPost = useCallback(async (postData) => {
    try {
      const response = await api.post('/posts', postData);
      setPosts(prev => [response.data.data, ...prev]);
      toast.success('Post created successfully!');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create post';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const updatePost = useCallback(async (id, postData) => {
    try {
      const response = await api.put(`/posts/${id}`, postData);
      setPosts(prev => prev.map(post => 
        post._id === id ? response.data.data : post
      ));
      toast.success('Post updated successfully!');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update post';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const deletePost = useCallback(async (id) => {
    try {
      await api.delete(`/posts/${id}`);
      setPosts(prev => prev.filter(post => post._id !== id));
      toast.success('Post deleted successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete post';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const likePost = useCallback(async (id) => {
    try {
      const response = await api.post(`/posts/${id}/like`);
      setPosts(prev => prev.map(post => {
        if (post._id === id) {
          return {
            ...post,
            likes: response.data.data.isLiked 
              ? [...(post.likes || []), 'current-user']
              : (post.likes || []).filter(like => like !== 'current-user')
          };
        }
        return post;
      }));
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to like post';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    pagination,
    loading,
    error,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    likePost
  };
};

export default api;
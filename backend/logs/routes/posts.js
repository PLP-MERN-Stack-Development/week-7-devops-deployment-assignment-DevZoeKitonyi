const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// Get all posts with pagination and filtering
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const search = req.query.search;
    const author = req.query.author;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (author) {
      query.author = author;
    }

    // Execute query with pagination
    const posts = await Post.find(query)
      .populate('author', 'username email')
      .sort({ [sortBy]: sortOrder })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Post.countDocuments(query);

    logger.info(`Posts retrieved`, {
      requestId: req.id,
      page,
      limit,
      total,
      resultsCount: posts.length,
      ip: req.ip
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      requestId: req.id
    });
  } catch (error) {
    logger.error('Get posts error:', {
      requestId: req.id,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    next(error);
  }
});

// Get single post
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username email createdAt')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        requestId: req.id
      });
    }

    logger.info(`Post retrieved`, {
      requestId: req.id,
      postId: post._id,
      ip: req.ip
    });

    res.json({
      success: true,
      data: post,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Get post error:', {
      requestId: req.id,
      postId: req.params.id,
      error: error.message,
      ip: req.ip
    });
    next(error);
  }
});

// Create post
router.post('/', auth, validate(schemas.post), async (req, res, next) => {
  try {
    const { title, content } = req.body;
    
    const post = new Post({
      title: title.trim(),
      content: content.trim(),
      author: req.userId
    });

    await post.save();
    await post.populate('author', 'username email');

    logger.info(`Post created`, {
      requestId: req.id,
      postId: post._id,
      userId: req.userId,
      title: post.title,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Create post error:', {
      requestId: req.id,
      userId: req.userId,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    next(error);
  }
});

// Update post
router.put('/:id', auth, validate(schemas.post), async (req, res, next) => {
  try {
    const { title, content } = req.body;
    
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, author: req.userId },
      { 
        title: title.trim(), 
        content: content.trim(),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('author', 'username email');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you are not authorized to update this post',
        requestId: req.id
      });
    }

    logger.info(`Post updated`, {
      requestId: req.id,
      postId: post._id,
      userId: req.userId,
      title: post.title,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: post,
      requestId: req.id
    });
  } catch (error) {
    logger.error('Update post error:', {
      requestId: req.id,
      postId: req.params.id,
      userId: req.userId,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    next(error);
  }
});

// Delete post
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      author: req.userId
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you are not authorized to delete this post',
        requestId: req.id
      });
    }

    logger.info(`Post deleted`, {
      requestId: req.id,
      postId: post._id,
      userId: req.userId,
      title: post.title,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Post deleted successfully',
      requestId: req.id
    });
  } catch (error) {
    logger.error('Delete post error:', {
      requestId: req.id,
      postId: req.params.id,
      userId: req.userId,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    next(error);
  }
});

// Like/Unlike post
router.post('/:id/like', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
        requestId: req.id
      });
    }

    const likeIndex = post.likes.indexOf(req.userId);
    
    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(req.userId);
    }

    await post.save();

    logger.info(`Post like toggled`, {
      requestId: req.id,
      postId: post._id,
      userId: req.userId,
      action: likeIndex > -1 ? 'unlike' : 'like',
      totalLikes: post.likes.length,
      ip: req.ip
    });

    res.json({
      success: true,
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      data: {
        likes: post.likes.length,
        isLiked: likeIndex === -1
      },
      requestId: req.id
    });
  } catch (error) {
    logger.error('Like post error:', {
      requestId: req.id,
      postId: req.params.id,
      userId: req.userId,
      error: error.message,
      ip: req.ip
    });
    next(error);
  }
});

module.exports = router;
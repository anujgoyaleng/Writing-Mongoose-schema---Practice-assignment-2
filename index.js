const express = require('express');
const mongoose = require('mongoose');
const { resolve } = require('path');

const app = express();
const port = 3010;

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.static('static')); // Serve static files

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/blogDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Blog Schema
const commentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  message: { type: String, required: true },
  commentedAt: { type: Date, default: Date.now }
});

const blogPostSchema = new mongoose.Schema({
  title: { type: String, unique: true, required: true, minlength: 5 },
  content: { type: String, required: true, minlength: 50 },
  author: { type: String, required: true },
  tags: { type: [String], default: [] },
  category: { type: String, default: 'General' },
  likes: { type: [String], default: [] },
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

// Middleware to update 'updatedAt'
blogPostSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/index.html'));
});

// API: Create a new blog post
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, author, tags, category } = req.body;
    const newPost = new BlogPost({ title, content, author, tags, category });

    await newPost.save();
    res.status(201).json({ message: 'Blog post created', post: newPost });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API: Get all blog posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await BlogPost.find();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get a blog post by ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update a blog post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const updatedPost = await BlogPost.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!updatedPost) return res.status(404).json({ message: 'Post not found' });

    res.status(200).json({ message: 'Post updated', post: updatedPost });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API: Delete a blog post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const deletedPost = await BlogPost.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ message: 'Post not found' });

    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Add a comment to a blog post
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { username, message } = req.body;
    const post = await BlogPost.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ username, message });
    await post.save();

    res.status(201).json({ message: 'Comment added', post });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API: Like a blog post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const { username } = req.body;
    const post = await BlogPost.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.likes.includes(username)) {
      post.likes.push(username);
      await post.save();
    }

    res.status(200).json({ message: 'Post liked', post });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API: Unlike a blog post
app.post('/api/posts/:id/unlike', async (req, res) => {
  try {
    const { username } = req.body;
    const post = await BlogPost.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.likes = post.likes.filter(user => user !== username);
    await post.save();

    res.status(200).json({ message: 'Post unliked', post });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
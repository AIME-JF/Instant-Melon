import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize Data File
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ stories: [], comments: [] }, null, 2));
}

// Helper to read/write data
const readData = () => JSON.parse(fs.readFileSync(DATA_FILE));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// API Routes

// 1. Get Stories
app.get('/api/stories', (req, res) => {
    try {
        const data = readData();
        // Return stories with their comments, ordered by date desc
        // First, sort all stories by date ASC to assign correct sequential IDs
        const allStoriesSorted = [...data.stories].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        // Map original stories to include their sequential index (1-based)
        const storiesWithIndex = allStoriesSorted.map((story, index) => ({
            ...story,
            displayId: index + 1 // 1-based index
        }));

        // Now process for response: filter comments and sort DESC for display
        const finalStories = storiesWithIndex.map(story => {
            const storyComments = data.comments.filter(c => c.story_id === story.id);
            // Sort comments desc
            storyComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            return { ...story, comments: storyComments };
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json(finalStories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Post Story
app.post('/api/stories', (req, res) => {
    try {
        const { content, aiSummary } = req.body;
        const data = readData();
        const newStory = {
            id: Date.now(),
            content,
            aiSummary,
            likes: 0,
            created_at: new Date().toISOString()
        };
        data.stories.unshift(newStory);
        writeData(data);
        res.json(newStory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Like Story
app.post('/api/stories/:id/like', (req, res) => {
    try {
        const { id } = req.params;
        const { likes } = req.body; // Expecting the new like count
        const data = readData();
        const storyIndex = data.stories.findIndex(s => s.id == id);

        if (storyIndex !== -1) {
            data.stories[storyIndex].likes = likes;
            writeData(data);
            res.json({ success: true, likes: likes });
        } else {
            res.status(404).json({ error: "Story not found" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Post Comment
app.post('/api/comments', (req, res) => {
    try {
        const { story_id, text, user = "匿名用户" } = req.body;
        const data = readData();

        const newComment = {
            id: Date.now(),
            story_id: Number(story_id), // Ensure type match
            user,
            text,
            created_at: new Date().toISOString()
        };

        data.comments.unshift(newComment);
        writeData(data);
        res.json(newComment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. AI Proxy 
app.post('/api/ai', async (req, res) => {
    try {
        const response = await fetch("https://kfc-api.sxxe.net/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": req.headers.authorization, // Pass through the key from frontend (or hardcode here)
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        res.status(500).json({ error: "AI Service Proxy Failed: " + err.message });
    }
});

// Fallback for SPA (Serve index.html for any unknown route)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

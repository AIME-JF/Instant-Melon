import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Database Connection
const pool = new Pool({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'instant_melon',
    password: process.env.DB_PASSWORD || 'password',
    port: 5432,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes

// 1. Get Stories
app.get('/api/stories', async (req, res) => {
    try {
        const since_id = req.query.since_id;

        // If since_id is provided, fetch only newer stories (Polling mode)
        if (since_id) {
            const result = await pool.query(`
                SELECT s.*, 
                COALESCE(
                    (
                        SELECT json_agg(c ORDER BY c.created_at DESC)
                        FROM comments c
                        WHERE c.story_id = s.id
                    ), 
                    '[]'
                ) AS comments
                FROM stories s
                WHERE s.id > $1
                ORDER BY s.id DESC
            `, [since_id]);

            const stories = result.rows.map(story => ({
                ...story,
                displayId: story.id,
                aiSummary: story.ai_summary
            }));

            return res.json(stories);
        }

        // Standard Pagination mode
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Fetch stories with their comments nested
        const result = await pool.query(`
            SELECT s.*, 
            COALESCE(
                (
                    SELECT json_agg(c ORDER BY c.created_at DESC)
                    FROM comments c
                    WHERE c.story_id = s.id
                ), 
                '[]'
            ) AS comments
            FROM stories s
            ORDER BY s.id DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        // Map database ID to displayId for frontend compatibility
        // Also map snake_case DB fields to camelCase for frontend
        const stories = result.rows.map(story => ({
            ...story,
            displayId: story.id,
            aiSummary: story.ai_summary // Fix: Map DB snake_case to frontend camelCase
        }));

        res.json(stories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Post Story
app.post('/api/stories', async (req, res) => {
    try {
        const { content, aiSummary } = req.body;
        const result = await pool.query(
            'INSERT INTO stories (content, ai_summary, likes) VALUES ($1, $2, 0) RETURNING *',
            [content, aiSummary]
        );
        const newStory = result.rows[0];
        // Format for frontend
        newStory.displayId = newStory.id;
        newStory.aiSummary = newStory.ai_summary; // Fix: Map DB snake_case to frontend camelCase
        newStory.comments = [];

        res.json(newStory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Like Story
app.post('/api/stories/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const { likes } = req.body;

        // Note: In a real app we'd increment transactionally, but here we just set the value 
        // derived from frontend to keep logic identical to before.
        // Better: UPDATE stories SET likes = likes + 1 ... but frontend sends absolute value.
        // Let's stick to setting it.
        const result = await pool.query(
            'UPDATE stories SET likes = $1 WHERE id = $2 RETURNING likes',
            [likes, id]
        );

        if (result.rowCount > 0) {
            res.json({ success: true, likes: likes });
        } else {
            res.status(404).json({ error: "Story not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 4. Comments API
app.get('/api/comments', async (req, res) => {
    try {
        const { story_id } = req.query;
        if (!story_id) return res.status(400).json({ error: "story_id is required" });

        const result = await pool.query(
            'SELECT * FROM comments WHERE story_id = $1 ORDER BY created_at DESC',
            [story_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/comments', async (req, res) => {
    try {
        const { story_id, text, user = "匿名用户" } = req.body;
        const result = await pool.query(
            'INSERT INTO comments (story_id, "user", text) VALUES ($1, $2, $3) RETURNING *',
            [story_id, user, text]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const OPENAI_API_KEY = "sk-EaIEkoMJooD2u40rZM3BJdmZyusfeaHCuHJAXedjBGL3QsmK"; // Hardcoded for now per plan, ideally in .env

// 5. AI Proxy 
app.post('/api/ai', async (req, res) => {
    try {
        console.log("------------------------------------------");
        console.log("[AI Proxy] Incoming Request Body:", JSON.stringify(req.body, null, 2));

        const response = await fetch("https://kfc-api.sxxe.net/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Server injects the key, replacing whatever frontend sent (or didn't send)
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        console.log("[AI Proxy] Upstream Status:", response.status);
        console.log("[AI Proxy] Upstream Response Body:", JSON.stringify(data, null, 2));
        console.log("------------------------------------------");

        if (!response.ok) {
            console.error("AI Proxy Error Body:", JSON.stringify(data));
        }
        res.status(response.status).json(data);
    } catch (err) {
        console.error("[AI Proxy] Exception:", err);
        res.status(500).json({ error: "AI Service Proxy Failed: " + err.message });
    }
});

// Fallback for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server (PostgreSQL) running at http://localhost:${PORT}`);
});

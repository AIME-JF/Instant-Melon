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

// AI API 配置
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// 伪浏览器请求头池 (随机选择，模拟真实用户)
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0"
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// 5. AI Proxy (增强反缓存机制)
app.post('/api/ai', async (req, res) => {
    try {
        console.log("------------------------------------------");
        console.log("[AI Proxy] Incoming Request Body:", JSON.stringify(req.body, null, 2));

        // 生成唯一请求标识，防止缓存
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

        // 在 user message 末尾追加随机种子，破坏缓存
        const messages = req.body.messages ? req.body.messages.map((msg, idx) => {
            if (msg.role === 'user') {
                // 追加不可见的随机标识
                return { ...msg, content: msg.content + `\n[ID:${requestId}]` };
            }
            return msg;
        }) : [];

        // 覆盖 model 为环境变量配置的模型，增加随机性参数
        const requestBody = {
            ...req.body,
            model: OPENAI_MODEL,
            messages: messages,
            temperature: Math.max(0.9, req.body.temperature || 1.0), // 确保高随机性
            top_p: 0.95,
            presence_penalty: 0.3,
            frequency_penalty: 0.3
        };

        const userAgent = getRandomUserAgent();
        console.log("[AI Proxy] Request ID:", requestId);
        console.log("[AI Proxy] Using User-Agent:", userAgent);
        console.log("[AI Proxy] Target API:", OPENAI_API_BASE);
        console.log("[AI Proxy] Model:", OPENAI_MODEL);

        const response = await fetch(OPENAI_API_BASE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "User-Agent": userAgent,
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                "Accept-Encoding": "gzip, deflate, br",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "X-Request-ID": requestId
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log("[AI Proxy] Upstream Status:", response.status);
        console.log("[AI Proxy] Upstream Response Body:", JSON.stringify(data, null, 2));

        // 检测已知的缓存/错误回复，添加标记但不阻断
        if (data.choices && data.choices[0]?.message?.content) {
            const content = data.choices[0].message.content;
            const KNOWN_CACHED_RESPONSES = [
                "前男友再现",
                "吃瓜群众忙",
                "旧情复燃难",
                "五味杂陈"
            ];

            const isCached = KNOWN_CACHED_RESPONSES.some(phrase => content.includes(phrase));
            if (isCached) {
                console.warn("[AI Proxy] Detected cached/repeated response, marking as cached");
                // 不阻断，只标记
                data._cached = true;
            }
        }

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

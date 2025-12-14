import http from 'http';

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3000${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

function post(path, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(`http://localhost:3000${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    try {
        console.log("1. Fetching latest story...");
        const stories = await get('/api/stories?limit=1');
        if (stories.length === 0) {
            console.log("No stories yet. Posting one...");
            await post('/api/stories', { content: 'Test Initial', aiSummary: 'Test' });
            return test(); // Retry
        }

        const latestId = stories[0].id;
        console.log("Latest ID:", latestId);

        console.log("2. Polling with since_id=" + latestId + " (Should be empty)");
        const updates = await get(`/api/stories?since_id=${latestId}`);
        console.log("Updates (expect empty):", updates);

        console.log("3. Posting new story...");
        const newStory = await post('/api/stories', { content: 'New Realtime Story', aiSummary: 'Test Summary' });
        console.log("New Story ID:", newStory.id);

        console.log("4. Polling again with since_id=" + latestId + " (Should have 1 story)");
        const updates2 = await get(`/api/stories?since_id=${latestId}`);
        console.log("Updates (expect >= 1):", updates2.map(s => s.id));

        if (updates2.length > 0 && updates2[0].id === newStory.id) {
            console.log("SUCCESS: Backend logic is correct.");
        } else {
            console.log("FAILURE: Backend did not return new story.");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { handlePlan } from './planner-api.mjs';

const files = {
    '/': ['index.html', 'text/html'],
    '/index.html': ['index.html', 'text/html'],
    '/styles.css': ['styles.css', 'text/css'],
    '/script.js': ['script.js', 'text/javascript'],
    '/intro.css': ['intro.css', 'text/css'],
    '/intro.js': ['intro.js', 'text/javascript'],
    '/profile.html': ['profile.html', 'text/html'],
    '/profile.js': ['profile.js', 'text/javascript'],
    '/person.html': ['person.html', 'text/html'],
    '/people.html': ['people.html', 'text/html'],
    '/people.css': ['people.css', 'text/css'],
    '/people.js': ['people.js', 'text/javascript'],
    '/planner.html': ['planner.html', 'text/html'],
    '/planner.js': ['planner.js', 'text/javascript'],
    '/calendar.html': ['calendar.html', 'text/html'],
    '/calendar.js': ['calendar.js', 'text/javascript'],
};

const server = http.createServer(async (request, response) => {
    const pathname = new URL(
        request.url,
        'http://localhost:3000'
    ).pathname;

    if (pathname === '/api/plan' && request.method === 'POST') {
        await handlePlan(request, response);
        return;
    }

    if (pathname === '/health') {
        response.writeHead(200, {
            'Content-Type': 'application/json'
        });

        response.end(JSON.stringify({
            message: 'Sidequest backend is running'
        }));

        return;
    }

    const file = files[pathname];

    if (!file) {
        response.writeHead(404);
        response.end('Not found');
        return;
    }

    try {
        const [filename, contentType] = file;
        const content = await readFile(
            new URL(filename, import.meta.url)
        );

        response.writeHead(200, {
            'Content-Type': `${contentType}; charset=utf-8`
        });

        response.end(content);
    } catch {
        response.writeHead(500);
        response.end('Could not load this file.');
    }
});

server.listen(3000, '127.0.0.1', () => {
    console.log('Open http://localhost:3000');
});
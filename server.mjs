import { handleConnect } from './connect-api.mjs';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { handlePlan } from './Scripts/planner-api.mjs';

const files = {
    '/': ['index.html', 'text/html'],
    '/index.html': ['index.html', 'text/html'],
    '/styles.css': ['styles.css', 'text/css'],
    '/nav.css': ['nav.css', 'text/css'],
    '/script.js': ['Scripts/script.js', 'text/javascript'],
    '/intro.css': ['Styling/intro.css', 'text/css'],
    '/intro.js': ['Scripts/intro.js', 'text/javascript'],
    '/profile.html': ['Sub-pages/profile.html', 'text/html'],
    '/profile.js': ['Scripts/profile.js', 'text/javascript'],
    '/person.html': ['Sub-pages/person.html', 'text/html'],
    '/people.html': ['Sub-pages/people.html', 'text/html'],
    '/people.css': ['Styling/people.css', 'text/css'],
    '/people.js': ['Scripts/people.js', 'text/javascript'],
    '/planner.html': ['Sub-pages/planner.html', 'text/html'],
    '/planner.js': ['Scripts/planner.js', 'text/javascript'],
    '/calendar.html': ['Sub-pages/calendar.html', 'text/html'],
    '/calendar.js': ['Scripts/calendar.js', 'text/javascript'],
};

const server = http.createServer(async (request, response) => {
  if (await handleConnect(request, response)) return;
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

const port = Number(process.env.PORT || 3000);

server.listen(port, '127.0.0.1', () => {
    console.log(`Open http://localhost:${port}`);
});
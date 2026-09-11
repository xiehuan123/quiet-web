import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const port = 4181;
const server = createServer(async (request, response) => {
  if (request.url === '/ticket1.html' || request.url === '/') {
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.end(await readFile(new URL('./fixtures/ticket1.html', import.meta.url)));
    return;
  }
  if (request.url === '/ticket2.html') {
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.end(await readFile(new URL('./fixtures/ticket2.html', import.meta.url)));
    return;
  }
  if (request.url === '/ticket2.js') {
    response.setHeader('content-type', 'text/javascript; charset=utf-8');
    response.end(await readFile(new URL('./fixtures/ticket2.js', import.meta.url)));
    return;
  }
  if (request.url === '/allowed-pixel.svg') {
    response.setHeader('content-type', 'image/svg+xml');
    response.end('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#18715f"/></svg>');
    return;
  }
  response.statusCode = 404;
  response.end('not found');
});

server.listen(port, '127.0.0.1', () => console.log(`quiet-web fixture http://127.0.0.1:${port}`));

// How to install and start
// npm install ws
// node server.js


const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

// Port for HTTP server
const HTTP_PORT = 80;

// Ports for WebSocket server
const WS_PORTS = [8080, 443];

// Serve the `index.html`
const server = http.createServer((req, res) => {
    if (req.url === '/' && req.method === 'GET') {
        fs.readFile('index.html', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// Start HTTP server
server.listen(HTTP_PORT, () => {
    console.log(`HTTP server running on port ${HTTP_PORT}`);
});

// Start WebSocket server(s)
const wsServers = WS_PORTS.map((port) => {
    const wss = new WebSocket.Server({ port });
    console.log(`WebSocket server running on port ${port}`);

    // Store messages
    const messages = [];

    // Handle WebSocket connections
    wss.on('connection', (ws) => {
        console.log('New client connected');

        // Send all previous messages to the new client
        ws.send(JSON.stringify({ type: 'history', messages }));

        // Handle incoming messages
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);

                // Validate message format
                if (typeof message === 'string') {
                    // Store the message
                    messages.push(message);

                    // Broadcast the message to all clients
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'new', message }));
                        }
                    });
                }
            } catch (err) {
                console.error('Error processing message:', err);
            }
        });

        // Handle connection close
        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    return wss;
});
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Global Error Handlers to prevent process crash
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
});

const PORT = process.env.PORT || 3001;
const BRAIN_URL = process.env.BRAIN_URL || 'http://localhost:5000/api/webhook/whatsapp';

let botEnabled = true;

app.use(express.json());
app.use(express.static('public'));

// API to toggle bot
app.post('/api/toggle-bot', (req, res) => {
    botEnabled = req.body.enabled !== undefined ? req.body.enabled : !botEnabled;
    io.emit('bot-status', botEnabled);
    console.log(`Bot state changed to: ${botEnabled ? 'ENABLED' : 'DISABLED'}`);
    res.json({ success: true, enabled: botEnabled });
});

// Log capture to stream to web
const originalLog = console.log;
console.log = (...args) => {
    originalLog(...args);
    io.emit('log', args.join(' '));
};

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: process.env.DATA_PATH || './session'
    }),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote'
        ],
    }
});

client.on('qr', (qr) => {
    // Generate QR for terminal
    qrcode.generate(qr, { small: true });
    
    // Generate QR as data URL for web
    QRCode.toDataURL(qr, (err, url) => {
        if (err) return console.log('Error generating QR URL:', err);
        io.emit('qr', url);
        console.log('QR Code updated for web.');
    });
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    io.emit('status', 'Ready');
});

client.on('authenticated', () => {
    console.log('WhatsApp Authenticated');
    io.emit('status', 'Authenticated');
});

client.on('auth_failure', (msg) => {
    console.error('WhatsApp Auth Failure:', msg);
    io.emit('status', 'Auth Failure');
});

client.on('message', async (msg) => {
    // Filter out status updates and group messages
    if (msg.from === 'status@broadcast') {
        return; // Ignore status updates
    }
    
    if (msg.from.endsWith('@g.us')) {
        console.log(`Ignoring group message from ${msg.from}`);
        return; // Ignore group messages
    }

    // Check if bot is enabled
    if (!botEnabled) {
        console.log(`Bot is DISABLED. Skipping message from ${msg.from}`);
        return;
    }

    console.log(`Received message from ${msg.from}: ${msg.body}`);
    
    try {
        const response = await axios.post(BRAIN_URL, {
            from: msg.from,
            body: msg.body
        });
        
        console.log('Forwarded to Brain, status:', response.status);
    } catch (err) {
        console.error('Error forwarding to Brain:', err.message);
    }
});

// Endpoint for Brain (Ruby) to send messages back
app.post('/send-message', async (req, res) => {
    const { to, body } = req.body;
    if (!to || !body) return res.status(400).send('Missing to or body');
    
    // Respond immediately to Brain to prevent timeout
    res.status(200).send('Message queued with 5s delay');

    console.log(`Queuing message to ${to} (5s delay)...`);

    setTimeout(async () => {
        try {
            await client.sendMessage(to, body);
            console.log(`Sent message to ${to} (after 5s): ${body}`);
        } catch (err) {
            console.error('Error sending delayed message:', err.message);
        }
    }, 5000);
});

io.on('connection', (socket) => {
    console.log('Web client connected');
    socket.emit('status', client.info ? 'Ready' : 'Waiting for QR');
    socket.emit('bot-status', botEnabled);
});

server.listen(PORT, () => {
    console.log(`Bridge Server running on http://localhost:${PORT}`);
    try {
        client.initialize();
    } catch (err) {
        console.error('Failed to initialize WhatsApp Client:', err.message);
    }
});

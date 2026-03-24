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

const PORT = process.env.PORT || 3001;
const BRAIN_URL = process.env.BRAIN_URL || 'http://localhost:3000/api/webhook/whatsapp';

app.use(express.json());
app.use(express.static('public'));

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
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
    
    try {
        await client.sendMessage(to, body);
        console.log(`Sent message to ${to}: ${body}`);
        res.status(200).send('Message sent');
    } catch (err) {
        console.error('Error sending message:', err.message);
        res.status(500).send('Error sending message');
    }
});

io.on('connection', (socket) => {
    console.log('Web client connected');
    socket.emit('status', client.info ? 'Ready' : 'Waiting for QR');
});

server.listen(PORT, () => {
    console.log(`Bridge Server running on http://localhost:${PORT}`);
    client.initialize();
});

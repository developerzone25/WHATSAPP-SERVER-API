const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const app = express();

app.get('/pair', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.json({ error: "No number" });
    try {
        const { state, saveCreds } = await useMultiFileAuthState(`./session_${num}`);
        const sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }) });
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(num);
                res.json({ code: code });
            } catch (e) { res.json({ error: "Retry" }); }
        }, 4000);
        
        sock.ev.on('creds.update', saveCreds);
    } catch (err) { res.json({ error: err.message }); }
});

app.listen(10000, () => console.log('Server Running'));

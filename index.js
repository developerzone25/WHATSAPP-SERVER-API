const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const app = express();

app.get('/pair', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.json({ error: "No number provided" });
    
    // নম্বর থেকে প্লাস বা অন্য চিহ্ন থাকলে তা পরিষ্কার করা
    num = num.replace(/[^0-9]/g, '');

    try {
        const { state, saveCreds } = await useMultiFileAuthState(`./session_${num}`);
        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'silent' }),
            browser: ["Ubuntu", "Chrome", "20.0.04"]
        });
        
        // Render সার্ভারের জন্য একটু সময় বাড়িয়ে দেওয়া হলো যেন ক্র্যাশ না করে
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(num);
                if (code) {
                    res.json({ code: code });
                } else {
                    res.json({ error: "Could not generate code" });
                }
            } catch (e) { 
                res.json({ error: "WhatsApp request timeout. Try again." }); 
            }
        }, 5000);
        
        sock.ev.on('creds.update', saveCreds);
    } catch (err) { 
        res.json({ error: err.message }); 
    }
});

// Render-এর পোর্ট সাধারণত ১০০০০ হয়, তাই এটি নির্দিষ্ট করে দেওয়া হলো
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

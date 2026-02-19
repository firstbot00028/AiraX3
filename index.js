const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const question = (text) => new Promise((resolve) => {
    const rl = require("readline").createInterface({ input: process.stdin, output: process.stdout });
    rl.question(text, (answer) => { rl.close(); resolve(answer); });
});

async function startAira() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ["AIRA XMD", "Chrome", "20.0.04"],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000
    });

    // --- DIRECT TERMINAL PAIRING (NO TELEGRAM NEEDED) ---
    if (!client.authState.creds.registered) {
        console.log("\n\nAIRA XMD: ENTER YOUR NUMBER (e.g. 91xxxxxxxxxx):");
        const phoneNumber = await question("");
        
        // Connection ready aavanulla delay
        await delay(5000); 
        
        try {
            const code = await client.requestPairingCode(phoneNumber);
            console.log(`\n\n🚀 YOUR PAIRING CODE: ${code} \n\n`);
        } catch (err) {
            console.log("\n❌ Connection error. Use 'rm -rf session' and restart.");
            process.exit(0);
        }
    }

    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = lastDisconnect.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                startAira();
            }
        } else if (connection === 'open') {
            console.log('✅ AIRA XMD CONNECTED! - Powered by Adam 🛡️');
        }
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('messages.upsert', async (chat) => {
        const m = chat.messages[0];
        if (!m.message) return;
        const from = m.key.remoteJid;
        const pushname = m.pushName || "User";
        const msgText = (m.message.conversation || m.message.extendedTextMessage?.text || "").toLowerCase();

        if (msgText === ".allmenu" || msgText === ".menu") {
            const menuImage = "https://telegra.ph/file/your-image.jpg"; // Ninte image link
            
            const fullMenu = `
╭──────────────〔 🤖 **AIRA XMD** 〕──────────────
│  ┃ ☆ 🚀 **BOT:** AIRA XMD
│  ┃ ☆ 👤 **USER:** ${pushname}
│  ┃ ☆ 👑 **OWNER:** ADAM
│  ┃ ☆ 🛡️ **VERSION:** 3.0 GOLD
│  ┃ 🎯 **PREFIX:** [ . ]
╰───────────────────────────────────────────────────

GOOD MORNING 🌅, ${pushname}
**AIRA X3 AT YOUR SERVICE**

╭──────────────〔 📁 **ALL CATEGORIES** 〕──────────
│  ┃ ☆ 📂 .play - YT MUSIC
│  ┃ ☆ 📂 .vv - VIEWONCE DOWNLOAD
│  ┃ ☆ 📂 .bugmenu - 100% CRASH
│  ┃ ☆ 📂 .aimenu - GPT-4 TURBO
│  ┃ ☆ 📂 .ownermenu - FULL CONTROL
│  ┃ ☆ 📂 .groupmenu - ADMIN TOOLS
│  ┃ ☆ 📂 .downloadmenu - ALL SOCIAL
│  ┃ ☆ 📂 .emojimenu - STICKER MIX
│  ┃ ☆ 📂 .voicemenu - AI VOICE
│  ┃ ☆ 📂 .imagemenu - AI IMAGE
│  ┃ ☆ 📂 .logomenu - LOGO MAKER
│  ┃ ☆ 📂 .gamemenu - GAMES
│  ┃ ☆ 📂 .animemenu - OTAKU
│  ┃ ☆ 📂 .utilitymenu - TOOLS
╰───────────────────────────────────────────────────

║  **POWERED BY ADAM 🛡️**`;

            await client.sendMessage(from, { 
                image: { url: menuImage }, 
                caption: fullMenu 
            }, { quoted: m });
        }
    });
}
startAira();

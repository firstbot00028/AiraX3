const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const question = (text) => new Promise((resolve) => {
    const rl = require("readline").createInterface({ input: process.stdin, output: process.stdout });
    rl.question(text, (answer) => { rl.close(); resolve(answer); });
});

async function startAira() {
    // Session management
    const { state, saveCreds } = await useMultiFileAuthState('session');

    const client = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false, // QR code venda
        browser: ["AIRA XMD", "Chrome", "1.0.0"] // Browser setting
    });

    // --- DIRECT TERMINAL PAIRING SYSTEM ---
    if (!client.authState.creds.registered) {
        console.log("\n\nAIRA XMD: ENTER YOUR NUMBER (e.g. 91xxxxxxxxxx):");
        const phoneNumber = await question("");
        
        await delay(3000);
        const code = await client.requestPairingCode(phoneNumber);
        console.log(`\n\n🚀 YOUR PAIRING CODE: ${code} \n\n`);
    }

    // Connection update monitor
    client.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = lastDisconnect.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                startAira(); // Auto-reconnect
            }
        } else if (connection === 'open') {
            console.log('AIRA XMD LIVE! - Powered By Adam 🛡️');
        }
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('messages.upsert', async (chat) => {
        const m = chat.messages[0];
        if (!m.message) return;
        const from = m.key.remoteJid;
        const pushname = m.pushName || "User";
        const msgText = (m.message.conversation || m.message.extendedTextMessage?.text || "").toLowerCase();

        // --- ADAM SPECIAL MENU ---
        if (msgText === ".allmenu" || msgText === ".menu") {
            const menuImage = "https://telegra.ph/file/your-image.jpg"; // Ninte image link ivide
            
            const menu = `
╭──────────────〔 🤖 **AIRA XMD** 〕──────────────
│  ┃ ☆ 🚀 **BOT:** AIRA XMD
│  ┃ ☆ 👤 **USER:** ${pushname}
│  ┃ ☆ ⏳ **UPTIME:** ${process.uptime().toFixed(0)} Sec
│  ┃ ☆ 👑 **OWNER:** ADAM
│  ┃ ☆ 🛡️ **VERSION:** 3.0 GOLD
│  ┃ 🎯 **PREFIX:** [ . ]
╰───────────────────────────────────────────────────

GOOD MORNING 🌅, ${pushname}
**AIRA X3 AT YOUR SERVICE**

╭──────────────〔 📁 **GOD MODE MENUS** 〕──────────
│  ┃ ☆ 📂 .play - YT MUSIC
│  ┃ ☆ 📂 .vv - VIEWONCE DOWNLOAD
│  ┃ ☆ 📂 .bugmenu - CRASH CMDS
│  ┃ ☆ 📂 .aimenu - AI ASSISTANT
│  ┃ ☆ 📂 .ownermenu - FULL CONTROL
│  ┃ ☆ 📂 .groupmenu - ADMIN TOOLS
│  ┃ ☆ 📂 .downloadmenu - ALL SOCIAL
│  ┃ ☆ 📂 .emojimenu - STICKER MIX
│  ┃ ☆ 📂 .voicemenu - AI VOICE
│  ┃ ☆ 📂 .imagemenu - AI IMAGE
│  ┃ ☆ 📂 .gamemenu - GAMES
│  ┃ ☆ 📂 .animemenu - OTAKU
│  ┃ ☆ 📂 .utilitymenu - TOOLS
╰───────────────────────────────────────────────────

║  **POWERED BY ADAM 🛡️**`;

            await client.sendMessage(from, { 
                image: { url: menuImage }, 
                caption: menu 
            }, { quoted: m });
        }
    });
}
startAira();

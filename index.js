const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const TelegramBot = require('node-telegram-bot-api');
const question = (text) => new Promise((resolve) => {
    const rl = require("readline").createInterface({ input: process.stdin, output: process.stdout });
    rl.question(text, (answer) => { rl.close(); resolve(answer); });
});

// --- CONFIGURATION ---
const tgToken = '8542941116:AAEhl5SCdu5i-yII8kSXVJY86EEwRmTe064'; //
const tgChatId = '8481555738'; //
const tgBot = new TelegramBot(tgToken, { polling: true });

async function startAira() {
    const { state, saveCreds } = await useMultiFileAuthState('session');

    const client = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ["AIRA XMD", "Safari", "3.0"]
    });

    // --- TELEGRAM PAIRING LOGIC ---
    if (!client.authState.creds.registered) {
        console.log("Enter Number with Country Code (91xxxxxxxxxx):");
        const phoneNumber = await question("");
        await delay(3000);
        const code = await client.requestPairingCode(phoneNumber);
        
        await tgBot.sendMessage(tgChatId, `🚀 *AIRA XMD PAIRING CODE*\n\nHello Adam, Your code: \`${code}\``, { parse_mode: 'Markdown' });
        console.log(`Pairing code sent to Telegram: ${code}`);
    }

    client.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') startAira();
        else if (connection === 'open') console.log('AIRA XMD LIVE! - Powered By Adam 🛡️');
    });

    client.ev.on('creds.update', saveCreds);

    client.ev.on('messages.upsert', async (chat) => {
        const m = chat.messages[0];
        if (!m.message) return;
        const from = m.key.remoteJid;
        const pushname = m.pushName || "User";
        const msgText = (m.message.conversation || m.message.extendedTextMessage?.text || "").toLowerCase();

        if (msgText === ".allmenu" || msgText === ".menu") {
            const menuImage = "dream.ab.digital.art-20260219-0002.jpg"; // Ivide ninte image link
            
            const menuTemplate = `
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
│  ┃ ☆ 📂 .aimenu - GPT-4 TURBO
│  ┃ ☆ 📂 .bugmenu - 100% CRASH
│  ┃ ☆ 📂 .ownermenu - FULL CONTROL
│  ┃ ☆ 📂 .emojimenu - STICKER MIX
│  ┃ ☆ 📂 .groupmenu - ADMIN TOOLS
│  ┃ ☆ 📂 .downloadmenu - ALL SOCIAL
│  ┃ ☆ 📂 .voicemenu - AI VOICE CHANGER
│  ┃ ☆ 📂 .imagemenu - AI IMAGE GENERATOR
│  ┃ ☆ 📂 .logomenu - NEON LOGO MAKER
│  ┃ ☆ 📂 .gamemenu - MULTIPLAYER GAMES
│  ┃ ☆ 📂 .animemenu - OTAKU SPECIAL
│  ┃ ☆ 📂 .utilitymenu - ADVANCED TOOLS
│  ┃ ☆ 📂 .funmenu - FUN & TROLLS
│  ┃ ☆ 📂 .miscmenu - OTHER CMDS
╰───────────────────────────────────────────────────

║  **POWERED BY ADAM 🛡️**`;

            await client.sendMessage(from, { 
                image: { url: menuImage }, 
                caption: menuTemplate 
            }, { quoted: m });
        }
    });
}
startAira();

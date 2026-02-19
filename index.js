const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const TelegramBot = require('node-telegram-bot-api');
const question = (text) => new Promise((resolve) => {
    const rl = require("readline").createInterface({ input: process.stdin, output: process.stdout });
    rl.question(text, (answer) => { rl.close(); resolve(answer); });
});

// --- CONFIGURATION ---
const tgToken = '8542941116:AAGTLw_8RrHeHIP9vDfTMJmbQApVzU9Q50U'; // Telegram @BotFather vazhi kittiath
const tgChatId = '8481555738'; // Telegram-il /id ennadichal kittaam
const tgBot = new TelegramBot(tgToken, { polling: true });

async function startAira() {
    const { state, saveCreds } = await useMultiFileAuthState('session');

    const client = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ["AIRA XMD", "Safari", "3.0"]
    });

    // --- TELEGRAM PAIRING SYSTEM ---
    if (!client.authState.creds.registered) {
        console.log("Enter Number with Country Code (e.g. 91xxxxxxxxxx):");
        const phoneNumber = await question("");
        
        await delay(3000);
        const code = await client.requestPairingCode(phoneNumber);
        
        // Automatic message to Telegram
        await tgBot.sendMessage(tgChatId, `🚀 *AIRA XMD PAIRING CODE*\n\nHello Adam, Your code is: \`${code}\`\n\nEnter this in your WhatsApp Link Device section.`, { parse_mode: 'Markdown' });
        console.log(`\nYour Pairing Code: ${code} (Sent to Telegram)\n`);
    }

    // --- CONNECTION MONITOR ---
    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = lastDisconnect.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log("Connection lost. Reconnecting...");
                startAira(); // Fix for "Couldn't connect"
            }
        } else if (connection === 'open') {
            console.log('AIRA XMD LIVE! - Powered By Adam 🛡️');
            await tgBot.sendMessage(tgChatId, "✅ Bot Connected Successfully! AIRA XMD is now LIVE.");
        }
    });

    client.ev.on('creds.update', saveCreds);

    // --- MESSAGE HANDLER & MENU ---
    client.ev.on('messages.upsert', async (chat) => {
        const m = chat.messages[0];
        if (!m.message) return;
        const from = m.key.remoteJid;
        const pushname = m.pushName || "User";
        const msgText = (m.message.conversation || m.message.extendedTextMessage?.text || "").toLowerCase();

        if (msgText === ".allmenu" || msgText === ".menu") {
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
│  ┃ ☆ 📂 .bugmenu - 100% CRASH
│  ┃ ☆ 📂 .aimenu - GPT-4 TURBO
│  ┃ ☆ 📂 .ownermenu - FULL CONTROL
│  ┃ ☆ 📂 .groupmenu - ADMIN TOOLS
│  ┃ ☆ 📂 .downloadmenu - ALL SOCIAL
│  ┃ ☆ 📂 .emojimenu - STICKER MIX
│  ┃ ☆ 📂 .voicemenu - AI VOICE
│  ┃ ☆ 📂 .imagemenu - AI IMAGE
╰───────────────────────────────────────────────────

║  **POWERED BY ADAM 🛡️**`;

            await client.sendMessage(from, { text: menu });
        }
    });
}

startAira();

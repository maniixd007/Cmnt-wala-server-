const axios = require("axios");
const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const { URL } = require("url");

// Load .env
dotenv.config();

// 🔁 Multi-token support
let TOKENS = [];
try {
  TOKENS = fs.readFileSync("token.txt", "utf-8").split("\n").map(t => t.trim()).filter(Boolean);
} catch {
  console.error("❌ token.txt not found");
  process.exit(1);
}

// 📃 Read comments
let comments = [];
try {
  comments = fs.readFileSync("comment.txt", "utf-8").split("\n").map(c => c.trim()).filter(Boolean);
} catch {
  console.error("❌ comment.txt not found");
  process.exit(1);
}

// 📃 Read names
let names = [];
try {
  names = fs.readFileSync("name.txt", "utf-8").split("\n").map(n => n.trim()).filter(Boolean);
} catch {
  console.error("❌ name.txt not found");
  process.exit(1);
}

const POST_LINK = process.env.POST_LINK;
const INTERVAL = parseInt(process.env.INTERVAL) || 60000;

if (!POST_LINK || TOKENS.length === 0) {
  console.error("❌ Missing POST_LINK or no tokens found.");
  process.exit(1);
}

// 🧠 Extract Post ID
function extractPostId(link) {
  try {
    const url = new URL(link);
    const uidMatch = url.pathname.match(/\/(\d+)\/posts/);
    const postIdMatch = url.pathname.match(/posts\/([a-zA-Z0-9]+)/);
    if (uidMatch && postIdMatch) {
      return `${uidMatch[1]}_${postIdMatch[1]}`;
    }
  } catch { return null; }
  return null;
}

const POST_ID = extractPostId(POST_LINK);
if (!POST_ID) {
  console.error("❌ Invalid POST_LINK");
  process.exit(1);
}

let commentIndex = 0;
let nameIndex = 0;

// 💀 Obfuscate message with random emojis
function obfuscate(msg) {
  const emojis = ["😈", "🔥", "💀", "👿", "🤡", "🥵", "🤖", "😡", "🤣", "🙄"];
  const rand = emojis[Math.floor(Math.random() * emojis.length)];
  return msg + " " + rand;
}

// 🧠 Human-like delay
function humanDelay() {
  return INTERVAL + Math.floor(Math.random() * 15000); // up to +15s
}

// 🌍 Anti-sleep keep-alive
setInterval(() => {
  axios.get("https://google.com").catch(() => {});
}, 60000);

// 🔁 Comment loop with retry, token switch
async function commentLoop() {
  const message = obfuscate(`${comments[commentIndex]} - ${names[nameIndex]}`);
  const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];

  try {
    await axios.post(`https://graph.facebook.com/${POST_ID}/comments`, null, {
      params: { message, access_token: token },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://facebook.com/",
        "Connection": "keep-alive",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });

    console.log(`✅ Sent: "${message}" at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error("❌ Error:", err.response?.data?.error?.message || err.message);
    setTimeout(() => {
      console.log("🔁 Retrying...");
      commentLoop(); // Retry immediately
    }, 10000);
    return;
  }

  commentIndex = (commentIndex + 1) % comments.length;
  nameIndex = (nameIndex + 1) % names.length;

  setTimeout(commentLoop, humanDelay());
}

// 🌐 Express server + start bot
const app = express();
app.get("/", (req, res) => res.send("✅ ANURAG Comment Bot is Live!"));
app.listen(process.env.PORT || 3000, () => {
  console.log("🌍 Server running. Commenting every ~", INTERVAL / 1000, "sec");
  commentLoop();
});

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const config = require("./config.json");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to TikTok...");
  await page.goto("https://www.tiktok.com/login", { waitUntil: "networkidle2" });

  await page.waitForTimeout(5000); // Let the login page load

  console.log("Please log in manually or automate login with credentials.");

  // Give time to log in
  await page.waitForTimeout(40000);

  const videoDir = path.join(__dirname, "videos");
  const videos = fs.readdirSync(videoDir).filter(file => file.endsWith(".mp4"));
  if (videos.length === 0) {
    console.log("No videos to post.");
    return;
  }

  const videoPath = path.join(videoDir, videos[0]);
  const caption = `🎯 Learn how to go from $0 to $10K ➡️ ${config.payhip_link}`;

  console.log("Navigating to upload page...");
  await page.goto("https://www.tiktok.com/upload?lang=en", { waitUntil: "networkidle2" });
  await page.waitForSelector("input[type='file']", { visible: true });
  const fileInput = await page.$("input[type='file']");
  await fileInput.uploadFile(videoPath);

  console.log("Uploading video...");
  await page.waitForTimeout(10000);
  await page.type("textarea[placeholder='Describe your video']", caption);
  await page.waitForTimeout(2000);
  await page.click("button:has-text('Post')");

  console.log("Posted video!");

  // Notify via CallMeBot
  try {
    const msg = `📢 TikTok posted! ${config.payhip_link}`;
    await axios.get(`https://api.callmebot.com/whatsapp.php?phone=${config.phone}&text=${encodeURIComponent(msg)}&apikey=${config.callmebot_api_key}`);
    console.log("✅ Notified via SMS.");
  } catch (err) {
    console.error("❌ SMS notification failed:", err.message);
  }

  // Delete the video after posting
  fs.unlinkSync(videoPath);
  console.log("🗑️ Video removed after posting.");

  await browser.close();
})();

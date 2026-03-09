const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Render requires the app to bind to process.env.PORT
const PORT = process.env.PORT || 3001;
process.env.PORT = PORT;

const distPath = path.join(__dirname, "dist", "devServer.js");

try {
  if (!fs.existsSync(distPath)) {
    console.log("📦 Building TypeScript...");
    execSync("npx tsc", { stdio: "inherit" });
  }

  console.log(`🚀 Starting backend on port ${PORT}...`);
  require(distPath);

} catch (err) {
  console.error("❌ Failed to start backend:", err);
  process.exit(1);
}

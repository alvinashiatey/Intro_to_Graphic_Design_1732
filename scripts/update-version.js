// Update version.json script
// Run with: node scripts/update-version.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to version.json
const versionFilePath = path.join(__dirname, "../public/version.json");

// Read current version file
let versionData;
try {
  const versionFileContent = fs.readFileSync(versionFilePath, "utf8");
  versionData = JSON.parse(versionFileContent);
} catch (err) {
  // If file doesn't exist or is invalid, create a new one
  versionData = {
    version: "0.0.0",
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

// Increment version (semver patch)
const versionParts = versionData.version.split(".").map(Number);
versionParts[2] += 1;
versionData.version = versionParts.join(".");

// Update last updated date
versionData.lastUpdated = new Date().toISOString().split("T")[0];

// Write back to file
fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), "utf8");

console.log(
  `Version updated to ${versionData.version} (${versionData.lastUpdated})`
);

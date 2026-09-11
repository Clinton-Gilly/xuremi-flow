import fs from "node:fs";
import { execFileSync } from "node:child_process";

// 1. Read .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const envMap = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // remove inline comments if not inside quotes
    if (!val.startsWith('"') && !val.startsWith("'")) {
      const hashIdx = val.indexOf("#");
      if (hashIdx !== -1) {
        val = val.slice(0, hashIdx).trim();
      }
    } else if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    envMap[key] = val;
  }
}

const deployKey = envMap.CONVEX_DEPLOY_KEY || "";
const prodConvexUrl = envMap.CONVEX_URL || envMap.NEXT_PUBLIC_CONVEX_URL || "";
const prodConvexSiteUrl = envMap.NEXT_PUBLIC_CONVEX_SITE_URL || "";
const appOrigin = envMap.APP_ORIGIN || "";

const varsToSet = [
  { key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", val: envMap.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, envs: "production,preview,development" },
  { key: "CLERK_SECRET_KEY", val: envMap.CLERK_SECRET_KEY, envs: "production,preview,development" },
  { key: "NEXT_PUBLIC_CLERK_SIGN_IN_URL", val: envMap.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in", envs: "production,preview,development" },
  { key: "NEXT_PUBLIC_CLERK_SIGN_UP_URL", val: envMap.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up", envs: "production,preview,development" },
  { key: "ENGINE_SECRET", val: envMap.ENGINE_SECRET, envs: "production,preview,development" },
  { key: "CREDENTIALS_KEK", val: envMap.CREDENTIALS_KEK, envs: "production,preview,development" },
  { key: "APP_ORIGIN", val: appOrigin, envs: "production,preview" },
  { key: "CONVEX_DEPLOY_KEY", val: deployKey, envs: "production,preview" },
  { key: "CONVEX_URL", val: prodConvexUrl, envs: "production,preview" },
  { key: "NEXT_PUBLIC_CONVEX_URL", val: prodConvexUrl, envs: "production,preview" },
  { key: "NEXT_PUBLIC_CONVEX_SITE_URL", val: prodConvexSiteUrl, envs: "production,preview" },
];

if (envMap.RESEND_API_KEY) {
  varsToSet.push({ key: "RESEND_API_KEY", val: envMap.RESEND_API_KEY, envs: "production,preview,development" });
}

if (envMap.AI_GATEWAY_API_KEY) {
  varsToSet.push({ key: "AI_GATEWAY_API_KEY", val: envMap.AI_GATEWAY_API_KEY, envs: "production,preview,development" });
}

for (const { key, val, envs } of varsToSet) {
  if (!val) {
    console.log(`Skipping ${key} (no value found)`);
    continue;
  }
  console.log(`Setting ${key} on ${envs}...`);
  try {
    execFileSync("npx", ["vercel", "env", "add", key, envs, "--value", val, "--yes", "--force"], {
      shell: true,
      stdio: "inherit",
    });
    console.log(`✔ Set ${key}`);
  } catch (err) {
    console.error(`✖ Failed to set ${key}:`, err.message);
  }
}

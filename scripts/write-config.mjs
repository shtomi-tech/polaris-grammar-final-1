import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// 単一アプリ化に伴い、config はリポジトリ直下に1つだけ生成する。
// 統合前は各アプリの static/ に同じものを別々に生成していた。
const configPath = resolve("config.json");
const config = {
  appBaseUrl: process.env.APP_BASE_URL || process.env.URL || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ""
};

mkdirSync(dirname(configPath), { recursive: true });
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
console.log(`Wrote ${configPath}`);

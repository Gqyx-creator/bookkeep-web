import { TCB_CONFIG } from './config.js';

let app; let auth; let db;
export async function initCloudbase() {
  if (TCB_CONFIG.accessKey.startsWith('PASTE_')) throw new Error('请先在 js/config.js 填入 CloudBase Publishable Key。');
  // 官方全量 CDN 在 index.html 中先加载；纯静态托管无需 Node.js 构建步骤。
  const cloudbase = window.cloudbase;
  if (!cloudbase) throw new Error('CloudBase Web SDK 加载失败，请检查网络或安全域名配置。');
  app = cloudbase.init({ env: TCB_CONFIG.env, region: TCB_CONFIG.region, accessKey: TCB_CONFIG.accessKey, auth: { detectSessionInUrl: true } });
  auth = app.auth;
  db = app.database();
  return { app, auth, db };
}
export const getAuth = () => auth;
export const getDb = () => db;

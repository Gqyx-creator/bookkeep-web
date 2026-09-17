import { TCB_CONFIG } from './config.js';

let app; let auth; let db;
export async function initCloudbase() {
  // 官方全量 CDN 在 index.html 中先加载；纯静态托管无需 Node.js 构建步骤。
  const cloudbase = window.cloudbase;
  if (!cloudbase) throw new Error('CloudBase Web SDK 加载失败，请检查网络或安全域名配置。');
  // 先进行真实用户登录；成功后的用户会话用于后续账目读写。
  // 不传匿名 Publishable Key，避免把该 JWT 带入邮箱/短信认证请求。
  app = cloudbase.init({ env: TCB_CONFIG.env, region: TCB_CONFIG.region,accessKey: TCB_CONFIG.accessKey, auth: { detectSessionInUrl: true } });
  auth = app.auth;
  db = app.database();
  return { app, auth, db };
}
export const getAuth = () => auth;
export const getDb = () => db;

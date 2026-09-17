import { getDb } from './cloudbase.js';
import { TCB_CONFIG } from './config.js';

const collection = () => getDb().collection(TCB_CONFIG.collection);
export function normalize(doc) {
  // 原型既有字段 id / role / date / start / end / amount / type 完整保留；只读取新增字段作为补充。
  return { ...doc, amount: Number(doc.amount || 0), hasTime: doc.hasTime ?? Boolean(doc.start && doc.end), startDate: doc.startDate || doc.date || '', endDate: doc.endDate || doc.date || '', start: doc.start || '', end: doc.end || '' };
}
export async function loadEntries(userId, month) {
  // 仅查询当前用户新增数据，不更新、不删除任何历史文档。
  const res = await collection().where({ userId }).orderBy('createdAt', 'desc').get();
  const rows = (res.data || []).map(normalize);
  return month ? rows.filter(x => (x.date || x.startDate || '').startsWith(month)) : rows;
}
export async function saveEntry(userId, raw) {
  const hasTime = raw.hasTime;
  if (hasTime && (!raw.startDate || !raw.start || !raw.endDate || !raw.end)) throw new Error('请补全开始和结束时间。');
  if (hasTime && `${raw.endDate}T${raw.end}` < `${raw.startDate}T${raw.start}`) throw new Error('结束时间不能早于开始时间。');
  const now = new Date().toISOString();
  const duration = hasTime ? (new Date(`${raw.endDate}T${raw.end}`) - new Date(`${raw.startDate}T${raw.start}`)) / 3600000 : 0;
  // 只新增字段：userId / startDate / endDate / hasTime / hourlyRate / createdAt / updatedAt / schemaVersion。
  const payload = { role: raw.role.trim(), date: hasTime ? raw.startDate : raw.date, start: hasTime ? raw.start : '', end: hasTime ? raw.end : '', amount: Number(raw.amount), type: raw.type, userId, startDate: hasTime ? raw.startDate : '', endDate: hasTime ? raw.endDate : '', hasTime, hourlyRate: raw.type === 'income' && duration > 0 ? Number((Number(raw.amount) / duration).toFixed(2)) : null, updatedAt: now, schemaVersion: 2 };
  if (raw._id) {
    // 仅允许编辑自己的记录；不使用 remove，不改集合结构。
    await collection().doc(raw._id).update({ data: payload });
  } else {
    await collection().add({ data: { ...payload, id: crypto.randomUUID(), createdAt: now } });
  }
}

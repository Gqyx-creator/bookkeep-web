import { initCloudbase } from './cloudbase.js';
import { currentUser, emailLogin, emailSignup, sendSms, phoneLogin, signOut } from './auth.js';
import { loadEntries, saveEntry } from './ledger.js';

const $ = s => document.querySelector(s); let user = null; let entries = [];
const today = () => new Date().toISOString().slice(0, 10);
const money = n => `¥${Number(n || 0).toFixed(2)}`;
const message = (target, text, error = false) => { target.textContent = text || ''; target.classList.toggle('error', error); };
function showApp(isLoggedIn) { $('#auth-screen').classList.toggle('hidden', isLoggedIn); $('#app-screen').classList.toggle('hidden', !isLoggedIn); }
function render() {
  const income = entries.filter(x => x.type === 'income').reduce((s, x) => s + x.amount, 0); const expense = entries.filter(x => x.type === 'expense').reduce((s, x) => s + x.amount, 0);
  $('#income-total').textContent = money(income); $('#expense-total').textContent = money(expense);
  $('#ledger-list').innerHTML = entries.length ? entries.map(x => `<button class="entry-card" data-id="${x._id}"><span class="entry-name">${escapeHtml(x.role)}</span><span class="entry-amount ${x.type}">${x.type === 'income' ? '+' : '−'}${money(x.amount)}</span>${x.hasTime ? `<span class="entry-time">${x.startDate} ${x.start} — ${x.endDate} ${x.end}${x.hourlyRate ? `　·　${money(x.hourlyRate)}/h` : ''}</span>` : '<span class="entry-time">未记录时间</span>'}</button>`).join('') : '<div class="empty">本月还没有记录，点击“新增账目”开始记账。</div>';
}
function escapeHtml(v) { const d = document.createElement('div'); d.textContent = v; return d.innerHTML; }
async function refresh() { try { entries = await loadEntries(user.id || user.uid, $('#month-filter').value); render(); } catch (e) { message($('#list-message'), `读取失败：${e.message}`, true); } }
function openEditor(entry = null) {
  $('#entry-form').reset(); $('#entry-id').value = entry?._id || ''; $('#dialog-title').textContent = entry ? '编辑账目' : '新增账目';
  $('#role').value = entry?.role || ''; $('#amount').value = entry?.amount ?? ''; document.querySelector(`[name=type][value="${entry?.type || 'income'}"]`).checked = true;
  $('#has-time').checked = Boolean(entry?.hasTime); $('#start-date').value = entry?.startDate || today(); $('#end-date').value = entry?.endDate || today(); $('#start-time').value = entry?.start || ''; $('#end-time').value = entry?.end || ''; toggleTime(); $('#entry-dialog').showModal();
}
function toggleTime() { $('#time-fields').classList.toggle('hidden', !$('#has-time').checked); }
function csvCell(v) { return `"${String(v ?? '').replaceAll('"', '""')}"`; }
async function exportCsv() { const all = await loadEntries(user.id || user.uid, ''); const header = ['id','role','date','start','end','amount','type','startDate','endDate','hasTime','hourlyRate','createdAt','updatedAt']; const body = all.map(x => header.map(k => csvCell(x[k])).join(',')); const blob = new Blob([[header.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' }); const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `打工记账备份-${today()}.csv` }); a.click(); URL.revokeObjectURL(a.href); }

document.querySelectorAll('[data-auth-tab]').forEach(b => b.onclick = () => { document.querySelectorAll('[data-auth-tab]').forEach(x => x.classList.toggle('active', x === b)); $('#email-form').classList.toggle('hidden', b.dataset.authTab !== 'email'); $('#phone-form').classList.toggle('hidden', b.dataset.authTab !== 'phone'); });
$('#email-form').onsubmit = async e => { e.preventDefault(); try { await emailLogin($('#email').value.trim(), $('#password').value); user = await currentUser(); showApp(true); refresh(); } catch (err) { message($('#auth-message'), err.message || '登录失败', true); } };
$('#email-signup').onclick = async () => { try { await emailSignup($('#email').value.trim(), $('#password').value); message($('#auth-message'), '注册请求已提交，请按邮箱验证邮件完成验证后登录。'); } catch (err) { message($('#auth-message'), err.message || '注册失败', true); } };
$('#send-code').onclick = async () => { try { const phone = $('#phone').value.replace(/\s/g, ''); if (!/^1\d{10}$/.test(phone)) throw new Error('请输入 11 位中国大陆手机号。'); await sendSms(phone); message($('#auth-message'), '验证码已发送，请查收短信。'); } catch (err) { message($('#auth-message'), err.message || '发送失败', true); } };
$('#phone-form').onsubmit = async e => { e.preventDefault(); try { await phoneLogin($('#sms-code').value.trim()); user = await currentUser(); showApp(true); refresh(); } catch (err) { message($('#auth-message'), err.message || '验证码登录失败', true); } };
$('#new-entry').onclick = () => openEditor(); $('#close-dialog').onclick = () => $('#entry-dialog').close(); $('#has-time').onchange = toggleTime;
$('#entry-form').onsubmit = async e => { e.preventDefault(); const type = document.querySelector('[name=type]:checked').value; try { await saveEntry(user.id || user.uid, { _id: $('#entry-id').value, role: $('#role').value, amount: $('#amount').value, type, hasTime: $('#has-time').checked, startDate: $('#start-date').value, endDate: $('#end-date').value, start: $('#start-time').value, end: $('#end-time').value, date: today() }); $('#entry-dialog').close(); await refresh(); } catch (err) { message($('#entry-message'), err.message || '保存失败', true); } };
$('#ledger-list').onclick = e => { const card = e.target.closest('.entry-card'); if (card) openEditor(entries.find(x => x._id === card.dataset.id)); };
$('#month-filter').value = today().slice(0, 7); $('#month-filter').onchange = refresh; $('#export-csv').onclick = () => exportCsv().catch(e => message($('#list-message'), `导出失败：${e.message}`, true)); $('#sign-out').onclick = async () => { await signOut(); user = null; showApp(false); };
try { await initCloudbase(); user = await currentUser(); showApp(Boolean(user)); if (user) await refresh(); } catch (err) { showApp(false); message($('#auth-message'), err.message, true); }
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));

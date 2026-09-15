import { getAuth } from './cloudbase.js';
let otpRequest = null;

function ensure(result) { if (result?.error) throw result.error; return result?.data; }
export async function currentUser() {
  const data = ensure(await getAuth().getSession());
  return data?.session?.user || null; // getSession 才是可靠的未登录拦截依据
}
export async function emailLogin(email, password) { return ensure(await getAuth().signInWithPassword({ email, password })); }
export async function emailSignup(email, password) { return ensure(await getAuth().signUp({ email, password })); }
export async function sendSms(phone) { otpRequest = ensure(await getAuth().signInWithOtp({ phone: `+86${phone}` })); }
export async function phoneLogin(code) {
  if (!otpRequest?.verifyOtp) throw new Error('请先发送验证码。');
  const data = ensure(await otpRequest.verifyOtp({ token: code })); otpRequest = null; return data;
}
export async function signOut() { ensure(await getAuth().signOut()); }

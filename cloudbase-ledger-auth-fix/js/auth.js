import { getAuth } from './cloudbase.js';
let otpRequest = null;
let signupRequest = null;

function ensure(result) { if (result?.error) throw result.error; return result?.data; }
export async function currentUser() {
  const data = ensure(await getAuth().getSession());
  return data?.session?.user || null; // getSession 才是可靠的未登录拦截依据
}
export async function emailLogin(email, password) { return ensure(await getAuth().signInWithPassword({ email, password })); }
export async function emailSignup(email, password) {
  signupRequest = ensure(await getAuth().signUp({ email, password }));
  return signupRequest;
}
export async function completeEmailSignup(code) {
  if (!signupRequest?.verifyOtp) throw new Error('请先发送邮箱验证码。');
  const data = ensure(await signupRequest.verifyOtp({ token: code })); signupRequest = null; return data;
}
export function cancelEmailSignup() { signupRequest = null; }
export async function sendSms(phone) { otpRequest = ensure(await getAuth().signInWithOtp({ phone, options: { shouldCreateUser: true } })); }
export async function phoneLogin(code) {
  if (!otpRequest?.verifyOtp) throw new Error('请先发送验证码。');
  const data = ensure(await otpRequest.verifyOtp({ token: code })); otpRequest = null; return data;
}
export async function signOut() { ensure(await getAuth().signOut()); }

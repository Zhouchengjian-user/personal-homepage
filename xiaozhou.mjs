import { answerQuestion, suggestedQuestions } from './xiaozhou-knowledge.mjs';
import { assistantConfig } from './xiaozhou-config.mjs';

const portrait = document.querySelector('.hero-portrait');
if (portrait) initAssistant(portrait);

function initAssistant(portrait) {
  const dock = document.createElement('div');
  dock.className = 'xz-dock';
  dock.dataset.state = 'idle';
  dock.innerHTML = `<span class="xz-art" aria-hidden="true">
    <img src="${new URL('./xiaozhou-robot.png', import.meta.url)}" alt="" width="1024" height="1536" decoding="async">
    <svg class="xz-face" viewBox="0 0 1024 1536" fill="none"><g class="xz-eyes" fill="currentColor"><ellipse cx="361" cy="377" rx="40" ry="47"/><ellipse cx="585" cy="369" rx="40" ry="47"/></g><path class="xz-mouth" d="M419 461 Q480 520 535 457" stroke="currentColor" stroke-width="17" stroke-linecap="round"/></svg>
  </span><button class="xz-launch" type="button" aria-haspopup="dialog" aria-controls="xiaozhou-dialog" aria-expanded="false"><i aria-hidden="true"></i>和小周聊聊<span aria-hidden="true">↗</span></button>`;
  portrait.append(dock);
  const avatarImage = dock.querySelector('.xz-art img');
  // Show face and body together after the transparent bitmap is decoded.
  avatarImage.decode().then(() => avatarImage.parentElement.classList.add('is-ready')).catch(() => {});
  const launch = dock.querySelector('button');
  const dialog = document.createElement('dialog');
  dialog.id = 'xiaozhou-dialog'; dialog.className = 'xz-dialog';
  dialog.setAttribute('aria-labelledby', 'xz-title');
  dialog.innerHTML = `<div class="xz-head"><span class="xz-symbol" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="9" width="26" height="20" rx="7"/><path d="M16 9V4M10 22q6 5 12 0"/><circle cx="16" cy="3" r="2"/><path d="M10 16v2M22 16v2" stroke-width="3" stroke-linecap="round"/></svg></span><div class="xz-heading"><h2 id="xz-title">小周 · AI 产品助手</h2><p>聊经历、聊项目，也聊产品思考</p></div><button class="xz-icon" type="button" aria-label="关闭小周对话">×</button></div>
  <p class="xz-mode">简历演示问答 · 模型待接入</p>
  <div class="xz-log" role="log" aria-label="与小周的对话" aria-live="polite" aria-relevant="additions"></div>
  <form class="xz-form"><div class="xz-status" role="status"><p>可以直接输入，或点一个问题开始</p><button class="xz-stop" type="button" hidden>停止</button></div>
  <div class="xz-entry"><textarea class="xz-input" rows="1" maxlength="600" aria-label="向小周提问" placeholder="问问我的项目、经历或能力…"></textarea><button class="xz-send" type="submit" aria-label="发送问题" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 12 7-7 7 7M12 5v15"/></svg></button></div>
  <div class="xz-tools"><button class="xz-tool xz-mic" type="button" aria-pressed="false">语音输入</button><button class="xz-tool xz-hints" type="button">问题提示</button><button class="xz-tool xz-clear" type="button">重新开始</button></div></form>`;
  document.body.append(dialog);
  const $ = (selector) => dialog.querySelector(selector);
  const log = $('.xz-log'), input = $('.xz-input'), send = $('.xz-send');
  const status = $('.xz-status p'), stop = $('.xz-stop'), mic = $('.xz-mic');
  const controller = { turn: 0, request: null, recognition: null, history: [], state: 'idle' };
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let endpoint = null;
  try {
    if (assistantConfig.endpoint) {
      const url = new URL(assistantConfig.endpoint, location.href);
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('invalid endpoint');
      endpoint = url.href;
    }
  } catch { /* Invalid configuration remains in local demo mode. */ }
  if (endpoint) $('.xz-mode').textContent = '基于简历与主页资料回答';
  if (!Recognition) { mic.disabled = true; mic.textContent = '此浏览器暂不支持语音输入'; }

  function setState(state, message, error = false) {
    controller.state = state; dock.dataset.state = state;
    status.textContent = message;
    $('.xz-status').dataset.error = String(error);
    stop.hidden = !['thinking', 'speaking', 'listening'].includes(state);
    stop.textContent = state === 'speaking' ? '打断播报' : '停止';
    mic.setAttribute('aria-pressed', String(state === 'listening'));
  }
  function cancel(message = '已停止，可以继续提问') {
    controller.turn++;
    controller.request?.abort(); controller.request = null;
    const recognition = controller.recognition; controller.recognition = null;
    recognition?.abort();
    window.speechSynthesis?.cancel();
    setState('idle', message);
  }
  function createMessage(role, text) {
    const item = document.createElement('article'); item.className = 'xz-message'; item.dataset.role = role;
    const p = document.createElement('p'); p.textContent = text; item.append(p); log.append(item);
    log.scrollTop = log.scrollHeight;
    return item;
  }
  function addHints(container) {
    const old = log.querySelector('.xz-questions'); old?.remove();
    const grid = document.createElement('div'); grid.className = 'xz-questions';
    for (const q of suggestedQuestions) {
      const button = document.createElement('button'); button.className = 'xz-question'; button.type = 'button';
      button.textContent = typeof q === 'string' ? q : q.question || q.text;
      button.addEventListener('click', () => ask(button.textContent)); grid.append(button);
    }
    container.append(grid); log.scrollTop = log.scrollHeight;
  }
  function welcome() {
    const item = createMessage('assistant', '你好，我是小周，周承健的 AI 产品助手。想了解他的项目经验、产品能力，或者从工程到 AI 的经历，都可以问我。');
    addHints(item);
  }
  function speak(text) {
    cancel('准备播报');
    if (!('speechSynthesis' in window)) return setState('idle', '此浏览器不支持朗读，可以直接阅读回答');
    setState('speaking', '准备播报，可以随时停止');
    const turn = controller.turn;
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'zh-CN'; utterance.rate = 1.04;
    const voices = speechSynthesis.getVoices().filter(v => /^zh/i.test(v.lang));
    utterance.voice = voices.find(v => /ting.?ting|yunxi|male|kangkang/i.test(v.name)) || voices[0] || null;
    utterance.onstart = () => { if (turn === controller.turn) setState('speaking', '小周正在播报，随时可以打断'); };
    utterance.onend = () => { if (turn === controller.turn) setState('idle', '播报完成，还想了解什么？'); };
    utterance.onerror = () => { if (turn === controller.turn) setState('idle', '暂时无法朗读，请阅读文字回答', true); };
    speechSynthesis.speak(utterance);
  }
  function addAnswer(result) {
    const item = createMessage('assistant', result.text);
    if (Array.isArray(result.sources)) {
      const sources = document.createElement('div'); sources.className = 'xz-sources';
      for (const source of result.sources.filter(s => s && typeof s === 'object').slice(0,3)) {
        const el = document.createElement('span'); el.textContent = typeof source.label === 'string' ? source.label : '简历与主页资料';
        // Sources never execute arbitrary model-provided URLs.
        const knownAnchors = ['home','about','skills','projects','influence','contact'];
        const hash = typeof source.url === 'string' && (source.url.startsWith('#') || source.url.startsWith('https://zhouchengjian-user.github.io/personal-homepage/#')) ? source.url.split('#')[1] : '';
        if (knownAnchors.includes(hash)) {
          const link = document.createElement('a'); link.href = '#' + hash; link.textContent = el.textContent;
          link.addEventListener('click', () => dialog.close()); sources.append(link);
        } else sources.append(el);
      }
      item.append(sources);
    }
    if ('speechSynthesis' in window) {
      const read = document.createElement('button'); read.className = 'xz-read'; read.type = 'button'; read.textContent = '◖ 朗读回答';
      read.addEventListener('click', () => speak(result.text)); item.append(read);
    }
    log.scrollTop = log.scrollHeight;
  }
  async function ask(raw) {
    const question = raw.trim().slice(0,600); if (!question) return;
    cancel('小周正在整理资料…');
    const turn = controller.turn;
    input.value = ''; send.disabled = true;
    createMessage('user', question);
    setState('thinking', '小周正在整理资料…');
    const request = new AbortController(); controller.request = request;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; request.abort(); }, assistantConfig.timeoutMs || 20000);
    try {
      let result;
      if (endpoint) {
        const response = await fetch(endpoint, {
          method:'POST', headers:{'Content-Type':'application/json'}, credentials:'omit', signal:request.signal,
          body:JSON.stringify({question,history:controller.history.slice(-10).map(({role,content,topic}) => ({role,content,topic}))})
        });
        if (!response.ok) throw new Error('service');
        result = await response.json();
        if (!result || typeof result.text !== 'string' || !result.text.trim()) throw new Error('response');
        result = {...result, text:result.text.slice(0,6000)};
      } else {
        // A brief asynchronous transition gives the user visible cancellation feedback.
        await new Promise(resolve => setTimeout(resolve, 220));
        result = answerQuestion(question, controller.history);
      }
      if (turn !== controller.turn || request.signal.aborted) return;
      addAnswer(result);
      controller.history.push({role:'user',content:question},{role:'assistant',content:result.text,topic:result.topic});
      controller.history = controller.history.slice(-20);
      setState('idle', endpoint ? '可以继续追问，或点击朗读回答' : '回答来自简历与主页资料 · 可以继续追问');
    } catch (error) {
      if (turn !== controller.turn) return;
      setState('error', timedOut ? '等待超时，请重新发送问题' : '连接暂时失败，请稍后重新发送', true);
      input.value = question; send.disabled = false;
    } finally { clearTimeout(timer); if (turn === controller.turn) controller.request = null; }
  }
  launch.addEventListener('click', () => {
    if (!dialog.open) dialog.showModal();
    launch.setAttribute('aria-expanded','true');
    input.focus({preventScroll:true});
  });
  $('.xz-icon').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { cancel('可以继续提问'); launch.setAttribute('aria-expanded','false'); launch.focus({preventScroll:true}); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  $('.xz-form').addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
  input.addEventListener('input', () => { send.disabled = !input.value.trim(); });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); ask(input.value); }
  });
  stop.addEventListener('click', () => cancel());
  $('.xz-hints').addEventListener('click', () => { addHints(log.lastElementChild || log); });
  $('.xz-clear').addEventListener('click', () => { cancel('可以直接输入，或点一个问题开始'); controller.history=[]; log.replaceChildren(); input.value=''; send.disabled=true; welcome(); });
  mic.addEventListener('click', () => {
    if (!Recognition) return;
    if (controller.recognition) return cancel();
    cancel('正在请求麦克风…');
    const turn = controller.turn, draft = input.value.trim(), recognition = new Recognition(); controller.recognition = recognition;
    recognition.lang='zh-CN'; recognition.continuous=false; recognition.interimResults=true;
    recognition.onstart = () => { if (turn === controller.turn) setState('listening','正在倾听，说完后可编辑并发送'); };
    recognition.onresult = event => {
      if (turn !== controller.turn) return;
      const transcript = Array.from(event.results).map(r=>r[0].transcript).join('');
      input.value = (draft ? draft + ' ' + transcript : transcript).slice(0,600); send.disabled=!input.value.trim();
    };
    recognition.onerror = event => {
      if (turn !== controller.turn) return;
      controller.recognition = null;
      const messages={'not-allowed':'麦克风未获授权，请在浏览器设置中允许，或直接打字','audio-capture':'没有可用麦克风，请检查设备或直接打字','network':'语音识别连接失败，可以直接打字','no-speech':'没有听清，请重试或直接打字'};
      setState('error',messages[event.error] || '暂时无法识别语音，可以直接打字',true);
    };
    recognition.onend = () => { if (turn === controller.turn) { controller.recognition = null; if (controller.state === 'listening') setState('idle',input.value ? '识别完成，确认文字后点击发送' : '没有听清，可以重试或直接打字'); } };
    try { recognition.start(); } catch { controller.recognition=null; setState('error','无法开启麦克风，可以直接打字',true); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel('已暂停，可以继续提问'); });
  window.addEventListener('pagehide', () => cancel());
  welcome();
}

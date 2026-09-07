import { answerQuestion, suggestedQuestions } from './xiaozhou-knowledge.mjs';
import { assistantConfig } from './xiaozhou-config.mjs?v=20260907cloud1';
import { XiaozhouRealtime } from './xiaozhou-realtime.mjs';

const GREETING = '你好，我是小周，承健的数字人助手。想了解他的经历、项目和产品思考，直接和我聊聊吧。';
const portrait = document.querySelector('.hero-portrait');
if (portrait) initAssistant(portrait);

function initAssistant(portrait) {
  const dock = document.createElement('div');
  dock.className = 'xz-dock'; dock.dataset.state = 'idle';
  const avatar = `<span class="xz-art" aria-hidden="true"><img src="${new URL('./xiaozhou-robot.png', import.meta.url)}" alt="" width="1024" height="1536" decoding="async"><svg class="xz-face" viewBox="0 0 1024 1536" fill="none"><g class="xz-eyes" fill="currentColor"><ellipse cx="361" cy="377" rx="40" ry="47"/><ellipse cx="585" cy="369" rx="40" ry="47"/></g><path class="xz-mouth" d="M419 461 Q480 520 535 457" stroke="currentColor" stroke-width="17" stroke-linecap="round"/></svg></span>`;
  dock.innerHTML = `${avatar}<button class="xz-launch" type="button" aria-haspopup="dialog" aria-controls="xiaozhou-dialog" aria-expanded="false"><i aria-hidden="true"></i><span class="xz-invite">我是数字人小周<span>想聊聊吗？</span></span><span aria-hidden="true">↗</span></button>`;
  portrait.append(dock);
  const launch = dock.querySelector('.xz-launch');
  const dialog = document.createElement('dialog');
  dialog.id = 'xiaozhou-dialog'; dialog.className = 'xz-dialog'; dialog.dataset.view = 'voice';
  dialog.setAttribute('aria-labelledby', 'xz-title');
  dialog.innerHTML = `<div class="xz-head"><span class="xz-symbol" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="9" width="26" height="20" rx="7"/><path d="M16 9V4M10 22q6 5 12 0"/><circle cx="16" cy="3" r="2"/><path d="M10 16v2M22 16v2" stroke-width="3" stroke-linecap="round"/></svg></span><div class="xz-heading"><h2 id="xz-title">小周 · 承健的数字人助手</h2><p>聊经历、聊项目，也聊产品思考</p></div><button class="xz-icon" type="button" aria-label="关闭对话并结束通话">×</button></div>
    <div class="xz-voice-stage"><div class="xz-call-avatar">${avatar}</div><div class="xz-call-info"><p class="xz-call-label">连接后直接说话</p><div class="xz-wave" aria-hidden="true">${Array.from({length:9},()=>'<i></i>').join('')}</div><span class="xz-call-time" aria-label="通话时长">00:00</span></div></div>
    <p class="xz-mode">允许麦克风后，小周会先和你打招呼</p>
    <div class="xz-status" role="status"><p>正在准备语音…</p></div>
    <div class="xz-log" role="log" aria-label="与小周的对话记录" aria-live="polite" aria-relevant="additions text"></div>
    <div class="xz-prompt-list" hidden><p>可以直接这样问小周</p></div>
    <div class="xz-call-controls"><button class="xz-mute xz-call-button" type="button" aria-pressed="false" disabled>静音</button><button class="xz-interrupt xz-call-button" type="button" disabled>打断小周</button><button class="xz-hangup xz-call-button" type="button">结束通话</button><button class="xz-reconnect xz-call-button" type="button" hidden>重新开麦</button></div>
    <form class="xz-form" hidden><div class="xz-entry"><textarea class="xz-input" rows="1" maxlength="600" aria-label="向小周提问" placeholder="输入问题，了解承健的经历和项目…"></textarea><button class="xz-send" type="submit" aria-label="发送问题" disabled>↑</button></div></form>
    <div class="xz-tools"><button class="xz-tool xz-hints" type="button" aria-expanded="false">不知道聊什么？</button><button class="xz-tool xz-text-mode" type="button">暂不开麦，打字聊</button></div>`;
  document.body.append(dialog);
  for (const img of [dock.querySelector('img'), dialog.querySelector('.xz-art img')]) {
    img.decode().then(()=>img.parentElement.classList.add('is-ready')).catch(()=>{});
  }
  const $ = selector=>dialog.querySelector(selector);
  const log=$('.xz-log'), input=$('.xz-input'), send=$('.xz-send'), status=$('.xz-status p');
  const rows=new Map(), history=[]; let client=null, callEpoch=0, timer=null, started=0, pendingText=0;
  const stateMessages={connecting:'请允许使用麦克风，正在连接小周…',listening:'我在听，你可以直接说话',thinking:'小周正在想一想…',speaking:'小周正在说话，你可以随时插话',muted:'麦克风已静音，点击“取消静音”继续',idle:'通话已结束，麦克风已释放'};
  function setState(state,message,error=false) {
    dock.dataset.state=state; dialog.dataset.state=state;
    status.textContent=message || stateMessages[state] || '';
    $('.xz-status').dataset.error=String(error);
    const connected=Boolean(client?.connected), muted=Boolean(client?.muted);
    $('.xz-mute').disabled=!connected; $('.xz-mute').textContent=muted?'取消静音':'静音';
    $('.xz-mute').setAttribute('aria-pressed',String(muted));
    $('.xz-interrupt').disabled=!connected || !['speaking','thinking'].includes(state);
    $('.xz-hangup').hidden=!['connecting','listening','thinking','speaking','muted'].includes(state);
    $('.xz-reconnect').hidden=['connecting','listening','thinking','speaking','muted'].includes(state);
    $('.xz-call-label').textContent=state==='speaking'?'小周在说':state==='listening'?'麦克风已开启':state==='muted'?'麦克风已静音':state==='connecting'?'正在连接':'期待下次聊天';
  }
  function amplitude(level) {
    const value=Math.max(0,Math.min(1,Number(level)||0));
    for (const mouth of [dock.querySelector('.xz-mouth'), dialog.querySelector('.xz-mouth')]) {
      mouth.style.transform=value ? `scaleY(${.65+value*2.5})` : '';
    }
    if (client?.state==='speaking') wave(value);
  }
  function wave(level) {
    const value=Math.max(0,Math.min(1,Number(level)||0));
    $('.xz-wave').style.setProperty('--xz-level',value);
  }
  function append(role,text,id) {
    const item=document.createElement('article');item.className='xz-message';item.dataset.role=role;
    const p=document.createElement('p');p.textContent=text;item.append(p);log.append(item);
    if(id)rows.set(id,item);
    while(log.children.length>40) { const first=log.firstElementChild; for(const [key,row] of rows)if(row===first)rows.delete(key); first.remove(); }
    log.scrollTop=log.scrollHeight;return item;
  }
  function transcript({id,role,text,final}) {
    if(!text)return;
    let item=rows.get(id);
    if(!item) item=append(role,text,id); else item.querySelector('p').textContent=text;
    item.dataset.final=String(Boolean(final));log.scrollTop=log.scrollHeight;
  }
  function resetTimer() {clearInterval(timer);timer=null;started=0;$('.xz-call-time').textContent='00:00';}
  function beginTimer(){if(timer)return;started=Date.now();timer=setInterval(()=>{const s=Math.floor((Date.now()-started)/1000);$('.xz-call-time').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;},1000);}
  function endCall(message='通话已结束，麦克风已释放') {
    callEpoch++; const old=client;client=null;old?.stop();clearInterval(timer);timer=null;amplitude(0);wave(0);setState('idle',message);
  }
  function realtimeURL() {
    let target=assistantConfig.realtimeEndpoint;
    if(!target && ['127.0.0.1','localhost'].includes(location.hostname)) target=`ws://${location.hostname}:5183/api/realtime`;
    if(!target)return null;
    const url=new URL(target,location.href);
    if(location.protocol==='https:' && !['https:','wss:'].includes(url.protocol))return null;
    if(!['http:','https:','ws:','wss:'].includes(url.protocol))return null;
    return url.href;
  }
  function errorMessage(error) {
    if(['NotAllowedError','PermissionDeniedError'].includes(error?.name)) return '麦克风未获授权。允许浏览器使用麦克风后，点击“重新开麦”；也可以先打字聊。';
    if(error?.name==='NotFoundError')return '没有找到麦克风，请连接设备后重试，也可以先打字聊。';
    if(error?.name==='NotReadableError')return '麦克风暂时被占用，请关闭其他占用麦克风的应用后重试。';
    return error?.message || '语音连接失败，请稍后重试，也可以先打字聊。';
  }
  function showVoice(){dialog.dataset.view='voice';$('.xz-form').hidden=true;$('.xz-text-mode').textContent='暂不开麦，打字聊';$('.xz-mode').textContent='实时语音对话 · 直接开口，随时可以打断';}
  async function startCall() {
    endCall();pendingText++;resetTimer();showVoice();log.replaceChildren();rows.clear();history.length=0;
    const url=realtimeURL();
    if(!url){setState('error','实时语音服务正在准备中，可以先打字了解承健。',true);return;}
    if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia){setState('error','当前浏览器无法开启麦克风，请用支持麦克风的浏览器打开此页面。',true);return;}
    const epoch=++callEpoch;
    client=new XiaozhouRealtime({url,
      onState:(state,message)=>{if(epoch!==callEpoch)return;setState(state,stateMessages[state] || message);if(['listening','speaking','thinking','muted'].includes(state))beginTimer();},
      onTranscript:event=>{if(epoch===callEpoch)transcript(event);},
      onAmplitude:level=>{if(epoch===callEpoch)amplitude(level);},
      onInputLevel:level=>{if(epoch===callEpoch && client?.state!=='speaking')wave(level);},
      onInterrupt:({responseIds})=>{if(epoch!==callEpoch)return;for(const id of responseIds){const row=rows.get(id);if(row)row.dataset.interrupted='true';}},
      onError:error=>{if(epoch!==callEpoch)return;clearInterval(timer);timer=null;amplitude(0);wave(0);setState('error',errorMessage(error),true);},
    });
    try {await client.start(); if(epoch===callEpoch){beginTimer();setState(client.state);}}
    catch(error){if(epoch===callEpoch && error.name!=='AbortError')setState('error',errorMessage(error),true);}
  }
  function textMode() {
    endCall();dialog.dataset.view='text';$('.xz-form').hidden=false;$('.xz-text-mode').textContent='切换开麦聊天';
    $('.xz-mode').textContent='文字备用 · 基于简历与主页的本地资料问答';
    setState('idle','输入想了解的问题，或点击下方的话题提示');
    if(!log.children.length)append('assistant',GREETING);
    input.focus({preventScroll:true});
  }
  function addSources(item,sources){
    const box=document.createElement('div');box.className='xz-sources';
    for(const source of (Array.isArray(sources)?sources:[]).filter(s=>s&&typeof s==='object').slice(0,3)){
      const label=typeof source.label==='string'?source.label:'简历与主页资料';
      const hash=typeof source.url==='string'&&(source.url.startsWith('#')||source.url.startsWith('https://zhouchengjian-user.github.io/personal-homepage/#'))?source.url.split('#')[1]:'';
      const valid=['home','about','skills','projects','company-projects','influence','contact'].includes(hash);
      const el=document.createElement(valid?'a':'span');el.textContent=label;
      if(valid){el.href='#'+hash;el.addEventListener('click',()=>dialog.close());}box.append(el);
    }item.append(box);
  }
  async function askLocal(raw){
    const q=raw.trim().slice(0,600);if(!q)return;
    const turn=++pendingText;input.value='';send.disabled=true;append('user',q);setState('thinking','正在查阅简历资料…');
    await new Promise(resolve=>setTimeout(resolve,160));if(turn!==pendingText || dialog.dataset.view!=='text')return;
    const result=answerQuestion(q,history);const row=append('assistant',result.text);addSources(row,result.sources);
    history.push({role:'user',content:q},{role:'assistant',content:result.text,topic:result.topic});if(history.length>20)history.splice(0,history.length-20);
    setState('idle','回答来自简历与主页资料 · 可以继续追问');log.scrollTop=log.scrollHeight;
  }
  for(const q of suggestedQuestions){
    const text=typeof q==='string'?q:q.question||q.text,button=document.createElement('button');button.type='button';button.className='xz-question';button.textContent=text;
    button.addEventListener('click',()=>{if(dialog.dataset.view==='text')askLocal(text);else{status.textContent=`试着直接说：“${text}”`;}});$('.xz-prompt-list').append(button);
  }
  launch.addEventListener('click',()=>{if(!dialog.open)dialog.showModal();launch.setAttribute('aria-expanded','true');startCall();});
  $('.xz-icon').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{pendingText++;endCall();launch.setAttribute('aria-expanded','false');launch.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  $('.xz-mute').addEventListener('click',()=>{client?.mute(!client.muted);setState(client?.state || 'idle');});
  $('.xz-interrupt').addEventListener('click',()=>{client?.interrupt();amplitude(0);});
  $('.xz-hangup').addEventListener('click',()=>endCall());$('.xz-reconnect').addEventListener('click',startCall);
  $('.xz-text-mode').addEventListener('click',()=>dialog.dataset.view==='voice'?textMode():startCall());
  $('.xz-hints').addEventListener('click',()=>{const box=$('.xz-prompt-list');box.hidden=!box.hidden;$('.xz-hints').setAttribute('aria-expanded',String(!box.hidden));});
  $('.xz-form').addEventListener('submit',event=>{event.preventDefault();askLocal(input.value);});
  input.addEventListener('input',()=>{send.disabled=!input.value.trim();});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();askLocal(input.value);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pendingText++;endCall('页面已切到后台，通话已结束；返回后可以重新开麦');}});
  window.addEventListener('pagehide',()=>{pendingText++;endCall();});
}

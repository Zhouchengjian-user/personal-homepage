// Browser-only realtime transport. Credentials and session instructions belong
// to the same-origin server; no provider key is accepted or stored here.
const CLOSED = Object.freeze({openness:0, roundness:0, energy:0, playing:false});
const noop = () => {};
const abortError = () => Object.assign(new Error('语音连接已取消'), {name:'AbortError'});
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function analyseFrames(samples, sampleRate) {
  const stride = Math.max(1, Math.round(sampleRate * .01)), frames = [];
  for (let start = 0; start < samples.length; start += stride) {
    const end = Math.min(samples.length, start + stride);
    let power = 0, crossings = 0;
    for (let i = start; i < end; i++) {
      power += samples[i] ** 2;
      if (i > start && (samples[i - 1] >= 0) !== (samples[i] >= 0)) crossings++;
    }
    const energy = Math.sqrt(power / (end - start));
    const openness = energy < .008 ? 0 : Math.min(1, ((energy - .008) * 5.5) ** .7);
    frames.push({energy, openness, roundness:openness ? clamp(.8 - crossings * sampleRate / (end - start) / 10000, .12, .85) : 0});
  }
  return {frames, frameSeconds:stride / sampleRate};
}

/** PCM playback and face amplitude share the actual output-device timeline. */
export class XiaozhouPCMPlayer {
  constructor(context, {onAmplitude=noop, onDrained=noop, now=()=>performance.now(), setTimer=(callback,delay)=>setTimeout(callback,delay), clearTimer=timer=>clearTimeout(timer)}={}) {
    this.ctx = context; this.onAmplitude = onAmplitude; this.onDrained = onDrained;
    this.now = now; this.setTimer = setTimer; this.clearTimer = clearTimer;
    this.output = context.createGain(); this.output.connect(context.destination);
    this.sources = new Set(); this.timeline = []; this.cursor = 0;
    this.frame = null; this.generation = 0; this.active = false; this.closed = false;
    this.shape = {...CLOSED}; this.lastTime = null;
  }
  play(base64, responseId, sampleRate=24000) {
    if (this.closed) return null;
    if (typeof base64 !== 'string' || !base64.length) return null;
    const decoded = atob(base64);
    if (decoded.length % 2) throw new Error('收到不完整的 PCM16 音频片段');
    const bytes = Uint8Array.from(decoded, character=>character.charCodeAt(0));
    const view = new DataView(bytes.buffer), samples = new Float32Array(bytes.length / 2);
    for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
    return this.playSamples(samples, responseId, sampleRate);
  }
  playSamples(samples, responseId, sampleRate=24000) {
    if (this.closed || !samples?.length) return null;
    if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error('无效的播放采样率');
    const buffer = this.ctx.createBuffer(1, samples.length, sampleRate);
    buffer.copyToChannel(samples, 0);
    const source = this.ctx.createBufferSource(); source.buffer = buffer; source.connect(this.output);
    const start = Math.max(this.cursor, this.ctx.currentTime + .025), end = start + buffer.duration;
    source.onended = () => { this.sources.delete(source); source.disconnect(); };
    source.start(start); this.sources.add(source); this.cursor = end; this.active = true;
    this.timeline.push({...analyseFrames(samples, sampleRate), start, end, responseId});
    if (this.frame === null) {
      const generation = this.generation;
      this.frame = this.setTimer(()=>this.tick(generation), 16);
    }
    return {start, end, duration:buffer.duration};
  }
  audibleTime() {
    const current = this.ctx.currentTime, stamp = this.ctx.getOutputTimestamp?.();
    if (stamp?.contextTime > 0 && stamp.performanceTime > 0) {
      return Math.min(current, stamp.contextTime + clamp((this.now() - stamp.performanceTime) / 1000, 0, .1));
    }
    return Math.max(0, current - Math.min(.25, (this.ctx.baseLatency || 0) + (this.ctx.outputLatency || 0)));
  }
  tick(generation) {
    if (this.closed || generation !== this.generation) return;
    this.frame = null;
    // Suspended/interrupted devices are silent even if their frozen clock sits
    // in a vowel. Keep queued PCM for resume, but never hold an open mouth.
    if (this.ctx.state && this.ctx.state !== 'running') {
      if (this.ctx.state === 'closed') { this.dispose(); this.onDrained(); return; }
      this.shape = {...CLOSED}; this.lastTime = null;
      this.onAmplitude(0, {...CLOSED, playbackTime:this.ctx.currentTime, audibleTime:this.audibleTime()});
      if (!this.closed && generation === this.generation && this.timeline.length) this.frame = this.setTimer(()=>this.tick(generation), 16);
      return;
    }
    const time = this.audibleTime();
    this.timeline = this.timeline.filter(chunk=>chunk.end > time);
    const chunk = this.timeline.find(item=>time >= item.start && time < item.end);
    const target = chunk ? {...chunk.frames[Math.min(chunk.frames.length - 1, Math.floor((time - chunk.start) / chunk.frameSeconds))], playing:true, responseId:chunk.responseId} : {...CLOSED};
    const dt = this.lastTime === null ? 1 / 60 : clamp(time - this.lastTime, 0, .05);
    this.lastTime = time;
    if (!target.openness) this.shape = {...target, openness:0, roundness:0};
    else {
      const blend = 1 - Math.exp(-dt / (target.openness > this.shape.openness ? .015 : .028));
      this.shape = {...target, openness:this.shape.openness + (target.openness - this.shape.openness) * blend};
    }
    this.onAmplitude(this.shape.openness, {...this.shape, playbackTime:this.ctx.currentTime, audibleTime:time});
    if (this.closed || generation !== this.generation) return;
    if (this.timeline.length) this.frame = this.setTimer(()=>this.tick(generation), 16);
    else {
      this.lastTime = null;
      if (this.active) { this.active = false; this.onDrained(); }
    }
  }
  pendingResponseIds() { return [...new Set(this.timeline.map(chunk=>chunk.responseId).filter(Boolean))]; }
  stop() {
    this.generation++;
    if (this.frame !== null) this.clearTimer(this.frame);
    this.frame = null;
    for (const source of this.sources) {
      source.onended = null;
      try { source.stop(); } catch {}
      try { source.disconnect(); } catch {}
    }
    this.sources.clear(); this.timeline = []; this.cursor = this.ctx.currentTime;
    this.shape = {...CLOSED}; this.lastTime = null; this.active = false;
    this.onAmplitude(0, {...CLOSED, playbackTime:this.ctx.currentTime, audibleTime:this.audibleTime()});
  }
  dispose() { if (this.closed) return; this.closed = true; this.stop(); this.output.disconnect(); }
}

/**
 * Call start()/connect() directly from a user click. It resolves on app.ready.
 * onTranscript receives stable {id, role, text, final} updates for the UI.
 * onAmplitude(level, features) is speaker audio only; onInputLevel is microphone.
 * onUsage receives each response ID once, including null usage on cancellation.
 */
export class XiaozhouRealtime {
  constructor(options={}) {
    this.options = options; this.session = null; this.generation = 0; this.state = 'idle';
    this.url = options.url || '/api/realtime';
    this.workletUrl = options.workletUrl || new URL('./xiaozhou-audio-worklet.js', import.meta.url).href;
    this.contextFactory = options.contextFactory || (()=>new (globalThis.AudioContext || globalThis.webkitAudioContext)());
    this.getUserMedia = options.getUserMedia || (constraints=>navigator.mediaDevices.getUserMedia(constraints));
    this.WebSocket = options.WebSocket || globalThis.WebSocket;
    this.WorkletNode = options.AudioWorkletNode || globalThis.AudioWorkletNode;
    this.setTimer = options.setTimer || ((callback,delay)=>setTimeout(callback,delay)); this.clearTimer = options.clearTimer || (timer=>clearTimeout(timer));
  }
  get connected() { return Boolean(this.session?.ready); }
  get muted() { return Boolean(this.session?.muted); }
  emit(name, ...args) { this.options[name]?.(...args); }
  setState(state, detail='') { this.state = state; this.emit('onState', state, detail); }
  current(session) { return this.session === session && !session.cancelled; }
  connect() { return this.start(); }
  start() {
    if (this.session) return this.session.promise;
    const session = {
      generation:++this.generation, ready:false, cancelled:false, muted:false, micEpoch:0,
      speechActive:false, turn:0, suppressedTurn:null, activeResponses:new Set(), blocked:new Set(),
      speechItems:new Set(), discardedSpeechItems:new Set(), currentSpeechItem:null,
      transcriptRows:new Map(), userItems:new Set(), usageIds:new Set()
    };
    session.promise = new Promise((resolve, reject)=>{ session.resolve = resolve; session.reject = reject; });
    this.session = session; this.setState('connecting', '正在请求麦克风并连接实时语音');
    this.emit('onAmplitude', 0, {...CLOSED}); this.emit('onInputLevel', 0);
    this.initialize(session).catch(error=>{ if (this.current(session)) this.fail(session, error); });
    return session.promise;
  }
  async initialize(session) {
    if (!this.current(session)) return;
    // Start resume and permission from the click's call stack. A late permission
    // result after stop() is released instead of attaching to a newer call.
    const ctx = this.contextFactory(); session.ctx = ctx;
    session.player = new XiaozhouPCMPlayer(ctx, {
      onAmplitude:(level, features)=>{ if (this.current(session)) this.emit('onAmplitude', level, features); },
      onDrained:()=>{ if (this.current(session) && session.ready) this.restingState(session); },
      now:this.options.now, setTimer:this.setTimer, clearTimer:this.clearTimer
    });
    const resuming = ctx.resume();
    const capturing = (async()=>this.getUserMedia({audio:{channelCount:1, echoCancellation:true, noiseSuppression:true, autoGainControl:true}}))().then(stream=>{
      if (!this.current(session)) stream.getTracks().forEach(track=>track.stop());
      else { session.stream = stream; stream.getAudioTracks().forEach(track=>{ track.enabled = !session.muted; }); }
      return stream;
    });
    await Promise.all([resuming, capturing]);
    if (!this.current(session)) return;
    await ctx.audioWorklet.addModule(this.workletUrl);
    if (!this.current(session)) return;
    session.mic = ctx.createMediaStreamSource(session.stream);
    session.recorder = new this.WorkletNode(ctx, 'xiaozhou-pcm-recorder');
    session.recorder.port.postMessage({type:'reset', epoch:session.micEpoch});
    session.silent = ctx.createGain(); session.silent.gain.value = 0;
    session.mic.connect(session.recorder); session.recorder.connect(session.silent); session.silent.connect(ctx.destination);
    session.recorder.port.onmessage = ({data})=>this.microphonePacket(session, data);
    session.trackEnded = ()=>{ if (this.current(session)) this.fail(session, new Error('麦克风已断开，请重新开始通话')); };
    session.stream.getAudioTracks().forEach(track=>track.addEventListener?.('ended', session.trackEnded));
    const url = new URL(this.url, globalThis.location?.href || 'http://localhost/');
    if (url.protocol === 'https:') url.protocol = 'wss:';
    else if (url.protocol === 'http:') url.protocol = 'ws:';
    if (!['ws:', 'wss:'].includes(url.protocol)) throw new Error('实时语音服务地址必须使用 WebSocket');
    session.socket = new this.WebSocket(url.href);
    session.socket.onmessage = ({data})=>{
      if (!this.current(session)) return;
      let event;
      try { event = JSON.parse(data); } catch { return; }
      try { this.handleEvent(session, event); } catch (error) { this.fail(session, error); }
    };
    session.socket.onerror = ()=>this.fail(session, new Error('实时语音连接失败，请检查本地服务或网络'));
    session.socket.onclose = ()=>this.fail(session, new Error('实时语音连接已断开，可以重新开始'));
    session.timer = this.setTimer(()=>this.fail(session, new Error('连接实时语音超时，请稍后重试')), this.options.connectTimeoutMs || 20000);
  }
  microphonePacket(session, data) {
    if (!this.current(session) || data?.type !== 'pcm' || data.epoch !== session.micEpoch) return;
    if (!session.ready || session.muted) { this.emit('onInputLevel', 0); return; }
    const rms = Number.isFinite(data.rms) ? data.rms : 0;
    this.emit('onInputLevel', rms < .008 ? 0 : Math.min(1, (rms - .008) * 8));
    const bytes = new Uint8Array(data.pcm); let binary = '';
    for (const value of bytes) binary += String.fromCharCode(value);
    this.send(session, {type:'input_audio_buffer.append', audio:btoa(binary)});
  }
  send(session, event) {
    if (!this.current(session) || !session.ready || session.socket?.readyState !== 1) return false;
    if (session.socket.bufferedAmount > 512000) {
      this.fail(session, new Error('网络发送积压，已停止通话，请重新连接')); return false;
    }
    try { session.socket.send(JSON.stringify(event)); return true; }
    catch { this.fail(session, new Error('语音发送失败，请重新连接')); return false; }
  }
  restingState(session) {
    if (session.muted) this.setState('muted', '麦克风已静音');
    else if (session.speechActive) this.setState('listening', '小周正在听，您可以继续说');
    else if (session.activeResponses.size) this.setState('thinking', '小周正在准备回答');
    else this.setState('listening', '可以直接说话，也可以随时打断');
  }
  interrupt() { if (this.session?.ready) this.interruptSession(this.session, 'button'); }
  /** Same-session keyboard fallback. The server owns provider-specific routing. */
  sendText(text) {
    const session = this.session, value = typeof text === 'string' ? text.trim() : '';
    if (!session?.ready) throw new Error('请先接通实时语音');
    if (!value) return null;
    if (value.length > 2000) throw new Error('单次文字请控制在 2000 字符以内');
    this.interruptSession(session, 'text');
    if (!this.current(session)) return null;
    session.turn++; session.speechActive = false; session.suppressedTurn = null;
    const id = `client-text-${session.generation}-${session.turn}`;
    this.resetInput(session);
    if (!this.send(session, {type:'app.text', text:value, client_id:id})) return null;
    session.userItems.add(id);
    this.emit('onTranscript', {id, role:'user', text:value, final:true});
    this.setState('thinking', '小周正在准备回答');
    return id;
  }
  interruptSession(session, source) {
    const ids = new Set([...session.activeResponses, ...session.player.pendingResponseIds()]);
    for (const id of ids) session.blocked.add(id);
    if (source === 'button') session.suppressedTurn = session.turn;
    session.activeResponses.clear(); session.player.stop();
    if (ids.size) this.send(session, {type:'response.cancel'});
    if (this.current(session)) {
      this.restingState(session);
      this.emit('onInterrupt', {source, responseIds:[...ids]});
    }
  }
  mute(value=true) {
    const session = this.session;
    if (!session || session.muted === Boolean(value)) return;
    session.muted = Boolean(value);
    session.stream?.getAudioTracks().forEach(track=>{ track.enabled = !session.muted; });
    this.resetInput(session);
    if (session.ready && !session.player?.active) this.restingState(session);
  }
  resetInput(session) {
    if (session.currentSpeechItem) session.discardedSpeechItems.add(session.currentSpeechItem);
    session.currentSpeechItem = null; session.speechActive = false; session.micEpoch++;
    session.recorder?.port.postMessage({type:'reset', epoch:session.micEpoch});
    this.emit('onInputLevel', 0);
    this.send(session, {type:'input_audio_buffer.clear'});
  }
  handleEvent(session, event) {
    this.emit('onEvent', event);
    if (!this.current(session)) return;
    if (event.type === 'app.error' || event.type === 'error') {
      const message = event.message || event.error?.message || '实时语音服务返回错误';
      // A cancellation may race normal completion. It does not end the call.
      if (/no.*(active|response)|not.*(active|progress)|cancel.*(no|not)/i.test(message)) return;
      this.fail(session, new Error(String(message).slice(0, 400))); return;
    }
    if (event.type === 'app.ready') {
      if (session.ready) return;
      this.clearTimer(session.timer); session.timer = null; session.ready = true;
      this.restingState(session); session.resolve(this); return;
    }
    if (event.type === 'input_audio_buffer.speech_started') {
      if (session.muted) { if (event.item_id) session.discardedSpeechItems.add(event.item_id); return; }
      if (event.item_id && session.discardedSpeechItems.has(event.item_id)) return;
      if (event.item_id && session.speechItems.has(event.item_id)) return;
      if (event.item_id) session.speechItems.add(event.item_id);
      session.currentSpeechItem = event.item_id || null;
      session.turn++; session.suppressedTurn = null; session.speechActive = true;
      this.interruptSession(session, 'voice'); return;
    }
    if (event.type === 'input_audio_buffer.speech_stopped') {
      if (session.muted || !session.speechActive || (event.item_id && session.discardedSpeechItems.has(event.item_id))) return;
      if (event.item_id && session.currentSpeechItem && event.item_id !== session.currentSpeechItem) return;
      session.speechActive = false; session.currentSpeechItem = null;
      this.setState(session.muted ? 'muted' : 'thinking', session.muted ? '麦克风已静音' : '小周正在准备回答'); return;
    }
    if (event.type === 'conversation.item.input_audio_transcription.completed' && event.transcript) {
      const id = event.item_id || event.event_id;
      if (id && session.discardedSpeechItems.has(id)) return;
      if (id && session.userItems.has(id)) return;
      if (id) session.userItems.add(id);
      this.emit('onTranscript', {id:id || `user-${session.turn}`, role:'user', text:event.transcript, final:true}); return;
    }
    const id = event.response_id || event.response?.id;
    if (event.type === 'response.created' && id) {
      if (session.speechActive || session.suppressedTurn === session.turn) {
        session.blocked.add(id); this.send(session, {type:'response.cancel'});
      } else { session.activeResponses.add(id); if (!session.player.active) this.restingState(session); }
      return;
    }
    if (event.type === 'response.done') {
      if (id) session.activeResponses.delete(id);
      if (id && !session.usageIds.has(id)) {
        session.usageIds.add(id);
        this.emit('onUsage', {responseId:id, usage:event.response?.usage ?? null, status:event.response?.status || null});
      }
      if (!this.current(session)) return;
      if (!session.player.active) this.restingState(session);
      return;
    }
    if (!id || session.blocked.has(id)) return;
    if (event.type === 'response.audio.delta') {
      if (session.speechActive || session.suppressedTurn === session.turn) { session.blocked.add(id); return; }
      if (session.player.play(event.delta, id, this.options.outputSampleRate || 24000)) this.setState('speaking', '小周正在说，您可以直接开口打断');
      return;
    }
    const audioText = event.type.startsWith('response.audio_transcript.');
    const plainText = event.type.startsWith('response.text.');
    if ((audioText || plainText) && (event.type.endsWith('.delta') || event.type.endsWith('.done'))) {
      const row = session.transcriptRows.get(id) || {audio:'', text:'', hasAudio:false};
      const field = audioText ? 'audio' : 'text', final = event.type.endsWith('.done');
      if (audioText) row.hasAudio = true;
      row[field] = final ? (event.transcript ?? event.text ?? row[field]) : row[field] + (event.delta || '');
      session.transcriptRows.set(id, row);
      // Audio subtitles and text output can describe the same response. Never
      // concatenate both channels into duplicate spoken sentences.
      if (audioText || !row.hasAudio) this.emit('onTranscript', {id, role:'assistant', text:row.hasAudio ? row.audio : row.text, final});
    }
  }
  disposeSession(session) {
    session.cancelled = true;
    if (session.timer != null) this.clearTimer(session.timer);
    if (session.socket) {
      session.socket.onmessage = session.socket.onerror = session.socket.onclose = null;
      try { session.socket.close(); } catch {}
    }
    if (session.recorder) session.recorder.port.onmessage = null;
    for (const node of [session.mic, session.recorder, session.silent]) { try { node?.disconnect(); } catch {} }
    session.stream?.getTracks().forEach(track=>{ track.removeEventListener?.('ended', session.trackEnded); track.stop(); });
    session.player?.dispose();
    try { session.ctx?.close()?.catch(noop); } catch {}
  }
  fail(session, error) {
    if (!this.current(session)) return;
    const reason = error instanceof Error ? error : new Error(String(error));
    this.disposeSession(session); this.session = null;
    session.reject(reason);
    this.emit('onAmplitude', 0, {...CLOSED}); this.emit('onInputLevel', 0);
    this.setState('error', reason.message); this.emit('onError', reason);
  }
  stop() {
    const session = this.session;
    if (session) { this.disposeSession(session); this.session = null; session.reject(abortError()); }
    this.generation++;
    this.emit('onAmplitude', 0, {...CLOSED}); this.emit('onInputLevel', 0);
    this.setState('idle', '语音通话已结束');
  }
}

export default XiaozhouRealtime;

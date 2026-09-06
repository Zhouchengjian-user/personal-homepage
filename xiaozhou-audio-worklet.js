// Continuous microphone PCM16 conversion for the server's 16 kHz input.
// Resampling phase is retained across browser render quanta, including 44.1 kHz.
class XiaozhouPCMRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.epoch = 0;
    this.reset();
    this.port.onmessage = ({data}) => {
      if (data?.type === 'reset') {
        this.epoch = Number.isInteger(data.epoch) ? data.epoch : this.epoch + 1;
        this.reset();
      }
    };
  }
  reset() { this.samples = []; this.offset = 0; this.chunk = []; }
  process(inputs) {
    const channels = inputs[0];
    if (!channels?.[0]?.length) return true;
    for (let i = 0; i < channels[0].length; i++) {
      let value = 0;
      for (const channel of channels) value += channel[i] || 0;
      this.samples.push(value / channels.length);
    }
    while (this.offset + 1 < this.samples.length) {
      const i = Math.floor(this.offset), fraction = this.offset - i;
      const value = this.samples[i] * (1 - fraction) + this.samples[i + 1] * fraction;
      this.chunk.push(Math.max(-32768, Math.min(32767, Math.round(value * 32767))));
      this.offset += this.ratio;
      // 40 ms packets keep microphone transport continuous without per-frame messages.
      if (this.chunk.length === 640) {
        const pcm = new ArrayBuffer(this.chunk.length * 2), view = new DataView(pcm);
        let power = 0;
        for (let j = 0; j < this.chunk.length; j++) {
          view.setInt16(j * 2, this.chunk[j], true);
          power += (this.chunk[j] / 32768) ** 2;
        }
        this.port.postMessage({type:'pcm', pcm, rms:Math.sqrt(power / this.chunk.length), epoch:this.epoch}, [pcm]);
        this.chunk = [];
      }
    }
    const drop = Math.min(this.samples.length, Math.floor(this.offset));
    this.samples.splice(0, drop); this.offset -= drop;
    return true;
  }
}
registerProcessor('xiaozhou-pcm-recorder', XiaozhouPCMRecorder);

/**
 * PCM Processor Worklet
 * Converts Float32 audio to Int16 PCM and sends it to the main thread.
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 2048;
    this._buffer = new Float32Array(this._bufferSize);
    this._bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this._buffer[this._bufferIndex++] = channelData[i];
        if (this._bufferIndex >= this._bufferSize) {
          this.sendAndReset();
        }
      }
    }
    return true;
  }

  sendAndReset() {
    const pcm16 = new Int16Array(this._bufferSize);
    for (let i = 0; i < this._bufferSize; i++) {
      const s = Math.max(-1, Math.min(1, this._buffer[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    this._bufferIndex = 0;
  }
}

registerProcessor('pcm-processor', PCMProcessor);

import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('nn-audio-visualizer')
export class NNAudioVisualizer extends LitElement {
  @property({ type: String }) audio: string = '';
  @property({ type: Number }) width: number = 320;
  @property({ type: Number }) height: number = 240;
  @state() private audioElement: HTMLAudioElement | null = null;
  @state() private context!: CanvasRenderingContext2D;
  @state() private audioContext!: AudioContext;
  @state() private audioSource!: MediaElementAudioSourceNode;
  @state() private analyser!: AnalyserNode;
  @state() private barWidth: number = (this.width / 64) * 2.5;
  @state() private dataArray: Uint8Array = new Uint8Array(0);

  private draw() {
    let x = 0;
    this.analyser!.getByteFrequencyData(this.dataArray!);

    this.context!.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.context!.fillRect(0, 0, this.width, this.height);

    const bars = 64;

    for (let i = 0; i < bars; i++) {
      const barHeight = this.dataArray![i];

      if (this.dataArray![i] > 210) {
        this.context!.fillStyle = 'rgb(250, 0, 255)';
      } else if (this.dataArray![i] > 200) {
        this.context!.fillStyle = 'rgb(250, 255, 0)';
      } else if (this.dataArray![i] > 190) {
        this.context!.fillStyle = 'rgb(204, 255 0)';
      } else if (this.dataArray![i] > 180) {
        this.context!.fillStyle = 'rgb(0, 219, 131)';
      } else {
        this.context!.fillStyle = 'rgb(0, 199, 255)';
      }

      this.context!.fillRect(x, this.height - barHeight, this.barWidth, barHeight);

      x += this.barWidth + 2;
    }

    requestAnimationFrame(this.draw.bind(this));
  }

  private onAudioPlay() {
    if (!this.audioElement) return;

    if (!this.context) {
      const canvasElement = this.shadowRoot!.querySelector('#canvas') as HTMLCanvasElement;

      this.context = canvasElement!.getContext('2d')!;

      this.audioContext = new AudioContext();

      this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
      this.analyser = this.audioContext.createAnalyser();

      this.audioSource.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.analyser.fftSize = 8192;

      const bufferLength = this.analyser.frequencyBinCount;

      this.dataArray = new Uint8Array(bufferLength);
    }

    this.draw();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, _old, value);

    if (name === 'audio' && value) {
      this.audioElement = this.ownerDocument.querySelector(value);
      if (this.audioElement) {
        this.audioElement.addEventListener('play', this.onAudioPlay.bind(this));
      }
    }
  }

  render() {
    return html`
      <style>
        :host {
          display: inline-flex;
        }
        canvas {
          width: ${this.width}px;
          height: ${this.height}px;
        }
      </style>
      <canvas id="canvas" width=${this.width} height=${this.height}></canvas>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'nn-audio-visualizer': NNAudioVisualizer;
  }
}

// audio.js — WebAudio beeps only, no audio files. Default ON, M toggles mute.
// The engine hum starts on the first user gesture (browsers require it).
'use strict';

var AudioFX = {
  ctx: null,
  muted: false,
  engineOsc: null,
  engineGain: null,
  started: false,

  ensure: function () {
    if (this.ctx || this.muted) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.0;
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 55;
      var filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
      this.started = true;
    } catch (e) { this.ctx = null; }
  },

  toggleMute: function () {
    this.muted = !this.muted;
    if (this.muted && this.engineGain) this.engineGain.gain.value = 0;
    return this.muted;
  },

  engine: function (throttle, speed) {
    if (!this.started || this.muted || !this.ctx) return;
    var t = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(48 + throttle * 0.9 + speed * 0.12, t, 0.1);
    this.engineGain.gain.setTargetAtTime(0.015 + throttle * 0.00035, t, 0.1);
  },

  beep: function (freq, dur, type, vol) {
    if (!this.ctx || this.muted) return;
    try {
      var t = this.ctx.currentTime;
      var osc = this.ctx.createOscillator();
      var gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol || 0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch (e) { /* audio is decoration; never break the game */ }
  },

  ring: function () { this.beep(880, 0.18, 'sine', 0.16); this.beep(1320, 0.28, 'sine', 0.12); },
  land: function () { this.beep(523, 0.15, 'triangle', 0.16); this.beep(784, 0.3, 'triangle', 0.14); },
  crash: function () { this.beep(110, 0.5, 'sawtooth', 0.2); this.beep(70, 0.7, 'square', 0.1); },
  click: function () { this.beep(660, 0.06, 'square', 0.06); },
};

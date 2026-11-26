// input.js — keyboard + mouse input, with edge-triggered action keys.
'use strict';

var Input = {
  keys: {},          // held keys by code
  pressed: {},       // keys pressed since last consume (edge trigger)
  mouseX: 640,
  mouseY: 360,
  mouseDown: false,
  mouseClicked: false,
  clickX: 0,
  clickY: 0,

  init: function (canvas) {
    var self = this;
    window.addEventListener('keydown', function (e) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
      if (!self.keys[e.code]) self.pressed[e.code] = true;
      self.keys[e.code] = true;
    });
    window.addEventListener('keyup', function (e) { self.keys[e.code] = false; });
    canvas.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      self.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      self.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('mousedown', function (e) {
      var rect = canvas.getBoundingClientRect();
      self.mouseDown = true;
      self.mouseClicked = true;
      self.clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
      self.clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
    });
    window.addEventListener('mouseup', function () { self.mouseDown = false; });
  },

  // True once for the frame after the key went down.
  wasPressed: function (code) {
    if (this.pressed[code]) { this.pressed[code] = false; return true; }
    return false;
  },

  consumeClick: function () {
    if (!this.mouseClicked) return null;
    this.mouseClicked = false;
    return { x: this.clickX, y: this.clickY };
  },

  endFrame: function () { this.pressed = {}; },

  // Steering axes in [-1, 1]: pitch (up positive), roll (right positive).
  pitchAxis: function () {
    var v = 0;
    if (this.keys.ArrowUp || this.keys.KeyW) v += 1;
    if (this.keys.ArrowDown || this.keys.KeyS) v -= 1;
    return v;
  },
  rollAxis: function () {
    var v = 0;
    if (this.keys.ArrowLeft || this.keys.KeyA) v -= 1;
    if (this.keys.ArrowRight || this.keys.KeyD) v += 1;
    if (this.mouseDown) v += clamp((this.mouseX - 640) / 320, -1, 1) * 0.7;
    return clamp(v, -1, 1);
  },
  throttleUp: function () { return !!(this.keys.ShiftLeft || this.keys.ShiftRight || this.keys.KeyE); },
  throttleDown: function () { return !!(this.keys.ControlLeft || this.keys.KeyQ); },
  brake: function () { return !!this.keys.Space; },
};

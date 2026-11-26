// world.js — seeded terrain: heightmap hills, a river, runways and ring gates.
// The world is generated once from a seed so every run with the same seed looks
// the same; the plane flies forward along +distance and the world scrolls past.
'use strict';

var World = {
  seed: 1,
  rng: null,
  hills: [],       // {phase, amp, freq, color} layered ridge silhouettes
  fields: [],      // ground patch rectangles {x, z, w, color}
  clouds: [],      // {x, y, s, speed}
  riverBends: [],  // river centre x at sample distances
  airfields: [],   // {name, distance, lateral}
  rings: [],       // active leg rings, rebuilt per leg
  legIndex: 0,
  legStart: 0,

  build: function (seed) {
    this.seed = seed;
    this.rng = makeSeededRandom(seed);
    var r = this.rng;
    this.hills = [];
    var ridgeColors = ['#5d7fa8', '#4a6f52', '#3c6b45', '#2f5c39'];
    for (var i = 0; i < 4; i++) {
      this.hills.push({
        phase: r() * Math.PI * 2,
        amp: 26 + r() * 42,
        freq: 0.0016 + r() * 0.0022,
        base: 0,
        color: ridgeColors[i],
      });
    }
    this.fields = [];
    var fieldColors = ['#6da24f', '#7fae57', '#5b9440', '#8fae4e', '#a8a35a'];
    for (var f = 0; f < 90; f++) {
      this.fields.push({
        x: (r() - 0.5) * 5200,
        z: r() * 14000,
        w: 260 + r() * 420,
        h: 120 + r() * 260,
        color: fieldColors[Math.floor(r() * fieldColors.length)],
      });
    }
    this.clouds = [];
    for (var c = 0; c < 14; c++) {
      this.clouds.push({ x: r() * 1280, y: 30 + r() * 190, s: 40 + r() * 90, speed: 4 + r() * 9 });
    }
    this.riverBends = [];
    for (var d = 0; d <= 40; d++) {
      this.riverBends.push(Math.sin(d * 0.55) * 700 + Math.sin(d * 0.21 + 1.7) * 420);
    }
    this.airfields = [];
    var dist = 0;
    for (var m = 0; m < SKY_MISSIONS.length; m++) {
      dist += SKY_MISSIONS[m].distance;
      this.airfields.push({ name: SKY_MISSIONS[m].airfield, distance: dist, lateral: (r() - 0.5) * 160 });
    }
    this.setLeg(0);
  },

  setLeg: function (legIndex) {
    this.legIndex = legIndex;
    var mission = SKY_MISSIONS[legIndex];
    this.legStart = 0;
    for (var i = 0; i < legIndex; i++) this.legStart += SKY_MISSIONS[i].distance;
    this.rings = mission.rings.map(function (ring) {
      return {
        at: ring.at, lateral: ring.lateral, alt: ring.alt, radius: ring.radius,
        passed: false, flash: 0,
      };
    });
  },

  // Height of the ridge line (in screen px above the horizon base) at screen x,
  // for ridge layer i, scrolling with distance and heading.
  ridgeHeight: function (layer, x, distance, heading) {
    var h = this.hills[layer];
    return h.amp * (0.6 + 0.4 * Math.sin(x * h.freq + h.phase + heading * 0.9 + distance * 0.00012));
  },

  // River centre x (world metres) at a given distance along the route.
  riverXAt: function (distance) {
    var idx = clamp(distance / 350, 0, 39);
    var i0 = Math.floor(idx);
    var i1 = Math.min(40, i0 + 1);
    return lerp(this.riverBends[i0], this.riverBends[i1], idx - i0);
  },

  // Distance (metres) from the plane to the next ring gate, or null.
  nextRing: function (distance) {
    for (var i = 0; i < this.rings.length; i++) {
      if (!this.rings[i].passed && this.rings[i].at > distance) return this.rings[i];
    }
    return null;
  },

  // Distance (metres) from the plane to the current leg's runway.
  runwayDistance: function (distance) {
    var mission = SKY_MISSIONS[this.legIndex];
    return mission.distance - (distance - this.legStart);
  },

  // Lateral offset (metres) of the runway centreline from the route centre.
  runwayLateral: function () {
    return this.airfields[this.legIndex].lateral;
  },
};

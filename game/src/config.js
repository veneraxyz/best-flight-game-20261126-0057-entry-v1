// config.js — constants, mission definitions and the seeded random source.
// Sky Courier: Ring Run is an original game: no borrowed names, art or levels.
'use strict';

var SKY = {
  canvasWidth: 1280,
  canvasHeight: 720,
  horizonRest: 300,       // horizon line y when level
  gravity: 9.8,
  minSpeed: 45,           // below this the plane stalls and sinks
  cruiseSpeed: 180,
  maxSpeed: 260,
  maxAltitude: 4000,
  fuelCapacity: 100,
  fuelBurn: 0.55,         // fuel per second at full throttle
  fuelBurnIdle: 0.08,
  ringScore: 250,
  landingBase: 500,
  smoothBonus: 300,
  damageHardLanding: 35,
  damageCrash: 100,
};

// Three delivery legs. Each leg: rings to fly through, then a runway to land on.
// Distances are in metres along the route; lateral offsets in metres from centreline.
var SKY_MISSIONS = [
  {
    name: 'Leg 1 — Greenfield Post',
    airfield: 'Greenfield',
    distance: 9000,
    rings: [
      { at: 2200, lateral: -140, alt: 900, radius: 90 },
      { at: 4500, lateral: 120, alt: 1100, radius: 90 },
      { at: 6800, lateral: -60, alt: 800, radius: 80 },
    ],
  },
  {
    name: 'Leg 2 — Riverbend Mail',
    airfield: 'Riverbend',
    distance: 11000,
    rings: [
      { at: 2600, lateral: 180, alt: 1300, radius: 90 },
      { at: 5200, lateral: -180, alt: 1000, radius: 80 },
      { at: 7800, lateral: 60, alt: 1500, radius: 80 },
      { at: 9600, lateral: -120, alt: 900, radius: 80 },
    ],
  },
  {
    name: 'Leg 3 — Stormpeak Express',
    airfield: 'Stormpeak',
    distance: 13000,
    rings: [
      { at: 3000, lateral: -200, alt: 1600, radius: 80 },
      { at: 5800, lateral: 200, alt: 1200, radius: 80 },
      { at: 8400, lateral: -100, alt: 1800, radius: 70 },
      { at: 10800, lateral: 140, alt: 1100, radius: 70 },
    ],
  },
];

// Deterministic RNG (mulberry32) so ?seed= shots reproduce exactly.
function makeSeededRandom(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Small helpers shared by the other modules.
function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function degToRad(d) { return d * Math.PI / 180; }

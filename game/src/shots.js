// shots.js — deterministic screenshot modes: ?shot=<name>&seed=1 sets a fixed
// initial state (seeded RNG) so renders are reproducible. The game is fully
// playable without any query parameters.
'use strict';

var Shots = {
  name: null,
  seed: 1,
  bigGauges: false,

  parse: function () {
    var params = new URLSearchParams(window.location.search);
    this.name = params.get('shot');
    var seedParam = parseInt(params.get('seed') || '1', 10);
    this.seed = Number.isFinite(seedParam) ? seedParam : 1;
    return this.name;
  },

  // Apply a shot's fixed state. Returns the game state to start in.
  apply: function (name) {
    this.bigGauges = false;
    if (name === 'cover') {
      // Mid-flight, a gold ring gate dead ahead, full HUD, instruments lit.
      Plane.reset(0);
      Plane.distance = 3900;
      Plane.lateral = 120;
      Plane.altitude = 1100;
      Plane.heading = 0;
      Plane.pitch = 2;
      Plane.roll = 6;
      Plane.speed = 180;
      Plane.throttle = 65;
      Plane.fuel = 78;
      Plane.score = 500;
      Plane.ringsHit = 2;
      return 'flying';
    }
    if (name === 'runway') {
      // Final approach: the runway fills the view ahead, low and slow.
      Plane.reset(0);
      Plane.distance = 8800;
      Plane.lateral = World.runwayLateral();
      Plane.altitude = 120;
      Plane.heading = 0;
      Plane.pitch = -3;
      Plane.roll = 0;
      Plane.speed = 95;
      Plane.throttle = 35;
      Plane.fuel = 54;
      Plane.score = 750;
      Plane.ringsHit = 3;
      return 'flying';
    }
    if (name === 'instruments') {
      // Low and slow with the gauges enlarged and prominent.
      Plane.reset(0);
      Plane.distance = 5000;
      Plane.lateral = -40;
      Plane.altitude = 320;
      Plane.heading = 8;
      Plane.pitch = 1;
      Plane.roll = -8;
      Plane.speed = 80;
      Plane.throttle = 40;
      Plane.fuel = 66;
      Plane.score = 500;
      Plane.ringsHit = 2;
      this.bigGauges = true;
      return 'flying';
    }
    if (name === 'landed') {
      // On the runway, mission-complete screen up.
      Plane.reset(0);
      Plane.distance = 9000;
      Plane.lateral = World.runwayLateral();
      Plane.altitude = 0;
      Plane.heading = 0;
      Plane.speed = 0;
      Plane.throttle = 0;
      Plane.fuel = 41;
      Plane.score = 1550;
      Plane.ringsHit = 3;
      Plane.landings = 1;
      Plane.lastEvent = 'Smooth landing! +800';
      return 'complete';
    }
    return null;
  },
};

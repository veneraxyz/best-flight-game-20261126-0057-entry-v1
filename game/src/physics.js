// physics.js — flight model: speed, heading, altitude, pitch, roll, throttle,
// fuel burn and damage. One clear job: move the plane, score nothing, draw nothing.
'use strict';

var Plane = {
  distance: 0,       // metres flown along the current leg
  lateral: 0,        // metres off the route centreline (+ right)
  altitude: 900,     // metres above ground
  heading: 0,        // degrees, 0 = along the route
  pitch: 0,          // degrees, + nose up
  roll: 0,           // degrees, + bank right
  speed: 120,        // knots-ish (displayed as km/h x 1)
  throttle: 60,      // percent
  fuel: 100,         // percent
  damage: 0,         // percent; 100 = wrecked
  verticalSpeed: 0,  // m/s, for landing quality
  flaps: false,
  gearDown: false,
  score: 0,
  ringsHit: 0,
  landings: 0,
  lastEvent: '',

  reset: function (legIndex) {
    this.distance = 0;
    this.lateral = 0;
    this.altitude = 900;
    this.heading = 0;
    this.pitch = 0;
    this.roll = 0;
    this.speed = 120;
    this.throttle = 60;
    this.fuel = 100;
    this.damage = 0;
    this.verticalSpeed = 0;
    this.flaps = false;
    this.gearDown = false;
    this.score = 0;
    this.ringsHit = 0;
    this.landings = 0;
    this.lastEvent = '';
    World.setLeg(legIndex || 0);
  },

  // One fixed-step update. Returns an event string ('ring', 'landed', 'crashed',
  // 'outoffuel', 'stall') or ''.
  update: function (dt, input) {
    var event = '';

    // Throttle: Shift/E up, Ctrl/Q down; brake (Space) is flaps + drag.
    if (input.throttleUp()) this.throttle = clamp(this.throttle + 34 * dt, 0, 100);
    if (input.throttleDown()) this.throttle = clamp(this.throttle - 34 * dt, 0, 100);
    this.flaps = input.brake();

    // Roll follows the stick, pitch follows the stick; both ease toward target.
    var targetRoll = input.rollAxis() * 42;
    var targetPitch = input.pitchAxis() * 14;
    this.roll = lerp(this.roll, targetRoll, clamp(dt * 3.2, 0, 1));
    this.pitch = lerp(this.pitch, targetPitch, clamp(dt * 2.6, 0, 1));

    // Heading turns with bank; more bank, tighter turn. Discipline pays: a
    // steep bank at low speed bleeds speed.
    var turnRate = this.roll * 0.55 * clamp(this.speed / 150, 0.4, 1.1);
    this.heading += turnRate * dt;
    this.heading = ((this.heading + 180) % 360 + 360) % 360 - 180;

    // Speed chases the throttle target; drag rises with bank, flaps and pitch.
    var targetSpeed = SKY.minSpeed + (this.throttle / 100) * (SKY.maxSpeed - SKY.minSpeed);
    var drag = 1 + Math.abs(this.roll) / 90 + (this.flaps ? 0.55 : 0) + Math.abs(this.pitch) / 60;
    this.speed = lerp(this.speed, targetSpeed / drag, clamp(dt * 0.55, 0, 1));
    if (this.speed < SKY.minSpeed * 0.55) event = 'stall';

    // Climb with pitch when fast enough; sink when slow.
    var climb = Math.sin(degToRad(this.pitch)) * this.speed * 0.9;
    if (this.speed < SKY.minSpeed) climb -= (SKY.minSpeed - this.speed) * 0.55;
    this.verticalSpeed = climb;
    this.altitude = clamp(this.altitude + climb * dt, 0, SKY.maxAltitude);

    // Forward motion and lateral drift from heading.
    var forward = this.speed * 0.514 * dt; // knots -> m/s
    this.distance += forward;
    this.lateral += Math.sin(degToRad(this.heading)) * forward;

    // Fuel: throttle burns it; running dry ends the sortie.
    var burn = (SKY.fuelBurnIdle + (this.throttle / 100) * SKY.fuelBurn) * dt;
    this.fuel = Math.max(0, this.fuel - burn);
    if (this.fuel <= 0 && this.throttle > 0) { this.throttle = 0; event = 'outoffuel'; }

    // Ring gates: pass through the hoop (close laterally and in altitude).
    var ring = World.nextRing(this.distance);
    if (ring && this.distance >= ring.at - 30 && this.distance <= ring.at + 30) {
      var dLat = Math.abs(this.lateral - ring.lateral);
      var dAlt = Math.abs(this.altitude - ring.alt);
      if (dLat < ring.radius && dAlt < ring.radius) {
        ring.passed = true;
        ring.flash = 1;
        this.ringsHit++;
        this.score += SKY.ringScore;
        event = 'ring';
      }
    }
    for (var i = 0; i < World.rings.length; i++) {
      if (World.rings[i].flash > 0) World.rings[i].flash = Math.max(0, World.rings[i].flash - dt * 2);
    }

    // Ground contact: on the runway = landing, anywhere else = crash.
    if (this.altitude <= 0) {
      var runwayLeft = World.runwayDistance(this.distance);
      var onRunway = runwayLeft < 220 && runwayLeft > -160 &&
        Math.abs(this.lateral - World.runwayLateral()) < 55 &&
        Math.abs(this.heading) < 18;
      if (onRunway) {
        var vs = Math.abs(this.verticalSpeed);
        var smooth = vs < 3 && this.speed > 55 && this.speed < 150;
        this.landings++;
        this.score += SKY.landingBase + (smooth ? SKY.smoothBonus : 0);
        this.lastEvent = smooth ? 'Smooth landing! +' + (SKY.landingBase + SKY.smoothBonus)
                                : 'Landed. +' + SKY.landingBase;
        if (!smooth) this.damage = Math.min(100, this.damage + SKY.damageHardLanding);
        event = 'landed';
      } else {
        this.damage = SKY.damageCrash;
        this.lastEvent = 'Crashed into the ground.';
        event = 'crashed';
      }
      this.altitude = 0;
    }
    if (this.damage >= 100 && event === '') event = 'crashed';
    return event;
  },
};

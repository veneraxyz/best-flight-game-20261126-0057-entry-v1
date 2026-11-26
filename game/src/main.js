// main.js — game loop and states: title / flying / landed / crashed / complete.
// Wires input, physics, rendering, HUD and sound together; nothing else.
'use strict';

var Game = {
  state: 'title',
  canvas: null,
  ctx: null,
  lastTime: 0,
  time: 0,
  legScore: 0,

  init: function () {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    Input.init(this.canvas);
    var shot = Shots.parse();
    World.build(Shots.seed);
    Plane.reset(0);
    if (shot) {
      var startState = Shots.apply(shot);
      if (startState) this.state = startState;
    }
    var self = this;
    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyM') AudioFX.toggleMute();
      if (e.code === 'KeyR') self.restart();
      if ((e.code === 'Enter' || e.code === 'Space') && self.state === 'title') self.startFlying();
    });
    window.__sky = { state: function () { return self.state; }, plane: Plane, world: World };
    requestAnimationFrame(function (t) { self.frame(t); });
  },

  startFlying: function () {
    AudioFX.ensure();
    AudioFX.click();
    this.state = 'flying';
  },

  restart: function () {
    Plane.reset(0);
    this.legScore = 0;
    this.state = 'title';
  },

  nextLeg: function () {
    this.legScore = Plane.score;
    var next = World.legIndex + 1;
    if (next >= SKY_MISSIONS.length) { this.state = 'complete'; return; }
    var score = Plane.score, rings = Plane.ringsHit, landings = Plane.landings;
    Plane.reset(next);
    Plane.score = score; Plane.ringsHit = rings; Plane.landings = landings;
    this.state = 'flying';
  },

  frame: function (t) {
    var self = this;
    requestAnimationFrame(function (nt) { self.frame(nt); });
    var dt = Math.min(0.05, (t - this.lastTime) / 1000 || 0.016);
    this.lastTime = t;
    this.time += dt;
    var ctx = this.ctx;

    if (this.state === 'title') {
      // Attract mode: the plane cruises gently behind the title screen.
      Plane.throttle = 55;
      Plane.speed = lerp(Plane.speed, 140, dt * 0.5);
      Plane.distance += Plane.speed * 0.514 * dt;
      Plane.altitude = 900 + Math.sin(this.time * 0.4) * 40;
      Plane.roll = Math.sin(this.time * 0.5) * 8;
      Render.draw(ctx, Plane, dt, this.time);
      Hud.drawPanel(ctx, Plane, false);
      Hud.drawTitle(ctx, Plane);
      var click = Input.consumeClick();
      if (Hud.clickedButton(click) === 'start') this.startFlying();
      AudioFX.engine(Plane.throttle, Plane.speed);
    } else if (this.state === 'flying') {
      var event = Plane.update(dt, Input);
      if (event === 'ring') AudioFX.ring();
      if (event === 'landed') {
        AudioFX.land();
        this.state = 'landed';
      }
      if (event === 'crashed') {
        AudioFX.crash();
        this.state = 'crashed';
      }
      if (event === 'stall' && Plane.altitude > 50) Plane.lastEvent = 'STALL — add throttle!';
      Render.draw(ctx, Plane, dt, this.time);
      Hud.drawTopHud(ctx, Plane);
      Hud.drawPanel(ctx, Plane, Shots.bigGauges);
      AudioFX.engine(Plane.throttle, Plane.speed);
    } else if (this.state === 'landed') {
      Render.draw(ctx, Plane, dt, this.time);
      Hud.drawTopHud(ctx, Plane);
      Hud.drawPanel(ctx, Plane, false);
      var last = World.legIndex + 1 >= SKY_MISSIONS.length;
      Hud.drawBanner(ctx,
        last ? 'ALL LEGS COMPLETE' : 'LEG COMPLETE — ' + SKY_MISSIONS[World.legIndex].airfield,
        Plane.lastEvent + '   Next: ' + (last ? 'mission complete' : SKY_MISSIONS[World.legIndex + 1].name),
        last ? 'FINISH  ▶' : 'NEXT LEG  ▶', last ? 'finish' : 'next');
      var click2 = Input.consumeClick();
      var btn = Hud.clickedButton(click2);
      if (btn === 'next') this.nextLeg();
      if (btn === 'finish') this.state = 'complete';
    } else if (this.state === 'crashed') {
      Render.draw(ctx, Plane, dt, this.time);
      Hud.drawPanel(ctx, Plane, false);
      Hud.drawBanner(ctx, 'CRASHED', Plane.lastEvent + '   Press R or fly again.',
        'FLY AGAIN  ▶', 'again');
      var click3 = Input.consumeClick();
      if (Hud.clickedButton(click3) === 'again') this.restart();
    } else if (this.state === 'complete') {
      Render.draw(ctx, Plane, dt, this.time);
      Hud.drawTopHud(ctx, Plane);
      Hud.drawPanel(ctx, Plane, false);
      Hud.drawBanner(ctx, 'MISSION COMPLETE',
        'All three mail legs delivered. ' + Plane.lastEvent,
        'FLY AGAIN  ▶', 'again');
      var click4 = Input.consumeClick();
      if (Hud.clickedButton(click4) === 'again') this.restart();
    }
    Input.endFrame();
  },
};

window.addEventListener('load', function () { Game.init(); });

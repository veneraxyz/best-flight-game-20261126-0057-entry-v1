// hud.js — the lit instrument panel, the text HUD (altitude, speed, heading,
// fuel, score, next-target distance) and the title / end screens with buttons.
'use strict';

var Hud = {
  // Clickable button rectangles, rebuilt each frame a screen is drawn.
  buttons: [],

  dial: function (ctx, cx, cy, r, value, max, label, unit, color) {
    ctx.save();
    // Lit dial face.
    ctx.fillStyle = '#101c2e';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3f6ea8';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    // Ticks.
    ctx.strokeStyle = '#8fb8e8';
    ctx.lineWidth = 1;
    for (var i = 0; i <= 10; i++) {
      var a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4));
      ctx.lineTo(cx + Math.cos(a) * (r - 10), cy + Math.sin(a) * (r - 10));
      ctx.stroke();
    }
    // Needle, glowing.
    var na = Math.PI * 0.75 + clamp(value / max, 0, 1) * Math.PI * 1.5;
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 8;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(na) * (r - 12), cy + Math.sin(na) * (r - 12)); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    // Label + digital value.
    ctx.fillStyle = '#cfe3ff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + r - 12);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(Math.round(value) + unit, cx, cy + r + 12);
    ctx.restore();
  },

  bar: function (ctx, x, y, w, h, value, label, color) {
    ctx.fillStyle = '#101c2e';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#3f6ea8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + 2, Math.max(0, (w - 4) * clamp(value / 100, 0, 1)), h - 4);
    ctx.fillStyle = '#cfe3ff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label + ' ' + Math.round(value) + '%', x, y - 5);
  },

  drawPanel: function (ctx, plane, bigGauges) {
    var panelY = bigGauges ? 520 : 596;
    var panelH = 720 - panelY;
    ctx.fillStyle = 'rgba(8,18,34,0.92)';
    ctx.fillRect(0, panelY, 1280, panelH);
    ctx.fillStyle = '#2c4a6e';
    ctx.fillRect(0, panelY, 1280, 2);
    var r = bigGauges ? 52 : 42;
    var cy = panelY + panelH / 2 - 6;
    this.dial(ctx, 120, cy, r, plane.altitude, SKY.maxAltitude, 'ALTITUDE', 'm', '#ffd76a');
    this.dial(ctx, 260, cy, r, plane.speed, SKY.maxSpeed, 'AIRSPEED', '', '#7ee2a8');
    // Heading compass: a tape with the current heading centred.
    ctx.save();
    ctx.fillStyle = '#101c2e';
    ctx.beginPath(); ctx.arc(400, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3f6ea8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(400, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#cfe3ff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HEADING', 400, cy + r - 12);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    var hdg = Math.round(((plane.heading % 360) + 360) % 360);
    ctx.fillText(String(hdg).padStart(3, '0') + '°', 400, cy + 6);
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.moveTo(400, cy - r + 4); ctx.lineTo(394, cy - r + 14); ctx.lineTo(406, cy - r + 14); ctx.closePath(); ctx.fill();
    ctx.restore();
    // Fuel / throttle / damage bars.
    var bx = 520;
    this.bar(ctx, bx, panelY + 22, 220, 16, plane.fuel, 'FUEL', plane.fuel < 20 ? '#ff5a4e' : '#7ee2a8');
    this.bar(ctx, bx, panelY + 58, 220, 16, plane.throttle, 'THROTTLE', '#6db7ff');
    this.bar(ctx, bx, panelY + 94, 220, 16, plane.damage, 'DAMAGE', '#ff9a3d');
    // Flaps / gear lamps.
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = plane.flaps ? '#7ee2a8' : '#5a6b80';
    ctx.fillText('FLAPS ' + (plane.flaps ? 'ON' : 'OFF'), bx + 250, panelY + 36);
    ctx.fillStyle = plane.altitude < 400 ? '#7ee2a8' : '#5a6b80';
    ctx.fillText('GEAR ' + (plane.altitude < 400 ? 'DOWN' : 'UP'), bx + 250, panelY + 72);
    ctx.fillStyle = AudioFX.muted ? '#ff9a3d' : '#5a6b80';
    ctx.fillText('SOUND ' + (AudioFX.muted ? 'OFF (M)' : 'ON (M)'), bx + 250, panelY + 108);
    // Score block.
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('SCORE ' + plane.score, 1250, panelY + 42);
    ctx.fillStyle = '#cfe3ff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('RINGS ' + plane.ringsHit + '   LANDINGS ' + plane.landings, 1250, panelY + 70);
  },

  drawTopHud: function (ctx, plane) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(8,18,34,0.72)';
    ctx.fillRect(12, 12, 400, 92);
    ctx.strokeStyle = '#3f6ea8';
    ctx.strokeRect(12, 12, 400, 92);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    var hdg = Math.round(((plane.heading % 360) + 360) % 360);
    ctx.fillText('ALT ' + Math.round(plane.altitude) + ' m', 24, 42);
    ctx.fillText('SPD ' + Math.round(plane.speed) + ' kt', 24, 72);
    ctx.fillText('HDG ' + String(hdg).padStart(3, '0') + '°', 24, 98);
    var mission = SKY_MISSIONS[World.legIndex];
    var ring = World.nextRing(plane.distance);
    var target = ring
      ? 'NEXT GATE ' + Math.max(0, Math.round(ring.at - plane.distance)) + ' m'
      : 'RUNWAY ' + Math.max(0, Math.round(World.runwayDistance(plane.distance))) + ' m — ' + mission.airfield;
    // Mission panel with its own dark backing so it reads over bright clouds.
    ctx.fillStyle = 'rgba(8,18,34,0.72)';
    ctx.fillRect(424, 12, 500, 92);
    ctx.strokeStyle = '#3f6ea8';
    ctx.strokeRect(424, 12, 500, 92);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(mission.name, 436, 40);
    ctx.fillStyle = '#cfe3ff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(target, 436, 66);
    if (plane.lastEvent) {
      ctx.fillStyle = '#7ee2a8';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(plane.lastEvent, 436, 92);
    }
    ctx.restore();
  },

  button: function (ctx, x, y, w, h, label, id) {
    var hover = Input.mouseX >= x && Input.mouseX <= x + w && Input.mouseY >= y && Input.mouseY <= y + h;
    ctx.fillStyle = hover ? '#ffb020' : '#1f7a6d';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 7);
    this.buttons.push({ id: id, x: x, y: y, w: w, h: h });
  },

  drawTitle: function (ctx, plane) {
    this.buttons = [];
    ctx.fillStyle = 'rgba(8,18,34,0.55)';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillText('SKY COURIER', 640, 150);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText('RING RUN', 640, 198);
    ctx.fillStyle = '#cfe3ff';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Fly the mail run: thread the gold ring gates, then land on the runway.', 640, 248);
    ctx.fillText('Three legs — Greenfield, Riverbend, Stormpeak. Fuel is limited. Land gently.', 640, 280);
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Arrows / WASD — pitch & bank      Shift / Ctrl — throttle up / down', 640, 340);
    ctx.fillText('Space — flaps & brake      Mouse — hold to steer      R — restart      M — sound', 640, 368);
    this.button(ctx, 490, 410, 300, 56, 'TAKE OFF  ▶', 'start');
    ctx.fillStyle = '#8fb8e8';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('Tip: keep the bank gentle and the throttle near 60% — steep turns bleed speed.', 640, 510);
    ctx.fillText('Fly through a ring dead-centre for +250. A smooth landing pays +800.', 640, 534);
  },

  drawBanner: function (ctx, title, sub, buttonLabel, buttonId) {
    this.buttons = [];
    ctx.fillStyle = 'rgba(8,18,34,0.6)';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillText(title, 640, 260);
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(sub, 640, 310);
    ctx.fillStyle = '#cfe3ff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Score ' + Plane.score + '   •   Rings ' + Plane.ringsHit + '   •   Landings ' + Plane.landings, 640, 350);
    this.button(ctx, 490, 400, 300, 56, buttonLabel, buttonId);
  },

  clickedButton: function (click) {
    if (!click) return null;
    for (var i = 0; i < this.buttons.length; i++) {
      var b = this.buttons[i];
      if (click.x >= b.x && click.x <= b.x + b.w && click.y >= b.y && click.y <= b.y + b.h) return b.id;
    }
    return null;
  },
};

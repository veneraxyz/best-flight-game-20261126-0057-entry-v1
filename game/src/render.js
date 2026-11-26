// render.js — the pseudo-3D chase view: sky gradient, sun, clouds, horizon,
// perspective terrain bands, the river, the runway converging to the horizon,
// ring gates as projected ellipses, and the plane silhouette banking with roll.
'use strict';

var Render = {
  // Project a ground point (forward distance d ahead, lateral offset L) to screen.
  groundPoint: function (d, lateral, plane, horizonY) {
    var scale = 900 / (d + 120);
    var x = 640 + (lateral - plane.lateral) * scale * 0.55 - plane.heading * 2.2;
    var y = horizonY + 460 * (300 / (d + 300));
    return { x: x, y: y, scale: scale };
  },

  // Project an air point (forward d, lateral L, altitude A) to screen.
  airPoint: function (d, lateral, alt, plane, horizonY) {
    var scale = 1400 / (d + 80);
    var x = 640 + (lateral - plane.lateral) * scale * 0.55 - plane.heading * 2.2;
    var y = horizonY - (alt - plane.altitude) * scale * 0.28 - plane.pitch * 3;
    return { x: x, y: y, scale: scale };
  },

  drawSky: function (ctx, plane, horizonY, dt, time) {
    var g = ctx.createLinearGradient(0, 0, 0, horizonY + 10);
    g.addColorStop(0, '#1d4e9e');
    g.addColorStop(0.55, '#5ea0d8');
    g.addColorStop(1, '#cfe8f7');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1280, Math.max(0, horizonY + 10));
    // Sun with glow.
    var sx = 1050, sy = 86;
    var sg = ctx.createRadialGradient(sx, sy, 8, sx, sy, 120);
    sg.addColorStop(0, 'rgba(255,244,180,0.95)');
    sg.addColorStop(0.25, 'rgba(255,226,120,0.55)');
    sg.addColorStop(1, 'rgba(255,226,120,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sx, sy, 120, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath(); ctx.arc(sx, sy, 34, 0, Math.PI * 2); ctx.fill();
    // Drifting clouds.
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (var i = 0; i < World.clouds.length; i++) {
      var c = World.clouds[i];
      c.x += c.speed * dt;
      if (c.x - c.s > 1300) c.x = -c.s;
      var cy = c.y + Math.sin(time * 0.3 + i) * 4;
      ctx.beginPath();
      ctx.ellipse(c.x, cy, c.s, c.s * 0.32, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.s * 0.5, cy + 6, c.s * 0.6, c.s * 0.26, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x - c.s * 0.5, cy + 8, c.s * 0.55, c.s * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawTerrain: function (ctx, plane, horizonY) {
    // Ground base.
    var g = ctx.createLinearGradient(0, horizonY, 0, 720);
    g.addColorStop(0, '#7fae57');
    g.addColorStop(0.5, '#5d9145');
    g.addColorStop(1, '#3f7031');
    ctx.fillStyle = g;
    ctx.fillRect(0, horizonY, 1280, 720 - horizonY);
    // Distant ridge silhouettes, parallax with heading and distance.
    for (var layer = 0; layer < 4; layer++) {
      var h = World.hills[layer];
      var baseY = horizonY + 4 + layer * 16;
      ctx.fillStyle = h.color;
      ctx.globalAlpha = 0.85 - layer * 0.12;
      ctx.beginPath();
      ctx.moveTo(0, 720);
      for (var x = 0; x <= 1280; x += 16) {
        var y = baseY - World.ridgeHeight(layer, x, plane.distance, plane.heading);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(1280, 720);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Field patches scrolling past (perspective quads on the ground plane).
    for (var i = 0; i < World.fields.length; i++) {
      var f = World.fields[i];
      var rel = ((f.z - plane.distance) % 14000 + 14000) % 14000;
      if (rel > 9000) continue;
      var p1 = this.groundPoint(rel, f.x, plane, horizonY);
      var p2 = this.groundPoint(rel + f.h, f.x + f.w, plane, horizonY);
      if (p1.y <= horizonY + 2) continue;
      ctx.fillStyle = f.color;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x) + 2, Math.max(2, Math.abs(p2.y - p1.y)));
    }
    ctx.globalAlpha = 1;
    // The river: a winding blue band running alongside the route.
    ctx.strokeStyle = '#3f8fd2';
    ctx.lineCap = 'round';
    for (var d = 300; d < 9000; d += 300) {
      var a = this.groundPoint(d, World.riverXAt(plane.distance + d), plane, horizonY);
      var b = this.groundPoint(d + 300, World.riverXAt(plane.distance + d + 300), plane, horizonY);
      ctx.lineWidth = Math.max(1, 26 * (900 / (d + 120)) * 0.28);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  },

  drawRunway: function (ctx, plane, horizonY) {
    var dist = World.runwayDistance(plane.distance);
    if (dist > 9000 || dist < -700) return;
    var lat = World.runwayLateral();
    var near = this.groundPoint(Math.max(20, dist), lat - 55, plane, horizonY);
    var nearR = this.groundPoint(Math.max(20, dist), lat + 55, plane, horizonY);
    var far = this.groundPoint(dist + 800, lat - 55, plane, horizonY);
    var farR = this.groundPoint(dist + 800, lat + 55, plane, horizonY);
    // Tarmac trapezoid converging to the horizon.
    ctx.fillStyle = '#3a3f46';
    ctx.beginPath();
    ctx.moveTo(near.x, near.y); ctx.lineTo(nearR.x, nearR.y);
    ctx.lineTo(farR.x, farR.y); ctx.lineTo(far.x, far.y);
    ctx.closePath(); ctx.fill();
    // White edge stripes so the strip reads at a glance.
    ctx.strokeStyle = '#e8ecf2';
    ctx.lineWidth = Math.max(1, near.scale * 1.5);
    ctx.beginPath(); ctx.moveTo(near.x, near.y); ctx.lineTo(far.x, far.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(nearR.x, nearR.y); ctx.lineTo(farR.x, farR.y); ctx.stroke();
    // Centreline dashes.
    ctx.strokeStyle = '#f5f5f5';
    ctx.lineWidth = Math.max(1, near.scale * 2);
    for (var d = 0; d < 800; d += 90) {
      var c1 = this.groundPoint(dist + d, lat, plane, horizonY);
      var c2 = this.groundPoint(dist + d + 45, lat, plane, horizonY);
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.stroke();
    }
    // Threshold bars at the near end.
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(near.x + 4, near.y - 4, Math.max(2, (nearR.x - near.x) * 0.42), 4);
    // Airfield label.
    if (dist < 4500 && dist > -100) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(World.airfields[World.legIndex].name + ' AIRFIELD', (far.x + farR.x) / 2, Math.max(30, far.y - 14));
    }
  },

  drawRings: function (ctx, plane, horizonY) {
    for (var i = 0; i < World.rings.length; i++) {
      var ring = World.rings[i];
      var d = ring.at - plane.distance;
      if (d < -40 || d > 6500) continue;
      var p = this.airPoint(Math.max(10, d), ring.lateral, ring.alt, plane, horizonY);
      var rx = Math.max(3, ring.radius * p.scale * 0.9);
      var ry = rx * 0.62;
      if (p.y < -80 || p.y > 700) continue;
      var passed = ring.passed;
      var col = passed ? '#39d353' : '#ffb020';
      ctx.save();
      ctx.shadowColor = col;
      ctx.shadowBlur = ring.flash > 0 ? 34 : 14;
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(2, rx * 0.12);
      ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = passed ? 'rgba(57,211,83,0.5)' : 'rgba(255,176,32,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold ' + Math.max(11, Math.min(22, rx * 0.22)) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(passed ? 'CLEAR' : 'GATE ' + (i + 1), p.x, p.y - ry - 8);
      ctx.restore();
    }
  },

  drawPlane: function (ctx, plane, time) {
    var cx = 640, cy = 478;
    var bob = Math.sin(time * 2.1) * 2;
    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.rotate(degToRad(plane.roll * 0.9));
    // Soft shadow on the ground far below is skipped; draw the chase silhouette.
    // Main wings (behind-view, spanning wide).
    ctx.fillStyle = '#e8b23a';
    ctx.beginPath();
    ctx.moveTo(-150, 6); ctx.lineTo(-34, -6); ctx.lineTo(-34, 10); ctx.lineTo(-150, 22);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(150, 6); ctx.lineTo(34, -6); ctx.lineTo(34, 10); ctx.lineTo(150, 22);
    ctx.closePath(); ctx.fill();
    // Tailplane.
    ctx.fillStyle = '#c98f1e';
    ctx.beginPath();
    ctx.moveTo(-52, -52); ctx.lineTo(-14, -58); ctx.lineTo(-14, -46); ctx.lineTo(-52, -40);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(52, -52); ctx.lineTo(14, -58); ctx.lineTo(14, -46); ctx.lineTo(52, -40);
    ctx.closePath(); ctx.fill();
    // Fuselage, seen from behind: cream body, teal stripe, lit windows.
    ctx.fillStyle = '#f4ede0';
    ctx.beginPath();
    ctx.moveTo(-26, -62); ctx.quadraticCurveTo(0, -74, 26, -62);
    ctx.lineTo(20, 26); ctx.quadraticCurveTo(0, 34, -20, 26);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1f7a6d';
    ctx.fillRect(-26, -18, 52, 9);
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(0, -46, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22303f';
    ctx.beginPath(); ctx.arc(-11, -52, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(11, -52, 5, 0, Math.PI * 2); ctx.fill();
    // Fin.
    ctx.fillStyle = '#1f7a6d';
    ctx.beginPath();
    ctx.moveTo(-8, -62); ctx.lineTo(0, -96); ctx.lineTo(8, -62);
    ctx.closePath(); ctx.fill();
    // Navigation lights, glowing.
    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#ff3b30'; ctx.fillStyle = '#ff3b30';
    ctx.beginPath(); ctx.arc(-150, 12, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = '#34d17b'; ctx.fillStyle = '#34d17b';
    ctx.beginPath(); ctx.arc(150, 12, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = '#ffffff'; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 30, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.restore();
  },

  // Full world frame (sky, terrain, runway, rings, plane). HUD is drawn by hud.js.
  draw: function (ctx, plane, dt, time) {
    var horizonY = SKY.horizonRest - plane.pitch * 3 - clamp((plane.altitude - 900) * 0.02, -40, 60);
    ctx.save();
    // The world banks gently opposite the plane so the horizon feels alive.
    ctx.translate(640, horizonY);
    ctx.rotate(degToRad(-plane.roll * 0.12));
    ctx.translate(-640, -horizonY);
    this.drawSky(ctx, plane, horizonY, dt, time);
    this.drawTerrain(ctx, plane, horizonY);
    this.drawRunway(ctx, plane, horizonY);
    this.drawRings(ctx, plane, horizonY);
    ctx.restore();
    this.drawPlane(ctx, plane, time);
  },
};

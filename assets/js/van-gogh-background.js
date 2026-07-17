(function () {
  "use strict";

  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  var baseCanvas = document.createElement("canvas");
  var baseContext = baseCanvas.getContext("2d");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  var width = 0;
  var height = 0;
  var stars = [];
  var travelers = [];
  var animationFrame;
  var lastPaint = 0;
  var resizeTimer;
  var randomState = 1889;

  canvas.id = "van-gogh-background";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);

  function random() {
    randomState |= 0;
    randomState = (randomState + 0x6d2b79f5) | 0;
    var value = Math.imul(randomState ^ (randomState >>> 15), 1 | randomState);
    value = value + Math.imul(value ^ (value >>> 7), 61 | value) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  function choose(colors) {
    return colors[Math.floor(random() * colors.length)];
  }

  function stroke(
    target,
    x,
    y,
    length,
    angle,
    thickness,
    color,
    opacity,
    bend
  ) {
    var endX = x + Math.cos(angle) * length;
    var endY = y + Math.sin(angle) * length;
    var normalX = Math.cos(angle + Math.PI / 2);
    var normalY = Math.sin(angle + Math.PI / 2);
    var curve = bend || 0;

    target.save();
    target.lineCap = "round";
    target.globalAlpha = opacity;

    target.beginPath();
    target.moveTo(x + 1.5, y + 2);
    target.quadraticCurveTo(
      (x + endX) / 2 + normalX * curve,
      (y + endY) / 2 + normalY * curve,
      endX + 1.5,
      endY + 2
    );
    target.strokeStyle = "rgba(1, 10, 35, 0.5)";
    target.lineWidth = thickness + 2.5;
    target.stroke();

    target.beginPath();
    target.moveTo(x, y);
    target.quadraticCurveTo(
      (x + endX) / 2 + normalX * curve,
      (y + endY) / 2 + normalY * curve,
      endX,
      endY
    );
    target.strokeStyle = color;
    target.lineWidth = thickness;
    target.stroke();

    target.beginPath();
    target.moveTo(x - normalX * thickness * 0.18, y - normalY * thickness * 0.18);
    target.quadraticCurveTo(
      (x + endX) / 2 + normalX * (curve - thickness * 0.12),
      (y + endY) / 2 + normalY * (curve - thickness * 0.12),
      endX - normalX * thickness * 0.18,
      endY - normalY * thickness * 0.18
    );
    target.strokeStyle = "rgba(255, 244, 193, 0.3)";
    target.lineWidth = Math.max(0.8, thickness * 0.22);
    target.stroke();
    target.restore();
  }

  function paintSkyBase() {
    var gradient = baseContext.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#061438");
    gradient.addColorStop(0.38, "#0a2e67");
    gradient.addColorStop(0.68, "#17659a");
    gradient.addColorStop(0.79, "#8a8d63");
    gradient.addColorStop(1, "#d59a2c");
    baseContext.fillStyle = gradient;
    baseContext.fillRect(0, 0, width, height);

    var upperColors = ["#09245a", "#123c79", "#15548d", "#2479a7", "#071d4b"];
    var lowerColors = ["#1c6897", "#3d8daf", "#e5af38", "#f1c453", "#285d83"];
    var scale = Math.max(0.75, Math.min(width / 1280, 1.5));
    var count = Math.round((width * height) / 1500);
    count = Math.max(520, Math.min(count, 1450));

    for (var index = 0; index < count; index += 1) {
      var x = random() * width;
      var y = random() * height * 0.76;
      var wave =
        Math.sin(x * 0.008 + y * 0.003) * 0.34 +
        Math.cos(y * 0.014 - x * 0.002) * 0.19;
      var angle = wave + (random() - 0.5) * 0.35;
      var length = (12 + random() * 38) * scale;
      var thickness = (2.1 + random() * 5.2) * scale;
      var color = choose(y < height * 0.52 ? upperColors : lowerColors);

      stroke(
        baseContext,
        x,
        y,
        length,
        angle,
        thickness,
        color,
        0.34 + random() * 0.38,
        (random() - 0.5) * 12
      );
    }
  }

  function paintHills() {
    var layers = [
      { y: 0.7, color: "#285878", stroke: "#5384a0", lift: 0.055 },
      { y: 0.76, color: "#173f58", stroke: "#316b78", lift: 0.07 },
      { y: 0.83, color: "#102f39", stroke: "#486e54", lift: 0.05 }
    ];

    layers.forEach(function (layer, layerIndex) {
      baseContext.beginPath();
      baseContext.moveTo(0, height);
      baseContext.lineTo(0, height * layer.y);

      for (var segment = 0; segment <= 12; segment += 1) {
        var x = width * segment / 12;
        var y =
          height * layer.y -
          Math.sin(segment * 1.33 + layerIndex) * height * layer.lift -
          Math.cos(segment * 0.57) * height * 0.025;
        baseContext.lineTo(x, y);
      }

      baseContext.lineTo(width, height);
      baseContext.closePath();
      baseContext.fillStyle = layer.color;
      baseContext.fill();

      for (var mark = 0; mark < 150; mark += 1) {
        var markX = random() * width;
        var markY = height * (layer.y + random() * (1 - layer.y));
        stroke(
          baseContext,
          markX,
          markY,
          10 + random() * 28,
          -0.25 + random() * 0.5,
          2 + random() * 3.5,
          layer.stroke,
          0.3 + random() * 0.25,
          (random() - 0.5) * 5
        );
      }
    });
  }

  function paintVillage() {
    var horizon = height * 0.79;
    var houseWidth = Math.max(24, Math.min(48, width / 26));
    var houseCount = Math.ceil(width / (houseWidth * 0.85));

    for (var index = -1; index < houseCount; index += 1) {
      var x = index * houseWidth * 0.88;
      var houseHeight = houseWidth * (0.45 + random() * 0.34);
      var y = horizon + random() * height * 0.065;
      var wallColor = choose(["#243d4a", "#314d54", "#584f45", "#3b4b50"]);
      var roofColor = choose(["#101e32", "#172943", "#28243c"]);

      baseContext.fillStyle = wallColor;
      baseContext.fillRect(x, y - houseHeight, houseWidth * 0.76, houseHeight);
      baseContext.beginPath();
      baseContext.moveTo(x - 4, y - houseHeight);
      baseContext.lineTo(x + houseWidth * 0.38, y - houseHeight - houseWidth * 0.3);
      baseContext.lineTo(x + houseWidth * 0.82, y - houseHeight);
      baseContext.closePath();
      baseContext.fillStyle = roofColor;
      baseContext.fill();

      if (random() > 0.42) {
        baseContext.fillStyle = choose(["#f4c44d", "#ffe18a", "#df912d"]);
        baseContext.shadowColor = "#f8bc43";
        baseContext.shadowBlur = 8;
        baseContext.fillRect(
          x + houseWidth * 0.24,
          y - houseHeight * 0.62,
          Math.max(3, houseWidth * 0.1),
          Math.max(4, houseHeight * 0.22)
        );
        baseContext.shadowBlur = 0;
      }
    }

    var churchX = width * 0.59;
    var churchY = horizon + height * 0.035;
    var churchWidth = Math.max(30, width * 0.035);
    var churchHeight = Math.max(58, height * 0.11);
    baseContext.fillStyle = "#192c3a";
    baseContext.fillRect(
      churchX,
      churchY - churchHeight,
      churchWidth,
      churchHeight
    );
    baseContext.beginPath();
    baseContext.moveTo(churchX - churchWidth * 0.15, churchY - churchHeight);
    baseContext.lineTo(churchX + churchWidth * 0.5, churchY - churchHeight * 1.82);
    baseContext.lineTo(churchX + churchWidth * 1.15, churchY - churchHeight);
    baseContext.closePath();
    baseContext.fill();

    stroke(
      baseContext,
      churchX + churchWidth * 0.5,
      churchY - churchHeight * 1.78,
      churchHeight * 0.36,
      -Math.PI / 2,
      3,
      "#233e4d",
      0.9,
      0
    );
  }

  function paintCypress() {
    var centerX = Math.max(54, width * 0.075);
    var bottom = height * 1.03;
    var top = height * 0.12;
    var treeHeight = bottom - top;

    baseContext.save();
    baseContext.beginPath();
    baseContext.moveTo(centerX, top);
    baseContext.bezierCurveTo(
      centerX - width * 0.02,
      height * 0.25,
      centerX - width * 0.055,
      height * 0.52,
      centerX - width * 0.04,
      bottom
    );
    baseContext.lineTo(centerX + width * 0.055, bottom);
    baseContext.bezierCurveTo(
      centerX + width * 0.07,
      height * 0.58,
      centerX + width * 0.025,
      height * 0.31,
      centerX,
      top
    );
    baseContext.closePath();
    baseContext.fillStyle = "#071f25";
    baseContext.fill();

    var colors = ["#082e2b", "#0b3f35", "#174e3b", "#315d42", "#101f2d"];
    for (var index = 0; index < 310; index += 1) {
      var progress = random();
      var y = bottom - progress * treeHeight;
      var silhouette = Math.sin(progress * Math.PI) * width * 0.048;
      var x = centerX + (random() - 0.5) * silhouette * 1.65;
      var direction = x < centerX ? -1 : 1;
      var angle =
        -Math.PI / 2 +
        direction * (0.2 + random() * 0.75) +
        Math.sin(progress * 15) * 0.16;

      stroke(
        baseContext,
        x,
        y,
        10 + random() * 31,
        angle,
        2.4 + random() * 5.5,
        choose(colors),
        0.55 + random() * 0.35,
        (random() - 0.5) * 9
      );
    }
    baseContext.restore();
  }

  function paintCanvasGrain() {
    baseContext.save();
    baseContext.globalAlpha = 0.1;

    for (var y = 2; y < height; y += 5) {
      baseContext.strokeStyle = y % 10 === 0 ? "#f5d88a" : "#051636";
      baseContext.lineWidth = 0.7;
      baseContext.beginPath();
      baseContext.moveTo(0, y);
      baseContext.lineTo(width, y + Math.sin(y) * 0.7);
      baseContext.stroke();
    }
    baseContext.restore();
  }

  function buildStars() {
    stars = [];
    var count = Math.max(13, Math.min(22, Math.round(width / 80)));

    for (var index = 0; index < count; index += 1) {
      stars.push({
        x: width * (0.14 + random() * 0.78),
        y: height * (0.06 + random() * 0.48),
        radius: 3 + random() * 7,
        phase: random() * Math.PI * 2,
        rings: 2 + Math.floor(random() * 3)
      });
    }

    stars.push({
      x: width * 0.36,
      y: height * 0.25,
      radius: Math.max(7, Math.min(width, height) * 0.012),
      phase: 0,
      rings: 5
    });
  }

  function buildTravelers() {
    travelers = [];
    var sceneScale = Math.max(0.7, Math.min(width / 1280, 1.15));
    var owlCount = width < 700 ? 2 : 3;
    var reindeerCount = width < 700 ? 1 : 2;

    for (var owl = 0; owl < owlCount; owl += 1) {
      travelers.push({
        type: "owl",
        offset: random() * (width + 420),
        y: height * (0.12 + random() * 0.48),
        speed: 16 + random() * 12,
        scale: sceneScale * (0.62 + random() * 0.32),
        phase: random() * Math.PI * 2
      });
    }

    for (var reindeer = 0; reindeer < reindeerCount; reindeer += 1) {
      travelers.push({
        type: "reindeer",
        offset: random() * (width + 620),
        y: height * (0.18 + random() * 0.38),
        speed: 11 + random() * 8,
        scale: sceneScale * (0.66 + random() * 0.26),
        phase: random() * Math.PI * 2
      });
    }
  }

  function buildBasePainting() {
    randomState = 1889;
    baseContext.clearRect(0, 0, width, height);
    paintSkyBase();
    paintHills();
    paintVillage();
    paintCypress();
    paintCanvasGrain();
    buildStars();
    buildTravelers();
  }

  function paintWindBands(time) {
    var motion = reducedMotion ? 0 : time * 0.000055;
    var bands = [
      {
        y: 0.22,
        amplitude: 0.075,
        color: "#68b6c7",
        highlight: "#c8dca9",
        width: 12
      },
      {
        y: 0.37,
        amplitude: 0.1,
        color: "#2d8cb3",
        highlight: "#85c5cb",
        width: 16
      },
      {
        y: 0.52,
        amplitude: 0.065,
        color: "#e0b33d",
        highlight: "#f7d873",
        width: 9
      }
    ];

    context.save();
    context.lineCap = "round";

    bands.forEach(function (band, bandIndex) {
      var y = height * band.y;
      var offset = Math.sin(motion * 8 + bandIndex) * height * 0.012;

      context.beginPath();
      context.moveTo(-width * 0.08, y + offset);
      context.bezierCurveTo(
        width * 0.18,
        y - height * band.amplitude,
        width * 0.3,
        y + height * band.amplitude,
        width * 0.5,
        y
      );
      context.bezierCurveTo(
        width * 0.7,
        y - height * band.amplitude,
        width * 0.83,
        y + height * band.amplitude * 0.8,
        width * 1.08,
        y - height * 0.02
      );
      context.strokeStyle = "rgba(3, 20, 56, 0.46)";
      context.lineWidth = band.width + 6;
      context.setLineDash([38, 13]);
      context.lineDashOffset = motion * -2100 + bandIndex * 17;
      context.stroke();

      context.strokeStyle = band.color;
      context.globalAlpha = 0.6;
      context.lineWidth = band.width;
      context.stroke();

      context.strokeStyle = band.highlight;
      context.globalAlpha = 0.48;
      context.lineWidth = Math.max(2, band.width * 0.24);
      context.lineDashOffset += 5;
      context.stroke();
    });

    context.restore();
  }

  function paintStar(star, time) {
    var pulse = 0.92 + Math.sin(time * 0.0014 + star.phase) * 0.08;

    context.save();
    context.globalCompositeOperation = "screen";

    for (var ring = star.rings; ring >= 1; ring -= 1) {
      var ringRadius = star.radius * (1.2 + ring * 1.25) * pulse;
      context.strokeStyle =
        ring % 2 === 0
          ? "rgba(255, 190, 38, " + (0.12 + 0.08 * ring) + ")"
          : "rgba(255, 239, 148, " + (0.15 + 0.08 * ring) + ")";
      context.lineWidth = Math.max(1.2, star.radius * (0.48 - ring * 0.045));
      context.beginPath();

      for (var point = 0; point <= 28; point += 1) {
        var angle = point / 28 * Math.PI * 2;
        var wobble = 1 + Math.sin(angle * 5 + star.phase) * 0.08;
        var x = star.x + Math.cos(angle) * ringRadius * wobble;
        var y = star.y + Math.sin(angle) * ringRadius * wobble;
        if (point === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
    }

    var glow = context.createRadialGradient(
      star.x,
      star.y,
      0,
      star.x,
      star.y,
      star.radius * 5
    );
    glow.addColorStop(0, "rgba(255, 255, 215, 1)");
    glow.addColorStop(0.14, "rgba(255, 221, 82, 0.95)");
    glow.addColorStop(0.48, "rgba(247, 177, 24, 0.36)");
    glow.addColorStop(1, "rgba(247, 177, 24, 0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(star.x, star.y, star.radius * 5, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function paintMoon(time) {
    var x = width * 0.86;
    var y = height * 0.15;
    var radius = Math.max(30, Math.min(width, height) * 0.075);
    var pulse = reducedMotion ? 1 : 1 + Math.sin(time * 0.0008) * 0.025;

    context.save();
    context.globalCompositeOperation = "screen";
    for (var ring = 4; ring >= 1; ring -= 1) {
      context.strokeStyle = "rgba(255, 204, 55, " + (0.08 + ring * 0.07) + ")";
      context.lineWidth = 3 + ring * 2;
      context.beginPath();
      context.arc(x, y, radius * pulse + ring * 11, 0, Math.PI * 2);
      context.stroke();
    }

    var moonGlow = context.createRadialGradient(x, y, 0, x, y, radius * 1.8);
    moonGlow.addColorStop(0, "#fffbd0");
    moonGlow.addColorStop(0.42, "#ffd75c");
    moonGlow.addColorStop(1, "rgba(242, 167, 31, 0)");
    context.fillStyle = moonGlow;
    context.beginPath();
    context.arc(x, y, radius * 1.8, 0, Math.PI * 2);
    context.fill();

    context.globalCompositeOperation = "source-over";
    context.fillStyle = "rgba(8, 38, 82, 0.92)";
    context.beginPath();
    context.arc(x - radius * 0.36, y - radius * 0.12, radius * 0.78, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function paintOwl(x, y, scale, phase, time) {
    var flap = reducedMotion ? 0.35 : Math.sin(time * 0.006 + phase);

    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    context.rotate(Math.sin(time * 0.0015 + phase) * 0.045);
    context.lineJoin = "round";
    context.lineCap = "round";
    context.strokeStyle = "#152444";
    context.lineWidth = 4;
    context.shadowColor = "rgba(2, 10, 34, 0.48)";
    context.shadowBlur = 8;
    context.shadowOffsetY = 4;

    context.fillStyle = "#8d5b3f";
    context.beginPath();
    context.moveTo(-20, -2);
    context.quadraticCurveTo(-48, -15 - flap * 12, -55, 8 - flap * 5);
    context.quadraticCurveTo(-38, 28, -13, 20);
    context.closePath();
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(20, -2);
    context.quadraticCurveTo(48, -15 - flap * 12, 55, 8 - flap * 5);
    context.quadraticCurveTo(38, 28, 13, 20);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = "#b97a4e";
    context.beginPath();
    context.ellipse(0, 5, 29, 32, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#dca75c";
    context.beginPath();
    context.moveTo(-26, -13);
    context.lineTo(-16, -37);
    context.lineTo(-5, -23);
    context.lineTo(5, -23);
    context.lineTo(16, -37);
    context.lineTo(26, -13);
    context.quadraticCurveTo(22, 12, 0, 18);
    context.quadraticCurveTo(-22, 12, -26, -13);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = "#f3d68b";
    context.beginPath();
    context.ellipse(-11, -7, 12, 15, -0.12, 0, Math.PI * 2);
    context.ellipse(11, -7, 12, 15, 0.12, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#10213d";
    context.beginPath();
    context.arc(-10, -7, 5.5, 0, Math.PI * 2);
    context.arc(10, -7, 5.5, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#fffbe5";
    context.beginPath();
    context.arc(-8.5, -9, 1.8, 0, Math.PI * 2);
    context.arc(11.5, -9, 1.8, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#efb52f";
    context.beginPath();
    context.moveTo(0, -2);
    context.lineTo(7, 6);
    context.lineTo(0, 10);
    context.lineTo(-7, 6);
    context.closePath();
    context.fill();
    context.stroke();

    context.strokeStyle = "rgba(255, 221, 112, 0.8)";
    context.lineWidth = 2.4;
    for (var mark = -1; mark <= 1; mark += 1) {
      context.beginPath();
      context.moveTo(mark * 10 - 3, 17);
      context.quadraticCurveTo(mark * 10, 24, mark * 10 + 5, 27);
      context.stroke();
    }
    context.restore();
  }

  function paintReindeer(x, y, scale, phase, time) {
    var stride = reducedMotion ? 0.25 : Math.sin(time * 0.0045 + phase);
    var bob = reducedMotion ? 0 : Math.sin(time * 0.0028 + phase) * 3;

    context.save();
    context.translate(x, y + bob);
    context.scale(scale, scale);
    context.rotate(-0.035 + Math.sin(time * 0.0012 + phase) * 0.025);
    context.lineJoin = "round";
    context.lineCap = "round";
    context.strokeStyle = "#17243a";
    context.lineWidth = 4;
    context.shadowColor = "rgba(2, 10, 34, 0.5)";
    context.shadowBlur = 9;
    context.shadowOffsetY = 4;

    context.fillStyle = "#d95f5c";
    context.beginPath();
    context.moveTo(-35, -12);
    context.quadraticCurveTo(-67, -30, -94, -21 + stride * 5);
    context.quadraticCurveTo(-70, -15, -48, 0);
    context.closePath();
    context.fill();
    context.stroke();
    context.strokeStyle = "#f2c14f";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-48, -10);
    context.quadraticCurveTo(-70, -22, -91, -20 + stride * 5);
    context.stroke();

    context.strokeStyle = "#17243a";
    context.lineWidth = 4;
    context.fillStyle = "#9b6545";
    context.beginPath();
    context.ellipse(-4, 3, 43, 25, 0.05, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#b97d50";
    context.beginPath();
    context.moveTo(24, -6);
    context.quadraticCurveTo(32, -39, 49, -43);
    context.lineTo(63, -27);
    context.quadraticCurveTo(48, -8, 35, 8);
    context.closePath();
    context.fill();
    context.stroke();

    context.beginPath();
    context.ellipse(58, -39, 25, 18, -0.15, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#d9a169";
    context.beginPath();
    context.ellipse(74, -35, 14, 10, -0.1, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#e75f53";
    context.beginPath();
    context.arc(87, -37, 6.5, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#fff7c8";
    context.beginPath();
    context.arc(58, -44, 4.5, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = "#13213a";
    context.beginPath();
    context.arc(59, -44, 2, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#8a593d";
    context.beginPath();
    context.moveTo(43, -51);
    context.lineTo(33, -64);
    context.lineTo(52, -58);
    context.closePath();
    context.fill();
    context.stroke();

    context.strokeStyle = "#6f4a34";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(48, -55);
    context.quadraticCurveTo(38, -78, 48, -91);
    context.moveTo(47, -72);
    context.lineTo(34, -82);
    context.moveTo(46, -79);
    context.lineTo(58, -91);
    context.moveTo(61, -54);
    context.quadraticCurveTo(58, -76, 70, -87);
    context.moveTo(62, -70);
    context.lineTo(75, -78);
    context.stroke();

    context.strokeStyle = "#17243a";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(-24, 18);
    context.lineTo(-50, 32 + stride * 9);
    context.lineTo(-64, 29 + stride * 12);
    context.moveTo(-5, 22);
    context.lineTo(-29, 41 - stride * 7);
    context.lineTo(-42, 42 - stride * 9);
    context.moveTo(18, 19);
    context.lineTo(43, 32 - stride * 9);
    context.lineTo(59, 27 - stride * 12);
    context.moveTo(31, 13);
    context.lineTo(57, 20 + stride * 7);
    context.lineTo(71, 14 + stride * 9);
    context.stroke();

    context.strokeStyle = "#f0c04c";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-33, -11);
    context.quadraticCurveTo(0, 2, 34, -5);
    context.stroke();
    context.restore();
  }

  function paintTravelers(time) {
    var travelTime = reducedMotion ? 0 : time * 0.001;

    travelers.forEach(function (traveler) {
      var padding = traveler.type === "owl" ? 150 : 260;
      var x =
        (traveler.offset + travelTime * traveler.speed) % (width + padding) -
        padding * 0.55;
      var y =
        traveler.y +
        (reducedMotion ? 0 : Math.sin(time * 0.0018 + traveler.phase) * 12);

      if (traveler.type === "owl") {
        paintOwl(x, y, traveler.scale, traveler.phase, time);
      } else {
        paintReindeer(x, y, traveler.scale, traveler.phase, time);
      }
    });
  }

  function resize() {
    window.cancelAnimationFrame(animationFrame);
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    baseCanvas.width = canvas.width;
    baseCanvas.height = canvas.height;
    baseContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildBasePainting();
    paint(performance.now());
  }

  function paint(time) {
    if (!reducedMotion && time - lastPaint < 40) {
      animationFrame = window.requestAnimationFrame(paint);
      return;
    }

    lastPaint = time;
    context.clearRect(0, 0, width, height);
    context.drawImage(baseCanvas, 0, 0, width, height);
    paintWindBands(time);
    stars.forEach(function (star) {
      paintStar(star, time);
    });
    paintMoon(time);
    paintTravelers(time);

    if (!reducedMotion) {
      animationFrame = window.requestAnimationFrame(paint);
    }
  }

  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 180);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
    } else if (!reducedMotion) {
      lastPaint = 0;
      animationFrame = window.requestAnimationFrame(paint);
    }
  });

  resize();
})();

(function () {
  "use strict";

  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  var width = 0;
  var height = 0;
  var swirls = [];
  var stars = [];
  var animationFrame;
  var lastPaint = 0;

  canvas.id = "van-gogh-background";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);

  function seededRandom(seed) {
    var value = Math.sin(seed * 999.91) * 43758.5453;
    return value - Math.floor(value);
  }

  function buildScene() {
    swirls = [];
    stars = [];

    for (var index = 0; index < 24; index += 1) {
      swirls.push({
        x: seededRandom(index + 1) * width,
        y: seededRandom(index + 17) * height * 0.82,
        radius: 35 + seededRandom(index + 31) * Math.min(width, height) * 0.14,
        stretch: 0.45 + seededRandom(index + 47) * 0.65,
        phase: seededRandom(index + 63) * Math.PI * 2,
        speed: 0.025 + seededRandom(index + 79) * 0.055,
        width: 2.2 + seededRandom(index + 95) * 5,
        colorIndex: Math.floor(seededRandom(index + 111) * 5)
      });
    }

    for (var starIndex = 0; starIndex < 38; starIndex += 1) {
      stars.push({
        x: seededRandom(starIndex + 201) * width,
        y: seededRandom(starIndex + 237) * height * 0.68,
        radius: 1.2 + seededRandom(starIndex + 273) * 3.8,
        phase: seededRandom(starIndex + 309) * Math.PI * 2
      });
    }
  }

  function resize() {
    window.cancelAnimationFrame(animationFrame);
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildScene();
    paint(performance.now());
  }

  function paintSky() {
    var sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#061943");
    sky.addColorStop(0.42, "#0a3971");
    sky.addColorStop(0.72, "#176494");
    sky.addColorStop(1, "#e3a52d");
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);

    var glow = context.createRadialGradient(
      width * 0.76,
      height * 0.18,
      0,
      width * 0.76,
      height * 0.18,
      Math.max(width, height) * 0.55
    );
    glow.addColorStop(0, "rgba(255, 222, 104, 0.22)");
    glow.addColorStop(0.38, "rgba(38, 126, 175, 0.12)");
    glow.addColorStop(1, "rgba(4, 18, 57, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
  }

  function paintStars(time) {
    context.save();
    context.globalCompositeOperation = "screen";

    stars.forEach(function (star) {
      var pulse = 0.78 + Math.sin(time * 0.0012 + star.phase) * 0.22;
      var haloRadius = star.radius * (4.5 + pulse);
      var halo = context.createRadialGradient(
        star.x,
        star.y,
        0,
        star.x,
        star.y,
        haloRadius
      );
      halo.addColorStop(0, "rgba(255, 247, 181, 0.95)");
      halo.addColorStop(0.18, "rgba(255, 207, 62, 0.72)");
      halo.addColorStop(1, "rgba(255, 188, 27, 0)");
      context.fillStyle = halo;
      context.beginPath();
      context.arc(star.x, star.y, haloRadius, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = "rgba(255, 241, 159, " + (0.55 + pulse * 0.35) + ")";
      context.lineWidth = Math.max(1, star.radius * 0.34);
      context.beginPath();
      context.moveTo(star.x - star.radius * 2.8, star.y);
      context.lineTo(star.x + star.radius * 2.8, star.y);
      context.moveTo(star.x, star.y - star.radius * 2.8);
      context.lineTo(star.x, star.y + star.radius * 2.8);
      context.stroke();
    });

    context.restore();
  }

  function paintSwirls(time) {
    var palette = ["#1d75a5", "#53a5bf", "#f2bd35", "#ffdc65", "#164f87"];

    context.save();
    context.lineCap = "round";

    swirls.forEach(function (swirl, swirlIndex) {
      var drift = reducedMotion ? 0 : time * 0.001 * swirl.speed;
      var turns = 2.15 + (swirlIndex % 4) * 0.28;
      var steps = 64;

      context.beginPath();
      for (var step = 0; step <= steps; step += 1) {
        var progress = step / steps;
        var angle = swirl.phase + drift + progress * Math.PI * 2 * turns;
        var radius = swirl.radius * (0.16 + progress * 0.84);
        var x = swirl.x + Math.cos(angle) * radius;
        var y = swirl.y + Math.sin(angle) * radius * swirl.stretch;
        if (step === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.strokeStyle = palette[swirl.colorIndex];
      context.globalAlpha = 0.36 + (swirlIndex % 3) * 0.11;
      context.lineWidth = swirl.width;
      context.shadowColor = palette[swirl.colorIndex];
      context.shadowBlur = swirl.width * 0.7;
      context.stroke();
    });

    context.restore();
  }

  function paintHills(time) {
    var sway = reducedMotion ? 0 : Math.sin(time * 0.00012) * 8;

    context.save();
    context.fillStyle = "#122d30";
    context.beginPath();
    context.moveTo(0, height);
    context.lineTo(0, height * 0.82);
    context.bezierCurveTo(
      width * 0.18,
      height * 0.7 + sway,
      width * 0.34,
      height * 0.88,
      width * 0.53,
      height * 0.76 - sway
    );
    context.bezierCurveTo(
      width * 0.7,
      height * 0.67,
      width * 0.82,
      height * 0.84 + sway,
      width,
      height * 0.72
    );
    context.lineTo(width, height);
    context.closePath();
    context.fill();

    context.strokeStyle = "rgba(232, 177, 47, 0.46)";
    context.lineWidth = 3;
    for (var stroke = 0; stroke < 16; stroke += 1) {
      var y = height * 0.78 + stroke * 13;
      context.beginPath();
      context.moveTo(0, y);
      context.bezierCurveTo(
        width * 0.3,
        y - 26 + (stroke % 3) * 9,
        width * 0.66,
        y + 22,
        width,
        y - 12
      );
      context.globalAlpha = 0.12 + (stroke % 4) * 0.035;
      context.stroke();
    }
    context.restore();
  }

  function paint(time) {
    if (!reducedMotion && time - lastPaint < 32) {
      animationFrame = window.requestAnimationFrame(paint);
      return;
    }

    lastPaint = time;
    context.clearRect(0, 0, width, height);
    paintSky();
    paintSwirls(time);
    paintStars(time);
    paintHills(time);

    if (!reducedMotion) {
      animationFrame = window.requestAnimationFrame(paint);
    }
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
    } else if (!reducedMotion) {
      animationFrame = window.requestAnimationFrame(paint);
    }
  });

  resize();
})();

(function () {
  "use strict";

  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!finePointer || reducedMotion) {
    return;
  }

  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  var particles = [];
  var pointer = { x: 0, y: 0, visible: false };
  var lastFrame = performance.now();
  var lastEmission = 0;
  var hue = 0;
  var pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:99999",
    "pointer-events:none",
    "width:100vw",
    "height:100vh"
  ].join(";");
  document.body.appendChild(canvas);
  document.documentElement.classList.add("rainbow-cursor-enabled");

  var style = document.createElement("style");
  style.textContent =
    "@media (pointer:fine) and (prefers-reduced-motion:no-preference){" +
    ".rainbow-cursor-enabled,.rainbow-cursor-enabled body," +
    ".rainbow-cursor-enabled a,.rainbow-cursor-enabled button{" +
    "cursor:none!important}}" +
    ".rainbow-cursor-enabled body{overflow-x:hidden}";
  document.head.appendChild(style);

  function resize() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * pixelRatio);
    canvas.height = Math.round(window.innerHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function createParticle(force) {
    var angle = Math.random() * Math.PI * 2;
    var speed = (force || 1) * (35 + Math.random() * 90);
    var isStar = Math.random() > 0.42;

    particles.push({
      x: pointer.x + (Math.random() - 0.5) * 8,
      y: pointer.y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 18,
      gravity: 45 + Math.random() * 35,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 5,
      size: isStar ? 3.5 + Math.random() * 4 : 2 + Math.random() * 3,
      color: "hsl(" + ((hue + Math.random() * 80) % 360) + ", 95%, 62%)",
      life: 0,
      maxLife: 0.75 + Math.random() * 0.65,
      star: isStar
    });

    if (particles.length > 180) {
      particles.shift();
    }
  }

  function drawStar(x, y, radius, rotation) {
    context.beginPath();
    for (var point = 0; point < 10; point += 1) {
      var pointRadius = point % 2 === 0 ? radius : radius * 0.42;
      var angle = rotation - Math.PI / 2 + point * Math.PI / 5;
      var pointX = x + Math.cos(angle) * pointRadius;
      var pointY = y + Math.sin(angle) * pointRadius;
      if (point === 0) {
        context.moveTo(pointX, pointY);
      } else {
        context.lineTo(pointX, pointY);
      }
    }
    context.closePath();
    context.fill();
  }

  function drawCursor() {
    context.save();
    context.lineWidth = 2.5;
    context.shadowBlur = 9;

    for (var segment = 0; segment < 12; segment += 1) {
      context.beginPath();
      context.strokeStyle = "hsl(" + ((hue + segment * 30) % 360) + ", 100%, 62%)";
      context.shadowColor = context.strokeStyle;
      context.arc(
        pointer.x,
        pointer.y,
        9,
        segment * Math.PI / 6,
        (segment + 1.15) * Math.PI / 6
      );
      context.stroke();
    }

    context.fillStyle = "#ffffff";
    context.shadowColor = "rgba(255,255,255,.9)";
    context.beginPath();
    context.arc(pointer.x, pointer.y, 2.2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function animate(now) {
    var delta = Math.min((now - lastFrame) / 1000, 0.035);
    lastFrame = now;
    hue = (hue + delta * 150) % 360;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (pointer.visible && now - lastEmission > 28) {
      createParticle(1);
      if (Math.random() > 0.45) {
        createParticle(0.7);
      }
      lastEmission = now;
    }

    for (var index = particles.length - 1; index >= 0; index -= 1) {
      var particle = particles[index];
      particle.life += delta;

      if (particle.life >= particle.maxLife) {
        particles.splice(index, 1);
        continue;
      }

      particle.vy += particle.gravity * delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.rotation += particle.spin * delta;

      var progress = particle.life / particle.maxLife;
      var scale = 1 - progress * 0.65;
      context.save();
      context.globalAlpha = Math.pow(1 - progress, 1.4);
      context.fillStyle = particle.color;
      context.shadowColor = particle.color;
      context.shadowBlur = 8;

      if (particle.star) {
        drawStar(particle.x, particle.y, particle.size * scale, particle.rotation);
      } else {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size * scale, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }

    if (pointer.visible) {
      drawCursor();
    }

    window.requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", function (event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.visible = true;
  });
  document.addEventListener("mouseleave", function () {
    pointer.visible = false;
  });
  document.addEventListener("mouseenter", function () {
    pointer.visible = true;
  });
  window.addEventListener("blur", function () {
    pointer.visible = false;
  });
  window.addEventListener("pointerdown", function () {
    for (var burst = 0; burst < 14; burst += 1) {
      createParticle(1.8);
    }
  });

  resize();
  window.requestAnimationFrame(animate);
})();

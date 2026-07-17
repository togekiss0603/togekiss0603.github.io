(function () {
  "use strict";

  var TIME_ZONE = "Asia/Shanghai";
  var WEATHER_URL =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=39.9042&longitude=116.4074" +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day" +
    "&timezone=Asia%2FShanghai";

  var widget = document.createElement("aside");
  widget.id = "beijing-weather-widget";
  widget.setAttribute("aria-label", "Beijing date and live weather");
  widget.innerHTML = [
    '<div class="weather-location">',
    '<span class="location-dot" aria-hidden="true"></span>',
    "<span>Beijing · China</span>",
    "</div>",
    '<div class="calendar-row">',
    '<span class="calendar-day" id="beijing-calendar-day">--</span>',
    '<div class="calendar-detail">',
    '<span id="beijing-calendar-month">Month ----</span>',
    '<strong id="beijing-calendar-weekday">Weekday</strong>',
    '<time id="beijing-clock">--:--:--</time>',
    "</div>",
    "</div>",
    '<div class="weather-divider"></div>',
    '<div class="weather-current">',
    '<span class="weather-icon" id="beijing-weather-icon" aria-hidden="true">✦</span>',
    '<div class="temperature-wrap">',
    '<strong id="beijing-temperature">--°</strong>',
    '<span id="beijing-weather-description">Loading weather…</span>',
    "</div>",
    "</div>",
    '<div class="weather-meta">',
    '<span id="beijing-feels-like">Feels --°</span>',
    '<span id="beijing-humidity">Humidity --%</span>',
    "</div>",
    '<div class="weather-source">Live weather · Open-Meteo</div>'
  ].join("");
  document.body.appendChild(widget);

  var dayElement = document.getElementById("beijing-calendar-day");
  var monthElement = document.getElementById("beijing-calendar-month");
  var weekdayElement = document.getElementById("beijing-calendar-weekday");
  var clockElement = document.getElementById("beijing-clock");
  var iconElement = document.getElementById("beijing-weather-icon");
  var temperatureElement = document.getElementById("beijing-temperature");
  var descriptionElement = document.getElementById("beijing-weather-description");
  var feelsLikeElement = document.getElementById("beijing-feels-like");
  var humidityElement = document.getElementById("beijing-humidity");

  function partsFor(date) {
    var formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "long",
      day: "2-digit",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    var parts = {};

    formatter.formatToParts(date).forEach(function (part) {
      if (part.type !== "literal") {
        parts[part.type] = part.value;
      }
    });
    return parts;
  }

  function updateCalendar() {
    var parts = partsFor(new Date());
    dayElement.textContent = parts.day;
    monthElement.textContent = parts.month + " " + parts.year;
    weekdayElement.textContent = parts.weekday;
    clockElement.textContent = parts.hour + ":" + parts.minute + ":" + parts.second;
    clockElement.dateTime = new Date().toISOString();
  }

  function weatherDetails(code, isDay) {
    var night = Number(isDay) === 0;
    if (code === 0) return { text: "Clear", icon: night ? "☾" : "☀" };
    if (code === 1) return { text: "Mostly clear", icon: night ? "☾" : "🌤" };
    if (code === 2) return { text: "Partly cloudy", icon: "⛅" };
    if (code === 3) return { text: "Overcast", icon: "☁" };
    if (code === 45 || code === 48) return { text: "Foggy", icon: "≋" };
    if (code >= 51 && code <= 57) return { text: "Drizzle", icon: "🌦" };
    if (code >= 61 && code <= 67) return { text: "Rain", icon: "🌧" };
    if (code >= 71 && code <= 77) return { text: "Snow", icon: "❄" };
    if (code >= 80 && code <= 82) return { text: "Rain showers", icon: "🌧" };
    if (code >= 85 && code <= 86) return { text: "Snow showers", icon: "❄" };
    if (code >= 95) return { text: "Thunderstorm", icon: "ϟ" };
    return { text: "Variable weather", icon: "◌" };
  }

  function temperatureClass(temperature) {
    if (temperature >= 30) return "hot";
    if (temperature <= 5) return "cold";
    return "mild";
  }

  function updateWeather(current) {
    var temperature = Math.round(current.temperature_2m);
    var apparent = Math.round(current.apparent_temperature);
    var humidity = Math.round(current.relative_humidity_2m);
    var code = Number(current.weather_code);
    var details = weatherDetails(code, current.is_day);

    temperatureElement.textContent = temperature + "°";
    descriptionElement.textContent = details.text;
    iconElement.textContent = details.icon;
    feelsLikeElement.textContent = "Feels " + apparent + "°";
    humidityElement.textContent = "Humidity " + humidity + "%";
    widget.dataset.temperature = temperatureClass(temperature);
    widget.dataset.weather = details.text;

    window.dispatchEvent(
      new CustomEvent("beijing-weather-updated", {
        detail: { temperature: temperature, code: code }
      })
    );
  }

  function fetchWeather() {
    fetch(WEATHER_URL, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Weather request failed");
        }
        return response.json();
      })
      .then(function (data) {
        if (!data.current) {
          throw new Error("Current weather missing");
        }
        updateWeather(data.current);
      })
      .catch(function () {
        descriptionElement.textContent = "Weather unavailable";
        iconElement.textContent = "◌";
      });
  }

  updateCalendar();
  fetchWeather();
  window.setInterval(updateCalendar, 1000);
  window.setInterval(fetchWeather, 30 * 60 * 1000);
})();

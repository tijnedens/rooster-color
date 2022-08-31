'use strict';

const root = document.querySelector("#root");
var lastColor;
var lastBox;
var courseBoxes;
var calendar;
var loadedCourses;
var frame;

let calendarObserver = new MutationObserver(update);
//let listObserver = new MutationObserver(update);

/* Execute on page load */
initRC();
window.addEventListener("message", (message) => {
  receive(message);
})
browser.runtime.onMessage.addListener(receive);
document.addEventListener("click", closeFrame);

function initRC() {
  const schedule = document.querySelector(".personal-schedule");
  var spinner = document.querySelector(".spinner");
  if (spinner.style.display != "none") {
    setTimeout(initRC, 1000);
    return;
  }
  
  updateBoxes();
  loadCourses();
  update();
  calendarObserver.observe(calendar, {childList: true, attributes: true});
  schedule.addEventListener("click", update);
}

async function update() {
  updateBoxes();
  await loadCourses();
  paintLoadedCourses();
}

function receive(message, sender, sendResponse) {
  console.log("message received!!!!!!");
  if (message.data.action == "SELECT") {
    root.classList.add("select-course");
    closeFrame();
    updateBoxes();
    lastColor = message.data.color;
    for (const box of courseBoxes) {
      box.addEventListener("click", select);
    }
  }

  if (message.data.action == "UPDATE") {
    update();
  }

  if (message.data.action == "TOGGLE") {
    if (frame) {
      closeFrame();
    } else {
      injectFrame();
    }
  }

  return Promise.resolve({ data: "antwoord" });
}

function select(e) {
  e.stopPropagation();
  createRipple(e);
  updateTextColor();
  root.classList.remove("select-course");
  root.classList.add("selecting-course");
  storeCourse(e);
}

/*
 * Ripple method stolen from css-tricks.com.
 * I stole the design style, so why not steal the code itself instead of trying to copy it on my own.
 * (In the end, I did change some things)
 */
function createRipple(event) {
  const container = document.createElement("div");
  container.classList.add("select-ripple-container");
  const circle = document.createElement("span");
  const calendarBounds = calendar.getBoundingClientRect();
  const radius = Math.hypot(Math.max(event.clientX, calendarBounds.width - event.clientX), Math.max(event.clientY - calendarBounds.top, calendarBounds.bottom - event.clientY));
  const diameter = radius * 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - (calendar.getBoundingClientRect().left + radius)}px`;
  circle.style.top = `${event.clientY - (calendar.getBoundingClientRect().top + radius)}px`;
  circle.style.backgroundColor = lastColor;
  circle.classList.add("select-ripple");

  const ripple = calendar.getElementsByClassName("select-ripple-container")[0];

  if (ripple) {
    ripple.remove();
  }

  lastBox = event.currentTarget;

  circle.addEventListener("animationend", endSelection);

  calculateMask(event, calendar);
  fixTitles();
  container.appendChild(circle);
  calendar.appendChild(container);
}

function updateBoxes() {
  calendar = document.querySelector("#schedule_");
  courseBoxes = document.getElementsByClassName("dhx_cal_event");
}

/* Ripple effect*/
function calculateMask(e, container) {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("rooster-svg");

  var clipPath = document.createElementNS(svg.namespaceURI, "clipPath");
  clipPath.setAttribute("id", "calendar-mask");

  for (const box of courseBoxes) {
    if (isInSelection(box)) {
      var rect = document.createElementNS(svg.namespaceURI, "rect");
      rect.setAttribute("x", box.getBoundingClientRect().left - container.getBoundingClientRect().left);
      rect.setAttribute("y", box.getBoundingClientRect().top - container.getBoundingClientRect().top);
      rect.setAttribute("width", box.getBoundingClientRect().width);
      rect.setAttribute("height", box.getBoundingClientRect().height - 1);
      clipPath.appendChild(rect);
    }
  }
  svg.appendChild(clipPath);

  const ripple = calendar.getElementsByClassName("rooster-svg")[0];

  if (ripple) {
    ripple.remove();
  }

  calendar.appendChild(svg);
}

/* Create copy of selected title elements and show it on top of the ripple */
function fixTitles() {
  for (const box of courseBoxes) {
    if (isInSelection(box)) {
      const titleElement = box.getElementsByClassName("dhx_title")[0];
      const copy = titleElement.cloneNode(true);
      titleElement.style.color = "transparent";
      copy.classList.add("title-overlay");
      box.appendChild(copy);
    }
  }

}

/* End selection */
function endSelection(event) {
  const svg = document.querySelector(".rooster-svg");
  const rippleContainer = document.querySelector(".select-ripple-container");
  if (svg) {
    svg.remove();
  }
  if (rippleContainer) {
    rippleContainer.remove();
  }

  for (const box of courseBoxes) {
    if (isInSelection(box)) {
      setColor(box, lastColor);
      const titleOverlay = box.getElementsByClassName("title-overlay")[0];
      titleOverlay.remove();
    }
  }
  event.target.remove();
  root.classList.remove("selecting-course");
}

/* Set color of course box */
function setColor(box, color) {
  const bodyElement = box.getElementsByClassName("dhx_body")[0];
  const titleElement = box.getElementsByClassName("dhx_title")[0];

  const textColor = calculateTextColor(color);
  if (!box.getAttribute("rc-old-color")) {
    box.setAttribute("rc-old-color", bodyElement.style.backgroundColor);
  }
  titleElement.style.backgroundColor = color;
  titleElement.style.color = textColor;
  bodyElement.style.backgroundColor = color;
  bodyElement.style.color = textColor;
}

/* Change text color depending on background */
function updateTextColor() {
  for (const box of courseBoxes) {
    if (isInSelection(box)) {
      const bodyElement = box.getElementsByClassName("dhx_body")[0];
      const titleOverlay = box.getElementsByClassName("title-overlay")[0];
      const textColor = calculateTextColor(lastColor);
      //bodyElement.style.transition = "color 500ms";
      titleOverlay.style.color = textColor;
      bodyElement.style.color = textColor;
    }
  }
}

function calculateTextColor(color) {
  var colorRGB = tinycolor(color).toRgb();
  if ((colorRGB.r * 0.299 + colorRGB.g * 0.587 + colorRGB.b * 0.114) > 186) {
    return "#000000";
  } else {
    return "#ffffff";
  }
}

/* Storing a new course using the browser storage API */
function storeCourse(e) {
  const eventName = lastBox.querySelector(".dhx_body b").innerHTML;
  browser.storage.sync.get().then((data) => {
    if (!data.courses) {
      data.courses = {};
    }
    data.courses[eventName] = lastColor;

    browser.storage.sync.set(data);
  });
}

/* Load courses from browser storage and set colors */
async function loadCourses() {
  return new Promise((resolve, reject) => {
    browser.storage.sync.get().then((data) => {
      loadedCourses = data.courses;
      if (loadedCourses) {
        resolve();
      } else {
        reject();
      }
    });
  })

}

function paintLoadedCourses() {
  for (const box of courseBoxes) {
    const eventName = box.querySelector(".dhx_body b").innerHTML;
    const oldColor = box.getAttribute("rc-old-color");
    if (loadedCourses[eventName]) {
      setColor(box, loadedCourses[eventName]);
    } else if (oldColor) {
      setColor(box, oldColor);
      box.removeAttribute("rc-old-color");
    }
  }
}

/* Function for finding out if a box needs to be included in the painting animation */
function isInSelection(box) {
  const selectedName = lastBox.querySelector(".dhx_body b").innerHTML;
  const eventName = box.querySelector(".dhx_body b").innerHTML;
  return (selectedName == eventName);
}

/* Add frame to the webpage (because the popup in firefox is annoying me) */
function injectFrame() {
  if (frame) {
    closeFrame();
  }
  frame = document.createElement("iframe");
  frame.src = browser.runtime.getURL("popup.html");
  frame.classList.add("rc-frame");
  root.appendChild(frame);
}

function closeFrame() {
  frame.remove();
  frame = null;
}
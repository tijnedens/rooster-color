'use strict';

var loadedCourses;

/*
 * Ripple method stolen from css-tricks.com
 * I stole the design style, so why not steal the code itself instead of trying to copy it on my own.
 */
function createRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - (button.getBoundingClientRect().left + radius)}px`;
  circle.style.top = `${event.clientY - (button.getBoundingClientRect().top + radius)}px`;
  circle.classList.add("ripple");

  const ripple = button.getElementsByClassName("ripple")[0];

  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);
}

/* Add ripple effect to button clicks */
const buttons = document.getElementsByTagName("button");
for (const button of buttons) {
  button.addEventListener("click", createRipple);
}

/* Addbutton click opens input menu */
const addButton = document.querySelector(".add-button");
const input = document.querySelector(".input");
addButton.addEventListener("click", openInput);

function openInput(e) {
  e.stopPropagation();
  input.classList.add("open");
}

/* Clicking outside of input menu */
input.addEventListener("click", (e) => {
  e.stopPropagation();
})
document.addEventListener("click", (e) => {
  input.classList.remove("open");
})

/* Start select in web page */
const selectButton = document.querySelector(".select-button");
const colorPicker = document.querySelector(".color-picker input");

selectButton.addEventListener("click", (e) => {
  send({ action: "SELECT", color: colorPicker.value });
})

/* Communicating with page */
function send(msg) {
  window.top.postMessage(msg, "https://rooster.rug.nl/");
}

/* Set visibility of course list based on the availability of courses */
window.addEventListener("load", async function () {
  browser.storage.sync.get().then((data) => {
    if (data.courses) {
      loadedCourses = data.courses;
    }

    if (loadedCourses && Object.keys(loadedCourses).length > 0) {
      for (const course in loadedCourses) {
        addCourseListElement(course);
      }
      courseList.style.visibility = "visible";
      const courseListTitle = document.querySelector(".course-list-title");
      courseListTitle.style.visibility = "visible";
      noCourses.style.display = "none";
      courseList.addEventListener("scroll", updateScrollVisibility);
    }
  })
})

const courseList = document.querySelector(".course-list");
const noCourses = document.querySelector(".no-courses");

function addCourseListElement(course) {
  const div = document.createElement("div");
  const colorPickerRect = document.createElement("input");
  const text = document.createElement("span");
  const removeIcon = document.createElement("span");

  colorPickerRect.setAttribute("type", "color");
  colorPickerRect.value = loadedCourses[course];
  colorPickerRect.addEventListener("change", (e) => {
    pickNewColor(e.currentTarget, course);
  });

  div.classList.add("course");
  div.style.setProperty("--color", loadedCourses[course]);

  text.innerHTML = course;
  text.classList.add("course-text");

  removeIcon.classList.add("material-symbols-outlined");
  removeIcon.classList.add("remove-icon");
  removeIcon.innerHTML = "remove";
  removeIcon.addEventListener("click", (e) => {
    removeCourse(div, course);
  });

  div.appendChild(colorPickerRect);
  div.appendChild(text);
  div.appendChild(removeIcon);
  courseList.appendChild(div);
}

/* Hide add button when scrolling to the bottom */
function updateScrollVisibility() {
  if (courseList.scrollTop + courseList.offsetHeight >= courseList.scrollHeight - 20) {
    addButton.style.opacity = 0;
    addButton.style.pointerEvents = "none";
  } else if (addButton.style.opacity == 0) {
    addButton.style.opacity = "";
    addButton.style.pointerEvents = "all";
  }
}

/* Removing courses from list */
function removeCourse(listElement, course) {
  browser.storage.sync.get().then((data) => {
    listElement.remove();

    if (Object.keys(data.courses).length == 1) {
      emptyCourseList();
    }

    if (data.courses[course]) {
      data.courses[course] = undefined;
    }
    browser.storage.sync.set(data);

    send({ action: "UPDATE" });

  })
}

/* Resetting the course list to "No courses" if the last course is removed */
function emptyCourseList() {
  courseList.style.visibility = "";
  const courseListTitle = document.querySelector(".course-list-title");
  courseListTitle.style.visibility = "";
  noCourses.style.display = "";
}

/* Updating colors when picking a new color in the course list */
function pickNewColor(colorPicker, course) {
  browser.storage.sync.get().then((data) => {
    if (data.courses[course]) {
      data.courses[course] = colorPicker.value;
    }
    browser.storage.sync.set(data);
    send({ action: "UPDATE" });
  });
}
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
const selectColorPicker = document.querySelector(".paint-options .color-picker input");

selectButton.addEventListener("click", (e) => {
  var success = send({ action: "SELECT", color: selectColorPicker.value });
  if (success) {
    window.close();
  }
})

/* Start add in web page */
const addCustomButton = document.querySelector(".add-custom-button");
const nameInput = document.querySelector(".add-options .name input");
const locationInput = document.querySelector(".add-options .location input");
const startDateInput = document.querySelector(".add-options .start-date input");
const endDateInput = document.querySelector(".add-options .end-date input");
const addColorPicker = document.querySelector(".add-options .color-picker input");

addCustomButton.addEventListener("click", (e) => {
  var customEventData = {
    action: "ADD", 
    text: nameInput.value, 
    location: [locationInput.value], 
    start_date: startDateInput.value,
    end_date: endDateInput.value,
    color: addColorPicker.value
  };
  for (const [key, value] of Object.entries(customEventData)) {
    if (!value) {
      return;
    }
  }
  var success = send(customEventData);
  if (success) {
    window.close();
  }
})

/* Tabs in input menu */
const inputTabs = document.querySelectorAll(".input-tab");
const tabHighLight = document.querySelector(".input-tab-highlight");
const tabOptions = document.querySelectorAll(".tab-option");
const tabContainer = document.querySelector(".tab-options");
tabHighLight.style.left = `${inputTabs[0].offsetLeft}px`;
tabHighLight.style.width = `${inputTabs[0].offsetWidth}px`;
tabContainer.style.height = `${tabOptions[0].scrollHeight}px`;
inputTabs.forEach((inputTab, idx) => {
  inputTab.addEventListener("click", (e) => {
    tabOptions.forEach((t) => {
      t.classList.remove("selected");
    })
    tabOptions[idx].classList.add("selected");
    tabHighLight.style.left = `${inputTab.offsetLeft}px`;
    tabHighLight.style.width = `${inputTab.offsetWidth}px`;
    tabContainer.style.height = `${tabOptions[idx].scrollHeight}px`;
  })
})

/* Communicating with page */
async function send(msg) {
  var result = false;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, msg, response => {
      result = true;
    })
  })
  return result;
}

/* Set visibility of course list based on the availability of courses */
window.addEventListener("load", async function () {
  chrome.storage.sync.get((data) => {
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
  chrome.storage.sync.get((data) => {
    listElement.remove();

    if (Object.keys(data.courses).length == 1) {
      emptyCourseList();
    }

    if (data.courses[course]) {
      data.courses[course] = undefined;
    }

    // Custom event remove
    if (data.customEvents[course]) {
      data.customEvents[course].remove = true;
    }

    chrome.storage.sync.set(data);

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
  chrome.storage.sync.get((data) => {
    if (data.courses[course]) {
      data.courses[course] = colorPicker.value;
    }
    chrome.storage.sync.set(data);
    send({ action: "UPDATE" });
  });
}
// I don't like the way data is send through an element tag, but at the moment I couldn't think of another method.
// If anyone sees this and knows a better way, please make an issue on the github page.

var customEventData = document.currentScript.getAttribute("data-custom-event");
scheduler.deleteEvent(customEventData);
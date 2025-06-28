// messages.js
const bottomMessages = [
    "Stay focused and keep moving forward!",
    "Don't forget to take breaks and hydrate.",
    "Great things take time. You’ve got this!",
    "Success is the sum of small efforts repeated.",
    "Your next alarm is just around the corner.",
    "Welcome to your custom calendar alarm dashboard!"
];

// Randomly select a message for the bottom text
function getRandomMessage() {
    return bottomMessages[Math.floor(Math.random() * bottomMessages.length)];
}
let timer;
let isWorkInterval = true;
let minutes = 25;
let seconds = 0;

function updateDisplay() {
    const minutesString = String(minutes).padStart(2, '0');
    const secondsString = String(seconds).padStart(2, '0');
    document.getElementById('timer').textContent = `${minutesString}:${secondsString}`;
}

function updateMode() {
    if (isWorkInterval) {
        document.getElementById('mode').textContent = 'Work';
    } else {
        document.getElementById('mode').textContent = 'Break';
    }
}

// ... (rest of the code remains unchanged)

function startPomodoro() {
  document.body.style.backgroundColor = 'green';  // Set background to green at the start of any interval

  updateMode(); // Update the mode displayed

  if (!timer) {
      timer = setInterval(() => {
          if (seconds === 0) {
              if (minutes === 0) {
                  clearInterval(timer);
                  timer = null;
                  document.body.style.backgroundColor = 'red';  // Set background color to red when timer reaches 0

                  setTimeout(() => { // Introducing a delay before resetting the timer
                      if (isWorkInterval) {
                          alert('Time for a break!');
                          minutes = 5;
                          
                      } else {
                          alert('Time to work!');
                          minutes = 0;
                      }
                      seconds = 0;
                      isWorkInterval = !isWorkInterval;
                      updateDisplay();
                      startPomodoro();
                  }, 1000); // 1-second delay
              } else {
                  minutes--;
                  seconds = 59;
              }
          } else {
              seconds--;
          }
          updateDisplay();
      }, 1000);
  }
}


// ... (rest of the code remains unchanged)

function stopPomodoro() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}
// ... (Previous code)

// ... (Previous code)

function resetPomodoro() {
  if (timer) {
      clearInterval(timer);
      timer = null;
  }

  isWorkInterval = true;
  
  const workMinutesInput = parseInt(document.getElementById('workTimeMinutes').value);
  const workSecondsInput = parseInt(document.getElementById('workTimeSeconds').value);

  minutes = (workMinutesInput !== null && !isNaN(workMinutesInput)) ? workMinutesInput : 25; 
  seconds = (workSecondsInput !== null && !isNaN(workSecondsInput)) ? workSecondsInput : 0;

  // Ensure seconds are within the 0-59 range
  if (seconds > 59) seconds = 59;
  if (seconds < 0) seconds = 0;

  updateDisplay();
  updateMode();
  document.body.style.backgroundColor = 'green'; 
}

// ... (Rest of the JavaScript code remains unchanged)


// ... (Rest of the JavaScript code remains unchanged)


// When the document loads, set the timer based on the input values
document.addEventListener('DOMContentLoaded', resetPomodoro);

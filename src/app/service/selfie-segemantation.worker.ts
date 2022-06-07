/**
 * The function of these worker is to send the message to main thread
 * every maxFPS/sec
 *  *Problem => we need to segment the video on 30FPS there is some alternative like setTimeout , setInterval or requestAnimationFrame which call a particular function on given time frame but the problem is that it stop working when tab is not in focus
 * *Solution => so if use requestAnimationFrame on other thread and send message to main thread than this problem is solved
 */

/// <reference lib="webworker" />
let maxFPS;
let lastTimestamp = 0;
let timestep = 0; // ms for each frame

const ctx: Worker = self as any;

ctx.addEventListener('message', ({ data }) => {
  switch (data.action) {
    case 'initialize':
      maxFPS = data.maxFPS;
      timestep = 1000 / maxFPS;
      requestframe();
      break;
  }
});

function requestframe(timestamp?: any) {
  requestAnimationFrame(requestframe);

  if (timestamp - lastTimestamp < timestep) return;

  ctx.postMessage({
    action: 'segmentframe',
  });

  lastTimestamp = timestamp;
}
export default null as any;
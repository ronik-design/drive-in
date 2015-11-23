import Jvent from "jvent";

class Timer extends Jvent {

  constructor(callback, delay) {
    super();

    this.callback = callback;
    this.remaining = delay;
    this.timerId = null;
    this.start = null;

    this.resume();
  }

  pause(silent) {
    clearTimeout(this.timerId);
    this.remaining -= new Date() - this.start;

    if (!silent) {
      this.emit("pause");
    }
  }

  resume(silent) {
    this.start = new Date();
    clearTimeout(this.timerId);
    this.timerId = setTimeout(this.callback, this.remaining);

    if (!silent) {
      this.emit("resume");
    }
  }

  currentTime() {
    const currTime = new Date() - this.start;
    if (this.timerId) {
      this.pause(true);
      this.resume(true);
    }
    return currTime;
  }

  destroy() {
    this.pause(true);
    this.removeAllListeners();
  }
}

export default Timer;

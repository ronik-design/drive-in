var Jvent = require('jvent'),
    inherits = require('inherits');

function Timer(callback, delay) {
    var self = this;
    var timerId, start, remaining = delay;

    this.pause = function(silent) {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;

        if (!silent) this.emit('pause');
    };

    this.resume = function(silent) {
        start = new Date();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(callback, remaining);

        if (!silent) this.emit('resume');
    };

    this.currentTime = function() {
        var currTime = new Date() - start;
        if (timerId) {
            this.pause(true);
            this.resume(true);
        }
        return currTime;
    };

    this.destroy = function() {
        self.pause(true);
        self.removeAllListeners();
    };

    this.resume();
}

inherits(Timer, Jvent);

module.exports = Timer;

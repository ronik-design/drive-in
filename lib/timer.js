"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Jvent = _interopRequire(require("jvent"));

var Timer = (function (_Jvent) {
    function Timer(callback, delay) {
        _classCallCheck(this, Timer);

        this.callback = callback;
        this.remaining = delay;
        this.timerId = null;
        this.start = null;

        this.resume();
    }

    _inherits(Timer, _Jvent);

    _createClass(Timer, {
        pause: {
            value: function pause(silent) {
                clearTimeout(this.timerId);
                this.remaining -= new Date() - this.start;

                if (!silent) {
                    this.emit("pause");
                }
            }
        },
        resume: {
            value: function resume(silent) {
                this.start = new Date();
                clearTimeout(this.timerId);
                this.timerId = setTimeout(this.callback, this.remaining);

                if (!silent) {
                    this.emit("resume");
                }
            }
        },
        currentTime: {
            value: function currentTime() {
                var currTime = new Date() - this.start;
                if (this.timerId) {
                    this.pause(true);
                    this.resume(true);
                }
                return currTime;
            }
        },
        destroy: {
            value: function destroy() {
                this.pause(true);
                this.removeAllListeners();
            }
        }
    });

    return Timer;
})(Jvent);

module.exports = Timer;
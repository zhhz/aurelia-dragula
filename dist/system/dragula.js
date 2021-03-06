'use strict';

System.register(['aurelia-dependency-injection', './touchy', './options', './util', './emitter', './classes'], function (_export, _context) {
  "use strict";

  var inject, Container, touchy, GLOBAL_OPTIONS, Options, Util, Emitter, classes, _typeof, _createClass, MIN_TIME_BETWEEN_REDRAWS_MS, Dragula;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_aureliaDependencyInjection) {
      inject = _aureliaDependencyInjection.inject;
      Container = _aureliaDependencyInjection.Container;
    }, function (_touchy) {
      touchy = _touchy.touchy;
    }, function (_options) {
      GLOBAL_OPTIONS = _options.GLOBAL_OPTIONS;
      Options = _options.Options;
    }, function (_util) {
      Util = _util.Util;
    }, function (_emitter) {
      Emitter = _emitter.Emitter;
    }, function (_classes) {
      classes = _classes;
    }],
    execute: function () {
      _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
      } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };

      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      MIN_TIME_BETWEEN_REDRAWS_MS = 20;

      _export('Dragula', Dragula = function () {
        function Dragula(options) {
          _classCallCheck(this, Dragula);

          var len = arguments.length;
          var globalOptions = Container.instance.get(GLOBAL_OPTIONS);
          this.options = Object.assign({}, globalOptions, options);
          this._emitter = new Emitter();
          this.dragging = false;

          if (this.options.removeOnSpill === true) {
            this._emitter.on('over', this.spillOver.bind(this));
            this._emitter.on('out', this.spillOut.bind(this));
          }

          this.boundStart = this._startBecauseMouseMoved.bind(this);
          this.boundGrab = this._grab.bind(this);
          this.boundRelease = this._release.bind(this);
          this.boundPreventGrabbed = this._preventGrabbed.bind(this);
          this.boundDrag = this.drag.bind(this);

          this._events();

          this._mirror;
          this._source;
          this._item;
          this._offsetX;
          this._offsetY;
          this._moveX;
          this._moveY;
          this._initialSibling;
          this._currentSibling;
          this._copy;
          this._lastRenderTime = null;
          this._lastDropTarget = null;
          this._grabbed;
        }

        Dragula.prototype.on = function on(eventName, callback) {
          this._emitter.on(eventName, callback);
        };

        Dragula.prototype.once = function once(eventName, callback) {
          this._emitter.once(eventName, callback);
        };

        Dragula.prototype.off = function off(eventName, fn) {
          this._emitter.off(eventName, fn);
        };

        Dragula.prototype.isContainer = function isContainer(el) {
          return this.options.containers.indexOf(el) !== -1 || this.options.isContainer(el);
        };

        Dragula.prototype._events = function _events(remove) {
          var op = remove ? 'removeEventListener' : 'addEventListener';
          touchy(document.documentElement, op, 'mousedown', this.boundGrab);
          touchy(document.documentElement, op, 'mouseup', this.boundRelease);
        };

        Dragula.prototype._eventualMovements = function _eventualMovements(remove) {
          var op = remove ? 'removeEventListener' : 'addEventListener';
          touchy(document.documentElement, op, 'mousemove', this.boundStart);
        };

        Dragula.prototype._movements = function _movements(remove) {
          var op = remove ? 'removeEventListener' : 'addEventListener';
          touchy(document.documentElement, op, 'click', this.boundPreventGrabbed);
        };

        Dragula.prototype.destroy = function destroy() {
          this._events(true);
          this._release({});
          this._emitter.destroy();
        };

        Dragula.prototype._preventGrabbed = function _preventGrabbed(e) {
          if (this._grabbed) {
            e.preventDefault();
          }
        };

        Dragula.prototype._grab = function _grab(e) {
          this._moveX = e.clientX;
          this._moveY = e.clientY;

          var ignore = Util.whichMouseButton(e) !== 1 || e.metaKey || e.ctrlKey;
          if (ignore) {
            return;
          }
          var item = e.target;
          var context = this._canStart(item);
          if (!context) {
            return;
          }
          this._grabbed = context;
          this._eventualMovements();
          if (Util.isInput(item)) {
            item.focus();
          } else {
            e.preventDefault();
          }
        };

        Dragula.prototype._startBecauseMouseMoved = function _startBecauseMouseMoved(e) {
          if (!this._grabbed || this.dragging) {
            return;
          }
          if (Util.whichMouseButton(e) === 0) {
            this._release({});
            return;
          }

          if (e.clientX !== void 0 && e.clientX === this._moveX && e.clientY !== void 0 && e.clientY === this._moveY) {
            return;
          }
          if (this.options.ignoreInputTextSelection) {
            var clientX = Util.getCoord('clientX', e);
            var clientY = Util.getCoord('clientY', e);
            var elementBehindCursor = document.elementFromPoint(clientX, clientY);
            if (Util.isInput(elementBehindCursor)) {
              return;
            }
          }

          var grabbed = this._grabbed;
          this._eventualMovements(true);
          this._movements();
          this.end();
          this.start(grabbed);

          var offset = Util.getOffset(this._item);
          this._offsetX = Util.getCoord('pageX', e) - offset.left;
          this._offsetY = Util.getCoord('pageY', e) - offset.top;

          classes.add(this._copy || this._item, 'gu-transit');
          this.renderMirrorImage();
          this.drag(e);
        };

        Dragula.prototype._canStart = function _canStart(item) {
          if (this.dragging && this._mirror) {
            return;
          }
          if (this.isContainer(item)) {
            return;
          }
          var handle = item;
          while (Util.getParent(item) && this.isContainer(Util.getParent(item)) === false) {
            if (this.options.invalid(item, handle)) {
              return;
            }
            item = Util.getParent(item);
            if (!item) {
              return;
            }
          }
          var source = Util.getParent(item);
          if (!source) {
            return;
          }
          if (this.options.invalid(item, handle)) {
            return;
          }

          var movable = this.options.moves(item, source, handle, Util.nextEl(item));
          if (!movable) {
            return;
          }

          return {
            item: item,
            source: source
          };
        };

        Dragula.prototype.manualStart = function manualStart(item) {
          var context = this._canStart(item);
          if (context) {
            this.start(context);
          }
        };

        Dragula.prototype.start = function start(context) {
          if (this._isCopy(context.item, context.source)) {
            this._copy = context.item.cloneNode(true);
            this._emitter.emit('cloned', this._copy, context.item, 'copy', Util.getViewModel(context.item));
          }

          this._source = context.source;
          this._item = context.item;
          this._initialSibling = context.item.nextSibling;
          this._currentSibling = Util.nextEl(context.item);

          this.dragging = true;
          this._emitter.emit('drag', this._item, this._source, Util.getViewModel(this._item));
        };

        Dragula.prototype.end = function end() {
          if (!this.dragging) {
            return;
          }
          var item = this._copy || this._item;
          this.drop(item, Util.getParent(item));
        };

        Dragula.prototype._ungrab = function _ungrab() {
          this._grabbed = false;
          this._eventualMovements(true);
          this._movements(true);
        };

        Dragula.prototype._release = function _release(e) {
          this._ungrab();

          if (!this.dragging) {
            return;
          }
          var item = this._copy || this._item;
          var clientX = Util.getCoord('clientX', e);
          var clientY = Util.getCoord('clientY', e);
          var elementBehindCursor = Util.getElementBehindPoint(this._mirror, clientX, clientY);
          var dropTarget = this._findDropTarget(elementBehindCursor, clientX, clientY);
          if (dropTarget && (this._copy && this.options.copySortSource || !this._copy || dropTarget !== this._source)) {
            this.drop(item, dropTarget);
          } else if (this.options.removeOnSpill) {
            this.remove();
          } else {
            this.cancel();
          }
        };

        Dragula.prototype.drop = function drop(item, target) {
          if (this._copy && this.options.copySortSource && target === this._source) {
            var parent = Util.getParent(this._item);
            if (parent) parent.removeChild(this._item);
          }
          if (this._isInitialPlacement(target)) {
            this._emitter.emit('cancel', item, this._source, this._source, Util.getViewModel(this._item));
          } else {
            this._emitter.emit('drop', item, target, this._source, this._currentSibling, Util.getViewModel(this._item), Util.getViewModel(this._currentSibling));
          }
          this._cleanup();
        };

        Dragula.prototype.remove = function remove() {
          if (!this.dragging) {
            return;
          }
          var item = this._copy || this._item;
          var parent = Util.getParent(item);
          if (parent) {
            parent.removeChild(item);
          }
          this._emitter.emit(this._copy ? 'cancel' : 'remove', item, parent, this._source, Util.getViewModel(this._item));
          this._cleanup();
        };

        Dragula.prototype.cancel = function cancel(revert) {
          if (!this.dragging) {
            return;
          }
          var reverts = arguments.length > 0 ? revert : this.options.revertOnSpill;
          var item = this._copy || this._item;
          var parent = Util.getParent(item);
          if (this._copy && parent) {
            parent.removeChild(this._copy);
          }
          var initial = this._isInitialPlacement(parent);
          if (initial === false && !this._copy && reverts) {
            this._source.insertBefore(item, this._initialSibling);
          }
          if (initial || reverts) {
            this._emitter.emit('cancel', item, this._source, this._source, Util.getViewModel(this._item));
          } else {
            this._emitter.emit('drop', item, parent, this._source, this._currentSibling, Util.getViewModel(this._item), Util.getViewModel(this._currentSibling));
          }
          this._cleanup();
        };

        Dragula.prototype._cleanup = function _cleanup() {
          var item = this._copy || this._item;
          this._ungrab();
          this.removeMirrorImage();
          if (item) {
            classes.rm(item, 'gu-transit');
          }
          this.dragging = false;
          if (this._lastDropTarget) {
            this._emitter.emit('out', item, this._lastDropTarget, this._source, Util.getViewModel(item));
          }
          this._emitter.emit('dragend', item, Util.getViewModel(item));
          this._source = this._item = this._copy = this._initialSibling = this._currentSibling = this._lastRenderTime = this._lastDropTarget = null;
        };

        Dragula.prototype._isInitialPlacement = function _isInitialPlacement(target, s) {
          var sibling = void 0;
          if (s !== void 0) {
            sibling = s;
          } else if (this._mirror) {
            sibling = this._currentSibling;
          } else {
            sibling = (this._copy || this._item).nextSibling;
          }
          return target === this._source && sibling === this._initialSibling;
        };

        Dragula.prototype._findDropTarget = function _findDropTarget(elementBehindCursor, clientX, clientY) {
          var _this = this;

          var accepted = function accepted() {
            var droppable = _this.isContainer(target);
            if (droppable === false) {
              return false;
            }

            var immediate = Util.getImmediateChild(target, elementBehindCursor);
            var reference = _this.getReference(target, immediate, clientX, clientY);
            var initial = _this._isInitialPlacement(target, reference);
            if (initial) {
              return true;
            }
            return _this.options.accepts(_this._item, target, _this._source, reference);
          };

          var target = elementBehindCursor;
          while (target && !accepted()) {
            target = Util.getParent(target);
          }
          return target;
        };

        Dragula.prototype.drag = function drag(e) {
          var _this2 = this;

          e.preventDefault();
          if (!this._mirror) {
            return;
          }

          if (this._lastRenderTime !== null && Date.now() - this._lastRenderTime < MIN_TIME_BETWEEN_REDRAWS_MS) {
            return;
          }
          this._lastRenderTime = Date.now();

          var item = this._copy || this._item;

          var moved = function moved(type) {
            _this2._emitter.emit(type, item, _this2._lastDropTarget, _this2._source, Util.getViewModel(item));
          };
          var over = function over() {
            if (changed) {
              moved('over');
            }
          };
          var out = function out() {
            if (_this2._lastDropTarget) {
              moved('out');
            }
          };

          var clientX = Util.getCoord('clientX', e);
          var clientY = Util.getCoord('clientY', e);
          var x = clientX - this._offsetX;
          var y = clientY - this._offsetY;

          this._mirror.style.left = x + 'px';
          this._mirror.style.top = y + 'px';

          var elementBehindCursor = Util.getElementBehindPoint(this._mirror, clientX, clientY);
          var dropTarget = this._findDropTarget(elementBehindCursor, clientX, clientY);
          var changed = dropTarget !== null && dropTarget !== this._lastDropTarget;
          if (changed || dropTarget === null) {
            out();
            this._lastDropTarget = dropTarget;
            over();
          }
          var parent = Util.getParent(item);
          if (dropTarget === this._source && this._copy && !this.options.copySortSource) {
            if (parent) {
              parent.removeChild(item);
            }
            return;
          }
          var reference = void 0;
          var immediate = Util.getImmediateChild(dropTarget, elementBehindCursor);
          if (immediate !== null) {
            reference = this.getReference(dropTarget, immediate, clientX, clientY);
          } else if (this.options.revertOnSpill === true && !this._copy) {
            reference = this._initialSibling;
            dropTarget = this._source;
          } else {
            if (this._copy && parent) {
              parent.removeChild(item);
            }
            return;
          }
          if (reference === null && changed || reference !== item && reference !== Util.nextEl(item)) {
            this._currentSibling = reference;
            dropTarget.insertBefore(item, reference);
            this._emitter.emit('shadow', item, dropTarget, this._source, Util.getViewModel(item));
          }
        };

        Dragula.prototype.spillOver = function spillOver(el) {
          classes.rm(el, 'gu-hide');
        };

        Dragula.prototype.spillOut = function spillOut(el) {
          if (this.dragging) {
            classes.add(el, 'gu-hide');
          }
        };

        Dragula.prototype.renderMirrorImage = function renderMirrorImage() {
          if (this._mirror) {
            return;
          }
          var rect = this._item.getBoundingClientRect();
          this._mirror = this._item.cloneNode(true);
          this._mirror.style.width = Util.getRectWidth(rect) + 'px';
          this._mirror.style.height = Util.getRectHeight(rect) + 'px';
          classes.rm(this._mirror, 'gu-transit');
          classes.add(this._mirror, 'gu-mirror');
          this.options.mirrorContainer.appendChild(this._mirror);
          touchy(document.documentElement, 'addEventListener', 'mousemove', this.boundDrag);
          classes.add(this.options.mirrorContainer, 'gu-unselectable');
          this._emitter.emit('cloned', this._mirror, this._item, 'mirror', Util.getViewModel(this._item));
        };

        Dragula.prototype.removeMirrorImage = function removeMirrorImage() {
          if (this._mirror) {
            classes.rm(this.options.mirrorContainer, 'gu-unselectable');
            touchy(document.documentElement, 'removeEventListener', 'mousemove', this.boundDrag);
            Util.getParent(this._mirror).removeChild(this._mirror);
            this._mirror = null;
          }
        };

        Dragula.prototype.getReference = function getReference(dropTarget, target, x, y) {
          var outside = function outside() {
            var len = dropTarget.children.length;
            var i = void 0;
            var el = void 0;
            var rect = void 0;
            for (i = 0; i < len; i++) {
              el = dropTarget.children[i];
              rect = el.getBoundingClientRect();
              if (horizontal && rect.left + rect.width / 2 > x) {
                return el;
              }
              if (!horizontal && rect.top + rect.height / 2 > y) {
                return el;
              }
            }
            return null;
          };

          var resolve = function resolve(after) {
            return after ? Util.nextEl(target) : target;
          };

          var inside = function inside() {
            var rect = target.getBoundingClientRect();
            if (horizontal) {
              return resolve(x > rect.left + Util.getRectWidth(rect) / 2);
            }
            return resolve(y > rect.top + Util.getRectHeight(rect) / 2);
          };

          var horizontal = this.options.direction === 'horizontal';
          var reference = target !== dropTarget ? inside() : outside();
          return reference;
        };

        Dragula.prototype._isCopy = function _isCopy(item, container) {
          var isBoolean = typeof this.options.copy === 'boolean' || _typeof(this.options.copy) === 'object' && typeof this.options.copy.valueOf() === 'boolean';

          return isBoolean ? this.options.copy : this.options.copy(item, container);
        };

        _createClass(Dragula, [{
          key: 'containers',
          get: function get() {
            return this.options.containers;
          },
          set: function set(value) {
            this.options.containers = value;
          }
        }]);

        return Dragula;
      }());

      _export('Dragula', Dragula);
    }
  };
});
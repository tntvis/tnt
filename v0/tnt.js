(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
if (typeof tnt === "undefined") {
    module.exports = tnt = require("./src/ta.js");
}
var eventsystem = require ("biojs-events");
eventsystem.mixin (tnt);
tnt.utils = require ("tnt.utils");
tnt.tooltip = require ("tnt.tooltip");
tnt.tree = require ("tnt.tree");
tnt.tree.node = require ("tnt.tree.node");
tnt.tree.parse_newick = require("tnt.newick").parse_newick;
tnt.tree.parse_nhx = require("tnt.newick").parse_nhx;
tnt.board = require ("tnt.board");
tnt.board.genome = require("tnt.genome");
//tnt.legend = require ("tnt.legend");

},{"./src/ta.js":81,"biojs-events":3,"tnt.board":9,"tnt.genome":40,"tnt.newick":48,"tnt.tooltip":50,"tnt.tree":62,"tnt.tree.node":54,"tnt.utils":77}],3:[function(require,module,exports){
var events = require("backbone-events-standalone");

events.onAll = function(callback,context){
  this.on("all", callback,context);
  return this;
};

// Mixin utility
events.oldMixin = events.mixin;
events.mixin = function(proto) {
  events.oldMixin(proto);
  // add custom onAll
  var exports = ['onAll'];
  for(var i=0; i < exports.length;i++){
    var name = exports[i];
    proto[name] = this[name];
  }
  return proto;
};

module.exports = events;

},{"backbone-events-standalone":5}],4:[function(require,module,exports){
/**
 * Standalone extraction of Backbone.Events, no external dependency required.
 * Degrades nicely when Backone/underscore are already available in the current
 * global context.
 *
 * Note that docs suggest to use underscore's `_.extend()` method to add Events
 * support to some given object. A `mixin()` method has been added to the Events
 * prototype to avoid using underscore for that sole purpose:
 *
 *     var myEventEmitter = BackboneEvents.mixin({});
 *
 * Or for a function constructor:
 *
 *     function MyConstructor(){}
 *     MyConstructor.prototype.foo = function(){}
 *     BackboneEvents.mixin(MyConstructor.prototype);
 *
 * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
 * (c) 2013 Nicolas Perriault
 */
/* global exports:true, define, module */
(function() {
  var root = this,
      nativeForEach = Array.prototype.forEach,
      hasOwnProperty = Object.prototype.hasOwnProperty,
      slice = Array.prototype.slice,
      idCounter = 0;

  // Returns a partial implementation matching the minimal API subset required
  // by Backbone.Events
  function miniscore() {
    return {
      keys: Object.keys || function (obj) {
        if (typeof obj !== "object" && typeof obj !== "function" || obj === null) {
          throw new TypeError("keys() called on a non-object");
        }
        var key, keys = [];
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            keys[keys.length] = key;
          }
        }
        return keys;
      },

      uniqueId: function(prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
      },

      has: function(obj, key) {
        return hasOwnProperty.call(obj, key);
      },

      each: function(obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
          obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
          for (var i = 0, l = obj.length; i < l; i++) {
            iterator.call(context, obj[i], i, obj);
          }
        } else {
          for (var key in obj) {
            if (this.has(obj, key)) {
              iterator.call(context, obj[key], key, obj);
            }
          }
        }
      },

      once: function(func) {
        var ran = false, memo;
        return function() {
          if (ran) return memo;
          ran = true;
          memo = func.apply(this, arguments);
          func = null;
          return memo;
        };
      }
    };
  }

  var _ = miniscore(), Events;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Mixin utility
  Events.mixin = function(proto) {
    var exports = ['on', 'once', 'off', 'trigger', 'stopListening', 'listenTo',
                   'listenToOnce', 'bind', 'unbind'];
    _.each(exports, function(name) {
      proto[name] = this[name];
    }, this);
    return proto;
  };

  // Export Events as BackboneEvents depending on current context
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Events;
    }
    exports.BackboneEvents = Events;
  }else if (typeof define === "function"  && typeof define.amd == "object") {
    define(function() {
      return Events;
    });
  } else {
    root.BackboneEvents = Events;
  }
})(this);

},{}],5:[function(require,module,exports){
module.exports = require('./backbone-events-standalone');

},{"./backbone-events-standalone":4}],6:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],7:[function(require,module,exports){
module.exports = require("./src/api.js");

},{"./src/api.js":8}],8:[function(require,module,exports){
var api = function (who) {

    var _methods = function () {
	var m = [];

	m.add_batch = function (obj) {
	    m.unshift(obj);
	};

	m.update = function (method, value) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			m[i][p] = value;
			return true;
		    }
		}
	    }
	    return false;
	};

	m.add = function (method, value) {
	    if (m.update (method, value) ) {
	    } else {
		var reg = {};
		reg[method] = value;
		m.add_batch (reg);
	    }
	};

	m.get = function (method) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			return m[i][p];
		    }
		}
	    }
	};

	return m;
    };

    var methods    = _methods();
    var api = function () {};

    api.check = function (method, check, msg) {
	if (method instanceof Array) {
	    for (var i=0; i<method.length; i++) {
		api.check(method[i], check, msg);
	    }
	    return;
	}

	if (typeof (method) === 'function') {
	    method.check(check, msg);
	} else {
	    who[method].check(check, msg);
	}
	return api;
    };

    api.transform = function (method, cbak) {
	if (method instanceof Array) {
	    for (var i=0; i<method.length; i++) {
		api.transform (method[i], cbak);
	    }
	    return;
	}

	if (typeof (method) === 'function') {
	    method.transform (cbak);
	} else {
	    who[method].transform(cbak);
	}
	return api;
    };

    var attach_method = function (method, opts) {
	var checks = [];
	var transforms = [];

	var getter = opts.on_getter || function () {
	    return methods.get(method);
	};

	var setter = opts.on_setter || function (x) {
	    for (var i=0; i<transforms.length; i++) {
		x = transforms[i](x);
	    }

	    for (var j=0; j<checks.length; j++) {
		if (!checks[j].check(x)) {
		    var msg = checks[j].msg || 
			("Value " + x + " doesn't seem to be valid for this method");
		    throw (msg);
		}
	    }
	    methods.add(method, x);
	};

	var new_method = function (new_val) {
	    if (!arguments.length) {
		return getter();
	    }
	    setter(new_val);
	    return who; // Return this?
	};
	new_method.check = function (cbak, msg) {
	    if (!arguments.length) {
		return checks;
	    }
	    checks.push ({check : cbak,
			  msg   : msg});
	    return this;
	};
	new_method.transform = function (cbak) {
	    if (!arguments.length) {
		return transforms;
	    }
	    transforms.push(cbak);
	    return this;
	};

	who[method] = new_method;
    };

    var getset = function (param, opts) {
	if (typeof (param) === 'object') {
	    methods.add_batch (param);
	    for (var p in param) {
		attach_method (p, opts);
	    }
	} else {
	    methods.add (param, opts.default_value);
	    attach_method (param, opts);
	}
    };

    api.getset = function (param, def) {
	getset(param, {default_value : def});

	return api;
    };

    api.get = function (param, def) {
	var on_setter = function () {
	    throw ("Method defined only as a getter (you are trying to use it as a setter");
	};

	getset(param, {default_value : def,
		       on_setter : on_setter}
	      );

	return api;
    };

    api.set = function (param, def) {
	var on_getter = function () {
	    throw ("Method defined only as a setter (you are trying to use it as a getter");
	};

	getset(param, {default_value : def,
		       on_getter : on_getter}
	      );

	return api;
    };

    api.method = function (name, cbak) {
	if (typeof (name) === 'object') {
	    for (var p in name) {
		who[p] = name[p];
	    }
	} else {
	    who[name] = cbak;
	}
	return api;
    };

    return api;
    
};

module.exports = exports = api;
},{}],9:[function(require,module,exports){
// if (typeof tnt === "undefined") {
//     module.exports = tnt = {}
// }
// tnt.utils = require("tnt.utils");
// tnt.tooltip = require("tnt.tooltip");
// tnt.board = require("./src/index.js");

module.exports = require("./src/index");

},{"./src/index":19}],10:[function(require,module,exports){
module.exports=require(7)
},{"./src/api.js":11}],11:[function(require,module,exports){
module.exports=require(8)
},{}],12:[function(require,module,exports){
module.exports = require("./src/index.js");

},{"./src/index.js":13}],13:[function(require,module,exports){
// require('fs').readdirSync(__dirname + '/').forEach(function(file) {
//     if (file.match(/.+\.js/g) !== null && file !== __filename) {
// 	var name = file.replace('.js', '');
// 	module.exports[name] = require('./' + file);
//     }
// });

// Same as
var utils = require("./utils.js");
utils.reduce = require("./reduce.js");
module.exports = exports = utils;

},{"./reduce.js":14,"./utils.js":15}],14:[function(require,module,exports){
var reduce = function () {
    var smooth = 5;
    var value = 'val';
    var redundant = function (a, b) {
	if (a < b) {
	    return ((b-a) <= (b * 0.2));
	}
	return ((a-b) <= (a * 0.2));
    };
    var perform_reduce = function (arr) {return arr;};

    var reduce = function (arr) {
	if (!arr.length) {
	    return arr;
	}
	var smoothed = perform_smooth(arr);
	var reduced  = perform_reduce(smoothed);
	return reduced;
    };

    var median = function (v, arr) {
	arr.sort(function (a, b) {
	    return a[value] - b[value];
	});
	if (arr.length % 2) {
	    v[value] = arr[~~(arr.length / 2)][value];	    
	} else {
	    var n = ~~(arr.length / 2) - 1;
	    v[value] = (arr[n][value] + arr[n+1][value]) / 2;
	}

	return v;
    };

    var clone = function (source) {
	var target = {};
	for (var prop in source) {
	    if (source.hasOwnProperty(prop)) {
		target[prop] = source[prop];
	    }
	}
	return target;
    };

    var perform_smooth = function (arr) {
	if (smooth === 0) { // no smooth
	    return arr;
	}
	var smooth_arr = [];
	for (var i=0; i<arr.length; i++) {
	    var low = (i < smooth) ? 0 : (i - smooth);
	    var high = (i > (arr.length - smooth)) ? arr.length : (i + smooth);
	    smooth_arr[i] = median(clone(arr[i]), arr.slice(low,high+1));
	}
	return smooth_arr;
    };

    reduce.reducer = function (cbak) {
	if (!arguments.length) {
	    return perform_reduce;
	}
	perform_reduce = cbak;
	return reduce;
    };

    reduce.redundant = function (cbak) {
	if (!arguments.length) {
	    return redundant;
	}
	redundant = cbak;
	return reduce;
    };

    reduce.value = function (val) {
	if (!arguments.length) {
	    return value;
	}
	value = val;
	return reduce;
    };

    reduce.smooth = function (val) {
	if (!arguments.length) {
	    return smooth;
	}
	smooth = val;
	return reduce;
    };

    return reduce;
};

var block = function () {
    var red = reduce()
	.value('start');

    var value2 = 'end';

    var join = function (obj1, obj2) {
        return {
            'object' : {
                'start' : obj1.object[red.value()],
                'end'   : obj2[value2]
            },
            'value'  : obj2[value2]
        };
    };

    // var join = function (obj1, obj2) { return obj1 };

    red.reducer( function (arr) {
	var value = red.value();
	var redundant = red.redundant();
	var reduced_arr = [];
	var curr = {
	    'object' : arr[0],
	    'value'  : arr[0][value2]
	};
	for (var i=1; i<arr.length; i++) {
	    if (redundant (arr[i][value], curr.value)) {
		curr = join(curr, arr[i]);
		continue;
	    }
	    reduced_arr.push (curr.object);
	    curr.object = arr[i];
	    curr.value = arr[i].end;
	}
	reduced_arr.push(curr.object);

	// reduced_arr.push(arr[arr.length-1]);
	return reduced_arr;
    });

    reduce.join = function (cbak) {
	if (!arguments.length) {
	    return join;
	}
	join = cbak;
	return red;
    };

    reduce.value2 = function (field) {
	if (!arguments.length) {
	    return value2;
	}
	value2 = field;
	return red;
    };

    return red;
};

var line = function () {
    var red = reduce();

    red.reducer ( function (arr) {
	var redundant = red.redundant();
	var value = red.value();
	var reduced_arr = [];
	var curr = arr[0];
	for (var i=1; i<arr.length-1; i++) {
	    if (redundant (arr[i][value], curr[value])) {
		continue;
	    }
	    reduced_arr.push (curr);
	    curr = arr[i];
	}
	reduced_arr.push(curr);
	reduced_arr.push(arr[arr.length-1]);
	return reduced_arr;
    });

    return red;

};

module.exports = reduce;
module.exports.line = line;
module.exports.block = block;


},{}],15:[function(require,module,exports){

module.exports = {
    iterator : function(init_val) {
	var i = init_val || 0;
	var iter = function () {
	    return i++;
	};
	return iter;
    },

    script_path : function (script_name) { // script_name is the filename
	var script_scaped = script_name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	var script_re = new RegExp(script_scaped + '$');
	var script_re_sub = new RegExp('(.*)' + script_scaped + '$');

	// TODO: This requires phantom.js or a similar headless webkit to work (document)
	var scripts = document.getElementsByTagName('script');
	var path = "";  // Default to current path
	if(scripts !== undefined) {
            for(var i in scripts) {
		if(scripts[i].src && scripts[i].src.match(script_re)) {
                    return scripts[i].src.replace(script_re_sub, '$1');
		}
            }
	}
	return path;
    },

    defer_cancel : function (cbak, time) {
	var tick;

	var defer_cancel = function () {
	    clearTimeout(tick);
	    tick = setTimeout(cbak, time);
	};

	return defer_cancel;
    }
};

},{}],16:[function(require,module,exports){
var apijs = require ("tnt.api");
var deferCancel = require ("tnt.utils").defer_cancel;

var board = function() {
    "use strict";

    //// Private vars
    var svg;
    var div_id;
    var tracks = [];
    var min_width = 50;
    var height    = 0;    // This is the global height including all the tracks
    var width     = 920;
    var height_offset = 20;
    var loc = {
	species  : undefined,
	chr      : undefined,
        from     : 0,
        to       : 500
    };

    // TODO: We have now background color in the tracks. Can this be removed?
    // It looks like it is used in the too-wide pane etc, but it may not be needed anymore
    var bgColor   = d3.rgb('#F8FBEF'); //#F8FBEF
    var pane; // Draggable pane
    var svg_g;
    var xScale;
    var zoomEventHandler = d3.behavior.zoom();
    var limits = {
	left : 0,
	right : 1000,
	zoom_out : 1000,
	zoom_in  : 100
    };
    var cap_width = 3;
    var dur = 500;
    var drag_allowed = true;

    var exports = {
	ease          : d3.ease("cubic-in-out"),
	extend_canvas : {
	    left : 0,
	    right : 0
	},
	show_frame : true
	// limits        : function () {throw "The limits method should be defined"}
    };

    // The returned closure / object
    var track_vis = function(div) {
	div_id = d3.select(div).attr("id");

	// The original div is classed with the tnt class
	d3.select(div)
	    .classed("tnt", true);

	// TODO: Move the styling to the scss?
	var browserDiv = d3.select(div)
	    .append("div")
	    .attr("id", "tnt_" + div_id)
	    .style("position", "relative")
	    .classed("tnt_framed", exports.show_frame ? true : false)
	    .style("width", (width + cap_width*2 + exports.extend_canvas.right + exports.extend_canvas.left) + "px")

	var groupDiv = browserDiv
	    .append("div")
	    .attr("class", "tnt_groupDiv");

	// The SVG
	svg = groupDiv
	    .append("svg")
	    .attr("class", "tnt_svg")
	    .attr("width", width)
	    .attr("height", height)
	    .attr("pointer-events", "all");

	svg_g = svg
	    .append("g")
            .attr("transform", "translate(0,20)")
            .append("g")
	    .attr("class", "tnt_g");

	// caps
	svg_g
	    .append("rect")
	    .attr("id", "tnt_" + div_id + "_5pcap")
	    .attr("x", 0)
	    .attr("y", 0)
	    .attr("width", 0)
	    .attr("height", height)
	    .attr("fill", "red");
	svg_g
	    .append("rect")
	    .attr("id", "tnt_" + div_id + "_3pcap")
	    .attr("x", width-cap_width)
	    .attr("y", 0)
	    .attr("width", 0)
	    .attr("height", height)
	    .attr("fill", "red");

	// The Zooming/Panning Pane
	pane = svg_g
	    .append("rect")
	    .attr("class", "tnt_pane")
	    .attr("id", "tnt_" + div_id + "_pane")
	    .attr("width", width)
	    .attr("height", height)
	    .style("fill", bgColor);

	// ** TODO: Wouldn't be better to have these messages by track?
	// var tooWide_text = svg_g
	//     .append("text")
	//     .attr("class", "tnt_wideOK_text")
	//     .attr("id", "tnt_" + div_id + "_tooWide")
	//     .attr("fill", bgColor)
	//     .text("Region too wide");

	// TODO: I don't know if this is the best way (and portable) way
	// of centering the text in the text area
	// var bb = tooWide_text[0][0].getBBox();
	// tooWide_text
	//     .attr("x", ~~(width/2 - bb.width/2))
	//     .attr("y", ~~(height/2 - bb.height/2));
    };

    // API
    var api = apijs (track_vis)
	.getset (exports)
	.getset (limits)
	.getset (loc);

    api.transform (track_vis.extend_canvas, function (val) {
	var prev_val = track_vis.extend_canvas();
	val.left = val.left || prev_val.left;
	val.right = val.right || prev_val.right;
	return val;
    });

    // track_vis always starts on loc.from & loc.to
    api.method ('start', function () {

	// Reset the tracks
	for (var i=0; i<tracks.length; i++) {
	    if (tracks[i].g) {
        //    tracks[i].display().reset.call(tracks[i]);
            tracks[i].g.remove();
	    }
	    _init_track(tracks[i]);
	}

	_place_tracks();

	// The continuation callback
	var cont = function (resp) {
	    limits.right = resp;

	    // zoomEventHandler.xExtent([limits.left, limits.right]);
	    if ((loc.to - loc.from) < limits.zoom_in) {
		if ((loc.from + limits.zoom_in) > limits.zoom_in) {
		    loc.to = limits.right;
		} else {
		    loc.to = loc.from + limits.zoom_in;
		}
	    }
	    plot();

	    for (var i=0; i<tracks.length; i++) {
		_update_track(tracks[i], loc);
	    }
	};

	// If limits.right is a function, we have to call it asynchronously and
	// then starting the plot once we have set the right limit (plot)
	// If not, we assume that it is an objet with new (maybe partially defined)
	// definitions of the limits and we can plot directly
	// TODO: Right now, only right can be called as an async function which is weak
	if (typeof (limits.right) === 'function') {
	    limits.right(cont);
	} else {
	    cont(limits.right);
	}

    });

    api.method ('update', function () {
	for (var i=0; i<tracks.length; i++) {
	    _update_track (tracks[i]);
	}

    });

    var _update_track = function (track, where) {
	if (track.data()) {
	    var track_data = track.data();
	    var data_updater = track_data.update();
	    //var data_updater = track.data().update();
	    data_updater.call(track_data, {
		'loc' : where,
		'on_success' : function () {
		    track.display().update.call(track, xScale);
		}
	    });
	}
    };

    var plot = function() {

	xScale = d3.scale.linear()
	    .domain([loc.from, loc.to])
	    .range([0, width]);

	if (drag_allowed) {
	    svg_g.call( zoomEventHandler
		       .x(xScale)
		       .scaleExtent([(loc.to-loc.from)/(limits.zoom_out-1), (loc.to-loc.from)/limits.zoom_in])
		       .on("zoom", _move)
		     );
	}

    };

    // right/left/zoom pans or zooms the track. These methods are exposed to allow external buttons, etc to interact with the tracks. The argument is the amount of panning/zooming (ie. 1.2 means 20% panning) With left/right only positive numbers are allowed.
    api.method ('move_right', function (factor) {
	if (factor > 0) {
	    _manual_move(factor, 1);
	}
    });

    api.method ('move_left', function (factor) {
	if (factor > 0) {
	    _manual_move(factor, -1);
	}
    });

    api.method ('zoom', function (factor) {
	_manual_move(factor, 0);
    });

    api.method ('find_track_by_id', function (id) {
	for (var i=0; i<tracks.length; i++) {
	    if (tracks[i].id() === id) {
		return tracks[i];
	    }
	}
    });

    api.method ('reorder', function (new_tracks) {
	// TODO: This is defining a new height, but the global height is used to define the size of several
	// parts. We should do this dynamically

	for (var j=0; j<new_tracks.length; j++) {
	    var found = false;
	    for (var i=0; i<tracks.length; i++) {
		if (tracks[i].id() === new_tracks[j].id()) {
		    found = true;
		    tracks.splice(i,1);
		    break;
		}
	    }
	    if (!found) {
		_init_track(new_tracks[j]);
		_update_track(new_tracks[j], {from : loc.from, to : loc.to});
	    }
	}

	for (var x=0; x<tracks.length; x++) {
	    tracks[x].g.remove();
	}

	tracks = new_tracks;
	_place_tracks();

    });

    api.method ('remove_track', function (track) {
	track.g.remove();
    });

    api.method ('add_track', function (track) {
	if (track instanceof Array) {
	    for (var i=0; i<track.length; i++) {
		track_vis.add_track (track[i]);
	    }
	    return track_vis;
	}
	tracks.push(track);
	return track_vis;
    });

    api.method('tracks', function (new_tracks) {
	if (!arguments.length) {
	    return tracks
	}
	tracks = new_tracks;
	return track_vis;
    });

    //
    api.method ('width', function (w) {
	// TODO: Allow suffixes like "1000px"?
	// TODO: Test wrong formats
	if (!arguments.length) {
	    return width;
	}
	// At least min-width
	if (w < min_width) {
	    w = min_width
	}

	// We are resizing
	if (div_id !== undefined) {
	    d3.select("#tnt_" + div_id).select("svg").attr("width", w);
	    // Resize the zooming/panning pane
	    d3.select("#tnt_" + div_id).style("width", (parseInt(w) + cap_width*2) + "px");
	    d3.select("#tnt_" + div_id + "_pane").attr("width", w);

	    // Replot
	    width = w;
	    plot();
	    for (var i=0; i<tracks.length; i++) {
		tracks[i].g.select("rect").attr("width", w);
		tracks[i].display().reset.call(tracks[i]);
		tracks[i].display().update.call(tracks[i],xScale);
	    }

	} else {
	    width = w;
	}

	return track_vis;
    });

    api.method('allow_drag', function(b) {
	if (!arguments.length) {
	    return drag_allowed;
	}
	drag_allowed = b;
	if (drag_allowed) {
	    // When this method is called on the object before starting the simulation, we don't have defined xScale
	    if (xScale !== undefined) {
		svg_g.call( zoomEventHandler.x(xScale)
			   // .xExtent([0, limits.right])
			   .scaleExtent([(loc.to-loc.from)/(limits.zoom_out-1), (loc.to-loc.from)/limits.zoom_in])
			   .on("zoom", _move) );
	    }
	} else {
	    // We create a new dummy scale in x to avoid dragging the previous one
	    // TODO: There may be a cheaper way of doing this?
	    zoomEventHandler.x(d3.scale.linear()).on("zoom", null);
	}
	return track_vis;
    });

    var _place_tracks = function () {
	var h = 0;
	for (var i=0; i<tracks.length; i++) {
	    var track = tracks[i];
	    if (track.g.attr("transform")) {
		track.g
		    .transition()
		    .duration(dur)
		    .attr("transform", "translate(" + exports.extend_canvas.left + "," + h + ")");
	    } else {
		track.g
		    .attr("transform", "translate(" + exports.extend_canvas.left + "," + h + ")");
	    }

	    h += track.height();
	}

	// svg
	svg.attr("height", h + height_offset);

	// div
	d3.select("#tnt_" + div_id)
	    .style("height", (h + 10 + height_offset) + "px");

	// caps
	d3.select("#tnt_" + div_id + "_5pcap")
	    .attr("height", h)
	    // .move_to_front()
	    .each(function (d) {
		move_to_front(this);
	    })
	d3.select("#tnt_" + div_id + "_3pcap")
	    .attr("height", h)
	//.move_to_front()
	    .each (function (d) {
		move_to_front(this);
	    });


	// pane
	pane
	    .attr("height", h + height_offset);

	// tooWide_text. TODO: Is this still needed?
	// var tooWide_text = d3.select("#tnt_" + div_id + "_tooWide");
	// var bb = tooWide_text[0][0].getBBox();
	// tooWide_text
	//     .attr("y", ~~(h/2) - bb.height/2);

	return track_vis;
    }

    var _init_track = function (track) {
	track.g = svg.select("g").select("g")
	    .append("g")
	    .attr("class", "tnt_track")
	    .attr("height", track.height());

	// Rect for the background color
	track.g
	    .append("rect")
	    .attr("x", 0)
	    .attr("y", 0)
	    .attr("width", track_vis.width())
	    .attr("height", track.height())
	    .style("fill", track.background_color())
	    .style("pointer-events", "none");

	if (track.display()) {
	    track.display().init.call(track, width);
	}

	return track_vis;
    };

    var _manual_move = function (factor, direction) {
	var oldDomain = xScale.domain();

	var span = oldDomain[1] - oldDomain[0];
	var offset = (span * factor) - span;

	var newDomain;
	switch (direction) {
	case -1 :
	    newDomain = [(~~oldDomain[0] - offset), ~~(oldDomain[1] - offset)];
	    break;
	case 1 :
	    newDomain = [(~~oldDomain[0] + offset), ~~(oldDomain[1] - offset)];
	    break;
	case 0 :
	    newDomain = [oldDomain[0] - ~~(offset/2), oldDomain[1] + (~~offset/2)];
	}

	var interpolator = d3.interpolateNumber(oldDomain[0], newDomain[0]);
	var ease = exports.ease;

	var x = 0;
	d3.timer(function() {
	    var curr_start = interpolator(ease(x));
	    var curr_end;
	    switch (direction) {
	    case -1 :
		curr_end = curr_start + span;
		break;
	    case 1 :
		curr_end = curr_start + span;
		break;
	    case 0 :
		curr_end = oldDomain[1] + oldDomain[0] - curr_start;
		break;
	    }

	    var currDomain = [curr_start, curr_end];
	    xScale.domain(currDomain);
	    _move(xScale);
	    x+=0.02;
	    return x>1;
	});
    };


    var _move_cbak = function () {
	var currDomain = xScale.domain();
	track_vis.from(~~currDomain[0]);
	track_vis.to(~~currDomain[1]);

	for (var i = 0; i < tracks.length; i++) {
	    var track = tracks[i];
	    _update_track(track, loc);
	}
    };
    // The deferred_cbak is deferred at least this amount of time or re-scheduled if deferred is called before
    var _deferred = deferCancel(_move_cbak, 300);

    // api.method('update', function () {
    // 	_move();
    // });

    var _move = function (new_xScale) {
	if (new_xScale !== undefined && drag_allowed) {
	    zoomEventHandler.x(new_xScale);
	}

	// Show the red bars at the limits
	var domain = xScale.domain();
	if (domain[0] <= 5) {
	    d3.select("#tnt_" + div_id + "_5pcap")
		.attr("width", cap_width)
		.transition()
		.duration(200)
		.attr("width", 0);
	}

	if (domain[1] >= (limits.right)-5) {
	    d3.select("#tnt_" + div_id + "_3pcap")
		.attr("width", cap_width)
		.transition()
		.duration(200)
		.attr("width", 0);
	}


	// Avoid moving past the limits
	if (domain[0] < limits.left) {
	    zoomEventHandler.translate([zoomEventHandler.translate()[0] - xScale(limits.left) + xScale.range()[0], zoomEventHandler.translate()[1]]);
	} else if (domain[1] > limits.right) {
	    zoomEventHandler.translate([zoomEventHandler.translate()[0] - xScale(limits.right) + xScale.range()[1], zoomEventHandler.translate()[1]]);
	}

	_deferred();

	for (var i = 0; i < tracks.length; i++) {
	    var track = tracks[i];
	    track.display().move.call(track,xScale);
	}
    };

    // api.method({
    // 	allow_drag : api_allow_drag,
    // 	width      : api_width,
    // 	add_track  : api_add_track,
    // 	reorder    : api_reorder,
    // 	zoom       : api_zoom,
    // 	left       : api_left,
    // 	right      : api_right,
    // 	start      : api_start
    // });

    // Auxiliar functions
    function move_to_front (elem) {
	elem.parentNode.appendChild(elem);
    }

    return track_vis;
};

module.exports = exports = board;

},{"tnt.api":10,"tnt.utils":12}],17:[function(require,module,exports){
var apijs = require ("tnt.api");
// var ensemblRestAPI = require("tnt.ensembl");

// var board = {};
// board.track = {};

var data = function() {
    "use strict";
    var _ = function () {
    };

    // Getters / Setters
    apijs (_)
    // label is not used at the moment
	.getset ('label', "")
	.getset ('elements', [])
	.getset ('update', function () {});

    return _;
};

// The retrievers. They need to access 'elements'
data.retriever = {};

data.retriever.sync = function() {
    var update_track = function(obj) {
	// "this" is set to the data obj
        this.elements(update_track.retriever()(obj.loc));
        obj.on_success();
    };

    apijs (update_track)
	.getset ('retriever', function () {})

    return update_track;
};

data.retriever.async = function () {
    var url = '';

    // "this" is set to the data obj
    var data_obj = this;
    var update_track = function (obj) {
	d3.json(url, function (err, resp) {
	    data_obj.elements(resp);
	    obj.on_success();
	}); 
    };

    apijs (update_track)
	.getset ('url', '');

    return update_track;
};



// A predefined track for genes
// tnt.track.data.gene = function () {
//     var track = tnt.track.data();
// 	// .index("ID");

//     var updater = tnt.track.retriever.ensembl()
// 	.endpoint("region")
//     // TODO: If success is defined here, means that it can't be user-defined
//     // is that good? enough? API?
//     // UPDATE: Now success is backed up by an array. Still don't know if this is the best option
// 	.success(function(genes) {
// 	    for (var i = 0; i < genes.length; i++) {
// 		if (genes[i].strand === -1) {  
// 		    genes[i].display_label = "<" + genes[i].external_name;
// 		} else {
// 		    genes[i].display_label = genes[i].external_name + ">";
// 		}
// 	    }
// 	});

//     return track.update(updater);
// }

// A predefined track displaying no external data
// it is used for location and axis tracks for example
data.empty = function () {
    var track = data();
    var updater = data.retriever.sync();
    track.update(updater);

    return track;
};

module.exports = exports = data;

},{"tnt.api":10}],18:[function(require,module,exports){
var apijs = require ("tnt.api");
var layout = require("./layout.js");

// FEATURE VIS
// var board = {};
// board.track = {};
var tnt_feature = function () {
    var dispatch = d3.dispatch ("click", "dblclick", "mouseover", "mouseout");

    ////// Vars exposed in the API
    var exports = {
        create   : function () {throw "create_elem is not defined in the base feature object";},
        mover    : function () {throw "move_elem is not defined in the base feature object";},
        updater  : function () {},
        guider   : function () {},
        //layout   : function () {},
        index    : undefined,
        layout   : layout.identity(),
        foreground_color : '#000'
    };


    // The returned object
    var feature = {};

    var reset = function () {
    	var track = this;
    	track.g.selectAll(".tnt_elem").remove();
        track.g.selectAll(".tnt_guider").remove();
    };

    var init = function (width) {
        var track = this;

        track.g
            .append ("text")
            .attr ("x", 5)
            .attr ("y", 12)
            .attr ("font-size", 11)
            .attr ("fill", "grey")
            .text (track.label());

        exports.guider.call(track, width);
    };

    var plot = function (new_elems, track, xScale) {
        new_elems.on("click", dispatch.click);
        new_elems.on("mouseover", dispatch.mouseover);
        new_elems.on("dblclick", dispatch.dblclick);
        new_elems.on("mouseout", dispatch.mouseout);
        // new_elem is a g element where the feature is inserted
        exports.create.call(track, new_elems, xScale);
    };

    var update = function (xScale, field) {
        var track = this;
        var svg_g = track.g;
        // var layout = exports.layout;
        // if (layout.height) {
        //     layout.height(track.height());
        // }

        var elements = track.data().elements();

        if (field !== undefined) {
            elements = elements[field];
        }

        var data_elems = exports.layout.call(track, elements, xScale);

        var vis_sel;
        var vis_elems;
        if (field !== undefined) {
            vis_sel = svg_g.selectAll(".tnt_elem_" + field);
        } else {
            vis_sel = svg_g.selectAll(".tnt_elem");
        }

        if (exports.index) { // Indexing by field
            vis_elems = vis_sel
                .data(data_elems, function (d) {
                    if (d !== undefined) {
                        return exports.index(d);
                    }
                });
        } else { // Indexing by position in array
            vis_elems = vis_sel
                .data(data_elems);
        }

	exports.updater.call(track, vis_elems, xScale);

	var new_elem = vis_elems
	    .enter();

	new_elem
	    .append("g")
	    .attr("class", "tnt_elem")
	    .classed("tnt_elem_" + field, field)
	    .call(feature.plot, track, xScale);

	vis_elems
	    .exit()
	    .remove();
    };

    var move = function (xScale, field) {
	var track = this;
	var svg_g = track.g;
	var elems;
	// TODO: Is selecting the elements to move too slow?
	// It would be nice to profile
	if (field !== undefined) {
	    elems = svg_g.selectAll(".tnt_elem_" + field);
	} else {
	    elems = svg_g.selectAll(".tnt_elem");
	}

	exports.mover.call(this, elems, xScale);
    };

    var mtf = function (elem) {
	elem.parentNode.appendChild(elem);
    };

    var move_to_front = function (field) {
	if (field !== undefined) {
	    var track = this;
	    var svg_g = track.g;
	    svg_g.selectAll(".tnt_elem_" + field)
	        .each( function () {
		    mtf(this);
		});
	}
    };

    // API
    apijs (feature)
	.getset (exports)
	.method ({
	    reset  : reset,
	    plot   : plot,
	    update : update,
	    move   : move,
	    init   : init,
	    move_to_front : move_to_front
	});

    return d3.rebind(feature, dispatch, "on");
};

tnt_feature.composite = function () {
    var displays = {};
    var display_order = [];

    var features = {};

    var reset = function () {
	var track = this;
	for (var i=0; i<displays.length; i++) {
	    displays[i].reset.call(track);
	}
    };

    var init = function (width) {
	var track = this;
 	for (var display in displays) {
	    if (displays.hasOwnProperty(display)) {
		displays[display].init.call(track, width);
	    }
	}
    };

    var update = function (xScale) {
	var track = this;
	for (var i=0; i<display_order.length; i++) {
	    displays[display_order[i]].update.call(track, xScale, display_order[i]);
	    displays[display_order[i]].move_to_front.call(track, display_order[i]);
	}
	// for (var display in displays) {
	//     if (displays.hasOwnProperty(display)) {
	// 	displays[display].update.call(track, xScale, display);
	//     }
	// }
    };

    var move = function (xScale) {
	var track = this;
	for (var display in displays) {
	    if (displays.hasOwnProperty(display)) {
		displays[display].move.call(track, xScale, display);
	    }
	}
    };

    var add = function (key, display) {
	displays[key] = display;
	display_order.push(key);
	return features;
    };

    // var on_click = function (cbak) {
    //     for (var display in displays) {
    //         if (displays.hasOwnProperty(display)) {
    //             displays[display].on("click",cbak);
    //         }
    //     }
    //     return features;
    // };

    var get_displays = function () {
	var ds = [];
	for (var i=0; i<display_order.length; i++) {
	    ds.push(displays[display_order[i]]);
	}
	return ds;
    };

    // API
    apijs (features)
	.method ({
	    reset  : reset,
	    update : update,
	    move   : move,
	    init   : init,
	    add    : add,
//	    on_click : on_click,
	    displays : get_displays
	});

    return features;
};

tnt_feature.area = function () {
    var feature = tnt_feature.line();
    var line = tnt_feature.line();

    var area = d3.svg.area()
	.interpolate(line.interpolate())
	.tension(feature.tension());

    var data_points;

    var line_create = feature.create(); // We 'save' line creation
    feature.create (function (points, xScale) {
	var track = this;

	if (data_points !== undefined) {
//	     return;
	    track.g.select("path").remove();
	}

	line_create.call(track, points, xScale);

	area
	    .x(line.x())
	    .y1(line.y())
	    .y0(track.height());

	data_points = points.data();
	points.remove();

	track.g
	    .append("path")
	    .attr("class", "tnt_area")
	    .classed("tnt_elem", true)
	    .datum(data_points)
	    .attr("d", area)
	    .attr("fill", d3.rgb(feature.foreground_color()).brighter());

    });

    var line_mover = feature.mover();
    feature.mover (function (path, xScale) {
	var track = this;
	line_mover.call(track, path, xScale);

	area.x(line.x());
	track.g
	    .select(".tnt_area")
	    .datum(data_points)
	    .attr("d", area);
    });

    return feature;

};

tnt_feature.line = function () {
    var feature = tnt_feature();

    var x = function (d) {
	return d.pos;
    };
    var y = function (d) {
	return d.val;
    };
    var tension = 0.7;
    var yScale = d3.scale.linear();
    var line = d3.svg.line()
	.interpolate("basis");

    // line getter. TODO: Setter?
    feature.line = function () {
	return line;
    };

    feature.x = function (cbak) {
	if (!arguments.length) {
	    return x;
	}
	x = cbak;
	return feature;
    };

    feature.y = function (cbak) {
	if (!arguments.length) {
	    return y;
	}
	y = cbak;
	return feature;
    };

    feature.tension = function (t) {
	if (!arguments.length) {
	    return tension;
	}
	tension = t;
	return feature;
    };

    var data_points;

    // For now, create is a one-off event
    // TODO: Make it work with partial paths, ie. creating and displaying only the path that is being displayed
    feature.create (function (points, xScale) {
	var track = this;

	if (data_points !== undefined) {
	    // return;
	    track.g.select("path").remove();
	}

	line
	    .tension(tension)
	    .x(function (d) {
		return xScale(x(d));
	    })
	    .y(function (d) {
		return track.height() - yScale(y(d));
	    })

	data_points = points.data();
	points.remove();

	yScale
	    .domain([0, 1])
	    // .domain([0, d3.max(data_points, function (d) {
	    // 	return y(d);
	    // })])
	    .range([0, track.height() - 2]);

	track.g
	    .append("path")
	    .attr("class", "tnt_elem")
	    .attr("d", line(data_points))
	    .style("stroke", feature.foreground_color())
	    .style("stroke-width", 4)
	    .style("fill", "none");

    });

    feature.mover (function (path, xScale) {
	var track = this;

	line.x(function (d) {
	    return xScale(x(d))
	});
	track.g.select("path")
	    .attr("d", line(data_points));
    });

    return feature;
};

tnt_feature.conservation = function () {
    // 'Inherit' from feature.area
    var feature = tnt_feature.area();

    var area_create = feature.create(); // We 'save' area creation
    feature.create  (function (points, xScale) {
	var track = this;

	area_create.call(track, d3.select(points[0][0]), xScale)
    });

    return feature;
};

tnt_feature.ensembl = function () {
    // 'Inherit' from board.track.feature
    var feature = tnt_feature();

    var foreground_color2 = "#7FFF00";
    var foreground_color3 = "#00BB00";

    feature.guider (function (width) {
	var track = this;
	var height_offset = ~~(track.height() - (track.height()  * 0.8)) / 2;

	track.g
	    .append("line")
	    .attr("class", "tnt_guider")
	    .attr("x1", 0)
	    .attr("x2", width)
	    .attr("y1", height_offset)
	    .attr("y2", height_offset)
	    .style("stroke", feature.foreground_color())
	    .style("stroke-width", 1);

	track.g
	    .append("line")
	    .attr("class", "tnt_guider")
	    .attr("x1", 0)
	    .attr("x2", width)
	    .attr("y1", track.height() - height_offset)
	    .attr("y2", track.height() - height_offset)
	    .style("stroke", feature.foreground_color())
	    .style("stroke-width", 1);

    });

    feature.create (function (new_elems, xScale) {
	var track = this;

	var height_offset = ~~(track.height() - (track.height()  * 0.8)) / 2;

	new_elems
	    .append("rect")
	    .attr("x", function (d) {
		return xScale (d.start);
	    })
	    .attr("y", height_offset)
// 	    .attr("rx", 3)
// 	    .attr("ry", 3)
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    })
	    .attr("height", track.height() - ~~(height_offset * 2))
	    .attr("fill", track.background_color())
	    .transition()
	    .duration(500)
	    .attr("fill", function (d) {
		if (d.type === 'high') {
		    return d3.rgb(feature.foreground_color());
		}
		if (d.type === 'low') {
		    return d3.rgb(feature.foreground_color2());
		}
		return d3.rgb(feature.foreground_color3());
	    });
    });

    feature.updater (function (blocks, xScale) {
	blocks
	    .select("rect")
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start))
	    });
    });

    feature.mover (function (blocks, xScale) {
	blocks
	    .select("rect")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    });
    });

    feature.foreground_color2 = function (col) {
	if (!arguments.length) {
	    return foreground_color2;
	}
	foreground_color2 = col;
	return feature;
    };

    feature.foreground_color3 = function (col) {
	if (!arguments.length) {
	    return foreground_color3;
	}
	foreground_color3 = col;
	return feature;
    };

    return feature;
};

tnt_feature.vline = function () {
    // 'Inherit' from feature
    var feature = tnt_feature();

    feature.create (function (new_elems, xScale) {
	var track = this;
	new_elems
	    .append ("line")
	    .attr("x1", function (d) {
		// TODO: Should use the index value?
		return xScale(feature.index()(d))
	    })
	    .attr("x2", function (d) {
		return xScale(feature.index()(d))
	    })
	    .attr("y1", 0)
	    .attr("y2", track.height())
	    .attr("stroke", feature.foreground_color())
	    .attr("stroke-width", 1);
    });

    feature.mover (function (vlines, xScale) {
	vlines
	    .select("line")
	    .attr("x1", function (d) {
		return xScale(feature.index()(d));
	    })
	    .attr("x2", function (d) {
		return xScale(feature.index()(d));
	    });
    });

    return feature;

};

tnt_feature.pin = function () {
    // 'Inherit' from board.track.feature
    var feature = tnt_feature();

    var yScale = d3.scale.linear()
	.domain([0,0])
	.range([0,0]);

    var opts = {
        pos : d3.functor("pos"),
        val : d3.functor("val"),
        domain : [0,0]
    };

    var pin_ball_r = 5; // the radius of the circle in the pin

    apijs(feature)
        .getset(opts);


    feature.create (function (new_pins, xScale) {
	var track = this;
	yScale
	    .domain(feature.domain())
	    .range([pin_ball_r, track.height()-pin_ball_r-10]); // 10 for labelling

	// pins are composed of lines, circles and labels
	new_pins
	    .append("line")
	    .attr("x1", function (d, i) {
	    	return xScale(d[opts.pos(d, i)])
	    })
	    .attr("y1", function (d) {
	    	return track.height();
	    })
	    .attr("x2", function (d,i) {
	    	return xScale(d[opts.pos(d, i)]);
	    })
	    .attr("y2", function (d, i) {
	    	return track.height() - yScale(d[opts.val(d, i)]);
	    })
	    .attr("stroke", feature.foreground_color());

	new_pins
	    .append("circle")
	    .attr("cx", function (d, i) {
            return xScale(d[opts.pos(d, i)]);
	    })
	    .attr("cy", function (d, i) {
            return track.height() - yScale(d[opts.val(d, i)]);
	    })
	    .attr("r", pin_ball_r)
	    .attr("fill", feature.foreground_color());

    new_pins
        .append("text")
        .attr("font-size", "13")
        .attr("x", function (d, i) {
            return xScale(d[opts.pos(d, i)]);
        })
        .attr("y", function (d, i) {
            return 10;
        })
        .style("text-anchor", "middle")
        .text(function (d) {
            return d.label || "";
        })

    });

    feature.updater (function (pins, xScale){
        pins
            .select("text")
            .text(function (d) {
                return d.label || "";
            })
    });

    feature.mover(function (pins, xScale) {
	var track = this;
	pins
	    //.each(position_pin_line)
	    .select("line")
	    .attr("x1", function (d, i) {
		return xScale(d[opts.pos(d, i)])
	    })
	    .attr("y1", function (d) {
		return track.height();
	    })
	    .attr("x2", function (d,i) {
		return xScale(d[opts.pos(d, i)]);
	    })
	    .attr("y2", function (d, i) {
		return track.height() - yScale(d[opts.val(d, i)]);
	    });

	pins
	    .select("circle")
	    .attr("cx", function (d, i) {
            return xScale(d[opts.pos(d, i)]);
	    })
	    .attr("cy", function (d, i) {
            return track.height() - yScale(d[opts.val(d, i)]);
	    });

    pins
        .select("text")
        .attr("x", function (d, i) {
            return xScale(d[opts.pos(d, i)]);
        })
        .text(function (d) {
            return d.label || "";
        })

    });

    feature.guider (function (width) {
	var track = this;
	track.g
	    .append("line")
	    .attr("x1", 0)
	    .attr("x2", width)
	    .attr("y1", track.height())
	    .attr("y2", track.height())
	    .style("stroke", "black")
	    .style("stroke-with", "1px");
    });

    return feature;
};

tnt_feature.block = function () {
    // 'Inherit' from board.track.feature
    var feature = tnt_feature();

    apijs(feature)
	.getset('from', function (d) {
	    return d.start;
	})
	.getset('to', function (d) {
	    return d.end;
	});

    feature.create(function (new_elems, xScale) {
	var track = this;
	new_elems
	    .append("rect")
	    .attr("x", function (d, i) {
		// TODO: start, end should be adjustable via the tracks API
		return xScale(feature.from()(d, i));
	    })
	    .attr("y", 0)
	    .attr("width", function (d, i) {
		return (xScale(feature.to()(d, i)) - xScale(feature.from()(d, i)));
	    })
	    .attr("height", track.height())
	    .attr("fill", track.background_color())
	    .transition()
	    .duration(500)
	    .attr("fill", function (d) {
		if (d.color === undefined) {
		    return feature.foreground_color();
		} else {
		    return d.color;
		}
	    });
    });

    feature.updater(function (elems, xScale) {
	elems
	    .select("rect")
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    });
    });

    feature.mover(function (blocks, xScale) {
	blocks
	    .select("rect")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    });
    });

    return feature;

};

tnt_feature.axis = function () {
    var xAxis;
    var orientation = "top";

    // Axis doesn't inherit from feature
    var feature = {};
    feature.reset = function () {
	xAxis = undefined;
	var track = this;
	track.g.selectAll("rect").remove();
	track.g.selectAll(".tick").remove();
    };
    feature.plot = function () {};
    feature.move = function () {
	var track = this;
	var svg_g = track.g;
	svg_g.call(xAxis);
    }

    feature.init = function () {};

    feature.update = function (xScale) {
	// Create Axis if it doesn't exist
	if (xAxis === undefined) {
	    xAxis = d3.svg.axis()
		.scale(xScale)
		.orient(orientation);
	}

	var track = this;
	var svg_g = track.g;
	svg_g.call(xAxis);
    };

    feature.orientation = function (pos) {
	if (!arguments.length) {
	    return orientation;
	}
	orientation = pos;
	return feature;
    };

    return feature;
};

tnt_feature.location = function () {
    var row;

    var feature = {};
    feature.reset = function () {};
    feature.plot = function () {};
    feature.init = function () {};
    feature.move = function(xScale) {
	var domain = xScale.domain();
	row.select("text")
	    .text("Location: " + ~~domain[0] + "-" + ~~domain[1]);
    };

    feature.update = function (xScale) {
	var track = this;
	var svg_g = track.g;
	var domain = xScale.domain();
	if (row === undefined) {
	    row = svg_g;
	    row
		.append("text")
		.text("Location: " + ~~domain[0] + "-" + ~~domain[1]);
	}
    };

    return feature;
};

module.exports = exports = tnt_feature;

},{"./layout.js":20,"tnt.api":10}],19:[function(require,module,exports){
var board = require ("./board.js");
board.track = require ("./track");
board.track.data = require ("./data.js");
board.track.layout = require ("./layout.js");
board.track.feature = require ("./feature.js");
board.track.layout = require ("./layout.js");

module.exports = exports = board;

},{"./board.js":16,"./data.js":17,"./feature.js":18,"./layout.js":20,"./track":21}],20:[function(require,module,exports){
var apijs = require ("tnt.api");

// var board = {};
// board.track = {};
var layout = function () {

    // The returned closure / object
    var l = function (new_elems, xScale)  {
        var track = this;
        l.elements().call(track, new_elems, xScale);
        return new_elems;
    };

    var api = apijs(l)
        .getset ('elements', function () {})
        .method ({
            height : function () {}
        });

    return l;
};

layout.identity = function () {
    return layout()
        .elements (function (e) {
            return e;
        });
};

module.exports = exports = layout;

},{"tnt.api":10}],21:[function(require,module,exports){
var apijs = require ("tnt.api");
var iterator = require("tnt.utils").iterator;

//var board = {};

var track = function () {
    "use strict";

    var read_conf = {
	// Unique ID for this track
	id : track.id()
    };

    var display;

    var conf = {
	// foreground_color : d3.rgb('#000000'),
	background_color : d3.rgb('#CCCCCC'),
	height           : 250,
	// data is the object (normally a tnt.track.data object) used to retrieve and update data for the track
	data             : track.data.empty(),
    label             : ""
    };

    // The returned object / closure
    var _ = function() {
    };

    // API
    var api = apijs (_)
	.getset (conf)
	.get (read_conf);

    // TODO: This means that height should be defined before display
    // we shouldn't rely on this
    _.display = function (new_plotter) {
	if (!arguments.length) {
	    return display;
	}
	display = new_plotter;
	if (typeof (display) === 'function') {
	    display.layout && display.layout().height(conf.height);
	} else {
	    for (var key in display) {
		if (display.hasOwnProperty(key)) {
		    display[key].layout && display[key].layout().height(conf.height);
		}
	    }
	}

	return _;
    };

    return _;

};

track.id = iterator(1);

module.exports = exports = track;

},{"tnt.api":10,"tnt.utils":12}],22:[function(require,module,exports){
module.exports = tnt_ensembl = require("./src/rest.js");

},{"./src/rest.js":39}],23:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   2.3.0
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$toString = {}.toString;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      var nextTick = process.nextTick;
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // setImmediate should be used instead instead
      var version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
      if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
        nextTick = setImmediate;
      }
      return function() {
        nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertex() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertex();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFullfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable) {
      if (maybeThenable.constructor === promise.constructor) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        var then = lib$es6$promise$$internal$$getThen(maybeThenable);

        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFullfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value);
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      var enumerator = this;

      enumerator._instanceConstructor = Constructor;
      enumerator.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (enumerator._validateInput(input)) {
        enumerator._input     = input;
        enumerator.length     = input.length;
        enumerator._remaining = input.length;

        enumerator._init();

        if (enumerator.length === 0) {
          lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
        } else {
          enumerator.length = enumerator.length || 0;
          enumerator._enumerate();
          if (enumerator._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(enumerator.promise, enumerator._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validateInput = function(input) {
      return lib$es6$promise$utils$$isArray(input);
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._init = function() {
      this._result = new Array(this.length);
    };

    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var enumerator = this;

      var length  = enumerator.length;
      var promise = enumerator.promise;
      var input   = enumerator._input;

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        enumerator._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var enumerator = this;
      var c = enumerator._instanceConstructor;

      if (lib$es6$promise$utils$$isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== lib$es6$promise$$internal$$PENDING) {
          entry._onerror = null;
          enumerator._settledAt(entry._state, i, entry._result);
        } else {
          enumerator._willSettleAt(c.resolve(entry), i);
        }
      } else {
        enumerator._remaining--;
        enumerator._result[i] = entry;
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var enumerator = this;
      var promise = enumerator.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        enumerator._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          enumerator._result[i] = value;
        }
      }

      if (enumerator._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, enumerator._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        if (!lib$es6$promise$utils$$isFunction(resolver)) {
          lib$es6$promise$promise$$needsResolver();
        }

        if (!(this instanceof lib$es6$promise$promise$$Promise)) {
          lib$es6$promise$promise$$needsNew();
        }

        lib$es6$promise$$internal$$initializePromise(this, resolver);
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection) {
        var parent = this;
        var state = parent._state;

        if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
          return this;
        }

        var child = new this.constructor(lib$es6$promise$$internal$$noop);
        var result = parent._result;

        if (state) {
          var callback = arguments[state - 1];
          lib$es6$promise$asap$$asap(function(){
            lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
          });
        } else {
          lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
        }

        return child;
      },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require("IrXUsu"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"IrXUsu":6}],24:[function(require,module,exports){
/*globals define */
'use strict';


(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return (root.httppleasepromises = factory(root));
        });
    } else if (typeof exports === 'object') {
        module.exports = factory(root);
    } else {
        root.httppleasepromises = factory(root);
    }
}(this, function (root) { // jshint ignore:line
    return function (Promise) {
        Promise = Promise || root && root.Promise;
        if (!Promise) {
            throw new Error('No Promise implementation found.');
        }
        return {
            processRequest: function (req) {
                var resolve, reject,
                    oldOnload = req.onload,
                    oldOnerror = req.onerror,
                    promise = new Promise(function (a, b) {
                        resolve = a;
                        reject = b;
                    });
                req.onload = function (res) {
                    var result;
                    if (oldOnload) {
                        result = oldOnload.apply(this, arguments);
                    }
                    resolve(res);
                    return result;
                };
                req.onerror = function (err) {
                    var result;
                    if (oldOnerror) {
                        result = oldOnerror.apply(this, arguments);
                    }
                    reject(err);
                    return result;
                };
                req.then = function () {
                    return promise.then.apply(promise, arguments);
                };
                req['catch'] = function () {
                    return promise['catch'].apply(promise, arguments);
                };
            }
        };
    };
}));

},{}],25:[function(require,module,exports){
'use strict';

var Response = require('./response');

function RequestError(message, props) {
    var err = new Error(message);
    err.name = 'RequestError';
    this.name = err.name;
    this.message = err.message;
    if (err.stack) {
        this.stack = err.stack;
    }

    this.toString = function () {
        return this.message;
    };

    for (var k in props) {
        if (props.hasOwnProperty(k)) {
            this[k] = props[k];
        }
    }
}

RequestError.prototype = Error.prototype;

RequestError.create = function (message, req, props) {
    var err = new RequestError(message, props);
    Response.call(err, req);
    return err;
};

module.exports = RequestError;

},{"./response":28}],26:[function(require,module,exports){
'use strict';

var i,
    cleanURL = require('../plugins/cleanurl'),
    XHR = require('./xhr'),
    delay = require('./utils/delay'),
    createError = require('./error').create,
    Response = require('./response'),
    Request = require('./request'),
    extend = require('xtend'),
    once = require('./utils/once');

function factory(defaults, plugins) {
    defaults = defaults || {};
    plugins = plugins || [];

    function http(req, cb) {
        var xhr, plugin, done, k, timeoutId;

        req = new Request(extend(defaults, req));

        for (i = 0; i < plugins.length; i++) {
            plugin = plugins[i];
            if (plugin.processRequest) {
                plugin.processRequest(req);
            }
        }

        // Give the plugins a chance to create the XHR object
        for (i = 0; i < plugins.length; i++) {
            plugin = plugins[i];
            if (plugin.createXHR) {
                xhr = plugin.createXHR(req);
                break; // First come, first serve
            }
        }
        xhr = xhr || new XHR();

        req.xhr = xhr;

        // Because XHR can be an XMLHttpRequest or an XDomainRequest, we add
        // `onreadystatechange`, `onload`, and `onerror` callbacks. We use the
        // `once` util to make sure that only one is called (and it's only called
        // one time).
        done = once(delay(function (err) {
            clearTimeout(timeoutId);
            xhr.onload = xhr.onerror = xhr.onreadystatechange = xhr.ontimeout = xhr.onprogress = null;
            var res = err && err.isHttpError ? err : new Response(req);
            for (i = 0; i < plugins.length; i++) {
                plugin = plugins[i];
                if (plugin.processResponse) {
                    plugin.processResponse(res);
                }
            }
            if (err) {
                if (req.onerror) {
                    req.onerror(err);
                }
            } else {
                if (req.onload) {
                    req.onload(res);
                }
            }
            if (cb) {
                cb(err, res);
            }
        }));

        // When the request completes, continue.
        xhr.onreadystatechange = function () {
            if (req.timedOut) return;

            if (req.aborted) {
                done(createError('Request aborted', req, {name: 'Abort'}));
            } else if (xhr.readyState === 4) {
                var type = Math.floor(xhr.status / 100);
                if (type === 2) {
                    done();
                } else if (xhr.status === 404 && !req.errorOn404) {
                    done();
                } else {
                    var kind;
                    switch (type) {
                        case 4:
                            kind = 'Client';
                            break;
                        case 5:
                            kind = 'Server';
                            break;
                        default:
                            kind = 'HTTP';
                    }
                    var msg = kind + ' Error: ' +
                              'The server returned a status of ' + xhr.status +
                              ' for the request "' +
                              req.method.toUpperCase() + ' ' + req.url + '"';
                    done(createError(msg, req));
                }
            }
        };

        // `onload` is only called on success and, in IE, will be called without
        // `xhr.status` having been set, so we don't check it.
        xhr.onload = function () { done(); };

        xhr.onerror = function () {
            done(createError('Internal XHR Error', req));
        };

        // IE sometimes fails if you don't specify every handler.
        // See http://social.msdn.microsoft.com/Forums/ie/en-US/30ef3add-767c-4436-b8a9-f1ca19b4812e/ie9-rtm-xdomainrequest-issued-requests-may-abort-if-all-event-handlers-not-specified?forum=iewebdevelopment
        xhr.ontimeout = function () { /* noop */ };
        xhr.onprogress = function () { /* noop */ };

        xhr.open(req.method, req.url);

        if (req.timeout) {
            // If we use the normal XHR timeout mechanism (`xhr.timeout` and
            // `xhr.ontimeout`), `onreadystatechange` will be triggered before
            // `ontimeout`. There's no way to recognize that it was triggered by
            // a timeout, and we'd be unable to dispatch the right error.
            timeoutId = setTimeout(function () {
                req.timedOut = true;
                done(createError('Request timeout', req, {name: 'Timeout'}));
                try {
                    xhr.abort();
                } catch (err) {}
            }, req.timeout);
        }

        for (k in req.headers) {
            if (req.headers.hasOwnProperty(k)) {
                xhr.setRequestHeader(k, req.headers[k]);
            }
        }

        xhr.send(req.body);

        return req;
    }

    var method,
        methods = ['get', 'post', 'put', 'head', 'patch', 'delete'],
        verb = function (method) {
            return function (req, cb) {
                req = new Request(req);
                req.method = method;
                return http(req, cb);
            };
        };
    for (i = 0; i < methods.length; i++) {
        method = methods[i];
        http[method] = verb(method);
    }

    http.plugins = function () {
        return plugins;
    };

    http.defaults = function (newValues) {
        if (newValues) {
            return factory(extend(defaults, newValues), plugins);
        }
        return defaults;
    };

    http.use = function () {
        var newPlugins = Array.prototype.slice.call(arguments, 0);
        return factory(defaults, plugins.concat(newPlugins));
    };

    http.bare = function () {
        return factory();
    };

    http.Request = Request;
    http.Response = Response;

    return http;
}

module.exports = factory({}, [cleanURL]);

},{"../plugins/cleanurl":33,"./error":25,"./request":27,"./response":28,"./utils/delay":29,"./utils/once":30,"./xhr":31,"xtend":32}],27:[function(require,module,exports){
'use strict';

function Request(optsOrUrl) {
    var opts = typeof optsOrUrl === 'string' ? {url: optsOrUrl} : optsOrUrl || {};
    this.method = opts.method ? opts.method.toUpperCase() : 'GET';
    this.url = opts.url;
    this.headers = opts.headers || {};
    this.body = opts.body;
    this.timeout = opts.timeout || 0;
    this.errorOn404 = opts.errorOn404 != null ? opts.errorOn404 : true;
    this.onload = opts.onload;
    this.onerror = opts.onerror;
}

Request.prototype.abort = function () {
    if (this.aborted) return;
    this.aborted = true;
    this.xhr.abort();
    return this;
};

Request.prototype.header = function (name, value) {
    var k;
    for (k in this.headers) {
        if (this.headers.hasOwnProperty(k)) {
            if (name.toLowerCase() === k.toLowerCase()) {
                if (arguments.length === 1) {
                    return this.headers[k];
                }

                delete this.headers[k];
                break;
            }
        }
    }
    if (value != null) {
        this.headers[name] = value;
        return value;
    }
};


module.exports = Request;

},{}],28:[function(require,module,exports){
'use strict';

var Request = require('./request');


function Response(req) {
    var i, lines, m,
        xhr = req.xhr;
    this.request = req;
    this.xhr = xhr;
    this.headers = {};

    // Browsers don't like you trying to read XHR properties when you abort the
    // request, so we don't.
    if (req.aborted || req.timedOut) return;

    this.status = xhr.status || 0;
    this.text = xhr.responseText;
    this.body = xhr.response || xhr.responseText;
    this.contentType = xhr.contentType || (xhr.getResponseHeader && xhr.getResponseHeader('Content-Type'));

    if (xhr.getAllResponseHeaders) {
        lines = xhr.getAllResponseHeaders().split('\n');
        for (i = 0; i < lines.length; i++) {
            if ((m = lines[i].match(/\s*([^\s]+):\s+([^\s]+)/))) {
                this.headers[m[1]] = m[2];
            }
        }
    }

    this.isHttpError = this.status >= 400;
}

Response.prototype.header = Request.prototype.header;


module.exports = Response;

},{"./request":27}],29:[function(require,module,exports){
'use strict';

// Wrap a function in a `setTimeout` call. This is used to guarantee async
// behavior, which can avoid unexpected errors.

module.exports = function (fn) {
    return function () {
        var
            args = Array.prototype.slice.call(arguments, 0),
            newFunc = function () {
                return fn.apply(null, args);
            };
        setTimeout(newFunc, 0);
    };
};

},{}],30:[function(require,module,exports){
'use strict';

// A "once" utility.
module.exports = function (fn) {
    var result, called = false;
    return function () {
        if (!called) {
            called = true;
            result = fn.apply(this, arguments);
        }
        return result;
    };
};

},{}],31:[function(require,module,exports){
module.exports = window.XMLHttpRequest;

},{}],32:[function(require,module,exports){
module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],33:[function(require,module,exports){
'use strict';

module.exports = {
    processRequest: function (req) {
        req.url = req.url.replace(/[^%]+/g, function (s) {
            return encodeURI(s);
        });
    }
};

},{}],34:[function(require,module,exports){
'use strict';

var jsonrequest = require('./jsonrequest'),
    jsonresponse = require('./jsonresponse');

module.exports = {
    processRequest: function (req) {
        jsonrequest.processRequest.call(this, req);
        jsonresponse.processRequest.call(this, req);
    },
    processResponse: function (res) {
        jsonresponse.processResponse.call(this, res);
    }
};

},{"./jsonrequest":35,"./jsonresponse":36}],35:[function(require,module,exports){
'use strict';

module.exports = {
    processRequest: function (req) {
        var
            contentType = req.header('Content-Type'),
            hasJsonContentType = contentType &&
                                 contentType.indexOf('application/json') !== -1;

        if (contentType != null && !hasJsonContentType) {
            return;
        }

        if (req.body) {
            if (!contentType) {
                req.header('Content-Type', 'application/json');
            }

            req.body = JSON.stringify(req.body);
        }
    }
};

},{}],36:[function(require,module,exports){
'use strict';

module.exports = {
    processRequest: function (req) {
        var accept = req.header('Accept');
        if (accept == null) {
            req.header('Accept', 'application/json');
        }
    },
    processResponse: function (res) {
        // Check to see if the contentype is "something/json" or
        // "something/somethingelse+json"
        if (res.contentType && /^.*\/(?:.*\+)?json(;|$)/i.test(res.contentType)) {
            var raw = typeof res.body === 'string' ? res.body : res.text;
            if (raw) {
                res.body = JSON.parse(raw);
            }
        }
    }
};

},{}],37:[function(require,module,exports){
module.exports=require(7)
},{"./src/api.js":38}],38:[function(require,module,exports){
module.exports=require(8)
},{}],39:[function(require,module,exports){
var http = require("httpplease");
var apijs = require("tnt.api");
var promises = require('httpplease-promises');
var Promise = require('es6-promise').Promise;
var json = require("httpplease/plugins/json");
http = http.use(json).use(promises(Promise));

tnt_eRest = function() {

    var config = {
        proxyUrl : "https://rest.ensembl.org"
    };
    // Prefixes to use the REST API.
    //var proxyUrl = "https://rest.ensembl.org";
    //var prefix_region = prefix + "/overlap/region/";
    //var prefix_ensgene = prefix + "/lookup/id/";
    //var prefix_xref = prefix + "/xrefs/symbol/";
    //var prefix_homologues = prefix + "/homology/id/";
    //var prefix_chr_info = prefix + "/info/assembly/";
    //var prefix_aln_region = prefix + "/alignment/region/";
    //var prefix_gene_tree = prefix + "/genetree/id/";
    //var prefix_assembly = prefix + "/info/assembly/";
    //var prefix_sequence = prefix + "/sequence/region/";
    //var prefix_variation = prefix + "/variation/";

    // Number of connections made to the database
    var connections = 0;

    var eRest = function() {
    };

    // Limits imposed by the ensembl REST API
    eRest.limits = {
        region : 5000000
    };

    var api = apijs (eRest);

    api.getset (config);

    /** <strong>call</strong> makes an asynchronous call to the ensembl REST service.
	@param {Object} object - A literal object containing the following fields:
	<ul>
	<li>url => The rest URL. This is returned by {@link eRest.url}</li>
	<li>success => A callback to be called when the REST query is successful (i.e. the response from the server is a defined value and no error has been returned)</li>
	<li>error => A callback to be called when the REST query returns an error
	</ul>
    */
    api.method ('call', function (myurl, data) {
	if (data) {
	    return http.post({
		"url": myurl,
		"body" : data
	    })
	}
	return http.get({
	    "url": myurl
	});
    });
    // api.method ('call', function (obj) {
    // 	var url = obj.url;
    // 	var on_success = obj.success;
    // 	var on_error   = obj.error;
    // 	connections++;
    // 	http.get({
    // 	    "url" : url
    // 	}, function (error, resp) {
    // 	    if (resp !== undefined && error == null && on_success !== undefined) {
    // 		on_success(JSON.parse(resp.body));
    // 	    }
    // 	    if (error !== null && on_error !== undefined) {
    // 		on_error(error);
    // 	    }
    // 	});
    // });


    eRest.url = {};
    var url_api = apijs (eRest.url);
	/** eRest.url.<strong>region</strong> returns the ensembl REST url to retrieve the genes included in the specified region
	    @param {object} obj - An object literal with the following fields:<br />
<ul>
<li>species : The species the region refers to</li>
<li>chr     : The chr (or seq_region name)</li>
<li>from    : The start position of the region in the chr</li>
<li>to      : The end position of the region (from < to always)</li>
</ul>
            @returns {string} - The url to query the Ensembl REST server. For an example of output of these urls see the {@link http://beta.rest.ensembl.org/feature/region/homo_sapiens/13:32889611-32973805.json?feature=gene|Ensembl REST API example}
	    @example
eRest.call ( url     : eRest.url.region ({ species : "homo_sapiens", chr : "13", from : 32889611, to : 32973805 }),
             success : callback,
             error   : callback
	   );
	 */
     url_api.method ('region', function(obj) {
         var prefix_region = "/overlap/region/";
         var features = obj.features || ["gene"];
         var feature_options = features.map (function (d) {
             return "feature=" + d;
         });
         var feature_options_url = feature_options.join("&");
         return config.proxyUrl + prefix_region +
         obj.species +
         "/" +
         obj.chr +
         ":" +
         obj.from +
         "-" + obj.to +
         //".json?feature=gene";
         ".json?" + feature_options_url;
     });

	/** eRest.url.<strong>species_gene</strong> returns the ensembl REST url to retrieve the ensembl gene associated with
	    the given name in the specified species.
	    @param {object} obj - An object literal with the following fields:<br />
<ul>
<li>species   : The species the region refers to</li>
<li>gene_name : The name of the gene</li>
</ul>
            @returns {string} - The url to query the Ensembl REST server. For an example of output of these urls see the {@link http://beta.rest.ensembl.org/xrefs/symbol/human/BRCA2.json?object_type=gene|Ensembl REST API example}
	    @example
eRest.call ( url     : eRest.url.species_gene ({ species : "human", gene_name : "BRCA2" }),
             success : callback,
             error   : callback
	   );
	 */
    url_api.method ('xref', function (obj) {
        var prefix_xref = "/xrefs/symbol/";
        return config.proxyUrl + prefix_xref +
            obj.species  +
            "/" +
            obj.name +
            ".json?object_type=gene";
    });

	/** eRest.url.<strong>homologues</strong> returns the ensembl REST url to retrieve the homologues (orthologues + paralogues) of the given ensembl ID.
	    @param {object} obj - An object literal with the following fields:<br />
<ul>
<li>id : The Ensembl ID of the gene</li>
</ul>
            @returns {string} - The url to query the Ensembl REST server. For an example of output of these urls see the {@link http://beta.rest.ensembl.org/homology/id/ENSG00000139618.json?format=condensed;sequence=none;type=all|Ensembl REST API example}
	    @example
eRest.call ( url     : eRest.url.homologues ({ id : "ENSG00000139618" }),
             success : callback,
             error   : callback
	   );
	 */
    url_api.method ('homologues', function(obj) {
        var prefix_homologues = "/homology/id/";
        return config.proxyUrl + prefix_homologues +
            obj.id +
            ".json?format=condensed;sequence=none;type=all";
    });

	/** eRest.url.<strong>gene</strong> returns the ensembl REST url to retrieve the ensembl gene associated with
	    the given ID
	    @param {object} obj - An object literal with the following fields:<br />
<ul>
<li>id : The name of the gene</li>
<li>expand : if transcripts should be included in the response (default to 0)</li>
</ul>
            @returns {string} - The url to query the Ensembl REST server. For an example of output of these urls see the {@link http://beta.rest.ensembl.org/lookup/ENSG00000139618.json?format=full|Ensembl REST API example}
	    @example
eRest.call ( url     : eRest.url.gene ({ id : "ENSG00000139618" }),
             success : callback,
             error   : callback
	   );
	 */
    url_api.method ('gene', function(obj) {
        var prefix_ensgene = "/lookup/id/";
        var url = config.proxyUrl + prefix_ensgene + obj.id + ".json?format=full";
        if (obj.expand && obj.expand === 1) {
            url = url + "&expand=1";
        }
        return url;
    });

	/** eRest.url.<strong>chr_info</strong> returns the ensembl REST url to retrieve the information associated with the chromosome (seq_region in Ensembl nomenclature).
	    @param {object} obj - An object literal with the following fields:<br />
<ul>
<li>species : The species the chr (or seq_region) belongs to
<li>chr     : The name of the chr (or seq_region)</li>
</ul>
            @returns {string} - The url to query the Ensembl REST server. For an example of output of these urls see the {@link http://beta.rest.ensembl.org/assembly/info/homo_sapiens/13.json?format=full|Ensembl REST API example}
	    @example
eRest.call ( url     : eRest.url.chr_info ({ species : "homo_sapiens", chr : "13" }),
             success : callback,
             error   : callback
	   );
	 */
    url_api.method ('chr_info', function(obj) {
        var prefix_chr_info = "/info/assembly/";
        return config.proxyUrl + prefix_chr_info +
            obj.species +
            "/" +
            obj.chr +
            ".json?format=full";
    });

	// TODO: For now, it only works with species_set and not species_set_groups
	// Should be extended for wider use
    url_api.method ('aln_block', function (obj) {
        var prefix_aln_region = "/alignment/region/";
        var url = config.proxyUrl + prefix_aln_region +
            obj.species +
            "/" +
            obj.chr +
            ":" +
            obj.from +
            "-" +
            obj.to +
            ".json?method=" +
            obj.method;

        for (var i=0; i<obj.species_set.length; i++) {
            url += "&species_set=" + obj.species_set[i];
        }

        return url;
    });

    url_api.method ('sequence', function (obj) {
        var prefix_sequence = "/sequence/region/";
        return config.proxyUrl + prefix_sequence +
            obj.species +
            '/' +
            obj.chr +
            ':' +
            obj.from +
            '..' +
            obj.to +
            '?content-type=application/json';
    });

    url_api.method ('variation', function (obj) {
	// For now, only post requests are included
        var prefix_variation = "/variation/";
        return config.proxyUrl + prefix_variation +
            obj.species;
        });

    url_api.method ('gene_tree', function (obj) {
        var prefix_gene_tree = "/genetree/id/";
        return config.proxyUrl + prefix_gene_tree +
            obj.id +
            ".json?sequence=" +
            ((obj.sequence || obj.aligned) ? 1 : "none") +
            (obj.aligned ? '&aligned=1' : '');
    });

    url_api.method('assembly', function (obj) {
        var prefix_assembly = "/info/assembly/";
        return config.proxyUrl + prefix_assembly +
            obj.species +
            ".json";
        });


    api.method ('connections', function() {
	return connections;
    });

    return eRest;
};

module.exports = exports = tnt_eRest;

},{"es6-promise":23,"httpplease":26,"httpplease-promises":24,"httpplease/plugins/json":34,"tnt.api":37}],40:[function(require,module,exports){
// if (typeof tnt === "undefined") {
//     module.exports = tnt = {}
// }
module.exports = require("./src/index.js");


},{"./src/index.js":46}],41:[function(require,module,exports){
module.exports=require(7)
},{"./src/api.js":42}],42:[function(require,module,exports){
module.exports=require(8)
},{}],43:[function(require,module,exports){
var board = require("tnt.board");
var apijs = require("tnt.api");
//var ensemblRestAPI = require("tnt.ensembl");

board.track.data.retriever.ensembl = function () {
    var success = [function () {}];
    var ignore = function () { return false; };
    //var extra = []; // extra fields to be passed to the rest api
    var eRest = board.track.data.genome.rest;
    var update_track = function (obj) {
        var data_parent = this;
        // Object has loc and a plug-in defined callback
        var loc = obj.loc;
        if (Object.keys(update_track.extra()).length) {
            var extra = update_track.extra();
            for (var item in extra) {
                if (extra.hasOwnProperty(item)) {
                    loc[item] = extra[item];
                }
            }
        }
        var plugin_cbak = obj.on_success;
        var url = eRest.url[update_track.endpoint()](loc);
        if (ignore (loc)) {
            data_parent.elements([]);
            plugin_cbak();
        } else {
            eRest.call(url)
            .then (function (resp) {
                // User defined
                for (var i=0; i<success.length; i++) {
                    var mod = success[i](resp.body);
                    if (mod) {
                        resp.body = mod;
                    }
                }
                data_parent.elements(resp.body);

                // plug-in defined
                plugin_cbak();
            });
        }
    };
    apijs (update_track)
    .getset ('endpoint')
    .getset ('extra', {})

    // TODO: We don't have a way of resetting the success array
    // TODO: Should this also be included in the sync retriever?
    // Still not sure this is the best option to support more than one callback
    update_track.success = function (cb) {
        if (!arguments.length) {
            return success;
        }
        success.push (cb);
        return update_track;
    };

    update_track.ignore = function (cb) {
        if (!arguments.length) {
            return ignore;
        }
        ignore = cb;
        return update_track;
    };

    return update_track;
};


// A predefined track for sequences
var data_sequence = function () {
    var limit = 150;
    var track_data = board.track.data();

    var updater = board.track.data.retriever.ensembl()
    .ignore (function (loc) {
        return (loc.to - loc.from) > limit;
    })
    .endpoint("sequence")
    .success (function (resp) {
        // Get the coordinates
        var fields = resp.id.split(":");
        var from = fields[3];
        var nts = [];
        for (var i=0; i<resp.seq.length; i++) {
            nts.push({
                pos: +from + i,
                sequence: resp.seq[i]
            });
        }
        return nts;
    });

    track_data.limit = function (newlim) {
        if (!arguments.length) {
            return limit;
        }
        limit = newlim;
        return this;
    };

    return track_data.update(updater);
};

// A predefined track for genes
var data_gene = function () {
    var updater = board.track.data.retriever.ensembl()
    .endpoint ("region")
    // TODO: If success is defined here, means that it can't be user-defined
    // is that good? enough? API?
    // UPDATE: Now success is backed up by an array. Still don't know if this is the best option
    .success (function (genes) {
        for (var i = 0; i < genes.length; i++) {
            if (genes[i].strand === -1) {
                genes[i].display_label = "<" + genes[i].external_name;
            } else {
                genes[i].display_label = genes[i].external_name + ">";
            }
        }
    });
    return board.track.data().update(updater);
};

var data_transcript = function () {
    var updater = board.track.data.retriever.ensembl()
    .endpoint ("region")
    .extra ({
        "features" : ["gene", "transcript", "exon", "cds"],
    })
     .success (function (elems) {
        var transcripts = {};
        var genes = {};
        for (var i=0; i<elems.length; i++) {
            var elem = elems[i];
            switch (elem.feature_type) {
                case "gene" :
                genes[elem.id] = elem;
                break;
                case "transcript" :
                var newTranscript = {
                    "id" : elem.id,
                    "label" : elem.external_name,
                    "name" : elem.strand === -1 ? ("<" + elem.external_name) : (elem.external_name + ">"),
                    "start" : elem.start,
                    "end" : elem.end,
                    "strand" : elem.strand,
                    "gene" : genes[elem.Parent],
                    "transcript" : elem,
                    "rawExons" : []
                };
                transcripts[elem.id] = newTranscript;
                break;

                case "exon" :
                var newExon = {
                    "transcript" : elem.Parent,
                    "start" : elem.start,
                    "end" : elem.end
                };
                transcripts[elem.Parent].rawExons.push(newExon)
                break;

                case "cds" :
                if (transcripts[elem.Parent].Translation === undefined) {
                    transcripts[elem.Parent].Translation = {};
                }
                var cdsStart = transcripts[elem.Parent].Translation.start;
                if ((cdsStart === undefined) || (cdsStart > elem.start)) {
                    transcripts[elem.Parent].Translation.start = elem.start;
                }

                var cdsEnd = transcripts[elem.Parent].Translation.end;
                if ((cdsEnd === undefined) || (cdsEnd < elem.end)) {
                    transcripts[elem.Parent].Translation.end = elem.end;
                }
                break;
            }
        }
        var ts = [];
        for (var id in transcripts) {
            if (transcripts.hasOwnProperty(id)) {
                var t = transcripts[id];
                var obj = exonsToExonsAndIntrons (transformExons(t), t);
                obj.name = [{
                    pos: t.start,
                    name : t.name,
                    strand : t.strand,
                    transcript : t
                }];
                obj.key = (t.id + "_" + obj.exons.length)
                obj.id = t.id;
                obj.gene = t.gene;
                obj.transcript = t.transcript;
                obj.external_name = t.label;
                obj.display_label = t.name;
                obj.start = t.start;
                obj.end = t.end;
                ts.push(obj)
            }
        }
        return ts;

    });

    function exonsToExonsAndIntrons (exons, t) {
        var obj = {};
        obj.exons = exons;
        obj.introns = [];
        for (var i=0; i<exons.length-1; i++) {
            var intron = {
                start : exons[i].transcript.strand === 1 ? exons[i].end : exons[i].start,
                end   : exons[i].transcript.strand === 1 ? exons[i+1].start : exons[i+1].end,
                transcript : t
            };
            obj.introns.push(intron);
        }
        return obj;
    }


    function transformExons (transcript) {
        var translationStart;
        var translationEnd;
        if (transcript.Translation !== undefined) {
            translationStart = transcript.Translation.start;
            translationEnd = transcript.Translation.end;
        }
        var exons = transcript.rawExons;

        var newExons = [];
        for (var i=0; i<exons.length; i++) {
            if (transcript.Translation === undefined) { // NO coding transcript
                newExons.push({
                    start   : exons[i].start,
                    end     : exons[i].end,
                    transcript : transcript,
                    coding  : false,
                    offset  : exons[i].start - transcript.start
                });
            } else {
                if (exons[i].start < translationStart) {
                    // 5'
                    if (exons[i].end < translationStart) {
                        // Completely non coding
                        newExons.push({
                            start  : exons[i].start,
                            end    : exons[i].end,
                            transcript : transcript,
                            coding : false,
                            offset  : exons[i].start - transcript.start
                        });
                    } else {
                        // Has 5'UTR
                        var ncExon5 = {
                            start  : exons[i].start,
                            end    : translationStart,
                            transcript : transcript,
                            coding : false,
                            offset  : exons[i].start - transcript.start
                        };
                        var codingExon5 = {
                            start  : translationStart,
                            end    : exons[i].end,
                            transcript : transcript,
                            coding : true,
                            offset  : exons[i].start - transcript.start
                        };
                        if (exons[i].strand === 1) {
                            newExons.push(ncExon5);
                            newExons.push(codingExon5);
                        } else {
                            newExons.push(codingExon5);
                            newExons.push(ncExon5);
                        }
                    }
                } else if (exons[i].end > translationEnd) {
                    // 3'
                    if (exons[i].start > translationEnd) {
                        // Completely non coding
                        newExons.push({
                            start   : exons[i].start,
                            end     : exons[i].end,
                            transcript : transcript,
                            coding  : false,
                            offset  : exons[i].start - transcript.start
                        });
                    } else {
                        // Has 3'UTR
                        var codingExon3 = {
                            start  : exons[i].start,
                            end    : translationEnd,
                            transcript : transcript,
                            coding : true,
                            offset  : exons[i].start - transcript.start
                        };
                        var ncExon3 = {
                            start  : translationEnd,
                            end    : exons[i].end,
                            transcript : transcript,
                            coding : false,
                            offset  : exons[i].start - transcript.start
                        };
                        if (exons[i].strand === 1) {
                            newExons.push(codingExon3);
                            newExons.push(ncExon3);
                        } else {
                            newExons.push(ncExon3);
                            newExons.push(codingExon3);
                        }
                    }
                } else {
                    // coding exon
                    newExons.push({
                        start  : exons[i].start,
                        end    : exons[i].end,
                        transcript : transcript,
                        coding : true,
                        offset  : exons[i].start - transcript.start
                    });
                }
            }
        }
        return newExons;
    }

    return board.track.data().update(updater);
};

// export
var genome_data = {
    gene : data_gene,
    sequence : data_sequence,
    transcript : data_transcript
};

module.exports = exports = genome_data;

},{"tnt.api":41,"tnt.board":9}],44:[function(require,module,exports){
var apijs = require ("tnt.api");
var layout = require("./layout.js");
var board = require("tnt.board");

var tnt_feature_transcript = function () {
    var feature = board.track.feature()
        .layout (board.track.layout.feature())
        .index (function (d) {
            return d.key;
        });

    feature.create (function (new_elems, xScale) {
        var track = this;
        var gs = new_elems
            .append("g")
            .attr("transform", function (d) {
                return "translate(" + xScale(d.start) + "," + (feature.layout().gene_slot().slot_height * d.slot) + ")";
            })
        // gene outline
        // gs
        //     .append("rect")
        //     .attr("x", 0)
        //     .attr("y", 0)
        //     .attr("width", function (d) {
        //         return (xScale(d.end) - xScale(d.start));
        //     })
        //     .attr("height", feature.layout().gene_slot().gene_height)
        //     .attr("fill", "none")
        //     .attr("stroke", track.background_color())
        //     .transition()
        //     .duration(500)
        //     .attr("stroke", feature.foreground_color())
        gs
            .append("line")
            .attr("x1", 0)
            .attr("y1", ~~(feature.layout().gene_slot().gene_height/2))
            .attr("x2", function (d) {
                return (xScale(d.end) - xScale(d.start));
            })
            .attr("y2", ~~(feature.layout().gene_slot().gene_height/2))
            .attr("fill", "none")
            .attr("stroke", track.background_color())
            .attr("stroke-width", 2)
            .transition()
            .duration(500)
            .attr("stroke", feature.foreground_color())

        // exons
        // pass the "slot" to the exons and introns
        new_elems.each (function (d) {
            if (d.exons) {
                for (var i=0; i<d.exons.length; i++) {
                    d.exons[i].slot = d.slot;
                }
            }
        });

        var exons = gs.selectAll(".exons")
            .data(function (d) {
                return d.exons || [];
            }, function (d) {
                return d.start;
            });

        exons
            .enter()
            .append("rect")
            .attr("class", "tnt_exons")
            .attr("x", function (d) {
                return (xScale(d.start + d.offset) - xScale(d.start));
            })
            .attr("y", 0)
            .attr("width", function (d) {
                return (xScale(d.end) - xScale(d.start));
            })
            .attr("height", feature.layout().gene_slot().gene_height)
            .attr("fill", track.background_color())
            .attr("stroke", track.background_color())
            .transition()
            .duration(500)
            .attr("stroke", feature.foreground_color())
            .attr("fill", function (d) {
                if (d.coding) {
                     return feature.foreground_color()(d);
                }
                if (d.coding === false) {
                    return "pink";
                }
                return feature.foreground_color()(d);
            });

        // labels
        gs
            .append("text")
            .attr("class", "tnt_name")
            .attr("x", 0)
            .attr("y", 25)
            .attr("fill", track.background_color())
            .text(function (d) {
                if (feature.layout().gene_slot().show_label) {
                    return d.display_label;
                } else {
                    return "";
                }
            })
            .style("font-weight", "normal")
            .transition()
            .duration(500)
            .attr("fill", feature.foreground_color());

    })

    feature.updater (function (transcripts, xScale) {
        var track = this;
        var gs = transcripts.select("g")
            .transition()
            .duration(200)
            .attr("transform", function (d) {
                return "translate(" + xScale(d.start) + "," + (feature.layout().gene_slot().slot_height * d.slot) + ")";
            });
        gs
            .selectAll ("rect")
            .attr("height", feature.layout().gene_slot().gene_height);
        gs
            .selectAll("line")
            .attr("x2", function (d) {
                return (xScale(d.end) - xScale(d.start));
            })
            .attr("y1", ~~(feature.layout().gene_slot().gene_height/2))
            .attr("y2", ~~(feature.layout().gene_slot().gene_height/2));
        gs
            .select ("text")
            .text (function (d) {
                if (feature.layout().gene_slot().show_label) {
                    return d.display_label;
                }
                return "";
            });
    });

    feature.mover (function (transcripts, xScale) {
        var gs = transcripts.select("g")
            .attr("transform", function (d) {
                return "translate(" + xScale(d.start) + "," + (feature.layout().gene_slot().slot_height * d.slot) + ")";
            });
        gs.selectAll("line")
            .attr("x2", function (d) {
                return (xScale(d.end) - xScale(d.start));
            })
            .attr("y1", ~~(feature.layout().gene_slot().gene_height/2))
            .attr("y2", ~~(feature.layout().gene_slot().gene_height/2))
            // .attr("width", function (d) {
            //     return (xScale(d.end) - xScale(d.start));
            // })
        gs.selectAll("rect")
            .attr("width", function (d) {
                return (xScale(d.end) - xScale(d.start));
            })
        gs.selectAll(".tnt_exons")
            .attr("x", function (d) {
                return (xScale(d.start + d.offset) - xScale(d.start));
            });

    });

    return feature;
};


var tnt_feature_sequence = function () {

    var config = {
        fontsize : 10,
        sequence : function (d) {
            return d.sequence;
        }
    };

    // 'Inherit' from tnt.track.feature
    var feature = board.track.feature()
    .index (function (d) {
        return d.pos;
    });

    var api = apijs (feature)
    .getset (config);


    feature.create (function (new_nts, xScale) {
        var track = this;

        new_nts
            .append("text")
            .attr("fill", track.background_color())
            .style('font-size', config.fontsize + "px")
            .attr("x", function (d) {
                return xScale (d.pos);
            })
            .attr("y", function (d) {
                return ~~(track.height() / 2) + 5;
            })
            .style("font-family", '"Lucida Console", Monaco, monospace')
            .text(config.sequence)
            .transition()
            .duration(500)
            .attr('fill', feature.foreground_color());
    });

    feature.mover (function (nts, xScale) {
        nts.select ("text")
            .attr("x", function (d) {
                return xScale(d.pos);
            });
        });

    return feature;
};

var tnt_feature_gene = function () {

    // 'Inherit' from tnt.track.feature
    var feature = board.track.feature()
	.layout(board.track.layout.feature())
	.index(function (d) {
	    return d.id;
	});

    feature.create(function (new_elems, xScale) {
	var track = this;
	new_elems
	    .append("rect")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("y", function (d) {
		return feature.layout().gene_slot().slot_height * d.slot;
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    })
	    .attr("height", feature.layout().gene_slot().gene_height)
	    .attr("fill", track.background_color())
	    .transition()
	    .duration(500)
	    .attr("fill", function (d) {
		if (d.color === undefined) {
		    return feature.foreground_color();
		} else {
		    return d.color;
		}
	    });

	new_elems
	    .append("text")
	    .attr("class", "tnt_name")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("y", function (d) {
		return (feature.layout().gene_slot().slot_height * d.slot) + 25;
	    })
	    .attr("fill", track.background_color())
	    .text(function (d) {
		if (feature.layout().gene_slot().show_label) {
		    return d.display_label;
		} else {
		    return "";
		}
	    })
	    .style("font-weight", "normal")
	    .transition()
	    .duration(500)
	    .attr("fill", function() {
            return feature.foreground_color();
	    });
    });

    feature.updater(function (genes) {
	var track = this;
	genes
	    .select("rect")
	    .transition()
	    .duration(500)
	    .attr("y", function (d) {
		return (feature.layout().gene_slot().slot_height * d.slot);
	    })
	    .attr("height", feature.layout().gene_slot().gene_height);

	genes
	    .select("text")
	    .transition()
	    .duration(500)
	    .attr("y", function (d) {
		return (feature.layout().gene_slot().slot_height * d.slot) + 25;
	    })
	    .text(function (d) {
                if (feature.layout().gene_slot().show_label) {
		    return d.display_label;
                } else {
		    return "";
                }
	    });
    });

    feature.mover(function (genes, xScale) {
	genes.select("rect")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    });

	genes.select("text")
	    .attr("x", function (d) {
            return xScale(d.start);
        });
    });

    return feature;
};

var genome_features = {
    gene : tnt_feature_gene,
    sequence : tnt_feature_sequence,
    transcript : tnt_feature_transcript
};
module.exports = exports = genome_features;

},{"./layout.js":47,"tnt.api":41,"tnt.board":9}],45:[function(require,module,exports){
var tnt_rest = require("tnt.ensembl");
var apijs = require("tnt.api");
var tnt_board = require("tnt.board");
tnt_board.track.data.genome = require("./data.js");
tnt_board.track.feature.genome = require("./feature");
tnt_board.track.layout.feature = require("./layout");

tnt_board_genome = function() {
    "use strict"

    // Private vars
    var ens_re = /^ENS\w+\d+$/;
    var chr_length;

    // Vars exposed in the API
    var conf = {
        gene           : undefined,
        xref_search    : function () {},
        ensgene_search : function () {},
        context        : 0,
        rest           : tnt_rest()
    };
    tnt_board.track.data.genome.rest = conf.rest;

    var gene;
    var limits = {
        left : 0,
        right : undefined,
        zoom_out : conf.rest.limits.region,
        zoom_in  : 200
    };

    // We "inherit" from board
    var genome_browser = tnt_board();

    // The location and axis track
    var location_track = tnt_board.track()
        .height(20)
        .background_color("white")
        .data(tnt_board.track.data.empty())
        .display(tnt_board.track.feature.location());

    var axis_track = tnt_board.track()
        .height(0)
        .background_color("white")
        .data(tnt_board.track.data.empty())
        .display(tnt_board.track.feature.axis());

    genome_browser
	   .add_track(location_track)
       .add_track(axis_track);

    // Default location:
    genome_browser
	   .species("human")
       .chr(7)
       .from(139424940)
       .to(141784100);

    // We save the start method of the 'parent' object
    genome_browser._start = genome_browser.start;

    // We hijack parent's start method
    var start = function (where) {
        if (where !== undefined) {
            if (where.gene !== undefined) {
                get_gene(where);
                return;
            } else {
                if (where.species === undefined) {
                    where.species = genome_browser.species();
                } else {
                    genome_browser.species(where.species);
                }
                if (where.chr === undefined) {
                    where.chr = genome_browser.chr();
                } else {
                    genome_browser.chr(where.chr);
                }
                if (where.from === undefined) {
                    where.from = genome_browser.from();
                } else {
                    genome_browser.from(where.from)
                }
                if (where.to === undefined) {
                    where.to = genome_browser.to();
                } else {
                    genome_browser.to(where.to);
                }
            }
        } else { // "where" is undef so look for gene or loc
        if (genome_browser.gene() !== undefined) {
            get_gene({ species : genome_browser.species(),
                gene    : genome_browser.gene()
            });
            return;
        } else {
            where = {};
            where.species = genome_browser.species(),
            where.chr     = genome_browser.chr(),
            where.from    = genome_browser.from(),
            where.to      = genome_browser.to()
        }
    }

    genome_browser.right (function (done) {
        // Get the chromosome length and use it as the 'right' limit
        genome_browser.zoom_in (limits.zoom_in);
        genome_browser.zoom_out (limits.zoom_out);

        var url = conf.rest.url.chr_info ({
            species : where.species,
            chr     : where.chr
        });

        conf.rest.call (url)
            .then( function (resp) {
                done(resp.body.length);
            });
        });
        genome_browser._start();
    };

    var homologues = function (ensGene, callback)  {
        var url = conf.rest.url.homologues ({id : ensGene})
        conf.rest.call(url)
            .then (function(resp) {
                var homologues = resp.body.data[0].homologies;
                if (callback !== undefined) {
                    var homologues_obj = split_homologues(homologues)
                    callback(homologues_obj);
                }
        });
    }

    var isEnsemblGene = function(term) {
        if (term.match(ens_re)) {
            return true;
        } else {
            return false;
        }
    };

    var get_gene = function (where) {
        if (isEnsemblGene(where.gene)) {
            get_ensGene(where.gene)
        } else {
            var url = conf.rest.url.xref ({
                species : where.species,
                name    : where.gene
            });
            conf.rest.call(url)
                .then (function(resp) {
                    var data = resp.body;
                    data = data.filter(function(d) {
                        return !d.id.indexOf("ENS");
                    });
                    if (data[0] !== undefined) {
                        conf.xref_search(resp);
                        get_ensGene(data[0].id)
                    } else {
                        genome_browser.start();
                    }
                });
        }
    };

    var get_ensGene = function (id) {
        var url = conf.rest.url.gene ({id : id})
        conf.rest.call(url)
            .then (function(resp) {
                var data = resp.body;
                conf.ensgene_search(data);
                var extra = ~~((data.end - data.start) * (conf.context/100));
                genome_browser
                    .species(data.species)
                    .chr(data.seq_region_name)
                    .from(data.start - extra)
                    .to(data.end + extra);

                genome_browser.start( { species : data.species,
                    chr     : data.seq_region_name,
                    from    : data.start - extra,
                    to      : data.end + extra
                } );
            });
    };

    var split_homologues = function (homologues) {
        var orthoPatt = /ortholog/;
        var paraPatt = /paralog/;

        var orthologues = homologues.filter(function(d){return d.type.match(orthoPatt)});
        var paralogues  = homologues.filter(function(d){return d.type.match(paraPatt)});

        return {
            'orthologues' : orthologues,
            'paralogues'  : paralogues
        };
    };

    var api = apijs(genome_browser)
        .getset (conf)
        .method("zoom_in", function (v) {
            if (!arguments.length) {
                return limits.zoom_in;
            }
            limits.zoom_in = v;
            return this;
        });

    api.method ({
        start      : start,
        homologues : homologues
    });

    return genome_browser;
};

module.exports = exports = tnt_board_genome;

},{"./data.js":43,"./feature":44,"./layout":47,"tnt.api":41,"tnt.board":9,"tnt.ensembl":22}],46:[function(require,module,exports){
var board = require("tnt.board");
board.genome = require("./genome");

module.exports = exports = board;

},{"./genome":45,"tnt.board":9}],47:[function(require,module,exports){
var apijs = require ("tnt.api");

// The overlap detector used for genes
var gene_layout = function() {
    // Private vars
    var max_slots;

    // vars exposed in the API:
    var height = 150;
    // var conf = {
    //     height   : 150,
    //     scale    : undefined
    // };

    var old_elements = [];

    var scale;

    var slot_types = {
        'expanded'   : {
            slot_height : 30,
            gene_height : 10,
            show_label  : true
        },
        'collapsed' : {
            slot_height : 10,
            gene_height : 7,
            show_label  : false
        }
    };
    var current_slot_type = 'expanded';

    // The returned closure / object
    var genes_layout = function (new_genes, xScale) {
        var track = this;
        scale = xScale;

        // We make sure that the genes have name
        for (var i = 0; i < new_genes.length; i++) {
            if (new_genes[i].external_name === null) {
                new_genes[i].external_name = "";
            }
        }

        max_slots = ~~(track.height() / slot_types.expanded.slot_height);

        // if (scale !== undefined) {
        //     genes_layout.scale(scale);
        // }

        slot_keeper(new_genes, old_elements);
        var needed_slots = collition_detector(new_genes);
        if (needed_slots > max_slots) {
            current_slot_type = 'collapsed';
        } else {
            current_slot_type = 'expanded';
        }

        //conf_ro.elements = new_genes;
        old_elements = new_genes;
        return new_genes;
    };

    var gene_slot = function () {
        return slot_types[current_slot_type];
    };

    var collition_detector = function (genes) {
        var genes_placed = [];
        var genes_to_place = genes;
        var needed_slots = 0;
        for (var i = 0; i < genes.length; i++) {
            if (genes[i].slot > needed_slots && genes[i].slot < max_slots) {
                needed_slots = genes[i].slot
            }
        }

        for (var i=0; i<genes_to_place.length; i++) {
            var genes_by_slot = sort_genes_by_slot(genes_placed);
            var this_gene = genes_to_place[i];
            if (this_gene.slot !== undefined && this_gene.slot < max_slots) {
                if (slot_has_space(this_gene, genes_by_slot[this_gene.slot])) {
                    genes_placed.push(this_gene);
                    continue;
                }
            }
            var slot = 0;
            OUTER: while (true) {
                if (slot_has_space(this_gene, genes_by_slot[slot])) {
                    this_gene.slot = slot;
                    genes_placed.push(this_gene);
                    if (slot > needed_slots) {
                        needed_slots = slot;
                    }
                    break;
                }
                slot++;
            }
        }
        return needed_slots + 1;
    };

    var slot_has_space = function (query_gene, genes_in_this_slot) {
        if (genes_in_this_slot === undefined) {
            return true;
        }
        for (var j = 0; j < genes_in_this_slot.length; j++) {
            var subj_gene = genes_in_this_slot[j];
            if (query_gene.id === subj_gene.id) {
                continue;
            }
            var y_label_end = subj_gene.display_label.length * 8 + scale(subj_gene.start); // TODO: It may be better to have a fixed font size (instead of the hardcoded value)?
            var y1  = scale(subj_gene.start);
            var y2  = scale(subj_gene.end) > y_label_end ? scale(subj_gene.end) : y_label_end;
            var x_label_end = query_gene.display_label.length * 8 + scale(query_gene.start);
            var x1 = scale(query_gene.start);
            var x2 = scale(query_gene.end) > x_label_end ? scale(query_gene.end) : x_label_end;
            if ( ((x1 <= y1) && (x2 >= y1)) ||
            ((x1 >= y1) && (x1 <= y2)) ) {
                return false;
            }
        }
        return true;
    };

    var slot_keeper = function (genes, prev_genes) {
        var prev_genes_slots = genes2slots(prev_genes);

        for (var i = 0; i < genes.length; i++) {
            if (prev_genes_slots[genes[i].id] !== undefined) {
                genes[i].slot = prev_genes_slots[genes[i].id];
            }
        }
    };

    var genes2slots = function (genes_array) {
        var hash = {};
        for (var i = 0; i < genes_array.length; i++) {
            var gene = genes_array[i];
            hash[gene.id] = gene.slot;
        }
        return hash;
    }

    var sort_genes_by_slot = function (genes) {
        var slots = [];
        for (var i = 0; i < genes.length; i++) {
            if (slots[genes[i].slot] === undefined) {
                slots[genes[i].slot] = [];
            }
            slots[genes[i].slot].push(genes[i]);
        }
        return slots;
    };

    // API
    var api = apijs (genes_layout)
//    .getset (conf)
//    .get (conf_ro)
        .getset ("elements", function () {})
        .method ({
            gene_slot : gene_slot
        });

    return genes_layout;
};

module.exports = exports = gene_layout;

},{"tnt.api":41}],48:[function(require,module,exports){
module.exports = require("./src/newick.js");

},{"./src/newick.js":49}],49:[function(require,module,exports){
/**
 * Newick and nhx formats parser in JavaScript.
 *
 * Copyright (c) Jason Davies 2010 and Miguel Pignatelli
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Example tree (from http://en.wikipedia.org/wiki/Newick_format):
 *
 * +--0.1--A
 * F-----0.2-----B            +-------0.3----C
 * +------------------0.5-----E
 *                            +---------0.4------D
 *
 * Newick format:
 * (A:0.1,B:0.2,(C:0.3,D:0.4)E:0.5)F;
 *
 * Converted to JSON:
 * {
 *   name: "F",
 *   branchset: [
 *     {name: "A", length: 0.1},
 *     {name: "B", length: 0.2},
 *     {
 *       name: "E",
 *       length: 0.5,
 *       branchset: [
 *         {name: "C", length: 0.3},
 *         {name: "D", length: 0.4}
 *       ]
 *     }
 *   ]
 * }
 *
 * Converted to JSON, but with no names or lengths:
 * {
 *   branchset: [
 *     {}, {}, {
 *       branchset: [{}, {}]
 *     }
 *   ]
 * }
 */

module.exports = {
    parse_newick : function(s) {
	var ancestors = [];
	var tree = {};
	var tokens = s.split(/\s*(;|\(|\)|,|:)\s*/);
	var subtree;
	for (var i=0; i<tokens.length; i++) {
	    var token = tokens[i];
	    switch (token) {
            case '(': // new branchset
		subtree = {};
		tree.children = [subtree];
		ancestors.push(tree);
		tree = subtree;
		break;
            case ',': // another branch
		subtree = {};
		ancestors[ancestors.length-1].children.push(subtree);
		tree = subtree;
		break;
            case ')': // optional name next
		tree = ancestors.pop();
		break;
            case ':': // optional length next
		break;
            default:
		var x = tokens[i-1];
		if (x == ')' || x == '(' || x == ',') {
		    tree.name = token;
		} else if (x == ':') {
		    tree.branch_length = parseFloat(token);
		}
	    }
	}
	return tree;
    },

    parse_nhx : function (s) {
	var ancestors = [];
	var tree = {};
	var subtree;

	var tokens = s.split( /\s*(;|\(|\)|\[|\]|,|:|=)\s*/ );
	for (var i=0; i<tokens.length; i++) {
	    var token = tokens[i];
	    switch (token) {
            case '(': // new children
		subtree = {};
		tree.children = [subtree];
		ancestors.push(tree);
		tree = subtree;
		break;
            case ',': // another branch
		subtree = {};
		ancestors[ancestors.length-1].children.push(subtree);
		tree = subtree;
		break;
            case ')': // optional name next
		tree = ancestors.pop();
		break;
            case ':': // optional length next
		break;
            default:
		var x = tokens[i-1];
		if (x == ')' || x == '(' || x == ',') {
		    tree.name = token;
		}
		else if (x == ':') {
		    var test_type = typeof token;
		    if(!isNaN(token)){
			tree.branch_length = parseFloat(token);
		    }
		}
		else if (x == '='){
		    var x2 = tokens[i-2];
		    switch(x2){
		    case 'D':
			tree.duplication = token;
			break;
		    case 'G':
			tree.gene_id = token;
			break;
		    case 'T':
			tree.taxon_id = token;
			break;
		    default :
			tree[tokens[i-2]] = token;
		    }
		}
		else {
		    var test;

		}
	    }
	}
	return tree;
    }
};

},{}],50:[function(require,module,exports){
module.exports = tooltip = require("./src/tooltip.js");

},{"./src/tooltip.js":53}],51:[function(require,module,exports){
module.exports=require(7)
},{"./src/api.js":52}],52:[function(require,module,exports){
module.exports=require(8)
},{}],53:[function(require,module,exports){
var apijs = require("tnt.api");

var tooltip = function () {
    "use strict";

    var drag = d3.behavior.drag();
    var tooltip_div;

    var conf = {
	position : "right",
	allow_drag : true,
	show_closer : true,
	fill : function () { throw "fill is not defined in the base object"; },
	width : 180,
	id : 1
    };

    var t = function (data, event) {
	drag
	    .origin(function(){
		return {x:parseInt(d3.select(this).style("left")),
			y:parseInt(d3.select(this).style("top"))
		       };
	    })
	    .on("drag", function() {
		if (conf.allow_drag) {
		    d3.select(this)
			.style("left", d3.event.x + "px")
			.style("top", d3.event.y + "px");
		}
	    });

	// TODO: Why do we need the div element?
	// It looks like if we anchor the tooltip in the "body"
	// The tooltip is not located in the right place (appears at the bottom)
	// See clients/tooltips_test.html for an example
	var containerElem = selectAncestor (this, "div");
	if (containerElem === undefined) {
	    // We require a div element at some point to anchor the tooltip
	    return;
	}

	tooltip_div = d3.select(containerElem)
	    .append("div")
	    .attr("class", "tnt_tooltip")
	    .classed("tnt_tooltip_active", true)  // TODO: Is this needed/used???
	    .call(drag);

	// prev tooltips with the same header
	d3.select("#tnt_tooltip_" + conf.id).remove();

	if ((d3.event === null) && (event)) {
	    d3.event = event;
	}
	var d3mouse = d3.mouse(containerElem);
	d3.event = null;

	var offset = 0;
	if (conf.position === "left") {
	    offset = conf.width;
	}

	tooltip_div.attr("id", "tnt_tooltip_" + conf.id);

	// We place the tooltip
	tooltip_div
	    .style("left", (d3mouse[0]) + "px")
	    .style("top", (d3mouse[1]) + "px");

	// Close
    if (conf.show_closer) {
        tooltip_div
            .append("div")
            .attr("class", "tnt_tooltip_closer")
            .on ("click", function () {
                t.close();
            })
    }

	conf.fill.call(tooltip_div, data);

	// return this here?
	return t;
    };

    // gets the first ancestor of elem having tagname "type"
    // example : var mydiv = selectAncestor(myelem, "div");
    function selectAncestor (elem, type) {
	type = type.toLowerCase();
	if (elem.parentNode === null) {
	    console.log("No more parents");
	    return undefined;
	}
	var tagName = elem.parentNode.tagName;

	if ((tagName !== undefined) && (tagName.toLowerCase() === type)) {
	    return elem.parentNode;
	} else {
	    return selectAncestor (elem.parentNode, type);
	}
    }

    var api = apijs(t)
	.getset(conf);
    api.check('position', function (val) {
	return (val === 'left') || (val === 'right');
    }, "Only 'left' or 'right' values are allowed for position");

    api.method('close', function () {
        if (tooltip_div) {
            tooltip_div.remove();
        }
    });

    return t;
};

tooltip.list = function () {
    // list tooltip is based on general tooltips
    var t = tooltip();
    var width = 180;

    t.fill (function (obj) {
	var tooltip_div = this;
	var obj_info_list = tooltip_div
	    .append("table")
	    .attr("class", "tnt_zmenu")
	    .attr("border", "solid")
	    .style("width", t.width() + "px");

	// Tooltip header
    if (obj.header) {
        obj_info_list
	       .append("tr")
	       .attr("class", "tnt_zmenu_header")
           .append("th")
           .text(obj.header);
    }

	// Tooltip rows
	var table_rows = obj_info_list.selectAll(".tnt_zmenu_row")
	    .data(obj.rows)
	    .enter()
	    .append("tr")
	    .attr("class", "tnt_zmenu_row");

	table_rows
	    .append("td")
	    .style("text-align", "center")
	    .html(function(d,i) {
		return obj.rows[i].value;
	    })
	    .each(function (d) {
		if (d.link === undefined) {
		    return;
		}
		d3.select(this)
		    .classed("link", 1)
		    .on('click', function (d) {
			d.link(d.obj);
			t.close.call(this);
		    });
	    });
    });
    return t;
};

tooltip.table = function () {
    // table tooltips are based on general tooltips
    var t = tooltip();

    var width = 180;

    t.fill (function (obj) {
	var tooltip_div = this;

	var obj_info_table = tooltip_div
	    .append("table")
	    .attr("class", "tnt_zmenu")
	    .attr("border", "solid")
	    .style("width", t.width() + "px");

	// Tooltip header
    if (obj.header) {
        obj_info_table
            .append("tr")
            .attr("class", "tnt_zmenu_header")
            .append("th")
            .attr("colspan", 2)
            .text(obj.header);
    }

	// Tooltip rows
	var table_rows = obj_info_table.selectAll(".tnt_zmenu_row")
	    .data(obj.rows)
	    .enter()
	    .append("tr")
	    .attr("class", "tnt_zmenu_row");

	table_rows
	    .append("th")
	    .attr("colspan", function (d, i) {
		if (d.value === "") {
		    return 2;
		}
		return 1;
	    })
	    .attr("class", function (d) {
		if (d.value === "") {
		    return "tnt_zmenu_inner_header";
		}
		return "tnt_zmenu_cell";
	    })
	    .html(function(d,i) {
		return obj.rows[i].label;
	    });

	table_rows
	    .append("td")
	    .html(function(d,i) {
		if (typeof obj.rows[i].value === 'function') {
		    obj.rows[i].value.call(this, d);
		} else {
		    return obj.rows[i].value;
		}
	    })
	    .each(function (d) {
		if (d.value === "") {
		    d3.select(this).remove();
		}
	    })
	    .each(function (d) {
		if (d.link === undefined) {
		    return;
		}
		d3.select(this)
		    .classed("link", 1)
		    .on('click', function (d) {
			d.link(d.obj);
			t.close.call(this);
		    });
	    });
    });

    return t;
};

tooltip.plain = function () {
    // plain tooltips are based on general tooltips
    var t = tooltip();

    t.fill (function (obj) {
	var tooltip_div = this;

	var obj_info_table = tooltip_div
	    .append("table")
	    .attr("class", "tnt_zmenu")
	    .attr("border", "solid")
	    .style("width", t.width() + "px");

    if (obj.header) {
        obj_info_table
            .append("tr")
            .attr("class", "tnt_zmenu_header")
            .append("th")
            .text(obj.header);
    }

    if (obj.body) {
        obj_info_table
            .append("tr")
            .attr("class", "tnt_zmenu_row")
            .append("td")
            .style("text-align", "center")
            .html(obj.body);
    }
    });

    return t;
};

module.exports = exports = tooltip;

},{"tnt.api":51}],54:[function(require,module,exports){
var node = require("./src/node.js");
module.exports = exports = node;

},{"./src/node.js":61}],55:[function(require,module,exports){
module.exports=require(7)
},{"./src/api.js":56}],56:[function(require,module,exports){
module.exports=require(8)
},{}],57:[function(require,module,exports){
module.exports=require(12)
},{"./src/index.js":58}],58:[function(require,module,exports){
module.exports=require(13)
},{"./reduce.js":59,"./utils.js":60}],59:[function(require,module,exports){
module.exports=require(14)
},{}],60:[function(require,module,exports){
module.exports=require(15)
},{}],61:[function(require,module,exports){
var apijs = require("tnt.api");
var iterator = require("tnt.utils").iterator;

var tnt_node = function (data) {
//tnt.tree.node = function (data) {
    "use strict";

    var node = function () {
    };

    var api = apijs (node);

    // API
//     node.nodes = function() {
// 	if (cluster === undefined) {
// 	    cluster = d3.layout.cluster()
// 	    // TODO: length and children should be exposed in the API
// 	    // i.e. the user should be able to change this defaults via the API
// 	    // children is the defaults for parse_newick, but maybe we should change that
// 	    // or at least not assume this is always the case for the data provided
// 		.value(function(d) {return d.length})
// 		.children(function(d) {return d.children});
// 	}
// 	nodes = cluster.nodes(data);
// 	return nodes;
//     };

    var apply_to_data = function (data, cbak) {
	cbak(data);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		apply_to_data(data.children[i], cbak);
	    }
	}
    };

    var create_ids = function () {
	var i = iterator(1);
	// We can't use apply because apply creates new trees on every node
	// We should use the direct data instead
	apply_to_data (data, function (d) {
	    if (d._id === undefined) {
		d._id = i();
		// TODO: Not sure _inSubTree is strictly necessary
		// d._inSubTree = {prev:true, curr:true};
	    }
	});
    };

    var link_parents = function (data) {
	if (data === undefined) {
	    return;
	}
	if (data.children === undefined) {
	    return;
	}
	for (var i=0; i<data.children.length; i++) {
	    // _parent?
	    data.children[i]._parent = data;
	    link_parents(data.children[i]);
	}
    };

    var compute_root_dists = function (data) {
	apply_to_data (data, function (d) {
	    var l;
	    if (d._parent === undefined) {
		d._root_dist = 0;
	    } else {
		var l = 0;
		if (d.branch_length) {
		    l = d.branch_length
		}
		d._root_dist = l + d._parent._root_dist;
	    }
	});
    };

    // TODO: data can't be rewritten used the api yet. We need finalizers
    node.data = function(new_data) {
	if (!arguments.length) {
	    return data
	}
	data = new_data;
	create_ids();
	link_parents(data);
	compute_root_dists(data);
	return node;
    };
    // We bind the data that has been passed
    node.data(data);

    api.method ('find_all', function (cbak, deep) {
	var nodes = [];
	node.apply (function (n) {
	    if (cbak(n)) {
		nodes.push (n);
	    }
	});
	return nodes;
    });
    
    api.method ('find_node', function (cbak, deep) {
	if (cbak(node)) {
	    return node;
	}

	if (data.children !== undefined) {
	    for (var j=0; j<data.children.length; j++) {
		var found = tnt_node(data.children[j]).find_node(cbak, deep);
		if (found) {
		    return found;
		}
	    }
	}

	if (deep && (data._children !== undefined)) {
	    for (var i=0; i<data._children.length; i++) {
		tnt_node(data._children[i]).find_node(cbak, deep)
		var found = tnt_node(data._children[i]).find_node(cbak, deep);
		if (found) {
		    return found;
		}
	    }
	}
    });

    api.method ('find_node_by_name', function(name, deep) {
	return node.find_node (function (node) {
	    return node.node_name() === name
	}, deep);
    });

    api.method ('toggle', function() {
	if (data) {
	    if (data.children) { // Uncollapsed -> collapse
		var hidden = 0;
		node.apply (function (n) {
		    var hidden_here = n.n_hidden() || 0;
		    hidden += (n.n_hidden() || 0) + 1;
		});
		node.n_hidden (hidden-1);
		data._children = data.children;
		data.children = undefined;
	    } else {             // Collapsed -> uncollapse
		node.n_hidden(0);
		data.children = data._children;
		data._children = undefined;
	    }
	}
	return this;
    });

    api.method ('is_collapsed', function () {
	return (data._children !== undefined && data.children === undefined);
    });

    var has_ancestor = function(n, ancestor) {
	// It is better to work at the data level
	n = n.data();
	ancestor = ancestor.data();
	if (n._parent === undefined) {
	    return false
	}
	n = n._parent
	for (;;) {
	    if (n === undefined) {
		return false;
	    }
	    if (n === ancestor) {
		return true;
	    }
	    n = n._parent;
	}
    };

    // This is the easiest way to calculate the LCA I can think of. But it is very inefficient too.
    // It is working fine by now, but in case it needs to be more performant we can implement the LCA
    // algorithm explained here:
    // http://community.topcoder.com/tc?module=Static&d1=tutorials&d2=lowestCommonAncestor
    api.method ('lca', function (nodes) {
	if (nodes.length === 1) {
	    return nodes[0];
	}
	var lca_node = nodes[0];
	for (var i = 1; i<nodes.length; i++) {
	    lca_node = _lca(lca_node, nodes[i]);
	}
	return lca_node;
	// return tnt_node(lca_node);
    });

    var _lca = function(node1, node2) {
	if (node1.data() === node2.data()) {
	    return node1;
	}
	if (has_ancestor(node1, node2)) {
	    return node2;
	}
	return _lca(node1, node2.parent());
    };

    api.method('n_hidden', function (val) {
	if (!arguments.length) {
	    return node.property('_hidden');
	}
	node.property('_hidden', val);
	return node
    });

    api.method ('get_all_nodes', function (deep) {
	var nodes = [];
	node.apply(function (n) {
	    nodes.push(n);
	}, deep);
	return nodes;
    });

    api.method ('get_all_leaves', function (deep) {
	var leaves = [];
	node.apply(function (n) {
	    if (n.is_leaf(deep)) {
		leaves.push(n);
	    }
	}, deep);
	return leaves;
    });

    api.method ('upstream', function(cbak) {
	cbak(node);
	var parent = node.parent();
	if (parent !== undefined) {
	    parent.upstream(cbak);
	}
//	tnt_node(parent).upstream(cbak);
// 	node.upstream(node._parent, cbak);
    });

    api.method ('subtree', function(nodes, keep_singletons) {
	if (keep_singletons === undefined) {
	    keep_singletons = false;
	}
    	var node_counts = {};
    	for (var i=0; i<nodes.length; i++) {
	    var n = nodes[i];
	    if (n !== undefined) {
		n.upstream (function (this_node){
		    var id = this_node.id();
		    if (node_counts[id] === undefined) {
			node_counts[id] = 0;
		    }
		    node_counts[id]++
    		});
	    }
    	}
    
	var is_singleton = function (node_data) {
	    var n_children = 0;
	    if (node_data.children === undefined) {
		return false;
	    }
	    for (var i=0; i<node_data.children.length; i++) {
		var id = node_data.children[i]._id;
		if (node_counts[id] > 0) {
		    n_children++;
		}
	    }
	    return n_children === 1;
	};

	var subtree = {};
	copy_data (data, subtree, 0, function (node_data) {
	    var node_id = node_data._id;
	    var counts = node_counts[node_id];
	    
	    // Is in path
	    if (counts > 0) {
		if (is_singleton(node_data) && !keep_singletons) {
		    return false; 
		}
		return true;
	    }
	    // Is not in path
	    return false;
	});

	return tnt_node(subtree.children[0]);
    });

    var copy_data = function (orig_data, subtree, currBranchLength, condition) {
        if (orig_data === undefined) {
	    return;
        }

        if (condition(orig_data)) {
	    var copy = copy_node(orig_data, currBranchLength);
	    if (subtree.children === undefined) {
                subtree.children = [];
	    }
	    subtree.children.push(copy);
	    if (orig_data.children === undefined) {
                return;
	    }
	    for (var i = 0; i < orig_data.children.length; i++) {
                copy_data (orig_data.children[i], copy, 0, condition);
	    }
        } else {
	    if (orig_data.children === undefined) {
                return;
	    }
	    currBranchLength += orig_data.branch_length || 0;
	    for (var i = 0; i < orig_data.children.length; i++) {
                copy_data(orig_data.children[i], subtree, currBranchLength, condition);
	    }
        }
    };

    var copy_node = function (node_data, extraBranchLength) {
	var copy = {};
	// copy all the own properties excepts links to other nodes or depth
	for (var param in node_data) {
	    if ((param === "children") ||
		(param === "_children") ||
		(param === "_parent") ||
		(param === "depth")) {
		continue;
	    }
	    if (node_data.hasOwnProperty(param)) {
		copy[param] = node_data[param];
	    }
	}
	if ((copy.branch_length !== undefined) && (extraBranchLength !== undefined)) {
	    copy.branch_length += extraBranchLength;
	}
	return copy;
    };

    
    // TODO: This method visits all the nodes
    // a more performant version should return true
    // the first time cbak(node) is true
    api.method ('present', function (cbak) {
	// cbak should return true/false
	var is_true = false;
	node.apply (function (n) {
	    if (cbak(n) === true) {
		is_true = true;
	    }
	});
	return is_true;
    });

    // cbak is called with two nodes
    // and should return a negative number, 0 or a positive number
    api.method ('sort', function (cbak) {
	if (data.children === undefined) {
	    return;
	}

	var new_children = [];
	for (var i=0; i<data.children.length; i++) {
	    new_children.push(tnt_node(data.children[i]));
	}

	new_children.sort(cbak);

	data.children = [];
	for (var i=0; i<new_children.length; i++) {
	    data.children.push(new_children[i].data());
	}

	for (var i=0; i<data.children.length; i++) {
	    tnt_node(data.children[i]).sort(cbak);
	}
    });

    api.method ('flatten', function (preserve_internal) {
	if (node.is_leaf()) {
	    return node;
	}
	var data = node.data();
	var newroot = copy_node(data);
	var nodes;
	if (preserve_internal) {
	    nodes = node.get_all_nodes();
	    nodes.shift(); // the self node is also included
	} else {
	    nodes = node.get_all_leaves();
	}
	newroot.children = [];
	for (var i=0; i<nodes.length; i++) {
	    delete (nodes[i].children);
	    newroot.children.push(copy_node(nodes[i].data()));
	}

	return tnt_node(newroot);
    });

    
    // TODO: This method only 'apply's to non collapsed nodes (ie ._children is not visited)
    // Would it be better to have an extra flag (true/false) to visit also collapsed nodes?
    api.method ('apply', function(cbak, deep) {
	if (deep === undefined) {
	    deep = false;
	}
	cbak(node);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		var n = tnt_node(data.children[i])
		n.apply(cbak, deep);
	    }
	}

	if ((data._children !== undefined) && deep) {
	    for (var j=0; j<data._children.length; j++) {
		var n = tnt_node(data._children[j]);
		n.apply(cbak, deep);
	    }
	}
    });

    // TODO: Not sure if it makes sense to set via a callback:
    // root.property (function (node, val) {
    //    node.deeper.field = val
    // }, 'new_value')
    api.method ('property', function(prop, value) {
	if (arguments.length === 1) {
	    if ((typeof prop) === 'function') {
		return prop(data)	
	    }
	    return data[prop]
	}
	if ((typeof prop) === 'function') {
	    prop(data, value);   
	}
	data[prop] = value;
	return node;
    });

    api.method ('is_leaf', function(deep) {
	if (deep) {
	    return ((data.children === undefined) && (data._children === undefined));
	}
	return data.children === undefined;
    });

    // It looks like the cluster can't be used for anything useful here
    // It is now included as an optional parameter to the tnt.tree() method call
    // so I'm commenting the getter
    // node.cluster = function() {
    // 	return cluster;
    // };

    // node.depth = function (node) {
    //     return node.depth;
    // };

//     node.name = function (node) {
//         return node.name;
//     };

    api.method ('id', function () {
	return node.property('_id');
    });

    api.method ('node_name', function () {
	return node.property('name');
    });

    api.method ('branch_length', function () {
	return node.property('branch_length');
    });

    api.method ('root_dist', function () {
	return node.property('_root_dist');
    });

    api.method ('children', function (deep) {
	var children = [];

	if (data.children) {
	    for (var i=0; i<data.children.length; i++) {
		children.push(tnt_node(data.children[i]));
	    }
	}
	if ((data._children) && deep) {
	    for (var j=0; j<data._children.length; j++) {
		children.push(tnt_node(data._children[j]));
	    }
	}
	if (children.length === 0) {
	    return undefined;
	}
	return children;
    });

    api.method ('parent', function () {
	if (data._parent === undefined) {
	    return undefined;
	}
	return tnt_node(data._parent);
    });

    return node;

};

module.exports = exports = tnt_node;


},{"tnt.api":55,"tnt.utils":57}],62:[function(require,module,exports){
// if (typeof tnt === "undefined") {
//     module.exports = tnt = {}
// }
module.exports = tree = require("./src/index.js");
var eventsystem = require("biojs-events");
eventsystem.mixin(tree);
//tnt.utils = require("tnt.utils");
//tnt.tooltip = require("tnt.tooltip");
//tnt.tree = require("./src/index.js");


},{"./src/index.js":72,"biojs-events":3}],63:[function(require,module,exports){
module.exports=require(7)
},{"./src/api.js":64}],64:[function(require,module,exports){
module.exports=require(8)
},{}],65:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"./src/node.js":70}],66:[function(require,module,exports){
module.exports=require(12)
},{"./src/index.js":67}],67:[function(require,module,exports){
module.exports=require(13)
},{"./reduce.js":68,"./utils.js":69}],68:[function(require,module,exports){
module.exports=require(14)
},{}],69:[function(require,module,exports){
module.exports=require(15)
},{}],70:[function(require,module,exports){
var apijs = require("tnt.api");
var iterator = require("tnt.utils").iterator;

var tnt_node = function (data) {
//tnt.tree.node = function (data) {
    "use strict";

    var node = function () {
    };

    var api = apijs (node);

    // API
//     node.nodes = function() {
// 	if (cluster === undefined) {
// 	    cluster = d3.layout.cluster()
// 	    // TODO: length and children should be exposed in the API
// 	    // i.e. the user should be able to change this defaults via the API
// 	    // children is the defaults for parse_newick, but maybe we should change that
// 	    // or at least not assume this is always the case for the data provided
// 		.value(function(d) {return d.length})
// 		.children(function(d) {return d.children});
// 	}
// 	nodes = cluster.nodes(data);
// 	return nodes;
//     };

    var apply_to_data = function (data, cbak) {
	cbak(data);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		apply_to_data(data.children[i], cbak);
	    }
	}
    };

    var create_ids = function () {
	var i = iterator(1);
	// We can't use apply because apply creates new trees on every node
	// We should use the direct data instead
	apply_to_data (data, function (d) {
	    if (d._id === undefined) {
		d._id = i();
		// TODO: Not sure _inSubTree is strictly necessary
		// d._inSubTree = {prev:true, curr:true};
	    }
	});
    };

    var link_parents = function (data) {
	if (data === undefined) {
	    return;
	}
	if (data.children === undefined) {
	    return;
	}
	for (var i=0; i<data.children.length; i++) {
	    // _parent?
	    data.children[i]._parent = data;
	    link_parents(data.children[i]);
	}
    };

    var compute_root_dists = function (data) {
	apply_to_data (data, function (d) {
	    var l;
	    if (d._parent === undefined) {
		d._root_dist = 0;
	    } else {
		var l = 0;
		if (d.branch_length) {
		    l = d.branch_length
		}
		d._root_dist = l + d._parent._root_dist;
	    }
	});
    };

    // TODO: data can't be rewritten used the api yet. We need finalizers
    node.data = function(new_data) {
	if (!arguments.length) {
	    return data
	}
	data = new_data;
	create_ids();
	link_parents(data);
	compute_root_dists(data);
	return node;
    };
    // We bind the data that has been passed
    node.data(data);

    api.method ('find_all', function (cbak, deep) {
	var nodes = [];
	node.apply (function (n) {
	    if (cbak(n)) {
		nodes.push (n);
	    }
	});
	return nodes;
    });
    
    api.method ('find_node', function (cbak, deep) {
	if (cbak(node)) {
	    return node;
	}

	if (data.children !== undefined) {
	    for (var j=0; j<data.children.length; j++) {
		var found = tnt_node(data.children[j]).find_node(cbak, deep);
		if (found) {
		    return found;
		}
	    }
	}

	if (deep && (data._children !== undefined)) {
	    for (var i=0; i<data._children.length; i++) {
		tnt_node(data._children[i]).find_node(cbak, deep)
		var found = tnt_node(data._children[i]).find_node(cbak, deep);
		if (found) {
		    return found;
		}
	    }
	}
    });

    api.method ('find_node_by_name', function(name, deep) {
	return node.find_node (function (node) {
	    return node.node_name() === name
	}, deep);
    });

    api.method ('toggle', function() {
	if (data) {
	    if (data.children) { // Uncollapsed -> collapse
		var hidden = 0;
		node.apply (function (n) {
		    var hidden_here = n.n_hidden() || 0;
		    hidden += (n.n_hidden() || 0) + 1;
		});
		node.n_hidden (hidden-1);
		data._children = data.children;
		data.children = undefined;
	    } else {             // Collapsed -> uncollapse
		node.n_hidden(0);
		data.children = data._children;
		data._children = undefined;
	    }
	}
	return this;
    });

    api.method ('is_collapsed', function () {
	return (data._children !== undefined && data.children === undefined);
    });

    var has_ancestor = function(n, ancestor) {
	// It is better to work at the data level
	n = n.data();
	ancestor = ancestor.data();
	if (n._parent === undefined) {
	    return false
	}
	n = n._parent
	for (;;) {
	    if (n === undefined) {
		return false;
	    }
	    if (n === ancestor) {
		return true;
	    }
	    n = n._parent;
	}
    };

    // This is the easiest way to calculate the LCA I can think of. But it is very inefficient too.
    // It is working fine by now, but in case it needs to be more performant we can implement the LCA
    // algorithm explained here:
    // http://community.topcoder.com/tc?module=Static&d1=tutorials&d2=lowestCommonAncestor
    api.method ('lca', function (nodes) {
	if (nodes.length === 1) {
	    return nodes[0];
	}
	var lca_node = nodes[0];
	for (var i = 1; i<nodes.length; i++) {
	    lca_node = _lca(lca_node, nodes[i]);
	}
	return lca_node;
	// return tnt_node(lca_node);
    });

    var _lca = function(node1, node2) {
	if (node1.data() === node2.data()) {
	    return node1;
	}
	if (has_ancestor(node1, node2)) {
	    return node2;
	}
	return _lca(node1, node2.parent());
    };

    api.method('n_hidden', function (val) {
	if (!arguments.length) {
	    return node.property('_hidden');
	}
	node.property('_hidden', val);
	return node
    });

    api.method ('get_all_nodes', function (deep) {
	var nodes = [];
	node.apply(function (n) {
	    nodes.push(n);
	}, deep);
	return nodes;
    });

    api.method ('get_all_leaves', function (deep) {
	var leaves = [];
	node.apply(function (n) {
	    if (n.is_leaf(deep)) {
		leaves.push(n);
	    }
	}, deep);
	return leaves;
    });

    api.method ('upstream', function(cbak) {
	cbak(node);
	var parent = node.parent();
	if (parent !== undefined) {
	    parent.upstream(cbak);
	}
//	tnt_node(parent).upstream(cbak);
// 	node.upstream(node._parent, cbak);
    });

    api.method ('subtree', function(nodes, keep_singletons) {
	if (keep_singletons === undefined) {
	    keep_singletons = false;
	}
    	var node_counts = {};
    	for (var i=0; i<nodes.length; i++) {
	    var n = nodes[i];
	    if (n !== undefined) {
		n.upstream (function (this_node){
		    var id = this_node.id();
		    if (node_counts[id] === undefined) {
			node_counts[id] = 0;
		    }
		    node_counts[id]++
    		});
	    }
    	}
    
	var is_singleton = function (node_data) {
	    var n_children = 0;
	    if (node_data.children === undefined) {
		return false;
	    }
	    for (var i=0; i<node_data.children.length; i++) {
		var id = node_data.children[i]._id;
		if (node_counts[id] > 0) {
		    n_children++;
		}
	    }
	    return n_children === 1;
	};

	var subtree = {};
	copy_data (data, subtree, 0, function (node_data) {
	    var node_id = node_data._id;
	    var counts = node_counts[node_id];
	    
	    // Is in path
	    if (counts > 0) {
		if (is_singleton(node_data) && !keep_singletons) {
		    return false; 
		}
		return true;
	    }
	    // Is not in path
	    return false;
	});

	return tnt_node(subtree.children[0]);
    });

    var copy_data = function (orig_data, subtree, currBranchLength, condition) {
        if (orig_data === undefined) {
	    return;
        }

        if (condition(orig_data)) {
	    var copy = copy_node(orig_data, currBranchLength);
	    if (subtree.children === undefined) {
                subtree.children = [];
	    }
	    subtree.children.push(copy);
	    if (orig_data.children === undefined) {
                return;
	    }
	    for (var i = 0; i < orig_data.children.length; i++) {
                copy_data (orig_data.children[i], copy, 0, condition);
	    }
        } else {
	    if (orig_data.children === undefined) {
                return;
	    }
	    currBranchLength += orig_data.branch_length || 0;
	    for (var i = 0; i < orig_data.children.length; i++) {
                copy_data(orig_data.children[i], subtree, currBranchLength, condition);
	    }
        }
    };

    var copy_node = function (node_data, extraBranchLength) {
	var copy = {};
	// copy all the own properties excepts links to other nodes or depth
	for (var param in node_data) {
	    if ((param === "children") ||
		(param === "_children") ||
		(param === "_parent") ||
		(param === "depth")) {
		continue;
	    }
	    if (node_data.hasOwnProperty(param)) {
		copy[param] = node_data[param];
	    }
	}
	if ((copy.branch_length !== undefined) && (extraBranchLength !== undefined)) {
	    copy.branch_length += extraBranchLength;
	}
	return copy;
    };

    
    // TODO: This method visits all the nodes
    // a more performant version should return true
    // the first time cbak(node) is true
    api.method ('present', function (cbak) {
	// cbak should return true/false
	var is_true = false;
	node.apply (function (n) {
	    if (cbak(n) === true) {
		is_true = true;
	    }
	});
	return is_true;
    });

    // cbak is called with two nodes
    // and should return a negative number, 0 or a positive number
    api.method ('sort', function (cbak) {
	if (data.children === undefined) {
	    return;
	}

	var new_children = [];
	for (var i=0; i<data.children.length; i++) {
	    new_children.push(tnt_node(data.children[i]));
	}

	new_children.sort(cbak);

	data.children = [];
	for (var i=0; i<new_children.length; i++) {
	    data.children.push(new_children[i].data());
	}

	for (var i=0; i<data.children.length; i++) {
	    tnt_node(data.children[i]).sort(cbak);
	}
    });

    api.method ('flatten', function () {
	if (node.is_leaf()) {
	    return node;
	}
	var data = node.data();
	var newroot = copy_node(data);
	var leaves = node.get_all_leaves();
	newroot.children = [];
	for (var i=0; i<leaves.length; i++) {
	    newroot.children.push(copy_node(leaves[i].data()));
	}

	return tnt_node(newroot);
    });

    
    // TODO: This method only 'apply's to non collapsed nodes (ie ._children is not visited)
    // Would it be better to have an extra flag (true/false) to visit also collapsed nodes?
    api.method ('apply', function(cbak, deep) {
	if (deep === undefined) {
	    deep = false;
	}
	cbak(node);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		var n = tnt_node(data.children[i])
		n.apply(cbak, deep);
	    }
	}

	if ((data._children !== undefined) && deep) {
	    for (var j=0; j<data._children.length; j++) {
		var n = tnt_node(data._children[j]);
		n.apply(cbak, deep);
	    }
	}
    });

    // TODO: Not sure if it makes sense to set via a callback:
    // root.property (function (node, val) {
    //    node.deeper.field = val
    // }, 'new_value')
    api.method ('property', function(prop, value) {
	if (arguments.length === 1) {
	    if ((typeof prop) === 'function') {
		return prop(data)	
	    }
	    return data[prop]
	}
	if ((typeof prop) === 'function') {
	    prop(data, value);   
	}
	data[prop] = value;
	return node;
    });

    api.method ('is_leaf', function(deep) {
	if (deep) {
	    return ((data.children === undefined) && (data._children === undefined));
	}
	return data.children === undefined;
    });

    // It looks like the cluster can't be used for anything useful here
    // It is now included as an optional parameter to the tnt.tree() method call
    // so I'm commenting the getter
    // node.cluster = function() {
    // 	return cluster;
    // };

    // node.depth = function (node) {
    //     return node.depth;
    // };

//     node.name = function (node) {
//         return node.name;
//     };

    api.method ('id', function () {
	return node.property('_id');
    });

    api.method ('node_name', function () {
	return node.property('name');
    });

    api.method ('branch_length', function () {
	return node.property('branch_length');
    });

    api.method ('root_dist', function () {
	return node.property('_root_dist');
    });

    api.method ('children', function (deep) {
	var children = [];

	if (data.children) {
	    for (var i=0; i<data.children.length; i++) {
		children.push(tnt_node(data.children[i]));
	    }
	}
	if ((data._children) && deep) {
	    for (var j=0; j<data._children.length; j++) {
		children.push(tnt_node(data._children[j]));
	    }
	}
	if (children.length === 0) {
	    return undefined;
	}
	return children;
    });

    api.method ('parent', function () {
	if (data._parent === undefined) {
	    return undefined;
	}
	return tnt_node(data._parent);
    });

    return node;

};

module.exports = exports = tnt_node;


},{"tnt.api":63,"tnt.utils":66}],71:[function(require,module,exports){
var apijs = require('tnt.api');
var tree = {};

tree.diagonal = function () {
    var d = function (diagonalPath) {
	var source = diagonalPath.source;
        var target = diagonalPath.target;
        var midpointX = (source.x + target.x) / 2;
        var midpointY = (source.y + target.y) / 2;
        var pathData = [source, {x: target.x, y: source.y}, target];
	pathData = pathData.map(d.projection());
	return d.path()(pathData, radial_calc.call(this,pathData))
    };

    var api = apijs (d)
	.getset ('projection')
	.getset ('path')
    
    var coordinateToAngle = function (coord, radius) {
      	var wholeAngle = 2 * Math.PI,
        quarterAngle = wholeAngle / 4
	
      	var coordQuad = coord[0] >= 0 ? (coord[1] >= 0 ? 1 : 2) : (coord[1] >= 0 ? 4 : 3),
        coordBaseAngle = Math.abs(Math.asin(coord[1] / radius))
	
      	// Since this is just based on the angle of the right triangle formed
      	// by the coordinate and the origin, each quad will have different 
      	// offsets
      	var coordAngle;
      	switch (coordQuad) {
      	case 1:
      	    coordAngle = quarterAngle - coordBaseAngle
      	    break
      	case 2:
      	    coordAngle = quarterAngle + coordBaseAngle
      	    break
      	case 3:
      	    coordAngle = 2*quarterAngle + quarterAngle - coordBaseAngle
      	    break
      	case 4:
      	    coordAngle = 3*quarterAngle + coordBaseAngle
      	}
      	return coordAngle
    };

    var radial_calc = function (pathData) {
	var src = pathData[0];
	var mid = pathData[1];
	var dst = pathData[2];
	var radius = Math.sqrt(src[0]*src[0] + src[1]*src[1]);
	var srcAngle = coordinateToAngle(src, radius);
	var midAngle = coordinateToAngle(mid, radius);
	var clockwise = Math.abs(midAngle - srcAngle) > Math.PI ? midAngle <= srcAngle : midAngle > srcAngle;
	return {
	    radius   : radius,
	    clockwise : clockwise
	};
    };

    return d;
};

// vertical diagonal for rect branches
tree.diagonal.vertical = function () {
    var path = function(pathData, obj) {
	var src = pathData[0];
	var mid = pathData[1];
	var dst = pathData[2];
	var radius = 200000; // Number long enough

	return "M" + src + " A" + [radius,radius] + " 0 0,0 " + mid + "M" + mid + "L" + dst; 
	
    };

    var projection = function(d) { 
	return [d.y, d.x];
    }

    return tree.diagonal()
      	.path(path)
      	.projection(projection);
};

tree.diagonal.radial = function () {
    var path = function(pathData, obj) {
      	var src = pathData[0];
      	var mid = pathData[1];
      	var dst = pathData[2];
	var radius = obj.radius;
	var clockwise = obj.clockwise;

	if (clockwise) {
	    return "M" + src + " A" + [radius,radius] + " 0 0,0 " + mid + "M" + mid + "L" + dst; 
	} else {
	    return "M" + mid + " A" + [radius,radius] + " 0 0,0 " + src + "M" + mid + "L" + dst;
	}

    };

    var projection = function(d) {
      	var r = d.y, a = (d.x - 90) / 180 * Math.PI;
      	return [r * Math.cos(a), r * Math.sin(a)];
    };

    return tree.diagonal()
      	.path(path)
      	.projection(projection)
};

module.exports = exports = tree.diagonal;

},{"tnt.api":63}],72:[function(require,module,exports){
var tree = require ("./tree.js");
tree.label = require("./label.js");
tree.diagonal = require("./diagonal.js");
tree.layout = require("./layout.js");
tree.node_display = require("./node_display.js");
// tree.node = require("tnt.tree.node");
// tree.parse_newick = require("tnt.newick").parse_newick;
// tree.parse_nhx = require("tnt.newick").parse_nhx;

module.exports = exports = tree;


},{"./diagonal.js":71,"./label.js":73,"./layout.js":74,"./node_display.js":75,"./tree.js":76}],73:[function(require,module,exports){
var apijs = require("tnt.api");
var tree = {};

tree.label = function () {
    "use strict";

    var dispatch = d3.dispatch ("click", "dblclick", "mouseover", "mouseout")

    // TODO: Not sure if we should be removing by default prev labels
    // or it would be better to have a separate remove method called by the vis
    // on update
    // We also have the problem that we may be transitioning from
    // text to img labels and we need to remove the label of a different type
    var label = function (node, layout_type, node_size) {
        if (typeof (node) !== 'function') {
            throw(node);
        }

        label.display().call(this, node, layout_type)
            .attr("class", "tnt_tree_label")
            .attr("transform", function (d) {
                var t = label.transform()(node, layout_type);
                return "translate (" + (t.translate[0] + node_size) + " " + t.translate[1] + ")rotate(" + t.rotate + ")";
            })
        // TODO: this click event is probably never fired since there is an onclick event in the node g element?
            .on("click", function () {
                dispatch.click.call(this, node)
            })
            .on("dblclick", function () {
                dispatch.dblclick.call(this, node)
            })
            .on("mouseover", function () {
                dispatch.mouseover.call(this, node)
            })
            .on("mouseout", function () {
                dispatch.mouseout.call(this, node)
            })
    };

    var api = apijs (label)
        .getset ('width', function () { throw "Need a width callback" })
        .getset ('height', function () { throw "Need a height callback" })
        .getset ('display', function () { throw "Need a display callback" })
        .getset ('transform', function () { throw "Need a transform callback" })
        //.getset ('on_click');

    return d3.rebind (label, dispatch, "on");
};

// Text based labels
tree.label.text = function () {
    var label = tree.label();

    var api = apijs (label)
        .getset ('fontsize', 10)
        .getset ('fontweight', "normal")
        .getset ('color', "#000")
        .getset ('text', function (d) {
            return d.data().name;
        })

    label.display (function (node, layout_type) {
        var l = d3.select(this)
            .append("text")
            .attr("text-anchor", function (d) {
                if (layout_type === "radial") {
                    return (d.x%360 < 180) ? "start" : "end";
                }
                return "start";
            })
            .text(function(){
                return label.text()(node)
            })
            .style('font-size', function () {
                return d3.functor(label.fontsize())(node) + "px";
            })
            .style('font-weight', function () {
                return d3.functor(label.fontweight())(node);
            })
            .style('fill', d3.functor(label.color())(node));

        return l;
    });

    label.transform (function (node, layout_type) {
        var d = node.data();
        var t = {
            translate : [5, 5],
            rotate : 0
        };
        if (layout_type === "radial") {
            t.translate[1] = t.translate[1] - (d.x%360 < 180 ? 0 : label.fontsize())
            t.rotate = (d.x%360 < 180 ? 0 : 180)
        }
        return t;
    });


    // label.transform (function (node) {
    // 	var d = node.data();
    // 	return "translate(10 5)rotate(" + (d.x%360 < 180 ? 0 : 180) + ")";
    // });

    label.width (function (node) {
        var svg = d3.select("body")
            .append("svg")
            .attr("height", 0)
            .style('visibility', 'hidden');

        var text = svg
            .append("text")
            .style('font-size', d3.functor(label.fontsize())(node) + "px")
            .text(label.text()(node));

        var width = text.node().getBBox().width;
        svg.remove();

        return width;
    });

    label.height (function (node) {
        return d3.functor(label.fontsize())(node);
    });

    return label;
};

// Image based labels
tree.label.img = function () {
    var label = tree.label();

    var api = apijs (label)
        .getset ('src', function () {})

    label.display (function (node, layout_type) {
        if (label.src()(node)) {
            var l = d3.select(this)
                .append("image")
                .attr("width", label.width()())
                .attr("height", label.height()())
                .attr("xlink:href", label.src()(node));
            return l;
        }
        // fallback text in case the img is not found?
        return d3.select(this)
            .append("text")
            .text("");
    });

    label.transform (function (node, layout_type) {
        var d = node.data();
        var t = {
            translate : [10, (-label.height()() / 2)],
            rotate : 0
        };

        if (layout_type === 'radial') {
            t.translate[0] = t.translate[0] + (d.x%360 < 180 ? 0 : label.width()()),
            t.translate[1] = t.translate[1] + (d.x%360 < 180 ? 0 : label.height()()),
            t.rotate = (d.x%360 < 180 ? 0 : 180)
        }

        return t;
    });

    return label;
};

// Labels made of 2+ simple labels
tree.label.composite = function () {
    var labels = [];

    var label = function (node, layout_type, node_size) {
        var curr_xoffset = 0;

        for (var i=0; i<labels.length; i++) {
            var display = labels[i];

            (function (offset) {
                display.transform (function (node, layout_type) {
                    var tsuper = display._super_.transform()(node, layout_type);
                    var t = {
                        translate : [offset + tsuper.translate[0], tsuper.translate[1]],
                        rotate : tsuper.rotate
                    };
                    return t;
                })
            })(curr_xoffset);

	    console.warn (i + " => " + curr_xoffset);
            curr_xoffset += 10;
            curr_xoffset += display.width()(node);

            display.call(this, node, layout_type, node_size);
        }
    };

    var api = apijs (label)

    api.method ('add_label', function (display, node) {
        display._super_ = {};
        apijs (display._super_)
            .get ('transform', display.transform());

        labels.push(display);
        return label;
    });

    api.method ('width', function () {
        return function (node) {
            var tot_width = 0;
            for (var i=0; i<labels.length; i++) {
                tot_width += parseInt(labels[i].width()(node));
                tot_width += parseInt(labels[i]._super_.transform()(node).translate[0]);
            }

            return tot_width;
        }
    });

    api.method ('height', function () {
        return function (node) {
            var max_height = 0;
            for (var i=0; i<labels.length; i++) {
                var curr_height = labels[i].height()(node);
                if ( curr_height > max_height) {
                    max_height = curr_height;
                }
            }
            return max_height;
        }
    });

    return label;
};

module.exports = exports = tree.label;

},{"tnt.api":63}],74:[function(require,module,exports){
// Based on the code by Ken-ichi Ueda in http://bl.ocks.org/kueda/1036776#d3.phylogram.js

var apijs = require("tnt.api");
var diagonal = require("./diagonal.js");
var tree = {};

tree.layout = function () {

    var l = function () {
    };

    var cluster = d3.layout.cluster()
	.sort(null)
	.value(function (d) {return d.length} )
	.separation(function () {return 1});
    
    var api = apijs (l)
	.getset ('scale', true)
	.getset ('max_leaf_label_width', 0)
	.method ("cluster", cluster)
	.method('yscale', function () {throw "yscale is not defined in the base object"})
	.method('adjust_cluster_size', function () {throw "adjust_cluster_size is not defined in the base object" })
	.method('width', function () {throw "width is not defined in the base object"})
	.method('height', function () {throw "height is not defined in the base object"});

    api.method('scale_branch_lengths', function (curr) {
	if (l.scale() === false) {
	    return
	}

	var nodes = curr.nodes;
	var tree = curr.tree;

	var root_dists = nodes.map (function (d) {
	    return d._root_dist;
	});

	var yscale = l.yscale(root_dists);
	tree.apply (function (node) {
	    node.property("y", yscale(node.root_dist()));
	});
    });

    return l;
};

tree.layout.vertical = function () {
    var layout = tree.layout();
    // Elements like 'labels' depend on the layout type. This exposes a way of identifying the layout type
    layout.type = "vertical";

    var api = apijs (layout)
	.getset ('width', 360)
	.get ('translate_vis', [20,20])
	.method ('diagonal', diagonal.vertical)
	.method ('transform_node', function (d) {
    	    return "translate(" + d.y + "," + d.x + ")";
	});

    api.method('height', function (params) {
    	return (params.n_leaves * params.label_height);
    }); 

    api.method('yscale', function (dists) {
    	return d3.scale.linear()
    	    .domain([0, d3.max(dists)])
    	    .range([0, layout.width() - 20 - layout.max_leaf_label_width()]);
    });

    api.method('adjust_cluster_size', function (params) {
    	var h = layout.height(params);
    	var w = layout.width() - layout.max_leaf_label_width() - layout.translate_vis()[0] - params.label_padding;
    	layout.cluster.size ([h,w]);
    	return layout;
    });

    return layout;
};

tree.layout.radial = function () {
    var layout = tree.layout();
    // Elements like 'labels' depend on the layout type. This exposes a way of identifying the layout type
    layout.type = 'radial';

    var default_width = 360;
    var r = default_width / 2;

    var conf = {
    	width : 360
    };

    var api = apijs (layout)
	.getset (conf)
	.getset ('translate_vis', [r, r]) // TODO: 1.3 should be replaced by a sensible value
	.method ('transform_node', function (d) {
	    return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
	})
	.method ('diagonal', diagonal.radial)
	.method ('height', function () { return conf.width });

    // Changes in width affect changes in r
    layout.width.transform (function (val) {
    	r = val / 2;
    	layout.cluster.size([360, r])
    	layout.translate_vis([r, r]);
    	return val;
    });

    api.method ("yscale",  function (dists) {
	return d3.scale.linear()
	    .domain([0,d3.max(dists)])
	    .range([0, r]);
    });

    api.method ("adjust_cluster_size", function (params) {
	r = (layout.width()/2) - layout.max_leaf_label_width() - 20;
	layout.cluster.size([360, r]);
	return layout;
    });

    return layout;
};

module.exports = exports = tree.layout;

},{"./diagonal.js":71,"tnt.api":63}],75:[function(require,module,exports){
var apijs = require("tnt.api");
var tree = {};

tree.node_display = function () {
    "use strict";

    var n = function (node) {
	n.display().call(this, node)
    };

    var api = apijs (n)
	.getset("size", 4.5)
	.getset("fill", "black")
	.getset("stroke", "black")
	.getset("stroke_width", "1px")
	.getset("display", function () {throw "display is not defined in the base object"});

    return n;
};

tree.node_display.circle = function () {
    var n = tree.node_display();

    n.display (function (node) {
	d3.select(this)
	    .append("circle")
	    .attr("r", function (d) {
		return d3.functor(n.size())(node);
	    })
	    .attr("fill", function (d) {
		return d3.functor(n.fill())(node);
	    })
	    .attr("stroke", function (d) {
		return d3.functor(n.stroke())(node);
	    })
	    .attr("stroke-width", function (d) {
		return d3.functor(n.stroke_width())(node);
	    })
    });

    return n;
};

tree.node_display.square = function () {
    var n = tree.node_display();

    n.display (function (node) {
	var s = d3.functor(n.size())(node);
	d3.select(this)
	    .append("rect")
	    .attr("x", function (d) {
		return -s
	    })
	    .attr("y", function (d) {
		return -s;
	    })
	    .attr("width", function (d) {
		return s*2;
	    })
	    .attr("height", function (d) {
		return s*2;
	    })
	    .attr("fill", function (d) {
		return d3.functor(n.fill())(node);
	    })
	    .attr("stroke", function (d) {
		return d3.functor(n.stroke())(node);
	    })
	    .attr("stroke-width", function (d) {
		return d3.functor(n.stroke_width())(node);
	    })
    });

    return n;
};

tree.node_display.triangle = function () {
    var n = tree.node_display();

    n.display (function (node) {
	var s = d3.functor(n.size())(node);
	d3.select(this)
	    .append("polygon")
	    .attr("points", (-s) + ",0 " + s + "," + (-s) + " " + s + "," + s)
	    .attr("fill", function (d) {
		return d3.functor(n.fill())(node);
	    })
	    .attr("stroke", function (d) {
		return d3.functor(n.stroke())(node);
	    })
	    .attr("stroke-width", function (d) {
		return d3.functor(n.stroke_width())(node);
	    })
    });

    return n;
};

// tree.node_display.cond = function () {
//     var n = tree.node_display();

//     // conditions are objects with
//     // name : a name for this display
//     // callback: the condition to apply (receives a tnt.node)
//     // display: a node_display
//     var conds = [];

//     n.display (function (node) {
// 	var s = d3.functor(n.size())(node);
// 	for (var i=0; i<conds.length; i++) {
// 	    var cond = conds[i];
// 	    // For each node, the first condition met is used
// 	    if (cond.callback.call(this, node) === true) {
// 		cond.display.call(this, node)
// 		break;
// 	    }
// 	}
//     })

//     var api = apijs(n);

//     api.method("add", function (name, cbak, node_display) {
// 	conds.push({ name : name,
// 		     callback : cbak,
// 		     display : node_display
// 		   });
// 	return n;
//     });

//     api.method("reset", function () {
// 	conds = [];
// 	return n;
//     });

//     api.method("update", function (name, cbak, new_display) {
// 	for (var i=0; i<conds.length; i++) {
// 	    if (conds[i].name === name) {
// 		conds[i].callback = cbak;
// 		conds[i].display = new_display;
// 	    }
// 	}
// 	return n;
//     });

//     return n;

// };

module.exports = exports = tree.node_display;

},{"tnt.api":63}],76:[function(require,module,exports){
var apijs = require("tnt.api");
var tnt_tree_node = require("tnt.tree.node");

var tree = function () {
    "use strict";

    var dispatch = d3.dispatch ("click", "dblclick", "mouseover", "mouseout");

    var conf = {
        duration         : 500,      // Duration of the transitions
        node_display     : tree.node_display.circle(),
        label            : tree.label.text(),
        layout           : tree.layout.vertical(),
        // on_click         : function () {},
        // on_dbl_click     : function () {},
        // on_mouseover     : function () {},
        branch_color     : 'black',
        id               : function (d) {
            return d._id;
        }
    };

    // Keep track of the focused node
    // TODO: Would it be better to have multiple focused nodes? (ie use an array)
    var focused_node;

    // Extra delay in the transitions (TODO: Needed?)
    var delay = 0;

    // Ease of the transitions
    var ease = "cubic-in-out";

    // By node data
    var sp_counts = {};

    var scale = false;

    // The id of the tree container
    var div_id;

    // The tree visualization (svg)
    var svg;
    var vis;
    var links_g;
    var nodes_g;

    // TODO: For now, counts are given only for leaves
    // but it may be good to allow counts for internal nodes
    var counts = {};

    // The full tree
    var base = {
        tree : undefined,
        data : undefined,
        nodes : undefined,
        links : undefined
    };

    // The curr tree. Needed to re-compute the links / nodes positions of subtrees
    var curr = {
        tree : undefined,
        data : undefined,
        nodes : undefined,
        links : undefined
    };

    // The cbak returned
    var t = function (div) {
	div_id = d3.select(div).attr("id");

    var tree_div = d3.select(div)
        .append("div")
        .style("width", (conf.layout.width() +  "px"))
        .attr("class", "tnt_groupDiv");

	var cluster = conf.layout.cluster;

	var n_leaves = curr.tree.get_all_leaves().length;

	var max_leaf_label_length = function (tree) {
	    var max = 0;
	    var leaves = tree.get_all_leaves();
	    for (var i=0; i<leaves.length; i++) {
            var label_width = conf.label.width()(leaves[i]) + d3.functor (conf.node_display.size())(leaves[i]);
            if (label_width > max) {
                max = label_width;
            }
	    }
	    return max;
	};

    var max_leaf_node_height = function (tree) {
        var max = 0;
        var leaves = tree.get_all_leaves();
        for (var i=0; i<leaves.length; i++) {
            var node_height = d3.functor(conf.node_display.size())(leaves[i]) * 2;
            var label_height = d3.functor(conf.label.height())(leaves[i]);

            max = d3.max([max, node_height, label_height]);
        }
        return max;
    };

	var max_label_length = max_leaf_label_length(curr.tree);
	conf.layout.max_leaf_label_width(max_label_length);

	var max_node_height = max_leaf_node_height(curr.tree);

	// Cluster size is the result of...
	// total width of the vis - transform for the tree - max_leaf_label_width - horizontal transform of the label
	// TODO: Substitute 15 by the horizontal transform of the nodes
	var cluster_size_params = {
	    n_leaves : n_leaves,
	    label_height : max_node_height,
	    label_padding : 15
	};

	conf.layout.adjust_cluster_size(cluster_size_params);

	var diagonal = conf.layout.diagonal();
	var transform = conf.layout.transform_node;

	svg = tree_div
	    .append("svg")
	    .attr("width", conf.layout.width())
	    .attr("height", conf.layout.height(cluster_size_params) + 30)
	    .attr("fill", "none");

	vis = svg
	    .append("g")
	    .attr("id", "tnt_st_" + div_id)
	    .attr("transform",
		  "translate(" +
		  conf.layout.translate_vis()[0] +
		  "," +
		  conf.layout.translate_vis()[1] +
		  ")");

	curr.nodes = cluster.nodes(curr.data);
	conf.layout.scale_branch_lengths(curr);
	curr.links = cluster.links(curr.nodes);

	// LINKS
	// All the links are grouped in a g element
	links_g = vis
	    .append("g")
	    .attr("class", "links");
	nodes_g = vis
	    .append("g")
	    .attr("class", "nodes");

	//var link = vis
	var link = links_g
	    .selectAll("path.tnt_tree_link")
	    .data(curr.links, function(d){
            return conf.id(d.target);
        });

	link
	    .enter()
	    .append("path")
	    .attr("class", "tnt_tree_link")
	    .attr("id", function(d) {
	    	return "tnt_tree_link_" + div_id + "_" + conf.id(d.target);
	    })
	    .style("stroke", function (d) {
            return d3.functor(conf.branch_color)(tnt_tree_node(d.source), tnt_tree_node(d.target));
	    })
	    .attr("d", diagonal);

	// NODES
	//var node = vis
	var node = nodes_g
	    .selectAll("g.tnt_tree_node")
	    .data(curr.nodes, function(d) {
            return conf.id(d)
        });

	var new_node = node
	    .enter().append("g")
	    .attr("class", function(n) {
		if (n.children) {
		    if (n.depth == 0) {
			return "root tnt_tree_node"
		    } else {
			return "inner tnt_tree_node"
		    }
		} else {
		    return "leaf tnt_tree_node"
		}
	    })
	    .attr("id", function(d) {
		return "tnt_tree_node_" + div_id + "_" + d._id
	    })
	    .attr("transform", transform);

	// display node shape
	new_node
	    .each (function (d) {
		conf.node_display.call(this, tnt_tree_node(d))
	    });

	// display node label
	new_node
	    .each (function (d) {
	    	conf.label.call(this, tnt_tree_node(d), conf.layout.type, d3.functor(conf.node_display.size())(tnt_tree_node(d)));
	    });

    new_node.on("click", function (node) {
        var my_node = tnt_tree_node(node);
        tree.trigger("node:click", my_node);
        dispatch.click.call(this, my_node);
    });
    new_node.on("dblclick", function (node) {
        var my_node = tnt_tree_node(node);
        tree.trigger("node:dblclick", my_node);
        dispatch.dblclick.call(this, my_node);
    });
    new_node.on("mouseover", function (node) {
        var my_node = tnt_tree_node(node);
        tree.trigger("node:hover", tnt_tree_node(node));
        dispatch.mouseover.call(this, my_node);
    });
    new_node.on("mouseout", function (node) {
        var my_node = tnt_tree_node(node);
        tree.trigger("node:mouseout", tnt_tree_node(node));
        dispatch.mouseout.call(this, my_node);
    });

	// new_node.on("click", function (node) {
	//     conf.on_click.call(this, tnt_tree_node(node));
    //
	//     tree.trigger("node:click", tnt_tree_node(node));
	// });
    //
	// new_node.on("mouseenter", function (node) {
	//     conf.on_mouseover.call(this, tnt_tree_node(node));
    //
	//     tree.trigger("node:hover", tnt_tree_node(node));
	// });
    //
	// new_node.on("dblclick", function (node) {
	//     conf.on_dbl_click.call(this, tnt_tree_node(node));
    //
	//     tree.trigger("node:dblclick", tnt_tree_node(node));
	// });


	// Update plots an updated tree
	api.method ('update', function() {
	    tree_div
		.style("width", (conf.layout.width() + "px"));
	    svg.attr("width", conf.layout.width());

	    var cluster = conf.layout.cluster;
	    var diagonal = conf.layout.diagonal();
	    var transform = conf.layout.transform_node;

	    var max_label_length = max_leaf_label_length(curr.tree);
	    conf.layout.max_leaf_label_width(max_label_length);

	    var max_node_height = max_leaf_node_height(curr.tree);

	    // Cluster size is the result of...
	    // total width of the vis - transform for the tree - max_leaf_label_width - horizontal transform of the label
	// TODO: Substitute 15 by the transform of the nodes (probably by selecting one node assuming all the nodes have the same transform
	    var n_leaves = curr.tree.get_all_leaves().length;
	    var cluster_size_params = {
		n_leaves : n_leaves,
		label_height : max_node_height,
		label_padding : 15
	    };
	    conf.layout.adjust_cluster_size(cluster_size_params);

	    svg
		.transition()
		.duration(conf.duration)
		.ease(ease)
		.attr("height", conf.layout.height(cluster_size_params) + 30); // height is in the layout

	    vis
		.transition()
		.duration(conf.duration)
		.attr("transform",
		      "translate(" +
		      conf.layout.translate_vis()[0] +
		      "," +
		      conf.layout.translate_vis()[1] +
		      ")");

	    curr.nodes = cluster.nodes(curr.data);
	    conf.layout.scale_branch_lengths(curr);
	    curr.links = cluster.links(curr.nodes);

	    // LINKS
	    var link = links_g
		.selectAll("path.tnt_tree_link")
		.data(curr.links, function(d){
            return conf.id(d.target)
        });

            // NODES
	    var node = nodes_g
		.selectAll("g.tnt_tree_node")
		.data(curr.nodes, function(d) {return conf.id(d)});

	    var exit_link = link
		.exit()
		.remove();

	    link
		.enter()
		.append("path")
		.attr("class", "tnt_tree_link")
		.attr("id", function (d) {
		    return "tnt_tree_link_" + div_id + "_" + conf.id(d.target);
		})
		.attr("stroke", function (d) {
		    return d3.functor(conf.branch_color)(tnt_tree_node(d.source), tnt_tree_node(d.target));
		})
		.attr("d", diagonal);

	    link
	    	.transition()
		.ease(ease)
	    	.duration(conf.duration)
	    	.attr("d", diagonal);


	    // Nodes
	    var new_node = node
		.enter()
		.append("g")
		.attr("class", function(n) {
		    if (n.children) {
			if (n.depth == 0) {
			    return "root tnt_tree_node"
			} else {
			    return "inner tnt_tree_node"
			}
		    } else {
			return "leaf tnt_tree_node"
		    }
		})
		.attr("id", function (d) {
		    return "tnt_tree_node_" + div_id + "_" + d._id;
		})
		.attr("transform", transform);

	    // Exiting nodes are just removed
	    node
		.exit()
		.remove();

        new_node.on("click", function (node) {
            var my_node = tnt_tree_node(node);
            tree.trigger("node:click", my_node);
            dispatch.click.call(this, my_node);
        });
        new_node.on("dblclick", function (node) {
            var my_node = tnt_tree_node(node);
            tree.trigger("node:dblclick", my_node);
            dispatch.dblclick.call(this, my_node);
        });
        new_node.on("mouseover", function (node) {
            var my_node = tnt_tree_node(node);
            tree.trigger("node:hover", tnt_tree_node(node));
            dispatch.mouseover.call(this, my_node);
        });
        new_node.on("mouseout", function (node) {
            var my_node = tnt_tree_node(node);
            tree.trigger("node:mouseout", tnt_tree_node(node));
            dispatch.mouseout.call(this, my_node);
        });

	    // new_node.on("click", function (node) {
		// conf.on_click.call(this, tnt_tree_node(node));
        //
		// tree.trigger("node:click", tnt_tree_node(node));
	    // });
        //
	    // new_node.on("mouseenter", function (node) {
		// conf.on_mouseover.call(this, tnt_tree_node(node));
        //
		// tree.trigger("node:hover", tnt_tree_node(node));
	    // });
        //
	    // new_node.on("dblclick", function (node) {
		// conf.on_dbl_click.call(this, tnt_tree_node(node));
        //
		// tree.trigger("node:dblclick", tnt_tree_node(node));
	    // });


	    // We need to re-create all the nodes again in case they have changed lively (or the layout)
	    node.selectAll("*").remove();
	    node
		    .each(function (d) {
			conf.node_display.call(this, tnt_tree_node(d))
		    });

	    // We need to re-create all the labels again in case they have changed lively (or the layout)
	    node
		    .each (function (d) {
			conf.label.call(this, tnt_tree_node(d), conf.layout.type, d3.functor(conf.node_display.size())(tnt_tree_node(d)));
		    });

	    node
		.transition()
		.ease(ease)
		.duration(conf.duration)
		.attr("transform", transform);

	});
    };

    // API
    var api = apijs (t)
	.getset (conf)

    // TODO: Rewrite data using getset / finalizers & transforms
    api.method ('data', function (d) {
	if (!arguments.length) {
	    return base.data;
	}

	// The original data is stored as the base and curr data
	base.data = d;
	curr.data = d;

	// Set up a new tree based on the data
	var newtree = tnt_tree_node(base.data);

	t.root(newtree);

	tree.trigger("data:hasChanged", base.data);

	return this;
    });

    // TODO: Rewrite tree using getset / finalizers & transforms
    api.method ('root', function (myTree) {
    	if (!arguments.length) {
    	    return curr.tree;
    	}

	// The original tree is stored as the base, prev and curr tree
    	base.tree = myTree;
	curr.tree = base.tree;
//	prev.tree = base.tree;
    	return this;
    });

    api.method ('subtree', function (curr_nodes, keepSingletons) {
	var subtree = base.tree.subtree(curr_nodes, keepSingletons);
	curr.data = subtree.data();
	curr.tree = subtree;

	return this;
    });

    api.method ('focus_node', function (node, keepSingletons) {
	// find
	var found_node = t.root().find_node(function (n) {
	    return node.id() === n.id();
	});
	focused_node = found_node;
	t.subtree(found_node.get_all_leaves(), keepSingletons);

	return this;
    });

    api.method ('has_focus', function (node) {
	return ((focused_node !== undefined) && (focused_node.id() === node.id()));
    });

    api.method ('release_focus', function () {
	t.data (base.data);
	focused_node = undefined;
	return this;
    });

    return d3.rebind (t, dispatch, "on");
};

module.exports = exports = tree;

},{"tnt.api":63,"tnt.tree.node":65}],77:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"./src/index.js":78}],78:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"./reduce.js":79,"./utils.js":80}],79:[function(require,module,exports){
module.exports=require(14)
},{}],80:[function(require,module,exports){

module.exports = {
    iterator : function(init_val) {
	var i = init_val || 0;
	var iter = function () {
	    return i++;
	};
	return iter;
    },

    script_path : function (script_name) { // script_name is the filename
	var script_scaped = script_name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	var script_re = new RegExp(script_scaped + '$');
	var script_re_sub = new RegExp('(.*)' + script_scaped + '$');

	// TODO: This requires phantom.js or a similar headless webkit to work (document)
	var scripts = document.getElementsByTagName('script');
	var path = "";  // Default to current path
	if(scripts !== undefined) {
            for(var i in scripts) {
		if(scripts[i].src && scripts[i].src.match(script_re)) {
                    return scripts[i].src.replace(script_re_sub, '$1');
		}
            }
	}
	return path;
    },

    defer_cancel : function (cbak, time) {
	var tick;

	var defer_cancel = function () {
	    var args = Array.prototype.slice.call(arguments);
	    var that = this;
	    clearTimeout(tick);
	    tick = setTimeout (function () {
		cbak.apply (that, args);
	    }, time);
	};

	return defer_cancel;
    }
};

},{}],81:[function(require,module,exports){
var apijs = require ("tnt.api");

var ta = function () {
    "use strict";

    var no_track = true;
    var div_id;

    // Defaults
    var tree_conf = {
	tree : undefined,
	track : function () {
	    var t = tnt.track()
		.background_color("#EBF5FF")
		.data(tnt.track.data()
		      .update(tnt.track.retriever.sync()
			      .retriever (function () {
				  return  []
			      })
			     ))
		.display(tnt.track.feature.block()
			 .foreground_color("steelblue")
			 .index(function (d) {
			     return d.start;
			 })
			);

	    return t;
	},
	annotation : undefined,
	ruler : "none",
	key   : undefined
    };

    var tree_annot = function (div) {
	div_id = d3.select(div)
	    .attr("id");

	var group_div = d3.select(div)
	    .append("div")
	    .attr("class", "tnt_groupDiv");

	var tree_div = group_div
	    .append("div")
	    .attr("id", "tnt_tree_container_" + div_id)
	    .attr("class", "tnt_tree_container");

	var annot_div = group_div
	    .append("div")
	    .attr("id", "tnt_annot_container_" + div_id)
	    .attr("class", "tnt_annot_container");

	tree_conf.tree (tree_div.node());

	// tracks
	var leaves = tree_conf.tree.root().get_all_leaves();
	var tracks = [];

	var height = tree_conf.tree.label().height();

	for (var i=0; i<leaves.length; i++) {
	    // Block Track1
	    (function  (leaf) {
		tnt.track.id = function () {
		    if (tree_conf.key === undefined) {
			return  leaf.id();
		    }
		    if (typeof (tree_conf.key) === 'function') {
			return tree_conf.key (leaf);
		    }
		    return leaf.property(tree_conf.key);
		};
		var track = tree_conf.track(leaves[i])
		    .height(height);

		tracks.push (track);

	    })(leaves[i]);

	}

	// An axis track
	tnt.track.id = function () {
	    return "axis-top";
	};
	var axis_top = tnt.track()
	    .height(0)
	    .background_color("white")
	    .display(tnt.track.feature.axis()
		     .orientation("top")
		    );

	tnt.track.id = function () {
	    return "axis-bottom";
	};
	var axis = tnt.track()
	    .height(18)
	    .background_color("white")
	    .display(tnt.track.feature.axis()
		     .orientation("bottom")
		    );

	if (tree_conf.annotation) {
	    if (tree_conf.ruler === 'both' || tree_conf.ruler === 'top') {
		tree_conf.annotation
		    .add_track(axis_top);
	    }

	    tree_conf.annotation
		.add_track(tracks);

	    if (tree_conf.ruler === 'both' || tree_conf.ruler === "bottom") {
		tree_conf.annotation
		    .add_track(axis);
	    }

	    tree_conf.annotation(annot_div.node());
	    tree_conf.annotation.start();
	}

	api.method('update', function () {
	    tree_conf.tree.update();

	    if (tree_conf.annotation) {
		var leaves = tree_conf.tree.root().get_all_leaves();
		var new_tracks = [];

		if (tree_conf.ruler === 'both' || tree_conf.ruler === 'top') {
		    new_tracks.push(axis_top);
		}

		for (var i=0; i<leaves.length; i++) {
		    // We first see if we have a track for the leaf:
		    var id;
		    if (tree_conf.key === undefined) {
			id = leaves[i].id();
		    } else if (typeof (tree_conf.key) === 'function') {
			id = tree_conf.key (leaves[i]);
		    } else {
			id = leaves[i].property(tree_conf.key);
		    }
		    var curr_track = tree_conf.annotation.find_track_by_id(id);
		    //var curr_track = tree_conf.annotation.find_track_by_id(tree_conf.key===undefined ? leaves[i].id() : d3.functor(tree_conf.key) (leaves[i]))//leaves[i].property(tree_conf.key));
		    if (curr_track === undefined) {
			// New leaf -- no track for it
			(function (leaf) {
			    tnt.track.id = function () {
				if (tree_conf.key === undefined) {
				    return leaf.id();
				}
				if (typeof (tree_conf.key) === 'function') {
				    return tree_conf.key (leaf);
				}
				return leaf.property(tree_conf.key);
			    };
			    curr_track = tree_conf.track(leaves[i])
				.height(height);
			})(leaves[i]);
		    }
		    new_tracks.push(curr_track);
		}
		if (tree_conf.ruler === 'both' || tree_conf.ruler === 'bottom') {
		    new_tracks.push(axis);
		}

		tree_conf.annotation.reorder(new_tracks);
	    }
	});

	return tree_annot;
    };

    var api = tnt.utils.api (tree_annot)
	.getset (tree_conf);

    // TODO: Rewrite with the api interface
    tree_annot.track = function (new_track) {
	if (!arguments.length) {
	    return tree_conf.track;
	}

	// First time it is set
	if (no_track) {
	    tree_conf.track = new_track;
	    no_track = false;
	    return tree_annot;
	}

	// If it is reset -- apply the changes
	var tracks = tree_conf.annotation.tracks();
	// var start_index = (tree_conf.ruler === 'both' || tree_conf.ruler === 'top') ? 1 : 0;
	// var end_index = (tree_conf.ruler === 'both' || tree_conf.ruler === 'bottom') ? 1 : 0;

	var start_index = 0;
	var n_index = 0;

	if (tree_conf.ruler === "both") {
	    start_index = 1;
	    n_index = 2;
	} else if (tree_conf.ruler === "top") {
	    start_index = 1;
	    n_index = 1;
	} else if (tree_conf.ruler === "bottom") {
	    n_index = 1;
	}

	// Reset top track -- axis
	if (start_index > 0) {
	    tracks[0].display().reset.call(tracks[0]);
	}
	// Reset bottom track -- axis
	if (n_index > start_index) {
	    var n = tracks.length - 1;
	    tracks[n].display().reset.call(tracks[n]);
	}

	for (var i=start_index; i<=(tracks.length - n_index); i++) {
	    var t = tracks[i];
	    t.display().reset.call(t);
	    var leaf;
	    tree_conf.tree.root().apply (function (node) {
		if (node.id() === t.id()) {
		    leaf = node;
		}
	    })

	    var n_track;
	    (function (leaf) {
		tnt.track.id = function () {
		    if (tree_conf.key === undefined) {
			return leaf.id();
		    }
		    if (typeof (tree_conf.key === 'function')) {
			return tree_conf.key (leaf);
		    }
		    return leaf.property(tree_conf.key);
		};
		n_track = new_track(leaf)
		    .height(tree_conf.tree.label().height());
	    })(leaf);

	    tracks[i] = n_track;
	}

	tree_conf.track = new_track;
	tree_conf.annotation.start();
    };

    return ta;
};

module.exports = exports = ta;


},{"tnt.api":7}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9mYWtlX2QwYWIwNjU0LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL2Jpb2pzLWV2ZW50cy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL2Jpb2pzLWV2ZW50cy9ub2RlX21vZHVsZXMvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUvYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy9iaW9qcy1ldmVudHMvbm9kZV9tb2R1bGVzL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYXBpL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmFwaS9zcmMvYXBpLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmJvYXJkL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmJvYXJkL25vZGVfbW9kdWxlcy90bnQudXRpbHMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvcmVkdWNlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmJvYXJkL25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL3V0aWxzLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmJvYXJkL3NyYy9ib2FyZC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5ib2FyZC9zcmMvZGF0YS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5ib2FyZC9zcmMvZmVhdHVyZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5ib2FyZC9zcmMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2xheW91dC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5ib2FyZC9zcmMvdHJhY2suanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2VzNi1wcm9taXNlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2UtcHJvbWlzZXMvaHR0cHBsZWFzZS1wcm9taXNlcy5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9odHRwcGxlYXNlL2xpYi9lcnJvci5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9odHRwcGxlYXNlL2xpYi9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9odHRwcGxlYXNlL2xpYi9yZXF1ZXN0LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2UvbGliL3Jlc3BvbnNlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2UvbGliL3V0aWxzL2RlbGF5LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2UvbGliL3V0aWxzL29uY2UuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvaHR0cHBsZWFzZS9saWIveGhyLWJyb3dzZXIuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvaHR0cHBsZWFzZS9ub2RlX21vZHVsZXMveHRlbmQvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuZW5zZW1ibC9ub2RlX21vZHVsZXMvaHR0cHBsZWFzZS9wbHVnaW5zL2NsZWFudXJsLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2UvcGx1Z2lucy9qc29uLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvbm9kZV9tb2R1bGVzL2h0dHBwbGVhc2UvcGx1Z2lucy9qc29ucmVxdWVzdC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5lbnNlbWJsL25vZGVfbW9kdWxlcy9odHRwcGxlYXNlL3BsdWdpbnMvanNvbnJlc3BvbnNlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmVuc2VtYmwvc3JjL3Jlc3QuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuZ2Vub21lL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50Lmdlbm9tZS9zcmMvZGF0YS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5nZW5vbWUvc3JjL2ZlYXR1cmUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuZ2Vub21lL3NyYy9nZW5vbWUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuZ2Vub21lL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5nZW5vbWUvc3JjL2xheW91dC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5uZXdpY2svaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQubmV3aWNrL3NyYy9uZXdpY2suanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudG9vbHRpcC9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC50b29sdGlwL3NyYy90b29sdGlwLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnRyZWUubm9kZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvc3JjL25vZGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC50cmVlL25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnRyZWUvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvc3JjL25vZGUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvZGlhZ29uYWwuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbGFiZWwuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbGF5b3V0LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnRyZWUvc3JjL25vZGVfZGlzcGxheS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC50cmVlL3NyYy90cmVlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvdXRpbHMuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L3NyYy90YS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQ1JBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0aUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbHlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5OEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4S0E7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUpBO0FBQ0E7Ozs7OztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFSQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUNWQTs7Ozs7Ozs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0ZUE7O0FDQUE7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCJpZiAodHlwZW9mIHRudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gdG50ID0gcmVxdWlyZShcIi4vc3JjL3RhLmpzXCIpO1xufVxudmFyIGV2ZW50c3lzdGVtID0gcmVxdWlyZSAoXCJiaW9qcy1ldmVudHNcIik7XG5ldmVudHN5c3RlbS5taXhpbiAodG50KTtcbnRudC51dGlscyA9IHJlcXVpcmUgKFwidG50LnV0aWxzXCIpO1xudG50LnRvb2x0aXAgPSByZXF1aXJlIChcInRudC50b29sdGlwXCIpO1xudG50LnRyZWUgPSByZXF1aXJlIChcInRudC50cmVlXCIpO1xudG50LnRyZWUubm9kZSA9IHJlcXVpcmUgKFwidG50LnRyZWUubm9kZVwiKTtcbnRudC50cmVlLnBhcnNlX25ld2ljayA9IHJlcXVpcmUoXCJ0bnQubmV3aWNrXCIpLnBhcnNlX25ld2ljaztcbnRudC50cmVlLnBhcnNlX25oeCA9IHJlcXVpcmUoXCJ0bnQubmV3aWNrXCIpLnBhcnNlX25oeDtcbnRudC5ib2FyZCA9IHJlcXVpcmUgKFwidG50LmJvYXJkXCIpO1xudG50LmJvYXJkLmdlbm9tZSA9IHJlcXVpcmUoXCJ0bnQuZ2Vub21lXCIpO1xuLy90bnQubGVnZW5kID0gcmVxdWlyZSAoXCJ0bnQubGVnZW5kXCIpO1xuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoXCJiYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZVwiKTtcblxuZXZlbnRzLm9uQWxsID0gZnVuY3Rpb24oY2FsbGJhY2ssY29udGV4dCl7XG4gIHRoaXMub24oXCJhbGxcIiwgY2FsbGJhY2ssY29udGV4dCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gTWl4aW4gdXRpbGl0eVxuZXZlbnRzLm9sZE1peGluID0gZXZlbnRzLm1peGluO1xuZXZlbnRzLm1peGluID0gZnVuY3Rpb24ocHJvdG8pIHtcbiAgZXZlbnRzLm9sZE1peGluKHByb3RvKTtcbiAgLy8gYWRkIGN1c3RvbSBvbkFsbFxuICB2YXIgZXhwb3J0cyA9IFsnb25BbGwnXTtcbiAgZm9yKHZhciBpPTA7IGkgPCBleHBvcnRzLmxlbmd0aDtpKyspe1xuICAgIHZhciBuYW1lID0gZXhwb3J0c1tpXTtcbiAgICBwcm90b1tuYW1lXSA9IHRoaXNbbmFtZV07XG4gIH1cbiAgcmV0dXJuIHByb3RvO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBldmVudHM7XG4iLCIvKipcbiAqIFN0YW5kYWxvbmUgZXh0cmFjdGlvbiBvZiBCYWNrYm9uZS5FdmVudHMsIG5vIGV4dGVybmFsIGRlcGVuZGVuY3kgcmVxdWlyZWQuXG4gKiBEZWdyYWRlcyBuaWNlbHkgd2hlbiBCYWNrb25lL3VuZGVyc2NvcmUgYXJlIGFscmVhZHkgYXZhaWxhYmxlIGluIHRoZSBjdXJyZW50XG4gKiBnbG9iYWwgY29udGV4dC5cbiAqXG4gKiBOb3RlIHRoYXQgZG9jcyBzdWdnZXN0IHRvIHVzZSB1bmRlcnNjb3JlJ3MgYF8uZXh0ZW5kKClgIG1ldGhvZCB0byBhZGQgRXZlbnRzXG4gKiBzdXBwb3J0IHRvIHNvbWUgZ2l2ZW4gb2JqZWN0LiBBIGBtaXhpbigpYCBtZXRob2QgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIEV2ZW50c1xuICogcHJvdG90eXBlIHRvIGF2b2lkIHVzaW5nIHVuZGVyc2NvcmUgZm9yIHRoYXQgc29sZSBwdXJwb3NlOlxuICpcbiAqICAgICB2YXIgbXlFdmVudEVtaXR0ZXIgPSBCYWNrYm9uZUV2ZW50cy5taXhpbih7fSk7XG4gKlxuICogT3IgZm9yIGEgZnVuY3Rpb24gY29uc3RydWN0b3I6XG4gKlxuICogICAgIGZ1bmN0aW9uIE15Q29uc3RydWN0b3IoKXt9XG4gKiAgICAgTXlDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZm9vID0gZnVuY3Rpb24oKXt9XG4gKiAgICAgQmFja2JvbmVFdmVudHMubWl4aW4oTXlDb25zdHJ1Y3Rvci5wcm90b3R5cGUpO1xuICpcbiAqIChjKSAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIEluYy5cbiAqIChjKSAyMDEzIE5pY29sYXMgUGVycmlhdWx0XG4gKi9cbi8qIGdsb2JhbCBleHBvcnRzOnRydWUsIGRlZmluZSwgbW9kdWxlICovXG4oZnVuY3Rpb24oKSB7XG4gIHZhciByb290ID0gdGhpcyxcbiAgICAgIG5hdGl2ZUZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaCxcbiAgICAgIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSxcbiAgICAgIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLFxuICAgICAgaWRDb3VudGVyID0gMDtcblxuICAvLyBSZXR1cm5zIGEgcGFydGlhbCBpbXBsZW1lbnRhdGlvbiBtYXRjaGluZyB0aGUgbWluaW1hbCBBUEkgc3Vic2V0IHJlcXVpcmVkXG4gIC8vIGJ5IEJhY2tib25lLkV2ZW50c1xuICBmdW5jdGlvbiBtaW5pc2NvcmUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGtleXM6IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG9iaiAhPT0gXCJmdW5jdGlvblwiIHx8IG9iaiA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJrZXlzKCkgY2FsbGVkIG9uIGEgbm9uLW9iamVjdFwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIga2V5LCBrZXlzID0gW107XG4gICAgICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAga2V5c1trZXlzLmxlbmd0aF0gPSBrZXk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXlzO1xuICAgICAgfSxcblxuICAgICAgdW5pcXVlSWQ6IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgICAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgICAgICByZXR1cm4gcHJlZml4ID8gcHJlZml4ICsgaWQgOiBpZDtcbiAgICAgIH0sXG5cbiAgICAgIGhhczogZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICAgICAgfSxcblxuICAgICAgZWFjaDogZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgICAgICBpZiAob2JqID09IG51bGwpIHJldHVybjtcbiAgICAgICAgaWYgKG5hdGl2ZUZvckVhY2ggJiYgb2JqLmZvckVhY2ggPT09IG5hdGl2ZUZvckVhY2gpIHtcbiAgICAgICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG9iai5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5oYXMob2JqLCBrZXkpKSB7XG4gICAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2tleV0sIGtleSwgb2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIG9uY2U6IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgdmFyIHJhbiA9IGZhbHNlLCBtZW1vO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKHJhbikgcmV0dXJuIG1lbW87XG4gICAgICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgICAgICBtZW1vID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgICAgIHJldHVybiBtZW1vO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICB2YXIgXyA9IG1pbmlzY29yZSgpLCBFdmVudHM7XG5cbiAgLy8gQmFja2JvbmUuRXZlbnRzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEEgbW9kdWxlIHRoYXQgY2FuIGJlIG1peGVkIGluIHRvICphbnkgb2JqZWN0KiBpbiBvcmRlciB0byBwcm92aWRlIGl0IHdpdGhcbiAgLy8gY3VzdG9tIGV2ZW50cy4gWW91IG1heSBiaW5kIHdpdGggYG9uYCBvciByZW1vdmUgd2l0aCBgb2ZmYCBjYWxsYmFja1xuICAvLyBmdW5jdGlvbnMgdG8gYW4gZXZlbnQ7IGB0cmlnZ2VyYC1pbmcgYW4gZXZlbnQgZmlyZXMgYWxsIGNhbGxiYWNrcyBpblxuICAvLyBzdWNjZXNzaW9uLlxuICAvL1xuICAvLyAgICAgdmFyIG9iamVjdCA9IHt9O1xuICAvLyAgICAgXy5leHRlbmQob2JqZWN0LCBCYWNrYm9uZS5FdmVudHMpO1xuICAvLyAgICAgb2JqZWN0Lm9uKCdleHBhbmQnLCBmdW5jdGlvbigpeyBhbGVydCgnZXhwYW5kZWQnKTsgfSk7XG4gIC8vICAgICBvYmplY3QudHJpZ2dlcignZXhwYW5kJyk7XG4gIC8vXG4gIEV2ZW50cyA9IHtcblxuICAgIC8vIEJpbmQgYW4gZXZlbnQgdG8gYSBgY2FsbGJhY2tgIGZ1bmN0aW9uLiBQYXNzaW5nIGBcImFsbFwiYCB3aWxsIGJpbmRcbiAgICAvLyB0aGUgY2FsbGJhY2sgdG8gYWxsIGV2ZW50cyBmaXJlZC5cbiAgICBvbjogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIGlmICghZXZlbnRzQXBpKHRoaXMsICdvbicsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pIHx8ICFjYWxsYmFjaykgcmV0dXJuIHRoaXM7XG4gICAgICB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcbiAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV0gfHwgKHRoaXMuX2V2ZW50c1tuYW1lXSA9IFtdKTtcbiAgICAgIGV2ZW50cy5wdXNoKHtjYWxsYmFjazogY2FsbGJhY2ssIGNvbnRleHQ6IGNvbnRleHQsIGN0eDogY29udGV4dCB8fCB0aGlzfSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gQmluZCBhbiBldmVudCB0byBvbmx5IGJlIHRyaWdnZXJlZCBhIHNpbmdsZSB0aW1lLiBBZnRlciB0aGUgZmlyc3QgdGltZVxuICAgIC8vIHRoZSBjYWxsYmFjayBpcyBpbnZva2VkLCBpdCB3aWxsIGJlIHJlbW92ZWQuXG4gICAgb25jZTogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIGlmICghZXZlbnRzQXBpKHRoaXMsICdvbmNlJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkgfHwgIWNhbGxiYWNrKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBvbmNlID0gXy5vbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLm9mZihuYW1lLCBvbmNlKTtcbiAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH0pO1xuICAgICAgb25jZS5fY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgIHJldHVybiB0aGlzLm9uKG5hbWUsIG9uY2UsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgb25lIG9yIG1hbnkgY2FsbGJhY2tzLiBJZiBgY29udGV4dGAgaXMgbnVsbCwgcmVtb3ZlcyBhbGxcbiAgICAvLyBjYWxsYmFja3Mgd2l0aCB0aGF0IGZ1bmN0aW9uLiBJZiBgY2FsbGJhY2tgIGlzIG51bGwsIHJlbW92ZXMgYWxsXG4gICAgLy8gY2FsbGJhY2tzIGZvciB0aGUgZXZlbnQuIElmIGBuYW1lYCBpcyBudWxsLCByZW1vdmVzIGFsbCBib3VuZFxuICAgIC8vIGNhbGxiYWNrcyBmb3IgYWxsIGV2ZW50cy5cbiAgICBvZmY6IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmV0YWluLCBldiwgZXZlbnRzLCBuYW1lcywgaSwgbCwgaiwgaztcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzIHx8ICFldmVudHNBcGkodGhpcywgJ29mZicsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pKSByZXR1cm4gdGhpcztcbiAgICAgIGlmICghbmFtZSAmJiAhY2FsbGJhY2sgJiYgIWNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICBuYW1lcyA9IG5hbWUgPyBbbmFtZV0gOiBfLmtleXModGhpcy5fZXZlbnRzKTtcbiAgICAgIGZvciAoaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgbmFtZSA9IG5hbWVzW2ldO1xuICAgICAgICBpZiAoZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdKSB7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzW25hbWVdID0gcmV0YWluID0gW107XG4gICAgICAgICAgaWYgKGNhbGxiYWNrIHx8IGNvbnRleHQpIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGsgPSBldmVudHMubGVuZ3RoOyBqIDwgazsgaisrKSB7XG4gICAgICAgICAgICAgIGV2ID0gZXZlbnRzW2pdO1xuICAgICAgICAgICAgICBpZiAoKGNhbGxiYWNrICYmIGNhbGxiYWNrICE9PSBldi5jYWxsYmFjayAmJiBjYWxsYmFjayAhPT0gZXYuY2FsbGJhY2suX2NhbGxiYWNrKSB8fFxuICAgICAgICAgICAgICAgICAgKGNvbnRleHQgJiYgY29udGV4dCAhPT0gZXYuY29udGV4dCkpIHtcbiAgICAgICAgICAgICAgICByZXRhaW4ucHVzaChldik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFyZXRhaW4ubGVuZ3RoKSBkZWxldGUgdGhpcy5fZXZlbnRzW25hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBUcmlnZ2VyIG9uZSBvciBtYW55IGV2ZW50cywgZmlyaW5nIGFsbCBib3VuZCBjYWxsYmFja3MuIENhbGxiYWNrcyBhcmVcbiAgICAvLyBwYXNzZWQgdGhlIHNhbWUgYXJndW1lbnRzIGFzIGB0cmlnZ2VyYCBpcywgYXBhcnQgZnJvbSB0aGUgZXZlbnQgbmFtZVxuICAgIC8vICh1bmxlc3MgeW91J3JlIGxpc3RlbmluZyBvbiBgXCJhbGxcImAsIHdoaWNoIHdpbGwgY2F1c2UgeW91ciBjYWxsYmFjayB0b1xuICAgIC8vIHJlY2VpdmUgdGhlIHRydWUgbmFtZSBvZiB0aGUgZXZlbnQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50KS5cbiAgICB0cmlnZ2VyOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIGlmICghZXZlbnRzQXBpKHRoaXMsICd0cmlnZ2VyJywgbmFtZSwgYXJncykpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXTtcbiAgICAgIHZhciBhbGxFdmVudHMgPSB0aGlzLl9ldmVudHMuYWxsO1xuICAgICAgaWYgKGV2ZW50cykgdHJpZ2dlckV2ZW50cyhldmVudHMsIGFyZ3MpO1xuICAgICAgaWYgKGFsbEV2ZW50cykgdHJpZ2dlckV2ZW50cyhhbGxFdmVudHMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gVGVsbCB0aGlzIG9iamVjdCB0byBzdG9wIGxpc3RlbmluZyB0byBlaXRoZXIgc3BlY2lmaWMgZXZlbnRzIC4uLiBvclxuICAgIC8vIHRvIGV2ZXJ5IG9iamVjdCBpdCdzIGN1cnJlbnRseSBsaXN0ZW5pbmcgdG8uXG4gICAgc3RvcExpc3RlbmluZzogZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycztcbiAgICAgIGlmICghbGlzdGVuZXJzKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBkZWxldGVMaXN0ZW5lciA9ICFuYW1lICYmICFjYWxsYmFjaztcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIGNhbGxiYWNrID0gdGhpcztcbiAgICAgIGlmIChvYmopIChsaXN0ZW5lcnMgPSB7fSlbb2JqLl9saXN0ZW5lcklkXSA9IG9iajtcbiAgICAgIGZvciAodmFyIGlkIGluIGxpc3RlbmVycykge1xuICAgICAgICBsaXN0ZW5lcnNbaWRdLm9mZihuYW1lLCBjYWxsYmFjaywgdGhpcyk7XG4gICAgICAgIGlmIChkZWxldGVMaXN0ZW5lcikgZGVsZXRlIHRoaXMuX2xpc3RlbmVyc1tpZF07XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgfTtcblxuICAvLyBSZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byBzcGxpdCBldmVudCBzdHJpbmdzLlxuICB2YXIgZXZlbnRTcGxpdHRlciA9IC9cXHMrLztcblxuICAvLyBJbXBsZW1lbnQgZmFuY3kgZmVhdHVyZXMgb2YgdGhlIEV2ZW50cyBBUEkgc3VjaCBhcyBtdWx0aXBsZSBldmVudFxuICAvLyBuYW1lcyBgXCJjaGFuZ2UgYmx1clwiYCBhbmQgalF1ZXJ5LXN0eWxlIGV2ZW50IG1hcHMgYHtjaGFuZ2U6IGFjdGlvbn1gXG4gIC8vIGluIHRlcm1zIG9mIHRoZSBleGlzdGluZyBBUEkuXG4gIHZhciBldmVudHNBcGkgPSBmdW5jdGlvbihvYmosIGFjdGlvbiwgbmFtZSwgcmVzdCkge1xuICAgIGlmICghbmFtZSkgcmV0dXJuIHRydWU7XG5cbiAgICAvLyBIYW5kbGUgZXZlbnQgbWFwcy5cbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gbmFtZSkge1xuICAgICAgICBvYmpbYWN0aW9uXS5hcHBseShvYmosIFtrZXksIG5hbWVba2V5XV0uY29uY2F0KHJlc3QpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgc3BhY2Ugc2VwYXJhdGVkIGV2ZW50IG5hbWVzLlxuICAgIGlmIChldmVudFNwbGl0dGVyLnRlc3QobmFtZSkpIHtcbiAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoZXZlbnRTcGxpdHRlcik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBvYmpbYWN0aW9uXS5hcHBseShvYmosIFtuYW1lc1tpXV0uY29uY2F0KHJlc3QpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBBIGRpZmZpY3VsdC10by1iZWxpZXZlLCBidXQgb3B0aW1pemVkIGludGVybmFsIGRpc3BhdGNoIGZ1bmN0aW9uIGZvclxuICAvLyB0cmlnZ2VyaW5nIGV2ZW50cy4gVHJpZXMgdG8ga2VlcCB0aGUgdXN1YWwgY2FzZXMgc3BlZWR5IChtb3N0IGludGVybmFsXG4gIC8vIEJhY2tib25lIGV2ZW50cyBoYXZlIDMgYXJndW1lbnRzKS5cbiAgdmFyIHRyaWdnZXJFdmVudHMgPSBmdW5jdGlvbihldmVudHMsIGFyZ3MpIHtcbiAgICB2YXIgZXYsIGkgPSAtMSwgbCA9IGV2ZW50cy5sZW5ndGgsIGExID0gYXJnc1swXSwgYTIgPSBhcmdzWzFdLCBhMyA9IGFyZ3NbMl07XG4gICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgICAgY2FzZSAwOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCk7IHJldHVybjtcbiAgICAgIGNhc2UgMTogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExKTsgcmV0dXJuO1xuICAgICAgY2FzZSAyOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEsIGEyKTsgcmV0dXJuO1xuICAgICAgY2FzZSAzOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEsIGEyLCBhMyk7IHJldHVybjtcbiAgICAgIGRlZmF1bHQ6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmFwcGx5KGV2LmN0eCwgYXJncyk7XG4gICAgfVxuICB9O1xuXG4gIHZhciBsaXN0ZW5NZXRob2RzID0ge2xpc3RlblRvOiAnb24nLCBsaXN0ZW5Ub09uY2U6ICdvbmNlJ307XG5cbiAgLy8gSW52ZXJzaW9uLW9mLWNvbnRyb2wgdmVyc2lvbnMgb2YgYG9uYCBhbmQgYG9uY2VgLiBUZWxsICp0aGlzKiBvYmplY3QgdG9cbiAgLy8gbGlzdGVuIHRvIGFuIGV2ZW50IGluIGFub3RoZXIgb2JqZWN0IC4uLiBrZWVwaW5nIHRyYWNrIG9mIHdoYXQgaXQnc1xuICAvLyBsaXN0ZW5pbmcgdG8uXG4gIF8uZWFjaChsaXN0ZW5NZXRob2RzLCBmdW5jdGlvbihpbXBsZW1lbnRhdGlvbiwgbWV0aG9kKSB7XG4gICAgRXZlbnRzW21ldGhvZF0gPSBmdW5jdGlvbihvYmosIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzIHx8ICh0aGlzLl9saXN0ZW5lcnMgPSB7fSk7XG4gICAgICB2YXIgaWQgPSBvYmouX2xpc3RlbmVySWQgfHwgKG9iai5fbGlzdGVuZXJJZCA9IF8udW5pcXVlSWQoJ2wnKSk7XG4gICAgICBsaXN0ZW5lcnNbaWRdID0gb2JqO1xuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0JykgY2FsbGJhY2sgPSB0aGlzO1xuICAgICAgb2JqW2ltcGxlbWVudGF0aW9uXShuYW1lLCBjYWxsYmFjaywgdGhpcyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICB9KTtcblxuICAvLyBBbGlhc2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbiAgRXZlbnRzLmJpbmQgICA9IEV2ZW50cy5vbjtcbiAgRXZlbnRzLnVuYmluZCA9IEV2ZW50cy5vZmY7XG5cbiAgLy8gTWl4aW4gdXRpbGl0eVxuICBFdmVudHMubWl4aW4gPSBmdW5jdGlvbihwcm90bykge1xuICAgIHZhciBleHBvcnRzID0gWydvbicsICdvbmNlJywgJ29mZicsICd0cmlnZ2VyJywgJ3N0b3BMaXN0ZW5pbmcnLCAnbGlzdGVuVG8nLFxuICAgICAgICAgICAgICAgICAgICdsaXN0ZW5Ub09uY2UnLCAnYmluZCcsICd1bmJpbmQnXTtcbiAgICBfLmVhY2goZXhwb3J0cywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgcHJvdG9bbmFtZV0gPSB0aGlzW25hbWVdO1xuICAgIH0sIHRoaXMpO1xuICAgIHJldHVybiBwcm90bztcbiAgfTtcblxuICAvLyBFeHBvcnQgRXZlbnRzIGFzIEJhY2tib25lRXZlbnRzIGRlcGVuZGluZyBvbiBjdXJyZW50IGNvbnRleHRcbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gRXZlbnRzO1xuICAgIH1cbiAgICBleHBvcnRzLkJhY2tib25lRXZlbnRzID0gRXZlbnRzO1xuICB9ZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PSBcIm9iamVjdFwiKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIEV2ZW50cztcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByb290LkJhY2tib25lRXZlbnRzID0gRXZlbnRzO1xuICB9XG59KSh0aGlzKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZScpO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9hcGkuanNcIik7XG4iLCJ2YXIgYXBpID0gZnVuY3Rpb24gKHdobykge1xuXG4gICAgdmFyIF9tZXRob2RzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbSA9IFtdO1xuXG5cdG0uYWRkX2JhdGNoID0gZnVuY3Rpb24gKG9iaikge1xuXHQgICAgbS51bnNoaWZ0KG9iaik7XG5cdH07XG5cblx0bS51cGRhdGUgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0bVtpXVtwXSA9IHZhbHVlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdH07XG5cblx0bS5hZGQgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgaWYgKG0udXBkYXRlIChtZXRob2QsIHZhbHVlKSApIHtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIHJlZyA9IHt9O1xuXHRcdHJlZ1ttZXRob2RdID0gdmFsdWU7XG5cdFx0bS5hZGRfYmF0Y2ggKHJlZyk7XG5cdCAgICB9XG5cdH07XG5cblx0bS5nZXQgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRyZXR1cm4gbVtpXVtwXTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0fTtcblxuXHRyZXR1cm4gbTtcbiAgICB9O1xuXG4gICAgdmFyIG1ldGhvZHMgICAgPSBfbWV0aG9kcygpO1xuICAgIHZhciBhcGkgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIGFwaS5jaGVjayA9IGZ1bmN0aW9uIChtZXRob2QsIGNoZWNrLCBtc2cpIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLmNoZWNrKG1ldGhvZFtpXSwgY2hlY2ssIG1zZyk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QuY2hlY2soY2hlY2ssIG1zZyk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS5jaGVjayhjaGVjaywgbXNnKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkudHJhbnNmb3JtID0gZnVuY3Rpb24gKG1ldGhvZCwgY2Jhaykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkudHJhbnNmb3JtIChtZXRob2RbaV0sIGNiYWspO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLnRyYW5zZm9ybSAoY2Jhayk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS50cmFuc2Zvcm0oY2Jhayk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgdmFyIGF0dGFjaF9tZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kLCBvcHRzKSB7XG5cdHZhciBjaGVja3MgPSBbXTtcblx0dmFyIHRyYW5zZm9ybXMgPSBbXTtcblxuXHR2YXIgZ2V0dGVyID0gb3B0cy5vbl9nZXR0ZXIgfHwgZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIG1ldGhvZHMuZ2V0KG1ldGhvZCk7XG5cdH07XG5cblx0dmFyIHNldHRlciA9IG9wdHMub25fc2V0dGVyIHx8IGZ1bmN0aW9uICh4KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8dHJhbnNmb3Jtcy5sZW5ndGg7IGkrKykge1xuXHRcdHggPSB0cmFuc2Zvcm1zW2ldKHgpO1xuXHQgICAgfVxuXG5cdCAgICBmb3IgKHZhciBqPTA7IGo8Y2hlY2tzLmxlbmd0aDsgaisrKSB7XG5cdFx0aWYgKCFjaGVja3Nbal0uY2hlY2soeCkpIHtcblx0XHQgICAgdmFyIG1zZyA9IGNoZWNrc1tqXS5tc2cgfHwgXG5cdFx0XHQoXCJWYWx1ZSBcIiArIHggKyBcIiBkb2Vzbid0IHNlZW0gdG8gYmUgdmFsaWQgZm9yIHRoaXMgbWV0aG9kXCIpO1xuXHRcdCAgICB0aHJvdyAobXNnKTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICBtZXRob2RzLmFkZChtZXRob2QsIHgpO1xuXHR9O1xuXG5cdHZhciBuZXdfbWV0aG9kID0gZnVuY3Rpb24gKG5ld192YWwpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBnZXR0ZXIoKTtcblx0ICAgIH1cblx0ICAgIHNldHRlcihuZXdfdmFsKTtcblx0ICAgIHJldHVybiB3aG87IC8vIFJldHVybiB0aGlzP1xuXHR9O1xuXHRuZXdfbWV0aG9kLmNoZWNrID0gZnVuY3Rpb24gKGNiYWssIG1zZykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGNoZWNrcztcblx0ICAgIH1cblx0ICAgIGNoZWNrcy5wdXNoICh7Y2hlY2sgOiBjYmFrLFxuXHRcdFx0ICBtc2cgICA6IG1zZ30pO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cdG5ld19tZXRob2QudHJhbnNmb3JtID0gZnVuY3Rpb24gKGNiYWspIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiB0cmFuc2Zvcm1zO1xuXHQgICAgfVxuXHQgICAgdHJhbnNmb3Jtcy5wdXNoKGNiYWspO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cblx0d2hvW21ldGhvZF0gPSBuZXdfbWV0aG9kO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBvcHRzKSB7XG5cdGlmICh0eXBlb2YgKHBhcmFtKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIG1ldGhvZHMuYWRkX2JhdGNoIChwYXJhbSk7XG5cdCAgICBmb3IgKHZhciBwIGluIHBhcmFtKSB7XG5cdFx0YXR0YWNoX21ldGhvZCAocCwgb3B0cyk7XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICBtZXRob2RzLmFkZCAocGFyYW0sIG9wdHMuZGVmYXVsdF92YWx1ZSk7XG5cdCAgICBhdHRhY2hfbWV0aG9kIChwYXJhbSwgb3B0cyk7XG5cdH1cbiAgICB9O1xuXG4gICAgYXBpLmdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWZ9KTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuZ2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX3NldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBnZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIHNldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9zZXR0ZXIgOiBvbl9zZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9nZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgc2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBnZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fZ2V0dGVyIDogb25fZ2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QgPSBmdW5jdGlvbiAobmFtZSwgY2Jhaykge1xuXHRpZiAodHlwZW9mIChuYW1lKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIGZvciAodmFyIHAgaW4gbmFtZSkge1xuXHRcdHdob1twXSA9IG5hbWVbcF07XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbmFtZV0gPSBjYmFrO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHJldHVybiBhcGk7XG4gICAgXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBhcGk7IiwiLy8gaWYgKHR5cGVvZiB0bnQgPT09IFwidW5kZWZpbmVkXCIpIHtcbi8vICAgICBtb2R1bGUuZXhwb3J0cyA9IHRudCA9IHt9XG4vLyB9XG4vLyB0bnQudXRpbHMgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpO1xuLy8gdG50LnRvb2x0aXAgPSByZXF1aXJlKFwidG50LnRvb2x0aXBcIik7XG4vLyB0bnQuYm9hcmQgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL2luZGV4XCIpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCIvLyByZXF1aXJlKCdmcycpLnJlYWRkaXJTeW5jKF9fZGlybmFtZSArICcvJykuZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4vLyAgICAgaWYgKGZpbGUubWF0Y2goLy4rXFwuanMvZykgIT09IG51bGwgJiYgZmlsZSAhPT0gX19maWxlbmFtZSkge1xuLy8gXHR2YXIgbmFtZSA9IGZpbGUucmVwbGFjZSgnLmpzJywgJycpO1xuLy8gXHRtb2R1bGUuZXhwb3J0c1tuYW1lXSA9IHJlcXVpcmUoJy4vJyArIGZpbGUpO1xuLy8gICAgIH1cbi8vIH0pO1xuXG4vLyBTYW1lIGFzXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcbnV0aWxzLnJlZHVjZSA9IHJlcXVpcmUoXCIuL3JlZHVjZS5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHV0aWxzO1xuIiwidmFyIHJlZHVjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc21vb3RoID0gNTtcbiAgICB2YXIgdmFsdWUgPSAndmFsJztcbiAgICB2YXIgcmVkdW5kYW50ID0gZnVuY3Rpb24gKGEsIGIpIHtcblx0aWYgKGEgPCBiKSB7XG5cdCAgICByZXR1cm4gKChiLWEpIDw9IChiICogMC4yKSk7XG5cdH1cblx0cmV0dXJuICgoYS1iKSA8PSAoYSAqIDAuMikpO1xuICAgIH07XG4gICAgdmFyIHBlcmZvcm1fcmVkdWNlID0gZnVuY3Rpb24gKGFycikge3JldHVybiBhcnI7fTtcblxuICAgIHZhciByZWR1Y2UgPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmICghYXJyLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGFycjtcblx0fVxuXHR2YXIgc21vb3RoZWQgPSBwZXJmb3JtX3Ntb290aChhcnIpO1xuXHR2YXIgcmVkdWNlZCAgPSBwZXJmb3JtX3JlZHVjZShzbW9vdGhlZCk7XG5cdHJldHVybiByZWR1Y2VkO1xuICAgIH07XG5cbiAgICB2YXIgbWVkaWFuID0gZnVuY3Rpb24gKHYsIGFycikge1xuXHRhcnIuc29ydChmdW5jdGlvbiAoYSwgYikge1xuXHQgICAgcmV0dXJuIGFbdmFsdWVdIC0gYlt2YWx1ZV07XG5cdH0pO1xuXHRpZiAoYXJyLmxlbmd0aCAlIDIpIHtcblx0ICAgIHZbdmFsdWVdID0gYXJyW35+KGFyci5sZW5ndGggLyAyKV1bdmFsdWVdO1x0ICAgIFxuXHR9IGVsc2Uge1xuXHQgICAgdmFyIG4gPSB+fihhcnIubGVuZ3RoIC8gMikgLSAxO1xuXHQgICAgdlt2YWx1ZV0gPSAoYXJyW25dW3ZhbHVlXSArIGFycltuKzFdW3ZhbHVlXSkgLyAyO1xuXHR9XG5cblx0cmV0dXJuIHY7XG4gICAgfTtcblxuICAgIHZhciBjbG9uZSA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcblx0dmFyIHRhcmdldCA9IHt9O1xuXHRmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuXHQgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRcdHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdGFyZ2V0O1xuICAgIH07XG5cbiAgICB2YXIgcGVyZm9ybV9zbW9vdGggPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmIChzbW9vdGggPT09IDApIHsgLy8gbm8gc21vb3RoXG5cdCAgICByZXR1cm4gYXJyO1xuXHR9XG5cdHZhciBzbW9vdGhfYXJyID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBsb3cgPSAoaSA8IHNtb290aCkgPyAwIDogKGkgLSBzbW9vdGgpO1xuXHQgICAgdmFyIGhpZ2ggPSAoaSA+IChhcnIubGVuZ3RoIC0gc21vb3RoKSkgPyBhcnIubGVuZ3RoIDogKGkgKyBzbW9vdGgpO1xuXHQgICAgc21vb3RoX2FycltpXSA9IG1lZGlhbihjbG9uZShhcnJbaV0pLCBhcnIuc2xpY2UobG93LGhpZ2grMSkpO1xuXHR9XG5cdHJldHVybiBzbW9vdGhfYXJyO1xuICAgIH07XG5cbiAgICByZWR1Y2UucmVkdWNlciA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHBlcmZvcm1fcmVkdWNlO1xuXHR9XG5cdHBlcmZvcm1fcmVkdWNlID0gY2Jhaztcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnJlZHVuZGFudCA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHJlZHVuZGFudDtcblx0fVxuXHRyZWR1bmRhbnQgPSBjYmFrO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2UudmFsdWUgPSBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHZhbHVlO1xuXHR9XG5cdHZhbHVlID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2Uuc21vb3RoID0gZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBzbW9vdGg7XG5cdH1cblx0c21vb3RoID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmVkdWNlO1xufTtcblxudmFyIGJsb2NrID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWQgPSByZWR1Y2UoKVxuXHQudmFsdWUoJ3N0YXJ0Jyk7XG5cbiAgICB2YXIgdmFsdWUyID0gJ2VuZCc7XG5cbiAgICB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnb2JqZWN0JyA6IHtcbiAgICAgICAgICAgICAgICAnc3RhcnQnIDogb2JqMS5vYmplY3RbcmVkLnZhbHVlKCldLFxuICAgICAgICAgICAgICAgICdlbmQnICAgOiBvYmoyW3ZhbHVlMl1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAndmFsdWUnICA6IG9iajJbdmFsdWUyXVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvLyB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7IHJldHVybiBvYmoxIH07XG5cbiAgICByZWQucmVkdWNlciggZnVuY3Rpb24gKGFycikge1xuXHR2YXIgdmFsdWUgPSByZWQudmFsdWUoKTtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHJlZHVjZWRfYXJyID0gW107XG5cdHZhciBjdXJyID0ge1xuXHQgICAgJ29iamVjdCcgOiBhcnJbMF0sXG5cdCAgICAndmFsdWUnICA6IGFyclswXVt2YWx1ZTJdXG5cdH07XG5cdGZvciAodmFyIGk9MTsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIGlmIChyZWR1bmRhbnQgKGFycltpXVt2YWx1ZV0sIGN1cnIudmFsdWUpKSB7XG5cdFx0Y3VyciA9IGpvaW4oY3VyciwgYXJyW2ldKTtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIub2JqZWN0KTtcblx0ICAgIGN1cnIub2JqZWN0ID0gYXJyW2ldO1xuXHQgICAgY3Vyci52YWx1ZSA9IGFycltpXS5lbmQ7XG5cdH1cblx0cmVkdWNlZF9hcnIucHVzaChjdXJyLm9iamVjdCk7XG5cblx0Ly8gcmVkdWNlZF9hcnIucHVzaChhcnJbYXJyLmxlbmd0aC0xXSk7XG5cdHJldHVybiByZWR1Y2VkX2FycjtcbiAgICB9KTtcblxuICAgIHJlZHVjZS5qb2luID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gam9pbjtcblx0fVxuXHRqb2luID0gY2Jhaztcblx0cmV0dXJuIHJlZDtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnZhbHVlMiA9IGZ1bmN0aW9uIChmaWVsZCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB2YWx1ZTI7XG5cdH1cblx0dmFsdWUyID0gZmllbGQ7XG5cdHJldHVybiByZWQ7XG4gICAgfTtcblxuICAgIHJldHVybiByZWQ7XG59O1xuXG52YXIgbGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVkID0gcmVkdWNlKCk7XG5cbiAgICByZWQucmVkdWNlciAoIGZ1bmN0aW9uIChhcnIpIHtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHZhbHVlID0gcmVkLnZhbHVlKCk7XG5cdHZhciByZWR1Y2VkX2FyciA9IFtdO1xuXHR2YXIgY3VyciA9IGFyclswXTtcblx0Zm9yICh2YXIgaT0xOyBpPGFyci5sZW5ndGgtMTsgaSsrKSB7XG5cdCAgICBpZiAocmVkdW5kYW50IChhcnJbaV1bdmFsdWVdLCBjdXJyW3ZhbHVlXSkpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIpO1xuXHQgICAgY3VyciA9IGFycltpXTtcblx0fVxuXHRyZWR1Y2VkX2Fyci5wdXNoKGN1cnIpO1xuXHRyZWR1Y2VkX2Fyci5wdXNoKGFyclthcnIubGVuZ3RoLTFdKTtcblx0cmV0dXJuIHJlZHVjZWRfYXJyO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlZDtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y2U7XG5tb2R1bGUuZXhwb3J0cy5saW5lID0gbGluZTtcbm1vZHVsZS5leHBvcnRzLmJsb2NrID0gYmxvY2s7XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXRlcmF0b3IgOiBmdW5jdGlvbihpbml0X3ZhbCkge1xuXHR2YXIgaSA9IGluaXRfdmFsIHx8IDA7XG5cdHZhciBpdGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIGkrKztcblx0fTtcblx0cmV0dXJuIGl0ZXI7XG4gICAgfSxcblxuICAgIHNjcmlwdF9wYXRoIDogZnVuY3Rpb24gKHNjcmlwdF9uYW1lKSB7IC8vIHNjcmlwdF9uYW1lIGlzIHRoZSBmaWxlbmFtZVxuXHR2YXIgc2NyaXB0X3NjYXBlZCA9IHNjcmlwdF9uYW1lLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xuXHR2YXIgc2NyaXB0X3JlID0gbmV3IFJlZ0V4cChzY3JpcHRfc2NhcGVkICsgJyQnKTtcblx0dmFyIHNjcmlwdF9yZV9zdWIgPSBuZXcgUmVnRXhwKCcoLiopJyArIHNjcmlwdF9zY2FwZWQgKyAnJCcpO1xuXG5cdC8vIFRPRE86IFRoaXMgcmVxdWlyZXMgcGhhbnRvbS5qcyBvciBhIHNpbWlsYXIgaGVhZGxlc3Mgd2Via2l0IHRvIHdvcmsgKGRvY3VtZW50KVxuXHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcblx0dmFyIHBhdGggPSBcIlwiOyAgLy8gRGVmYXVsdCB0byBjdXJyZW50IHBhdGhcblx0aWYoc2NyaXB0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3IodmFyIGkgaW4gc2NyaXB0cykge1xuXHRcdGlmKHNjcmlwdHNbaV0uc3JjICYmIHNjcmlwdHNbaV0uc3JjLm1hdGNoKHNjcmlwdF9yZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjcmlwdHNbaV0uc3JjLnJlcGxhY2Uoc2NyaXB0X3JlX3N1YiwgJyQxJyk7XG5cdFx0fVxuICAgICAgICAgICAgfVxuXHR9XG5cdHJldHVybiBwYXRoO1xuICAgIH0sXG5cbiAgICBkZWZlcl9jYW5jZWwgOiBmdW5jdGlvbiAoY2JhaywgdGltZSkge1xuXHR2YXIgdGljaztcblxuXHR2YXIgZGVmZXJfY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuXHQgICAgY2xlYXJUaW1lb3V0KHRpY2spO1xuXHQgICAgdGljayA9IHNldFRpbWVvdXQoY2JhaywgdGltZSk7XG5cdH07XG5cblx0cmV0dXJuIGRlZmVyX2NhbmNlbDtcbiAgICB9XG59O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZSAoXCJ0bnQuYXBpXCIpO1xudmFyIGRlZmVyQ2FuY2VsID0gcmVxdWlyZSAoXCJ0bnQudXRpbHNcIikuZGVmZXJfY2FuY2VsO1xuXG52YXIgYm9hcmQgPSBmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8vLy8gUHJpdmF0ZSB2YXJzXG4gICAgdmFyIHN2ZztcbiAgICB2YXIgZGl2X2lkO1xuICAgIHZhciB0cmFja3MgPSBbXTtcbiAgICB2YXIgbWluX3dpZHRoID0gNTA7XG4gICAgdmFyIGhlaWdodCAgICA9IDA7ICAgIC8vIFRoaXMgaXMgdGhlIGdsb2JhbCBoZWlnaHQgaW5jbHVkaW5nIGFsbCB0aGUgdHJhY2tzXG4gICAgdmFyIHdpZHRoICAgICA9IDkyMDtcbiAgICB2YXIgaGVpZ2h0X29mZnNldCA9IDIwO1xuICAgIHZhciBsb2MgPSB7XG5cdHNwZWNpZXMgIDogdW5kZWZpbmVkLFxuXHRjaHIgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgZnJvbSAgICAgOiAwLFxuICAgICAgICB0byAgICAgICA6IDUwMFxuICAgIH07XG5cbiAgICAvLyBUT0RPOiBXZSBoYXZlIG5vdyBiYWNrZ3JvdW5kIGNvbG9yIGluIHRoZSB0cmFja3MuIENhbiB0aGlzIGJlIHJlbW92ZWQ/XG4gICAgLy8gSXQgbG9va3MgbGlrZSBpdCBpcyB1c2VkIGluIHRoZSB0b28td2lkZSBwYW5lIGV0YywgYnV0IGl0IG1heSBub3QgYmUgbmVlZGVkIGFueW1vcmVcbiAgICB2YXIgYmdDb2xvciAgID0gZDMucmdiKCcjRjhGQkVGJyk7IC8vI0Y4RkJFRlxuICAgIHZhciBwYW5lOyAvLyBEcmFnZ2FibGUgcGFuZVxuICAgIHZhciBzdmdfZztcbiAgICB2YXIgeFNjYWxlO1xuICAgIHZhciB6b29tRXZlbnRIYW5kbGVyID0gZDMuYmVoYXZpb3Iuem9vbSgpO1xuICAgIHZhciBsaW1pdHMgPSB7XG5cdGxlZnQgOiAwLFxuXHRyaWdodCA6IDEwMDAsXG5cdHpvb21fb3V0IDogMTAwMCxcblx0em9vbV9pbiAgOiAxMDBcbiAgICB9O1xuICAgIHZhciBjYXBfd2lkdGggPSAzO1xuICAgIHZhciBkdXIgPSA1MDA7XG4gICAgdmFyIGRyYWdfYWxsb3dlZCA9IHRydWU7XG5cbiAgICB2YXIgZXhwb3J0cyA9IHtcblx0ZWFzZSAgICAgICAgICA6IGQzLmVhc2UoXCJjdWJpYy1pbi1vdXRcIiksXG5cdGV4dGVuZF9jYW52YXMgOiB7XG5cdCAgICBsZWZ0IDogMCxcblx0ICAgIHJpZ2h0IDogMFxuXHR9LFxuXHRzaG93X2ZyYW1lIDogdHJ1ZVxuXHQvLyBsaW1pdHMgICAgICAgIDogZnVuY3Rpb24gKCkge3Rocm93IFwiVGhlIGxpbWl0cyBtZXRob2Qgc2hvdWxkIGJlIGRlZmluZWRcIn1cbiAgICB9O1xuXG4gICAgLy8gVGhlIHJldHVybmVkIGNsb3N1cmUgLyBvYmplY3RcbiAgICB2YXIgdHJhY2tfdmlzID0gZnVuY3Rpb24oZGl2KSB7XG5cdGRpdl9pZCA9IGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKTtcblxuXHQvLyBUaGUgb3JpZ2luYWwgZGl2IGlzIGNsYXNzZWQgd2l0aCB0aGUgdG50IGNsYXNzXG5cdGQzLnNlbGVjdChkaXYpXG5cdCAgICAuY2xhc3NlZChcInRudFwiLCB0cnVlKTtcblxuXHQvLyBUT0RPOiBNb3ZlIHRoZSBzdHlsaW5nIHRvIHRoZSBzY3NzP1xuXHR2YXIgYnJvd3NlckRpdiA9IGQzLnNlbGVjdChkaXYpXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuYXR0cihcImlkXCIsIFwidG50X1wiICsgZGl2X2lkKVxuXHQgICAgLnN0eWxlKFwicG9zaXRpb25cIiwgXCJyZWxhdGl2ZVwiKVxuXHQgICAgLmNsYXNzZWQoXCJ0bnRfZnJhbWVkXCIsIGV4cG9ydHMuc2hvd19mcmFtZSA/IHRydWUgOiBmYWxzZSlcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsICh3aWR0aCArIGNhcF93aWR0aCoyICsgZXhwb3J0cy5leHRlbmRfY2FudmFzLnJpZ2h0ICsgZXhwb3J0cy5leHRlbmRfY2FudmFzLmxlZnQpICsgXCJweFwiKVxuXG5cdHZhciBncm91cERpdiA9IGJyb3dzZXJEaXZcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ3JvdXBEaXZcIik7XG5cblx0Ly8gVGhlIFNWR1xuXHRzdmcgPSBncm91cERpdlxuXHQgICAgLmFwcGVuZChcInN2Z1wiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9zdmdcIilcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGgpXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXG5cdCAgICAuYXR0cihcInBvaW50ZXItZXZlbnRzXCIsIFwiYWxsXCIpO1xuXG5cdHN2Z19nID0gc3ZnXG5cdCAgICAuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwyMClcIilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2dcIik7XG5cblx0Ly8gY2Fwc1xuXHRzdmdfZ1xuXHQgICAgLmFwcGVuZChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfXCIgKyBkaXZfaWQgKyBcIl81cGNhcFwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIDApXG5cdCAgICAuYXR0cihcInlcIiwgMClcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgMClcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBcInJlZFwiKTtcblx0c3ZnX2dcblx0ICAgIC5hcHBlbmQoXCJyZWN0XCIpXG5cdCAgICAuYXR0cihcImlkXCIsIFwidG50X1wiICsgZGl2X2lkICsgXCJfM3BjYXBcIilcblx0ICAgIC5hdHRyKFwieFwiLCB3aWR0aC1jYXBfd2lkdGgpXG5cdCAgICAuYXR0cihcInlcIiwgMClcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgMClcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBcInJlZFwiKTtcblxuXHQvLyBUaGUgWm9vbWluZy9QYW5uaW5nIFBhbmVcblx0cGFuZSA9IHN2Z19nXG5cdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9wYW5lXCIpXG5cdCAgICAuYXR0cihcImlkXCIsIFwidG50X1wiICsgZGl2X2lkICsgXCJfcGFuZVwiKVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcblx0ICAgIC5zdHlsZShcImZpbGxcIiwgYmdDb2xvcik7XG5cblx0Ly8gKiogVE9ETzogV291bGRuJ3QgYmUgYmV0dGVyIHRvIGhhdmUgdGhlc2UgbWVzc2FnZXMgYnkgdHJhY2s/XG5cdC8vIHZhciB0b29XaWRlX3RleHQgPSBzdmdfZ1xuXHQvLyAgICAgLmFwcGVuZChcInRleHRcIilcblx0Ly8gICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfd2lkZU9LX3RleHRcIilcblx0Ly8gICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfXCIgKyBkaXZfaWQgKyBcIl90b29XaWRlXCIpXG5cdC8vICAgICAuYXR0cihcImZpbGxcIiwgYmdDb2xvcilcblx0Ly8gICAgIC50ZXh0KFwiUmVnaW9uIHRvbyB3aWRlXCIpO1xuXG5cdC8vIFRPRE86IEkgZG9uJ3Qga25vdyBpZiB0aGlzIGlzIHRoZSBiZXN0IHdheSAoYW5kIHBvcnRhYmxlKSB3YXlcblx0Ly8gb2YgY2VudGVyaW5nIHRoZSB0ZXh0IGluIHRoZSB0ZXh0IGFyZWFcblx0Ly8gdmFyIGJiID0gdG9vV2lkZV90ZXh0WzBdWzBdLmdldEJCb3goKTtcblx0Ly8gdG9vV2lkZV90ZXh0XG5cdC8vICAgICAuYXR0cihcInhcIiwgfn4od2lkdGgvMiAtIGJiLndpZHRoLzIpKVxuXHQvLyAgICAgLmF0dHIoXCJ5XCIsIH5+KGhlaWdodC8yIC0gYmIuaGVpZ2h0LzIpKTtcbiAgICB9O1xuXG4gICAgLy8gQVBJXG4gICAgdmFyIGFwaSA9IGFwaWpzICh0cmFja192aXMpXG5cdC5nZXRzZXQgKGV4cG9ydHMpXG5cdC5nZXRzZXQgKGxpbWl0cylcblx0LmdldHNldCAobG9jKTtcblxuICAgIGFwaS50cmFuc2Zvcm0gKHRyYWNrX3Zpcy5leHRlbmRfY2FudmFzLCBmdW5jdGlvbiAodmFsKSB7XG5cdHZhciBwcmV2X3ZhbCA9IHRyYWNrX3Zpcy5leHRlbmRfY2FudmFzKCk7XG5cdHZhbC5sZWZ0ID0gdmFsLmxlZnQgfHwgcHJldl92YWwubGVmdDtcblx0dmFsLnJpZ2h0ID0gdmFsLnJpZ2h0IHx8IHByZXZfdmFsLnJpZ2h0O1xuXHRyZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgLy8gdHJhY2tfdmlzIGFsd2F5cyBzdGFydHMgb24gbG9jLmZyb20gJiBsb2MudG9cbiAgICBhcGkubWV0aG9kICgnc3RhcnQnLCBmdW5jdGlvbiAoKSB7XG5cblx0Ly8gUmVzZXQgdGhlIHRyYWNrc1xuXHRmb3IgKHZhciBpPTA7IGk8dHJhY2tzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBpZiAodHJhY2tzW2ldLmcpIHtcbiAgICAgICAgLy8gICAgdHJhY2tzW2ldLmRpc3BsYXkoKS5yZXNldC5jYWxsKHRyYWNrc1tpXSk7XG4gICAgICAgICAgICB0cmFja3NbaV0uZy5yZW1vdmUoKTtcblx0ICAgIH1cblx0ICAgIF9pbml0X3RyYWNrKHRyYWNrc1tpXSk7XG5cdH1cblxuXHRfcGxhY2VfdHJhY2tzKCk7XG5cblx0Ly8gVGhlIGNvbnRpbnVhdGlvbiBjYWxsYmFja1xuXHR2YXIgY29udCA9IGZ1bmN0aW9uIChyZXNwKSB7XG5cdCAgICBsaW1pdHMucmlnaHQgPSByZXNwO1xuXG5cdCAgICAvLyB6b29tRXZlbnRIYW5kbGVyLnhFeHRlbnQoW2xpbWl0cy5sZWZ0LCBsaW1pdHMucmlnaHRdKTtcblx0ICAgIGlmICgobG9jLnRvIC0gbG9jLmZyb20pIDwgbGltaXRzLnpvb21faW4pIHtcblx0XHRpZiAoKGxvYy5mcm9tICsgbGltaXRzLnpvb21faW4pID4gbGltaXRzLnpvb21faW4pIHtcblx0XHQgICAgbG9jLnRvID0gbGltaXRzLnJpZ2h0O1xuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIGxvYy50byA9IGxvYy5mcm9tICsgbGltaXRzLnpvb21faW47XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcGxvdCgpO1xuXG5cdCAgICBmb3IgKHZhciBpPTA7IGk8dHJhY2tzLmxlbmd0aDsgaSsrKSB7XG5cdFx0X3VwZGF0ZV90cmFjayh0cmFja3NbaV0sIGxvYyk7XG5cdCAgICB9XG5cdH07XG5cblx0Ly8gSWYgbGltaXRzLnJpZ2h0IGlzIGEgZnVuY3Rpb24sIHdlIGhhdmUgdG8gY2FsbCBpdCBhc3luY2hyb25vdXNseSBhbmRcblx0Ly8gdGhlbiBzdGFydGluZyB0aGUgcGxvdCBvbmNlIHdlIGhhdmUgc2V0IHRoZSByaWdodCBsaW1pdCAocGxvdClcblx0Ly8gSWYgbm90LCB3ZSBhc3N1bWUgdGhhdCBpdCBpcyBhbiBvYmpldCB3aXRoIG5ldyAobWF5YmUgcGFydGlhbGx5IGRlZmluZWQpXG5cdC8vIGRlZmluaXRpb25zIG9mIHRoZSBsaW1pdHMgYW5kIHdlIGNhbiBwbG90IGRpcmVjdGx5XG5cdC8vIFRPRE86IFJpZ2h0IG5vdywgb25seSByaWdodCBjYW4gYmUgY2FsbGVkIGFzIGFuIGFzeW5jIGZ1bmN0aW9uIHdoaWNoIGlzIHdlYWtcblx0aWYgKHR5cGVvZiAobGltaXRzLnJpZ2h0KSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbGltaXRzLnJpZ2h0KGNvbnQpO1xuXHR9IGVsc2Uge1xuXHQgICAgY29udChsaW1pdHMucmlnaHQpO1xuXHR9XG5cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd1cGRhdGUnLCBmdW5jdGlvbiAoKSB7XG5cdGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcblx0ICAgIF91cGRhdGVfdHJhY2sgKHRyYWNrc1tpXSk7XG5cdH1cblxuICAgIH0pO1xuXG4gICAgdmFyIF91cGRhdGVfdHJhY2sgPSBmdW5jdGlvbiAodHJhY2ssIHdoZXJlKSB7XG5cdGlmICh0cmFjay5kYXRhKCkpIHtcblx0ICAgIHZhciB0cmFja19kYXRhID0gdHJhY2suZGF0YSgpO1xuXHQgICAgdmFyIGRhdGFfdXBkYXRlciA9IHRyYWNrX2RhdGEudXBkYXRlKCk7XG5cdCAgICAvL3ZhciBkYXRhX3VwZGF0ZXIgPSB0cmFjay5kYXRhKCkudXBkYXRlKCk7XG5cdCAgICBkYXRhX3VwZGF0ZXIuY2FsbCh0cmFja19kYXRhLCB7XG5cdFx0J2xvYycgOiB3aGVyZSxcblx0XHQnb25fc3VjY2VzcycgOiBmdW5jdGlvbiAoKSB7XG5cdFx0ICAgIHRyYWNrLmRpc3BsYXkoKS51cGRhdGUuY2FsbCh0cmFjaywgeFNjYWxlKTtcblx0XHR9XG5cdCAgICB9KTtcblx0fVxuICAgIH07XG5cbiAgICB2YXIgcGxvdCA9IGZ1bmN0aW9uKCkge1xuXG5cdHhTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG5cdCAgICAuZG9tYWluKFtsb2MuZnJvbSwgbG9jLnRvXSlcblx0ICAgIC5yYW5nZShbMCwgd2lkdGhdKTtcblxuXHRpZiAoZHJhZ19hbGxvd2VkKSB7XG5cdCAgICBzdmdfZy5jYWxsKCB6b29tRXZlbnRIYW5kbGVyXG5cdFx0ICAgICAgIC54KHhTY2FsZSlcblx0XHQgICAgICAgLnNjYWxlRXh0ZW50KFsobG9jLnRvLWxvYy5mcm9tKS8obGltaXRzLnpvb21fb3V0LTEpLCAobG9jLnRvLWxvYy5mcm9tKS9saW1pdHMuem9vbV9pbl0pXG5cdFx0ICAgICAgIC5vbihcInpvb21cIiwgX21vdmUpXG5cdFx0ICAgICApO1xuXHR9XG5cbiAgICB9O1xuXG4gICAgLy8gcmlnaHQvbGVmdC96b29tIHBhbnMgb3Igem9vbXMgdGhlIHRyYWNrLiBUaGVzZSBtZXRob2RzIGFyZSBleHBvc2VkIHRvIGFsbG93IGV4dGVybmFsIGJ1dHRvbnMsIGV0YyB0byBpbnRlcmFjdCB3aXRoIHRoZSB0cmFja3MuIFRoZSBhcmd1bWVudCBpcyB0aGUgYW1vdW50IG9mIHBhbm5pbmcvem9vbWluZyAoaWUuIDEuMiBtZWFucyAyMCUgcGFubmluZykgV2l0aCBsZWZ0L3JpZ2h0IG9ubHkgcG9zaXRpdmUgbnVtYmVycyBhcmUgYWxsb3dlZC5cbiAgICBhcGkubWV0aG9kICgnbW92ZV9yaWdodCcsIGZ1bmN0aW9uIChmYWN0b3IpIHtcblx0aWYgKGZhY3RvciA+IDApIHtcblx0ICAgIF9tYW51YWxfbW92ZShmYWN0b3IsIDEpO1xuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnbW92ZV9sZWZ0JywgZnVuY3Rpb24gKGZhY3Rvcikge1xuXHRpZiAoZmFjdG9yID4gMCkge1xuXHQgICAgX21hbnVhbF9tb3ZlKGZhY3RvciwgLTEpO1xuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnem9vbScsIGZ1bmN0aW9uIChmYWN0b3IpIHtcblx0X21hbnVhbF9tb3ZlKGZhY3RvciwgMCk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF90cmFja19ieV9pZCcsIGZ1bmN0aW9uIChpZCkge1xuXHRmb3IgKHZhciBpPTA7IGk8dHJhY2tzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBpZiAodHJhY2tzW2ldLmlkKCkgPT09IGlkKSB7XG5cdFx0cmV0dXJuIHRyYWNrc1tpXTtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3Jlb3JkZXInLCBmdW5jdGlvbiAobmV3X3RyYWNrcykge1xuXHQvLyBUT0RPOiBUaGlzIGlzIGRlZmluaW5nIGEgbmV3IGhlaWdodCwgYnV0IHRoZSBnbG9iYWwgaGVpZ2h0IGlzIHVzZWQgdG8gZGVmaW5lIHRoZSBzaXplIG9mIHNldmVyYWxcblx0Ly8gcGFydHMuIFdlIHNob3VsZCBkbyB0aGlzIGR5bmFtaWNhbGx5XG5cblx0Zm9yICh2YXIgaj0wOyBqPG5ld190cmFja3MubGVuZ3RoOyBqKyspIHtcblx0ICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPHRyYWNrcy5sZW5ndGg7IGkrKykge1xuXHRcdGlmICh0cmFja3NbaV0uaWQoKSA9PT0gbmV3X3RyYWNrc1tqXS5pZCgpKSB7XG5cdFx0ICAgIGZvdW5kID0gdHJ1ZTtcblx0XHQgICAgdHJhY2tzLnNwbGljZShpLDEpO1xuXHRcdCAgICBicmVhaztcblx0XHR9XG5cdCAgICB9XG5cdCAgICBpZiAoIWZvdW5kKSB7XG5cdFx0X2luaXRfdHJhY2sobmV3X3RyYWNrc1tqXSk7XG5cdFx0X3VwZGF0ZV90cmFjayhuZXdfdHJhY2tzW2pdLCB7ZnJvbSA6IGxvYy5mcm9tLCB0byA6IGxvYy50b30pO1xuXHQgICAgfVxuXHR9XG5cblx0Zm9yICh2YXIgeD0wOyB4PHRyYWNrcy5sZW5ndGg7IHgrKykge1xuXHQgICAgdHJhY2tzW3hdLmcucmVtb3ZlKCk7XG5cdH1cblxuXHR0cmFja3MgPSBuZXdfdHJhY2tzO1xuXHRfcGxhY2VfdHJhY2tzKCk7XG5cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyZW1vdmVfdHJhY2snLCBmdW5jdGlvbiAodHJhY2spIHtcblx0dHJhY2suZy5yZW1vdmUoKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdhZGRfdHJhY2snLCBmdW5jdGlvbiAodHJhY2spIHtcblx0aWYgKHRyYWNrIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTx0cmFjay5sZW5ndGg7IGkrKykge1xuXHRcdHRyYWNrX3Zpcy5hZGRfdHJhY2sgKHRyYWNrW2ldKTtcblx0ICAgIH1cblx0ICAgIHJldHVybiB0cmFja192aXM7XG5cdH1cblx0dHJhY2tzLnB1c2godHJhY2spO1xuXHRyZXR1cm4gdHJhY2tfdmlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCgndHJhY2tzJywgZnVuY3Rpb24gKG5ld190cmFja3MpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gdHJhY2tzXG5cdH1cblx0dHJhY2tzID0gbmV3X3RyYWNrcztcblx0cmV0dXJuIHRyYWNrX3ZpcztcbiAgICB9KTtcblxuICAgIC8vXG4gICAgYXBpLm1ldGhvZCAoJ3dpZHRoJywgZnVuY3Rpb24gKHcpIHtcblx0Ly8gVE9ETzogQWxsb3cgc3VmZml4ZXMgbGlrZSBcIjEwMDBweFwiP1xuXHQvLyBUT0RPOiBUZXN0IHdyb25nIGZvcm1hdHNcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gd2lkdGg7XG5cdH1cblx0Ly8gQXQgbGVhc3QgbWluLXdpZHRoXG5cdGlmICh3IDwgbWluX3dpZHRoKSB7XG5cdCAgICB3ID0gbWluX3dpZHRoXG5cdH1cblxuXHQvLyBXZSBhcmUgcmVzaXppbmdcblx0aWYgKGRpdl9pZCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkKS5zZWxlY3QoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIHcpO1xuXHQgICAgLy8gUmVzaXplIHRoZSB6b29taW5nL3Bhbm5pbmcgcGFuZVxuXHQgICAgZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCkuc3R5bGUoXCJ3aWR0aFwiLCAocGFyc2VJbnQodykgKyBjYXBfd2lkdGgqMikgKyBcInB4XCIpO1xuXHQgICAgZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCArIFwiX3BhbmVcIikuYXR0cihcIndpZHRoXCIsIHcpO1xuXG5cdCAgICAvLyBSZXBsb3Rcblx0ICAgIHdpZHRoID0gdztcblx0ICAgIHBsb3QoKTtcblx0ICAgIGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcblx0XHR0cmFja3NbaV0uZy5zZWxlY3QoXCJyZWN0XCIpLmF0dHIoXCJ3aWR0aFwiLCB3KTtcblx0XHR0cmFja3NbaV0uZGlzcGxheSgpLnJlc2V0LmNhbGwodHJhY2tzW2ldKTtcblx0XHR0cmFja3NbaV0uZGlzcGxheSgpLnVwZGF0ZS5jYWxsKHRyYWNrc1tpXSx4U2NhbGUpO1xuXHQgICAgfVxuXG5cdH0gZWxzZSB7XG5cdCAgICB3aWR0aCA9IHc7XG5cdH1cblxuXHRyZXR1cm4gdHJhY2tfdmlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCgnYWxsb3dfZHJhZycsIGZ1bmN0aW9uKGIpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gZHJhZ19hbGxvd2VkO1xuXHR9XG5cdGRyYWdfYWxsb3dlZCA9IGI7XG5cdGlmIChkcmFnX2FsbG93ZWQpIHtcblx0ICAgIC8vIFdoZW4gdGhpcyBtZXRob2QgaXMgY2FsbGVkIG9uIHRoZSBvYmplY3QgYmVmb3JlIHN0YXJ0aW5nIHRoZSBzaW11bGF0aW9uLCB3ZSBkb24ndCBoYXZlIGRlZmluZWQgeFNjYWxlXG5cdCAgICBpZiAoeFNjYWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRzdmdfZy5jYWxsKCB6b29tRXZlbnRIYW5kbGVyLngoeFNjYWxlKVxuXHRcdFx0ICAgLy8gLnhFeHRlbnQoWzAsIGxpbWl0cy5yaWdodF0pXG5cdFx0XHQgICAuc2NhbGVFeHRlbnQoWyhsb2MudG8tbG9jLmZyb20pLyhsaW1pdHMuem9vbV9vdXQtMSksIChsb2MudG8tbG9jLmZyb20pL2xpbWl0cy56b29tX2luXSlcblx0XHRcdCAgIC5vbihcInpvb21cIiwgX21vdmUpICk7XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICAvLyBXZSBjcmVhdGUgYSBuZXcgZHVtbXkgc2NhbGUgaW4geCB0byBhdm9pZCBkcmFnZ2luZyB0aGUgcHJldmlvdXMgb25lXG5cdCAgICAvLyBUT0RPOiBUaGVyZSBtYXkgYmUgYSBjaGVhcGVyIHdheSBvZiBkb2luZyB0aGlzP1xuXHQgICAgem9vbUV2ZW50SGFuZGxlci54KGQzLnNjYWxlLmxpbmVhcigpKS5vbihcInpvb21cIiwgbnVsbCk7XG5cdH1cblx0cmV0dXJuIHRyYWNrX3ZpcztcbiAgICB9KTtcblxuICAgIHZhciBfcGxhY2VfdHJhY2tzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgaCA9IDA7XG5cdGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciB0cmFjayA9IHRyYWNrc1tpXTtcblx0ICAgIGlmICh0cmFjay5nLmF0dHIoXCJ0cmFuc2Zvcm1cIikpIHtcblx0XHR0cmFjay5nXG5cdFx0ICAgIC50cmFuc2l0aW9uKClcblx0XHQgICAgLmR1cmF0aW9uKGR1cilcblx0XHQgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBleHBvcnRzLmV4dGVuZF9jYW52YXMubGVmdCArIFwiLFwiICsgaCArIFwiKVwiKTtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dHJhY2suZ1xuXHRcdCAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGV4cG9ydHMuZXh0ZW5kX2NhbnZhcy5sZWZ0ICsgXCIsXCIgKyBoICsgXCIpXCIpO1xuXHQgICAgfVxuXG5cdCAgICBoICs9IHRyYWNrLmhlaWdodCgpO1xuXHR9XG5cblx0Ly8gc3ZnXG5cdHN2Zy5hdHRyKFwiaGVpZ2h0XCIsIGggKyBoZWlnaHRfb2Zmc2V0KTtcblxuXHQvLyBkaXZcblx0ZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZClcblx0ICAgIC5zdHlsZShcImhlaWdodFwiLCAoaCArIDEwICsgaGVpZ2h0X29mZnNldCkgKyBcInB4XCIpO1xuXG5cdC8vIGNhcHNcblx0ZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCArIFwiXzVwY2FwXCIpXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCBoKVxuXHQgICAgLy8gLm1vdmVfdG9fZnJvbnQoKVxuXHQgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcblx0XHRtb3ZlX3RvX2Zyb250KHRoaXMpO1xuXHQgICAgfSlcblx0ZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCArIFwiXzNwY2FwXCIpXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCBoKVxuXHQvLy5tb3ZlX3RvX2Zyb250KClcblx0ICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuXHRcdG1vdmVfdG9fZnJvbnQodGhpcyk7XG5cdCAgICB9KTtcblxuXG5cdC8vIHBhbmVcblx0cGFuZVxuXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgaCArIGhlaWdodF9vZmZzZXQpO1xuXG5cdC8vIHRvb1dpZGVfdGV4dC4gVE9ETzogSXMgdGhpcyBzdGlsbCBuZWVkZWQ/XG5cdC8vIHZhciB0b29XaWRlX3RleHQgPSBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfdG9vV2lkZVwiKTtcblx0Ly8gdmFyIGJiID0gdG9vV2lkZV90ZXh0WzBdWzBdLmdldEJCb3goKTtcblx0Ly8gdG9vV2lkZV90ZXh0XG5cdC8vICAgICAuYXR0cihcInlcIiwgfn4oaC8yKSAtIGJiLmhlaWdodC8yKTtcblxuXHRyZXR1cm4gdHJhY2tfdmlzO1xuICAgIH1cblxuICAgIHZhciBfaW5pdF90cmFjayA9IGZ1bmN0aW9uICh0cmFjaykge1xuXHR0cmFjay5nID0gc3ZnLnNlbGVjdChcImdcIikuc2VsZWN0KFwiZ1wiKVxuXHQgICAgLmFwcGVuZChcImdcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJhY2tcIilcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHRyYWNrLmhlaWdodCgpKTtcblxuXHQvLyBSZWN0IGZvciB0aGUgYmFja2dyb3VuZCBjb2xvclxuXHR0cmFjay5nXG5cdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIDApXG5cdCAgICAuYXR0cihcInlcIiwgMClcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgdHJhY2tfdmlzLndpZHRoKCkpXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCB0cmFjay5oZWlnaHQoKSlcblx0ICAgIC5zdHlsZShcImZpbGxcIiwgdHJhY2suYmFja2dyb3VuZF9jb2xvcigpKVxuXHQgICAgLnN0eWxlKFwicG9pbnRlci1ldmVudHNcIiwgXCJub25lXCIpO1xuXG5cdGlmICh0cmFjay5kaXNwbGF5KCkpIHtcblx0ICAgIHRyYWNrLmRpc3BsYXkoKS5pbml0LmNhbGwodHJhY2ssIHdpZHRoKTtcblx0fVxuXG5cdHJldHVybiB0cmFja192aXM7XG4gICAgfTtcblxuICAgIHZhciBfbWFudWFsX21vdmUgPSBmdW5jdGlvbiAoZmFjdG9yLCBkaXJlY3Rpb24pIHtcblx0dmFyIG9sZERvbWFpbiA9IHhTY2FsZS5kb21haW4oKTtcblxuXHR2YXIgc3BhbiA9IG9sZERvbWFpblsxXSAtIG9sZERvbWFpblswXTtcblx0dmFyIG9mZnNldCA9IChzcGFuICogZmFjdG9yKSAtIHNwYW47XG5cblx0dmFyIG5ld0RvbWFpbjtcblx0c3dpdGNoIChkaXJlY3Rpb24pIHtcblx0Y2FzZSAtMSA6XG5cdCAgICBuZXdEb21haW4gPSBbKH5+b2xkRG9tYWluWzBdIC0gb2Zmc2V0KSwgfn4ob2xkRG9tYWluWzFdIC0gb2Zmc2V0KV07XG5cdCAgICBicmVhaztcblx0Y2FzZSAxIDpcblx0ICAgIG5ld0RvbWFpbiA9IFsofn5vbGREb21haW5bMF0gKyBvZmZzZXQpLCB+fihvbGREb21haW5bMV0gLSBvZmZzZXQpXTtcblx0ICAgIGJyZWFrO1xuXHRjYXNlIDAgOlxuXHQgICAgbmV3RG9tYWluID0gW29sZERvbWFpblswXSAtIH5+KG9mZnNldC8yKSwgb2xkRG9tYWluWzFdICsgKH5+b2Zmc2V0LzIpXTtcblx0fVxuXG5cdHZhciBpbnRlcnBvbGF0b3IgPSBkMy5pbnRlcnBvbGF0ZU51bWJlcihvbGREb21haW5bMF0sIG5ld0RvbWFpblswXSk7XG5cdHZhciBlYXNlID0gZXhwb3J0cy5lYXNlO1xuXG5cdHZhciB4ID0gMDtcblx0ZDMudGltZXIoZnVuY3Rpb24oKSB7XG5cdCAgICB2YXIgY3Vycl9zdGFydCA9IGludGVycG9sYXRvcihlYXNlKHgpKTtcblx0ICAgIHZhciBjdXJyX2VuZDtcblx0ICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG5cdCAgICBjYXNlIC0xIDpcblx0XHRjdXJyX2VuZCA9IGN1cnJfc3RhcnQgKyBzcGFuO1xuXHRcdGJyZWFrO1xuXHQgICAgY2FzZSAxIDpcblx0XHRjdXJyX2VuZCA9IGN1cnJfc3RhcnQgKyBzcGFuO1xuXHRcdGJyZWFrO1xuXHQgICAgY2FzZSAwIDpcblx0XHRjdXJyX2VuZCA9IG9sZERvbWFpblsxXSArIG9sZERvbWFpblswXSAtIGN1cnJfc3RhcnQ7XG5cdFx0YnJlYWs7XG5cdCAgICB9XG5cblx0ICAgIHZhciBjdXJyRG9tYWluID0gW2N1cnJfc3RhcnQsIGN1cnJfZW5kXTtcblx0ICAgIHhTY2FsZS5kb21haW4oY3VyckRvbWFpbik7XG5cdCAgICBfbW92ZSh4U2NhbGUpO1xuXHQgICAgeCs9MC4wMjtcblx0ICAgIHJldHVybiB4PjE7XG5cdH0pO1xuICAgIH07XG5cblxuICAgIHZhciBfbW92ZV9jYmFrID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgY3VyckRvbWFpbiA9IHhTY2FsZS5kb21haW4oKTtcblx0dHJhY2tfdmlzLmZyb20ofn5jdXJyRG9tYWluWzBdKTtcblx0dHJhY2tfdmlzLnRvKH5+Y3VyckRvbWFpblsxXSk7XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0cmFja3MubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciB0cmFjayA9IHRyYWNrc1tpXTtcblx0ICAgIF91cGRhdGVfdHJhY2sodHJhY2ssIGxvYyk7XG5cdH1cbiAgICB9O1xuICAgIC8vIFRoZSBkZWZlcnJlZF9jYmFrIGlzIGRlZmVycmVkIGF0IGxlYXN0IHRoaXMgYW1vdW50IG9mIHRpbWUgb3IgcmUtc2NoZWR1bGVkIGlmIGRlZmVycmVkIGlzIGNhbGxlZCBiZWZvcmVcbiAgICB2YXIgX2RlZmVycmVkID0gZGVmZXJDYW5jZWwoX21vdmVfY2JhaywgMzAwKTtcblxuICAgIC8vIGFwaS5tZXRob2QoJ3VwZGF0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyBcdF9tb3ZlKCk7XG4gICAgLy8gfSk7XG5cbiAgICB2YXIgX21vdmUgPSBmdW5jdGlvbiAobmV3X3hTY2FsZSkge1xuXHRpZiAobmV3X3hTY2FsZSAhPT0gdW5kZWZpbmVkICYmIGRyYWdfYWxsb3dlZCkge1xuXHQgICAgem9vbUV2ZW50SGFuZGxlci54KG5ld194U2NhbGUpO1xuXHR9XG5cblx0Ly8gU2hvdyB0aGUgcmVkIGJhcnMgYXQgdGhlIGxpbWl0c1xuXHR2YXIgZG9tYWluID0geFNjYWxlLmRvbWFpbigpO1xuXHRpZiAoZG9tYWluWzBdIDw9IDUpIHtcblx0ICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQgKyBcIl81cGNhcFwiKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgY2FwX3dpZHRoKVxuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZHVyYXRpb24oMjAwKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgMCk7XG5cdH1cblxuXHRpZiAoZG9tYWluWzFdID49IChsaW1pdHMucmlnaHQpLTUpIHtcblx0ICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQgKyBcIl8zcGNhcFwiKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgY2FwX3dpZHRoKVxuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZHVyYXRpb24oMjAwKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgMCk7XG5cdH1cblxuXG5cdC8vIEF2b2lkIG1vdmluZyBwYXN0IHRoZSBsaW1pdHNcblx0aWYgKGRvbWFpblswXSA8IGxpbWl0cy5sZWZ0KSB7XG5cdCAgICB6b29tRXZlbnRIYW5kbGVyLnRyYW5zbGF0ZShbem9vbUV2ZW50SGFuZGxlci50cmFuc2xhdGUoKVswXSAtIHhTY2FsZShsaW1pdHMubGVmdCkgKyB4U2NhbGUucmFuZ2UoKVswXSwgem9vbUV2ZW50SGFuZGxlci50cmFuc2xhdGUoKVsxXV0pO1xuXHR9IGVsc2UgaWYgKGRvbWFpblsxXSA+IGxpbWl0cy5yaWdodCkge1xuXHQgICAgem9vbUV2ZW50SGFuZGxlci50cmFuc2xhdGUoW3pvb21FdmVudEhhbmRsZXIudHJhbnNsYXRlKClbMF0gLSB4U2NhbGUobGltaXRzLnJpZ2h0KSArIHhTY2FsZS5yYW5nZSgpWzFdLCB6b29tRXZlbnRIYW5kbGVyLnRyYW5zbGF0ZSgpWzFdXSk7XG5cdH1cblxuXHRfZGVmZXJyZWQoKTtcblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHRyYWNrcy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHRyYWNrID0gdHJhY2tzW2ldO1xuXHQgICAgdHJhY2suZGlzcGxheSgpLm1vdmUuY2FsbCh0cmFjayx4U2NhbGUpO1xuXHR9XG4gICAgfTtcblxuICAgIC8vIGFwaS5tZXRob2Qoe1xuICAgIC8vIFx0YWxsb3dfZHJhZyA6IGFwaV9hbGxvd19kcmFnLFxuICAgIC8vIFx0d2lkdGggICAgICA6IGFwaV93aWR0aCxcbiAgICAvLyBcdGFkZF90cmFjayAgOiBhcGlfYWRkX3RyYWNrLFxuICAgIC8vIFx0cmVvcmRlciAgICA6IGFwaV9yZW9yZGVyLFxuICAgIC8vIFx0em9vbSAgICAgICA6IGFwaV96b29tLFxuICAgIC8vIFx0bGVmdCAgICAgICA6IGFwaV9sZWZ0LFxuICAgIC8vIFx0cmlnaHQgICAgICA6IGFwaV9yaWdodCxcbiAgICAvLyBcdHN0YXJ0ICAgICAgOiBhcGlfc3RhcnRcbiAgICAvLyB9KTtcblxuICAgIC8vIEF1eGlsaWFyIGZ1bmN0aW9uc1xuICAgIGZ1bmN0aW9uIG1vdmVfdG9fZnJvbnQgKGVsZW0pIHtcblx0ZWxlbS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGVsZW0pO1xuICAgIH1cblxuICAgIHJldHVybiB0cmFja192aXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBib2FyZDtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUgKFwidG50LmFwaVwiKTtcbi8vIHZhciBlbnNlbWJsUmVzdEFQSSA9IHJlcXVpcmUoXCJ0bnQuZW5zZW1ibFwiKTtcblxuLy8gdmFyIGJvYXJkID0ge307XG4vLyBib2FyZC50cmFjayA9IHt9O1xuXG52YXIgZGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBfID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICAvLyBHZXR0ZXJzIC8gU2V0dGVyc1xuICAgIGFwaWpzIChfKVxuICAgIC8vIGxhYmVsIGlzIG5vdCB1c2VkIGF0IHRoZSBtb21lbnRcblx0LmdldHNldCAoJ2xhYmVsJywgXCJcIilcblx0LmdldHNldCAoJ2VsZW1lbnRzJywgW10pXG5cdC5nZXRzZXQgKCd1cGRhdGUnLCBmdW5jdGlvbiAoKSB7fSk7XG5cbiAgICByZXR1cm4gXztcbn07XG5cbi8vIFRoZSByZXRyaWV2ZXJzLiBUaGV5IG5lZWQgdG8gYWNjZXNzICdlbGVtZW50cydcbmRhdGEucmV0cmlldmVyID0ge307XG5cbmRhdGEucmV0cmlldmVyLnN5bmMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdXBkYXRlX3RyYWNrID0gZnVuY3Rpb24ob2JqKSB7XG5cdC8vIFwidGhpc1wiIGlzIHNldCB0byB0aGUgZGF0YSBvYmpcbiAgICAgICAgdGhpcy5lbGVtZW50cyh1cGRhdGVfdHJhY2sucmV0cmlldmVyKCkob2JqLmxvYykpO1xuICAgICAgICBvYmoub25fc3VjY2VzcygpO1xuICAgIH07XG5cbiAgICBhcGlqcyAodXBkYXRlX3RyYWNrKVxuXHQuZ2V0c2V0ICgncmV0cmlldmVyJywgZnVuY3Rpb24gKCkge30pXG5cbiAgICByZXR1cm4gdXBkYXRlX3RyYWNrO1xufTtcblxuZGF0YS5yZXRyaWV2ZXIuYXN5bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHVybCA9ICcnO1xuXG4gICAgLy8gXCJ0aGlzXCIgaXMgc2V0IHRvIHRoZSBkYXRhIG9ialxuICAgIHZhciBkYXRhX29iaiA9IHRoaXM7XG4gICAgdmFyIHVwZGF0ZV90cmFjayA9IGZ1bmN0aW9uIChvYmopIHtcblx0ZDMuanNvbih1cmwsIGZ1bmN0aW9uIChlcnIsIHJlc3ApIHtcblx0ICAgIGRhdGFfb2JqLmVsZW1lbnRzKHJlc3ApO1xuXHQgICAgb2JqLm9uX3N1Y2Nlc3MoKTtcblx0fSk7IFxuICAgIH07XG5cbiAgICBhcGlqcyAodXBkYXRlX3RyYWNrKVxuXHQuZ2V0c2V0ICgndXJsJywgJycpO1xuXG4gICAgcmV0dXJuIHVwZGF0ZV90cmFjaztcbn07XG5cblxuXG4vLyBBIHByZWRlZmluZWQgdHJhY2sgZm9yIGdlbmVzXG4vLyB0bnQudHJhY2suZGF0YS5nZW5lID0gZnVuY3Rpb24gKCkge1xuLy8gICAgIHZhciB0cmFjayA9IHRudC50cmFjay5kYXRhKCk7XG4vLyBcdC8vIC5pbmRleChcIklEXCIpO1xuXG4vLyAgICAgdmFyIHVwZGF0ZXIgPSB0bnQudHJhY2sucmV0cmlldmVyLmVuc2VtYmwoKVxuLy8gXHQuZW5kcG9pbnQoXCJyZWdpb25cIilcbi8vICAgICAvLyBUT0RPOiBJZiBzdWNjZXNzIGlzIGRlZmluZWQgaGVyZSwgbWVhbnMgdGhhdCBpdCBjYW4ndCBiZSB1c2VyLWRlZmluZWRcbi8vICAgICAvLyBpcyB0aGF0IGdvb2Q/IGVub3VnaD8gQVBJP1xuLy8gICAgIC8vIFVQREFURTogTm93IHN1Y2Nlc3MgaXMgYmFja2VkIHVwIGJ5IGFuIGFycmF5LiBTdGlsbCBkb24ndCBrbm93IGlmIHRoaXMgaXMgdGhlIGJlc3Qgb3B0aW9uXG4vLyBcdC5zdWNjZXNzKGZ1bmN0aW9uKGdlbmVzKSB7XG4vLyBcdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlbmVzLmxlbmd0aDsgaSsrKSB7XG4vLyBcdFx0aWYgKGdlbmVzW2ldLnN0cmFuZCA9PT0gLTEpIHsgIFxuLy8gXHRcdCAgICBnZW5lc1tpXS5kaXNwbGF5X2xhYmVsID0gXCI8XCIgKyBnZW5lc1tpXS5leHRlcm5hbF9uYW1lO1xuLy8gXHRcdH0gZWxzZSB7XG4vLyBcdFx0ICAgIGdlbmVzW2ldLmRpc3BsYXlfbGFiZWwgPSBnZW5lc1tpXS5leHRlcm5hbF9uYW1lICsgXCI+XCI7XG4vLyBcdFx0fVxuLy8gXHQgICAgfVxuLy8gXHR9KTtcblxuLy8gICAgIHJldHVybiB0cmFjay51cGRhdGUodXBkYXRlcik7XG4vLyB9XG5cbi8vIEEgcHJlZGVmaW5lZCB0cmFjayBkaXNwbGF5aW5nIG5vIGV4dGVybmFsIGRhdGFcbi8vIGl0IGlzIHVzZWQgZm9yIGxvY2F0aW9uIGFuZCBheGlzIHRyYWNrcyBmb3IgZXhhbXBsZVxuZGF0YS5lbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdHJhY2sgPSBkYXRhKCk7XG4gICAgdmFyIHVwZGF0ZXIgPSBkYXRhLnJldHJpZXZlci5zeW5jKCk7XG4gICAgdHJhY2sudXBkYXRlKHVwZGF0ZXIpO1xuXG4gICAgcmV0dXJuIHRyYWNrO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZGF0YTtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUgKFwidG50LmFwaVwiKTtcbnZhciBsYXlvdXQgPSByZXF1aXJlKFwiLi9sYXlvdXQuanNcIik7XG5cbi8vIEZFQVRVUkUgVklTXG4vLyB2YXIgYm9hcmQgPSB7fTtcbi8vIGJvYXJkLnRyYWNrID0ge307XG52YXIgdG50X2ZlYXR1cmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2ggKFwiY2xpY2tcIiwgXCJkYmxjbGlja1wiLCBcIm1vdXNlb3ZlclwiLCBcIm1vdXNlb3V0XCIpO1xuXG4gICAgLy8vLy8vIFZhcnMgZXhwb3NlZCBpbiB0aGUgQVBJXG4gICAgdmFyIGV4cG9ydHMgPSB7XG4gICAgICAgIGNyZWF0ZSAgIDogZnVuY3Rpb24gKCkge3Rocm93IFwiY3JlYXRlX2VsZW0gaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2UgZmVhdHVyZSBvYmplY3RcIjt9LFxuICAgICAgICBtb3ZlciAgICA6IGZ1bmN0aW9uICgpIHt0aHJvdyBcIm1vdmVfZWxlbSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBmZWF0dXJlIG9iamVjdFwiO30sXG4gICAgICAgIHVwZGF0ZXIgIDogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIGd1aWRlciAgIDogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIC8vbGF5b3V0ICAgOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgaW5kZXggICAgOiB1bmRlZmluZWQsXG4gICAgICAgIGxheW91dCAgIDogbGF5b3V0LmlkZW50aXR5KCksXG4gICAgICAgIGZvcmVncm91bmRfY29sb3IgOiAnIzAwMCdcbiAgICB9O1xuXG5cbiAgICAvLyBUaGUgcmV0dXJuZWQgb2JqZWN0XG4gICAgdmFyIGZlYXR1cmUgPSB7fTtcblxuICAgIHZhciByZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgXHR0cmFjay5nLnNlbGVjdEFsbChcIi50bnRfZWxlbVwiKS5yZW1vdmUoKTtcbiAgICAgICAgdHJhY2suZy5zZWxlY3RBbGwoXCIudG50X2d1aWRlclwiKS5yZW1vdmUoKTtcbiAgICB9O1xuXG4gICAgdmFyIGluaXQgPSBmdW5jdGlvbiAod2lkdGgpIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcblxuICAgICAgICB0cmFjay5nXG4gICAgICAgICAgICAuYXBwZW5kIChcInRleHRcIilcbiAgICAgICAgICAgIC5hdHRyIChcInhcIiwgNSlcbiAgICAgICAgICAgIC5hdHRyIChcInlcIiwgMTIpXG4gICAgICAgICAgICAuYXR0ciAoXCJmb250LXNpemVcIiwgMTEpXG4gICAgICAgICAgICAuYXR0ciAoXCJmaWxsXCIsIFwiZ3JleVwiKVxuICAgICAgICAgICAgLnRleHQgKHRyYWNrLmxhYmVsKCkpO1xuXG4gICAgICAgIGV4cG9ydHMuZ3VpZGVyLmNhbGwodHJhY2ssIHdpZHRoKTtcbiAgICB9O1xuXG4gICAgdmFyIHBsb3QgPSBmdW5jdGlvbiAobmV3X2VsZW1zLCB0cmFjaywgeFNjYWxlKSB7XG4gICAgICAgIG5ld19lbGVtcy5vbihcImNsaWNrXCIsIGRpc3BhdGNoLmNsaWNrKTtcbiAgICAgICAgbmV3X2VsZW1zLm9uKFwibW91c2VvdmVyXCIsIGRpc3BhdGNoLm1vdXNlb3Zlcik7XG4gICAgICAgIG5ld19lbGVtcy5vbihcImRibGNsaWNrXCIsIGRpc3BhdGNoLmRibGNsaWNrKTtcbiAgICAgICAgbmV3X2VsZW1zLm9uKFwibW91c2VvdXRcIiwgZGlzcGF0Y2gubW91c2VvdXQpO1xuICAgICAgICAvLyBuZXdfZWxlbSBpcyBhIGcgZWxlbWVudCB3aGVyZSB0aGUgZmVhdHVyZSBpcyBpbnNlcnRlZFxuICAgICAgICBleHBvcnRzLmNyZWF0ZS5jYWxsKHRyYWNrLCBuZXdfZWxlbXMsIHhTY2FsZSk7XG4gICAgfTtcblxuICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbiAoeFNjYWxlLCBmaWVsZCkge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB2YXIgc3ZnX2cgPSB0cmFjay5nO1xuICAgICAgICAvLyB2YXIgbGF5b3V0ID0gZXhwb3J0cy5sYXlvdXQ7XG4gICAgICAgIC8vIGlmIChsYXlvdXQuaGVpZ2h0KSB7XG4gICAgICAgIC8vICAgICBsYXlvdXQuaGVpZ2h0KHRyYWNrLmhlaWdodCgpKTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHZhciBlbGVtZW50cyA9IHRyYWNrLmRhdGEoKS5lbGVtZW50cygpO1xuXG4gICAgICAgIGlmIChmaWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlbGVtZW50cyA9IGVsZW1lbnRzW2ZpZWxkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkYXRhX2VsZW1zID0gZXhwb3J0cy5sYXlvdXQuY2FsbCh0cmFjaywgZWxlbWVudHMsIHhTY2FsZSk7XG5cbiAgICAgICAgdmFyIHZpc19zZWw7XG4gICAgICAgIHZhciB2aXNfZWxlbXM7XG4gICAgICAgIGlmIChmaWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB2aXNfc2VsID0gc3ZnX2cuc2VsZWN0QWxsKFwiLnRudF9lbGVtX1wiICsgZmllbGQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmlzX3NlbCA9IHN2Z19nLnNlbGVjdEFsbChcIi50bnRfZWxlbVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChleHBvcnRzLmluZGV4KSB7IC8vIEluZGV4aW5nIGJ5IGZpZWxkXG4gICAgICAgICAgICB2aXNfZWxlbXMgPSB2aXNfc2VsXG4gICAgICAgICAgICAgICAgLmRhdGEoZGF0YV9lbGVtcywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4cG9ydHMuaW5kZXgoZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHsgLy8gSW5kZXhpbmcgYnkgcG9zaXRpb24gaW4gYXJyYXlcbiAgICAgICAgICAgIHZpc19lbGVtcyA9IHZpc19zZWxcbiAgICAgICAgICAgICAgICAuZGF0YShkYXRhX2VsZW1zKTtcbiAgICAgICAgfVxuXG5cdGV4cG9ydHMudXBkYXRlci5jYWxsKHRyYWNrLCB2aXNfZWxlbXMsIHhTY2FsZSk7XG5cblx0dmFyIG5ld19lbGVtID0gdmlzX2VsZW1zXG5cdCAgICAuZW50ZXIoKTtcblxuXHRuZXdfZWxlbVxuXHQgICAgLmFwcGVuZChcImdcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZWxlbVwiKVxuXHQgICAgLmNsYXNzZWQoXCJ0bnRfZWxlbV9cIiArIGZpZWxkLCBmaWVsZClcblx0ICAgIC5jYWxsKGZlYXR1cmUucGxvdCwgdHJhY2ssIHhTY2FsZSk7XG5cblx0dmlzX2VsZW1zXG5cdCAgICAuZXhpdCgpXG5cdCAgICAucmVtb3ZlKCk7XG4gICAgfTtcblxuICAgIHZhciBtb3ZlID0gZnVuY3Rpb24gKHhTY2FsZSwgZmllbGQpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblx0dmFyIHN2Z19nID0gdHJhY2suZztcblx0dmFyIGVsZW1zO1xuXHQvLyBUT0RPOiBJcyBzZWxlY3RpbmcgdGhlIGVsZW1lbnRzIHRvIG1vdmUgdG9vIHNsb3c/XG5cdC8vIEl0IHdvdWxkIGJlIG5pY2UgdG8gcHJvZmlsZVxuXHRpZiAoZmllbGQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZWxlbXMgPSBzdmdfZy5zZWxlY3RBbGwoXCIudG50X2VsZW1fXCIgKyBmaWVsZCk7XG5cdH0gZWxzZSB7XG5cdCAgICBlbGVtcyA9IHN2Z19nLnNlbGVjdEFsbChcIi50bnRfZWxlbVwiKTtcblx0fVxuXG5cdGV4cG9ydHMubW92ZXIuY2FsbCh0aGlzLCBlbGVtcywgeFNjYWxlKTtcbiAgICB9O1xuXG4gICAgdmFyIG10ZiA9IGZ1bmN0aW9uIChlbGVtKSB7XG5cdGVsZW0ucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChlbGVtKTtcbiAgICB9O1xuXG4gICAgdmFyIG1vdmVfdG9fZnJvbnQgPSBmdW5jdGlvbiAoZmllbGQpIHtcblx0aWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIHZhciB0cmFjayA9IHRoaXM7XG5cdCAgICB2YXIgc3ZnX2cgPSB0cmFjay5nO1xuXHQgICAgc3ZnX2cuc2VsZWN0QWxsKFwiLnRudF9lbGVtX1wiICsgZmllbGQpXG5cdCAgICAgICAgLmVhY2goIGZ1bmN0aW9uICgpIHtcblx0XHQgICAgbXRmKHRoaXMpO1xuXHRcdH0pO1xuXHR9XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIGFwaWpzIChmZWF0dXJlKVxuXHQuZ2V0c2V0IChleHBvcnRzKVxuXHQubWV0aG9kICh7XG5cdCAgICByZXNldCAgOiByZXNldCxcblx0ICAgIHBsb3QgICA6IHBsb3QsXG5cdCAgICB1cGRhdGUgOiB1cGRhdGUsXG5cdCAgICBtb3ZlICAgOiBtb3ZlLFxuXHQgICAgaW5pdCAgIDogaW5pdCxcblx0ICAgIG1vdmVfdG9fZnJvbnQgOiBtb3ZlX3RvX2Zyb250XG5cdH0pO1xuXG4gICAgcmV0dXJuIGQzLnJlYmluZChmZWF0dXJlLCBkaXNwYXRjaCwgXCJvblwiKTtcbn07XG5cbnRudF9mZWF0dXJlLmNvbXBvc2l0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGlzcGxheXMgPSB7fTtcbiAgICB2YXIgZGlzcGxheV9vcmRlciA9IFtdO1xuXG4gICAgdmFyIGZlYXR1cmVzID0ge307XG5cbiAgICB2YXIgcmVzZXQgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdGZvciAodmFyIGk9MDsgaTxkaXNwbGF5cy5sZW5ndGg7IGkrKykge1xuXHQgICAgZGlzcGxheXNbaV0ucmVzZXQuY2FsbCh0cmFjayk7XG5cdH1cbiAgICB9O1xuXG4gICAgdmFyIGluaXQgPSBmdW5jdGlvbiAod2lkdGgpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcbiBcdGZvciAodmFyIGRpc3BsYXkgaW4gZGlzcGxheXMpIHtcblx0ICAgIGlmIChkaXNwbGF5cy5oYXNPd25Qcm9wZXJ0eShkaXNwbGF5KSkge1xuXHRcdGRpc3BsYXlzW2Rpc3BsYXldLmluaXQuY2FsbCh0cmFjaywgd2lkdGgpO1xuXHQgICAgfVxuXHR9XG4gICAgfTtcblxuICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbiAoeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdGZvciAodmFyIGk9MDsgaTxkaXNwbGF5X29yZGVyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkaXNwbGF5c1tkaXNwbGF5X29yZGVyW2ldXS51cGRhdGUuY2FsbCh0cmFjaywgeFNjYWxlLCBkaXNwbGF5X29yZGVyW2ldKTtcblx0ICAgIGRpc3BsYXlzW2Rpc3BsYXlfb3JkZXJbaV1dLm1vdmVfdG9fZnJvbnQuY2FsbCh0cmFjaywgZGlzcGxheV9vcmRlcltpXSk7XG5cdH1cblx0Ly8gZm9yICh2YXIgZGlzcGxheSBpbiBkaXNwbGF5cykge1xuXHQvLyAgICAgaWYgKGRpc3BsYXlzLmhhc093blByb3BlcnR5KGRpc3BsYXkpKSB7XG5cdC8vIFx0ZGlzcGxheXNbZGlzcGxheV0udXBkYXRlLmNhbGwodHJhY2ssIHhTY2FsZSwgZGlzcGxheSk7XG5cdC8vICAgICB9XG5cdC8vIH1cbiAgICB9O1xuXG4gICAgdmFyIG1vdmUgPSBmdW5jdGlvbiAoeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdGZvciAodmFyIGRpc3BsYXkgaW4gZGlzcGxheXMpIHtcblx0ICAgIGlmIChkaXNwbGF5cy5oYXNPd25Qcm9wZXJ0eShkaXNwbGF5KSkge1xuXHRcdGRpc3BsYXlzW2Rpc3BsYXldLm1vdmUuY2FsbCh0cmFjaywgeFNjYWxlLCBkaXNwbGF5KTtcblx0ICAgIH1cblx0fVxuICAgIH07XG5cbiAgICB2YXIgYWRkID0gZnVuY3Rpb24gKGtleSwgZGlzcGxheSkge1xuXHRkaXNwbGF5c1trZXldID0gZGlzcGxheTtcblx0ZGlzcGxheV9vcmRlci5wdXNoKGtleSk7XG5cdHJldHVybiBmZWF0dXJlcztcbiAgICB9O1xuXG4gICAgLy8gdmFyIG9uX2NsaWNrID0gZnVuY3Rpb24gKGNiYWspIHtcbiAgICAvLyAgICAgZm9yICh2YXIgZGlzcGxheSBpbiBkaXNwbGF5cykge1xuICAgIC8vICAgICAgICAgaWYgKGRpc3BsYXlzLmhhc093blByb3BlcnR5KGRpc3BsYXkpKSB7XG4gICAgLy8gICAgICAgICAgICAgZGlzcGxheXNbZGlzcGxheV0ub24oXCJjbGlja1wiLGNiYWspO1xuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICB9XG4gICAgLy8gICAgIHJldHVybiBmZWF0dXJlcztcbiAgICAvLyB9O1xuXG4gICAgdmFyIGdldF9kaXNwbGF5cyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGRzID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxkaXNwbGF5X29yZGVyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkcy5wdXNoKGRpc3BsYXlzW2Rpc3BsYXlfb3JkZXJbaV1dKTtcblx0fVxuXHRyZXR1cm4gZHM7XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIGFwaWpzIChmZWF0dXJlcylcblx0Lm1ldGhvZCAoe1xuXHQgICAgcmVzZXQgIDogcmVzZXQsXG5cdCAgICB1cGRhdGUgOiB1cGRhdGUsXG5cdCAgICBtb3ZlICAgOiBtb3ZlLFxuXHQgICAgaW5pdCAgIDogaW5pdCxcblx0ICAgIGFkZCAgICA6IGFkZCxcbi8vXHQgICAgb25fY2xpY2sgOiBvbl9jbGljayxcblx0ICAgIGRpc3BsYXlzIDogZ2V0X2Rpc3BsYXlzXG5cdH0pO1xuXG4gICAgcmV0dXJuIGZlYXR1cmVzO1xufTtcblxudG50X2ZlYXR1cmUuYXJlYSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlLmxpbmUoKTtcbiAgICB2YXIgbGluZSA9IHRudF9mZWF0dXJlLmxpbmUoKTtcblxuICAgIHZhciBhcmVhID0gZDMuc3ZnLmFyZWEoKVxuXHQuaW50ZXJwb2xhdGUobGluZS5pbnRlcnBvbGF0ZSgpKVxuXHQudGVuc2lvbihmZWF0dXJlLnRlbnNpb24oKSk7XG5cbiAgICB2YXIgZGF0YV9wb2ludHM7XG5cbiAgICB2YXIgbGluZV9jcmVhdGUgPSBmZWF0dXJlLmNyZWF0ZSgpOyAvLyBXZSAnc2F2ZScgbGluZSBjcmVhdGlvblxuICAgIGZlYXR1cmUuY3JlYXRlIChmdW5jdGlvbiAocG9pbnRzLCB4U2NhbGUpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblxuXHRpZiAoZGF0YV9wb2ludHMgIT09IHVuZGVmaW5lZCkge1xuLy9cdCAgICAgcmV0dXJuO1xuXHQgICAgdHJhY2suZy5zZWxlY3QoXCJwYXRoXCIpLnJlbW92ZSgpO1xuXHR9XG5cblx0bGluZV9jcmVhdGUuY2FsbCh0cmFjaywgcG9pbnRzLCB4U2NhbGUpO1xuXG5cdGFyZWFcblx0ICAgIC54KGxpbmUueCgpKVxuXHQgICAgLnkxKGxpbmUueSgpKVxuXHQgICAgLnkwKHRyYWNrLmhlaWdodCgpKTtcblxuXHRkYXRhX3BvaW50cyA9IHBvaW50cy5kYXRhKCk7XG5cdHBvaW50cy5yZW1vdmUoKTtcblxuXHR0cmFjay5nXG5cdCAgICAuYXBwZW5kKFwicGF0aFwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9hcmVhXCIpXG5cdCAgICAuY2xhc3NlZChcInRudF9lbGVtXCIsIHRydWUpXG5cdCAgICAuZGF0dW0oZGF0YV9wb2ludHMpXG5cdCAgICAuYXR0cihcImRcIiwgYXJlYSlcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCBkMy5yZ2IoZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yKCkpLmJyaWdodGVyKCkpO1xuXG4gICAgfSk7XG5cbiAgICB2YXIgbGluZV9tb3ZlciA9IGZlYXR1cmUubW92ZXIoKTtcbiAgICBmZWF0dXJlLm1vdmVyIChmdW5jdGlvbiAocGF0aCwgeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdGxpbmVfbW92ZXIuY2FsbCh0cmFjaywgcGF0aCwgeFNjYWxlKTtcblxuXHRhcmVhLngobGluZS54KCkpO1xuXHR0cmFjay5nXG5cdCAgICAuc2VsZWN0KFwiLnRudF9hcmVhXCIpXG5cdCAgICAuZGF0dW0oZGF0YV9wb2ludHMpXG5cdCAgICAuYXR0cihcImRcIiwgYXJlYSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcblxufTtcblxudG50X2ZlYXR1cmUubGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlKCk7XG5cbiAgICB2YXIgeCA9IGZ1bmN0aW9uIChkKSB7XG5cdHJldHVybiBkLnBvcztcbiAgICB9O1xuICAgIHZhciB5ID0gZnVuY3Rpb24gKGQpIHtcblx0cmV0dXJuIGQudmFsO1xuICAgIH07XG4gICAgdmFyIHRlbnNpb24gPSAwLjc7XG4gICAgdmFyIHlTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpO1xuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuXHQuaW50ZXJwb2xhdGUoXCJiYXNpc1wiKTtcblxuICAgIC8vIGxpbmUgZ2V0dGVyLiBUT0RPOiBTZXR0ZXI/XG4gICAgZmVhdHVyZS5saW5lID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gbGluZTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS54ID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4geDtcblx0fVxuXHR4ID0gY2Jhaztcblx0cmV0dXJuIGZlYXR1cmU7XG4gICAgfTtcblxuICAgIGZlYXR1cmUueSA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHk7XG5cdH1cblx0eSA9IGNiYWs7XG5cdHJldHVybiBmZWF0dXJlO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLnRlbnNpb24gPSBmdW5jdGlvbiAodCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB0ZW5zaW9uO1xuXHR9XG5cdHRlbnNpb24gPSB0O1xuXHRyZXR1cm4gZmVhdHVyZTtcbiAgICB9O1xuXG4gICAgdmFyIGRhdGFfcG9pbnRzO1xuXG4gICAgLy8gRm9yIG5vdywgY3JlYXRlIGlzIGEgb25lLW9mZiBldmVudFxuICAgIC8vIFRPRE86IE1ha2UgaXQgd29yayB3aXRoIHBhcnRpYWwgcGF0aHMsIGllLiBjcmVhdGluZyBhbmQgZGlzcGxheWluZyBvbmx5IHRoZSBwYXRoIHRoYXQgaXMgYmVpbmcgZGlzcGxheWVkXG4gICAgZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChwb2ludHMsIHhTY2FsZSkge1xuXHR2YXIgdHJhY2sgPSB0aGlzO1xuXG5cdGlmIChkYXRhX3BvaW50cyAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAvLyByZXR1cm47XG5cdCAgICB0cmFjay5nLnNlbGVjdChcInBhdGhcIikucmVtb3ZlKCk7XG5cdH1cblxuXHRsaW5lXG5cdCAgICAudGVuc2lvbih0ZW5zaW9uKVxuXHQgICAgLngoZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4geFNjYWxlKHgoZCkpO1xuXHQgICAgfSlcblx0ICAgIC55KGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIHRyYWNrLmhlaWdodCgpIC0geVNjYWxlKHkoZCkpO1xuXHQgICAgfSlcblxuXHRkYXRhX3BvaW50cyA9IHBvaW50cy5kYXRhKCk7XG5cdHBvaW50cy5yZW1vdmUoKTtcblxuXHR5U2NhbGVcblx0ICAgIC5kb21haW4oWzAsIDFdKVxuXHQgICAgLy8gLmRvbWFpbihbMCwgZDMubWF4KGRhdGFfcG9pbnRzLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgLy8gXHRyZXR1cm4geShkKTtcblx0ICAgIC8vIH0pXSlcblx0ICAgIC5yYW5nZShbMCwgdHJhY2suaGVpZ2h0KCkgLSAyXSk7XG5cblx0dHJhY2suZ1xuXHQgICAgLmFwcGVuZChcInBhdGhcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZWxlbVwiKVxuXHQgICAgLmF0dHIoXCJkXCIsIGxpbmUoZGF0YV9wb2ludHMpKVxuXHQgICAgLnN0eWxlKFwic3Ryb2tlXCIsIGZlYXR1cmUuZm9yZWdyb3VuZF9jb2xvcigpKVxuXHQgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDQpXG5cdCAgICAuc3R5bGUoXCJmaWxsXCIsIFwibm9uZVwiKTtcblxuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlciAoZnVuY3Rpb24gKHBhdGgsIHhTY2FsZSkge1xuXHR2YXIgdHJhY2sgPSB0aGlzO1xuXG5cdGxpbmUueChmdW5jdGlvbiAoZCkge1xuXHQgICAgcmV0dXJuIHhTY2FsZSh4KGQpKVxuXHR9KTtcblx0dHJhY2suZy5zZWxlY3QoXCJwYXRoXCIpXG5cdCAgICAuYXR0cihcImRcIiwgbGluZShkYXRhX3BvaW50cykpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG50bnRfZmVhdHVyZS5jb25zZXJ2YXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gJ0luaGVyaXQnIGZyb20gZmVhdHVyZS5hcmVhXG4gICAgdmFyIGZlYXR1cmUgPSB0bnRfZmVhdHVyZS5hcmVhKCk7XG5cbiAgICB2YXIgYXJlYV9jcmVhdGUgPSBmZWF0dXJlLmNyZWF0ZSgpOyAvLyBXZSAnc2F2ZScgYXJlYSBjcmVhdGlvblxuICAgIGZlYXR1cmUuY3JlYXRlICAoZnVuY3Rpb24gKHBvaW50cywgeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cblx0YXJlYV9jcmVhdGUuY2FsbCh0cmFjaywgZDMuc2VsZWN0KHBvaW50c1swXVswXSksIHhTY2FsZSlcbiAgICB9KTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxudG50X2ZlYXR1cmUuZW5zZW1ibCA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyAnSW5oZXJpdCcgZnJvbSBib2FyZC50cmFjay5mZWF0dXJlXG4gICAgdmFyIGZlYXR1cmUgPSB0bnRfZmVhdHVyZSgpO1xuXG4gICAgdmFyIGZvcmVncm91bmRfY29sb3IyID0gXCIjN0ZGRjAwXCI7XG4gICAgdmFyIGZvcmVncm91bmRfY29sb3IzID0gXCIjMDBCQjAwXCI7XG5cbiAgICBmZWF0dXJlLmd1aWRlciAoZnVuY3Rpb24gKHdpZHRoKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdHZhciBoZWlnaHRfb2Zmc2V0ID0gfn4odHJhY2suaGVpZ2h0KCkgLSAodHJhY2suaGVpZ2h0KCkgICogMC44KSkgLyAyO1xuXG5cdHRyYWNrLmdcblx0ICAgIC5hcHBlbmQoXCJsaW5lXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2d1aWRlclwiKVxuXHQgICAgLmF0dHIoXCJ4MVwiLCAwKVxuXHQgICAgLmF0dHIoXCJ4MlwiLCB3aWR0aClcblx0ICAgIC5hdHRyKFwieTFcIiwgaGVpZ2h0X29mZnNldClcblx0ICAgIC5hdHRyKFwieTJcIiwgaGVpZ2h0X29mZnNldClcblx0ICAgIC5zdHlsZShcInN0cm9rZVwiLCBmZWF0dXJlLmZvcmVncm91bmRfY29sb3IoKSlcblx0ICAgIC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCAxKTtcblxuXHR0cmFjay5nXG5cdCAgICAuYXBwZW5kKFwibGluZVwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ndWlkZXJcIilcblx0ICAgIC5hdHRyKFwieDFcIiwgMClcblx0ICAgIC5hdHRyKFwieDJcIiwgd2lkdGgpXG5cdCAgICAuYXR0cihcInkxXCIsIHRyYWNrLmhlaWdodCgpIC0gaGVpZ2h0X29mZnNldClcblx0ICAgIC5hdHRyKFwieTJcIiwgdHJhY2suaGVpZ2h0KCkgLSBoZWlnaHRfb2Zmc2V0KVxuXHQgICAgLnN0eWxlKFwic3Ryb2tlXCIsIGZlYXR1cmUuZm9yZWdyb3VuZF9jb2xvcigpKVxuXHQgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDEpO1xuXG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKG5ld19lbGVtcywgeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cblx0dmFyIGhlaWdodF9vZmZzZXQgPSB+fih0cmFjay5oZWlnaHQoKSAtICh0cmFjay5oZWlnaHQoKSAgKiAwLjgpKSAvIDI7XG5cblx0bmV3X2VsZW1zXG5cdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIHhTY2FsZSAoZC5zdGFydCk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ5XCIsIGhlaWdodF9vZmZzZXQpXG4vLyBcdCAgICAuYXR0cihcInJ4XCIsIDMpXG4vLyBcdCAgICAuYXR0cihcInJ5XCIsIDMpXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuICh4U2NhbGUoZC5lbmQpIC0geFNjYWxlKGQuc3RhcnQpKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCB0cmFjay5oZWlnaHQoKSAtIH5+KGhlaWdodF9vZmZzZXQgKiAyKSlcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCB0cmFjay5iYWNrZ3JvdW5kX2NvbG9yKCkpXG5cdCAgICAudHJhbnNpdGlvbigpXG5cdCAgICAuZHVyYXRpb24oNTAwKVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQudHlwZSA9PT0gJ2hpZ2gnKSB7XG5cdFx0ICAgIHJldHVybiBkMy5yZ2IoZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yKCkpO1xuXHRcdH1cblx0XHRpZiAoZC50eXBlID09PSAnbG93Jykge1xuXHRcdCAgICByZXR1cm4gZDMucmdiKGZlYXR1cmUuZm9yZWdyb3VuZF9jb2xvcjIoKSk7XG5cdFx0fVxuXHRcdHJldHVybiBkMy5yZ2IoZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yMygpKTtcblx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS51cGRhdGVyIChmdW5jdGlvbiAoYmxvY2tzLCB4U2NhbGUpIHtcblx0YmxvY2tzXG5cdCAgICAuc2VsZWN0KFwicmVjdFwiKVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAoeFNjYWxlKGQuZW5kKSAtIHhTY2FsZShkLnN0YXJ0KSlcblx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlciAoZnVuY3Rpb24gKGJsb2NrcywgeFNjYWxlKSB7XG5cdGJsb2Nrc1xuXHQgICAgLnNlbGVjdChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiB4U2NhbGUoZC5zdGFydCk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAoeFNjYWxlKGQuZW5kKSAtIHhTY2FsZShkLnN0YXJ0KSk7XG5cdCAgICB9KTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUuZm9yZWdyb3VuZF9jb2xvcjIgPSBmdW5jdGlvbiAoY29sKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGZvcmVncm91bmRfY29sb3IyO1xuXHR9XG5cdGZvcmVncm91bmRfY29sb3IyID0gY29sO1xuXHRyZXR1cm4gZmVhdHVyZTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yMyA9IGZ1bmN0aW9uIChjb2wpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gZm9yZWdyb3VuZF9jb2xvcjM7XG5cdH1cblx0Zm9yZWdyb3VuZF9jb2xvcjMgPSBjb2w7XG5cdHJldHVybiBmZWF0dXJlO1xuICAgIH07XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcbn07XG5cbnRudF9mZWF0dXJlLnZsaW5lID0gZnVuY3Rpb24gKCkge1xuICAgIC8vICdJbmhlcml0JyBmcm9tIGZlYXR1cmVcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlKCk7XG5cbiAgICBmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKG5ld19lbGVtcywgeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdG5ld19lbGVtc1xuXHQgICAgLmFwcGVuZCAoXCJsaW5lXCIpXG5cdCAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0Ly8gVE9ETzogU2hvdWxkIHVzZSB0aGUgaW5kZXggdmFsdWU/XG5cdFx0cmV0dXJuIHhTY2FsZShmZWF0dXJlLmluZGV4KCkoZCkpXG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiB4U2NhbGUoZmVhdHVyZS5pbmRleCgpKGQpKVxuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwieTFcIiwgMClcblx0ICAgIC5hdHRyKFwieTJcIiwgdHJhY2suaGVpZ2h0KCkpXG5cdCAgICAuYXR0cihcInN0cm9rZVwiLCBmZWF0dXJlLmZvcmVncm91bmRfY29sb3IoKSlcblx0ICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDEpO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlciAoZnVuY3Rpb24gKHZsaW5lcywgeFNjYWxlKSB7XG5cdHZsaW5lc1xuXHQgICAgLnNlbGVjdChcImxpbmVcIilcblx0ICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4geFNjYWxlKGZlYXR1cmUuaW5kZXgoKShkKSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiB4U2NhbGUoZmVhdHVyZS5pbmRleCgpKGQpKTtcblx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG5cbn07XG5cbnRudF9mZWF0dXJlLnBpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyAnSW5oZXJpdCcgZnJvbSBib2FyZC50cmFjay5mZWF0dXJlXG4gICAgdmFyIGZlYXR1cmUgPSB0bnRfZmVhdHVyZSgpO1xuXG4gICAgdmFyIHlTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG5cdC5kb21haW4oWzAsMF0pXG5cdC5yYW5nZShbMCwwXSk7XG5cbiAgICB2YXIgb3B0cyA9IHtcbiAgICAgICAgcG9zIDogZDMuZnVuY3RvcihcInBvc1wiKSxcbiAgICAgICAgdmFsIDogZDMuZnVuY3RvcihcInZhbFwiKSxcbiAgICAgICAgZG9tYWluIDogWzAsMF1cbiAgICB9O1xuXG4gICAgdmFyIHBpbl9iYWxsX3IgPSA1OyAvLyB0aGUgcmFkaXVzIG9mIHRoZSBjaXJjbGUgaW4gdGhlIHBpblxuXG4gICAgYXBpanMoZmVhdHVyZSlcbiAgICAgICAgLmdldHNldChvcHRzKTtcblxuXG4gICAgZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChuZXdfcGlucywgeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdHlTY2FsZVxuXHQgICAgLmRvbWFpbihmZWF0dXJlLmRvbWFpbigpKVxuXHQgICAgLnJhbmdlKFtwaW5fYmFsbF9yLCB0cmFjay5oZWlnaHQoKS1waW5fYmFsbF9yLTEwXSk7IC8vIDEwIGZvciBsYWJlbGxpbmdcblxuXHQvLyBwaW5zIGFyZSBjb21wb3NlZCBvZiBsaW5lcywgY2lyY2xlcyBhbmQgbGFiZWxzXG5cdG5ld19waW5zXG5cdCAgICAuYXBwZW5kKFwibGluZVwiKVxuXHQgICAgLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbiAoZCwgaSkge1xuXHQgICAgXHRyZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKVxuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIFx0cmV0dXJuIHRyYWNrLmhlaWdodCgpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24gKGQsaSkge1xuXHQgICAgXHRyZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG5cdCAgICBcdHJldHVybiB0cmFjay5oZWlnaHQoKSAtIHlTY2FsZShkW29wdHMudmFsKGQsIGkpXSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yKCkpO1xuXG5cdG5ld19waW5zXG5cdCAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG5cdCAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJhY2suaGVpZ2h0KCkgLSB5U2NhbGUoZFtvcHRzLnZhbChkLCBpKV0pO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiclwiLCBwaW5fYmFsbF9yKVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIGZlYXR1cmUuZm9yZWdyb3VuZF9jb2xvcigpKTtcblxuICAgIG5ld19waW5zXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiZm9udC1zaXplXCIsIFwiMTNcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4gMTA7XG4gICAgICAgIH0pXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZC5sYWJlbCB8fCBcIlwiO1xuICAgICAgICB9KVxuXG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLnVwZGF0ZXIgKGZ1bmN0aW9uIChwaW5zLCB4U2NhbGUpe1xuICAgICAgICBwaW5zXG4gICAgICAgICAgICAuc2VsZWN0KFwidGV4dFwiKVxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5sYWJlbCB8fCBcIlwiO1xuICAgICAgICAgICAgfSlcbiAgICB9KTtcblxuICAgIGZlYXR1cmUubW92ZXIoZnVuY3Rpb24gKHBpbnMsIHhTY2FsZSkge1xuXHR2YXIgdHJhY2sgPSB0aGlzO1xuXHRwaW5zXG5cdCAgICAvLy5lYWNoKHBvc2l0aW9uX3Bpbl9saW5lKVxuXHQgICAgLnNlbGVjdChcImxpbmVcIilcblx0ICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24gKGQsIGkpIHtcblx0XHRyZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKVxuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gdHJhY2suaGVpZ2h0KCk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbiAoZCxpKSB7XG5cdFx0cmV0dXJuIHhTY2FsZShkW29wdHMucG9zKGQsIGkpXSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbiAoZCwgaSkge1xuXHRcdHJldHVybiB0cmFjay5oZWlnaHQoKSAtIHlTY2FsZShkW29wdHMudmFsKGQsIGkpXSk7XG5cdCAgICB9KTtcblxuXHRwaW5zXG5cdCAgICAuc2VsZWN0KFwiY2lyY2xlXCIpXG5cdCAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJhY2suaGVpZ2h0KCkgLSB5U2NhbGUoZFtvcHRzLnZhbChkLCBpKV0pO1xuXHQgICAgfSk7XG5cbiAgICBwaW5zXG4gICAgICAgIC5zZWxlY3QoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShkW29wdHMucG9zKGQsIGkpXSk7XG4gICAgICAgIH0pXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZC5sYWJlbCB8fCBcIlwiO1xuICAgICAgICB9KVxuXG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLmd1aWRlciAoZnVuY3Rpb24gKHdpZHRoKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdHRyYWNrLmdcblx0ICAgIC5hcHBlbmQoXCJsaW5lXCIpXG5cdCAgICAuYXR0cihcIngxXCIsIDApXG5cdCAgICAuYXR0cihcIngyXCIsIHdpZHRoKVxuXHQgICAgLmF0dHIoXCJ5MVwiLCB0cmFjay5oZWlnaHQoKSlcblx0ICAgIC5hdHRyKFwieTJcIiwgdHJhY2suaGVpZ2h0KCkpXG5cdCAgICAuc3R5bGUoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuXHQgICAgLnN0eWxlKFwic3Ryb2tlLXdpdGhcIiwgXCIxcHhcIik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcbn07XG5cbnRudF9mZWF0dXJlLmJsb2NrID0gZnVuY3Rpb24gKCkge1xuICAgIC8vICdJbmhlcml0JyBmcm9tIGJvYXJkLnRyYWNrLmZlYXR1cmVcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlKCk7XG5cbiAgICBhcGlqcyhmZWF0dXJlKVxuXHQuZ2V0c2V0KCdmcm9tJywgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHJldHVybiBkLnN0YXJ0O1xuXHR9KVxuXHQuZ2V0c2V0KCd0bycsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICByZXR1cm4gZC5lbmQ7XG5cdH0pO1xuXG4gICAgZmVhdHVyZS5jcmVhdGUoZnVuY3Rpb24gKG5ld19lbGVtcywgeFNjYWxlKSB7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdG5ld19lbGVtc1xuXHQgICAgLmFwcGVuZChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCwgaSkge1xuXHRcdC8vIFRPRE86IHN0YXJ0LCBlbmQgc2hvdWxkIGJlIGFkanVzdGFibGUgdmlhIHRoZSB0cmFja3MgQVBJXG5cdFx0cmV0dXJuIHhTY2FsZShmZWF0dXJlLmZyb20oKShkLCBpKSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ5XCIsIDApXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG5cdFx0cmV0dXJuICh4U2NhbGUoZmVhdHVyZS50bygpKGQsIGkpKSAtIHhTY2FsZShmZWF0dXJlLmZyb20oKShkLCBpKSkpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHRyYWNrLmhlaWdodCgpKVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmJhY2tncm91bmRfY29sb3IoKSlcblx0ICAgIC50cmFuc2l0aW9uKClcblx0ICAgIC5kdXJhdGlvbig1MDApXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC5jb2xvciA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHJldHVybiBmZWF0dXJlLmZvcmVncm91bmRfY29sb3IoKTtcblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gZC5jb2xvcjtcblx0XHR9XG5cdCAgICB9KTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUudXBkYXRlcihmdW5jdGlvbiAoZWxlbXMsIHhTY2FsZSkge1xuXHRlbGVtc1xuXHQgICAgLnNlbGVjdChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLm1vdmVyKGZ1bmN0aW9uIChibG9ja3MsIHhTY2FsZSkge1xuXHRibG9ja3Ncblx0ICAgIC5zZWxlY3QoXCJyZWN0XCIpXG5cdCAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4geFNjYWxlKGQuc3RhcnQpO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcblxufTtcblxudG50X2ZlYXR1cmUuYXhpcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgeEF4aXM7XG4gICAgdmFyIG9yaWVudGF0aW9uID0gXCJ0b3BcIjtcblxuICAgIC8vIEF4aXMgZG9lc24ndCBpbmhlcml0IGZyb20gZmVhdHVyZVxuICAgIHZhciBmZWF0dXJlID0ge307XG4gICAgZmVhdHVyZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcblx0eEF4aXMgPSB1bmRlZmluZWQ7XG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdHRyYWNrLmcuc2VsZWN0QWxsKFwicmVjdFwiKS5yZW1vdmUoKTtcblx0dHJhY2suZy5zZWxlY3RBbGwoXCIudGlja1wiKS5yZW1vdmUoKTtcbiAgICB9O1xuICAgIGZlYXR1cmUucGxvdCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIGZlYXR1cmUubW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblx0dmFyIHN2Z19nID0gdHJhY2suZztcblx0c3ZnX2cuY2FsbCh4QXhpcyk7XG4gICAgfVxuXG4gICAgZmVhdHVyZS5pbml0ID0gZnVuY3Rpb24gKCkge307XG5cbiAgICBmZWF0dXJlLnVwZGF0ZSA9IGZ1bmN0aW9uICh4U2NhbGUpIHtcblx0Ly8gQ3JlYXRlIEF4aXMgaWYgaXQgZG9lc24ndCBleGlzdFxuXHRpZiAoeEF4aXMgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgeEF4aXMgPSBkMy5zdmcuYXhpcygpXG5cdFx0LnNjYWxlKHhTY2FsZSlcblx0XHQub3JpZW50KG9yaWVudGF0aW9uKTtcblx0fVxuXG5cdHZhciB0cmFjayA9IHRoaXM7XG5cdHZhciBzdmdfZyA9IHRyYWNrLmc7XG5cdHN2Z19nLmNhbGwoeEF4aXMpO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLm9yaWVudGF0aW9uID0gZnVuY3Rpb24gKHBvcykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBvcmllbnRhdGlvbjtcblx0fVxuXHRvcmllbnRhdGlvbiA9IHBvcztcblx0cmV0dXJuIGZlYXR1cmU7XG4gICAgfTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxudG50X2ZlYXR1cmUubG9jYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJvdztcblxuICAgIHZhciBmZWF0dXJlID0ge307XG4gICAgZmVhdHVyZS5yZXNldCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIGZlYXR1cmUucGxvdCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIGZlYXR1cmUuaW5pdCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIGZlYXR1cmUubW92ZSA9IGZ1bmN0aW9uKHhTY2FsZSkge1xuXHR2YXIgZG9tYWluID0geFNjYWxlLmRvbWFpbigpO1xuXHRyb3cuc2VsZWN0KFwidGV4dFwiKVxuXHQgICAgLnRleHQoXCJMb2NhdGlvbjogXCIgKyB+fmRvbWFpblswXSArIFwiLVwiICsgfn5kb21haW5bMV0pO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLnVwZGF0ZSA9IGZ1bmN0aW9uICh4U2NhbGUpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblx0dmFyIHN2Z19nID0gdHJhY2suZztcblx0dmFyIGRvbWFpbiA9IHhTY2FsZS5kb21haW4oKTtcblx0aWYgKHJvdyA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByb3cgPSBzdmdfZztcblx0ICAgIHJvd1xuXHRcdC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdFx0LnRleHQoXCJMb2NhdGlvbjogXCIgKyB+fmRvbWFpblswXSArIFwiLVwiICsgfn5kb21haW5bMV0pO1xuXHR9XG4gICAgfTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X2ZlYXR1cmU7XG4iLCJ2YXIgYm9hcmQgPSByZXF1aXJlIChcIi4vYm9hcmQuanNcIik7XG5ib2FyZC50cmFjayA9IHJlcXVpcmUgKFwiLi90cmFja1wiKTtcbmJvYXJkLnRyYWNrLmRhdGEgPSByZXF1aXJlIChcIi4vZGF0YS5qc1wiKTtcbmJvYXJkLnRyYWNrLmxheW91dCA9IHJlcXVpcmUgKFwiLi9sYXlvdXQuanNcIik7XG5ib2FyZC50cmFjay5mZWF0dXJlID0gcmVxdWlyZSAoXCIuL2ZlYXR1cmUuanNcIik7XG5ib2FyZC50cmFjay5sYXlvdXQgPSByZXF1aXJlIChcIi4vbGF5b3V0LmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBib2FyZDtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUgKFwidG50LmFwaVwiKTtcblxuLy8gdmFyIGJvYXJkID0ge307XG4vLyBib2FyZC50cmFjayA9IHt9O1xudmFyIGxheW91dCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIC8vIFRoZSByZXR1cm5lZCBjbG9zdXJlIC8gb2JqZWN0XG4gICAgdmFyIGwgPSBmdW5jdGlvbiAobmV3X2VsZW1zLCB4U2NhbGUpICB7XG4gICAgICAgIHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIGwuZWxlbWVudHMoKS5jYWxsKHRyYWNrLCBuZXdfZWxlbXMsIHhTY2FsZSk7XG4gICAgICAgIHJldHVybiBuZXdfZWxlbXM7XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyhsKVxuICAgICAgICAuZ2V0c2V0ICgnZWxlbWVudHMnLCBmdW5jdGlvbiAoKSB7fSlcbiAgICAgICAgLm1ldGhvZCAoe1xuICAgICAgICAgICAgaGVpZ2h0IDogZnVuY3Rpb24gKCkge31cbiAgICAgICAgfSk7XG5cbiAgICByZXR1cm4gbDtcbn07XG5cbmxheW91dC5pZGVudGl0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gbGF5b3V0KClcbiAgICAgICAgLmVsZW1lbnRzIChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGU7XG4gICAgICAgIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gbGF5b3V0O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZSAoXCJ0bnQuYXBpXCIpO1xudmFyIGl0ZXJhdG9yID0gcmVxdWlyZShcInRudC51dGlsc1wiKS5pdGVyYXRvcjtcblxuLy92YXIgYm9hcmQgPSB7fTtcblxudmFyIHRyYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIHJlYWRfY29uZiA9IHtcblx0Ly8gVW5pcXVlIElEIGZvciB0aGlzIHRyYWNrXG5cdGlkIDogdHJhY2suaWQoKVxuICAgIH07XG5cbiAgICB2YXIgZGlzcGxheTtcblxuICAgIHZhciBjb25mID0ge1xuXHQvLyBmb3JlZ3JvdW5kX2NvbG9yIDogZDMucmdiKCcjMDAwMDAwJyksXG5cdGJhY2tncm91bmRfY29sb3IgOiBkMy5yZ2IoJyNDQ0NDQ0MnKSxcblx0aGVpZ2h0ICAgICAgICAgICA6IDI1MCxcblx0Ly8gZGF0YSBpcyB0aGUgb2JqZWN0IChub3JtYWxseSBhIHRudC50cmFjay5kYXRhIG9iamVjdCkgdXNlZCB0byByZXRyaWV2ZSBhbmQgdXBkYXRlIGRhdGEgZm9yIHRoZSB0cmFja1xuXHRkYXRhICAgICAgICAgICAgIDogdHJhY2suZGF0YS5lbXB0eSgpLFxuICAgIGxhYmVsICAgICAgICAgICAgIDogXCJcIlxuICAgIH07XG5cbiAgICAvLyBUaGUgcmV0dXJuZWQgb2JqZWN0IC8gY2xvc3VyZVxuICAgIHZhciBfID0gZnVuY3Rpb24oKSB7XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIHZhciBhcGkgPSBhcGlqcyAoXylcblx0LmdldHNldCAoY29uZilcblx0LmdldCAocmVhZF9jb25mKTtcblxuICAgIC8vIFRPRE86IFRoaXMgbWVhbnMgdGhhdCBoZWlnaHQgc2hvdWxkIGJlIGRlZmluZWQgYmVmb3JlIGRpc3BsYXlcbiAgICAvLyB3ZSBzaG91bGRuJ3QgcmVseSBvbiB0aGlzXG4gICAgXy5kaXNwbGF5ID0gZnVuY3Rpb24gKG5ld19wbG90dGVyKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGRpc3BsYXk7XG5cdH1cblx0ZGlzcGxheSA9IG5ld19wbG90dGVyO1xuXHRpZiAodHlwZW9mIChkaXNwbGF5KSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgZGlzcGxheS5sYXlvdXQgJiYgZGlzcGxheS5sYXlvdXQoKS5oZWlnaHQoY29uZi5oZWlnaHQpO1xuXHR9IGVsc2Uge1xuXHQgICAgZm9yICh2YXIga2V5IGluIGRpc3BsYXkpIHtcblx0XHRpZiAoZGlzcGxheS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0ICAgIGRpc3BsYXlba2V5XS5sYXlvdXQgJiYgZGlzcGxheVtrZXldLmxheW91dCgpLmhlaWdodChjb25mLmhlaWdodCk7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cblx0cmV0dXJuIF87XG4gICAgfTtcblxuICAgIHJldHVybiBfO1xuXG59O1xuXG50cmFjay5pZCA9IGl0ZXJhdG9yKDEpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmFjaztcbiIsIm1vZHVsZS5leHBvcnRzID0gdG50X2Vuc2VtYmwgPSByZXF1aXJlKFwiLi9zcmMvcmVzdC5qc1wiKTtcbiIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwpe1xuLyohXG4gKiBAb3ZlcnZpZXcgZXM2LXByb21pc2UgLSBhIHRpbnkgaW1wbGVtZW50YXRpb24gb2YgUHJvbWlzZXMvQSsuXG4gKiBAY29weXJpZ2h0IENvcHlyaWdodCAoYykgMjAxNCBZZWh1ZGEgS2F0eiwgVG9tIERhbGUsIFN0ZWZhbiBQZW5uZXIgYW5kIGNvbnRyaWJ1dG9ycyAoQ29udmVyc2lvbiB0byBFUzYgQVBJIGJ5IEpha2UgQXJjaGliYWxkKVxuICogQGxpY2Vuc2UgICBMaWNlbnNlZCB1bmRlciBNSVQgbGljZW5zZVxuICogICAgICAgICAgICBTZWUgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2pha2VhcmNoaWJhbGQvZXM2LXByb21pc2UvbWFzdGVyL0xJQ0VOU0VcbiAqIEB2ZXJzaW9uICAgMi4zLjBcbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRvYmplY3RPckZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJyB8fCAodHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGwpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdmdW5jdGlvbic7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc01heWJlVGhlbmFibGUoeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnb2JqZWN0JyAmJiB4ICE9PSBudWxsO1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5O1xuICAgIGlmICghQXJyYXkuaXNBcnJheSkge1xuICAgICAgbGliJGVzNiRwcm9taXNlJHV0aWxzJCRfaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0FycmF5ID0gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRfaXNBcnJheTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiA9IDA7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkdmVydHhOZXh0O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkY3VzdG9tU2NoZWR1bGVyRm47XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAgPSBmdW5jdGlvbiBhc2FwKGNhbGxiYWNrLCBhcmcpIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuXSA9IGNhbGxiYWNrO1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2xpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gKyAxXSA9IGFyZztcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gKz0gMjtcbiAgICAgIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuID09PSAyKSB7XG4gICAgICAgIC8vIElmIGxlbiBpcyAyLCB0aGF0IG1lYW5zIHRoYXQgd2UgbmVlZCB0byBzY2hlZHVsZSBhbiBhc3luYyBmbHVzaC5cbiAgICAgICAgLy8gSWYgYWRkaXRpb25hbCBjYWxsYmFja3MgYXJlIHF1ZXVlZCBiZWZvcmUgdGhlIHF1ZXVlIGlzIGZsdXNoZWQsIHRoZXlcbiAgICAgICAgLy8gd2lsbCBiZSBwcm9jZXNzZWQgYnkgdGhpcyBmbHVzaCB0aGF0IHdlIGFyZSBzY2hlZHVsaW5nLlxuICAgICAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGN1c3RvbVNjaGVkdWxlckZuKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGN1c3RvbVNjaGVkdWxlckZuKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2goKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzZXRTY2hlZHVsZXIoc2NoZWR1bGVGbikge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGN1c3RvbVNjaGVkdWxlckZuID0gc2NoZWR1bGVGbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0QXNhcChhc2FwRm4pIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwID0gYXNhcEZuO1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3NlcldpbmRvdyA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cgOiB1bmRlZmluZWQ7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyR2xvYmFsID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgfHwge307XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlciA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyR2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIgfHwgbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJHbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGlzTm9kZSA9IHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiB7fS50b1N0cmluZy5jYWxsKHByb2Nlc3MpID09PSAnW29iamVjdCBwcm9jZXNzXSc7XG5cbiAgICAvLyB0ZXN0IGZvciB3ZWIgd29ya2VyIGJ1dCBub3QgaW4gSUUxMFxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNXb3JrZXIgPSB0eXBlb2YgVWludDhDbGFtcGVkQXJyYXkgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICB0eXBlb2YgaW1wb3J0U2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIHR5cGVvZiBNZXNzYWdlQ2hhbm5lbCAhPT0gJ3VuZGVmaW5lZCc7XG5cbiAgICAvLyBub2RlXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU5leHRUaWNrKCkge1xuICAgICAgdmFyIG5leHRUaWNrID0gcHJvY2Vzcy5uZXh0VGljaztcbiAgICAgIC8vIG5vZGUgdmVyc2lvbiAwLjEwLnggZGlzcGxheXMgYSBkZXByZWNhdGlvbiB3YXJuaW5nIHdoZW4gbmV4dFRpY2sgaXMgdXNlZCByZWN1cnNpdmVseVxuICAgICAgLy8gc2V0SW1tZWRpYXRlIHNob3VsZCBiZSB1c2VkIGluc3RlYWQgaW5zdGVhZFxuICAgICAgdmFyIHZlcnNpb24gPSBwcm9jZXNzLnZlcnNpb25zLm5vZGUubWF0Y2goL14oPzooXFxkKylcXC4pPyg/OihcXGQrKVxcLik/KFxcKnxcXGQrKSQvKTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZlcnNpb24pICYmIHZlcnNpb25bMV0gPT09ICcwJyAmJiB2ZXJzaW9uWzJdID09PSAnMTAnKSB7XG4gICAgICAgIG5leHRUaWNrID0gc2V0SW1tZWRpYXRlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBuZXh0VGljayhsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyB2ZXJ0eFxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VWZXJ0eFRpbWVyKCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkdmVydHhOZXh0KGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNdXRhdGlvbk9ic2VydmVyKCkge1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgdmFyIG9ic2VydmVyID0gbmV3IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlcihsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gpO1xuICAgICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBub2RlLmRhdGEgPSAoaXRlcmF0aW9ucyA9ICsraXRlcmF0aW9ucyAlIDIpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyB3ZWIgd29ya2VyXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU1lc3NhZ2VDaGFubmVsKCkge1xuICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldFRpbWVvdXQobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoLCAxKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZSA9IG5ldyBBcnJheSgxMDAwKTtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2goKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW47IGkrPTIpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2ldO1xuICAgICAgICB2YXIgYXJnID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2krMV07XG5cbiAgICAgICAgY2FsbGJhY2soYXJnKTtcblxuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpKzFdID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuID0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXR0ZW1wdFZlcnRleCgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciByID0gcmVxdWlyZTtcbiAgICAgICAgdmFyIHZlcnR4ID0gcigndmVydHgnKTtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHZlcnR4TmV4dCA9IHZlcnR4LnJ1bk9uTG9vcCB8fCB2ZXJ0eC5ydW5PbkNvbnRleHQ7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlVmVydHhUaW1lcigpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaDtcbiAgICAvLyBEZWNpZGUgd2hhdCBhc3luYyBtZXRob2QgdG8gdXNlIHRvIHRyaWdnZXJpbmcgcHJvY2Vzc2luZyBvZiBxdWV1ZWQgY2FsbGJhY2tzOlxuICAgIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNOb2RlKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VOZXh0VGljaygpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNdXRhdGlvbk9ic2VydmVyKCk7XG4gICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNXb3JrZXIpIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU1lc3NhZ2VDaGFubmVsKCk7XG4gICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3NlcldpbmRvdyA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhdHRlbXB0VmVydGV4KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKCkge31cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICAgPSB2b2lkIDA7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCA9IDE7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEICA9IDI7XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IgPSBuZXcgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKTtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHNlbGZGdWxsZmlsbG1lbnQoKSB7XG4gICAgICByZXR1cm4gbmV3IFR5cGVFcnJvcihcIllvdSBjYW5ub3QgcmVzb2x2ZSBhIHByb21pc2Ugd2l0aCBpdHNlbGZcIik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkY2Fubm90UmV0dXJuT3duKCkge1xuICAgICAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoJ0EgcHJvbWlzZXMgY2FsbGJhY2sgY2Fubm90IHJldHVybiB0aGF0IHNhbWUgcHJvbWlzZS4nKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRnZXRUaGVuKHByb21pc2UpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLnRoZW47XG4gICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SLmVycm9yID0gZXJyb3I7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlUaGVuKHRoZW4sIHZhbHVlLCBmdWxmaWxsbWVudEhhbmRsZXIsIHJlamVjdGlvbkhhbmRsZXIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoZW4uY2FsbCh2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVGb3JlaWduVGhlbmFibGUocHJvbWlzZSwgdGhlbmFibGUsIHRoZW4pIHtcbiAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChmdW5jdGlvbihwcm9taXNlKSB7XG4gICAgICAgIHZhciBzZWFsZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIGVycm9yID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5VGhlbih0aGVuLCB0aGVuYWJsZSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBpZiAoc2VhbGVkKSB7IHJldHVybjsgfVxuICAgICAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICAgICAgaWYgKHRoZW5hYmxlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgICAgaWYgKHNlYWxlZCkgeyByZXR1cm47IH1cbiAgICAgICAgICBzZWFsZWQgPSB0cnVlO1xuXG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0sICdTZXR0bGU6ICcgKyAocHJvbWlzZS5fbGFiZWwgfHwgJyB1bmtub3duIHByb21pc2UnKSk7XG5cbiAgICAgICAgaWYgKCFzZWFsZWQgJiYgZXJyb3IpIHtcbiAgICAgICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0sIHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU93blRoZW5hYmxlKHByb21pc2UsIHRoZW5hYmxlKSB7XG4gICAgICBpZiAodGhlbmFibGUuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgICAgIH0gZWxzZSBpZiAodGhlbmFibGUuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdGhlbmFibGUuX3Jlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUodGhlbmFibGUsIHVuZGVmaW5lZCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSkge1xuICAgICAgaWYgKG1heWJlVGhlbmFibGUuY29uc3RydWN0b3IgPT09IHByb21pc2UuY29uc3RydWN0b3IpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdGhlbiA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGdldFRoZW4obWF5YmVUaGVuYWJsZSk7XG5cbiAgICAgICAgaWYgKHRoZW4gPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SLmVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbih0aGVuKSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlLCB0aGVuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzZWxmRnVsbGZpbGxtZW50KCkpO1xuICAgICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkdXRpbHMkJG9iamVjdE9yRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaFJlamVjdGlvbihwcm9taXNlKSB7XG4gICAgICBpZiAocHJvbWlzZS5fb25lcnJvcikge1xuICAgICAgICBwcm9taXNlLl9vbmVycm9yKHByb21pc2UuX3Jlc3VsdCk7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gocHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7IHJldHVybjsgfVxuXG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSB2YWx1ZTtcbiAgICAgIHByb21pc2UuX3N0YXRlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEO1xuXG4gICAgICBpZiAocHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gsIHByb21pc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pIHtcbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykgeyByZXR1cm47IH1cbiAgICAgIHByb21pc2UuX3N0YXRlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQ7XG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSByZWFzb247XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2hSZWplY3Rpb24sIHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICAgICAgdmFyIHN1YnNjcmliZXJzID0gcGFyZW50Ll9zdWJzY3JpYmVycztcbiAgICAgIHZhciBsZW5ndGggPSBzdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgICAgIHBhcmVudC5fb25lcnJvciA9IG51bGw7XG5cbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aF0gPSBjaGlsZDtcbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aCArIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRF0gPSBvbkZ1bGZpbGxtZW50O1xuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURURdICA9IG9uUmVqZWN0aW9uO1xuXG4gICAgICBpZiAobGVuZ3RoID09PSAwICYmIHBhcmVudC5fc3RhdGUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaCwgcGFyZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoKHByb21pc2UpIHtcbiAgICAgIHZhciBzdWJzY3JpYmVycyA9IHByb21pc2UuX3N1YnNjcmliZXJzO1xuICAgICAgdmFyIHNldHRsZWQgPSBwcm9taXNlLl9zdGF0ZTtcblxuICAgICAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm47IH1cblxuICAgICAgdmFyIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsID0gcHJvbWlzZS5fcmVzdWx0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgIGNoaWxkID0gc3Vic2NyaWJlcnNbaV07XG4gICAgICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlcnNbaSArIHNldHRsZWRdO1xuXG4gICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHNldHRsZWQsIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWxsYmFjayhkZXRhaWwpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCA9IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKSB7XG4gICAgICB0aGlzLmVycm9yID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SID0gbmV3IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEVycm9yT2JqZWN0KCk7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZGV0YWlsKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IuZXJyb3IgPSBlO1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgICAgIHZhciBoYXNDYWxsYmFjayA9IGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICAgICAgdmFsdWUsIGVycm9yLCBzdWNjZWVkZWQsIGZhaWxlZDtcblxuICAgICAgaWYgKGhhc0NhbGxiYWNrKSB7XG4gICAgICAgIHZhbHVlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCk7XG5cbiAgICAgICAgaWYgKHZhbHVlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IpIHtcbiAgICAgICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgICAgIGVycm9yID0gdmFsdWUuZXJyb3I7XG4gICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkY2Fubm90UmV0dXJuT3duKCkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IGRldGFpbDtcbiAgICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgIC8vIG5vb3BcbiAgICAgIH0gZWxzZSBpZiAoaGFzQ2FsbGJhY2sgJiYgc3VjY2VlZGVkKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChmYWlsZWQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGluaXRpYWxpemVQcm9taXNlKHByb21pc2UsIHJlc29sdmVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlcihmdW5jdGlvbiByZXNvbHZlUHJvbWlzZSh2YWx1ZSl7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIHJlamVjdFByb21pc2UocmVhc29uKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvcihDb25zdHJ1Y3RvciwgaW5wdXQpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcblxuICAgICAgZW51bWVyYXRvci5faW5zdGFuY2VDb25zdHJ1Y3RvciA9IENvbnN0cnVjdG9yO1xuICAgICAgZW51bWVyYXRvci5wcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuXG4gICAgICBpZiAoZW51bWVyYXRvci5fdmFsaWRhdGVJbnB1dChpbnB1dCkpIHtcbiAgICAgICAgZW51bWVyYXRvci5faW5wdXQgICAgID0gaW5wdXQ7XG4gICAgICAgIGVudW1lcmF0b3IubGVuZ3RoICAgICA9IGlucHV0Lmxlbmd0aDtcbiAgICAgICAgZW51bWVyYXRvci5fcmVtYWluaW5nID0gaW5wdXQubGVuZ3RoO1xuXG4gICAgICAgIGVudW1lcmF0b3IuX2luaXQoKTtcblxuICAgICAgICBpZiAoZW51bWVyYXRvci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKGVudW1lcmF0b3IucHJvbWlzZSwgZW51bWVyYXRvci5fcmVzdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnVtZXJhdG9yLmxlbmd0aCA9IGVudW1lcmF0b3IubGVuZ3RoIHx8IDA7XG4gICAgICAgICAgZW51bWVyYXRvci5fZW51bWVyYXRlKCk7XG4gICAgICAgICAgaWYgKGVudW1lcmF0b3IuX3JlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChlbnVtZXJhdG9yLnByb21pc2UsIGVudW1lcmF0b3IuX3Jlc3VsdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QoZW51bWVyYXRvci5wcm9taXNlLCBlbnVtZXJhdG9yLl92YWxpZGF0aW9uRXJyb3IoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl92YWxpZGF0ZUlucHV0ID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkoaW5wdXQpO1xuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3ZhbGlkYXRpb25FcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcignQXJyYXkgTWV0aG9kcyBtdXN0IGJlIHByb3ZpZGVkIGFuIEFycmF5Jyk7XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fcmVzdWx0ID0gbmV3IEFycmF5KHRoaXMubGVuZ3RoKTtcbiAgICB9O1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3I7XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX2VudW1lcmF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuXG4gICAgICB2YXIgbGVuZ3RoICA9IGVudW1lcmF0b3IubGVuZ3RoO1xuICAgICAgdmFyIHByb21pc2UgPSBlbnVtZXJhdG9yLnByb21pc2U7XG4gICAgICB2YXIgaW5wdXQgICA9IGVudW1lcmF0b3IuX2lucHV0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgcHJvbWlzZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgJiYgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX2VhY2hFbnRyeShpbnB1dFtpXSwgaSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fZWFjaEVudHJ5ID0gZnVuY3Rpb24oZW50cnksIGkpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcbiAgICAgIHZhciBjID0gZW51bWVyYXRvci5faW5zdGFuY2VDb25zdHJ1Y3RvcjtcblxuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNNYXliZVRoZW5hYmxlKGVudHJ5KSkge1xuICAgICAgICBpZiAoZW50cnkuY29uc3RydWN0b3IgPT09IGMgJiYgZW50cnkuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgICAgZW50cnkuX29uZXJyb3IgPSBudWxsO1xuICAgICAgICAgIGVudW1lcmF0b3IuX3NldHRsZWRBdChlbnRyeS5fc3RhdGUsIGksIGVudHJ5Ll9yZXN1bHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVudW1lcmF0b3IuX3dpbGxTZXR0bGVBdChjLnJlc29sdmUoZW50cnkpLCBpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW51bWVyYXRvci5fcmVtYWluaW5nLS07XG4gICAgICAgIGVudW1lcmF0b3IuX3Jlc3VsdFtpXSA9IGVudHJ5O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3NldHRsZWRBdCA9IGZ1bmN0aW9uKHN0YXRlLCBpLCB2YWx1ZSkge1xuICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzO1xuICAgICAgdmFyIHByb21pc2UgPSBlbnVtZXJhdG9yLnByb21pc2U7XG5cbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykge1xuICAgICAgICBlbnVtZXJhdG9yLl9yZW1haW5pbmctLTtcblxuICAgICAgICBpZiAoc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnVtZXJhdG9yLl9yZXN1bHRbaV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZW51bWVyYXRvci5fcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgZW51bWVyYXRvci5fcmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl93aWxsU2V0dGxlQXQgPSBmdW5jdGlvbihwcm9taXNlLCBpKSB7XG4gICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXM7XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwcm9taXNlLCB1bmRlZmluZWQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3NldHRsZWRBdChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRUQsIGksIHZhbHVlKTtcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICBlbnVtZXJhdG9yLl9zZXR0bGVkQXQobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQsIGksIHJlYXNvbik7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsKGVudHJpZXMpIHtcbiAgICAgIHJldHVybiBuZXcgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJGRlZmF1bHQodGhpcywgZW50cmllcykucHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJHJhY2UoZW50cmllcykge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgICAgIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuXG4gICAgICBpZiAoIWxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNBcnJheShlbnRyaWVzKSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBhcnJheSB0byByYWNlLicpKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIHZhciBsZW5ndGggPSBlbnRyaWVzLmxlbmd0aDtcblxuICAgICAgZnVuY3Rpb24gb25GdWxmaWxsbWVudCh2YWx1ZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25SZWplY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgcHJvbWlzZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgJiYgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShDb25zdHJ1Y3Rvci5yZXNvbHZlKGVudHJpZXNbaV0pLCB1bmRlZmluZWQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmFjZSQkcmFjZTtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRyZXNvbHZlKG9iamVjdCkge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgICAgIGlmIChvYmplY3QgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiYgb2JqZWN0LmNvbnN0cnVjdG9yID09PSBDb25zdHJ1Y3Rvcikge1xuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgfVxuXG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgb2JqZWN0KTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJHJlc29sdmU7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRyZWplY3QocmVhc29uKSB7XG4gICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkcmVqZWN0O1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRjb3VudGVyID0gMDtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRuZWVkc1Jlc29sdmVyKCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIHJlc29sdmVyIGZ1bmN0aW9uIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvcicpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRuZWVkc05ldygpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGYWlsZWQgdG8gY29uc3RydWN0ICdQcm9taXNlJzogUGxlYXNlIHVzZSB0aGUgJ25ldycgb3BlcmF0b3IsIHRoaXMgb2JqZWN0IGNvbnN0cnVjdG9yIGNhbm5vdCBiZSBjYWxsZWQgYXMgYSBmdW5jdGlvbi5cIik7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2U7XG4gICAgLyoqXG4gICAgICBQcm9taXNlIG9iamVjdHMgcmVwcmVzZW50IHRoZSBldmVudHVhbCByZXN1bHQgb2YgYW4gYXN5bmNocm9ub3VzIG9wZXJhdGlvbi4gVGhlXG4gICAgICBwcmltYXJ5IHdheSBvZiBpbnRlcmFjdGluZyB3aXRoIGEgcHJvbWlzZSBpcyB0aHJvdWdoIGl0cyBgdGhlbmAgbWV0aG9kLCB3aGljaFxuICAgICAgcmVnaXN0ZXJzIGNhbGxiYWNrcyB0byByZWNlaXZlIGVpdGhlciBhIHByb21pc2UncyBldmVudHVhbCB2YWx1ZSBvciB0aGUgcmVhc29uXG4gICAgICB3aHkgdGhlIHByb21pc2UgY2Fubm90IGJlIGZ1bGZpbGxlZC5cblxuICAgICAgVGVybWlub2xvZ3lcbiAgICAgIC0tLS0tLS0tLS0tXG5cbiAgICAgIC0gYHByb21pc2VgIGlzIGFuIG9iamVjdCBvciBmdW5jdGlvbiB3aXRoIGEgYHRoZW5gIG1ldGhvZCB3aG9zZSBiZWhhdmlvciBjb25mb3JtcyB0byB0aGlzIHNwZWNpZmljYXRpb24uXG4gICAgICAtIGB0aGVuYWJsZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHRoYXQgZGVmaW5lcyBhIGB0aGVuYCBtZXRob2QuXG4gICAgICAtIGB2YWx1ZWAgaXMgYW55IGxlZ2FsIEphdmFTY3JpcHQgdmFsdWUgKGluY2x1ZGluZyB1bmRlZmluZWQsIGEgdGhlbmFibGUsIG9yIGEgcHJvbWlzZSkuXG4gICAgICAtIGBleGNlcHRpb25gIGlzIGEgdmFsdWUgdGhhdCBpcyB0aHJvd24gdXNpbmcgdGhlIHRocm93IHN0YXRlbWVudC5cbiAgICAgIC0gYHJlYXNvbmAgaXMgYSB2YWx1ZSB0aGF0IGluZGljYXRlcyB3aHkgYSBwcm9taXNlIHdhcyByZWplY3RlZC5cbiAgICAgIC0gYHNldHRsZWRgIHRoZSBmaW5hbCByZXN0aW5nIHN0YXRlIG9mIGEgcHJvbWlzZSwgZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuXG4gICAgICBBIHByb21pc2UgY2FuIGJlIGluIG9uZSBvZiB0aHJlZSBzdGF0ZXM6IHBlbmRpbmcsIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQuXG5cbiAgICAgIFByb21pc2VzIHRoYXQgYXJlIGZ1bGZpbGxlZCBoYXZlIGEgZnVsZmlsbG1lbnQgdmFsdWUgYW5kIGFyZSBpbiB0aGUgZnVsZmlsbGVkXG4gICAgICBzdGF0ZS4gIFByb21pc2VzIHRoYXQgYXJlIHJlamVjdGVkIGhhdmUgYSByZWplY3Rpb24gcmVhc29uIGFuZCBhcmUgaW4gdGhlXG4gICAgICByZWplY3RlZCBzdGF0ZS4gIEEgZnVsZmlsbG1lbnQgdmFsdWUgaXMgbmV2ZXIgYSB0aGVuYWJsZS5cblxuICAgICAgUHJvbWlzZXMgY2FuIGFsc28gYmUgc2FpZCB0byAqcmVzb2x2ZSogYSB2YWx1ZS4gIElmIHRoaXMgdmFsdWUgaXMgYWxzbyBhXG4gICAgICBwcm9taXNlLCB0aGVuIHRoZSBvcmlnaW5hbCBwcm9taXNlJ3Mgc2V0dGxlZCBzdGF0ZSB3aWxsIG1hdGNoIHRoZSB2YWx1ZSdzXG4gICAgICBzZXR0bGVkIHN0YXRlLiAgU28gYSBwcm9taXNlIHRoYXQgKnJlc29sdmVzKiBhIHByb21pc2UgdGhhdCByZWplY3RzIHdpbGxcbiAgICAgIGl0c2VsZiByZWplY3QsIGFuZCBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IGZ1bGZpbGxzIHdpbGxcbiAgICAgIGl0c2VsZiBmdWxmaWxsLlxuXG5cbiAgICAgIEJhc2ljIFVzYWdlOlxuICAgICAgLS0tLS0tLS0tLS0tXG5cbiAgICAgIGBgYGpzXG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAvLyBvbiBzdWNjZXNzXG4gICAgICAgIHJlc29sdmUodmFsdWUpO1xuXG4gICAgICAgIC8vIG9uIGZhaWx1cmVcbiAgICAgICAgcmVqZWN0KHJlYXNvbik7XG4gICAgICB9KTtcblxuICAgICAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIC8vIG9uIGZ1bGZpbGxtZW50XG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgLy8gb24gcmVqZWN0aW9uXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBBZHZhbmNlZCBVc2FnZTpcbiAgICAgIC0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICBQcm9taXNlcyBzaGluZSB3aGVuIGFic3RyYWN0aW5nIGF3YXkgYXN5bmNocm9ub3VzIGludGVyYWN0aW9ucyBzdWNoIGFzXG4gICAgICBgWE1MSHR0cFJlcXVlc3Rgcy5cblxuICAgICAgYGBganNcbiAgICAgIGZ1bmN0aW9uIGdldEpTT04odXJsKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAgIHhoci5vcGVuKCdHRVQnLCB1cmwpO1xuICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBoYW5kbGVyO1xuICAgICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnanNvbic7XG4gICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0FjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgeGhyLnNlbmQoKTtcblxuICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZXIoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSB0aGlzLkRPTkUpIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMucmVzcG9uc2UpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ2dldEpTT046IGAnICsgdXJsICsgJ2AgZmFpbGVkIHdpdGggc3RhdHVzOiBbJyArIHRoaXMuc3RhdHVzICsgJ10nKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZ2V0SlNPTignL3Bvc3RzLmpzb24nKS50aGVuKGZ1bmN0aW9uKGpzb24pIHtcbiAgICAgICAgLy8gb24gZnVsZmlsbG1lbnRcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAvLyBvbiByZWplY3Rpb25cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFVubGlrZSBjYWxsYmFja3MsIHByb21pc2VzIGFyZSBncmVhdCBjb21wb3NhYmxlIHByaW1pdGl2ZXMuXG5cbiAgICAgIGBgYGpzXG4gICAgICBQcm9taXNlLmFsbChbXG4gICAgICAgIGdldEpTT04oJy9wb3N0cycpLFxuICAgICAgICBnZXRKU09OKCcvY29tbWVudHMnKVxuICAgICAgXSkudGhlbihmdW5jdGlvbih2YWx1ZXMpe1xuICAgICAgICB2YWx1ZXNbMF0gLy8gPT4gcG9zdHNKU09OXG4gICAgICAgIHZhbHVlc1sxXSAvLyA9PiBjb21tZW50c0pTT05cblxuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQGNsYXNzIFByb21pc2VcbiAgICAgIEBwYXJhbSB7ZnVuY3Rpb259IHJlc29sdmVyXG4gICAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgICBAY29uc3RydWN0b3JcbiAgICAqL1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlKHJlc29sdmVyKSB7XG4gICAgICB0aGlzLl9pZCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRjb3VudGVyKys7XG4gICAgICB0aGlzLl9zdGF0ZSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX3Jlc3VsdCA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX3N1YnNjcmliZXJzID0gW107XG5cbiAgICAgIGlmIChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wICE9PSByZXNvbHZlcikge1xuICAgICAgICBpZiAoIWxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbihyZXNvbHZlcikpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNSZXNvbHZlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlKSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRuZWVkc05ldygpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW5pdGlhbGl6ZVByb21pc2UodGhpcywgcmVzb2x2ZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLmFsbCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkZGVmYXVsdDtcbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5yYWNlID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmFjZSQkZGVmYXVsdDtcbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5yZXNvbHZlID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkZGVmYXVsdDtcbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5yZWplY3QgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UuX3NldFNjaGVkdWxlciA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzZXRTY2hlZHVsZXI7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UuX3NldEFzYXAgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0QXNhcDtcbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5fYXNhcCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwO1xuXG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucHJvdG90eXBlID0ge1xuICAgICAgY29uc3RydWN0b3I6IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLFxuXG4gICAgLyoqXG4gICAgICBUaGUgcHJpbWFyeSB3YXkgb2YgaW50ZXJhY3Rpbmcgd2l0aCBhIHByb21pc2UgaXMgdGhyb3VnaCBpdHMgYHRoZW5gIG1ldGhvZCxcbiAgICAgIHdoaWNoIHJlZ2lzdGVycyBjYWxsYmFja3MgdG8gcmVjZWl2ZSBlaXRoZXIgYSBwcm9taXNlJ3MgZXZlbnR1YWwgdmFsdWUgb3IgdGhlXG4gICAgICByZWFzb24gd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24odXNlcil7XG4gICAgICAgIC8vIHVzZXIgaXMgYXZhaWxhYmxlXG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyB1c2VyIGlzIHVuYXZhaWxhYmxlLCBhbmQgeW91IGFyZSBnaXZlbiB0aGUgcmVhc29uIHdoeVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQ2hhaW5pbmdcbiAgICAgIC0tLS0tLS0tXG5cbiAgICAgIFRoZSByZXR1cm4gdmFsdWUgb2YgYHRoZW5gIGlzIGl0c2VsZiBhIHByb21pc2UuICBUaGlzIHNlY29uZCwgJ2Rvd25zdHJlYW0nXG4gICAgICBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGggdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZmlyc3QgcHJvbWlzZSdzIGZ1bGZpbGxtZW50XG4gICAgICBvciByZWplY3Rpb24gaGFuZGxlciwgb3IgcmVqZWN0ZWQgaWYgdGhlIGhhbmRsZXIgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gdXNlci5uYW1lO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICByZXR1cm4gJ2RlZmF1bHQgbmFtZSc7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uICh1c2VyTmFtZSkge1xuICAgICAgICAvLyBJZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHVzZXJOYW1lYCB3aWxsIGJlIHRoZSB1c2VyJ3MgbmFtZSwgb3RoZXJ3aXNlIGl0XG4gICAgICAgIC8vIHdpbGwgYmUgYCdkZWZhdWx0IG5hbWUnYFxuICAgICAgfSk7XG5cbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jyk7XG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBpZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHJlYXNvbmAgd2lsbCBiZSAnRm91bmQgdXNlciwgYnV0IHN0aWxsIHVuaGFwcHknLlxuICAgICAgICAvLyBJZiBgZmluZFVzZXJgIHJlamVjdGVkLCBgcmVhc29uYCB3aWxsIGJlICdgZmluZFVzZXJgIHJlamVjdGVkIGFuZCB3ZSdyZSB1bmhhcHB5Jy5cbiAgICAgIH0pO1xuICAgICAgYGBgXG4gICAgICBJZiB0aGUgZG93bnN0cmVhbSBwcm9taXNlIGRvZXMgbm90IHNwZWNpZnkgYSByZWplY3Rpb24gaGFuZGxlciwgcmVqZWN0aW9uIHJlYXNvbnMgd2lsbCBiZSBwcm9wYWdhdGVkIGZ1cnRoZXIgZG93bnN0cmVhbS5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB0aHJvdyBuZXcgUGVkYWdvZ2ljYWxFeGNlcHRpb24oJ1Vwc3RyZWFtIGVycm9yJyk7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBuZXZlciByZWFjaGVkXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBuZXZlciByZWFjaGVkXG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIFRoZSBgUGVkZ2Fnb2NpYWxFeGNlcHRpb25gIGlzIHByb3BhZ2F0ZWQgYWxsIHRoZSB3YXkgZG93biB0byBoZXJlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBBc3NpbWlsYXRpb25cbiAgICAgIC0tLS0tLS0tLS0tLVxuXG4gICAgICBTb21ldGltZXMgdGhlIHZhbHVlIHlvdSB3YW50IHRvIHByb3BhZ2F0ZSB0byBhIGRvd25zdHJlYW0gcHJvbWlzZSBjYW4gb25seSBiZVxuICAgICAgcmV0cmlldmVkIGFzeW5jaHJvbm91c2x5LiBUaGlzIGNhbiBiZSBhY2hpZXZlZCBieSByZXR1cm5pbmcgYSBwcm9taXNlIGluIHRoZVxuICAgICAgZnVsZmlsbG1lbnQgb3IgcmVqZWN0aW9uIGhhbmRsZXIuIFRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCB0aGVuIGJlIHBlbmRpbmdcbiAgICAgIHVudGlsIHRoZSByZXR1cm5lZCBwcm9taXNlIGlzIHNldHRsZWQuIFRoaXMgaXMgY2FsbGVkICphc3NpbWlsYXRpb24qLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHJldHVybiBmaW5kQ29tbWVudHNCeUF1dGhvcih1c2VyKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnRzKSB7XG4gICAgICAgIC8vIFRoZSB1c2VyJ3MgY29tbWVudHMgYXJlIG5vdyBhdmFpbGFibGVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIElmIHRoZSBhc3NpbWxpYXRlZCBwcm9taXNlIHJlamVjdHMsIHRoZW4gdGhlIGRvd25zdHJlYW0gcHJvbWlzZSB3aWxsIGFsc28gcmVqZWN0LlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHJldHVybiBmaW5kQ29tbWVudHNCeUF1dGhvcih1c2VyKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnRzKSB7XG4gICAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgZnVsZmlsbHMsIHdlJ2xsIGhhdmUgdGhlIHZhbHVlIGhlcmVcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gSWYgYGZpbmRDb21tZW50c0J5QXV0aG9yYCByZWplY3RzLCB3ZSdsbCBoYXZlIHRoZSByZWFzb24gaGVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgU2ltcGxlIEV4YW1wbGVcbiAgICAgIC0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzdWx0ID0gZmluZFJlc3VsdCgpO1xuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAvLyBmYWlsdXJlXG4gICAgICB9XG4gICAgICBgYGBcblxuICAgICAgRXJyYmFjayBFeGFtcGxlXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kUmVzdWx0KGZ1bmN0aW9uKHJlc3VsdCwgZXJyKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIC8vIGZhaWx1cmVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBzdWNjZXNzXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFByb21pc2UgRXhhbXBsZTtcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgZmluZFJlc3VsdCgpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQWR2YW5jZWQgRXhhbXBsZVxuICAgICAgLS0tLS0tLS0tLS0tLS1cblxuICAgICAgU3luY2hyb25vdXMgRXhhbXBsZVxuXG4gICAgICBgYGBqYXZhc2NyaXB0XG4gICAgICB2YXIgYXV0aG9yLCBib29rcztcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXV0aG9yID0gZmluZEF1dGhvcigpO1xuICAgICAgICBib29rcyAgPSBmaW5kQm9va3NCeUF1dGhvcihhdXRob3IpO1xuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAvLyBmYWlsdXJlXG4gICAgICB9XG4gICAgICBgYGBcblxuICAgICAgRXJyYmFjayBFeGFtcGxlXG5cbiAgICAgIGBgYGpzXG5cbiAgICAgIGZ1bmN0aW9uIGZvdW5kQm9va3MoYm9va3MpIHtcblxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBmYWlsdXJlKHJlYXNvbikge1xuXG4gICAgICB9XG5cbiAgICAgIGZpbmRBdXRob3IoZnVuY3Rpb24oYXV0aG9yLCBlcnIpe1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAgIC8vIGZhaWx1cmVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZmluZEJvb29rc0J5QXV0aG9yKGF1dGhvciwgZnVuY3Rpb24oYm9va3MsIGVycikge1xuICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBmb3VuZEJvb2tzKGJvb2tzKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAgICAgICAgICAgZmFpbHVyZShyZWFzb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdWNjZXNzXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFByb21pc2UgRXhhbXBsZTtcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgZmluZEF1dGhvcigpLlxuICAgICAgICB0aGVuKGZpbmRCb29rc0J5QXV0aG9yKS5cbiAgICAgICAgdGhlbihmdW5jdGlvbihib29rcyl7XG4gICAgICAgICAgLy8gZm91bmQgYm9va3NcbiAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAbWV0aG9kIHRoZW5cbiAgICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uRnVsZmlsbGVkXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGVkXG4gICAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgICBAcmV0dXJuIHtQcm9taXNlfVxuICAgICovXG4gICAgICB0aGVuOiBmdW5jdGlvbihvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcztcbiAgICAgICAgdmFyIHN0YXRlID0gcGFyZW50Ll9zdGF0ZTtcblxuICAgICAgICBpZiAoc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCAmJiAhb25GdWxmaWxsbWVudCB8fCBzdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQgJiYgIW9uUmVqZWN0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hpbGQgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHBhcmVudC5fcmVzdWx0O1xuXG4gICAgICAgIGlmIChzdGF0ZSkge1xuICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3VtZW50c1tzdGF0ZSAtIDFdO1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbnZva2VDYWxsYmFjayhzdGF0ZSwgY2hpbGQsIGNhbGxiYWNrLCByZXN1bHQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2hpbGQ7XG4gICAgICB9LFxuXG4gICAgLyoqXG4gICAgICBgY2F0Y2hgIGlzIHNpbXBseSBzdWdhciBmb3IgYHRoZW4odW5kZWZpbmVkLCBvblJlamVjdGlvbilgIHdoaWNoIG1ha2VzIGl0IHRoZSBzYW1lXG4gICAgICBhcyB0aGUgY2F0Y2ggYmxvY2sgb2YgYSB0cnkvY2F0Y2ggc3RhdGVtZW50LlxuXG4gICAgICBgYGBqc1xuICAgICAgZnVuY3Rpb24gZmluZEF1dGhvcigpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkbid0IGZpbmQgdGhhdCBhdXRob3InKTtcbiAgICAgIH1cblxuICAgICAgLy8gc3luY2hyb25vdXNcbiAgICAgIHRyeSB7XG4gICAgICAgIGZpbmRBdXRob3IoKTtcbiAgICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgICB9XG5cbiAgICAgIC8vIGFzeW5jIHdpdGggcHJvbWlzZXNcbiAgICAgIGZpbmRBdXRob3IoKS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQG1ldGhvZCBjYXRjaFxuICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3Rpb25cbiAgICAgIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgICAgIEByZXR1cm4ge1Byb21pc2V9XG4gICAgKi9cbiAgICAgICdjYXRjaCc6IGZ1bmN0aW9uKG9uUmVqZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3Rpb24pO1xuICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRwb2x5ZmlsbCgpIHtcbiAgICAgIHZhciBsb2NhbDtcblxuICAgICAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgbG9jYWwgPSBnbG9iYWw7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGxvY2FsID0gc2VsZjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgbG9jYWwgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb2x5ZmlsbCBmYWlsZWQgYmVjYXVzZSBnbG9iYWwgb2JqZWN0IGlzIHVuYXZhaWxhYmxlIGluIHRoaXMgZW52aXJvbm1lbnQnKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBQID0gbG9jYWwuUHJvbWlzZTtcblxuICAgICAgaWYgKFAgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFAucmVzb2x2ZSgpKSA9PT0gJ1tvYmplY3QgUHJvbWlzZV0nICYmICFQLmNhc3QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsb2NhbC5Qcm9taXNlID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQ7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJHBvbHlmaWxsO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2UgPSB7XG4gICAgICAnUHJvbWlzZSc6IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0LFxuICAgICAgJ3BvbHlmaWxsJzogbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0XG4gICAgfTtcblxuICAgIC8qIGdsb2JhbCBkZWZpbmU6dHJ1ZSBtb2R1bGU6dHJ1ZSB3aW5kb3c6IHRydWUgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmVbJ2FtZCddKSB7XG4gICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlOyB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZVsnZXhwb3J0cyddKSB7XG4gICAgICBtb2R1bGVbJ2V4cG9ydHMnXSA9IGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXNbJ0VTNlByb21pc2UnXSA9IGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0KCk7XG59KS5jYWxsKHRoaXMpO1xuXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiSXJYVXN1XCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIvKmdsb2JhbHMgZGVmaW5lICovXG4ndXNlIHN0cmljdCc7XG5cblxuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIChyb290Lmh0dHBwbGVhc2Vwcm9taXNlcyA9IGZhY3Rvcnkocm9vdCkpO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnkocm9vdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5odHRwcGxlYXNlcHJvbWlzZXMgPSBmYWN0b3J5KHJvb3QpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24gKHJvb3QpIHsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChQcm9taXNlKSB7XG4gICAgICAgIFByb21pc2UgPSBQcm9taXNlIHx8IHJvb3QgJiYgcm9vdC5Qcm9taXNlO1xuICAgICAgICBpZiAoIVByb21pc2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gUHJvbWlzZSBpbXBsZW1lbnRhdGlvbiBmb3VuZC4nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcHJvY2Vzc1JlcXVlc3Q6IGZ1bmN0aW9uIChyZXEpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzb2x2ZSwgcmVqZWN0LFxuICAgICAgICAgICAgICAgICAgICBvbGRPbmxvYWQgPSByZXEub25sb2FkLFxuICAgICAgICAgICAgICAgICAgICBvbGRPbmVycm9yID0gcmVxLm9uZXJyb3IsXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSA9IGE7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QgPSBiO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXEub25sb2FkID0gZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkT25sb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBvbGRPbmxvYWQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZE9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IG9sZE9uZXJyb3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJlcS50aGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuLmFwcGx5KHByb21pc2UsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXFbJ2NhdGNoJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlWydjYXRjaCddLmFwcGx5KHByb21pc2UsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xufSkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVzcG9uc2UgPSByZXF1aXJlKCcuL3Jlc3BvbnNlJyk7XG5cbmZ1bmN0aW9uIFJlcXVlc3RFcnJvcihtZXNzYWdlLCBwcm9wcykge1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgZXJyLm5hbWUgPSAnUmVxdWVzdEVycm9yJztcbiAgICB0aGlzLm5hbWUgPSBlcnIubmFtZTtcbiAgICB0aGlzLm1lc3NhZ2UgPSBlcnIubWVzc2FnZTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICAgIHRoaXMuc3RhY2sgPSBlcnIuc3RhY2s7XG4gICAgfVxuXG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWVzc2FnZTtcbiAgICB9O1xuXG4gICAgZm9yICh2YXIgayBpbiBwcm9wcykge1xuICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgIHRoaXNba10gPSBwcm9wc1trXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuUmVxdWVzdEVycm9yLnByb3RvdHlwZSA9IEVycm9yLnByb3RvdHlwZTtcblxuUmVxdWVzdEVycm9yLmNyZWF0ZSA9IGZ1bmN0aW9uIChtZXNzYWdlLCByZXEsIHByb3BzKSB7XG4gICAgdmFyIGVyciA9IG5ldyBSZXF1ZXN0RXJyb3IobWVzc2FnZSwgcHJvcHMpO1xuICAgIFJlc3BvbnNlLmNhbGwoZXJyLCByZXEpO1xuICAgIHJldHVybiBlcnI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcXVlc3RFcnJvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGksXG4gICAgY2xlYW5VUkwgPSByZXF1aXJlKCcuLi9wbHVnaW5zL2NsZWFudXJsJyksXG4gICAgWEhSID0gcmVxdWlyZSgnLi94aHInKSxcbiAgICBkZWxheSA9IHJlcXVpcmUoJy4vdXRpbHMvZGVsYXknKSxcbiAgICBjcmVhdGVFcnJvciA9IHJlcXVpcmUoJy4vZXJyb3InKS5jcmVhdGUsXG4gICAgUmVzcG9uc2UgPSByZXF1aXJlKCcuL3Jlc3BvbnNlJyksXG4gICAgUmVxdWVzdCA9IHJlcXVpcmUoJy4vcmVxdWVzdCcpLFxuICAgIGV4dGVuZCA9IHJlcXVpcmUoJ3h0ZW5kJyksXG4gICAgb25jZSA9IHJlcXVpcmUoJy4vdXRpbHMvb25jZScpO1xuXG5mdW5jdGlvbiBmYWN0b3J5KGRlZmF1bHRzLCBwbHVnaW5zKSB7XG4gICAgZGVmYXVsdHMgPSBkZWZhdWx0cyB8fCB7fTtcbiAgICBwbHVnaW5zID0gcGx1Z2lucyB8fCBbXTtcblxuICAgIGZ1bmN0aW9uIGh0dHAocmVxLCBjYikge1xuICAgICAgICB2YXIgeGhyLCBwbHVnaW4sIGRvbmUsIGssIHRpbWVvdXRJZDtcblxuICAgICAgICByZXEgPSBuZXcgUmVxdWVzdChleHRlbmQoZGVmYXVsdHMsIHJlcSkpO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBwbHVnaW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBwbHVnaW4gPSBwbHVnaW5zW2ldO1xuICAgICAgICAgICAgaWYgKHBsdWdpbi5wcm9jZXNzUmVxdWVzdCkge1xuICAgICAgICAgICAgICAgIHBsdWdpbi5wcm9jZXNzUmVxdWVzdChyZXEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2l2ZSB0aGUgcGx1Z2lucyBhIGNoYW5jZSB0byBjcmVhdGUgdGhlIFhIUiBvYmplY3RcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHBsdWdpbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHBsdWdpbiA9IHBsdWdpbnNbaV07XG4gICAgICAgICAgICBpZiAocGx1Z2luLmNyZWF0ZVhIUikge1xuICAgICAgICAgICAgICAgIHhociA9IHBsdWdpbi5jcmVhdGVYSFIocmVxKTtcbiAgICAgICAgICAgICAgICBicmVhazsgLy8gRmlyc3QgY29tZSwgZmlyc3Qgc2VydmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB4aHIgPSB4aHIgfHwgbmV3IFhIUigpO1xuXG4gICAgICAgIHJlcS54aHIgPSB4aHI7XG5cbiAgICAgICAgLy8gQmVjYXVzZSBYSFIgY2FuIGJlIGFuIFhNTEh0dHBSZXF1ZXN0IG9yIGFuIFhEb21haW5SZXF1ZXN0LCB3ZSBhZGRcbiAgICAgICAgLy8gYG9ucmVhZHlzdGF0ZWNoYW5nZWAsIGBvbmxvYWRgLCBhbmQgYG9uZXJyb3JgIGNhbGxiYWNrcy4gV2UgdXNlIHRoZVxuICAgICAgICAvLyBgb25jZWAgdXRpbCB0byBtYWtlIHN1cmUgdGhhdCBvbmx5IG9uZSBpcyBjYWxsZWQgKGFuZCBpdCdzIG9ubHkgY2FsbGVkXG4gICAgICAgIC8vIG9uZSB0aW1lKS5cbiAgICAgICAgZG9uZSA9IG9uY2UoZGVsYXkoZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgICAgICB4aHIub25sb2FkID0geGhyLm9uZXJyb3IgPSB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0geGhyLm9udGltZW91dCA9IHhoci5vbnByb2dyZXNzID0gbnVsbDtcbiAgICAgICAgICAgIHZhciByZXMgPSBlcnIgJiYgZXJyLmlzSHR0cEVycm9yID8gZXJyIDogbmV3IFJlc3BvbnNlKHJlcSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcGx1Z2lucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHBsdWdpbiA9IHBsdWdpbnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKHBsdWdpbi5wcm9jZXNzUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcGx1Z2luLnByb2Nlc3NSZXNwb25zZShyZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVxLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChyZXEub25sb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbmxvYWQocmVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICBjYihlcnIsIHJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcblxuICAgICAgICAvLyBXaGVuIHRoZSByZXF1ZXN0IGNvbXBsZXRlcywgY29udGludWUuXG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAocmVxLnRpbWVkT3V0KSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmIChyZXEuYWJvcnRlZCkge1xuICAgICAgICAgICAgICAgIGRvbmUoY3JlYXRlRXJyb3IoJ1JlcXVlc3QgYWJvcnRlZCcsIHJlcSwge25hbWU6ICdBYm9ydCd9KSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHR5cGUgPSBNYXRoLmZsb29yKHhoci5zdGF0dXMgLyAxMDApO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHhoci5zdGF0dXMgPT09IDQwNCAmJiAhcmVxLmVycm9yT240MDQpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBraW5kO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBraW5kID0gJ0NsaWVudCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2luZCA9ICdTZXJ2ZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBraW5kID0gJ0hUVFAnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBraW5kICsgJyBFcnJvcjogJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnVGhlIHNlcnZlciByZXR1cm5lZCBhIHN0YXR1cyBvZiAnICsgeGhyLnN0YXR1cyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnIGZvciB0aGUgcmVxdWVzdCBcIicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm1ldGhvZC50b1VwcGVyQ2FzZSgpICsgJyAnICsgcmVxLnVybCArICdcIic7XG4gICAgICAgICAgICAgICAgICAgIGRvbmUoY3JlYXRlRXJyb3IobXNnLCByZXEpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gYG9ubG9hZGAgaXMgb25seSBjYWxsZWQgb24gc3VjY2VzcyBhbmQsIGluIElFLCB3aWxsIGJlIGNhbGxlZCB3aXRob3V0XG4gICAgICAgIC8vIGB4aHIuc3RhdHVzYCBoYXZpbmcgYmVlbiBzZXQsIHNvIHdlIGRvbid0IGNoZWNrIGl0LlxuICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkgeyBkb25lKCk7IH07XG5cbiAgICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkb25lKGNyZWF0ZUVycm9yKCdJbnRlcm5hbCBYSFIgRXJyb3InLCByZXEpKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJRSBzb21ldGltZXMgZmFpbHMgaWYgeW91IGRvbid0IHNwZWNpZnkgZXZlcnkgaGFuZGxlci5cbiAgICAgICAgLy8gU2VlIGh0dHA6Ly9zb2NpYWwubXNkbi5taWNyb3NvZnQuY29tL0ZvcnVtcy9pZS9lbi1VUy8zMGVmM2FkZC03NjdjLTQ0MzYtYjhhOS1mMWNhMTliNDgxMmUvaWU5LXJ0bS14ZG9tYWlucmVxdWVzdC1pc3N1ZWQtcmVxdWVzdHMtbWF5LWFib3J0LWlmLWFsbC1ldmVudC1oYW5kbGVycy1ub3Qtc3BlY2lmaWVkP2ZvcnVtPWlld2ViZGV2ZWxvcG1lbnRcbiAgICAgICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uICgpIHsgLyogbm9vcCAqLyB9O1xuICAgICAgICB4aHIub25wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHsgLyogbm9vcCAqLyB9O1xuXG4gICAgICAgIHhoci5vcGVuKHJlcS5tZXRob2QsIHJlcS51cmwpO1xuXG4gICAgICAgIGlmIChyZXEudGltZW91dCkge1xuICAgICAgICAgICAgLy8gSWYgd2UgdXNlIHRoZSBub3JtYWwgWEhSIHRpbWVvdXQgbWVjaGFuaXNtIChgeGhyLnRpbWVvdXRgIGFuZFxuICAgICAgICAgICAgLy8gYHhoci5vbnRpbWVvdXRgKSwgYG9ucmVhZHlzdGF0ZWNoYW5nZWAgd2lsbCBiZSB0cmlnZ2VyZWQgYmVmb3JlXG4gICAgICAgICAgICAvLyBgb250aW1lb3V0YC4gVGhlcmUncyBubyB3YXkgdG8gcmVjb2duaXplIHRoYXQgaXQgd2FzIHRyaWdnZXJlZCBieVxuICAgICAgICAgICAgLy8gYSB0aW1lb3V0LCBhbmQgd2UnZCBiZSB1bmFibGUgdG8gZGlzcGF0Y2ggdGhlIHJpZ2h0IGVycm9yLlxuICAgICAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmVxLnRpbWVkT3V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBkb25lKGNyZWF0ZUVycm9yKCdSZXF1ZXN0IHRpbWVvdXQnLCByZXEsIHtuYW1lOiAnVGltZW91dCd9KSk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgeGhyLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7fVxuICAgICAgICAgICAgfSwgcmVxLnRpbWVvdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChrIGluIHJlcS5oZWFkZXJzKSB7XG4gICAgICAgICAgICBpZiAocmVxLmhlYWRlcnMuaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihrLCByZXEuaGVhZGVyc1trXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB4aHIuc2VuZChyZXEuYm9keSk7XG5cbiAgICAgICAgcmV0dXJuIHJlcTtcbiAgICB9XG5cbiAgICB2YXIgbWV0aG9kLFxuICAgICAgICBtZXRob2RzID0gWydnZXQnLCAncG9zdCcsICdwdXQnLCAnaGVhZCcsICdwYXRjaCcsICdkZWxldGUnXSxcbiAgICAgICAgdmVyYiA9IGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAocmVxLCBjYikge1xuICAgICAgICAgICAgICAgIHJlcSA9IG5ldyBSZXF1ZXN0KHJlcSk7XG4gICAgICAgICAgICAgICAgcmVxLm1ldGhvZCA9IG1ldGhvZDtcbiAgICAgICAgICAgICAgICByZXR1cm4gaHR0cChyZXEsIGNiKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgZm9yIChpID0gMDsgaSA8IG1ldGhvZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbWV0aG9kID0gbWV0aG9kc1tpXTtcbiAgICAgICAgaHR0cFttZXRob2RdID0gdmVyYihtZXRob2QpO1xuICAgIH1cblxuICAgIGh0dHAucGx1Z2lucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHBsdWdpbnM7XG4gICAgfTtcblxuICAgIGh0dHAuZGVmYXVsdHMgPSBmdW5jdGlvbiAobmV3VmFsdWVzKSB7XG4gICAgICAgIGlmIChuZXdWYWx1ZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWN0b3J5KGV4dGVuZChkZWZhdWx0cywgbmV3VmFsdWVzKSwgcGx1Z2lucyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgIH07XG5cbiAgICBodHRwLnVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5ld1BsdWdpbnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICAgICAgICByZXR1cm4gZmFjdG9yeShkZWZhdWx0cywgcGx1Z2lucy5jb25jYXQobmV3UGx1Z2lucykpO1xuICAgIH07XG5cbiAgICBodHRwLmJhcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmYWN0b3J5KCk7XG4gICAgfTtcblxuICAgIGh0dHAuUmVxdWVzdCA9IFJlcXVlc3Q7XG4gICAgaHR0cC5SZXNwb25zZSA9IFJlc3BvbnNlO1xuXG4gICAgcmV0dXJuIGh0dHA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSh7fSwgW2NsZWFuVVJMXSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIFJlcXVlc3Qob3B0c09yVXJsKSB7XG4gICAgdmFyIG9wdHMgPSB0eXBlb2Ygb3B0c09yVXJsID09PSAnc3RyaW5nJyA/IHt1cmw6IG9wdHNPclVybH0gOiBvcHRzT3JVcmwgfHwge307XG4gICAgdGhpcy5tZXRob2QgPSBvcHRzLm1ldGhvZCA/IG9wdHMubWV0aG9kLnRvVXBwZXJDYXNlKCkgOiAnR0VUJztcbiAgICB0aGlzLnVybCA9IG9wdHMudXJsO1xuICAgIHRoaXMuaGVhZGVycyA9IG9wdHMuaGVhZGVycyB8fCB7fTtcbiAgICB0aGlzLmJvZHkgPSBvcHRzLmJvZHk7XG4gICAgdGhpcy50aW1lb3V0ID0gb3B0cy50aW1lb3V0IHx8IDA7XG4gICAgdGhpcy5lcnJvck9uNDA0ID0gb3B0cy5lcnJvck9uNDA0ICE9IG51bGwgPyBvcHRzLmVycm9yT240MDQgOiB0cnVlO1xuICAgIHRoaXMub25sb2FkID0gb3B0cy5vbmxvYWQ7XG4gICAgdGhpcy5vbmVycm9yID0gb3B0cy5vbmVycm9yO1xufVxuXG5SZXF1ZXN0LnByb3RvdHlwZS5hYm9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5hYm9ydGVkKSByZXR1cm47XG4gICAgdGhpcy5hYm9ydGVkID0gdHJ1ZTtcbiAgICB0aGlzLnhoci5hYm9ydCgpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuUmVxdWVzdC5wcm90b3R5cGUuaGVhZGVyID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIGs7XG4gICAgZm9yIChrIGluIHRoaXMuaGVhZGVycykge1xuICAgICAgICBpZiAodGhpcy5oZWFkZXJzLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICBpZiAobmFtZS50b0xvd2VyQ2FzZSgpID09PSBrLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5oZWFkZXJzW2tdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmhlYWRlcnNba107XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5oZWFkZXJzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVxdWVzdDtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFJlcXVlc3QgPSByZXF1aXJlKCcuL3JlcXVlc3QnKTtcblxuXG5mdW5jdGlvbiBSZXNwb25zZShyZXEpIHtcbiAgICB2YXIgaSwgbGluZXMsIG0sXG4gICAgICAgIHhociA9IHJlcS54aHI7XG4gICAgdGhpcy5yZXF1ZXN0ID0gcmVxO1xuICAgIHRoaXMueGhyID0geGhyO1xuICAgIHRoaXMuaGVhZGVycyA9IHt9O1xuXG4gICAgLy8gQnJvd3NlcnMgZG9uJ3QgbGlrZSB5b3UgdHJ5aW5nIHRvIHJlYWQgWEhSIHByb3BlcnRpZXMgd2hlbiB5b3UgYWJvcnQgdGhlXG4gICAgLy8gcmVxdWVzdCwgc28gd2UgZG9uJ3QuXG4gICAgaWYgKHJlcS5hYm9ydGVkIHx8IHJlcS50aW1lZE91dCkgcmV0dXJuO1xuXG4gICAgdGhpcy5zdGF0dXMgPSB4aHIuc3RhdHVzIHx8IDA7XG4gICAgdGhpcy50ZXh0ID0geGhyLnJlc3BvbnNlVGV4dDtcbiAgICB0aGlzLmJvZHkgPSB4aHIucmVzcG9uc2UgfHwgeGhyLnJlc3BvbnNlVGV4dDtcbiAgICB0aGlzLmNvbnRlbnRUeXBlID0geGhyLmNvbnRlbnRUeXBlIHx8ICh4aHIuZ2V0UmVzcG9uc2VIZWFkZXIgJiYgeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdDb250ZW50LVR5cGUnKSk7XG5cbiAgICBpZiAoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycykge1xuICAgICAgICBsaW5lcyA9IHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKS5zcGxpdCgnXFxuJyk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKChtID0gbGluZXNbaV0ubWF0Y2goL1xccyooW15cXHNdKyk6XFxzKyhbXlxcc10rKS8pKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGVhZGVyc1ttWzFdXSA9IG1bMl07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmlzSHR0cEVycm9yID0gdGhpcy5zdGF0dXMgPj0gNDAwO1xufVxuXG5SZXNwb25zZS5wcm90b3R5cGUuaGVhZGVyID0gUmVxdWVzdC5wcm90b3R5cGUuaGVhZGVyO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVzcG9uc2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIFdyYXAgYSBmdW5jdGlvbiBpbiBhIGBzZXRUaW1lb3V0YCBjYWxsLiBUaGlzIGlzIHVzZWQgdG8gZ3VhcmFudGVlIGFzeW5jXG4vLyBiZWhhdmlvciwgd2hpY2ggY2FuIGF2b2lkIHVuZXhwZWN0ZWQgZXJyb3JzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhclxuICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCksXG4gICAgICAgICAgICBuZXdGdW5jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIHNldFRpbWVvdXQobmV3RnVuYywgMCk7XG4gICAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIEEgXCJvbmNlXCIgdXRpbGl0eS5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgdmFyIHJlc3VsdCwgY2FsbGVkID0gZmFsc2U7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFjYWxsZWQpIHtcbiAgICAgICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICByZXN1bHQgPSBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHdpbmRvdy5YTUxIdHRwUmVxdWVzdDtcbiIsIm1vZHVsZS5leHBvcnRzID0gZXh0ZW5kXG5cbmZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgICB2YXIgdGFyZ2V0ID0ge31cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV1cblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHByb2Nlc3NSZXF1ZXN0OiBmdW5jdGlvbiAocmVxKSB7XG4gICAgICAgIHJlcS51cmwgPSByZXEudXJsLnJlcGxhY2UoL1teJV0rL2csIGZ1bmN0aW9uIChzKSB7XG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlVVJJKHMpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIganNvbnJlcXVlc3QgPSByZXF1aXJlKCcuL2pzb25yZXF1ZXN0JyksXG4gICAganNvbnJlc3BvbnNlID0gcmVxdWlyZSgnLi9qc29ucmVzcG9uc2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcHJvY2Vzc1JlcXVlc3Q6IGZ1bmN0aW9uIChyZXEpIHtcbiAgICAgICAganNvbnJlcXVlc3QucHJvY2Vzc1JlcXVlc3QuY2FsbCh0aGlzLCByZXEpO1xuICAgICAgICBqc29ucmVzcG9uc2UucHJvY2Vzc1JlcXVlc3QuY2FsbCh0aGlzLCByZXEpO1xuICAgIH0sXG4gICAgcHJvY2Vzc1Jlc3BvbnNlOiBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgIGpzb25yZXNwb25zZS5wcm9jZXNzUmVzcG9uc2UuY2FsbCh0aGlzLCByZXMpO1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHByb2Nlc3NSZXF1ZXN0OiBmdW5jdGlvbiAocmVxKSB7XG4gICAgICAgIHZhclxuICAgICAgICAgICAgY29udGVudFR5cGUgPSByZXEuaGVhZGVyKCdDb250ZW50LVR5cGUnKSxcbiAgICAgICAgICAgIGhhc0pzb25Db250ZW50VHlwZSA9IGNvbnRlbnRUeXBlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50VHlwZS5pbmRleE9mKCdhcHBsaWNhdGlvbi9qc29uJykgIT09IC0xO1xuXG4gICAgICAgIGlmIChjb250ZW50VHlwZSAhPSBudWxsICYmICFoYXNKc29uQ29udGVudFR5cGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXEuYm9keSkge1xuICAgICAgICAgICAgaWYgKCFjb250ZW50VHlwZSkge1xuICAgICAgICAgICAgICAgIHJlcS5oZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlcS5ib2R5ID0gSlNPTi5zdHJpbmdpZnkocmVxLmJvZHkpO1xuICAgICAgICB9XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcHJvY2Vzc1JlcXVlc3Q6IGZ1bmN0aW9uIChyZXEpIHtcbiAgICAgICAgdmFyIGFjY2VwdCA9IHJlcS5oZWFkZXIoJ0FjY2VwdCcpO1xuICAgICAgICBpZiAoYWNjZXB0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJlcS5oZWFkZXIoJ0FjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHByb2Nlc3NSZXNwb25zZTogZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIGNvbnRlbnR5cGUgaXMgXCJzb21ldGhpbmcvanNvblwiIG9yXG4gICAgICAgIC8vIFwic29tZXRoaW5nL3NvbWV0aGluZ2Vsc2UranNvblwiXG4gICAgICAgIGlmIChyZXMuY29udGVudFR5cGUgJiYgL14uKlxcLyg/Oi4qXFwrKT9qc29uKDt8JCkvaS50ZXN0KHJlcy5jb250ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIHZhciByYXcgPSB0eXBlb2YgcmVzLmJvZHkgPT09ICdzdHJpbmcnID8gcmVzLmJvZHkgOiByZXMudGV4dDtcbiAgICAgICAgICAgIGlmIChyYXcpIHtcbiAgICAgICAgICAgICAgICByZXMuYm9keSA9IEpTT04ucGFyc2UocmF3KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG4iLCJ2YXIgaHR0cCA9IHJlcXVpcmUoXCJodHRwcGxlYXNlXCIpO1xudmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgcHJvbWlzZXMgPSByZXF1aXJlKCdodHRwcGxlYXNlLXByb21pc2VzJyk7XG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ2VzNi1wcm9taXNlJykuUHJvbWlzZTtcbnZhciBqc29uID0gcmVxdWlyZShcImh0dHBwbGVhc2UvcGx1Z2lucy9qc29uXCIpO1xuaHR0cCA9IGh0dHAudXNlKGpzb24pLnVzZShwcm9taXNlcyhQcm9taXNlKSk7XG5cbnRudF9lUmVzdCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgcHJveHlVcmwgOiBcImh0dHBzOi8vcmVzdC5lbnNlbWJsLm9yZ1wiXG4gICAgfTtcbiAgICAvLyBQcmVmaXhlcyB0byB1c2UgdGhlIFJFU1QgQVBJLlxuICAgIC8vdmFyIHByb3h5VXJsID0gXCJodHRwczovL3Jlc3QuZW5zZW1ibC5vcmdcIjtcbiAgICAvL3ZhciBwcmVmaXhfcmVnaW9uID0gcHJlZml4ICsgXCIvb3ZlcmxhcC9yZWdpb24vXCI7XG4gICAgLy92YXIgcHJlZml4X2Vuc2dlbmUgPSBwcmVmaXggKyBcIi9sb29rdXAvaWQvXCI7XG4gICAgLy92YXIgcHJlZml4X3hyZWYgPSBwcmVmaXggKyBcIi94cmVmcy9zeW1ib2wvXCI7XG4gICAgLy92YXIgcHJlZml4X2hvbW9sb2d1ZXMgPSBwcmVmaXggKyBcIi9ob21vbG9neS9pZC9cIjtcbiAgICAvL3ZhciBwcmVmaXhfY2hyX2luZm8gPSBwcmVmaXggKyBcIi9pbmZvL2Fzc2VtYmx5L1wiO1xuICAgIC8vdmFyIHByZWZpeF9hbG5fcmVnaW9uID0gcHJlZml4ICsgXCIvYWxpZ25tZW50L3JlZ2lvbi9cIjtcbiAgICAvL3ZhciBwcmVmaXhfZ2VuZV90cmVlID0gcHJlZml4ICsgXCIvZ2VuZXRyZWUvaWQvXCI7XG4gICAgLy92YXIgcHJlZml4X2Fzc2VtYmx5ID0gcHJlZml4ICsgXCIvaW5mby9hc3NlbWJseS9cIjtcbiAgICAvL3ZhciBwcmVmaXhfc2VxdWVuY2UgPSBwcmVmaXggKyBcIi9zZXF1ZW5jZS9yZWdpb24vXCI7XG4gICAgLy92YXIgcHJlZml4X3ZhcmlhdGlvbiA9IHByZWZpeCArIFwiL3ZhcmlhdGlvbi9cIjtcblxuICAgIC8vIE51bWJlciBvZiBjb25uZWN0aW9ucyBtYWRlIHRvIHRoZSBkYXRhYmFzZVxuICAgIHZhciBjb25uZWN0aW9ucyA9IDA7XG5cbiAgICB2YXIgZVJlc3QgPSBmdW5jdGlvbigpIHtcbiAgICB9O1xuXG4gICAgLy8gTGltaXRzIGltcG9zZWQgYnkgdGhlIGVuc2VtYmwgUkVTVCBBUElcbiAgICBlUmVzdC5saW1pdHMgPSB7XG4gICAgICAgIHJlZ2lvbiA6IDUwMDAwMDBcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChlUmVzdCk7XG5cbiAgICBhcGkuZ2V0c2V0IChjb25maWcpO1xuXG4gICAgLyoqIDxzdHJvbmc+Y2FsbDwvc3Ryb25nPiBtYWtlcyBhbiBhc3luY2hyb25vdXMgY2FsbCB0byB0aGUgZW5zZW1ibCBSRVNUIHNlcnZpY2UuXG5cdEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgLSBBIGxpdGVyYWwgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGZvbGxvd2luZyBmaWVsZHM6XG5cdDx1bD5cblx0PGxpPnVybCA9PiBUaGUgcmVzdCBVUkwuIFRoaXMgaXMgcmV0dXJuZWQgYnkge0BsaW5rIGVSZXN0LnVybH08L2xpPlxuXHQ8bGk+c3VjY2VzcyA9PiBBIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBSRVNUIHF1ZXJ5IGlzIHN1Y2Nlc3NmdWwgKGkuZS4gdGhlIHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlciBpcyBhIGRlZmluZWQgdmFsdWUgYW5kIG5vIGVycm9yIGhhcyBiZWVuIHJldHVybmVkKTwvbGk+XG5cdDxsaT5lcnJvciA9PiBBIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBSRVNUIHF1ZXJ5IHJldHVybnMgYW4gZXJyb3Jcblx0PC91bD5cbiAgICAqL1xuICAgIGFwaS5tZXRob2QgKCdjYWxsJywgZnVuY3Rpb24gKG15dXJsLCBkYXRhKSB7XG5cdGlmIChkYXRhKSB7XG5cdCAgICByZXR1cm4gaHR0cC5wb3N0KHtcblx0XHRcInVybFwiOiBteXVybCxcblx0XHRcImJvZHlcIiA6IGRhdGFcblx0ICAgIH0pXG5cdH1cblx0cmV0dXJuIGh0dHAuZ2V0KHtcblx0ICAgIFwidXJsXCI6IG15dXJsXG5cdH0pO1xuICAgIH0pO1xuICAgIC8vIGFwaS5tZXRob2QgKCdjYWxsJywgZnVuY3Rpb24gKG9iaikge1xuICAgIC8vIFx0dmFyIHVybCA9IG9iai51cmw7XG4gICAgLy8gXHR2YXIgb25fc3VjY2VzcyA9IG9iai5zdWNjZXNzO1xuICAgIC8vIFx0dmFyIG9uX2Vycm9yICAgPSBvYmouZXJyb3I7XG4gICAgLy8gXHRjb25uZWN0aW9ucysrO1xuICAgIC8vIFx0aHR0cC5nZXQoe1xuICAgIC8vIFx0ICAgIFwidXJsXCIgOiB1cmxcbiAgICAvLyBcdH0sIGZ1bmN0aW9uIChlcnJvciwgcmVzcCkge1xuICAgIC8vIFx0ICAgIGlmIChyZXNwICE9PSB1bmRlZmluZWQgJiYgZXJyb3IgPT0gbnVsbCAmJiBvbl9zdWNjZXNzICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBcdFx0b25fc3VjY2VzcyhKU09OLnBhcnNlKHJlc3AuYm9keSkpO1xuICAgIC8vIFx0ICAgIH1cbiAgICAvLyBcdCAgICBpZiAoZXJyb3IgIT09IG51bGwgJiYgb25fZXJyb3IgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIFx0XHRvbl9lcnJvcihlcnJvcik7XG4gICAgLy8gXHQgICAgfVxuICAgIC8vIFx0fSk7XG4gICAgLy8gfSk7XG5cblxuICAgIGVSZXN0LnVybCA9IHt9O1xuICAgIHZhciB1cmxfYXBpID0gYXBpanMgKGVSZXN0LnVybCk7XG5cdC8qKiBlUmVzdC51cmwuPHN0cm9uZz5yZWdpb248L3N0cm9uZz4gcmV0dXJucyB0aGUgZW5zZW1ibCBSRVNUIHVybCB0byByZXRyaWV2ZSB0aGUgZ2VuZXMgaW5jbHVkZWQgaW4gdGhlIHNwZWNpZmllZCByZWdpb25cblx0ICAgIEBwYXJhbSB7b2JqZWN0fSBvYmogLSBBbiBvYmplY3QgbGl0ZXJhbCB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGRzOjxiciAvPlxuPHVsPlxuPGxpPnNwZWNpZXMgOiBUaGUgc3BlY2llcyB0aGUgcmVnaW9uIHJlZmVycyB0bzwvbGk+XG48bGk+Y2hyICAgICA6IFRoZSBjaHIgKG9yIHNlcV9yZWdpb24gbmFtZSk8L2xpPlxuPGxpPmZyb20gICAgOiBUaGUgc3RhcnQgcG9zaXRpb24gb2YgdGhlIHJlZ2lvbiBpbiB0aGUgY2hyPC9saT5cbjxsaT50byAgICAgIDogVGhlIGVuZCBwb3NpdGlvbiBvZiB0aGUgcmVnaW9uIChmcm9tIDwgdG8gYWx3YXlzKTwvbGk+XG48L3VsPlxuICAgICAgICAgICAgQHJldHVybnMge3N0cmluZ30gLSBUaGUgdXJsIHRvIHF1ZXJ5IHRoZSBFbnNlbWJsIFJFU1Qgc2VydmVyLiBGb3IgYW4gZXhhbXBsZSBvZiBvdXRwdXQgb2YgdGhlc2UgdXJscyBzZWUgdGhlIHtAbGluayBodHRwOi8vYmV0YS5yZXN0LmVuc2VtYmwub3JnL2ZlYXR1cmUvcmVnaW9uL2hvbW9fc2FwaWVucy8xMzozMjg4OTYxMS0zMjk3MzgwNS5qc29uP2ZlYXR1cmU9Z2VuZXxFbnNlbWJsIFJFU1QgQVBJIGV4YW1wbGV9XG5cdCAgICBAZXhhbXBsZVxuZVJlc3QuY2FsbCAoIHVybCAgICAgOiBlUmVzdC51cmwucmVnaW9uICh7IHNwZWNpZXMgOiBcImhvbW9fc2FwaWVuc1wiLCBjaHIgOiBcIjEzXCIsIGZyb20gOiAzMjg4OTYxMSwgdG8gOiAzMjk3MzgwNSB9KSxcbiAgICAgICAgICAgICBzdWNjZXNzIDogY2FsbGJhY2ssXG4gICAgICAgICAgICAgZXJyb3IgICA6IGNhbGxiYWNrXG5cdCAgICk7XG5cdCAqL1xuICAgICB1cmxfYXBpLm1ldGhvZCAoJ3JlZ2lvbicsIGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgdmFyIHByZWZpeF9yZWdpb24gPSBcIi9vdmVybGFwL3JlZ2lvbi9cIjtcbiAgICAgICAgIHZhciBmZWF0dXJlcyA9IG9iai5mZWF0dXJlcyB8fCBbXCJnZW5lXCJdO1xuICAgICAgICAgdmFyIGZlYXR1cmVfb3B0aW9ucyA9IGZlYXR1cmVzLm1hcCAoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICByZXR1cm4gXCJmZWF0dXJlPVwiICsgZDtcbiAgICAgICAgIH0pO1xuICAgICAgICAgdmFyIGZlYXR1cmVfb3B0aW9uc191cmwgPSBmZWF0dXJlX29wdGlvbnMuam9pbihcIiZcIik7XG4gICAgICAgICByZXR1cm4gY29uZmlnLnByb3h5VXJsICsgcHJlZml4X3JlZ2lvbiArXG4gICAgICAgICBvYmouc3BlY2llcyArXG4gICAgICAgICBcIi9cIiArXG4gICAgICAgICBvYmouY2hyICtcbiAgICAgICAgIFwiOlwiICtcbiAgICAgICAgIG9iai5mcm9tICtcbiAgICAgICAgIFwiLVwiICsgb2JqLnRvICtcbiAgICAgICAgIC8vXCIuanNvbj9mZWF0dXJlPWdlbmVcIjtcbiAgICAgICAgIFwiLmpzb24/XCIgKyBmZWF0dXJlX29wdGlvbnNfdXJsO1xuICAgICB9KTtcblxuXHQvKiogZVJlc3QudXJsLjxzdHJvbmc+c3BlY2llc19nZW5lPC9zdHJvbmc+IHJldHVybnMgdGhlIGVuc2VtYmwgUkVTVCB1cmwgdG8gcmV0cmlldmUgdGhlIGVuc2VtYmwgZ2VuZSBhc3NvY2lhdGVkIHdpdGhcblx0ICAgIHRoZSBnaXZlbiBuYW1lIGluIHRoZSBzcGVjaWZpZWQgc3BlY2llcy5cblx0ICAgIEBwYXJhbSB7b2JqZWN0fSBvYmogLSBBbiBvYmplY3QgbGl0ZXJhbCB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGRzOjxiciAvPlxuPHVsPlxuPGxpPnNwZWNpZXMgICA6IFRoZSBzcGVjaWVzIHRoZSByZWdpb24gcmVmZXJzIHRvPC9saT5cbjxsaT5nZW5lX25hbWUgOiBUaGUgbmFtZSBvZiB0aGUgZ2VuZTwvbGk+XG48L3VsPlxuICAgICAgICAgICAgQHJldHVybnMge3N0cmluZ30gLSBUaGUgdXJsIHRvIHF1ZXJ5IHRoZSBFbnNlbWJsIFJFU1Qgc2VydmVyLiBGb3IgYW4gZXhhbXBsZSBvZiBvdXRwdXQgb2YgdGhlc2UgdXJscyBzZWUgdGhlIHtAbGluayBodHRwOi8vYmV0YS5yZXN0LmVuc2VtYmwub3JnL3hyZWZzL3N5bWJvbC9odW1hbi9CUkNBMi5qc29uP29iamVjdF90eXBlPWdlbmV8RW5zZW1ibCBSRVNUIEFQSSBleGFtcGxlfVxuXHQgICAgQGV4YW1wbGVcbmVSZXN0LmNhbGwgKCB1cmwgICAgIDogZVJlc3QudXJsLnNwZWNpZXNfZ2VuZSAoeyBzcGVjaWVzIDogXCJodW1hblwiLCBnZW5lX25hbWUgOiBcIkJSQ0EyXCIgfSksXG4gICAgICAgICAgICAgc3VjY2VzcyA6IGNhbGxiYWNrLFxuICAgICAgICAgICAgIGVycm9yICAgOiBjYWxsYmFja1xuXHQgICApO1xuXHQgKi9cbiAgICB1cmxfYXBpLm1ldGhvZCAoJ3hyZWYnLCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciBwcmVmaXhfeHJlZiA9IFwiL3hyZWZzL3N5bWJvbC9cIjtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5wcm94eVVybCArIHByZWZpeF94cmVmICtcbiAgICAgICAgICAgIG9iai5zcGVjaWVzICArXG4gICAgICAgICAgICBcIi9cIiArXG4gICAgICAgICAgICBvYmoubmFtZSArXG4gICAgICAgICAgICBcIi5qc29uP29iamVjdF90eXBlPWdlbmVcIjtcbiAgICB9KTtcblxuXHQvKiogZVJlc3QudXJsLjxzdHJvbmc+aG9tb2xvZ3Vlczwvc3Ryb25nPiByZXR1cm5zIHRoZSBlbnNlbWJsIFJFU1QgdXJsIHRvIHJldHJpZXZlIHRoZSBob21vbG9ndWVzIChvcnRob2xvZ3VlcyArIHBhcmFsb2d1ZXMpIG9mIHRoZSBnaXZlbiBlbnNlbWJsIElELlxuXHQgICAgQHBhcmFtIHtvYmplY3R9IG9iaiAtIEFuIG9iamVjdCBsaXRlcmFsIHdpdGggdGhlIGZvbGxvd2luZyBmaWVsZHM6PGJyIC8+XG48dWw+XG48bGk+aWQgOiBUaGUgRW5zZW1ibCBJRCBvZiB0aGUgZ2VuZTwvbGk+XG48L3VsPlxuICAgICAgICAgICAgQHJldHVybnMge3N0cmluZ30gLSBUaGUgdXJsIHRvIHF1ZXJ5IHRoZSBFbnNlbWJsIFJFU1Qgc2VydmVyLiBGb3IgYW4gZXhhbXBsZSBvZiBvdXRwdXQgb2YgdGhlc2UgdXJscyBzZWUgdGhlIHtAbGluayBodHRwOi8vYmV0YS5yZXN0LmVuc2VtYmwub3JnL2hvbW9sb2d5L2lkL0VOU0cwMDAwMDEzOTYxOC5qc29uP2Zvcm1hdD1jb25kZW5zZWQ7c2VxdWVuY2U9bm9uZTt0eXBlPWFsbHxFbnNlbWJsIFJFU1QgQVBJIGV4YW1wbGV9XG5cdCAgICBAZXhhbXBsZVxuZVJlc3QuY2FsbCAoIHVybCAgICAgOiBlUmVzdC51cmwuaG9tb2xvZ3VlcyAoeyBpZCA6IFwiRU5TRzAwMDAwMTM5NjE4XCIgfSksXG4gICAgICAgICAgICAgc3VjY2VzcyA6IGNhbGxiYWNrLFxuICAgICAgICAgICAgIGVycm9yICAgOiBjYWxsYmFja1xuXHQgICApO1xuXHQgKi9cbiAgICB1cmxfYXBpLm1ldGhvZCAoJ2hvbW9sb2d1ZXMnLCBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgdmFyIHByZWZpeF9ob21vbG9ndWVzID0gXCIvaG9tb2xvZ3kvaWQvXCI7XG4gICAgICAgIHJldHVybiBjb25maWcucHJveHlVcmwgKyBwcmVmaXhfaG9tb2xvZ3VlcyArXG4gICAgICAgICAgICBvYmouaWQgK1xuICAgICAgICAgICAgXCIuanNvbj9mb3JtYXQ9Y29uZGVuc2VkO3NlcXVlbmNlPW5vbmU7dHlwZT1hbGxcIjtcbiAgICB9KTtcblxuXHQvKiogZVJlc3QudXJsLjxzdHJvbmc+Z2VuZTwvc3Ryb25nPiByZXR1cm5zIHRoZSBlbnNlbWJsIFJFU1QgdXJsIHRvIHJldHJpZXZlIHRoZSBlbnNlbWJsIGdlbmUgYXNzb2NpYXRlZCB3aXRoXG5cdCAgICB0aGUgZ2l2ZW4gSURcblx0ICAgIEBwYXJhbSB7b2JqZWN0fSBvYmogLSBBbiBvYmplY3QgbGl0ZXJhbCB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGRzOjxiciAvPlxuPHVsPlxuPGxpPmlkIDogVGhlIG5hbWUgb2YgdGhlIGdlbmU8L2xpPlxuPGxpPmV4cGFuZCA6IGlmIHRyYW5zY3JpcHRzIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgcmVzcG9uc2UgKGRlZmF1bHQgdG8gMCk8L2xpPlxuPC91bD5cbiAgICAgICAgICAgIEByZXR1cm5zIHtzdHJpbmd9IC0gVGhlIHVybCB0byBxdWVyeSB0aGUgRW5zZW1ibCBSRVNUIHNlcnZlci4gRm9yIGFuIGV4YW1wbGUgb2Ygb3V0cHV0IG9mIHRoZXNlIHVybHMgc2VlIHRoZSB7QGxpbmsgaHR0cDovL2JldGEucmVzdC5lbnNlbWJsLm9yZy9sb29rdXAvRU5TRzAwMDAwMTM5NjE4Lmpzb24/Zm9ybWF0PWZ1bGx8RW5zZW1ibCBSRVNUIEFQSSBleGFtcGxlfVxuXHQgICAgQGV4YW1wbGVcbmVSZXN0LmNhbGwgKCB1cmwgICAgIDogZVJlc3QudXJsLmdlbmUgKHsgaWQgOiBcIkVOU0cwMDAwMDEzOTYxOFwiIH0pLFxuICAgICAgICAgICAgIHN1Y2Nlc3MgOiBjYWxsYmFjayxcbiAgICAgICAgICAgICBlcnJvciAgIDogY2FsbGJhY2tcblx0ICAgKTtcblx0ICovXG4gICAgdXJsX2FwaS5tZXRob2QgKCdnZW5lJywgZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHZhciBwcmVmaXhfZW5zZ2VuZSA9IFwiL2xvb2t1cC9pZC9cIjtcbiAgICAgICAgdmFyIHVybCA9IGNvbmZpZy5wcm94eVVybCArIHByZWZpeF9lbnNnZW5lICsgb2JqLmlkICsgXCIuanNvbj9mb3JtYXQ9ZnVsbFwiO1xuICAgICAgICBpZiAob2JqLmV4cGFuZCAmJiBvYmouZXhwYW5kID09PSAxKSB7XG4gICAgICAgICAgICB1cmwgPSB1cmwgKyBcIiZleHBhbmQ9MVwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfSk7XG5cblx0LyoqIGVSZXN0LnVybC48c3Ryb25nPmNocl9pbmZvPC9zdHJvbmc+IHJldHVybnMgdGhlIGVuc2VtYmwgUkVTVCB1cmwgdG8gcmV0cmlldmUgdGhlIGluZm9ybWF0aW9uIGFzc29jaWF0ZWQgd2l0aCB0aGUgY2hyb21vc29tZSAoc2VxX3JlZ2lvbiBpbiBFbnNlbWJsIG5vbWVuY2xhdHVyZSkuXG5cdCAgICBAcGFyYW0ge29iamVjdH0gb2JqIC0gQW4gb2JqZWN0IGxpdGVyYWwgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczo8YnIgLz5cbjx1bD5cbjxsaT5zcGVjaWVzIDogVGhlIHNwZWNpZXMgdGhlIGNociAob3Igc2VxX3JlZ2lvbikgYmVsb25ncyB0b1xuPGxpPmNociAgICAgOiBUaGUgbmFtZSBvZiB0aGUgY2hyIChvciBzZXFfcmVnaW9uKTwvbGk+XG48L3VsPlxuICAgICAgICAgICAgQHJldHVybnMge3N0cmluZ30gLSBUaGUgdXJsIHRvIHF1ZXJ5IHRoZSBFbnNlbWJsIFJFU1Qgc2VydmVyLiBGb3IgYW4gZXhhbXBsZSBvZiBvdXRwdXQgb2YgdGhlc2UgdXJscyBzZWUgdGhlIHtAbGluayBodHRwOi8vYmV0YS5yZXN0LmVuc2VtYmwub3JnL2Fzc2VtYmx5L2luZm8vaG9tb19zYXBpZW5zLzEzLmpzb24/Zm9ybWF0PWZ1bGx8RW5zZW1ibCBSRVNUIEFQSSBleGFtcGxlfVxuXHQgICAgQGV4YW1wbGVcbmVSZXN0LmNhbGwgKCB1cmwgICAgIDogZVJlc3QudXJsLmNocl9pbmZvICh7IHNwZWNpZXMgOiBcImhvbW9fc2FwaWVuc1wiLCBjaHIgOiBcIjEzXCIgfSksXG4gICAgICAgICAgICAgc3VjY2VzcyA6IGNhbGxiYWNrLFxuICAgICAgICAgICAgIGVycm9yICAgOiBjYWxsYmFja1xuXHQgICApO1xuXHQgKi9cbiAgICB1cmxfYXBpLm1ldGhvZCAoJ2Nocl9pbmZvJywgZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHZhciBwcmVmaXhfY2hyX2luZm8gPSBcIi9pbmZvL2Fzc2VtYmx5L1wiO1xuICAgICAgICByZXR1cm4gY29uZmlnLnByb3h5VXJsICsgcHJlZml4X2Nocl9pbmZvICtcbiAgICAgICAgICAgIG9iai5zcGVjaWVzICtcbiAgICAgICAgICAgIFwiL1wiICtcbiAgICAgICAgICAgIG9iai5jaHIgK1xuICAgICAgICAgICAgXCIuanNvbj9mb3JtYXQ9ZnVsbFwiO1xuICAgIH0pO1xuXG5cdC8vIFRPRE86IEZvciBub3csIGl0IG9ubHkgd29ya3Mgd2l0aCBzcGVjaWVzX3NldCBhbmQgbm90IHNwZWNpZXNfc2V0X2dyb3Vwc1xuXHQvLyBTaG91bGQgYmUgZXh0ZW5kZWQgZm9yIHdpZGVyIHVzZVxuICAgIHVybF9hcGkubWV0aG9kICgnYWxuX2Jsb2NrJywgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgcHJlZml4X2Fsbl9yZWdpb24gPSBcIi9hbGlnbm1lbnQvcmVnaW9uL1wiO1xuICAgICAgICB2YXIgdXJsID0gY29uZmlnLnByb3h5VXJsICsgcHJlZml4X2Fsbl9yZWdpb24gK1xuICAgICAgICAgICAgb2JqLnNwZWNpZXMgK1xuICAgICAgICAgICAgXCIvXCIgK1xuICAgICAgICAgICAgb2JqLmNociArXG4gICAgICAgICAgICBcIjpcIiArXG4gICAgICAgICAgICBvYmouZnJvbSArXG4gICAgICAgICAgICBcIi1cIiArXG4gICAgICAgICAgICBvYmoudG8gK1xuICAgICAgICAgICAgXCIuanNvbj9tZXRob2Q9XCIgK1xuICAgICAgICAgICAgb2JqLm1ldGhvZDtcblxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8b2JqLnNwZWNpZXNfc2V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB1cmwgKz0gXCImc3BlY2llc19zZXQ9XCIgKyBvYmouc3BlY2llc19zZXRbaV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH0pO1xuXG4gICAgdXJsX2FwaS5tZXRob2QgKCdzZXF1ZW5jZScsIGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIHByZWZpeF9zZXF1ZW5jZSA9IFwiL3NlcXVlbmNlL3JlZ2lvbi9cIjtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5wcm94eVVybCArIHByZWZpeF9zZXF1ZW5jZSArXG4gICAgICAgICAgICBvYmouc3BlY2llcyArXG4gICAgICAgICAgICAnLycgK1xuICAgICAgICAgICAgb2JqLmNociArXG4gICAgICAgICAgICAnOicgK1xuICAgICAgICAgICAgb2JqLmZyb20gK1xuICAgICAgICAgICAgJy4uJyArXG4gICAgICAgICAgICBvYmoudG8gK1xuICAgICAgICAgICAgJz9jb250ZW50LXR5cGU9YXBwbGljYXRpb24vanNvbic7XG4gICAgfSk7XG5cbiAgICB1cmxfYXBpLm1ldGhvZCAoJ3ZhcmlhdGlvbicsIGZ1bmN0aW9uIChvYmopIHtcblx0Ly8gRm9yIG5vdywgb25seSBwb3N0IHJlcXVlc3RzIGFyZSBpbmNsdWRlZFxuICAgICAgICB2YXIgcHJlZml4X3ZhcmlhdGlvbiA9IFwiL3ZhcmlhdGlvbi9cIjtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5wcm94eVVybCArIHByZWZpeF92YXJpYXRpb24gK1xuICAgICAgICAgICAgb2JqLnNwZWNpZXM7XG4gICAgICAgIH0pO1xuXG4gICAgdXJsX2FwaS5tZXRob2QgKCdnZW5lX3RyZWUnLCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciBwcmVmaXhfZ2VuZV90cmVlID0gXCIvZ2VuZXRyZWUvaWQvXCI7XG4gICAgICAgIHJldHVybiBjb25maWcucHJveHlVcmwgKyBwcmVmaXhfZ2VuZV90cmVlICtcbiAgICAgICAgICAgIG9iai5pZCArXG4gICAgICAgICAgICBcIi5qc29uP3NlcXVlbmNlPVwiICtcbiAgICAgICAgICAgICgob2JqLnNlcXVlbmNlIHx8IG9iai5hbGlnbmVkKSA/IDEgOiBcIm5vbmVcIikgK1xuICAgICAgICAgICAgKG9iai5hbGlnbmVkID8gJyZhbGlnbmVkPTEnIDogJycpO1xuICAgIH0pO1xuXG4gICAgdXJsX2FwaS5tZXRob2QoJ2Fzc2VtYmx5JywgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgcHJlZml4X2Fzc2VtYmx5ID0gXCIvaW5mby9hc3NlbWJseS9cIjtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5wcm94eVVybCArIHByZWZpeF9hc3NlbWJseSArXG4gICAgICAgICAgICBvYmouc3BlY2llcyArXG4gICAgICAgICAgICBcIi5qc29uXCI7XG4gICAgICAgIH0pO1xuXG5cbiAgICBhcGkubWV0aG9kICgnY29ubmVjdGlvbnMnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIGNvbm5lY3Rpb25zO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGVSZXN0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X2VSZXN0O1xuIiwiLy8gaWYgKHR5cGVvZiB0bnQgPT09IFwidW5kZWZpbmVkXCIpIHtcbi8vICAgICBtb2R1bGUuZXhwb3J0cyA9IHRudCA9IHt9XG4vLyB9XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC5qc1wiKTtcblxuIiwidmFyIGJvYXJkID0gcmVxdWlyZShcInRudC5ib2FyZFwiKTtcbnZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xuLy92YXIgZW5zZW1ibFJlc3RBUEkgPSByZXF1aXJlKFwidG50LmVuc2VtYmxcIik7XG5cbmJvYXJkLnRyYWNrLmRhdGEucmV0cmlldmVyLmVuc2VtYmwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHN1Y2Nlc3MgPSBbZnVuY3Rpb24gKCkge31dO1xuICAgIHZhciBpZ25vcmUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTtcbiAgICAvL3ZhciBleHRyYSA9IFtdOyAvLyBleHRyYSBmaWVsZHMgdG8gYmUgcGFzc2VkIHRvIHRoZSByZXN0IGFwaVxuICAgIHZhciBlUmVzdCA9IGJvYXJkLnRyYWNrLmRhdGEuZ2Vub21lLnJlc3Q7XG4gICAgdmFyIHVwZGF0ZV90cmFjayA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIGRhdGFfcGFyZW50ID0gdGhpcztcbiAgICAgICAgLy8gT2JqZWN0IGhhcyBsb2MgYW5kIGEgcGx1Zy1pbiBkZWZpbmVkIGNhbGxiYWNrXG4gICAgICAgIHZhciBsb2MgPSBvYmoubG9jO1xuICAgICAgICBpZiAoT2JqZWN0LmtleXModXBkYXRlX3RyYWNrLmV4dHJhKCkpLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIGV4dHJhID0gdXBkYXRlX3RyYWNrLmV4dHJhKCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpdGVtIGluIGV4dHJhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4dHJhLmhhc093blByb3BlcnR5KGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY1tpdGVtXSA9IGV4dHJhW2l0ZW1dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgcGx1Z2luX2NiYWsgPSBvYmoub25fc3VjY2VzcztcbiAgICAgICAgdmFyIHVybCA9IGVSZXN0LnVybFt1cGRhdGVfdHJhY2suZW5kcG9pbnQoKV0obG9jKTtcbiAgICAgICAgaWYgKGlnbm9yZSAobG9jKSkge1xuICAgICAgICAgICAgZGF0YV9wYXJlbnQuZWxlbWVudHMoW10pO1xuICAgICAgICAgICAgcGx1Z2luX2NiYWsoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVSZXN0LmNhbGwodXJsKVxuICAgICAgICAgICAgLnRoZW4gKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlciBkZWZpbmVkXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHN1Y2Nlc3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1vZCA9IHN1Y2Nlc3NbaV0ocmVzcC5ib2R5KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcC5ib2R5ID0gbW9kO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRhdGFfcGFyZW50LmVsZW1lbnRzKHJlc3AuYm9keSk7XG5cbiAgICAgICAgICAgICAgICAvLyBwbHVnLWluIGRlZmluZWRcbiAgICAgICAgICAgICAgICBwbHVnaW5fY2JhaygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGFwaWpzICh1cGRhdGVfdHJhY2spXG4gICAgLmdldHNldCAoJ2VuZHBvaW50JylcbiAgICAuZ2V0c2V0ICgnZXh0cmEnLCB7fSlcblxuICAgIC8vIFRPRE86IFdlIGRvbid0IGhhdmUgYSB3YXkgb2YgcmVzZXR0aW5nIHRoZSBzdWNjZXNzIGFycmF5XG4gICAgLy8gVE9ETzogU2hvdWxkIHRoaXMgYWxzbyBiZSBpbmNsdWRlZCBpbiB0aGUgc3luYyByZXRyaWV2ZXI/XG4gICAgLy8gU3RpbGwgbm90IHN1cmUgdGhpcyBpcyB0aGUgYmVzdCBvcHRpb24gdG8gc3VwcG9ydCBtb3JlIHRoYW4gb25lIGNhbGxiYWNrXG4gICAgdXBkYXRlX3RyYWNrLnN1Y2Nlc3MgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VjY2VzcztcbiAgICAgICAgfVxuICAgICAgICBzdWNjZXNzLnB1c2ggKGNiKTtcbiAgICAgICAgcmV0dXJuIHVwZGF0ZV90cmFjaztcbiAgICB9O1xuXG4gICAgdXBkYXRlX3RyYWNrLmlnbm9yZSA9IGZ1bmN0aW9uIChjYikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBpZ25vcmU7XG4gICAgICAgIH1cbiAgICAgICAgaWdub3JlID0gY2I7XG4gICAgICAgIHJldHVybiB1cGRhdGVfdHJhY2s7XG4gICAgfTtcblxuICAgIHJldHVybiB1cGRhdGVfdHJhY2s7XG59O1xuXG5cbi8vIEEgcHJlZGVmaW5lZCB0cmFjayBmb3Igc2VxdWVuY2VzXG52YXIgZGF0YV9zZXF1ZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGltaXQgPSAxNTA7XG4gICAgdmFyIHRyYWNrX2RhdGEgPSBib2FyZC50cmFjay5kYXRhKCk7XG5cbiAgICB2YXIgdXBkYXRlciA9IGJvYXJkLnRyYWNrLmRhdGEucmV0cmlldmVyLmVuc2VtYmwoKVxuICAgIC5pZ25vcmUgKGZ1bmN0aW9uIChsb2MpIHtcbiAgICAgICAgcmV0dXJuIChsb2MudG8gLSBsb2MuZnJvbSkgPiBsaW1pdDtcbiAgICB9KVxuICAgIC5lbmRwb2ludChcInNlcXVlbmNlXCIpXG4gICAgLnN1Y2Nlc3MgKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgIC8vIEdldCB0aGUgY29vcmRpbmF0ZXNcbiAgICAgICAgdmFyIGZpZWxkcyA9IHJlc3AuaWQuc3BsaXQoXCI6XCIpO1xuICAgICAgICB2YXIgZnJvbSA9IGZpZWxkc1szXTtcbiAgICAgICAgdmFyIG50cyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8cmVzcC5zZXEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICBwb3M6ICtmcm9tICsgaSxcbiAgICAgICAgICAgICAgICBzZXF1ZW5jZTogcmVzcC5zZXFbaV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudHM7XG4gICAgfSk7XG5cbiAgICB0cmFja19kYXRhLmxpbWl0ID0gZnVuY3Rpb24gKG5ld2xpbSkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBsaW1pdDtcbiAgICAgICAgfVxuICAgICAgICBsaW1pdCA9IG5ld2xpbTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJldHVybiB0cmFja19kYXRhLnVwZGF0ZSh1cGRhdGVyKTtcbn07XG5cbi8vIEEgcHJlZGVmaW5lZCB0cmFjayBmb3IgZ2VuZXNcbnZhciBkYXRhX2dlbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHVwZGF0ZXIgPSBib2FyZC50cmFjay5kYXRhLnJldHJpZXZlci5lbnNlbWJsKClcbiAgICAuZW5kcG9pbnQgKFwicmVnaW9uXCIpXG4gICAgLy8gVE9ETzogSWYgc3VjY2VzcyBpcyBkZWZpbmVkIGhlcmUsIG1lYW5zIHRoYXQgaXQgY2FuJ3QgYmUgdXNlci1kZWZpbmVkXG4gICAgLy8gaXMgdGhhdCBnb29kPyBlbm91Z2g/IEFQST9cbiAgICAvLyBVUERBVEU6IE5vdyBzdWNjZXNzIGlzIGJhY2tlZCB1cCBieSBhbiBhcnJheS4gU3RpbGwgZG9uJ3Qga25vdyBpZiB0aGlzIGlzIHRoZSBiZXN0IG9wdGlvblxuICAgIC5zdWNjZXNzIChmdW5jdGlvbiAoZ2VuZXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnZW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGdlbmVzW2ldLnN0cmFuZCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBnZW5lc1tpXS5kaXNwbGF5X2xhYmVsID0gXCI8XCIgKyBnZW5lc1tpXS5leHRlcm5hbF9uYW1lO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBnZW5lc1tpXS5kaXNwbGF5X2xhYmVsID0gZ2VuZXNbaV0uZXh0ZXJuYWxfbmFtZSArIFwiPlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGJvYXJkLnRyYWNrLmRhdGEoKS51cGRhdGUodXBkYXRlcik7XG59O1xuXG52YXIgZGF0YV90cmFuc2NyaXB0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB1cGRhdGVyID0gYm9hcmQudHJhY2suZGF0YS5yZXRyaWV2ZXIuZW5zZW1ibCgpXG4gICAgLmVuZHBvaW50IChcInJlZ2lvblwiKVxuICAgIC5leHRyYSAoe1xuICAgICAgICBcImZlYXR1cmVzXCIgOiBbXCJnZW5lXCIsIFwidHJhbnNjcmlwdFwiLCBcImV4b25cIiwgXCJjZHNcIl0sXG4gICAgfSlcbiAgICAgLnN1Y2Nlc3MgKGZ1bmN0aW9uIChlbGVtcykge1xuICAgICAgICB2YXIgdHJhbnNjcmlwdHMgPSB7fTtcbiAgICAgICAgdmFyIGdlbmVzID0ge307XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxlbGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGVsZW0gPSBlbGVtc1tpXTtcbiAgICAgICAgICAgIHN3aXRjaCAoZWxlbS5mZWF0dXJlX3R5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiZ2VuZVwiIDpcbiAgICAgICAgICAgICAgICBnZW5lc1tlbGVtLmlkXSA9IGVsZW07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcInRyYW5zY3JpcHRcIiA6XG4gICAgICAgICAgICAgICAgdmFyIG5ld1RyYW5zY3JpcHQgPSB7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRcIiA6IGVsZW0uaWQsXG4gICAgICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IGVsZW0uZXh0ZXJuYWxfbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCIgOiBlbGVtLnN0cmFuZCA9PT0gLTEgPyAoXCI8XCIgKyBlbGVtLmV4dGVybmFsX25hbWUpIDogKGVsZW0uZXh0ZXJuYWxfbmFtZSArIFwiPlwiKSxcbiAgICAgICAgICAgICAgICAgICAgXCJzdGFydFwiIDogZWxlbS5zdGFydCxcbiAgICAgICAgICAgICAgICAgICAgXCJlbmRcIiA6IGVsZW0uZW5kLFxuICAgICAgICAgICAgICAgICAgICBcInN0cmFuZFwiIDogZWxlbS5zdHJhbmQsXG4gICAgICAgICAgICAgICAgICAgIFwiZ2VuZVwiIDogZ2VuZXNbZWxlbS5QYXJlbnRdLFxuICAgICAgICAgICAgICAgICAgICBcInRyYW5zY3JpcHRcIiA6IGVsZW0sXG4gICAgICAgICAgICAgICAgICAgIFwicmF3RXhvbnNcIiA6IFtdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0cmFuc2NyaXB0c1tlbGVtLmlkXSA9IG5ld1RyYW5zY3JpcHQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIFwiZXhvblwiIDpcbiAgICAgICAgICAgICAgICB2YXIgbmV3RXhvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0cmFuc2NyaXB0XCIgOiBlbGVtLlBhcmVudCxcbiAgICAgICAgICAgICAgICAgICAgXCJzdGFydFwiIDogZWxlbS5zdGFydCxcbiAgICAgICAgICAgICAgICAgICAgXCJlbmRcIiA6IGVsZW0uZW5kXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0cmFuc2NyaXB0c1tlbGVtLlBhcmVudF0ucmF3RXhvbnMucHVzaChuZXdFeG9uKVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBcImNkc1wiIDpcbiAgICAgICAgICAgICAgICBpZiAodHJhbnNjcmlwdHNbZWxlbS5QYXJlbnRdLlRyYW5zbGF0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNjcmlwdHNbZWxlbS5QYXJlbnRdLlRyYW5zbGF0aW9uID0ge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjZHNTdGFydCA9IHRyYW5zY3JpcHRzW2VsZW0uUGFyZW50XS5UcmFuc2xhdGlvbi5zdGFydDtcbiAgICAgICAgICAgICAgICBpZiAoKGNkc1N0YXJ0ID09PSB1bmRlZmluZWQpIHx8IChjZHNTdGFydCA+IGVsZW0uc3RhcnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zY3JpcHRzW2VsZW0uUGFyZW50XS5UcmFuc2xhdGlvbi5zdGFydCA9IGVsZW0uc3RhcnQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGNkc0VuZCA9IHRyYW5zY3JpcHRzW2VsZW0uUGFyZW50XS5UcmFuc2xhdGlvbi5lbmQ7XG4gICAgICAgICAgICAgICAgaWYgKChjZHNFbmQgPT09IHVuZGVmaW5lZCkgfHwgKGNkc0VuZCA8IGVsZW0uZW5kKSkge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2NyaXB0c1tlbGVtLlBhcmVudF0uVHJhbnNsYXRpb24uZW5kID0gZWxlbS5lbmQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciB0cyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpZCBpbiB0cmFuc2NyaXB0cykge1xuICAgICAgICAgICAgaWYgKHRyYW5zY3JpcHRzLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgICAgICAgICAgIHZhciB0ID0gdHJhbnNjcmlwdHNbaWRdO1xuICAgICAgICAgICAgICAgIHZhciBvYmogPSBleG9uc1RvRXhvbnNBbmRJbnRyb25zICh0cmFuc2Zvcm1FeG9ucyh0KSwgdCk7XG4gICAgICAgICAgICAgICAgb2JqLm5hbWUgPSBbe1xuICAgICAgICAgICAgICAgICAgICBwb3M6IHQuc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIG5hbWUgOiB0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHN0cmFuZCA6IHQuc3RyYW5kLFxuICAgICAgICAgICAgICAgICAgICB0cmFuc2NyaXB0IDogdFxuICAgICAgICAgICAgICAgIH1dO1xuICAgICAgICAgICAgICAgIG9iai5rZXkgPSAodC5pZCArIFwiX1wiICsgb2JqLmV4b25zLmxlbmd0aClcbiAgICAgICAgICAgICAgICBvYmouaWQgPSB0LmlkO1xuICAgICAgICAgICAgICAgIG9iai5nZW5lID0gdC5nZW5lO1xuICAgICAgICAgICAgICAgIG9iai50cmFuc2NyaXB0ID0gdC50cmFuc2NyaXB0O1xuICAgICAgICAgICAgICAgIG9iai5leHRlcm5hbF9uYW1lID0gdC5sYWJlbDtcbiAgICAgICAgICAgICAgICBvYmouZGlzcGxheV9sYWJlbCA9IHQubmFtZTtcbiAgICAgICAgICAgICAgICBvYmouc3RhcnQgPSB0LnN0YXJ0O1xuICAgICAgICAgICAgICAgIG9iai5lbmQgPSB0LmVuZDtcbiAgICAgICAgICAgICAgICB0cy5wdXNoKG9iailcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHM7XG5cbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGV4b25zVG9FeG9uc0FuZEludHJvbnMgKGV4b25zLCB0KSB7XG4gICAgICAgIHZhciBvYmogPSB7fTtcbiAgICAgICAgb2JqLmV4b25zID0gZXhvbnM7XG4gICAgICAgIG9iai5pbnRyb25zID0gW107XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxleG9ucy5sZW5ndGgtMTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaW50cm9uID0ge1xuICAgICAgICAgICAgICAgIHN0YXJ0IDogZXhvbnNbaV0udHJhbnNjcmlwdC5zdHJhbmQgPT09IDEgPyBleG9uc1tpXS5lbmQgOiBleG9uc1tpXS5zdGFydCxcbiAgICAgICAgICAgICAgICBlbmQgICA6IGV4b25zW2ldLnRyYW5zY3JpcHQuc3RyYW5kID09PSAxID8gZXhvbnNbaSsxXS5zdGFydCA6IGV4b25zW2krMV0uZW5kLFxuICAgICAgICAgICAgICAgIHRyYW5zY3JpcHQgOiB0XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgb2JqLmludHJvbnMucHVzaChpbnRyb24pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiB0cmFuc2Zvcm1FeG9ucyAodHJhbnNjcmlwdCkge1xuICAgICAgICB2YXIgdHJhbnNsYXRpb25TdGFydDtcbiAgICAgICAgdmFyIHRyYW5zbGF0aW9uRW5kO1xuICAgICAgICBpZiAodHJhbnNjcmlwdC5UcmFuc2xhdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0cmFuc2xhdGlvblN0YXJ0ID0gdHJhbnNjcmlwdC5UcmFuc2xhdGlvbi5zdGFydDtcbiAgICAgICAgICAgIHRyYW5zbGF0aW9uRW5kID0gdHJhbnNjcmlwdC5UcmFuc2xhdGlvbi5lbmQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGV4b25zID0gdHJhbnNjcmlwdC5yYXdFeG9ucztcblxuICAgICAgICB2YXIgbmV3RXhvbnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPGV4b25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodHJhbnNjcmlwdC5UcmFuc2xhdGlvbiA9PT0gdW5kZWZpbmVkKSB7IC8vIE5PIGNvZGluZyB0cmFuc2NyaXB0XG4gICAgICAgICAgICAgICAgbmV3RXhvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0ICAgOiBleG9uc1tpXS5zdGFydCxcbiAgICAgICAgICAgICAgICAgICAgZW5kICAgICA6IGV4b25zW2ldLmVuZCxcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNjcmlwdCA6IHRyYW5zY3JpcHQsXG4gICAgICAgICAgICAgICAgICAgIGNvZGluZyAgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICA6IGV4b25zW2ldLnN0YXJ0IC0gdHJhbnNjcmlwdC5zdGFydFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhvbnNbaV0uc3RhcnQgPCB0cmFuc2xhdGlvblN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIDUnXG4gICAgICAgICAgICAgICAgICAgIGlmIChleG9uc1tpXS5lbmQgPCB0cmFuc2xhdGlvblN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb21wbGV0ZWx5IG5vbiBjb2RpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0V4b25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0ICA6IGV4b25zW2ldLnN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZCAgICA6IGV4b25zW2ldLmVuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2NyaXB0IDogdHJhbnNjcmlwdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RpbmcgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgIDogZXhvbnNbaV0uc3RhcnQgLSB0cmFuc2NyaXB0LnN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhcyA1J1VUUlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5jRXhvbjUgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQgIDogZXhvbnNbaV0uc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kICAgIDogdHJhbnNsYXRpb25TdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2NyaXB0IDogdHJhbnNjcmlwdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RpbmcgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgIDogZXhvbnNbaV0uc3RhcnQgLSB0cmFuc2NyaXB0LnN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGluZ0V4b241ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0ICA6IHRyYW5zbGF0aW9uU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kICAgIDogZXhvbnNbaV0uZW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zY3JpcHQgOiB0cmFuc2NyaXB0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGluZyA6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICA6IGV4b25zW2ldLnN0YXJ0IC0gdHJhbnNjcmlwdC5zdGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleG9uc1tpXS5zdHJhbmQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdFeG9ucy5wdXNoKG5jRXhvbjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0V4b25zLnB1c2goY29kaW5nRXhvbjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdFeG9ucy5wdXNoKGNvZGluZ0V4b241KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdFeG9ucy5wdXNoKG5jRXhvbjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChleG9uc1tpXS5lbmQgPiB0cmFuc2xhdGlvbkVuZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyAzJ1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXhvbnNbaV0uc3RhcnQgPiB0cmFuc2xhdGlvbkVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tcGxldGVseSBub24gY29kaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdFeG9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydCAgIDogZXhvbnNbaV0uc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kICAgICA6IGV4b25zW2ldLmVuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2NyaXB0IDogdHJhbnNjcmlwdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RpbmcgIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICA6IGV4b25zW2ldLnN0YXJ0IC0gdHJhbnNjcmlwdC5zdGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIYXMgMydVVFJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2RpbmdFeG9uMyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydCAgOiBleG9uc1tpXS5zdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQgICAgOiB0cmFuc2xhdGlvbkVuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2NyaXB0IDogdHJhbnNjcmlwdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RpbmcgOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCAgOiBleG9uc1tpXS5zdGFydCAtIHRyYW5zY3JpcHQuc3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmNFeG9uMyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydCAgOiB0cmFuc2xhdGlvbkVuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQgICAgOiBleG9uc1tpXS5lbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNjcmlwdCA6IHRyYW5zY3JpcHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kaW5nIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICA6IGV4b25zW2ldLnN0YXJ0IC0gdHJhbnNjcmlwdC5zdGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleG9uc1tpXS5zdHJhbmQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdFeG9ucy5wdXNoKGNvZGluZ0V4b24zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdFeG9ucy5wdXNoKG5jRXhvbjMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdFeG9ucy5wdXNoKG5jRXhvbjMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0V4b25zLnB1c2goY29kaW5nRXhvbjMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29kaW5nIGV4b25cbiAgICAgICAgICAgICAgICAgICAgbmV3RXhvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydCAgOiBleG9uc1tpXS5zdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZCAgICA6IGV4b25zW2ldLmVuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zY3JpcHQgOiB0cmFuc2NyaXB0LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29kaW5nIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCAgOiBleG9uc1tpXS5zdGFydCAtIHRyYW5zY3JpcHQuc3RhcnRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdFeG9ucztcbiAgICB9XG5cbiAgICByZXR1cm4gYm9hcmQudHJhY2suZGF0YSgpLnVwZGF0ZSh1cGRhdGVyKTtcbn07XG5cbi8vIGV4cG9ydFxudmFyIGdlbm9tZV9kYXRhID0ge1xuICAgIGdlbmUgOiBkYXRhX2dlbmUsXG4gICAgc2VxdWVuY2UgOiBkYXRhX3NlcXVlbmNlLFxuICAgIHRyYW5zY3JpcHQgOiBkYXRhX3RyYW5zY3JpcHRcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGdlbm9tZV9kYXRhO1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZSAoXCJ0bnQuYXBpXCIpO1xudmFyIGxheW91dCA9IHJlcXVpcmUoXCIuL2xheW91dC5qc1wiKTtcbnZhciBib2FyZCA9IHJlcXVpcmUoXCJ0bnQuYm9hcmRcIik7XG5cbnZhciB0bnRfZmVhdHVyZV90cmFuc2NyaXB0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmZWF0dXJlID0gYm9hcmQudHJhY2suZmVhdHVyZSgpXG4gICAgICAgIC5sYXlvdXQgKGJvYXJkLnRyYWNrLmxheW91dC5mZWF0dXJlKCkpXG4gICAgICAgIC5pbmRleCAoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkLmtleTtcbiAgICAgICAgfSk7XG5cbiAgICBmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKG5ld19lbGVtcywgeFNjYWxlKSB7XG4gICAgICAgIHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHZhciBncyA9IG5ld19lbGVtc1xuICAgICAgICAgICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeFNjYWxlKGQuc3RhcnQpICsgXCIsXCIgKyAoZmVhdHVyZS5sYXlvdXQoKS5nZW5lX3Nsb3QoKS5zbG90X2hlaWdodCAqIGQuc2xvdCkgKyBcIilcIjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIC8vIGdlbmUgb3V0bGluZVxuICAgICAgICAvLyBnc1xuICAgICAgICAvLyAgICAgLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgLy8gICAgIC5hdHRyKFwieFwiLCAwKVxuICAgICAgICAvLyAgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgICAgIC8vICAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIC8vICAgICAgICAgcmV0dXJuICh4U2NhbGUoZC5lbmQpIC0geFNjYWxlKGQuc3RhcnQpKTtcbiAgICAgICAgLy8gICAgIH0pXG4gICAgICAgIC8vICAgICAuYXR0cihcImhlaWdodFwiLCBmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLmdlbmVfaGVpZ2h0KVxuICAgICAgICAvLyAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAvLyAgICAgLmF0dHIoXCJzdHJva2VcIiwgdHJhY2suYmFja2dyb3VuZF9jb2xvcigpKVxuICAgICAgICAvLyAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAvLyAgICAgLmR1cmF0aW9uKDUwMClcbiAgICAgICAgLy8gICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZlYXR1cmUuZm9yZWdyb3VuZF9jb2xvcigpKVxuICAgICAgICBnc1xuICAgICAgICAgICAgLmFwcGVuZChcImxpbmVcIilcbiAgICAgICAgICAgIC5hdHRyKFwieDFcIiwgMClcbiAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgfn4oZmVhdHVyZS5sYXlvdXQoKS5nZW5lX3Nsb3QoKS5nZW5lX2hlaWdodC8yKSlcbiAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgfn4oZmVhdHVyZS5sYXlvdXQoKS5nZW5lX3Nsb3QoKS5nZW5lX2hlaWdodC8yKSlcbiAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIHRyYWNrLmJhY2tncm91bmRfY29sb3IoKSlcbiAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDIpXG4gICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAuZHVyYXRpb24oNTAwKVxuICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yKCkpXG5cbiAgICAgICAgLy8gZXhvbnNcbiAgICAgICAgLy8gcGFzcyB0aGUgXCJzbG90XCIgdG8gdGhlIGV4b25zIGFuZCBpbnRyb25zXG4gICAgICAgIG5ld19lbGVtcy5lYWNoIChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgaWYgKGQuZXhvbnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8ZC5leG9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBkLmV4b25zW2ldLnNsb3QgPSBkLnNsb3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZXhvbnMgPSBncy5zZWxlY3RBbGwoXCIuZXhvbnNcIilcbiAgICAgICAgICAgIC5kYXRhKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQuZXhvbnMgfHwgW107XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLnN0YXJ0O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgZXhvbnNcbiAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9leG9uc1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh4U2NhbGUoZC5zdGFydCArIGQub2Zmc2V0KSAtIHhTY2FsZShkLnN0YXJ0KSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh4U2NhbGUoZC5lbmQpIC0geFNjYWxlKGQuc3RhcnQpKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLmdlbmVfaGVpZ2h0KVxuICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmJhY2tncm91bmRfY29sb3IoKSlcbiAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIHRyYWNrLmJhY2tncm91bmRfY29sb3IoKSlcbiAgICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgIC5kdXJhdGlvbig1MDApXG4gICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBmZWF0dXJlLmZvcmVncm91bmRfY29sb3IoKSlcbiAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChkLmNvZGluZykge1xuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZlYXR1cmUuZm9yZWdyb3VuZF9jb2xvcigpKGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZC5jb2RpbmcgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcInBpbmtcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZlYXR1cmUuZm9yZWdyb3VuZF9jb2xvcigpKGQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbGFiZWxzXG4gICAgICAgIGdzXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9uYW1lXCIpXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgMClcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCAyNSlcbiAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCB0cmFjay5iYWNrZ3JvdW5kX2NvbG9yKCkpXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLnNob3dfbGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQuZGlzcGxheV9sYWJlbDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0eWxlKFwiZm9udC13ZWlnaHRcIiwgXCJub3JtYWxcIilcbiAgICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgIC5kdXJhdGlvbig1MDApXG4gICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yKCkpO1xuXG4gICAgfSlcblxuICAgIGZlYXR1cmUudXBkYXRlciAoZnVuY3Rpb24gKHRyYW5zY3JpcHRzLCB4U2NhbGUpIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdmFyIGdzID0gdHJhbnNjcmlwdHMuc2VsZWN0KFwiZ1wiKVxuICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgLmR1cmF0aW9uKDIwMClcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeFNjYWxlKGQuc3RhcnQpICsgXCIsXCIgKyAoZmVhdHVyZS5sYXlvdXQoKS5nZW5lX3Nsb3QoKS5zbG90X2hlaWdodCAqIGQuc2xvdCkgKyBcIilcIjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBnc1xuICAgICAgICAgICAgLnNlbGVjdEFsbCAoXCJyZWN0XCIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLmdlbmVfaGVpZ2h0KTtcbiAgICAgICAgZ3NcbiAgICAgICAgICAgIC5zZWxlY3RBbGwoXCJsaW5lXCIpXG4gICAgICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh4U2NhbGUoZC5lbmQpIC0geFNjYWxlKGQuc3RhcnQpKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcInkxXCIsIH5+KGZlYXR1cmUubGF5b3V0KCkuZ2VuZV9zbG90KCkuZ2VuZV9oZWlnaHQvMikpXG4gICAgICAgICAgICAuYXR0cihcInkyXCIsIH5+KGZlYXR1cmUubGF5b3V0KCkuZ2VuZV9zbG90KCkuZ2VuZV9oZWlnaHQvMikpO1xuICAgICAgICBnc1xuICAgICAgICAgICAgLnNlbGVjdCAoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAudGV4dCAoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZmVhdHVyZS5sYXlvdXQoKS5nZW5lX3Nsb3QoKS5zaG93X2xhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkLmRpc3BsYXlfbGFiZWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLm1vdmVyIChmdW5jdGlvbiAodHJhbnNjcmlwdHMsIHhTY2FsZSkge1xuICAgICAgICB2YXIgZ3MgPSB0cmFuc2NyaXB0cy5zZWxlY3QoXCJnXCIpXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIHhTY2FsZShkLnN0YXJ0KSArIFwiLFwiICsgKGZlYXR1cmUubGF5b3V0KCkuZ2VuZV9zbG90KCkuc2xvdF9oZWlnaHQgKiBkLnNsb3QpICsgXCIpXCI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgZ3Muc2VsZWN0QWxsKFwibGluZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoeFNjYWxlKGQuZW5kKSAtIHhTY2FsZShkLnN0YXJ0KSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCB+fihmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLmdlbmVfaGVpZ2h0LzIpKVxuICAgICAgICAgICAgLmF0dHIoXCJ5MlwiLCB+fihmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLmdlbmVfaGVpZ2h0LzIpKVxuICAgICAgICAgICAgLy8gLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiAoeFNjYWxlKGQuZW5kKSAtIHhTY2FsZShkLnN0YXJ0KSk7XG4gICAgICAgICAgICAvLyB9KVxuICAgICAgICBncy5zZWxlY3RBbGwoXCJyZWN0XCIpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh4U2NhbGUoZC5lbmQpIC0geFNjYWxlKGQuc3RhcnQpKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIGdzLnNlbGVjdEFsbChcIi50bnRfZXhvbnNcIilcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoeFNjYWxlKGQuc3RhcnQgKyBkLm9mZnNldCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxuXG52YXIgdG50X2ZlYXR1cmVfc2VxdWVuY2UgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgY29uZmlnID0ge1xuICAgICAgICBmb250c2l6ZSA6IDEwLFxuICAgICAgICBzZXF1ZW5jZSA6IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZC5zZXF1ZW5jZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyAnSW5oZXJpdCcgZnJvbSB0bnQudHJhY2suZmVhdHVyZVxuICAgIHZhciBmZWF0dXJlID0gYm9hcmQudHJhY2suZmVhdHVyZSgpXG4gICAgLmluZGV4IChmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gZC5wb3M7XG4gICAgfSk7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGZlYXR1cmUpXG4gICAgLmdldHNldCAoY29uZmlnKTtcblxuXG4gICAgZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChuZXdfbnRzLCB4U2NhbGUpIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcblxuICAgICAgICBuZXdfbnRzXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmJhY2tncm91bmRfY29sb3IoKSlcbiAgICAgICAgICAgIC5zdHlsZSgnZm9udC1zaXplJywgY29uZmlnLmZvbnRzaXplICsgXCJweFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZSAoZC5wb3MpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB+fih0cmFjay5oZWlnaHQoKSAvIDIpICsgNTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3R5bGUoXCJmb250LWZhbWlseVwiLCAnXCJMdWNpZGEgQ29uc29sZVwiLCBNb25hY28sIG1vbm9zcGFjZScpXG4gICAgICAgICAgICAudGV4dChjb25maWcuc2VxdWVuY2UpXG4gICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAuZHVyYXRpb24oNTAwKVxuICAgICAgICAgICAgLmF0dHIoJ2ZpbGwnLCBmZWF0dXJlLmZvcmVncm91bmRfY29sb3IoKSk7XG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLm1vdmVyIChmdW5jdGlvbiAobnRzLCB4U2NhbGUpIHtcbiAgICAgICAgbnRzLnNlbGVjdCAoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlKGQucG9zKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxudmFyIHRudF9mZWF0dXJlX2dlbmUgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAvLyAnSW5oZXJpdCcgZnJvbSB0bnQudHJhY2suZmVhdHVyZVxuICAgIHZhciBmZWF0dXJlID0gYm9hcmQudHJhY2suZmVhdHVyZSgpXG5cdC5sYXlvdXQoYm9hcmQudHJhY2subGF5b3V0LmZlYXR1cmUoKSlcblx0LmluZGV4KGZ1bmN0aW9uIChkKSB7XG5cdCAgICByZXR1cm4gZC5pZDtcblx0fSk7XG5cbiAgICBmZWF0dXJlLmNyZWF0ZShmdW5jdGlvbiAobmV3X2VsZW1zLCB4U2NhbGUpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblx0bmV3X2VsZW1zXG5cdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIHhTY2FsZShkLnN0YXJ0KTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZmVhdHVyZS5sYXlvdXQoKS5nZW5lX3Nsb3QoKS5zbG90X2hlaWdodCAqIGQuc2xvdDtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuICh4U2NhbGUoZC5lbmQpIC0geFNjYWxlKGQuc3RhcnQpKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCBmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLmdlbmVfaGVpZ2h0KVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmJhY2tncm91bmRfY29sb3IoKSlcblx0ICAgIC50cmFuc2l0aW9uKClcblx0ICAgIC5kdXJhdGlvbig1MDApXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC5jb2xvciA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHJldHVybiBmZWF0dXJlLmZvcmVncm91bmRfY29sb3IoKTtcblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gZC5jb2xvcjtcblx0XHR9XG5cdCAgICB9KTtcblxuXHRuZXdfZWxlbXNcblx0ICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X25hbWVcIilcblx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiB4U2NhbGUoZC5zdGFydCk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIChmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLnNsb3RfaGVpZ2h0ICogZC5zbG90KSArIDI1O1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiZmlsbFwiLCB0cmFjay5iYWNrZ3JvdW5kX2NvbG9yKCkpXG5cdCAgICAudGV4dChmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLnNob3dfbGFiZWwpIHtcblx0XHQgICAgcmV0dXJuIGQuZGlzcGxheV9sYWJlbDtcblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gXCJcIjtcblx0XHR9XG5cdCAgICB9KVxuXHQgICAgLnN0eWxlKFwiZm9udC13ZWlnaHRcIiwgXCJub3JtYWxcIilcblx0ICAgIC50cmFuc2l0aW9uKClcblx0ICAgIC5kdXJhdGlvbig1MDApXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZmVhdHVyZS5mb3JlZ3JvdW5kX2NvbG9yKCk7XG5cdCAgICB9KTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUudXBkYXRlcihmdW5jdGlvbiAoZ2VuZXMpIHtcblx0dmFyIHRyYWNrID0gdGhpcztcblx0Z2VuZXNcblx0ICAgIC5zZWxlY3QoXCJyZWN0XCIpXG5cdCAgICAudHJhbnNpdGlvbigpXG5cdCAgICAuZHVyYXRpb24oNTAwKVxuXHQgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIChmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLnNsb3RfaGVpZ2h0ICogZC5zbG90KTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImhlaWdodFwiLCBmZWF0dXJlLmxheW91dCgpLmdlbmVfc2xvdCgpLmdlbmVfaGVpZ2h0KTtcblxuXHRnZW5lc1xuXHQgICAgLnNlbGVjdChcInRleHRcIilcblx0ICAgIC50cmFuc2l0aW9uKClcblx0ICAgIC5kdXJhdGlvbig1MDApXG5cdCAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gKGZlYXR1cmUubGF5b3V0KCkuZ2VuZV9zbG90KCkuc2xvdF9oZWlnaHQgKiBkLnNsb3QpICsgMjU7XG5cdCAgICB9KVxuXHQgICAgLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZmVhdHVyZS5sYXlvdXQoKS5nZW5lX3Nsb3QoKS5zaG93X2xhYmVsKSB7XG5cdFx0ICAgIHJldHVybiBkLmRpc3BsYXlfbGFiZWw7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0XHQgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLm1vdmVyKGZ1bmN0aW9uIChnZW5lcywgeFNjYWxlKSB7XG5cdGdlbmVzLnNlbGVjdChcInJlY3RcIilcblx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiB4U2NhbGUoZC5zdGFydCk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiAoeFNjYWxlKGQuZW5kKSAtIHhTY2FsZShkLnN0YXJ0KSk7XG5cdCAgICB9KTtcblxuXHRnZW5lcy5zZWxlY3QoXCJ0ZXh0XCIpXG5cdCAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiB4U2NhbGUoZC5zdGFydCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG52YXIgZ2Vub21lX2ZlYXR1cmVzID0ge1xuICAgIGdlbmUgOiB0bnRfZmVhdHVyZV9nZW5lLFxuICAgIHNlcXVlbmNlIDogdG50X2ZlYXR1cmVfc2VxdWVuY2UsXG4gICAgdHJhbnNjcmlwdCA6IHRudF9mZWF0dXJlX3RyYW5zY3JpcHRcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBnZW5vbWVfZmVhdHVyZXM7XG4iLCJ2YXIgdG50X3Jlc3QgPSByZXF1aXJlKFwidG50LmVuc2VtYmxcIik7XG52YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciB0bnRfYm9hcmQgPSByZXF1aXJlKFwidG50LmJvYXJkXCIpO1xudG50X2JvYXJkLnRyYWNrLmRhdGEuZ2Vub21lID0gcmVxdWlyZShcIi4vZGF0YS5qc1wiKTtcbnRudF9ib2FyZC50cmFjay5mZWF0dXJlLmdlbm9tZSA9IHJlcXVpcmUoXCIuL2ZlYXR1cmVcIik7XG50bnRfYm9hcmQudHJhY2subGF5b3V0LmZlYXR1cmUgPSByZXF1aXJlKFwiLi9sYXlvdXRcIik7XG5cbnRudF9ib2FyZF9nZW5vbWUgPSBmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIlxuXG4gICAgLy8gUHJpdmF0ZSB2YXJzXG4gICAgdmFyIGVuc19yZSA9IC9eRU5TXFx3K1xcZCskLztcbiAgICB2YXIgY2hyX2xlbmd0aDtcblxuICAgIC8vIFZhcnMgZXhwb3NlZCBpbiB0aGUgQVBJXG4gICAgdmFyIGNvbmYgPSB7XG4gICAgICAgIGdlbmUgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICB4cmVmX3NlYXJjaCAgICA6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBlbnNnZW5lX3NlYXJjaCA6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBjb250ZXh0ICAgICAgICA6IDAsXG4gICAgICAgIHJlc3QgICAgICAgICAgIDogdG50X3Jlc3QoKVxuICAgIH07XG4gICAgdG50X2JvYXJkLnRyYWNrLmRhdGEuZ2Vub21lLnJlc3QgPSBjb25mLnJlc3Q7XG5cbiAgICB2YXIgZ2VuZTtcbiAgICB2YXIgbGltaXRzID0ge1xuICAgICAgICBsZWZ0IDogMCxcbiAgICAgICAgcmlnaHQgOiB1bmRlZmluZWQsXG4gICAgICAgIHpvb21fb3V0IDogY29uZi5yZXN0LmxpbWl0cy5yZWdpb24sXG4gICAgICAgIHpvb21faW4gIDogMjAwXG4gICAgfTtcblxuICAgIC8vIFdlIFwiaW5oZXJpdFwiIGZyb20gYm9hcmRcbiAgICB2YXIgZ2Vub21lX2Jyb3dzZXIgPSB0bnRfYm9hcmQoKTtcblxuICAgIC8vIFRoZSBsb2NhdGlvbiBhbmQgYXhpcyB0cmFja1xuICAgIHZhciBsb2NhdGlvbl90cmFjayA9IHRudF9ib2FyZC50cmFjaygpXG4gICAgICAgIC5oZWlnaHQoMjApXG4gICAgICAgIC5iYWNrZ3JvdW5kX2NvbG9yKFwid2hpdGVcIilcbiAgICAgICAgLmRhdGEodG50X2JvYXJkLnRyYWNrLmRhdGEuZW1wdHkoKSlcbiAgICAgICAgLmRpc3BsYXkodG50X2JvYXJkLnRyYWNrLmZlYXR1cmUubG9jYXRpb24oKSk7XG5cbiAgICB2YXIgYXhpc190cmFjayA9IHRudF9ib2FyZC50cmFjaygpXG4gICAgICAgIC5oZWlnaHQoMClcbiAgICAgICAgLmJhY2tncm91bmRfY29sb3IoXCJ3aGl0ZVwiKVxuICAgICAgICAuZGF0YSh0bnRfYm9hcmQudHJhY2suZGF0YS5lbXB0eSgpKVxuICAgICAgICAuZGlzcGxheSh0bnRfYm9hcmQudHJhY2suZmVhdHVyZS5heGlzKCkpO1xuXG4gICAgZ2Vub21lX2Jyb3dzZXJcblx0ICAgLmFkZF90cmFjayhsb2NhdGlvbl90cmFjaylcbiAgICAgICAuYWRkX3RyYWNrKGF4aXNfdHJhY2spO1xuXG4gICAgLy8gRGVmYXVsdCBsb2NhdGlvbjpcbiAgICBnZW5vbWVfYnJvd3NlclxuXHQgICAuc3BlY2llcyhcImh1bWFuXCIpXG4gICAgICAgLmNocig3KVxuICAgICAgIC5mcm9tKDEzOTQyNDk0MClcbiAgICAgICAudG8oMTQxNzg0MTAwKTtcblxuICAgIC8vIFdlIHNhdmUgdGhlIHN0YXJ0IG1ldGhvZCBvZiB0aGUgJ3BhcmVudCcgb2JqZWN0XG4gICAgZ2Vub21lX2Jyb3dzZXIuX3N0YXJ0ID0gZ2Vub21lX2Jyb3dzZXIuc3RhcnQ7XG5cbiAgICAvLyBXZSBoaWphY2sgcGFyZW50J3Mgc3RhcnQgbWV0aG9kXG4gICAgdmFyIHN0YXJ0ID0gZnVuY3Rpb24gKHdoZXJlKSB7XG4gICAgICAgIGlmICh3aGVyZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAod2hlcmUuZ2VuZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZ2V0X2dlbmUod2hlcmUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHdoZXJlLnNwZWNpZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB3aGVyZS5zcGVjaWVzID0gZ2Vub21lX2Jyb3dzZXIuc3BlY2llcygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGdlbm9tZV9icm93c2VyLnNwZWNpZXMod2hlcmUuc3BlY2llcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh3aGVyZS5jaHIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB3aGVyZS5jaHIgPSBnZW5vbWVfYnJvd3Nlci5jaHIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBnZW5vbWVfYnJvd3Nlci5jaHIod2hlcmUuY2hyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHdoZXJlLmZyb20gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB3aGVyZS5mcm9tID0gZ2Vub21lX2Jyb3dzZXIuZnJvbSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGdlbm9tZV9icm93c2VyLmZyb20od2hlcmUuZnJvbSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHdoZXJlLnRvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hlcmUudG8gPSBnZW5vbWVfYnJvd3Nlci50bygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGdlbm9tZV9icm93c2VyLnRvKHdoZXJlLnRvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7IC8vIFwid2hlcmVcIiBpcyB1bmRlZiBzbyBsb29rIGZvciBnZW5lIG9yIGxvY1xuICAgICAgICBpZiAoZ2Vub21lX2Jyb3dzZXIuZ2VuZSgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGdldF9nZW5lKHsgc3BlY2llcyA6IGdlbm9tZV9icm93c2VyLnNwZWNpZXMoKSxcbiAgICAgICAgICAgICAgICBnZW5lICAgIDogZ2Vub21lX2Jyb3dzZXIuZ2VuZSgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdoZXJlID0ge307XG4gICAgICAgICAgICB3aGVyZS5zcGVjaWVzID0gZ2Vub21lX2Jyb3dzZXIuc3BlY2llcygpLFxuICAgICAgICAgICAgd2hlcmUuY2hyICAgICA9IGdlbm9tZV9icm93c2VyLmNocigpLFxuICAgICAgICAgICAgd2hlcmUuZnJvbSAgICA9IGdlbm9tZV9icm93c2VyLmZyb20oKSxcbiAgICAgICAgICAgIHdoZXJlLnRvICAgICAgPSBnZW5vbWVfYnJvd3Nlci50bygpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZW5vbWVfYnJvd3Nlci5yaWdodCAoZnVuY3Rpb24gKGRvbmUpIHtcbiAgICAgICAgLy8gR2V0IHRoZSBjaHJvbW9zb21lIGxlbmd0aCBhbmQgdXNlIGl0IGFzIHRoZSAncmlnaHQnIGxpbWl0XG4gICAgICAgIGdlbm9tZV9icm93c2VyLnpvb21faW4gKGxpbWl0cy56b29tX2luKTtcbiAgICAgICAgZ2Vub21lX2Jyb3dzZXIuem9vbV9vdXQgKGxpbWl0cy56b29tX291dCk7XG5cbiAgICAgICAgdmFyIHVybCA9IGNvbmYucmVzdC51cmwuY2hyX2luZm8gKHtcbiAgICAgICAgICAgIHNwZWNpZXMgOiB3aGVyZS5zcGVjaWVzLFxuICAgICAgICAgICAgY2hyICAgICA6IHdoZXJlLmNoclxuICAgICAgICB9KTtcblxuICAgICAgICBjb25mLnJlc3QuY2FsbCAodXJsKVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICAgICAgZG9uZShyZXNwLmJvZHkubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgZ2Vub21lX2Jyb3dzZXIuX3N0YXJ0KCk7XG4gICAgfTtcblxuICAgIHZhciBob21vbG9ndWVzID0gZnVuY3Rpb24gKGVuc0dlbmUsIGNhbGxiYWNrKSAge1xuICAgICAgICB2YXIgdXJsID0gY29uZi5yZXN0LnVybC5ob21vbG9ndWVzICh7aWQgOiBlbnNHZW5lfSlcbiAgICAgICAgY29uZi5yZXN0LmNhbGwodXJsKVxuICAgICAgICAgICAgLnRoZW4gKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgICAgICB2YXIgaG9tb2xvZ3VlcyA9IHJlc3AuYm9keS5kYXRhWzBdLmhvbW9sb2dpZXM7XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhvbW9sb2d1ZXNfb2JqID0gc3BsaXRfaG9tb2xvZ3Vlcyhob21vbG9ndWVzKVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhob21vbG9ndWVzX29iaik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgaXNFbnNlbWJsR2VuZSA9IGZ1bmN0aW9uKHRlcm0pIHtcbiAgICAgICAgaWYgKHRlcm0ubWF0Y2goZW5zX3JlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGdldF9nZW5lID0gZnVuY3Rpb24gKHdoZXJlKSB7XG4gICAgICAgIGlmIChpc0Vuc2VtYmxHZW5lKHdoZXJlLmdlbmUpKSB7XG4gICAgICAgICAgICBnZXRfZW5zR2VuZSh3aGVyZS5nZW5lKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHVybCA9IGNvbmYucmVzdC51cmwueHJlZiAoe1xuICAgICAgICAgICAgICAgIHNwZWNpZXMgOiB3aGVyZS5zcGVjaWVzLFxuICAgICAgICAgICAgICAgIG5hbWUgICAgOiB3aGVyZS5nZW5lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbmYucmVzdC5jYWxsKHVybClcbiAgICAgICAgICAgICAgICAudGhlbiAoZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3AuYm9keTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IGRhdGEuZmlsdGVyKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAhZC5pZC5pbmRleE9mKFwiRU5TXCIpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFbMF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uZi54cmVmX3NlYXJjaChyZXNwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldF9lbnNHZW5lKGRhdGFbMF0uaWQpXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5vbWVfYnJvd3Nlci5zdGFydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGdldF9lbnNHZW5lID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHZhciB1cmwgPSBjb25mLnJlc3QudXJsLmdlbmUgKHtpZCA6IGlkfSlcbiAgICAgICAgY29uZi5yZXN0LmNhbGwodXJsKVxuICAgICAgICAgICAgLnRoZW4gKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3AuYm9keTtcbiAgICAgICAgICAgICAgICBjb25mLmVuc2dlbmVfc2VhcmNoKGRhdGEpO1xuICAgICAgICAgICAgICAgIHZhciBleHRyYSA9IH5+KChkYXRhLmVuZCAtIGRhdGEuc3RhcnQpICogKGNvbmYuY29udGV4dC8xMDApKTtcbiAgICAgICAgICAgICAgICBnZW5vbWVfYnJvd3NlclxuICAgICAgICAgICAgICAgICAgICAuc3BlY2llcyhkYXRhLnNwZWNpZXMpXG4gICAgICAgICAgICAgICAgICAgIC5jaHIoZGF0YS5zZXFfcmVnaW9uX25hbWUpXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tKGRhdGEuc3RhcnQgLSBleHRyYSlcbiAgICAgICAgICAgICAgICAgICAgLnRvKGRhdGEuZW5kICsgZXh0cmEpO1xuXG4gICAgICAgICAgICAgICAgZ2Vub21lX2Jyb3dzZXIuc3RhcnQoIHsgc3BlY2llcyA6IGRhdGEuc3BlY2llcyxcbiAgICAgICAgICAgICAgICAgICAgY2hyICAgICA6IGRhdGEuc2VxX3JlZ2lvbl9uYW1lLFxuICAgICAgICAgICAgICAgICAgICBmcm9tICAgIDogZGF0YS5zdGFydCAtIGV4dHJhLFxuICAgICAgICAgICAgICAgICAgICB0byAgICAgIDogZGF0YS5lbmQgKyBleHRyYVxuICAgICAgICAgICAgICAgIH0gKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgc3BsaXRfaG9tb2xvZ3VlcyA9IGZ1bmN0aW9uIChob21vbG9ndWVzKSB7XG4gICAgICAgIHZhciBvcnRob1BhdHQgPSAvb3J0aG9sb2cvO1xuICAgICAgICB2YXIgcGFyYVBhdHQgPSAvcGFyYWxvZy87XG5cbiAgICAgICAgdmFyIG9ydGhvbG9ndWVzID0gaG9tb2xvZ3Vlcy5maWx0ZXIoZnVuY3Rpb24oZCl7cmV0dXJuIGQudHlwZS5tYXRjaChvcnRob1BhdHQpfSk7XG4gICAgICAgIHZhciBwYXJhbG9ndWVzICA9IGhvbW9sb2d1ZXMuZmlsdGVyKGZ1bmN0aW9uKGQpe3JldHVybiBkLnR5cGUubWF0Y2gocGFyYVBhdHQpfSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICdvcnRob2xvZ3VlcycgOiBvcnRob2xvZ3VlcyxcbiAgICAgICAgICAgICdwYXJhbG9ndWVzJyAgOiBwYXJhbG9ndWVzXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyhnZW5vbWVfYnJvd3NlcilcbiAgICAgICAgLmdldHNldCAoY29uZilcbiAgICAgICAgLm1ldGhvZChcInpvb21faW5cIiwgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsaW1pdHMuem9vbV9pbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxpbWl0cy56b29tX2luID0gdjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKHtcbiAgICAgICAgc3RhcnQgICAgICA6IHN0YXJ0LFxuICAgICAgICBob21vbG9ndWVzIDogaG9tb2xvZ3Vlc1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGdlbm9tZV9icm93c2VyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X2JvYXJkX2dlbm9tZTtcbiIsInZhciBib2FyZCA9IHJlcXVpcmUoXCJ0bnQuYm9hcmRcIik7XG5ib2FyZC5nZW5vbWUgPSByZXF1aXJlKFwiLi9nZW5vbWVcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGJvYXJkO1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZSAoXCJ0bnQuYXBpXCIpO1xuXG4vLyBUaGUgb3ZlcmxhcCBkZXRlY3RvciB1c2VkIGZvciBnZW5lc1xudmFyIGdlbmVfbGF5b3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gUHJpdmF0ZSB2YXJzXG4gICAgdmFyIG1heF9zbG90cztcblxuICAgIC8vIHZhcnMgZXhwb3NlZCBpbiB0aGUgQVBJOlxuICAgIHZhciBoZWlnaHQgPSAxNTA7XG4gICAgLy8gdmFyIGNvbmYgPSB7XG4gICAgLy8gICAgIGhlaWdodCAgIDogMTUwLFxuICAgIC8vICAgICBzY2FsZSAgICA6IHVuZGVmaW5lZFxuICAgIC8vIH07XG5cbiAgICB2YXIgb2xkX2VsZW1lbnRzID0gW107XG5cbiAgICB2YXIgc2NhbGU7XG5cbiAgICB2YXIgc2xvdF90eXBlcyA9IHtcbiAgICAgICAgJ2V4cGFuZGVkJyAgIDoge1xuICAgICAgICAgICAgc2xvdF9oZWlnaHQgOiAzMCxcbiAgICAgICAgICAgIGdlbmVfaGVpZ2h0IDogMTAsXG4gICAgICAgICAgICBzaG93X2xhYmVsICA6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgJ2NvbGxhcHNlZCcgOiB7XG4gICAgICAgICAgICBzbG90X2hlaWdodCA6IDEwLFxuICAgICAgICAgICAgZ2VuZV9oZWlnaHQgOiA3LFxuICAgICAgICAgICAgc2hvd19sYWJlbCAgOiBmYWxzZVxuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgY3VycmVudF9zbG90X3R5cGUgPSAnZXhwYW5kZWQnO1xuXG4gICAgLy8gVGhlIHJldHVybmVkIGNsb3N1cmUgLyBvYmplY3RcbiAgICB2YXIgZ2VuZXNfbGF5b3V0ID0gZnVuY3Rpb24gKG5ld19nZW5lcywgeFNjYWxlKSB7XG4gICAgICAgIHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHNjYWxlID0geFNjYWxlO1xuXG4gICAgICAgIC8vIFdlIG1ha2Ugc3VyZSB0aGF0IHRoZSBnZW5lcyBoYXZlIG5hbWVcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZXdfZ2VuZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChuZXdfZ2VuZXNbaV0uZXh0ZXJuYWxfbmFtZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG5ld19nZW5lc1tpXS5leHRlcm5hbF9uYW1lID0gXCJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG1heF9zbG90cyA9IH5+KHRyYWNrLmhlaWdodCgpIC8gc2xvdF90eXBlcy5leHBhbmRlZC5zbG90X2hlaWdodCk7XG5cbiAgICAgICAgLy8gaWYgKHNjYWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gICAgIGdlbmVzX2xheW91dC5zY2FsZShzY2FsZSk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICBzbG90X2tlZXBlcihuZXdfZ2VuZXMsIG9sZF9lbGVtZW50cyk7XG4gICAgICAgIHZhciBuZWVkZWRfc2xvdHMgPSBjb2xsaXRpb25fZGV0ZWN0b3IobmV3X2dlbmVzKTtcbiAgICAgICAgaWYgKG5lZWRlZF9zbG90cyA+IG1heF9zbG90cykge1xuICAgICAgICAgICAgY3VycmVudF9zbG90X3R5cGUgPSAnY29sbGFwc2VkJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnRfc2xvdF90eXBlID0gJ2V4cGFuZGVkJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vY29uZl9yby5lbGVtZW50cyA9IG5ld19nZW5lcztcbiAgICAgICAgb2xkX2VsZW1lbnRzID0gbmV3X2dlbmVzO1xuICAgICAgICByZXR1cm4gbmV3X2dlbmVzO1xuICAgIH07XG5cbiAgICB2YXIgZ2VuZV9zbG90ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc2xvdF90eXBlc1tjdXJyZW50X3Nsb3RfdHlwZV07XG4gICAgfTtcblxuICAgIHZhciBjb2xsaXRpb25fZGV0ZWN0b3IgPSBmdW5jdGlvbiAoZ2VuZXMpIHtcbiAgICAgICAgdmFyIGdlbmVzX3BsYWNlZCA9IFtdO1xuICAgICAgICB2YXIgZ2VuZXNfdG9fcGxhY2UgPSBnZW5lcztcbiAgICAgICAgdmFyIG5lZWRlZF9zbG90cyA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2VuZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChnZW5lc1tpXS5zbG90ID4gbmVlZGVkX3Nsb3RzICYmIGdlbmVzW2ldLnNsb3QgPCBtYXhfc2xvdHMpIHtcbiAgICAgICAgICAgICAgICBuZWVkZWRfc2xvdHMgPSBnZW5lc1tpXS5zbG90XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8Z2VuZXNfdG9fcGxhY2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBnZW5lc19ieV9zbG90ID0gc29ydF9nZW5lc19ieV9zbG90KGdlbmVzX3BsYWNlZCk7XG4gICAgICAgICAgICB2YXIgdGhpc19nZW5lID0gZ2VuZXNfdG9fcGxhY2VbaV07XG4gICAgICAgICAgICBpZiAodGhpc19nZW5lLnNsb3QgIT09IHVuZGVmaW5lZCAmJiB0aGlzX2dlbmUuc2xvdCA8IG1heF9zbG90cykge1xuICAgICAgICAgICAgICAgIGlmIChzbG90X2hhc19zcGFjZSh0aGlzX2dlbmUsIGdlbmVzX2J5X3Nsb3RbdGhpc19nZW5lLnNsb3RdKSkge1xuICAgICAgICAgICAgICAgICAgICBnZW5lc19wbGFjZWQucHVzaCh0aGlzX2dlbmUpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2xvdCA9IDA7XG4gICAgICAgICAgICBPVVRFUjogd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2xvdF9oYXNfc3BhY2UodGhpc19nZW5lLCBnZW5lc19ieV9zbG90W3Nsb3RdKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzX2dlbmUuc2xvdCA9IHNsb3Q7XG4gICAgICAgICAgICAgICAgICAgIGdlbmVzX3BsYWNlZC5wdXNoKHRoaXNfZ2VuZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzbG90ID4gbmVlZGVkX3Nsb3RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWVkZWRfc2xvdHMgPSBzbG90O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzbG90Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5lZWRlZF9zbG90cyArIDE7XG4gICAgfTtcblxuICAgIHZhciBzbG90X2hhc19zcGFjZSA9IGZ1bmN0aW9uIChxdWVyeV9nZW5lLCBnZW5lc19pbl90aGlzX3Nsb3QpIHtcbiAgICAgICAgaWYgKGdlbmVzX2luX3RoaXNfc2xvdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGdlbmVzX2luX3RoaXNfc2xvdC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIHN1YmpfZ2VuZSA9IGdlbmVzX2luX3RoaXNfc2xvdFtqXTtcbiAgICAgICAgICAgIGlmIChxdWVyeV9nZW5lLmlkID09PSBzdWJqX2dlbmUuaWQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB5X2xhYmVsX2VuZCA9IHN1YmpfZ2VuZS5kaXNwbGF5X2xhYmVsLmxlbmd0aCAqIDggKyBzY2FsZShzdWJqX2dlbmUuc3RhcnQpOyAvLyBUT0RPOiBJdCBtYXkgYmUgYmV0dGVyIHRvIGhhdmUgYSBmaXhlZCBmb250IHNpemUgKGluc3RlYWQgb2YgdGhlIGhhcmRjb2RlZCB2YWx1ZSk/XG4gICAgICAgICAgICB2YXIgeTEgID0gc2NhbGUoc3Vial9nZW5lLnN0YXJ0KTtcbiAgICAgICAgICAgIHZhciB5MiAgPSBzY2FsZShzdWJqX2dlbmUuZW5kKSA+IHlfbGFiZWxfZW5kID8gc2NhbGUoc3Vial9nZW5lLmVuZCkgOiB5X2xhYmVsX2VuZDtcbiAgICAgICAgICAgIHZhciB4X2xhYmVsX2VuZCA9IHF1ZXJ5X2dlbmUuZGlzcGxheV9sYWJlbC5sZW5ndGggKiA4ICsgc2NhbGUocXVlcnlfZ2VuZS5zdGFydCk7XG4gICAgICAgICAgICB2YXIgeDEgPSBzY2FsZShxdWVyeV9nZW5lLnN0YXJ0KTtcbiAgICAgICAgICAgIHZhciB4MiA9IHNjYWxlKHF1ZXJ5X2dlbmUuZW5kKSA+IHhfbGFiZWxfZW5kID8gc2NhbGUocXVlcnlfZ2VuZS5lbmQpIDogeF9sYWJlbF9lbmQ7XG4gICAgICAgICAgICBpZiAoICgoeDEgPD0geTEpICYmICh4MiA+PSB5MSkpIHx8XG4gICAgICAgICAgICAoKHgxID49IHkxKSAmJiAoeDEgPD0geTIpKSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHZhciBzbG90X2tlZXBlciA9IGZ1bmN0aW9uIChnZW5lcywgcHJldl9nZW5lcykge1xuICAgICAgICB2YXIgcHJldl9nZW5lc19zbG90cyA9IGdlbmVzMnNsb3RzKHByZXZfZ2VuZXMpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2VuZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChwcmV2X2dlbmVzX3Nsb3RzW2dlbmVzW2ldLmlkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZ2VuZXNbaV0uc2xvdCA9IHByZXZfZ2VuZXNfc2xvdHNbZ2VuZXNbaV0uaWRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBnZW5lczJzbG90cyA9IGZ1bmN0aW9uIChnZW5lc19hcnJheSkge1xuICAgICAgICB2YXIgaGFzaCA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlbmVzX2FycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZ2VuZSA9IGdlbmVzX2FycmF5W2ldO1xuICAgICAgICAgICAgaGFzaFtnZW5lLmlkXSA9IGdlbmUuc2xvdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaGFzaDtcbiAgICB9XG5cbiAgICB2YXIgc29ydF9nZW5lc19ieV9zbG90ID0gZnVuY3Rpb24gKGdlbmVzKSB7XG4gICAgICAgIHZhciBzbG90cyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoc2xvdHNbZ2VuZXNbaV0uc2xvdF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHNsb3RzW2dlbmVzW2ldLnNsb3RdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzbG90c1tnZW5lc1tpXS5zbG90XS5wdXNoKGdlbmVzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2xvdHM7XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIHZhciBhcGkgPSBhcGlqcyAoZ2VuZXNfbGF5b3V0KVxuLy8gICAgLmdldHNldCAoY29uZilcbi8vICAgIC5nZXQgKGNvbmZfcm8pXG4gICAgICAgIC5nZXRzZXQgKFwiZWxlbWVudHNcIiwgZnVuY3Rpb24gKCkge30pXG4gICAgICAgIC5tZXRob2QgKHtcbiAgICAgICAgICAgIGdlbmVfc2xvdCA6IGdlbmVfc2xvdFxuICAgICAgICB9KTtcblxuICAgIHJldHVybiBnZW5lc19sYXlvdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBnZW5lX2xheW91dDtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL25ld2ljay5qc1wiKTtcbiIsIi8qKlxuICogTmV3aWNrIGFuZCBuaHggZm9ybWF0cyBwYXJzZXIgaW4gSmF2YVNjcmlwdC5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIEphc29uIERhdmllcyAyMDEwIGFuZCBNaWd1ZWwgUGlnbmF0ZWxsaVxuICogIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKlxuICogRXhhbXBsZSB0cmVlIChmcm9tIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTmV3aWNrX2Zvcm1hdCk6XG4gKlxuICogKy0tMC4xLS1BXG4gKiBGLS0tLS0wLjItLS0tLUIgICAgICAgICAgICArLS0tLS0tLTAuMy0tLS1DXG4gKiArLS0tLS0tLS0tLS0tLS0tLS0tMC41LS0tLS1FXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICArLS0tLS0tLS0tMC40LS0tLS0tRFxuICpcbiAqIE5ld2ljayBmb3JtYXQ6XG4gKiAoQTowLjEsQjowLjIsKEM6MC4zLEQ6MC40KUU6MC41KUY7XG4gKlxuICogQ29udmVydGVkIHRvIEpTT046XG4gKiB7XG4gKiAgIG5hbWU6IFwiRlwiLFxuICogICBicmFuY2hzZXQ6IFtcbiAqICAgICB7bmFtZTogXCJBXCIsIGxlbmd0aDogMC4xfSxcbiAqICAgICB7bmFtZTogXCJCXCIsIGxlbmd0aDogMC4yfSxcbiAqICAgICB7XG4gKiAgICAgICBuYW1lOiBcIkVcIixcbiAqICAgICAgIGxlbmd0aDogMC41LFxuICogICAgICAgYnJhbmNoc2V0OiBbXG4gKiAgICAgICAgIHtuYW1lOiBcIkNcIiwgbGVuZ3RoOiAwLjN9LFxuICogICAgICAgICB7bmFtZTogXCJEXCIsIGxlbmd0aDogMC40fVxuICogICAgICAgXVxuICogICAgIH1cbiAqICAgXVxuICogfVxuICpcbiAqIENvbnZlcnRlZCB0byBKU09OLCBidXQgd2l0aCBubyBuYW1lcyBvciBsZW5ndGhzOlxuICoge1xuICogICBicmFuY2hzZXQ6IFtcbiAqICAgICB7fSwge30sIHtcbiAqICAgICAgIGJyYW5jaHNldDogW3t9LCB7fV1cbiAqICAgICB9XG4gKiAgIF1cbiAqIH1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwYXJzZV9uZXdpY2sgOiBmdW5jdGlvbihzKSB7XG5cdHZhciBhbmNlc3RvcnMgPSBbXTtcblx0dmFyIHRyZWUgPSB7fTtcblx0dmFyIHRva2VucyA9IHMuc3BsaXQoL1xccyooO3xcXCh8XFwpfCx8OilcXHMqLyk7XG5cdHZhciBzdWJ0cmVlO1xuXHRmb3IgKHZhciBpPTA7IGk8dG9rZW5zLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV07XG5cdCAgICBzd2l0Y2ggKHRva2VuKSB7XG4gICAgICAgICAgICBjYXNlICcoJzogLy8gbmV3IGJyYW5jaHNldFxuXHRcdHN1YnRyZWUgPSB7fTtcblx0XHR0cmVlLmNoaWxkcmVuID0gW3N1YnRyZWVdO1xuXHRcdGFuY2VzdG9ycy5wdXNoKHRyZWUpO1xuXHRcdHRyZWUgPSBzdWJ0cmVlO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnLCc6IC8vIGFub3RoZXIgYnJhbmNoXG5cdFx0c3VidHJlZSA9IHt9O1xuXHRcdGFuY2VzdG9yc1thbmNlc3RvcnMubGVuZ3RoLTFdLmNoaWxkcmVuLnB1c2goc3VidHJlZSk7XG5cdFx0dHJlZSA9IHN1YnRyZWU7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICcpJzogLy8gb3B0aW9uYWwgbmFtZSBuZXh0XG5cdFx0dHJlZSA9IGFuY2VzdG9ycy5wb3AoKTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJzonOiAvLyBvcHRpb25hbCBsZW5ndGggbmV4dFxuXHRcdGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcblx0XHR2YXIgeCA9IHRva2Vuc1tpLTFdO1xuXHRcdGlmICh4ID09ICcpJyB8fCB4ID09ICcoJyB8fCB4ID09ICcsJykge1xuXHRcdCAgICB0cmVlLm5hbWUgPSB0b2tlbjtcblx0XHR9IGVsc2UgaWYgKHggPT0gJzonKSB7XG5cdFx0ICAgIHRyZWUuYnJhbmNoX2xlbmd0aCA9IHBhcnNlRmxvYXQodG9rZW4pO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdHJlZTtcbiAgICB9LFxuXG4gICAgcGFyc2Vfbmh4IDogZnVuY3Rpb24gKHMpIHtcblx0dmFyIGFuY2VzdG9ycyA9IFtdO1xuXHR2YXIgdHJlZSA9IHt9O1xuXHR2YXIgc3VidHJlZTtcblxuXHR2YXIgdG9rZW5zID0gcy5zcGxpdCggL1xccyooO3xcXCh8XFwpfFxcW3xcXF18LHw6fD0pXFxzKi8gKTtcblx0Zm9yICh2YXIgaT0wOyBpPHRva2Vucy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHRva2VuID0gdG9rZW5zW2ldO1xuXHQgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICAgICAgY2FzZSAnKCc6IC8vIG5ldyBjaGlsZHJlblxuXHRcdHN1YnRyZWUgPSB7fTtcblx0XHR0cmVlLmNoaWxkcmVuID0gW3N1YnRyZWVdO1xuXHRcdGFuY2VzdG9ycy5wdXNoKHRyZWUpO1xuXHRcdHRyZWUgPSBzdWJ0cmVlO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnLCc6IC8vIGFub3RoZXIgYnJhbmNoXG5cdFx0c3VidHJlZSA9IHt9O1xuXHRcdGFuY2VzdG9yc1thbmNlc3RvcnMubGVuZ3RoLTFdLmNoaWxkcmVuLnB1c2goc3VidHJlZSk7XG5cdFx0dHJlZSA9IHN1YnRyZWU7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICcpJzogLy8gb3B0aW9uYWwgbmFtZSBuZXh0XG5cdFx0dHJlZSA9IGFuY2VzdG9ycy5wb3AoKTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJzonOiAvLyBvcHRpb25hbCBsZW5ndGggbmV4dFxuXHRcdGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcblx0XHR2YXIgeCA9IHRva2Vuc1tpLTFdO1xuXHRcdGlmICh4ID09ICcpJyB8fCB4ID09ICcoJyB8fCB4ID09ICcsJykge1xuXHRcdCAgICB0cmVlLm5hbWUgPSB0b2tlbjtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoeCA9PSAnOicpIHtcblx0XHQgICAgdmFyIHRlc3RfdHlwZSA9IHR5cGVvZiB0b2tlbjtcblx0XHQgICAgaWYoIWlzTmFOKHRva2VuKSl7XG5cdFx0XHR0cmVlLmJyYW5jaF9sZW5ndGggPSBwYXJzZUZsb2F0KHRva2VuKTtcblx0XHQgICAgfVxuXHRcdH1cblx0XHRlbHNlIGlmICh4ID09ICc9Jyl7XG5cdFx0ICAgIHZhciB4MiA9IHRva2Vuc1tpLTJdO1xuXHRcdCAgICBzd2l0Y2goeDIpe1xuXHRcdCAgICBjYXNlICdEJzpcblx0XHRcdHRyZWUuZHVwbGljYXRpb24gPSB0b2tlbjtcblx0XHRcdGJyZWFrO1xuXHRcdCAgICBjYXNlICdHJzpcblx0XHRcdHRyZWUuZ2VuZV9pZCA9IHRva2VuO1xuXHRcdFx0YnJlYWs7XG5cdFx0ICAgIGNhc2UgJ1QnOlxuXHRcdFx0dHJlZS50YXhvbl9pZCA9IHRva2VuO1xuXHRcdFx0YnJlYWs7XG5cdFx0ICAgIGRlZmF1bHQgOlxuXHRcdFx0dHJlZVt0b2tlbnNbaS0yXV0gPSB0b2tlbjtcblx0XHQgICAgfVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHQgICAgdmFyIHRlc3Q7XG5cblx0XHR9XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHRyZWU7XG4gICAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gdG9vbHRpcCA9IHJlcXVpcmUoXCIuL3NyYy90b29sdGlwLmpzXCIpO1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG5cbnZhciB0b29sdGlwID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGRyYWcgPSBkMy5iZWhhdmlvci5kcmFnKCk7XG4gICAgdmFyIHRvb2x0aXBfZGl2O1xuXG4gICAgdmFyIGNvbmYgPSB7XG5cdHBvc2l0aW9uIDogXCJyaWdodFwiLFxuXHRhbGxvd19kcmFnIDogdHJ1ZSxcblx0c2hvd19jbG9zZXIgOiB0cnVlLFxuXHRmaWxsIDogZnVuY3Rpb24gKCkgeyB0aHJvdyBcImZpbGwgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCI7IH0sXG5cdHdpZHRoIDogMTgwLFxuXHRpZCA6IDFcbiAgICB9O1xuXG4gICAgdmFyIHQgPSBmdW5jdGlvbiAoZGF0YSwgZXZlbnQpIHtcblx0ZHJhZ1xuXHQgICAgLm9yaWdpbihmdW5jdGlvbigpe1xuXHRcdHJldHVybiB7eDpwYXJzZUludChkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJsZWZ0XCIpKSxcblx0XHRcdHk6cGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwidG9wXCIpKVxuXHRcdCAgICAgICB9O1xuXHQgICAgfSlcblx0ICAgIC5vbihcImRyYWdcIiwgZnVuY3Rpb24oKSB7XG5cdFx0aWYgKGNvbmYuYWxsb3dfZHJhZykge1xuXHRcdCAgICBkMy5zZWxlY3QodGhpcylcblx0XHRcdC5zdHlsZShcImxlZnRcIiwgZDMuZXZlbnQueCArIFwicHhcIilcblx0XHRcdC5zdHlsZShcInRvcFwiLCBkMy5ldmVudC55ICsgXCJweFwiKTtcblx0XHR9XG5cdCAgICB9KTtcblxuXHQvLyBUT0RPOiBXaHkgZG8gd2UgbmVlZCB0aGUgZGl2IGVsZW1lbnQ/XG5cdC8vIEl0IGxvb2tzIGxpa2UgaWYgd2UgYW5jaG9yIHRoZSB0b29sdGlwIGluIHRoZSBcImJvZHlcIlxuXHQvLyBUaGUgdG9vbHRpcCBpcyBub3QgbG9jYXRlZCBpbiB0aGUgcmlnaHQgcGxhY2UgKGFwcGVhcnMgYXQgdGhlIGJvdHRvbSlcblx0Ly8gU2VlIGNsaWVudHMvdG9vbHRpcHNfdGVzdC5odG1sIGZvciBhbiBleGFtcGxlXG5cdHZhciBjb250YWluZXJFbGVtID0gc2VsZWN0QW5jZXN0b3IgKHRoaXMsIFwiZGl2XCIpO1xuXHRpZiAoY29udGFpbmVyRWxlbSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAvLyBXZSByZXF1aXJlIGEgZGl2IGVsZW1lbnQgYXQgc29tZSBwb2ludCB0byBhbmNob3IgdGhlIHRvb2x0aXBcblx0ICAgIHJldHVybjtcblx0fVxuXG5cdHRvb2x0aXBfZGl2ID0gZDMuc2VsZWN0KGNvbnRhaW5lckVsZW0pXG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3Rvb2x0aXBcIilcblx0ICAgIC5jbGFzc2VkKFwidG50X3Rvb2x0aXBfYWN0aXZlXCIsIHRydWUpICAvLyBUT0RPOiBJcyB0aGlzIG5lZWRlZC91c2VkPz8/XG5cdCAgICAuY2FsbChkcmFnKTtcblxuXHQvLyBwcmV2IHRvb2x0aXBzIHdpdGggdGhlIHNhbWUgaGVhZGVyXG5cdGQzLnNlbGVjdChcIiN0bnRfdG9vbHRpcF9cIiArIGNvbmYuaWQpLnJlbW92ZSgpO1xuXG5cdGlmICgoZDMuZXZlbnQgPT09IG51bGwpICYmIChldmVudCkpIHtcblx0ICAgIGQzLmV2ZW50ID0gZXZlbnQ7XG5cdH1cblx0dmFyIGQzbW91c2UgPSBkMy5tb3VzZShjb250YWluZXJFbGVtKTtcblx0ZDMuZXZlbnQgPSBudWxsO1xuXG5cdHZhciBvZmZzZXQgPSAwO1xuXHRpZiAoY29uZi5wb3NpdGlvbiA9PT0gXCJsZWZ0XCIpIHtcblx0ICAgIG9mZnNldCA9IGNvbmYud2lkdGg7XG5cdH1cblxuXHR0b29sdGlwX2Rpdi5hdHRyKFwiaWRcIiwgXCJ0bnRfdG9vbHRpcF9cIiArIGNvbmYuaWQpO1xuXG5cdC8vIFdlIHBsYWNlIHRoZSB0b29sdGlwXG5cdHRvb2x0aXBfZGl2XG5cdCAgICAuc3R5bGUoXCJsZWZ0XCIsIChkM21vdXNlWzBdKSArIFwicHhcIilcblx0ICAgIC5zdHlsZShcInRvcFwiLCAoZDNtb3VzZVsxXSkgKyBcInB4XCIpO1xuXG5cdC8vIENsb3NlXG4gICAgaWYgKGNvbmYuc2hvd19jbG9zZXIpIHtcbiAgICAgICAgdG9vbHRpcF9kaXZcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdG9vbHRpcF9jbG9zZXJcIilcbiAgICAgICAgICAgIC5vbiAoXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdC5jbG9zZSgpO1xuICAgICAgICAgICAgfSlcbiAgICB9XG5cblx0Y29uZi5maWxsLmNhbGwodG9vbHRpcF9kaXYsIGRhdGEpO1xuXG5cdC8vIHJldHVybiB0aGlzIGhlcmU/XG5cdHJldHVybiB0O1xuICAgIH07XG5cbiAgICAvLyBnZXRzIHRoZSBmaXJzdCBhbmNlc3RvciBvZiBlbGVtIGhhdmluZyB0YWduYW1lIFwidHlwZVwiXG4gICAgLy8gZXhhbXBsZSA6IHZhciBteWRpdiA9IHNlbGVjdEFuY2VzdG9yKG15ZWxlbSwgXCJkaXZcIik7XG4gICAgZnVuY3Rpb24gc2VsZWN0QW5jZXN0b3IgKGVsZW0sIHR5cGUpIHtcblx0dHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblx0aWYgKGVsZW0ucGFyZW50Tm9kZSA9PT0gbnVsbCkge1xuXHQgICAgY29uc29sZS5sb2coXCJObyBtb3JlIHBhcmVudHNcIik7XG5cdCAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdHZhciB0YWdOYW1lID0gZWxlbS5wYXJlbnROb2RlLnRhZ05hbWU7XG5cblx0aWYgKCh0YWdOYW1lICE9PSB1bmRlZmluZWQpICYmICh0YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHR5cGUpKSB7XG5cdCAgICByZXR1cm4gZWxlbS5wYXJlbnROb2RlO1xuXHR9IGVsc2Uge1xuXHQgICAgcmV0dXJuIHNlbGVjdEFuY2VzdG9yIChlbGVtLnBhcmVudE5vZGUsIHR5cGUpO1xuXHR9XG4gICAgfVxuXG4gICAgdmFyIGFwaSA9IGFwaWpzKHQpXG5cdC5nZXRzZXQoY29uZik7XG4gICAgYXBpLmNoZWNrKCdwb3NpdGlvbicsIGZ1bmN0aW9uICh2YWwpIHtcblx0cmV0dXJuICh2YWwgPT09ICdsZWZ0JykgfHwgKHZhbCA9PT0gJ3JpZ2h0Jyk7XG4gICAgfSwgXCJPbmx5ICdsZWZ0JyBvciAncmlnaHQnIHZhbHVlcyBhcmUgYWxsb3dlZCBmb3IgcG9zaXRpb25cIik7XG5cbiAgICBhcGkubWV0aG9kKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRvb2x0aXBfZGl2KSB7XG4gICAgICAgICAgICB0b29sdGlwX2Rpdi5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG50b29sdGlwLmxpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gbGlzdCB0b29sdGlwIGlzIGJhc2VkIG9uIGdlbmVyYWwgdG9vbHRpcHNcbiAgICB2YXIgdCA9IHRvb2x0aXAoKTtcbiAgICB2YXIgd2lkdGggPSAxODA7XG5cbiAgICB0LmZpbGwgKGZ1bmN0aW9uIChvYmopIHtcblx0dmFyIHRvb2x0aXBfZGl2ID0gdGhpcztcblx0dmFyIG9ial9pbmZvX2xpc3QgPSB0b29sdGlwX2RpdlxuXHQgICAgLmFwcGVuZChcInRhYmxlXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51XCIpXG5cdCAgICAuYXR0cihcImJvcmRlclwiLCBcInNvbGlkXCIpXG5cdCAgICAuc3R5bGUoXCJ3aWR0aFwiLCB0LndpZHRoKCkgKyBcInB4XCIpO1xuXG5cdC8vIFRvb2x0aXAgaGVhZGVyXG4gICAgaWYgKG9iai5oZWFkZXIpIHtcbiAgICAgICAgb2JqX2luZm9fbGlzdFxuXHQgICAgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X2hlYWRlclwiKVxuICAgICAgICAgICAuYXBwZW5kKFwidGhcIilcbiAgICAgICAgICAgLnRleHQob2JqLmhlYWRlcik7XG4gICAgfVxuXG5cdC8vIFRvb2x0aXAgcm93c1xuXHR2YXIgdGFibGVfcm93cyA9IG9ial9pbmZvX2xpc3Quc2VsZWN0QWxsKFwiLnRudF96bWVudV9yb3dcIilcblx0ICAgIC5kYXRhKG9iai5yb3dzKVxuXHQgICAgLmVudGVyKClcblx0ICAgIC5hcHBlbmQoXCJ0clwiKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9yb3dcIik7XG5cblx0dGFibGVfcm93c1xuXHQgICAgLmFwcGVuZChcInRkXCIpXG5cdCAgICAuc3R5bGUoXCJ0ZXh0LWFsaWduXCIsIFwiY2VudGVyXCIpXG5cdCAgICAuaHRtbChmdW5jdGlvbihkLGkpIHtcblx0XHRyZXR1cm4gb2JqLnJvd3NbaV0udmFsdWU7XG5cdCAgICB9KVxuXHQgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC5saW5rID09PSB1bmRlZmluZWQpIHtcblx0XHQgICAgcmV0dXJuO1xuXHRcdH1cblx0XHRkMy5zZWxlY3QodGhpcylcblx0XHQgICAgLmNsYXNzZWQoXCJsaW5rXCIsIDEpXG5cdFx0ICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0ZC5saW5rKGQub2JqKTtcblx0XHRcdHQuY2xvc2UuY2FsbCh0aGlzKTtcblx0XHQgICAgfSk7XG5cdCAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gdDtcbn07XG5cbnRvb2x0aXAudGFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gdGFibGUgdG9vbHRpcHMgYXJlIGJhc2VkIG9uIGdlbmVyYWwgdG9vbHRpcHNcbiAgICB2YXIgdCA9IHRvb2x0aXAoKTtcblxuICAgIHZhciB3aWR0aCA9IDE4MDtcblxuICAgIHQuZmlsbCAoZnVuY3Rpb24gKG9iaikge1xuXHR2YXIgdG9vbHRpcF9kaXYgPSB0aGlzO1xuXG5cdHZhciBvYmpfaW5mb190YWJsZSA9IHRvb2x0aXBfZGl2XG5cdCAgICAuYXBwZW5kKFwidGFibGVcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVcIilcblx0ICAgIC5hdHRyKFwiYm9yZGVyXCIsIFwic29saWRcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIHQud2lkdGgoKSArIFwicHhcIik7XG5cblx0Ly8gVG9vbHRpcCBoZWFkZXJcbiAgICBpZiAob2JqLmhlYWRlcikge1xuICAgICAgICBvYmpfaW5mb190YWJsZVxuICAgICAgICAgICAgLmFwcGVuZChcInRyXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X2hlYWRlclwiKVxuICAgICAgICAgICAgLmFwcGVuZChcInRoXCIpXG4gICAgICAgICAgICAuYXR0cihcImNvbHNwYW5cIiwgMilcbiAgICAgICAgICAgIC50ZXh0KG9iai5oZWFkZXIpO1xuICAgIH1cblxuXHQvLyBUb29sdGlwIHJvd3Ncblx0dmFyIHRhYmxlX3Jvd3MgPSBvYmpfaW5mb190YWJsZS5zZWxlY3RBbGwoXCIudG50X3ptZW51X3Jvd1wiKVxuXHQgICAgLmRhdGEob2JqLnJvd3MpXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInRyXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X3Jvd1wiKTtcblxuXHR0YWJsZV9yb3dzXG5cdCAgICAuYXBwZW5kKFwidGhcIilcblx0ICAgIC5hdHRyKFwiY29sc3BhblwiLCBmdW5jdGlvbiAoZCwgaSkge1xuXHRcdGlmIChkLnZhbHVlID09PSBcIlwiKSB7XG5cdFx0ICAgIHJldHVybiAyO1xuXHRcdH1cblx0XHRyZXR1cm4gMTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQudmFsdWUgPT09IFwiXCIpIHtcblx0XHQgICAgcmV0dXJuIFwidG50X3ptZW51X2lubmVyX2hlYWRlclwiO1xuXHRcdH1cblx0XHRyZXR1cm4gXCJ0bnRfem1lbnVfY2VsbFwiO1xuXHQgICAgfSlcblx0ICAgIC5odG1sKGZ1bmN0aW9uKGQsaSkge1xuXHRcdHJldHVybiBvYmoucm93c1tpXS5sYWJlbDtcblx0ICAgIH0pO1xuXG5cdHRhYmxlX3Jvd3Ncblx0ICAgIC5hcHBlbmQoXCJ0ZFwiKVxuXHQgICAgLmh0bWwoZnVuY3Rpb24oZCxpKSB7XG5cdFx0aWYgKHR5cGVvZiBvYmoucm93c1tpXS52YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdCAgICBvYmoucm93c1tpXS52YWx1ZS5jYWxsKHRoaXMsIGQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0ICAgIHJldHVybiBvYmoucm93c1tpXS52YWx1ZTtcblx0XHR9XG5cdCAgICB9KVxuXHQgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZC52YWx1ZSA9PT0gXCJcIikge1xuXHRcdCAgICBkMy5zZWxlY3QodGhpcykucmVtb3ZlKCk7XG5cdFx0fVxuXHQgICAgfSlcblx0ICAgIC5lYWNoKGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQubGluayA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ICAgIHJldHVybjtcblx0XHR9XG5cdFx0ZDMuc2VsZWN0KHRoaXMpXG5cdFx0ICAgIC5jbGFzc2VkKFwibGlua1wiLCAxKVxuXHRcdCAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKGQpIHtcblx0XHRcdGQubGluayhkLm9iaik7XG5cdFx0XHR0LmNsb3NlLmNhbGwodGhpcyk7XG5cdFx0ICAgIH0pO1xuXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdDtcbn07XG5cbnRvb2x0aXAucGxhaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gcGxhaW4gdG9vbHRpcHMgYXJlIGJhc2VkIG9uIGdlbmVyYWwgdG9vbHRpcHNcbiAgICB2YXIgdCA9IHRvb2x0aXAoKTtcblxuICAgIHQuZmlsbCAoZnVuY3Rpb24gKG9iaikge1xuXHR2YXIgdG9vbHRpcF9kaXYgPSB0aGlzO1xuXG5cdHZhciBvYmpfaW5mb190YWJsZSA9IHRvb2x0aXBfZGl2XG5cdCAgICAuYXBwZW5kKFwidGFibGVcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfem1lbnVcIilcblx0ICAgIC5hdHRyKFwiYm9yZGVyXCIsIFwic29saWRcIilcblx0ICAgIC5zdHlsZShcIndpZHRoXCIsIHQud2lkdGgoKSArIFwicHhcIik7XG5cbiAgICBpZiAob2JqLmhlYWRlcikge1xuICAgICAgICBvYmpfaW5mb190YWJsZVxuICAgICAgICAgICAgLmFwcGVuZChcInRyXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3ptZW51X2hlYWRlclwiKVxuICAgICAgICAgICAgLmFwcGVuZChcInRoXCIpXG4gICAgICAgICAgICAudGV4dChvYmouaGVhZGVyKTtcbiAgICB9XG5cbiAgICBpZiAob2JqLmJvZHkpIHtcbiAgICAgICAgb2JqX2luZm9fdGFibGVcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0clwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF96bWVudV9yb3dcIilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZFwiKVxuICAgICAgICAgICAgLnN0eWxlKFwidGV4dC1hbGlnblwiLCBcImNlbnRlclwiKVxuICAgICAgICAgICAgLmh0bWwob2JqLmJvZHkpO1xuICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG9vbHRpcDtcbiIsInZhciBub2RlID0gcmVxdWlyZShcIi4vc3JjL25vZGUuanNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBub2RlO1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgaXRlcmF0b3IgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpLml0ZXJhdG9yO1xuXG52YXIgdG50X25vZGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuLy90bnQudHJlZS5ub2RlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBub2RlID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKG5vZGUpO1xuXG4gICAgLy8gQVBJXG4vLyAgICAgbm9kZS5ub2RlcyA9IGZ1bmN0aW9uKCkge1xuLy8gXHRpZiAoY2x1c3RlciA9PT0gdW5kZWZpbmVkKSB7XG4vLyBcdCAgICBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxuLy8gXHQgICAgLy8gVE9ETzogbGVuZ3RoIGFuZCBjaGlsZHJlbiBzaG91bGQgYmUgZXhwb3NlZCBpbiB0aGUgQVBJXG4vLyBcdCAgICAvLyBpLmUuIHRoZSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIGNoYW5nZSB0aGlzIGRlZmF1bHRzIHZpYSB0aGUgQVBJXG4vLyBcdCAgICAvLyBjaGlsZHJlbiBpcyB0aGUgZGVmYXVsdHMgZm9yIHBhcnNlX25ld2ljaywgYnV0IG1heWJlIHdlIHNob3VsZCBjaGFuZ2UgdGhhdFxuLy8gXHQgICAgLy8gb3IgYXQgbGVhc3Qgbm90IGFzc3VtZSB0aGlzIGlzIGFsd2F5cyB0aGUgY2FzZSBmb3IgdGhlIGRhdGEgcHJvdmlkZWRcbi8vIFx0XHQudmFsdWUoZnVuY3Rpb24oZCkge3JldHVybiBkLmxlbmd0aH0pXG4vLyBcdFx0LmNoaWxkcmVuKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5jaGlsZHJlbn0pO1xuLy8gXHR9XG4vLyBcdG5vZGVzID0gY2x1c3Rlci5ub2RlcyhkYXRhKTtcbi8vIFx0cmV0dXJuIG5vZGVzO1xuLy8gICAgIH07XG5cbiAgICB2YXIgYXBwbHlfdG9fZGF0YSA9IGZ1bmN0aW9uIChkYXRhLCBjYmFrKSB7XG5cdGNiYWsoZGF0YSk7XG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBwbHlfdG9fZGF0YShkYXRhLmNoaWxkcmVuW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0fVxuICAgIH07XG5cbiAgICB2YXIgY3JlYXRlX2lkcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGkgPSBpdGVyYXRvcigxKTtcblx0Ly8gV2UgY2FuJ3QgdXNlIGFwcGx5IGJlY2F1c2UgYXBwbHkgY3JlYXRlcyBuZXcgdHJlZXMgb24gZXZlcnkgbm9kZVxuXHQvLyBXZSBzaG91bGQgdXNlIHRoZSBkaXJlY3QgZGF0YSBpbnN0ZWFkXG5cdGFwcGx5X3RvX2RhdGEgKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICBpZiAoZC5faWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGQuX2lkID0gaSgpO1xuXHRcdC8vIFRPRE86IE5vdCBzdXJlIF9pblN1YlRyZWUgaXMgc3RyaWN0bHkgbmVjZXNzYXJ5XG5cdFx0Ly8gZC5faW5TdWJUcmVlID0ge3ByZXY6dHJ1ZSwgY3Vycjp0cnVlfTtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIHZhciBsaW5rX3BhcmVudHMgPSBmdW5jdGlvbiAoZGF0YSkge1xuXHRpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAvLyBfcGFyZW50P1xuXHQgICAgZGF0YS5jaGlsZHJlbltpXS5fcGFyZW50ID0gZGF0YTtcblx0ICAgIGxpbmtfcGFyZW50cyhkYXRhLmNoaWxkcmVuW2ldKTtcblx0fVxuICAgIH07XG5cbiAgICB2YXIgY29tcHV0ZV9yb290X2Rpc3RzID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0YXBwbHlfdG9fZGF0YSAoZGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHZhciBsO1xuXHQgICAgaWYgKGQuX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZC5fcm9vdF9kaXN0ID0gMDtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIGwgPSAwO1xuXHRcdGlmIChkLmJyYW5jaF9sZW5ndGgpIHtcblx0XHQgICAgbCA9IGQuYnJhbmNoX2xlbmd0aFxuXHRcdH1cblx0XHRkLl9yb290X2Rpc3QgPSBsICsgZC5fcGFyZW50Ll9yb290X2Rpc3Q7XG5cdCAgICB9XG5cdH0pO1xuICAgIH07XG5cbiAgICAvLyBUT0RPOiBkYXRhIGNhbid0IGJlIHJld3JpdHRlbiB1c2VkIHRoZSBhcGkgeWV0LiBXZSBuZWVkIGZpbmFsaXplcnNcbiAgICBub2RlLmRhdGEgPSBmdW5jdGlvbihuZXdfZGF0YSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBkYXRhXG5cdH1cblx0ZGF0YSA9IG5ld19kYXRhO1xuXHRjcmVhdGVfaWRzKCk7XG5cdGxpbmtfcGFyZW50cyhkYXRhKTtcblx0Y29tcHV0ZV9yb290X2Rpc3RzKGRhdGEpO1xuXHRyZXR1cm4gbm9kZTtcbiAgICB9O1xuICAgIC8vIFdlIGJpbmQgdGhlIGRhdGEgdGhhdCBoYXMgYmVlbiBwYXNzZWRcbiAgICBub2RlLmRhdGEoZGF0YSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF9hbGwnLCBmdW5jdGlvbiAoY2JhaywgZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChjYmFrKG4pKSB7XG5cdFx0bm9kZXMucHVzaCAobik7XG5cdCAgICB9XG5cdH0pO1xuXHRyZXR1cm4gbm9kZXM7XG4gICAgfSk7XG4gICAgXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZScsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdGlmIChjYmFrKG5vZGUpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGo9MDsgajxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltqXSkuZmluZF9ub2RlKGNiYWssIGRlZXApO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cblx0aWYgKGRlZXAgJiYgKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQpKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltpXSkuZmluZF9ub2RlKGNiYWssIGRlZXApXG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5fY2hpbGRyZW5baV0pLmZpbmRfbm9kZShjYmFrLCBkZWVwKTtcblx0XHRpZiAoZm91bmQpIHtcblx0XHQgICAgcmV0dXJuIGZvdW5kO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZV9ieV9uYW1lJywgZnVuY3Rpb24obmFtZSwgZGVlcCkge1xuXHRyZXR1cm4gbm9kZS5maW5kX25vZGUgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICByZXR1cm4gbm9kZS5ub2RlX25hbWUoKSA9PT0gbmFtZVxuXHR9LCBkZWVwKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd0b2dnbGUnLCBmdW5jdGlvbigpIHtcblx0aWYgKGRhdGEpIHtcblx0ICAgIGlmIChkYXRhLmNoaWxkcmVuKSB7IC8vIFVuY29sbGFwc2VkIC0+IGNvbGxhcHNlXG5cdFx0dmFyIGhpZGRlbiA9IDA7XG5cdFx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0XHQgICAgdmFyIGhpZGRlbl9oZXJlID0gbi5uX2hpZGRlbigpIHx8IDA7XG5cdFx0ICAgIGhpZGRlbiArPSAobi5uX2hpZGRlbigpIHx8IDApICsgMTtcblx0XHR9KTtcblx0XHRub2RlLm5faGlkZGVuIChoaWRkZW4tMSk7XG5cdFx0ZGF0YS5fY2hpbGRyZW4gPSBkYXRhLmNoaWxkcmVuO1xuXHRcdGRhdGEuY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG5cdCAgICB9IGVsc2UgeyAgICAgICAgICAgICAvLyBDb2xsYXBzZWQgLT4gdW5jb2xsYXBzZVxuXHRcdG5vZGUubl9oaWRkZW4oMCk7XG5cdFx0ZGF0YS5jaGlsZHJlbiA9IGRhdGEuX2NoaWxkcmVuO1xuXHRcdGRhdGEuX2NoaWxkcmVuID0gdW5kZWZpbmVkO1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2lzX2NvbGxhcHNlZCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkICYmIGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFzX2FuY2VzdG9yID0gZnVuY3Rpb24obiwgYW5jZXN0b3IpIHtcblx0Ly8gSXQgaXMgYmV0dGVyIHRvIHdvcmsgYXQgdGhlIGRhdGEgbGV2ZWxcblx0biA9IG4uZGF0YSgpO1xuXHRhbmNlc3RvciA9IGFuY2VzdG9yLmRhdGEoKTtcblx0aWYgKG4uX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm4gZmFsc2Vcblx0fVxuXHRuID0gbi5fcGFyZW50XG5cdGZvciAoOzspIHtcblx0ICAgIGlmIChuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBpZiAobiA9PT0gYW5jZXN0b3IpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIG4gPSBuLl9wYXJlbnQ7XG5cdH1cbiAgICB9O1xuXG4gICAgLy8gVGhpcyBpcyB0aGUgZWFzaWVzdCB3YXkgdG8gY2FsY3VsYXRlIHRoZSBMQ0EgSSBjYW4gdGhpbmsgb2YuIEJ1dCBpdCBpcyB2ZXJ5IGluZWZmaWNpZW50IHRvby5cbiAgICAvLyBJdCBpcyB3b3JraW5nIGZpbmUgYnkgbm93LCBidXQgaW4gY2FzZSBpdCBuZWVkcyB0byBiZSBtb3JlIHBlcmZvcm1hbnQgd2UgY2FuIGltcGxlbWVudCB0aGUgTENBXG4gICAgLy8gYWxnb3JpdGhtIGV4cGxhaW5lZCBoZXJlOlxuICAgIC8vIGh0dHA6Ly9jb21tdW5pdHkudG9wY29kZXIuY29tL3RjP21vZHVsZT1TdGF0aWMmZDE9dHV0b3JpYWxzJmQyPWxvd2VzdENvbW1vbkFuY2VzdG9yXG4gICAgYXBpLm1ldGhvZCAoJ2xjYScsIGZ1bmN0aW9uIChub2Rlcykge1xuXHRpZiAobm9kZXMubGVuZ3RoID09PSAxKSB7XG5cdCAgICByZXR1cm4gbm9kZXNbMF07XG5cdH1cblx0dmFyIGxjYV9ub2RlID0gbm9kZXNbMF07XG5cdGZvciAodmFyIGkgPSAxOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBsY2Ffbm9kZSA9IF9sY2EobGNhX25vZGUsIG5vZGVzW2ldKTtcblx0fVxuXHRyZXR1cm4gbGNhX25vZGU7XG5cdC8vIHJldHVybiB0bnRfbm9kZShsY2Ffbm9kZSk7XG4gICAgfSk7XG5cbiAgICB2YXIgX2xjYSA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xuXHRpZiAobm9kZTEuZGF0YSgpID09PSBub2RlMi5kYXRhKCkpIHtcblx0ICAgIHJldHVybiBub2RlMTtcblx0fVxuXHRpZiAoaGFzX2FuY2VzdG9yKG5vZGUxLCBub2RlMikpIHtcblx0ICAgIHJldHVybiBub2RlMjtcblx0fVxuXHRyZXR1cm4gX2xjYShub2RlMSwgbm9kZTIucGFyZW50KCkpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kKCduX2hpZGRlbicsIGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gbm9kZS5wcm9wZXJ0eSgnX2hpZGRlbicpO1xuXHR9XG5cdG5vZGUucHJvcGVydHkoJ19oaWRkZW4nLCB2YWwpO1xuXHRyZXR1cm4gbm9kZVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbm9kZXMnLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgbm9kZXMucHVzaChuKTtcblx0fSwgZGVlcCk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdnZXRfYWxsX2xlYXZlcycsIGZ1bmN0aW9uIChkZWVwKSB7XG5cdHZhciBsZWF2ZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKG4uaXNfbGVhZihkZWVwKSkge1xuXHRcdGxlYXZlcy5wdXNoKG4pO1xuXHQgICAgfVxuXHR9LCBkZWVwKTtcblx0cmV0dXJuIGxlYXZlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd1cHN0cmVhbScsIGZ1bmN0aW9uKGNiYWspIHtcblx0Y2Jhayhub2RlKTtcblx0dmFyIHBhcmVudCA9IG5vZGUucGFyZW50KCk7XG5cdGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgcGFyZW50LnVwc3RyZWFtKGNiYWspO1xuXHR9XG4vL1x0dG50X25vZGUocGFyZW50KS51cHN0cmVhbShjYmFrKTtcbi8vIFx0bm9kZS51cHN0cmVhbShub2RlLl9wYXJlbnQsIGNiYWspO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3N1YnRyZWUnLCBmdW5jdGlvbihub2Rlcywga2VlcF9zaW5nbGV0b25zKSB7XG5cdGlmIChrZWVwX3NpbmdsZXRvbnMgPT09IHVuZGVmaW5lZCkge1xuXHQgICAga2VlcF9zaW5nbGV0b25zID0gZmFsc2U7XG5cdH1cbiAgICBcdHZhciBub2RlX2NvdW50cyA9IHt9O1xuICAgIFx0Zm9yICh2YXIgaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgbiA9IG5vZGVzW2ldO1xuXHQgICAgaWYgKG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdG4udXBzdHJlYW0gKGZ1bmN0aW9uICh0aGlzX25vZGUpe1xuXHRcdCAgICB2YXIgaWQgPSB0aGlzX25vZGUuaWQoKTtcblx0XHQgICAgaWYgKG5vZGVfY291bnRzW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRub2RlX2NvdW50c1tpZF0gPSAwO1xuXHRcdCAgICB9XG5cdFx0ICAgIG5vZGVfY291bnRzW2lkXSsrXG4gICAgXHRcdH0pO1xuXHQgICAgfVxuICAgIFx0fVxuICAgIFxuXHR2YXIgaXNfc2luZ2xldG9uID0gZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5fY2hpbGRyZW4gPSAwO1xuXHQgICAgaWYgKG5vZGVfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuXHQgICAgZm9yICh2YXIgaT0wOyBpPG5vZGVfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBpZCA9IG5vZGVfZGF0YS5jaGlsZHJlbltpXS5faWQ7XG5cdFx0aWYgKG5vZGVfY291bnRzW2lkXSA+IDApIHtcblx0XHQgICAgbl9jaGlsZHJlbisrO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBuX2NoaWxkcmVuID09PSAxO1xuXHR9O1xuXG5cdHZhciBzdWJ0cmVlID0ge307XG5cdGNvcHlfZGF0YSAoZGF0YSwgc3VidHJlZSwgMCwgZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5vZGVfaWQgPSBub2RlX2RhdGEuX2lkO1xuXHQgICAgdmFyIGNvdW50cyA9IG5vZGVfY291bnRzW25vZGVfaWRdO1xuXHQgICAgXG5cdCAgICAvLyBJcyBpbiBwYXRoXG5cdCAgICBpZiAoY291bnRzID4gMCkge1xuXHRcdGlmIChpc19zaW5nbGV0b24obm9kZV9kYXRhKSAmJiAha2VlcF9zaW5nbGV0b25zKSB7XG5cdFx0ICAgIHJldHVybiBmYWxzZTsgXG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgLy8gSXMgbm90IGluIHBhdGhcblx0ICAgIHJldHVybiBmYWxzZTtcblx0fSk7XG5cblx0cmV0dXJuIHRudF9ub2RlKHN1YnRyZWUuY2hpbGRyZW5bMF0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGNvcHlfZGF0YSA9IGZ1bmN0aW9uIChvcmlnX2RhdGEsIHN1YnRyZWUsIGN1cnJCcmFuY2hMZW5ndGgsIGNvbmRpdGlvbikge1xuICAgICAgICBpZiAob3JpZ19kYXRhID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25kaXRpb24ob3JpZ19kYXRhKSkge1xuXHQgICAgdmFyIGNvcHkgPSBjb3B5X25vZGUob3JpZ19kYXRhLCBjdXJyQnJhbmNoTGVuZ3RoKTtcblx0ICAgIGlmIChzdWJ0cmVlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzdWJ0cmVlLmNoaWxkcmVuID0gW107XG5cdCAgICB9XG5cdCAgICBzdWJ0cmVlLmNoaWxkcmVuLnB1c2goY29weSk7XG5cdCAgICBpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvcHlfZGF0YSAob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBjb3B5LCAwLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9IGVsc2Uge1xuXHQgICAgaWYgKG9yaWdfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXHQgICAgY3VyckJyYW5jaExlbmd0aCArPSBvcmlnX2RhdGEuYnJhbmNoX2xlbmd0aCB8fCAwO1xuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmlnX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb3B5X2RhdGEob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBzdWJ0cmVlLCBjdXJyQnJhbmNoTGVuZ3RoLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBjb3B5X25vZGUgPSBmdW5jdGlvbiAobm9kZV9kYXRhLCBleHRyYUJyYW5jaExlbmd0aCkge1xuXHR2YXIgY29weSA9IHt9O1xuXHQvLyBjb3B5IGFsbCB0aGUgb3duIHByb3BlcnRpZXMgZXhjZXB0cyBsaW5rcyB0byBvdGhlciBub2RlcyBvciBkZXB0aFxuXHRmb3IgKHZhciBwYXJhbSBpbiBub2RlX2RhdGEpIHtcblx0ICAgIGlmICgocGFyYW0gPT09IFwiY2hpbGRyZW5cIikgfHxcblx0XHQocGFyYW0gPT09IFwiX2NoaWxkcmVuXCIpIHx8XG5cdFx0KHBhcmFtID09PSBcIl9wYXJlbnRcIikgfHxcblx0XHQocGFyYW0gPT09IFwiZGVwdGhcIikpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIGlmIChub2RlX2RhdGEuaGFzT3duUHJvcGVydHkocGFyYW0pKSB7XG5cdFx0Y29weVtwYXJhbV0gPSBub2RlX2RhdGFbcGFyYW1dO1xuXHQgICAgfVxuXHR9XG5cdGlmICgoY29weS5icmFuY2hfbGVuZ3RoICE9PSB1bmRlZmluZWQpICYmIChleHRyYUJyYW5jaExlbmd0aCAhPT0gdW5kZWZpbmVkKSkge1xuXHQgICAgY29weS5icmFuY2hfbGVuZ3RoICs9IGV4dHJhQnJhbmNoTGVuZ3RoO1xuXHR9XG5cdHJldHVybiBjb3B5O1xuICAgIH07XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCB2aXNpdHMgYWxsIHRoZSBub2Rlc1xuICAgIC8vIGEgbW9yZSBwZXJmb3JtYW50IHZlcnNpb24gc2hvdWxkIHJldHVybiB0cnVlXG4gICAgLy8gdGhlIGZpcnN0IHRpbWUgY2Jhayhub2RlKSBpcyB0cnVlXG4gICAgYXBpLm1ldGhvZCAoJ3ByZXNlbnQnLCBmdW5jdGlvbiAoY2Jhaykge1xuXHQvLyBjYmFrIHNob3VsZCByZXR1cm4gdHJ1ZS9mYWxzZVxuXHR2YXIgaXNfdHJ1ZSA9IGZhbHNlO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikgPT09IHRydWUpIHtcblx0XHRpc190cnVlID0gdHJ1ZTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBpc190cnVlO1xuICAgIH0pO1xuXG4gICAgLy8gY2JhayBpcyBjYWxsZWQgd2l0aCB0d28gbm9kZXNcbiAgICAvLyBhbmQgc2hvdWxkIHJldHVybiBhIG5lZ2F0aXZlIG51bWJlciwgMCBvciBhIHBvc2l0aXZlIG51bWJlclxuICAgIGFwaS5tZXRob2QgKCdzb3J0JywgZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0dmFyIG5ld19jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgbmV3X2NoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHR9XG5cblx0bmV3X2NoaWxkcmVuLnNvcnQoY2Jhayk7XG5cblx0ZGF0YS5jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8bmV3X2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkYXRhLmNoaWxkcmVuLnB1c2gobmV3X2NoaWxkcmVuW2ldLmRhdGEoKSk7XG5cdH1cblxuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgdG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkuc29ydChjYmFrKTtcblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZsYXR0ZW4nLCBmdW5jdGlvbiAocHJlc2VydmVfaW50ZXJuYWwpIHtcblx0aWYgKG5vZGUuaXNfbGVhZigpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXHR2YXIgZGF0YSA9IG5vZGUuZGF0YSgpO1xuXHR2YXIgbmV3cm9vdCA9IGNvcHlfbm9kZShkYXRhKTtcblx0dmFyIG5vZGVzO1xuXHRpZiAocHJlc2VydmVfaW50ZXJuYWwpIHtcblx0ICAgIG5vZGVzID0gbm9kZS5nZXRfYWxsX25vZGVzKCk7XG5cdCAgICBub2Rlcy5zaGlmdCgpOyAvLyB0aGUgc2VsZiBub2RlIGlzIGFsc28gaW5jbHVkZWRcblx0fSBlbHNlIHtcblx0ICAgIG5vZGVzID0gbm9kZS5nZXRfYWxsX2xlYXZlcygpO1xuXHR9XG5cdG5ld3Jvb3QuY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkZWxldGUgKG5vZGVzW2ldLmNoaWxkcmVuKTtcblx0ICAgIG5ld3Jvb3QuY2hpbGRyZW4ucHVzaChjb3B5X25vZGUobm9kZXNbaV0uZGF0YSgpKSk7XG5cdH1cblxuXHRyZXR1cm4gdG50X25vZGUobmV3cm9vdCk7XG4gICAgfSk7XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCBvbmx5ICdhcHBseSdzIHRvIG5vbiBjb2xsYXBzZWQgbm9kZXMgKGllIC5fY2hpbGRyZW4gaXMgbm90IHZpc2l0ZWQpXG4gICAgLy8gV291bGQgaXQgYmUgYmV0dGVyIHRvIGhhdmUgYW4gZXh0cmEgZmxhZyAodHJ1ZS9mYWxzZSkgdG8gdmlzaXQgYWxzbyBjb2xsYXBzZWQgbm9kZXM/XG4gICAgYXBpLm1ldGhvZCAoJ2FwcGx5JywgZnVuY3Rpb24oY2JhaywgZGVlcCkge1xuXHRpZiAoZGVlcCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICBkZWVwID0gZmFsc2U7XG5cdH1cblx0Y2Jhayhub2RlKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbiA9IHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pXG5cdFx0bi5hcHBseShjYmFrLCBkZWVwKTtcblx0ICAgIH1cblx0fVxuXG5cdGlmICgoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkgJiYgZGVlcCkge1xuXHQgICAgZm9yICh2YXIgaj0wOyBqPGRhdGEuX2NoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIG4gPSB0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltqXSk7XG5cdFx0bi5hcHBseShjYmFrLCBkZWVwKTtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHZpYSBhIGNhbGxiYWNrOlxuICAgIC8vIHJvb3QucHJvcGVydHkgKGZ1bmN0aW9uIChub2RlLCB2YWwpIHtcbiAgICAvLyAgICBub2RlLmRlZXBlci5maWVsZCA9IHZhbFxuICAgIC8vIH0sICduZXdfdmFsdWUnKVxuICAgIGFwaS5tZXRob2QgKCdwcm9wZXJ0eScsIGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG5cdCAgICBpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBwcm9wKGRhdGEpXHRcblx0ICAgIH1cblx0ICAgIHJldHVybiBkYXRhW3Byb3BdXG5cdH1cblx0aWYgKCh0eXBlb2YgcHJvcCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIHByb3AoZGF0YSwgdmFsdWUpOyAgIFxuXHR9XG5cdGRhdGFbcHJvcF0gPSB2YWx1ZTtcblx0cmV0dXJuIG5vZGU7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfbGVhZicsIGZ1bmN0aW9uKGRlZXApIHtcblx0aWYgKGRlZXApIHtcblx0ICAgIHJldHVybiAoKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgJiYgKGRhdGEuX2NoaWxkcmVuID09PSB1bmRlZmluZWQpKTtcblx0fVxuXHRyZXR1cm4gZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkO1xuICAgIH0pO1xuXG4gICAgLy8gSXQgbG9va3MgbGlrZSB0aGUgY2x1c3RlciBjYW4ndCBiZSB1c2VkIGZvciBhbnl0aGluZyB1c2VmdWwgaGVyZVxuICAgIC8vIEl0IGlzIG5vdyBpbmNsdWRlZCBhcyBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gdGhlIHRudC50cmVlKCkgbWV0aG9kIGNhbGxcbiAgICAvLyBzbyBJJ20gY29tbWVudGluZyB0aGUgZ2V0dGVyXG4gICAgLy8gbm9kZS5jbHVzdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gXHRyZXR1cm4gY2x1c3RlcjtcbiAgICAvLyB9O1xuXG4gICAgLy8gbm9kZS5kZXB0aCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgLy8gICAgIHJldHVybiBub2RlLmRlcHRoO1xuICAgIC8vIH07XG5cbi8vICAgICBub2RlLm5hbWUgPSBmdW5jdGlvbiAobm9kZSkge1xuLy8gICAgICAgICByZXR1cm4gbm9kZS5uYW1lO1xuLy8gICAgIH07XG5cbiAgICBhcGkubWV0aG9kICgnaWQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfaWQnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdub2RlX25hbWUnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCduYW1lJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnYnJhbmNoX2xlbmd0aCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ2JyYW5jaF9sZW5ndGgnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyb290X2Rpc3QnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfcm9vdF9kaXN0Jyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnY2hpbGRyZW4nLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgY2hpbGRyZW4gPSBbXTtcblxuXHRpZiAoZGF0YS5jaGlsZHJlbikge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pKTtcblx0ICAgIH1cblx0fVxuXHRpZiAoKGRhdGEuX2NoaWxkcmVuKSAmJiBkZWVwKSB7XG5cdCAgICBmb3IgKHZhciBqPTA7IGo8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHRjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2pdKSk7XG5cdCAgICB9XG5cdH1cblx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gY2hpbGRyZW47XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgncGFyZW50JywgZnVuY3Rpb24gKCkge1xuXHRpZiAoZGF0YS5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0cmV0dXJuIHRudF9ub2RlKGRhdGEuX3BhcmVudCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbm9kZTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X25vZGU7XG5cbiIsIi8vIGlmICh0eXBlb2YgdG50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4vLyAgICAgbW9kdWxlLmV4cG9ydHMgPSB0bnQgPSB7fVxuLy8gfVxubW9kdWxlLmV4cG9ydHMgPSB0cmVlID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xudmFyIGV2ZW50c3lzdGVtID0gcmVxdWlyZShcImJpb2pzLWV2ZW50c1wiKTtcbmV2ZW50c3lzdGVtLm1peGluKHRyZWUpO1xuLy90bnQudXRpbHMgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpO1xuLy90bnQudG9vbHRpcCA9IHJlcXVpcmUoXCJ0bnQudG9vbHRpcFwiKTtcbi8vdG50LnRyZWUgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG5cbiIsImFyZ3VtZW50c1s0XVs1NF1bMF0uYXBwbHkoZXhwb3J0cyxhcmd1bWVudHMpIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgaXRlcmF0b3IgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpLml0ZXJhdG9yO1xuXG52YXIgdG50X25vZGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuLy90bnQudHJlZS5ub2RlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBub2RlID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKG5vZGUpO1xuXG4gICAgLy8gQVBJXG4vLyAgICAgbm9kZS5ub2RlcyA9IGZ1bmN0aW9uKCkge1xuLy8gXHRpZiAoY2x1c3RlciA9PT0gdW5kZWZpbmVkKSB7XG4vLyBcdCAgICBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxuLy8gXHQgICAgLy8gVE9ETzogbGVuZ3RoIGFuZCBjaGlsZHJlbiBzaG91bGQgYmUgZXhwb3NlZCBpbiB0aGUgQVBJXG4vLyBcdCAgICAvLyBpLmUuIHRoZSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIGNoYW5nZSB0aGlzIGRlZmF1bHRzIHZpYSB0aGUgQVBJXG4vLyBcdCAgICAvLyBjaGlsZHJlbiBpcyB0aGUgZGVmYXVsdHMgZm9yIHBhcnNlX25ld2ljaywgYnV0IG1heWJlIHdlIHNob3VsZCBjaGFuZ2UgdGhhdFxuLy8gXHQgICAgLy8gb3IgYXQgbGVhc3Qgbm90IGFzc3VtZSB0aGlzIGlzIGFsd2F5cyB0aGUgY2FzZSBmb3IgdGhlIGRhdGEgcHJvdmlkZWRcbi8vIFx0XHQudmFsdWUoZnVuY3Rpb24oZCkge3JldHVybiBkLmxlbmd0aH0pXG4vLyBcdFx0LmNoaWxkcmVuKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5jaGlsZHJlbn0pO1xuLy8gXHR9XG4vLyBcdG5vZGVzID0gY2x1c3Rlci5ub2RlcyhkYXRhKTtcbi8vIFx0cmV0dXJuIG5vZGVzO1xuLy8gICAgIH07XG5cbiAgICB2YXIgYXBwbHlfdG9fZGF0YSA9IGZ1bmN0aW9uIChkYXRhLCBjYmFrKSB7XG5cdGNiYWsoZGF0YSk7XG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBwbHlfdG9fZGF0YShkYXRhLmNoaWxkcmVuW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0fVxuICAgIH07XG5cbiAgICB2YXIgY3JlYXRlX2lkcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGkgPSBpdGVyYXRvcigxKTtcblx0Ly8gV2UgY2FuJ3QgdXNlIGFwcGx5IGJlY2F1c2UgYXBwbHkgY3JlYXRlcyBuZXcgdHJlZXMgb24gZXZlcnkgbm9kZVxuXHQvLyBXZSBzaG91bGQgdXNlIHRoZSBkaXJlY3QgZGF0YSBpbnN0ZWFkXG5cdGFwcGx5X3RvX2RhdGEgKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICBpZiAoZC5faWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGQuX2lkID0gaSgpO1xuXHRcdC8vIFRPRE86IE5vdCBzdXJlIF9pblN1YlRyZWUgaXMgc3RyaWN0bHkgbmVjZXNzYXJ5XG5cdFx0Ly8gZC5faW5TdWJUcmVlID0ge3ByZXY6dHJ1ZSwgY3Vycjp0cnVlfTtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIHZhciBsaW5rX3BhcmVudHMgPSBmdW5jdGlvbiAoZGF0YSkge1xuXHRpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAvLyBfcGFyZW50P1xuXHQgICAgZGF0YS5jaGlsZHJlbltpXS5fcGFyZW50ID0gZGF0YTtcblx0ICAgIGxpbmtfcGFyZW50cyhkYXRhLmNoaWxkcmVuW2ldKTtcblx0fVxuICAgIH07XG5cbiAgICB2YXIgY29tcHV0ZV9yb290X2Rpc3RzID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0YXBwbHlfdG9fZGF0YSAoZGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHZhciBsO1xuXHQgICAgaWYgKGQuX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZC5fcm9vdF9kaXN0ID0gMDtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIGwgPSAwO1xuXHRcdGlmIChkLmJyYW5jaF9sZW5ndGgpIHtcblx0XHQgICAgbCA9IGQuYnJhbmNoX2xlbmd0aFxuXHRcdH1cblx0XHRkLl9yb290X2Rpc3QgPSBsICsgZC5fcGFyZW50Ll9yb290X2Rpc3Q7XG5cdCAgICB9XG5cdH0pO1xuICAgIH07XG5cbiAgICAvLyBUT0RPOiBkYXRhIGNhbid0IGJlIHJld3JpdHRlbiB1c2VkIHRoZSBhcGkgeWV0LiBXZSBuZWVkIGZpbmFsaXplcnNcbiAgICBub2RlLmRhdGEgPSBmdW5jdGlvbihuZXdfZGF0YSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBkYXRhXG5cdH1cblx0ZGF0YSA9IG5ld19kYXRhO1xuXHRjcmVhdGVfaWRzKCk7XG5cdGxpbmtfcGFyZW50cyhkYXRhKTtcblx0Y29tcHV0ZV9yb290X2Rpc3RzKGRhdGEpO1xuXHRyZXR1cm4gbm9kZTtcbiAgICB9O1xuICAgIC8vIFdlIGJpbmQgdGhlIGRhdGEgdGhhdCBoYXMgYmVlbiBwYXNzZWRcbiAgICBub2RlLmRhdGEoZGF0YSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF9hbGwnLCBmdW5jdGlvbiAoY2JhaywgZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChjYmFrKG4pKSB7XG5cdFx0bm9kZXMucHVzaCAobik7XG5cdCAgICB9XG5cdH0pO1xuXHRyZXR1cm4gbm9kZXM7XG4gICAgfSk7XG4gICAgXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZScsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdGlmIChjYmFrKG5vZGUpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGo9MDsgajxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltqXSkuZmluZF9ub2RlKGNiYWssIGRlZXApO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cblx0aWYgKGRlZXAgJiYgKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQpKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltpXSkuZmluZF9ub2RlKGNiYWssIGRlZXApXG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5fY2hpbGRyZW5baV0pLmZpbmRfbm9kZShjYmFrLCBkZWVwKTtcblx0XHRpZiAoZm91bmQpIHtcblx0XHQgICAgcmV0dXJuIGZvdW5kO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZV9ieV9uYW1lJywgZnVuY3Rpb24obmFtZSwgZGVlcCkge1xuXHRyZXR1cm4gbm9kZS5maW5kX25vZGUgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICByZXR1cm4gbm9kZS5ub2RlX25hbWUoKSA9PT0gbmFtZVxuXHR9LCBkZWVwKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd0b2dnbGUnLCBmdW5jdGlvbigpIHtcblx0aWYgKGRhdGEpIHtcblx0ICAgIGlmIChkYXRhLmNoaWxkcmVuKSB7IC8vIFVuY29sbGFwc2VkIC0+IGNvbGxhcHNlXG5cdFx0dmFyIGhpZGRlbiA9IDA7XG5cdFx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0XHQgICAgdmFyIGhpZGRlbl9oZXJlID0gbi5uX2hpZGRlbigpIHx8IDA7XG5cdFx0ICAgIGhpZGRlbiArPSAobi5uX2hpZGRlbigpIHx8IDApICsgMTtcblx0XHR9KTtcblx0XHRub2RlLm5faGlkZGVuIChoaWRkZW4tMSk7XG5cdFx0ZGF0YS5fY2hpbGRyZW4gPSBkYXRhLmNoaWxkcmVuO1xuXHRcdGRhdGEuY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG5cdCAgICB9IGVsc2UgeyAgICAgICAgICAgICAvLyBDb2xsYXBzZWQgLT4gdW5jb2xsYXBzZVxuXHRcdG5vZGUubl9oaWRkZW4oMCk7XG5cdFx0ZGF0YS5jaGlsZHJlbiA9IGRhdGEuX2NoaWxkcmVuO1xuXHRcdGRhdGEuX2NoaWxkcmVuID0gdW5kZWZpbmVkO1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2lzX2NvbGxhcHNlZCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkICYmIGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFzX2FuY2VzdG9yID0gZnVuY3Rpb24obiwgYW5jZXN0b3IpIHtcblx0Ly8gSXQgaXMgYmV0dGVyIHRvIHdvcmsgYXQgdGhlIGRhdGEgbGV2ZWxcblx0biA9IG4uZGF0YSgpO1xuXHRhbmNlc3RvciA9IGFuY2VzdG9yLmRhdGEoKTtcblx0aWYgKG4uX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm4gZmFsc2Vcblx0fVxuXHRuID0gbi5fcGFyZW50XG5cdGZvciAoOzspIHtcblx0ICAgIGlmIChuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBpZiAobiA9PT0gYW5jZXN0b3IpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIG4gPSBuLl9wYXJlbnQ7XG5cdH1cbiAgICB9O1xuXG4gICAgLy8gVGhpcyBpcyB0aGUgZWFzaWVzdCB3YXkgdG8gY2FsY3VsYXRlIHRoZSBMQ0EgSSBjYW4gdGhpbmsgb2YuIEJ1dCBpdCBpcyB2ZXJ5IGluZWZmaWNpZW50IHRvby5cbiAgICAvLyBJdCBpcyB3b3JraW5nIGZpbmUgYnkgbm93LCBidXQgaW4gY2FzZSBpdCBuZWVkcyB0byBiZSBtb3JlIHBlcmZvcm1hbnQgd2UgY2FuIGltcGxlbWVudCB0aGUgTENBXG4gICAgLy8gYWxnb3JpdGhtIGV4cGxhaW5lZCBoZXJlOlxuICAgIC8vIGh0dHA6Ly9jb21tdW5pdHkudG9wY29kZXIuY29tL3RjP21vZHVsZT1TdGF0aWMmZDE9dHV0b3JpYWxzJmQyPWxvd2VzdENvbW1vbkFuY2VzdG9yXG4gICAgYXBpLm1ldGhvZCAoJ2xjYScsIGZ1bmN0aW9uIChub2Rlcykge1xuXHRpZiAobm9kZXMubGVuZ3RoID09PSAxKSB7XG5cdCAgICByZXR1cm4gbm9kZXNbMF07XG5cdH1cblx0dmFyIGxjYV9ub2RlID0gbm9kZXNbMF07XG5cdGZvciAodmFyIGkgPSAxOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBsY2Ffbm9kZSA9IF9sY2EobGNhX25vZGUsIG5vZGVzW2ldKTtcblx0fVxuXHRyZXR1cm4gbGNhX25vZGU7XG5cdC8vIHJldHVybiB0bnRfbm9kZShsY2Ffbm9kZSk7XG4gICAgfSk7XG5cbiAgICB2YXIgX2xjYSA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xuXHRpZiAobm9kZTEuZGF0YSgpID09PSBub2RlMi5kYXRhKCkpIHtcblx0ICAgIHJldHVybiBub2RlMTtcblx0fVxuXHRpZiAoaGFzX2FuY2VzdG9yKG5vZGUxLCBub2RlMikpIHtcblx0ICAgIHJldHVybiBub2RlMjtcblx0fVxuXHRyZXR1cm4gX2xjYShub2RlMSwgbm9kZTIucGFyZW50KCkpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kKCduX2hpZGRlbicsIGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gbm9kZS5wcm9wZXJ0eSgnX2hpZGRlbicpO1xuXHR9XG5cdG5vZGUucHJvcGVydHkoJ19oaWRkZW4nLCB2YWwpO1xuXHRyZXR1cm4gbm9kZVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbm9kZXMnLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgbm9kZXMucHVzaChuKTtcblx0fSwgZGVlcCk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdnZXRfYWxsX2xlYXZlcycsIGZ1bmN0aW9uIChkZWVwKSB7XG5cdHZhciBsZWF2ZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKG4uaXNfbGVhZihkZWVwKSkge1xuXHRcdGxlYXZlcy5wdXNoKG4pO1xuXHQgICAgfVxuXHR9LCBkZWVwKTtcblx0cmV0dXJuIGxlYXZlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd1cHN0cmVhbScsIGZ1bmN0aW9uKGNiYWspIHtcblx0Y2Jhayhub2RlKTtcblx0dmFyIHBhcmVudCA9IG5vZGUucGFyZW50KCk7XG5cdGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgcGFyZW50LnVwc3RyZWFtKGNiYWspO1xuXHR9XG4vL1x0dG50X25vZGUocGFyZW50KS51cHN0cmVhbShjYmFrKTtcbi8vIFx0bm9kZS51cHN0cmVhbShub2RlLl9wYXJlbnQsIGNiYWspO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3N1YnRyZWUnLCBmdW5jdGlvbihub2Rlcywga2VlcF9zaW5nbGV0b25zKSB7XG5cdGlmIChrZWVwX3NpbmdsZXRvbnMgPT09IHVuZGVmaW5lZCkge1xuXHQgICAga2VlcF9zaW5nbGV0b25zID0gZmFsc2U7XG5cdH1cbiAgICBcdHZhciBub2RlX2NvdW50cyA9IHt9O1xuICAgIFx0Zm9yICh2YXIgaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgbiA9IG5vZGVzW2ldO1xuXHQgICAgaWYgKG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdG4udXBzdHJlYW0gKGZ1bmN0aW9uICh0aGlzX25vZGUpe1xuXHRcdCAgICB2YXIgaWQgPSB0aGlzX25vZGUuaWQoKTtcblx0XHQgICAgaWYgKG5vZGVfY291bnRzW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRub2RlX2NvdW50c1tpZF0gPSAwO1xuXHRcdCAgICB9XG5cdFx0ICAgIG5vZGVfY291bnRzW2lkXSsrXG4gICAgXHRcdH0pO1xuXHQgICAgfVxuICAgIFx0fVxuICAgIFxuXHR2YXIgaXNfc2luZ2xldG9uID0gZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5fY2hpbGRyZW4gPSAwO1xuXHQgICAgaWYgKG5vZGVfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuXHQgICAgZm9yICh2YXIgaT0wOyBpPG5vZGVfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBpZCA9IG5vZGVfZGF0YS5jaGlsZHJlbltpXS5faWQ7XG5cdFx0aWYgKG5vZGVfY291bnRzW2lkXSA+IDApIHtcblx0XHQgICAgbl9jaGlsZHJlbisrO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBuX2NoaWxkcmVuID09PSAxO1xuXHR9O1xuXG5cdHZhciBzdWJ0cmVlID0ge307XG5cdGNvcHlfZGF0YSAoZGF0YSwgc3VidHJlZSwgMCwgZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5vZGVfaWQgPSBub2RlX2RhdGEuX2lkO1xuXHQgICAgdmFyIGNvdW50cyA9IG5vZGVfY291bnRzW25vZGVfaWRdO1xuXHQgICAgXG5cdCAgICAvLyBJcyBpbiBwYXRoXG5cdCAgICBpZiAoY291bnRzID4gMCkge1xuXHRcdGlmIChpc19zaW5nbGV0b24obm9kZV9kYXRhKSAmJiAha2VlcF9zaW5nbGV0b25zKSB7XG5cdFx0ICAgIHJldHVybiBmYWxzZTsgXG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgLy8gSXMgbm90IGluIHBhdGhcblx0ICAgIHJldHVybiBmYWxzZTtcblx0fSk7XG5cblx0cmV0dXJuIHRudF9ub2RlKHN1YnRyZWUuY2hpbGRyZW5bMF0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGNvcHlfZGF0YSA9IGZ1bmN0aW9uIChvcmlnX2RhdGEsIHN1YnRyZWUsIGN1cnJCcmFuY2hMZW5ndGgsIGNvbmRpdGlvbikge1xuICAgICAgICBpZiAob3JpZ19kYXRhID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25kaXRpb24ob3JpZ19kYXRhKSkge1xuXHQgICAgdmFyIGNvcHkgPSBjb3B5X25vZGUob3JpZ19kYXRhLCBjdXJyQnJhbmNoTGVuZ3RoKTtcblx0ICAgIGlmIChzdWJ0cmVlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzdWJ0cmVlLmNoaWxkcmVuID0gW107XG5cdCAgICB9XG5cdCAgICBzdWJ0cmVlLmNoaWxkcmVuLnB1c2goY29weSk7XG5cdCAgICBpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvcHlfZGF0YSAob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBjb3B5LCAwLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9IGVsc2Uge1xuXHQgICAgaWYgKG9yaWdfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXHQgICAgY3VyckJyYW5jaExlbmd0aCArPSBvcmlnX2RhdGEuYnJhbmNoX2xlbmd0aCB8fCAwO1xuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmlnX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb3B5X2RhdGEob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBzdWJ0cmVlLCBjdXJyQnJhbmNoTGVuZ3RoLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBjb3B5X25vZGUgPSBmdW5jdGlvbiAobm9kZV9kYXRhLCBleHRyYUJyYW5jaExlbmd0aCkge1xuXHR2YXIgY29weSA9IHt9O1xuXHQvLyBjb3B5IGFsbCB0aGUgb3duIHByb3BlcnRpZXMgZXhjZXB0cyBsaW5rcyB0byBvdGhlciBub2RlcyBvciBkZXB0aFxuXHRmb3IgKHZhciBwYXJhbSBpbiBub2RlX2RhdGEpIHtcblx0ICAgIGlmICgocGFyYW0gPT09IFwiY2hpbGRyZW5cIikgfHxcblx0XHQocGFyYW0gPT09IFwiX2NoaWxkcmVuXCIpIHx8XG5cdFx0KHBhcmFtID09PSBcIl9wYXJlbnRcIikgfHxcblx0XHQocGFyYW0gPT09IFwiZGVwdGhcIikpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIGlmIChub2RlX2RhdGEuaGFzT3duUHJvcGVydHkocGFyYW0pKSB7XG5cdFx0Y29weVtwYXJhbV0gPSBub2RlX2RhdGFbcGFyYW1dO1xuXHQgICAgfVxuXHR9XG5cdGlmICgoY29weS5icmFuY2hfbGVuZ3RoICE9PSB1bmRlZmluZWQpICYmIChleHRyYUJyYW5jaExlbmd0aCAhPT0gdW5kZWZpbmVkKSkge1xuXHQgICAgY29weS5icmFuY2hfbGVuZ3RoICs9IGV4dHJhQnJhbmNoTGVuZ3RoO1xuXHR9XG5cdHJldHVybiBjb3B5O1xuICAgIH07XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCB2aXNpdHMgYWxsIHRoZSBub2Rlc1xuICAgIC8vIGEgbW9yZSBwZXJmb3JtYW50IHZlcnNpb24gc2hvdWxkIHJldHVybiB0cnVlXG4gICAgLy8gdGhlIGZpcnN0IHRpbWUgY2Jhayhub2RlKSBpcyB0cnVlXG4gICAgYXBpLm1ldGhvZCAoJ3ByZXNlbnQnLCBmdW5jdGlvbiAoY2Jhaykge1xuXHQvLyBjYmFrIHNob3VsZCByZXR1cm4gdHJ1ZS9mYWxzZVxuXHR2YXIgaXNfdHJ1ZSA9IGZhbHNlO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikgPT09IHRydWUpIHtcblx0XHRpc190cnVlID0gdHJ1ZTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBpc190cnVlO1xuICAgIH0pO1xuXG4gICAgLy8gY2JhayBpcyBjYWxsZWQgd2l0aCB0d28gbm9kZXNcbiAgICAvLyBhbmQgc2hvdWxkIHJldHVybiBhIG5lZ2F0aXZlIG51bWJlciwgMCBvciBhIHBvc2l0aXZlIG51bWJlclxuICAgIGFwaS5tZXRob2QgKCdzb3J0JywgZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0dmFyIG5ld19jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgbmV3X2NoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHR9XG5cblx0bmV3X2NoaWxkcmVuLnNvcnQoY2Jhayk7XG5cblx0ZGF0YS5jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8bmV3X2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkYXRhLmNoaWxkcmVuLnB1c2gobmV3X2NoaWxkcmVuW2ldLmRhdGEoKSk7XG5cdH1cblxuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgdG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkuc29ydChjYmFrKTtcblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZsYXR0ZW4nLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChub2RlLmlzX2xlYWYoKSkge1xuXHQgICAgcmV0dXJuIG5vZGU7XG5cdH1cblx0dmFyIGRhdGEgPSBub2RlLmRhdGEoKTtcblx0dmFyIG5ld3Jvb3QgPSBjb3B5X25vZGUoZGF0YSk7XG5cdHZhciBsZWF2ZXMgPSBub2RlLmdldF9hbGxfbGVhdmVzKCk7XG5cdG5ld3Jvb3QuY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgbmV3cm9vdC5jaGlsZHJlbi5wdXNoKGNvcHlfbm9kZShsZWF2ZXNbaV0uZGF0YSgpKSk7XG5cdH1cblxuXHRyZXR1cm4gdG50X25vZGUobmV3cm9vdCk7XG4gICAgfSk7XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCBvbmx5ICdhcHBseSdzIHRvIG5vbiBjb2xsYXBzZWQgbm9kZXMgKGllIC5fY2hpbGRyZW4gaXMgbm90IHZpc2l0ZWQpXG4gICAgLy8gV291bGQgaXQgYmUgYmV0dGVyIHRvIGhhdmUgYW4gZXh0cmEgZmxhZyAodHJ1ZS9mYWxzZSkgdG8gdmlzaXQgYWxzbyBjb2xsYXBzZWQgbm9kZXM/XG4gICAgYXBpLm1ldGhvZCAoJ2FwcGx5JywgZnVuY3Rpb24oY2JhaywgZGVlcCkge1xuXHRpZiAoZGVlcCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICBkZWVwID0gZmFsc2U7XG5cdH1cblx0Y2Jhayhub2RlKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbiA9IHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pXG5cdFx0bi5hcHBseShjYmFrLCBkZWVwKTtcblx0ICAgIH1cblx0fVxuXG5cdGlmICgoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkgJiYgZGVlcCkge1xuXHQgICAgZm9yICh2YXIgaj0wOyBqPGRhdGEuX2NoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIG4gPSB0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltqXSk7XG5cdFx0bi5hcHBseShjYmFrLCBkZWVwKTtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHZpYSBhIGNhbGxiYWNrOlxuICAgIC8vIHJvb3QucHJvcGVydHkgKGZ1bmN0aW9uIChub2RlLCB2YWwpIHtcbiAgICAvLyAgICBub2RlLmRlZXBlci5maWVsZCA9IHZhbFxuICAgIC8vIH0sICduZXdfdmFsdWUnKVxuICAgIGFwaS5tZXRob2QgKCdwcm9wZXJ0eScsIGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG5cdCAgICBpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBwcm9wKGRhdGEpXHRcblx0ICAgIH1cblx0ICAgIHJldHVybiBkYXRhW3Byb3BdXG5cdH1cblx0aWYgKCh0eXBlb2YgcHJvcCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIHByb3AoZGF0YSwgdmFsdWUpOyAgIFxuXHR9XG5cdGRhdGFbcHJvcF0gPSB2YWx1ZTtcblx0cmV0dXJuIG5vZGU7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfbGVhZicsIGZ1bmN0aW9uKGRlZXApIHtcblx0aWYgKGRlZXApIHtcblx0ICAgIHJldHVybiAoKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgJiYgKGRhdGEuX2NoaWxkcmVuID09PSB1bmRlZmluZWQpKTtcblx0fVxuXHRyZXR1cm4gZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkO1xuICAgIH0pO1xuXG4gICAgLy8gSXQgbG9va3MgbGlrZSB0aGUgY2x1c3RlciBjYW4ndCBiZSB1c2VkIGZvciBhbnl0aGluZyB1c2VmdWwgaGVyZVxuICAgIC8vIEl0IGlzIG5vdyBpbmNsdWRlZCBhcyBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gdGhlIHRudC50cmVlKCkgbWV0aG9kIGNhbGxcbiAgICAvLyBzbyBJJ20gY29tbWVudGluZyB0aGUgZ2V0dGVyXG4gICAgLy8gbm9kZS5jbHVzdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gXHRyZXR1cm4gY2x1c3RlcjtcbiAgICAvLyB9O1xuXG4gICAgLy8gbm9kZS5kZXB0aCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgLy8gICAgIHJldHVybiBub2RlLmRlcHRoO1xuICAgIC8vIH07XG5cbi8vICAgICBub2RlLm5hbWUgPSBmdW5jdGlvbiAobm9kZSkge1xuLy8gICAgICAgICByZXR1cm4gbm9kZS5uYW1lO1xuLy8gICAgIH07XG5cbiAgICBhcGkubWV0aG9kICgnaWQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfaWQnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdub2RlX25hbWUnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCduYW1lJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnYnJhbmNoX2xlbmd0aCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ2JyYW5jaF9sZW5ndGgnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyb290X2Rpc3QnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfcm9vdF9kaXN0Jyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnY2hpbGRyZW4nLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgY2hpbGRyZW4gPSBbXTtcblxuXHRpZiAoZGF0YS5jaGlsZHJlbikge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pKTtcblx0ICAgIH1cblx0fVxuXHRpZiAoKGRhdGEuX2NoaWxkcmVuKSAmJiBkZWVwKSB7XG5cdCAgICBmb3IgKHZhciBqPTA7IGo8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHRjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2pdKSk7XG5cdCAgICB9XG5cdH1cblx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gY2hpbGRyZW47XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgncGFyZW50JywgZnVuY3Rpb24gKCkge1xuXHRpZiAoZGF0YS5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0cmV0dXJuIHRudF9ub2RlKGRhdGEuX3BhcmVudCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbm9kZTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X25vZGU7XG5cbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoJ3RudC5hcGknKTtcbnZhciB0cmVlID0ge307XG5cbnRyZWUuZGlhZ29uYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGQgPSBmdW5jdGlvbiAoZGlhZ29uYWxQYXRoKSB7XG5cdHZhciBzb3VyY2UgPSBkaWFnb25hbFBhdGguc291cmNlO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZGlhZ29uYWxQYXRoLnRhcmdldDtcbiAgICAgICAgdmFyIG1pZHBvaW50WCA9IChzb3VyY2UueCArIHRhcmdldC54KSAvIDI7XG4gICAgICAgIHZhciBtaWRwb2ludFkgPSAoc291cmNlLnkgKyB0YXJnZXQueSkgLyAyO1xuICAgICAgICB2YXIgcGF0aERhdGEgPSBbc291cmNlLCB7eDogdGFyZ2V0LngsIHk6IHNvdXJjZS55fSwgdGFyZ2V0XTtcblx0cGF0aERhdGEgPSBwYXRoRGF0YS5tYXAoZC5wcm9qZWN0aW9uKCkpO1xuXHRyZXR1cm4gZC5wYXRoKCkocGF0aERhdGEsIHJhZGlhbF9jYWxjLmNhbGwodGhpcyxwYXRoRGF0YSkpXG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAoZClcblx0LmdldHNldCAoJ3Byb2plY3Rpb24nKVxuXHQuZ2V0c2V0ICgncGF0aCcpXG4gICAgXG4gICAgdmFyIGNvb3JkaW5hdGVUb0FuZ2xlID0gZnVuY3Rpb24gKGNvb3JkLCByYWRpdXMpIHtcbiAgICAgIFx0dmFyIHdob2xlQW5nbGUgPSAyICogTWF0aC5QSSxcbiAgICAgICAgcXVhcnRlckFuZ2xlID0gd2hvbGVBbmdsZSAvIDRcblx0XG4gICAgICBcdHZhciBjb29yZFF1YWQgPSBjb29yZFswXSA+PSAwID8gKGNvb3JkWzFdID49IDAgPyAxIDogMikgOiAoY29vcmRbMV0gPj0gMCA/IDQgOiAzKSxcbiAgICAgICAgY29vcmRCYXNlQW5nbGUgPSBNYXRoLmFicyhNYXRoLmFzaW4oY29vcmRbMV0gLyByYWRpdXMpKVxuXHRcbiAgICAgIFx0Ly8gU2luY2UgdGhpcyBpcyBqdXN0IGJhc2VkIG9uIHRoZSBhbmdsZSBvZiB0aGUgcmlnaHQgdHJpYW5nbGUgZm9ybWVkXG4gICAgICBcdC8vIGJ5IHRoZSBjb29yZGluYXRlIGFuZCB0aGUgb3JpZ2luLCBlYWNoIHF1YWQgd2lsbCBoYXZlIGRpZmZlcmVudCBcbiAgICAgIFx0Ly8gb2Zmc2V0c1xuICAgICAgXHR2YXIgY29vcmRBbmdsZTtcbiAgICAgIFx0c3dpdGNoIChjb29yZFF1YWQpIHtcbiAgICAgIFx0Y2FzZSAxOlxuICAgICAgXHQgICAgY29vcmRBbmdsZSA9IHF1YXJ0ZXJBbmdsZSAtIGNvb3JkQmFzZUFuZ2xlXG4gICAgICBcdCAgICBicmVha1xuICAgICAgXHRjYXNlIDI6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gcXVhcnRlckFuZ2xlICsgY29vcmRCYXNlQW5nbGVcbiAgICAgIFx0ICAgIGJyZWFrXG4gICAgICBcdGNhc2UgMzpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSAyKnF1YXJ0ZXJBbmdsZSArIHF1YXJ0ZXJBbmdsZSAtIGNvb3JkQmFzZUFuZ2xlXG4gICAgICBcdCAgICBicmVha1xuICAgICAgXHRjYXNlIDQ6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gMypxdWFydGVyQW5nbGUgKyBjb29yZEJhc2VBbmdsZVxuICAgICAgXHR9XG4gICAgICBcdHJldHVybiBjb29yZEFuZ2xlXG4gICAgfTtcblxuICAgIHZhciByYWRpYWxfY2FsYyA9IGZ1bmN0aW9uIChwYXRoRGF0YSkge1xuXHR2YXIgc3JjID0gcGF0aERhdGFbMF07XG5cdHZhciBtaWQgPSBwYXRoRGF0YVsxXTtcblx0dmFyIGRzdCA9IHBhdGhEYXRhWzJdO1xuXHR2YXIgcmFkaXVzID0gTWF0aC5zcXJ0KHNyY1swXSpzcmNbMF0gKyBzcmNbMV0qc3JjWzFdKTtcblx0dmFyIHNyY0FuZ2xlID0gY29vcmRpbmF0ZVRvQW5nbGUoc3JjLCByYWRpdXMpO1xuXHR2YXIgbWlkQW5nbGUgPSBjb29yZGluYXRlVG9BbmdsZShtaWQsIHJhZGl1cyk7XG5cdHZhciBjbG9ja3dpc2UgPSBNYXRoLmFicyhtaWRBbmdsZSAtIHNyY0FuZ2xlKSA+IE1hdGguUEkgPyBtaWRBbmdsZSA8PSBzcmNBbmdsZSA6IG1pZEFuZ2xlID4gc3JjQW5nbGU7XG5cdHJldHVybiB7XG5cdCAgICByYWRpdXMgICA6IHJhZGl1cyxcblx0ICAgIGNsb2Nrd2lzZSA6IGNsb2Nrd2lzZVxuXHR9O1xuICAgIH07XG5cbiAgICByZXR1cm4gZDtcbn07XG5cbi8vIHZlcnRpY2FsIGRpYWdvbmFsIGZvciByZWN0IGJyYW5jaGVzXG50cmVlLmRpYWdvbmFsLnZlcnRpY2FsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwYXRoID0gZnVuY3Rpb24ocGF0aERhdGEsIG9iaikge1xuXHR2YXIgc3JjID0gcGF0aERhdGFbMF07XG5cdHZhciBtaWQgPSBwYXRoRGF0YVsxXTtcblx0dmFyIGRzdCA9IHBhdGhEYXRhWzJdO1xuXHR2YXIgcmFkaXVzID0gMjAwMDAwOyAvLyBOdW1iZXIgbG9uZyBlbm91Z2hcblxuXHRyZXR1cm4gXCJNXCIgKyBzcmMgKyBcIiBBXCIgKyBbcmFkaXVzLHJhZGl1c10gKyBcIiAwIDAsMCBcIiArIG1pZCArIFwiTVwiICsgbWlkICsgXCJMXCIgKyBkc3Q7IFxuXHRcbiAgICB9O1xuXG4gICAgdmFyIHByb2plY3Rpb24gPSBmdW5jdGlvbihkKSB7IFxuXHRyZXR1cm4gW2QueSwgZC54XTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJlZS5kaWFnb25hbCgpXG4gICAgICBcdC5wYXRoKHBhdGgpXG4gICAgICBcdC5wcm9qZWN0aW9uKHByb2plY3Rpb24pO1xufTtcblxudHJlZS5kaWFnb25hbC5yYWRpYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBhdGggPSBmdW5jdGlvbihwYXRoRGF0YSwgb2JqKSB7XG4gICAgICBcdHZhciBzcmMgPSBwYXRoRGF0YVswXTtcbiAgICAgIFx0dmFyIG1pZCA9IHBhdGhEYXRhWzFdO1xuICAgICAgXHR2YXIgZHN0ID0gcGF0aERhdGFbMl07XG5cdHZhciByYWRpdXMgPSBvYmoucmFkaXVzO1xuXHR2YXIgY2xvY2t3aXNlID0gb2JqLmNsb2Nrd2lzZTtcblxuXHRpZiAoY2xvY2t3aXNlKSB7XG5cdCAgICByZXR1cm4gXCJNXCIgKyBzcmMgKyBcIiBBXCIgKyBbcmFkaXVzLHJhZGl1c10gKyBcIiAwIDAsMCBcIiArIG1pZCArIFwiTVwiICsgbWlkICsgXCJMXCIgKyBkc3Q7IFxuXHR9IGVsc2Uge1xuXHQgICAgcmV0dXJuIFwiTVwiICsgbWlkICsgXCIgQVwiICsgW3JhZGl1cyxyYWRpdXNdICsgXCIgMCAwLDAgXCIgKyBzcmMgKyBcIk1cIiArIG1pZCArIFwiTFwiICsgZHN0O1xuXHR9XG5cbiAgICB9O1xuXG4gICAgdmFyIHByb2plY3Rpb24gPSBmdW5jdGlvbihkKSB7XG4gICAgICBcdHZhciByID0gZC55LCBhID0gKGQueCAtIDkwKSAvIDE4MCAqIE1hdGguUEk7XG4gICAgICBcdHJldHVybiBbciAqIE1hdGguY29zKGEpLCByICogTWF0aC5zaW4oYSldO1xuICAgIH07XG5cbiAgICByZXR1cm4gdHJlZS5kaWFnb25hbCgpXG4gICAgICBcdC5wYXRoKHBhdGgpXG4gICAgICBcdC5wcm9qZWN0aW9uKHByb2plY3Rpb24pXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmRpYWdvbmFsO1xuIiwidmFyIHRyZWUgPSByZXF1aXJlIChcIi4vdHJlZS5qc1wiKTtcbnRyZWUubGFiZWwgPSByZXF1aXJlKFwiLi9sYWJlbC5qc1wiKTtcbnRyZWUuZGlhZ29uYWwgPSByZXF1aXJlKFwiLi9kaWFnb25hbC5qc1wiKTtcbnRyZWUubGF5b3V0ID0gcmVxdWlyZShcIi4vbGF5b3V0LmpzXCIpO1xudHJlZS5ub2RlX2Rpc3BsYXkgPSByZXF1aXJlKFwiLi9ub2RlX2Rpc3BsYXkuanNcIik7XG4vLyB0cmVlLm5vZGUgPSByZXF1aXJlKFwidG50LnRyZWUubm9kZVwiKTtcbi8vIHRyZWUucGFyc2VfbmV3aWNrID0gcmVxdWlyZShcInRudC5uZXdpY2tcIikucGFyc2VfbmV3aWNrO1xuLy8gdHJlZS5wYXJzZV9uaHggPSByZXF1aXJlKFwidG50Lm5ld2lja1wiKS5wYXJzZV9uaHg7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWU7XG5cbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5sYWJlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoIChcImNsaWNrXCIsIFwiZGJsY2xpY2tcIiwgXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiKVxuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgd2Ugc2hvdWxkIGJlIHJlbW92aW5nIGJ5IGRlZmF1bHQgcHJldiBsYWJlbHNcbiAgICAvLyBvciBpdCB3b3VsZCBiZSBiZXR0ZXIgdG8gaGF2ZSBhIHNlcGFyYXRlIHJlbW92ZSBtZXRob2QgY2FsbGVkIGJ5IHRoZSB2aXNcbiAgICAvLyBvbiB1cGRhdGVcbiAgICAvLyBXZSBhbHNvIGhhdmUgdGhlIHByb2JsZW0gdGhhdCB3ZSBtYXkgYmUgdHJhbnNpdGlvbmluZyBmcm9tXG4gICAgLy8gdGV4dCB0byBpbWcgbGFiZWxzIGFuZCB3ZSBuZWVkIHRvIHJlbW92ZSB0aGUgbGFiZWwgb2YgYSBkaWZmZXJlbnQgdHlwZVxuICAgIHZhciBsYWJlbCA9IGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSwgbm9kZV9zaXplKSB7XG4gICAgICAgIGlmICh0eXBlb2YgKG5vZGUpICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyhub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxhYmVsLmRpc3BsYXkoKS5jYWxsKHRoaXMsIG5vZGUsIGxheW91dF90eXBlKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX2xhYmVsXCIpXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHZhciB0ID0gbGFiZWwudHJhbnNmb3JtKCkobm9kZSwgbGF5b3V0X3R5cGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBcInRyYW5zbGF0ZSAoXCIgKyAodC50cmFuc2xhdGVbMF0gKyBub2RlX3NpemUpICsgXCIgXCIgKyB0LnRyYW5zbGF0ZVsxXSArIFwiKXJvdGF0ZShcIiArIHQucm90YXRlICsgXCIpXCI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAvLyBUT0RPOiB0aGlzIGNsaWNrIGV2ZW50IGlzIHByb2JhYmx5IG5ldmVyIGZpcmVkIHNpbmNlIHRoZXJlIGlzIGFuIG9uY2xpY2sgZXZlbnQgaW4gdGhlIG5vZGUgZyBlbGVtZW50P1xuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwodGhpcywgbm9kZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2guZGJsY2xpY2suY2FsbCh0aGlzLCBub2RlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwodGhpcywgbm9kZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbCh0aGlzLCBub2RlKVxuICAgICAgICAgICAgfSlcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcbiAgICAgICAgLmdldHNldCAoJ3dpZHRoJywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSB3aWR0aCBjYWxsYmFja1wiIH0pXG4gICAgICAgIC5nZXRzZXQgKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7IHRocm93IFwiTmVlZCBhIGhlaWdodCBjYWxsYmFja1wiIH0pXG4gICAgICAgIC5nZXRzZXQgKCdkaXNwbGF5JywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSBkaXNwbGF5IGNhbGxiYWNrXCIgfSlcbiAgICAgICAgLmdldHNldCAoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgdHJhbnNmb3JtIGNhbGxiYWNrXCIgfSlcbiAgICAgICAgLy8uZ2V0c2V0ICgnb25fY2xpY2snKTtcblxuICAgIHJldHVybiBkMy5yZWJpbmQgKGxhYmVsLCBkaXNwYXRjaCwgXCJvblwiKTtcbn07XG5cbi8vIFRleHQgYmFzZWQgbGFiZWxzXG50cmVlLmxhYmVsLnRleHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhYmVsID0gdHJlZS5sYWJlbCgpO1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcbiAgICAgICAgLmdldHNldCAoJ2ZvbnRzaXplJywgMTApXG4gICAgICAgIC5nZXRzZXQgKCdmb250d2VpZ2h0JywgXCJub3JtYWxcIilcbiAgICAgICAgLmdldHNldCAoJ2NvbG9yJywgXCIjMDAwXCIpXG4gICAgICAgIC5nZXRzZXQgKCd0ZXh0JywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkLmRhdGEoKS5uYW1lO1xuICAgICAgICB9KVxuXG4gICAgbGFiZWwuZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG4gICAgICAgIHZhciBsID0gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChsYXlvdXRfdHlwZSA9PT0gXCJyYWRpYWxcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGQueCUzNjAgPCAxODApID8gXCJzdGFydFwiIDogXCJlbmRcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwic3RhcnRcIjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJldHVybiBsYWJlbC50ZXh0KCkobm9kZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3R5bGUoJ2ZvbnQtc2l6ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihsYWJlbC5mb250c2l6ZSgpKShub2RlKSArIFwicHhcIjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3R5bGUoJ2ZvbnQtd2VpZ2h0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKGxhYmVsLmZvbnR3ZWlnaHQoKSkobm9kZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgZDMuZnVuY3RvcihsYWJlbC5jb2xvcigpKShub2RlKSk7XG5cbiAgICAgICAgcmV0dXJuIGw7XG4gICAgfSk7XG5cbiAgICBsYWJlbC50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuICAgICAgICB2YXIgZCA9IG5vZGUuZGF0YSgpO1xuICAgICAgICB2YXIgdCA9IHtcbiAgICAgICAgICAgIHRyYW5zbGF0ZSA6IFs1LCA1XSxcbiAgICAgICAgICAgIHJvdGF0ZSA6IDBcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGxheW91dF90eXBlID09PSBcInJhZGlhbFwiKSB7XG4gICAgICAgICAgICB0LnRyYW5zbGF0ZVsxXSA9IHQudHJhbnNsYXRlWzFdIC0gKGQueCUzNjAgPCAxODAgPyAwIDogbGFiZWwuZm9udHNpemUoKSlcbiAgICAgICAgICAgIHQucm90YXRlID0gKGQueCUzNjAgPCAxODAgPyAwIDogMTgwKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH0pO1xuXG5cbiAgICAvLyBsYWJlbC50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgLy8gXHR2YXIgZCA9IG5vZGUuZGF0YSgpO1xuICAgIC8vIFx0cmV0dXJuIFwidHJhbnNsYXRlKDEwIDUpcm90YXRlKFwiICsgKGQueCUzNjAgPCAxODAgPyAwIDogMTgwKSArIFwiKVwiO1xuICAgIC8vIH0pO1xuXG4gICAgbGFiZWwud2lkdGggKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHZhciBzdmcgPSBkMy5zZWxlY3QoXCJib2R5XCIpXG4gICAgICAgICAgICAuYXBwZW5kKFwic3ZnXCIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCAwKVxuICAgICAgICAgICAgLnN0eWxlKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuXG4gICAgICAgIHZhciB0ZXh0ID0gc3ZnXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLnN0eWxlKCdmb250LXNpemUnLCBkMy5mdW5jdG9yKGxhYmVsLmZvbnRzaXplKCkpKG5vZGUpICsgXCJweFwiKVxuICAgICAgICAgICAgLnRleHQobGFiZWwudGV4dCgpKG5vZGUpKTtcblxuICAgICAgICB2YXIgd2lkdGggPSB0ZXh0Lm5vZGUoKS5nZXRCQm94KCkud2lkdGg7XG4gICAgICAgIHN2Zy5yZW1vdmUoKTtcblxuICAgICAgICByZXR1cm4gd2lkdGg7XG4gICAgfSk7XG5cbiAgICBsYWJlbC5oZWlnaHQgKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHJldHVybiBkMy5mdW5jdG9yKGxhYmVsLmZvbnRzaXplKCkpKG5vZGUpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxhYmVsO1xufTtcblxuLy8gSW1hZ2UgYmFzZWQgbGFiZWxzXG50cmVlLmxhYmVsLmltZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFiZWwgPSB0cmVlLmxhYmVsKCk7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxhYmVsKVxuICAgICAgICAuZ2V0c2V0ICgnc3JjJywgZnVuY3Rpb24gKCkge30pXG5cbiAgICBsYWJlbC5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcbiAgICAgICAgaWYgKGxhYmVsLnNyYygpKG5vZGUpKSB7XG4gICAgICAgICAgICB2YXIgbCA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJpbWFnZVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgbGFiZWwud2lkdGgoKSgpKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGxhYmVsLmhlaWdodCgpKCkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ4bGluazpocmVmXCIsIGxhYmVsLnNyYygpKG5vZGUpKTtcbiAgICAgICAgICAgIHJldHVybiBsO1xuICAgICAgICB9XG4gICAgICAgIC8vIGZhbGxiYWNrIHRleHQgaW4gY2FzZSB0aGUgaW1nIGlzIG5vdCBmb3VuZD9cbiAgICAgICAgcmV0dXJuIGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgIC50ZXh0KFwiXCIpO1xuICAgIH0pO1xuXG4gICAgbGFiZWwudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcbiAgICAgICAgdmFyIGQgPSBub2RlLmRhdGEoKTtcbiAgICAgICAgdmFyIHQgPSB7XG4gICAgICAgICAgICB0cmFuc2xhdGUgOiBbMTAsICgtbGFiZWwuaGVpZ2h0KCkoKSAvIDIpXSxcbiAgICAgICAgICAgIHJvdGF0ZSA6IDBcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAobGF5b3V0X3R5cGUgPT09ICdyYWRpYWwnKSB7XG4gICAgICAgICAgICB0LnRyYW5zbGF0ZVswXSA9IHQudHJhbnNsYXRlWzBdICsgKGQueCUzNjAgPCAxODAgPyAwIDogbGFiZWwud2lkdGgoKSgpKSxcbiAgICAgICAgICAgIHQudHJhbnNsYXRlWzFdID0gdC50cmFuc2xhdGVbMV0gKyAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC5oZWlnaHQoKSgpKSxcbiAgICAgICAgICAgIHQucm90YXRlID0gKGQueCUzNjAgPCAxODAgPyAwIDogMTgwKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG4vLyBMYWJlbHMgbWFkZSBvZiAyKyBzaW1wbGUgbGFiZWxzXG50cmVlLmxhYmVsLmNvbXBvc2l0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFiZWxzID0gW107XG5cbiAgICB2YXIgbGFiZWwgPSBmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUsIG5vZGVfc2l6ZSkge1xuICAgICAgICB2YXIgY3Vycl94b2Zmc2V0ID0gMDtcblxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZGlzcGxheSA9IGxhYmVsc1tpXTtcblxuICAgICAgICAgICAgKGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5LnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0c3VwZXIgPSBkaXNwbGF5Ll9zdXBlcl8udHJhbnNmb3JtKCkobm9kZSwgbGF5b3V0X3R5cGUpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0ZSA6IFtvZmZzZXQgKyB0c3VwZXIudHJhbnNsYXRlWzBdLCB0c3VwZXIudHJhbnNsYXRlWzFdXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0ZSA6IHRzdXBlci5yb3RhdGVcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHQ7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pKGN1cnJfeG9mZnNldCk7XG5cbiAgICAgICAgICAgIGN1cnJfeG9mZnNldCArPSAxMDtcbiAgICAgICAgICAgIGN1cnJfeG9mZnNldCArPSBkaXNwbGF5LndpZHRoKCkobm9kZSk7XG5cbiAgICAgICAgICAgIGRpc3BsYXkuY2FsbCh0aGlzLCBub2RlLCBsYXlvdXRfdHlwZSwgbm9kZV9zaXplKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxhYmVsKVxuXG4gICAgYXBpLm1ldGhvZCAoJ2FkZF9sYWJlbCcsIGZ1bmN0aW9uIChkaXNwbGF5LCBub2RlKSB7XG4gICAgICAgIGRpc3BsYXkuX3N1cGVyXyA9IHt9O1xuICAgICAgICBhcGlqcyAoZGlzcGxheS5fc3VwZXJfKVxuICAgICAgICAgICAgLmdldCAoJ3RyYW5zZm9ybScsIGRpc3BsYXkudHJhbnNmb3JtKCkpO1xuXG4gICAgICAgIGxhYmVscy5wdXNoKGRpc3BsYXkpO1xuICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnd2lkdGgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIHRvdF93aWR0aCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdG90X3dpZHRoICs9IHBhcnNlSW50KGxhYmVsc1tpXS53aWR0aCgpKG5vZGUpKTtcbiAgICAgICAgICAgICAgICB0b3Rfd2lkdGggKz0gcGFyc2VJbnQobGFiZWxzW2ldLl9zdXBlcl8udHJhbnNmb3JtKCkobm9kZSkudHJhbnNsYXRlWzBdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRvdF93aWR0aDtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2hlaWdodCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbWF4X2hlaWdodCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJfaGVpZ2h0ID0gbGFiZWxzW2ldLmhlaWdodCgpKG5vZGUpO1xuICAgICAgICAgICAgICAgIGlmICggY3Vycl9oZWlnaHQgPiBtYXhfaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIG1heF9oZWlnaHQgPSBjdXJyX2hlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWF4X2hlaWdodDtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxhYmVsO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5sYWJlbDtcbiIsIi8vIEJhc2VkIG9uIHRoZSBjb2RlIGJ5IEtlbi1pY2hpIFVlZGEgaW4gaHR0cDovL2JsLm9ja3Mub3JnL2t1ZWRhLzEwMzY3NzYjZDMucGh5bG9ncmFtLmpzXG5cbnZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIGRpYWdvbmFsID0gcmVxdWlyZShcIi4vZGlhZ29uYWwuanNcIik7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLmxheW91dCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBsID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcblx0LnNvcnQobnVsbClcblx0LnZhbHVlKGZ1bmN0aW9uIChkKSB7cmV0dXJuIGQubGVuZ3RofSApXG5cdC5zZXBhcmF0aW9uKGZ1bmN0aW9uICgpIHtyZXR1cm4gMX0pO1xuICAgIFxuICAgIHZhciBhcGkgPSBhcGlqcyAobClcblx0LmdldHNldCAoJ3NjYWxlJywgdHJ1ZSlcblx0LmdldHNldCAoJ21heF9sZWFmX2xhYmVsX3dpZHRoJywgMClcblx0Lm1ldGhvZCAoXCJjbHVzdGVyXCIsIGNsdXN0ZXIpXG5cdC5tZXRob2QoJ3lzY2FsZScsIGZ1bmN0aW9uICgpIHt0aHJvdyBcInlzY2FsZSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIn0pXG5cdC5tZXRob2QoJ2FkanVzdF9jbHVzdGVyX3NpemUnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJhZGp1c3RfY2x1c3Rlcl9zaXplIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwiIH0pXG5cdC5tZXRob2QoJ3dpZHRoJywgZnVuY3Rpb24gKCkge3Rocm93IFwid2lkdGggaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCJ9KVxuXHQubWV0aG9kKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJoZWlnaHQgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCJ9KTtcblxuICAgIGFwaS5tZXRob2QoJ3NjYWxlX2JyYW5jaF9sZW5ndGhzJywgZnVuY3Rpb24gKGN1cnIpIHtcblx0aWYgKGwuc2NhbGUoKSA9PT0gZmFsc2UpIHtcblx0ICAgIHJldHVyblxuXHR9XG5cblx0dmFyIG5vZGVzID0gY3Vyci5ub2Rlcztcblx0dmFyIHRyZWUgPSBjdXJyLnRyZWU7XG5cblx0dmFyIHJvb3RfZGlzdHMgPSBub2Rlcy5tYXAgKGZ1bmN0aW9uIChkKSB7XG5cdCAgICByZXR1cm4gZC5fcm9vdF9kaXN0O1xuXHR9KTtcblxuXHR2YXIgeXNjYWxlID0gbC55c2NhbGUocm9vdF9kaXN0cyk7XG5cdHRyZWUuYXBwbHkgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICBub2RlLnByb3BlcnR5KFwieVwiLCB5c2NhbGUobm9kZS5yb290X2Rpc3QoKSkpO1xuXHR9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsO1xufTtcblxudHJlZS5sYXlvdXQudmVydGljYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxheW91dCA9IHRyZWUubGF5b3V0KCk7XG4gICAgLy8gRWxlbWVudHMgbGlrZSAnbGFiZWxzJyBkZXBlbmQgb24gdGhlIGxheW91dCB0eXBlLiBUaGlzIGV4cG9zZXMgYSB3YXkgb2YgaWRlbnRpZnlpbmcgdGhlIGxheW91dCB0eXBlXG4gICAgbGF5b3V0LnR5cGUgPSBcInZlcnRpY2FsXCI7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxheW91dClcblx0LmdldHNldCAoJ3dpZHRoJywgMzYwKVxuXHQuZ2V0ICgndHJhbnNsYXRlX3ZpcycsIFsyMCwyMF0pXG5cdC5tZXRob2QgKCdkaWFnb25hbCcsIGRpYWdvbmFsLnZlcnRpY2FsKVxuXHQubWV0aG9kICgndHJhbnNmb3JtX25vZGUnLCBmdW5jdGlvbiAoZCkge1xuICAgIFx0ICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueSArIFwiLFwiICsgZC54ICsgXCIpXCI7XG5cdH0pO1xuXG4gICAgYXBpLm1ldGhvZCgnaGVpZ2h0JywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIFx0cmV0dXJuIChwYXJhbXMubl9sZWF2ZXMgKiBwYXJhbXMubGFiZWxfaGVpZ2h0KTtcbiAgICB9KTsgXG5cbiAgICBhcGkubWV0aG9kKCd5c2NhbGUnLCBmdW5jdGlvbiAoZGlzdHMpIHtcbiAgICBcdHJldHVybiBkMy5zY2FsZS5saW5lYXIoKVxuICAgIFx0ICAgIC5kb21haW4oWzAsIGQzLm1heChkaXN0cyldKVxuICAgIFx0ICAgIC5yYW5nZShbMCwgbGF5b3V0LndpZHRoKCkgLSAyMCAtIGxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aCgpXSk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kKCdhZGp1c3RfY2x1c3Rlcl9zaXplJywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIFx0dmFyIGggPSBsYXlvdXQuaGVpZ2h0KHBhcmFtcyk7XG4gICAgXHR2YXIgdyA9IGxheW91dC53aWR0aCgpIC0gbGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKCkgLSBsYXlvdXQudHJhbnNsYXRlX3ZpcygpWzBdIC0gcGFyYW1zLmxhYmVsX3BhZGRpbmc7XG4gICAgXHRsYXlvdXQuY2x1c3Rlci5zaXplIChbaCx3XSk7XG4gICAgXHRyZXR1cm4gbGF5b3V0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxheW91dDtcbn07XG5cbnRyZWUubGF5b3V0LnJhZGlhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGF5b3V0ID0gdHJlZS5sYXlvdXQoKTtcbiAgICAvLyBFbGVtZW50cyBsaWtlICdsYWJlbHMnIGRlcGVuZCBvbiB0aGUgbGF5b3V0IHR5cGUuIFRoaXMgZXhwb3NlcyBhIHdheSBvZiBpZGVudGlmeWluZyB0aGUgbGF5b3V0IHR5cGVcbiAgICBsYXlvdXQudHlwZSA9ICdyYWRpYWwnO1xuXG4gICAgdmFyIGRlZmF1bHRfd2lkdGggPSAzNjA7XG4gICAgdmFyIHIgPSBkZWZhdWx0X3dpZHRoIC8gMjtcblxuICAgIHZhciBjb25mID0ge1xuICAgIFx0d2lkdGggOiAzNjBcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYXlvdXQpXG5cdC5nZXRzZXQgKGNvbmYpXG5cdC5nZXRzZXQgKCd0cmFuc2xhdGVfdmlzJywgW3IsIHJdKSAvLyBUT0RPOiAxLjMgc2hvdWxkIGJlIHJlcGxhY2VkIGJ5IGEgc2Vuc2libGUgdmFsdWVcblx0Lm1ldGhvZCAoJ3RyYW5zZm9ybV9ub2RlJywgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHJldHVybiBcInJvdGF0ZShcIiArIChkLnggLSA5MCkgKyBcIil0cmFuc2xhdGUoXCIgKyBkLnkgKyBcIilcIjtcblx0fSlcblx0Lm1ldGhvZCAoJ2RpYWdvbmFsJywgZGlhZ29uYWwucmFkaWFsKVxuXHQubWV0aG9kICgnaGVpZ2h0JywgZnVuY3Rpb24gKCkgeyByZXR1cm4gY29uZi53aWR0aCB9KTtcblxuICAgIC8vIENoYW5nZXMgaW4gd2lkdGggYWZmZWN0IGNoYW5nZXMgaW4gclxuICAgIGxheW91dC53aWR0aC50cmFuc2Zvcm0gKGZ1bmN0aW9uICh2YWwpIHtcbiAgICBcdHIgPSB2YWwgLyAyO1xuICAgIFx0bGF5b3V0LmNsdXN0ZXIuc2l6ZShbMzYwLCByXSlcbiAgICBcdGxheW91dC50cmFuc2xhdGVfdmlzKFtyLCByXSk7XG4gICAgXHRyZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoXCJ5c2NhbGVcIiwgIGZ1bmN0aW9uIChkaXN0cykge1xuXHRyZXR1cm4gZDMuc2NhbGUubGluZWFyKClcblx0ICAgIC5kb21haW4oWzAsZDMubWF4KGRpc3RzKV0pXG5cdCAgICAucmFuZ2UoWzAsIHJdKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKFwiYWRqdXN0X2NsdXN0ZXJfc2l6ZVwiLCBmdW5jdGlvbiAocGFyYW1zKSB7XG5cdHIgPSAobGF5b3V0LndpZHRoKCkvMikgLSBsYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgoKSAtIDIwO1xuXHRsYXlvdXQuY2x1c3Rlci5zaXplKFszNjAsIHJdKTtcblx0cmV0dXJuIGxheW91dDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYXlvdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmxheW91dDtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5ub2RlX2Rpc3BsYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgbiA9IGZ1bmN0aW9uIChub2RlKSB7XG5cdG4uZGlzcGxheSgpLmNhbGwodGhpcywgbm9kZSlcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChuKVxuXHQuZ2V0c2V0KFwic2l6ZVwiLCA0LjUpXG5cdC5nZXRzZXQoXCJmaWxsXCIsIFwiYmxhY2tcIilcblx0LmdldHNldChcInN0cm9rZVwiLCBcImJsYWNrXCIpXG5cdC5nZXRzZXQoXCJzdHJva2Vfd2lkdGhcIiwgXCIxcHhcIilcblx0LmdldHNldChcImRpc3BsYXlcIiwgZnVuY3Rpb24gKCkge3Rocm93IFwiZGlzcGxheSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIn0pO1xuXG4gICAgcmV0dXJuIG47XG59O1xuXG50cmVlLm5vZGVfZGlzcGxheS5jaXJjbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHRkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcblx0ICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkuc3F1YXJlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcblxuICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIHMgPSBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0ZDMuc2VsZWN0KHRoaXMpXG5cdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIC1zXG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIC1zO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gcyoyO1xuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIHMqMjtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkudHJpYW5nbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHR2YXIgcyA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuXHRkMy5zZWxlY3QodGhpcylcblx0ICAgIC5hcHBlbmQoXCJwb2x5Z29uXCIpXG5cdCAgICAuYXR0cihcInBvaW50c1wiLCAoLXMpICsgXCIsMCBcIiArIHMgKyBcIixcIiArICgtcykgKyBcIiBcIiArIHMgKyBcIixcIiArIHMpXG5cdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG5cdCAgICB9KVxuXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuXHQgICAgfSlcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxuLy8gdHJlZS5ub2RlX2Rpc3BsYXkuY29uZCA9IGZ1bmN0aW9uICgpIHtcbi8vICAgICB2YXIgbiA9IHRyZWUubm9kZV9kaXNwbGF5KCk7XG5cbi8vICAgICAvLyBjb25kaXRpb25zIGFyZSBvYmplY3RzIHdpdGhcbi8vICAgICAvLyBuYW1lIDogYSBuYW1lIGZvciB0aGlzIGRpc3BsYXlcbi8vICAgICAvLyBjYWxsYmFjazogdGhlIGNvbmRpdGlvbiB0byBhcHBseSAocmVjZWl2ZXMgYSB0bnQubm9kZSlcbi8vICAgICAvLyBkaXNwbGF5OiBhIG5vZGVfZGlzcGxheVxuLy8gICAgIHZhciBjb25kcyA9IFtdO1xuXG4vLyAgICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuLy8gXHR2YXIgcyA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuLy8gXHRmb3IgKHZhciBpPTA7IGk8Y29uZHMubGVuZ3RoOyBpKyspIHtcbi8vIFx0ICAgIHZhciBjb25kID0gY29uZHNbaV07XG4vLyBcdCAgICAvLyBGb3IgZWFjaCBub2RlLCB0aGUgZmlyc3QgY29uZGl0aW9uIG1ldCBpcyB1c2VkXG4vLyBcdCAgICBpZiAoY29uZC5jYWxsYmFjay5jYWxsKHRoaXMsIG5vZGUpID09PSB0cnVlKSB7XG4vLyBcdFx0Y29uZC5kaXNwbGF5LmNhbGwodGhpcywgbm9kZSlcbi8vIFx0XHRicmVhaztcbi8vIFx0ICAgIH1cbi8vIFx0fVxuLy8gICAgIH0pXG5cbi8vICAgICB2YXIgYXBpID0gYXBpanMobik7XG5cbi8vICAgICBhcGkubWV0aG9kKFwiYWRkXCIsIGZ1bmN0aW9uIChuYW1lLCBjYmFrLCBub2RlX2Rpc3BsYXkpIHtcbi8vIFx0Y29uZHMucHVzaCh7IG5hbWUgOiBuYW1lLFxuLy8gXHRcdCAgICAgY2FsbGJhY2sgOiBjYmFrLFxuLy8gXHRcdCAgICAgZGlzcGxheSA6IG5vZGVfZGlzcGxheVxuLy8gXHRcdCAgIH0pO1xuLy8gXHRyZXR1cm4gbjtcbi8vICAgICB9KTtcblxuLy8gICAgIGFwaS5tZXRob2QoXCJyZXNldFwiLCBmdW5jdGlvbiAoKSB7XG4vLyBcdGNvbmRzID0gW107XG4vLyBcdHJldHVybiBuO1xuLy8gICAgIH0pO1xuXG4vLyAgICAgYXBpLm1ldGhvZChcInVwZGF0ZVwiLCBmdW5jdGlvbiAobmFtZSwgY2JhaywgbmV3X2Rpc3BsYXkpIHtcbi8vIFx0Zm9yICh2YXIgaT0wOyBpPGNvbmRzLmxlbmd0aDsgaSsrKSB7XG4vLyBcdCAgICBpZiAoY29uZHNbaV0ubmFtZSA9PT0gbmFtZSkge1xuLy8gXHRcdGNvbmRzW2ldLmNhbGxiYWNrID0gY2Jhaztcbi8vIFx0XHRjb25kc1tpXS5kaXNwbGF5ID0gbmV3X2Rpc3BsYXk7XG4vLyBcdCAgICB9XG4vLyBcdH1cbi8vIFx0cmV0dXJuIG47XG4vLyAgICAgfSk7XG5cbi8vICAgICByZXR1cm4gbjtcblxuLy8gfTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5ub2RlX2Rpc3BsYXk7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciB0bnRfdHJlZV9ub2RlID0gcmVxdWlyZShcInRudC50cmVlLm5vZGVcIik7XG5cbnZhciB0cmVlID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2ggKFwiY2xpY2tcIiwgXCJkYmxjbGlja1wiLCBcIm1vdXNlb3ZlclwiLCBcIm1vdXNlb3V0XCIpO1xuXG4gICAgdmFyIGNvbmYgPSB7XG4gICAgICAgIGR1cmF0aW9uICAgICAgICAgOiA1MDAsICAgICAgLy8gRHVyYXRpb24gb2YgdGhlIHRyYW5zaXRpb25zXG4gICAgICAgIG5vZGVfZGlzcGxheSAgICAgOiB0cmVlLm5vZGVfZGlzcGxheS5jaXJjbGUoKSxcbiAgICAgICAgbGFiZWwgICAgICAgICAgICA6IHRyZWUubGFiZWwudGV4dCgpLFxuICAgICAgICBsYXlvdXQgICAgICAgICAgIDogdHJlZS5sYXlvdXQudmVydGljYWwoKSxcbiAgICAgICAgLy8gb25fY2xpY2sgICAgICAgICA6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICAvLyBvbl9kYmxfY2xpY2sgICAgIDogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIC8vIG9uX21vdXNlb3ZlciAgICAgOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgYnJhbmNoX2NvbG9yICAgICA6ICdibGFjaycsXG4gICAgICAgIGlkICAgICAgICAgICAgICAgOiBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQuX2lkO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIGZvY3VzZWQgbm9kZVxuICAgIC8vIFRPRE86IFdvdWxkIGl0IGJlIGJldHRlciB0byBoYXZlIG11bHRpcGxlIGZvY3VzZWQgbm9kZXM/IChpZSB1c2UgYW4gYXJyYXkpXG4gICAgdmFyIGZvY3VzZWRfbm9kZTtcblxuICAgIC8vIEV4dHJhIGRlbGF5IGluIHRoZSB0cmFuc2l0aW9ucyAoVE9ETzogTmVlZGVkPylcbiAgICB2YXIgZGVsYXkgPSAwO1xuXG4gICAgLy8gRWFzZSBvZiB0aGUgdHJhbnNpdGlvbnNcbiAgICB2YXIgZWFzZSA9IFwiY3ViaWMtaW4tb3V0XCI7XG5cbiAgICAvLyBCeSBub2RlIGRhdGFcbiAgICB2YXIgc3BfY291bnRzID0ge307XG5cbiAgICB2YXIgc2NhbGUgPSBmYWxzZTtcblxuICAgIC8vIFRoZSBpZCBvZiB0aGUgdHJlZSBjb250YWluZXJcbiAgICB2YXIgZGl2X2lkO1xuXG4gICAgLy8gVGhlIHRyZWUgdmlzdWFsaXphdGlvbiAoc3ZnKVxuICAgIHZhciBzdmc7XG4gICAgdmFyIHZpcztcbiAgICB2YXIgbGlua3NfZztcbiAgICB2YXIgbm9kZXNfZztcblxuICAgIC8vIFRPRE86IEZvciBub3csIGNvdW50cyBhcmUgZ2l2ZW4gb25seSBmb3IgbGVhdmVzXG4gICAgLy8gYnV0IGl0IG1heSBiZSBnb29kIHRvIGFsbG93IGNvdW50cyBmb3IgaW50ZXJuYWwgbm9kZXNcbiAgICB2YXIgY291bnRzID0ge307XG5cbiAgICAvLyBUaGUgZnVsbCB0cmVlXG4gICAgdmFyIGJhc2UgPSB7XG4gICAgICAgIHRyZWUgOiB1bmRlZmluZWQsXG4gICAgICAgIGRhdGEgOiB1bmRlZmluZWQsXG4gICAgICAgIG5vZGVzIDogdW5kZWZpbmVkLFxuICAgICAgICBsaW5rcyA6IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICAvLyBUaGUgY3VyciB0cmVlLiBOZWVkZWQgdG8gcmUtY29tcHV0ZSB0aGUgbGlua3MgLyBub2RlcyBwb3NpdGlvbnMgb2Ygc3VidHJlZXNcbiAgICB2YXIgY3VyciA9IHtcbiAgICAgICAgdHJlZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgZGF0YSA6IHVuZGVmaW5lZCxcbiAgICAgICAgbm9kZXMgOiB1bmRlZmluZWQsXG4gICAgICAgIGxpbmtzIDogdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIC8vIFRoZSBjYmFrIHJldHVybmVkXG4gICAgdmFyIHQgPSBmdW5jdGlvbiAoZGl2KSB7XG5cdGRpdl9pZCA9IGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKTtcblxuICAgIHZhciB0cmVlX2RpdiA9IGQzLnNlbGVjdChkaXYpXG4gICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgLnN0eWxlKFwid2lkdGhcIiwgKGNvbmYubGF5b3V0LndpZHRoKCkgKyAgXCJweFwiKSlcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ncm91cERpdlwiKTtcblxuXHR2YXIgY2x1c3RlciA9IGNvbmYubGF5b3V0LmNsdXN0ZXI7XG5cblx0dmFyIG5fbGVhdmVzID0gY3Vyci50cmVlLmdldF9hbGxfbGVhdmVzKCkubGVuZ3RoO1xuXG5cdHZhciBtYXhfbGVhZl9sYWJlbF9sZW5ndGggPSBmdW5jdGlvbiAodHJlZSkge1xuXHQgICAgdmFyIG1heCA9IDA7XG5cdCAgICB2YXIgbGVhdmVzID0gdHJlZS5nZXRfYWxsX2xlYXZlcygpO1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGxhYmVsX3dpZHRoID0gY29uZi5sYWJlbC53aWR0aCgpKGxlYXZlc1tpXSkgKyBkMy5mdW5jdG9yIChjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKGxlYXZlc1tpXSk7XG4gICAgICAgICAgICBpZiAobGFiZWxfd2lkdGggPiBtYXgpIHtcbiAgICAgICAgICAgICAgICBtYXggPSBsYWJlbF93aWR0aDtcbiAgICAgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBtYXg7XG5cdH07XG5cbiAgICB2YXIgbWF4X2xlYWZfbm9kZV9oZWlnaHQgPSBmdW5jdGlvbiAodHJlZSkge1xuICAgICAgICB2YXIgbWF4ID0gMDtcbiAgICAgICAgdmFyIGxlYXZlcyA9IHRyZWUuZ2V0X2FsbF9sZWF2ZXMoKTtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG5vZGVfaGVpZ2h0ID0gZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKGxlYXZlc1tpXSkgKiAyO1xuICAgICAgICAgICAgdmFyIGxhYmVsX2hlaWdodCA9IGQzLmZ1bmN0b3IoY29uZi5sYWJlbC5oZWlnaHQoKSkobGVhdmVzW2ldKTtcblxuICAgICAgICAgICAgbWF4ID0gZDMubWF4KFttYXgsIG5vZGVfaGVpZ2h0LCBsYWJlbF9oZWlnaHRdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF4O1xuICAgIH07XG5cblx0dmFyIG1heF9sYWJlbF9sZW5ndGggPSBtYXhfbGVhZl9sYWJlbF9sZW5ndGgoY3Vyci50cmVlKTtcblx0Y29uZi5sYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgobWF4X2xhYmVsX2xlbmd0aCk7XG5cblx0dmFyIG1heF9ub2RlX2hlaWdodCA9IG1heF9sZWFmX25vZGVfaGVpZ2h0KGN1cnIudHJlZSk7XG5cblx0Ly8gQ2x1c3RlciBzaXplIGlzIHRoZSByZXN1bHQgb2YuLi5cblx0Ly8gdG90YWwgd2lkdGggb2YgdGhlIHZpcyAtIHRyYW5zZm9ybSBmb3IgdGhlIHRyZWUgLSBtYXhfbGVhZl9sYWJlbF93aWR0aCAtIGhvcml6b250YWwgdHJhbnNmb3JtIG9mIHRoZSBsYWJlbFxuXHQvLyBUT0RPOiBTdWJzdGl0dXRlIDE1IGJ5IHRoZSBob3Jpem9udGFsIHRyYW5zZm9ybSBvZiB0aGUgbm9kZXNcblx0dmFyIGNsdXN0ZXJfc2l6ZV9wYXJhbXMgPSB7XG5cdCAgICBuX2xlYXZlcyA6IG5fbGVhdmVzLFxuXHQgICAgbGFiZWxfaGVpZ2h0IDogbWF4X25vZGVfaGVpZ2h0LFxuXHQgICAgbGFiZWxfcGFkZGluZyA6IDE1XG5cdH07XG5cblx0Y29uZi5sYXlvdXQuYWRqdXN0X2NsdXN0ZXJfc2l6ZShjbHVzdGVyX3NpemVfcGFyYW1zKTtcblxuXHR2YXIgZGlhZ29uYWwgPSBjb25mLmxheW91dC5kaWFnb25hbCgpO1xuXHR2YXIgdHJhbnNmb3JtID0gY29uZi5sYXlvdXQudHJhbnNmb3JtX25vZGU7XG5cblx0c3ZnID0gdHJlZV9kaXZcblx0ICAgIC5hcHBlbmQoXCJzdmdcIilcblx0ICAgIC5hdHRyKFwid2lkdGhcIiwgY29uZi5sYXlvdXQud2lkdGgoKSlcblx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGNvbmYubGF5b3V0LmhlaWdodChjbHVzdGVyX3NpemVfcGFyYW1zKSArIDMwKVxuXHQgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKTtcblxuXHR2aXMgPSBzdmdcblx0ICAgIC5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImlkXCIsIFwidG50X3N0X1wiICsgZGl2X2lkKVxuXHQgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIixcblx0XHQgIFwidHJhbnNsYXRlKFwiICtcblx0XHQgIGNvbmYubGF5b3V0LnRyYW5zbGF0ZV92aXMoKVswXSArXG5cdFx0ICBcIixcIiArXG5cdFx0ICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMV0gK1xuXHRcdCAgXCIpXCIpO1xuXG5cdGN1cnIubm9kZXMgPSBjbHVzdGVyLm5vZGVzKGN1cnIuZGF0YSk7XG5cdGNvbmYubGF5b3V0LnNjYWxlX2JyYW5jaF9sZW5ndGhzKGN1cnIpO1xuXHRjdXJyLmxpbmtzID0gY2x1c3Rlci5saW5rcyhjdXJyLm5vZGVzKTtcblxuXHQvLyBMSU5LU1xuXHQvLyBBbGwgdGhlIGxpbmtzIGFyZSBncm91cGVkIGluIGEgZyBlbGVtZW50XG5cdGxpbmtzX2cgPSB2aXNcblx0ICAgIC5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua3NcIik7XG5cdG5vZGVzX2cgPSB2aXNcblx0ICAgIC5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZXNcIik7XG5cblx0Ly92YXIgbGluayA9IHZpc1xuXHR2YXIgbGluayA9IGxpbmtzX2dcblx0ICAgIC5zZWxlY3RBbGwoXCJwYXRoLnRudF90cmVlX2xpbmtcIilcblx0ICAgIC5kYXRhKGN1cnIubGlua3MsIGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgcmV0dXJuIGNvbmYuaWQoZC50YXJnZXQpO1xuICAgICAgICB9KTtcblxuXHRsaW5rXG5cdCAgICAuZW50ZXIoKVxuXHQgICAgLmFwcGVuZChcInBhdGhcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJlZV9saW5rXCIpXG5cdCAgICAuYXR0cihcImlkXCIsIGZ1bmN0aW9uKGQpIHtcblx0ICAgIFx0cmV0dXJuIFwidG50X3RyZWVfbGlua19cIiArIGRpdl9pZCArIFwiX1wiICsgY29uZi5pZChkLnRhcmdldCk7XG5cdCAgICB9KVxuXHQgICAgLnN0eWxlKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZDMuZnVuY3Rvcihjb25mLmJyYW5jaF9jb2xvcikodG50X3RyZWVfbm9kZShkLnNvdXJjZSksIHRudF90cmVlX25vZGUoZC50YXJnZXQpKTtcblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG5cdC8vIE5PREVTXG5cdC8vdmFyIG5vZGUgPSB2aXNcblx0dmFyIG5vZGUgPSBub2Rlc19nXG5cdCAgICAuc2VsZWN0QWxsKFwiZy50bnRfdHJlZV9ub2RlXCIpXG5cdCAgICAuZGF0YShjdXJyLm5vZGVzLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gY29uZi5pZChkKVxuICAgICAgICB9KTtcblxuXHR2YXIgbmV3X25vZGUgPSBub2RlXG5cdCAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG5cdCAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKG4pIHtcblx0XHRpZiAobi5jaGlsZHJlbikge1xuXHRcdCAgICBpZiAobi5kZXB0aCA9PSAwKSB7XG5cdFx0XHRyZXR1cm4gXCJyb290IHRudF90cmVlX25vZGVcIlxuXHRcdCAgICB9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwiaW5uZXIgdG50X3RyZWVfbm9kZVwiXG5cdFx0ICAgIH1cblx0XHR9IGVsc2Uge1xuXHRcdCAgICByZXR1cm4gXCJsZWFmIHRudF90cmVlX25vZGVcIlxuXHRcdH1cblx0ICAgIH0pXG5cdCAgICAuYXR0cihcImlkXCIsIGZ1bmN0aW9uKGQpIHtcblx0XHRyZXR1cm4gXCJ0bnRfdHJlZV9ub2RlX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLl9pZFxuXHQgICAgfSlcblx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cblx0Ly8gZGlzcGxheSBub2RlIHNoYXBlXG5cdG5ld19ub2RlXG5cdCAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcblx0XHRjb25mLm5vZGVfZGlzcGxheS5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCkpXG5cdCAgICB9KTtcblxuXHQvLyBkaXNwbGF5IG5vZGUgbGFiZWxcblx0bmV3X25vZGVcblx0ICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuXHQgICAgXHRjb25mLmxhYmVsLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSwgY29uZi5sYXlvdXQudHlwZSwgZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKHRudF90cmVlX25vZGUoZCkpKTtcblx0ICAgIH0pO1xuXG4gICAgbmV3X25vZGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6Y2xpY2tcIiwgbXlfbm9kZSk7XG4gICAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgfSk7XG4gICAgbmV3X25vZGUub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6ZGJsY2xpY2tcIiwgbXlfbm9kZSk7XG4gICAgICAgIGRpc3BhdGNoLmRibGNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgfSk7XG4gICAgbmV3X25vZGUub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICB9KTtcbiAgICBuZXdfbm9kZS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTptb3VzZW91dFwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICB9KTtcblxuXHQvLyBuZXdfbm9kZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdC8vICAgICBjb25mLm9uX2NsaWNrLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgLy9cblx0Ly8gICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6Y2xpY2tcIiwgdG50X3RyZWVfbm9kZShub2RlKSk7XG5cdC8vIH0pO1xuICAgIC8vXG5cdC8vIG5ld19ub2RlLm9uKFwibW91c2VlbnRlclwiLCBmdW5jdGlvbiAobm9kZSkge1xuXHQvLyAgICAgY29uZi5vbl9tb3VzZW92ZXIuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAvL1xuXHQvLyAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpob3ZlclwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0Ly8gfSk7XG4gICAgLy9cblx0Ly8gbmV3X25vZGUub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuXHQvLyAgICAgY29uZi5vbl9kYmxfY2xpY2suY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAvL1xuXHQvLyAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpkYmxjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0Ly8gfSk7XG5cblxuXHQvLyBVcGRhdGUgcGxvdHMgYW4gdXBkYXRlZCB0cmVlXG5cdGFwaS5tZXRob2QgKCd1cGRhdGUnLCBmdW5jdGlvbigpIHtcblx0ICAgIHRyZWVfZGl2XG5cdFx0LnN0eWxlKFwid2lkdGhcIiwgKGNvbmYubGF5b3V0LndpZHRoKCkgKyBcInB4XCIpKTtcblx0ICAgIHN2Zy5hdHRyKFwid2lkdGhcIiwgY29uZi5sYXlvdXQud2lkdGgoKSk7XG5cblx0ICAgIHZhciBjbHVzdGVyID0gY29uZi5sYXlvdXQuY2x1c3Rlcjtcblx0ICAgIHZhciBkaWFnb25hbCA9IGNvbmYubGF5b3V0LmRpYWdvbmFsKCk7XG5cdCAgICB2YXIgdHJhbnNmb3JtID0gY29uZi5sYXlvdXQudHJhbnNmb3JtX25vZGU7XG5cblx0ICAgIHZhciBtYXhfbGFiZWxfbGVuZ3RoID0gbWF4X2xlYWZfbGFiZWxfbGVuZ3RoKGN1cnIudHJlZSk7XG5cdCAgICBjb25mLmxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aChtYXhfbGFiZWxfbGVuZ3RoKTtcblxuXHQgICAgdmFyIG1heF9ub2RlX2hlaWdodCA9IG1heF9sZWFmX25vZGVfaGVpZ2h0KGN1cnIudHJlZSk7XG5cblx0ICAgIC8vIENsdXN0ZXIgc2l6ZSBpcyB0aGUgcmVzdWx0IG9mLi4uXG5cdCAgICAvLyB0b3RhbCB3aWR0aCBvZiB0aGUgdmlzIC0gdHJhbnNmb3JtIGZvciB0aGUgdHJlZSAtIG1heF9sZWFmX2xhYmVsX3dpZHRoIC0gaG9yaXpvbnRhbCB0cmFuc2Zvcm0gb2YgdGhlIGxhYmVsXG5cdC8vIFRPRE86IFN1YnN0aXR1dGUgMTUgYnkgdGhlIHRyYW5zZm9ybSBvZiB0aGUgbm9kZXMgKHByb2JhYmx5IGJ5IHNlbGVjdGluZyBvbmUgbm9kZSBhc3N1bWluZyBhbGwgdGhlIG5vZGVzIGhhdmUgdGhlIHNhbWUgdHJhbnNmb3JtXG5cdCAgICB2YXIgbl9sZWF2ZXMgPSBjdXJyLnRyZWUuZ2V0X2FsbF9sZWF2ZXMoKS5sZW5ndGg7XG5cdCAgICB2YXIgY2x1c3Rlcl9zaXplX3BhcmFtcyA9IHtcblx0XHRuX2xlYXZlcyA6IG5fbGVhdmVzLFxuXHRcdGxhYmVsX2hlaWdodCA6IG1heF9ub2RlX2hlaWdodCxcblx0XHRsYWJlbF9wYWRkaW5nIDogMTVcblx0ICAgIH07XG5cdCAgICBjb25mLmxheW91dC5hZGp1c3RfY2x1c3Rlcl9zaXplKGNsdXN0ZXJfc2l6ZV9wYXJhbXMpO1xuXG5cdCAgICBzdmdcblx0XHQudHJhbnNpdGlvbigpXG5cdFx0LmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG5cdFx0LmVhc2UoZWFzZSlcblx0XHQuYXR0cihcImhlaWdodFwiLCBjb25mLmxheW91dC5oZWlnaHQoY2x1c3Rlcl9zaXplX3BhcmFtcykgKyAzMCk7IC8vIGhlaWdodCBpcyBpbiB0aGUgbGF5b3V0XG5cblx0ICAgIHZpc1xuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLFxuXHRcdCAgICAgIFwidHJhbnNsYXRlKFwiICtcblx0XHQgICAgICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMF0gK1xuXHRcdCAgICAgIFwiLFwiICtcblx0XHQgICAgICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMV0gK1xuXHRcdCAgICAgIFwiKVwiKTtcblxuXHQgICAgY3Vyci5ub2RlcyA9IGNsdXN0ZXIubm9kZXMoY3Vyci5kYXRhKTtcblx0ICAgIGNvbmYubGF5b3V0LnNjYWxlX2JyYW5jaF9sZW5ndGhzKGN1cnIpO1xuXHQgICAgY3Vyci5saW5rcyA9IGNsdXN0ZXIubGlua3MoY3Vyci5ub2Rlcyk7XG5cblx0ICAgIC8vIExJTktTXG5cdCAgICB2YXIgbGluayA9IGxpbmtzX2dcblx0XHQuc2VsZWN0QWxsKFwicGF0aC50bnRfdHJlZV9saW5rXCIpXG5cdFx0LmRhdGEoY3Vyci5saW5rcywgZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICByZXR1cm4gY29uZi5pZChkLnRhcmdldClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIE5PREVTXG5cdCAgICB2YXIgbm9kZSA9IG5vZGVzX2dcblx0XHQuc2VsZWN0QWxsKFwiZy50bnRfdHJlZV9ub2RlXCIpXG5cdFx0LmRhdGEoY3Vyci5ub2RlcywgZnVuY3Rpb24oZCkge3JldHVybiBjb25mLmlkKGQpfSk7XG5cblx0ICAgIHZhciBleGl0X2xpbmsgPSBsaW5rXG5cdFx0LmV4aXQoKVxuXHRcdC5yZW1vdmUoKTtcblxuXHQgICAgbGlua1xuXHRcdC5lbnRlcigpXG5cdFx0LmFwcGVuZChcInBhdGhcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfbGlua1wiKVxuXHRcdC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHQgICAgcmV0dXJuIFwidG50X3RyZWVfbGlua19cIiArIGRpdl9pZCArIFwiX1wiICsgY29uZi5pZChkLnRhcmdldCk7XG5cdFx0fSlcblx0XHQuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdCAgICByZXR1cm4gZDMuZnVuY3Rvcihjb25mLmJyYW5jaF9jb2xvcikodG50X3RyZWVfbm9kZShkLnNvdXJjZSksIHRudF90cmVlX25vZGUoZC50YXJnZXQpKTtcblx0XHR9KVxuXHRcdC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XG5cblx0ICAgIGxpbmtcblx0ICAgIFx0LnRyYW5zaXRpb24oKVxuXHRcdC5lYXNlKGVhc2UpXG5cdCAgICBcdC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuXHQgICAgXHQuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG5cblx0ICAgIC8vIE5vZGVzXG5cdCAgICB2YXIgbmV3X25vZGUgPSBub2RlXG5cdFx0LmVudGVyKClcblx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24obikge1xuXHRcdCAgICBpZiAobi5jaGlsZHJlbikge1xuXHRcdFx0aWYgKG4uZGVwdGggPT0gMCkge1xuXHRcdFx0ICAgIHJldHVybiBcInJvb3QgdG50X3RyZWVfbm9kZVwiXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0ICAgIHJldHVybiBcImlubmVyIHRudF90cmVlX25vZGVcIlxuXHRcdFx0fVxuXHRcdCAgICB9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwibGVhZiB0bnRfdHJlZV9ub2RlXCJcblx0XHQgICAgfVxuXHRcdH0pXG5cdFx0LmF0dHIoXCJpZFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdCAgICByZXR1cm4gXCJ0bnRfdHJlZV9ub2RlX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLl9pZDtcblx0XHR9KVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cblx0ICAgIC8vIEV4aXRpbmcgbm9kZXMgYXJlIGp1c3QgcmVtb3ZlZFxuXHQgICAgbm9kZVxuXHRcdC5leGl0KClcblx0XHQucmVtb3ZlKCk7XG5cbiAgICAgICAgbmV3X25vZGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCBteV9ub2RlKTtcbiAgICAgICAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmRibGNsaWNrXCIsIG15X25vZGUpO1xuICAgICAgICAgICAgZGlzcGF0Y2guZGJsY2xpY2suY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld19ub2RlLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdfbm9kZS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOm1vdXNlb3V0XCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgfSk7XG5cblx0ICAgIC8vIG5ld19ub2RlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHQvLyBjb25mLm9uX2NsaWNrLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgICAgIC8vXG5cdFx0Ly8gdHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcblx0ICAgIC8vIH0pO1xuICAgICAgICAvL1xuXHQgICAgLy8gbmV3X25vZGUub24oXCJtb3VzZWVudGVyXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0Ly8gY29uZi5vbl9tb3VzZW92ZXIuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgLy9cblx0XHQvLyB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHQgICAgLy8gfSk7XG4gICAgICAgIC8vXG5cdCAgICAvLyBuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0Ly8gY29uZi5vbl9kYmxfY2xpY2suY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgLy9cblx0XHQvLyB0cmVlLnRyaWdnZXIoXCJub2RlOmRibGNsaWNrXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuXHQgICAgLy8gfSk7XG5cblxuXHQgICAgLy8gV2UgbmVlZCB0byByZS1jcmVhdGUgYWxsIHRoZSBub2RlcyBhZ2FpbiBpbiBjYXNlIHRoZXkgaGF2ZSBjaGFuZ2VkIGxpdmVseSAob3IgdGhlIGxheW91dClcblx0ICAgIG5vZGUuc2VsZWN0QWxsKFwiKlwiKS5yZW1vdmUoKTtcblx0ICAgIG5vZGVcblx0XHQgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcblx0XHRcdGNvbmYubm9kZV9kaXNwbGF5LmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSlcblx0XHQgICAgfSk7XG5cblx0ICAgIC8vIFdlIG5lZWQgdG8gcmUtY3JlYXRlIGFsbCB0aGUgbGFiZWxzIGFnYWluIGluIGNhc2UgdGhleSBoYXZlIGNoYW5nZWQgbGl2ZWx5IChvciB0aGUgbGF5b3V0KVxuXHQgICAgbm9kZVxuXHRcdCAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcblx0XHRcdGNvbmYubGFiZWwuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKGQpLCBjb25mLmxheW91dC50eXBlLCBkMy5mdW5jdG9yKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkodG50X3RyZWVfbm9kZShkKSkpO1xuXHRcdCAgICB9KTtcblxuXHQgICAgbm9kZVxuXHRcdC50cmFuc2l0aW9uKClcblx0XHQuZWFzZShlYXNlKVxuXHRcdC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cblx0fSk7XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIHZhciBhcGkgPSBhcGlqcyAodClcblx0LmdldHNldCAoY29uZilcblxuICAgIC8vIFRPRE86IFJld3JpdGUgZGF0YSB1c2luZyBnZXRzZXQgLyBmaW5hbGl6ZXJzICYgdHJhbnNmb3Jtc1xuICAgIGFwaS5tZXRob2QgKCdkYXRhJywgZnVuY3Rpb24gKGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gYmFzZS5kYXRhO1xuXHR9XG5cblx0Ly8gVGhlIG9yaWdpbmFsIGRhdGEgaXMgc3RvcmVkIGFzIHRoZSBiYXNlIGFuZCBjdXJyIGRhdGFcblx0YmFzZS5kYXRhID0gZDtcblx0Y3Vyci5kYXRhID0gZDtcblxuXHQvLyBTZXQgdXAgYSBuZXcgdHJlZSBiYXNlZCBvbiB0aGUgZGF0YVxuXHR2YXIgbmV3dHJlZSA9IHRudF90cmVlX25vZGUoYmFzZS5kYXRhKTtcblxuXHR0LnJvb3QobmV3dHJlZSk7XG5cblx0dHJlZS50cmlnZ2VyKFwiZGF0YTpoYXNDaGFuZ2VkXCIsIGJhc2UuZGF0YSk7XG5cblx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBSZXdyaXRlIHRyZWUgdXNpbmcgZ2V0c2V0IC8gZmluYWxpemVycyAmIHRyYW5zZm9ybXNcbiAgICBhcGkubWV0aG9kICgncm9vdCcsIGZ1bmN0aW9uIChteVRyZWUpIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiBjdXJyLnRyZWU7XG4gICAgXHR9XG5cblx0Ly8gVGhlIG9yaWdpbmFsIHRyZWUgaXMgc3RvcmVkIGFzIHRoZSBiYXNlLCBwcmV2IGFuZCBjdXJyIHRyZWVcbiAgICBcdGJhc2UudHJlZSA9IG15VHJlZTtcblx0Y3Vyci50cmVlID0gYmFzZS50cmVlO1xuLy9cdHByZXYudHJlZSA9IGJhc2UudHJlZTtcbiAgICBcdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3N1YnRyZWUnLCBmdW5jdGlvbiAoY3Vycl9ub2Rlcywga2VlcFNpbmdsZXRvbnMpIHtcblx0dmFyIHN1YnRyZWUgPSBiYXNlLnRyZWUuc3VidHJlZShjdXJyX25vZGVzLCBrZWVwU2luZ2xldG9ucyk7XG5cdGN1cnIuZGF0YSA9IHN1YnRyZWUuZGF0YSgpO1xuXHRjdXJyLnRyZWUgPSBzdWJ0cmVlO1xuXG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZvY3VzX25vZGUnLCBmdW5jdGlvbiAobm9kZSwga2VlcFNpbmdsZXRvbnMpIHtcblx0Ly8gZmluZFxuXHR2YXIgZm91bmRfbm9kZSA9IHQucm9vdCgpLmZpbmRfbm9kZShmdW5jdGlvbiAobikge1xuXHQgICAgcmV0dXJuIG5vZGUuaWQoKSA9PT0gbi5pZCgpO1xuXHR9KTtcblx0Zm9jdXNlZF9ub2RlID0gZm91bmRfbm9kZTtcblx0dC5zdWJ0cmVlKGZvdW5kX25vZGUuZ2V0X2FsbF9sZWF2ZXMoKSwga2VlcFNpbmdsZXRvbnMpO1xuXG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2hhc19mb2N1cycsIGZ1bmN0aW9uIChub2RlKSB7XG5cdHJldHVybiAoKGZvY3VzZWRfbm9kZSAhPT0gdW5kZWZpbmVkKSAmJiAoZm9jdXNlZF9ub2RlLmlkKCkgPT09IG5vZGUuaWQoKSkpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3JlbGVhc2VfZm9jdXMnLCBmdW5jdGlvbiAoKSB7XG5cdHQuZGF0YSAoYmFzZS5kYXRhKTtcblx0Zm9jdXNlZF9ub2RlID0gdW5kZWZpbmVkO1xuXHRyZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIHJldHVybiBkMy5yZWJpbmQgKHQsIGRpc3BhdGNoLCBcIm9uXCIpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZTtcbiIsImFyZ3VtZW50c1s0XVsxMl1bMF0uYXBwbHkoZXhwb3J0cyxhcmd1bWVudHMpIiwiYXJndW1lbnRzWzRdWzEzXVswXS5hcHBseShleHBvcnRzLGFyZ3VtZW50cykiLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGl0ZXJhdG9yIDogZnVuY3Rpb24oaW5pdF92YWwpIHtcblx0dmFyIGkgPSBpbml0X3ZhbCB8fCAwO1xuXHR2YXIgaXRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBpKys7XG5cdH07XG5cdHJldHVybiBpdGVyO1xuICAgIH0sXG5cbiAgICBzY3JpcHRfcGF0aCA6IGZ1bmN0aW9uIChzY3JpcHRfbmFtZSkgeyAvLyBzY3JpcHRfbmFtZSBpcyB0aGUgZmlsZW5hbWVcblx0dmFyIHNjcmlwdF9zY2FwZWQgPSBzY3JpcHRfbmFtZS5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxde31dL2csICdcXFxcJCYnKTtcblx0dmFyIHNjcmlwdF9yZSA9IG5ldyBSZWdFeHAoc2NyaXB0X3NjYXBlZCArICckJyk7XG5cdHZhciBzY3JpcHRfcmVfc3ViID0gbmV3IFJlZ0V4cCgnKC4qKScgKyBzY3JpcHRfc2NhcGVkICsgJyQnKTtcblxuXHQvLyBUT0RPOiBUaGlzIHJlcXVpcmVzIHBoYW50b20uanMgb3IgYSBzaW1pbGFyIGhlYWRsZXNzIHdlYmtpdCB0byB3b3JrIChkb2N1bWVudClcblx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG5cdHZhciBwYXRoID0gXCJcIjsgIC8vIERlZmF1bHQgdG8gY3VycmVudCBwYXRoXG5cdGlmKHNjcmlwdHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yKHZhciBpIGluIHNjcmlwdHMpIHtcblx0XHRpZihzY3JpcHRzW2ldLnNyYyAmJiBzY3JpcHRzW2ldLnNyYy5tYXRjaChzY3JpcHRfcmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY3JpcHRzW2ldLnNyYy5yZXBsYWNlKHNjcmlwdF9yZV9zdWIsICckMScpO1xuXHRcdH1cbiAgICAgICAgICAgIH1cblx0fVxuXHRyZXR1cm4gcGF0aDtcbiAgICB9LFxuXG4gICAgZGVmZXJfY2FuY2VsIDogZnVuY3Rpb24gKGNiYWssIHRpbWUpIHtcblx0dmFyIHRpY2s7XG5cblx0dmFyIGRlZmVyX2NhbmNlbCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblx0ICAgIHZhciB0aGF0ID0gdGhpcztcblx0ICAgIGNsZWFyVGltZW91dCh0aWNrKTtcblx0ICAgIHRpY2sgPSBzZXRUaW1lb3V0IChmdW5jdGlvbiAoKSB7XG5cdFx0Y2Jhay5hcHBseSAodGhhdCwgYXJncyk7XG5cdCAgICB9LCB0aW1lKTtcblx0fTtcblxuXHRyZXR1cm4gZGVmZXJfY2FuY2VsO1xuICAgIH1cbn07XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlIChcInRudC5hcGlcIik7XG5cbnZhciB0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBub190cmFjayA9IHRydWU7XG4gICAgdmFyIGRpdl9pZDtcblxuICAgIC8vIERlZmF1bHRzXG4gICAgdmFyIHRyZWVfY29uZiA9IHtcblx0dHJlZSA6IHVuZGVmaW5lZCxcblx0dHJhY2sgOiBmdW5jdGlvbiAoKSB7XG5cdCAgICB2YXIgdCA9IHRudC50cmFjaygpXG5cdFx0LmJhY2tncm91bmRfY29sb3IoXCIjRUJGNUZGXCIpXG5cdFx0LmRhdGEodG50LnRyYWNrLmRhdGEoKVxuXHRcdCAgICAgIC51cGRhdGUodG50LnRyYWNrLnJldHJpZXZlci5zeW5jKClcblx0XHRcdCAgICAgIC5yZXRyaWV2ZXIgKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0ICByZXR1cm4gIFtdXG5cdFx0XHQgICAgICB9KVxuXHRcdFx0ICAgICApKVxuXHRcdC5kaXNwbGF5KHRudC50cmFjay5mZWF0dXJlLmJsb2NrKClcblx0XHRcdCAuZm9yZWdyb3VuZF9jb2xvcihcInN0ZWVsYmx1ZVwiKVxuXHRcdFx0IC5pbmRleChmdW5jdGlvbiAoZCkge1xuXHRcdFx0ICAgICByZXR1cm4gZC5zdGFydDtcblx0XHRcdCB9KVxuXHRcdFx0KTtcblxuXHQgICAgcmV0dXJuIHQ7XG5cdH0sXG5cdGFubm90YXRpb24gOiB1bmRlZmluZWQsXG5cdHJ1bGVyIDogXCJub25lXCIsXG5cdGtleSAgIDogdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIHZhciB0cmVlX2Fubm90ID0gZnVuY3Rpb24gKGRpdikge1xuXHRkaXZfaWQgPSBkMy5zZWxlY3QoZGl2KVxuXHQgICAgLmF0dHIoXCJpZFwiKTtcblxuXHR2YXIgZ3JvdXBfZGl2ID0gZDMuc2VsZWN0KGRpdilcblx0ICAgIC5hcHBlbmQoXCJkaXZcIilcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ3JvdXBEaXZcIik7XG5cblx0dmFyIHRyZWVfZGl2ID0gZ3JvdXBfZGl2XG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuYXR0cihcImlkXCIsIFwidG50X3RyZWVfY29udGFpbmVyX1wiICsgZGl2X2lkKVxuXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX2NvbnRhaW5lclwiKTtcblxuXHR2YXIgYW5ub3RfZGl2ID0gZ3JvdXBfZGl2XG5cdCAgICAuYXBwZW5kKFwiZGl2XCIpXG5cdCAgICAuYXR0cihcImlkXCIsIFwidG50X2Fubm90X2NvbnRhaW5lcl9cIiArIGRpdl9pZClcblx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfYW5ub3RfY29udGFpbmVyXCIpO1xuXG5cdHRyZWVfY29uZi50cmVlICh0cmVlX2Rpdi5ub2RlKCkpO1xuXG5cdC8vIHRyYWNrc1xuXHR2YXIgbGVhdmVzID0gdHJlZV9jb25mLnRyZWUucm9vdCgpLmdldF9hbGxfbGVhdmVzKCk7XG5cdHZhciB0cmFja3MgPSBbXTtcblxuXHR2YXIgaGVpZ2h0ID0gdHJlZV9jb25mLnRyZWUubGFiZWwoKS5oZWlnaHQoKTtcblxuXHRmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAvLyBCbG9jayBUcmFjazFcblx0ICAgIChmdW5jdGlvbiAgKGxlYWYpIHtcblx0XHR0bnQudHJhY2suaWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0ICAgIGlmICh0cmVlX2NvbmYua2V5ID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiAgbGVhZi5pZCgpO1xuXHRcdCAgICB9XG5cdFx0ICAgIGlmICh0eXBlb2YgKHRyZWVfY29uZi5rZXkpID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRyZXR1cm4gdHJlZV9jb25mLmtleSAobGVhZik7XG5cdFx0ICAgIH1cblx0XHQgICAgcmV0dXJuIGxlYWYucHJvcGVydHkodHJlZV9jb25mLmtleSk7XG5cdFx0fTtcblx0XHR2YXIgdHJhY2sgPSB0cmVlX2NvbmYudHJhY2sobGVhdmVzW2ldKVxuXHRcdCAgICAuaGVpZ2h0KGhlaWdodCk7XG5cblx0XHR0cmFja3MucHVzaCAodHJhY2spO1xuXG5cdCAgICB9KShsZWF2ZXNbaV0pO1xuXG5cdH1cblxuXHQvLyBBbiBheGlzIHRyYWNrXG5cdHRudC50cmFjay5pZCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBcImF4aXMtdG9wXCI7XG5cdH07XG5cdHZhciBheGlzX3RvcCA9IHRudC50cmFjaygpXG5cdCAgICAuaGVpZ2h0KDApXG5cdCAgICAuYmFja2dyb3VuZF9jb2xvcihcIndoaXRlXCIpXG5cdCAgICAuZGlzcGxheSh0bnQudHJhY2suZmVhdHVyZS5heGlzKClcblx0XHQgICAgIC5vcmllbnRhdGlvbihcInRvcFwiKVxuXHRcdCAgICApO1xuXG5cdHRudC50cmFjay5pZCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBcImF4aXMtYm90dG9tXCI7XG5cdH07XG5cdHZhciBheGlzID0gdG50LnRyYWNrKClcblx0ICAgIC5oZWlnaHQoMTgpXG5cdCAgICAuYmFja2dyb3VuZF9jb2xvcihcIndoaXRlXCIpXG5cdCAgICAuZGlzcGxheSh0bnQudHJhY2suZmVhdHVyZS5heGlzKClcblx0XHQgICAgIC5vcmllbnRhdGlvbihcImJvdHRvbVwiKVxuXHRcdCAgICApO1xuXG5cdGlmICh0cmVlX2NvbmYuYW5ub3RhdGlvbikge1xuXHQgICAgaWYgKHRyZWVfY29uZi5ydWxlciA9PT0gJ2JvdGgnIHx8IHRyZWVfY29uZi5ydWxlciA9PT0gJ3RvcCcpIHtcblx0XHR0cmVlX2NvbmYuYW5ub3RhdGlvblxuXHRcdCAgICAuYWRkX3RyYWNrKGF4aXNfdG9wKTtcblx0ICAgIH1cblxuXHQgICAgdHJlZV9jb25mLmFubm90YXRpb25cblx0XHQuYWRkX3RyYWNrKHRyYWNrcyk7XG5cblx0ICAgIGlmICh0cmVlX2NvbmYucnVsZXIgPT09ICdib3RoJyB8fCB0cmVlX2NvbmYucnVsZXIgPT09IFwiYm90dG9tXCIpIHtcblx0XHR0cmVlX2NvbmYuYW5ub3RhdGlvblxuXHRcdCAgICAuYWRkX3RyYWNrKGF4aXMpO1xuXHQgICAgfVxuXG5cdCAgICB0cmVlX2NvbmYuYW5ub3RhdGlvbihhbm5vdF9kaXYubm9kZSgpKTtcblx0ICAgIHRyZWVfY29uZi5hbm5vdGF0aW9uLnN0YXJ0KCk7XG5cdH1cblxuXHRhcGkubWV0aG9kKCd1cGRhdGUnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICB0cmVlX2NvbmYudHJlZS51cGRhdGUoKTtcblxuXHQgICAgaWYgKHRyZWVfY29uZi5hbm5vdGF0aW9uKSB7XG5cdFx0dmFyIGxlYXZlcyA9IHRyZWVfY29uZi50cmVlLnJvb3QoKS5nZXRfYWxsX2xlYXZlcygpO1xuXHRcdHZhciBuZXdfdHJhY2tzID0gW107XG5cblx0XHRpZiAodHJlZV9jb25mLnJ1bGVyID09PSAnYm90aCcgfHwgdHJlZV9jb25mLnJ1bGVyID09PSAndG9wJykge1xuXHRcdCAgICBuZXdfdHJhY2tzLnB1c2goYXhpc190b3ApO1xuXHRcdH1cblxuXHRcdGZvciAodmFyIGk9MDsgaTxsZWF2ZXMubGVuZ3RoOyBpKyspIHtcblx0XHQgICAgLy8gV2UgZmlyc3Qgc2VlIGlmIHdlIGhhdmUgYSB0cmFjayBmb3IgdGhlIGxlYWY6XG5cdFx0ICAgIHZhciBpZDtcblx0XHQgICAgaWYgKHRyZWVfY29uZi5rZXkgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0aWQgPSBsZWF2ZXNbaV0uaWQoKTtcblx0XHQgICAgfSBlbHNlIGlmICh0eXBlb2YgKHRyZWVfY29uZi5rZXkpID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZCA9IHRyZWVfY29uZi5rZXkgKGxlYXZlc1tpXSk7XG5cdFx0ICAgIH0gZWxzZSB7XG5cdFx0XHRpZCA9IGxlYXZlc1tpXS5wcm9wZXJ0eSh0cmVlX2NvbmYua2V5KTtcblx0XHQgICAgfVxuXHRcdCAgICB2YXIgY3Vycl90cmFjayA9IHRyZWVfY29uZi5hbm5vdGF0aW9uLmZpbmRfdHJhY2tfYnlfaWQoaWQpO1xuXHRcdCAgICAvL3ZhciBjdXJyX3RyYWNrID0gdHJlZV9jb25mLmFubm90YXRpb24uZmluZF90cmFja19ieV9pZCh0cmVlX2NvbmYua2V5PT09dW5kZWZpbmVkID8gbGVhdmVzW2ldLmlkKCkgOiBkMy5mdW5jdG9yKHRyZWVfY29uZi5rZXkpIChsZWF2ZXNbaV0pKS8vbGVhdmVzW2ldLnByb3BlcnR5KHRyZWVfY29uZi5rZXkpKTtcblx0XHQgICAgaWYgKGN1cnJfdHJhY2sgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Ly8gTmV3IGxlYWYgLS0gbm8gdHJhY2sgZm9yIGl0XG5cdFx0XHQoZnVuY3Rpb24gKGxlYWYpIHtcblx0XHRcdCAgICB0bnQudHJhY2suaWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGlmICh0cmVlX2NvbmYua2V5ID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0ICAgIHJldHVybiBsZWFmLmlkKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHR5cGVvZiAodHJlZV9jb25mLmtleSkgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0ICAgIHJldHVybiB0cmVlX2NvbmYua2V5IChsZWFmKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbGVhZi5wcm9wZXJ0eSh0cmVlX2NvbmYua2V5KTtcblx0XHRcdCAgICB9O1xuXHRcdFx0ICAgIGN1cnJfdHJhY2sgPSB0cmVlX2NvbmYudHJhY2sobGVhdmVzW2ldKVxuXHRcdFx0XHQuaGVpZ2h0KGhlaWdodCk7XG5cdFx0XHR9KShsZWF2ZXNbaV0pO1xuXHRcdCAgICB9XG5cdFx0ICAgIG5ld190cmFja3MucHVzaChjdXJyX3RyYWNrKTtcblx0XHR9XG5cdFx0aWYgKHRyZWVfY29uZi5ydWxlciA9PT0gJ2JvdGgnIHx8IHRyZWVfY29uZi5ydWxlciA9PT0gJ2JvdHRvbScpIHtcblx0XHQgICAgbmV3X3RyYWNrcy5wdXNoKGF4aXMpO1xuXHRcdH1cblxuXHRcdHRyZWVfY29uZi5hbm5vdGF0aW9uLnJlb3JkZXIobmV3X3RyYWNrcyk7XG5cdCAgICB9XG5cdH0pO1xuXG5cdHJldHVybiB0cmVlX2Fubm90O1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gdG50LnV0aWxzLmFwaSAodHJlZV9hbm5vdClcblx0LmdldHNldCAodHJlZV9jb25mKTtcblxuICAgIC8vIFRPRE86IFJld3JpdGUgd2l0aCB0aGUgYXBpIGludGVyZmFjZVxuICAgIHRyZWVfYW5ub3QudHJhY2sgPSBmdW5jdGlvbiAobmV3X3RyYWNrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHRyZWVfY29uZi50cmFjaztcblx0fVxuXG5cdC8vIEZpcnN0IHRpbWUgaXQgaXMgc2V0XG5cdGlmIChub190cmFjaykge1xuXHQgICAgdHJlZV9jb25mLnRyYWNrID0gbmV3X3RyYWNrO1xuXHQgICAgbm9fdHJhY2sgPSBmYWxzZTtcblx0ICAgIHJldHVybiB0cmVlX2Fubm90O1xuXHR9XG5cblx0Ly8gSWYgaXQgaXMgcmVzZXQgLS0gYXBwbHkgdGhlIGNoYW5nZXNcblx0dmFyIHRyYWNrcyA9IHRyZWVfY29uZi5hbm5vdGF0aW9uLnRyYWNrcygpO1xuXHQvLyB2YXIgc3RhcnRfaW5kZXggPSAodHJlZV9jb25mLnJ1bGVyID09PSAnYm90aCcgfHwgdHJlZV9jb25mLnJ1bGVyID09PSAndG9wJykgPyAxIDogMDtcblx0Ly8gdmFyIGVuZF9pbmRleCA9ICh0cmVlX2NvbmYucnVsZXIgPT09ICdib3RoJyB8fCB0cmVlX2NvbmYucnVsZXIgPT09ICdib3R0b20nKSA/IDEgOiAwO1xuXG5cdHZhciBzdGFydF9pbmRleCA9IDA7XG5cdHZhciBuX2luZGV4ID0gMDtcblxuXHRpZiAodHJlZV9jb25mLnJ1bGVyID09PSBcImJvdGhcIikge1xuXHQgICAgc3RhcnRfaW5kZXggPSAxO1xuXHQgICAgbl9pbmRleCA9IDI7XG5cdH0gZWxzZSBpZiAodHJlZV9jb25mLnJ1bGVyID09PSBcInRvcFwiKSB7XG5cdCAgICBzdGFydF9pbmRleCA9IDE7XG5cdCAgICBuX2luZGV4ID0gMTtcblx0fSBlbHNlIGlmICh0cmVlX2NvbmYucnVsZXIgPT09IFwiYm90dG9tXCIpIHtcblx0ICAgIG5faW5kZXggPSAxO1xuXHR9XG5cblx0Ly8gUmVzZXQgdG9wIHRyYWNrIC0tIGF4aXNcblx0aWYgKHN0YXJ0X2luZGV4ID4gMCkge1xuXHQgICAgdHJhY2tzWzBdLmRpc3BsYXkoKS5yZXNldC5jYWxsKHRyYWNrc1swXSk7XG5cdH1cblx0Ly8gUmVzZXQgYm90dG9tIHRyYWNrIC0tIGF4aXNcblx0aWYgKG5faW5kZXggPiBzdGFydF9pbmRleCkge1xuXHQgICAgdmFyIG4gPSB0cmFja3MubGVuZ3RoIC0gMTtcblx0ICAgIHRyYWNrc1tuXS5kaXNwbGF5KCkucmVzZXQuY2FsbCh0cmFja3Nbbl0pO1xuXHR9XG5cblx0Zm9yICh2YXIgaT1zdGFydF9pbmRleDsgaTw9KHRyYWNrcy5sZW5ndGggLSBuX2luZGV4KTsgaSsrKSB7XG5cdCAgICB2YXIgdCA9IHRyYWNrc1tpXTtcblx0ICAgIHQuZGlzcGxheSgpLnJlc2V0LmNhbGwodCk7XG5cdCAgICB2YXIgbGVhZjtcblx0ICAgIHRyZWVfY29uZi50cmVlLnJvb3QoKS5hcHBseSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0XHRpZiAobm9kZS5pZCgpID09PSB0LmlkKCkpIHtcblx0XHQgICAgbGVhZiA9IG5vZGU7XG5cdFx0fVxuXHQgICAgfSlcblxuXHQgICAgdmFyIG5fdHJhY2s7XG5cdCAgICAoZnVuY3Rpb24gKGxlYWYpIHtcblx0XHR0bnQudHJhY2suaWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0ICAgIGlmICh0cmVlX2NvbmYua2V5ID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiBsZWFmLmlkKCk7XG5cdFx0ICAgIH1cblx0XHQgICAgaWYgKHR5cGVvZiAodHJlZV9jb25mLmtleSA9PT0gJ2Z1bmN0aW9uJykpIHtcblx0XHRcdHJldHVybiB0cmVlX2NvbmYua2V5IChsZWFmKTtcblx0XHQgICAgfVxuXHRcdCAgICByZXR1cm4gbGVhZi5wcm9wZXJ0eSh0cmVlX2NvbmYua2V5KTtcblx0XHR9O1xuXHRcdG5fdHJhY2sgPSBuZXdfdHJhY2sobGVhZilcblx0XHQgICAgLmhlaWdodCh0cmVlX2NvbmYudHJlZS5sYWJlbCgpLmhlaWdodCgpKTtcblx0ICAgIH0pKGxlYWYpO1xuXG5cdCAgICB0cmFja3NbaV0gPSBuX3RyYWNrO1xuXHR9XG5cblx0dHJlZV9jb25mLnRyYWNrID0gbmV3X3RyYWNrO1xuXHR0cmVlX2NvbmYuYW5ub3RhdGlvbi5zdGFydCgpO1xuICAgIH07XG5cbiAgICByZXR1cm4gdGE7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0YTtcblxuIl19

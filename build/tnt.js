(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./index.js");

},{"./index.js":2}],2:[function(require,module,exports){
if (typeof tnt === "undefined") {
    module.exports = tnt = require("./src/ta.js");
}
var eventsystem = require ("biojs-events");
eventsystem.mixin (tnt);
tnt.utils = require ("tnt.utils");
tnt.tree = require ("tnt.tree");
tnt.tree.node = require ("tnt.tree.node");
tnt.tree.parse_newick = require("tnt.newick").parse_newick;
tnt.tree.parse_nhx = require("tnt.newick").parse_nhx;
tnt.board = require ("tnt.board");

},{"./src/ta.js":32,"biojs-events":5,"tnt.board":8,"tnt.newick":16,"tnt.tree":20,"tnt.tree.node":18,"tnt.utils":27}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
module.exports = require('./backbone-events-standalone');

},{"./backbone-events-standalone":3}],5:[function(require,module,exports){
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

},{"backbone-events-standalone":4}],6:[function(require,module,exports){
module.exports = require("./src/api.js");

},{"./src/api.js":7}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
// if (typeof tnt === "undefined") {
//     module.exports = tnt = {}
// }
// tnt.utils = require("tnt.utils");
// tnt.tooltip = require("tnt.tooltip");
// tnt.board = require("./src/index.js");

module.exports = require("./src/index");

},{"./src/index":12}],9:[function(require,module,exports){
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

    // Limit caps
    var caps = {
        left : undefined,
        right : undefined
    };
    var cap_width = 3;


    // TODO: We have now background color in the tracks. Can this be removed?
    // It looks like it is used in the too-wide pane etc, but it may not be needed anymore
    var bgColor   = d3.rgb('#F8FBEF'); //#F8FBEF
    var pane; // Draggable pane
    var svg_g;
    var xScale;
    var zoomEventHandler = d3.behavior.zoom();
    var limits = {
        min : 0,
        max : 1000,
        zoom_out : 1000,
        zoom_in  : 100
    };
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
    	    .style("width", (width + cap_width*2 + exports.extend_canvas.right + exports.extend_canvas.left) + "px");

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
    	caps.left = svg_g
    	    .append("rect")
    	    .attr("id", "tnt_" + div_id + "_5pcap")
    	    .attr("x", 0)
    	    .attr("y", 0)
    	    .attr("width", 0)
    	    .attr("height", height)
    	    .attr("fill", "red");
    	caps.right = svg_g
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
        // make sure that zoom_out is within the min-max range
        if ((limits.max - limits.min) < limits.zoom_out) {
            limits.zoom_out = limits.max - limits.min;
        }

        plot();

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
        var cont = function () {

            if ((loc.to - loc.from) < limits.zoom_in) {
                if ((loc.from + limits.zoom_in) > limits.max) {
                    loc.to = limits.max;
                } else {
                    loc.to = loc.from + limits.zoom_in;
                }
            }

            for (var i=0; i<tracks.length; i++) {
                _update_track(tracks[i], loc);
            }
        };

        cont();
    });

    api.method ('update', function () {
    	for (var i=0; i<tracks.length; i++) {
    	    _update_track (tracks[i]);
    	}
    });

    var _update_track = function (track, where) {
    	if (track.data()) {
    	    var track_data = track.data();
            var data_updater = track_data;

    	    data_updater.call(track, {
                'loc' : where,
                'on_success' : function () {
                    track.display().update.call(track, where);
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

    var _reorder = function (new_tracks) {
        // TODO: This is defining a new height, but the global height is used to define the size of several
        // parts. We should do this dynamically

        var found_indexes = [];
        for (var j=0; j<new_tracks.length; j++) {
            var found = false;
            for (var i=0; i<tracks.length; i++) {
                if (tracks[i].id() === new_tracks[j].id()) {
                    found = true;
                    found_indexes[i] = true;
                    // tracks.splice(i,1);
                    break;
                }
            }
            if (!found) {
                _init_track(new_tracks[j]);
                _update_track(new_tracks[j], {from : loc.from, to : loc.to});
            }
        }

        for (var x=0; x<tracks.length; x++) {
            if (!found_indexes[x]) {
                tracks[x].g.remove();
            }
        }

        tracks = new_tracks;
        _place_tracks();
    };

    // right/left/zoom pans or zooms the track. These methods are exposed to allow external buttons, etc to interact with the tracks. The argument is the amount of panning/zooming (ie. 1.2 means 20% panning) With left/right only positive numbers are allowed.
    api.method ('scroll', function (factor) {
        var amount = Math.abs(factor);
    	if (factor > 0) {
    	    _manual_move(amount, 1);
    	} else if (factor < 0){
            _manual_move(amount, -1);
        }
    });

    api.method ('zoom', function (factor) {
        _manual_move(1/factor, 0);
    });

    api.method ('find_track', function (id) {
        for (var i=0; i<tracks.length; i++) {
            if (tracks[i].id() === id) {
                return tracks[i];
            }
        }
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

    api.method('tracks', function (ts) {
        if (!arguments.length) {
            return tracks;
        }
        _reorder(ts);
        return this;
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
    	    w = min_width;
    	}

    	// We are resizing
    	if (div_id !== undefined) {
    	    d3.select("#tnt_" + div_id).select("svg").attr("width", w);
    	    // Resize the zooming/panning pane
    	    d3.select("#tnt_" + div_id).style("width", (parseInt(w) + cap_width*2) + "px");
    	    d3.select("#tnt_" + div_id + "_pane").attr("width", w);
            caps.right
                .attr("x", w-cap_width);

    	    // Replot
    	    width = w;
            xScale.range([0, width]);

    	    plot();
    	    for (var i=0; i<tracks.length; i++) {
        		tracks[i].g.select("rect").attr("width", w);
                tracks[i].display().scale(xScale);
        		tracks[i].display().reset.call(tracks[i]);
                tracks[i].display().init.call(tracks[i], w);
        		tracks[i].display().update.call(tracks[i], loc);
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
            .each(function (d) {
                move_to_front(this);
            });

        d3.select("#tnt_" + div_id + "_3pcap")
            .attr("height", h)
            .each (function (d) {
                move_to_front(this);
            });

        // pane
        pane
            .attr("height", h + height_offset);

        return track_vis;
    };

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
    	    .style("fill", track.color())
    	    .style("pointer-events", "none");

    	if (track.display()) {
    	    track.display()
                .scale(xScale)
                .init.call(track, width);
    	}

    	return track_vis;
    };

    var _manual_move = function (factor, direction) {
        var oldDomain = xScale.domain();

    	var span = oldDomain[1] - oldDomain[0];
    	var offset = (span * factor) - span;

    	var newDomain;
    	switch (direction) {
            case 1 :
            newDomain = [(~~oldDomain[0] - offset), ~~(oldDomain[1] - offset)];
    	    break;
        	case -1 :
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
    	if (domain[0] <= (limits.min + 5)) {
    	    d3.select("#tnt_" + div_id + "_5pcap")
    		.attr("width", cap_width)
    		.transition()
    		.duration(200)
    		.attr("width", 0);
    	}

    	if (domain[1] >= (limits.max)-5) {
    	    d3.select("#tnt_" + div_id + "_3pcap")
    		.attr("width", cap_width)
    		.transition()
    		.duration(200)
    		.attr("width", 0);
    	}


    	// Avoid moving past the limits
    	if (domain[0] < limits.min) {
    	    zoomEventHandler.translate([zoomEventHandler.translate()[0] - xScale(limits.min) + xScale.range()[0], zoomEventHandler.translate()[1]]);
    	} else if (domain[1] > limits.max) {
    	    zoomEventHandler.translate([zoomEventHandler.translate()[0] - xScale(limits.max) + xScale.range()[1], zoomEventHandler.translate()[1]]);
    	}

    	_deferred();

    	for (var i = 0; i < tracks.length; i++) {
    	    var track = tracks[i];
    	    track.display().mover.call(track);
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

},{"tnt.api":6,"tnt.utils":27}],10:[function(require,module,exports){
var apijs = require ("tnt.api");
var spinner = require ("./spinner.js")();

tnt_data = {};

tnt_data.sync = function() {
    var update_track = function(obj) {
        var track = this;
        track.data().elements(update_track.retriever().call(track, obj.loc));
        obj.on_success();
    };

    apijs (update_track)
        .getset ('elements', [])
        .getset ('retriever', function () {});

    return update_track;
};

tnt_data.async = function () {
    var update_track = function (obj) {
        var track = this;
        spinner.on.call(track);
        update_track.retriever().call(track, obj.loc)
            .then (function (resp) {
                track.data().elements(resp);
                obj.on_success();
                spinner.off.call(track);
            });
    };

    var api = apijs (update_track)
        .getset ('elements', [])
        .getset ('retriever');

    return update_track;
};


// A predefined track displaying no external data
// it is used for location and axis tracks for example
tnt_data.empty = function () {
    var updater = tnt_data.sync();

    return updater;
};

module.exports = exports = tnt_data;

},{"./spinner.js":14,"tnt.api":6}],11:[function(require,module,exports){
var apijs = require ("tnt.api");
var layout = require("./layout.js");

// FEATURE VIS
// var board = {};
// board.track = {};
var tnt_feature = function () {
    var dispatch = d3.dispatch ("click", "dblclick", "mouseover", "mouseout");

    ////// Vars exposed in the API
    var config = {
        create   : function () {throw "create_elem is not defined in the base feature object";},
        move    : function () {throw "move_elem is not defined in the base feature object";},
        distribute  : function () {},
        fixed   : function () {},
        //layout   : function () {},
        index    : undefined,
        layout   : layout.identity(),
        color : '#000',
        scale : undefined
    };


    // The returned object
    var feature = {};

    var reset = function () {
    	var track = this;
    	track.g.selectAll(".tnt_elem").remove();
        track.g.selectAll(".tnt_guider").remove();
        track.g.selectAll(".tnt_fixed").remove();
    };

    var init = function (width) {
        var track = this;

        track.g
            .append ("text")
            .attr ("class", "tnt_fixed")
            .attr ("x", 5)
            .attr ("y", 12)
            .attr ("font-size", 11)
            .attr ("fill", "grey")
            .text (track.label());

        config.fixed.call(track, width);
    };

    var plot = function (new_elems, track, xScale) {
        new_elems.on("click", function (d, i) {
            if (d3.event.defaultPrevented) {
                return;
            }
            dispatch.click.call(this, d, i);
        });
        new_elems.on("mouseover", function (d, i) {
            if (d3.event.defaultPrevented) {
                return;
            }
            dispatch.mouseover.call(this, d, i);
        });
        new_elems.on("dblclick", function (d, i) {
            if (d3.event.defaultPrevented) {
                return;
            }
            dispatch.dblclick.call(this, d, i);
        });
        new_elems.on("mouseout", function (d, i) {
            if (d3.event.defaultPrevented) {
                return;
            }
            dispatch.mouseout.call(this, d, i);
        });
        // new_elem is a g element the feature is inserted
        config.create.call(track, new_elems, xScale);
    };

    var update = function (loc, field) {
        var track = this;
        var svg_g = track.g;

        var elements = track.data().elements();

        if (field !== undefined) {
            elements = elements[field];
        }

        var data_elems = config.layout.call(track, elements);


        if (data_elems === undefined) {
            return;
        }

        var vis_sel;
        var vis_elems;
        if (field !== undefined) {
            vis_sel = svg_g.selectAll(".tnt_elem_" + field);
        } else {
            vis_sel = svg_g.selectAll(".tnt_elem");
        }

        if (config.index) { // Indexing by field
            vis_elems = vis_sel
                .data(data_elems, function (d) {
                    if (d !== undefined) {
                        return config.index(d);
                    }
                });
        } else { // Indexing by position in array
            vis_elems = vis_sel
                .data(data_elems);
        }

        config.distribute.call(track, vis_elems, config.scale);

    	var new_elem = vis_elems
    	    .enter();

    	new_elem
    	    .append("g")
    	    .attr("class", "tnt_elem")
    	    .classed("tnt_elem_" + field, field)
    	    .call(feature.plot, track, config.scale);

    	vis_elems
    	    .exit()
    	    .remove();
    };

    var mover = function (field) {
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

    	config.move.call(this, elems);
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
    	.getset (config)
    	.method ({
    	    reset  : reset,
    	    plot   : plot,
    	    update : update,
    	    mover   : mover,
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
        for (var display in displays) {
            if (displays.hasOwnProperty(display)) {
                displays[display].reset.call(track);
            }
        }
    };

    var init = function (width) {
        var track = this;
        for (var display in displays) {
            if (displays.hasOwnProperty(display)) {
                displays[display].scale(features.scale());
                displays[display].init.call(track, width);
            }
        }
    };

    var update = function () {
    	var track = this;
    	for (var i=0; i<display_order.length; i++) {
    	    displays[display_order[i]].update.call(track, undefined, display_order[i]);
    	    displays[display_order[i]].move_to_front.call(track, display_order[i]);
    	}
        // for (var display in displays) {
        //     if (displays.hasOwnProperty(display)) {
        //         displays[display].update.call(track, xScale, display);
        //     }
        // }
    };

    var mover = function () {
        var track = this;
        for (var display in displays) {
            if (displays.hasOwnProperty(display)) {
                displays[display].mover.call(track, display);
            }
        }
    };

    var add = function (key, display) {
    	displays[key] = display;
    	display_order.push(key);
    	return features;
    };

    var get_displays = function () {
    	var ds = [];
    	for (var i=0; i<display_order.length; i++) {
    	    ds.push(displays[display_order[i]]);
    	}
    	return ds;
    };

    // API
    apijs (features)
        .getset("scale")
    	.method ({
    	    reset  : reset,
    	    update : update,
    	    mover   : mover,
    	    init   : init,
    	    add    : add,
    	    displays : get_displays
    	});

    return features;
};

tnt_feature.area = function () {
    var feature = tnt_feature.line();
    var line = feature.line();

    var area = d3.svg.area()
    	.interpolate(line.interpolate())
    	.tension(feature.tension());

    var data_points;

    var line_create = feature.create(); // We 'save' line creation

    feature.create (function (points) {
    	var track = this;
        var xScale = feature.scale();

    	if (data_points !== undefined) {
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
    	    .attr("fill", d3.rgb(feature.color()).brighter());
    });

    var line_move = feature.move();
    feature.move (function (path) {
    	var track = this;
        var xScale = feature.scale();
    	line_move.call(track, path, xScale);

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
    feature.create (function (points) {
    	var track = this;
        var xScale = feature.scale();

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
    	    });

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
    	    .style("stroke", feature.color())
    	    .style("stroke-width", 4)
    	    .style("fill", "none");
    });

    feature.move (function (path) {
    	var track = this;
        var xScale = feature.scale();

    	line.x(function (d) {
    	    return xScale(x(d));
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
        feature.create  (function (points) {
        	var track = this;
            var xScale = feature.scale();
        	area_create.call(track, d3.select(points[0][0]), xScale);
        });

    return feature;
};

tnt_feature.ensembl = function () {
    // 'Inherit' from board.track.feature
    var feature = tnt_feature();

    var color2 = "#7FFF00";
    var color3 = "#00BB00";

    feature.fixed (function (width) {
    	var track = this;
    	var height_offset = ~~(track.height() - (track.height()  * 0.8)) / 2;

    	track.g
    	    .append("line")
    	    .attr("class", "tnt_guider tnt_fixed")
    	    .attr("x1", 0)
    	    .attr("x2", width)
    	    .attr("y1", height_offset)
    	    .attr("y2", height_offset)
    	    .style("stroke", feature.color())
    	    .style("stroke-width", 1);

    	track.g
    	    .append("line")
    	    .attr("class", "tnt_guider tnt_fixed")
    	    .attr("x1", 0)
    	    .attr("x2", width)
    	    .attr("y1", track.height() - height_offset)
    	    .attr("y2", track.height() - height_offset)
    	    .style("stroke", feature.color())
    	    .style("stroke-width", 1);

    });

    feature.create (function (new_elems) {
    	var track = this;
        var xScale = feature.scale();

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
    	    .attr("fill", track.color())
    	    .transition()
    	    .duration(500)
    	    .attr("fill", function (d) {
        		if (d.type === 'high') {
        		    return d3.rgb(feature.color());
        		}
        		if (d.type === 'low') {
        		    return d3.rgb(feature.color2());
        		}
        		return d3.rgb(feature.color3());
    	    });
    });

    feature.distribute (function (blocks) {
        var xScale = feature.scale();
    	blocks
    	    .select("rect")
    	    .attr("width", function (d) {
                return (xScale(d.end) - xScale(d.start));
    	    });
    });

    feature.move (function (blocks) {
        var xScale = feature.scale();
    	blocks
    	    .select("rect")
    	    .attr("x", function (d) {
                return xScale(d.start);
    	    })
    	    .attr("width", function (d) {
                return (xScale(d.end) - xScale(d.start));
    	    });
    });

    feature.color2 = function (col) {
    	if (!arguments.length) {
    	    return color2;
    	}
    	color2 = col;
    	return feature;
    };

    feature.color3 = function (col) {
    	if (!arguments.length) {
    	    return color3;
    	}
    	color3 = col;
    	return feature;
    };

    return feature;
};

tnt_feature.vline = function () {
    // 'Inherit' from feature
    var feature = tnt_feature();

    feature.create (function (new_elems) {
        var xScale = feature.scale();
    	var track = this;
    	new_elems
    	    .append ("line")
    	    .attr("x1", function (d) {
                return xScale(feature.index()(d));
    	    })
    	    .attr("x2", function (d) {
                return xScale(feature.index()(d));
    	    })
    	    .attr("y1", 0)
    	    .attr("y2", track.height())
    	    .attr("stroke", feature.color())
    	    .attr("stroke-width", 1);
    });

    feature.move (function (vlines) {
        var xScale = feature.scale();
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


    feature.create (function (new_pins) {
    	var track = this;
        var xScale = feature.scale();
    	yScale
    	    .domain(feature.domain())
    	    .range([pin_ball_r, track.height()-pin_ball_r-10]); // 10 for labelling

    	// pins are composed of lines, circles and labels
    	new_pins
    	    .append("line")
    	    .attr("x1", function (d, i) {
    	    	return xScale(d[opts.pos(d, i)]);
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
    	    .attr("stroke", function (d) {
                return d3.functor(feature.color())(d);
            });

    	new_pins
    	    .append("circle")
    	    .attr("cx", function (d, i) {
                return xScale(d[opts.pos(d, i)]);
    	    })
    	    .attr("cy", function (d, i) {
                return track.height() - yScale(d[opts.val(d, i)]);
    	    })
    	    .attr("r", pin_ball_r)
    	    .attr("fill", function (d) {
                return d3.functor(feature.color())(d);
            });

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
            });

    });

    feature.distribute (function (pins) {
        pins
            .select("text")
            .text(function (d) {
                return d.label || "";
            });
    });

    feature.move(function (pins) {
    	var track = this;
        var xScale = feature.scale();

    	pins
    	    //.each(position_pin_line)
    	    .select("line")
    	    .attr("x1", function (d, i) {
                return xScale(d[opts.pos(d, i)]);
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
            });

    });

    feature.fixed (function (width) {
        var track = this;
        track.g
            .append("line")
            .attr("class", "tnt_fixed")
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

    feature.create(function (new_elems) {
    	var track = this;
        var xScale = feature.scale();
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
    	    .attr("fill", track.color())
    	    .transition()
    	    .duration(500)
    	    .attr("fill", function (d) {
        		if (d.color === undefined) {
        		    return feature.color();
        		} else {
        		    return d.color;
        		}
    	    });
    });

    feature.distribute(function (elems) {
        var xScale = feature.scale();
    	elems
    	    .select("rect")
    	    .attr("width", function (d) {
        		return (xScale(d.end) - xScale(d.start));
    	    });
    });

    feature.move(function (blocks) {
        var xScale = feature.scale();
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
    var xScale;

    // Axis doesn't inherit from feature
    var feature = {};
    feature.reset = function () {
    	xAxis = undefined;
    	var track = this;
    	track.g.selectAll(".tick").remove();
    };
    feature.plot = function () {};
    feature.mover = function () {
    	var track = this;
    	var svg_g = track.g;
    	svg_g.call(xAxis);
    };

    feature.init = function () {
        xAxis = undefined;
    };

    feature.update = function () {
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
    	return this;
    };

    feature.scale = function (s) {
        if (!arguments.length) {
            return xScale;
        }
        xScale = s;
        return this;
    };

    return feature;
};

tnt_feature.location = function () {
    var row;
    var xScale;

    var feature = {};
    feature.reset = function () {
        row = undefined;
    };
    feature.plot = function () {};
    feature.init = function () {
        row = undefined;
        var track = this;
        track.g.select("text").remove();
    };
    feature.mover = function() {
    	var domain = xScale.domain();
    	row.select("text")
    	    .text("Location: " + ~~domain[0] + "-" + ~~domain[1]);
    };

    feature.scale = function (sc) {
        if (!arguments.length) {
            return xScale;
        }
        xScale = sc;
        return this;
    };

    feature.update = function (loc) {
    	var track = this;
    	var svg_g = track.g;
    	var domain = xScale.domain();
    	if (row === undefined) {
    	    row = svg_g;
    	    row
        		.append("text")
        		.text("Location: " + Math.round(domain[0]) + "-" + Math.round(domain[1]));
    	}
    };

    return feature;
};

module.exports = exports = tnt_feature;

},{"./layout.js":13,"tnt.api":6}],12:[function(require,module,exports){
var board = require ("./board.js");
board.track = require ("./track");
board.track.data = require ("./data.js");
board.track.layout = require ("./layout.js");
board.track.feature = require ("./feature.js");
board.track.layout = require ("./layout.js");

module.exports = exports = board;

},{"./board.js":9,"./data.js":10,"./feature.js":11,"./layout.js":13,"./track":15}],13:[function(require,module,exports){
var apijs = require ("tnt.api");

// var board = {};
// board.track = {};
var layout = function () {

    // The returned closure / object
    var l = function (new_elems)  {
        var track = this;
        l.elements().call(track, new_elems);
        return new_elems;
    };

    var api = apijs(l)
        .getset ('elements', function () {});

    return l;
};

layout.identity = function () {
    return layout()
        .elements (function (e) {
            return e;
        });
};

module.exports = exports = layout;

},{"tnt.api":6}],14:[function(require,module,exports){
var spinner = function () {
    // var n = 0;
    var sp_elem;
    var sp = {};

    sp.on = function () {
        var track = this;
        if (!track.spinner) {
            track.spinner = 1;
        } else {
            track.spinner++;
        }
        if (track.spinner==1) {
            var container = track.g;
            var bgColor = track.color();
            sp_elem = container
                .append("svg")
                .attr("class", "tnt_spinner")
                .attr("width", "30px")
                .attr("height", "30px")
                .attr("xmls", "http://www.w3.org/2000/svg")
                .attr("viewBox", "0 0 100 100")
                .attr("preserveAspectRatio", "xMidYMid");


            sp_elem
                .append("rect")
                .attr("x", '0')
                .attr("y", '0')
                .attr("width", "100")
                .attr("height", "100")
                .attr("rx", '50')
                .attr("ry", '50')
                .attr("fill", bgColor);
                //.attr("opacity", 0.6);

            for (var i=0; i<12; i++) {
                tick(sp_elem, i, bgColor);
            }

        } else if (track.spinner>0){
            // Move the spinner to front
            var node = sp_elem.node();
            if (node.parentNode) {
                node.parentNode.appendChild(node);
            }
        }
    };

    sp.off = function () {
        var track = this;
        track.spinner--;
        if (!track.spinner) {
            var container = track.g;
            container.selectAll(".tnt_spinner")
                .remove();

        }
    };

    function tick (elem, i, bgColor) {
        elem
            .append("rect")
            .attr("x", "46.5")
            .attr("y", '40')
            .attr("width", "7")
            .attr("height", "20")
            .attr("rx", "5")
            .attr("ry", "5")
            .attr("fill", d3.rgb(bgColor).darker(2))
            .attr("transform", "rotate(" + (360/12)*i + " 50 50) translate(0 -30)")
            .append("animate")
            .attr("attributeName", "opacity")
            .attr("from", "1")
            .attr("to", "0")
            .attr("dur", "1s")
            .attr("begin", (1/12)*i + "s")
            .attr("repeatCount", "indefinite");

    }

    return sp;
};
module.exports = exports = spinner;

},{}],15:[function(require,module,exports){
var apijs = require ("tnt.api");
var iterator = require("tnt.utils").iterator;


var track = function () {
    "use strict";

    var display;

    var conf = {
    	color : d3.rgb('#CCCCCC'),
    	height           : 250,
    	// data is the object (normally a tnt.track.data object) used to retrieve and update data for the track
    	data             : track.data.empty(),
        // display          : undefined,
        label            : "",
        id               : track.id()
    };

    // The returned object / closure
    var t = {};

    // API
    var api = apijs (t)
    	.getset (conf);

    // TODO: This means that height should be defined before display
    // we shouldn't rely on this
    t.display = function (new_plotter) {
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

        return this;
    };

    return t;
};

track.id = iterator(1);

module.exports = exports = track;

},{"tnt.api":6,"tnt.utils":27}],16:[function(require,module,exports){
module.exports = require("./src/newick.js");

},{"./src/newick.js":17}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
var node = require("./src/node.js");
module.exports = exports = node;

},{"./src/node.js":19}],19:[function(require,module,exports){
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


},{"tnt.api":6,"tnt.utils":27}],20:[function(require,module,exports){
// if (typeof tnt === "undefined") {
//     module.exports = tnt = {}
// }
module.exports = tree = require("./src/index.js");
var eventsystem = require("biojs-events");
eventsystem.mixin(tree);
//tnt.utils = require("tnt.utils");
//tnt.tooltip = require("tnt.tooltip");
//tnt.tree = require("./src/index.js");


},{"./src/index.js":22,"biojs-events":5}],21:[function(require,module,exports){
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
        return d.path()(pathData, radial_calc.call(this,pathData));
    };

    var api = apijs (d)
    	.getset ('projection')
    	.getset ('path');

    var coordinateToAngle = function (coord, radius) {
      	var wholeAngle = 2 * Math.PI,
        quarterAngle = wholeAngle / 4;

      	var coordQuad = coord[0] >= 0 ? (coord[1] >= 0 ? 1 : 2) : (coord[1] >= 0 ? 4 : 3),
        coordBaseAngle = Math.abs(Math.asin(coord[1] / radius));

      	// Since this is just based on the angle of the right triangle formed
      	// by the coordinate and the origin, each quad will have different
      	// offsets
      	var coordAngle;
      	switch (coordQuad) {
      	case 1:
      	    coordAngle = quarterAngle - coordBaseAngle;
      	    break;
      	case 2:
      	    coordAngle = quarterAngle + coordBaseAngle;
      	    break;
      	case 3:
      	    coordAngle = 2*quarterAngle + quarterAngle - coordBaseAngle;
      	    break;
      	case 4:
      	    coordAngle = 3*quarterAngle + coordBaseAngle;
      	}
      	return coordAngle;
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
tree.diagonal.vertical = function (useArc) {
    var path = function(pathData, obj) {
        var src = pathData[0];
        var mid = pathData[1];
        var dst = pathData[2];
        var radius = (mid[1] - src[1]) * 2000;

        return "M" + src + " A" + [radius,radius] + " 0 0,0 " + mid + "M" + mid + "L" + dst;
        // return "M" + src + " L" + mid + " L" + dst;
    };

    var projection = function(d) {
        return [d.y, d.x];
    };

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
      	.projection(projection);
};

module.exports = exports = tree.diagonal;

},{"tnt.api":6}],22:[function(require,module,exports){
var tree = require ("./tree.js");
tree.label = require("./label.js");
tree.diagonal = require("./diagonal.js");
tree.layout = require("./layout.js");
tree.node_display = require("./node_display.js");
// tree.node = require("tnt.tree.node");
// tree.parse_newick = require("tnt.newick").parse_newick;
// tree.parse_nhx = require("tnt.newick").parse_nhx;

module.exports = exports = tree;


},{"./diagonal.js":21,"./label.js":23,"./layout.js":24,"./node_display.js":25,"./tree.js":26}],23:[function(require,module,exports){
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


// svg based labels
tree.label.svg = function () {
    var label = tree.label();

    var api = apijs (label)
        .getset("element", function (d) {
            return d.data().element;
        });
    label.display (function (node, layout_type) {
        var n = label.element()(node);
        this.appendChild(n.node());
        return n;
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

},{"tnt.api":6}],24:[function(require,module,exports){
// Based on the code by Ken-ichi Ueda in http://bl.ocks.org/kueda/1036776#d3.phylogram.js

var apijs = require("tnt.api");
var diagonal = require("./diagonal.js");
var tree = {};

tree.layout = function () {

    var l = function () {
    };

    var cluster = d3.layout.cluster()
    	.sort(null)
    	.value(function (d) {return d.length;} )
    	.separation(function () {return 1;});

    var api = apijs (l)
    	.getset ('scale', true)
    	.getset ('max_leaf_label_width', 0)
    	.method ("cluster", cluster)
    	.method('yscale', function () {throw "yscale is not defined in the base object";})
    	.method('adjust_cluster_size', function () {throw "adjust_cluster_size is not defined in the base object"; })
    	.method('width', function () {throw "width is not defined in the base object";})
    	.method('height', function () {throw "height is not defined in the base object";});

    api.method('scale_branch_lengths', function (curr) {
    	if (l.scale() === false) {
    	    return;
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
    	.method ('height', function () { return conf.width; });

    // Changes in width affect changes in r
    layout.width.transform (function (val) {
    	r = val / 2;
    	layout.cluster.size([360, r]);
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

},{"./diagonal.js":21,"tnt.api":6}],25:[function(require,module,exports){
var apijs = require("tnt.api");
var tree = {};

tree.node_display = function () {
    "use strict";

    var n = function (node) {
        var proxy;
        var thisProxy = d3.select(this).select(".tnt_tree_node_proxy");
        if (thisProxy[0][0] === null) {
            proxy = d3.select(this)
                .append("rect")
                .attr("class", "tnt_tree_node_proxy");

        } else {
            proxy = thisProxy;
        }

    	n.display().call(this, node);
        var size = d3.functor(n.size())(node);
        proxy
            .attr("x", (-size))
            .attr("y", (-size))
            .attr("width", (size * 2))
            .attr("height", (size * 2))
    };

    var api = apijs (n)
    	.getset("size", 4.4)
    	.getset("fill", "black")
    	.getset("stroke", "black")
    	.getset("stroke_width", "1px")
    	.getset("display", function () {
            throw "display is not defined in the base object";
        });
    api.method("reset", function () {
        d3.select(this)
            .selectAll("*:not(.tnt_tree_node_proxy)")
            .remove();
    });

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
            .attr("class", "tnt_node_display_elem");
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
            return -s;
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
        .attr("class", "tnt_node_display_elem");
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
        .attr("class", "tnt_node_display_elem");
    });

    return n;
};

// tree.node_display.cond = function () {
//     var n = tree.node_display();
//
//     // conditions are objects with
//     // name : a name for this display
//     // callback: the condition to apply (receives a tnt.node)
//     // display: a node_display
//     var conds = [];
//
//     n.display (function (node) {
//         var s = d3.functor(n.size())(node);
//         for (var i=0; i<conds.length; i++) {
//             var cond = conds[i];
//             // For each node, the first condition met is used
//             if (d3.functor(cond.callback).call(this, node) === true) {
//                 cond.display.call(this, node);
//                 break;
//             }
//         }
//     });
//
//     var api = apijs(n);
//
//     api.method("add", function (name, cbak, node_display) {
//         conds.push({ name : name,
//             callback : cbak,
//             display : node_display
//         });
//         return n;
//     });
//
//     api.method("reset", function () {
//         conds = [];
//         return n;
//     });
//
//     api.method("update", function (name, cbak, new_display) {
//         for (var i=0; i<conds.length; i++) {
//             if (conds[i].name === name) {
//                 conds[i].callback = cbak;
//                 conds[i].display = new_display;
//             }
//         }
//         return n;
//     });
//
//     return n;
//
// };

module.exports = exports = tree.node_display;

},{"tnt.api":6}],26:[function(require,module,exports){
var apijs = require("tnt.api");
var tnt_tree_node = require("tnt.tree.node");

var tree = function () {
    "use strict";

    var dispatch = d3.dispatch ("click", "dblclick", "mouseover", "mouseout", "load");

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
    // var focused_node;

    // Extra delay in the transitions (TODO: Needed?)
    var delay = 0;

    // Ease of the transitions
    var ease = "cubic-in-out";

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
                return conf.id(d);
            });

    	var new_node = node
    	    .enter().append("g")
    	    .attr("class", function(n) {
        		if (n.children) {
        		    if (n.depth === 0) {
            			return "root tnt_tree_node";
        		    } else {
            			return "inner tnt_tree_node";
        		    }
        		} else {
        		    return "leaf tnt_tree_node";
        		}
        	})
    	    .attr("id", function(d) {
        		return "tnt_tree_node_" + div_id + "_" + d._id;
    	    })
    	    .attr("transform", transform);

    	// display node shape
    	new_node
    	    .each (function (d) {
        		conf.node_display.call(this, tnt_tree_node(d));
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

        dispatch.load();

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
                    return conf.id(d.target);
                });

            // NODES
    	    var node = nodes_g
        		.selectAll("g.tnt_tree_node")
        		.data(curr.nodes, function(d) {
                    return conf.id(d);
                });

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
            			if (n.depth === 0) {
                            return "root tnt_tree_node";
            			} else {
                            return "inner tnt_tree_node";
            			}
        		    } else {
                        return "leaf tnt_tree_node";
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

    	    // // We need to re-create all the nodes again in case they have changed lively (or the layout)
    	    // node.selectAll("*").remove();
    	    // new_node
    		//     .each(function (d) {
        	// 		conf.node_display.call(this, tnt_tree_node(d));
    		//     });
            //
    	    // // We need to re-create all the labels again in case they have changed lively (or the layout)
    	    // new_node
    		//     .each (function (d) {
        	// 		conf.label.call(this, tnt_tree_node(d), conf.layout.type, d3.functor(conf.node_display.size())(tnt_tree_node(d)));
    		//     });

            t.update_nodes();

    	    node
        		.transition()
        		.ease(ease)
        		.duration(conf.duration)
        		.attr("transform", transform);

    	});

        api.method('update_nodes', function () {
            var node = nodes_g
                .selectAll("g.tnt_tree_node");

            // re-create all the nodes again
            // node.selectAll("*").remove();
            node
                .each(function () {
                    conf.node_display.reset.call(this);
                });

            node
                .each(function (d) {
                    //console.log(conf.node_display());
                    conf.node_display.call(this, tnt_tree_node(d));
                });

            // re-create all the labels again
            node
                .each (function (d) {
                    conf.label.call(this, tnt_tree_node(d), conf.layout.type, d3.functor(conf.node_display.size())(tnt_tree_node(d)));
                });

        });
    };

    // API
    var api = apijs (t)
    	.getset (conf);

    // n is the number to interpolate, the second argument can be either "tree" or "pixel" depending
    // if n is set to tree units or pixels units
    api.method ('scale_bar', function (n, units) {
        if (!t.layout().scale()) {
            return;
        }
        if (!units) {
            units = "pixel";
        }
        var val;
        links_g.selectAll("path")
            .each(function (p) {
                if (val) return;
                var d = this.getAttribute("d");

                var pathParts = d.split(/[MLA]/);
                var toStr = pathParts.pop();
                var fromStr = pathParts.pop();

                var from = fromStr.split(",");
                var to = toStr.split(",");

                var deltaX = to[0] - from[0];
                var deltaY = to[1] - from[1];
                var pixelsDist = Math.sqrt(deltaX*deltaX + deltaY*deltaY);

                var source = p.source;
                var target = p.target;

                var branchDist = target._root_dist - source._root_dist;
                if (branchDist) {
                    // Supposing pixelsDist has been passed
                    if (units === "pixel") {
                        val = (branchDist / pixelsDist) * n;
                    } else if (units === "tree") {
                        val = (pixelsDist / branchDist) * n;
                    }
                }

            });
            return val;
        });

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
        base.tree = newtree;
        curr.tree = base.tree;

        tree.trigger("data:hasChanged", base.data);

        return this;
    });

    // TODO: This is only a getter
    api.method ('root', function () {
        return curr.tree;
    });

    // api.method ('subtree', function (curr_nodes, keepSingletons) {
    //     var subtree = base.tree.subtree(curr_nodes, keepSingletons);
    //     curr.data = subtree.data();
    //     curr.tree = subtree;
    //
    //     return this;
    // });

    // api.method ('reroot', function (node, keepSingletons) {
    //     // find
    //     var root = t.root();
    //     var found_node = t.root().find_node(function (n) {
    //         return node.id() === n.id();
    //     });
    //     var subtree = root.subtree(found_node.get_all_leaves(), keepSingletons);
    //
    //     return subtree;
    // });

    return d3.rebind (t, dispatch, "on");
};

module.exports = exports = tree;

},{"tnt.api":6,"tnt.tree.node":18}],27:[function(require,module,exports){
module.exports = require("./src/index.js");

},{"./src/index.js":28}],28:[function(require,module,exports){
// require('fs').readdirSync(__dirname + '/').forEach(function(file) {
//     if (file.match(/.+\.js/g) !== null && file !== __filename) {
// 	var name = file.replace('.js', '');
// 	module.exports[name] = require('./' + file);
//     }
// });

// Same as
var utils = require("./utils.js");
utils.reduce = require("./reduce.js");
utils.png = require("./png.js");
module.exports = exports = utils;

},{"./png.js":29,"./reduce.js":30,"./utils.js":31}],29:[function(require,module,exports){
var png = function () {

    var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

    var scale_factor = 1;
    // var filename = 'image.png';

    // Restrict the css to apply to the following array (hrefs)
    // TODO: substitute this by an array of regexp
    var css; // If undefined, use all stylesheets
    // var inline_images_opt = true; // If true, inline images

    var img_cbak = function () {};

    var png_export = function (from_svg) {
        from_svg = from_svg.node();
        // var svg = div.querySelector('svg');

        var inline_images = function (cbak) {
            var images = d3.select(from_svg)
                .selectAll('image');

            var remaining = images[0].length;
            if (remaining === 0) {
                cbak();
            }

            images
                .each (function () {
                    var image = d3.select(this);
                    var img = new Image();
                    img.onload = function () {
                        var canvas = document.createElement('canvas');
                        var ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        var uri = canvas.toDataURL('image/png');
                        image.attr('href', uri);
                        remaining--;
                        if (remaining === 0) {
                            cbak();
                        }
                    };
                    img.src = image.attr('href');
            });
        };

        var move_children = function (src, dest) {
            var children = src.children || src.childNodes;
            while (children.length > 0) {
                var child = children[0];
                if (child.nodeType !== 1/*Node.ELEMENT_NODE*/) continue;
                dest.appendChild(child);
            }
            return dest;
        };

        var styling = function (dom) {
            var used = "";
            var sheets = document.styleSheets;
            // var sheets = [];
            for (var i=0; i<sheets.length; i++) {
                var href = sheets[i].href || "";
                if (css) {
                    var skip = true;
                    for (var c=0; c<css.length; c++) {
                        if (href.indexOf(css[c]) > -1) {
                            skip = false;
                            break;
                        }
                    }
                    if (skip) {
                        continue;
                    }
                }
                var rules = sheets[i].cssRules || [];
                for (var j = 0; j < rules.length; j++) {
                    var rule = rules[j];
                    if (typeof(rule.style) != "undefined") {
                        var elems = dom.querySelectorAll(rule.selectorText);
                        if (elems.length > 0) {
                            used += rule.selectorText + " { " + rule.style.cssText + " }\n";
                        }
                    }
                }
            }

            // Check if there are <defs> already
            var defs = dom.querySelector("defs") || document.createElement('defs');
            var s = document.createElement('style');
            s.setAttribute('type', 'text/css');
            s.innerHTML = "<![CDATA[\n" + used + "\n]]>";

            // var defs = document.createElement('defs');
            defs.appendChild(s);
            return defs;
        };

        inline_images (function () {
            // var svg = div.querySelector('svg');
            var outer = document.createElement("div");
            var clone = from_svg.cloneNode(true);
            var width = parseInt(clone.getAttribute('width'));
            var height = parseInt(clone.getAttribute('height'));

            clone.setAttribute("version", "1.1");
            clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
            clone.setAttribute("width", width * scale_factor);
            clone.setAttribute("height", height * scale_factor);
            var scaling = document.createElement("g");
            scaling.setAttribute("transform", "scale(" + scale_factor + ")");
            clone.appendChild(move_children(clone, scaling));
            outer.appendChild(clone);

            clone.insertBefore (styling(clone), clone.firstChild);

            var svg = doctype + outer.innerHTML;
            svg = svg.replace ("none", "block"); // In case the svg is not being displayed, it is ignored in FF
            var image = new Image();

            image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
            image.onload = function() {
                var canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                var context = canvas.getContext('2d');
                context.drawImage(image, 0, 0);

                var src = canvas.toDataURL('image/png');
                img_cbak (src);
                // var a = document.createElement('a');
                // a.download = filename;
                // a.href = canvas.toDataURL('image/png');
                // document.body.appendChild(a);
                // a.click();
            };
        });

    };
    png_export.scale_factor = function (f) {
        if (!arguments.length) {
            return scale_factor;
        }
        scale_factor = f;
        return this;
    };

    png_export.callback = function (cbak) {
        if (!arguments.length) {
            return img_cbak;
        }
        img_cbak = cbak;
        return this;
    };

    png_export.stylesheets = function (restrictCss) {
        if (!arguments.length) {
            return css;
        }
        css = restrictCss;
        return this;
    };

    // png_export.filename = function (f) {
    // 	if (!arguments.length) {
    // 	    return filename;
    // 	}
    // 	filename = f;
    // 	return png_export;
    // };

    return png_export;
};

var download = function () {

    var filename = 'image.png';
    var max_size = {
        limit: Infinity,
        onError: function () {
            console.log("image too large");
        }
    };

    var png_export = png()
        .callback (function (src) {
            var a = document.createElement('a');
            a.download = filename;
            a.href = src;
            document.body.appendChild(a);

            if (a.href.length > max_size.limit) {
                a.parentNode.removeChild(a);
                max_size.onError();
            } else {
                a.click();
            }
            // setTimeout(function () {
            //     a.click();
            // }, 3000);
        });

    png_export.filename = function (fn) {
        if (!arguments.length) {
            return filename;
        }
        filename = fn;
        return png_export;
    };

    png_export.limit = function (l) {
        if (!arguments.length) {
            return max_size;
        }
        max_size = l;
        return this;
    };

    return png_export;
};

module.exports = exports = download;

},{}],30:[function(require,module,exports){
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


},{}],31:[function(require,module,exports){

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

},{}],32:[function(require,module,exports){
var apijs = require ("tnt.api");

var ta = function () {
    "use strict";

    var no_track = true;
    var div_id;

    // Defaults
    var tree_conf = {
    	tree : undefined,
    	track : function () {
    	    var t = tnt.board.track()
                .color("#EBF5FF")
                .data(tnt.board.track.data()
                    .update(tnt.board.track.retriever.sync()
                        .retriever (function () {
                            return  [];
                        })
                    ))
                .display(tnt.board.track.feature.block()
                    .color("steelblue")
                    .index(function (d) {
                        return d.start;
                    })
                );

    	    return t;
    	},
    	board : undefined,
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
        		tnt.board.track.id = function () {
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
    	tnt.board.track.id = function () {
    	    return "axis-top";
    	};
    	var axis_top = tnt.board.track()
    	    .height(0)
    	    .color("white")
    	    .display(tnt.board.track.feature.axis()
    		     .orientation("top")
    		    );

    	tnt.board.track.id = function () {
    	    return "axis-bottom";
    	};
    	var axis = tnt.board.track()
    	    .height(18)
    	    .color("white")
    	    .display(tnt.board.track.feature.axis()
    		     .orientation("bottom")
             );

    	if (tree_conf.board) {
    	    if (tree_conf.ruler === 'both' || tree_conf.ruler === 'top') {
        		tree_conf.board
        		    .add_track(axis_top);
    	    }

    	    tree_conf.board
        		.add_track(tracks);

    	    if (tree_conf.ruler === 'both' || tree_conf.ruler === "bottom") {
        		tree_conf.board
        		    .add_track(axis);
    	    }

    	    tree_conf.board(annot_div.node());
    	    tree_conf.board.start();
    	}

    	api.method('update', function () {
    	    tree_conf.tree.update();

    	    if (tree_conf.board) {
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
        		    var curr_track = tree_conf.board.find_track(id);
        		    if (curr_track === undefined) {
            			// New leaf -- no track for it
            			(function (leaf) {
            			    tnt.board.track.id = function () {
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

        		tree_conf.board.tracks(new_tracks);
    	    }
    	});

    	return tree_annot;
    };

    var api = apijs (tree_annot)
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
    	var tracks = tree_conf.board.tracks();
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
    	    });

    	    var n_track;
    	    (function (leaf) {
        		tnt.board.track.id = function () {
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
    	tree_conf.board.start();
    };

    return tree_annot;
};

module.exports = exports = ta;

},{"tnt.api":6}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvZmFrZV80YWViMzk3MS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZS9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvYmlvanMtZXZlbnRzL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5hcGkvc3JjL2FwaS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5ib2FyZC9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5ib2FyZC9zcmMvYm9hcmQuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2RhdGEuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2ZlYXR1cmUuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmJvYXJkL3NyYy9sYXlvdXQuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL3NwaW5uZXIuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL3RyYWNrLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50Lm5ld2ljay9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5uZXdpY2svc3JjL25ld2ljay5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL3NyYy9ub2RlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnRyZWUvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvZGlhZ29uYWwuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvaW5kZXguanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbGFiZWwuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbGF5b3V0LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnRyZWUvc3JjL25vZGVfZGlzcGxheS5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC50cmVlL3NyYy90cmVlLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL2luZGV4LmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9waWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvcG5nLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9yZWR1Y2UuanMiLCIvVXNlcnMvcGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL3V0aWxzLmpzIiwiL1VzZXJzL3BpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9zcmMvdGEuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoaUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzkxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3ZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JmQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCJpZiAodHlwZW9mIHRudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gdG50ID0gcmVxdWlyZShcIi4vc3JjL3RhLmpzXCIpO1xufVxudmFyIGV2ZW50c3lzdGVtID0gcmVxdWlyZSAoXCJiaW9qcy1ldmVudHNcIik7XG5ldmVudHN5c3RlbS5taXhpbiAodG50KTtcbnRudC51dGlscyA9IHJlcXVpcmUgKFwidG50LnV0aWxzXCIpO1xudG50LnRyZWUgPSByZXF1aXJlIChcInRudC50cmVlXCIpO1xudG50LnRyZWUubm9kZSA9IHJlcXVpcmUgKFwidG50LnRyZWUubm9kZVwiKTtcbnRudC50cmVlLnBhcnNlX25ld2ljayA9IHJlcXVpcmUoXCJ0bnQubmV3aWNrXCIpLnBhcnNlX25ld2ljaztcbnRudC50cmVlLnBhcnNlX25oeCA9IHJlcXVpcmUoXCJ0bnQubmV3aWNrXCIpLnBhcnNlX25oeDtcbnRudC5ib2FyZCA9IHJlcXVpcmUgKFwidG50LmJvYXJkXCIpO1xuIiwiLyoqXG4gKiBTdGFuZGFsb25lIGV4dHJhY3Rpb24gb2YgQmFja2JvbmUuRXZlbnRzLCBubyBleHRlcm5hbCBkZXBlbmRlbmN5IHJlcXVpcmVkLlxuICogRGVncmFkZXMgbmljZWx5IHdoZW4gQmFja29uZS91bmRlcnNjb3JlIGFyZSBhbHJlYWR5IGF2YWlsYWJsZSBpbiB0aGUgY3VycmVudFxuICogZ2xvYmFsIGNvbnRleHQuXG4gKlxuICogTm90ZSB0aGF0IGRvY3Mgc3VnZ2VzdCB0byB1c2UgdW5kZXJzY29yZSdzIGBfLmV4dGVuZCgpYCBtZXRob2QgdG8gYWRkIEV2ZW50c1xuICogc3VwcG9ydCB0byBzb21lIGdpdmVuIG9iamVjdC4gQSBgbWl4aW4oKWAgbWV0aG9kIGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBFdmVudHNcbiAqIHByb3RvdHlwZSB0byBhdm9pZCB1c2luZyB1bmRlcnNjb3JlIGZvciB0aGF0IHNvbGUgcHVycG9zZTpcbiAqXG4gKiAgICAgdmFyIG15RXZlbnRFbWl0dGVyID0gQmFja2JvbmVFdmVudHMubWl4aW4oe30pO1xuICpcbiAqIE9yIGZvciBhIGZ1bmN0aW9uIGNvbnN0cnVjdG9yOlxuICpcbiAqICAgICBmdW5jdGlvbiBNeUNvbnN0cnVjdG9yKCl7fVxuICogICAgIE15Q29uc3RydWN0b3IucHJvdG90eXBlLmZvbyA9IGZ1bmN0aW9uKCl7fVxuICogICAgIEJhY2tib25lRXZlbnRzLm1peGluKE15Q29uc3RydWN0b3IucHJvdG90eXBlKTtcbiAqXG4gKiAoYykgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBJbmMuXG4gKiAoYykgMjAxMyBOaWNvbGFzIFBlcnJpYXVsdFxuICovXG4vKiBnbG9iYWwgZXhwb3J0czp0cnVlLCBkZWZpbmUsIG1vZHVsZSAqL1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgcm9vdCA9IHRoaXMsXG4gICAgICBuYXRpdmVGb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2gsXG4gICAgICBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gICAgICBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZSxcbiAgICAgIGlkQ291bnRlciA9IDA7XG5cbiAgLy8gUmV0dXJucyBhIHBhcnRpYWwgaW1wbGVtZW50YXRpb24gbWF0Y2hpbmcgdGhlIG1pbmltYWwgQVBJIHN1YnNldCByZXF1aXJlZFxuICAvLyBieSBCYWNrYm9uZS5FdmVudHNcbiAgZnVuY3Rpb24gbWluaXNjb3JlKCkge1xuICAgIHJldHVybiB7XG4gICAgICBrZXlzOiBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiBvYmogIT09IFwiZnVuY3Rpb25cIiB8fCBvYmogPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwia2V5cygpIGNhbGxlZCBvbiBhIG5vbi1vYmplY3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtleSwga2V5cyA9IFtdO1xuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIGtleXNba2V5cy5sZW5ndGhdID0ga2V5O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga2V5cztcbiAgICAgIH0sXG5cbiAgICAgIHVuaXF1ZUlkOiBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICAgICAgdmFyIGlkID0gKytpZENvdW50ZXIgKyAnJztcbiAgICAgICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gICAgICB9LFxuXG4gICAgICBoYXM6IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgICAgIH0sXG5cbiAgICAgIGVhY2g6IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm47XG4gICAgICAgIGlmIChuYXRpdmVGb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGFzKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXldLCBrZXksIG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBvbmNlOiBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgIHZhciByYW4gPSBmYWxzZSwgbWVtbztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChyYW4pIHJldHVybiBtZW1vO1xuICAgICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICBmdW5jID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgdmFyIF8gPSBtaW5pc2NvcmUoKSwgRXZlbnRzO1xuXG4gIC8vIEJhY2tib25lLkV2ZW50c1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBBIG1vZHVsZSB0aGF0IGNhbiBiZSBtaXhlZCBpbiB0byAqYW55IG9iamVjdCogaW4gb3JkZXIgdG8gcHJvdmlkZSBpdCB3aXRoXG4gIC8vIGN1c3RvbSBldmVudHMuIFlvdSBtYXkgYmluZCB3aXRoIGBvbmAgb3IgcmVtb3ZlIHdpdGggYG9mZmAgY2FsbGJhY2tcbiAgLy8gZnVuY3Rpb25zIHRvIGFuIGV2ZW50OyBgdHJpZ2dlcmAtaW5nIGFuIGV2ZW50IGZpcmVzIGFsbCBjYWxsYmFja3MgaW5cbiAgLy8gc3VjY2Vzc2lvbi5cbiAgLy9cbiAgLy8gICAgIHZhciBvYmplY3QgPSB7fTtcbiAgLy8gICAgIF8uZXh0ZW5kKG9iamVjdCwgQmFja2JvbmUuRXZlbnRzKTtcbiAgLy8gICAgIG9iamVjdC5vbignZXhwYW5kJywgZnVuY3Rpb24oKXsgYWxlcnQoJ2V4cGFuZGVkJyk7IH0pO1xuICAvLyAgICAgb2JqZWN0LnRyaWdnZXIoJ2V4cGFuZCcpO1xuICAvL1xuICBFdmVudHMgPSB7XG5cbiAgICAvLyBCaW5kIGFuIGV2ZW50IHRvIGEgYGNhbGxiYWNrYCBmdW5jdGlvbi4gUGFzc2luZyBgXCJhbGxcImAgd2lsbCBiaW5kXG4gICAgLy8gdGhlIGNhbGxiYWNrIHRvIGFsbCBldmVudHMgZmlyZWQuXG4gICAgb246IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAnb24nLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSB8fCAhY2FsbGJhY2spIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdIHx8ICh0aGlzLl9ldmVudHNbbmFtZV0gPSBbXSk7XG4gICAgICBldmVudHMucHVzaCh7Y2FsbGJhY2s6IGNhbGxiYWNrLCBjb250ZXh0OiBjb250ZXh0LCBjdHg6IGNvbnRleHQgfHwgdGhpc30pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEJpbmQgYW4gZXZlbnQgdG8gb25seSBiZSB0cmlnZ2VyZWQgYSBzaW5nbGUgdGltZS4gQWZ0ZXIgdGhlIGZpcnN0IHRpbWVcbiAgICAvLyB0aGUgY2FsbGJhY2sgaXMgaW52b2tlZCwgaXQgd2lsbCBiZSByZW1vdmVkLlxuICAgIG9uY2U6IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAnb25jZScsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pIHx8ICFjYWxsYmFjaykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgb25jZSA9IF8ub25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5vZmYobmFtZSwgb25jZSk7XG4gICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9KTtcbiAgICAgIG9uY2UuX2NhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICByZXR1cm4gdGhpcy5vbihuYW1lLCBvbmNlLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIG9uZSBvciBtYW55IGNhbGxiYWNrcy4gSWYgYGNvbnRleHRgIGlzIG51bGwsIHJlbW92ZXMgYWxsXG4gICAgLy8gY2FsbGJhY2tzIHdpdGggdGhhdCBmdW5jdGlvbi4gSWYgYGNhbGxiYWNrYCBpcyBudWxsLCByZW1vdmVzIGFsbFxuICAgIC8vIGNhbGxiYWNrcyBmb3IgdGhlIGV2ZW50LiBJZiBgbmFtZWAgaXMgbnVsbCwgcmVtb3ZlcyBhbGwgYm91bmRcbiAgICAvLyBjYWxsYmFja3MgZm9yIGFsbCBldmVudHMuXG4gICAgb2ZmOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgdmFyIHJldGFpbiwgZXYsIGV2ZW50cywgbmFtZXMsIGksIGwsIGosIGs7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhZXZlbnRzQXBpKHRoaXMsICdvZmYnLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSkgcmV0dXJuIHRoaXM7XG4gICAgICBpZiAoIW5hbWUgJiYgIWNhbGxiYWNrICYmICFjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgbmFtZXMgPSBuYW1lID8gW25hbWVdIDogXy5rZXlzKHRoaXMuX2V2ZW50cyk7XG4gICAgICBmb3IgKGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgaWYgKGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXSkge1xuICAgICAgICAgIHRoaXMuX2V2ZW50c1tuYW1lXSA9IHJldGFpbiA9IFtdO1xuICAgICAgICAgIGlmIChjYWxsYmFjayB8fCBjb250ZXh0KSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBrID0gZXZlbnRzLmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgICBldiA9IGV2ZW50c1tqXTtcbiAgICAgICAgICAgICAgaWYgKChjYWxsYmFjayAmJiBjYWxsYmFjayAhPT0gZXYuY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2LmNhbGxiYWNrLl9jYWxsYmFjaykgfHxcbiAgICAgICAgICAgICAgICAgIChjb250ZXh0ICYmIGNvbnRleHQgIT09IGV2LmNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0YWluLnB1c2goZXYpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghcmV0YWluLmxlbmd0aCkgZGVsZXRlIHRoaXMuX2V2ZW50c1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gVHJpZ2dlciBvbmUgb3IgbWFueSBldmVudHMsIGZpcmluZyBhbGwgYm91bmQgY2FsbGJhY2tzLiBDYWxsYmFja3MgYXJlXG4gICAgLy8gcGFzc2VkIHRoZSBzYW1lIGFyZ3VtZW50cyBhcyBgdHJpZ2dlcmAgaXMsIGFwYXJ0IGZyb20gdGhlIGV2ZW50IG5hbWVcbiAgICAvLyAodW5sZXNzIHlvdSdyZSBsaXN0ZW5pbmcgb24gYFwiYWxsXCJgLCB3aGljaCB3aWxsIGNhdXNlIHlvdXIgY2FsbGJhY2sgdG9cbiAgICAvLyByZWNlaXZlIHRoZSB0cnVlIG5hbWUgb2YgdGhlIGV2ZW50IGFzIHRoZSBmaXJzdCBhcmd1bWVudCkuXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24obmFtZSkge1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAndHJpZ2dlcicsIG5hbWUsIGFyZ3MpKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICB2YXIgYWxsRXZlbnRzID0gdGhpcy5fZXZlbnRzLmFsbDtcbiAgICAgIGlmIChldmVudHMpIHRyaWdnZXJFdmVudHMoZXZlbnRzLCBhcmdzKTtcbiAgICAgIGlmIChhbGxFdmVudHMpIHRyaWdnZXJFdmVudHMoYWxsRXZlbnRzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFRlbGwgdGhpcyBvYmplY3QgdG8gc3RvcCBsaXN0ZW5pbmcgdG8gZWl0aGVyIHNwZWNpZmljIGV2ZW50cyAuLi4gb3JcbiAgICAvLyB0byBldmVyeSBvYmplY3QgaXQncyBjdXJyZW50bHkgbGlzdGVuaW5nIHRvLlxuICAgIHN0b3BMaXN0ZW5pbmc6IGZ1bmN0aW9uKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnM7XG4gICAgICBpZiAoIWxpc3RlbmVycykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgZGVsZXRlTGlzdGVuZXIgPSAhbmFtZSAmJiAhY2FsbGJhY2s7XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSBjYWxsYmFjayA9IHRoaXM7XG4gICAgICBpZiAob2JqKSAobGlzdGVuZXJzID0ge30pW29iai5fbGlzdGVuZXJJZF0gPSBvYmo7XG4gICAgICBmb3IgKHZhciBpZCBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgbGlzdGVuZXJzW2lkXS5vZmYobmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgICBpZiAoZGVsZXRlTGlzdGVuZXIpIGRlbGV0ZSB0aGlzLl9saXN0ZW5lcnNbaWRdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gIH07XG5cbiAgLy8gUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gc3BsaXQgZXZlbnQgc3RyaW5ncy5cbiAgdmFyIGV2ZW50U3BsaXR0ZXIgPSAvXFxzKy87XG5cbiAgLy8gSW1wbGVtZW50IGZhbmN5IGZlYXR1cmVzIG9mIHRoZSBFdmVudHMgQVBJIHN1Y2ggYXMgbXVsdGlwbGUgZXZlbnRcbiAgLy8gbmFtZXMgYFwiY2hhbmdlIGJsdXJcImAgYW5kIGpRdWVyeS1zdHlsZSBldmVudCBtYXBzIGB7Y2hhbmdlOiBhY3Rpb259YFxuICAvLyBpbiB0ZXJtcyBvZiB0aGUgZXhpc3RpbmcgQVBJLlxuICB2YXIgZXZlbnRzQXBpID0gZnVuY3Rpb24ob2JqLCBhY3Rpb24sIG5hbWUsIHJlc3QpIHtcbiAgICBpZiAoIW5hbWUpIHJldHVybiB0cnVlO1xuXG4gICAgLy8gSGFuZGxlIGV2ZW50IG1hcHMuXG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgZm9yICh2YXIga2V5IGluIG5hbWUpIHtcbiAgICAgICAgb2JqW2FjdGlvbl0uYXBwbHkob2JqLCBba2V5LCBuYW1lW2tleV1dLmNvbmNhdChyZXN0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIHNwYWNlIHNlcGFyYXRlZCBldmVudCBuYW1lcy5cbiAgICBpZiAoZXZlbnRTcGxpdHRlci50ZXN0KG5hbWUpKSB7XG4gICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KGV2ZW50U3BsaXR0ZXIpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgb2JqW2FjdGlvbl0uYXBwbHkob2JqLCBbbmFtZXNbaV1dLmNvbmNhdChyZXN0KSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gQSBkaWZmaWN1bHQtdG8tYmVsaWV2ZSwgYnV0IG9wdGltaXplZCBpbnRlcm5hbCBkaXNwYXRjaCBmdW5jdGlvbiBmb3JcbiAgLy8gdHJpZ2dlcmluZyBldmVudHMuIFRyaWVzIHRvIGtlZXAgdGhlIHVzdWFsIGNhc2VzIHNwZWVkeSAobW9zdCBpbnRlcm5hbFxuICAvLyBCYWNrYm9uZSBldmVudHMgaGF2ZSAzIGFyZ3VtZW50cykuXG4gIHZhciB0cmlnZ2VyRXZlbnRzID0gZnVuY3Rpb24oZXZlbnRzLCBhcmdzKSB7XG4gICAgdmFyIGV2LCBpID0gLTEsIGwgPSBldmVudHMubGVuZ3RoLCBhMSA9IGFyZ3NbMF0sIGEyID0gYXJnc1sxXSwgYTMgPSBhcmdzWzJdO1xuICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMDogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgpOyByZXR1cm47XG4gICAgICBjYXNlIDE6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSk7IHJldHVybjtcbiAgICAgIGNhc2UgMjogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExLCBhMik7IHJldHVybjtcbiAgICAgIGNhc2UgMzogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExLCBhMiwgYTMpOyByZXR1cm47XG4gICAgICBkZWZhdWx0OiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5hcHBseShldi5jdHgsIGFyZ3MpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgbGlzdGVuTWV0aG9kcyA9IHtsaXN0ZW5UbzogJ29uJywgbGlzdGVuVG9PbmNlOiAnb25jZSd9O1xuXG4gIC8vIEludmVyc2lvbi1vZi1jb250cm9sIHZlcnNpb25zIG9mIGBvbmAgYW5kIGBvbmNlYC4gVGVsbCAqdGhpcyogb2JqZWN0IHRvXG4gIC8vIGxpc3RlbiB0byBhbiBldmVudCBpbiBhbm90aGVyIG9iamVjdCAuLi4ga2VlcGluZyB0cmFjayBvZiB3aGF0IGl0J3NcbiAgLy8gbGlzdGVuaW5nIHRvLlxuICBfLmVhY2gobGlzdGVuTWV0aG9kcywgZnVuY3Rpb24oaW1wbGVtZW50YXRpb24sIG1ldGhvZCkge1xuICAgIEV2ZW50c1ttZXRob2RdID0gZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycyB8fCAodGhpcy5fbGlzdGVuZXJzID0ge30pO1xuICAgICAgdmFyIGlkID0gb2JqLl9saXN0ZW5lcklkIHx8IChvYmouX2xpc3RlbmVySWQgPSBfLnVuaXF1ZUlkKCdsJykpO1xuICAgICAgbGlzdGVuZXJzW2lkXSA9IG9iajtcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIGNhbGxiYWNrID0gdGhpcztcbiAgICAgIG9ialtpbXBsZW1lbnRhdGlvbl0obmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWxpYXNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gIEV2ZW50cy5iaW5kICAgPSBFdmVudHMub247XG4gIEV2ZW50cy51bmJpbmQgPSBFdmVudHMub2ZmO1xuXG4gIC8vIE1peGluIHV0aWxpdHlcbiAgRXZlbnRzLm1peGluID0gZnVuY3Rpb24ocHJvdG8pIHtcbiAgICB2YXIgZXhwb3J0cyA9IFsnb24nLCAnb25jZScsICdvZmYnLCAndHJpZ2dlcicsICdzdG9wTGlzdGVuaW5nJywgJ2xpc3RlblRvJyxcbiAgICAgICAgICAgICAgICAgICAnbGlzdGVuVG9PbmNlJywgJ2JpbmQnLCAndW5iaW5kJ107XG4gICAgXy5lYWNoKGV4cG9ydHMsIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHByb3RvW25hbWVdID0gdGhpc1tuYW1lXTtcbiAgICB9LCB0aGlzKTtcbiAgICByZXR1cm4gcHJvdG87XG4gIH07XG5cbiAgLy8gRXhwb3J0IEV2ZW50cyBhcyBCYWNrYm9uZUV2ZW50cyBkZXBlbmRpbmcgb24gY3VycmVudCBjb250ZXh0XG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50cztcbiAgICB9XG4gICAgZXhwb3J0cy5CYWNrYm9uZUV2ZW50cyA9IEV2ZW50cztcbiAgfWVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT0gXCJvYmplY3RcIikge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBFdmVudHM7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5CYWNrYm9uZUV2ZW50cyA9IEV2ZW50cztcbiAgfVxufSkodGhpcyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmUnKTtcbiIsInZhciBldmVudHMgPSByZXF1aXJlKFwiYmFja2JvbmUtZXZlbnRzLXN0YW5kYWxvbmVcIik7XG5cbmV2ZW50cy5vbkFsbCA9IGZ1bmN0aW9uKGNhbGxiYWNrLGNvbnRleHQpe1xuICB0aGlzLm9uKFwiYWxsXCIsIGNhbGxiYWNrLGNvbnRleHQpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIE1peGluIHV0aWxpdHlcbmV2ZW50cy5vbGRNaXhpbiA9IGV2ZW50cy5taXhpbjtcbmV2ZW50cy5taXhpbiA9IGZ1bmN0aW9uKHByb3RvKSB7XG4gIGV2ZW50cy5vbGRNaXhpbihwcm90byk7XG4gIC8vIGFkZCBjdXN0b20gb25BbGxcbiAgdmFyIGV4cG9ydHMgPSBbJ29uQWxsJ107XG4gIGZvcih2YXIgaT0wOyBpIDwgZXhwb3J0cy5sZW5ndGg7aSsrKXtcbiAgICB2YXIgbmFtZSA9IGV4cG9ydHNbaV07XG4gICAgcHJvdG9bbmFtZV0gPSB0aGlzW25hbWVdO1xuICB9XG4gIHJldHVybiBwcm90bztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXZlbnRzO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvYXBpLmpzXCIpO1xuIiwidmFyIGFwaSA9IGZ1bmN0aW9uICh3aG8pIHtcblxuICAgIHZhciBfbWV0aG9kcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIG0gPSBbXTtcblxuXHRtLmFkZF9iYXRjaCA9IGZ1bmN0aW9uIChvYmopIHtcblx0ICAgIG0udW5zaGlmdChvYmopO1xuXHR9O1xuXG5cdG0udXBkYXRlID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtLmxlbmd0aDsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgcCBpbiBtW2ldKSB7XG5cdFx0ICAgIGlmIChwID09PSBtZXRob2QpIHtcblx0XHRcdG1baV1bcF0gPSB2YWx1ZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdCAgICB9XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cdG0uYWRkID0gZnVuY3Rpb24gKG1ldGhvZCwgdmFsdWUpIHtcblx0ICAgIGlmIChtLnVwZGF0ZSAobWV0aG9kLCB2YWx1ZSkgKSB7XG5cdCAgICB9IGVsc2Uge1xuXHRcdHZhciByZWcgPSB7fTtcblx0XHRyZWdbbWV0aG9kXSA9IHZhbHVlO1xuXHRcdG0uYWRkX2JhdGNoIChyZWcpO1xuXHQgICAgfVxuXHR9O1xuXG5cdG0uZ2V0ID0gZnVuY3Rpb24gKG1ldGhvZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0cmV0dXJuIG1baV1bcF07XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdH07XG5cblx0cmV0dXJuIG07XG4gICAgfTtcblxuICAgIHZhciBtZXRob2RzICAgID0gX21ldGhvZHMoKTtcbiAgICB2YXIgYXBpID0gZnVuY3Rpb24gKCkge307XG5cbiAgICBhcGkuY2hlY2sgPSBmdW5jdGlvbiAobWV0aG9kLCBjaGVjaywgbXNnKSB7XG5cdGlmIChtZXRob2QgaW5zdGFuY2VvZiBBcnJheSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG1ldGhvZC5sZW5ndGg7IGkrKykge1xuXHRcdGFwaS5jaGVjayhtZXRob2RbaV0sIGNoZWNrLCBtc2cpO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLmNoZWNrKGNoZWNrLCBtc2cpO1xuXHR9IGVsc2Uge1xuXHQgICAgd2hvW21ldGhvZF0uY2hlY2soY2hlY2ssIG1zZyk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChtZXRob2QsIGNiYWspIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLnRyYW5zZm9ybSAobWV0aG9kW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0ICAgIHJldHVybjtcblx0fVxuXG5cdGlmICh0eXBlb2YgKG1ldGhvZCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIG1ldGhvZC50cmFuc2Zvcm0gKGNiYWspO1xuXHR9IGVsc2Uge1xuXHQgICAgd2hvW21ldGhvZF0udHJhbnNmb3JtKGNiYWspO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHZhciBhdHRhY2hfbWV0aG9kID0gZnVuY3Rpb24gKG1ldGhvZCwgb3B0cykge1xuXHR2YXIgY2hlY2tzID0gW107XG5cdHZhciB0cmFuc2Zvcm1zID0gW107XG5cblx0dmFyIGdldHRlciA9IG9wdHMub25fZ2V0dGVyIHx8IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBtZXRob2RzLmdldChtZXRob2QpO1xuXHR9O1xuXG5cdHZhciBzZXR0ZXIgPSBvcHRzLm9uX3NldHRlciB8fCBmdW5jdGlvbiAoeCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPHRyYW5zZm9ybXMubGVuZ3RoOyBpKyspIHtcblx0XHR4ID0gdHJhbnNmb3Jtc1tpXSh4KTtcblx0ICAgIH1cblxuXHQgICAgZm9yICh2YXIgaj0wOyBqPGNoZWNrcy5sZW5ndGg7IGorKykge1xuXHRcdGlmICghY2hlY2tzW2pdLmNoZWNrKHgpKSB7XG5cdFx0ICAgIHZhciBtc2cgPSBjaGVja3Nbal0ubXNnIHx8IFxuXHRcdFx0KFwiVmFsdWUgXCIgKyB4ICsgXCIgZG9lc24ndCBzZWVtIHRvIGJlIHZhbGlkIGZvciB0aGlzIG1ldGhvZFwiKTtcblx0XHQgICAgdGhyb3cgKG1zZyk7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgbWV0aG9kcy5hZGQobWV0aG9kLCB4KTtcblx0fTtcblxuXHR2YXIgbmV3X21ldGhvZCA9IGZ1bmN0aW9uIChuZXdfdmFsKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gZ2V0dGVyKCk7XG5cdCAgICB9XG5cdCAgICBzZXR0ZXIobmV3X3ZhbCk7XG5cdCAgICByZXR1cm4gd2hvOyAvLyBSZXR1cm4gdGhpcz9cblx0fTtcblx0bmV3X21ldGhvZC5jaGVjayA9IGZ1bmN0aW9uIChjYmFrLCBtc2cpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBjaGVja3M7XG5cdCAgICB9XG5cdCAgICBjaGVja3MucHVzaCAoe2NoZWNrIDogY2Jhayxcblx0XHRcdCAgbXNnICAgOiBtc2d9KTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHR9O1xuXHRuZXdfbWV0aG9kLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gdHJhbnNmb3Jtcztcblx0ICAgIH1cblx0ICAgIHRyYW5zZm9ybXMucHVzaChjYmFrKTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdHdob1ttZXRob2RdID0gbmV3X21ldGhvZDtcbiAgICB9O1xuXG4gICAgdmFyIGdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgb3B0cykge1xuXHRpZiAodHlwZW9mIChwYXJhbSkgPT09ICdvYmplY3QnKSB7XG5cdCAgICBtZXRob2RzLmFkZF9iYXRjaCAocGFyYW0pO1xuXHQgICAgZm9yICh2YXIgcCBpbiBwYXJhbSkge1xuXHRcdGF0dGFjaF9tZXRob2QgKHAsIG9wdHMpO1xuXHQgICAgfVxuXHR9IGVsc2Uge1xuXHQgICAgbWV0aG9kcy5hZGQgKHBhcmFtLCBvcHRzLmRlZmF1bHRfdmFsdWUpO1xuXHQgICAgYXR0YWNoX21ldGhvZCAocGFyYW0sIG9wdHMpO1xuXHR9XG4gICAgfTtcblxuICAgIGFwaS5nZXRzZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmfSk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLmdldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9zZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgZ2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBzZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fc2V0dGVyIDogb25fc2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5zZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHR2YXIgb25fZ2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdGhyb3cgKFwiTWV0aG9kIGRlZmluZWQgb25seSBhcyBhIHNldHRlciAoeW91IGFyZSB0cnlpbmcgdG8gdXNlIGl0IGFzIGEgZ2V0dGVyXCIpO1xuXHR9O1xuXG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWYsXG5cdFx0ICAgICAgIG9uX2dldHRlciA6IG9uX2dldHRlcn1cblx0ICAgICAgKTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kID0gZnVuY3Rpb24gKG5hbWUsIGNiYWspIHtcblx0aWYgKHR5cGVvZiAobmFtZSkgPT09ICdvYmplY3QnKSB7XG5cdCAgICBmb3IgKHZhciBwIGluIG5hbWUpIHtcblx0XHR3aG9bcF0gPSBuYW1lW3BdO1xuXHQgICAgfVxuXHR9IGVsc2Uge1xuXHQgICAgd2hvW25hbWVdID0gY2Jhaztcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXBpO1xuICAgIFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gYXBpOyIsIi8vIGlmICh0eXBlb2YgdG50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4vLyAgICAgbW9kdWxlLmV4cG9ydHMgPSB0bnQgPSB7fVxuLy8gfVxuLy8gdG50LnV0aWxzID0gcmVxdWlyZShcInRudC51dGlsc1wiKTtcbi8vIHRudC50b29sdGlwID0gcmVxdWlyZShcInRudC50b29sdGlwXCIpO1xuLy8gdG50LmJvYXJkID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleFwiKTtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUgKFwidG50LmFwaVwiKTtcbnZhciBkZWZlckNhbmNlbCA9IHJlcXVpcmUgKFwidG50LnV0aWxzXCIpLmRlZmVyX2NhbmNlbDtcblxudmFyIGJvYXJkID0gZnVuY3Rpb24oKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvLy8vIFByaXZhdGUgdmFyc1xuICAgIHZhciBzdmc7XG4gICAgdmFyIGRpdl9pZDtcbiAgICB2YXIgdHJhY2tzID0gW107XG4gICAgdmFyIG1pbl93aWR0aCA9IDUwO1xuICAgIHZhciBoZWlnaHQgICAgPSAwOyAgICAvLyBUaGlzIGlzIHRoZSBnbG9iYWwgaGVpZ2h0IGluY2x1ZGluZyBhbGwgdGhlIHRyYWNrc1xuICAgIHZhciB3aWR0aCAgICAgPSA5MjA7XG4gICAgdmFyIGhlaWdodF9vZmZzZXQgPSAyMDtcbiAgICB2YXIgbG9jID0ge1xuXHRzcGVjaWVzICA6IHVuZGVmaW5lZCxcblx0Y2hyICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgIGZyb20gICAgIDogMCxcbiAgICAgICAgdG8gICAgICAgOiA1MDBcbiAgICB9O1xuXG4gICAgLy8gTGltaXQgY2Fwc1xuICAgIHZhciBjYXBzID0ge1xuICAgICAgICBsZWZ0IDogdW5kZWZpbmVkLFxuICAgICAgICByaWdodCA6IHVuZGVmaW5lZFxuICAgIH07XG4gICAgdmFyIGNhcF93aWR0aCA9IDM7XG5cblxuICAgIC8vIFRPRE86IFdlIGhhdmUgbm93IGJhY2tncm91bmQgY29sb3IgaW4gdGhlIHRyYWNrcy4gQ2FuIHRoaXMgYmUgcmVtb3ZlZD9cbiAgICAvLyBJdCBsb29rcyBsaWtlIGl0IGlzIHVzZWQgaW4gdGhlIHRvby13aWRlIHBhbmUgZXRjLCBidXQgaXQgbWF5IG5vdCBiZSBuZWVkZWQgYW55bW9yZVxuICAgIHZhciBiZ0NvbG9yICAgPSBkMy5yZ2IoJyNGOEZCRUYnKTsgLy8jRjhGQkVGXG4gICAgdmFyIHBhbmU7IC8vIERyYWdnYWJsZSBwYW5lXG4gICAgdmFyIHN2Z19nO1xuICAgIHZhciB4U2NhbGU7XG4gICAgdmFyIHpvb21FdmVudEhhbmRsZXIgPSBkMy5iZWhhdmlvci56b29tKCk7XG4gICAgdmFyIGxpbWl0cyA9IHtcbiAgICAgICAgbWluIDogMCxcbiAgICAgICAgbWF4IDogMTAwMCxcbiAgICAgICAgem9vbV9vdXQgOiAxMDAwLFxuICAgICAgICB6b29tX2luICA6IDEwMFxuICAgIH07XG4gICAgdmFyIGR1ciA9IDUwMDtcbiAgICB2YXIgZHJhZ19hbGxvd2VkID0gdHJ1ZTtcblxuICAgIHZhciBleHBvcnRzID0ge1xuICAgICAgICBlYXNlICAgICAgICAgIDogZDMuZWFzZShcImN1YmljLWluLW91dFwiKSxcbiAgICAgICAgZXh0ZW5kX2NhbnZhcyA6IHtcbiAgICAgICAgICAgIGxlZnQgOiAwLFxuICAgICAgICAgICAgcmlnaHQgOiAwXG4gICAgICAgIH0sXG4gICAgICAgIHNob3dfZnJhbWUgOiB0cnVlXG4gICAgICAgIC8vIGxpbWl0cyAgICAgICAgOiBmdW5jdGlvbiAoKSB7dGhyb3cgXCJUaGUgbGltaXRzIG1ldGhvZCBzaG91bGQgYmUgZGVmaW5lZFwifVxuICAgIH07XG5cbiAgICAvLyBUaGUgcmV0dXJuZWQgY2xvc3VyZSAvIG9iamVjdFxuICAgIHZhciB0cmFja192aXMgPSBmdW5jdGlvbihkaXYpIHtcbiAgICBcdGRpdl9pZCA9IGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKTtcblxuICAgIFx0Ly8gVGhlIG9yaWdpbmFsIGRpdiBpcyBjbGFzc2VkIHdpdGggdGhlIHRudCBjbGFzc1xuICAgIFx0ZDMuc2VsZWN0KGRpdilcbiAgICBcdCAgICAuY2xhc3NlZChcInRudFwiLCB0cnVlKTtcblxuICAgIFx0Ly8gVE9ETzogTW92ZSB0aGUgc3R5bGluZyB0byB0aGUgc2Nzcz9cbiAgICBcdHZhciBicm93c2VyRGl2ID0gZDMuc2VsZWN0KGRpdilcbiAgICBcdCAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgXHQgICAgLmF0dHIoXCJpZFwiLCBcInRudF9cIiArIGRpdl9pZClcbiAgICBcdCAgICAuc3R5bGUoXCJwb3NpdGlvblwiLCBcInJlbGF0aXZlXCIpXG4gICAgXHQgICAgLmNsYXNzZWQoXCJ0bnRfZnJhbWVkXCIsIGV4cG9ydHMuc2hvd19mcmFtZSA/IHRydWUgOiBmYWxzZSlcbiAgICBcdCAgICAuc3R5bGUoXCJ3aWR0aFwiLCAod2lkdGggKyBjYXBfd2lkdGgqMiArIGV4cG9ydHMuZXh0ZW5kX2NhbnZhcy5yaWdodCArIGV4cG9ydHMuZXh0ZW5kX2NhbnZhcy5sZWZ0KSArIFwicHhcIik7XG5cbiAgICBcdHZhciBncm91cERpdiA9IGJyb3dzZXJEaXZcbiAgICBcdCAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ncm91cERpdlwiKTtcblxuICAgIFx0Ly8gVGhlIFNWR1xuICAgIFx0c3ZnID0gZ3JvdXBEaXZcbiAgICBcdCAgICAuYXBwZW5kKFwic3ZnXCIpXG4gICAgXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9zdmdcIilcbiAgICBcdCAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuICAgIFx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICBcdCAgICAuYXR0cihcInBvaW50ZXItZXZlbnRzXCIsIFwiYWxsXCIpO1xuXG4gICAgXHRzdmdfZyA9IHN2Z1xuICAgIFx0ICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwyMClcIilcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwiZ1wiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ1wiKTtcblxuICAgIFx0Ly8gY2Fwc1xuICAgIFx0Y2Fwcy5sZWZ0ID0gc3ZnX2dcbiAgICBcdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgIFx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfXCIgKyBkaXZfaWQgKyBcIl81cGNhcFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieFwiLCAwKVxuICAgIFx0ICAgIC5hdHRyKFwieVwiLCAwKVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgMClcbiAgICBcdCAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXG4gICAgXHQgICAgLmF0dHIoXCJmaWxsXCIsIFwicmVkXCIpO1xuICAgIFx0Y2Fwcy5yaWdodCA9IHN2Z19nXG4gICAgXHQgICAgLmFwcGVuZChcInJlY3RcIilcbiAgICBcdCAgICAuYXR0cihcImlkXCIsIFwidG50X1wiICsgZGl2X2lkICsgXCJfM3BjYXBcIilcbiAgICBcdCAgICAuYXR0cihcInhcIiwgd2lkdGgtY2FwX3dpZHRoKVxuICAgIFx0ICAgIC5hdHRyKFwieVwiLCAwKVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgMClcbiAgICBcdCAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXG4gICAgXHQgICAgLmF0dHIoXCJmaWxsXCIsIFwicmVkXCIpO1xuXG4gICAgXHQvLyBUaGUgWm9vbWluZy9QYW5uaW5nIFBhbmVcbiAgICBcdHBhbmUgPSBzdmdfZ1xuICAgIFx0ICAgIC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9wYW5lXCIpXG4gICAgXHQgICAgLmF0dHIoXCJpZFwiLCBcInRudF9cIiArIGRpdl9pZCArIFwiX3BhbmVcIilcbiAgICBcdCAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuICAgIFx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICBcdCAgICAuc3R5bGUoXCJmaWxsXCIsIGJnQ29sb3IpO1xuXG4gICAgXHQvLyAqKiBUT0RPOiBXb3VsZG4ndCBiZSBiZXR0ZXIgdG8gaGF2ZSB0aGVzZSBtZXNzYWdlcyBieSB0cmFjaz9cbiAgICBcdC8vIHZhciB0b29XaWRlX3RleHQgPSBzdmdfZ1xuICAgIFx0Ly8gICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgXHQvLyAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF93aWRlT0tfdGV4dFwiKVxuICAgIFx0Ly8gICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfXCIgKyBkaXZfaWQgKyBcIl90b29XaWRlXCIpXG4gICAgXHQvLyAgICAgLmF0dHIoXCJmaWxsXCIsIGJnQ29sb3IpXG4gICAgXHQvLyAgICAgLnRleHQoXCJSZWdpb24gdG9vIHdpZGVcIik7XG5cbiAgICBcdC8vIFRPRE86IEkgZG9uJ3Qga25vdyBpZiB0aGlzIGlzIHRoZSBiZXN0IHdheSAoYW5kIHBvcnRhYmxlKSB3YXlcbiAgICBcdC8vIG9mIGNlbnRlcmluZyB0aGUgdGV4dCBpbiB0aGUgdGV4dCBhcmVhXG4gICAgXHQvLyB2YXIgYmIgPSB0b29XaWRlX3RleHRbMF1bMF0uZ2V0QkJveCgpO1xuICAgIFx0Ly8gdG9vV2lkZV90ZXh0XG4gICAgXHQvLyAgICAgLmF0dHIoXCJ4XCIsIH5+KHdpZHRoLzIgLSBiYi53aWR0aC8yKSlcbiAgICBcdC8vICAgICAuYXR0cihcInlcIiwgfn4oaGVpZ2h0LzIgLSBiYi5oZWlnaHQvMikpO1xuICAgIH07XG5cbiAgICAvLyBBUElcbiAgICB2YXIgYXBpID0gYXBpanMgKHRyYWNrX3ZpcylcbiAgICBcdC5nZXRzZXQgKGV4cG9ydHMpXG4gICAgXHQuZ2V0c2V0IChsaW1pdHMpXG4gICAgXHQuZ2V0c2V0IChsb2MpO1xuXG4gICAgYXBpLnRyYW5zZm9ybSAodHJhY2tfdmlzLmV4dGVuZF9jYW52YXMsIGZ1bmN0aW9uICh2YWwpIHtcbiAgICBcdHZhciBwcmV2X3ZhbCA9IHRyYWNrX3Zpcy5leHRlbmRfY2FudmFzKCk7XG4gICAgXHR2YWwubGVmdCA9IHZhbC5sZWZ0IHx8IHByZXZfdmFsLmxlZnQ7XG4gICAgXHR2YWwucmlnaHQgPSB2YWwucmlnaHQgfHwgcHJldl92YWwucmlnaHQ7XG4gICAgXHRyZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgLy8gdHJhY2tfdmlzIGFsd2F5cyBzdGFydHMgb24gbG9jLmZyb20gJiBsb2MudG9cbiAgICBhcGkubWV0aG9kICgnc3RhcnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHpvb21fb3V0IGlzIHdpdGhpbiB0aGUgbWluLW1heCByYW5nZVxuICAgICAgICBpZiAoKGxpbWl0cy5tYXggLSBsaW1pdHMubWluKSA8IGxpbWl0cy56b29tX291dCkge1xuICAgICAgICAgICAgbGltaXRzLnpvb21fb3V0ID0gbGltaXRzLm1heCAtIGxpbWl0cy5taW47XG4gICAgICAgIH1cblxuICAgICAgICBwbG90KCk7XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIHRyYWNrc1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8dHJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodHJhY2tzW2ldLmcpIHtcbiAgICAgICAgICAgICAgICAvLyAgICB0cmFja3NbaV0uZGlzcGxheSgpLnJlc2V0LmNhbGwodHJhY2tzW2ldKTtcbiAgICAgICAgICAgICAgICB0cmFja3NbaV0uZy5yZW1vdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9pbml0X3RyYWNrKHRyYWNrc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgX3BsYWNlX3RyYWNrcygpO1xuXG4gICAgICAgIC8vIFRoZSBjb250aW51YXRpb24gY2FsbGJhY2tcbiAgICAgICAgdmFyIGNvbnQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIGlmICgobG9jLnRvIC0gbG9jLmZyb20pIDwgbGltaXRzLnpvb21faW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoKGxvYy5mcm9tICsgbGltaXRzLnpvb21faW4pID4gbGltaXRzLm1heCkge1xuICAgICAgICAgICAgICAgICAgICBsb2MudG8gPSBsaW1pdHMubWF4O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYy50byA9IGxvYy5mcm9tICsgbGltaXRzLnpvb21faW47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8dHJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgX3VwZGF0ZV90cmFjayh0cmFja3NbaV0sIGxvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29udCgpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3VwZGF0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICBcdGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBcdCAgICBfdXBkYXRlX3RyYWNrICh0cmFja3NbaV0pO1xuICAgIFx0fVxuICAgIH0pO1xuXG4gICAgdmFyIF91cGRhdGVfdHJhY2sgPSBmdW5jdGlvbiAodHJhY2ssIHdoZXJlKSB7XG4gICAgXHRpZiAodHJhY2suZGF0YSgpKSB7XG4gICAgXHQgICAgdmFyIHRyYWNrX2RhdGEgPSB0cmFjay5kYXRhKCk7XG4gICAgICAgICAgICB2YXIgZGF0YV91cGRhdGVyID0gdHJhY2tfZGF0YTtcblxuICAgIFx0ICAgIGRhdGFfdXBkYXRlci5jYWxsKHRyYWNrLCB7XG4gICAgICAgICAgICAgICAgJ2xvYycgOiB3aGVyZSxcbiAgICAgICAgICAgICAgICAnb25fc3VjY2VzcycgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNrLmRpc3BsYXkoKS51cGRhdGUuY2FsbCh0cmFjaywgd2hlcmUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICB9KTtcbiAgICBcdH1cbiAgICB9O1xuXG4gICAgdmFyIHBsb3QgPSBmdW5jdGlvbigpIHtcbiAgICBcdHhTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgXHQgICAgLmRvbWFpbihbbG9jLmZyb20sIGxvYy50b10pXG4gICAgXHQgICAgLnJhbmdlKFswLCB3aWR0aF0pO1xuXG4gICAgXHRpZiAoZHJhZ19hbGxvd2VkKSB7XG4gICAgXHQgICAgc3ZnX2cuY2FsbCggem9vbUV2ZW50SGFuZGxlclxuICAgIFx0XHQgICAgICAgLngoeFNjYWxlKVxuICAgIFx0XHQgICAgICAgLnNjYWxlRXh0ZW50KFsobG9jLnRvLWxvYy5mcm9tKS8obGltaXRzLnpvb21fb3V0LTEpLCAobG9jLnRvLWxvYy5mcm9tKS9saW1pdHMuem9vbV9pbl0pXG4gICAgXHRcdCAgICAgICAub24oXCJ6b29tXCIsIF9tb3ZlKVxuICAgIFx0XHQgICAgICk7XG4gICAgXHR9XG4gICAgfTtcblxuICAgIHZhciBfcmVvcmRlciA9IGZ1bmN0aW9uIChuZXdfdHJhY2tzKSB7XG4gICAgICAgIC8vIFRPRE86IFRoaXMgaXMgZGVmaW5pbmcgYSBuZXcgaGVpZ2h0LCBidXQgdGhlIGdsb2JhbCBoZWlnaHQgaXMgdXNlZCB0byBkZWZpbmUgdGhlIHNpemUgb2Ygc2V2ZXJhbFxuICAgICAgICAvLyBwYXJ0cy4gV2Ugc2hvdWxkIGRvIHRoaXMgZHluYW1pY2FsbHlcblxuICAgICAgICB2YXIgZm91bmRfaW5kZXhlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBqPTA7IGo8bmV3X3RyYWNrcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8dHJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRyYWNrc1tpXS5pZCgpID09PSBuZXdfdHJhY2tzW2pdLmlkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBmb3VuZF9pbmRleGVzW2ldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHJhY2tzLnNwbGljZShpLDEpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgX2luaXRfdHJhY2sobmV3X3RyYWNrc1tqXSk7XG4gICAgICAgICAgICAgICAgX3VwZGF0ZV90cmFjayhuZXdfdHJhY2tzW2pdLCB7ZnJvbSA6IGxvYy5mcm9tLCB0byA6IGxvYy50b30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgeD0wOyB4PHRyYWNrcy5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgaWYgKCFmb3VuZF9pbmRleGVzW3hdKSB7XG4gICAgICAgICAgICAgICAgdHJhY2tzW3hdLmcucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cmFja3MgPSBuZXdfdHJhY2tzO1xuICAgICAgICBfcGxhY2VfdHJhY2tzKCk7XG4gICAgfTtcblxuICAgIC8vIHJpZ2h0L2xlZnQvem9vbSBwYW5zIG9yIHpvb21zIHRoZSB0cmFjay4gVGhlc2UgbWV0aG9kcyBhcmUgZXhwb3NlZCB0byBhbGxvdyBleHRlcm5hbCBidXR0b25zLCBldGMgdG8gaW50ZXJhY3Qgd2l0aCB0aGUgdHJhY2tzLiBUaGUgYXJndW1lbnQgaXMgdGhlIGFtb3VudCBvZiBwYW5uaW5nL3pvb21pbmcgKGllLiAxLjIgbWVhbnMgMjAlIHBhbm5pbmcpIFdpdGggbGVmdC9yaWdodCBvbmx5IHBvc2l0aXZlIG51bWJlcnMgYXJlIGFsbG93ZWQuXG4gICAgYXBpLm1ldGhvZCAoJ3Njcm9sbCcsIGZ1bmN0aW9uIChmYWN0b3IpIHtcbiAgICAgICAgdmFyIGFtb3VudCA9IE1hdGguYWJzKGZhY3Rvcik7XG4gICAgXHRpZiAoZmFjdG9yID4gMCkge1xuICAgIFx0ICAgIF9tYW51YWxfbW92ZShhbW91bnQsIDEpO1xuICAgIFx0fSBlbHNlIGlmIChmYWN0b3IgPCAwKXtcbiAgICAgICAgICAgIF9tYW51YWxfbW92ZShhbW91bnQsIC0xKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3pvb20nLCBmdW5jdGlvbiAoZmFjdG9yKSB7XG4gICAgICAgIF9tYW51YWxfbW92ZSgxL2ZhY3RvciwgMCk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF90cmFjaycsIGZ1bmN0aW9uIChpZCkge1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8dHJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodHJhY2tzW2ldLmlkKCkgPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYWNrc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3JlbW92ZV90cmFjaycsIGZ1bmN0aW9uICh0cmFjaykge1xuICAgICAgICB0cmFjay5nLnJlbW92ZSgpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2FkZF90cmFjaycsIGZ1bmN0aW9uICh0cmFjaykge1xuICAgICAgICBpZiAodHJhY2sgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRyYWNrLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdHJhY2tfdmlzLmFkZF90cmFjayAodHJhY2tbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRyYWNrX3ZpcztcbiAgICAgICAgfVxuICAgICAgICB0cmFja3MucHVzaCh0cmFjayk7XG4gICAgICAgIHJldHVybiB0cmFja192aXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kKCd0cmFja3MnLCBmdW5jdGlvbiAodHMpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJhY2tzO1xuICAgICAgICB9XG4gICAgICAgIF9yZW9yZGVyKHRzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICAvL1xuICAgIGFwaS5tZXRob2QgKCd3aWR0aCcsIGZ1bmN0aW9uICh3KSB7XG4gICAgXHQvLyBUT0RPOiBBbGxvdyBzdWZmaXhlcyBsaWtlIFwiMTAwMHB4XCI/XG4gICAgXHQvLyBUT0RPOiBUZXN0IHdyb25nIGZvcm1hdHNcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiB3aWR0aDtcbiAgICBcdH1cbiAgICBcdC8vIEF0IGxlYXN0IG1pbi13aWR0aFxuICAgIFx0aWYgKHcgPCBtaW5fd2lkdGgpIHtcbiAgICBcdCAgICB3ID0gbWluX3dpZHRoO1xuICAgIFx0fVxuXG4gICAgXHQvLyBXZSBhcmUgcmVzaXppbmdcbiAgICBcdGlmIChkaXZfaWQgIT09IHVuZGVmaW5lZCkge1xuICAgIFx0ICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQpLnNlbGVjdChcInN2Z1wiKS5hdHRyKFwid2lkdGhcIiwgdyk7XG4gICAgXHQgICAgLy8gUmVzaXplIHRoZSB6b29taW5nL3Bhbm5pbmcgcGFuZVxuICAgIFx0ICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQpLnN0eWxlKFwid2lkdGhcIiwgKHBhcnNlSW50KHcpICsgY2FwX3dpZHRoKjIpICsgXCJweFwiKTtcbiAgICBcdCAgICBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfcGFuZVwiKS5hdHRyKFwid2lkdGhcIiwgdyk7XG4gICAgICAgICAgICBjYXBzLnJpZ2h0XG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIHctY2FwX3dpZHRoKTtcblxuICAgIFx0ICAgIC8vIFJlcGxvdFxuICAgIFx0ICAgIHdpZHRoID0gdztcbiAgICAgICAgICAgIHhTY2FsZS5yYW5nZShbMCwgd2lkdGhdKTtcblxuICAgIFx0ICAgIHBsb3QoKTtcbiAgICBcdCAgICBmb3IgKHZhciBpPTA7IGk8dHJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIFx0XHR0cmFja3NbaV0uZy5zZWxlY3QoXCJyZWN0XCIpLmF0dHIoXCJ3aWR0aFwiLCB3KTtcbiAgICAgICAgICAgICAgICB0cmFja3NbaV0uZGlzcGxheSgpLnNjYWxlKHhTY2FsZSk7XG4gICAgICAgIFx0XHR0cmFja3NbaV0uZGlzcGxheSgpLnJlc2V0LmNhbGwodHJhY2tzW2ldKTtcbiAgICAgICAgICAgICAgICB0cmFja3NbaV0uZGlzcGxheSgpLmluaXQuY2FsbCh0cmFja3NbaV0sIHcpO1xuICAgICAgICBcdFx0dHJhY2tzW2ldLmRpc3BsYXkoKS51cGRhdGUuY2FsbCh0cmFja3NbaV0sIGxvYyk7XG4gICAgXHQgICAgfVxuICAgIFx0fSBlbHNlIHtcbiAgICBcdCAgICB3aWR0aCA9IHc7XG4gICAgXHR9XG4gICAgICAgIHJldHVybiB0cmFja192aXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kKCdhbGxvd19kcmFnJywgZnVuY3Rpb24oYikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBkcmFnX2FsbG93ZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZHJhZ19hbGxvd2VkID0gYjtcbiAgICAgICAgaWYgKGRyYWdfYWxsb3dlZCkge1xuICAgICAgICAgICAgLy8gV2hlbiB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgb24gdGhlIG9iamVjdCBiZWZvcmUgc3RhcnRpbmcgdGhlIHNpbXVsYXRpb24sIHdlIGRvbid0IGhhdmUgZGVmaW5lZCB4U2NhbGVcbiAgICAgICAgICAgIGlmICh4U2NhbGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHN2Z19nLmNhbGwoIHpvb21FdmVudEhhbmRsZXIueCh4U2NhbGUpXG4gICAgICAgICAgICAgICAgICAgIC8vIC54RXh0ZW50KFswLCBsaW1pdHMucmlnaHRdKVxuICAgICAgICAgICAgICAgICAgICAuc2NhbGVFeHRlbnQoWyhsb2MudG8tbG9jLmZyb20pLyhsaW1pdHMuem9vbV9vdXQtMSksIChsb2MudG8tbG9jLmZyb20pL2xpbWl0cy56b29tX2luXSlcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiem9vbVwiLCBfbW92ZSkgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFdlIGNyZWF0ZSBhIG5ldyBkdW1teSBzY2FsZSBpbiB4IHRvIGF2b2lkIGRyYWdnaW5nIHRoZSBwcmV2aW91cyBvbmVcbiAgICAgICAgICAgIC8vIFRPRE86IFRoZXJlIG1heSBiZSBhIGNoZWFwZXIgd2F5IG9mIGRvaW5nIHRoaXM/XG4gICAgICAgICAgICB6b29tRXZlbnRIYW5kbGVyLngoZDMuc2NhbGUubGluZWFyKCkpLm9uKFwiem9vbVwiLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJhY2tfdmlzO1xuICAgIH0pO1xuXG4gICAgdmFyIF9wbGFjZV90cmFja3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBoID0gMDtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRyYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRyYWNrID0gdHJhY2tzW2ldO1xuICAgICAgICAgICAgaWYgKHRyYWNrLmcuYXR0cihcInRyYW5zZm9ybVwiKSkge1xuICAgICAgICAgICAgICAgIHRyYWNrLmdcbiAgICAgICAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAgICAgICAuZHVyYXRpb24oZHVyKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGV4cG9ydHMuZXh0ZW5kX2NhbnZhcy5sZWZ0ICsgXCIsXCIgKyBoICsgXCIpXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cmFjay5nXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZXhwb3J0cy5leHRlbmRfY2FudmFzLmxlZnQgKyBcIixcIiArIGggKyBcIilcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGggKz0gdHJhY2suaGVpZ2h0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzdmdcbiAgICAgICAgc3ZnLmF0dHIoXCJoZWlnaHRcIiwgaCArIGhlaWdodF9vZmZzZXQpO1xuXG4gICAgICAgIC8vIGRpdlxuICAgICAgICBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkKVxuICAgICAgICAgICAgLnN0eWxlKFwiaGVpZ2h0XCIsIChoICsgMTAgKyBoZWlnaHRfb2Zmc2V0KSArIFwicHhcIik7XG5cbiAgICAgICAgLy8gY2Fwc1xuICAgICAgICBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfNXBjYXBcIilcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGgpXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIG1vdmVfdG9fZnJvbnQodGhpcyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfM3BjYXBcIilcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGgpXG4gICAgICAgICAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlX3RvX2Zyb250KHRoaXMpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcGFuZVxuICAgICAgICBwYW5lXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoICsgaGVpZ2h0X29mZnNldCk7XG5cbiAgICAgICAgcmV0dXJuIHRyYWNrX3ZpcztcbiAgICB9O1xuXG4gICAgdmFyIF9pbml0X3RyYWNrID0gZnVuY3Rpb24gKHRyYWNrKSB7XG4gICAgICAgIHRyYWNrLmcgPSBzdmcuc2VsZWN0KFwiZ1wiKS5zZWxlY3QoXCJnXCIpXG4gICAgXHQgICAgLmFwcGVuZChcImdcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RyYWNrXCIpXG4gICAgXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgdHJhY2suaGVpZ2h0KCkpO1xuXG4gICAgXHQvLyBSZWN0IGZvciB0aGUgYmFja2dyb3VuZCBjb2xvclxuICAgIFx0dHJhY2suZ1xuICAgIFx0ICAgIC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgXHQgICAgLmF0dHIoXCJ4XCIsIDApXG4gICAgXHQgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCB0cmFja192aXMud2lkdGgoKSlcbiAgICBcdCAgICAuYXR0cihcImhlaWdodFwiLCB0cmFjay5oZWlnaHQoKSlcbiAgICBcdCAgICAuc3R5bGUoXCJmaWxsXCIsIHRyYWNrLmNvbG9yKCkpXG4gICAgXHQgICAgLnN0eWxlKFwicG9pbnRlci1ldmVudHNcIiwgXCJub25lXCIpO1xuXG4gICAgXHRpZiAodHJhY2suZGlzcGxheSgpKSB7XG4gICAgXHQgICAgdHJhY2suZGlzcGxheSgpXG4gICAgICAgICAgICAgICAgLnNjYWxlKHhTY2FsZSlcbiAgICAgICAgICAgICAgICAuaW5pdC5jYWxsKHRyYWNrLCB3aWR0aCk7XG4gICAgXHR9XG5cbiAgICBcdHJldHVybiB0cmFja192aXM7XG4gICAgfTtcblxuICAgIHZhciBfbWFudWFsX21vdmUgPSBmdW5jdGlvbiAoZmFjdG9yLCBkaXJlY3Rpb24pIHtcbiAgICAgICAgdmFyIG9sZERvbWFpbiA9IHhTY2FsZS5kb21haW4oKTtcblxuICAgIFx0dmFyIHNwYW4gPSBvbGREb21haW5bMV0gLSBvbGREb21haW5bMF07XG4gICAgXHR2YXIgb2Zmc2V0ID0gKHNwYW4gKiBmYWN0b3IpIC0gc3BhbjtcblxuICAgIFx0dmFyIG5ld0RvbWFpbjtcbiAgICBcdHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlIDEgOlxuICAgICAgICAgICAgbmV3RG9tYWluID0gWyh+fm9sZERvbWFpblswXSAtIG9mZnNldCksIH5+KG9sZERvbWFpblsxXSAtIG9mZnNldCldO1xuICAgIFx0ICAgIGJyZWFrO1xuICAgICAgICBcdGNhc2UgLTEgOlxuICAgICAgICBcdCAgICBuZXdEb21haW4gPSBbKH5+b2xkRG9tYWluWzBdICsgb2Zmc2V0KSwgfn4ob2xkRG9tYWluWzFdIC0gb2Zmc2V0KV07XG4gICAgICAgIFx0ICAgIGJyZWFrO1xuICAgICAgICBcdGNhc2UgMCA6XG4gICAgICAgIFx0ICAgIG5ld0RvbWFpbiA9IFtvbGREb21haW5bMF0gLSB+fihvZmZzZXQvMiksIG9sZERvbWFpblsxXSArICh+fm9mZnNldC8yKV07XG4gICAgXHR9XG5cbiAgICBcdHZhciBpbnRlcnBvbGF0b3IgPSBkMy5pbnRlcnBvbGF0ZU51bWJlcihvbGREb21haW5bMF0sIG5ld0RvbWFpblswXSk7XG4gICAgXHR2YXIgZWFzZSA9IGV4cG9ydHMuZWFzZTtcblxuICAgIFx0dmFyIHggPSAwO1xuICAgIFx0ZDMudGltZXIoZnVuY3Rpb24oKSB7XG4gICAgXHQgICAgdmFyIGN1cnJfc3RhcnQgPSBpbnRlcnBvbGF0b3IoZWFzZSh4KSk7XG4gICAgXHQgICAgdmFyIGN1cnJfZW5kO1xuICAgIFx0ICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIFx0ICAgIGNhc2UgLTEgOlxuICAgICAgICBcdFx0Y3Vycl9lbmQgPSBjdXJyX3N0YXJ0ICsgc3BhbjtcbiAgICAgICAgXHRcdGJyZWFrO1xuICAgICAgICBcdCAgICBjYXNlIDEgOlxuICAgICAgICBcdFx0Y3Vycl9lbmQgPSBjdXJyX3N0YXJ0ICsgc3BhbjtcbiAgICAgICAgXHRcdGJyZWFrO1xuICAgICAgICBcdCAgICBjYXNlIDAgOlxuICAgICAgICBcdFx0Y3Vycl9lbmQgPSBvbGREb21haW5bMV0gKyBvbGREb21haW5bMF0gLSBjdXJyX3N0YXJ0O1xuICAgICAgICBcdFx0YnJlYWs7XG4gICAgXHQgICAgfVxuXG4gICAgXHQgICAgdmFyIGN1cnJEb21haW4gPSBbY3Vycl9zdGFydCwgY3Vycl9lbmRdO1xuICAgIFx0ICAgIHhTY2FsZS5kb21haW4oY3VyckRvbWFpbik7XG4gICAgXHQgICAgX21vdmUoeFNjYWxlKTtcbiAgICBcdCAgICB4Kz0wLjAyO1xuICAgIFx0ICAgIHJldHVybiB4PjE7XG4gICAgXHR9KTtcbiAgICB9O1xuXG5cbiAgICB2YXIgX21vdmVfY2JhayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGN1cnJEb21haW4gPSB4U2NhbGUuZG9tYWluKCk7XG4gICAgXHR0cmFja192aXMuZnJvbSh+fmN1cnJEb21haW5bMF0pO1xuICAgIFx0dHJhY2tfdmlzLnRvKH5+Y3VyckRvbWFpblsxXSk7XG5cbiAgICBcdGZvciAodmFyIGkgPSAwOyBpIDwgdHJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgXHQgICAgdmFyIHRyYWNrID0gdHJhY2tzW2ldO1xuICAgIFx0ICAgIF91cGRhdGVfdHJhY2sodHJhY2ssIGxvYyk7XG4gICAgXHR9XG4gICAgfTtcbiAgICAvLyBUaGUgZGVmZXJyZWRfY2JhayBpcyBkZWZlcnJlZCBhdCBsZWFzdCB0aGlzIGFtb3VudCBvZiB0aW1lIG9yIHJlLXNjaGVkdWxlZCBpZiBkZWZlcnJlZCBpcyBjYWxsZWQgYmVmb3JlXG4gICAgdmFyIF9kZWZlcnJlZCA9IGRlZmVyQ2FuY2VsKF9tb3ZlX2NiYWssIDMwMCk7XG5cbiAgICAvLyBhcGkubWV0aG9kKCd1cGRhdGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgLy8gXHRfbW92ZSgpO1xuICAgIC8vIH0pO1xuXG4gICAgdmFyIF9tb3ZlID0gZnVuY3Rpb24gKG5ld194U2NhbGUpIHtcbiAgICBcdGlmIChuZXdfeFNjYWxlICE9PSB1bmRlZmluZWQgJiYgZHJhZ19hbGxvd2VkKSB7XG4gICAgXHQgICAgem9vbUV2ZW50SGFuZGxlci54KG5ld194U2NhbGUpO1xuICAgIFx0fVxuXG4gICAgXHQvLyBTaG93IHRoZSByZWQgYmFycyBhdCB0aGUgbGltaXRzXG4gICAgXHR2YXIgZG9tYWluID0geFNjYWxlLmRvbWFpbigpO1xuICAgIFx0aWYgKGRvbWFpblswXSA8PSAobGltaXRzLm1pbiArIDUpKSB7XG4gICAgXHQgICAgZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCArIFwiXzVwY2FwXCIpXG4gICAgXHRcdC5hdHRyKFwid2lkdGhcIiwgY2FwX3dpZHRoKVxuICAgIFx0XHQudHJhbnNpdGlvbigpXG4gICAgXHRcdC5kdXJhdGlvbigyMDApXG4gICAgXHRcdC5hdHRyKFwid2lkdGhcIiwgMCk7XG4gICAgXHR9XG5cbiAgICBcdGlmIChkb21haW5bMV0gPj0gKGxpbWl0cy5tYXgpLTUpIHtcbiAgICBcdCAgICBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfM3BjYXBcIilcbiAgICBcdFx0LmF0dHIoXCJ3aWR0aFwiLCBjYXBfd2lkdGgpXG4gICAgXHRcdC50cmFuc2l0aW9uKClcbiAgICBcdFx0LmR1cmF0aW9uKDIwMClcbiAgICBcdFx0LmF0dHIoXCJ3aWR0aFwiLCAwKTtcbiAgICBcdH1cblxuXG4gICAgXHQvLyBBdm9pZCBtb3ZpbmcgcGFzdCB0aGUgbGltaXRzXG4gICAgXHRpZiAoZG9tYWluWzBdIDwgbGltaXRzLm1pbikge1xuICAgIFx0ICAgIHpvb21FdmVudEhhbmRsZXIudHJhbnNsYXRlKFt6b29tRXZlbnRIYW5kbGVyLnRyYW5zbGF0ZSgpWzBdIC0geFNjYWxlKGxpbWl0cy5taW4pICsgeFNjYWxlLnJhbmdlKClbMF0sIHpvb21FdmVudEhhbmRsZXIudHJhbnNsYXRlKClbMV1dKTtcbiAgICBcdH0gZWxzZSBpZiAoZG9tYWluWzFdID4gbGltaXRzLm1heCkge1xuICAgIFx0ICAgIHpvb21FdmVudEhhbmRsZXIudHJhbnNsYXRlKFt6b29tRXZlbnRIYW5kbGVyLnRyYW5zbGF0ZSgpWzBdIC0geFNjYWxlKGxpbWl0cy5tYXgpICsgeFNjYWxlLnJhbmdlKClbMV0sIHpvb21FdmVudEhhbmRsZXIudHJhbnNsYXRlKClbMV1dKTtcbiAgICBcdH1cblxuICAgIFx0X2RlZmVycmVkKCk7XG5cbiAgICBcdGZvciAodmFyIGkgPSAwOyBpIDwgdHJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgXHQgICAgdmFyIHRyYWNrID0gdHJhY2tzW2ldO1xuICAgIFx0ICAgIHRyYWNrLmRpc3BsYXkoKS5tb3Zlci5jYWxsKHRyYWNrKTtcbiAgICBcdH1cbiAgICB9O1xuXG4gICAgLy8gYXBpLm1ldGhvZCh7XG4gICAgLy8gXHRhbGxvd19kcmFnIDogYXBpX2FsbG93X2RyYWcsXG4gICAgLy8gXHR3aWR0aCAgICAgIDogYXBpX3dpZHRoLFxuICAgIC8vIFx0YWRkX3RyYWNrICA6IGFwaV9hZGRfdHJhY2ssXG4gICAgLy8gXHRyZW9yZGVyICAgIDogYXBpX3Jlb3JkZXIsXG4gICAgLy8gXHR6b29tICAgICAgIDogYXBpX3pvb20sXG4gICAgLy8gXHRsZWZ0ICAgICAgIDogYXBpX2xlZnQsXG4gICAgLy8gXHRyaWdodCAgICAgIDogYXBpX3JpZ2h0LFxuICAgIC8vIFx0c3RhcnQgICAgICA6IGFwaV9zdGFydFxuICAgIC8vIH0pO1xuXG4gICAgLy8gQXV4aWxpYXIgZnVuY3Rpb25zXG4gICAgZnVuY3Rpb24gbW92ZV90b19mcm9udCAoZWxlbSkge1xuICAgICAgICBlbGVtLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoZWxlbSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRyYWNrX3Zpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGJvYXJkO1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZSAoXCJ0bnQuYXBpXCIpO1xudmFyIHNwaW5uZXIgPSByZXF1aXJlIChcIi4vc3Bpbm5lci5qc1wiKSgpO1xuXG50bnRfZGF0YSA9IHt9O1xuXG50bnRfZGF0YS5zeW5jID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHVwZGF0ZV90cmFjayA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB0cmFjay5kYXRhKCkuZWxlbWVudHModXBkYXRlX3RyYWNrLnJldHJpZXZlcigpLmNhbGwodHJhY2ssIG9iai5sb2MpKTtcbiAgICAgICAgb2JqLm9uX3N1Y2Nlc3MoKTtcbiAgICB9O1xuXG4gICAgYXBpanMgKHVwZGF0ZV90cmFjaylcbiAgICAgICAgLmdldHNldCAoJ2VsZW1lbnRzJywgW10pXG4gICAgICAgIC5nZXRzZXQgKCdyZXRyaWV2ZXInLCBmdW5jdGlvbiAoKSB7fSk7XG5cbiAgICByZXR1cm4gdXBkYXRlX3RyYWNrO1xufTtcblxudG50X2RhdGEuYXN5bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHVwZGF0ZV90cmFjayA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgc3Bpbm5lci5vbi5jYWxsKHRyYWNrKTtcbiAgICAgICAgdXBkYXRlX3RyYWNrLnJldHJpZXZlcigpLmNhbGwodHJhY2ssIG9iai5sb2MpXG4gICAgICAgICAgICAudGhlbiAoZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgICAgICB0cmFjay5kYXRhKCkuZWxlbWVudHMocmVzcCk7XG4gICAgICAgICAgICAgICAgb2JqLm9uX3N1Y2Nlc3MoKTtcbiAgICAgICAgICAgICAgICBzcGlubmVyLm9mZi5jYWxsKHRyYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKHVwZGF0ZV90cmFjaylcbiAgICAgICAgLmdldHNldCAoJ2VsZW1lbnRzJywgW10pXG4gICAgICAgIC5nZXRzZXQgKCdyZXRyaWV2ZXInKTtcblxuICAgIHJldHVybiB1cGRhdGVfdHJhY2s7XG59O1xuXG5cbi8vIEEgcHJlZGVmaW5lZCB0cmFjayBkaXNwbGF5aW5nIG5vIGV4dGVybmFsIGRhdGFcbi8vIGl0IGlzIHVzZWQgZm9yIGxvY2F0aW9uIGFuZCBheGlzIHRyYWNrcyBmb3IgZXhhbXBsZVxudG50X2RhdGEuZW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHVwZGF0ZXIgPSB0bnRfZGF0YS5zeW5jKCk7XG5cbiAgICByZXR1cm4gdXBkYXRlcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRudF9kYXRhO1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZSAoXCJ0bnQuYXBpXCIpO1xudmFyIGxheW91dCA9IHJlcXVpcmUoXCIuL2xheW91dC5qc1wiKTtcblxuLy8gRkVBVFVSRSBWSVNcbi8vIHZhciBib2FyZCA9IHt9O1xuLy8gYm9hcmQudHJhY2sgPSB7fTtcbnZhciB0bnRfZmVhdHVyZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaCAoXCJjbGlja1wiLCBcImRibGNsaWNrXCIsIFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIik7XG5cbiAgICAvLy8vLy8gVmFycyBleHBvc2VkIGluIHRoZSBBUElcbiAgICB2YXIgY29uZmlnID0ge1xuICAgICAgICBjcmVhdGUgICA6IGZ1bmN0aW9uICgpIHt0aHJvdyBcImNyZWF0ZV9lbGVtIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIGZlYXR1cmUgb2JqZWN0XCI7fSxcbiAgICAgICAgbW92ZSAgICA6IGZ1bmN0aW9uICgpIHt0aHJvdyBcIm1vdmVfZWxlbSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBmZWF0dXJlIG9iamVjdFwiO30sXG4gICAgICAgIGRpc3RyaWJ1dGUgIDogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIGZpeGVkICAgOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgLy9sYXlvdXQgICA6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBpbmRleCAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgbGF5b3V0ICAgOiBsYXlvdXQuaWRlbnRpdHkoKSxcbiAgICAgICAgY29sb3IgOiAnIzAwMCcsXG4gICAgICAgIHNjYWxlIDogdW5kZWZpbmVkXG4gICAgfTtcblxuXG4gICAgLy8gVGhlIHJldHVybmVkIG9iamVjdFxuICAgIHZhciBmZWF0dXJlID0ge307XG5cbiAgICB2YXIgcmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgIFx0dHJhY2suZy5zZWxlY3RBbGwoXCIudG50X2VsZW1cIikucmVtb3ZlKCk7XG4gICAgICAgIHRyYWNrLmcuc2VsZWN0QWxsKFwiLnRudF9ndWlkZXJcIikucmVtb3ZlKCk7XG4gICAgICAgIHRyYWNrLmcuc2VsZWN0QWxsKFwiLnRudF9maXhlZFwiKS5yZW1vdmUoKTtcbiAgICB9O1xuXG4gICAgdmFyIGluaXQgPSBmdW5jdGlvbiAod2lkdGgpIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcblxuICAgICAgICB0cmFjay5nXG4gICAgICAgICAgICAuYXBwZW5kIChcInRleHRcIilcbiAgICAgICAgICAgIC5hdHRyIChcImNsYXNzXCIsIFwidG50X2ZpeGVkXCIpXG4gICAgICAgICAgICAuYXR0ciAoXCJ4XCIsIDUpXG4gICAgICAgICAgICAuYXR0ciAoXCJ5XCIsIDEyKVxuICAgICAgICAgICAgLmF0dHIgKFwiZm9udC1zaXplXCIsIDExKVxuICAgICAgICAgICAgLmF0dHIgKFwiZmlsbFwiLCBcImdyZXlcIilcbiAgICAgICAgICAgIC50ZXh0ICh0cmFjay5sYWJlbCgpKTtcblxuICAgICAgICBjb25maWcuZml4ZWQuY2FsbCh0cmFjaywgd2lkdGgpO1xuICAgIH07XG5cbiAgICB2YXIgcGxvdCA9IGZ1bmN0aW9uIChuZXdfZWxlbXMsIHRyYWNrLCB4U2NhbGUpIHtcbiAgICAgICAgbmV3X2VsZW1zLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICAgIGlmIChkMy5ldmVudC5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbCh0aGlzLCBkLCBpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld19lbGVtcy5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgaWYgKGQzLmV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbCh0aGlzLCBkLCBpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld19lbGVtcy5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICBpZiAoZDMuZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpc3BhdGNoLmRibGNsaWNrLmNhbGwodGhpcywgZCwgaSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdfZWxlbXMub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgaWYgKGQzLmV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKHRoaXMsIGQsIGkpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gbmV3X2VsZW0gaXMgYSBnIGVsZW1lbnQgdGhlIGZlYXR1cmUgaXMgaW5zZXJ0ZWRcbiAgICAgICAgY29uZmlnLmNyZWF0ZS5jYWxsKHRyYWNrLCBuZXdfZWxlbXMsIHhTY2FsZSk7XG4gICAgfTtcblxuICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbiAobG9jLCBmaWVsZCkge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB2YXIgc3ZnX2cgPSB0cmFjay5nO1xuXG4gICAgICAgIHZhciBlbGVtZW50cyA9IHRyYWNrLmRhdGEoKS5lbGVtZW50cygpO1xuXG4gICAgICAgIGlmIChmaWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlbGVtZW50cyA9IGVsZW1lbnRzW2ZpZWxkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkYXRhX2VsZW1zID0gY29uZmlnLmxheW91dC5jYWxsKHRyYWNrLCBlbGVtZW50cyk7XG5cblxuICAgICAgICBpZiAoZGF0YV9lbGVtcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdmlzX3NlbDtcbiAgICAgICAgdmFyIHZpc19lbGVtcztcbiAgICAgICAgaWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZpc19zZWwgPSBzdmdfZy5zZWxlY3RBbGwoXCIudG50X2VsZW1fXCIgKyBmaWVsZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2aXNfc2VsID0gc3ZnX2cuc2VsZWN0QWxsKFwiLnRudF9lbGVtXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmZpZy5pbmRleCkgeyAvLyBJbmRleGluZyBieSBmaWVsZFxuICAgICAgICAgICAgdmlzX2VsZW1zID0gdmlzX3NlbFxuICAgICAgICAgICAgICAgIC5kYXRhKGRhdGFfZWxlbXMsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25maWcuaW5kZXgoZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHsgLy8gSW5kZXhpbmcgYnkgcG9zaXRpb24gaW4gYXJyYXlcbiAgICAgICAgICAgIHZpc19lbGVtcyA9IHZpc19zZWxcbiAgICAgICAgICAgICAgICAuZGF0YShkYXRhX2VsZW1zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbmZpZy5kaXN0cmlidXRlLmNhbGwodHJhY2ssIHZpc19lbGVtcywgY29uZmlnLnNjYWxlKTtcblxuICAgIFx0dmFyIG5ld19lbGVtID0gdmlzX2VsZW1zXG4gICAgXHQgICAgLmVudGVyKCk7XG5cbiAgICBcdG5ld19lbGVtXG4gICAgXHQgICAgLmFwcGVuZChcImdcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2VsZW1cIilcbiAgICBcdCAgICAuY2xhc3NlZChcInRudF9lbGVtX1wiICsgZmllbGQsIGZpZWxkKVxuICAgIFx0ICAgIC5jYWxsKGZlYXR1cmUucGxvdCwgdHJhY2ssIGNvbmZpZy5zY2FsZSk7XG5cbiAgICBcdHZpc19lbGVtc1xuICAgIFx0ICAgIC5leGl0KClcbiAgICBcdCAgICAucmVtb3ZlKCk7XG4gICAgfTtcblxuICAgIHZhciBtb3ZlciA9IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICBcdHZhciBzdmdfZyA9IHRyYWNrLmc7XG4gICAgXHR2YXIgZWxlbXM7XG4gICAgXHQvLyBUT0RPOiBJcyBzZWxlY3RpbmcgdGhlIGVsZW1lbnRzIHRvIG1vdmUgdG9vIHNsb3c/XG4gICAgXHQvLyBJdCB3b3VsZCBiZSBuaWNlIHRvIHByb2ZpbGVcbiAgICBcdGlmIChmaWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgXHQgICAgZWxlbXMgPSBzdmdfZy5zZWxlY3RBbGwoXCIudG50X2VsZW1fXCIgKyBmaWVsZCk7XG4gICAgXHR9IGVsc2Uge1xuICAgIFx0ICAgIGVsZW1zID0gc3ZnX2cuc2VsZWN0QWxsKFwiLnRudF9lbGVtXCIpO1xuICAgIFx0fVxuXG4gICAgXHRjb25maWcubW92ZS5jYWxsKHRoaXMsIGVsZW1zKTtcbiAgICB9O1xuXG4gICAgdmFyIG10ZiA9IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChlbGVtKTtcbiAgICB9O1xuXG4gICAgdmFyIG1vdmVfdG9fZnJvbnQgPSBmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgICAgaWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgc3ZnX2cgPSB0cmFjay5nO1xuICAgICAgICAgICAgc3ZnX2cuc2VsZWN0QWxsKFwiLnRudF9lbGVtX1wiICsgZmllbGQpXG4gICAgICAgICAgICAgICAgLmVhY2goIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbXRmKHRoaXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIGFwaWpzIChmZWF0dXJlKVxuICAgIFx0LmdldHNldCAoY29uZmlnKVxuICAgIFx0Lm1ldGhvZCAoe1xuICAgIFx0ICAgIHJlc2V0ICA6IHJlc2V0LFxuICAgIFx0ICAgIHBsb3QgICA6IHBsb3QsXG4gICAgXHQgICAgdXBkYXRlIDogdXBkYXRlLFxuICAgIFx0ICAgIG1vdmVyICAgOiBtb3ZlcixcbiAgICBcdCAgICBpbml0ICAgOiBpbml0LFxuICAgIFx0ICAgIG1vdmVfdG9fZnJvbnQgOiBtb3ZlX3RvX2Zyb250XG4gICAgXHR9KTtcblxuICAgIHJldHVybiBkMy5yZWJpbmQoZmVhdHVyZSwgZGlzcGF0Y2gsIFwib25cIik7XG59O1xuXG50bnRfZmVhdHVyZS5jb21wb3NpdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRpc3BsYXlzID0ge307XG4gICAgdmFyIGRpc3BsYXlfb3JkZXIgPSBbXTtcblxuICAgIHZhciBmZWF0dXJlcyA9IHt9O1xuXG4gICAgdmFyIHJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgZm9yICh2YXIgZGlzcGxheSBpbiBkaXNwbGF5cykge1xuICAgICAgICAgICAgaWYgKGRpc3BsYXlzLmhhc093blByb3BlcnR5KGRpc3BsYXkpKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheXNbZGlzcGxheV0ucmVzZXQuY2FsbCh0cmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGluaXQgPSBmdW5jdGlvbiAod2lkdGgpIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgZm9yICh2YXIgZGlzcGxheSBpbiBkaXNwbGF5cykge1xuICAgICAgICAgICAgaWYgKGRpc3BsYXlzLmhhc093blByb3BlcnR5KGRpc3BsYXkpKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheXNbZGlzcGxheV0uc2NhbGUoZmVhdHVyZXMuc2NhbGUoKSk7XG4gICAgICAgICAgICAgICAgZGlzcGxheXNbZGlzcGxheV0uaW5pdC5jYWxsKHRyYWNrLCB3aWR0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgXHRmb3IgKHZhciBpPTA7IGk8ZGlzcGxheV9vcmRlci5sZW5ndGg7IGkrKykge1xuICAgIFx0ICAgIGRpc3BsYXlzW2Rpc3BsYXlfb3JkZXJbaV1dLnVwZGF0ZS5jYWxsKHRyYWNrLCB1bmRlZmluZWQsIGRpc3BsYXlfb3JkZXJbaV0pO1xuICAgIFx0ICAgIGRpc3BsYXlzW2Rpc3BsYXlfb3JkZXJbaV1dLm1vdmVfdG9fZnJvbnQuY2FsbCh0cmFjaywgZGlzcGxheV9vcmRlcltpXSk7XG4gICAgXHR9XG4gICAgICAgIC8vIGZvciAodmFyIGRpc3BsYXkgaW4gZGlzcGxheXMpIHtcbiAgICAgICAgLy8gICAgIGlmIChkaXNwbGF5cy5oYXNPd25Qcm9wZXJ0eShkaXNwbGF5KSkge1xuICAgICAgICAvLyAgICAgICAgIGRpc3BsYXlzW2Rpc3BsYXldLnVwZGF0ZS5jYWxsKHRyYWNrLCB4U2NhbGUsIGRpc3BsYXkpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgfTtcblxuICAgIHZhciBtb3ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgZm9yICh2YXIgZGlzcGxheSBpbiBkaXNwbGF5cykge1xuICAgICAgICAgICAgaWYgKGRpc3BsYXlzLmhhc093blByb3BlcnR5KGRpc3BsYXkpKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheXNbZGlzcGxheV0ubW92ZXIuY2FsbCh0cmFjaywgZGlzcGxheSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGFkZCA9IGZ1bmN0aW9uIChrZXksIGRpc3BsYXkpIHtcbiAgICBcdGRpc3BsYXlzW2tleV0gPSBkaXNwbGF5O1xuICAgIFx0ZGlzcGxheV9vcmRlci5wdXNoKGtleSk7XG4gICAgXHRyZXR1cm4gZmVhdHVyZXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRfZGlzcGxheXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgXHR2YXIgZHMgPSBbXTtcbiAgICBcdGZvciAodmFyIGk9MDsgaTxkaXNwbGF5X29yZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgXHQgICAgZHMucHVzaChkaXNwbGF5c1tkaXNwbGF5X29yZGVyW2ldXSk7XG4gICAgXHR9XG4gICAgXHRyZXR1cm4gZHM7XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIGFwaWpzIChmZWF0dXJlcylcbiAgICAgICAgLmdldHNldChcInNjYWxlXCIpXG4gICAgXHQubWV0aG9kICh7XG4gICAgXHQgICAgcmVzZXQgIDogcmVzZXQsXG4gICAgXHQgICAgdXBkYXRlIDogdXBkYXRlLFxuICAgIFx0ICAgIG1vdmVyICAgOiBtb3ZlcixcbiAgICBcdCAgICBpbml0ICAgOiBpbml0LFxuICAgIFx0ICAgIGFkZCAgICA6IGFkZCxcbiAgICBcdCAgICBkaXNwbGF5cyA6IGdldF9kaXNwbGF5c1xuICAgIFx0fSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZXM7XG59O1xuXG50bnRfZmVhdHVyZS5hcmVhID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmZWF0dXJlID0gdG50X2ZlYXR1cmUubGluZSgpO1xuICAgIHZhciBsaW5lID0gZmVhdHVyZS5saW5lKCk7XG5cbiAgICB2YXIgYXJlYSA9IGQzLnN2Zy5hcmVhKClcbiAgICBcdC5pbnRlcnBvbGF0ZShsaW5lLmludGVycG9sYXRlKCkpXG4gICAgXHQudGVuc2lvbihmZWF0dXJlLnRlbnNpb24oKSk7XG5cbiAgICB2YXIgZGF0YV9wb2ludHM7XG5cbiAgICB2YXIgbGluZV9jcmVhdGUgPSBmZWF0dXJlLmNyZWF0ZSgpOyAvLyBXZSAnc2F2ZScgbGluZSBjcmVhdGlvblxuXG4gICAgZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChwb2ludHMpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG5cbiAgICBcdGlmIChkYXRhX3BvaW50cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgXHQgICAgdHJhY2suZy5zZWxlY3QoXCJwYXRoXCIpLnJlbW92ZSgpO1xuICAgIFx0fVxuXG4gICAgXHRsaW5lX2NyZWF0ZS5jYWxsKHRyYWNrLCBwb2ludHMsIHhTY2FsZSk7XG5cbiAgICBcdGFyZWFcbiAgICBcdCAgICAueChsaW5lLngoKSlcbiAgICBcdCAgICAueTEobGluZS55KCkpXG4gICAgXHQgICAgLnkwKHRyYWNrLmhlaWdodCgpKTtcblxuICAgIFx0ZGF0YV9wb2ludHMgPSBwb2ludHMuZGF0YSgpO1xuICAgIFx0cG9pbnRzLnJlbW92ZSgpO1xuXG4gICAgXHR0cmFjay5nXG4gICAgXHQgICAgLmFwcGVuZChcInBhdGhcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2FyZWFcIilcbiAgICBcdCAgICAuY2xhc3NlZChcInRudF9lbGVtXCIsIHRydWUpXG4gICAgXHQgICAgLmRhdHVtKGRhdGFfcG9pbnRzKVxuICAgIFx0ICAgIC5hdHRyKFwiZFwiLCBhcmVhKVxuICAgIFx0ICAgIC5hdHRyKFwiZmlsbFwiLCBkMy5yZ2IoZmVhdHVyZS5jb2xvcigpKS5icmlnaHRlcigpKTtcbiAgICB9KTtcblxuICAgIHZhciBsaW5lX21vdmUgPSBmZWF0dXJlLm1vdmUoKTtcbiAgICBmZWF0dXJlLm1vdmUgKGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB2YXIgeFNjYWxlID0gZmVhdHVyZS5zY2FsZSgpO1xuICAgIFx0bGluZV9tb3ZlLmNhbGwodHJhY2ssIHBhdGgsIHhTY2FsZSk7XG5cbiAgICBcdGFyZWEueChsaW5lLngoKSk7XG4gICAgXHR0cmFjay5nXG4gICAgXHQgICAgLnNlbGVjdChcIi50bnRfYXJlYVwiKVxuICAgIFx0ICAgIC5kYXR1bShkYXRhX3BvaW50cylcbiAgICBcdCAgICAuYXR0cihcImRcIiwgYXJlYSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcblxufTtcblxudG50X2ZlYXR1cmUubGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlKCk7XG5cbiAgICB2YXIgeCA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiBkLnBvcztcbiAgICB9O1xuICAgIHZhciB5ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIGQudmFsO1xuICAgIH07XG4gICAgdmFyIHRlbnNpb24gPSAwLjc7XG4gICAgdmFyIHlTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpO1xuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgICAuaW50ZXJwb2xhdGUoXCJiYXNpc1wiKTtcblxuICAgIC8vIGxpbmUgZ2V0dGVyLiBUT0RPOiBTZXR0ZXI/XG4gICAgZmVhdHVyZS5saW5lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbGluZTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS54ID0gZnVuY3Rpb24gKGNiYWspIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiB4O1xuICAgIFx0fVxuICAgIFx0eCA9IGNiYWs7XG4gICAgXHRyZXR1cm4gZmVhdHVyZTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS55ID0gZnVuY3Rpb24gKGNiYWspIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiB5O1xuICAgIFx0fVxuICAgIFx0eSA9IGNiYWs7XG4gICAgXHRyZXR1cm4gZmVhdHVyZTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS50ZW5zaW9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiB0ZW5zaW9uO1xuICAgIFx0fVxuICAgIFx0dGVuc2lvbiA9IHQ7XG4gICAgXHRyZXR1cm4gZmVhdHVyZTtcbiAgICB9O1xuXG4gICAgdmFyIGRhdGFfcG9pbnRzO1xuXG4gICAgLy8gRm9yIG5vdywgY3JlYXRlIGlzIGEgb25lLW9mZiBldmVudFxuICAgIC8vIFRPRE86IE1ha2UgaXQgd29yayB3aXRoIHBhcnRpYWwgcGF0aHMsIGllLiBjcmVhdGluZyBhbmQgZGlzcGxheWluZyBvbmx5IHRoZSBwYXRoIHRoYXQgaXMgYmVpbmcgZGlzcGxheWVkXG4gICAgZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChwb2ludHMpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG5cbiAgICBcdGlmIChkYXRhX3BvaW50cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgXHQgICAgLy8gcmV0dXJuO1xuICAgIFx0ICAgIHRyYWNrLmcuc2VsZWN0KFwicGF0aFwiKS5yZW1vdmUoKTtcbiAgICBcdH1cblxuICAgIFx0bGluZVxuICAgIFx0ICAgIC50ZW5zaW9uKHRlbnNpb24pXG4gICAgXHQgICAgLngoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlKHgoZCkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLnkoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhY2suaGVpZ2h0KCkgLSB5U2NhbGUoeShkKSk7XG4gICAgXHQgICAgfSk7XG5cbiAgICBcdGRhdGFfcG9pbnRzID0gcG9pbnRzLmRhdGEoKTtcbiAgICBcdHBvaW50cy5yZW1vdmUoKTtcblxuICAgIFx0eVNjYWxlXG4gICAgXHQgICAgLmRvbWFpbihbMCwgMV0pXG4gICAgXHQgICAgLy8gLmRvbWFpbihbMCwgZDMubWF4KGRhdGFfcG9pbnRzLCBmdW5jdGlvbiAoZCkge1xuICAgIFx0ICAgIC8vIFx0cmV0dXJuIHkoZCk7XG4gICAgXHQgICAgLy8gfSldKVxuICAgIFx0ICAgIC5yYW5nZShbMCwgdHJhY2suaGVpZ2h0KCkgLSAyXSk7XG5cbiAgICBcdHRyYWNrLmdcbiAgICBcdCAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZWxlbVwiKVxuICAgIFx0ICAgIC5hdHRyKFwiZFwiLCBsaW5lKGRhdGFfcG9pbnRzKSlcbiAgICBcdCAgICAuc3R5bGUoXCJzdHJva2VcIiwgZmVhdHVyZS5jb2xvcigpKVxuICAgIFx0ICAgIC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCA0KVxuICAgIFx0ICAgIC5zdHlsZShcImZpbGxcIiwgXCJub25lXCIpO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlIChmdW5jdGlvbiAocGF0aCkge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcblxuICAgIFx0bGluZS54KGZ1bmN0aW9uIChkKSB7XG4gICAgXHQgICAgcmV0dXJuIHhTY2FsZSh4KGQpKTtcbiAgICBcdH0pO1xuICAgIFx0dHJhY2suZy5zZWxlY3QoXCJwYXRoXCIpXG4gICAgXHQgICAgLmF0dHIoXCJkXCIsIGxpbmUoZGF0YV9wb2ludHMpKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxudG50X2ZlYXR1cmUuY29uc2VydmF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyAnSW5oZXJpdCcgZnJvbSBmZWF0dXJlLmFyZWFcbiAgICAgICAgdmFyIGZlYXR1cmUgPSB0bnRfZmVhdHVyZS5hcmVhKCk7XG5cbiAgICAgICAgdmFyIGFyZWFfY3JlYXRlID0gZmVhdHVyZS5jcmVhdGUoKTsgLy8gV2UgJ3NhdmUnIGFyZWEgY3JlYXRpb25cbiAgICAgICAgZmVhdHVyZS5jcmVhdGUgIChmdW5jdGlvbiAocG9pbnRzKSB7XG4gICAgICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgICAgIFx0YXJlYV9jcmVhdGUuY2FsbCh0cmFjaywgZDMuc2VsZWN0KHBvaW50c1swXVswXSksIHhTY2FsZSk7XG4gICAgICAgIH0pO1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG50bnRfZmVhdHVyZS5lbnNlbWJsID0gZnVuY3Rpb24gKCkge1xuICAgIC8vICdJbmhlcml0JyBmcm9tIGJvYXJkLnRyYWNrLmZlYXR1cmVcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlKCk7XG5cbiAgICB2YXIgY29sb3IyID0gXCIjN0ZGRjAwXCI7XG4gICAgdmFyIGNvbG9yMyA9IFwiIzAwQkIwMFwiO1xuXG4gICAgZmVhdHVyZS5maXhlZCAoZnVuY3Rpb24gKHdpZHRoKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgIFx0dmFyIGhlaWdodF9vZmZzZXQgPSB+fih0cmFjay5oZWlnaHQoKSAtICh0cmFjay5oZWlnaHQoKSAgKiAwLjgpKSAvIDI7XG5cbiAgICBcdHRyYWNrLmdcbiAgICBcdCAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ3VpZGVyIHRudF9maXhlZFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieDFcIiwgMClcbiAgICBcdCAgICAuYXR0cihcIngyXCIsIHdpZHRoKVxuICAgIFx0ICAgIC5hdHRyKFwieTFcIiwgaGVpZ2h0X29mZnNldClcbiAgICBcdCAgICAuYXR0cihcInkyXCIsIGhlaWdodF9vZmZzZXQpXG4gICAgXHQgICAgLnN0eWxlKFwic3Ryb2tlXCIsIGZlYXR1cmUuY29sb3IoKSlcbiAgICBcdCAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMSk7XG5cbiAgICBcdHRyYWNrLmdcbiAgICBcdCAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ3VpZGVyIHRudF9maXhlZFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieDFcIiwgMClcbiAgICBcdCAgICAuYXR0cihcIngyXCIsIHdpZHRoKVxuICAgIFx0ICAgIC5hdHRyKFwieTFcIiwgdHJhY2suaGVpZ2h0KCkgLSBoZWlnaHRfb2Zmc2V0KVxuICAgIFx0ICAgIC5hdHRyKFwieTJcIiwgdHJhY2suaGVpZ2h0KCkgLSBoZWlnaHRfb2Zmc2V0KVxuICAgIFx0ICAgIC5zdHlsZShcInN0cm9rZVwiLCBmZWF0dXJlLmNvbG9yKCkpXG4gICAgXHQgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDEpO1xuXG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKG5ld19lbGVtcykge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcblxuICAgIFx0dmFyIGhlaWdodF9vZmZzZXQgPSB+fih0cmFjay5oZWlnaHQoKSAtICh0cmFjay5oZWlnaHQoKSAgKiAwLjgpKSAvIDI7XG5cbiAgICBcdG5ld19lbGVtc1xuICAgIFx0ICAgIC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZSAoZC5zdGFydCk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInlcIiwgaGVpZ2h0X29mZnNldClcbiAgICAvLyBcdCAgICAuYXR0cihcInJ4XCIsIDMpXG4gICAgLy8gXHQgICAgLmF0dHIoXCJyeVwiLCAzKVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgdHJhY2suaGVpZ2h0KCkgLSB+fihoZWlnaHRfb2Zmc2V0ICogMikpXG4gICAgXHQgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmNvbG9yKCkpXG4gICAgXHQgICAgLnRyYW5zaXRpb24oKVxuICAgIFx0ICAgIC5kdXJhdGlvbig1MDApXG4gICAgXHQgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0XHRpZiAoZC50eXBlID09PSAnaGlnaCcpIHtcbiAgICAgICAgXHRcdCAgICByZXR1cm4gZDMucmdiKGZlYXR1cmUuY29sb3IoKSk7XG4gICAgICAgIFx0XHR9XG4gICAgICAgIFx0XHRpZiAoZC50eXBlID09PSAnbG93Jykge1xuICAgICAgICBcdFx0ICAgIHJldHVybiBkMy5yZ2IoZmVhdHVyZS5jb2xvcjIoKSk7XG4gICAgICAgIFx0XHR9XG4gICAgICAgIFx0XHRyZXR1cm4gZDMucmdiKGZlYXR1cmUuY29sb3IzKCkpO1xuICAgIFx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5kaXN0cmlidXRlIChmdW5jdGlvbiAoYmxvY2tzKSB7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgXHRibG9ja3NcbiAgICBcdCAgICAuc2VsZWN0KFwicmVjdFwiKVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuICAgIFx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlIChmdW5jdGlvbiAoYmxvY2tzKSB7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgXHRibG9ja3NcbiAgICBcdCAgICAuc2VsZWN0KFwicmVjdFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4U2NhbGUoZC5zdGFydCk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh4U2NhbGUoZC5lbmQpIC0geFNjYWxlKGQuc3RhcnQpKTtcbiAgICBcdCAgICB9KTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUuY29sb3IyID0gZnVuY3Rpb24gKGNvbCkge1xuICAgIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgXHQgICAgcmV0dXJuIGNvbG9yMjtcbiAgICBcdH1cbiAgICBcdGNvbG9yMiA9IGNvbDtcbiAgICBcdHJldHVybiBmZWF0dXJlO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLmNvbG9yMyA9IGZ1bmN0aW9uIChjb2wpIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiBjb2xvcjM7XG4gICAgXHR9XG4gICAgXHRjb2xvcjMgPSBjb2w7XG4gICAgXHRyZXR1cm4gZmVhdHVyZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG50bnRfZmVhdHVyZS52bGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyAnSW5oZXJpdCcgZnJvbSBmZWF0dXJlXG4gICAgdmFyIGZlYXR1cmUgPSB0bnRfZmVhdHVyZSgpO1xuXG4gICAgZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChuZXdfZWxlbXMpIHtcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgXHRuZXdfZWxlbXNcbiAgICBcdCAgICAuYXBwZW5kIChcImxpbmVcIilcbiAgICBcdCAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShmZWF0dXJlLmluZGV4KCkoZCkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4U2NhbGUoZmVhdHVyZS5pbmRleCgpKGQpKTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwieTFcIiwgMClcbiAgICBcdCAgICAuYXR0cihcInkyXCIsIHRyYWNrLmhlaWdodCgpKVxuICAgIFx0ICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZlYXR1cmUuY29sb3IoKSlcbiAgICBcdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUubW92ZSAoZnVuY3Rpb24gKHZsaW5lcykge1xuICAgICAgICB2YXIgeFNjYWxlID0gZmVhdHVyZS5zY2FsZSgpO1xuICAgIFx0dmxpbmVzXG4gICAgXHQgICAgLnNlbGVjdChcImxpbmVcIilcbiAgICBcdCAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShmZWF0dXJlLmluZGV4KCkoZCkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4U2NhbGUoZmVhdHVyZS5pbmRleCgpKGQpKTtcbiAgICBcdCAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xuXG59O1xuXG50bnRfZmVhdHVyZS5waW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gJ0luaGVyaXQnIGZyb20gYm9hcmQudHJhY2suZmVhdHVyZVxuICAgIHZhciBmZWF0dXJlID0gdG50X2ZlYXR1cmUoKTtcblxuICAgIHZhciB5U2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIFx0LmRvbWFpbihbMCwwXSlcbiAgICBcdC5yYW5nZShbMCwwXSk7XG5cbiAgICB2YXIgb3B0cyA9IHtcbiAgICAgICAgcG9zIDogZDMuZnVuY3RvcihcInBvc1wiKSxcbiAgICAgICAgdmFsIDogZDMuZnVuY3RvcihcInZhbFwiKSxcbiAgICAgICAgZG9tYWluIDogWzAsMF1cbiAgICB9O1xuXG4gICAgdmFyIHBpbl9iYWxsX3IgPSA1OyAvLyB0aGUgcmFkaXVzIG9mIHRoZSBjaXJjbGUgaW4gdGhlIHBpblxuXG4gICAgYXBpanMoZmVhdHVyZSlcbiAgICAgICAgLmdldHNldChvcHRzKTtcblxuXG4gICAgZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChuZXdfcGlucykge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcbiAgICBcdHlTY2FsZVxuICAgIFx0ICAgIC5kb21haW4oZmVhdHVyZS5kb21haW4oKSlcbiAgICBcdCAgICAucmFuZ2UoW3Bpbl9iYWxsX3IsIHRyYWNrLmhlaWdodCgpLXBpbl9iYWxsX3ItMTBdKTsgLy8gMTAgZm9yIGxhYmVsbGluZ1xuXG4gICAgXHQvLyBwaW5zIGFyZSBjb21wb3NlZCBvZiBsaW5lcywgY2lyY2xlcyBhbmQgbGFiZWxzXG4gICAgXHRuZXdfcGluc1xuICAgIFx0ICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgXHQgICAgLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgIFx0ICAgIFx0cmV0dXJuIHhTY2FsZShkW29wdHMucG9zKGQsIGkpXSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYWNrLmhlaWdodCgpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbiAoZCxpKSB7XG4gICAgXHQgICAgXHRyZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICBcdCAgICBcdHJldHVybiB0cmFjay5oZWlnaHQoKSAtIHlTY2FsZShkW29wdHMudmFsKGQsIGkpXSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKGZlYXR1cmUuY29sb3IoKSkoZCk7XG4gICAgICAgICAgICB9KTtcblxuICAgIFx0bmV3X3BpbnNcbiAgICBcdCAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgXHQgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4U2NhbGUoZFtvcHRzLnBvcyhkLCBpKV0pO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cmFjay5oZWlnaHQoKSAtIHlTY2FsZShkW29wdHMudmFsKGQsIGkpXSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInJcIiwgcGluX2JhbGxfcilcbiAgICBcdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihmZWF0dXJlLmNvbG9yKCkpKGQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3X3BpbnNcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAuYXR0cihcImZvbnQtc2l6ZVwiLCBcIjEzXCIpXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQubGFiZWwgfHwgXCJcIjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLmRpc3RyaWJ1dGUgKGZ1bmN0aW9uIChwaW5zKSB7XG4gICAgICAgIHBpbnNcbiAgICAgICAgICAgIC5zZWxlY3QoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLmxhYmVsIHx8IFwiXCI7XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUubW92ZShmdW5jdGlvbiAocGlucykge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcblxuICAgIFx0cGluc1xuICAgIFx0ICAgIC8vLmVhY2gocG9zaXRpb25fcGluX2xpbmUpXG4gICAgXHQgICAgLnNlbGVjdChcImxpbmVcIilcbiAgICBcdCAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShkW29wdHMucG9zKGQsIGkpXSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gdHJhY2suaGVpZ2h0KCk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uIChkLGkpIHtcbiAgICAgICAgXHRcdHJldHVybiB4U2NhbGUoZFtvcHRzLnBvcyhkLCBpKV0pO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICBcdFx0cmV0dXJuIHRyYWNrLmhlaWdodCgpIC0geVNjYWxlKGRbb3B0cy52YWwoZCwgaSldKTtcbiAgICBcdCAgICB9KTtcblxuICAgIFx0cGluc1xuICAgIFx0ICAgIC5zZWxlY3QoXCJjaXJjbGVcIilcbiAgICBcdCAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShkW29wdHMucG9zKGQsIGkpXSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYWNrLmhlaWdodCgpIC0geVNjYWxlKGRbb3B0cy52YWwoZCwgaSldKTtcbiAgICBcdCAgICB9KTtcblxuICAgICAgICBwaW5zXG4gICAgICAgICAgICAuc2VsZWN0KFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShkW29wdHMucG9zKGQsIGkpXSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5sYWJlbCB8fCBcIlwiO1xuICAgICAgICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIGZlYXR1cmUuZml4ZWQgKGZ1bmN0aW9uICh3aWR0aCkge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB0cmFjay5nXG4gICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9maXhlZFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ4MVwiLCAwKVxuICAgICAgICAgICAgLmF0dHIoXCJ4MlwiLCB3aWR0aClcbiAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgdHJhY2suaGVpZ2h0KCkpXG4gICAgICAgICAgICAuYXR0cihcInkyXCIsIHRyYWNrLmhlaWdodCgpKVxuICAgICAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcbiAgICAgICAgICAgIC5zdHlsZShcInN0cm9rZS13aXRoXCIsIFwiMXB4XCIpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG50bnRfZmVhdHVyZS5ibG9jayA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyAnSW5oZXJpdCcgZnJvbSBib2FyZC50cmFjay5mZWF0dXJlXG4gICAgdmFyIGZlYXR1cmUgPSB0bnRfZmVhdHVyZSgpO1xuXG4gICAgYXBpanMoZmVhdHVyZSlcbiAgICBcdC5nZXRzZXQoJ2Zyb20nLCBmdW5jdGlvbiAoZCkge1xuICAgIFx0ICAgIHJldHVybiBkLnN0YXJ0O1xuICAgIFx0fSlcbiAgICBcdC5nZXRzZXQoJ3RvJywgZnVuY3Rpb24gKGQpIHtcbiAgICBcdCAgICByZXR1cm4gZC5lbmQ7XG4gICAgXHR9KTtcblxuICAgIGZlYXR1cmUuY3JlYXRlKGZ1bmN0aW9uIChuZXdfZWxlbXMpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgXHRuZXdfZWxlbXNcbiAgICBcdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICBcdFx0Ly8gVE9ETzogc3RhcnQsIGVuZCBzaG91bGQgYmUgYWRqdXN0YWJsZSB2aWEgdGhlIHRyYWNrcyBBUElcbiAgICAgICAgXHRcdHJldHVybiB4U2NhbGUoZmVhdHVyZS5mcm9tKCkoZCwgaSkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICBcdFx0cmV0dXJuICh4U2NhbGUoZmVhdHVyZS50bygpKGQsIGkpKSAtIHhTY2FsZShmZWF0dXJlLmZyb20oKShkLCBpKSkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgdHJhY2suaGVpZ2h0KCkpXG4gICAgXHQgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmNvbG9yKCkpXG4gICAgXHQgICAgLnRyYW5zaXRpb24oKVxuICAgIFx0ICAgIC5kdXJhdGlvbig1MDApXG4gICAgXHQgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0XHRpZiAoZC5jb2xvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIFx0XHQgICAgcmV0dXJuIGZlYXR1cmUuY29sb3IoKTtcbiAgICAgICAgXHRcdH0gZWxzZSB7XG4gICAgICAgIFx0XHQgICAgcmV0dXJuIGQuY29sb3I7XG4gICAgICAgIFx0XHR9XG4gICAgXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLmRpc3RyaWJ1dGUoZnVuY3Rpb24gKGVsZW1zKSB7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgXHRlbGVtc1xuICAgIFx0ICAgIC5zZWxlY3QoXCJyZWN0XCIpXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBcdFx0cmV0dXJuICh4U2NhbGUoZC5lbmQpIC0geFNjYWxlKGQuc3RhcnQpKTtcbiAgICBcdCAgICB9KTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUubW92ZShmdW5jdGlvbiAoYmxvY2tzKSB7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgXHRibG9ja3NcbiAgICBcdCAgICAuc2VsZWN0KFwicmVjdFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBcdFx0cmV0dXJuIHhTY2FsZShkLnN0YXJ0KTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgXHRcdHJldHVybiAoeFNjYWxlKGQuZW5kKSAtIHhTY2FsZShkLnN0YXJ0KSk7XG4gICAgXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcblxufTtcblxudG50X2ZlYXR1cmUuYXhpcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgeEF4aXM7XG4gICAgdmFyIG9yaWVudGF0aW9uID0gXCJ0b3BcIjtcbiAgICB2YXIgeFNjYWxlO1xuXG4gICAgLy8gQXhpcyBkb2Vzbid0IGluaGVyaXQgZnJvbSBmZWF0dXJlXG4gICAgdmFyIGZlYXR1cmUgPSB7fTtcbiAgICBmZWF0dXJlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIFx0eEF4aXMgPSB1bmRlZmluZWQ7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgIFx0dHJhY2suZy5zZWxlY3RBbGwoXCIudGlja1wiKS5yZW1vdmUoKTtcbiAgICB9O1xuICAgIGZlYXR1cmUucGxvdCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIGZlYXR1cmUubW92ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgIFx0dmFyIHN2Z19nID0gdHJhY2suZztcbiAgICBcdHN2Z19nLmNhbGwoeEF4aXMpO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHhBeGlzID0gdW5kZWZpbmVkO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcdC8vIENyZWF0ZSBBeGlzIGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICAgICAgaWYgKHhBeGlzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHhBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAgICAgICAgIC5zY2FsZSh4U2NhbGUpXG4gICAgICAgICAgICAgICAgLm9yaWVudChvcmllbnRhdGlvbik7XG4gICAgICAgIH1cblxuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICBcdHZhciBzdmdfZyA9IHRyYWNrLmc7XG4gICAgXHRzdmdfZy5jYWxsKHhBeGlzKTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS5vcmllbnRhdGlvbiA9IGZ1bmN0aW9uIChwb3MpIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiBvcmllbnRhdGlvbjtcbiAgICBcdH1cbiAgICBcdG9yaWVudGF0aW9uID0gcG9zO1xuICAgIFx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIGZlYXR1cmUuc2NhbGUgPSBmdW5jdGlvbiAocykge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB4U2NhbGU7XG4gICAgICAgIH1cbiAgICAgICAgeFNjYWxlID0gcztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxudG50X2ZlYXR1cmUubG9jYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJvdztcbiAgICB2YXIgeFNjYWxlO1xuXG4gICAgdmFyIGZlYXR1cmUgPSB7fTtcbiAgICBmZWF0dXJlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByb3cgPSB1bmRlZmluZWQ7XG4gICAgfTtcbiAgICBmZWF0dXJlLnBsb3QgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICBmZWF0dXJlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJvdyA9IHVuZGVmaW5lZDtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdHJhY2suZy5zZWxlY3QoXCJ0ZXh0XCIpLnJlbW92ZSgpO1xuICAgIH07XG4gICAgZmVhdHVyZS5tb3ZlciA9IGZ1bmN0aW9uKCkge1xuICAgIFx0dmFyIGRvbWFpbiA9IHhTY2FsZS5kb21haW4oKTtcbiAgICBcdHJvdy5zZWxlY3QoXCJ0ZXh0XCIpXG4gICAgXHQgICAgLnRleHQoXCJMb2NhdGlvbjogXCIgKyB+fmRvbWFpblswXSArIFwiLVwiICsgfn5kb21haW5bMV0pO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLnNjYWxlID0gZnVuY3Rpb24gKHNjKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHhTY2FsZTtcbiAgICAgICAgfVxuICAgICAgICB4U2NhbGUgPSBzYztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIGZlYXR1cmUudXBkYXRlID0gZnVuY3Rpb24gKGxvYykge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICBcdHZhciBzdmdfZyA9IHRyYWNrLmc7XG4gICAgXHR2YXIgZG9tYWluID0geFNjYWxlLmRvbWFpbigpO1xuICAgIFx0aWYgKHJvdyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgXHQgICAgcm93ID0gc3ZnX2c7XG4gICAgXHQgICAgcm93XG4gICAgICAgIFx0XHQuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICBcdFx0LnRleHQoXCJMb2NhdGlvbjogXCIgKyBNYXRoLnJvdW5kKGRvbWFpblswXSkgKyBcIi1cIiArIE1hdGgucm91bmQoZG9tYWluWzFdKSk7XG4gICAgXHR9XG4gICAgfTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X2ZlYXR1cmU7XG4iLCJ2YXIgYm9hcmQgPSByZXF1aXJlIChcIi4vYm9hcmQuanNcIik7XG5ib2FyZC50cmFjayA9IHJlcXVpcmUgKFwiLi90cmFja1wiKTtcbmJvYXJkLnRyYWNrLmRhdGEgPSByZXF1aXJlIChcIi4vZGF0YS5qc1wiKTtcbmJvYXJkLnRyYWNrLmxheW91dCA9IHJlcXVpcmUgKFwiLi9sYXlvdXQuanNcIik7XG5ib2FyZC50cmFjay5mZWF0dXJlID0gcmVxdWlyZSAoXCIuL2ZlYXR1cmUuanNcIik7XG5ib2FyZC50cmFjay5sYXlvdXQgPSByZXF1aXJlIChcIi4vbGF5b3V0LmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBib2FyZDtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUgKFwidG50LmFwaVwiKTtcblxuLy8gdmFyIGJvYXJkID0ge307XG4vLyBib2FyZC50cmFjayA9IHt9O1xudmFyIGxheW91dCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIC8vIFRoZSByZXR1cm5lZCBjbG9zdXJlIC8gb2JqZWN0XG4gICAgdmFyIGwgPSBmdW5jdGlvbiAobmV3X2VsZW1zKSAge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICBsLmVsZW1lbnRzKCkuY2FsbCh0cmFjaywgbmV3X2VsZW1zKTtcbiAgICAgICAgcmV0dXJuIG5ld19lbGVtcztcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzKGwpXG4gICAgICAgIC5nZXRzZXQgKCdlbGVtZW50cycsIGZ1bmN0aW9uICgpIHt9KTtcblxuICAgIHJldHVybiBsO1xufTtcblxubGF5b3V0LmlkZW50aXR5ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBsYXlvdXQoKVxuICAgICAgICAuZWxlbWVudHMgKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZTtcbiAgICAgICAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBsYXlvdXQ7XG4iLCJ2YXIgc3Bpbm5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyB2YXIgbiA9IDA7XG4gICAgdmFyIHNwX2VsZW07XG4gICAgdmFyIHNwID0ge307XG5cbiAgICBzcC5vbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgaWYgKCF0cmFjay5zcGlubmVyKSB7XG4gICAgICAgICAgICB0cmFjay5zcGlubmVyID0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyYWNrLnNwaW5uZXIrKztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhY2suc3Bpbm5lcj09MSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRyYWNrLmc7XG4gICAgICAgICAgICB2YXIgYmdDb2xvciA9IHRyYWNrLmNvbG9yKCk7XG4gICAgICAgICAgICBzcF9lbGVtID0gY29udGFpbmVyXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfc3Bpbm5lclwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIzMHB4XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIzMHB4XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ4bWxzXCIsIFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcInZpZXdCb3hcIiwgXCIwIDAgMTAwIDEwMFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwicHJlc2VydmVBc3BlY3RSYXRpb1wiLCBcInhNaWRZTWlkXCIpO1xuXG5cbiAgICAgICAgICAgIHNwX2VsZW1cbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAnMCcpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ5XCIsICcwJylcbiAgICAgICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIxMDBcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcInJ4XCIsICc1MCcpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJyeVwiLCAnNTAnKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBiZ0NvbG9yKTtcbiAgICAgICAgICAgICAgICAvLy5hdHRyKFwib3BhY2l0eVwiLCAwLjYpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8MTI7IGkrKykge1xuICAgICAgICAgICAgICAgIHRpY2soc3BfZWxlbSwgaSwgYmdDb2xvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIGlmICh0cmFjay5zcGlubmVyPjApe1xuICAgICAgICAgICAgLy8gTW92ZSB0aGUgc3Bpbm5lciB0byBmcm9udFxuICAgICAgICAgICAgdmFyIG5vZGUgPSBzcF9lbGVtLm5vZGUoKTtcbiAgICAgICAgICAgIGlmIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICBub2RlLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc3Aub2ZmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB0cmFjay5zcGlubmVyLS07XG4gICAgICAgIGlmICghdHJhY2suc3Bpbm5lcikge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRyYWNrLmc7XG4gICAgICAgICAgICBjb250YWluZXIuc2VsZWN0QWxsKFwiLnRudF9zcGlubmVyXCIpXG4gICAgICAgICAgICAgICAgLnJlbW92ZSgpO1xuXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdGljayAoZWxlbSwgaSwgYmdDb2xvcikge1xuICAgICAgICBlbGVtXG4gICAgICAgICAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIFwiNDYuNVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsICc0MCcpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIFwiN1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIyMFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJyeFwiLCBcIjVcIilcbiAgICAgICAgICAgIC5hdHRyKFwicnlcIiwgXCI1XCIpXG4gICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgZDMucmdiKGJnQ29sb3IpLmRhcmtlcigyKSlcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKFwiICsgKDM2MC8xMikqaSArIFwiIDUwIDUwKSB0cmFuc2xhdGUoMCAtMzApXCIpXG4gICAgICAgICAgICAuYXBwZW5kKFwiYW5pbWF0ZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJhdHRyaWJ1dGVOYW1lXCIsIFwib3BhY2l0eVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJmcm9tXCIsIFwiMVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0b1wiLCBcIjBcIilcbiAgICAgICAgICAgIC5hdHRyKFwiZHVyXCIsIFwiMXNcIilcbiAgICAgICAgICAgIC5hdHRyKFwiYmVnaW5cIiwgKDEvMTIpKmkgKyBcInNcIilcbiAgICAgICAgICAgIC5hdHRyKFwicmVwZWF0Q291bnRcIiwgXCJpbmRlZmluaXRlXCIpO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIHNwO1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHNwaW5uZXI7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlIChcInRudC5hcGlcIik7XG52YXIgaXRlcmF0b3IgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpLml0ZXJhdG9yO1xuXG5cbnZhciB0cmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBkaXNwbGF5O1xuXG4gICAgdmFyIGNvbmYgPSB7XG4gICAgXHRjb2xvciA6IGQzLnJnYignI0NDQ0NDQycpLFxuICAgIFx0aGVpZ2h0ICAgICAgICAgICA6IDI1MCxcbiAgICBcdC8vIGRhdGEgaXMgdGhlIG9iamVjdCAobm9ybWFsbHkgYSB0bnQudHJhY2suZGF0YSBvYmplY3QpIHVzZWQgdG8gcmV0cmlldmUgYW5kIHVwZGF0ZSBkYXRhIGZvciB0aGUgdHJhY2tcbiAgICBcdGRhdGEgICAgICAgICAgICAgOiB0cmFjay5kYXRhLmVtcHR5KCksXG4gICAgICAgIC8vIGRpc3BsYXkgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgIGxhYmVsICAgICAgICAgICAgOiBcIlwiLFxuICAgICAgICBpZCAgICAgICAgICAgICAgIDogdHJhY2suaWQoKVxuICAgIH07XG5cbiAgICAvLyBUaGUgcmV0dXJuZWQgb2JqZWN0IC8gY2xvc3VyZVxuICAgIHZhciB0ID0ge307XG5cbiAgICAvLyBBUElcbiAgICB2YXIgYXBpID0gYXBpanMgKHQpXG4gICAgXHQuZ2V0c2V0IChjb25mKTtcblxuICAgIC8vIFRPRE86IFRoaXMgbWVhbnMgdGhhdCBoZWlnaHQgc2hvdWxkIGJlIGRlZmluZWQgYmVmb3JlIGRpc3BsYXlcbiAgICAvLyB3ZSBzaG91bGRuJ3QgcmVseSBvbiB0aGlzXG4gICAgdC5kaXNwbGF5ID0gZnVuY3Rpb24gKG5ld19wbG90dGVyKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGRpc3BsYXk7XG4gICAgICAgIH1cblxuICAgICAgICBkaXNwbGF5ID0gbmV3X3Bsb3R0ZXI7XG4gICAgICAgIGlmICh0eXBlb2YgKGRpc3BsYXkpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBkaXNwbGF5LmxheW91dCAmJiBkaXNwbGF5LmxheW91dCgpLmhlaWdodChjb25mLmhlaWdodCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGlzcGxheSkge1xuICAgICAgICAgICAgICAgIGlmIChkaXNwbGF5Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheVtrZXldLmxheW91dCAmJiBkaXNwbGF5W2tleV0ubGF5b3V0KCkuaGVpZ2h0KGNvbmYuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG50cmFjay5pZCA9IGl0ZXJhdG9yKDEpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmFjaztcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL25ld2ljay5qc1wiKTtcbiIsIi8qKlxuICogTmV3aWNrIGFuZCBuaHggZm9ybWF0cyBwYXJzZXIgaW4gSmF2YVNjcmlwdC5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIEphc29uIERhdmllcyAyMDEwIGFuZCBNaWd1ZWwgUGlnbmF0ZWxsaVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKlxuICogRXhhbXBsZSB0cmVlIChmcm9tIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTmV3aWNrX2Zvcm1hdCk6XG4gKlxuICogKy0tMC4xLS1BXG4gKiBGLS0tLS0wLjItLS0tLUIgICAgICAgICAgICArLS0tLS0tLTAuMy0tLS1DXG4gKiArLS0tLS0tLS0tLS0tLS0tLS0tMC41LS0tLS1FXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICArLS0tLS0tLS0tMC40LS0tLS0tRFxuICpcbiAqIE5ld2ljayBmb3JtYXQ6XG4gKiAoQTowLjEsQjowLjIsKEM6MC4zLEQ6MC40KUU6MC41KUY7XG4gKlxuICogQ29udmVydGVkIHRvIEpTT046XG4gKiB7XG4gKiAgIG5hbWU6IFwiRlwiLFxuICogICBicmFuY2hzZXQ6IFtcbiAqICAgICB7bmFtZTogXCJBXCIsIGxlbmd0aDogMC4xfSxcbiAqICAgICB7bmFtZTogXCJCXCIsIGxlbmd0aDogMC4yfSxcbiAqICAgICB7XG4gKiAgICAgICBuYW1lOiBcIkVcIixcbiAqICAgICAgIGxlbmd0aDogMC41LFxuICogICAgICAgYnJhbmNoc2V0OiBbXG4gKiAgICAgICAgIHtuYW1lOiBcIkNcIiwgbGVuZ3RoOiAwLjN9LFxuICogICAgICAgICB7bmFtZTogXCJEXCIsIGxlbmd0aDogMC40fVxuICogICAgICAgXVxuICogICAgIH1cbiAqICAgXVxuICogfVxuICpcbiAqIENvbnZlcnRlZCB0byBKU09OLCBidXQgd2l0aCBubyBuYW1lcyBvciBsZW5ndGhzOlxuICoge1xuICogICBicmFuY2hzZXQ6IFtcbiAqICAgICB7fSwge30sIHtcbiAqICAgICAgIGJyYW5jaHNldDogW3t9LCB7fV1cbiAqICAgICB9XG4gKiAgIF1cbiAqIH1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwYXJzZV9uZXdpY2sgOiBmdW5jdGlvbihzKSB7XG5cdHZhciBhbmNlc3RvcnMgPSBbXTtcblx0dmFyIHRyZWUgPSB7fTtcblx0dmFyIHRva2VucyA9IHMuc3BsaXQoL1xccyooO3xcXCh8XFwpfCx8OilcXHMqLyk7XG5cdHZhciBzdWJ0cmVlO1xuXHRmb3IgKHZhciBpPTA7IGk8dG9rZW5zLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV07XG5cdCAgICBzd2l0Y2ggKHRva2VuKSB7XG4gICAgICAgICAgICBjYXNlICcoJzogLy8gbmV3IGJyYW5jaHNldFxuXHRcdHN1YnRyZWUgPSB7fTtcblx0XHR0cmVlLmNoaWxkcmVuID0gW3N1YnRyZWVdO1xuXHRcdGFuY2VzdG9ycy5wdXNoKHRyZWUpO1xuXHRcdHRyZWUgPSBzdWJ0cmVlO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnLCc6IC8vIGFub3RoZXIgYnJhbmNoXG5cdFx0c3VidHJlZSA9IHt9O1xuXHRcdGFuY2VzdG9yc1thbmNlc3RvcnMubGVuZ3RoLTFdLmNoaWxkcmVuLnB1c2goc3VidHJlZSk7XG5cdFx0dHJlZSA9IHN1YnRyZWU7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICcpJzogLy8gb3B0aW9uYWwgbmFtZSBuZXh0XG5cdFx0dHJlZSA9IGFuY2VzdG9ycy5wb3AoKTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJzonOiAvLyBvcHRpb25hbCBsZW5ndGggbmV4dFxuXHRcdGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcblx0XHR2YXIgeCA9IHRva2Vuc1tpLTFdO1xuXHRcdGlmICh4ID09ICcpJyB8fCB4ID09ICcoJyB8fCB4ID09ICcsJykge1xuXHRcdCAgICB0cmVlLm5hbWUgPSB0b2tlbjtcblx0XHR9IGVsc2UgaWYgKHggPT0gJzonKSB7XG5cdFx0ICAgIHRyZWUuYnJhbmNoX2xlbmd0aCA9IHBhcnNlRmxvYXQodG9rZW4pO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdHJlZTtcbiAgICB9LFxuXG4gICAgcGFyc2Vfbmh4IDogZnVuY3Rpb24gKHMpIHtcblx0dmFyIGFuY2VzdG9ycyA9IFtdO1xuXHR2YXIgdHJlZSA9IHt9O1xuXHR2YXIgc3VidHJlZTtcblxuXHR2YXIgdG9rZW5zID0gcy5zcGxpdCggL1xccyooO3xcXCh8XFwpfFxcW3xcXF18LHw6fD0pXFxzKi8gKTtcblx0Zm9yICh2YXIgaT0wOyBpPHRva2Vucy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHRva2VuID0gdG9rZW5zW2ldO1xuXHQgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICAgICAgY2FzZSAnKCc6IC8vIG5ldyBjaGlsZHJlblxuXHRcdHN1YnRyZWUgPSB7fTtcblx0XHR0cmVlLmNoaWxkcmVuID0gW3N1YnRyZWVdO1xuXHRcdGFuY2VzdG9ycy5wdXNoKHRyZWUpO1xuXHRcdHRyZWUgPSBzdWJ0cmVlO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnLCc6IC8vIGFub3RoZXIgYnJhbmNoXG5cdFx0c3VidHJlZSA9IHt9O1xuXHRcdGFuY2VzdG9yc1thbmNlc3RvcnMubGVuZ3RoLTFdLmNoaWxkcmVuLnB1c2goc3VidHJlZSk7XG5cdFx0dHJlZSA9IHN1YnRyZWU7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICcpJzogLy8gb3B0aW9uYWwgbmFtZSBuZXh0XG5cdFx0dHJlZSA9IGFuY2VzdG9ycy5wb3AoKTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJzonOiAvLyBvcHRpb25hbCBsZW5ndGggbmV4dFxuXHRcdGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcblx0XHR2YXIgeCA9IHRva2Vuc1tpLTFdO1xuXHRcdGlmICh4ID09ICcpJyB8fCB4ID09ICcoJyB8fCB4ID09ICcsJykge1xuXHRcdCAgICB0cmVlLm5hbWUgPSB0b2tlbjtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoeCA9PSAnOicpIHtcblx0XHQgICAgdmFyIHRlc3RfdHlwZSA9IHR5cGVvZiB0b2tlbjtcblx0XHQgICAgaWYoIWlzTmFOKHRva2VuKSl7XG5cdFx0XHR0cmVlLmJyYW5jaF9sZW5ndGggPSBwYXJzZUZsb2F0KHRva2VuKTtcblx0XHQgICAgfVxuXHRcdH1cblx0XHRlbHNlIGlmICh4ID09ICc9Jyl7XG5cdFx0ICAgIHZhciB4MiA9IHRva2Vuc1tpLTJdO1xuXHRcdCAgICBzd2l0Y2goeDIpe1xuXHRcdCAgICBjYXNlICdEJzpcblx0XHRcdHRyZWUuZHVwbGljYXRpb24gPSB0b2tlbjtcblx0XHRcdGJyZWFrO1xuXHRcdCAgICBjYXNlICdHJzpcblx0XHRcdHRyZWUuZ2VuZV9pZCA9IHRva2VuO1xuXHRcdFx0YnJlYWs7XG5cdFx0ICAgIGNhc2UgJ1QnOlxuXHRcdFx0dHJlZS50YXhvbl9pZCA9IHRva2VuO1xuXHRcdFx0YnJlYWs7XG5cdFx0ICAgIGRlZmF1bHQgOlxuXHRcdFx0dHJlZVt0b2tlbnNbaS0yXV0gPSB0b2tlbjtcblx0XHQgICAgfVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHQgICAgdmFyIHRlc3Q7XG5cblx0XHR9XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHRyZWU7XG4gICAgfVxufTtcbiIsInZhciBub2RlID0gcmVxdWlyZShcIi4vc3JjL25vZGUuanNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBub2RlO1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgaXRlcmF0b3IgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpLml0ZXJhdG9yO1xuXG52YXIgdG50X25vZGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuLy90bnQudHJlZS5ub2RlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBub2RlID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKG5vZGUpO1xuXG4gICAgLy8gQVBJXG4vLyAgICAgbm9kZS5ub2RlcyA9IGZ1bmN0aW9uKCkge1xuLy8gXHRpZiAoY2x1c3RlciA9PT0gdW5kZWZpbmVkKSB7XG4vLyBcdCAgICBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxuLy8gXHQgICAgLy8gVE9ETzogbGVuZ3RoIGFuZCBjaGlsZHJlbiBzaG91bGQgYmUgZXhwb3NlZCBpbiB0aGUgQVBJXG4vLyBcdCAgICAvLyBpLmUuIHRoZSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIGNoYW5nZSB0aGlzIGRlZmF1bHRzIHZpYSB0aGUgQVBJXG4vLyBcdCAgICAvLyBjaGlsZHJlbiBpcyB0aGUgZGVmYXVsdHMgZm9yIHBhcnNlX25ld2ljaywgYnV0IG1heWJlIHdlIHNob3VsZCBjaGFuZ2UgdGhhdFxuLy8gXHQgICAgLy8gb3IgYXQgbGVhc3Qgbm90IGFzc3VtZSB0aGlzIGlzIGFsd2F5cyB0aGUgY2FzZSBmb3IgdGhlIGRhdGEgcHJvdmlkZWRcbi8vIFx0XHQudmFsdWUoZnVuY3Rpb24oZCkge3JldHVybiBkLmxlbmd0aH0pXG4vLyBcdFx0LmNoaWxkcmVuKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5jaGlsZHJlbn0pO1xuLy8gXHR9XG4vLyBcdG5vZGVzID0gY2x1c3Rlci5ub2RlcyhkYXRhKTtcbi8vIFx0cmV0dXJuIG5vZGVzO1xuLy8gICAgIH07XG5cbiAgICB2YXIgYXBwbHlfdG9fZGF0YSA9IGZ1bmN0aW9uIChkYXRhLCBjYmFrKSB7XG5cdGNiYWsoZGF0YSk7XG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBwbHlfdG9fZGF0YShkYXRhLmNoaWxkcmVuW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0fVxuICAgIH07XG5cbiAgICB2YXIgY3JlYXRlX2lkcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGkgPSBpdGVyYXRvcigxKTtcblx0Ly8gV2UgY2FuJ3QgdXNlIGFwcGx5IGJlY2F1c2UgYXBwbHkgY3JlYXRlcyBuZXcgdHJlZXMgb24gZXZlcnkgbm9kZVxuXHQvLyBXZSBzaG91bGQgdXNlIHRoZSBkaXJlY3QgZGF0YSBpbnN0ZWFkXG5cdGFwcGx5X3RvX2RhdGEgKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICBpZiAoZC5faWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGQuX2lkID0gaSgpO1xuXHRcdC8vIFRPRE86IE5vdCBzdXJlIF9pblN1YlRyZWUgaXMgc3RyaWN0bHkgbmVjZXNzYXJ5XG5cdFx0Ly8gZC5faW5TdWJUcmVlID0ge3ByZXY6dHJ1ZSwgY3Vycjp0cnVlfTtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIHZhciBsaW5rX3BhcmVudHMgPSBmdW5jdGlvbiAoZGF0YSkge1xuXHRpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAvLyBfcGFyZW50P1xuXHQgICAgZGF0YS5jaGlsZHJlbltpXS5fcGFyZW50ID0gZGF0YTtcblx0ICAgIGxpbmtfcGFyZW50cyhkYXRhLmNoaWxkcmVuW2ldKTtcblx0fVxuICAgIH07XG5cbiAgICB2YXIgY29tcHV0ZV9yb290X2Rpc3RzID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0YXBwbHlfdG9fZGF0YSAoZGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHZhciBsO1xuXHQgICAgaWYgKGQuX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZC5fcm9vdF9kaXN0ID0gMDtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIGwgPSAwO1xuXHRcdGlmIChkLmJyYW5jaF9sZW5ndGgpIHtcblx0XHQgICAgbCA9IGQuYnJhbmNoX2xlbmd0aFxuXHRcdH1cblx0XHRkLl9yb290X2Rpc3QgPSBsICsgZC5fcGFyZW50Ll9yb290X2Rpc3Q7XG5cdCAgICB9XG5cdH0pO1xuICAgIH07XG5cbiAgICAvLyBUT0RPOiBkYXRhIGNhbid0IGJlIHJld3JpdHRlbiB1c2VkIHRoZSBhcGkgeWV0LiBXZSBuZWVkIGZpbmFsaXplcnNcbiAgICBub2RlLmRhdGEgPSBmdW5jdGlvbihuZXdfZGF0YSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBkYXRhXG5cdH1cblx0ZGF0YSA9IG5ld19kYXRhO1xuXHRjcmVhdGVfaWRzKCk7XG5cdGxpbmtfcGFyZW50cyhkYXRhKTtcblx0Y29tcHV0ZV9yb290X2Rpc3RzKGRhdGEpO1xuXHRyZXR1cm4gbm9kZTtcbiAgICB9O1xuICAgIC8vIFdlIGJpbmQgdGhlIGRhdGEgdGhhdCBoYXMgYmVlbiBwYXNzZWRcbiAgICBub2RlLmRhdGEoZGF0YSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF9hbGwnLCBmdW5jdGlvbiAoY2JhaywgZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChjYmFrKG4pKSB7XG5cdFx0bm9kZXMucHVzaCAobik7XG5cdCAgICB9XG5cdH0pO1xuXHRyZXR1cm4gbm9kZXM7XG4gICAgfSk7XG4gICAgXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZScsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdGlmIChjYmFrKG5vZGUpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGo9MDsgajxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltqXSkuZmluZF9ub2RlKGNiYWssIGRlZXApO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cblx0aWYgKGRlZXAgJiYgKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQpKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltpXSkuZmluZF9ub2RlKGNiYWssIGRlZXApXG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5fY2hpbGRyZW5baV0pLmZpbmRfbm9kZShjYmFrLCBkZWVwKTtcblx0XHRpZiAoZm91bmQpIHtcblx0XHQgICAgcmV0dXJuIGZvdW5kO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZV9ieV9uYW1lJywgZnVuY3Rpb24obmFtZSwgZGVlcCkge1xuXHRyZXR1cm4gbm9kZS5maW5kX25vZGUgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICByZXR1cm4gbm9kZS5ub2RlX25hbWUoKSA9PT0gbmFtZVxuXHR9LCBkZWVwKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd0b2dnbGUnLCBmdW5jdGlvbigpIHtcblx0aWYgKGRhdGEpIHtcblx0ICAgIGlmIChkYXRhLmNoaWxkcmVuKSB7IC8vIFVuY29sbGFwc2VkIC0+IGNvbGxhcHNlXG5cdFx0dmFyIGhpZGRlbiA9IDA7XG5cdFx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0XHQgICAgdmFyIGhpZGRlbl9oZXJlID0gbi5uX2hpZGRlbigpIHx8IDA7XG5cdFx0ICAgIGhpZGRlbiArPSAobi5uX2hpZGRlbigpIHx8IDApICsgMTtcblx0XHR9KTtcblx0XHRub2RlLm5faGlkZGVuIChoaWRkZW4tMSk7XG5cdFx0ZGF0YS5fY2hpbGRyZW4gPSBkYXRhLmNoaWxkcmVuO1xuXHRcdGRhdGEuY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG5cdCAgICB9IGVsc2UgeyAgICAgICAgICAgICAvLyBDb2xsYXBzZWQgLT4gdW5jb2xsYXBzZVxuXHRcdG5vZGUubl9oaWRkZW4oMCk7XG5cdFx0ZGF0YS5jaGlsZHJlbiA9IGRhdGEuX2NoaWxkcmVuO1xuXHRcdGRhdGEuX2NoaWxkcmVuID0gdW5kZWZpbmVkO1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2lzX2NvbGxhcHNlZCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkICYmIGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFzX2FuY2VzdG9yID0gZnVuY3Rpb24obiwgYW5jZXN0b3IpIHtcblx0Ly8gSXQgaXMgYmV0dGVyIHRvIHdvcmsgYXQgdGhlIGRhdGEgbGV2ZWxcblx0biA9IG4uZGF0YSgpO1xuXHRhbmNlc3RvciA9IGFuY2VzdG9yLmRhdGEoKTtcblx0aWYgKG4uX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm4gZmFsc2Vcblx0fVxuXHRuID0gbi5fcGFyZW50XG5cdGZvciAoOzspIHtcblx0ICAgIGlmIChuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBpZiAobiA9PT0gYW5jZXN0b3IpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIG4gPSBuLl9wYXJlbnQ7XG5cdH1cbiAgICB9O1xuXG4gICAgLy8gVGhpcyBpcyB0aGUgZWFzaWVzdCB3YXkgdG8gY2FsY3VsYXRlIHRoZSBMQ0EgSSBjYW4gdGhpbmsgb2YuIEJ1dCBpdCBpcyB2ZXJ5IGluZWZmaWNpZW50IHRvby5cbiAgICAvLyBJdCBpcyB3b3JraW5nIGZpbmUgYnkgbm93LCBidXQgaW4gY2FzZSBpdCBuZWVkcyB0byBiZSBtb3JlIHBlcmZvcm1hbnQgd2UgY2FuIGltcGxlbWVudCB0aGUgTENBXG4gICAgLy8gYWxnb3JpdGhtIGV4cGxhaW5lZCBoZXJlOlxuICAgIC8vIGh0dHA6Ly9jb21tdW5pdHkudG9wY29kZXIuY29tL3RjP21vZHVsZT1TdGF0aWMmZDE9dHV0b3JpYWxzJmQyPWxvd2VzdENvbW1vbkFuY2VzdG9yXG4gICAgYXBpLm1ldGhvZCAoJ2xjYScsIGZ1bmN0aW9uIChub2Rlcykge1xuXHRpZiAobm9kZXMubGVuZ3RoID09PSAxKSB7XG5cdCAgICByZXR1cm4gbm9kZXNbMF07XG5cdH1cblx0dmFyIGxjYV9ub2RlID0gbm9kZXNbMF07XG5cdGZvciAodmFyIGkgPSAxOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBsY2Ffbm9kZSA9IF9sY2EobGNhX25vZGUsIG5vZGVzW2ldKTtcblx0fVxuXHRyZXR1cm4gbGNhX25vZGU7XG5cdC8vIHJldHVybiB0bnRfbm9kZShsY2Ffbm9kZSk7XG4gICAgfSk7XG5cbiAgICB2YXIgX2xjYSA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xuXHRpZiAobm9kZTEuZGF0YSgpID09PSBub2RlMi5kYXRhKCkpIHtcblx0ICAgIHJldHVybiBub2RlMTtcblx0fVxuXHRpZiAoaGFzX2FuY2VzdG9yKG5vZGUxLCBub2RlMikpIHtcblx0ICAgIHJldHVybiBub2RlMjtcblx0fVxuXHRyZXR1cm4gX2xjYShub2RlMSwgbm9kZTIucGFyZW50KCkpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kKCduX2hpZGRlbicsIGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gbm9kZS5wcm9wZXJ0eSgnX2hpZGRlbicpO1xuXHR9XG5cdG5vZGUucHJvcGVydHkoJ19oaWRkZW4nLCB2YWwpO1xuXHRyZXR1cm4gbm9kZVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbm9kZXMnLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgbm9kZXMucHVzaChuKTtcblx0fSwgZGVlcCk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdnZXRfYWxsX2xlYXZlcycsIGZ1bmN0aW9uIChkZWVwKSB7XG5cdHZhciBsZWF2ZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKG4uaXNfbGVhZihkZWVwKSkge1xuXHRcdGxlYXZlcy5wdXNoKG4pO1xuXHQgICAgfVxuXHR9LCBkZWVwKTtcblx0cmV0dXJuIGxlYXZlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd1cHN0cmVhbScsIGZ1bmN0aW9uKGNiYWspIHtcblx0Y2Jhayhub2RlKTtcblx0dmFyIHBhcmVudCA9IG5vZGUucGFyZW50KCk7XG5cdGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgcGFyZW50LnVwc3RyZWFtKGNiYWspO1xuXHR9XG4vL1x0dG50X25vZGUocGFyZW50KS51cHN0cmVhbShjYmFrKTtcbi8vIFx0bm9kZS51cHN0cmVhbShub2RlLl9wYXJlbnQsIGNiYWspO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3N1YnRyZWUnLCBmdW5jdGlvbihub2Rlcywga2VlcF9zaW5nbGV0b25zKSB7XG5cdGlmIChrZWVwX3NpbmdsZXRvbnMgPT09IHVuZGVmaW5lZCkge1xuXHQgICAga2VlcF9zaW5nbGV0b25zID0gZmFsc2U7XG5cdH1cbiAgICBcdHZhciBub2RlX2NvdW50cyA9IHt9O1xuICAgIFx0Zm9yICh2YXIgaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgbiA9IG5vZGVzW2ldO1xuXHQgICAgaWYgKG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdG4udXBzdHJlYW0gKGZ1bmN0aW9uICh0aGlzX25vZGUpe1xuXHRcdCAgICB2YXIgaWQgPSB0aGlzX25vZGUuaWQoKTtcblx0XHQgICAgaWYgKG5vZGVfY291bnRzW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRub2RlX2NvdW50c1tpZF0gPSAwO1xuXHRcdCAgICB9XG5cdFx0ICAgIG5vZGVfY291bnRzW2lkXSsrXG4gICAgXHRcdH0pO1xuXHQgICAgfVxuICAgIFx0fVxuICAgIFxuXHR2YXIgaXNfc2luZ2xldG9uID0gZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5fY2hpbGRyZW4gPSAwO1xuXHQgICAgaWYgKG5vZGVfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuXHQgICAgZm9yICh2YXIgaT0wOyBpPG5vZGVfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBpZCA9IG5vZGVfZGF0YS5jaGlsZHJlbltpXS5faWQ7XG5cdFx0aWYgKG5vZGVfY291bnRzW2lkXSA+IDApIHtcblx0XHQgICAgbl9jaGlsZHJlbisrO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBuX2NoaWxkcmVuID09PSAxO1xuXHR9O1xuXG5cdHZhciBzdWJ0cmVlID0ge307XG5cdGNvcHlfZGF0YSAoZGF0YSwgc3VidHJlZSwgMCwgZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5vZGVfaWQgPSBub2RlX2RhdGEuX2lkO1xuXHQgICAgdmFyIGNvdW50cyA9IG5vZGVfY291bnRzW25vZGVfaWRdO1xuXHQgICAgXG5cdCAgICAvLyBJcyBpbiBwYXRoXG5cdCAgICBpZiAoY291bnRzID4gMCkge1xuXHRcdGlmIChpc19zaW5nbGV0b24obm9kZV9kYXRhKSAmJiAha2VlcF9zaW5nbGV0b25zKSB7XG5cdFx0ICAgIHJldHVybiBmYWxzZTsgXG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgLy8gSXMgbm90IGluIHBhdGhcblx0ICAgIHJldHVybiBmYWxzZTtcblx0fSk7XG5cblx0cmV0dXJuIHRudF9ub2RlKHN1YnRyZWUuY2hpbGRyZW5bMF0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGNvcHlfZGF0YSA9IGZ1bmN0aW9uIChvcmlnX2RhdGEsIHN1YnRyZWUsIGN1cnJCcmFuY2hMZW5ndGgsIGNvbmRpdGlvbikge1xuICAgICAgICBpZiAob3JpZ19kYXRhID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25kaXRpb24ob3JpZ19kYXRhKSkge1xuXHQgICAgdmFyIGNvcHkgPSBjb3B5X25vZGUob3JpZ19kYXRhLCBjdXJyQnJhbmNoTGVuZ3RoKTtcblx0ICAgIGlmIChzdWJ0cmVlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzdWJ0cmVlLmNoaWxkcmVuID0gW107XG5cdCAgICB9XG5cdCAgICBzdWJ0cmVlLmNoaWxkcmVuLnB1c2goY29weSk7XG5cdCAgICBpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvcHlfZGF0YSAob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBjb3B5LCAwLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9IGVsc2Uge1xuXHQgICAgaWYgKG9yaWdfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXHQgICAgY3VyckJyYW5jaExlbmd0aCArPSBvcmlnX2RhdGEuYnJhbmNoX2xlbmd0aCB8fCAwO1xuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmlnX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb3B5X2RhdGEob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBzdWJ0cmVlLCBjdXJyQnJhbmNoTGVuZ3RoLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBjb3B5X25vZGUgPSBmdW5jdGlvbiAobm9kZV9kYXRhLCBleHRyYUJyYW5jaExlbmd0aCkge1xuXHR2YXIgY29weSA9IHt9O1xuXHQvLyBjb3B5IGFsbCB0aGUgb3duIHByb3BlcnRpZXMgZXhjZXB0cyBsaW5rcyB0byBvdGhlciBub2RlcyBvciBkZXB0aFxuXHRmb3IgKHZhciBwYXJhbSBpbiBub2RlX2RhdGEpIHtcblx0ICAgIGlmICgocGFyYW0gPT09IFwiY2hpbGRyZW5cIikgfHxcblx0XHQocGFyYW0gPT09IFwiX2NoaWxkcmVuXCIpIHx8XG5cdFx0KHBhcmFtID09PSBcIl9wYXJlbnRcIikgfHxcblx0XHQocGFyYW0gPT09IFwiZGVwdGhcIikpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIGlmIChub2RlX2RhdGEuaGFzT3duUHJvcGVydHkocGFyYW0pKSB7XG5cdFx0Y29weVtwYXJhbV0gPSBub2RlX2RhdGFbcGFyYW1dO1xuXHQgICAgfVxuXHR9XG5cdGlmICgoY29weS5icmFuY2hfbGVuZ3RoICE9PSB1bmRlZmluZWQpICYmIChleHRyYUJyYW5jaExlbmd0aCAhPT0gdW5kZWZpbmVkKSkge1xuXHQgICAgY29weS5icmFuY2hfbGVuZ3RoICs9IGV4dHJhQnJhbmNoTGVuZ3RoO1xuXHR9XG5cdHJldHVybiBjb3B5O1xuICAgIH07XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCB2aXNpdHMgYWxsIHRoZSBub2Rlc1xuICAgIC8vIGEgbW9yZSBwZXJmb3JtYW50IHZlcnNpb24gc2hvdWxkIHJldHVybiB0cnVlXG4gICAgLy8gdGhlIGZpcnN0IHRpbWUgY2Jhayhub2RlKSBpcyB0cnVlXG4gICAgYXBpLm1ldGhvZCAoJ3ByZXNlbnQnLCBmdW5jdGlvbiAoY2Jhaykge1xuXHQvLyBjYmFrIHNob3VsZCByZXR1cm4gdHJ1ZS9mYWxzZVxuXHR2YXIgaXNfdHJ1ZSA9IGZhbHNlO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikgPT09IHRydWUpIHtcblx0XHRpc190cnVlID0gdHJ1ZTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBpc190cnVlO1xuICAgIH0pO1xuXG4gICAgLy8gY2JhayBpcyBjYWxsZWQgd2l0aCB0d28gbm9kZXNcbiAgICAvLyBhbmQgc2hvdWxkIHJldHVybiBhIG5lZ2F0aXZlIG51bWJlciwgMCBvciBhIHBvc2l0aXZlIG51bWJlclxuICAgIGFwaS5tZXRob2QgKCdzb3J0JywgZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0dmFyIG5ld19jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgbmV3X2NoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHR9XG5cblx0bmV3X2NoaWxkcmVuLnNvcnQoY2Jhayk7XG5cblx0ZGF0YS5jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8bmV3X2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkYXRhLmNoaWxkcmVuLnB1c2gobmV3X2NoaWxkcmVuW2ldLmRhdGEoKSk7XG5cdH1cblxuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgdG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkuc29ydChjYmFrKTtcblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZsYXR0ZW4nLCBmdW5jdGlvbiAocHJlc2VydmVfaW50ZXJuYWwpIHtcblx0aWYgKG5vZGUuaXNfbGVhZigpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXHR2YXIgZGF0YSA9IG5vZGUuZGF0YSgpO1xuXHR2YXIgbmV3cm9vdCA9IGNvcHlfbm9kZShkYXRhKTtcblx0dmFyIG5vZGVzO1xuXHRpZiAocHJlc2VydmVfaW50ZXJuYWwpIHtcblx0ICAgIG5vZGVzID0gbm9kZS5nZXRfYWxsX25vZGVzKCk7XG5cdCAgICBub2Rlcy5zaGlmdCgpOyAvLyB0aGUgc2VsZiBub2RlIGlzIGFsc28gaW5jbHVkZWRcblx0fSBlbHNlIHtcblx0ICAgIG5vZGVzID0gbm9kZS5nZXRfYWxsX2xlYXZlcygpO1xuXHR9XG5cdG5ld3Jvb3QuY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkZWxldGUgKG5vZGVzW2ldLmNoaWxkcmVuKTtcblx0ICAgIG5ld3Jvb3QuY2hpbGRyZW4ucHVzaChjb3B5X25vZGUobm9kZXNbaV0uZGF0YSgpKSk7XG5cdH1cblxuXHRyZXR1cm4gdG50X25vZGUobmV3cm9vdCk7XG4gICAgfSk7XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCBvbmx5ICdhcHBseSdzIHRvIG5vbiBjb2xsYXBzZWQgbm9kZXMgKGllIC5fY2hpbGRyZW4gaXMgbm90IHZpc2l0ZWQpXG4gICAgLy8gV291bGQgaXQgYmUgYmV0dGVyIHRvIGhhdmUgYW4gZXh0cmEgZmxhZyAodHJ1ZS9mYWxzZSkgdG8gdmlzaXQgYWxzbyBjb2xsYXBzZWQgbm9kZXM/XG4gICAgYXBpLm1ldGhvZCAoJ2FwcGx5JywgZnVuY3Rpb24oY2JhaywgZGVlcCkge1xuXHRpZiAoZGVlcCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICBkZWVwID0gZmFsc2U7XG5cdH1cblx0Y2Jhayhub2RlKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbiA9IHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pXG5cdFx0bi5hcHBseShjYmFrLCBkZWVwKTtcblx0ICAgIH1cblx0fVxuXG5cdGlmICgoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkgJiYgZGVlcCkge1xuXHQgICAgZm9yICh2YXIgaj0wOyBqPGRhdGEuX2NoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIG4gPSB0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltqXSk7XG5cdFx0bi5hcHBseShjYmFrLCBkZWVwKTtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHZpYSBhIGNhbGxiYWNrOlxuICAgIC8vIHJvb3QucHJvcGVydHkgKGZ1bmN0aW9uIChub2RlLCB2YWwpIHtcbiAgICAvLyAgICBub2RlLmRlZXBlci5maWVsZCA9IHZhbFxuICAgIC8vIH0sICduZXdfdmFsdWUnKVxuICAgIGFwaS5tZXRob2QgKCdwcm9wZXJ0eScsIGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG5cdCAgICBpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBwcm9wKGRhdGEpXHRcblx0ICAgIH1cblx0ICAgIHJldHVybiBkYXRhW3Byb3BdXG5cdH1cblx0aWYgKCh0eXBlb2YgcHJvcCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIHByb3AoZGF0YSwgdmFsdWUpOyAgIFxuXHR9XG5cdGRhdGFbcHJvcF0gPSB2YWx1ZTtcblx0cmV0dXJuIG5vZGU7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfbGVhZicsIGZ1bmN0aW9uKGRlZXApIHtcblx0aWYgKGRlZXApIHtcblx0ICAgIHJldHVybiAoKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgJiYgKGRhdGEuX2NoaWxkcmVuID09PSB1bmRlZmluZWQpKTtcblx0fVxuXHRyZXR1cm4gZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkO1xuICAgIH0pO1xuXG4gICAgLy8gSXQgbG9va3MgbGlrZSB0aGUgY2x1c3RlciBjYW4ndCBiZSB1c2VkIGZvciBhbnl0aGluZyB1c2VmdWwgaGVyZVxuICAgIC8vIEl0IGlzIG5vdyBpbmNsdWRlZCBhcyBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gdGhlIHRudC50cmVlKCkgbWV0aG9kIGNhbGxcbiAgICAvLyBzbyBJJ20gY29tbWVudGluZyB0aGUgZ2V0dGVyXG4gICAgLy8gbm9kZS5jbHVzdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gXHRyZXR1cm4gY2x1c3RlcjtcbiAgICAvLyB9O1xuXG4gICAgLy8gbm9kZS5kZXB0aCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgLy8gICAgIHJldHVybiBub2RlLmRlcHRoO1xuICAgIC8vIH07XG5cbi8vICAgICBub2RlLm5hbWUgPSBmdW5jdGlvbiAobm9kZSkge1xuLy8gICAgICAgICByZXR1cm4gbm9kZS5uYW1lO1xuLy8gICAgIH07XG5cbiAgICBhcGkubWV0aG9kICgnaWQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfaWQnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdub2RlX25hbWUnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCduYW1lJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnYnJhbmNoX2xlbmd0aCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ2JyYW5jaF9sZW5ndGgnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyb290X2Rpc3QnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfcm9vdF9kaXN0Jyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnY2hpbGRyZW4nLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgY2hpbGRyZW4gPSBbXTtcblxuXHRpZiAoZGF0YS5jaGlsZHJlbikge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pKTtcblx0ICAgIH1cblx0fVxuXHRpZiAoKGRhdGEuX2NoaWxkcmVuKSAmJiBkZWVwKSB7XG5cdCAgICBmb3IgKHZhciBqPTA7IGo8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHRjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2pdKSk7XG5cdCAgICB9XG5cdH1cblx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gY2hpbGRyZW47XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgncGFyZW50JywgZnVuY3Rpb24gKCkge1xuXHRpZiAoZGF0YS5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0cmV0dXJuIHRudF9ub2RlKGRhdGEuX3BhcmVudCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbm9kZTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X25vZGU7XG5cbiIsIi8vIGlmICh0eXBlb2YgdG50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4vLyAgICAgbW9kdWxlLmV4cG9ydHMgPSB0bnQgPSB7fVxuLy8gfVxubW9kdWxlLmV4cG9ydHMgPSB0cmVlID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xudmFyIGV2ZW50c3lzdGVtID0gcmVxdWlyZShcImJpb2pzLWV2ZW50c1wiKTtcbmV2ZW50c3lzdGVtLm1peGluKHRyZWUpO1xuLy90bnQudXRpbHMgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpO1xuLy90bnQudG9vbHRpcCA9IHJlcXVpcmUoXCJ0bnQudG9vbHRpcFwiKTtcbi8vdG50LnRyZWUgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG5cbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoJ3RudC5hcGknKTtcbnZhciB0cmVlID0ge307XG5cbnRyZWUuZGlhZ29uYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGQgPSBmdW5jdGlvbiAoZGlhZ29uYWxQYXRoKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBkaWFnb25hbFBhdGguc291cmNlO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZGlhZ29uYWxQYXRoLnRhcmdldDtcbiAgICAgICAgdmFyIG1pZHBvaW50WCA9IChzb3VyY2UueCArIHRhcmdldC54KSAvIDI7XG4gICAgICAgIHZhciBtaWRwb2ludFkgPSAoc291cmNlLnkgKyB0YXJnZXQueSkgLyAyO1xuICAgICAgICB2YXIgcGF0aERhdGEgPSBbc291cmNlLCB7eDogdGFyZ2V0LngsIHk6IHNvdXJjZS55fSwgdGFyZ2V0XTtcbiAgICAgICAgcGF0aERhdGEgPSBwYXRoRGF0YS5tYXAoZC5wcm9qZWN0aW9uKCkpO1xuICAgICAgICByZXR1cm4gZC5wYXRoKCkocGF0aERhdGEsIHJhZGlhbF9jYWxjLmNhbGwodGhpcyxwYXRoRGF0YSkpO1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGQpXG4gICAgXHQuZ2V0c2V0ICgncHJvamVjdGlvbicpXG4gICAgXHQuZ2V0c2V0ICgncGF0aCcpO1xuXG4gICAgdmFyIGNvb3JkaW5hdGVUb0FuZ2xlID0gZnVuY3Rpb24gKGNvb3JkLCByYWRpdXMpIHtcbiAgICAgIFx0dmFyIHdob2xlQW5nbGUgPSAyICogTWF0aC5QSSxcbiAgICAgICAgcXVhcnRlckFuZ2xlID0gd2hvbGVBbmdsZSAvIDQ7XG5cbiAgICAgIFx0dmFyIGNvb3JkUXVhZCA9IGNvb3JkWzBdID49IDAgPyAoY29vcmRbMV0gPj0gMCA/IDEgOiAyKSA6IChjb29yZFsxXSA+PSAwID8gNCA6IDMpLFxuICAgICAgICBjb29yZEJhc2VBbmdsZSA9IE1hdGguYWJzKE1hdGguYXNpbihjb29yZFsxXSAvIHJhZGl1cykpO1xuXG4gICAgICBcdC8vIFNpbmNlIHRoaXMgaXMganVzdCBiYXNlZCBvbiB0aGUgYW5nbGUgb2YgdGhlIHJpZ2h0IHRyaWFuZ2xlIGZvcm1lZFxuICAgICAgXHQvLyBieSB0aGUgY29vcmRpbmF0ZSBhbmQgdGhlIG9yaWdpbiwgZWFjaCBxdWFkIHdpbGwgaGF2ZSBkaWZmZXJlbnRcbiAgICAgIFx0Ly8gb2Zmc2V0c1xuICAgICAgXHR2YXIgY29vcmRBbmdsZTtcbiAgICAgIFx0c3dpdGNoIChjb29yZFF1YWQpIHtcbiAgICAgIFx0Y2FzZSAxOlxuICAgICAgXHQgICAgY29vcmRBbmdsZSA9IHF1YXJ0ZXJBbmdsZSAtIGNvb3JkQmFzZUFuZ2xlO1xuICAgICAgXHQgICAgYnJlYWs7XG4gICAgICBcdGNhc2UgMjpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSBxdWFydGVyQW5nbGUgKyBjb29yZEJhc2VBbmdsZTtcbiAgICAgIFx0ICAgIGJyZWFrO1xuICAgICAgXHRjYXNlIDM6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gMipxdWFydGVyQW5nbGUgKyBxdWFydGVyQW5nbGUgLSBjb29yZEJhc2VBbmdsZTtcbiAgICAgIFx0ICAgIGJyZWFrO1xuICAgICAgXHRjYXNlIDQ6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gMypxdWFydGVyQW5nbGUgKyBjb29yZEJhc2VBbmdsZTtcbiAgICAgIFx0fVxuICAgICAgXHRyZXR1cm4gY29vcmRBbmdsZTtcbiAgICB9O1xuXG4gICAgdmFyIHJhZGlhbF9jYWxjID0gZnVuY3Rpb24gKHBhdGhEYXRhKSB7XG4gICAgICAgIHZhciBzcmMgPSBwYXRoRGF0YVswXTtcbiAgICAgICAgdmFyIG1pZCA9IHBhdGhEYXRhWzFdO1xuICAgICAgICB2YXIgZHN0ID0gcGF0aERhdGFbMl07XG4gICAgICAgIHZhciByYWRpdXMgPSBNYXRoLnNxcnQoc3JjWzBdKnNyY1swXSArIHNyY1sxXSpzcmNbMV0pO1xuICAgICAgICB2YXIgc3JjQW5nbGUgPSBjb29yZGluYXRlVG9BbmdsZShzcmMsIHJhZGl1cyk7XG4gICAgICAgIHZhciBtaWRBbmdsZSA9IGNvb3JkaW5hdGVUb0FuZ2xlKG1pZCwgcmFkaXVzKTtcbiAgICAgICAgdmFyIGNsb2Nrd2lzZSA9IE1hdGguYWJzKG1pZEFuZ2xlIC0gc3JjQW5nbGUpID4gTWF0aC5QSSA/IG1pZEFuZ2xlIDw9IHNyY0FuZ2xlIDogbWlkQW5nbGUgPiBzcmNBbmdsZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJhZGl1cyAgIDogcmFkaXVzLFxuICAgICAgICAgICAgY2xvY2t3aXNlIDogY2xvY2t3aXNlXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHJldHVybiBkO1xufTtcblxuLy8gdmVydGljYWwgZGlhZ29uYWwgZm9yIHJlY3QgYnJhbmNoZXNcbnRyZWUuZGlhZ29uYWwudmVydGljYWwgPSBmdW5jdGlvbiAodXNlQXJjKSB7XG4gICAgdmFyIHBhdGggPSBmdW5jdGlvbihwYXRoRGF0YSwgb2JqKSB7XG4gICAgICAgIHZhciBzcmMgPSBwYXRoRGF0YVswXTtcbiAgICAgICAgdmFyIG1pZCA9IHBhdGhEYXRhWzFdO1xuICAgICAgICB2YXIgZHN0ID0gcGF0aERhdGFbMl07XG4gICAgICAgIHZhciByYWRpdXMgPSAobWlkWzFdIC0gc3JjWzFdKSAqIDIwMDA7XG5cbiAgICAgICAgcmV0dXJuIFwiTVwiICsgc3JjICsgXCIgQVwiICsgW3JhZGl1cyxyYWRpdXNdICsgXCIgMCAwLDAgXCIgKyBtaWQgKyBcIk1cIiArIG1pZCArIFwiTFwiICsgZHN0O1xuICAgICAgICAvLyByZXR1cm4gXCJNXCIgKyBzcmMgKyBcIiBMXCIgKyBtaWQgKyBcIiBMXCIgKyBkc3Q7XG4gICAgfTtcblxuICAgIHZhciBwcm9qZWN0aW9uID0gZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gW2QueSwgZC54XTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRyZWUuZGlhZ29uYWwoKVxuICAgICAgXHQucGF0aChwYXRoKVxuICAgICAgXHQucHJvamVjdGlvbihwcm9qZWN0aW9uKTtcbn07XG5cbnRyZWUuZGlhZ29uYWwucmFkaWFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwYXRoID0gZnVuY3Rpb24ocGF0aERhdGEsIG9iaikge1xuICAgICAgICB2YXIgc3JjID0gcGF0aERhdGFbMF07XG4gICAgICAgIHZhciBtaWQgPSBwYXRoRGF0YVsxXTtcbiAgICAgICAgdmFyIGRzdCA9IHBhdGhEYXRhWzJdO1xuICAgICAgICB2YXIgcmFkaXVzID0gb2JqLnJhZGl1cztcbiAgICAgICAgdmFyIGNsb2Nrd2lzZSA9IG9iai5jbG9ja3dpc2U7XG5cbiAgICAgICAgaWYgKGNsb2Nrd2lzZSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiTVwiICsgc3JjICsgXCIgQVwiICsgW3JhZGl1cyxyYWRpdXNdICsgXCIgMCAwLDAgXCIgKyBtaWQgKyBcIk1cIiArIG1pZCArIFwiTFwiICsgZHN0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFwiTVwiICsgbWlkICsgXCIgQVwiICsgW3JhZGl1cyxyYWRpdXNdICsgXCIgMCAwLDAgXCIgKyBzcmMgKyBcIk1cIiArIG1pZCArIFwiTFwiICsgZHN0O1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBwcm9qZWN0aW9uID0gZnVuY3Rpb24oZCkge1xuICAgICAgXHR2YXIgciA9IGQueSwgYSA9IChkLnggLSA5MCkgLyAxODAgKiBNYXRoLlBJO1xuICAgICAgXHRyZXR1cm4gW3IgKiBNYXRoLmNvcyhhKSwgciAqIE1hdGguc2luKGEpXTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRyZWUuZGlhZ29uYWwoKVxuICAgICAgXHQucGF0aChwYXRoKVxuICAgICAgXHQucHJvamVjdGlvbihwcm9qZWN0aW9uKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWUuZGlhZ29uYWw7XG4iLCJ2YXIgdHJlZSA9IHJlcXVpcmUgKFwiLi90cmVlLmpzXCIpO1xudHJlZS5sYWJlbCA9IHJlcXVpcmUoXCIuL2xhYmVsLmpzXCIpO1xudHJlZS5kaWFnb25hbCA9IHJlcXVpcmUoXCIuL2RpYWdvbmFsLmpzXCIpO1xudHJlZS5sYXlvdXQgPSByZXF1aXJlKFwiLi9sYXlvdXQuanNcIik7XG50cmVlLm5vZGVfZGlzcGxheSA9IHJlcXVpcmUoXCIuL25vZGVfZGlzcGxheS5qc1wiKTtcbi8vIHRyZWUubm9kZSA9IHJlcXVpcmUoXCJ0bnQudHJlZS5ub2RlXCIpO1xuLy8gdHJlZS5wYXJzZV9uZXdpY2sgPSByZXF1aXJlKFwidG50Lm5ld2lja1wiKS5wYXJzZV9uZXdpY2s7XG4vLyB0cmVlLnBhcnNlX25oeCA9IHJlcXVpcmUoXCJ0bnQubmV3aWNrXCIpLnBhcnNlX25oeDtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZTtcblxuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLmxhYmVsID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2ggKFwiY2xpY2tcIiwgXCJkYmxjbGlja1wiLCBcIm1vdXNlb3ZlclwiLCBcIm1vdXNlb3V0XCIpXG5cbiAgICAvLyBUT0RPOiBOb3Qgc3VyZSBpZiB3ZSBzaG91bGQgYmUgcmVtb3ZpbmcgYnkgZGVmYXVsdCBwcmV2IGxhYmVsc1xuICAgIC8vIG9yIGl0IHdvdWxkIGJlIGJldHRlciB0byBoYXZlIGEgc2VwYXJhdGUgcmVtb3ZlIG1ldGhvZCBjYWxsZWQgYnkgdGhlIHZpc1xuICAgIC8vIG9uIHVwZGF0ZVxuICAgIC8vIFdlIGFsc28gaGF2ZSB0aGUgcHJvYmxlbSB0aGF0IHdlIG1heSBiZSB0cmFuc2l0aW9uaW5nIGZyb21cbiAgICAvLyB0ZXh0IHRvIGltZyBsYWJlbHMgYW5kIHdlIG5lZWQgdG8gcmVtb3ZlIHRoZSBsYWJlbCBvZiBhIGRpZmZlcmVudCB0eXBlXG4gICAgdmFyIGxhYmVsID0gZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlLCBub2RlX3NpemUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiAobm9kZSkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93KG5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGFiZWwuZGlzcGxheSgpLmNhbGwodGhpcywgbm9kZSwgbGF5b3V0X3R5cGUpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfbGFiZWxcIilcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHQgPSBsYWJlbC50cmFuc2Zvcm0oKShub2RlLCBsYXlvdXRfdHlwZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwidHJhbnNsYXRlIChcIiArICh0LnRyYW5zbGF0ZVswXSArIG5vZGVfc2l6ZSkgKyBcIiBcIiArIHQudHJhbnNsYXRlWzFdICsgXCIpcm90YXRlKFwiICsgdC5yb3RhdGUgKyBcIilcIjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIC8vIFRPRE86IHRoaXMgY2xpY2sgZXZlbnQgaXMgcHJvYmFibHkgbmV2ZXIgZmlyZWQgc2luY2UgdGhlcmUgaXMgYW4gb25jbGljayBldmVudCBpbiB0aGUgbm9kZSBnIGVsZW1lbnQ/XG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbCh0aGlzLCBub2RlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaC5kYmxjbGljay5jYWxsKHRoaXMsIG5vZGUpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbCh0aGlzLCBub2RlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKHRoaXMsIG5vZGUpXG4gICAgICAgICAgICB9KVxuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxhYmVsKVxuICAgICAgICAuZ2V0c2V0ICgnd2lkdGgnLCBmdW5jdGlvbiAoKSB7IHRocm93IFwiTmVlZCBhIHdpZHRoIGNhbGxiYWNrXCIgfSlcbiAgICAgICAgLmdldHNldCAoJ2hlaWdodCcsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgaGVpZ2h0IGNhbGxiYWNrXCIgfSlcbiAgICAgICAgLmdldHNldCAoJ2Rpc3BsYXknLCBmdW5jdGlvbiAoKSB7IHRocm93IFwiTmVlZCBhIGRpc3BsYXkgY2FsbGJhY2tcIiB9KVxuICAgICAgICAuZ2V0c2V0ICgndHJhbnNmb3JtJywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSB0cmFuc2Zvcm0gY2FsbGJhY2tcIiB9KVxuICAgICAgICAvLy5nZXRzZXQgKCdvbl9jbGljaycpO1xuXG4gICAgcmV0dXJuIGQzLnJlYmluZCAobGFiZWwsIGRpc3BhdGNoLCBcIm9uXCIpO1xufTtcblxuLy8gVGV4dCBiYXNlZCBsYWJlbHNcbnRyZWUubGFiZWwudGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFiZWwgPSB0cmVlLmxhYmVsKCk7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxhYmVsKVxuICAgICAgICAuZ2V0c2V0ICgnZm9udHNpemUnLCAxMClcbiAgICAgICAgLmdldHNldCAoJ2ZvbnR3ZWlnaHQnLCBcIm5vcm1hbFwiKVxuICAgICAgICAuZ2V0c2V0ICgnY29sb3InLCBcIiMwMDBcIilcbiAgICAgICAgLmdldHNldCAoJ3RleHQnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQuZGF0YSgpLm5hbWU7XG4gICAgICAgIH0pXG5cbiAgICBsYWJlbC5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcbiAgICAgICAgdmFyIGwgPSBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxheW91dF90eXBlID09PSBcInJhZGlhbFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoZC54JTM2MCA8IDE4MCkgPyBcInN0YXJ0XCIgOiBcImVuZFwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gXCJzdGFydFwiO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhYmVsLnRleHQoKShub2RlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdHlsZSgnZm9udC1zaXplJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKGxhYmVsLmZvbnRzaXplKCkpKG5vZGUpICsgXCJweFwiO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdHlsZSgnZm9udC13ZWlnaHQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3IobGFiZWwuZm9udHdlaWdodCgpKShub2RlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCBkMy5mdW5jdG9yKGxhYmVsLmNvbG9yKCkpKG5vZGUpKTtcblxuICAgICAgICByZXR1cm4gbDtcbiAgICB9KTtcblxuICAgIGxhYmVsLnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG4gICAgICAgIHZhciBkID0gbm9kZS5kYXRhKCk7XG4gICAgICAgIHZhciB0ID0ge1xuICAgICAgICAgICAgdHJhbnNsYXRlIDogWzUsIDVdLFxuICAgICAgICAgICAgcm90YXRlIDogMFxuICAgICAgICB9O1xuICAgICAgICBpZiAobGF5b3V0X3R5cGUgPT09IFwicmFkaWFsXCIpIHtcbiAgICAgICAgICAgIHQudHJhbnNsYXRlWzFdID0gdC50cmFuc2xhdGVbMV0gLSAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC5mb250c2l6ZSgpKVxuICAgICAgICAgICAgdC5yb3RhdGUgPSAoZC54JTM2MCA8IDE4MCA/IDAgOiAxODApXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfSk7XG5cblxuICAgIC8vIGxhYmVsLnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAvLyBcdHZhciBkID0gbm9kZS5kYXRhKCk7XG4gICAgLy8gXHRyZXR1cm4gXCJ0cmFuc2xhdGUoMTAgNSlyb3RhdGUoXCIgKyAoZC54JTM2MCA8IDE4MCA/IDAgOiAxODApICsgXCIpXCI7XG4gICAgLy8gfSk7XG5cbiAgICBsYWJlbC53aWR0aCAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcImJvZHlcIilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIDApXG4gICAgICAgICAgICAuc3R5bGUoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG5cbiAgICAgICAgdmFyIHRleHQgPSBzdmdcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZvbnQtc2l6ZScsIGQzLmZ1bmN0b3IobGFiZWwuZm9udHNpemUoKSkobm9kZSkgKyBcInB4XCIpXG4gICAgICAgICAgICAudGV4dChsYWJlbC50ZXh0KCkobm9kZSkpO1xuXG4gICAgICAgIHZhciB3aWR0aCA9IHRleHQubm9kZSgpLmdldEJCb3goKS53aWR0aDtcbiAgICAgICAgc3ZnLnJlbW92ZSgpO1xuXG4gICAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9KTtcblxuICAgIGxhYmVsLmhlaWdodCAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3IobGFiZWwuZm9udHNpemUoKSkobm9kZSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG5cbi8vIHN2ZyBiYXNlZCBsYWJlbHNcbnRyZWUubGFiZWwuc3ZnID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYWJlbCA9IHRyZWUubGFiZWwoKTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG4gICAgICAgIC5nZXRzZXQoXCJlbGVtZW50XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZC5kYXRhKCkuZWxlbWVudDtcbiAgICAgICAgfSk7XG4gICAgbGFiZWwuZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG4gICAgICAgIHZhciBuID0gbGFiZWwuZWxlbWVudCgpKG5vZGUpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKG4ubm9kZSgpKTtcbiAgICAgICAgcmV0dXJuIG47XG4gICAgfSk7XG4gICAgbGFiZWwudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcbiAgICAgICAgdmFyIGQgPSBub2RlLmRhdGEoKTtcbiAgICAgICAgdmFyIHQgPSB7XG4gICAgICAgICAgICB0cmFuc2xhdGUgOiBbMTAsICgtbGFiZWwuaGVpZ2h0KCkoKSAvIDIpXSxcbiAgICAgICAgICAgIHJvdGF0ZSA6IDBcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAobGF5b3V0X3R5cGUgPT09ICdyYWRpYWwnKSB7XG4gICAgICAgICAgICB0LnRyYW5zbGF0ZVswXSA9IHQudHJhbnNsYXRlWzBdICsgKGQueCUzNjAgPCAxODAgPyAwIDogbGFiZWwud2lkdGgoKSgpKSxcbiAgICAgICAgICAgIHQudHJhbnNsYXRlWzFdID0gdC50cmFuc2xhdGVbMV0gKyAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC5oZWlnaHQoKSgpKSxcbiAgICAgICAgICAgIHQucm90YXRlID0gKGQueCUzNjAgPCAxODAgPyAwIDogMTgwKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG4vLyBJbWFnZSBiYXNlZCBsYWJlbHNcbnRyZWUubGFiZWwuaW1nID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYWJlbCA9IHRyZWUubGFiZWwoKTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG4gICAgICAgIC5nZXRzZXQgKCdzcmMnLCBmdW5jdGlvbiAoKSB7fSlcblxuICAgIGxhYmVsLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuICAgICAgICBpZiAobGFiZWwuc3JjKCkobm9kZSkpIHtcbiAgICAgICAgICAgIHZhciBsID0gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcImltYWdlXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBsYWJlbC53aWR0aCgpKCkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgbGFiZWwuaGVpZ2h0KCkoKSlcbiAgICAgICAgICAgICAgICAuYXR0cihcInhsaW5rOmhyZWZcIiwgbGFiZWwuc3JjKCkobm9kZSkpO1xuICAgICAgICAgICAgcmV0dXJuIGw7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZmFsbGJhY2sgdGV4dCBpbiBjYXNlIHRoZSBpbWcgaXMgbm90IGZvdW5kP1xuICAgICAgICByZXR1cm4gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLnRleHQoXCJcIik7XG4gICAgfSk7XG5cbiAgICBsYWJlbC50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuICAgICAgICB2YXIgZCA9IG5vZGUuZGF0YSgpO1xuICAgICAgICB2YXIgdCA9IHtcbiAgICAgICAgICAgIHRyYW5zbGF0ZSA6IFsxMCwgKC1sYWJlbC5oZWlnaHQoKSgpIC8gMildLFxuICAgICAgICAgICAgcm90YXRlIDogMFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChsYXlvdXRfdHlwZSA9PT0gJ3JhZGlhbCcpIHtcbiAgICAgICAgICAgIHQudHJhbnNsYXRlWzBdID0gdC50cmFuc2xhdGVbMF0gKyAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC53aWR0aCgpKCkpLFxuICAgICAgICAgICAgdC50cmFuc2xhdGVbMV0gPSB0LnRyYW5zbGF0ZVsxXSArIChkLnglMzYwIDwgMTgwID8gMCA6IGxhYmVsLmhlaWdodCgpKCkpLFxuICAgICAgICAgICAgdC5yb3RhdGUgPSAoZC54JTM2MCA8IDE4MCA/IDAgOiAxODApXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYWJlbDtcbn07XG5cbi8vIExhYmVscyBtYWRlIG9mIDIrIHNpbXBsZSBsYWJlbHNcbnRyZWUubGFiZWwuY29tcG9zaXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYWJlbHMgPSBbXTtcblxuICAgIHZhciBsYWJlbCA9IGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSwgbm9kZV9zaXplKSB7XG4gICAgICAgIHZhciBjdXJyX3hvZmZzZXQgPSAwO1xuXG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxsYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBkaXNwbGF5ID0gbGFiZWxzW2ldO1xuXG4gICAgICAgICAgICAoZnVuY3Rpb24gKG9mZnNldCkge1xuICAgICAgICAgICAgICAgIGRpc3BsYXkudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRzdXBlciA9IGRpc3BsYXkuX3N1cGVyXy50cmFuc2Zvcm0oKShub2RlLCBsYXlvdXRfdHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNsYXRlIDogW29mZnNldCArIHRzdXBlci50cmFuc2xhdGVbMF0sIHRzdXBlci50cmFuc2xhdGVbMV1dLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRlIDogdHN1cGVyLnJvdGF0ZVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdDtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSkoY3Vycl94b2Zmc2V0KTtcblxuICAgICAgICAgICAgY3Vycl94b2Zmc2V0ICs9IDEwO1xuICAgICAgICAgICAgY3Vycl94b2Zmc2V0ICs9IGRpc3BsYXkud2lkdGgoKShub2RlKTtcblxuICAgICAgICAgICAgZGlzcGxheS5jYWxsKHRoaXMsIG5vZGUsIGxheW91dF90eXBlLCBub2RlX3NpemUpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG5cbiAgICBhcGkubWV0aG9kICgnYWRkX2xhYmVsJywgZnVuY3Rpb24gKGRpc3BsYXksIG5vZGUpIHtcbiAgICAgICAgZGlzcGxheS5fc3VwZXJfID0ge307XG4gICAgICAgIGFwaWpzIChkaXNwbGF5Ll9zdXBlcl8pXG4gICAgICAgICAgICAuZ2V0ICgndHJhbnNmb3JtJywgZGlzcGxheS50cmFuc2Zvcm0oKSk7XG5cbiAgICAgICAgbGFiZWxzLnB1c2goZGlzcGxheSk7XG4gICAgICAgIHJldHVybiBsYWJlbDtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd3aWR0aCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgdG90X3dpZHRoID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxsYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0b3Rfd2lkdGggKz0gcGFyc2VJbnQobGFiZWxzW2ldLndpZHRoKCkobm9kZSkpO1xuICAgICAgICAgICAgICAgIHRvdF93aWR0aCArPSBwYXJzZUludChsYWJlbHNbaV0uX3N1cGVyXy50cmFuc2Zvcm0oKShub2RlKS50cmFuc2xhdGVbMF0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdG90X3dpZHRoO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaGVpZ2h0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciBtYXhfaGVpZ2h0ID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxsYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY3Vycl9oZWlnaHQgPSBsYWJlbHNbaV0uaGVpZ2h0KCkobm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKCBjdXJyX2hlaWdodCA+IG1heF9oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4X2hlaWdodCA9IGN1cnJfaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtYXhfaGVpZ2h0O1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmxhYmVsO1xuIiwiLy8gQmFzZWQgb24gdGhlIGNvZGUgYnkgS2VuLWljaGkgVWVkYSBpbiBodHRwOi8vYmwub2Nrcy5vcmcva3VlZGEvMTAzNjc3NiNkMy5waHlsb2dyYW0uanNcblxudmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgZGlhZ29uYWwgPSByZXF1aXJlKFwiLi9kaWFnb25hbC5qc1wiKTtcbnZhciB0cmVlID0ge307XG5cbnRyZWUubGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgfTtcblxuICAgIHZhciBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxuICAgIFx0LnNvcnQobnVsbClcbiAgICBcdC52YWx1ZShmdW5jdGlvbiAoZCkge3JldHVybiBkLmxlbmd0aDt9IClcbiAgICBcdC5zZXBhcmF0aW9uKGZ1bmN0aW9uICgpIHtyZXR1cm4gMTt9KTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobClcbiAgICBcdC5nZXRzZXQgKCdzY2FsZScsIHRydWUpXG4gICAgXHQuZ2V0c2V0ICgnbWF4X2xlYWZfbGFiZWxfd2lkdGgnLCAwKVxuICAgIFx0Lm1ldGhvZCAoXCJjbHVzdGVyXCIsIGNsdXN0ZXIpXG4gICAgXHQubWV0aG9kKCd5c2NhbGUnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJ5c2NhbGUgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCI7fSlcbiAgICBcdC5tZXRob2QoJ2FkanVzdF9jbHVzdGVyX3NpemUnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJhZGp1c3RfY2x1c3Rlcl9zaXplIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwiOyB9KVxuICAgIFx0Lm1ldGhvZCgnd2lkdGgnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJ3aWR0aCBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIjt9KVxuICAgIFx0Lm1ldGhvZCgnaGVpZ2h0JywgZnVuY3Rpb24gKCkge3Rocm93IFwiaGVpZ2h0IGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwiO30pO1xuXG4gICAgYXBpLm1ldGhvZCgnc2NhbGVfYnJhbmNoX2xlbmd0aHMnLCBmdW5jdGlvbiAoY3Vycikge1xuICAgIFx0aWYgKGwuc2NhbGUoKSA9PT0gZmFsc2UpIHtcbiAgICBcdCAgICByZXR1cm47XG4gICAgXHR9XG5cbiAgICBcdHZhciBub2RlcyA9IGN1cnIubm9kZXM7XG4gICAgXHR2YXIgdHJlZSA9IGN1cnIudHJlZTtcblxuICAgIFx0dmFyIHJvb3RfZGlzdHMgPSBub2Rlcy5tYXAgKGZ1bmN0aW9uIChkKSB7XG4gICAgXHQgICAgcmV0dXJuIGQuX3Jvb3RfZGlzdDtcbiAgICBcdH0pO1xuXG4gICAgXHR2YXIgeXNjYWxlID0gbC55c2NhbGUocm9vdF9kaXN0cyk7XG4gICAgXHR0cmVlLmFwcGx5IChmdW5jdGlvbiAobm9kZSkge1xuICAgIFx0ICAgIG5vZGUucHJvcGVydHkoXCJ5XCIsIHlzY2FsZShub2RlLnJvb3RfZGlzdCgpKSk7XG4gICAgXHR9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsO1xufTtcblxudHJlZS5sYXlvdXQudmVydGljYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxheW91dCA9IHRyZWUubGF5b3V0KCk7XG4gICAgLy8gRWxlbWVudHMgbGlrZSAnbGFiZWxzJyBkZXBlbmQgb24gdGhlIGxheW91dCB0eXBlLiBUaGlzIGV4cG9zZXMgYSB3YXkgb2YgaWRlbnRpZnlpbmcgdGhlIGxheW91dCB0eXBlXG4gICAgbGF5b3V0LnR5cGUgPSBcInZlcnRpY2FsXCI7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxheW91dClcbiAgICBcdC5nZXRzZXQgKCd3aWR0aCcsIDM2MClcbiAgICBcdC5nZXQgKCd0cmFuc2xhdGVfdmlzJywgWzIwLDIwXSlcbiAgICBcdC5tZXRob2QgKCdkaWFnb25hbCcsIGRpYWdvbmFsLnZlcnRpY2FsKVxuICAgIFx0Lm1ldGhvZCAoJ3RyYW5zZm9ybV9ub2RlJywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgXHQgICAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgZC55ICsgXCIsXCIgKyBkLnggKyBcIilcIjtcbiAgICBcdH0pO1xuXG4gICAgYXBpLm1ldGhvZCgnaGVpZ2h0JywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIFx0cmV0dXJuIChwYXJhbXMubl9sZWF2ZXMgKiBwYXJhbXMubGFiZWxfaGVpZ2h0KTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QoJ3lzY2FsZScsIGZ1bmN0aW9uIChkaXN0cykge1xuICAgIFx0cmV0dXJuIGQzLnNjYWxlLmxpbmVhcigpXG4gICAgXHQgICAgLmRvbWFpbihbMCwgZDMubWF4KGRpc3RzKV0pXG4gICAgXHQgICAgLnJhbmdlKFswLCBsYXlvdXQud2lkdGgoKSAtIDIwIC0gbGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKCldKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QoJ2FkanVzdF9jbHVzdGVyX3NpemUnLCBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgXHR2YXIgaCA9IGxheW91dC5oZWlnaHQocGFyYW1zKTtcbiAgICBcdHZhciB3ID0gbGF5b3V0LndpZHRoKCkgLSBsYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgoKSAtIGxheW91dC50cmFuc2xhdGVfdmlzKClbMF0gLSBwYXJhbXMubGFiZWxfcGFkZGluZztcbiAgICBcdGxheW91dC5jbHVzdGVyLnNpemUgKFtoLHddKTtcbiAgICBcdHJldHVybiBsYXlvdXQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGF5b3V0O1xufTtcblxudHJlZS5sYXlvdXQucmFkaWFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYXlvdXQgPSB0cmVlLmxheW91dCgpO1xuICAgIC8vIEVsZW1lbnRzIGxpa2UgJ2xhYmVscycgZGVwZW5kIG9uIHRoZSBsYXlvdXQgdHlwZS4gVGhpcyBleHBvc2VzIGEgd2F5IG9mIGlkZW50aWZ5aW5nIHRoZSBsYXlvdXQgdHlwZVxuICAgIGxheW91dC50eXBlID0gJ3JhZGlhbCc7XG5cbiAgICB2YXIgZGVmYXVsdF93aWR0aCA9IDM2MDtcbiAgICB2YXIgciA9IGRlZmF1bHRfd2lkdGggLyAyO1xuXG4gICAgdmFyIGNvbmYgPSB7XG4gICAgXHR3aWR0aCA6IDM2MFxuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxheW91dClcbiAgICBcdC5nZXRzZXQgKGNvbmYpXG4gICAgXHQuZ2V0c2V0ICgndHJhbnNsYXRlX3ZpcycsIFtyLCByXSkgLy8gVE9ETzogMS4zIHNob3VsZCBiZSByZXBsYWNlZCBieSBhIHNlbnNpYmxlIHZhbHVlXG4gICAgXHQubWV0aG9kICgndHJhbnNmb3JtX25vZGUnLCBmdW5jdGlvbiAoZCkge1xuICAgIFx0ICAgIHJldHVybiBcInJvdGF0ZShcIiArIChkLnggLSA5MCkgKyBcIil0cmFuc2xhdGUoXCIgKyBkLnkgKyBcIilcIjtcbiAgICBcdH0pXG4gICAgXHQubWV0aG9kICgnZGlhZ29uYWwnLCBkaWFnb25hbC5yYWRpYWwpXG4gICAgXHQubWV0aG9kICgnaGVpZ2h0JywgZnVuY3Rpb24gKCkgeyByZXR1cm4gY29uZi53aWR0aDsgfSk7XG5cbiAgICAvLyBDaGFuZ2VzIGluIHdpZHRoIGFmZmVjdCBjaGFuZ2VzIGluIHJcbiAgICBsYXlvdXQud2lkdGgudHJhbnNmb3JtIChmdW5jdGlvbiAodmFsKSB7XG4gICAgXHRyID0gdmFsIC8gMjtcbiAgICBcdGxheW91dC5jbHVzdGVyLnNpemUoWzM2MCwgcl0pO1xuICAgIFx0bGF5b3V0LnRyYW5zbGF0ZV92aXMoW3IsIHJdKTtcbiAgICBcdHJldHVybiB2YWw7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kIChcInlzY2FsZVwiLCAgZnVuY3Rpb24gKGRpc3RzKSB7XG5cdHJldHVybiBkMy5zY2FsZS5saW5lYXIoKVxuXHQgICAgLmRvbWFpbihbMCxkMy5tYXgoZGlzdHMpXSlcblx0ICAgIC5yYW5nZShbMCwgcl0pO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoXCJhZGp1c3RfY2x1c3Rlcl9zaXplXCIsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICBcdHIgPSAobGF5b3V0LndpZHRoKCkvMikgLSBsYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgoKSAtIDIwO1xuICAgIFx0bGF5b3V0LmNsdXN0ZXIuc2l6ZShbMzYwLCByXSk7XG4gICAgXHRyZXR1cm4gbGF5b3V0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxheW91dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWUubGF5b3V0O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLm5vZGVfZGlzcGxheSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBuID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgdmFyIHByb3h5O1xuICAgICAgICB2YXIgdGhpc1Byb3h5ID0gZDMuc2VsZWN0KHRoaXMpLnNlbGVjdChcIi50bnRfdHJlZV9ub2RlX3Byb3h5XCIpO1xuICAgICAgICBpZiAodGhpc1Byb3h5WzBdWzBdID09PSBudWxsKSB7XG4gICAgICAgICAgICBwcm94eSA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX25vZGVfcHJveHlcIik7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb3h5ID0gdGhpc1Byb3h5O1xuICAgICAgICB9XG5cbiAgICBcdG4uZGlzcGxheSgpLmNhbGwodGhpcywgbm9kZSk7XG4gICAgICAgIHZhciBzaXplID0gZDMuZnVuY3RvcihuLnNpemUoKSkobm9kZSk7XG4gICAgICAgIHByb3h5XG4gICAgICAgICAgICAuYXR0cihcInhcIiwgKC1zaXplKSlcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCAoLXNpemUpKVxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAoc2l6ZSAqIDIpKVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgKHNpemUgKiAyKSlcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChuKVxuICAgIFx0LmdldHNldChcInNpemVcIiwgNC40KVxuICAgIFx0LmdldHNldChcImZpbGxcIiwgXCJibGFja1wiKVxuICAgIFx0LmdldHNldChcInN0cm9rZVwiLCBcImJsYWNrXCIpXG4gICAgXHQuZ2V0c2V0KFwic3Ryb2tlX3dpZHRoXCIsIFwiMXB4XCIpXG4gICAgXHQuZ2V0c2V0KFwiZGlzcGxheVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyBcImRpc3BsYXkgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCI7XG4gICAgICAgIH0pO1xuICAgIGFwaS5tZXRob2QoXCJyZXNldFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgICAgLnNlbGVjdEFsbChcIio6bm90KC50bnRfdHJlZV9ub2RlX3Byb3h5KVwiKVxuICAgICAgICAgICAgLnJlbW92ZSgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG47XG59O1xuXG50cmVlLm5vZGVfZGlzcGxheS5jaXJjbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuICAgIFx0ZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihuLnNpemUoKSkobm9kZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3Iobi5maWxsKCkpKG5vZGUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2UoKSkobm9kZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZV93aWR0aCgpKShub2RlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X25vZGVfZGlzcGxheV9lbGVtXCIpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG47XG59O1xuXG50cmVlLm5vZGVfZGlzcGxheS5zcXVhcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHR2YXIgcyA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuXHRkMy5zZWxlY3QodGhpcylcbiAgICAgICAgLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gLXM7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIC1zO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gcyoyO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIHMqMjtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X25vZGVfZGlzcGxheV9lbGVtXCIpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG47XG59O1xuXG50cmVlLm5vZGVfZGlzcGxheS50cmlhbmdsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbiA9IHRyZWUubm9kZV9kaXNwbGF5KCk7XG5cbiAgICBuLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlKSB7XG5cdHZhciBzID0gZDMuZnVuY3RvcihuLnNpemUoKSkobm9kZSk7XG5cdGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAuYXBwZW5kKFwicG9seWdvblwiKVxuICAgICAgICAuYXR0cihcInBvaW50c1wiLCAoLXMpICsgXCIsMCBcIiArIHMgKyBcIixcIiArICgtcykgKyBcIiBcIiArIHMgKyBcIixcIiArIHMpXG4gICAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3Iobi5maWxsKCkpKG5vZGUpO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2UoKSkobm9kZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZV93aWR0aCgpKShub2RlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ub2RlX2Rpc3BsYXlfZWxlbVwiKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxuLy8gdHJlZS5ub2RlX2Rpc3BsYXkuY29uZCA9IGZ1bmN0aW9uICgpIHtcbi8vICAgICB2YXIgbiA9IHRyZWUubm9kZV9kaXNwbGF5KCk7XG4vL1xuLy8gICAgIC8vIGNvbmRpdGlvbnMgYXJlIG9iamVjdHMgd2l0aFxuLy8gICAgIC8vIG5hbWUgOiBhIG5hbWUgZm9yIHRoaXMgZGlzcGxheVxuLy8gICAgIC8vIGNhbGxiYWNrOiB0aGUgY29uZGl0aW9uIHRvIGFwcGx5IChyZWNlaXZlcyBhIHRudC5ub2RlKVxuLy8gICAgIC8vIGRpc3BsYXk6IGEgbm9kZV9kaXNwbGF5XG4vLyAgICAgdmFyIGNvbmRzID0gW107XG4vL1xuLy8gICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcbi8vICAgICAgICAgdmFyIHMgPSBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcbi8vICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGNvbmRzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgICAgICB2YXIgY29uZCA9IGNvbmRzW2ldO1xuLy8gICAgICAgICAgICAgLy8gRm9yIGVhY2ggbm9kZSwgdGhlIGZpcnN0IGNvbmRpdGlvbiBtZXQgaXMgdXNlZFxuLy8gICAgICAgICAgICAgaWYgKGQzLmZ1bmN0b3IoY29uZC5jYWxsYmFjaykuY2FsbCh0aGlzLCBub2RlKSA9PT0gdHJ1ZSkge1xuLy8gICAgICAgICAgICAgICAgIGNvbmQuZGlzcGxheS5jYWxsKHRoaXMsIG5vZGUpO1xuLy8gICAgICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICB9XG4vLyAgICAgfSk7XG4vL1xuLy8gICAgIHZhciBhcGkgPSBhcGlqcyhuKTtcbi8vXG4vLyAgICAgYXBpLm1ldGhvZChcImFkZFwiLCBmdW5jdGlvbiAobmFtZSwgY2Jhaywgbm9kZV9kaXNwbGF5KSB7XG4vLyAgICAgICAgIGNvbmRzLnB1c2goeyBuYW1lIDogbmFtZSxcbi8vICAgICAgICAgICAgIGNhbGxiYWNrIDogY2Jhayxcbi8vICAgICAgICAgICAgIGRpc3BsYXkgOiBub2RlX2Rpc3BsYXlcbi8vICAgICAgICAgfSk7XG4vLyAgICAgICAgIHJldHVybiBuO1xuLy8gICAgIH0pO1xuLy9cbi8vICAgICBhcGkubWV0aG9kKFwicmVzZXRcIiwgZnVuY3Rpb24gKCkge1xuLy8gICAgICAgICBjb25kcyA9IFtdO1xuLy8gICAgICAgICByZXR1cm4gbjtcbi8vICAgICB9KTtcbi8vXG4vLyAgICAgYXBpLm1ldGhvZChcInVwZGF0ZVwiLCBmdW5jdGlvbiAobmFtZSwgY2JhaywgbmV3X2Rpc3BsYXkpIHtcbi8vICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGNvbmRzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgICAgICBpZiAoY29uZHNbaV0ubmFtZSA9PT0gbmFtZSkge1xuLy8gICAgICAgICAgICAgICAgIGNvbmRzW2ldLmNhbGxiYWNrID0gY2Jhaztcbi8vICAgICAgICAgICAgICAgICBjb25kc1tpXS5kaXNwbGF5ID0gbmV3X2Rpc3BsYXk7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgcmV0dXJuIG47XG4vLyAgICAgfSk7XG4vL1xuLy8gICAgIHJldHVybiBuO1xuLy9cbi8vIH07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWUubm9kZV9kaXNwbGF5O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgdG50X3RyZWVfbm9kZSA9IHJlcXVpcmUoXCJ0bnQudHJlZS5ub2RlXCIpO1xuXG52YXIgdHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoIChcImNsaWNrXCIsIFwiZGJsY2xpY2tcIiwgXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiLCBcImxvYWRcIik7XG5cbiAgICB2YXIgY29uZiA9IHtcbiAgICAgICAgZHVyYXRpb24gICAgICAgICA6IDUwMCwgICAgICAvLyBEdXJhdGlvbiBvZiB0aGUgdHJhbnNpdGlvbnNcbiAgICAgICAgbm9kZV9kaXNwbGF5ICAgICA6IHRyZWUubm9kZV9kaXNwbGF5LmNpcmNsZSgpLFxuICAgICAgICBsYWJlbCAgICAgICAgICAgIDogdHJlZS5sYWJlbC50ZXh0KCksXG4gICAgICAgIGxheW91dCAgICAgICAgICAgOiB0cmVlLmxheW91dC52ZXJ0aWNhbCgpLFxuICAgICAgICAvLyBvbl9jbGljayAgICAgICAgIDogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIC8vIG9uX2RibF9jbGljayAgICAgOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgLy8gb25fbW91c2VvdmVyICAgICA6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBicmFuY2hfY29sb3IgICAgIDogJ2JsYWNrJyxcbiAgICAgICAgaWQgICAgICAgICAgICAgICA6IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZC5faWQ7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gS2VlcCB0cmFjayBvZiB0aGUgZm9jdXNlZCBub2RlXG4gICAgLy8gVE9ETzogV291bGQgaXQgYmUgYmV0dGVyIHRvIGhhdmUgbXVsdGlwbGUgZm9jdXNlZCBub2Rlcz8gKGllIHVzZSBhbiBhcnJheSlcbiAgICAvLyB2YXIgZm9jdXNlZF9ub2RlO1xuXG4gICAgLy8gRXh0cmEgZGVsYXkgaW4gdGhlIHRyYW5zaXRpb25zIChUT0RPOiBOZWVkZWQ/KVxuICAgIHZhciBkZWxheSA9IDA7XG5cbiAgICAvLyBFYXNlIG9mIHRoZSB0cmFuc2l0aW9uc1xuICAgIHZhciBlYXNlID0gXCJjdWJpYy1pbi1vdXRcIjtcblxuICAgIC8vIFRoZSBpZCBvZiB0aGUgdHJlZSBjb250YWluZXJcbiAgICB2YXIgZGl2X2lkO1xuXG4gICAgLy8gVGhlIHRyZWUgdmlzdWFsaXphdGlvbiAoc3ZnKVxuICAgIHZhciBzdmc7XG4gICAgdmFyIHZpcztcbiAgICB2YXIgbGlua3NfZztcbiAgICB2YXIgbm9kZXNfZztcblxuICAgIC8vIFRPRE86IEZvciBub3csIGNvdW50cyBhcmUgZ2l2ZW4gb25seSBmb3IgbGVhdmVzXG4gICAgLy8gYnV0IGl0IG1heSBiZSBnb29kIHRvIGFsbG93IGNvdW50cyBmb3IgaW50ZXJuYWwgbm9kZXNcbiAgICB2YXIgY291bnRzID0ge307XG5cbiAgICAvLyBUaGUgZnVsbCB0cmVlXG4gICAgdmFyIGJhc2UgPSB7XG4gICAgICAgIHRyZWUgOiB1bmRlZmluZWQsXG4gICAgICAgIGRhdGEgOiB1bmRlZmluZWQsXG4gICAgICAgIG5vZGVzIDogdW5kZWZpbmVkLFxuICAgICAgICBsaW5rcyA6IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICAvLyBUaGUgY3VyciB0cmVlLiBOZWVkZWQgdG8gcmUtY29tcHV0ZSB0aGUgbGlua3MgLyBub2RlcyBwb3NpdGlvbnMgb2Ygc3VidHJlZXNcbiAgICB2YXIgY3VyciA9IHtcbiAgICAgICAgdHJlZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgZGF0YSA6IHVuZGVmaW5lZCxcbiAgICAgICAgbm9kZXMgOiB1bmRlZmluZWQsXG4gICAgICAgIGxpbmtzIDogdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIC8vIFRoZSBjYmFrIHJldHVybmVkXG4gICAgdmFyIHQgPSBmdW5jdGlvbiAoZGl2KSB7XG4gICAgXHRkaXZfaWQgPSBkMy5zZWxlY3QoZGl2KS5hdHRyKFwiaWRcIik7XG5cbiAgICAgICAgdmFyIHRyZWVfZGl2ID0gZDMuc2VsZWN0KGRpdilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgICAgIC5zdHlsZShcIndpZHRoXCIsIChjb25mLmxheW91dC53aWR0aCgpICsgIFwicHhcIikpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2dyb3VwRGl2XCIpO1xuXG4gICAgXHR2YXIgY2x1c3RlciA9IGNvbmYubGF5b3V0LmNsdXN0ZXI7XG5cbiAgICBcdHZhciBuX2xlYXZlcyA9IGN1cnIudHJlZS5nZXRfYWxsX2xlYXZlcygpLmxlbmd0aDtcblxuICAgIFx0dmFyIG1heF9sZWFmX2xhYmVsX2xlbmd0aCA9IGZ1bmN0aW9uICh0cmVlKSB7XG4gICAgXHQgICAgdmFyIG1heCA9IDA7XG4gICAgXHQgICAgdmFyIGxlYXZlcyA9IHRyZWUuZ2V0X2FsbF9sZWF2ZXMoKTtcbiAgICBcdCAgICBmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxhYmVsX3dpZHRoID0gY29uZi5sYWJlbC53aWR0aCgpKGxlYXZlc1tpXSkgKyBkMy5mdW5jdG9yIChjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKGxlYXZlc1tpXSk7XG4gICAgICAgICAgICAgICAgaWYgKGxhYmVsX3dpZHRoID4gbWF4KSB7XG4gICAgICAgICAgICAgICAgICAgIG1heCA9IGxhYmVsX3dpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcdCAgICB9XG4gICAgXHQgICAgcmV0dXJuIG1heDtcbiAgICBcdH07XG5cbiAgICAgICAgdmFyIG1heF9sZWFmX25vZGVfaGVpZ2h0ID0gZnVuY3Rpb24gKHRyZWUpIHtcbiAgICAgICAgICAgIHZhciBtYXggPSAwO1xuICAgICAgICAgICAgdmFyIGxlYXZlcyA9IHRyZWUuZ2V0X2FsbF9sZWF2ZXMoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxsZWF2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZV9oZWlnaHQgPSBkMy5mdW5jdG9yKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkobGVhdmVzW2ldKSAqIDI7XG4gICAgICAgICAgICAgICAgdmFyIGxhYmVsX2hlaWdodCA9IGQzLmZ1bmN0b3IoY29uZi5sYWJlbC5oZWlnaHQoKSkobGVhdmVzW2ldKTtcblxuICAgICAgICAgICAgICAgIG1heCA9IGQzLm1heChbbWF4LCBub2RlX2hlaWdodCwgbGFiZWxfaGVpZ2h0XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWF4O1xuICAgICAgICB9O1xuXG4gICAgXHR2YXIgbWF4X2xhYmVsX2xlbmd0aCA9IG1heF9sZWFmX2xhYmVsX2xlbmd0aChjdXJyLnRyZWUpO1xuICAgIFx0Y29uZi5sYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgobWF4X2xhYmVsX2xlbmd0aCk7XG5cbiAgICBcdHZhciBtYXhfbm9kZV9oZWlnaHQgPSBtYXhfbGVhZl9ub2RlX2hlaWdodChjdXJyLnRyZWUpO1xuXG4gICAgXHQvLyBDbHVzdGVyIHNpemUgaXMgdGhlIHJlc3VsdCBvZi4uLlxuICAgIFx0Ly8gdG90YWwgd2lkdGggb2YgdGhlIHZpcyAtIHRyYW5zZm9ybSBmb3IgdGhlIHRyZWUgLSBtYXhfbGVhZl9sYWJlbF93aWR0aCAtIGhvcml6b250YWwgdHJhbnNmb3JtIG9mIHRoZSBsYWJlbFxuICAgIFx0Ly8gVE9ETzogU3Vic3RpdHV0ZSAxNSBieSB0aGUgaG9yaXpvbnRhbCB0cmFuc2Zvcm0gb2YgdGhlIG5vZGVzXG4gICAgXHR2YXIgY2x1c3Rlcl9zaXplX3BhcmFtcyA9IHtcbiAgICBcdCAgICBuX2xlYXZlcyA6IG5fbGVhdmVzLFxuICAgIFx0ICAgIGxhYmVsX2hlaWdodCA6IG1heF9ub2RlX2hlaWdodCxcbiAgICBcdCAgICBsYWJlbF9wYWRkaW5nIDogMTVcbiAgICBcdH07XG5cbiAgICBcdGNvbmYubGF5b3V0LmFkanVzdF9jbHVzdGVyX3NpemUoY2x1c3Rlcl9zaXplX3BhcmFtcyk7XG5cbiAgICBcdHZhciBkaWFnb25hbCA9IGNvbmYubGF5b3V0LmRpYWdvbmFsKCk7XG4gICAgXHR2YXIgdHJhbnNmb3JtID0gY29uZi5sYXlvdXQudHJhbnNmb3JtX25vZGU7XG5cbiAgICBcdHN2ZyA9IHRyZWVfZGl2XG4gICAgXHQgICAgLmFwcGVuZChcInN2Z1wiKVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgY29uZi5sYXlvdXQud2lkdGgoKSlcbiAgICBcdCAgICAuYXR0cihcImhlaWdodFwiLCBjb25mLmxheW91dC5oZWlnaHQoY2x1c3Rlcl9zaXplX3BhcmFtcykgKyAzMClcbiAgICBcdCAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpO1xuXG4gICAgXHR2aXMgPSBzdmdcbiAgICBcdCAgICAuYXBwZW5kKFwiZ1wiKVxuICAgIFx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfc3RfXCIgKyBkaXZfaWQpXG4gICAgXHQgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIixcbiAgICBcdFx0ICBcInRyYW5zbGF0ZShcIiArXG4gICAgXHRcdCAgY29uZi5sYXlvdXQudHJhbnNsYXRlX3ZpcygpWzBdICtcbiAgICBcdFx0ICBcIixcIiArXG4gICAgXHRcdCAgY29uZi5sYXlvdXQudHJhbnNsYXRlX3ZpcygpWzFdICtcbiAgICBcdFx0ICBcIilcIik7XG5cbiAgICBcdGN1cnIubm9kZXMgPSBjbHVzdGVyLm5vZGVzKGN1cnIuZGF0YSk7XG4gICAgXHRjb25mLmxheW91dC5zY2FsZV9icmFuY2hfbGVuZ3RocyhjdXJyKTtcbiAgICBcdGN1cnIubGlua3MgPSBjbHVzdGVyLmxpbmtzKGN1cnIubm9kZXMpO1xuXG4gICAgXHQvLyBMSU5LU1xuICAgIFx0Ly8gQWxsIHRoZSBsaW5rcyBhcmUgZ3JvdXBlZCBpbiBhIGcgZWxlbWVudFxuICAgIFx0bGlua3NfZyA9IHZpc1xuICAgIFx0ICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtzXCIpO1xuICAgIFx0bm9kZXNfZyA9IHZpc1xuICAgIFx0ICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGVzXCIpO1xuXG4gICAgXHQvL3ZhciBsaW5rID0gdmlzXG4gICAgXHR2YXIgbGluayA9IGxpbmtzX2dcbiAgICBcdCAgICAuc2VsZWN0QWxsKFwicGF0aC50bnRfdHJlZV9saW5rXCIpXG4gICAgXHQgICAgLmRhdGEoY3Vyci5saW5rcywgZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmYuaWQoZC50YXJnZXQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICBcdGxpbmtcbiAgICBcdCAgICAuZW50ZXIoKVxuICAgIFx0ICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX2xpbmtcIilcbiAgICBcdCAgICAuYXR0cihcImlkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICBcdCAgICBcdHJldHVybiBcInRudF90cmVlX2xpbmtfXCIgKyBkaXZfaWQgKyBcIl9cIiArIGNvbmYuaWQoZC50YXJnZXQpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLnN0eWxlKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3IoY29uZi5icmFuY2hfY29sb3IpKHRudF90cmVlX25vZGUoZC5zb3VyY2UpLCB0bnRfdHJlZV9ub2RlKGQudGFyZ2V0KSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG4gICAgXHQvLyBOT0RFU1xuICAgIFx0Ly92YXIgbm9kZSA9IHZpc1xuICAgIFx0dmFyIG5vZGUgPSBub2Rlc19nXG4gICAgXHQgICAgLnNlbGVjdEFsbChcImcudG50X3RyZWVfbm9kZVwiKVxuICAgIFx0ICAgIC5kYXRhKGN1cnIubm9kZXMsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZi5pZChkKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgXHR2YXIgbmV3X25vZGUgPSBub2RlXG4gICAgXHQgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24obikge1xuICAgICAgICBcdFx0aWYgKG4uY2hpbGRyZW4pIHtcbiAgICAgICAgXHRcdCAgICBpZiAobi5kZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgXHRcdFx0cmV0dXJuIFwicm9vdCB0bnRfdHJlZV9ub2RlXCI7XG4gICAgICAgIFx0XHQgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFx0XHRcdHJldHVybiBcImlubmVyIHRudF90cmVlX25vZGVcIjtcbiAgICAgICAgXHRcdCAgICB9XG4gICAgICAgIFx0XHR9IGVsc2Uge1xuICAgICAgICBcdFx0ICAgIHJldHVybiBcImxlYWYgdG50X3RyZWVfbm9kZVwiO1xuICAgICAgICBcdFx0fVxuICAgICAgICBcdH0pXG4gICAgXHQgICAgLmF0dHIoXCJpZFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gXCJ0bnRfdHJlZV9ub2RlX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLl9pZDtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cbiAgICBcdC8vIGRpc3BsYXkgbm9kZSBzaGFwZVxuICAgIFx0bmV3X25vZGVcbiAgICBcdCAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgXHRcdGNvbmYubm9kZV9kaXNwbGF5LmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSk7XG4gICAgXHQgICAgfSk7XG5cbiAgICBcdC8vIGRpc3BsYXkgbm9kZSBsYWJlbFxuICAgIFx0bmV3X25vZGVcbiAgICBcdCAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcbiAgICBcdCAgICBcdGNvbmYubGFiZWwuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKGQpLCBjb25mLmxheW91dC50eXBlLCBkMy5mdW5jdG9yKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkodG50X3RyZWVfbm9kZShkKSkpO1xuICAgIFx0ICAgIH0pO1xuXG4gICAgICAgIG5ld19ub2RlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6Y2xpY2tcIiwgbXlfbm9kZSk7XG4gICAgICAgICAgICBkaXNwYXRjaC5jbGljay5jYWxsKHRoaXMsIG15X25vZGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgbmV3X25vZGUub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpkYmxjbGlja1wiLCBteV9ub2RlKTtcbiAgICAgICAgICAgIGRpc3BhdGNoLmRibGNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdfbm9kZS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpob3ZlclwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHRoaXMsIG15X25vZGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgbmV3X25vZGUub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTptb3VzZW91dFwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRpc3BhdGNoLmxvYWQoKTtcblxuICAgIFx0Ly8gVXBkYXRlIHBsb3RzIGFuIHVwZGF0ZWQgdHJlZVxuICAgICAgICBhcGkubWV0aG9kICgndXBkYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0cmVlX2RpdlxuICAgICAgICAgICAgICAgIC5zdHlsZShcIndpZHRoXCIsIChjb25mLmxheW91dC53aWR0aCgpICsgXCJweFwiKSk7XG4gICAgXHQgICAgc3ZnLmF0dHIoXCJ3aWR0aFwiLCBjb25mLmxheW91dC53aWR0aCgpKTtcblxuICAgIFx0ICAgIHZhciBjbHVzdGVyID0gY29uZi5sYXlvdXQuY2x1c3RlcjtcbiAgICBcdCAgICB2YXIgZGlhZ29uYWwgPSBjb25mLmxheW91dC5kaWFnb25hbCgpO1xuICAgIFx0ICAgIHZhciB0cmFuc2Zvcm0gPSBjb25mLmxheW91dC50cmFuc2Zvcm1fbm9kZTtcblxuICAgIFx0ICAgIHZhciBtYXhfbGFiZWxfbGVuZ3RoID0gbWF4X2xlYWZfbGFiZWxfbGVuZ3RoKGN1cnIudHJlZSk7XG4gICAgXHQgICAgY29uZi5sYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgobWF4X2xhYmVsX2xlbmd0aCk7XG5cbiAgICBcdCAgICB2YXIgbWF4X25vZGVfaGVpZ2h0ID0gbWF4X2xlYWZfbm9kZV9oZWlnaHQoY3Vyci50cmVlKTtcblxuICAgIFx0ICAgIC8vIENsdXN0ZXIgc2l6ZSBpcyB0aGUgcmVzdWx0IG9mLi4uXG4gICAgXHQgICAgLy8gdG90YWwgd2lkdGggb2YgdGhlIHZpcyAtIHRyYW5zZm9ybSBmb3IgdGhlIHRyZWUgLSBtYXhfbGVhZl9sYWJlbF93aWR0aCAtIGhvcml6b250YWwgdHJhbnNmb3JtIG9mIHRoZSBsYWJlbFxuICAgICAgICBcdC8vIFRPRE86IFN1YnN0aXR1dGUgMTUgYnkgdGhlIHRyYW5zZm9ybSBvZiB0aGUgbm9kZXMgKHByb2JhYmx5IGJ5IHNlbGVjdGluZyBvbmUgbm9kZSBhc3N1bWluZyBhbGwgdGhlIG5vZGVzIGhhdmUgdGhlIHNhbWUgdHJhbnNmb3JtXG4gICAgXHQgICAgdmFyIG5fbGVhdmVzID0gY3Vyci50cmVlLmdldF9hbGxfbGVhdmVzKCkubGVuZ3RoO1xuICAgIFx0ICAgIHZhciBjbHVzdGVyX3NpemVfcGFyYW1zID0ge1xuICAgICAgICBcdFx0bl9sZWF2ZXMgOiBuX2xlYXZlcyxcbiAgICAgICAgXHRcdGxhYmVsX2hlaWdodCA6IG1heF9ub2RlX2hlaWdodCxcbiAgICAgICAgXHRcdGxhYmVsX3BhZGRpbmcgOiAxNVxuICAgIFx0ICAgIH07XG4gICAgXHQgICAgY29uZi5sYXlvdXQuYWRqdXN0X2NsdXN0ZXJfc2l6ZShjbHVzdGVyX3NpemVfcGFyYW1zKTtcblxuICAgICAgICAgICAgc3ZnXG4gICAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuICAgICAgICAgICAgICAgIC5lYXNlKGVhc2UpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgY29uZi5sYXlvdXQuaGVpZ2h0KGNsdXN0ZXJfc2l6ZV9wYXJhbXMpICsgMzApOyAvLyBoZWlnaHQgaXMgaW4gdGhlIGxheW91dFxuXG4gICAgXHQgICAgdmlzXG4gICAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsXG4gICAgICAgICAgICAgICAgXCJ0cmFuc2xhdGUoXCIgK1xuICAgICAgICAgICAgICAgIGNvbmYubGF5b3V0LnRyYW5zbGF0ZV92aXMoKVswXSArXG4gICAgICAgICAgICAgICAgXCIsXCIgK1xuICAgICAgICAgICAgICAgIGNvbmYubGF5b3V0LnRyYW5zbGF0ZV92aXMoKVsxXSArXG4gICAgICAgICAgICAgICAgXCIpXCIpO1xuXG4gICAgICAgICAgICBjdXJyLm5vZGVzID0gY2x1c3Rlci5ub2RlcyhjdXJyLmRhdGEpO1xuICAgICAgICAgICAgY29uZi5sYXlvdXQuc2NhbGVfYnJhbmNoX2xlbmd0aHMoY3Vycik7XG4gICAgICAgICAgICBjdXJyLmxpbmtzID0gY2x1c3Rlci5saW5rcyhjdXJyLm5vZGVzKTtcblxuICAgIFx0ICAgIC8vIExJTktTXG4gICAgXHQgICAgdmFyIGxpbmsgPSBsaW5rc19nXG4gICAgICAgIFx0XHQuc2VsZWN0QWxsKFwicGF0aC50bnRfdHJlZV9saW5rXCIpXG4gICAgICAgIFx0XHQuZGF0YShjdXJyLmxpbmtzLCBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbmYuaWQoZC50YXJnZXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBOT0RFU1xuICAgIFx0ICAgIHZhciBub2RlID0gbm9kZXNfZ1xuICAgICAgICBcdFx0LnNlbGVjdEFsbChcImcudG50X3RyZWVfbm9kZVwiKVxuICAgICAgICBcdFx0LmRhdGEoY3Vyci5ub2RlcywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29uZi5pZChkKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgIFx0ICAgIHZhciBleGl0X2xpbmsgPSBsaW5rXG4gICAgICAgIFx0XHQuZXhpdCgpXG4gICAgICAgIFx0XHQucmVtb3ZlKCk7XG5cbiAgICBcdCAgICBsaW5rXG4gICAgICAgIFx0XHQuZW50ZXIoKVxuICAgICAgICBcdFx0LmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJlZV9saW5rXCIpXG4gICAgICAgIFx0XHQuYXR0cihcImlkXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0XHQgICAgcmV0dXJuIFwidG50X3RyZWVfbGlua19cIiArIGRpdl9pZCArIFwiX1wiICsgY29uZi5pZChkLnRhcmdldCk7XG4gICAgICAgIFx0XHR9KVxuICAgICAgICBcdFx0LmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgXHRcdCAgICByZXR1cm4gZDMuZnVuY3Rvcihjb25mLmJyYW5jaF9jb2xvcikodG50X3RyZWVfbm9kZShkLnNvdXJjZSksIHRudF90cmVlX25vZGUoZC50YXJnZXQpKTtcbiAgICAgICAgXHRcdH0pXG4gICAgICAgIFx0XHQuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG4gICAgXHQgICAgbGlua1xuICAgIFx0ICAgIFx0LnRyYW5zaXRpb24oKVxuICAgICAgICBcdFx0LmVhc2UoZWFzZSlcbiAgICBcdCAgICBcdC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuICAgIFx0ICAgIFx0LmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcblxuXG4gICAgXHQgICAgLy8gTm9kZXNcbiAgICBcdCAgICB2YXIgbmV3X25vZGUgPSBub2RlXG4gICAgICAgIFx0XHQuZW50ZXIoKVxuICAgICAgICBcdFx0LmFwcGVuZChcImdcIilcbiAgICAgICAgXHRcdC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24obikge1xuICAgICAgICBcdFx0ICAgIGlmIChuLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICBcdFx0XHRpZiAobi5kZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInJvb3QgdG50X3RyZWVfbm9kZVwiO1xuICAgICAgICAgICAgXHRcdFx0fSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJpbm5lciB0bnRfdHJlZV9ub2RlXCI7XG4gICAgICAgICAgICBcdFx0XHR9XG4gICAgICAgIFx0XHQgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImxlYWYgdG50X3RyZWVfbm9kZVwiO1xuICAgICAgICBcdFx0ICAgIH1cbiAgICAgICAgXHRcdH0pXG4gICAgICAgIFx0XHQuYXR0cihcImlkXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0XHQgICAgcmV0dXJuIFwidG50X3RyZWVfbm9kZV9cIiArIGRpdl9pZCArIFwiX1wiICsgZC5faWQ7XG4gICAgICAgIFx0XHR9KVxuICAgICAgICBcdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgdHJhbnNmb3JtKTtcblxuICAgIFx0ICAgIC8vIEV4aXRpbmcgbm9kZXMgYXJlIGp1c3QgcmVtb3ZlZFxuICAgIFx0ICAgIG5vZGVcbiAgICAgICAgXHRcdC5leGl0KClcbiAgICAgICAgXHRcdC5yZW1vdmUoKTtcblxuICAgICAgICAgICAgbmV3X25vZGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmNsaWNrXCIsIG15X25vZGUpO1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG5ld19ub2RlLm9uKFwiZGJsY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpkYmxjbGlja1wiLCBteV9ub2RlKTtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaC5kYmxjbGljay5jYWxsKHRoaXMsIG15X25vZGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBuZXdfbm9kZS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHRoaXMsIG15X25vZGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBuZXdfbm9kZS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6bW91c2VvdXRcIiwgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgXHQgICAgLy8gLy8gV2UgbmVlZCB0byByZS1jcmVhdGUgYWxsIHRoZSBub2RlcyBhZ2FpbiBpbiBjYXNlIHRoZXkgaGF2ZSBjaGFuZ2VkIGxpdmVseSAob3IgdGhlIGxheW91dClcbiAgICBcdCAgICAvLyBub2RlLnNlbGVjdEFsbChcIipcIikucmVtb3ZlKCk7XG4gICAgXHQgICAgLy8gbmV3X25vZGVcbiAgICBcdFx0Ly8gICAgIC5lYWNoKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0Ly8gXHRcdGNvbmYubm9kZV9kaXNwbGF5LmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSk7XG4gICAgXHRcdC8vICAgICB9KTtcbiAgICAgICAgICAgIC8vXG4gICAgXHQgICAgLy8gLy8gV2UgbmVlZCB0byByZS1jcmVhdGUgYWxsIHRoZSBsYWJlbHMgYWdhaW4gaW4gY2FzZSB0aGV5IGhhdmUgY2hhbmdlZCBsaXZlbHkgKG9yIHRoZSBsYXlvdXQpXG4gICAgXHQgICAgLy8gbmV3X25vZGVcbiAgICBcdFx0Ly8gICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuICAgICAgICBcdC8vIFx0XHRjb25mLmxhYmVsLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSwgY29uZi5sYXlvdXQudHlwZSwgZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKHRudF90cmVlX25vZGUoZCkpKTtcbiAgICBcdFx0Ly8gICAgIH0pO1xuXG4gICAgICAgICAgICB0LnVwZGF0ZV9ub2RlcygpO1xuXG4gICAgXHQgICAgbm9kZVxuICAgICAgICBcdFx0LnRyYW5zaXRpb24oKVxuICAgICAgICBcdFx0LmVhc2UoZWFzZSlcbiAgICAgICAgXHRcdC5kdXJhdGlvbihjb25mLmR1cmF0aW9uKVxuICAgICAgICBcdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgdHJhbnNmb3JtKTtcblxuICAgIFx0fSk7XG5cbiAgICAgICAgYXBpLm1ldGhvZCgndXBkYXRlX25vZGVzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSBub2Rlc19nXG4gICAgICAgICAgICAgICAgLnNlbGVjdEFsbChcImcudG50X3RyZWVfbm9kZVwiKTtcblxuICAgICAgICAgICAgLy8gcmUtY3JlYXRlIGFsbCB0aGUgbm9kZXMgYWdhaW5cbiAgICAgICAgICAgIC8vIG5vZGUuc2VsZWN0QWxsKFwiKlwiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIG5vZGVcbiAgICAgICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmYubm9kZV9kaXNwbGF5LnJlc2V0LmNhbGwodGhpcyk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG5vZGVcbiAgICAgICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGNvbmYubm9kZV9kaXNwbGF5KCkpO1xuICAgICAgICAgICAgICAgICAgICBjb25mLm5vZGVfZGlzcGxheS5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyByZS1jcmVhdGUgYWxsIHRoZSBsYWJlbHMgYWdhaW5cbiAgICAgICAgICAgIG5vZGVcbiAgICAgICAgICAgICAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uZi5sYWJlbC5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCksIGNvbmYubGF5b3V0LnR5cGUsIGQzLmZ1bmN0b3IoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKSh0bnRfdHJlZV9ub2RlKGQpKSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIHZhciBhcGkgPSBhcGlqcyAodClcbiAgICBcdC5nZXRzZXQgKGNvbmYpO1xuXG4gICAgLy8gbiBpcyB0aGUgbnVtYmVyIHRvIGludGVycG9sYXRlLCB0aGUgc2Vjb25kIGFyZ3VtZW50IGNhbiBiZSBlaXRoZXIgXCJ0cmVlXCIgb3IgXCJwaXhlbFwiIGRlcGVuZGluZ1xuICAgIC8vIGlmIG4gaXMgc2V0IHRvIHRyZWUgdW5pdHMgb3IgcGl4ZWxzIHVuaXRzXG4gICAgYXBpLm1ldGhvZCAoJ3NjYWxlX2JhcicsIGZ1bmN0aW9uIChuLCB1bml0cykge1xuICAgICAgICBpZiAoIXQubGF5b3V0KCkuc2NhbGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdW5pdHMpIHtcbiAgICAgICAgICAgIHVuaXRzID0gXCJwaXhlbFwiO1xuICAgICAgICB9XG4gICAgICAgIHZhciB2YWw7XG4gICAgICAgIGxpbmtzX2cuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKHApIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsKSByZXR1cm47XG4gICAgICAgICAgICAgICAgdmFyIGQgPSB0aGlzLmdldEF0dHJpYnV0ZShcImRcIik7XG5cbiAgICAgICAgICAgICAgICB2YXIgcGF0aFBhcnRzID0gZC5zcGxpdCgvW01MQV0vKTtcbiAgICAgICAgICAgICAgICB2YXIgdG9TdHIgPSBwYXRoUGFydHMucG9wKCk7XG4gICAgICAgICAgICAgICAgdmFyIGZyb21TdHIgPSBwYXRoUGFydHMucG9wKCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZnJvbSA9IGZyb21TdHIuc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgICAgIHZhciB0byA9IHRvU3RyLnNwbGl0KFwiLFwiKTtcblxuICAgICAgICAgICAgICAgIHZhciBkZWx0YVggPSB0b1swXSAtIGZyb21bMF07XG4gICAgICAgICAgICAgICAgdmFyIGRlbHRhWSA9IHRvWzFdIC0gZnJvbVsxXTtcbiAgICAgICAgICAgICAgICB2YXIgcGl4ZWxzRGlzdCA9IE1hdGguc3FydChkZWx0YVgqZGVsdGFYICsgZGVsdGFZKmRlbHRhWSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgc291cmNlID0gcC5zb3VyY2U7XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IHAudGFyZ2V0O1xuXG4gICAgICAgICAgICAgICAgdmFyIGJyYW5jaERpc3QgPSB0YXJnZXQuX3Jvb3RfZGlzdCAtIHNvdXJjZS5fcm9vdF9kaXN0O1xuICAgICAgICAgICAgICAgIGlmIChicmFuY2hEaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFN1cHBvc2luZyBwaXhlbHNEaXN0IGhhcyBiZWVuIHBhc3NlZFxuICAgICAgICAgICAgICAgICAgICBpZiAodW5pdHMgPT09IFwicGl4ZWxcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gKGJyYW5jaERpc3QgLyBwaXhlbHNEaXN0KSAqIG47XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodW5pdHMgPT09IFwidHJlZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSAocGl4ZWxzRGlzdCAvIGJyYW5jaERpc3QpICogbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9KTtcblxuICAgIC8vIFRPRE86IFJld3JpdGUgZGF0YSB1c2luZyBnZXRzZXQgLyBmaW5hbGl6ZXJzICYgdHJhbnNmb3Jtc1xuICAgIGFwaS5tZXRob2QgKCdkYXRhJywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gYmFzZS5kYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIG9yaWdpbmFsIGRhdGEgaXMgc3RvcmVkIGFzIHRoZSBiYXNlIGFuZCBjdXJyIGRhdGFcbiAgICAgICAgYmFzZS5kYXRhID0gZDtcbiAgICAgICAgY3Vyci5kYXRhID0gZDtcblxuICAgICAgICAvLyBTZXQgdXAgYSBuZXcgdHJlZSBiYXNlZCBvbiB0aGUgZGF0YVxuICAgICAgICB2YXIgbmV3dHJlZSA9IHRudF90cmVlX25vZGUoYmFzZS5kYXRhKTtcblxuICAgICAgICB0LnJvb3QobmV3dHJlZSk7XG4gICAgICAgIGJhc2UudHJlZSA9IG5ld3RyZWU7XG4gICAgICAgIGN1cnIudHJlZSA9IGJhc2UudHJlZTtcblxuICAgICAgICB0cmVlLnRyaWdnZXIoXCJkYXRhOmhhc0NoYW5nZWRcIiwgYmFzZS5kYXRhKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIC8vIFRPRE86IFRoaXMgaXMgb25seSBhIGdldHRlclxuICAgIGFwaS5tZXRob2QgKCdyb290JywgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY3Vyci50cmVlO1xuICAgIH0pO1xuXG4gICAgLy8gYXBpLm1ldGhvZCAoJ3N1YnRyZWUnLCBmdW5jdGlvbiAoY3Vycl9ub2Rlcywga2VlcFNpbmdsZXRvbnMpIHtcbiAgICAvLyAgICAgdmFyIHN1YnRyZWUgPSBiYXNlLnRyZWUuc3VidHJlZShjdXJyX25vZGVzLCBrZWVwU2luZ2xldG9ucyk7XG4gICAgLy8gICAgIGN1cnIuZGF0YSA9IHN1YnRyZWUuZGF0YSgpO1xuICAgIC8vICAgICBjdXJyLnRyZWUgPSBzdWJ0cmVlO1xuICAgIC8vXG4gICAgLy8gICAgIHJldHVybiB0aGlzO1xuICAgIC8vIH0pO1xuXG4gICAgLy8gYXBpLm1ldGhvZCAoJ3Jlcm9vdCcsIGZ1bmN0aW9uIChub2RlLCBrZWVwU2luZ2xldG9ucykge1xuICAgIC8vICAgICAvLyBmaW5kXG4gICAgLy8gICAgIHZhciByb290ID0gdC5yb290KCk7XG4gICAgLy8gICAgIHZhciBmb3VuZF9ub2RlID0gdC5yb290KCkuZmluZF9ub2RlKGZ1bmN0aW9uIChuKSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gbm9kZS5pZCgpID09PSBuLmlkKCk7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgICB2YXIgc3VidHJlZSA9IHJvb3Quc3VidHJlZShmb3VuZF9ub2RlLmdldF9hbGxfbGVhdmVzKCksIGtlZXBTaW5nbGV0b25zKTtcbiAgICAvL1xuICAgIC8vICAgICByZXR1cm4gc3VidHJlZTtcbiAgICAvLyB9KTtcblxuICAgIHJldHVybiBkMy5yZWJpbmQgKHQsIGRpc3BhdGNoLCBcIm9uXCIpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwiLy8gcmVxdWlyZSgnZnMnKS5yZWFkZGlyU3luYyhfX2Rpcm5hbWUgKyAnLycpLmZvckVhY2goZnVuY3Rpb24oZmlsZSkge1xuLy8gICAgIGlmIChmaWxlLm1hdGNoKC8uK1xcLmpzL2cpICE9PSBudWxsICYmIGZpbGUgIT09IF9fZmlsZW5hbWUpIHtcbi8vIFx0dmFyIG5hbWUgPSBmaWxlLnJlcGxhY2UoJy5qcycsICcnKTtcbi8vIFx0bW9kdWxlLmV4cG9ydHNbbmFtZV0gPSByZXF1aXJlKCcuLycgKyBmaWxlKTtcbi8vICAgICB9XG4vLyB9KTtcblxuLy8gU2FtZSBhc1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG51dGlscy5yZWR1Y2UgPSByZXF1aXJlKFwiLi9yZWR1Y2UuanNcIik7XG51dGlscy5wbmcgPSByZXF1aXJlKFwiLi9wbmcuanNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB1dGlscztcbiIsInZhciBwbmcgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZG9jdHlwZSA9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgc3RhbmRhbG9uZT1cIm5vXCI/PjwhRE9DVFlQRSBzdmcgUFVCTElDIFwiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU5cIiBcImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZFwiPic7XG5cbiAgICB2YXIgc2NhbGVfZmFjdG9yID0gMTtcbiAgICAvLyB2YXIgZmlsZW5hbWUgPSAnaW1hZ2UucG5nJztcblxuICAgIC8vIFJlc3RyaWN0IHRoZSBjc3MgdG8gYXBwbHkgdG8gdGhlIGZvbGxvd2luZyBhcnJheSAoaHJlZnMpXG4gICAgLy8gVE9ETzogc3Vic3RpdHV0ZSB0aGlzIGJ5IGFuIGFycmF5IG9mIHJlZ2V4cFxuICAgIHZhciBjc3M7IC8vIElmIHVuZGVmaW5lZCwgdXNlIGFsbCBzdHlsZXNoZWV0c1xuICAgIC8vIHZhciBpbmxpbmVfaW1hZ2VzX29wdCA9IHRydWU7IC8vIElmIHRydWUsIGlubGluZSBpbWFnZXNcblxuICAgIHZhciBpbWdfY2JhayA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgdmFyIHBuZ19leHBvcnQgPSBmdW5jdGlvbiAoZnJvbV9zdmcpIHtcbiAgICAgICAgZnJvbV9zdmcgPSBmcm9tX3N2Zy5ub2RlKCk7XG4gICAgICAgIC8vIHZhciBzdmcgPSBkaXYucXVlcnlTZWxlY3Rvcignc3ZnJyk7XG5cbiAgICAgICAgdmFyIGlubGluZV9pbWFnZXMgPSBmdW5jdGlvbiAoY2Jhaykge1xuICAgICAgICAgICAgdmFyIGltYWdlcyA9IGQzLnNlbGVjdChmcm9tX3N2ZylcbiAgICAgICAgICAgICAgICAuc2VsZWN0QWxsKCdpbWFnZScpO1xuXG4gICAgICAgICAgICB2YXIgcmVtYWluaW5nID0gaW1hZ2VzWzBdLmxlbmd0aDtcbiAgICAgICAgICAgIGlmIChyZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgICAgICBjYmFrKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGltYWdlc1xuICAgICAgICAgICAgICAgIC5lYWNoIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbWFnZSA9IGQzLnNlbGVjdCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgICAgICAgICBpbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gaW1nLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGltZy5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdXJpID0gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZS5hdHRyKCdocmVmJywgdXJpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbWFpbmluZy0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiYWsoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaW1nLnNyYyA9IGltYWdlLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBtb3ZlX2NoaWxkcmVuID0gZnVuY3Rpb24gKHNyYywgZGVzdCkge1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gc3JjLmNoaWxkcmVuIHx8IHNyYy5jaGlsZE5vZGVzO1xuICAgICAgICAgICAgd2hpbGUgKGNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlblswXTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQubm9kZVR5cGUgIT09IDEvKk5vZGUuRUxFTUVOVF9OT0RFKi8pIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlc3QuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHN0eWxpbmcgPSBmdW5jdGlvbiAoZG9tKSB7XG4gICAgICAgICAgICB2YXIgdXNlZCA9IFwiXCI7XG4gICAgICAgICAgICB2YXIgc2hlZXRzID0gZG9jdW1lbnQuc3R5bGVTaGVldHM7XG4gICAgICAgICAgICAvLyB2YXIgc2hlZXRzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8c2hlZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhyZWYgPSBzaGVldHNbaV0uaHJlZiB8fCBcIlwiO1xuICAgICAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNraXAgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBjPTA7IGM8Y3NzLmxlbmd0aDsgYysrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaHJlZi5pbmRleE9mKGNzc1tjXSkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNraXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc2tpcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHJ1bGVzID0gc2hlZXRzW2ldLmNzc1J1bGVzIHx8IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcnVsZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJ1bGUgPSBydWxlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZihydWxlLnN0eWxlKSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWxlbXMgPSBkb20ucXVlcnlTZWxlY3RvckFsbChydWxlLnNlbGVjdG9yVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZWQgKz0gcnVsZS5zZWxlY3RvclRleHQgKyBcIiB7IFwiICsgcnVsZS5zdHlsZS5jc3NUZXh0ICsgXCIgfVxcblwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBhcmUgPGRlZnM+IGFscmVhZHlcbiAgICAgICAgICAgIHZhciBkZWZzID0gZG9tLnF1ZXJ5U2VsZWN0b3IoXCJkZWZzXCIpIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RlZnMnKTtcbiAgICAgICAgICAgIHZhciBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgICAgIHMuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgICAgICAgICBzLmlubmVySFRNTCA9IFwiPCFbQ0RBVEFbXFxuXCIgKyB1c2VkICsgXCJcXG5dXT5cIjtcblxuICAgICAgICAgICAgLy8gdmFyIGRlZnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkZWZzJyk7XG4gICAgICAgICAgICBkZWZzLmFwcGVuZENoaWxkKHMpO1xuICAgICAgICAgICAgcmV0dXJuIGRlZnM7XG4gICAgICAgIH07XG5cbiAgICAgICAgaW5saW5lX2ltYWdlcyAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gdmFyIHN2ZyA9IGRpdi5xdWVyeVNlbGVjdG9yKCdzdmcnKTtcbiAgICAgICAgICAgIHZhciBvdXRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICB2YXIgY2xvbmUgPSBmcm9tX3N2Zy5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICB2YXIgd2lkdGggPSBwYXJzZUludChjbG9uZS5nZXRBdHRyaWJ1dGUoJ3dpZHRoJykpO1xuICAgICAgICAgICAgdmFyIGhlaWdodCA9IHBhcnNlSW50KGNsb25lLmdldEF0dHJpYnV0ZSgnaGVpZ2h0JykpO1xuXG4gICAgICAgICAgICBjbG9uZS5zZXRBdHRyaWJ1dGUoXCJ2ZXJzaW9uXCIsIFwiMS4xXCIpO1xuICAgICAgICAgICAgY2xvbmUuc2V0QXR0cmlidXRlKFwieG1sbnNcIiwgXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiKTtcbiAgICAgICAgICAgIGNsb25lLnNldEF0dHJpYnV0ZShcInhtbG5zOnhsaW5rXCIsIFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiKTtcbiAgICAgICAgICAgIGNsb25lLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIHdpZHRoICogc2NhbGVfZmFjdG9yKTtcbiAgICAgICAgICAgIGNsb25lLnNldEF0dHJpYnV0ZShcImhlaWdodFwiLCBoZWlnaHQgKiBzY2FsZV9mYWN0b3IpO1xuICAgICAgICAgICAgdmFyIHNjYWxpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZ1wiKTtcbiAgICAgICAgICAgIHNjYWxpbmcuc2V0QXR0cmlidXRlKFwidHJhbnNmb3JtXCIsIFwic2NhbGUoXCIgKyBzY2FsZV9mYWN0b3IgKyBcIilcIik7XG4gICAgICAgICAgICBjbG9uZS5hcHBlbmRDaGlsZChtb3ZlX2NoaWxkcmVuKGNsb25lLCBzY2FsaW5nKSk7XG4gICAgICAgICAgICBvdXRlci5hcHBlbmRDaGlsZChjbG9uZSk7XG5cbiAgICAgICAgICAgIGNsb25lLmluc2VydEJlZm9yZSAoc3R5bGluZyhjbG9uZSksIGNsb25lLmZpcnN0Q2hpbGQpO1xuXG4gICAgICAgICAgICB2YXIgc3ZnID0gZG9jdHlwZSArIG91dGVyLmlubmVySFRNTDtcbiAgICAgICAgICAgIHN2ZyA9IHN2Zy5yZXBsYWNlIChcIm5vbmVcIiwgXCJibG9ja1wiKTsgLy8gSW4gY2FzZSB0aGUgc3ZnIGlzIG5vdCBiZWluZyBkaXNwbGF5ZWQsIGl0IGlzIGlnbm9yZWQgaW4gRkZcbiAgICAgICAgICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuXG4gICAgICAgICAgICBpbWFnZS5zcmMgPSAnZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCwnICsgd2luZG93LmJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHN2ZykpKTtcbiAgICAgICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSBpbWFnZS53aWR0aDtcbiAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDApO1xuXG4gICAgICAgICAgICAgICAgdmFyIHNyYyA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xuICAgICAgICAgICAgICAgIGltZ19jYmFrIChzcmMpO1xuICAgICAgICAgICAgICAgIC8vIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICAgICAgICAgIC8vIGEuZG93bmxvYWQgPSBmaWxlbmFtZTtcbiAgICAgICAgICAgICAgICAvLyBhLmhyZWYgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcbiAgICAgICAgICAgICAgICAvLyBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xuICAgICAgICAgICAgICAgIC8vIGEuY2xpY2soKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgfTtcbiAgICBwbmdfZXhwb3J0LnNjYWxlX2ZhY3RvciA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHNjYWxlX2ZhY3RvcjtcbiAgICAgICAgfVxuICAgICAgICBzY2FsZV9mYWN0b3IgPSBmO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcG5nX2V4cG9ydC5jYWxsYmFjayA9IGZ1bmN0aW9uIChjYmFrKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGltZ19jYmFrO1xuICAgICAgICB9XG4gICAgICAgIGltZ19jYmFrID0gY2JhaztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHBuZ19leHBvcnQuc3R5bGVzaGVldHMgPSBmdW5jdGlvbiAocmVzdHJpY3RDc3MpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY3NzO1xuICAgICAgICB9XG4gICAgICAgIGNzcyA9IHJlc3RyaWN0Q3NzO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLy8gcG5nX2V4cG9ydC5maWxlbmFtZSA9IGZ1bmN0aW9uIChmKSB7XG4gICAgLy8gXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAvLyBcdCAgICByZXR1cm4gZmlsZW5hbWU7XG4gICAgLy8gXHR9XG4gICAgLy8gXHRmaWxlbmFtZSA9IGY7XG4gICAgLy8gXHRyZXR1cm4gcG5nX2V4cG9ydDtcbiAgICAvLyB9O1xuXG4gICAgcmV0dXJuIHBuZ19leHBvcnQ7XG59O1xuXG52YXIgZG93bmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZmlsZW5hbWUgPSAnaW1hZ2UucG5nJztcbiAgICB2YXIgbWF4X3NpemUgPSB7XG4gICAgICAgIGxpbWl0OiBJbmZpbml0eSxcbiAgICAgICAgb25FcnJvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJpbWFnZSB0b28gbGFyZ2VcIik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHBuZ19leHBvcnQgPSBwbmcoKVxuICAgICAgICAuY2FsbGJhY2sgKGZ1bmN0aW9uIChzcmMpIHtcbiAgICAgICAgICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICAgICAgYS5kb3dubG9hZCA9IGZpbGVuYW1lO1xuICAgICAgICAgICAgYS5ocmVmID0gc3JjO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTtcblxuICAgICAgICAgICAgaWYgKGEuaHJlZi5sZW5ndGggPiBtYXhfc2l6ZS5saW1pdCkge1xuICAgICAgICAgICAgICAgIGEucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChhKTtcbiAgICAgICAgICAgICAgICBtYXhfc2l6ZS5vbkVycm9yKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGEuY2xpY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gICAgIGEuY2xpY2soKTtcbiAgICAgICAgICAgIC8vIH0sIDMwMDApO1xuICAgICAgICB9KTtcblxuICAgIHBuZ19leHBvcnQuZmlsZW5hbWUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsZW5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZmlsZW5hbWUgPSBmbjtcbiAgICAgICAgcmV0dXJuIHBuZ19leHBvcnQ7XG4gICAgfTtcblxuICAgIHBuZ19leHBvcnQubGltaXQgPSBmdW5jdGlvbiAobCkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXhfc2l6ZTtcbiAgICAgICAgfVxuICAgICAgICBtYXhfc2l6ZSA9IGw7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICByZXR1cm4gcG5nX2V4cG9ydDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGRvd25sb2FkO1xuIiwidmFyIHJlZHVjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc21vb3RoID0gNTtcbiAgICB2YXIgdmFsdWUgPSAndmFsJztcbiAgICB2YXIgcmVkdW5kYW50ID0gZnVuY3Rpb24gKGEsIGIpIHtcblx0aWYgKGEgPCBiKSB7XG5cdCAgICByZXR1cm4gKChiLWEpIDw9IChiICogMC4yKSk7XG5cdH1cblx0cmV0dXJuICgoYS1iKSA8PSAoYSAqIDAuMikpO1xuICAgIH07XG4gICAgdmFyIHBlcmZvcm1fcmVkdWNlID0gZnVuY3Rpb24gKGFycikge3JldHVybiBhcnI7fTtcblxuICAgIHZhciByZWR1Y2UgPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmICghYXJyLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGFycjtcblx0fVxuXHR2YXIgc21vb3RoZWQgPSBwZXJmb3JtX3Ntb290aChhcnIpO1xuXHR2YXIgcmVkdWNlZCAgPSBwZXJmb3JtX3JlZHVjZShzbW9vdGhlZCk7XG5cdHJldHVybiByZWR1Y2VkO1xuICAgIH07XG5cbiAgICB2YXIgbWVkaWFuID0gZnVuY3Rpb24gKHYsIGFycikge1xuXHRhcnIuc29ydChmdW5jdGlvbiAoYSwgYikge1xuXHQgICAgcmV0dXJuIGFbdmFsdWVdIC0gYlt2YWx1ZV07XG5cdH0pO1xuXHRpZiAoYXJyLmxlbmd0aCAlIDIpIHtcblx0ICAgIHZbdmFsdWVdID0gYXJyW35+KGFyci5sZW5ndGggLyAyKV1bdmFsdWVdO1x0ICAgIFxuXHR9IGVsc2Uge1xuXHQgICAgdmFyIG4gPSB+fihhcnIubGVuZ3RoIC8gMikgLSAxO1xuXHQgICAgdlt2YWx1ZV0gPSAoYXJyW25dW3ZhbHVlXSArIGFycltuKzFdW3ZhbHVlXSkgLyAyO1xuXHR9XG5cblx0cmV0dXJuIHY7XG4gICAgfTtcblxuICAgIHZhciBjbG9uZSA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcblx0dmFyIHRhcmdldCA9IHt9O1xuXHRmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuXHQgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRcdHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdGFyZ2V0O1xuICAgIH07XG5cbiAgICB2YXIgcGVyZm9ybV9zbW9vdGggPSBmdW5jdGlvbiAoYXJyKSB7XG5cdGlmIChzbW9vdGggPT09IDApIHsgLy8gbm8gc21vb3RoXG5cdCAgICByZXR1cm4gYXJyO1xuXHR9XG5cdHZhciBzbW9vdGhfYXJyID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBsb3cgPSAoaSA8IHNtb290aCkgPyAwIDogKGkgLSBzbW9vdGgpO1xuXHQgICAgdmFyIGhpZ2ggPSAoaSA+IChhcnIubGVuZ3RoIC0gc21vb3RoKSkgPyBhcnIubGVuZ3RoIDogKGkgKyBzbW9vdGgpO1xuXHQgICAgc21vb3RoX2FycltpXSA9IG1lZGlhbihjbG9uZShhcnJbaV0pLCBhcnIuc2xpY2UobG93LGhpZ2grMSkpO1xuXHR9XG5cdHJldHVybiBzbW9vdGhfYXJyO1xuICAgIH07XG5cbiAgICByZWR1Y2UucmVkdWNlciA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHBlcmZvcm1fcmVkdWNlO1xuXHR9XG5cdHBlcmZvcm1fcmVkdWNlID0gY2Jhaztcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnJlZHVuZGFudCA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHJlZHVuZGFudDtcblx0fVxuXHRyZWR1bmRhbnQgPSBjYmFrO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2UudmFsdWUgPSBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHZhbHVlO1xuXHR9XG5cdHZhbHVlID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2Uuc21vb3RoID0gZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBzbW9vdGg7XG5cdH1cblx0c21vb3RoID0gdmFsO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmVkdWNlO1xufTtcblxudmFyIGJsb2NrID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWQgPSByZWR1Y2UoKVxuXHQudmFsdWUoJ3N0YXJ0Jyk7XG5cbiAgICB2YXIgdmFsdWUyID0gJ2VuZCc7XG5cbiAgICB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnb2JqZWN0JyA6IHtcbiAgICAgICAgICAgICAgICAnc3RhcnQnIDogb2JqMS5vYmplY3RbcmVkLnZhbHVlKCldLFxuICAgICAgICAgICAgICAgICdlbmQnICAgOiBvYmoyW3ZhbHVlMl1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAndmFsdWUnICA6IG9iajJbdmFsdWUyXVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvLyB2YXIgam9pbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyKSB7IHJldHVybiBvYmoxIH07XG5cbiAgICByZWQucmVkdWNlciggZnVuY3Rpb24gKGFycikge1xuXHR2YXIgdmFsdWUgPSByZWQudmFsdWUoKTtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHJlZHVjZWRfYXJyID0gW107XG5cdHZhciBjdXJyID0ge1xuXHQgICAgJ29iamVjdCcgOiBhcnJbMF0sXG5cdCAgICAndmFsdWUnICA6IGFyclswXVt2YWx1ZTJdXG5cdH07XG5cdGZvciAodmFyIGk9MTsgaTxhcnIubGVuZ3RoOyBpKyspIHtcblx0ICAgIGlmIChyZWR1bmRhbnQgKGFycltpXVt2YWx1ZV0sIGN1cnIudmFsdWUpKSB7XG5cdFx0Y3VyciA9IGpvaW4oY3VyciwgYXJyW2ldKTtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIub2JqZWN0KTtcblx0ICAgIGN1cnIub2JqZWN0ID0gYXJyW2ldO1xuXHQgICAgY3Vyci52YWx1ZSA9IGFycltpXS5lbmQ7XG5cdH1cblx0cmVkdWNlZF9hcnIucHVzaChjdXJyLm9iamVjdCk7XG5cblx0Ly8gcmVkdWNlZF9hcnIucHVzaChhcnJbYXJyLmxlbmd0aC0xXSk7XG5cdHJldHVybiByZWR1Y2VkX2FycjtcbiAgICB9KTtcblxuICAgIHJlZHVjZS5qb2luID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gam9pbjtcblx0fVxuXHRqb2luID0gY2Jhaztcblx0cmV0dXJuIHJlZDtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnZhbHVlMiA9IGZ1bmN0aW9uIChmaWVsZCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB2YWx1ZTI7XG5cdH1cblx0dmFsdWUyID0gZmllbGQ7XG5cdHJldHVybiByZWQ7XG4gICAgfTtcblxuICAgIHJldHVybiByZWQ7XG59O1xuXG52YXIgbGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVkID0gcmVkdWNlKCk7XG5cbiAgICByZWQucmVkdWNlciAoIGZ1bmN0aW9uIChhcnIpIHtcblx0dmFyIHJlZHVuZGFudCA9IHJlZC5yZWR1bmRhbnQoKTtcblx0dmFyIHZhbHVlID0gcmVkLnZhbHVlKCk7XG5cdHZhciByZWR1Y2VkX2FyciA9IFtdO1xuXHR2YXIgY3VyciA9IGFyclswXTtcblx0Zm9yICh2YXIgaT0xOyBpPGFyci5sZW5ndGgtMTsgaSsrKSB7XG5cdCAgICBpZiAocmVkdW5kYW50IChhcnJbaV1bdmFsdWVdLCBjdXJyW3ZhbHVlXSkpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIHJlZHVjZWRfYXJyLnB1c2ggKGN1cnIpO1xuXHQgICAgY3VyciA9IGFycltpXTtcblx0fVxuXHRyZWR1Y2VkX2Fyci5wdXNoKGN1cnIpO1xuXHRyZWR1Y2VkX2Fyci5wdXNoKGFyclthcnIubGVuZ3RoLTFdKTtcblx0cmV0dXJuIHJlZHVjZWRfYXJyO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlZDtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y2U7XG5tb2R1bGUuZXhwb3J0cy5saW5lID0gbGluZTtcbm1vZHVsZS5leHBvcnRzLmJsb2NrID0gYmxvY2s7XG5cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXRlcmF0b3IgOiBmdW5jdGlvbihpbml0X3ZhbCkge1xuXHR2YXIgaSA9IGluaXRfdmFsIHx8IDA7XG5cdHZhciBpdGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIGkrKztcblx0fTtcblx0cmV0dXJuIGl0ZXI7XG4gICAgfSxcblxuICAgIHNjcmlwdF9wYXRoIDogZnVuY3Rpb24gKHNjcmlwdF9uYW1lKSB7IC8vIHNjcmlwdF9uYW1lIGlzIHRoZSBmaWxlbmFtZVxuXHR2YXIgc2NyaXB0X3NjYXBlZCA9IHNjcmlwdF9uYW1lLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xuXHR2YXIgc2NyaXB0X3JlID0gbmV3IFJlZ0V4cChzY3JpcHRfc2NhcGVkICsgJyQnKTtcblx0dmFyIHNjcmlwdF9yZV9zdWIgPSBuZXcgUmVnRXhwKCcoLiopJyArIHNjcmlwdF9zY2FwZWQgKyAnJCcpO1xuXG5cdC8vIFRPRE86IFRoaXMgcmVxdWlyZXMgcGhhbnRvbS5qcyBvciBhIHNpbWlsYXIgaGVhZGxlc3Mgd2Via2l0IHRvIHdvcmsgKGRvY3VtZW50KVxuXHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcblx0dmFyIHBhdGggPSBcIlwiOyAgLy8gRGVmYXVsdCB0byBjdXJyZW50IHBhdGhcblx0aWYoc2NyaXB0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3IodmFyIGkgaW4gc2NyaXB0cykge1xuXHRcdGlmKHNjcmlwdHNbaV0uc3JjICYmIHNjcmlwdHNbaV0uc3JjLm1hdGNoKHNjcmlwdF9yZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjcmlwdHNbaV0uc3JjLnJlcGxhY2Uoc2NyaXB0X3JlX3N1YiwgJyQxJyk7XG5cdFx0fVxuICAgICAgICAgICAgfVxuXHR9XG5cdHJldHVybiBwYXRoO1xuICAgIH0sXG5cbiAgICBkZWZlcl9jYW5jZWwgOiBmdW5jdGlvbiAoY2JhaywgdGltZSkge1xuICAgICAgICB2YXIgdGljaztcblxuICAgICAgICB2YXIgZGVmZXJfY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpY2spO1xuICAgICAgICAgICAgdGljayA9IHNldFRpbWVvdXQgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBjYmFrLmFwcGx5ICh0aGF0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sIHRpbWUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBkZWZlcl9jYW5jZWw7XG4gICAgfVxufTtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUgKFwidG50LmFwaVwiKTtcblxudmFyIHRhID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIG5vX3RyYWNrID0gdHJ1ZTtcbiAgICB2YXIgZGl2X2lkO1xuXG4gICAgLy8gRGVmYXVsdHNcbiAgICB2YXIgdHJlZV9jb25mID0ge1xuICAgIFx0dHJlZSA6IHVuZGVmaW5lZCxcbiAgICBcdHRyYWNrIDogZnVuY3Rpb24gKCkge1xuICAgIFx0ICAgIHZhciB0ID0gdG50LmJvYXJkLnRyYWNrKClcbiAgICAgICAgICAgICAgICAuY29sb3IoXCIjRUJGNUZGXCIpXG4gICAgICAgICAgICAgICAgLmRhdGEodG50LmJvYXJkLnRyYWNrLmRhdGEoKVxuICAgICAgICAgICAgICAgICAgICAudXBkYXRlKHRudC5ib2FyZC50cmFjay5yZXRyaWV2ZXIuc3luYygpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmV0cmlldmVyIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICAgLmRpc3BsYXkodG50LmJvYXJkLnRyYWNrLmZlYXR1cmUuYmxvY2soKVxuICAgICAgICAgICAgICAgICAgICAuY29sb3IoXCJzdGVlbGJsdWVcIilcbiAgICAgICAgICAgICAgICAgICAgLmluZGV4KGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC5zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgXHQgICAgcmV0dXJuIHQ7XG4gICAgXHR9LFxuICAgIFx0Ym9hcmQgOiB1bmRlZmluZWQsXG4gICAgXHRydWxlciA6IFwibm9uZVwiLFxuICAgIFx0a2V5ICAgOiB1bmRlZmluZWRcbiAgICB9O1xuXG4gICAgdmFyIHRyZWVfYW5ub3QgPSBmdW5jdGlvbiAoZGl2KSB7XG4gICAgXHRkaXZfaWQgPSBkMy5zZWxlY3QoZGl2KVxuICAgIFx0ICAgIC5hdHRyKFwiaWRcIik7XG5cbiAgICBcdHZhciBncm91cF9kaXYgPSBkMy5zZWxlY3QoZGl2KVxuICAgIFx0ICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2dyb3VwRGl2XCIpO1xuXG4gICAgXHR2YXIgdHJlZV9kaXYgPSBncm91cF9kaXZcbiAgICBcdCAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgXHQgICAgLmF0dHIoXCJpZFwiLCBcInRudF90cmVlX2NvbnRhaW5lcl9cIiArIGRpdl9pZClcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfY29udGFpbmVyXCIpO1xuXG4gICAgXHR2YXIgYW5ub3RfZGl2ID0gZ3JvdXBfZGl2XG4gICAgXHQgICAgLmFwcGVuZChcImRpdlwiKVxuICAgIFx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfYW5ub3RfY29udGFpbmVyX1wiICsgZGl2X2lkKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfYW5ub3RfY29udGFpbmVyXCIpO1xuXG4gICAgXHR0cmVlX2NvbmYudHJlZSAodHJlZV9kaXYubm9kZSgpKTtcblxuICAgIFx0Ly8gdHJhY2tzXG4gICAgXHR2YXIgbGVhdmVzID0gdHJlZV9jb25mLnRyZWUucm9vdCgpLmdldF9hbGxfbGVhdmVzKCk7XG4gICAgXHR2YXIgdHJhY2tzID0gW107XG5cbiAgICBcdHZhciBoZWlnaHQgPSB0cmVlX2NvbmYudHJlZS5sYWJlbCgpLmhlaWdodCgpO1xuXG4gICAgXHRmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgXHQgICAgLy8gQmxvY2sgVHJhY2sxXG4gICAgXHQgICAgKGZ1bmN0aW9uICAobGVhZikge1xuICAgICAgICBcdFx0dG50LmJvYXJkLnRyYWNrLmlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBcdFx0ICAgIGlmICh0cmVlX2NvbmYua2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIFx0XHRcdHJldHVybiAgbGVhZi5pZCgpO1xuICAgICAgICBcdFx0ICAgIH1cbiAgICAgICAgXHRcdCAgICBpZiAodHlwZW9mICh0cmVlX2NvbmYua2V5KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgXHRcdFx0cmV0dXJuIHRyZWVfY29uZi5rZXkgKGxlYWYpO1xuICAgICAgICBcdFx0ICAgIH1cbiAgICAgICAgXHRcdCAgICByZXR1cm4gbGVhZi5wcm9wZXJ0eSh0cmVlX2NvbmYua2V5KTtcbiAgICAgICAgXHRcdH07XG4gICAgICAgIFx0XHR2YXIgdHJhY2sgPSB0cmVlX2NvbmYudHJhY2sobGVhdmVzW2ldKVxuICAgICAgICBcdFx0ICAgIC5oZWlnaHQoaGVpZ2h0KTtcblxuICAgICAgICBcdFx0dHJhY2tzLnB1c2ggKHRyYWNrKTtcbiAgICBcdCAgICB9KShsZWF2ZXNbaV0pO1xuICAgIFx0fVxuXG4gICAgXHQvLyBBbiBheGlzIHRyYWNrXG4gICAgXHR0bnQuYm9hcmQudHJhY2suaWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgXHQgICAgcmV0dXJuIFwiYXhpcy10b3BcIjtcbiAgICBcdH07XG4gICAgXHR2YXIgYXhpc190b3AgPSB0bnQuYm9hcmQudHJhY2soKVxuICAgIFx0ICAgIC5oZWlnaHQoMClcbiAgICBcdCAgICAuY29sb3IoXCJ3aGl0ZVwiKVxuICAgIFx0ICAgIC5kaXNwbGF5KHRudC5ib2FyZC50cmFjay5mZWF0dXJlLmF4aXMoKVxuICAgIFx0XHQgICAgIC5vcmllbnRhdGlvbihcInRvcFwiKVxuICAgIFx0XHQgICAgKTtcblxuICAgIFx0dG50LmJvYXJkLnRyYWNrLmlkID0gZnVuY3Rpb24gKCkge1xuICAgIFx0ICAgIHJldHVybiBcImF4aXMtYm90dG9tXCI7XG4gICAgXHR9O1xuICAgIFx0dmFyIGF4aXMgPSB0bnQuYm9hcmQudHJhY2soKVxuICAgIFx0ICAgIC5oZWlnaHQoMTgpXG4gICAgXHQgICAgLmNvbG9yKFwid2hpdGVcIilcbiAgICBcdCAgICAuZGlzcGxheSh0bnQuYm9hcmQudHJhY2suZmVhdHVyZS5heGlzKClcbiAgICBcdFx0ICAgICAub3JpZW50YXRpb24oXCJib3R0b21cIilcbiAgICAgICAgICAgICApO1xuXG4gICAgXHRpZiAodHJlZV9jb25mLmJvYXJkKSB7XG4gICAgXHQgICAgaWYgKHRyZWVfY29uZi5ydWxlciA9PT0gJ2JvdGgnIHx8IHRyZWVfY29uZi5ydWxlciA9PT0gJ3RvcCcpIHtcbiAgICAgICAgXHRcdHRyZWVfY29uZi5ib2FyZFxuICAgICAgICBcdFx0ICAgIC5hZGRfdHJhY2soYXhpc190b3ApO1xuICAgIFx0ICAgIH1cblxuICAgIFx0ICAgIHRyZWVfY29uZi5ib2FyZFxuICAgICAgICBcdFx0LmFkZF90cmFjayh0cmFja3MpO1xuXG4gICAgXHQgICAgaWYgKHRyZWVfY29uZi5ydWxlciA9PT0gJ2JvdGgnIHx8IHRyZWVfY29uZi5ydWxlciA9PT0gXCJib3R0b21cIikge1xuICAgICAgICBcdFx0dHJlZV9jb25mLmJvYXJkXG4gICAgICAgIFx0XHQgICAgLmFkZF90cmFjayhheGlzKTtcbiAgICBcdCAgICB9XG5cbiAgICBcdCAgICB0cmVlX2NvbmYuYm9hcmQoYW5ub3RfZGl2Lm5vZGUoKSk7XG4gICAgXHQgICAgdHJlZV9jb25mLmJvYXJkLnN0YXJ0KCk7XG4gICAgXHR9XG5cbiAgICBcdGFwaS5tZXRob2QoJ3VwZGF0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICBcdCAgICB0cmVlX2NvbmYudHJlZS51cGRhdGUoKTtcblxuICAgIFx0ICAgIGlmICh0cmVlX2NvbmYuYm9hcmQpIHtcbiAgICAgICAgXHRcdHZhciBsZWF2ZXMgPSB0cmVlX2NvbmYudHJlZS5yb290KCkuZ2V0X2FsbF9sZWF2ZXMoKTtcbiAgICAgICAgXHRcdHZhciBuZXdfdHJhY2tzID0gW107XG5cbiAgICAgICAgXHRcdGlmICh0cmVlX2NvbmYucnVsZXIgPT09ICdib3RoJyB8fCB0cmVlX2NvbmYucnVsZXIgPT09ICd0b3AnKSB7XG4gICAgICAgIFx0XHQgICAgbmV3X3RyYWNrcy5wdXNoKGF4aXNfdG9wKTtcbiAgICAgICAgXHRcdH1cblxuICAgICAgICBcdFx0Zm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBcdFx0ICAgIC8vIFdlIGZpcnN0IHNlZSBpZiB3ZSBoYXZlIGEgdHJhY2sgZm9yIHRoZSBsZWFmOlxuICAgICAgICBcdFx0ICAgIHZhciBpZDtcbiAgICAgICAgXHRcdCAgICBpZiAodHJlZV9jb25mLmtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBcdFx0XHRpZCA9IGxlYXZlc1tpXS5pZCgpO1xuICAgICAgICBcdFx0ICAgIH0gZWxzZSBpZiAodHlwZW9mICh0cmVlX2NvbmYua2V5KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgXHRcdFx0aWQgPSB0cmVlX2NvbmYua2V5IChsZWF2ZXNbaV0pO1xuICAgICAgICBcdFx0ICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBcdFx0XHRpZCA9IGxlYXZlc1tpXS5wcm9wZXJ0eSh0cmVlX2NvbmYua2V5KTtcbiAgICAgICAgXHRcdCAgICB9XG4gICAgICAgIFx0XHQgICAgdmFyIGN1cnJfdHJhY2sgPSB0cmVlX2NvbmYuYm9hcmQuZmluZF90cmFjayhpZCk7XG4gICAgICAgIFx0XHQgICAgaWYgKGN1cnJfdHJhY2sgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgXHRcdFx0Ly8gTmV3IGxlYWYgLS0gbm8gdHJhY2sgZm9yIGl0XG4gICAgICAgICAgICBcdFx0XHQoZnVuY3Rpb24gKGxlYWYpIHtcbiAgICAgICAgICAgIFx0XHRcdCAgICB0bnQuYm9hcmQudHJhY2suaWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgXHRcdFx0XHRpZiAodHJlZV9jb25mLmtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgXHRcdFx0XHQgICAgcmV0dXJuIGxlYWYuaWQoKTtcbiAgICAgICAgICAgICAgICBcdFx0XHRcdH1cbiAgICAgICAgICAgICAgICBcdFx0XHRcdGlmICh0eXBlb2YgKHRyZWVfY29uZi5rZXkpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgXHRcdFx0XHQgICAgcmV0dXJuIHRyZWVfY29uZi5rZXkgKGxlYWYpO1xuICAgICAgICAgICAgICAgIFx0XHRcdFx0fVxuICAgICAgICAgICAgICAgIFx0XHRcdFx0cmV0dXJuIGxlYWYucHJvcGVydHkodHJlZV9jb25mLmtleSk7XG4gICAgICAgICAgICBcdFx0XHQgICAgfTtcbiAgICAgICAgICAgIFx0XHRcdCAgICBjdXJyX3RyYWNrID0gdHJlZV9jb25mLnRyYWNrKGxlYXZlc1tpXSlcbiAgICAgICAgICAgICAgICBcdFx0XHRcdC5oZWlnaHQoaGVpZ2h0KTtcbiAgICAgICAgICAgIFx0XHRcdH0pKGxlYXZlc1tpXSk7XG4gICAgICAgIFx0XHQgICAgfVxuICAgICAgICBcdFx0ICAgIG5ld190cmFja3MucHVzaChjdXJyX3RyYWNrKTtcbiAgICAgICAgXHRcdH1cbiAgICAgICAgXHRcdGlmICh0cmVlX2NvbmYucnVsZXIgPT09ICdib3RoJyB8fCB0cmVlX2NvbmYucnVsZXIgPT09ICdib3R0b20nKSB7XG4gICAgICAgIFx0XHQgICAgbmV3X3RyYWNrcy5wdXNoKGF4aXMpO1xuICAgICAgICBcdFx0fVxuXG4gICAgICAgIFx0XHR0cmVlX2NvbmYuYm9hcmQudHJhY2tzKG5ld190cmFja3MpO1xuICAgIFx0ICAgIH1cbiAgICBcdH0pO1xuXG4gICAgXHRyZXR1cm4gdHJlZV9hbm5vdDtcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzICh0cmVlX2Fubm90KVxuICAgIFx0LmdldHNldCAodHJlZV9jb25mKTtcblxuICAgIC8vIFRPRE86IFJld3JpdGUgd2l0aCB0aGUgYXBpIGludGVyZmFjZVxuICAgIHRyZWVfYW5ub3QudHJhY2sgPSBmdW5jdGlvbiAobmV3X3RyYWNrKSB7XG4gICAgXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBcdCAgICByZXR1cm4gdHJlZV9jb25mLnRyYWNrO1xuICAgIFx0fVxuXG4gICAgXHQvLyBGaXJzdCB0aW1lIGl0IGlzIHNldFxuICAgIFx0aWYgKG5vX3RyYWNrKSB7XG4gICAgXHQgICAgdHJlZV9jb25mLnRyYWNrID0gbmV3X3RyYWNrO1xuICAgIFx0ICAgIG5vX3RyYWNrID0gZmFsc2U7XG4gICAgXHQgICAgcmV0dXJuIHRyZWVfYW5ub3Q7XG4gICAgXHR9XG5cbiAgICBcdC8vIElmIGl0IGlzIHJlc2V0IC0tIGFwcGx5IHRoZSBjaGFuZ2VzXG4gICAgXHR2YXIgdHJhY2tzID0gdHJlZV9jb25mLmJvYXJkLnRyYWNrcygpO1xuICAgIFx0Ly8gdmFyIHN0YXJ0X2luZGV4ID0gKHRyZWVfY29uZi5ydWxlciA9PT0gJ2JvdGgnIHx8IHRyZWVfY29uZi5ydWxlciA9PT0gJ3RvcCcpID8gMSA6IDA7XG4gICAgXHQvLyB2YXIgZW5kX2luZGV4ID0gKHRyZWVfY29uZi5ydWxlciA9PT0gJ2JvdGgnIHx8IHRyZWVfY29uZi5ydWxlciA9PT0gJ2JvdHRvbScpID8gMSA6IDA7XG5cbiAgICBcdHZhciBzdGFydF9pbmRleCA9IDA7XG4gICAgXHR2YXIgbl9pbmRleCA9IDA7XG5cbiAgICBcdGlmICh0cmVlX2NvbmYucnVsZXIgPT09IFwiYm90aFwiKSB7XG4gICAgXHQgICAgc3RhcnRfaW5kZXggPSAxO1xuICAgIFx0ICAgIG5faW5kZXggPSAyO1xuICAgIFx0fSBlbHNlIGlmICh0cmVlX2NvbmYucnVsZXIgPT09IFwidG9wXCIpIHtcbiAgICBcdCAgICBzdGFydF9pbmRleCA9IDE7XG4gICAgXHQgICAgbl9pbmRleCA9IDE7XG4gICAgXHR9IGVsc2UgaWYgKHRyZWVfY29uZi5ydWxlciA9PT0gXCJib3R0b21cIikge1xuICAgIFx0ICAgIG5faW5kZXggPSAxO1xuICAgIFx0fVxuXG4gICAgXHQvLyBSZXNldCB0b3AgdHJhY2sgLS0gYXhpc1xuICAgIFx0aWYgKHN0YXJ0X2luZGV4ID4gMCkge1xuICAgIFx0ICAgIHRyYWNrc1swXS5kaXNwbGF5KCkucmVzZXQuY2FsbCh0cmFja3NbMF0pO1xuICAgIFx0fVxuICAgIFx0Ly8gUmVzZXQgYm90dG9tIHRyYWNrIC0tIGF4aXNcbiAgICBcdGlmIChuX2luZGV4ID4gc3RhcnRfaW5kZXgpIHtcbiAgICBcdCAgICB2YXIgbiA9IHRyYWNrcy5sZW5ndGggLSAxO1xuICAgIFx0ICAgIHRyYWNrc1tuXS5kaXNwbGF5KCkucmVzZXQuY2FsbCh0cmFja3Nbbl0pO1xuICAgIFx0fVxuXG4gICAgXHRmb3IgKHZhciBpPXN0YXJ0X2luZGV4OyBpPD0odHJhY2tzLmxlbmd0aCAtIG5faW5kZXgpOyBpKyspIHtcbiAgICBcdCAgICB2YXIgdCA9IHRyYWNrc1tpXTtcbiAgICBcdCAgICB0LmRpc3BsYXkoKS5yZXNldC5jYWxsKHQpO1xuICAgIFx0ICAgIHZhciBsZWFmO1xuICAgIFx0ICAgIHRyZWVfY29uZi50cmVlLnJvb3QoKS5hcHBseSAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgXHRcdGlmIChub2RlLmlkKCkgPT09IHQuaWQoKSkge1xuICAgICAgICBcdFx0ICAgIGxlYWYgPSBub2RlO1xuICAgICAgICBcdFx0fVxuICAgIFx0ICAgIH0pO1xuXG4gICAgXHQgICAgdmFyIG5fdHJhY2s7XG4gICAgXHQgICAgKGZ1bmN0aW9uIChsZWFmKSB7XG4gICAgICAgIFx0XHR0bnQuYm9hcmQudHJhY2suaWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFx0XHQgICAgaWYgKHRyZWVfY29uZi5rZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgXHRcdFx0cmV0dXJuIGxlYWYuaWQoKTtcbiAgICAgICAgXHRcdCAgICB9XG4gICAgICAgIFx0XHQgICAgaWYgKHR5cGVvZiAodHJlZV9jb25mLmtleSA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgIFx0XHRcdHJldHVybiB0cmVlX2NvbmYua2V5IChsZWFmKTtcbiAgICAgICAgXHRcdCAgICB9XG4gICAgICAgIFx0XHQgICAgcmV0dXJuIGxlYWYucHJvcGVydHkodHJlZV9jb25mLmtleSk7XG4gICAgICAgIFx0XHR9O1xuICAgICAgICBcdFx0bl90cmFjayA9IG5ld190cmFjayhsZWFmKVxuICAgICAgICBcdFx0ICAgIC5oZWlnaHQodHJlZV9jb25mLnRyZWUubGFiZWwoKS5oZWlnaHQoKSk7XG4gICAgXHQgICAgfSkobGVhZik7XG5cbiAgICBcdCAgICB0cmFja3NbaV0gPSBuX3RyYWNrO1xuICAgIFx0fVxuXG4gICAgXHR0cmVlX2NvbmYudHJhY2sgPSBuZXdfdHJhY2s7XG4gICAgXHR0cmVlX2NvbmYuYm9hcmQuc3RhcnQoKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRyZWVfYW5ub3Q7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0YTtcbiJdfQ==

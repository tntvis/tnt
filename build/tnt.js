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

var tnt_data = {};

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
        domain : [0,1]
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
            .style("fill", function (d) {
                return d3.functor(feature.color())(d);
            })
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
var tree;
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
var apijs = require("tnt.api");
var defer_cancel = require("tnt.utils").defer_cancel;

var ta = function () {
    "use strict";

    var dispatch = d3.dispatch ("drag");

    var no_track = true;
    var div_id;

    // Defaults
    var tree_conf = {
        tree: undefined,
        track: function () {
            var t = tnt.board.track()
                .color("#EBF5FF")
                .data(tnt.board.track.data()
                    .update(tnt.board.track.retriever.sync()
                        .retriever(function () {
                            return [];
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
        board: undefined,
        top: undefined,
        bottom: undefined,
        key: undefined,
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

        var curr_tree_width = tree_conf.tree.layout().width();
        var drag = group_div
            .append("div")
            .attr("id", "tnt_annot_drag")
            .style("left", curr_tree_width + "px");

        // Dragging
        drag.on("mousedown", function () {
            var resizing_pos = d3.event.clientX;
            curr_tree_width = tree_conf.tree.layout().width();
            var curr_board_width = tree_conf.board.width();

            var deferred = defer_cancel(function mousemove(clientX) {
                var current_pos = clientX;
                var diff = current_pos - resizing_pos;
                // var curr_tree_width = tree_conf.tree.layout().width();
                tree_conf.tree.layout().width(curr_tree_width + diff);

                // var curr_board_width = tree_conf.board.width();
                tree_conf.board.width(curr_board_width - diff);

                tree_conf.tree.update();
                tree_conf.board.update();
                resizing_pos = current_pos;
                dispatch.drag.call(this);
            }, 300);

            var w = d3.select(window)
                .on("mousemove", function () {
                    deferred(d3.event.clientX);
                    var curr_tree_width = tree_conf.tree.layout().width();
                    var diff = d3.event.clientX - resizing_pos;
                    drag.style("left", (curr_tree_width + diff) + "px");
                })
                .on("mouseup", mouseup);

            function mouseup() {
                // TODO: Does this remove other listeners on the window?
                w.on("mousemove", null).on("mouseup", null);
            }
        });

        tree_conf.tree(tree_div.node());

        // tracks
        var leaves = tree_conf.tree.root().get_all_leaves();
        var tracks = [];

        var height = tree_conf.tree.label().height();

        for (var i = 0; i < leaves.length; i++) {
            // Block Track1
            (function (leaf) {
                tnt.board.track.id = function () {
                    if (tree_conf.key === undefined) {
                        return leaf.id();
                    }
                    if (typeof (tree_conf.key) === 'function') {
                        return tree_conf.key(leaf);
                    }
                    return leaf.property(tree_conf.key);
                };
                var track = tree_conf.track(leaves[i])
                    .height(height);

                tracks.push(track);
            })(leaves[i]);
        }

        if (tree_conf.board) {
            if (tree_conf.top) {
                tree_conf.board
                    .add_track(tree_conf.top);
            }

            tree_conf.board
                .add_track(tracks);

            if (tree_conf.bottom) {
                tree_conf.board
                    .add_track(tree_conf.bottom);
            }

            tree_conf.board(annot_div.node());
            tree_conf.board.start();
        }

        api.method('update', function () {
            tree_conf.tree.update();

            if (tree_conf.board) {
                var leaves = tree_conf.tree.root().get_all_leaves();
                var new_tracks = [];

                if (tree_conf.top) {
                    console.log('top height is...');
                    console.log(tree_conf.top.height());
                    new_tracks.push(tree_conf.top);
                }

                for (var i = 0; i < leaves.length; i++) {
                    // We first see if we have a track for the leaf:
                    var id;
                    if (tree_conf.key === undefined) {
                        id = leaves[i].id();
                    } else if (typeof (tree_conf.key) === 'function') {
                        id = tree_conf.key(leaves[i]);
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
                                    return tree_conf.key(leaf);
                                }
                                return leaf.property(tree_conf.key);
                            };
                            curr_track = tree_conf.track(leaves[i])
                                .height(height);
                        })(leaves[i]);
                    }
                    new_tracks.push(curr_track);
                }
                if (tree_conf.bottom) {
                    new_tracks.push(tree_conf.bottom);
                }

                tree_conf.board.tracks(new_tracks);
            }
        });

        return tree_annot;
    };

    var api = apijs(tree_annot)
        .getset(tree_conf);

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

        var start_index = 0;
        var n_index = 0;

        if (tree_conf.top && tree_conf.bottom) {
            start_index = 1;
            n_index = 2;
        } else if (tree_conf.top) {
            start_index = 1;
            n_index = 1;
        } else if (tree_conf.bottom) {
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

        for (var i = start_index; i <= (tracks.length - n_index); i++) {
            var t = tracks[i];
            t.display().reset.call(t);
            var leaf;
            tree_conf.tree.root().apply(function (node) {
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
                        return tree_conf.key(leaf);
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

    // return tree_annot;
    return d3.rebind (tree_annot, dispatch, "on");
};

module.exports = exports = ta;

},{"tnt.api":6,"tnt.utils":27}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvZmFrZV9hNDQ2MTE5ZS5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvaW5kZXguanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZS9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZS5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lL2luZGV4LmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvYmlvanMtZXZlbnRzL2luZGV4LmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5hcGkvc3JjL2FwaS5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5ib2FyZC9pbmRleC5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5ib2FyZC9zcmMvYm9hcmQuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2RhdGEuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2ZlYXR1cmUuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2luZGV4LmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmJvYXJkL3NyYy9sYXlvdXQuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL3NwaW5uZXIuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL3RyYWNrLmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50Lm5ld2ljay9pbmRleC5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5uZXdpY2svc3JjL25ld2ljay5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvaW5kZXguanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL3NyYy9ub2RlLmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnRyZWUvaW5kZXguanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvZGlhZ29uYWwuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvaW5kZXguanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbGFiZWwuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbGF5b3V0LmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnRyZWUvc3JjL25vZGVfZGlzcGxheS5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC50cmVlL3NyYy90cmVlLmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL2luZGV4LmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvcG5nLmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9yZWR1Y2UuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL3V0aWxzLmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9zcmMvdGEuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BSQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDajJCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyZkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pbmRleC5qc1wiKTtcbiIsImlmICh0eXBlb2YgdG50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB0bnQgPSByZXF1aXJlKFwiLi9zcmMvdGEuanNcIik7XG59XG5cbnZhciBldmVudHN5c3RlbSA9IHJlcXVpcmUgKFwiYmlvanMtZXZlbnRzXCIpO1xuZXZlbnRzeXN0ZW0ubWl4aW4gKHRudCk7XG50bnQudXRpbHMgPSByZXF1aXJlIChcInRudC51dGlsc1wiKTtcbnRudC50cmVlID0gcmVxdWlyZSAoXCJ0bnQudHJlZVwiKTtcbnRudC50cmVlLm5vZGUgPSByZXF1aXJlIChcInRudC50cmVlLm5vZGVcIik7XG50bnQudHJlZS5wYXJzZV9uZXdpY2sgPSByZXF1aXJlKFwidG50Lm5ld2lja1wiKS5wYXJzZV9uZXdpY2s7XG50bnQudHJlZS5wYXJzZV9uaHggPSByZXF1aXJlKFwidG50Lm5ld2lja1wiKS5wYXJzZV9uaHg7XG50bnQuYm9hcmQgPSByZXF1aXJlIChcInRudC5ib2FyZFwiKTtcbiIsIi8qKlxuICogU3RhbmRhbG9uZSBleHRyYWN0aW9uIG9mIEJhY2tib25lLkV2ZW50cywgbm8gZXh0ZXJuYWwgZGVwZW5kZW5jeSByZXF1aXJlZC5cbiAqIERlZ3JhZGVzIG5pY2VseSB3aGVuIEJhY2tvbmUvdW5kZXJzY29yZSBhcmUgYWxyZWFkeSBhdmFpbGFibGUgaW4gdGhlIGN1cnJlbnRcbiAqIGdsb2JhbCBjb250ZXh0LlxuICpcbiAqIE5vdGUgdGhhdCBkb2NzIHN1Z2dlc3QgdG8gdXNlIHVuZGVyc2NvcmUncyBgXy5leHRlbmQoKWAgbWV0aG9kIHRvIGFkZCBFdmVudHNcbiAqIHN1cHBvcnQgdG8gc29tZSBnaXZlbiBvYmplY3QuIEEgYG1peGluKClgIG1ldGhvZCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgRXZlbnRzXG4gKiBwcm90b3R5cGUgdG8gYXZvaWQgdXNpbmcgdW5kZXJzY29yZSBmb3IgdGhhdCBzb2xlIHB1cnBvc2U6XG4gKlxuICogICAgIHZhciBteUV2ZW50RW1pdHRlciA9IEJhY2tib25lRXZlbnRzLm1peGluKHt9KTtcbiAqXG4gKiBPciBmb3IgYSBmdW5jdGlvbiBjb25zdHJ1Y3RvcjpcbiAqXG4gKiAgICAgZnVuY3Rpb24gTXlDb25zdHJ1Y3Rvcigpe31cbiAqICAgICBNeUNvbnN0cnVjdG9yLnByb3RvdHlwZS5mb28gPSBmdW5jdGlvbigpe31cbiAqICAgICBCYWNrYm9uZUV2ZW50cy5taXhpbihNeUNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG4gKlxuICogKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgSW5jLlxuICogKGMpIDIwMTMgTmljb2xhcyBQZXJyaWF1bHRcbiAqL1xuLyogZ2xvYmFsIGV4cG9ydHM6dHJ1ZSwgZGVmaW5lLCBtb2R1bGUgKi9cbihmdW5jdGlvbigpIHtcbiAgdmFyIHJvb3QgPSB0aGlzLFxuICAgICAgbmF0aXZlRm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLFxuICAgICAgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICAgICAgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UsXG4gICAgICBpZENvdW50ZXIgPSAwO1xuXG4gIC8vIFJldHVybnMgYSBwYXJ0aWFsIGltcGxlbWVudGF0aW9uIG1hdGNoaW5nIHRoZSBtaW5pbWFsIEFQSSBzdWJzZXQgcmVxdWlyZWRcbiAgLy8gYnkgQmFja2JvbmUuRXZlbnRzXG4gIGZ1bmN0aW9uIG1pbmlzY29yZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAga2V5czogT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICBpZiAodHlwZW9mIG9iaiAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2Ygb2JqICE9PSBcImZ1bmN0aW9uXCIgfHwgb2JqID09PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImtleXMoKSBjYWxsZWQgb24gYSBub24tb2JqZWN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXksIGtleXMgPSBbXTtcbiAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBrZXlzW2tleXMubGVuZ3RoXSA9IGtleTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgICB9LFxuXG4gICAgICB1bmlxdWVJZDogZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICAgICAgfSxcblxuICAgICAgaGFzOiBmdW5jdGlvbihvYmosIGtleSkge1xuICAgICAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gICAgICB9LFxuXG4gICAgICBlYWNoOiBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhhcyhvYmosIGtleSkpIHtcbiAgICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5LCBvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgb25jZTogZnVuY3Rpb24oZnVuYykge1xuICAgICAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAocmFuKSByZXR1cm4gbWVtbztcbiAgICAgICAgICByYW4gPSB0cnVlO1xuICAgICAgICAgIG1lbW8gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgZnVuYyA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHZhciBfID0gbWluaXNjb3JlKCksIEV2ZW50cztcblxuICAvLyBCYWNrYm9uZS5FdmVudHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQSBtb2R1bGUgdGhhdCBjYW4gYmUgbWl4ZWQgaW4gdG8gKmFueSBvYmplY3QqIGluIG9yZGVyIHRvIHByb3ZpZGUgaXQgd2l0aFxuICAvLyBjdXN0b20gZXZlbnRzLiBZb3UgbWF5IGJpbmQgd2l0aCBgb25gIG9yIHJlbW92ZSB3aXRoIGBvZmZgIGNhbGxiYWNrXG4gIC8vIGZ1bmN0aW9ucyB0byBhbiBldmVudDsgYHRyaWdnZXJgLWluZyBhbiBldmVudCBmaXJlcyBhbGwgY2FsbGJhY2tzIGluXG4gIC8vIHN1Y2Nlc3Npb24uXG4gIC8vXG4gIC8vICAgICB2YXIgb2JqZWN0ID0ge307XG4gIC8vICAgICBfLmV4dGVuZChvYmplY3QsIEJhY2tib25lLkV2ZW50cyk7XG4gIC8vICAgICBvYmplY3Qub24oJ2V4cGFuZCcsIGZ1bmN0aW9uKCl7IGFsZXJ0KCdleHBhbmRlZCcpOyB9KTtcbiAgLy8gICAgIG9iamVjdC50cmlnZ2VyKCdleHBhbmQnKTtcbiAgLy9cbiAgRXZlbnRzID0ge1xuXG4gICAgLy8gQmluZCBhbiBldmVudCB0byBhIGBjYWxsYmFja2AgZnVuY3Rpb24uIFBhc3NpbmcgYFwiYWxsXCJgIHdpbGwgYmluZFxuICAgIC8vIHRoZSBjYWxsYmFjayB0byBhbGwgZXZlbnRzIGZpcmVkLlxuICAgIG9uOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ29uJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkgfHwgIWNhbGxiYWNrKSByZXR1cm4gdGhpcztcbiAgICAgIHRoaXMuX2V2ZW50cyB8fCAodGhpcy5fZXZlbnRzID0ge30pO1xuICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXSB8fCAodGhpcy5fZXZlbnRzW25hbWVdID0gW10pO1xuICAgICAgZXZlbnRzLnB1c2goe2NhbGxiYWNrOiBjYWxsYmFjaywgY29udGV4dDogY29udGV4dCwgY3R4OiBjb250ZXh0IHx8IHRoaXN9KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBCaW5kIGFuIGV2ZW50IHRvIG9ubHkgYmUgdHJpZ2dlcmVkIGEgc2luZ2xlIHRpbWUuIEFmdGVyIHRoZSBmaXJzdCB0aW1lXG4gICAgLy8gdGhlIGNhbGxiYWNrIGlzIGludm9rZWQsIGl0IHdpbGwgYmUgcmVtb3ZlZC5cbiAgICBvbmNlOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ29uY2UnLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSB8fCAhY2FsbGJhY2spIHJldHVybiB0aGlzO1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIG9uY2UgPSBfLm9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYub2ZmKG5hbWUsIG9uY2UpO1xuICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfSk7XG4gICAgICBvbmNlLl9jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgcmV0dXJuIHRoaXMub24obmFtZSwgb25jZSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIC8vIFJlbW92ZSBvbmUgb3IgbWFueSBjYWxsYmFja3MuIElmIGBjb250ZXh0YCBpcyBudWxsLCByZW1vdmVzIGFsbFxuICAgIC8vIGNhbGxiYWNrcyB3aXRoIHRoYXQgZnVuY3Rpb24uIElmIGBjYWxsYmFja2AgaXMgbnVsbCwgcmVtb3ZlcyBhbGxcbiAgICAvLyBjYWxsYmFja3MgZm9yIHRoZSBldmVudC4gSWYgYG5hbWVgIGlzIG51bGwsIHJlbW92ZXMgYWxsIGJvdW5kXG4gICAgLy8gY2FsbGJhY2tzIGZvciBhbGwgZXZlbnRzLlxuICAgIG9mZjogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXRhaW4sIGV2LCBldmVudHMsIG5hbWVzLCBpLCBsLCBqLCBrO1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIWV2ZW50c0FwaSh0aGlzLCAnb2ZmJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkpIHJldHVybiB0aGlzO1xuICAgICAgaWYgKCFuYW1lICYmICFjYWxsYmFjayAmJiAhY29udGV4dCkge1xuICAgICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIG5hbWVzID0gbmFtZSA/IFtuYW1lXSA6IF8ua2V5cyh0aGlzLl9ldmVudHMpO1xuICAgICAgZm9yIChpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgIGlmIChldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV0pIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0gPSByZXRhaW4gPSBbXTtcbiAgICAgICAgICBpZiAoY2FsbGJhY2sgfHwgY29udGV4dCkge1xuICAgICAgICAgICAgZm9yIChqID0gMCwgayA9IGV2ZW50cy5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgICAgZXYgPSBldmVudHNbal07XG4gICAgICAgICAgICAgIGlmICgoY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2LmNhbGxiYWNrICYmIGNhbGxiYWNrICE9PSBldi5jYWxsYmFjay5fY2FsbGJhY2spIHx8XG4gICAgICAgICAgICAgICAgICAoY29udGV4dCAmJiBjb250ZXh0ICE9PSBldi5jb250ZXh0KSkge1xuICAgICAgICAgICAgICAgIHJldGFpbi5wdXNoKGV2KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIXJldGFpbi5sZW5ndGgpIGRlbGV0ZSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFRyaWdnZXIgb25lIG9yIG1hbnkgZXZlbnRzLCBmaXJpbmcgYWxsIGJvdW5kIGNhbGxiYWNrcy4gQ2FsbGJhY2tzIGFyZVxuICAgIC8vIHBhc3NlZCB0aGUgc2FtZSBhcmd1bWVudHMgYXMgYHRyaWdnZXJgIGlzLCBhcGFydCBmcm9tIHRoZSBldmVudCBuYW1lXG4gICAgLy8gKHVubGVzcyB5b3UncmUgbGlzdGVuaW5nIG9uIGBcImFsbFwiYCwgd2hpY2ggd2lsbCBjYXVzZSB5b3VyIGNhbGxiYWNrIHRvXG4gICAgLy8gcmVjZWl2ZSB0aGUgdHJ1ZSBuYW1lIG9mIHRoZSBldmVudCBhcyB0aGUgZmlyc3QgYXJndW1lbnQpLlxuICAgIHRyaWdnZXI6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ3RyaWdnZXInLCBuYW1lLCBhcmdzKSkgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdO1xuICAgICAgdmFyIGFsbEV2ZW50cyA9IHRoaXMuX2V2ZW50cy5hbGw7XG4gICAgICBpZiAoZXZlbnRzKSB0cmlnZ2VyRXZlbnRzKGV2ZW50cywgYXJncyk7XG4gICAgICBpZiAoYWxsRXZlbnRzKSB0cmlnZ2VyRXZlbnRzKGFsbEV2ZW50cywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBUZWxsIHRoaXMgb2JqZWN0IHRvIHN0b3AgbGlzdGVuaW5nIHRvIGVpdGhlciBzcGVjaWZpYyBldmVudHMgLi4uIG9yXG4gICAgLy8gdG8gZXZlcnkgb2JqZWN0IGl0J3MgY3VycmVudGx5IGxpc3RlbmluZyB0by5cbiAgICBzdG9wTGlzdGVuaW5nOiBmdW5jdGlvbihvYmosIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzO1xuICAgICAgaWYgKCFsaXN0ZW5lcnMpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGRlbGV0ZUxpc3RlbmVyID0gIW5hbWUgJiYgIWNhbGxiYWNrO1xuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0JykgY2FsbGJhY2sgPSB0aGlzO1xuICAgICAgaWYgKG9iaikgKGxpc3RlbmVycyA9IHt9KVtvYmouX2xpc3RlbmVySWRdID0gb2JqO1xuICAgICAgZm9yICh2YXIgaWQgaW4gbGlzdGVuZXJzKSB7XG4gICAgICAgIGxpc3RlbmVyc1tpZF0ub2ZmKG5hbWUsIGNhbGxiYWNrLCB0aGlzKTtcbiAgICAgICAgaWYgKGRlbGV0ZUxpc3RlbmVyKSBkZWxldGUgdGhpcy5fbGlzdGVuZXJzW2lkXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICB9O1xuXG4gIC8vIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHNwbGl0IGV2ZW50IHN0cmluZ3MuXG4gIHZhciBldmVudFNwbGl0dGVyID0gL1xccysvO1xuXG4gIC8vIEltcGxlbWVudCBmYW5jeSBmZWF0dXJlcyBvZiB0aGUgRXZlbnRzIEFQSSBzdWNoIGFzIG11bHRpcGxlIGV2ZW50XG4gIC8vIG5hbWVzIGBcImNoYW5nZSBibHVyXCJgIGFuZCBqUXVlcnktc3R5bGUgZXZlbnQgbWFwcyBge2NoYW5nZTogYWN0aW9ufWBcbiAgLy8gaW4gdGVybXMgb2YgdGhlIGV4aXN0aW5nIEFQSS5cbiAgdmFyIGV2ZW50c0FwaSA9IGZ1bmN0aW9uKG9iaiwgYWN0aW9uLCBuYW1lLCByZXN0KSB7XG4gICAgaWYgKCFuYW1lKSByZXR1cm4gdHJ1ZTtcblxuICAgIC8vIEhhbmRsZSBldmVudCBtYXBzLlxuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBuYW1lKSB7XG4gICAgICAgIG9ialthY3Rpb25dLmFwcGx5KG9iaiwgW2tleSwgbmFtZVtrZXldXS5jb25jYXQocmVzdCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBzcGFjZSBzZXBhcmF0ZWQgZXZlbnQgbmFtZXMuXG4gICAgaWYgKGV2ZW50U3BsaXR0ZXIudGVzdChuYW1lKSkge1xuICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChldmVudFNwbGl0dGVyKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG9ialthY3Rpb25dLmFwcGx5KG9iaiwgW25hbWVzW2ldXS5jb25jYXQocmVzdCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIEEgZGlmZmljdWx0LXRvLWJlbGlldmUsIGJ1dCBvcHRpbWl6ZWQgaW50ZXJuYWwgZGlzcGF0Y2ggZnVuY3Rpb24gZm9yXG4gIC8vIHRyaWdnZXJpbmcgZXZlbnRzLiBUcmllcyB0byBrZWVwIHRoZSB1c3VhbCBjYXNlcyBzcGVlZHkgKG1vc3QgaW50ZXJuYWxcbiAgLy8gQmFja2JvbmUgZXZlbnRzIGhhdmUgMyBhcmd1bWVudHMpLlxuICB2YXIgdHJpZ2dlckV2ZW50cyA9IGZ1bmN0aW9uKGV2ZW50cywgYXJncykge1xuICAgIHZhciBldiwgaSA9IC0xLCBsID0gZXZlbnRzLmxlbmd0aCwgYTEgPSBhcmdzWzBdLCBhMiA9IGFyZ3NbMV0sIGEzID0gYXJnc1syXTtcbiAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG4gICAgICBjYXNlIDA6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4KTsgcmV0dXJuO1xuICAgICAgY2FzZSAxOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEpOyByZXR1cm47XG4gICAgICBjYXNlIDI6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSwgYTIpOyByZXR1cm47XG4gICAgICBjYXNlIDM6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSwgYTIsIGEzKTsgcmV0dXJuO1xuICAgICAgZGVmYXVsdDogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suYXBwbHkoZXYuY3R4LCBhcmdzKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGxpc3Rlbk1ldGhvZHMgPSB7bGlzdGVuVG86ICdvbicsIGxpc3RlblRvT25jZTogJ29uY2UnfTtcblxuICAvLyBJbnZlcnNpb24tb2YtY29udHJvbCB2ZXJzaW9ucyBvZiBgb25gIGFuZCBgb25jZWAuIFRlbGwgKnRoaXMqIG9iamVjdCB0b1xuICAvLyBsaXN0ZW4gdG8gYW4gZXZlbnQgaW4gYW5vdGhlciBvYmplY3QgLi4uIGtlZXBpbmcgdHJhY2sgb2Ygd2hhdCBpdCdzXG4gIC8vIGxpc3RlbmluZyB0by5cbiAgXy5lYWNoKGxpc3Rlbk1ldGhvZHMsIGZ1bmN0aW9uKGltcGxlbWVudGF0aW9uLCBtZXRob2QpIHtcbiAgICBFdmVudHNbbWV0aG9kXSA9IGZ1bmN0aW9uKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnMgfHwgKHRoaXMuX2xpc3RlbmVycyA9IHt9KTtcbiAgICAgIHZhciBpZCA9IG9iai5fbGlzdGVuZXJJZCB8fCAob2JqLl9saXN0ZW5lcklkID0gXy51bmlxdWVJZCgnbCcpKTtcbiAgICAgIGxpc3RlbmVyc1tpZF0gPSBvYmo7XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSBjYWxsYmFjayA9IHRoaXM7XG4gICAgICBvYmpbaW1wbGVtZW50YXRpb25dKG5hbWUsIGNhbGxiYWNrLCB0aGlzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEFsaWFzZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuICBFdmVudHMuYmluZCAgID0gRXZlbnRzLm9uO1xuICBFdmVudHMudW5iaW5kID0gRXZlbnRzLm9mZjtcblxuICAvLyBNaXhpbiB1dGlsaXR5XG4gIEV2ZW50cy5taXhpbiA9IGZ1bmN0aW9uKHByb3RvKSB7XG4gICAgdmFyIGV4cG9ydHMgPSBbJ29uJywgJ29uY2UnLCAnb2ZmJywgJ3RyaWdnZXInLCAnc3RvcExpc3RlbmluZycsICdsaXN0ZW5UbycsXG4gICAgICAgICAgICAgICAgICAgJ2xpc3RlblRvT25jZScsICdiaW5kJywgJ3VuYmluZCddO1xuICAgIF8uZWFjaChleHBvcnRzLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBwcm90b1tuYW1lXSA9IHRoaXNbbmFtZV07XG4gICAgfSwgdGhpcyk7XG4gICAgcmV0dXJuIHByb3RvO1xuICB9O1xuXG4gIC8vIEV4cG9ydCBFdmVudHMgYXMgQmFja2JvbmVFdmVudHMgZGVwZW5kaW5nIG9uIGN1cnJlbnQgY29udGV4dFxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBFdmVudHM7XG4gICAgfVxuICAgIGV4cG9ydHMuQmFja2JvbmVFdmVudHMgPSBFdmVudHM7XG4gIH1lbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgICYmIHR5cGVvZiBkZWZpbmUuYW1kID09IFwib2JqZWN0XCIpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gRXZlbnRzO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuQmFja2JvbmVFdmVudHMgPSBFdmVudHM7XG4gIH1cbn0pKHRoaXMpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lJyk7XG4iLCJ2YXIgZXZlbnRzID0gcmVxdWlyZShcImJhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lXCIpO1xuXG5ldmVudHMub25BbGwgPSBmdW5jdGlvbihjYWxsYmFjayxjb250ZXh0KXtcbiAgdGhpcy5vbihcImFsbFwiLCBjYWxsYmFjayxjb250ZXh0KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBNaXhpbiB1dGlsaXR5XG5ldmVudHMub2xkTWl4aW4gPSBldmVudHMubWl4aW47XG5ldmVudHMubWl4aW4gPSBmdW5jdGlvbihwcm90bykge1xuICBldmVudHMub2xkTWl4aW4ocHJvdG8pO1xuICAvLyBhZGQgY3VzdG9tIG9uQWxsXG4gIHZhciBleHBvcnRzID0gWydvbkFsbCddO1xuICBmb3IodmFyIGk9MDsgaSA8IGV4cG9ydHMubGVuZ3RoO2krKyl7XG4gICAgdmFyIG5hbWUgPSBleHBvcnRzW2ldO1xuICAgIHByb3RvW25hbWVdID0gdGhpc1tuYW1lXTtcbiAgfVxuICByZXR1cm4gcHJvdG87XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV2ZW50cztcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL2FwaS5qc1wiKTtcbiIsInZhciBhcGkgPSBmdW5jdGlvbiAod2hvKSB7XG5cbiAgICB2YXIgX21ldGhvZHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBtID0gW107XG5cblx0bS5hZGRfYmF0Y2ggPSBmdW5jdGlvbiAob2JqKSB7XG5cdCAgICBtLnVuc2hpZnQob2JqKTtcblx0fTtcblxuXHRtLnVwZGF0ZSA9IGZ1bmN0aW9uIChtZXRob2QsIHZhbHVlKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRtW2ldW3BdID0gdmFsdWU7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBmYWxzZTtcblx0fTtcblxuXHRtLmFkZCA9IGZ1bmN0aW9uIChtZXRob2QsIHZhbHVlKSB7XG5cdCAgICBpZiAobS51cGRhdGUgKG1ldGhvZCwgdmFsdWUpICkge1xuXHQgICAgfSBlbHNlIHtcblx0XHR2YXIgcmVnID0ge307XG5cdFx0cmVnW21ldGhvZF0gPSB2YWx1ZTtcblx0XHRtLmFkZF9iYXRjaCAocmVnKTtcblx0ICAgIH1cblx0fTtcblxuXHRtLmdldCA9IGZ1bmN0aW9uIChtZXRob2QpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtLmxlbmd0aDsgaSsrKSB7XG5cdFx0Zm9yICh2YXIgcCBpbiBtW2ldKSB7XG5cdFx0ICAgIGlmIChwID09PSBtZXRob2QpIHtcblx0XHRcdHJldHVybiBtW2ldW3BdO1xuXHRcdCAgICB9XG5cdFx0fVxuXHQgICAgfVxuXHR9O1xuXG5cdHJldHVybiBtO1xuICAgIH07XG5cbiAgICB2YXIgbWV0aG9kcyAgICA9IF9tZXRob2RzKCk7XG4gICAgdmFyIGFwaSA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgYXBpLmNoZWNrID0gZnVuY3Rpb24gKG1ldGhvZCwgY2hlY2ssIG1zZykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkuY2hlY2sobWV0aG9kW2ldLCBjaGVjaywgbXNnKTtcblx0ICAgIH1cblx0ICAgIHJldHVybjtcblx0fVxuXG5cdGlmICh0eXBlb2YgKG1ldGhvZCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIG1ldGhvZC5jaGVjayhjaGVjaywgbXNnKTtcblx0fSBlbHNlIHtcblx0ICAgIHdob1ttZXRob2RdLmNoZWNrKGNoZWNrLCBtc2cpO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS50cmFuc2Zvcm0gPSBmdW5jdGlvbiAobWV0aG9kLCBjYmFrKSB7XG5cdGlmIChtZXRob2QgaW5zdGFuY2VvZiBBcnJheSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG1ldGhvZC5sZW5ndGg7IGkrKykge1xuXHRcdGFwaS50cmFuc2Zvcm0gKG1ldGhvZFtpXSwgY2Jhayk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QudHJhbnNmb3JtIChjYmFrKTtcblx0fSBlbHNlIHtcblx0ICAgIHdob1ttZXRob2RdLnRyYW5zZm9ybShjYmFrKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICB2YXIgYXR0YWNoX21ldGhvZCA9IGZ1bmN0aW9uIChtZXRob2QsIG9wdHMpIHtcblx0dmFyIGNoZWNrcyA9IFtdO1xuXHR2YXIgdHJhbnNmb3JtcyA9IFtdO1xuXG5cdHZhciBnZXR0ZXIgPSBvcHRzLm9uX2dldHRlciB8fCBmdW5jdGlvbiAoKSB7XG5cdCAgICByZXR1cm4gbWV0aG9kcy5nZXQobWV0aG9kKTtcblx0fTtcblxuXHR2YXIgc2V0dGVyID0gb3B0cy5vbl9zZXR0ZXIgfHwgZnVuY3Rpb24gKHgpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTx0cmFuc2Zvcm1zLmxlbmd0aDsgaSsrKSB7XG5cdFx0eCA9IHRyYW5zZm9ybXNbaV0oeCk7XG5cdCAgICB9XG5cblx0ICAgIGZvciAodmFyIGo9MDsgajxjaGVja3MubGVuZ3RoOyBqKyspIHtcblx0XHRpZiAoIWNoZWNrc1tqXS5jaGVjayh4KSkge1xuXHRcdCAgICB2YXIgbXNnID0gY2hlY2tzW2pdLm1zZyB8fCBcblx0XHRcdChcIlZhbHVlIFwiICsgeCArIFwiIGRvZXNuJ3Qgc2VlbSB0byBiZSB2YWxpZCBmb3IgdGhpcyBtZXRob2RcIik7XG5cdFx0ICAgIHRocm93IChtc2cpO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIG1ldGhvZHMuYWRkKG1ldGhvZCwgeCk7XG5cdH07XG5cblx0dmFyIG5ld19tZXRob2QgPSBmdW5jdGlvbiAobmV3X3ZhbCkge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGdldHRlcigpO1xuXHQgICAgfVxuXHQgICAgc2V0dGVyKG5ld192YWwpO1xuXHQgICAgcmV0dXJuIHdobzsgLy8gUmV0dXJuIHRoaXM/XG5cdH07XG5cdG5ld19tZXRob2QuY2hlY2sgPSBmdW5jdGlvbiAoY2JhaywgbXNnKSB7XG5cdCAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gY2hlY2tzO1xuXHQgICAgfVxuXHQgICAgY2hlY2tzLnB1c2ggKHtjaGVjayA6IGNiYWssXG5cdFx0XHQgIG1zZyAgIDogbXNnfSk7XG5cdCAgICByZXR1cm4gdGhpcztcblx0fTtcblx0bmV3X21ldGhvZC50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoY2Jhaykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIHRyYW5zZm9ybXM7XG5cdCAgICB9XG5cdCAgICB0cmFuc2Zvcm1zLnB1c2goY2Jhayk7XG5cdCAgICByZXR1cm4gdGhpcztcblx0fTtcblxuXHR3aG9bbWV0aG9kXSA9IG5ld19tZXRob2Q7XG4gICAgfTtcblxuICAgIHZhciBnZXRzZXQgPSBmdW5jdGlvbiAocGFyYW0sIG9wdHMpIHtcblx0aWYgKHR5cGVvZiAocGFyYW0pID09PSAnb2JqZWN0Jykge1xuXHQgICAgbWV0aG9kcy5hZGRfYmF0Y2ggKHBhcmFtKTtcblx0ICAgIGZvciAodmFyIHAgaW4gcGFyYW0pIHtcblx0XHRhdHRhY2hfbWV0aG9kIChwLCBvcHRzKTtcblx0ICAgIH1cblx0fSBlbHNlIHtcblx0ICAgIG1ldGhvZHMuYWRkIChwYXJhbSwgb3B0cy5kZWZhdWx0X3ZhbHVlKTtcblx0ICAgIGF0dGFjaF9tZXRob2QgKHBhcmFtLCBvcHRzKTtcblx0fVxuICAgIH07XG5cbiAgICBhcGkuZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZn0pO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5nZXQgPSBmdW5jdGlvbiAocGFyYW0sIGRlZikge1xuXHR2YXIgb25fc2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgdGhyb3cgKFwiTWV0aG9kIGRlZmluZWQgb25seSBhcyBhIGdldHRlciAoeW91IGFyZSB0cnlpbmcgdG8gdXNlIGl0IGFzIGEgc2V0dGVyXCIpO1xuXHR9O1xuXG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWYsXG5cdFx0ICAgICAgIG9uX3NldHRlciA6IG9uX3NldHRlcn1cblx0ICAgICAgKTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuc2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX2dldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBzZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIGdldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9nZXR0ZXIgOiBvbl9nZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLm1ldGhvZCA9IGZ1bmN0aW9uIChuYW1lLCBjYmFrKSB7XG5cdGlmICh0eXBlb2YgKG5hbWUpID09PSAnb2JqZWN0Jykge1xuXHQgICAgZm9yICh2YXIgcCBpbiBuYW1lKSB7XG5cdFx0d2hvW3BdID0gbmFtZVtwXTtcblx0ICAgIH1cblx0fSBlbHNlIHtcblx0ICAgIHdob1tuYW1lXSA9IGNiYWs7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGFwaTtcbiAgICBcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGFwaTsiLCIvLyBpZiAodHlwZW9mIHRudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuLy8gICAgIG1vZHVsZS5leHBvcnRzID0gdG50ID0ge31cbi8vIH1cbi8vIHRudC51dGlscyA9IHJlcXVpcmUoXCJ0bnQudXRpbHNcIik7XG4vLyB0bnQudG9vbHRpcCA9IHJlcXVpcmUoXCJ0bnQudG9vbHRpcFwiKTtcbi8vIHRudC5ib2FyZCA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC5qc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXhcIik7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlIChcInRudC5hcGlcIik7XG52YXIgZGVmZXJDYW5jZWwgPSByZXF1aXJlIChcInRudC51dGlsc1wiKS5kZWZlcl9jYW5jZWw7XG5cbnZhciBib2FyZCA9IGZ1bmN0aW9uKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgLy8vLyBQcml2YXRlIHZhcnNcbiAgICB2YXIgc3ZnO1xuICAgIHZhciBkaXZfaWQ7XG4gICAgdmFyIHRyYWNrcyA9IFtdO1xuICAgIHZhciBtaW5fd2lkdGggPSA1MDtcbiAgICB2YXIgaGVpZ2h0ICAgID0gMDsgICAgLy8gVGhpcyBpcyB0aGUgZ2xvYmFsIGhlaWdodCBpbmNsdWRpbmcgYWxsIHRoZSB0cmFja3NcbiAgICB2YXIgd2lkdGggICAgID0gOTIwO1xuICAgIHZhciBoZWlnaHRfb2Zmc2V0ID0gMjA7XG4gICAgdmFyIGxvYyA9IHtcblx0c3BlY2llcyAgOiB1bmRlZmluZWQsXG5cdGNociAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICBmcm9tICAgICA6IDAsXG4gICAgICAgIHRvICAgICAgIDogNTAwXG4gICAgfTtcblxuICAgIC8vIExpbWl0IGNhcHNcbiAgICB2YXIgY2FwcyA9IHtcbiAgICAgICAgbGVmdCA6IHVuZGVmaW5lZCxcbiAgICAgICAgcmlnaHQgOiB1bmRlZmluZWRcbiAgICB9O1xuICAgIHZhciBjYXBfd2lkdGggPSAzO1xuXG5cbiAgICAvLyBUT0RPOiBXZSBoYXZlIG5vdyBiYWNrZ3JvdW5kIGNvbG9yIGluIHRoZSB0cmFja3MuIENhbiB0aGlzIGJlIHJlbW92ZWQ/XG4gICAgLy8gSXQgbG9va3MgbGlrZSBpdCBpcyB1c2VkIGluIHRoZSB0b28td2lkZSBwYW5lIGV0YywgYnV0IGl0IG1heSBub3QgYmUgbmVlZGVkIGFueW1vcmVcbiAgICB2YXIgYmdDb2xvciAgID0gZDMucmdiKCcjRjhGQkVGJyk7IC8vI0Y4RkJFRlxuICAgIHZhciBwYW5lOyAvLyBEcmFnZ2FibGUgcGFuZVxuICAgIHZhciBzdmdfZztcbiAgICB2YXIgeFNjYWxlO1xuICAgIHZhciB6b29tRXZlbnRIYW5kbGVyID0gZDMuYmVoYXZpb3Iuem9vbSgpO1xuICAgIHZhciBsaW1pdHMgPSB7XG4gICAgICAgIG1pbiA6IDAsXG4gICAgICAgIG1heCA6IDEwMDAsXG4gICAgICAgIHpvb21fb3V0IDogMTAwMCxcbiAgICAgICAgem9vbV9pbiAgOiAxMDBcbiAgICB9O1xuICAgIHZhciBkdXIgPSA1MDA7XG4gICAgdmFyIGRyYWdfYWxsb3dlZCA9IHRydWU7XG5cbiAgICB2YXIgZXhwb3J0cyA9IHtcbiAgICAgICAgZWFzZSAgICAgICAgICA6IGQzLmVhc2UoXCJjdWJpYy1pbi1vdXRcIiksXG4gICAgICAgIGV4dGVuZF9jYW52YXMgOiB7XG4gICAgICAgICAgICBsZWZ0IDogMCxcbiAgICAgICAgICAgIHJpZ2h0IDogMFxuICAgICAgICB9LFxuICAgICAgICBzaG93X2ZyYW1lIDogdHJ1ZVxuICAgICAgICAvLyBsaW1pdHMgICAgICAgIDogZnVuY3Rpb24gKCkge3Rocm93IFwiVGhlIGxpbWl0cyBtZXRob2Qgc2hvdWxkIGJlIGRlZmluZWRcIn1cbiAgICB9O1xuXG4gICAgLy8gVGhlIHJldHVybmVkIGNsb3N1cmUgLyBvYmplY3RcbiAgICB2YXIgdHJhY2tfdmlzID0gZnVuY3Rpb24oZGl2KSB7XG4gICAgXHRkaXZfaWQgPSBkMy5zZWxlY3QoZGl2KS5hdHRyKFwiaWRcIik7XG5cbiAgICBcdC8vIFRoZSBvcmlnaW5hbCBkaXYgaXMgY2xhc3NlZCB3aXRoIHRoZSB0bnQgY2xhc3NcbiAgICBcdGQzLnNlbGVjdChkaXYpXG4gICAgXHQgICAgLmNsYXNzZWQoXCJ0bnRcIiwgdHJ1ZSk7XG5cbiAgICBcdC8vIFRPRE86IE1vdmUgdGhlIHN0eWxpbmcgdG8gdGhlIHNjc3M/XG4gICAgXHR2YXIgYnJvd3NlckRpdiA9IGQzLnNlbGVjdChkaXYpXG4gICAgXHQgICAgLmFwcGVuZChcImRpdlwiKVxuICAgIFx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfXCIgKyBkaXZfaWQpXG4gICAgXHQgICAgLnN0eWxlKFwicG9zaXRpb25cIiwgXCJyZWxhdGl2ZVwiKVxuICAgIFx0ICAgIC5jbGFzc2VkKFwidG50X2ZyYW1lZFwiLCBleHBvcnRzLnNob3dfZnJhbWUgPyB0cnVlIDogZmFsc2UpXG4gICAgXHQgICAgLnN0eWxlKFwid2lkdGhcIiwgKHdpZHRoICsgY2FwX3dpZHRoKjIgKyBleHBvcnRzLmV4dGVuZF9jYW52YXMucmlnaHQgKyBleHBvcnRzLmV4dGVuZF9jYW52YXMubGVmdCkgKyBcInB4XCIpO1xuXG4gICAgXHR2YXIgZ3JvdXBEaXYgPSBicm93c2VyRGl2XG4gICAgXHQgICAgLmFwcGVuZChcImRpdlwiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ3JvdXBEaXZcIik7XG5cbiAgICBcdC8vIFRoZSBTVkdcbiAgICBcdHN2ZyA9IGdyb3VwRGl2XG4gICAgXHQgICAgLmFwcGVuZChcInN2Z1wiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfc3ZnXCIpXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICBcdCAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXG4gICAgXHQgICAgLmF0dHIoXCJwb2ludGVyLWV2ZW50c1wiLCBcImFsbFwiKTtcblxuICAgIFx0c3ZnX2cgPSBzdmdcbiAgICBcdCAgICAuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMjApXCIpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcImdcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2dcIik7XG5cbiAgICBcdC8vIGNhcHNcbiAgICBcdGNhcHMubGVmdCA9IHN2Z19nXG4gICAgXHQgICAgLmFwcGVuZChcInJlY3RcIilcbiAgICBcdCAgICAuYXR0cihcImlkXCIsIFwidG50X1wiICsgZGl2X2lkICsgXCJfNXBjYXBcIilcbiAgICBcdCAgICAuYXR0cihcInhcIiwgMClcbiAgICBcdCAgICAuYXR0cihcInlcIiwgMClcbiAgICBcdCAgICAuYXR0cihcIndpZHRoXCIsIDApXG4gICAgXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuICAgIFx0ICAgIC5hdHRyKFwiZmlsbFwiLCBcInJlZFwiKTtcbiAgICBcdGNhcHMucmlnaHQgPSBzdmdfZ1xuICAgIFx0ICAgIC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgXHQgICAgLmF0dHIoXCJpZFwiLCBcInRudF9cIiArIGRpdl9pZCArIFwiXzNwY2FwXCIpXG4gICAgXHQgICAgLmF0dHIoXCJ4XCIsIHdpZHRoLWNhcF93aWR0aClcbiAgICBcdCAgICAuYXR0cihcInlcIiwgMClcbiAgICBcdCAgICAuYXR0cihcIndpZHRoXCIsIDApXG4gICAgXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuICAgIFx0ICAgIC5hdHRyKFwiZmlsbFwiLCBcInJlZFwiKTtcblxuICAgIFx0Ly8gVGhlIFpvb21pbmcvUGFubmluZyBQYW5lXG4gICAgXHRwYW5lID0gc3ZnX2dcbiAgICBcdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfcGFuZVwiKVxuICAgIFx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfXCIgKyBkaXZfaWQgKyBcIl9wYW5lXCIpXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICBcdCAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXG4gICAgXHQgICAgLnN0eWxlKFwiZmlsbFwiLCBiZ0NvbG9yKTtcblxuICAgIFx0Ly8gKiogVE9ETzogV291bGRuJ3QgYmUgYmV0dGVyIHRvIGhhdmUgdGhlc2UgbWVzc2FnZXMgYnkgdHJhY2s/XG4gICAgXHQvLyB2YXIgdG9vV2lkZV90ZXh0ID0gc3ZnX2dcbiAgICBcdC8vICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgIFx0Ly8gICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfd2lkZU9LX3RleHRcIilcbiAgICBcdC8vICAgICAuYXR0cihcImlkXCIsIFwidG50X1wiICsgZGl2X2lkICsgXCJfdG9vV2lkZVwiKVxuICAgIFx0Ly8gICAgIC5hdHRyKFwiZmlsbFwiLCBiZ0NvbG9yKVxuICAgIFx0Ly8gICAgIC50ZXh0KFwiUmVnaW9uIHRvbyB3aWRlXCIpO1xuXG4gICAgXHQvLyBUT0RPOiBJIGRvbid0IGtub3cgaWYgdGhpcyBpcyB0aGUgYmVzdCB3YXkgKGFuZCBwb3J0YWJsZSkgd2F5XG4gICAgXHQvLyBvZiBjZW50ZXJpbmcgdGhlIHRleHQgaW4gdGhlIHRleHQgYXJlYVxuICAgIFx0Ly8gdmFyIGJiID0gdG9vV2lkZV90ZXh0WzBdWzBdLmdldEJCb3goKTtcbiAgICBcdC8vIHRvb1dpZGVfdGV4dFxuICAgIFx0Ly8gICAgIC5hdHRyKFwieFwiLCB+fih3aWR0aC8yIC0gYmIud2lkdGgvMikpXG4gICAgXHQvLyAgICAgLmF0dHIoXCJ5XCIsIH5+KGhlaWdodC8yIC0gYmIuaGVpZ2h0LzIpKTtcbiAgICB9O1xuXG4gICAgLy8gQVBJXG4gICAgdmFyIGFwaSA9IGFwaWpzICh0cmFja192aXMpXG4gICAgXHQuZ2V0c2V0IChleHBvcnRzKVxuICAgIFx0LmdldHNldCAobGltaXRzKVxuICAgIFx0LmdldHNldCAobG9jKTtcblxuICAgIGFwaS50cmFuc2Zvcm0gKHRyYWNrX3Zpcy5leHRlbmRfY2FudmFzLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgXHR2YXIgcHJldl92YWwgPSB0cmFja192aXMuZXh0ZW5kX2NhbnZhcygpO1xuICAgIFx0dmFsLmxlZnQgPSB2YWwubGVmdCB8fCBwcmV2X3ZhbC5sZWZ0O1xuICAgIFx0dmFsLnJpZ2h0ID0gdmFsLnJpZ2h0IHx8IHByZXZfdmFsLnJpZ2h0O1xuICAgIFx0cmV0dXJuIHZhbDtcbiAgICB9KTtcblxuICAgIC8vIHRyYWNrX3ZpcyBhbHdheXMgc3RhcnRzIG9uIGxvYy5mcm9tICYgbG9jLnRvXG4gICAgYXBpLm1ldGhvZCAoJ3N0YXJ0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBtYWtlIHN1cmUgdGhhdCB6b29tX291dCBpcyB3aXRoaW4gdGhlIG1pbi1tYXggcmFuZ2VcbiAgICAgICAgaWYgKChsaW1pdHMubWF4IC0gbGltaXRzLm1pbikgPCBsaW1pdHMuem9vbV9vdXQpIHtcbiAgICAgICAgICAgIGxpbWl0cy56b29tX291dCA9IGxpbWl0cy5tYXggLSBsaW1pdHMubWluO1xuICAgICAgICB9XG5cbiAgICAgICAgcGxvdCgpO1xuXG4gICAgICAgIC8vIFJlc2V0IHRoZSB0cmFja3NcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRyYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRyYWNrc1tpXS5nKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgdHJhY2tzW2ldLmRpc3BsYXkoKS5yZXNldC5jYWxsKHRyYWNrc1tpXSk7XG4gICAgICAgICAgICAgICAgdHJhY2tzW2ldLmcucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfaW5pdF90cmFjayh0cmFja3NbaV0pO1xuICAgICAgICB9XG4gICAgICAgIF9wbGFjZV90cmFja3MoKTtcblxuICAgICAgICAvLyBUaGUgY29udGludWF0aW9uIGNhbGxiYWNrXG4gICAgICAgIHZhciBjb250ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBpZiAoKGxvYy50byAtIGxvYy5mcm9tKSA8IGxpbWl0cy56b29tX2luKSB7XG4gICAgICAgICAgICAgICAgaWYgKChsb2MuZnJvbSArIGxpbWl0cy56b29tX2luKSA+IGxpbWl0cy5tYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jLnRvID0gbGltaXRzLm1heDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsb2MudG8gPSBsb2MuZnJvbSArIGxpbWl0cy56b29tX2luO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRyYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIF91cGRhdGVfdHJhY2sodHJhY2tzW2ldLCBsb2MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnQoKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd1cGRhdGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgXHRmb3IgKHZhciBpPTA7IGk8dHJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgXHQgICAgX3VwZGF0ZV90cmFjayAodHJhY2tzW2ldKTtcbiAgICBcdH1cbiAgICB9KTtcblxuICAgIHZhciBfdXBkYXRlX3RyYWNrID0gZnVuY3Rpb24gKHRyYWNrLCB3aGVyZSkge1xuICAgIFx0aWYgKHRyYWNrLmRhdGEoKSkge1xuICAgIFx0ICAgIHZhciB0cmFja19kYXRhID0gdHJhY2suZGF0YSgpO1xuICAgICAgICAgICAgdmFyIGRhdGFfdXBkYXRlciA9IHRyYWNrX2RhdGE7XG5cbiAgICBcdCAgICBkYXRhX3VwZGF0ZXIuY2FsbCh0cmFjaywge1xuICAgICAgICAgICAgICAgICdsb2MnIDogd2hlcmUsXG4gICAgICAgICAgICAgICAgJ29uX3N1Y2Nlc3MnIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjay5kaXNwbGF5KCkudXBkYXRlLmNhbGwodHJhY2ssIHdoZXJlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgfSk7XG4gICAgXHR9XG4gICAgfTtcblxuICAgIHZhciBwbG90ID0gZnVuY3Rpb24oKSB7XG4gICAgXHR4U2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIFx0ICAgIC5kb21haW4oW2xvYy5mcm9tLCBsb2MudG9dKVxuICAgIFx0ICAgIC5yYW5nZShbMCwgd2lkdGhdKTtcblxuICAgIFx0aWYgKGRyYWdfYWxsb3dlZCkge1xuICAgIFx0ICAgIHN2Z19nLmNhbGwoIHpvb21FdmVudEhhbmRsZXJcbiAgICBcdFx0ICAgICAgIC54KHhTY2FsZSlcbiAgICBcdFx0ICAgICAgIC5zY2FsZUV4dGVudChbKGxvYy50by1sb2MuZnJvbSkvKGxpbWl0cy56b29tX291dC0xKSwgKGxvYy50by1sb2MuZnJvbSkvbGltaXRzLnpvb21faW5dKVxuICAgIFx0XHQgICAgICAgLm9uKFwiem9vbVwiLCBfbW92ZSlcbiAgICBcdFx0ICAgICApO1xuICAgIFx0fVxuICAgIH07XG5cbiAgICB2YXIgX3Jlb3JkZXIgPSBmdW5jdGlvbiAobmV3X3RyYWNrcykge1xuICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIGRlZmluaW5nIGEgbmV3IGhlaWdodCwgYnV0IHRoZSBnbG9iYWwgaGVpZ2h0IGlzIHVzZWQgdG8gZGVmaW5lIHRoZSBzaXplIG9mIHNldmVyYWxcbiAgICAgICAgLy8gcGFydHMuIFdlIHNob3VsZCBkbyB0aGlzIGR5bmFtaWNhbGx5XG5cbiAgICAgICAgdmFyIGZvdW5kX2luZGV4ZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaj0wOyBqPG5ld190cmFja3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRyYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0cmFja3NbaV0uaWQoKSA9PT0gbmV3X3RyYWNrc1tqXS5pZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRfaW5kZXhlc1tpXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRyYWNrcy5zcGxpY2UoaSwxKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgIF9pbml0X3RyYWNrKG5ld190cmFja3Nbal0pO1xuICAgICAgICAgICAgICAgIF91cGRhdGVfdHJhY2sobmV3X3RyYWNrc1tqXSwge2Zyb20gOiBsb2MuZnJvbSwgdG8gOiBsb2MudG99KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIHg9MDsgeDx0cmFja3MubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgIGlmICghZm91bmRfaW5kZXhlc1t4XSkge1xuICAgICAgICAgICAgICAgIHRyYWNrc1t4XS5nLnJlbW92ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJhY2tzID0gbmV3X3RyYWNrcztcbiAgICAgICAgX3BsYWNlX3RyYWNrcygpO1xuICAgIH07XG5cbiAgICAvLyByaWdodC9sZWZ0L3pvb20gcGFucyBvciB6b29tcyB0aGUgdHJhY2suIFRoZXNlIG1ldGhvZHMgYXJlIGV4cG9zZWQgdG8gYWxsb3cgZXh0ZXJuYWwgYnV0dG9ucywgZXRjIHRvIGludGVyYWN0IHdpdGggdGhlIHRyYWNrcy4gVGhlIGFyZ3VtZW50IGlzIHRoZSBhbW91bnQgb2YgcGFubmluZy96b29taW5nIChpZS4gMS4yIG1lYW5zIDIwJSBwYW5uaW5nKSBXaXRoIGxlZnQvcmlnaHQgb25seSBwb3NpdGl2ZSBudW1iZXJzIGFyZSBhbGxvd2VkLlxuICAgIGFwaS5tZXRob2QgKCdzY3JvbGwnLCBmdW5jdGlvbiAoZmFjdG9yKSB7XG4gICAgICAgIHZhciBhbW91bnQgPSBNYXRoLmFicyhmYWN0b3IpO1xuICAgIFx0aWYgKGZhY3RvciA+IDApIHtcbiAgICBcdCAgICBfbWFudWFsX21vdmUoYW1vdW50LCAxKTtcbiAgICBcdH0gZWxzZSBpZiAoZmFjdG9yIDwgMCl7XG4gICAgICAgICAgICBfbWFudWFsX21vdmUoYW1vdW50LCAtMSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd6b29tJywgZnVuY3Rpb24gKGZhY3Rvcikge1xuICAgICAgICBfbWFudWFsX21vdmUoMS9mYWN0b3IsIDApO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfdHJhY2snLCBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHRyYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRyYWNrc1tpXS5pZCgpID09PSBpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cmFja3NbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyZW1vdmVfdHJhY2snLCBmdW5jdGlvbiAodHJhY2spIHtcbiAgICAgICAgdHJhY2suZy5yZW1vdmUoKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdhZGRfdHJhY2snLCBmdW5jdGlvbiAodHJhY2spIHtcbiAgICAgICAgaWYgKHRyYWNrIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTx0cmFjay5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRyYWNrX3Zpcy5hZGRfdHJhY2sgKHRyYWNrW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cmFja192aXM7XG4gICAgICAgIH1cbiAgICAgICAgdHJhY2tzLnB1c2godHJhY2spO1xuICAgICAgICByZXR1cm4gdHJhY2tfdmlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCgndHJhY2tzJywgZnVuY3Rpb24gKHRzKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRyYWNrcztcbiAgICAgICAgfVxuICAgICAgICBfcmVvcmRlcih0cyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgLy9cbiAgICBhcGkubWV0aG9kICgnd2lkdGgnLCBmdW5jdGlvbiAodykge1xuICAgIFx0Ly8gVE9ETzogQWxsb3cgc3VmZml4ZXMgbGlrZSBcIjEwMDBweFwiP1xuICAgIFx0Ly8gVE9ETzogVGVzdCB3cm9uZyBmb3JtYXRzXG4gICAgXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBcdCAgICByZXR1cm4gd2lkdGg7XG4gICAgXHR9XG4gICAgXHQvLyBBdCBsZWFzdCBtaW4td2lkdGhcbiAgICBcdGlmICh3IDwgbWluX3dpZHRoKSB7XG4gICAgXHQgICAgdyA9IG1pbl93aWR0aDtcbiAgICBcdH1cblxuICAgIFx0Ly8gV2UgYXJlIHJlc2l6aW5nXG4gICAgXHRpZiAoZGl2X2lkICE9PSB1bmRlZmluZWQpIHtcbiAgICBcdCAgICBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkKS5zZWxlY3QoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIHcpO1xuICAgIFx0ICAgIC8vIFJlc2l6ZSB0aGUgem9vbWluZy9wYW5uaW5nIHBhbmVcbiAgICBcdCAgICBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkKS5zdHlsZShcIndpZHRoXCIsIChwYXJzZUludCh3KSArIGNhcF93aWR0aCoyKSArIFwicHhcIik7XG4gICAgXHQgICAgZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCArIFwiX3BhbmVcIikuYXR0cihcIndpZHRoXCIsIHcpO1xuICAgICAgICAgICAgY2Fwcy5yaWdodFxuICAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCB3LWNhcF93aWR0aCk7XG5cbiAgICBcdCAgICAvLyBSZXBsb3RcbiAgICBcdCAgICB3aWR0aCA9IHc7XG4gICAgICAgICAgICB4U2NhbGUucmFuZ2UoWzAsIHdpZHRoXSk7XG5cbiAgICBcdCAgICBwbG90KCk7XG4gICAgXHQgICAgZm9yICh2YXIgaT0wOyBpPHRyYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBcdFx0dHJhY2tzW2ldLmcuc2VsZWN0KFwicmVjdFwiKS5hdHRyKFwid2lkdGhcIiwgdyk7XG4gICAgICAgICAgICAgICAgdHJhY2tzW2ldLmRpc3BsYXkoKS5zY2FsZSh4U2NhbGUpO1xuICAgICAgICBcdFx0dHJhY2tzW2ldLmRpc3BsYXkoKS5yZXNldC5jYWxsKHRyYWNrc1tpXSk7XG4gICAgICAgICAgICAgICAgdHJhY2tzW2ldLmRpc3BsYXkoKS5pbml0LmNhbGwodHJhY2tzW2ldLCB3KTtcbiAgICAgICAgXHRcdHRyYWNrc1tpXS5kaXNwbGF5KCkudXBkYXRlLmNhbGwodHJhY2tzW2ldLCBsb2MpO1xuICAgIFx0ICAgIH1cbiAgICBcdH0gZWxzZSB7XG4gICAgXHQgICAgd2lkdGggPSB3O1xuICAgIFx0fVxuICAgICAgICByZXR1cm4gdHJhY2tfdmlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCgnYWxsb3dfZHJhZycsIGZ1bmN0aW9uKGIpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZHJhZ19hbGxvd2VkO1xuICAgICAgICB9XG4gICAgICAgIGRyYWdfYWxsb3dlZCA9IGI7XG4gICAgICAgIGlmIChkcmFnX2FsbG93ZWQpIHtcbiAgICAgICAgICAgIC8vIFdoZW4gdGhpcyBtZXRob2QgaXMgY2FsbGVkIG9uIHRoZSBvYmplY3QgYmVmb3JlIHN0YXJ0aW5nIHRoZSBzaW11bGF0aW9uLCB3ZSBkb24ndCBoYXZlIGRlZmluZWQgeFNjYWxlXG4gICAgICAgICAgICBpZiAoeFNjYWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzdmdfZy5jYWxsKCB6b29tRXZlbnRIYW5kbGVyLngoeFNjYWxlKVxuICAgICAgICAgICAgICAgICAgICAvLyAueEV4dGVudChbMCwgbGltaXRzLnJpZ2h0XSlcbiAgICAgICAgICAgICAgICAgICAgLnNjYWxlRXh0ZW50KFsobG9jLnRvLWxvYy5mcm9tKS8obGltaXRzLnpvb21fb3V0LTEpLCAobG9jLnRvLWxvYy5mcm9tKS9saW1pdHMuem9vbV9pbl0pXG4gICAgICAgICAgICAgICAgICAgIC5vbihcInpvb21cIiwgX21vdmUpICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXZSBjcmVhdGUgYSBuZXcgZHVtbXkgc2NhbGUgaW4geCB0byBhdm9pZCBkcmFnZ2luZyB0aGUgcHJldmlvdXMgb25lXG4gICAgICAgICAgICAvLyBUT0RPOiBUaGVyZSBtYXkgYmUgYSBjaGVhcGVyIHdheSBvZiBkb2luZyB0aGlzP1xuICAgICAgICAgICAgem9vbUV2ZW50SGFuZGxlci54KGQzLnNjYWxlLmxpbmVhcigpKS5vbihcInpvb21cIiwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRyYWNrX3ZpcztcbiAgICB9KTtcblxuICAgIHZhciBfcGxhY2VfdHJhY2tzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaCA9IDA7XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB0cmFjayA9IHRyYWNrc1tpXTtcbiAgICAgICAgICAgIGlmICh0cmFjay5nLmF0dHIoXCJ0cmFuc2Zvcm1cIikpIHtcbiAgICAgICAgICAgICAgICB0cmFjay5nXG4gICAgICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgLmR1cmF0aW9uKGR1cilcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBleHBvcnRzLmV4dGVuZF9jYW52YXMubGVmdCArIFwiLFwiICsgaCArIFwiKVwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdHJhY2suZ1xuICAgICAgICAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGV4cG9ydHMuZXh0ZW5kX2NhbnZhcy5sZWZ0ICsgXCIsXCIgKyBoICsgXCIpXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBoICs9IHRyYWNrLmhlaWdodCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc3ZnXG4gICAgICAgIHN2Zy5hdHRyKFwiaGVpZ2h0XCIsIGggKyBoZWlnaHRfb2Zmc2V0KTtcblxuICAgICAgICAvLyBkaXZcbiAgICAgICAgZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZClcbiAgICAgICAgICAgIC5zdHlsZShcImhlaWdodFwiLCAoaCArIDEwICsgaGVpZ2h0X29mZnNldCkgKyBcInB4XCIpO1xuXG4gICAgICAgIC8vIGNhcHNcbiAgICAgICAgZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCArIFwiXzVwY2FwXCIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoKVxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICBtb3ZlX3RvX2Zyb250KHRoaXMpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCArIFwiXzNwY2FwXCIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoKVxuICAgICAgICAgICAgLmVhY2ggKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgbW92ZV90b19mcm9udCh0aGlzKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHBhbmVcbiAgICAgICAgcGFuZVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaCArIGhlaWdodF9vZmZzZXQpO1xuXG4gICAgICAgIHJldHVybiB0cmFja192aXM7XG4gICAgfTtcblxuICAgIHZhciBfaW5pdF90cmFjayA9IGZ1bmN0aW9uICh0cmFjaykge1xuICAgICAgICB0cmFjay5nID0gc3ZnLnNlbGVjdChcImdcIikuc2VsZWN0KFwiZ1wiKVxuICAgIFx0ICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmFja1wiKVxuICAgIFx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHRyYWNrLmhlaWdodCgpKTtcblxuICAgIFx0Ly8gUmVjdCBmb3IgdGhlIGJhY2tncm91bmQgY29sb3JcbiAgICBcdHRyYWNrLmdcbiAgICBcdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieFwiLCAwKVxuICAgIFx0ICAgIC5hdHRyKFwieVwiLCAwKVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgdHJhY2tfdmlzLndpZHRoKCkpXG4gICAgXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgdHJhY2suaGVpZ2h0KCkpXG4gICAgXHQgICAgLnN0eWxlKFwiZmlsbFwiLCB0cmFjay5jb2xvcigpKVxuICAgIFx0ICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKTtcblxuICAgIFx0aWYgKHRyYWNrLmRpc3BsYXkoKSkge1xuICAgIFx0ICAgIHRyYWNrLmRpc3BsYXkoKVxuICAgICAgICAgICAgICAgIC5zY2FsZSh4U2NhbGUpXG4gICAgICAgICAgICAgICAgLmluaXQuY2FsbCh0cmFjaywgd2lkdGgpO1xuICAgIFx0fVxuXG4gICAgXHRyZXR1cm4gdHJhY2tfdmlzO1xuICAgIH07XG5cbiAgICB2YXIgX21hbnVhbF9tb3ZlID0gZnVuY3Rpb24gKGZhY3RvciwgZGlyZWN0aW9uKSB7XG4gICAgICAgIHZhciBvbGREb21haW4gPSB4U2NhbGUuZG9tYWluKCk7XG5cbiAgICBcdHZhciBzcGFuID0gb2xkRG9tYWluWzFdIC0gb2xkRG9tYWluWzBdO1xuICAgIFx0dmFyIG9mZnNldCA9IChzcGFuICogZmFjdG9yKSAtIHNwYW47XG5cbiAgICBcdHZhciBuZXdEb21haW47XG4gICAgXHRzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgY2FzZSAxIDpcbiAgICAgICAgICAgIG5ld0RvbWFpbiA9IFsofn5vbGREb21haW5bMF0gLSBvZmZzZXQpLCB+fihvbGREb21haW5bMV0gLSBvZmZzZXQpXTtcbiAgICBcdCAgICBicmVhaztcbiAgICAgICAgXHRjYXNlIC0xIDpcbiAgICAgICAgXHQgICAgbmV3RG9tYWluID0gWyh+fm9sZERvbWFpblswXSArIG9mZnNldCksIH5+KG9sZERvbWFpblsxXSAtIG9mZnNldCldO1xuICAgICAgICBcdCAgICBicmVhaztcbiAgICAgICAgXHRjYXNlIDAgOlxuICAgICAgICBcdCAgICBuZXdEb21haW4gPSBbb2xkRG9tYWluWzBdIC0gfn4ob2Zmc2V0LzIpLCBvbGREb21haW5bMV0gKyAofn5vZmZzZXQvMildO1xuICAgIFx0fVxuXG4gICAgXHR2YXIgaW50ZXJwb2xhdG9yID0gZDMuaW50ZXJwb2xhdGVOdW1iZXIob2xkRG9tYWluWzBdLCBuZXdEb21haW5bMF0pO1xuICAgIFx0dmFyIGVhc2UgPSBleHBvcnRzLmVhc2U7XG5cbiAgICBcdHZhciB4ID0gMDtcbiAgICBcdGQzLnRpbWVyKGZ1bmN0aW9uKCkge1xuICAgIFx0ICAgIHZhciBjdXJyX3N0YXJ0ID0gaW50ZXJwb2xhdG9yKGVhc2UoeCkpO1xuICAgIFx0ICAgIHZhciBjdXJyX2VuZDtcbiAgICBcdCAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICBcdCAgICBjYXNlIC0xIDpcbiAgICAgICAgXHRcdGN1cnJfZW5kID0gY3Vycl9zdGFydCArIHNwYW47XG4gICAgICAgIFx0XHRicmVhaztcbiAgICAgICAgXHQgICAgY2FzZSAxIDpcbiAgICAgICAgXHRcdGN1cnJfZW5kID0gY3Vycl9zdGFydCArIHNwYW47XG4gICAgICAgIFx0XHRicmVhaztcbiAgICAgICAgXHQgICAgY2FzZSAwIDpcbiAgICAgICAgXHRcdGN1cnJfZW5kID0gb2xkRG9tYWluWzFdICsgb2xkRG9tYWluWzBdIC0gY3Vycl9zdGFydDtcbiAgICAgICAgXHRcdGJyZWFrO1xuICAgIFx0ICAgIH1cblxuICAgIFx0ICAgIHZhciBjdXJyRG9tYWluID0gW2N1cnJfc3RhcnQsIGN1cnJfZW5kXTtcbiAgICBcdCAgICB4U2NhbGUuZG9tYWluKGN1cnJEb21haW4pO1xuICAgIFx0ICAgIF9tb3ZlKHhTY2FsZSk7XG4gICAgXHQgICAgeCs9MC4wMjtcbiAgICBcdCAgICByZXR1cm4geD4xO1xuICAgIFx0fSk7XG4gICAgfTtcblxuXG4gICAgdmFyIF9tb3ZlX2NiYWsgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjdXJyRG9tYWluID0geFNjYWxlLmRvbWFpbigpO1xuICAgIFx0dHJhY2tfdmlzLmZyb20ofn5jdXJyRG9tYWluWzBdKTtcbiAgICBcdHRyYWNrX3Zpcy50byh+fmN1cnJEb21haW5bMV0pO1xuXG4gICAgXHRmb3IgKHZhciBpID0gMDsgaSA8IHRyYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIFx0ICAgIHZhciB0cmFjayA9IHRyYWNrc1tpXTtcbiAgICBcdCAgICBfdXBkYXRlX3RyYWNrKHRyYWNrLCBsb2MpO1xuICAgIFx0fVxuICAgIH07XG4gICAgLy8gVGhlIGRlZmVycmVkX2NiYWsgaXMgZGVmZXJyZWQgYXQgbGVhc3QgdGhpcyBhbW91bnQgb2YgdGltZSBvciByZS1zY2hlZHVsZWQgaWYgZGVmZXJyZWQgaXMgY2FsbGVkIGJlZm9yZVxuICAgIHZhciBfZGVmZXJyZWQgPSBkZWZlckNhbmNlbChfbW92ZV9jYmFrLCAzMDApO1xuXG4gICAgLy8gYXBpLm1ldGhvZCgndXBkYXRlJywgZnVuY3Rpb24gKCkge1xuICAgIC8vIFx0X21vdmUoKTtcbiAgICAvLyB9KTtcblxuICAgIHZhciBfbW92ZSA9IGZ1bmN0aW9uIChuZXdfeFNjYWxlKSB7XG4gICAgXHRpZiAobmV3X3hTY2FsZSAhPT0gdW5kZWZpbmVkICYmIGRyYWdfYWxsb3dlZCkge1xuICAgIFx0ICAgIHpvb21FdmVudEhhbmRsZXIueChuZXdfeFNjYWxlKTtcbiAgICBcdH1cblxuICAgIFx0Ly8gU2hvdyB0aGUgcmVkIGJhcnMgYXQgdGhlIGxpbWl0c1xuICAgIFx0dmFyIGRvbWFpbiA9IHhTY2FsZS5kb21haW4oKTtcbiAgICBcdGlmIChkb21haW5bMF0gPD0gKGxpbWl0cy5taW4gKyA1KSkge1xuICAgIFx0ICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQgKyBcIl81cGNhcFwiKVxuICAgIFx0XHQuYXR0cihcIndpZHRoXCIsIGNhcF93aWR0aClcbiAgICBcdFx0LnRyYW5zaXRpb24oKVxuICAgIFx0XHQuZHVyYXRpb24oMjAwKVxuICAgIFx0XHQuYXR0cihcIndpZHRoXCIsIDApO1xuICAgIFx0fVxuXG4gICAgXHRpZiAoZG9tYWluWzFdID49IChsaW1pdHMubWF4KS01KSB7XG4gICAgXHQgICAgZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCArIFwiXzNwY2FwXCIpXG4gICAgXHRcdC5hdHRyKFwid2lkdGhcIiwgY2FwX3dpZHRoKVxuICAgIFx0XHQudHJhbnNpdGlvbigpXG4gICAgXHRcdC5kdXJhdGlvbigyMDApXG4gICAgXHRcdC5hdHRyKFwid2lkdGhcIiwgMCk7XG4gICAgXHR9XG5cblxuICAgIFx0Ly8gQXZvaWQgbW92aW5nIHBhc3QgdGhlIGxpbWl0c1xuICAgIFx0aWYgKGRvbWFpblswXSA8IGxpbWl0cy5taW4pIHtcbiAgICBcdCAgICB6b29tRXZlbnRIYW5kbGVyLnRyYW5zbGF0ZShbem9vbUV2ZW50SGFuZGxlci50cmFuc2xhdGUoKVswXSAtIHhTY2FsZShsaW1pdHMubWluKSArIHhTY2FsZS5yYW5nZSgpWzBdLCB6b29tRXZlbnRIYW5kbGVyLnRyYW5zbGF0ZSgpWzFdXSk7XG4gICAgXHR9IGVsc2UgaWYgKGRvbWFpblsxXSA+IGxpbWl0cy5tYXgpIHtcbiAgICBcdCAgICB6b29tRXZlbnRIYW5kbGVyLnRyYW5zbGF0ZShbem9vbUV2ZW50SGFuZGxlci50cmFuc2xhdGUoKVswXSAtIHhTY2FsZShsaW1pdHMubWF4KSArIHhTY2FsZS5yYW5nZSgpWzFdLCB6b29tRXZlbnRIYW5kbGVyLnRyYW5zbGF0ZSgpWzFdXSk7XG4gICAgXHR9XG5cbiAgICBcdF9kZWZlcnJlZCgpO1xuXG4gICAgXHRmb3IgKHZhciBpID0gMDsgaSA8IHRyYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIFx0ICAgIHZhciB0cmFjayA9IHRyYWNrc1tpXTtcbiAgICBcdCAgICB0cmFjay5kaXNwbGF5KCkubW92ZXIuY2FsbCh0cmFjayk7XG4gICAgXHR9XG4gICAgfTtcblxuICAgIC8vIGFwaS5tZXRob2Qoe1xuICAgIC8vIFx0YWxsb3dfZHJhZyA6IGFwaV9hbGxvd19kcmFnLFxuICAgIC8vIFx0d2lkdGggICAgICA6IGFwaV93aWR0aCxcbiAgICAvLyBcdGFkZF90cmFjayAgOiBhcGlfYWRkX3RyYWNrLFxuICAgIC8vIFx0cmVvcmRlciAgICA6IGFwaV9yZW9yZGVyLFxuICAgIC8vIFx0em9vbSAgICAgICA6IGFwaV96b29tLFxuICAgIC8vIFx0bGVmdCAgICAgICA6IGFwaV9sZWZ0LFxuICAgIC8vIFx0cmlnaHQgICAgICA6IGFwaV9yaWdodCxcbiAgICAvLyBcdHN0YXJ0ICAgICAgOiBhcGlfc3RhcnRcbiAgICAvLyB9KTtcblxuICAgIC8vIEF1eGlsaWFyIGZ1bmN0aW9uc1xuICAgIGZ1bmN0aW9uIG1vdmVfdG9fZnJvbnQgKGVsZW0pIHtcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGVsZW0pO1xuICAgIH1cblxuICAgIHJldHVybiB0cmFja192aXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBib2FyZDtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUgKFwidG50LmFwaVwiKTtcbnZhciBzcGlubmVyID0gcmVxdWlyZSAoXCIuL3NwaW5uZXIuanNcIikoKTtcblxudmFyIHRudF9kYXRhID0ge307XG5cbnRudF9kYXRhLnN5bmMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdXBkYXRlX3RyYWNrID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHRyYWNrLmRhdGEoKS5lbGVtZW50cyh1cGRhdGVfdHJhY2sucmV0cmlldmVyKCkuY2FsbCh0cmFjaywgb2JqLmxvYykpO1xuICAgICAgICBvYmoub25fc3VjY2VzcygpO1xuICAgIH07XG5cbiAgICBhcGlqcyAodXBkYXRlX3RyYWNrKVxuICAgICAgICAuZ2V0c2V0ICgnZWxlbWVudHMnLCBbXSlcbiAgICAgICAgLmdldHNldCAoJ3JldHJpZXZlcicsIGZ1bmN0aW9uICgpIHt9KTtcblxuICAgIHJldHVybiB1cGRhdGVfdHJhY2s7XG59O1xuXG50bnRfZGF0YS5hc3luYyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdXBkYXRlX3RyYWNrID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICBzcGlubmVyLm9uLmNhbGwodHJhY2spO1xuICAgICAgICB1cGRhdGVfdHJhY2sucmV0cmlldmVyKCkuY2FsbCh0cmFjaywgb2JqLmxvYylcbiAgICAgICAgICAgIC50aGVuIChmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgICAgIHRyYWNrLmRhdGEoKS5lbGVtZW50cyhyZXNwKTtcbiAgICAgICAgICAgICAgICBvYmoub25fc3VjY2VzcygpO1xuICAgICAgICAgICAgICAgIHNwaW5uZXIub2ZmLmNhbGwodHJhY2spO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAodXBkYXRlX3RyYWNrKVxuICAgICAgICAuZ2V0c2V0ICgnZWxlbWVudHMnLCBbXSlcbiAgICAgICAgLmdldHNldCAoJ3JldHJpZXZlcicpO1xuXG4gICAgcmV0dXJuIHVwZGF0ZV90cmFjaztcbn07XG5cblxuLy8gQSBwcmVkZWZpbmVkIHRyYWNrIGRpc3BsYXlpbmcgbm8gZXh0ZXJuYWwgZGF0YVxuLy8gaXQgaXMgdXNlZCBmb3IgbG9jYXRpb24gYW5kIGF4aXMgdHJhY2tzIGZvciBleGFtcGxlXG50bnRfZGF0YS5lbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdXBkYXRlciA9IHRudF9kYXRhLnN5bmMoKTtcblxuICAgIHJldHVybiB1cGRhdGVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X2RhdGE7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlIChcInRudC5hcGlcIik7XG52YXIgbGF5b3V0ID0gcmVxdWlyZShcIi4vbGF5b3V0LmpzXCIpO1xuXG4vLyBGRUFUVVJFIFZJU1xuLy8gdmFyIGJvYXJkID0ge307XG4vLyBib2FyZC50cmFjayA9IHt9O1xudmFyIHRudF9mZWF0dXJlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoIChcImNsaWNrXCIsIFwiZGJsY2xpY2tcIiwgXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiKTtcblxuICAgIC8vLy8vLyBWYXJzIGV4cG9zZWQgaW4gdGhlIEFQSVxuICAgIHZhciBjb25maWcgPSB7XG4gICAgICAgIGNyZWF0ZSAgIDogZnVuY3Rpb24gKCkge3Rocm93IFwiY3JlYXRlX2VsZW0gaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2UgZmVhdHVyZSBvYmplY3RcIjt9LFxuICAgICAgICBtb3ZlICAgIDogZnVuY3Rpb24gKCkge3Rocm93IFwibW92ZV9lbGVtIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIGZlYXR1cmUgb2JqZWN0XCI7fSxcbiAgICAgICAgZGlzdHJpYnV0ZSAgOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgZml4ZWQgICA6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICAvL2xheW91dCAgIDogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIGluZGV4ICAgIDogdW5kZWZpbmVkLFxuICAgICAgICBsYXlvdXQgICA6IGxheW91dC5pZGVudGl0eSgpLFxuICAgICAgICBjb2xvciA6ICcjMDAwJyxcbiAgICAgICAgc2NhbGUgOiB1bmRlZmluZWRcbiAgICB9O1xuXG5cbiAgICAvLyBUaGUgcmV0dXJuZWQgb2JqZWN0XG4gICAgdmFyIGZlYXR1cmUgPSB7fTtcblxuICAgIHZhciByZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgXHR0cmFjay5nLnNlbGVjdEFsbChcIi50bnRfZWxlbVwiKS5yZW1vdmUoKTtcbiAgICAgICAgdHJhY2suZy5zZWxlY3RBbGwoXCIudG50X2d1aWRlclwiKS5yZW1vdmUoKTtcbiAgICAgICAgdHJhY2suZy5zZWxlY3RBbGwoXCIudG50X2ZpeGVkXCIpLnJlbW92ZSgpO1xuICAgIH07XG5cbiAgICB2YXIgaW5pdCA9IGZ1bmN0aW9uICh3aWR0aCkge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuXG4gICAgICAgIHRyYWNrLmdcbiAgICAgICAgICAgIC5hcHBlbmQgKFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIgKFwiY2xhc3NcIiwgXCJ0bnRfZml4ZWRcIilcbiAgICAgICAgICAgIC5hdHRyIChcInhcIiwgNSlcbiAgICAgICAgICAgIC5hdHRyIChcInlcIiwgMTIpXG4gICAgICAgICAgICAuYXR0ciAoXCJmb250LXNpemVcIiwgMTEpXG4gICAgICAgICAgICAuYXR0ciAoXCJmaWxsXCIsIFwiZ3JleVwiKVxuICAgICAgICAgICAgLnRleHQgKHRyYWNrLmxhYmVsKCkpO1xuXG4gICAgICAgIGNvbmZpZy5maXhlZC5jYWxsKHRyYWNrLCB3aWR0aCk7XG4gICAgfTtcblxuICAgIHZhciBwbG90ID0gZnVuY3Rpb24gKG5ld19lbGVtcywgdHJhY2ssIHhTY2FsZSkge1xuICAgICAgICBuZXdfZWxlbXMub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgaWYgKGQzLmV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNwYXRjaC5jbGljay5jYWxsKHRoaXMsIGQsIGkpO1xuICAgICAgICB9KTtcbiAgICAgICAgbmV3X2VsZW1zLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICBpZiAoZDMuZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHRoaXMsIGQsIGkpO1xuICAgICAgICB9KTtcbiAgICAgICAgbmV3X2VsZW1zLm9uKFwiZGJsY2xpY2tcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICAgIGlmIChkMy5ldmVudC5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlzcGF0Y2guZGJsY2xpY2suY2FsbCh0aGlzLCBkLCBpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld19lbGVtcy5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICBpZiAoZDMuZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwodGhpcywgZCwgaSk7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBuZXdfZWxlbSBpcyBhIGcgZWxlbWVudCB0aGUgZmVhdHVyZSBpcyBpbnNlcnRlZFxuICAgICAgICBjb25maWcuY3JlYXRlLmNhbGwodHJhY2ssIG5ld19lbGVtcywgeFNjYWxlKTtcbiAgICB9O1xuXG4gICAgdmFyIHVwZGF0ZSA9IGZ1bmN0aW9uIChsb2MsIGZpZWxkKSB7XG4gICAgICAgIHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHZhciBzdmdfZyA9IHRyYWNrLmc7XG5cbiAgICAgICAgdmFyIGVsZW1lbnRzID0gdHJhY2suZGF0YSgpLmVsZW1lbnRzKCk7XG5cbiAgICAgICAgaWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGVsZW1lbnRzID0gZWxlbWVudHNbZmllbGRdO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRhdGFfZWxlbXMgPSBjb25maWcubGF5b3V0LmNhbGwodHJhY2ssIGVsZW1lbnRzKTtcblxuXG4gICAgICAgIGlmIChkYXRhX2VsZW1zID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB2aXNfc2VsO1xuICAgICAgICB2YXIgdmlzX2VsZW1zO1xuICAgICAgICBpZiAoZmllbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmlzX3NlbCA9IHN2Z19nLnNlbGVjdEFsbChcIi50bnRfZWxlbV9cIiArIGZpZWxkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZpc19zZWwgPSBzdmdfZy5zZWxlY3RBbGwoXCIudG50X2VsZW1cIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZmlnLmluZGV4KSB7IC8vIEluZGV4aW5nIGJ5IGZpZWxkXG4gICAgICAgICAgICB2aXNfZWxlbXMgPSB2aXNfc2VsXG4gICAgICAgICAgICAgICAgLmRhdGEoZGF0YV9lbGVtcywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZy5pbmRleChkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgeyAvLyBJbmRleGluZyBieSBwb3NpdGlvbiBpbiBhcnJheVxuICAgICAgICAgICAgdmlzX2VsZW1zID0gdmlzX3NlbFxuICAgICAgICAgICAgICAgIC5kYXRhKGRhdGFfZWxlbXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uZmlnLmRpc3RyaWJ1dGUuY2FsbCh0cmFjaywgdmlzX2VsZW1zLCBjb25maWcuc2NhbGUpO1xuXG4gICAgXHR2YXIgbmV3X2VsZW0gPSB2aXNfZWxlbXNcbiAgICBcdCAgICAuZW50ZXIoKTtcblxuICAgIFx0bmV3X2VsZW1cbiAgICBcdCAgICAuYXBwZW5kKFwiZ1wiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZWxlbVwiKVxuICAgIFx0ICAgIC5jbGFzc2VkKFwidG50X2VsZW1fXCIgKyBmaWVsZCwgZmllbGQpXG4gICAgXHQgICAgLmNhbGwoZmVhdHVyZS5wbG90LCB0cmFjaywgY29uZmlnLnNjYWxlKTtcblxuICAgIFx0dmlzX2VsZW1zXG4gICAgXHQgICAgLmV4aXQoKVxuICAgIFx0ICAgIC5yZW1vdmUoKTtcbiAgICB9O1xuXG4gICAgdmFyIG1vdmVyID0gZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgIFx0dmFyIHN2Z19nID0gdHJhY2suZztcbiAgICBcdHZhciBlbGVtcztcbiAgICBcdC8vIFRPRE86IElzIHNlbGVjdGluZyB0aGUgZWxlbWVudHMgdG8gbW92ZSB0b28gc2xvdz9cbiAgICBcdC8vIEl0IHdvdWxkIGJlIG5pY2UgdG8gcHJvZmlsZVxuICAgIFx0aWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcbiAgICBcdCAgICBlbGVtcyA9IHN2Z19nLnNlbGVjdEFsbChcIi50bnRfZWxlbV9cIiArIGZpZWxkKTtcbiAgICBcdH0gZWxzZSB7XG4gICAgXHQgICAgZWxlbXMgPSBzdmdfZy5zZWxlY3RBbGwoXCIudG50X2VsZW1cIik7XG4gICAgXHR9XG5cbiAgICBcdGNvbmZpZy5tb3ZlLmNhbGwodGhpcywgZWxlbXMpO1xuICAgIH07XG5cbiAgICB2YXIgbXRmID0gZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGVsZW0pO1xuICAgIH07XG5cbiAgICB2YXIgbW92ZV90b19mcm9udCA9IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgICBpZiAoZmllbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgICAgIHZhciBzdmdfZyA9IHRyYWNrLmc7XG4gICAgICAgICAgICBzdmdfZy5zZWxlY3RBbGwoXCIudG50X2VsZW1fXCIgKyBmaWVsZClcbiAgICAgICAgICAgICAgICAuZWFjaCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBtdGYodGhpcyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQVBJXG4gICAgYXBpanMgKGZlYXR1cmUpXG4gICAgXHQuZ2V0c2V0IChjb25maWcpXG4gICAgXHQubWV0aG9kICh7XG4gICAgXHQgICAgcmVzZXQgIDogcmVzZXQsXG4gICAgXHQgICAgcGxvdCAgIDogcGxvdCxcbiAgICBcdCAgICB1cGRhdGUgOiB1cGRhdGUsXG4gICAgXHQgICAgbW92ZXIgICA6IG1vdmVyLFxuICAgIFx0ICAgIGluaXQgICA6IGluaXQsXG4gICAgXHQgICAgbW92ZV90b19mcm9udCA6IG1vdmVfdG9fZnJvbnRcbiAgICBcdH0pO1xuXG4gICAgcmV0dXJuIGQzLnJlYmluZChmZWF0dXJlLCBkaXNwYXRjaCwgXCJvblwiKTtcbn07XG5cbnRudF9mZWF0dXJlLmNvbXBvc2l0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGlzcGxheXMgPSB7fTtcbiAgICB2YXIgZGlzcGxheV9vcmRlciA9IFtdO1xuXG4gICAgdmFyIGZlYXR1cmVzID0ge307XG5cbiAgICB2YXIgcmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICBmb3IgKHZhciBkaXNwbGF5IGluIGRpc3BsYXlzKSB7XG4gICAgICAgICAgICBpZiAoZGlzcGxheXMuaGFzT3duUHJvcGVydHkoZGlzcGxheSkpIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5c1tkaXNwbGF5XS5yZXNldC5jYWxsKHRyYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgaW5pdCA9IGZ1bmN0aW9uICh3aWR0aCkge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICBmb3IgKHZhciBkaXNwbGF5IGluIGRpc3BsYXlzKSB7XG4gICAgICAgICAgICBpZiAoZGlzcGxheXMuaGFzT3duUHJvcGVydHkoZGlzcGxheSkpIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5c1tkaXNwbGF5XS5zY2FsZShmZWF0dXJlcy5zY2FsZSgpKTtcbiAgICAgICAgICAgICAgICBkaXNwbGF5c1tkaXNwbGF5XS5pbml0LmNhbGwodHJhY2ssIHdpZHRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICBcdGZvciAodmFyIGk9MDsgaTxkaXNwbGF5X29yZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgXHQgICAgZGlzcGxheXNbZGlzcGxheV9vcmRlcltpXV0udXBkYXRlLmNhbGwodHJhY2ssIHVuZGVmaW5lZCwgZGlzcGxheV9vcmRlcltpXSk7XG4gICAgXHQgICAgZGlzcGxheXNbZGlzcGxheV9vcmRlcltpXV0ubW92ZV90b19mcm9udC5jYWxsKHRyYWNrLCBkaXNwbGF5X29yZGVyW2ldKTtcbiAgICBcdH1cbiAgICAgICAgLy8gZm9yICh2YXIgZGlzcGxheSBpbiBkaXNwbGF5cykge1xuICAgICAgICAvLyAgICAgaWYgKGRpc3BsYXlzLmhhc093blByb3BlcnR5KGRpc3BsYXkpKSB7XG4gICAgICAgIC8vICAgICAgICAgZGlzcGxheXNbZGlzcGxheV0udXBkYXRlLmNhbGwodHJhY2ssIHhTY2FsZSwgZGlzcGxheSk7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cbiAgICB9O1xuXG4gICAgdmFyIG1vdmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICBmb3IgKHZhciBkaXNwbGF5IGluIGRpc3BsYXlzKSB7XG4gICAgICAgICAgICBpZiAoZGlzcGxheXMuaGFzT3duUHJvcGVydHkoZGlzcGxheSkpIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5c1tkaXNwbGF5XS5tb3Zlci5jYWxsKHRyYWNrLCBkaXNwbGF5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgYWRkID0gZnVuY3Rpb24gKGtleSwgZGlzcGxheSkge1xuICAgIFx0ZGlzcGxheXNba2V5XSA9IGRpc3BsYXk7XG4gICAgXHRkaXNwbGF5X29yZGVyLnB1c2goa2V5KTtcbiAgICBcdHJldHVybiBmZWF0dXJlcztcbiAgICB9O1xuXG4gICAgdmFyIGdldF9kaXNwbGF5cyA9IGZ1bmN0aW9uICgpIHtcbiAgICBcdHZhciBkcyA9IFtdO1xuICAgIFx0Zm9yICh2YXIgaT0wOyBpPGRpc3BsYXlfb3JkZXIubGVuZ3RoOyBpKyspIHtcbiAgICBcdCAgICBkcy5wdXNoKGRpc3BsYXlzW2Rpc3BsYXlfb3JkZXJbaV1dKTtcbiAgICBcdH1cbiAgICBcdHJldHVybiBkcztcbiAgICB9O1xuXG4gICAgLy8gQVBJXG4gICAgYXBpanMgKGZlYXR1cmVzKVxuICAgICAgICAuZ2V0c2V0KFwic2NhbGVcIilcbiAgICBcdC5tZXRob2QgKHtcbiAgICBcdCAgICByZXNldCAgOiByZXNldCxcbiAgICBcdCAgICB1cGRhdGUgOiB1cGRhdGUsXG4gICAgXHQgICAgbW92ZXIgICA6IG1vdmVyLFxuICAgIFx0ICAgIGluaXQgICA6IGluaXQsXG4gICAgXHQgICAgYWRkICAgIDogYWRkLFxuICAgIFx0ICAgIGRpc3BsYXlzIDogZ2V0X2Rpc3BsYXlzXG4gICAgXHR9KTtcblxuICAgIHJldHVybiBmZWF0dXJlcztcbn07XG5cbnRudF9mZWF0dXJlLmFyZWEgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGZlYXR1cmUgPSB0bnRfZmVhdHVyZS5saW5lKCk7XG4gICAgdmFyIGxpbmUgPSBmZWF0dXJlLmxpbmUoKTtcblxuICAgIHZhciBhcmVhID0gZDMuc3ZnLmFyZWEoKVxuICAgIFx0LmludGVycG9sYXRlKGxpbmUuaW50ZXJwb2xhdGUoKSlcbiAgICBcdC50ZW5zaW9uKGZlYXR1cmUudGVuc2lvbigpKTtcblxuICAgIHZhciBkYXRhX3BvaW50cztcblxuICAgIHZhciBsaW5lX2NyZWF0ZSA9IGZlYXR1cmUuY3JlYXRlKCk7IC8vIFdlICdzYXZlJyBsaW5lIGNyZWF0aW9uXG5cbiAgICBmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKHBvaW50cykge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcblxuICAgIFx0aWYgKGRhdGFfcG9pbnRzICE9PSB1bmRlZmluZWQpIHtcbiAgICBcdCAgICB0cmFjay5nLnNlbGVjdChcInBhdGhcIikucmVtb3ZlKCk7XG4gICAgXHR9XG5cbiAgICBcdGxpbmVfY3JlYXRlLmNhbGwodHJhY2ssIHBvaW50cywgeFNjYWxlKTtcblxuICAgIFx0YXJlYVxuICAgIFx0ICAgIC54KGxpbmUueCgpKVxuICAgIFx0ICAgIC55MShsaW5lLnkoKSlcbiAgICBcdCAgICAueTAodHJhY2suaGVpZ2h0KCkpO1xuXG4gICAgXHRkYXRhX3BvaW50cyA9IHBvaW50cy5kYXRhKCk7XG4gICAgXHRwb2ludHMucmVtb3ZlKCk7XG5cbiAgICBcdHRyYWNrLmdcbiAgICBcdCAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfYXJlYVwiKVxuICAgIFx0ICAgIC5jbGFzc2VkKFwidG50X2VsZW1cIiwgdHJ1ZSlcbiAgICBcdCAgICAuZGF0dW0oZGF0YV9wb2ludHMpXG4gICAgXHQgICAgLmF0dHIoXCJkXCIsIGFyZWEpXG4gICAgXHQgICAgLmF0dHIoXCJmaWxsXCIsIGQzLnJnYihmZWF0dXJlLmNvbG9yKCkpLmJyaWdodGVyKCkpO1xuICAgIH0pO1xuXG4gICAgdmFyIGxpbmVfbW92ZSA9IGZlYXR1cmUubW92ZSgpO1xuICAgIGZlYXR1cmUubW92ZSAoZnVuY3Rpb24gKHBhdGgpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgXHRsaW5lX21vdmUuY2FsbCh0cmFjaywgcGF0aCwgeFNjYWxlKTtcblxuICAgIFx0YXJlYS54KGxpbmUueCgpKTtcbiAgICBcdHRyYWNrLmdcbiAgICBcdCAgICAuc2VsZWN0KFwiLnRudF9hcmVhXCIpXG4gICAgXHQgICAgLmRhdHVtKGRhdGFfcG9pbnRzKVxuICAgIFx0ICAgIC5hdHRyKFwiZFwiLCBhcmVhKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xuXG59O1xuXG50bnRfZmVhdHVyZS5saW5lID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmZWF0dXJlID0gdG50X2ZlYXR1cmUoKTtcblxuICAgIHZhciB4ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIGQucG9zO1xuICAgIH07XG4gICAgdmFyIHkgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gZC52YWw7XG4gICAgfTtcbiAgICB2YXIgdGVuc2lvbiA9IDAuNztcbiAgICB2YXIgeVNjYWxlID0gZDMuc2NhbGUubGluZWFyKCk7XG4gICAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpXG4gICAgICAgIC5pbnRlcnBvbGF0ZShcImJhc2lzXCIpO1xuXG4gICAgLy8gbGluZSBnZXR0ZXIuIFRPRE86IFNldHRlcj9cbiAgICBmZWF0dXJlLmxpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBsaW5lO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLnggPSBmdW5jdGlvbiAoY2Jhaykge1xuICAgIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgXHQgICAgcmV0dXJuIHg7XG4gICAgXHR9XG4gICAgXHR4ID0gY2JhaztcbiAgICBcdHJldHVybiBmZWF0dXJlO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLnkgPSBmdW5jdGlvbiAoY2Jhaykge1xuICAgIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgXHQgICAgcmV0dXJuIHk7XG4gICAgXHR9XG4gICAgXHR5ID0gY2JhaztcbiAgICBcdHJldHVybiBmZWF0dXJlO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLnRlbnNpb24gPSBmdW5jdGlvbiAodCkge1xuICAgIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgXHQgICAgcmV0dXJuIHRlbnNpb247XG4gICAgXHR9XG4gICAgXHR0ZW5zaW9uID0gdDtcbiAgICBcdHJldHVybiBmZWF0dXJlO1xuICAgIH07XG5cbiAgICB2YXIgZGF0YV9wb2ludHM7XG5cbiAgICAvLyBGb3Igbm93LCBjcmVhdGUgaXMgYSBvbmUtb2ZmIGV2ZW50XG4gICAgLy8gVE9ETzogTWFrZSBpdCB3b3JrIHdpdGggcGFydGlhbCBwYXRocywgaWUuIGNyZWF0aW5nIGFuZCBkaXNwbGF5aW5nIG9ubHkgdGhlIHBhdGggdGhhdCBpcyBiZWluZyBkaXNwbGF5ZWRcbiAgICBmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKHBvaW50cykge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcblxuICAgIFx0aWYgKGRhdGFfcG9pbnRzICE9PSB1bmRlZmluZWQpIHtcbiAgICBcdCAgICAvLyByZXR1cm47XG4gICAgXHQgICAgdHJhY2suZy5zZWxlY3QoXCJwYXRoXCIpLnJlbW92ZSgpO1xuICAgIFx0fVxuXG4gICAgXHRsaW5lXG4gICAgXHQgICAgLnRlbnNpb24odGVuc2lvbilcbiAgICBcdCAgICAueChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4U2NhbGUoeChkKSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAueShmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cmFjay5oZWlnaHQoKSAtIHlTY2FsZSh5KGQpKTtcbiAgICBcdCAgICB9KTtcblxuICAgIFx0ZGF0YV9wb2ludHMgPSBwb2ludHMuZGF0YSgpO1xuICAgIFx0cG9pbnRzLnJlbW92ZSgpO1xuXG4gICAgXHR5U2NhbGVcbiAgICBcdCAgICAuZG9tYWluKFswLCAxXSlcbiAgICBcdCAgICAvLyAuZG9tYWluKFswLCBkMy5tYXgoZGF0YV9wb2ludHMsIGZ1bmN0aW9uIChkKSB7XG4gICAgXHQgICAgLy8gXHRyZXR1cm4geShkKTtcbiAgICBcdCAgICAvLyB9KV0pXG4gICAgXHQgICAgLnJhbmdlKFswLCB0cmFjay5oZWlnaHQoKSAtIDJdKTtcblxuICAgIFx0dHJhY2suZ1xuICAgIFx0ICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9lbGVtXCIpXG4gICAgXHQgICAgLmF0dHIoXCJkXCIsIGxpbmUoZGF0YV9wb2ludHMpKVxuICAgIFx0ICAgIC5zdHlsZShcInN0cm9rZVwiLCBmZWF0dXJlLmNvbG9yKCkpXG4gICAgXHQgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDQpXG4gICAgXHQgICAgLnN0eWxlKFwiZmlsbFwiLCBcIm5vbmVcIik7XG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLm1vdmUgKGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB2YXIgeFNjYWxlID0gZmVhdHVyZS5zY2FsZSgpO1xuXG4gICAgXHRsaW5lLngoZnVuY3Rpb24gKGQpIHtcbiAgICBcdCAgICByZXR1cm4geFNjYWxlKHgoZCkpO1xuICAgIFx0fSk7XG4gICAgXHR0cmFjay5nLnNlbGVjdChcInBhdGhcIilcbiAgICBcdCAgICAuYXR0cihcImRcIiwgbGluZShkYXRhX3BvaW50cykpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG50bnRfZmVhdHVyZS5jb25zZXJ2YXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vICdJbmhlcml0JyBmcm9tIGZlYXR1cmUuYXJlYVxuICAgICAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlLmFyZWEoKTtcblxuICAgICAgICB2YXIgYXJlYV9jcmVhdGUgPSBmZWF0dXJlLmNyZWF0ZSgpOyAvLyBXZSAnc2F2ZScgYXJlYSBjcmVhdGlvblxuICAgICAgICBmZWF0dXJlLmNyZWF0ZSAgKGZ1bmN0aW9uIChwb2ludHMpIHtcbiAgICAgICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcbiAgICAgICAgXHRhcmVhX2NyZWF0ZS5jYWxsKHRyYWNrLCBkMy5zZWxlY3QocG9pbnRzWzBdWzBdKSwgeFNjYWxlKTtcbiAgICAgICAgfSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcbn07XG5cbnRudF9mZWF0dXJlLmVuc2VtYmwgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gJ0luaGVyaXQnIGZyb20gYm9hcmQudHJhY2suZmVhdHVyZVxuICAgIHZhciBmZWF0dXJlID0gdG50X2ZlYXR1cmUoKTtcblxuICAgIHZhciBjb2xvcjIgPSBcIiM3RkZGMDBcIjtcbiAgICB2YXIgY29sb3IzID0gXCIjMDBCQjAwXCI7XG5cbiAgICBmZWF0dXJlLmZpeGVkIChmdW5jdGlvbiAod2lkdGgpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgXHR2YXIgaGVpZ2h0X29mZnNldCA9IH5+KHRyYWNrLmhlaWdodCgpIC0gKHRyYWNrLmhlaWdodCgpICAqIDAuOCkpIC8gMjtcblxuICAgIFx0dHJhY2suZ1xuICAgIFx0ICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ndWlkZXIgdG50X2ZpeGVkXCIpXG4gICAgXHQgICAgLmF0dHIoXCJ4MVwiLCAwKVxuICAgIFx0ICAgIC5hdHRyKFwieDJcIiwgd2lkdGgpXG4gICAgXHQgICAgLmF0dHIoXCJ5MVwiLCBoZWlnaHRfb2Zmc2V0KVxuICAgIFx0ICAgIC5hdHRyKFwieTJcIiwgaGVpZ2h0X29mZnNldClcbiAgICBcdCAgICAuc3R5bGUoXCJzdHJva2VcIiwgZmVhdHVyZS5jb2xvcigpKVxuICAgIFx0ICAgIC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCAxKTtcblxuICAgIFx0dHJhY2suZ1xuICAgIFx0ICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ndWlkZXIgdG50X2ZpeGVkXCIpXG4gICAgXHQgICAgLmF0dHIoXCJ4MVwiLCAwKVxuICAgIFx0ICAgIC5hdHRyKFwieDJcIiwgd2lkdGgpXG4gICAgXHQgICAgLmF0dHIoXCJ5MVwiLCB0cmFjay5oZWlnaHQoKSAtIGhlaWdodF9vZmZzZXQpXG4gICAgXHQgICAgLmF0dHIoXCJ5MlwiLCB0cmFjay5oZWlnaHQoKSAtIGhlaWdodF9vZmZzZXQpXG4gICAgXHQgICAgLnN0eWxlKFwic3Ryb2tlXCIsIGZlYXR1cmUuY29sb3IoKSlcbiAgICBcdCAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMSk7XG5cbiAgICB9KTtcblxuICAgIGZlYXR1cmUuY3JlYXRlIChmdW5jdGlvbiAobmV3X2VsZW1zKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB2YXIgeFNjYWxlID0gZmVhdHVyZS5zY2FsZSgpO1xuXG4gICAgXHR2YXIgaGVpZ2h0X29mZnNldCA9IH5+KHRyYWNrLmhlaWdodCgpIC0gKHRyYWNrLmhlaWdodCgpICAqIDAuOCkpIC8gMjtcblxuICAgIFx0bmV3X2VsZW1zXG4gICAgXHQgICAgLmFwcGVuZChcInJlY3RcIilcbiAgICBcdCAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlIChkLnN0YXJ0KTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwieVwiLCBoZWlnaHRfb2Zmc2V0KVxuICAgIC8vIFx0ICAgIC5hdHRyKFwicnhcIiwgMylcbiAgICAvLyBcdCAgICAuYXR0cihcInJ5XCIsIDMpXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoeFNjYWxlKGQuZW5kKSAtIHhTY2FsZShkLnN0YXJ0KSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcImhlaWdodFwiLCB0cmFjay5oZWlnaHQoKSAtIH5+KGhlaWdodF9vZmZzZXQgKiAyKSlcbiAgICBcdCAgICAuYXR0cihcImZpbGxcIiwgdHJhY2suY29sb3IoKSlcbiAgICBcdCAgICAudHJhbnNpdGlvbigpXG4gICAgXHQgICAgLmR1cmF0aW9uKDUwMClcbiAgICBcdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgXHRcdGlmIChkLnR5cGUgPT09ICdoaWdoJykge1xuICAgICAgICBcdFx0ICAgIHJldHVybiBkMy5yZ2IoZmVhdHVyZS5jb2xvcigpKTtcbiAgICAgICAgXHRcdH1cbiAgICAgICAgXHRcdGlmIChkLnR5cGUgPT09ICdsb3cnKSB7XG4gICAgICAgIFx0XHQgICAgcmV0dXJuIGQzLnJnYihmZWF0dXJlLmNvbG9yMigpKTtcbiAgICAgICAgXHRcdH1cbiAgICAgICAgXHRcdHJldHVybiBkMy5yZ2IoZmVhdHVyZS5jb2xvcjMoKSk7XG4gICAgXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLmRpc3RyaWJ1dGUgKGZ1bmN0aW9uIChibG9ja3MpIHtcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcbiAgICBcdGJsb2Nrc1xuICAgIFx0ICAgIC5zZWxlY3QoXCJyZWN0XCIpXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoeFNjYWxlKGQuZW5kKSAtIHhTY2FsZShkLnN0YXJ0KSk7XG4gICAgXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLm1vdmUgKGZ1bmN0aW9uIChibG9ja3MpIHtcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcbiAgICBcdGJsb2Nrc1xuICAgIFx0ICAgIC5zZWxlY3QoXCJyZWN0XCIpXG4gICAgXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShkLnN0YXJ0KTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuICAgIFx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5jb2xvcjIgPSBmdW5jdGlvbiAoY29sKSB7XG4gICAgXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBcdCAgICByZXR1cm4gY29sb3IyO1xuICAgIFx0fVxuICAgIFx0Y29sb3IyID0gY29sO1xuICAgIFx0cmV0dXJuIGZlYXR1cmU7XG4gICAgfTtcblxuICAgIGZlYXR1cmUuY29sb3IzID0gZnVuY3Rpb24gKGNvbCkge1xuICAgIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgXHQgICAgcmV0dXJuIGNvbG9yMztcbiAgICBcdH1cbiAgICBcdGNvbG9yMyA9IGNvbDtcbiAgICBcdHJldHVybiBmZWF0dXJlO1xuICAgIH07XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcbn07XG5cbnRudF9mZWF0dXJlLnZsaW5lID0gZnVuY3Rpb24gKCkge1xuICAgIC8vICdJbmhlcml0JyBmcm9tIGZlYXR1cmVcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlKCk7XG5cbiAgICBmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKG5ld19lbGVtcykge1xuICAgICAgICB2YXIgeFNjYWxlID0gZmVhdHVyZS5zY2FsZSgpO1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICBcdG5ld19lbGVtc1xuICAgIFx0ICAgIC5hcHBlbmQgKFwibGluZVwiKVxuICAgIFx0ICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlKGZlYXR1cmUuaW5kZXgoKShkKSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShmZWF0dXJlLmluZGV4KCkoZCkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ5MVwiLCAwKVxuICAgIFx0ICAgIC5hdHRyKFwieTJcIiwgdHJhY2suaGVpZ2h0KCkpXG4gICAgXHQgICAgLmF0dHIoXCJzdHJva2VcIiwgZmVhdHVyZS5jb2xvcigpKVxuICAgIFx0ICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDEpO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlIChmdW5jdGlvbiAodmxpbmVzKSB7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgXHR2bGluZXNcbiAgICBcdCAgICAuc2VsZWN0KFwibGluZVwiKVxuICAgIFx0ICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlKGZlYXR1cmUuaW5kZXgoKShkKSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShmZWF0dXJlLmluZGV4KCkoZCkpO1xuICAgIFx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG5cbn07XG5cbnRudF9mZWF0dXJlLnBpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyAnSW5oZXJpdCcgZnJvbSBib2FyZC50cmFjay5mZWF0dXJlXG4gICAgdmFyIGZlYXR1cmUgPSB0bnRfZmVhdHVyZSgpO1xuXG4gICAgdmFyIHlTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgXHQuZG9tYWluKFswLDBdKVxuICAgIFx0LnJhbmdlKFswLDBdKTtcblxuICAgIHZhciBvcHRzID0ge1xuICAgICAgICBwb3MgOiBkMy5mdW5jdG9yKFwicG9zXCIpLFxuICAgICAgICB2YWwgOiBkMy5mdW5jdG9yKFwidmFsXCIpLFxuICAgICAgICBkb21haW4gOiBbMCwxXVxuICAgIH07XG5cbiAgICB2YXIgcGluX2JhbGxfciA9IDU7IC8vIHRoZSByYWRpdXMgb2YgdGhlIGNpcmNsZSBpbiB0aGUgcGluXG5cbiAgICBhcGlqcyhmZWF0dXJlKVxuICAgICAgICAuZ2V0c2V0KG9wdHMpO1xuXG5cbiAgICBmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKG5ld19waW5zKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB2YXIgeFNjYWxlID0gZmVhdHVyZS5zY2FsZSgpO1xuICAgIFx0eVNjYWxlXG4gICAgXHQgICAgLmRvbWFpbihmZWF0dXJlLmRvbWFpbigpKVxuICAgIFx0ICAgIC5yYW5nZShbcGluX2JhbGxfciwgdHJhY2suaGVpZ2h0KCktcGluX2JhbGxfci0xMF0pOyAvLyAxMCBmb3IgbGFiZWxsaW5nXG5cbiAgICBcdC8vIHBpbnMgYXJlIGNvbXBvc2VkIG9mIGxpbmVzLCBjaXJjbGVzIGFuZCBsYWJlbHNcbiAgICBcdG5ld19waW5zXG4gICAgXHQgICAgLmFwcGVuZChcImxpbmVcIilcbiAgICBcdCAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgXHQgICAgXHRyZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhY2suaGVpZ2h0KCk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uIChkLGkpIHtcbiAgICBcdCAgICBcdHJldHVybiB4U2NhbGUoZFtvcHRzLnBvcyhkLCBpKV0pO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgIFx0ICAgIFx0cmV0dXJuIHRyYWNrLmhlaWdodCgpIC0geVNjYWxlKGRbb3B0cy52YWwoZCwgaSldKTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3IoZmVhdHVyZS5jb2xvcigpKShkKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgXHRuZXdfcGluc1xuICAgIFx0ICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICBcdCAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShkW29wdHMucG9zKGQsIGkpXSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYWNrLmhlaWdodCgpIC0geVNjYWxlKGRbb3B0cy52YWwoZCwgaSldKTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwiclwiLCBwaW5fYmFsbF9yKVxuICAgIFx0ICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKGZlYXR1cmUuY29sb3IoKSkoZCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBuZXdfcGluc1xuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgIC5hdHRyKFwiZm9udC1zaXplXCIsIFwiMTNcIilcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4U2NhbGUoZFtvcHRzLnBvcyhkLCBpKV0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAxMDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKGZlYXR1cmUuY29sb3IoKSkoZCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5sYWJlbCB8fCBcIlwiO1xuICAgICAgICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIGZlYXR1cmUuZGlzdHJpYnV0ZSAoZnVuY3Rpb24gKHBpbnMpIHtcbiAgICAgICAgcGluc1xuICAgICAgICAgICAgLnNlbGVjdChcInRleHRcIilcbiAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQubGFiZWwgfHwgXCJcIjtcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlKGZ1bmN0aW9uIChwaW5zKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB2YXIgeFNjYWxlID0gZmVhdHVyZS5zY2FsZSgpO1xuXG4gICAgXHRwaW5zXG4gICAgXHQgICAgLy8uZWFjaChwb3NpdGlvbl9waW5fbGluZSlcbiAgICBcdCAgICAuc2VsZWN0KFwibGluZVwiKVxuICAgIFx0ICAgIC5hdHRyKFwieDFcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgXHRcdHJldHVybiB0cmFjay5oZWlnaHQoKTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24gKGQsaSkge1xuICAgICAgICBcdFx0cmV0dXJuIHhTY2FsZShkW29wdHMucG9zKGQsIGkpXSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gdHJhY2suaGVpZ2h0KCkgLSB5U2NhbGUoZFtvcHRzLnZhbChkLCBpKV0pO1xuICAgIFx0ICAgIH0pO1xuXG4gICAgXHRwaW5zXG4gICAgXHQgICAgLnNlbGVjdChcImNpcmNsZVwiKVxuICAgIFx0ICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhY2suaGVpZ2h0KCkgLSB5U2NhbGUoZFtvcHRzLnZhbChkLCBpKV0pO1xuICAgIFx0ICAgIH0pO1xuXG4gICAgICAgIHBpbnNcbiAgICAgICAgICAgIC5zZWxlY3QoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLmxhYmVsIHx8IFwiXCI7XG4gICAgICAgICAgICB9KTtcblxuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5maXhlZCAoZnVuY3Rpb24gKHdpZHRoKSB7XG4gICAgICAgIHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHRyYWNrLmdcbiAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2ZpeGVkXCIpXG4gICAgICAgICAgICAuYXR0cihcIngxXCIsIDApXG4gICAgICAgICAgICAuYXR0cihcIngyXCIsIHdpZHRoKVxuICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCB0cmFjay5oZWlnaHQoKSlcbiAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgdHJhY2suaGVpZ2h0KCkpXG4gICAgICAgICAgICAuc3R5bGUoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuICAgICAgICAgICAgLnN0eWxlKFwic3Ryb2tlLXdpdGhcIiwgXCIxcHhcIik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcbn07XG5cbnRudF9mZWF0dXJlLmJsb2NrID0gZnVuY3Rpb24gKCkge1xuICAgIC8vICdJbmhlcml0JyBmcm9tIGJvYXJkLnRyYWNrLmZlYXR1cmVcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlKCk7XG5cbiAgICBhcGlqcyhmZWF0dXJlKVxuICAgIFx0LmdldHNldCgnZnJvbScsIGZ1bmN0aW9uIChkKSB7XG4gICAgXHQgICAgcmV0dXJuIGQuc3RhcnQ7XG4gICAgXHR9KVxuICAgIFx0LmdldHNldCgndG8nLCBmdW5jdGlvbiAoZCkge1xuICAgIFx0ICAgIHJldHVybiBkLmVuZDtcbiAgICBcdH0pO1xuXG4gICAgZmVhdHVyZS5jcmVhdGUoZnVuY3Rpb24gKG5ld19lbGVtcykge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcbiAgICBcdG5ld19lbGVtc1xuICAgIFx0ICAgIC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgIFx0XHQvLyBUT0RPOiBzdGFydCwgZW5kIHNob3VsZCBiZSBhZGp1c3RhYmxlIHZpYSB0aGUgdHJhY2tzIEFQSVxuICAgICAgICBcdFx0cmV0dXJuIHhTY2FsZShmZWF0dXJlLmZyb20oKShkLCBpKSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInlcIiwgMClcbiAgICBcdCAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gKHhTY2FsZShmZWF0dXJlLnRvKCkoZCwgaSkpIC0geFNjYWxlKGZlYXR1cmUuZnJvbSgpKGQsIGkpKSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcImhlaWdodFwiLCB0cmFjay5oZWlnaHQoKSlcbiAgICBcdCAgICAuYXR0cihcImZpbGxcIiwgdHJhY2suY29sb3IoKSlcbiAgICBcdCAgICAudHJhbnNpdGlvbigpXG4gICAgXHQgICAgLmR1cmF0aW9uKDUwMClcbiAgICBcdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgXHRcdGlmIChkLmNvbG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgXHRcdCAgICByZXR1cm4gZmVhdHVyZS5jb2xvcigpO1xuICAgICAgICBcdFx0fSBlbHNlIHtcbiAgICAgICAgXHRcdCAgICByZXR1cm4gZC5jb2xvcjtcbiAgICAgICAgXHRcdH1cbiAgICBcdCAgICB9KTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUuZGlzdHJpYnV0ZShmdW5jdGlvbiAoZWxlbXMpIHtcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcbiAgICBcdGVsZW1zXG4gICAgXHQgICAgLnNlbGVjdChcInJlY3RcIilcbiAgICBcdCAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuICAgIFx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlKGZ1bmN0aW9uIChibG9ja3MpIHtcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcbiAgICBcdGJsb2Nrc1xuICAgIFx0ICAgIC5zZWxlY3QoXCJyZWN0XCIpXG4gICAgXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0XHRyZXR1cm4geFNjYWxlKGQuc3RhcnQpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBcdFx0cmV0dXJuICh4U2NhbGUoZC5lbmQpIC0geFNjYWxlKGQuc3RhcnQpKTtcbiAgICBcdCAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xuXG59O1xuXG50bnRfZmVhdHVyZS5heGlzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB4QXhpcztcbiAgICB2YXIgb3JpZW50YXRpb24gPSBcInRvcFwiO1xuICAgIHZhciB4U2NhbGU7XG5cbiAgICAvLyBBeGlzIGRvZXNuJ3QgaW5oZXJpdCBmcm9tIGZlYXR1cmVcbiAgICB2YXIgZmVhdHVyZSA9IHt9O1xuICAgIGZlYXR1cmUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgXHR4QXhpcyA9IHVuZGVmaW5lZDtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgXHR0cmFjay5nLnNlbGVjdEFsbChcIi50aWNrXCIpLnJlbW92ZSgpO1xuICAgIH07XG4gICAgZmVhdHVyZS5wbG90ID0gZnVuY3Rpb24gKCkge307XG4gICAgZmVhdHVyZS5tb3ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgXHR2YXIgc3ZnX2cgPSB0cmFjay5nO1xuICAgIFx0c3ZnX2cuY2FsbCh4QXhpcyk7XG4gICAgfTtcblxuICAgIGZlYXR1cmUuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgeEF4aXMgPSB1bmRlZmluZWQ7XG4gICAgfTtcblxuICAgIGZlYXR1cmUudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIFx0Ly8gQ3JlYXRlIEF4aXMgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgICAgICBpZiAoeEF4aXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgeEF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAgICAgICAgICAgLnNjYWxlKHhTY2FsZSlcbiAgICAgICAgICAgICAgICAub3JpZW50KG9yaWVudGF0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgIFx0dmFyIHN2Z19nID0gdHJhY2suZztcbiAgICBcdHN2Z19nLmNhbGwoeEF4aXMpO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLm9yaWVudGF0aW9uID0gZnVuY3Rpb24gKHBvcykge1xuICAgIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgXHQgICAgcmV0dXJuIG9yaWVudGF0aW9uO1xuICAgIFx0fVxuICAgIFx0b3JpZW50YXRpb24gPSBwb3M7XG4gICAgXHRyZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgZmVhdHVyZS5zY2FsZSA9IGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHhTY2FsZTtcbiAgICAgICAgfVxuICAgICAgICB4U2NhbGUgPSBzO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG50bnRfZmVhdHVyZS5sb2NhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcm93O1xuICAgIHZhciB4U2NhbGU7XG5cbiAgICB2YXIgZmVhdHVyZSA9IHt9O1xuICAgIGZlYXR1cmUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJvdyA9IHVuZGVmaW5lZDtcbiAgICB9O1xuICAgIGZlYXR1cmUucGxvdCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIGZlYXR1cmUuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcm93ID0gdW5kZWZpbmVkO1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB0cmFjay5nLnNlbGVjdChcInRleHRcIikucmVtb3ZlKCk7XG4gICAgfTtcbiAgICBmZWF0dXJlLm1vdmVyID0gZnVuY3Rpb24oKSB7XG4gICAgXHR2YXIgZG9tYWluID0geFNjYWxlLmRvbWFpbigpO1xuICAgIFx0cm93LnNlbGVjdChcInRleHRcIilcbiAgICBcdCAgICAudGV4dChcIkxvY2F0aW9uOiBcIiArIH5+ZG9tYWluWzBdICsgXCItXCIgKyB+fmRvbWFpblsxXSk7XG4gICAgfTtcblxuICAgIGZlYXR1cmUuc2NhbGUgPSBmdW5jdGlvbiAoc2MpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4geFNjYWxlO1xuICAgICAgICB9XG4gICAgICAgIHhTY2FsZSA9IHNjO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgZmVhdHVyZS51cGRhdGUgPSBmdW5jdGlvbiAobG9jKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgIFx0dmFyIHN2Z19nID0gdHJhY2suZztcbiAgICBcdHZhciBkb21haW4gPSB4U2NhbGUuZG9tYWluKCk7XG4gICAgXHRpZiAocm93ID09PSB1bmRlZmluZWQpIHtcbiAgICBcdCAgICByb3cgPSBzdmdfZztcbiAgICBcdCAgICByb3dcbiAgICAgICAgXHRcdC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIFx0XHQudGV4dChcIkxvY2F0aW9uOiBcIiArIE1hdGgucm91bmQoZG9tYWluWzBdKSArIFwiLVwiICsgTWF0aC5yb3VuZChkb21haW5bMV0pKTtcbiAgICBcdH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0bnRfZmVhdHVyZTtcbiIsInZhciBib2FyZCA9IHJlcXVpcmUgKFwiLi9ib2FyZC5qc1wiKTtcbmJvYXJkLnRyYWNrID0gcmVxdWlyZSAoXCIuL3RyYWNrXCIpO1xuYm9hcmQudHJhY2suZGF0YSA9IHJlcXVpcmUgKFwiLi9kYXRhLmpzXCIpO1xuYm9hcmQudHJhY2subGF5b3V0ID0gcmVxdWlyZSAoXCIuL2xheW91dC5qc1wiKTtcbmJvYXJkLnRyYWNrLmZlYXR1cmUgPSByZXF1aXJlIChcIi4vZmVhdHVyZS5qc1wiKTtcbmJvYXJkLnRyYWNrLmxheW91dCA9IHJlcXVpcmUgKFwiLi9sYXlvdXQuanNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGJvYXJkO1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZSAoXCJ0bnQuYXBpXCIpO1xuXG4vLyB2YXIgYm9hcmQgPSB7fTtcbi8vIGJvYXJkLnRyYWNrID0ge307XG52YXIgbGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgLy8gVGhlIHJldHVybmVkIGNsb3N1cmUgLyBvYmplY3RcbiAgICB2YXIgbCA9IGZ1bmN0aW9uIChuZXdfZWxlbXMpICB7XG4gICAgICAgIHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIGwuZWxlbWVudHMoKS5jYWxsKHRyYWNrLCBuZXdfZWxlbXMpO1xuICAgICAgICByZXR1cm4gbmV3X2VsZW1zO1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMobClcbiAgICAgICAgLmdldHNldCAoJ2VsZW1lbnRzJywgZnVuY3Rpb24gKCkge30pO1xuXG4gICAgcmV0dXJuIGw7XG59O1xuXG5sYXlvdXQuaWRlbnRpdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGxheW91dCgpXG4gICAgICAgIC5lbGVtZW50cyAoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBlO1xuICAgICAgICB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGxheW91dDtcbiIsInZhciBzcGlubmVyID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIHZhciBuID0gMDtcbiAgICB2YXIgc3BfZWxlbTtcbiAgICB2YXIgc3AgPSB7fTtcblxuICAgIHNwLm9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICBpZiAoIXRyYWNrLnNwaW5uZXIpIHtcbiAgICAgICAgICAgIHRyYWNrLnNwaW5uZXIgPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHJhY2suc3Bpbm5lcisrO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFjay5zcGlubmVyPT0xKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gdHJhY2suZztcbiAgICAgICAgICAgIHZhciBiZ0NvbG9yID0gdHJhY2suY29sb3IoKTtcbiAgICAgICAgICAgIHNwX2VsZW0gPSBjb250YWluZXJcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwic3ZnXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9zcGlubmVyXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBcIjMwcHhcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBcIjMwcHhcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcInhtbHNcIiwgXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidmlld0JveFwiLCBcIjAgMCAxMDAgMTAwXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJwcmVzZXJ2ZUFzcGVjdFJhdGlvXCIsIFwieE1pZFlNaWRcIik7XG5cblxuICAgICAgICAgICAgc3BfZWxlbVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ4XCIsICcwJylcbiAgICAgICAgICAgICAgICAuYXR0cihcInlcIiwgJzAnKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDBcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwicnhcIiwgJzUwJylcbiAgICAgICAgICAgICAgICAuYXR0cihcInJ5XCIsICc1MCcpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGJnQ29sb3IpO1xuICAgICAgICAgICAgICAgIC8vLmF0dHIoXCJvcGFjaXR5XCIsIDAuNik7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTwxMjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGljayhzcF9lbGVtLCBpLCBiZ0NvbG9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2UgaWYgKHRyYWNrLnNwaW5uZXI+MCl7XG4gICAgICAgICAgICAvLyBNb3ZlIHRoZSBzcGlubmVyIHRvIGZyb250XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHNwX2VsZW0ubm9kZSgpO1xuICAgICAgICAgICAgaWYgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgIG5vZGUucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzcC5vZmYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHRyYWNrLnNwaW5uZXItLTtcbiAgICAgICAgaWYgKCF0cmFjay5zcGlubmVyKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gdHJhY2suZztcbiAgICAgICAgICAgIGNvbnRhaW5lci5zZWxlY3RBbGwoXCIudG50X3NwaW5uZXJcIilcbiAgICAgICAgICAgICAgICAucmVtb3ZlKCk7XG5cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiB0aWNrIChlbGVtLCBpLCBiZ0NvbG9yKSB7XG4gICAgICAgIGVsZW1cbiAgICAgICAgICAgIC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgXCI0Ni41XCIpXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgJzQwJylcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCI3XCIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBcIjIwXCIpXG4gICAgICAgICAgICAuYXR0cihcInJ4XCIsIFwiNVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJyeVwiLCBcIjVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBkMy5yZ2IoYmdDb2xvcikuZGFya2VyKDIpKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoXCIgKyAoMzYwLzEyKSppICsgXCIgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMClcIilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJhbmltYXRlXCIpXG4gICAgICAgICAgICAuYXR0cihcImF0dHJpYnV0ZU5hbWVcIiwgXCJvcGFjaXR5XCIpXG4gICAgICAgICAgICAuYXR0cihcImZyb21cIiwgXCIxXCIpXG4gICAgICAgICAgICAuYXR0cihcInRvXCIsIFwiMFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJkdXJcIiwgXCIxc1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJiZWdpblwiLCAoMS8xMikqaSArIFwic1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJyZXBlYXRDb3VudFwiLCBcImluZGVmaW5pdGVcIik7XG5cbiAgICB9XG5cbiAgICByZXR1cm4gc3A7XG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gc3Bpbm5lcjtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUgKFwidG50LmFwaVwiKTtcbnZhciBpdGVyYXRvciA9IHJlcXVpcmUoXCJ0bnQudXRpbHNcIikuaXRlcmF0b3I7XG5cblxudmFyIHRyYWNrID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGRpc3BsYXk7XG5cbiAgICB2YXIgY29uZiA9IHtcbiAgICBcdGNvbG9yIDogZDMucmdiKCcjQ0NDQ0NDJyksXG4gICAgXHRoZWlnaHQgICAgICAgICAgIDogMjUwLFxuICAgIFx0Ly8gZGF0YSBpcyB0aGUgb2JqZWN0IChub3JtYWxseSBhIHRudC50cmFjay5kYXRhIG9iamVjdCkgdXNlZCB0byByZXRyaWV2ZSBhbmQgdXBkYXRlIGRhdGEgZm9yIHRoZSB0cmFja1xuICAgIFx0ZGF0YSAgICAgICAgICAgICA6IHRyYWNrLmRhdGEuZW1wdHkoKSxcbiAgICAgICAgLy8gZGlzcGxheSAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgbGFiZWwgICAgICAgICAgICA6IFwiXCIsXG4gICAgICAgIGlkICAgICAgICAgICAgICAgOiB0cmFjay5pZCgpXG4gICAgfTtcblxuICAgIC8vIFRoZSByZXR1cm5lZCBvYmplY3QgLyBjbG9zdXJlXG4gICAgdmFyIHQgPSB7fTtcblxuICAgIC8vIEFQSVxuICAgIHZhciBhcGkgPSBhcGlqcyAodClcbiAgICBcdC5nZXRzZXQgKGNvbmYpO1xuXG4gICAgLy8gVE9ETzogVGhpcyBtZWFucyB0aGF0IGhlaWdodCBzaG91bGQgYmUgZGVmaW5lZCBiZWZvcmUgZGlzcGxheVxuICAgIC8vIHdlIHNob3VsZG4ndCByZWx5IG9uIHRoaXNcbiAgICB0LmRpc3BsYXkgPSBmdW5jdGlvbiAobmV3X3Bsb3R0ZXIpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gZGlzcGxheTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRpc3BsYXkgPSBuZXdfcGxvdHRlcjtcbiAgICAgICAgaWYgKHR5cGVvZiAoZGlzcGxheSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGRpc3BsYXkubGF5b3V0ICYmIGRpc3BsYXkubGF5b3V0KCkuaGVpZ2h0KGNvbmYuaGVpZ2h0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBkaXNwbGF5KSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpc3BsYXkuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5W2tleV0ubGF5b3V0ICYmIGRpc3BsYXlba2V5XS5sYXlvdXQoKS5oZWlnaHQoY29uZi5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICByZXR1cm4gdDtcbn07XG5cbnRyYWNrLmlkID0gaXRlcmF0b3IoMSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyYWNrO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvbmV3aWNrLmpzXCIpO1xuIiwiLyoqXG4gKiBOZXdpY2sgYW5kIG5oeCBmb3JtYXRzIHBhcnNlciBpbiBKYXZhU2NyaXB0LlxuICpcbiAqIENvcHlyaWdodCAoYykgSmFzb24gRGF2aWVzIDIwMTAgYW5kIE1pZ3VlbCBQaWduYXRlbGxpXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqXG4gKiBFeGFtcGxlIHRyZWUgKGZyb20gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9OZXdpY2tfZm9ybWF0KTpcbiAqXG4gKiArLS0wLjEtLUFcbiAqIEYtLS0tLTAuMi0tLS0tQiAgICAgICAgICAgICstLS0tLS0tMC4zLS0tLUNcbiAqICstLS0tLS0tLS0tLS0tLS0tLS0wLjUtLS0tLUVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICstLS0tLS0tLS0wLjQtLS0tLS1EXG4gKlxuICogTmV3aWNrIGZvcm1hdDpcbiAqIChBOjAuMSxCOjAuMiwoQzowLjMsRDowLjQpRTowLjUpRjtcbiAqXG4gKiBDb252ZXJ0ZWQgdG8gSlNPTjpcbiAqIHtcbiAqICAgbmFtZTogXCJGXCIsXG4gKiAgIGJyYW5jaHNldDogW1xuICogICAgIHtuYW1lOiBcIkFcIiwgbGVuZ3RoOiAwLjF9LFxuICogICAgIHtuYW1lOiBcIkJcIiwgbGVuZ3RoOiAwLjJ9LFxuICogICAgIHtcbiAqICAgICAgIG5hbWU6IFwiRVwiLFxuICogICAgICAgbGVuZ3RoOiAwLjUsXG4gKiAgICAgICBicmFuY2hzZXQ6IFtcbiAqICAgICAgICAge25hbWU6IFwiQ1wiLCBsZW5ndGg6IDAuM30sXG4gKiAgICAgICAgIHtuYW1lOiBcIkRcIiwgbGVuZ3RoOiAwLjR9XG4gKiAgICAgICBdXG4gKiAgICAgfVxuICogICBdXG4gKiB9XG4gKlxuICogQ29udmVydGVkIHRvIEpTT04sIGJ1dCB3aXRoIG5vIG5hbWVzIG9yIGxlbmd0aHM6XG4gKiB7XG4gKiAgIGJyYW5jaHNldDogW1xuICogICAgIHt9LCB7fSwge1xuICogICAgICAgYnJhbmNoc2V0OiBbe30sIHt9XVxuICogICAgIH1cbiAqICAgXVxuICogfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHBhcnNlX25ld2ljayA6IGZ1bmN0aW9uKHMpIHtcblx0dmFyIGFuY2VzdG9ycyA9IFtdO1xuXHR2YXIgdHJlZSA9IHt9O1xuXHR2YXIgdG9rZW5zID0gcy5zcGxpdCgvXFxzKig7fFxcKHxcXCl8LHw6KVxccyovKTtcblx0dmFyIHN1YnRyZWU7XG5cdGZvciAodmFyIGk9MDsgaTx0b2tlbnMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXTtcblx0ICAgIHN3aXRjaCAodG9rZW4pIHtcbiAgICAgICAgICAgIGNhc2UgJygnOiAvLyBuZXcgYnJhbmNoc2V0XG5cdFx0c3VidHJlZSA9IHt9O1xuXHRcdHRyZWUuY2hpbGRyZW4gPSBbc3VidHJlZV07XG5cdFx0YW5jZXN0b3JzLnB1c2godHJlZSk7XG5cdFx0dHJlZSA9IHN1YnRyZWU7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICcsJzogLy8gYW5vdGhlciBicmFuY2hcblx0XHRzdWJ0cmVlID0ge307XG5cdFx0YW5jZXN0b3JzW2FuY2VzdG9ycy5sZW5ndGgtMV0uY2hpbGRyZW4ucHVzaChzdWJ0cmVlKTtcblx0XHR0cmVlID0gc3VidHJlZTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJyknOiAvLyBvcHRpb25hbCBuYW1lIG5leHRcblx0XHR0cmVlID0gYW5jZXN0b3JzLnBvcCgpO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnOic6IC8vIG9wdGlvbmFsIGxlbmd0aCBuZXh0XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuXHRcdHZhciB4ID0gdG9rZW5zW2ktMV07XG5cdFx0aWYgKHggPT0gJyknIHx8IHggPT0gJygnIHx8IHggPT0gJywnKSB7XG5cdFx0ICAgIHRyZWUubmFtZSA9IHRva2VuO1xuXHRcdH0gZWxzZSBpZiAoeCA9PSAnOicpIHtcblx0XHQgICAgdHJlZS5icmFuY2hfbGVuZ3RoID0gcGFyc2VGbG9hdCh0b2tlbik7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0cmVlO1xuICAgIH0sXG5cbiAgICBwYXJzZV9uaHggOiBmdW5jdGlvbiAocykge1xuXHR2YXIgYW5jZXN0b3JzID0gW107XG5cdHZhciB0cmVlID0ge307XG5cdHZhciBzdWJ0cmVlO1xuXG5cdHZhciB0b2tlbnMgPSBzLnNwbGl0KCAvXFxzKig7fFxcKHxcXCl8XFxbfFxcXXwsfDp8PSlcXHMqLyApO1xuXHRmb3IgKHZhciBpPTA7IGk8dG9rZW5zLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV07XG5cdCAgICBzd2l0Y2ggKHRva2VuKSB7XG4gICAgICAgICAgICBjYXNlICcoJzogLy8gbmV3IGNoaWxkcmVuXG5cdFx0c3VidHJlZSA9IHt9O1xuXHRcdHRyZWUuY2hpbGRyZW4gPSBbc3VidHJlZV07XG5cdFx0YW5jZXN0b3JzLnB1c2godHJlZSk7XG5cdFx0dHJlZSA9IHN1YnRyZWU7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICcsJzogLy8gYW5vdGhlciBicmFuY2hcblx0XHRzdWJ0cmVlID0ge307XG5cdFx0YW5jZXN0b3JzW2FuY2VzdG9ycy5sZW5ndGgtMV0uY2hpbGRyZW4ucHVzaChzdWJ0cmVlKTtcblx0XHR0cmVlID0gc3VidHJlZTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJyknOiAvLyBvcHRpb25hbCBuYW1lIG5leHRcblx0XHR0cmVlID0gYW5jZXN0b3JzLnBvcCgpO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnOic6IC8vIG9wdGlvbmFsIGxlbmd0aCBuZXh0XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuXHRcdHZhciB4ID0gdG9rZW5zW2ktMV07XG5cdFx0aWYgKHggPT0gJyknIHx8IHggPT0gJygnIHx8IHggPT0gJywnKSB7XG5cdFx0ICAgIHRyZWUubmFtZSA9IHRva2VuO1xuXHRcdH1cblx0XHRlbHNlIGlmICh4ID09ICc6Jykge1xuXHRcdCAgICB2YXIgdGVzdF90eXBlID0gdHlwZW9mIHRva2VuO1xuXHRcdCAgICBpZighaXNOYU4odG9rZW4pKXtcblx0XHRcdHRyZWUuYnJhbmNoX2xlbmd0aCA9IHBhcnNlRmxvYXQodG9rZW4pO1xuXHRcdCAgICB9XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHggPT0gJz0nKXtcblx0XHQgICAgdmFyIHgyID0gdG9rZW5zW2ktMl07XG5cdFx0ICAgIHN3aXRjaCh4Mil7XG5cdFx0ICAgIGNhc2UgJ0QnOlxuXHRcdFx0dHJlZS5kdXBsaWNhdGlvbiA9IHRva2VuO1xuXHRcdFx0YnJlYWs7XG5cdFx0ICAgIGNhc2UgJ0cnOlxuXHRcdFx0dHJlZS5nZW5lX2lkID0gdG9rZW47XG5cdFx0XHRicmVhaztcblx0XHQgICAgY2FzZSAnVCc6XG5cdFx0XHR0cmVlLnRheG9uX2lkID0gdG9rZW47XG5cdFx0XHRicmVhaztcblx0XHQgICAgZGVmYXVsdCA6XG5cdFx0XHR0cmVlW3Rva2Vuc1tpLTJdXSA9IHRva2VuO1xuXHRcdCAgICB9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdCAgICB2YXIgdGVzdDtcblxuXHRcdH1cblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdHJlZTtcbiAgICB9XG59O1xuIiwidmFyIG5vZGUgPSByZXF1aXJlKFwiLi9zcmMvbm9kZS5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IG5vZGU7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciBpdGVyYXRvciA9IHJlcXVpcmUoXCJ0bnQudXRpbHNcIikuaXRlcmF0b3I7XG5cbnZhciB0bnRfbm9kZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4vL3RudC50cmVlLm5vZGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIG5vZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobm9kZSk7XG5cbiAgICAvLyBBUElcbi8vICAgICBub2RlLm5vZGVzID0gZnVuY3Rpb24oKSB7XG4vLyBcdGlmIChjbHVzdGVyID09PSB1bmRlZmluZWQpIHtcbi8vIFx0ICAgIGNsdXN0ZXIgPSBkMy5sYXlvdXQuY2x1c3RlcigpXG4vLyBcdCAgICAvLyBUT0RPOiBsZW5ndGggYW5kIGNoaWxkcmVuIHNob3VsZCBiZSBleHBvc2VkIGluIHRoZSBBUElcbi8vIFx0ICAgIC8vIGkuZS4gdGhlIHVzZXIgc2hvdWxkIGJlIGFibGUgdG8gY2hhbmdlIHRoaXMgZGVmYXVsdHMgdmlhIHRoZSBBUElcbi8vIFx0ICAgIC8vIGNoaWxkcmVuIGlzIHRoZSBkZWZhdWx0cyBmb3IgcGFyc2VfbmV3aWNrLCBidXQgbWF5YmUgd2Ugc2hvdWxkIGNoYW5nZSB0aGF0XG4vLyBcdCAgICAvLyBvciBhdCBsZWFzdCBub3QgYXNzdW1lIHRoaXMgaXMgYWx3YXlzIHRoZSBjYXNlIGZvciB0aGUgZGF0YSBwcm92aWRlZFxuLy8gXHRcdC52YWx1ZShmdW5jdGlvbihkKSB7cmV0dXJuIGQubGVuZ3RofSlcbi8vIFx0XHQuY2hpbGRyZW4oZnVuY3Rpb24oZCkge3JldHVybiBkLmNoaWxkcmVufSk7XG4vLyBcdH1cbi8vIFx0bm9kZXMgPSBjbHVzdGVyLm5vZGVzKGRhdGEpO1xuLy8gXHRyZXR1cm4gbm9kZXM7XG4vLyAgICAgfTtcblxuICAgIHZhciBhcHBseV90b19kYXRhID0gZnVuY3Rpb24gKGRhdGEsIGNiYWspIHtcblx0Y2JhayhkYXRhKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRhcHBseV90b19kYXRhKGRhdGEuY2hpbGRyZW5baV0sIGNiYWspO1xuXHQgICAgfVxuXHR9XG4gICAgfTtcblxuICAgIHZhciBjcmVhdGVfaWRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgaSA9IGl0ZXJhdG9yKDEpO1xuXHQvLyBXZSBjYW4ndCB1c2UgYXBwbHkgYmVjYXVzZSBhcHBseSBjcmVhdGVzIG5ldyB0cmVlcyBvbiBldmVyeSBub2RlXG5cdC8vIFdlIHNob3VsZCB1c2UgdGhlIGRpcmVjdCBkYXRhIGluc3RlYWRcblx0YXBwbHlfdG9fZGF0YSAoZGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIGlmIChkLl9pZCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZC5faWQgPSBpKCk7XG5cdFx0Ly8gVE9ETzogTm90IHN1cmUgX2luU3ViVHJlZSBpcyBzdHJpY3RseSBuZWNlc3Nhcnlcblx0XHQvLyBkLl9pblN1YlRyZWUgPSB7cHJldjp0cnVlLCBjdXJyOnRydWV9O1xuXHQgICAgfVxuXHR9KTtcbiAgICB9O1xuXG4gICAgdmFyIGxpbmtfcGFyZW50cyA9IGZ1bmN0aW9uIChkYXRhKSB7XG5cdGlmIChkYXRhID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcblx0fVxuXHRpZiAoZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0Zm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIC8vIF9wYXJlbnQ/XG5cdCAgICBkYXRhLmNoaWxkcmVuW2ldLl9wYXJlbnQgPSBkYXRhO1xuXHQgICAgbGlua19wYXJlbnRzKGRhdGEuY2hpbGRyZW5baV0pO1xuXHR9XG4gICAgfTtcblxuICAgIHZhciBjb21wdXRlX3Jvb3RfZGlzdHMgPSBmdW5jdGlvbiAoZGF0YSkge1xuXHRhcHBseV90b19kYXRhIChkYXRhLCBmdW5jdGlvbiAoZCkge1xuXHQgICAgdmFyIGw7XG5cdCAgICBpZiAoZC5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0XHRkLl9yb290X2Rpc3QgPSAwO1xuXHQgICAgfSBlbHNlIHtcblx0XHR2YXIgbCA9IDA7XG5cdFx0aWYgKGQuYnJhbmNoX2xlbmd0aCkge1xuXHRcdCAgICBsID0gZC5icmFuY2hfbGVuZ3RoXG5cdFx0fVxuXHRcdGQuX3Jvb3RfZGlzdCA9IGwgKyBkLl9wYXJlbnQuX3Jvb3RfZGlzdDtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIC8vIFRPRE86IGRhdGEgY2FuJ3QgYmUgcmV3cml0dGVuIHVzZWQgdGhlIGFwaSB5ZXQuIFdlIG5lZWQgZmluYWxpemVyc1xuICAgIG5vZGUuZGF0YSA9IGZ1bmN0aW9uKG5ld19kYXRhKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGRhdGFcblx0fVxuXHRkYXRhID0gbmV3X2RhdGE7XG5cdGNyZWF0ZV9pZHMoKTtcblx0bGlua19wYXJlbnRzKGRhdGEpO1xuXHRjb21wdXRlX3Jvb3RfZGlzdHMoZGF0YSk7XG5cdHJldHVybiBub2RlO1xuICAgIH07XG4gICAgLy8gV2UgYmluZCB0aGUgZGF0YSB0aGF0IGhhcyBiZWVuIHBhc3NlZFxuICAgIG5vZGUuZGF0YShkYXRhKTtcblxuICAgIGFwaS5tZXRob2QgKCdmaW5kX2FsbCcsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdHZhciBub2RlcyA9IFtdO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikpIHtcblx0XHRub2Rlcy5wdXNoIChuKTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcbiAgICBcbiAgICBhcGkubWV0aG9kICgnZmluZF9ub2RlJywgZnVuY3Rpb24gKGNiYWssIGRlZXApIHtcblx0aWYgKGNiYWsobm9kZSkpIHtcblx0ICAgIHJldHVybiBub2RlO1xuXHR9XG5cblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaj0wOyBqPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHR2YXIgZm91bmQgPSB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2pdKS5maW5kX25vZGUoY2JhaywgZGVlcCk7XG5cdFx0aWYgKGZvdW5kKSB7XG5cdFx0ICAgIHJldHVybiBmb3VuZDtcblx0XHR9XG5cdCAgICB9XG5cdH1cblxuXHRpZiAoZGVlcCAmJiAoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLl9jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2ldKS5maW5kX25vZGUoY2JhaywgZGVlcClcblx0XHR2YXIgZm91bmQgPSB0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltpXSkuZmluZF9ub2RlKGNiYWssIGRlZXApO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF9ub2RlX2J5X25hbWUnLCBmdW5jdGlvbihuYW1lLCBkZWVwKSB7XG5cdHJldHVybiBub2RlLmZpbmRfbm9kZSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0ICAgIHJldHVybiBub2RlLm5vZGVfbmFtZSgpID09PSBuYW1lXG5cdH0sIGRlZXApO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3RvZ2dsZScsIGZ1bmN0aW9uKCkge1xuXHRpZiAoZGF0YSkge1xuXHQgICAgaWYgKGRhdGEuY2hpbGRyZW4pIHsgLy8gVW5jb2xsYXBzZWQgLT4gY29sbGFwc2Vcblx0XHR2YXIgaGlkZGVuID0gMDtcblx0XHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHRcdCAgICB2YXIgaGlkZGVuX2hlcmUgPSBuLm5faGlkZGVuKCkgfHwgMDtcblx0XHQgICAgaGlkZGVuICs9IChuLm5faGlkZGVuKCkgfHwgMCkgKyAxO1xuXHRcdH0pO1xuXHRcdG5vZGUubl9oaWRkZW4gKGhpZGRlbi0xKTtcblx0XHRkYXRhLl9jaGlsZHJlbiA9IGRhdGEuY2hpbGRyZW47XG5cdFx0ZGF0YS5jaGlsZHJlbiA9IHVuZGVmaW5lZDtcblx0ICAgIH0gZWxzZSB7ICAgICAgICAgICAgIC8vIENvbGxhcHNlZCAtPiB1bmNvbGxhcHNlXG5cdFx0bm9kZS5uX2hpZGRlbigwKTtcblx0XHRkYXRhLmNoaWxkcmVuID0gZGF0YS5fY2hpbGRyZW47XG5cdFx0ZGF0YS5fY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfY29sbGFwc2VkJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQgJiYgZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKTtcbiAgICB9KTtcblxuICAgIHZhciBoYXNfYW5jZXN0b3IgPSBmdW5jdGlvbihuLCBhbmNlc3Rvcikge1xuXHQvLyBJdCBpcyBiZXR0ZXIgdG8gd29yayBhdCB0aGUgZGF0YSBsZXZlbFxuXHRuID0gbi5kYXRhKCk7XG5cdGFuY2VzdG9yID0gYW5jZXN0b3IuZGF0YSgpO1xuXHRpZiAobi5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybiBmYWxzZVxuXHR9XG5cdG4gPSBuLl9wYXJlbnRcblx0Zm9yICg7Oykge1xuXHQgICAgaWYgKG4gPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0ICAgIH1cblx0ICAgIGlmIChuID09PSBhbmNlc3Rvcikge1xuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgbiA9IG4uX3BhcmVudDtcblx0fVxuICAgIH07XG5cbiAgICAvLyBUaGlzIGlzIHRoZSBlYXNpZXN0IHdheSB0byBjYWxjdWxhdGUgdGhlIExDQSBJIGNhbiB0aGluayBvZi4gQnV0IGl0IGlzIHZlcnkgaW5lZmZpY2llbnQgdG9vLlxuICAgIC8vIEl0IGlzIHdvcmtpbmcgZmluZSBieSBub3csIGJ1dCBpbiBjYXNlIGl0IG5lZWRzIHRvIGJlIG1vcmUgcGVyZm9ybWFudCB3ZSBjYW4gaW1wbGVtZW50IHRoZSBMQ0FcbiAgICAvLyBhbGdvcml0aG0gZXhwbGFpbmVkIGhlcmU6XG4gICAgLy8gaHR0cDovL2NvbW11bml0eS50b3Bjb2Rlci5jb20vdGM/bW9kdWxlPVN0YXRpYyZkMT10dXRvcmlhbHMmZDI9bG93ZXN0Q29tbW9uQW5jZXN0b3JcbiAgICBhcGkubWV0aG9kICgnbGNhJywgZnVuY3Rpb24gKG5vZGVzKSB7XG5cdGlmIChub2Rlcy5sZW5ndGggPT09IDEpIHtcblx0ICAgIHJldHVybiBub2Rlc1swXTtcblx0fVxuXHR2YXIgbGNhX25vZGUgPSBub2Rlc1swXTtcblx0Zm9yICh2YXIgaSA9IDE7IGk8bm9kZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIGxjYV9ub2RlID0gX2xjYShsY2Ffbm9kZSwgbm9kZXNbaV0pO1xuXHR9XG5cdHJldHVybiBsY2Ffbm9kZTtcblx0Ly8gcmV0dXJuIHRudF9ub2RlKGxjYV9ub2RlKTtcbiAgICB9KTtcblxuICAgIHZhciBfbGNhID0gZnVuY3Rpb24obm9kZTEsIG5vZGUyKSB7XG5cdGlmIChub2RlMS5kYXRhKCkgPT09IG5vZGUyLmRhdGEoKSkge1xuXHQgICAgcmV0dXJuIG5vZGUxO1xuXHR9XG5cdGlmIChoYXNfYW5jZXN0b3Iobm9kZTEsIG5vZGUyKSkge1xuXHQgICAgcmV0dXJuIG5vZGUyO1xuXHR9XG5cdHJldHVybiBfbGNhKG5vZGUxLCBub2RlMi5wYXJlbnQoKSk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QoJ25faGlkZGVuJywgZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBub2RlLnByb3BlcnR5KCdfaGlkZGVuJyk7XG5cdH1cblx0bm9kZS5wcm9wZXJ0eSgnX2hpZGRlbicsIHZhbCk7XG5cdHJldHVybiBub2RlXG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZ2V0X2FsbF9ub2RlcycsIGZ1bmN0aW9uIChkZWVwKSB7XG5cdHZhciBub2RlcyA9IFtdO1xuXHRub2RlLmFwcGx5KGZ1bmN0aW9uIChuKSB7XG5cdCAgICBub2Rlcy5wdXNoKG4pO1xuXHR9LCBkZWVwKTtcblx0cmV0dXJuIG5vZGVzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbGVhdmVzJywgZnVuY3Rpb24gKGRlZXApIHtcblx0dmFyIGxlYXZlcyA9IFtdO1xuXHRub2RlLmFwcGx5KGZ1bmN0aW9uIChuKSB7XG5cdCAgICBpZiAobi5pc19sZWFmKGRlZXApKSB7XG5cdFx0bGVhdmVzLnB1c2gobik7XG5cdCAgICB9XG5cdH0sIGRlZXApO1xuXHRyZXR1cm4gbGVhdmVzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3Vwc3RyZWFtJywgZnVuY3Rpb24oY2Jhaykge1xuXHRjYmFrKG5vZGUpO1xuXHR2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnQoKTtcblx0aWYgKHBhcmVudCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBwYXJlbnQudXBzdHJlYW0oY2Jhayk7XG5cdH1cbi8vXHR0bnRfbm9kZShwYXJlbnQpLnVwc3RyZWFtKGNiYWspO1xuLy8gXHRub2RlLnVwc3RyZWFtKG5vZGUuX3BhcmVudCwgY2Jhayk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnc3VidHJlZScsIGZ1bmN0aW9uKG5vZGVzLCBrZWVwX3NpbmdsZXRvbnMpIHtcblx0aWYgKGtlZXBfc2luZ2xldG9ucyA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICBrZWVwX3NpbmdsZXRvbnMgPSBmYWxzZTtcblx0fVxuICAgIFx0dmFyIG5vZGVfY291bnRzID0ge307XG4gICAgXHRmb3IgKHZhciBpPTA7IGk8bm9kZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBuID0gbm9kZXNbaV07XG5cdCAgICBpZiAobiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0bi51cHN0cmVhbSAoZnVuY3Rpb24gKHRoaXNfbm9kZSl7XG5cdFx0ICAgIHZhciBpZCA9IHRoaXNfbm9kZS5pZCgpO1xuXHRcdCAgICBpZiAobm9kZV9jb3VudHNbaWRdID09PSB1bmRlZmluZWQpIHtcblx0XHRcdG5vZGVfY291bnRzW2lkXSA9IDA7XG5cdFx0ICAgIH1cblx0XHQgICAgbm9kZV9jb3VudHNbaWRdKytcbiAgICBcdFx0fSk7XG5cdCAgICB9XG4gICAgXHR9XG4gICAgXG5cdHZhciBpc19zaW5nbGV0b24gPSBmdW5jdGlvbiAobm9kZV9kYXRhKSB7XG5cdCAgICB2YXIgbl9jaGlsZHJlbiA9IDA7XG5cdCAgICBpZiAobm9kZV9kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bm9kZV9kYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIGlkID0gbm9kZV9kYXRhLmNoaWxkcmVuW2ldLl9pZDtcblx0XHRpZiAobm9kZV9jb3VudHNbaWRdID4gMCkge1xuXHRcdCAgICBuX2NoaWxkcmVuKys7XG5cdFx0fVxuXHQgICAgfVxuXHQgICAgcmV0dXJuIG5fY2hpbGRyZW4gPT09IDE7XG5cdH07XG5cblx0dmFyIHN1YnRyZWUgPSB7fTtcblx0Y29weV9kYXRhIChkYXRhLCBzdWJ0cmVlLCAwLCBmdW5jdGlvbiAobm9kZV9kYXRhKSB7XG5cdCAgICB2YXIgbm9kZV9pZCA9IG5vZGVfZGF0YS5faWQ7XG5cdCAgICB2YXIgY291bnRzID0gbm9kZV9jb3VudHNbbm9kZV9pZF07XG5cdCAgICBcblx0ICAgIC8vIElzIGluIHBhdGhcblx0ICAgIGlmIChjb3VudHMgPiAwKSB7XG5cdFx0aWYgKGlzX3NpbmdsZXRvbihub2RlX2RhdGEpICYmICFrZWVwX3NpbmdsZXRvbnMpIHtcblx0XHQgICAgcmV0dXJuIGZhbHNlOyBcblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdCAgICB9XG5cdCAgICAvLyBJcyBub3QgaW4gcGF0aFxuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHR9KTtcblxuXHRyZXR1cm4gdG50X25vZGUoc3VidHJlZS5jaGlsZHJlblswXSk7XG4gICAgfSk7XG5cbiAgICB2YXIgY29weV9kYXRhID0gZnVuY3Rpb24gKG9yaWdfZGF0YSwgc3VidHJlZSwgY3VyckJyYW5jaExlbmd0aCwgY29uZGl0aW9uKSB7XG4gICAgICAgIGlmIChvcmlnX2RhdGEgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmRpdGlvbihvcmlnX2RhdGEpKSB7XG5cdCAgICB2YXIgY29weSA9IGNvcHlfbm9kZShvcmlnX2RhdGEsIGN1cnJCcmFuY2hMZW5ndGgpO1xuXHQgICAgaWYgKHN1YnRyZWUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHN1YnRyZWUuY2hpbGRyZW4gPSBbXTtcblx0ICAgIH1cblx0ICAgIHN1YnRyZWUuY2hpbGRyZW4ucHVzaChjb3B5KTtcblx0ICAgIGlmIChvcmlnX2RhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgIH1cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3JpZ19kYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29weV9kYXRhIChvcmlnX2RhdGEuY2hpbGRyZW5baV0sIGNvcHksIDAsIGNvbmRpdGlvbik7XG5cdCAgICB9XG4gICAgICAgIH0gZWxzZSB7XG5cdCAgICBpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICBjdXJyQnJhbmNoTGVuZ3RoICs9IG9yaWdfZGF0YS5icmFuY2hfbGVuZ3RoIHx8IDA7XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvcHlfZGF0YShvcmlnX2RhdGEuY2hpbGRyZW5baV0sIHN1YnRyZWUsIGN1cnJCcmFuY2hMZW5ndGgsIGNvbmRpdGlvbik7XG5cdCAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGNvcHlfbm9kZSA9IGZ1bmN0aW9uIChub2RlX2RhdGEsIGV4dHJhQnJhbmNoTGVuZ3RoKSB7XG5cdHZhciBjb3B5ID0ge307XG5cdC8vIGNvcHkgYWxsIHRoZSBvd24gcHJvcGVydGllcyBleGNlcHRzIGxpbmtzIHRvIG90aGVyIG5vZGVzIG9yIGRlcHRoXG5cdGZvciAodmFyIHBhcmFtIGluIG5vZGVfZGF0YSkge1xuXHQgICAgaWYgKChwYXJhbSA9PT0gXCJjaGlsZHJlblwiKSB8fFxuXHRcdChwYXJhbSA9PT0gXCJfY2hpbGRyZW5cIikgfHxcblx0XHQocGFyYW0gPT09IFwiX3BhcmVudFwiKSB8fFxuXHRcdChwYXJhbSA9PT0gXCJkZXB0aFwiKSkge1xuXHRcdGNvbnRpbnVlO1xuXHQgICAgfVxuXHQgICAgaWYgKG5vZGVfZGF0YS5oYXNPd25Qcm9wZXJ0eShwYXJhbSkpIHtcblx0XHRjb3B5W3BhcmFtXSA9IG5vZGVfZGF0YVtwYXJhbV07XG5cdCAgICB9XG5cdH1cblx0aWYgKChjb3B5LmJyYW5jaF9sZW5ndGggIT09IHVuZGVmaW5lZCkgJiYgKGV4dHJhQnJhbmNoTGVuZ3RoICE9PSB1bmRlZmluZWQpKSB7XG5cdCAgICBjb3B5LmJyYW5jaF9sZW5ndGggKz0gZXh0cmFCcmFuY2hMZW5ndGg7XG5cdH1cblx0cmV0dXJuIGNvcHk7XG4gICAgfTtcblxuICAgIFxuICAgIC8vIFRPRE86IFRoaXMgbWV0aG9kIHZpc2l0cyBhbGwgdGhlIG5vZGVzXG4gICAgLy8gYSBtb3JlIHBlcmZvcm1hbnQgdmVyc2lvbiBzaG91bGQgcmV0dXJuIHRydWVcbiAgICAvLyB0aGUgZmlyc3QgdGltZSBjYmFrKG5vZGUpIGlzIHRydWVcbiAgICBhcGkubWV0aG9kICgncHJlc2VudCcsIGZ1bmN0aW9uIChjYmFrKSB7XG5cdC8vIGNiYWsgc2hvdWxkIHJldHVybiB0cnVlL2ZhbHNlXG5cdHZhciBpc190cnVlID0gZmFsc2U7XG5cdG5vZGUuYXBwbHkgKGZ1bmN0aW9uIChuKSB7XG5cdCAgICBpZiAoY2JhayhuKSA9PT0gdHJ1ZSkge1xuXHRcdGlzX3RydWUgPSB0cnVlO1xuXHQgICAgfVxuXHR9KTtcblx0cmV0dXJuIGlzX3RydWU7XG4gICAgfSk7XG5cbiAgICAvLyBjYmFrIGlzIGNhbGxlZCB3aXRoIHR3byBub2Rlc1xuICAgIC8vIGFuZCBzaG91bGQgcmV0dXJuIGEgbmVnYXRpdmUgbnVtYmVyLCAwIG9yIGEgcG9zaXRpdmUgbnVtYmVyXG4gICAgYXBpLm1ldGhvZCAoJ3NvcnQnLCBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHR2YXIgbmV3X2NoaWxkcmVuID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBuZXdfY2hpbGRyZW4ucHVzaCh0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2ldKSk7XG5cdH1cblxuXHRuZXdfY2hpbGRyZW4uc29ydChjYmFrKTtcblxuXHRkYXRhLmNoaWxkcmVuID0gW107XG5cdGZvciAodmFyIGk9MDsgaTxuZXdfY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0ICAgIGRhdGEuY2hpbGRyZW4ucHVzaChuZXdfY2hpbGRyZW5baV0uZGF0YSgpKTtcblx0fVxuXG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB0bnRfbm9kZShkYXRhLmNoaWxkcmVuW2ldKS5zb3J0KGNiYWspO1xuXHR9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmxhdHRlbicsIGZ1bmN0aW9uIChwcmVzZXJ2ZV9pbnRlcm5hbCkge1xuXHRpZiAobm9kZS5pc19sZWFmKCkpIHtcblx0ICAgIHJldHVybiBub2RlO1xuXHR9XG5cdHZhciBkYXRhID0gbm9kZS5kYXRhKCk7XG5cdHZhciBuZXdyb290ID0gY29weV9ub2RlKGRhdGEpO1xuXHR2YXIgbm9kZXM7XG5cdGlmIChwcmVzZXJ2ZV9pbnRlcm5hbCkge1xuXHQgICAgbm9kZXMgPSBub2RlLmdldF9hbGxfbm9kZXMoKTtcblx0ICAgIG5vZGVzLnNoaWZ0KCk7IC8vIHRoZSBzZWxmIG5vZGUgaXMgYWxzbyBpbmNsdWRlZFxuXHR9IGVsc2Uge1xuXHQgICAgbm9kZXMgPSBub2RlLmdldF9hbGxfbGVhdmVzKCk7XG5cdH1cblx0bmV3cm9vdC5jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8bm9kZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgIGRlbGV0ZSAobm9kZXNbaV0uY2hpbGRyZW4pO1xuXHQgICAgbmV3cm9vdC5jaGlsZHJlbi5wdXNoKGNvcHlfbm9kZShub2Rlc1tpXS5kYXRhKCkpKTtcblx0fVxuXG5cdHJldHVybiB0bnRfbm9kZShuZXdyb290KTtcbiAgICB9KTtcblxuICAgIFxuICAgIC8vIFRPRE86IFRoaXMgbWV0aG9kIG9ubHkgJ2FwcGx5J3MgdG8gbm9uIGNvbGxhcHNlZCBub2RlcyAoaWUgLl9jaGlsZHJlbiBpcyBub3QgdmlzaXRlZClcbiAgICAvLyBXb3VsZCBpdCBiZSBiZXR0ZXIgdG8gaGF2ZSBhbiBleHRyYSBmbGFnICh0cnVlL2ZhbHNlKSB0byB2aXNpdCBhbHNvIGNvbGxhcHNlZCBub2Rlcz9cbiAgICBhcGkubWV0aG9kICgnYXBwbHknLCBmdW5jdGlvbihjYmFrLCBkZWVwKSB7XG5cdGlmIChkZWVwID09PSB1bmRlZmluZWQpIHtcblx0ICAgIGRlZXAgPSBmYWxzZTtcblx0fVxuXHRjYmFrKG5vZGUpO1xuXHRpZiAoZGF0YS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBuID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSlcblx0XHRuLmFwcGx5KGNiYWssIGRlZXApO1xuXHQgICAgfVxuXHR9XG5cblx0aWYgKChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSAmJiBkZWVwKSB7XG5cdCAgICBmb3IgKHZhciBqPTA7IGo8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHR2YXIgbiA9IHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2pdKTtcblx0XHRuLmFwcGx5KGNiYWssIGRlZXApO1xuXHQgICAgfVxuXHR9XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBOb3Qgc3VyZSBpZiBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdmlhIGEgY2FsbGJhY2s6XG4gICAgLy8gcm9vdC5wcm9wZXJ0eSAoZnVuY3Rpb24gKG5vZGUsIHZhbCkge1xuICAgIC8vICAgIG5vZGUuZGVlcGVyLmZpZWxkID0gdmFsXG4gICAgLy8gfSwgJ25ld192YWx1ZScpXG4gICAgYXBpLm1ldGhvZCAoJ3Byb3BlcnR5JywgZnVuY3Rpb24ocHJvcCwgdmFsdWUpIHtcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcblx0ICAgIGlmICgodHlwZW9mIHByb3ApID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0cmV0dXJuIHByb3AoZGF0YSlcdFxuXHQgICAgfVxuXHQgICAgcmV0dXJuIGRhdGFbcHJvcF1cblx0fVxuXHRpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgcHJvcChkYXRhLCB2YWx1ZSk7ICAgXG5cdH1cblx0ZGF0YVtwcm9wXSA9IHZhbHVlO1xuXHRyZXR1cm4gbm9kZTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdpc19sZWFmJywgZnVuY3Rpb24oZGVlcCkge1xuXHRpZiAoZGVlcCkge1xuXHQgICAgcmV0dXJuICgoZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSAmJiAoZGF0YS5fY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkpO1xuXHR9XG5cdHJldHVybiBkYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQ7XG4gICAgfSk7XG5cbiAgICAvLyBJdCBsb29rcyBsaWtlIHRoZSBjbHVzdGVyIGNhbid0IGJlIHVzZWQgZm9yIGFueXRoaW5nIHVzZWZ1bCBoZXJlXG4gICAgLy8gSXQgaXMgbm93IGluY2x1ZGVkIGFzIGFuIG9wdGlvbmFsIHBhcmFtZXRlciB0byB0aGUgdG50LnRyZWUoKSBtZXRob2QgY2FsbFxuICAgIC8vIHNvIEknbSBjb21tZW50aW5nIHRoZSBnZXR0ZXJcbiAgICAvLyBub2RlLmNsdXN0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBcdHJldHVybiBjbHVzdGVyO1xuICAgIC8vIH07XG5cbiAgICAvLyBub2RlLmRlcHRoID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAvLyAgICAgcmV0dXJuIG5vZGUuZGVwdGg7XG4gICAgLy8gfTtcblxuLy8gICAgIG5vZGUubmFtZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4vLyAgICAgICAgIHJldHVybiBub2RlLm5hbWU7XG4vLyAgICAgfTtcblxuICAgIGFwaS5tZXRob2QgKCdpZCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ19pZCcpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ25vZGVfbmFtZScsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ25hbWUnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdicmFuY2hfbGVuZ3RoJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gbm9kZS5wcm9wZXJ0eSgnYnJhbmNoX2xlbmd0aCcpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3Jvb3RfZGlzdCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ19yb290X2Rpc3QnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdjaGlsZHJlbicsIGZ1bmN0aW9uIChkZWVwKSB7XG5cdHZhciBjaGlsZHJlbiA9IFtdO1xuXG5cdGlmIChkYXRhLmNoaWxkcmVuKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdGNoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHQgICAgfVxuXHR9XG5cdGlmICgoZGF0YS5fY2hpbGRyZW4pICYmIGRlZXApIHtcblx0ICAgIGZvciAodmFyIGo9MDsgajxkYXRhLl9jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuXHRcdGNoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5fY2hpbGRyZW5bal0pKTtcblx0ICAgIH1cblx0fVxuXHRpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG5cdCAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdHJldHVybiBjaGlsZHJlbjtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG5cdGlmIChkYXRhLl9wYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gdG50X25vZGUoZGF0YS5fcGFyZW50KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBub2RlO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0bnRfbm9kZTtcblxuIiwiLy8gaWYgKHR5cGVvZiB0bnQgPT09IFwidW5kZWZpbmVkXCIpIHtcbi8vICAgICBtb2R1bGUuZXhwb3J0cyA9IHRudCA9IHt9XG4vLyB9XG52YXIgdHJlZTtcbm1vZHVsZS5leHBvcnRzID0gdHJlZSA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC5qc1wiKTtcbnZhciBldmVudHN5c3RlbSA9IHJlcXVpcmUoXCJiaW9qcy1ldmVudHNcIik7XG5ldmVudHN5c3RlbS5taXhpbih0cmVlKTtcbi8vdG50LnV0aWxzID0gcmVxdWlyZShcInRudC51dGlsc1wiKTtcbi8vdG50LnRvb2x0aXAgPSByZXF1aXJlKFwidG50LnRvb2x0aXBcIik7XG4vL3RudC50cmVlID0gcmVxdWlyZShcIi4vc3JjL2luZGV4LmpzXCIpO1xuXG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKCd0bnQuYXBpJyk7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLmRpYWdvbmFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBkID0gZnVuY3Rpb24gKGRpYWdvbmFsUGF0aCkge1xuICAgICAgICB2YXIgc291cmNlID0gZGlhZ29uYWxQYXRoLnNvdXJjZTtcbiAgICAgICAgdmFyIHRhcmdldCA9IGRpYWdvbmFsUGF0aC50YXJnZXQ7XG4gICAgICAgIHZhciBtaWRwb2ludFggPSAoc291cmNlLnggKyB0YXJnZXQueCkgLyAyO1xuICAgICAgICB2YXIgbWlkcG9pbnRZID0gKHNvdXJjZS55ICsgdGFyZ2V0LnkpIC8gMjtcbiAgICAgICAgdmFyIHBhdGhEYXRhID0gW3NvdXJjZSwge3g6IHRhcmdldC54LCB5OiBzb3VyY2UueX0sIHRhcmdldF07XG4gICAgICAgIHBhdGhEYXRhID0gcGF0aERhdGEubWFwKGQucHJvamVjdGlvbigpKTtcbiAgICAgICAgcmV0dXJuIGQucGF0aCgpKHBhdGhEYXRhLCByYWRpYWxfY2FsYy5jYWxsKHRoaXMscGF0aERhdGEpKTtcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChkKVxuICAgIFx0LmdldHNldCAoJ3Byb2plY3Rpb24nKVxuICAgIFx0LmdldHNldCAoJ3BhdGgnKTtcblxuICAgIHZhciBjb29yZGluYXRlVG9BbmdsZSA9IGZ1bmN0aW9uIChjb29yZCwgcmFkaXVzKSB7XG4gICAgICBcdHZhciB3aG9sZUFuZ2xlID0gMiAqIE1hdGguUEksXG4gICAgICAgIHF1YXJ0ZXJBbmdsZSA9IHdob2xlQW5nbGUgLyA0O1xuXG4gICAgICBcdHZhciBjb29yZFF1YWQgPSBjb29yZFswXSA+PSAwID8gKGNvb3JkWzFdID49IDAgPyAxIDogMikgOiAoY29vcmRbMV0gPj0gMCA/IDQgOiAzKSxcbiAgICAgICAgY29vcmRCYXNlQW5nbGUgPSBNYXRoLmFicyhNYXRoLmFzaW4oY29vcmRbMV0gLyByYWRpdXMpKTtcblxuICAgICAgXHQvLyBTaW5jZSB0aGlzIGlzIGp1c3QgYmFzZWQgb24gdGhlIGFuZ2xlIG9mIHRoZSByaWdodCB0cmlhbmdsZSBmb3JtZWRcbiAgICAgIFx0Ly8gYnkgdGhlIGNvb3JkaW5hdGUgYW5kIHRoZSBvcmlnaW4sIGVhY2ggcXVhZCB3aWxsIGhhdmUgZGlmZmVyZW50XG4gICAgICBcdC8vIG9mZnNldHNcbiAgICAgIFx0dmFyIGNvb3JkQW5nbGU7XG4gICAgICBcdHN3aXRjaCAoY29vcmRRdWFkKSB7XG4gICAgICBcdGNhc2UgMTpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSBxdWFydGVyQW5nbGUgLSBjb29yZEJhc2VBbmdsZTtcbiAgICAgIFx0ICAgIGJyZWFrO1xuICAgICAgXHRjYXNlIDI6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gcXVhcnRlckFuZ2xlICsgY29vcmRCYXNlQW5nbGU7XG4gICAgICBcdCAgICBicmVhaztcbiAgICAgIFx0Y2FzZSAzOlxuICAgICAgXHQgICAgY29vcmRBbmdsZSA9IDIqcXVhcnRlckFuZ2xlICsgcXVhcnRlckFuZ2xlIC0gY29vcmRCYXNlQW5nbGU7XG4gICAgICBcdCAgICBicmVhaztcbiAgICAgIFx0Y2FzZSA0OlxuICAgICAgXHQgICAgY29vcmRBbmdsZSA9IDMqcXVhcnRlckFuZ2xlICsgY29vcmRCYXNlQW5nbGU7XG4gICAgICBcdH1cbiAgICAgIFx0cmV0dXJuIGNvb3JkQW5nbGU7XG4gICAgfTtcblxuICAgIHZhciByYWRpYWxfY2FsYyA9IGZ1bmN0aW9uIChwYXRoRGF0YSkge1xuICAgICAgICB2YXIgc3JjID0gcGF0aERhdGFbMF07XG4gICAgICAgIHZhciBtaWQgPSBwYXRoRGF0YVsxXTtcbiAgICAgICAgdmFyIGRzdCA9IHBhdGhEYXRhWzJdO1xuICAgICAgICB2YXIgcmFkaXVzID0gTWF0aC5zcXJ0KHNyY1swXSpzcmNbMF0gKyBzcmNbMV0qc3JjWzFdKTtcbiAgICAgICAgdmFyIHNyY0FuZ2xlID0gY29vcmRpbmF0ZVRvQW5nbGUoc3JjLCByYWRpdXMpO1xuICAgICAgICB2YXIgbWlkQW5nbGUgPSBjb29yZGluYXRlVG9BbmdsZShtaWQsIHJhZGl1cyk7XG4gICAgICAgIHZhciBjbG9ja3dpc2UgPSBNYXRoLmFicyhtaWRBbmdsZSAtIHNyY0FuZ2xlKSA+IE1hdGguUEkgPyBtaWRBbmdsZSA8PSBzcmNBbmdsZSA6IG1pZEFuZ2xlID4gc3JjQW5nbGU7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByYWRpdXMgICA6IHJhZGl1cyxcbiAgICAgICAgICAgIGNsb2Nrd2lzZSA6IGNsb2Nrd2lzZVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICByZXR1cm4gZDtcbn07XG5cbi8vIHZlcnRpY2FsIGRpYWdvbmFsIGZvciByZWN0IGJyYW5jaGVzXG50cmVlLmRpYWdvbmFsLnZlcnRpY2FsID0gZnVuY3Rpb24gKHVzZUFyYykge1xuICAgIHZhciBwYXRoID0gZnVuY3Rpb24ocGF0aERhdGEsIG9iaikge1xuICAgICAgICB2YXIgc3JjID0gcGF0aERhdGFbMF07XG4gICAgICAgIHZhciBtaWQgPSBwYXRoRGF0YVsxXTtcbiAgICAgICAgdmFyIGRzdCA9IHBhdGhEYXRhWzJdO1xuICAgICAgICB2YXIgcmFkaXVzID0gKG1pZFsxXSAtIHNyY1sxXSkgKiAyMDAwO1xuXG4gICAgICAgIHJldHVybiBcIk1cIiArIHNyYyArIFwiIEFcIiArIFtyYWRpdXMscmFkaXVzXSArIFwiIDAgMCwwIFwiICsgbWlkICsgXCJNXCIgKyBtaWQgKyBcIkxcIiArIGRzdDtcbiAgICAgICAgLy8gcmV0dXJuIFwiTVwiICsgc3JjICsgXCIgTFwiICsgbWlkICsgXCIgTFwiICsgZHN0O1xuICAgIH07XG5cbiAgICB2YXIgcHJvamVjdGlvbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIFtkLnksIGQueF07XG4gICAgfTtcblxuICAgIHJldHVybiB0cmVlLmRpYWdvbmFsKClcbiAgICAgIFx0LnBhdGgocGF0aClcbiAgICAgIFx0LnByb2plY3Rpb24ocHJvamVjdGlvbik7XG59O1xuXG50cmVlLmRpYWdvbmFsLnJhZGlhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcGF0aCA9IGZ1bmN0aW9uKHBhdGhEYXRhLCBvYmopIHtcbiAgICAgICAgdmFyIHNyYyA9IHBhdGhEYXRhWzBdO1xuICAgICAgICB2YXIgbWlkID0gcGF0aERhdGFbMV07XG4gICAgICAgIHZhciBkc3QgPSBwYXRoRGF0YVsyXTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IG9iai5yYWRpdXM7XG4gICAgICAgIHZhciBjbG9ja3dpc2UgPSBvYmouY2xvY2t3aXNlO1xuXG4gICAgICAgIGlmIChjbG9ja3dpc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBcIk1cIiArIHNyYyArIFwiIEFcIiArIFtyYWRpdXMscmFkaXVzXSArIFwiIDAgMCwwIFwiICsgbWlkICsgXCJNXCIgKyBtaWQgKyBcIkxcIiArIGRzdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIk1cIiArIG1pZCArIFwiIEFcIiArIFtyYWRpdXMscmFkaXVzXSArIFwiIDAgMCwwIFwiICsgc3JjICsgXCJNXCIgKyBtaWQgKyBcIkxcIiArIGRzdDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcHJvamVjdGlvbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgIFx0dmFyIHIgPSBkLnksIGEgPSAoZC54IC0gOTApIC8gMTgwICogTWF0aC5QSTtcbiAgICAgIFx0cmV0dXJuIFtyICogTWF0aC5jb3MoYSksIHIgKiBNYXRoLnNpbihhKV07XG4gICAgfTtcblxuICAgIHJldHVybiB0cmVlLmRpYWdvbmFsKClcbiAgICAgIFx0LnBhdGgocGF0aClcbiAgICAgIFx0LnByb2plY3Rpb24ocHJvamVjdGlvbik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmRpYWdvbmFsO1xuIiwidmFyIHRyZWUgPSByZXF1aXJlIChcIi4vdHJlZS5qc1wiKTtcbnRyZWUubGFiZWwgPSByZXF1aXJlKFwiLi9sYWJlbC5qc1wiKTtcbnRyZWUuZGlhZ29uYWwgPSByZXF1aXJlKFwiLi9kaWFnb25hbC5qc1wiKTtcbnRyZWUubGF5b3V0ID0gcmVxdWlyZShcIi4vbGF5b3V0LmpzXCIpO1xudHJlZS5ub2RlX2Rpc3BsYXkgPSByZXF1aXJlKFwiLi9ub2RlX2Rpc3BsYXkuanNcIik7XG4vLyB0cmVlLm5vZGUgPSByZXF1aXJlKFwidG50LnRyZWUubm9kZVwiKTtcbi8vIHRyZWUucGFyc2VfbmV3aWNrID0gcmVxdWlyZShcInRudC5uZXdpY2tcIikucGFyc2VfbmV3aWNrO1xuLy8gdHJlZS5wYXJzZV9uaHggPSByZXF1aXJlKFwidG50Lm5ld2lja1wiKS5wYXJzZV9uaHg7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWU7XG5cbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5sYWJlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoIChcImNsaWNrXCIsIFwiZGJsY2xpY2tcIiwgXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiKVxuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgd2Ugc2hvdWxkIGJlIHJlbW92aW5nIGJ5IGRlZmF1bHQgcHJldiBsYWJlbHNcbiAgICAvLyBvciBpdCB3b3VsZCBiZSBiZXR0ZXIgdG8gaGF2ZSBhIHNlcGFyYXRlIHJlbW92ZSBtZXRob2QgY2FsbGVkIGJ5IHRoZSB2aXNcbiAgICAvLyBvbiB1cGRhdGVcbiAgICAvLyBXZSBhbHNvIGhhdmUgdGhlIHByb2JsZW0gdGhhdCB3ZSBtYXkgYmUgdHJhbnNpdGlvbmluZyBmcm9tXG4gICAgLy8gdGV4dCB0byBpbWcgbGFiZWxzIGFuZCB3ZSBuZWVkIHRvIHJlbW92ZSB0aGUgbGFiZWwgb2YgYSBkaWZmZXJlbnQgdHlwZVxuICAgIHZhciBsYWJlbCA9IGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSwgbm9kZV9zaXplKSB7XG4gICAgICAgIGlmICh0eXBlb2YgKG5vZGUpICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyhub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxhYmVsLmRpc3BsYXkoKS5jYWxsKHRoaXMsIG5vZGUsIGxheW91dF90eXBlKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX2xhYmVsXCIpXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHZhciB0ID0gbGFiZWwudHJhbnNmb3JtKCkobm9kZSwgbGF5b3V0X3R5cGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBcInRyYW5zbGF0ZSAoXCIgKyAodC50cmFuc2xhdGVbMF0gKyBub2RlX3NpemUpICsgXCIgXCIgKyB0LnRyYW5zbGF0ZVsxXSArIFwiKXJvdGF0ZShcIiArIHQucm90YXRlICsgXCIpXCI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAvLyBUT0RPOiB0aGlzIGNsaWNrIGV2ZW50IGlzIHByb2JhYmx5IG5ldmVyIGZpcmVkIHNpbmNlIHRoZXJlIGlzIGFuIG9uY2xpY2sgZXZlbnQgaW4gdGhlIG5vZGUgZyBlbGVtZW50P1xuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwodGhpcywgbm9kZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2guZGJsY2xpY2suY2FsbCh0aGlzLCBub2RlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwodGhpcywgbm9kZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbCh0aGlzLCBub2RlKVxuICAgICAgICAgICAgfSlcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcbiAgICAgICAgLmdldHNldCAoJ3dpZHRoJywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSB3aWR0aCBjYWxsYmFja1wiIH0pXG4gICAgICAgIC5nZXRzZXQgKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7IHRocm93IFwiTmVlZCBhIGhlaWdodCBjYWxsYmFja1wiIH0pXG4gICAgICAgIC5nZXRzZXQgKCdkaXNwbGF5JywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSBkaXNwbGF5IGNhbGxiYWNrXCIgfSlcbiAgICAgICAgLmdldHNldCAoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgdHJhbnNmb3JtIGNhbGxiYWNrXCIgfSlcbiAgICAgICAgLy8uZ2V0c2V0ICgnb25fY2xpY2snKTtcblxuICAgIHJldHVybiBkMy5yZWJpbmQgKGxhYmVsLCBkaXNwYXRjaCwgXCJvblwiKTtcbn07XG5cbi8vIFRleHQgYmFzZWQgbGFiZWxzXG50cmVlLmxhYmVsLnRleHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhYmVsID0gdHJlZS5sYWJlbCgpO1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcbiAgICAgICAgLmdldHNldCAoJ2ZvbnRzaXplJywgMTApXG4gICAgICAgIC5nZXRzZXQgKCdmb250d2VpZ2h0JywgXCJub3JtYWxcIilcbiAgICAgICAgLmdldHNldCAoJ2NvbG9yJywgXCIjMDAwXCIpXG4gICAgICAgIC5nZXRzZXQgKCd0ZXh0JywgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkLmRhdGEoKS5uYW1lO1xuICAgICAgICB9KVxuXG4gICAgbGFiZWwuZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG4gICAgICAgIHZhciBsID0gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChsYXlvdXRfdHlwZSA9PT0gXCJyYWRpYWxcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGQueCUzNjAgPCAxODApID8gXCJzdGFydFwiIDogXCJlbmRcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwic3RhcnRcIjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJldHVybiBsYWJlbC50ZXh0KCkobm9kZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3R5bGUoJ2ZvbnQtc2l6ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihsYWJlbC5mb250c2l6ZSgpKShub2RlKSArIFwicHhcIjtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3R5bGUoJ2ZvbnQtd2VpZ2h0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKGxhYmVsLmZvbnR3ZWlnaHQoKSkobm9kZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0eWxlKCdmaWxsJywgZDMuZnVuY3RvcihsYWJlbC5jb2xvcigpKShub2RlKSk7XG5cbiAgICAgICAgcmV0dXJuIGw7XG4gICAgfSk7XG5cbiAgICBsYWJlbC50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuICAgICAgICB2YXIgZCA9IG5vZGUuZGF0YSgpO1xuICAgICAgICB2YXIgdCA9IHtcbiAgICAgICAgICAgIHRyYW5zbGF0ZSA6IFs1LCA1XSxcbiAgICAgICAgICAgIHJvdGF0ZSA6IDBcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGxheW91dF90eXBlID09PSBcInJhZGlhbFwiKSB7XG4gICAgICAgICAgICB0LnRyYW5zbGF0ZVsxXSA9IHQudHJhbnNsYXRlWzFdIC0gKGQueCUzNjAgPCAxODAgPyAwIDogbGFiZWwuZm9udHNpemUoKSlcbiAgICAgICAgICAgIHQucm90YXRlID0gKGQueCUzNjAgPCAxODAgPyAwIDogMTgwKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH0pO1xuXG5cbiAgICAvLyBsYWJlbC50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgLy8gXHR2YXIgZCA9IG5vZGUuZGF0YSgpO1xuICAgIC8vIFx0cmV0dXJuIFwidHJhbnNsYXRlKDEwIDUpcm90YXRlKFwiICsgKGQueCUzNjAgPCAxODAgPyAwIDogMTgwKSArIFwiKVwiO1xuICAgIC8vIH0pO1xuXG4gICAgbGFiZWwud2lkdGggKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHZhciBzdmcgPSBkMy5zZWxlY3QoXCJib2R5XCIpXG4gICAgICAgICAgICAuYXBwZW5kKFwic3ZnXCIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCAwKVxuICAgICAgICAgICAgLnN0eWxlKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuXG4gICAgICAgIHZhciB0ZXh0ID0gc3ZnXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLnN0eWxlKCdmb250LXNpemUnLCBkMy5mdW5jdG9yKGxhYmVsLmZvbnRzaXplKCkpKG5vZGUpICsgXCJweFwiKVxuICAgICAgICAgICAgLnRleHQobGFiZWwudGV4dCgpKG5vZGUpKTtcblxuICAgICAgICB2YXIgd2lkdGggPSB0ZXh0Lm5vZGUoKS5nZXRCQm94KCkud2lkdGg7XG4gICAgICAgIHN2Zy5yZW1vdmUoKTtcblxuICAgICAgICByZXR1cm4gd2lkdGg7XG4gICAgfSk7XG5cbiAgICBsYWJlbC5oZWlnaHQgKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHJldHVybiBkMy5mdW5jdG9yKGxhYmVsLmZvbnRzaXplKCkpKG5vZGUpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxhYmVsO1xufTtcblxuXG4vLyBzdmcgYmFzZWQgbGFiZWxzXG50cmVlLmxhYmVsLnN2ZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFiZWwgPSB0cmVlLmxhYmVsKCk7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxhYmVsKVxuICAgICAgICAuZ2V0c2V0KFwiZWxlbWVudFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQuZGF0YSgpLmVsZW1lbnQ7XG4gICAgICAgIH0pO1xuICAgIGxhYmVsLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuICAgICAgICB2YXIgbiA9IGxhYmVsLmVsZW1lbnQoKShub2RlKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChuLm5vZGUoKSk7XG4gICAgICAgIHJldHVybiBuO1xuICAgIH0pO1xuICAgIGxhYmVsLnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG4gICAgICAgIHZhciBkID0gbm9kZS5kYXRhKCk7XG4gICAgICAgIHZhciB0ID0ge1xuICAgICAgICAgICAgdHJhbnNsYXRlIDogWzEwLCAoLWxhYmVsLmhlaWdodCgpKCkgLyAyKV0sXG4gICAgICAgICAgICByb3RhdGUgOiAwXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGxheW91dF90eXBlID09PSAncmFkaWFsJykge1xuICAgICAgICAgICAgdC50cmFuc2xhdGVbMF0gPSB0LnRyYW5zbGF0ZVswXSArIChkLnglMzYwIDwgMTgwID8gMCA6IGxhYmVsLndpZHRoKCkoKSksXG4gICAgICAgICAgICB0LnRyYW5zbGF0ZVsxXSA9IHQudHJhbnNsYXRlWzFdICsgKGQueCUzNjAgPCAxODAgPyAwIDogbGFiZWwuaGVpZ2h0KCkoKSksXG4gICAgICAgICAgICB0LnJvdGF0ZSA9IChkLnglMzYwIDwgMTgwID8gMCA6IDE4MClcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxhYmVsO1xufTtcblxuLy8gSW1hZ2UgYmFzZWQgbGFiZWxzXG50cmVlLmxhYmVsLmltZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFiZWwgPSB0cmVlLmxhYmVsKCk7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxhYmVsKVxuICAgICAgICAuZ2V0c2V0ICgnc3JjJywgZnVuY3Rpb24gKCkge30pXG5cbiAgICBsYWJlbC5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcbiAgICAgICAgaWYgKGxhYmVsLnNyYygpKG5vZGUpKSB7XG4gICAgICAgICAgICB2YXIgbCA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJpbWFnZVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgbGFiZWwud2lkdGgoKSgpKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGxhYmVsLmhlaWdodCgpKCkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ4bGluazpocmVmXCIsIGxhYmVsLnNyYygpKG5vZGUpKTtcbiAgICAgICAgICAgIHJldHVybiBsO1xuICAgICAgICB9XG4gICAgICAgIC8vIGZhbGxiYWNrIHRleHQgaW4gY2FzZSB0aGUgaW1nIGlzIG5vdCBmb3VuZD9cbiAgICAgICAgcmV0dXJuIGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgIC50ZXh0KFwiXCIpO1xuICAgIH0pO1xuXG4gICAgbGFiZWwudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcbiAgICAgICAgdmFyIGQgPSBub2RlLmRhdGEoKTtcbiAgICAgICAgdmFyIHQgPSB7XG4gICAgICAgICAgICB0cmFuc2xhdGUgOiBbMTAsICgtbGFiZWwuaGVpZ2h0KCkoKSAvIDIpXSxcbiAgICAgICAgICAgIHJvdGF0ZSA6IDBcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAobGF5b3V0X3R5cGUgPT09ICdyYWRpYWwnKSB7XG4gICAgICAgICAgICB0LnRyYW5zbGF0ZVswXSA9IHQudHJhbnNsYXRlWzBdICsgKGQueCUzNjAgPCAxODAgPyAwIDogbGFiZWwud2lkdGgoKSgpKSxcbiAgICAgICAgICAgIHQudHJhbnNsYXRlWzFdID0gdC50cmFuc2xhdGVbMV0gKyAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC5oZWlnaHQoKSgpKSxcbiAgICAgICAgICAgIHQucm90YXRlID0gKGQueCUzNjAgPCAxODAgPyAwIDogMTgwKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWw7XG59O1xuXG4vLyBMYWJlbHMgbWFkZSBvZiAyKyBzaW1wbGUgbGFiZWxzXG50cmVlLmxhYmVsLmNvbXBvc2l0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFiZWxzID0gW107XG5cbiAgICB2YXIgbGFiZWwgPSBmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUsIG5vZGVfc2l6ZSkge1xuICAgICAgICB2YXIgY3Vycl94b2Zmc2V0ID0gMDtcblxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZGlzcGxheSA9IGxhYmVsc1tpXTtcblxuICAgICAgICAgICAgKGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5LnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0c3VwZXIgPSBkaXNwbGF5Ll9zdXBlcl8udHJhbnNmb3JtKCkobm9kZSwgbGF5b3V0X3R5cGUpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0ZSA6IFtvZmZzZXQgKyB0c3VwZXIudHJhbnNsYXRlWzBdLCB0c3VwZXIudHJhbnNsYXRlWzFdXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdGF0ZSA6IHRzdXBlci5yb3RhdGVcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHQ7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pKGN1cnJfeG9mZnNldCk7XG5cbiAgICAgICAgICAgIGN1cnJfeG9mZnNldCArPSAxMDtcbiAgICAgICAgICAgIGN1cnJfeG9mZnNldCArPSBkaXNwbGF5LndpZHRoKCkobm9kZSk7XG5cbiAgICAgICAgICAgIGRpc3BsYXkuY2FsbCh0aGlzLCBub2RlLCBsYXlvdXRfdHlwZSwgbm9kZV9zaXplKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGxhYmVsKVxuXG4gICAgYXBpLm1ldGhvZCAoJ2FkZF9sYWJlbCcsIGZ1bmN0aW9uIChkaXNwbGF5LCBub2RlKSB7XG4gICAgICAgIGRpc3BsYXkuX3N1cGVyXyA9IHt9O1xuICAgICAgICBhcGlqcyAoZGlzcGxheS5fc3VwZXJfKVxuICAgICAgICAgICAgLmdldCAoJ3RyYW5zZm9ybScsIGRpc3BsYXkudHJhbnNmb3JtKCkpO1xuXG4gICAgICAgIGxhYmVscy5wdXNoKGRpc3BsYXkpO1xuICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnd2lkdGgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIHRvdF93aWR0aCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdG90X3dpZHRoICs9IHBhcnNlSW50KGxhYmVsc1tpXS53aWR0aCgpKG5vZGUpKTtcbiAgICAgICAgICAgICAgICB0b3Rfd2lkdGggKz0gcGFyc2VJbnQobGFiZWxzW2ldLl9zdXBlcl8udHJhbnNmb3JtKCkobm9kZSkudHJhbnNsYXRlWzBdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRvdF93aWR0aDtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2hlaWdodCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbWF4X2hlaWdodCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8bGFiZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJfaGVpZ2h0ID0gbGFiZWxzW2ldLmhlaWdodCgpKG5vZGUpO1xuICAgICAgICAgICAgICAgIGlmICggY3Vycl9oZWlnaHQgPiBtYXhfaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIG1heF9oZWlnaHQgPSBjdXJyX2hlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWF4X2hlaWdodDtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxhYmVsO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5sYWJlbDtcbiIsIi8vIEJhc2VkIG9uIHRoZSBjb2RlIGJ5IEtlbi1pY2hpIFVlZGEgaW4gaHR0cDovL2JsLm9ja3Mub3JnL2t1ZWRhLzEwMzY3NzYjZDMucGh5bG9ncmFtLmpzXG5cbnZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIGRpYWdvbmFsID0gcmVxdWlyZShcIi4vZGlhZ29uYWwuanNcIik7XG52YXIgdHJlZSA9IHt9O1xuXG50cmVlLmxheW91dCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBsID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcbiAgICBcdC5zb3J0KG51bGwpXG4gICAgXHQudmFsdWUoZnVuY3Rpb24gKGQpIHtyZXR1cm4gZC5sZW5ndGg7fSApXG4gICAgXHQuc2VwYXJhdGlvbihmdW5jdGlvbiAoKSB7cmV0dXJuIDE7fSk7XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKGwpXG4gICAgXHQuZ2V0c2V0ICgnc2NhbGUnLCB0cnVlKVxuICAgIFx0LmdldHNldCAoJ21heF9sZWFmX2xhYmVsX3dpZHRoJywgMClcbiAgICBcdC5tZXRob2QgKFwiY2x1c3RlclwiLCBjbHVzdGVyKVxuICAgIFx0Lm1ldGhvZCgneXNjYWxlJywgZnVuY3Rpb24gKCkge3Rocm93IFwieXNjYWxlIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwiO30pXG4gICAgXHQubWV0aG9kKCdhZGp1c3RfY2x1c3Rlcl9zaXplJywgZnVuY3Rpb24gKCkge3Rocm93IFwiYWRqdXN0X2NsdXN0ZXJfc2l6ZSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIjsgfSlcbiAgICBcdC5tZXRob2QoJ3dpZHRoJywgZnVuY3Rpb24gKCkge3Rocm93IFwid2lkdGggaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCI7fSlcbiAgICBcdC5tZXRob2QoJ2hlaWdodCcsIGZ1bmN0aW9uICgpIHt0aHJvdyBcImhlaWdodCBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIjt9KTtcblxuICAgIGFwaS5tZXRob2QoJ3NjYWxlX2JyYW5jaF9sZW5ndGhzJywgZnVuY3Rpb24gKGN1cnIpIHtcbiAgICBcdGlmIChsLnNjYWxlKCkgPT09IGZhbHNlKSB7XG4gICAgXHQgICAgcmV0dXJuO1xuICAgIFx0fVxuXG4gICAgXHR2YXIgbm9kZXMgPSBjdXJyLm5vZGVzO1xuICAgIFx0dmFyIHRyZWUgPSBjdXJyLnRyZWU7XG5cbiAgICBcdHZhciByb290X2Rpc3RzID0gbm9kZXMubWFwIChmdW5jdGlvbiAoZCkge1xuICAgIFx0ICAgIHJldHVybiBkLl9yb290X2Rpc3Q7XG4gICAgXHR9KTtcblxuICAgIFx0dmFyIHlzY2FsZSA9IGwueXNjYWxlKHJvb3RfZGlzdHMpO1xuICAgIFx0dHJlZS5hcHBseSAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICBcdCAgICBub2RlLnByb3BlcnR5KFwieVwiLCB5c2NhbGUobm9kZS5yb290X2Rpc3QoKSkpO1xuICAgIFx0fSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbDtcbn07XG5cbnRyZWUubGF5b3V0LnZlcnRpY2FsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYXlvdXQgPSB0cmVlLmxheW91dCgpO1xuICAgIC8vIEVsZW1lbnRzIGxpa2UgJ2xhYmVscycgZGVwZW5kIG9uIHRoZSBsYXlvdXQgdHlwZS4gVGhpcyBleHBvc2VzIGEgd2F5IG9mIGlkZW50aWZ5aW5nIHRoZSBsYXlvdXQgdHlwZVxuICAgIGxheW91dC50eXBlID0gXCJ2ZXJ0aWNhbFwiO1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYXlvdXQpXG4gICAgXHQuZ2V0c2V0ICgnd2lkdGgnLCAzNjApXG4gICAgXHQuZ2V0ICgndHJhbnNsYXRlX3ZpcycsIFsyMCwyMF0pXG4gICAgXHQubWV0aG9kICgnZGlhZ29uYWwnLCBkaWFnb25hbC52ZXJ0aWNhbClcbiAgICBcdC5tZXRob2QgKCd0cmFuc2Zvcm1fbm9kZScsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0ICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueSArIFwiLFwiICsgZC54ICsgXCIpXCI7XG4gICAgXHR9KTtcblxuICAgIGFwaS5tZXRob2QoJ2hlaWdodCcsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICBcdHJldHVybiAocGFyYW1zLm5fbGVhdmVzICogcGFyYW1zLmxhYmVsX2hlaWdodCk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kKCd5c2NhbGUnLCBmdW5jdGlvbiAoZGlzdHMpIHtcbiAgICBcdHJldHVybiBkMy5zY2FsZS5saW5lYXIoKVxuICAgIFx0ICAgIC5kb21haW4oWzAsIGQzLm1heChkaXN0cyldKVxuICAgIFx0ICAgIC5yYW5nZShbMCwgbGF5b3V0LndpZHRoKCkgLSAyMCAtIGxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aCgpXSk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kKCdhZGp1c3RfY2x1c3Rlcl9zaXplJywgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIFx0dmFyIGggPSBsYXlvdXQuaGVpZ2h0KHBhcmFtcyk7XG4gICAgXHR2YXIgdyA9IGxheW91dC53aWR0aCgpIC0gbGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKCkgLSBsYXlvdXQudHJhbnNsYXRlX3ZpcygpWzBdIC0gcGFyYW1zLmxhYmVsX3BhZGRpbmc7XG4gICAgXHRsYXlvdXQuY2x1c3Rlci5zaXplIChbaCx3XSk7XG4gICAgXHRyZXR1cm4gbGF5b3V0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxheW91dDtcbn07XG5cbnRyZWUubGF5b3V0LnJhZGlhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGF5b3V0ID0gdHJlZS5sYXlvdXQoKTtcbiAgICAvLyBFbGVtZW50cyBsaWtlICdsYWJlbHMnIGRlcGVuZCBvbiB0aGUgbGF5b3V0IHR5cGUuIFRoaXMgZXhwb3NlcyBhIHdheSBvZiBpZGVudGlmeWluZyB0aGUgbGF5b3V0IHR5cGVcbiAgICBsYXlvdXQudHlwZSA9ICdyYWRpYWwnO1xuXG4gICAgdmFyIGRlZmF1bHRfd2lkdGggPSAzNjA7XG4gICAgdmFyIHIgPSBkZWZhdWx0X3dpZHRoIC8gMjtcblxuICAgIHZhciBjb25mID0ge1xuICAgIFx0d2lkdGggOiAzNjBcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYXlvdXQpXG4gICAgXHQuZ2V0c2V0IChjb25mKVxuICAgIFx0LmdldHNldCAoJ3RyYW5zbGF0ZV92aXMnLCBbciwgcl0pIC8vIFRPRE86IDEuMyBzaG91bGQgYmUgcmVwbGFjZWQgYnkgYSBzZW5zaWJsZSB2YWx1ZVxuICAgIFx0Lm1ldGhvZCAoJ3RyYW5zZm9ybV9ub2RlJywgZnVuY3Rpb24gKGQpIHtcbiAgICBcdCAgICByZXR1cm4gXCJyb3RhdGUoXCIgKyAoZC54IC0gOTApICsgXCIpdHJhbnNsYXRlKFwiICsgZC55ICsgXCIpXCI7XG4gICAgXHR9KVxuICAgIFx0Lm1ldGhvZCAoJ2RpYWdvbmFsJywgZGlhZ29uYWwucmFkaWFsKVxuICAgIFx0Lm1ldGhvZCAoJ2hlaWdodCcsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNvbmYud2lkdGg7IH0pO1xuXG4gICAgLy8gQ2hhbmdlcyBpbiB3aWR0aCBhZmZlY3QgY2hhbmdlcyBpbiByXG4gICAgbGF5b3V0LndpZHRoLnRyYW5zZm9ybSAoZnVuY3Rpb24gKHZhbCkge1xuICAgIFx0ciA9IHZhbCAvIDI7XG4gICAgXHRsYXlvdXQuY2x1c3Rlci5zaXplKFszNjAsIHJdKTtcbiAgICBcdGxheW91dC50cmFuc2xhdGVfdmlzKFtyLCByXSk7XG4gICAgXHRyZXR1cm4gdmFsO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoXCJ5c2NhbGVcIiwgIGZ1bmN0aW9uIChkaXN0cykge1xuXHRyZXR1cm4gZDMuc2NhbGUubGluZWFyKClcblx0ICAgIC5kb21haW4oWzAsZDMubWF4KGRpc3RzKV0pXG5cdCAgICAucmFuZ2UoWzAsIHJdKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKFwiYWRqdXN0X2NsdXN0ZXJfc2l6ZVwiLCBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgXHRyID0gKGxheW91dC53aWR0aCgpLzIpIC0gbGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKCkgLSAyMDtcbiAgICBcdGxheW91dC5jbHVzdGVyLnNpemUoWzM2MCwgcl0pO1xuICAgIFx0cmV0dXJuIGxheW91dDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYXlvdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLmxheW91dDtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5ub2RlX2Rpc3BsYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgbiA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHZhciBwcm94eTtcbiAgICAgICAgdmFyIHRoaXNQcm94eSA9IGQzLnNlbGVjdCh0aGlzKS5zZWxlY3QoXCIudG50X3RyZWVfbm9kZV9wcm94eVwiKTtcbiAgICAgICAgaWYgKHRoaXNQcm94eVswXVswXSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcHJveHkgPSBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJlZV9ub2RlX3Byb3h5XCIpO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm94eSA9IHRoaXNQcm94eTtcbiAgICAgICAgfVxuXG4gICAgXHRuLmRpc3BsYXkoKS5jYWxsKHRoaXMsIG5vZGUpO1xuICAgICAgICB2YXIgc2l6ZSA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuICAgICAgICBwcm94eVxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsICgtc2l6ZSkpXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgKC1zaXplKSlcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgKHNpemUgKiAyKSlcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIChzaXplICogMikpXG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobilcbiAgICBcdC5nZXRzZXQoXCJzaXplXCIsIDQuNClcbiAgICBcdC5nZXRzZXQoXCJmaWxsXCIsIFwiYmxhY2tcIilcbiAgICBcdC5nZXRzZXQoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuICAgIFx0LmdldHNldChcInN0cm9rZV93aWR0aFwiLCBcIjFweFwiKVxuICAgIFx0LmdldHNldChcImRpc3BsYXlcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhyb3cgXCJkaXNwbGF5IGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwiO1xuICAgICAgICB9KTtcbiAgICBhcGkubWV0aG9kKFwicmVzZXRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAgIC5zZWxlY3RBbGwoXCIqOm5vdCgudG50X3RyZWVfbm9kZV9wcm94eSlcIilcbiAgICAgICAgICAgIC5yZW1vdmUoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkuY2lyY2xlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcblxuICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICBcdGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKG4uZmlsbCgpKShub2RlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlKCkpKG5vZGUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2Vfd2lkdGgoKSkobm9kZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ub2RlX2Rpc3BsYXlfZWxlbVwiKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkuc3F1YXJlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcblxuICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIHMgPSBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0ZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgIC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIC1zO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiAtcztcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIHMqMjtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBzKjI7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3Iobi5maWxsKCkpKG5vZGUpO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2UoKSkobm9kZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZV93aWR0aCgpKShub2RlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ub2RlX2Rpc3BsYXlfZWxlbVwiKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBuO1xufTtcblxudHJlZS5ub2RlX2Rpc3BsYXkudHJpYW5nbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuXG4gICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuXHR2YXIgcyA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuXHRkMy5zZWxlY3QodGhpcylcbiAgICAgICAgLmFwcGVuZChcInBvbHlnb25cIilcbiAgICAgICAgLmF0dHIoXCJwb2ludHNcIiwgKC1zKSArIFwiLDAgXCIgKyBzICsgXCIsXCIgKyAoLXMpICsgXCIgXCIgKyBzICsgXCIsXCIgKyBzKVxuICAgICAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKG4uZmlsbCgpKShub2RlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlKCkpKG5vZGUpO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2Vfd2lkdGgoKSkobm9kZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfbm9kZV9kaXNwbGF5X2VsZW1cIik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbjtcbn07XG5cbi8vIHRyZWUubm9kZV9kaXNwbGF5LmNvbmQgPSBmdW5jdGlvbiAoKSB7XG4vLyAgICAgdmFyIG4gPSB0cmVlLm5vZGVfZGlzcGxheSgpO1xuLy9cbi8vICAgICAvLyBjb25kaXRpb25zIGFyZSBvYmplY3RzIHdpdGhcbi8vICAgICAvLyBuYW1lIDogYSBuYW1lIGZvciB0aGlzIGRpc3BsYXlcbi8vICAgICAvLyBjYWxsYmFjazogdGhlIGNvbmRpdGlvbiB0byBhcHBseSAocmVjZWl2ZXMgYSB0bnQubm9kZSlcbi8vICAgICAvLyBkaXNwbGF5OiBhIG5vZGVfZGlzcGxheVxuLy8gICAgIHZhciBjb25kcyA9IFtdO1xuLy9cbi8vICAgICBuLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlKSB7XG4vLyAgICAgICAgIHZhciBzID0gZDMuZnVuY3RvcihuLnNpemUoKSkobm9kZSk7XG4vLyAgICAgICAgIGZvciAodmFyIGk9MDsgaTxjb25kcy5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICAgICAgdmFyIGNvbmQgPSBjb25kc1tpXTtcbi8vICAgICAgICAgICAgIC8vIEZvciBlYWNoIG5vZGUsIHRoZSBmaXJzdCBjb25kaXRpb24gbWV0IGlzIHVzZWRcbi8vICAgICAgICAgICAgIGlmIChkMy5mdW5jdG9yKGNvbmQuY2FsbGJhY2spLmNhbGwodGhpcywgbm9kZSkgPT09IHRydWUpIHtcbi8vICAgICAgICAgICAgICAgICBjb25kLmRpc3BsYXkuY2FsbCh0aGlzLCBub2RlKTtcbi8vICAgICAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfVxuLy8gICAgIH0pO1xuLy9cbi8vICAgICB2YXIgYXBpID0gYXBpanMobik7XG4vL1xuLy8gICAgIGFwaS5tZXRob2QoXCJhZGRcIiwgZnVuY3Rpb24gKG5hbWUsIGNiYWssIG5vZGVfZGlzcGxheSkge1xuLy8gICAgICAgICBjb25kcy5wdXNoKHsgbmFtZSA6IG5hbWUsXG4vLyAgICAgICAgICAgICBjYWxsYmFjayA6IGNiYWssXG4vLyAgICAgICAgICAgICBkaXNwbGF5IDogbm9kZV9kaXNwbGF5XG4vLyAgICAgICAgIH0pO1xuLy8gICAgICAgICByZXR1cm4gbjtcbi8vICAgICB9KTtcbi8vXG4vLyAgICAgYXBpLm1ldGhvZChcInJlc2V0XCIsIGZ1bmN0aW9uICgpIHtcbi8vICAgICAgICAgY29uZHMgPSBbXTtcbi8vICAgICAgICAgcmV0dXJuIG47XG4vLyAgICAgfSk7XG4vL1xuLy8gICAgIGFwaS5tZXRob2QoXCJ1cGRhdGVcIiwgZnVuY3Rpb24gKG5hbWUsIGNiYWssIG5ld19kaXNwbGF5KSB7XG4vLyAgICAgICAgIGZvciAodmFyIGk9MDsgaTxjb25kcy5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICAgICAgaWYgKGNvbmRzW2ldLm5hbWUgPT09IG5hbWUpIHtcbi8vICAgICAgICAgICAgICAgICBjb25kc1tpXS5jYWxsYmFjayA9IGNiYWs7XG4vLyAgICAgICAgICAgICAgICAgY29uZHNbaV0uZGlzcGxheSA9IG5ld19kaXNwbGF5O1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICB9XG4vLyAgICAgICAgIHJldHVybiBuO1xuLy8gICAgIH0pO1xuLy9cbi8vICAgICByZXR1cm4gbjtcbi8vXG4vLyB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlLm5vZGVfZGlzcGxheTtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUoXCJ0bnQuYXBpXCIpO1xudmFyIHRudF90cmVlX25vZGUgPSByZXF1aXJlKFwidG50LnRyZWUubm9kZVwiKTtcblxudmFyIHRyZWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaCAoXCJjbGlja1wiLCBcImRibGNsaWNrXCIsIFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJsb2FkXCIpO1xuXG4gICAgdmFyIGNvbmYgPSB7XG4gICAgICAgIGR1cmF0aW9uICAgICAgICAgOiA1MDAsICAgICAgLy8gRHVyYXRpb24gb2YgdGhlIHRyYW5zaXRpb25zXG4gICAgICAgIG5vZGVfZGlzcGxheSAgICAgOiB0cmVlLm5vZGVfZGlzcGxheS5jaXJjbGUoKSxcbiAgICAgICAgbGFiZWwgICAgICAgICAgICA6IHRyZWUubGFiZWwudGV4dCgpLFxuICAgICAgICBsYXlvdXQgICAgICAgICAgIDogdHJlZS5sYXlvdXQudmVydGljYWwoKSxcbiAgICAgICAgLy8gb25fY2xpY2sgICAgICAgICA6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICAvLyBvbl9kYmxfY2xpY2sgICAgIDogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIC8vIG9uX21vdXNlb3ZlciAgICAgOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgYnJhbmNoX2NvbG9yICAgICA6ICdibGFjaycsXG4gICAgICAgIGlkICAgICAgICAgICAgICAgOiBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQuX2lkO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIGZvY3VzZWQgbm9kZVxuICAgIC8vIFRPRE86IFdvdWxkIGl0IGJlIGJldHRlciB0byBoYXZlIG11bHRpcGxlIGZvY3VzZWQgbm9kZXM/IChpZSB1c2UgYW4gYXJyYXkpXG4gICAgLy8gdmFyIGZvY3VzZWRfbm9kZTtcblxuICAgIC8vIEV4dHJhIGRlbGF5IGluIHRoZSB0cmFuc2l0aW9ucyAoVE9ETzogTmVlZGVkPylcbiAgICB2YXIgZGVsYXkgPSAwO1xuXG4gICAgLy8gRWFzZSBvZiB0aGUgdHJhbnNpdGlvbnNcbiAgICB2YXIgZWFzZSA9IFwiY3ViaWMtaW4tb3V0XCI7XG5cbiAgICAvLyBUaGUgaWQgb2YgdGhlIHRyZWUgY29udGFpbmVyXG4gICAgdmFyIGRpdl9pZDtcblxuICAgIC8vIFRoZSB0cmVlIHZpc3VhbGl6YXRpb24gKHN2ZylcbiAgICB2YXIgc3ZnO1xuICAgIHZhciB2aXM7XG4gICAgdmFyIGxpbmtzX2c7XG4gICAgdmFyIG5vZGVzX2c7XG5cbiAgICAvLyBUT0RPOiBGb3Igbm93LCBjb3VudHMgYXJlIGdpdmVuIG9ubHkgZm9yIGxlYXZlc1xuICAgIC8vIGJ1dCBpdCBtYXkgYmUgZ29vZCB0byBhbGxvdyBjb3VudHMgZm9yIGludGVybmFsIG5vZGVzXG4gICAgdmFyIGNvdW50cyA9IHt9O1xuXG4gICAgLy8gVGhlIGZ1bGwgdHJlZVxuICAgIHZhciBiYXNlID0ge1xuICAgICAgICB0cmVlIDogdW5kZWZpbmVkLFxuICAgICAgICBkYXRhIDogdW5kZWZpbmVkLFxuICAgICAgICBub2RlcyA6IHVuZGVmaW5lZCxcbiAgICAgICAgbGlua3MgOiB1bmRlZmluZWRcbiAgICB9O1xuXG4gICAgLy8gVGhlIGN1cnIgdHJlZS4gTmVlZGVkIHRvIHJlLWNvbXB1dGUgdGhlIGxpbmtzIC8gbm9kZXMgcG9zaXRpb25zIG9mIHN1YnRyZWVzXG4gICAgdmFyIGN1cnIgPSB7XG4gICAgICAgIHRyZWUgOiB1bmRlZmluZWQsXG4gICAgICAgIGRhdGEgOiB1bmRlZmluZWQsXG4gICAgICAgIG5vZGVzIDogdW5kZWZpbmVkLFxuICAgICAgICBsaW5rcyA6IHVuZGVmaW5lZFxuICAgIH07XG5cbiAgICAvLyBUaGUgY2JhayByZXR1cm5lZFxuICAgIHZhciB0ID0gZnVuY3Rpb24gKGRpdikge1xuICAgIFx0ZGl2X2lkID0gZDMuc2VsZWN0KGRpdikuYXR0cihcImlkXCIpO1xuXG4gICAgICAgIHZhciB0cmVlX2RpdiA9IGQzLnNlbGVjdChkaXYpXG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgICAgICAuc3R5bGUoXCJ3aWR0aFwiLCAoY29uZi5sYXlvdXQud2lkdGgoKSArICBcInB4XCIpKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ncm91cERpdlwiKTtcblxuICAgIFx0dmFyIGNsdXN0ZXIgPSBjb25mLmxheW91dC5jbHVzdGVyO1xuXG4gICAgXHR2YXIgbl9sZWF2ZXMgPSBjdXJyLnRyZWUuZ2V0X2FsbF9sZWF2ZXMoKS5sZW5ndGg7XG5cbiAgICBcdHZhciBtYXhfbGVhZl9sYWJlbF9sZW5ndGggPSBmdW5jdGlvbiAodHJlZSkge1xuICAgIFx0ICAgIHZhciBtYXggPSAwO1xuICAgIFx0ICAgIHZhciBsZWF2ZXMgPSB0cmVlLmdldF9hbGxfbGVhdmVzKCk7XG4gICAgXHQgICAgZm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBsYWJlbF93aWR0aCA9IGNvbmYubGFiZWwud2lkdGgoKShsZWF2ZXNbaV0pICsgZDMuZnVuY3RvciAoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKShsZWF2ZXNbaV0pO1xuICAgICAgICAgICAgICAgIGlmIChsYWJlbF93aWR0aCA+IG1heCkge1xuICAgICAgICAgICAgICAgICAgICBtYXggPSBsYWJlbF93aWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgXHQgICAgfVxuICAgIFx0ICAgIHJldHVybiBtYXg7XG4gICAgXHR9O1xuXG4gICAgICAgIHZhciBtYXhfbGVhZl9ub2RlX2hlaWdodCA9IGZ1bmN0aW9uICh0cmVlKSB7XG4gICAgICAgICAgICB2YXIgbWF4ID0gMDtcbiAgICAgICAgICAgIHZhciBsZWF2ZXMgPSB0cmVlLmdldF9hbGxfbGVhdmVzKCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8bGVhdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGVfaGVpZ2h0ID0gZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKGxlYXZlc1tpXSkgKiAyO1xuICAgICAgICAgICAgICAgIHZhciBsYWJlbF9oZWlnaHQgPSBkMy5mdW5jdG9yKGNvbmYubGFiZWwuaGVpZ2h0KCkpKGxlYXZlc1tpXSk7XG5cbiAgICAgICAgICAgICAgICBtYXggPSBkMy5tYXgoW21heCwgbm9kZV9oZWlnaHQsIGxhYmVsX2hlaWdodF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1heDtcbiAgICAgICAgfTtcblxuICAgIFx0dmFyIG1heF9sYWJlbF9sZW5ndGggPSBtYXhfbGVhZl9sYWJlbF9sZW5ndGgoY3Vyci50cmVlKTtcbiAgICBcdGNvbmYubGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKG1heF9sYWJlbF9sZW5ndGgpO1xuXG4gICAgXHR2YXIgbWF4X25vZGVfaGVpZ2h0ID0gbWF4X2xlYWZfbm9kZV9oZWlnaHQoY3Vyci50cmVlKTtcblxuICAgIFx0Ly8gQ2x1c3RlciBzaXplIGlzIHRoZSByZXN1bHQgb2YuLi5cbiAgICBcdC8vIHRvdGFsIHdpZHRoIG9mIHRoZSB2aXMgLSB0cmFuc2Zvcm0gZm9yIHRoZSB0cmVlIC0gbWF4X2xlYWZfbGFiZWxfd2lkdGggLSBob3Jpem9udGFsIHRyYW5zZm9ybSBvZiB0aGUgbGFiZWxcbiAgICBcdC8vIFRPRE86IFN1YnN0aXR1dGUgMTUgYnkgdGhlIGhvcml6b250YWwgdHJhbnNmb3JtIG9mIHRoZSBub2Rlc1xuICAgIFx0dmFyIGNsdXN0ZXJfc2l6ZV9wYXJhbXMgPSB7XG4gICAgXHQgICAgbl9sZWF2ZXMgOiBuX2xlYXZlcyxcbiAgICBcdCAgICBsYWJlbF9oZWlnaHQgOiBtYXhfbm9kZV9oZWlnaHQsXG4gICAgXHQgICAgbGFiZWxfcGFkZGluZyA6IDE1XG4gICAgXHR9O1xuXG4gICAgXHRjb25mLmxheW91dC5hZGp1c3RfY2x1c3Rlcl9zaXplKGNsdXN0ZXJfc2l6ZV9wYXJhbXMpO1xuXG4gICAgXHR2YXIgZGlhZ29uYWwgPSBjb25mLmxheW91dC5kaWFnb25hbCgpO1xuICAgIFx0dmFyIHRyYW5zZm9ybSA9IGNvbmYubGF5b3V0LnRyYW5zZm9ybV9ub2RlO1xuXG4gICAgXHRzdmcgPSB0cmVlX2RpdlxuICAgIFx0ICAgIC5hcHBlbmQoXCJzdmdcIilcbiAgICBcdCAgICAuYXR0cihcIndpZHRoXCIsIGNvbmYubGF5b3V0LndpZHRoKCkpXG4gICAgXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgY29uZi5sYXlvdXQuaGVpZ2h0KGNsdXN0ZXJfc2l6ZV9wYXJhbXMpICsgMzApXG4gICAgXHQgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKTtcblxuICAgIFx0dmlzID0gc3ZnXG4gICAgXHQgICAgLmFwcGVuZChcImdcIilcbiAgICBcdCAgICAuYXR0cihcImlkXCIsIFwidG50X3N0X1wiICsgZGl2X2lkKVxuICAgIFx0ICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsXG4gICAgXHRcdCAgXCJ0cmFuc2xhdGUoXCIgK1xuICAgIFx0XHQgIGNvbmYubGF5b3V0LnRyYW5zbGF0ZV92aXMoKVswXSArXG4gICAgXHRcdCAgXCIsXCIgK1xuICAgIFx0XHQgIGNvbmYubGF5b3V0LnRyYW5zbGF0ZV92aXMoKVsxXSArXG4gICAgXHRcdCAgXCIpXCIpO1xuXG4gICAgXHRjdXJyLm5vZGVzID0gY2x1c3Rlci5ub2RlcyhjdXJyLmRhdGEpO1xuICAgIFx0Y29uZi5sYXlvdXQuc2NhbGVfYnJhbmNoX2xlbmd0aHMoY3Vycik7XG4gICAgXHRjdXJyLmxpbmtzID0gY2x1c3Rlci5saW5rcyhjdXJyLm5vZGVzKTtcblxuICAgIFx0Ly8gTElOS1NcbiAgICBcdC8vIEFsbCB0aGUgbGlua3MgYXJlIGdyb3VwZWQgaW4gYSBnIGVsZW1lbnRcbiAgICBcdGxpbmtzX2cgPSB2aXNcbiAgICBcdCAgICAuYXBwZW5kKFwiZ1wiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rc1wiKTtcbiAgICBcdG5vZGVzX2cgPSB2aXNcbiAgICBcdCAgICAuYXBwZW5kKFwiZ1wiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2Rlc1wiKTtcblxuICAgIFx0Ly92YXIgbGluayA9IHZpc1xuICAgIFx0dmFyIGxpbmsgPSBsaW5rc19nXG4gICAgXHQgICAgLnNlbGVjdEFsbChcInBhdGgudG50X3RyZWVfbGlua1wiKVxuICAgIFx0ICAgIC5kYXRhKGN1cnIubGlua3MsIGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25mLmlkKGQudGFyZ2V0KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgXHRsaW5rXG4gICAgXHQgICAgLmVudGVyKClcbiAgICBcdCAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJlZV9saW5rXCIpXG4gICAgXHQgICAgLmF0dHIoXCJpZFwiLCBmdW5jdGlvbihkKSB7XG4gICAgXHQgICAgXHRyZXR1cm4gXCJ0bnRfdHJlZV9saW5rX1wiICsgZGl2X2lkICsgXCJfXCIgKyBjb25mLmlkKGQudGFyZ2V0KTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5zdHlsZShcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKGNvbmYuYnJhbmNoX2NvbG9yKSh0bnRfdHJlZV9ub2RlKGQuc291cmNlKSwgdG50X3RyZWVfbm9kZShkLnRhcmdldCkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcblxuICAgIFx0Ly8gTk9ERVNcbiAgICBcdC8vdmFyIG5vZGUgPSB2aXNcbiAgICBcdHZhciBub2RlID0gbm9kZXNfZ1xuICAgIFx0ICAgIC5zZWxlY3RBbGwoXCJnLnRudF90cmVlX25vZGVcIilcbiAgICBcdCAgICAuZGF0YShjdXJyLm5vZGVzLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmYuaWQoZCk7XG4gICAgICAgICAgICB9KTtcblxuICAgIFx0dmFyIG5ld19ub2RlID0gbm9kZVxuICAgIFx0ICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgXHRcdGlmIChuLmNoaWxkcmVuKSB7XG4gICAgICAgIFx0XHQgICAgaWYgKG4uZGVwdGggPT09IDApIHtcbiAgICAgICAgICAgIFx0XHRcdHJldHVybiBcInJvb3QgdG50X3RyZWVfbm9kZVwiO1xuICAgICAgICBcdFx0ICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBcdFx0XHRyZXR1cm4gXCJpbm5lciB0bnRfdHJlZV9ub2RlXCI7XG4gICAgICAgIFx0XHQgICAgfVxuICAgICAgICBcdFx0fSBlbHNlIHtcbiAgICAgICAgXHRcdCAgICByZXR1cm4gXCJsZWFmIHRudF90cmVlX25vZGVcIjtcbiAgICAgICAgXHRcdH1cbiAgICAgICAgXHR9KVxuICAgIFx0ICAgIC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICBcdFx0cmV0dXJuIFwidG50X3RyZWVfbm9kZV9cIiArIGRpdl9pZCArIFwiX1wiICsgZC5faWQ7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm0pO1xuXG4gICAgXHQvLyBkaXNwbGF5IG5vZGUgc2hhcGVcbiAgICBcdG5ld19ub2RlXG4gICAgXHQgICAgLmVhY2ggKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0XHRjb25mLm5vZGVfZGlzcGxheS5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCkpO1xuICAgIFx0ICAgIH0pO1xuXG4gICAgXHQvLyBkaXNwbGF5IG5vZGUgbGFiZWxcbiAgICBcdG5ld19ub2RlXG4gICAgXHQgICAgLmVhY2ggKGZ1bmN0aW9uIChkKSB7XG4gICAgXHQgICAgXHRjb25mLmxhYmVsLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSwgY29uZi5sYXlvdXQudHlwZSwgZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKHRudF90cmVlX25vZGUoZCkpKTtcbiAgICBcdCAgICB9KTtcblxuICAgICAgICBuZXdfbm9kZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmNsaWNrXCIsIG15X25vZGUpO1xuICAgICAgICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld19ub2RlLm9uKFwiZGJsY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6ZGJsY2xpY2tcIiwgbXlfbm9kZSk7XG4gICAgICAgICAgICBkaXNwYXRjaC5kYmxjbGljay5jYWxsKHRoaXMsIG15X25vZGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgbmV3X25vZGUub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6aG92ZXJcIiwgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgICAgICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld19ub2RlLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6bW91c2VvdXRcIiwgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgICAgICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKHRoaXMsIG15X25vZGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBkaXNwYXRjaC5sb2FkKCk7XG5cbiAgICBcdC8vIFVwZGF0ZSBwbG90cyBhbiB1cGRhdGVkIHRyZWVcbiAgICAgICAgYXBpLm1ldGhvZCAoJ3VwZGF0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdHJlZV9kaXZcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJ3aWR0aFwiLCAoY29uZi5sYXlvdXQud2lkdGgoKSArIFwicHhcIikpO1xuICAgIFx0ICAgIHN2Zy5hdHRyKFwid2lkdGhcIiwgY29uZi5sYXlvdXQud2lkdGgoKSk7XG5cbiAgICBcdCAgICB2YXIgY2x1c3RlciA9IGNvbmYubGF5b3V0LmNsdXN0ZXI7XG4gICAgXHQgICAgdmFyIGRpYWdvbmFsID0gY29uZi5sYXlvdXQuZGlhZ29uYWwoKTtcbiAgICBcdCAgICB2YXIgdHJhbnNmb3JtID0gY29uZi5sYXlvdXQudHJhbnNmb3JtX25vZGU7XG5cbiAgICBcdCAgICB2YXIgbWF4X2xhYmVsX2xlbmd0aCA9IG1heF9sZWFmX2xhYmVsX2xlbmd0aChjdXJyLnRyZWUpO1xuICAgIFx0ICAgIGNvbmYubGF5b3V0Lm1heF9sZWFmX2xhYmVsX3dpZHRoKG1heF9sYWJlbF9sZW5ndGgpO1xuXG4gICAgXHQgICAgdmFyIG1heF9ub2RlX2hlaWdodCA9IG1heF9sZWFmX25vZGVfaGVpZ2h0KGN1cnIudHJlZSk7XG5cbiAgICBcdCAgICAvLyBDbHVzdGVyIHNpemUgaXMgdGhlIHJlc3VsdCBvZi4uLlxuICAgIFx0ICAgIC8vIHRvdGFsIHdpZHRoIG9mIHRoZSB2aXMgLSB0cmFuc2Zvcm0gZm9yIHRoZSB0cmVlIC0gbWF4X2xlYWZfbGFiZWxfd2lkdGggLSBob3Jpem9udGFsIHRyYW5zZm9ybSBvZiB0aGUgbGFiZWxcbiAgICAgICAgXHQvLyBUT0RPOiBTdWJzdGl0dXRlIDE1IGJ5IHRoZSB0cmFuc2Zvcm0gb2YgdGhlIG5vZGVzIChwcm9iYWJseSBieSBzZWxlY3Rpbmcgb25lIG5vZGUgYXNzdW1pbmcgYWxsIHRoZSBub2RlcyBoYXZlIHRoZSBzYW1lIHRyYW5zZm9ybVxuICAgIFx0ICAgIHZhciBuX2xlYXZlcyA9IGN1cnIudHJlZS5nZXRfYWxsX2xlYXZlcygpLmxlbmd0aDtcbiAgICBcdCAgICB2YXIgY2x1c3Rlcl9zaXplX3BhcmFtcyA9IHtcbiAgICAgICAgXHRcdG5fbGVhdmVzIDogbl9sZWF2ZXMsXG4gICAgICAgIFx0XHRsYWJlbF9oZWlnaHQgOiBtYXhfbm9kZV9oZWlnaHQsXG4gICAgICAgIFx0XHRsYWJlbF9wYWRkaW5nIDogMTVcbiAgICBcdCAgICB9O1xuICAgIFx0ICAgIGNvbmYubGF5b3V0LmFkanVzdF9jbHVzdGVyX3NpemUoY2x1c3Rlcl9zaXplX3BhcmFtcyk7XG5cbiAgICAgICAgICAgIHN2Z1xuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcbiAgICAgICAgICAgICAgICAuZWFzZShlYXNlKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGNvbmYubGF5b3V0LmhlaWdodChjbHVzdGVyX3NpemVfcGFyYW1zKSArIDMwKTsgLy8gaGVpZ2h0IGlzIGluIHRoZSBsYXlvdXRcblxuICAgIFx0ICAgIHZpc1xuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcbiAgICAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLFxuICAgICAgICAgICAgICAgIFwidHJhbnNsYXRlKFwiICtcbiAgICAgICAgICAgICAgICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMF0gK1xuICAgICAgICAgICAgICAgIFwiLFwiICtcbiAgICAgICAgICAgICAgICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMV0gK1xuICAgICAgICAgICAgICAgIFwiKVwiKTtcblxuICAgICAgICAgICAgY3Vyci5ub2RlcyA9IGNsdXN0ZXIubm9kZXMoY3Vyci5kYXRhKTtcbiAgICAgICAgICAgIGNvbmYubGF5b3V0LnNjYWxlX2JyYW5jaF9sZW5ndGhzKGN1cnIpO1xuICAgICAgICAgICAgY3Vyci5saW5rcyA9IGNsdXN0ZXIubGlua3MoY3Vyci5ub2Rlcyk7XG5cbiAgICBcdCAgICAvLyBMSU5LU1xuICAgIFx0ICAgIHZhciBsaW5rID0gbGlua3NfZ1xuICAgICAgICBcdFx0LnNlbGVjdEFsbChcInBhdGgudG50X3RyZWVfbGlua1wiKVxuICAgICAgICBcdFx0LmRhdGEoY3Vyci5saW5rcywgZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25mLmlkKGQudGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gTk9ERVNcbiAgICBcdCAgICB2YXIgbm9kZSA9IG5vZGVzX2dcbiAgICAgICAgXHRcdC5zZWxlY3RBbGwoXCJnLnRudF90cmVlX25vZGVcIilcbiAgICAgICAgXHRcdC5kYXRhKGN1cnIubm9kZXMsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbmYuaWQoZCk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICBcdCAgICB2YXIgZXhpdF9saW5rID0gbGlua1xuICAgICAgICBcdFx0LmV4aXQoKVxuICAgICAgICBcdFx0LnJlbW92ZSgpO1xuXG4gICAgXHQgICAgbGlua1xuICAgICAgICBcdFx0LmVudGVyKClcbiAgICAgICAgXHRcdC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgIFx0XHQuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfbGlua1wiKVxuICAgICAgICBcdFx0LmF0dHIoXCJpZFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBcdFx0ICAgIHJldHVybiBcInRudF90cmVlX2xpbmtfXCIgKyBkaXZfaWQgKyBcIl9cIiArIGNvbmYuaWQoZC50YXJnZXQpO1xuICAgICAgICBcdFx0fSlcbiAgICAgICAgXHRcdC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0XHQgICAgcmV0dXJuIGQzLmZ1bmN0b3IoY29uZi5icmFuY2hfY29sb3IpKHRudF90cmVlX25vZGUoZC5zb3VyY2UpLCB0bnRfdHJlZV9ub2RlKGQudGFyZ2V0KSk7XG4gICAgICAgIFx0XHR9KVxuICAgICAgICBcdFx0LmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcblxuICAgIFx0ICAgIGxpbmtcbiAgICBcdCAgICBcdC50cmFuc2l0aW9uKClcbiAgICAgICAgXHRcdC5lYXNlKGVhc2UpXG4gICAgXHQgICAgXHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcbiAgICBcdCAgICBcdC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XG5cblxuICAgIFx0ICAgIC8vIE5vZGVzXG4gICAgXHQgICAgdmFyIG5ld19ub2RlID0gbm9kZVxuICAgICAgICBcdFx0LmVudGVyKClcbiAgICAgICAgXHRcdC5hcHBlbmQoXCJnXCIpXG4gICAgICAgIFx0XHQuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgXHRcdCAgICBpZiAobi5jaGlsZHJlbikge1xuICAgICAgICAgICAgXHRcdFx0aWYgKG4uZGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJyb290IHRudF90cmVlX25vZGVcIjtcbiAgICAgICAgICAgIFx0XHRcdH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiaW5uZXIgdG50X3RyZWVfbm9kZVwiO1xuICAgICAgICAgICAgXHRcdFx0fVxuICAgICAgICBcdFx0ICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJsZWFmIHRudF90cmVlX25vZGVcIjtcbiAgICAgICAgXHRcdCAgICB9XG4gICAgICAgIFx0XHR9KVxuICAgICAgICBcdFx0LmF0dHIoXCJpZFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBcdFx0ICAgIHJldHVybiBcInRudF90cmVlX25vZGVfXCIgKyBkaXZfaWQgKyBcIl9cIiArIGQuX2lkO1xuICAgICAgICBcdFx0fSlcbiAgICAgICAgXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cbiAgICBcdCAgICAvLyBFeGl0aW5nIG5vZGVzIGFyZSBqdXN0IHJlbW92ZWRcbiAgICBcdCAgICBub2RlXG4gICAgICAgIFx0XHQuZXhpdCgpXG4gICAgICAgIFx0XHQucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIG5ld19ub2RlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCBteV9ub2RlKTtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaC5jbGljay5jYWxsKHRoaXMsIG15X25vZGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6ZGJsY2xpY2tcIiwgbXlfbm9kZSk7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2guZGJsY2xpY2suY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbmV3X25vZGUub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpob3ZlclwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbmV3X25vZGUub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOm1vdXNlb3V0XCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgIFx0ICAgIC8vIC8vIFdlIG5lZWQgdG8gcmUtY3JlYXRlIGFsbCB0aGUgbm9kZXMgYWdhaW4gaW4gY2FzZSB0aGV5IGhhdmUgY2hhbmdlZCBsaXZlbHkgKG9yIHRoZSBsYXlvdXQpXG4gICAgXHQgICAgLy8gbm9kZS5zZWxlY3RBbGwoXCIqXCIpLnJlbW92ZSgpO1xuICAgIFx0ICAgIC8vIG5ld19ub2RlXG4gICAgXHRcdC8vICAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICBcdC8vIFx0XHRjb25mLm5vZGVfZGlzcGxheS5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCkpO1xuICAgIFx0XHQvLyAgICAgfSk7XG4gICAgICAgICAgICAvL1xuICAgIFx0ICAgIC8vIC8vIFdlIG5lZWQgdG8gcmUtY3JlYXRlIGFsbCB0aGUgbGFiZWxzIGFnYWluIGluIGNhc2UgdGhleSBoYXZlIGNoYW5nZWQgbGl2ZWx5IChvciB0aGUgbGF5b3V0KVxuICAgIFx0ICAgIC8vIG5ld19ub2RlXG4gICAgXHRcdC8vICAgICAuZWFjaCAoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgXHQvLyBcdFx0Y29uZi5sYWJlbC5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCksIGNvbmYubGF5b3V0LnR5cGUsIGQzLmZ1bmN0b3IoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKSh0bnRfdHJlZV9ub2RlKGQpKSk7XG4gICAgXHRcdC8vICAgICB9KTtcblxuICAgICAgICAgICAgdC51cGRhdGVfbm9kZXMoKTtcblxuICAgIFx0ICAgIG5vZGVcbiAgICAgICAgXHRcdC50cmFuc2l0aW9uKClcbiAgICAgICAgXHRcdC5lYXNlKGVhc2UpXG4gICAgICAgIFx0XHQuZHVyYXRpb24oY29uZi5kdXJhdGlvbilcbiAgICAgICAgXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybSk7XG5cbiAgICBcdH0pO1xuXG4gICAgICAgIGFwaS5tZXRob2QoJ3VwZGF0ZV9ub2RlcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gbm9kZXNfZ1xuICAgICAgICAgICAgICAgIC5zZWxlY3RBbGwoXCJnLnRudF90cmVlX25vZGVcIik7XG5cbiAgICAgICAgICAgIC8vIHJlLWNyZWF0ZSBhbGwgdGhlIG5vZGVzIGFnYWluXG4gICAgICAgICAgICAvLyBub2RlLnNlbGVjdEFsbChcIipcIikucmVtb3ZlKCk7XG4gICAgICAgICAgICBub2RlXG4gICAgICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25mLm5vZGVfZGlzcGxheS5yZXNldC5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBub2RlXG4gICAgICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhjb25mLm5vZGVfZGlzcGxheSgpKTtcbiAgICAgICAgICAgICAgICAgICAgY29uZi5ub2RlX2Rpc3BsYXkuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKGQpKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gcmUtY3JlYXRlIGFsbCB0aGUgbGFiZWxzIGFnYWluXG4gICAgICAgICAgICBub2RlXG4gICAgICAgICAgICAgICAgLmVhY2ggKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmYubGFiZWwuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKGQpLCBjb25mLmxheW91dC50eXBlLCBkMy5mdW5jdG9yKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkodG50X3RyZWVfbm9kZShkKSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBBUElcbiAgICB2YXIgYXBpID0gYXBpanMgKHQpXG4gICAgXHQuZ2V0c2V0IChjb25mKTtcblxuICAgIC8vIG4gaXMgdGhlIG51bWJlciB0byBpbnRlcnBvbGF0ZSwgdGhlIHNlY29uZCBhcmd1bWVudCBjYW4gYmUgZWl0aGVyIFwidHJlZVwiIG9yIFwicGl4ZWxcIiBkZXBlbmRpbmdcbiAgICAvLyBpZiBuIGlzIHNldCB0byB0cmVlIHVuaXRzIG9yIHBpeGVscyB1bml0c1xuICAgIGFwaS5tZXRob2QgKCdzY2FsZV9iYXInLCBmdW5jdGlvbiAobiwgdW5pdHMpIHtcbiAgICAgICAgaWYgKCF0LmxheW91dCgpLnNjYWxlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXVuaXRzKSB7XG4gICAgICAgICAgICB1bml0cyA9IFwicGl4ZWxcIjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdmFsO1xuICAgICAgICBsaW5rc19nLnNlbGVjdEFsbChcInBhdGhcIilcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHZhciBkID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJkXCIpO1xuXG4gICAgICAgICAgICAgICAgdmFyIHBhdGhQYXJ0cyA9IGQuc3BsaXQoL1tNTEFdLyk7XG4gICAgICAgICAgICAgICAgdmFyIHRvU3RyID0gcGF0aFBhcnRzLnBvcCgpO1xuICAgICAgICAgICAgICAgIHZhciBmcm9tU3RyID0gcGF0aFBhcnRzLnBvcCgpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGZyb20gPSBmcm9tU3RyLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICAgICAgICB2YXIgdG8gPSB0b1N0ci5zcGxpdChcIixcIik7XG5cbiAgICAgICAgICAgICAgICB2YXIgZGVsdGFYID0gdG9bMF0gLSBmcm9tWzBdO1xuICAgICAgICAgICAgICAgIHZhciBkZWx0YVkgPSB0b1sxXSAtIGZyb21bMV07XG4gICAgICAgICAgICAgICAgdmFyIHBpeGVsc0Rpc3QgPSBNYXRoLnNxcnQoZGVsdGFYKmRlbHRhWCArIGRlbHRhWSpkZWx0YVkpO1xuXG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHAuc291cmNlO1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBwLnRhcmdldDtcblxuICAgICAgICAgICAgICAgIHZhciBicmFuY2hEaXN0ID0gdGFyZ2V0Ll9yb290X2Rpc3QgLSBzb3VyY2UuX3Jvb3RfZGlzdDtcbiAgICAgICAgICAgICAgICBpZiAoYnJhbmNoRGlzdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTdXBwb3NpbmcgcGl4ZWxzRGlzdCBoYXMgYmVlbiBwYXNzZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVuaXRzID09PSBcInBpeGVsXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IChicmFuY2hEaXN0IC8gcGl4ZWxzRGlzdCkgKiBuO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHVuaXRzID09PSBcInRyZWVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gKHBpeGVsc0Rpc3QgLyBicmFuY2hEaXN0KSAqIG47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfSk7XG5cbiAgICAvLyBUT0RPOiBSZXdyaXRlIGRhdGEgdXNpbmcgZ2V0c2V0IC8gZmluYWxpemVycyAmIHRyYW5zZm9ybXNcbiAgICBhcGkubWV0aG9kICgnZGF0YScsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGJhc2UuZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBvcmlnaW5hbCBkYXRhIGlzIHN0b3JlZCBhcyB0aGUgYmFzZSBhbmQgY3VyciBkYXRhXG4gICAgICAgIGJhc2UuZGF0YSA9IGQ7XG4gICAgICAgIGN1cnIuZGF0YSA9IGQ7XG5cbiAgICAgICAgLy8gU2V0IHVwIGEgbmV3IHRyZWUgYmFzZWQgb24gdGhlIGRhdGFcbiAgICAgICAgdmFyIG5ld3RyZWUgPSB0bnRfdHJlZV9ub2RlKGJhc2UuZGF0YSk7XG5cbiAgICAgICAgdC5yb290KG5ld3RyZWUpO1xuICAgICAgICBiYXNlLnRyZWUgPSBuZXd0cmVlO1xuICAgICAgICBjdXJyLnRyZWUgPSBiYXNlLnRyZWU7XG5cbiAgICAgICAgdHJlZS50cmlnZ2VyKFwiZGF0YTpoYXNDaGFuZ2VkXCIsIGJhc2UuZGF0YSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBUaGlzIGlzIG9ubHkgYSBnZXR0ZXJcbiAgICBhcGkubWV0aG9kICgncm9vdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGN1cnIudHJlZTtcbiAgICB9KTtcblxuICAgIC8vIGFwaS5tZXRob2QgKCdzdWJ0cmVlJywgZnVuY3Rpb24gKGN1cnJfbm9kZXMsIGtlZXBTaW5nbGV0b25zKSB7XG4gICAgLy8gICAgIHZhciBzdWJ0cmVlID0gYmFzZS50cmVlLnN1YnRyZWUoY3Vycl9ub2Rlcywga2VlcFNpbmdsZXRvbnMpO1xuICAgIC8vICAgICBjdXJyLmRhdGEgPSBzdWJ0cmVlLmRhdGEoKTtcbiAgICAvLyAgICAgY3Vyci50cmVlID0gc3VidHJlZTtcbiAgICAvL1xuICAgIC8vICAgICByZXR1cm4gdGhpcztcbiAgICAvLyB9KTtcblxuICAgIC8vIGFwaS5tZXRob2QgKCdyZXJvb3QnLCBmdW5jdGlvbiAobm9kZSwga2VlcFNpbmdsZXRvbnMpIHtcbiAgICAvLyAgICAgLy8gZmluZFxuICAgIC8vICAgICB2YXIgcm9vdCA9IHQucm9vdCgpO1xuICAgIC8vICAgICB2YXIgZm91bmRfbm9kZSA9IHQucm9vdCgpLmZpbmRfbm9kZShmdW5jdGlvbiAobikge1xuICAgIC8vICAgICAgICAgcmV0dXJuIG5vZGUuaWQoKSA9PT0gbi5pZCgpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgICAgdmFyIHN1YnRyZWUgPSByb290LnN1YnRyZWUoZm91bmRfbm9kZS5nZXRfYWxsX2xlYXZlcygpLCBrZWVwU2luZ2xldG9ucyk7XG4gICAgLy9cbiAgICAvLyAgICAgcmV0dXJuIHN1YnRyZWU7XG4gICAgLy8gfSk7XG5cbiAgICByZXR1cm4gZDMucmViaW5kICh0LCBkaXNwYXRjaCwgXCJvblwiKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWU7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC5qc1wiKTtcbiIsIi8vIHJlcXVpcmUoJ2ZzJykucmVhZGRpclN5bmMoX19kaXJuYW1lICsgJy8nKS5mb3JFYWNoKGZ1bmN0aW9uKGZpbGUpIHtcbi8vICAgICBpZiAoZmlsZS5tYXRjaCgvLitcXC5qcy9nKSAhPT0gbnVsbCAmJiBmaWxlICE9PSBfX2ZpbGVuYW1lKSB7XG4vLyBcdHZhciBuYW1lID0gZmlsZS5yZXBsYWNlKCcuanMnLCAnJyk7XG4vLyBcdG1vZHVsZS5leHBvcnRzW25hbWVdID0gcmVxdWlyZSgnLi8nICsgZmlsZSk7XG4vLyAgICAgfVxuLy8gfSk7XG5cbi8vIFNhbWUgYXNcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xudXRpbHMucmVkdWNlID0gcmVxdWlyZShcIi4vcmVkdWNlLmpzXCIpO1xudXRpbHMucG5nID0gcmVxdWlyZShcIi4vcG5nLmpzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdXRpbHM7XG4iLCJ2YXIgcG5nID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGRvY3R5cGUgPSAnPD94bWwgdmVyc2lvbj1cIjEuMFwiIHN0YW5kYWxvbmU9XCJub1wiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyBcIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOXCIgXCJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGRcIj4nO1xuXG4gICAgdmFyIHNjYWxlX2ZhY3RvciA9IDE7XG4gICAgLy8gdmFyIGZpbGVuYW1lID0gJ2ltYWdlLnBuZyc7XG5cbiAgICAvLyBSZXN0cmljdCB0aGUgY3NzIHRvIGFwcGx5IHRvIHRoZSBmb2xsb3dpbmcgYXJyYXkgKGhyZWZzKVxuICAgIC8vIFRPRE86IHN1YnN0aXR1dGUgdGhpcyBieSBhbiBhcnJheSBvZiByZWdleHBcbiAgICB2YXIgY3NzOyAvLyBJZiB1bmRlZmluZWQsIHVzZSBhbGwgc3R5bGVzaGVldHNcbiAgICAvLyB2YXIgaW5saW5lX2ltYWdlc19vcHQgPSB0cnVlOyAvLyBJZiB0cnVlLCBpbmxpbmUgaW1hZ2VzXG5cbiAgICB2YXIgaW1nX2NiYWsgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIHZhciBwbmdfZXhwb3J0ID0gZnVuY3Rpb24gKGZyb21fc3ZnKSB7XG4gICAgICAgIGZyb21fc3ZnID0gZnJvbV9zdmcubm9kZSgpO1xuICAgICAgICAvLyB2YXIgc3ZnID0gZGl2LnF1ZXJ5U2VsZWN0b3IoJ3N2ZycpO1xuXG4gICAgICAgIHZhciBpbmxpbmVfaW1hZ2VzID0gZnVuY3Rpb24gKGNiYWspIHtcbiAgICAgICAgICAgIHZhciBpbWFnZXMgPSBkMy5zZWxlY3QoZnJvbV9zdmcpXG4gICAgICAgICAgICAgICAgLnNlbGVjdEFsbCgnaW1hZ2UnKTtcblxuICAgICAgICAgICAgdmFyIHJlbWFpbmluZyA9IGltYWdlc1swXS5sZW5ndGg7XG4gICAgICAgICAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY2JhaygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbWFnZXNcbiAgICAgICAgICAgICAgICAuZWFjaCAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW1hZ2UgPSBkMy5zZWxlY3QodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGltZy53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBpbWcuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVyaSA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2UuYXR0cignaHJlZicsIHVyaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1haW5pbmctLTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYmFrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGltZy5zcmMgPSBpbWFnZS5hdHRyKCdocmVmJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbW92ZV9jaGlsZHJlbiA9IGZ1bmN0aW9uIChzcmMsIGRlc3QpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHNyYy5jaGlsZHJlbiB8fCBzcmMuY2hpbGROb2RlcztcbiAgICAgICAgICAgIHdoaWxlIChjaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5bMF07XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlICE9PSAxLypOb2RlLkVMRU1FTlRfTk9ERSovKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZXN0LmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBzdHlsaW5nID0gZnVuY3Rpb24gKGRvbSkge1xuICAgICAgICAgICAgdmFyIHVzZWQgPSBcIlwiO1xuICAgICAgICAgICAgdmFyIHNoZWV0cyA9IGRvY3VtZW50LnN0eWxlU2hlZXRzO1xuICAgICAgICAgICAgLy8gdmFyIHNoZWV0cyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHNoZWV0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBocmVmID0gc2hlZXRzW2ldLmhyZWYgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBza2lwID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYz0wOyBjPGNzcy5sZW5ndGg7IGMrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhyZWYuaW5kZXhPZihjc3NbY10pID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBza2lwID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNraXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBydWxlcyA9IHNoZWV0c1tpXS5jc3NSdWxlcyB8fCBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJ1bGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBydWxlID0gcnVsZXNbal07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YocnVsZS5zdHlsZSkgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVsZW1zID0gZG9tLnF1ZXJ5U2VsZWN0b3JBbGwocnVsZS5zZWxlY3RvclRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VkICs9IHJ1bGUuc2VsZWN0b3JUZXh0ICsgXCIgeyBcIiArIHJ1bGUuc3R5bGUuY3NzVGV4dCArIFwiIH1cXG5cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgYXJlIDxkZWZzPiBhbHJlYWR5XG4gICAgICAgICAgICB2YXIgZGVmcyA9IGRvbS5xdWVyeVNlbGVjdG9yKFwiZGVmc1wiKSB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkZWZzJyk7XG4gICAgICAgICAgICB2YXIgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgICAgICBzLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgICAgICAgICAgcy5pbm5lckhUTUwgPSBcIjwhW0NEQVRBW1xcblwiICsgdXNlZCArIFwiXFxuXV0+XCI7XG5cbiAgICAgICAgICAgIC8vIHZhciBkZWZzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGVmcycpO1xuICAgICAgICAgICAgZGVmcy5hcHBlbmRDaGlsZChzKTtcbiAgICAgICAgICAgIHJldHVybiBkZWZzO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlubGluZV9pbWFnZXMgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIHZhciBzdmcgPSBkaXYucXVlcnlTZWxlY3Rvcignc3ZnJyk7XG4gICAgICAgICAgICB2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgdmFyIGNsb25lID0gZnJvbV9zdmcuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgdmFyIHdpZHRoID0gcGFyc2VJbnQoY2xvbmUuZ2V0QXR0cmlidXRlKCd3aWR0aCcpKTtcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBwYXJzZUludChjbG9uZS5nZXRBdHRyaWJ1dGUoJ2hlaWdodCcpKTtcblxuICAgICAgICAgICAgY2xvbmUuc2V0QXR0cmlidXRlKFwidmVyc2lvblwiLCBcIjEuMVwiKTtcbiAgICAgICAgICAgIGNsb25lLnNldEF0dHJpYnV0ZShcInhtbG5zXCIsIFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIik7XG4gICAgICAgICAgICBjbG9uZS5zZXRBdHRyaWJ1dGUoXCJ4bWxuczp4bGlua1wiLCBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIik7XG4gICAgICAgICAgICBjbG9uZS5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCB3aWR0aCAqIHNjYWxlX2ZhY3Rvcik7XG4gICAgICAgICAgICBjbG9uZS5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgaGVpZ2h0ICogc2NhbGVfZmFjdG9yKTtcbiAgICAgICAgICAgIHZhciBzY2FsaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImdcIik7XG4gICAgICAgICAgICBzY2FsaW5nLnNldEF0dHJpYnV0ZShcInRyYW5zZm9ybVwiLCBcInNjYWxlKFwiICsgc2NhbGVfZmFjdG9yICsgXCIpXCIpO1xuICAgICAgICAgICAgY2xvbmUuYXBwZW5kQ2hpbGQobW92ZV9jaGlsZHJlbihjbG9uZSwgc2NhbGluZykpO1xuICAgICAgICAgICAgb3V0ZXIuYXBwZW5kQ2hpbGQoY2xvbmUpO1xuXG4gICAgICAgICAgICBjbG9uZS5pbnNlcnRCZWZvcmUgKHN0eWxpbmcoY2xvbmUpLCBjbG9uZS5maXJzdENoaWxkKTtcblxuICAgICAgICAgICAgdmFyIHN2ZyA9IGRvY3R5cGUgKyBvdXRlci5pbm5lckhUTUw7XG4gICAgICAgICAgICBzdmcgPSBzdmcucmVwbGFjZSAoXCJub25lXCIsIFwiYmxvY2tcIik7IC8vIEluIGNhc2UgdGhlIHN2ZyBpcyBub3QgYmVpbmcgZGlzcGxheWVkLCBpdCBpcyBpZ25vcmVkIGluIEZGXG4gICAgICAgICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgICAgICAgICAgaW1hZ2Uuc3JjID0gJ2RhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsJyArIHdpbmRvdy5idG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChzdmcpKSk7XG4gICAgICAgICAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gaW1hZ2Uud2lkdGg7XG4gICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGltYWdlLmhlaWdodDtcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGltYWdlLCAwLCAwKTtcblxuICAgICAgICAgICAgICAgIHZhciBzcmMgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcbiAgICAgICAgICAgICAgICBpbWdfY2JhayAoc3JjKTtcbiAgICAgICAgICAgICAgICAvLyB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgICAgICAvLyBhLmRvd25sb2FkID0gZmlsZW5hbWU7XG4gICAgICAgICAgICAgICAgLy8gYS5ocmVmID0gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XG4gICAgICAgICAgICAgICAgLy8gZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTtcbiAgICAgICAgICAgICAgICAvLyBhLmNsaWNrKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgIH07XG4gICAgcG5nX2V4cG9ydC5zY2FsZV9mYWN0b3IgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBzY2FsZV9mYWN0b3I7XG4gICAgICAgIH1cbiAgICAgICAgc2NhbGVfZmFjdG9yID0gZjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHBuZ19leHBvcnQuY2FsbGJhY2sgPSBmdW5jdGlvbiAoY2Jhaykge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBpbWdfY2JhaztcbiAgICAgICAgfVxuICAgICAgICBpbWdfY2JhayA9IGNiYWs7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBwbmdfZXhwb3J0LnN0eWxlc2hlZXRzID0gZnVuY3Rpb24gKHJlc3RyaWN0Q3NzKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNzcztcbiAgICAgICAgfVxuICAgICAgICBjc3MgPSByZXN0cmljdENzcztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8vIHBuZ19leHBvcnQuZmlsZW5hbWUgPSBmdW5jdGlvbiAoZikge1xuICAgIC8vIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgLy8gXHQgICAgcmV0dXJuIGZpbGVuYW1lO1xuICAgIC8vIFx0fVxuICAgIC8vIFx0ZmlsZW5hbWUgPSBmO1xuICAgIC8vIFx0cmV0dXJuIHBuZ19leHBvcnQ7XG4gICAgLy8gfTtcblxuICAgIHJldHVybiBwbmdfZXhwb3J0O1xufTtcblxudmFyIGRvd25sb2FkID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGZpbGVuYW1lID0gJ2ltYWdlLnBuZyc7XG4gICAgdmFyIG1heF9zaXplID0ge1xuICAgICAgICBsaW1pdDogSW5maW5pdHksXG4gICAgICAgIG9uRXJyb3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiaW1hZ2UgdG9vIGxhcmdlXCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBwbmdfZXhwb3J0ID0gcG5nKClcbiAgICAgICAgLmNhbGxiYWNrIChmdW5jdGlvbiAoc3JjKSB7XG4gICAgICAgICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgIGEuZG93bmxvYWQgPSBmaWxlbmFtZTtcbiAgICAgICAgICAgIGEuaHJlZiA9IHNyYztcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7XG5cbiAgICAgICAgICAgIGlmIChhLmhyZWYubGVuZ3RoID4gbWF4X3NpemUubGltaXQpIHtcbiAgICAgICAgICAgICAgICBhLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoYSk7XG4gICAgICAgICAgICAgICAgbWF4X3NpemUub25FcnJvcigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhLmNsaWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vICAgICBhLmNsaWNrKCk7XG4gICAgICAgICAgICAvLyB9LCAzMDAwKTtcbiAgICAgICAgfSk7XG5cbiAgICBwbmdfZXhwb3J0LmZpbGVuYW1lID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbGVuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGZpbGVuYW1lID0gZm47XG4gICAgICAgIHJldHVybiBwbmdfZXhwb3J0O1xuICAgIH07XG5cbiAgICBwbmdfZXhwb3J0LmxpbWl0ID0gZnVuY3Rpb24gKGwpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF4X3NpemU7XG4gICAgICAgIH1cbiAgICAgICAgbWF4X3NpemUgPSBsO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIHBuZ19leHBvcnQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBkb3dubG9hZDtcbiIsInZhciByZWR1Y2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNtb290aCA9IDU7XG4gICAgdmFyIHZhbHVlID0gJ3ZhbCc7XG4gICAgdmFyIHJlZHVuZGFudCA9IGZ1bmN0aW9uIChhLCBiKSB7XG5cdGlmIChhIDwgYikge1xuXHQgICAgcmV0dXJuICgoYi1hKSA8PSAoYiAqIDAuMikpO1xuXHR9XG5cdHJldHVybiAoKGEtYikgPD0gKGEgKiAwLjIpKTtcbiAgICB9O1xuICAgIHZhciBwZXJmb3JtX3JlZHVjZSA9IGZ1bmN0aW9uIChhcnIpIHtyZXR1cm4gYXJyO307XG5cbiAgICB2YXIgcmVkdWNlID0gZnVuY3Rpb24gKGFycikge1xuXHRpZiAoIWFyci5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBhcnI7XG5cdH1cblx0dmFyIHNtb290aGVkID0gcGVyZm9ybV9zbW9vdGgoYXJyKTtcblx0dmFyIHJlZHVjZWQgID0gcGVyZm9ybV9yZWR1Y2Uoc21vb3RoZWQpO1xuXHRyZXR1cm4gcmVkdWNlZDtcbiAgICB9O1xuXG4gICAgdmFyIG1lZGlhbiA9IGZ1bmN0aW9uICh2LCBhcnIpIHtcblx0YXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcblx0ICAgIHJldHVybiBhW3ZhbHVlXSAtIGJbdmFsdWVdO1xuXHR9KTtcblx0aWYgKGFyci5sZW5ndGggJSAyKSB7XG5cdCAgICB2W3ZhbHVlXSA9IGFyclt+fihhcnIubGVuZ3RoIC8gMildW3ZhbHVlXTtcdCAgICBcblx0fSBlbHNlIHtcblx0ICAgIHZhciBuID0gfn4oYXJyLmxlbmd0aCAvIDIpIC0gMTtcblx0ICAgIHZbdmFsdWVdID0gKGFycltuXVt2YWx1ZV0gKyBhcnJbbisxXVt2YWx1ZV0pIC8gMjtcblx0fVxuXG5cdHJldHVybiB2O1xuICAgIH07XG5cbiAgICB2YXIgY2xvbmUgPSBmdW5jdGlvbiAoc291cmNlKSB7XG5cdHZhciB0YXJnZXQgPSB7fTtcblx0Zm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcblx0ICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcblx0XHR0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHRhcmdldDtcbiAgICB9O1xuXG4gICAgdmFyIHBlcmZvcm1fc21vb3RoID0gZnVuY3Rpb24gKGFycikge1xuXHRpZiAoc21vb3RoID09PSAwKSB7IC8vIG5vIHNtb290aFxuXHQgICAgcmV0dXJuIGFycjtcblx0fVxuXHR2YXIgc21vb3RoX2FyciA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8YXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgbG93ID0gKGkgPCBzbW9vdGgpID8gMCA6IChpIC0gc21vb3RoKTtcblx0ICAgIHZhciBoaWdoID0gKGkgPiAoYXJyLmxlbmd0aCAtIHNtb290aCkpID8gYXJyLmxlbmd0aCA6IChpICsgc21vb3RoKTtcblx0ICAgIHNtb290aF9hcnJbaV0gPSBtZWRpYW4oY2xvbmUoYXJyW2ldKSwgYXJyLnNsaWNlKGxvdyxoaWdoKzEpKTtcblx0fVxuXHRyZXR1cm4gc21vb3RoX2FycjtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnJlZHVjZXIgPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBwZXJmb3JtX3JlZHVjZTtcblx0fVxuXHRwZXJmb3JtX3JlZHVjZSA9IGNiYWs7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJlZHVjZS5yZWR1bmRhbnQgPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiByZWR1bmRhbnQ7XG5cdH1cblx0cmVkdW5kYW50ID0gY2Jhaztcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnZhbHVlID0gZnVuY3Rpb24gKHZhbCkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiB2YWx1ZTtcblx0fVxuXHR2YWx1ZSA9IHZhbDtcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmVkdWNlLnNtb290aCA9IGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gc21vb3RoO1xuXHR9XG5cdHNtb290aCA9IHZhbDtcblx0cmV0dXJuIHJlZHVjZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJlZHVjZTtcbn07XG5cbnZhciBibG9jayA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcmVkID0gcmVkdWNlKClcblx0LnZhbHVlKCdzdGFydCcpO1xuXG4gICAgdmFyIHZhbHVlMiA9ICdlbmQnO1xuXG4gICAgdmFyIGpvaW4gPSBmdW5jdGlvbiAob2JqMSwgb2JqMikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ29iamVjdCcgOiB7XG4gICAgICAgICAgICAgICAgJ3N0YXJ0JyA6IG9iajEub2JqZWN0W3JlZC52YWx1ZSgpXSxcbiAgICAgICAgICAgICAgICAnZW5kJyAgIDogb2JqMlt2YWx1ZTJdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJ3ZhbHVlJyAgOiBvYmoyW3ZhbHVlMl1cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gdmFyIGpvaW4gPSBmdW5jdGlvbiAob2JqMSwgb2JqMikgeyByZXR1cm4gb2JqMSB9O1xuXG4gICAgcmVkLnJlZHVjZXIoIGZ1bmN0aW9uIChhcnIpIHtcblx0dmFyIHZhbHVlID0gcmVkLnZhbHVlKCk7XG5cdHZhciByZWR1bmRhbnQgPSByZWQucmVkdW5kYW50KCk7XG5cdHZhciByZWR1Y2VkX2FyciA9IFtdO1xuXHR2YXIgY3VyciA9IHtcblx0ICAgICdvYmplY3QnIDogYXJyWzBdLFxuXHQgICAgJ3ZhbHVlJyAgOiBhcnJbMF1bdmFsdWUyXVxuXHR9O1xuXHRmb3IgKHZhciBpPTE7IGk8YXJyLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBpZiAocmVkdW5kYW50IChhcnJbaV1bdmFsdWVdLCBjdXJyLnZhbHVlKSkge1xuXHRcdGN1cnIgPSBqb2luKGN1cnIsIGFycltpXSk7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICByZWR1Y2VkX2Fyci5wdXNoIChjdXJyLm9iamVjdCk7XG5cdCAgICBjdXJyLm9iamVjdCA9IGFycltpXTtcblx0ICAgIGN1cnIudmFsdWUgPSBhcnJbaV0uZW5kO1xuXHR9XG5cdHJlZHVjZWRfYXJyLnB1c2goY3Vyci5vYmplY3QpO1xuXG5cdC8vIHJlZHVjZWRfYXJyLnB1c2goYXJyW2Fyci5sZW5ndGgtMV0pO1xuXHRyZXR1cm4gcmVkdWNlZF9hcnI7XG4gICAgfSk7XG5cbiAgICByZWR1Y2Uuam9pbiA9IGZ1bmN0aW9uIChjYmFrKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIGpvaW47XG5cdH1cblx0am9pbiA9IGNiYWs7XG5cdHJldHVybiByZWQ7XG4gICAgfTtcblxuICAgIHJlZHVjZS52YWx1ZTIgPSBmdW5jdGlvbiAoZmllbGQpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gdmFsdWUyO1xuXHR9XG5cdHZhbHVlMiA9IGZpZWxkO1xuXHRyZXR1cm4gcmVkO1xuICAgIH07XG5cbiAgICByZXR1cm4gcmVkO1xufTtcblxudmFyIGxpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlZCA9IHJlZHVjZSgpO1xuXG4gICAgcmVkLnJlZHVjZXIgKCBmdW5jdGlvbiAoYXJyKSB7XG5cdHZhciByZWR1bmRhbnQgPSByZWQucmVkdW5kYW50KCk7XG5cdHZhciB2YWx1ZSA9IHJlZC52YWx1ZSgpO1xuXHR2YXIgcmVkdWNlZF9hcnIgPSBbXTtcblx0dmFyIGN1cnIgPSBhcnJbMF07XG5cdGZvciAodmFyIGk9MTsgaTxhcnIubGVuZ3RoLTE7IGkrKykge1xuXHQgICAgaWYgKHJlZHVuZGFudCAoYXJyW2ldW3ZhbHVlXSwgY3Vyclt2YWx1ZV0pKSB7XG5cdFx0Y29udGludWU7XG5cdCAgICB9XG5cdCAgICByZWR1Y2VkX2Fyci5wdXNoIChjdXJyKTtcblx0ICAgIGN1cnIgPSBhcnJbaV07XG5cdH1cblx0cmVkdWNlZF9hcnIucHVzaChjdXJyKTtcblx0cmVkdWNlZF9hcnIucHVzaChhcnJbYXJyLmxlbmd0aC0xXSk7XG5cdHJldHVybiByZWR1Y2VkX2FycjtcbiAgICB9KTtcblxuICAgIHJldHVybiByZWQ7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWNlO1xubW9kdWxlLmV4cG9ydHMubGluZSA9IGxpbmU7XG5tb2R1bGUuZXhwb3J0cy5ibG9jayA9IGJsb2NrO1xuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGl0ZXJhdG9yIDogZnVuY3Rpb24oaW5pdF92YWwpIHtcblx0dmFyIGkgPSBpbml0X3ZhbCB8fCAwO1xuXHR2YXIgaXRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiBpKys7XG5cdH07XG5cdHJldHVybiBpdGVyO1xuICAgIH0sXG5cbiAgICBzY3JpcHRfcGF0aCA6IGZ1bmN0aW9uIChzY3JpcHRfbmFtZSkgeyAvLyBzY3JpcHRfbmFtZSBpcyB0aGUgZmlsZW5hbWVcblx0dmFyIHNjcmlwdF9zY2FwZWQgPSBzY3JpcHRfbmFtZS5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxde31dL2csICdcXFxcJCYnKTtcblx0dmFyIHNjcmlwdF9yZSA9IG5ldyBSZWdFeHAoc2NyaXB0X3NjYXBlZCArICckJyk7XG5cdHZhciBzY3JpcHRfcmVfc3ViID0gbmV3IFJlZ0V4cCgnKC4qKScgKyBzY3JpcHRfc2NhcGVkICsgJyQnKTtcblxuXHQvLyBUT0RPOiBUaGlzIHJlcXVpcmVzIHBoYW50b20uanMgb3IgYSBzaW1pbGFyIGhlYWRsZXNzIHdlYmtpdCB0byB3b3JrIChkb2N1bWVudClcblx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG5cdHZhciBwYXRoID0gXCJcIjsgIC8vIERlZmF1bHQgdG8gY3VycmVudCBwYXRoXG5cdGlmKHNjcmlwdHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yKHZhciBpIGluIHNjcmlwdHMpIHtcblx0XHRpZihzY3JpcHRzW2ldLnNyYyAmJiBzY3JpcHRzW2ldLnNyYy5tYXRjaChzY3JpcHRfcmUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY3JpcHRzW2ldLnNyYy5yZXBsYWNlKHNjcmlwdF9yZV9zdWIsICckMScpO1xuXHRcdH1cbiAgICAgICAgICAgIH1cblx0fVxuXHRyZXR1cm4gcGF0aDtcbiAgICB9LFxuXG4gICAgZGVmZXJfY2FuY2VsIDogZnVuY3Rpb24gKGNiYWssIHRpbWUpIHtcbiAgICAgICAgdmFyIHRpY2s7XG5cbiAgICAgICAgdmFyIGRlZmVyX2NhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aWNrKTtcbiAgICAgICAgICAgIHRpY2sgPSBzZXRUaW1lb3V0IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY2Jhay5hcHBseSAodGhhdCwgYXJncyk7XG4gICAgICAgICAgICB9LCB0aW1lKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZGVmZXJfY2FuY2VsO1xuICAgIH1cbn07XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciBkZWZlcl9jYW5jZWwgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpLmRlZmVyX2NhbmNlbDtcblxudmFyIHRhID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2ggKFwiZHJhZ1wiKTtcblxuICAgIHZhciBub190cmFjayA9IHRydWU7XG4gICAgdmFyIGRpdl9pZDtcblxuICAgIC8vIERlZmF1bHRzXG4gICAgdmFyIHRyZWVfY29uZiA9IHtcbiAgICAgICAgdHJlZTogdW5kZWZpbmVkLFxuICAgICAgICB0cmFjazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHQgPSB0bnQuYm9hcmQudHJhY2soKVxuICAgICAgICAgICAgICAgIC5jb2xvcihcIiNFQkY1RkZcIilcbiAgICAgICAgICAgICAgICAuZGF0YSh0bnQuYm9hcmQudHJhY2suZGF0YSgpXG4gICAgICAgICAgICAgICAgICAgIC51cGRhdGUodG50LmJvYXJkLnRyYWNrLnJldHJpZXZlci5zeW5jKClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXRyaWV2ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICAgLmRpc3BsYXkodG50LmJvYXJkLnRyYWNrLmZlYXR1cmUuYmxvY2soKVxuICAgICAgICAgICAgICAgICAgICAuY29sb3IoXCJzdGVlbGJsdWVcIilcbiAgICAgICAgICAgICAgICAgICAgLmluZGV4KGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC5zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gdDtcbiAgICAgICAgfSxcbiAgICAgICAgYm9hcmQ6IHVuZGVmaW5lZCxcbiAgICAgICAgdG9wOiB1bmRlZmluZWQsXG4gICAgICAgIGJvdHRvbTogdW5kZWZpbmVkLFxuICAgICAgICBrZXk6IHVuZGVmaW5lZCxcbiAgICB9O1xuXG4gICAgdmFyIHRyZWVfYW5ub3QgPSBmdW5jdGlvbiAoZGl2KSB7XG4gICAgICAgIGRpdl9pZCA9IGQzLnNlbGVjdChkaXYpXG4gICAgICAgICAgICAuYXR0cihcImlkXCIpO1xuXG4gICAgICAgIHZhciBncm91cF9kaXYgPSBkMy5zZWxlY3QoZGl2KVxuICAgICAgICAgICAgLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9ncm91cERpdlwiKTtcblxuICAgICAgICB2YXIgdHJlZV9kaXYgPSBncm91cF9kaXZcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfdHJlZV9jb250YWluZXJfXCIgKyBkaXZfaWQpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfY29udGFpbmVyXCIpO1xuXG4gICAgICAgIHZhciBhbm5vdF9kaXYgPSBncm91cF9kaXZcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfYW5ub3RfY29udGFpbmVyX1wiICsgZGl2X2lkKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9hbm5vdF9jb250YWluZXJcIik7XG5cbiAgICAgICAgdmFyIGN1cnJfdHJlZV93aWR0aCA9IHRyZWVfY29uZi50cmVlLmxheW91dCgpLndpZHRoKCk7XG4gICAgICAgIHZhciBkcmFnID0gZ3JvdXBfZGl2XG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgICAgICAuYXR0cihcImlkXCIsIFwidG50X2Fubm90X2RyYWdcIilcbiAgICAgICAgICAgIC5zdHlsZShcImxlZnRcIiwgY3Vycl90cmVlX3dpZHRoICsgXCJweFwiKTtcblxuICAgICAgICAvLyBEcmFnZ2luZ1xuICAgICAgICBkcmFnLm9uKFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZXNpemluZ19wb3MgPSBkMy5ldmVudC5jbGllbnRYO1xuICAgICAgICAgICAgY3Vycl90cmVlX3dpZHRoID0gdHJlZV9jb25mLnRyZWUubGF5b3V0KCkud2lkdGgoKTtcbiAgICAgICAgICAgIHZhciBjdXJyX2JvYXJkX3dpZHRoID0gdHJlZV9jb25mLmJvYXJkLndpZHRoKCk7XG5cbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyX2NhbmNlbChmdW5jdGlvbiBtb3VzZW1vdmUoY2xpZW50WCkge1xuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50X3BvcyA9IGNsaWVudFg7XG4gICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBjdXJyZW50X3BvcyAtIHJlc2l6aW5nX3BvcztcbiAgICAgICAgICAgICAgICAvLyB2YXIgY3Vycl90cmVlX3dpZHRoID0gdHJlZV9jb25mLnRyZWUubGF5b3V0KCkud2lkdGgoKTtcbiAgICAgICAgICAgICAgICB0cmVlX2NvbmYudHJlZS5sYXlvdXQoKS53aWR0aChjdXJyX3RyZWVfd2lkdGggKyBkaWZmKTtcblxuICAgICAgICAgICAgICAgIC8vIHZhciBjdXJyX2JvYXJkX3dpZHRoID0gdHJlZV9jb25mLmJvYXJkLndpZHRoKCk7XG4gICAgICAgICAgICAgICAgdHJlZV9jb25mLmJvYXJkLndpZHRoKGN1cnJfYm9hcmRfd2lkdGggLSBkaWZmKTtcblxuICAgICAgICAgICAgICAgIHRyZWVfY29uZi50cmVlLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHRyZWVfY29uZi5ib2FyZC51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICByZXNpemluZ19wb3MgPSBjdXJyZW50X3BvcztcbiAgICAgICAgICAgICAgICBkaXNwYXRjaC5kcmFnLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9LCAzMDApO1xuXG4gICAgICAgICAgICB2YXIgdyA9IGQzLnNlbGVjdCh3aW5kb3cpXG4gICAgICAgICAgICAgICAgLm9uKFwibW91c2Vtb3ZlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQoZDMuZXZlbnQuY2xpZW50WCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyX3RyZWVfd2lkdGggPSB0cmVlX2NvbmYudHJlZS5sYXlvdXQoKS53aWR0aCgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlmZiA9IGQzLmV2ZW50LmNsaWVudFggLSByZXNpemluZ19wb3M7XG4gICAgICAgICAgICAgICAgICAgIGRyYWcuc3R5bGUoXCJsZWZ0XCIsIChjdXJyX3RyZWVfd2lkdGggKyBkaWZmKSArIFwicHhcIik7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAub24oXCJtb3VzZXVwXCIsIG1vdXNldXApO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBtb3VzZXVwKCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IERvZXMgdGhpcyByZW1vdmUgb3RoZXIgbGlzdGVuZXJzIG9uIHRoZSB3aW5kb3c/XG4gICAgICAgICAgICAgICAgdy5vbihcIm1vdXNlbW92ZVwiLCBudWxsKS5vbihcIm1vdXNldXBcIiwgbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyZWVfY29uZi50cmVlKHRyZWVfZGl2Lm5vZGUoKSk7XG5cbiAgICAgICAgLy8gdHJhY2tzXG4gICAgICAgIHZhciBsZWF2ZXMgPSB0cmVlX2NvbmYudHJlZS5yb290KCkuZ2V0X2FsbF9sZWF2ZXMoKTtcbiAgICAgICAgdmFyIHRyYWNrcyA9IFtdO1xuXG4gICAgICAgIHZhciBoZWlnaHQgPSB0cmVlX2NvbmYudHJlZS5sYWJlbCgpLmhlaWdodCgpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVhdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAvLyBCbG9jayBUcmFjazFcbiAgICAgICAgICAgIChmdW5jdGlvbiAobGVhZikge1xuICAgICAgICAgICAgICAgIHRudC5ib2FyZC50cmFjay5pZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyZWVfY29uZi5rZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxlYWYuaWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mICh0cmVlX2NvbmYua2V5KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyZWVfY29uZi5rZXkobGVhZik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxlYWYucHJvcGVydHkodHJlZV9jb25mLmtleSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgdHJhY2sgPSB0cmVlX2NvbmYudHJhY2sobGVhdmVzW2ldKVxuICAgICAgICAgICAgICAgICAgICAuaGVpZ2h0KGhlaWdodCk7XG5cbiAgICAgICAgICAgICAgICB0cmFja3MucHVzaCh0cmFjayk7XG4gICAgICAgICAgICB9KShsZWF2ZXNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRyZWVfY29uZi5ib2FyZCkge1xuICAgICAgICAgICAgaWYgKHRyZWVfY29uZi50b3ApIHtcbiAgICAgICAgICAgICAgICB0cmVlX2NvbmYuYm9hcmRcbiAgICAgICAgICAgICAgICAgICAgLmFkZF90cmFjayh0cmVlX2NvbmYudG9wKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJlZV9jb25mLmJvYXJkXG4gICAgICAgICAgICAgICAgLmFkZF90cmFjayh0cmFja3MpO1xuXG4gICAgICAgICAgICBpZiAodHJlZV9jb25mLmJvdHRvbSkge1xuICAgICAgICAgICAgICAgIHRyZWVfY29uZi5ib2FyZFxuICAgICAgICAgICAgICAgICAgICAuYWRkX3RyYWNrKHRyZWVfY29uZi5ib3R0b20pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmVlX2NvbmYuYm9hcmQoYW5ub3RfZGl2Lm5vZGUoKSk7XG4gICAgICAgICAgICB0cmVlX2NvbmYuYm9hcmQuc3RhcnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFwaS5tZXRob2QoJ3VwZGF0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRyZWVfY29uZi50cmVlLnVwZGF0ZSgpO1xuXG4gICAgICAgICAgICBpZiAodHJlZV9jb25mLmJvYXJkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxlYXZlcyA9IHRyZWVfY29uZi50cmVlLnJvb3QoKS5nZXRfYWxsX2xlYXZlcygpO1xuICAgICAgICAgICAgICAgIHZhciBuZXdfdHJhY2tzID0gW107XG5cbiAgICAgICAgICAgICAgICBpZiAodHJlZV9jb25mLnRvcCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndG9wIGhlaWdodCBpcy4uLicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0cmVlX2NvbmYudG9wLmhlaWdodCgpKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3X3RyYWNrcy5wdXNoKHRyZWVfY29uZi50b3ApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVhdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGZpcnN0IHNlZSBpZiB3ZSBoYXZlIGEgdHJhY2sgZm9yIHRoZSBsZWFmOlxuICAgICAgICAgICAgICAgICAgICB2YXIgaWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmVlX2NvbmYua2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gbGVhdmVzW2ldLmlkKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mICh0cmVlX2NvbmYua2V5KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSB0cmVlX2NvbmYua2V5KGxlYXZlc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGxlYXZlc1tpXS5wcm9wZXJ0eSh0cmVlX2NvbmYua2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgY3Vycl90cmFjayA9IHRyZWVfY29uZi5ib2FyZC5maW5kX3RyYWNrKGlkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJfdHJhY2sgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTmV3IGxlYWYgLS0gbm8gdHJhY2sgZm9yIGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24gKGxlYWYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bnQuYm9hcmQudHJhY2suaWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0cmVlX2NvbmYua2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBsZWFmLmlkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAodHJlZV9jb25mLmtleSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cmVlX2NvbmYua2V5KGxlYWYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBsZWFmLnByb3BlcnR5KHRyZWVfY29uZi5rZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vycl90cmFjayA9IHRyZWVfY29uZi50cmFjayhsZWF2ZXNbaV0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5oZWlnaHQoaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKGxlYXZlc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbmV3X3RyYWNrcy5wdXNoKGN1cnJfdHJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodHJlZV9jb25mLmJvdHRvbSkge1xuICAgICAgICAgICAgICAgICAgICBuZXdfdHJhY2tzLnB1c2godHJlZV9jb25mLmJvdHRvbSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJlZV9jb25mLmJvYXJkLnRyYWNrcyhuZXdfdHJhY2tzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRyZWVfYW5ub3Q7XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyh0cmVlX2Fubm90KVxuICAgICAgICAuZ2V0c2V0KHRyZWVfY29uZik7XG5cbiAgICAvLyBUT0RPOiBSZXdyaXRlIHdpdGggdGhlIGFwaSBpbnRlcmZhY2VcbiAgICB0cmVlX2Fubm90LnRyYWNrID0gZnVuY3Rpb24gKG5ld190cmFjaykge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0cmVlX2NvbmYudHJhY2s7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGaXJzdCB0aW1lIGl0IGlzIHNldFxuICAgICAgICBpZiAobm9fdHJhY2spIHtcbiAgICAgICAgICAgIHRyZWVfY29uZi50cmFjayA9IG5ld190cmFjaztcbiAgICAgICAgICAgIG5vX3RyYWNrID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdHJlZV9hbm5vdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGl0IGlzIHJlc2V0IC0tIGFwcGx5IHRoZSBjaGFuZ2VzXG4gICAgICAgIHZhciB0cmFja3MgPSB0cmVlX2NvbmYuYm9hcmQudHJhY2tzKCk7XG5cbiAgICAgICAgdmFyIHN0YXJ0X2luZGV4ID0gMDtcbiAgICAgICAgdmFyIG5faW5kZXggPSAwO1xuXG4gICAgICAgIGlmICh0cmVlX2NvbmYudG9wICYmIHRyZWVfY29uZi5ib3R0b20pIHtcbiAgICAgICAgICAgIHN0YXJ0X2luZGV4ID0gMTtcbiAgICAgICAgICAgIG5faW5kZXggPSAyO1xuICAgICAgICB9IGVsc2UgaWYgKHRyZWVfY29uZi50b3ApIHtcbiAgICAgICAgICAgIHN0YXJ0X2luZGV4ID0gMTtcbiAgICAgICAgICAgIG5faW5kZXggPSAxO1xuICAgICAgICB9IGVsc2UgaWYgKHRyZWVfY29uZi5ib3R0b20pIHtcbiAgICAgICAgICAgIG5faW5kZXggPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVzZXQgdG9wIHRyYWNrIC0tIGF4aXNcbiAgICAgICAgaWYgKHN0YXJ0X2luZGV4ID4gMCkge1xuICAgICAgICAgICAgdHJhY2tzWzBdLmRpc3BsYXkoKS5yZXNldC5jYWxsKHRyYWNrc1swXSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmVzZXQgYm90dG9tIHRyYWNrIC0tIGF4aXNcbiAgICAgICAgaWYgKG5faW5kZXggPiBzdGFydF9pbmRleCkge1xuICAgICAgICAgICAgdmFyIG4gPSB0cmFja3MubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIHRyYWNrc1tuXS5kaXNwbGF5KCkucmVzZXQuY2FsbCh0cmFja3Nbbl0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IHN0YXJ0X2luZGV4OyBpIDw9ICh0cmFja3MubGVuZ3RoIC0gbl9pbmRleCk7IGkrKykge1xuICAgICAgICAgICAgdmFyIHQgPSB0cmFja3NbaV07XG4gICAgICAgICAgICB0LmRpc3BsYXkoKS5yZXNldC5jYWxsKHQpO1xuICAgICAgICAgICAgdmFyIGxlYWY7XG4gICAgICAgICAgICB0cmVlX2NvbmYudHJlZS5yb290KCkuYXBwbHkoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5pZCgpID09PSB0LmlkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGVhZiA9IG5vZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciBuX3RyYWNrO1xuICAgICAgICAgICAgKGZ1bmN0aW9uIChsZWFmKSB7XG4gICAgICAgICAgICAgICAgdG50LmJvYXJkLnRyYWNrLmlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHJlZV9jb25mLmtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVhZi5pZCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKHRyZWVfY29uZi5rZXkgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJlZV9jb25mLmtleShsZWFmKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVhZi5wcm9wZXJ0eSh0cmVlX2NvbmYua2V5KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG5fdHJhY2sgPSBuZXdfdHJhY2sobGVhZilcbiAgICAgICAgICAgICAgICAgICAgLmhlaWdodCh0cmVlX2NvbmYudHJlZS5sYWJlbCgpLmhlaWdodCgpKTtcbiAgICAgICAgICAgIH0pKGxlYWYpO1xuXG4gICAgICAgICAgICB0cmFja3NbaV0gPSBuX3RyYWNrO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZV9jb25mLnRyYWNrID0gbmV3X3RyYWNrO1xuICAgICAgICB0cmVlX2NvbmYuYm9hcmQuc3RhcnQoKTtcbiAgICB9O1xuXG4gICAgLy8gcmV0dXJuIHRyZWVfYW5ub3Q7XG4gICAgcmV0dXJuIGQzLnJlYmluZCAodHJlZV9hbm5vdCwgZGlzcGF0Y2gsIFwib25cIik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0YTtcbiJdfQ==

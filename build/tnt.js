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

        var drag = annot_div
            .append("div")
            .attr("id", "tnt_annot_drag");

        // Dragging
        drag.on("mousedown", function () {
            var resizing_pos = d3.event.clientX;

            var deferred = defer_cancel(function mousemove(clientX) {
                var current_pos = clientX;
                var diff = current_pos - resizing_pos;
                var curr_tree_width = tree_conf.tree.layout().width();
                tree_conf.tree.layout().width(curr_tree_width + diff);

                var curr_board_width = tree_conf.board.width();
                tree_conf.board.width(curr_board_width - diff);

                tree_conf.tree.update();
                tree_conf.board.update();
                resizing_pos = current_pos;
                dispatch.drag.call(this);
            }, 300);

            var w = d3.select(window)
                .on("mousemove", function () {
                    deferred(d3.event.clientX);
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
        // var start_index = (tree_conf.ruler === 'both' || tree_conf.ruler === 'top') ? 1 : 0;
        // var end_index = (tree_conf.ruler === 'both' || tree_conf.ruler === 'bottom') ? 1 : 0;

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

        // if (tree_conf.ruler === "both") {
        //     start_index = 1;
        //     n_index = 2;
        // } else if (tree_conf.ruler === "top") {
        //     start_index = 1;
        //     n_index = 1;
        // } else if (tree_conf.ruler === "bottom") {
        //     n_index = 1;
        // }

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvZmFrZV8xNTMxMWFkMS5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvaW5kZXguanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZS9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZS5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL2JhY2tib25lLWV2ZW50cy1zdGFuZGFsb25lL2luZGV4LmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvYmlvanMtZXZlbnRzL2luZGV4LmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5hcGkvc3JjL2FwaS5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5ib2FyZC9pbmRleC5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5ib2FyZC9zcmMvYm9hcmQuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2RhdGEuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2ZlYXR1cmUuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL2luZGV4LmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LmJvYXJkL3NyYy9sYXlvdXQuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL3NwaW5uZXIuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQuYm9hcmQvc3JjL3RyYWNrLmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50Lm5ld2ljay9pbmRleC5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC5uZXdpY2svc3JjL25ld2ljay5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC50cmVlLm5vZGUvaW5kZXguanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS5ub2RlL3NyYy9ub2RlLmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnRyZWUvaW5kZXguanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvZGlhZ29uYWwuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvaW5kZXguanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbGFiZWwuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudHJlZS9zcmMvbGF5b3V0LmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnRyZWUvc3JjL25vZGVfZGlzcGxheS5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC50cmVlL3NyYy90cmVlLmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL2luZGV4LmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9taWd1ZWxwaWduYXRlbGxpL3NyYy9yZXBvcy90bnQvbm9kZV9tb2R1bGVzL3RudC51dGlscy9zcmMvcG5nLmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9ub2RlX21vZHVsZXMvdG50LnV0aWxzL3NyYy9yZWR1Y2UuanMiLCIvVXNlcnMvbWlndWVscGlnbmF0ZWxsaS9zcmMvcmVwb3MvdG50L25vZGVfbW9kdWxlcy90bnQudXRpbHMvc3JjL3V0aWxzLmpzIiwiL1VzZXJzL21pZ3VlbHBpZ25hdGVsbGkvc3JjL3JlcG9zL3RudC9zcmMvdGEuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BSQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDajJCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyZkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5kZXguanNcIik7XG4iLCJpZiAodHlwZW9mIHRudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gdG50ID0gcmVxdWlyZShcIi4vc3JjL3RhLmpzXCIpO1xufVxuXG52YXIgZXZlbnRzeXN0ZW0gPSByZXF1aXJlIChcImJpb2pzLWV2ZW50c1wiKTtcbmV2ZW50c3lzdGVtLm1peGluICh0bnQpO1xudG50LnV0aWxzID0gcmVxdWlyZSAoXCJ0bnQudXRpbHNcIik7XG50bnQudHJlZSA9IHJlcXVpcmUgKFwidG50LnRyZWVcIik7XG50bnQudHJlZS5ub2RlID0gcmVxdWlyZSAoXCJ0bnQudHJlZS5ub2RlXCIpO1xudG50LnRyZWUucGFyc2VfbmV3aWNrID0gcmVxdWlyZShcInRudC5uZXdpY2tcIikucGFyc2VfbmV3aWNrO1xudG50LnRyZWUucGFyc2Vfbmh4ID0gcmVxdWlyZShcInRudC5uZXdpY2tcIikucGFyc2Vfbmh4O1xudG50LmJvYXJkID0gcmVxdWlyZSAoXCJ0bnQuYm9hcmRcIik7XG4iLCIvKipcbiAqIFN0YW5kYWxvbmUgZXh0cmFjdGlvbiBvZiBCYWNrYm9uZS5FdmVudHMsIG5vIGV4dGVybmFsIGRlcGVuZGVuY3kgcmVxdWlyZWQuXG4gKiBEZWdyYWRlcyBuaWNlbHkgd2hlbiBCYWNrb25lL3VuZGVyc2NvcmUgYXJlIGFscmVhZHkgYXZhaWxhYmxlIGluIHRoZSBjdXJyZW50XG4gKiBnbG9iYWwgY29udGV4dC5cbiAqXG4gKiBOb3RlIHRoYXQgZG9jcyBzdWdnZXN0IHRvIHVzZSB1bmRlcnNjb3JlJ3MgYF8uZXh0ZW5kKClgIG1ldGhvZCB0byBhZGQgRXZlbnRzXG4gKiBzdXBwb3J0IHRvIHNvbWUgZ2l2ZW4gb2JqZWN0LiBBIGBtaXhpbigpYCBtZXRob2QgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIEV2ZW50c1xuICogcHJvdG90eXBlIHRvIGF2b2lkIHVzaW5nIHVuZGVyc2NvcmUgZm9yIHRoYXQgc29sZSBwdXJwb3NlOlxuICpcbiAqICAgICB2YXIgbXlFdmVudEVtaXR0ZXIgPSBCYWNrYm9uZUV2ZW50cy5taXhpbih7fSk7XG4gKlxuICogT3IgZm9yIGEgZnVuY3Rpb24gY29uc3RydWN0b3I6XG4gKlxuICogICAgIGZ1bmN0aW9uIE15Q29uc3RydWN0b3IoKXt9XG4gKiAgICAgTXlDb25zdHJ1Y3Rvci5wcm90b3R5cGUuZm9vID0gZnVuY3Rpb24oKXt9XG4gKiAgICAgQmFja2JvbmVFdmVudHMubWl4aW4oTXlDb25zdHJ1Y3Rvci5wcm90b3R5cGUpO1xuICpcbiAqIChjKSAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIEluYy5cbiAqIChjKSAyMDEzIE5pY29sYXMgUGVycmlhdWx0XG4gKi9cbi8qIGdsb2JhbCBleHBvcnRzOnRydWUsIGRlZmluZSwgbW9kdWxlICovXG4oZnVuY3Rpb24oKSB7XG4gIHZhciByb290ID0gdGhpcyxcbiAgICAgIG5hdGl2ZUZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaCxcbiAgICAgIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSxcbiAgICAgIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLFxuICAgICAgaWRDb3VudGVyID0gMDtcblxuICAvLyBSZXR1cm5zIGEgcGFydGlhbCBpbXBsZW1lbnRhdGlvbiBtYXRjaGluZyB0aGUgbWluaW1hbCBBUEkgc3Vic2V0IHJlcXVpcmVkXG4gIC8vIGJ5IEJhY2tib25lLkV2ZW50c1xuICBmdW5jdGlvbiBtaW5pc2NvcmUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGtleXM6IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG9iaiAhPT0gXCJmdW5jdGlvblwiIHx8IG9iaiA9PT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJrZXlzKCkgY2FsbGVkIG9uIGEgbm9uLW9iamVjdFwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIga2V5LCBrZXlzID0gW107XG4gICAgICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAga2V5c1trZXlzLmxlbmd0aF0gPSBrZXk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXlzO1xuICAgICAgfSxcblxuICAgICAgdW5pcXVlSWQ6IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgICAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgICAgICByZXR1cm4gcHJlZml4ID8gcHJlZml4ICsgaWQgOiBpZDtcbiAgICAgIH0sXG5cbiAgICAgIGhhczogZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICAgICAgfSxcblxuICAgICAgZWFjaDogZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgICAgICBpZiAob2JqID09IG51bGwpIHJldHVybjtcbiAgICAgICAgaWYgKG5hdGl2ZUZvckVhY2ggJiYgb2JqLmZvckVhY2ggPT09IG5hdGl2ZUZvckVhY2gpIHtcbiAgICAgICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG9iai5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5oYXMob2JqLCBrZXkpKSB7XG4gICAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2tleV0sIGtleSwgb2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIG9uY2U6IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgdmFyIHJhbiA9IGZhbHNlLCBtZW1vO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKHJhbikgcmV0dXJuIG1lbW87XG4gICAgICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgICAgICBtZW1vID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgICAgIHJldHVybiBtZW1vO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICB2YXIgXyA9IG1pbmlzY29yZSgpLCBFdmVudHM7XG5cbiAgLy8gQmFja2JvbmUuRXZlbnRzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEEgbW9kdWxlIHRoYXQgY2FuIGJlIG1peGVkIGluIHRvICphbnkgb2JqZWN0KiBpbiBvcmRlciB0byBwcm92aWRlIGl0IHdpdGhcbiAgLy8gY3VzdG9tIGV2ZW50cy4gWW91IG1heSBiaW5kIHdpdGggYG9uYCBvciByZW1vdmUgd2l0aCBgb2ZmYCBjYWxsYmFja1xuICAvLyBmdW5jdGlvbnMgdG8gYW4gZXZlbnQ7IGB0cmlnZ2VyYC1pbmcgYW4gZXZlbnQgZmlyZXMgYWxsIGNhbGxiYWNrcyBpblxuICAvLyBzdWNjZXNzaW9uLlxuICAvL1xuICAvLyAgICAgdmFyIG9iamVjdCA9IHt9O1xuICAvLyAgICAgXy5leHRlbmQob2JqZWN0LCBCYWNrYm9uZS5FdmVudHMpO1xuICAvLyAgICAgb2JqZWN0Lm9uKCdleHBhbmQnLCBmdW5jdGlvbigpeyBhbGVydCgnZXhwYW5kZWQnKTsgfSk7XG4gIC8vICAgICBvYmplY3QudHJpZ2dlcignZXhwYW5kJyk7XG4gIC8vXG4gIEV2ZW50cyA9IHtcblxuICAgIC8vIEJpbmQgYW4gZXZlbnQgdG8gYSBgY2FsbGJhY2tgIGZ1bmN0aW9uLiBQYXNzaW5nIGBcImFsbFwiYCB3aWxsIGJpbmRcbiAgICAvLyB0aGUgY2FsbGJhY2sgdG8gYWxsIGV2ZW50cyBmaXJlZC5cbiAgICBvbjogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIGlmICghZXZlbnRzQXBpKHRoaXMsICdvbicsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pIHx8ICFjYWxsYmFjaykgcmV0dXJuIHRoaXM7XG4gICAgICB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcbiAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV0gfHwgKHRoaXMuX2V2ZW50c1tuYW1lXSA9IFtdKTtcbiAgICAgIGV2ZW50cy5wdXNoKHtjYWxsYmFjazogY2FsbGJhY2ssIGNvbnRleHQ6IGNvbnRleHQsIGN0eDogY29udGV4dCB8fCB0aGlzfSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gQmluZCBhbiBldmVudCB0byBvbmx5IGJlIHRyaWdnZXJlZCBhIHNpbmdsZSB0aW1lLiBBZnRlciB0aGUgZmlyc3QgdGltZVxuICAgIC8vIHRoZSBjYWxsYmFjayBpcyBpbnZva2VkLCBpdCB3aWxsIGJlIHJlbW92ZWQuXG4gICAgb25jZTogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIGlmICghZXZlbnRzQXBpKHRoaXMsICdvbmNlJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkgfHwgIWNhbGxiYWNrKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBvbmNlID0gXy5vbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLm9mZihuYW1lLCBvbmNlKTtcbiAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH0pO1xuICAgICAgb25jZS5fY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgIHJldHVybiB0aGlzLm9uKG5hbWUsIG9uY2UsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgb25lIG9yIG1hbnkgY2FsbGJhY2tzLiBJZiBgY29udGV4dGAgaXMgbnVsbCwgcmVtb3ZlcyBhbGxcbiAgICAvLyBjYWxsYmFja3Mgd2l0aCB0aGF0IGZ1bmN0aW9uLiBJZiBgY2FsbGJhY2tgIGlzIG51bGwsIHJlbW92ZXMgYWxsXG4gICAgLy8gY2FsbGJhY2tzIGZvciB0aGUgZXZlbnQuIElmIGBuYW1lYCBpcyBudWxsLCByZW1vdmVzIGFsbCBib3VuZFxuICAgIC8vIGNhbGxiYWNrcyBmb3IgYWxsIGV2ZW50cy5cbiAgICBvZmY6IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmV0YWluLCBldiwgZXZlbnRzLCBuYW1lcywgaSwgbCwgaiwgaztcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzIHx8ICFldmVudHNBcGkodGhpcywgJ29mZicsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pKSByZXR1cm4gdGhpcztcbiAgICAgIGlmICghbmFtZSAmJiAhY2FsbGJhY2sgJiYgIWNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICBuYW1lcyA9IG5hbWUgPyBbbmFtZV0gOiBfLmtleXModGhpcy5fZXZlbnRzKTtcbiAgICAgIGZvciAoaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgbmFtZSA9IG5hbWVzW2ldO1xuICAgICAgICBpZiAoZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdKSB7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzW25hbWVdID0gcmV0YWluID0gW107XG4gICAgICAgICAgaWYgKGNhbGxiYWNrIHx8IGNvbnRleHQpIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGsgPSBldmVudHMubGVuZ3RoOyBqIDwgazsgaisrKSB7XG4gICAgICAgICAgICAgIGV2ID0gZXZlbnRzW2pdO1xuICAgICAgICAgICAgICBpZiAoKGNhbGxiYWNrICYmIGNhbGxiYWNrICE9PSBldi5jYWxsYmFjayAmJiBjYWxsYmFjayAhPT0gZXYuY2FsbGJhY2suX2NhbGxiYWNrKSB8fFxuICAgICAgICAgICAgICAgICAgKGNvbnRleHQgJiYgY29udGV4dCAhPT0gZXYuY29udGV4dCkpIHtcbiAgICAgICAgICAgICAgICByZXRhaW4ucHVzaChldik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFyZXRhaW4ubGVuZ3RoKSBkZWxldGUgdGhpcy5fZXZlbnRzW25hbWVdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBUcmlnZ2VyIG9uZSBvciBtYW55IGV2ZW50cywgZmlyaW5nIGFsbCBib3VuZCBjYWxsYmFja3MuIENhbGxiYWNrcyBhcmVcbiAgICAvLyBwYXNzZWQgdGhlIHNhbWUgYXJndW1lbnRzIGFzIGB0cmlnZ2VyYCBpcywgYXBhcnQgZnJvbSB0aGUgZXZlbnQgbmFtZVxuICAgIC8vICh1bmxlc3MgeW91J3JlIGxpc3RlbmluZyBvbiBgXCJhbGxcImAsIHdoaWNoIHdpbGwgY2F1c2UgeW91ciBjYWxsYmFjayB0b1xuICAgIC8vIHJlY2VpdmUgdGhlIHRydWUgbmFtZSBvZiB0aGUgZXZlbnQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50KS5cbiAgICB0cmlnZ2VyOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIGlmICghZXZlbnRzQXBpKHRoaXMsICd0cmlnZ2VyJywgbmFtZSwgYXJncykpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXTtcbiAgICAgIHZhciBhbGxFdmVudHMgPSB0aGlzLl9ldmVudHMuYWxsO1xuICAgICAgaWYgKGV2ZW50cykgdHJpZ2dlckV2ZW50cyhldmVudHMsIGFyZ3MpO1xuICAgICAgaWYgKGFsbEV2ZW50cykgdHJpZ2dlckV2ZW50cyhhbGxFdmVudHMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gVGVsbCB0aGlzIG9iamVjdCB0byBzdG9wIGxpc3RlbmluZyB0byBlaXRoZXIgc3BlY2lmaWMgZXZlbnRzIC4uLiBvclxuICAgIC8vIHRvIGV2ZXJ5IG9iamVjdCBpdCdzIGN1cnJlbnRseSBsaXN0ZW5pbmcgdG8uXG4gICAgc3RvcExpc3RlbmluZzogZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycztcbiAgICAgIGlmICghbGlzdGVuZXJzKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBkZWxldGVMaXN0ZW5lciA9ICFuYW1lICYmICFjYWxsYmFjaztcbiAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIGNhbGxiYWNrID0gdGhpcztcbiAgICAgIGlmIChvYmopIChsaXN0ZW5lcnMgPSB7fSlbb2JqLl9saXN0ZW5lcklkXSA9IG9iajtcbiAgICAgIGZvciAodmFyIGlkIGluIGxpc3RlbmVycykge1xuICAgICAgICBsaXN0ZW5lcnNbaWRdLm9mZihuYW1lLCBjYWxsYmFjaywgdGhpcyk7XG4gICAgICAgIGlmIChkZWxldGVMaXN0ZW5lcikgZGVsZXRlIHRoaXMuX2xpc3RlbmVyc1tpZF07XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgfTtcblxuICAvLyBSZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byBzcGxpdCBldmVudCBzdHJpbmdzLlxuICB2YXIgZXZlbnRTcGxpdHRlciA9IC9cXHMrLztcblxuICAvLyBJbXBsZW1lbnQgZmFuY3kgZmVhdHVyZXMgb2YgdGhlIEV2ZW50cyBBUEkgc3VjaCBhcyBtdWx0aXBsZSBldmVudFxuICAvLyBuYW1lcyBgXCJjaGFuZ2UgYmx1clwiYCBhbmQgalF1ZXJ5LXN0eWxlIGV2ZW50IG1hcHMgYHtjaGFuZ2U6IGFjdGlvbn1gXG4gIC8vIGluIHRlcm1zIG9mIHRoZSBleGlzdGluZyBBUEkuXG4gIHZhciBldmVudHNBcGkgPSBmdW5jdGlvbihvYmosIGFjdGlvbiwgbmFtZSwgcmVzdCkge1xuICAgIGlmICghbmFtZSkgcmV0dXJuIHRydWU7XG5cbiAgICAvLyBIYW5kbGUgZXZlbnQgbWFwcy5cbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gbmFtZSkge1xuICAgICAgICBvYmpbYWN0aW9uXS5hcHBseShvYmosIFtrZXksIG5hbWVba2V5XV0uY29uY2F0KHJlc3QpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgc3BhY2Ugc2VwYXJhdGVkIGV2ZW50IG5hbWVzLlxuICAgIGlmIChldmVudFNwbGl0dGVyLnRlc3QobmFtZSkpIHtcbiAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoZXZlbnRTcGxpdHRlcik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBvYmpbYWN0aW9uXS5hcHBseShvYmosIFtuYW1lc1tpXV0uY29uY2F0KHJlc3QpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBBIGRpZmZpY3VsdC10by1iZWxpZXZlLCBidXQgb3B0aW1pemVkIGludGVybmFsIGRpc3BhdGNoIGZ1bmN0aW9uIGZvclxuICAvLyB0cmlnZ2VyaW5nIGV2ZW50cy4gVHJpZXMgdG8ga2VlcCB0aGUgdXN1YWwgY2FzZXMgc3BlZWR5IChtb3N0IGludGVybmFsXG4gIC8vIEJhY2tib25lIGV2ZW50cyBoYXZlIDMgYXJndW1lbnRzKS5cbiAgdmFyIHRyaWdnZXJFdmVudHMgPSBmdW5jdGlvbihldmVudHMsIGFyZ3MpIHtcbiAgICB2YXIgZXYsIGkgPSAtMSwgbCA9IGV2ZW50cy5sZW5ndGgsIGExID0gYXJnc1swXSwgYTIgPSBhcmdzWzFdLCBhMyA9IGFyZ3NbMl07XG4gICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgICAgY2FzZSAwOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCk7IHJldHVybjtcbiAgICAgIGNhc2UgMTogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExKTsgcmV0dXJuO1xuICAgICAgY2FzZSAyOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEsIGEyKTsgcmV0dXJuO1xuICAgICAgY2FzZSAzOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEsIGEyLCBhMyk7IHJldHVybjtcbiAgICAgIGRlZmF1bHQ6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmFwcGx5KGV2LmN0eCwgYXJncyk7XG4gICAgfVxuICB9O1xuXG4gIHZhciBsaXN0ZW5NZXRob2RzID0ge2xpc3RlblRvOiAnb24nLCBsaXN0ZW5Ub09uY2U6ICdvbmNlJ307XG5cbiAgLy8gSW52ZXJzaW9uLW9mLWNvbnRyb2wgdmVyc2lvbnMgb2YgYG9uYCBhbmQgYG9uY2VgLiBUZWxsICp0aGlzKiBvYmplY3QgdG9cbiAgLy8gbGlzdGVuIHRvIGFuIGV2ZW50IGluIGFub3RoZXIgb2JqZWN0IC4uLiBrZWVwaW5nIHRyYWNrIG9mIHdoYXQgaXQnc1xuICAvLyBsaXN0ZW5pbmcgdG8uXG4gIF8uZWFjaChsaXN0ZW5NZXRob2RzLCBmdW5jdGlvbihpbXBsZW1lbnRhdGlvbiwgbWV0aG9kKSB7XG4gICAgRXZlbnRzW21ldGhvZF0gPSBmdW5jdGlvbihvYmosIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzIHx8ICh0aGlzLl9saXN0ZW5lcnMgPSB7fSk7XG4gICAgICB2YXIgaWQgPSBvYmouX2xpc3RlbmVySWQgfHwgKG9iai5fbGlzdGVuZXJJZCA9IF8udW5pcXVlSWQoJ2wnKSk7XG4gICAgICBsaXN0ZW5lcnNbaWRdID0gb2JqO1xuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0JykgY2FsbGJhY2sgPSB0aGlzO1xuICAgICAgb2JqW2ltcGxlbWVudGF0aW9uXShuYW1lLCBjYWxsYmFjaywgdGhpcyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICB9KTtcblxuICAvLyBBbGlhc2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbiAgRXZlbnRzLmJpbmQgICA9IEV2ZW50cy5vbjtcbiAgRXZlbnRzLnVuYmluZCA9IEV2ZW50cy5vZmY7XG5cbiAgLy8gTWl4aW4gdXRpbGl0eVxuICBFdmVudHMubWl4aW4gPSBmdW5jdGlvbihwcm90bykge1xuICAgIHZhciBleHBvcnRzID0gWydvbicsICdvbmNlJywgJ29mZicsICd0cmlnZ2VyJywgJ3N0b3BMaXN0ZW5pbmcnLCAnbGlzdGVuVG8nLFxuICAgICAgICAgICAgICAgICAgICdsaXN0ZW5Ub09uY2UnLCAnYmluZCcsICd1bmJpbmQnXTtcbiAgICBfLmVhY2goZXhwb3J0cywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgcHJvdG9bbmFtZV0gPSB0aGlzW25hbWVdO1xuICAgIH0sIHRoaXMpO1xuICAgIHJldHVybiBwcm90bztcbiAgfTtcblxuICAvLyBFeHBvcnQgRXZlbnRzIGFzIEJhY2tib25lRXZlbnRzIGRlcGVuZGluZyBvbiBjdXJyZW50IGNvbnRleHRcbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gRXZlbnRzO1xuICAgIH1cbiAgICBleHBvcnRzLkJhY2tib25lRXZlbnRzID0gRXZlbnRzO1xuICB9ZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PSBcIm9iamVjdFwiKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIEV2ZW50cztcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByb290LkJhY2tib25lRXZlbnRzID0gRXZlbnRzO1xuICB9XG59KSh0aGlzKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9iYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZScpO1xuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoXCJiYWNrYm9uZS1ldmVudHMtc3RhbmRhbG9uZVwiKTtcblxuZXZlbnRzLm9uQWxsID0gZnVuY3Rpb24oY2FsbGJhY2ssY29udGV4dCl7XG4gIHRoaXMub24oXCJhbGxcIiwgY2FsbGJhY2ssY29udGV4dCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gTWl4aW4gdXRpbGl0eVxuZXZlbnRzLm9sZE1peGluID0gZXZlbnRzLm1peGluO1xuZXZlbnRzLm1peGluID0gZnVuY3Rpb24ocHJvdG8pIHtcbiAgZXZlbnRzLm9sZE1peGluKHByb3RvKTtcbiAgLy8gYWRkIGN1c3RvbSBvbkFsbFxuICB2YXIgZXhwb3J0cyA9IFsnb25BbGwnXTtcbiAgZm9yKHZhciBpPTA7IGkgPCBleHBvcnRzLmxlbmd0aDtpKyspe1xuICAgIHZhciBuYW1lID0gZXhwb3J0c1tpXTtcbiAgICBwcm90b1tuYW1lXSA9IHRoaXNbbmFtZV07XG4gIH1cbiAgcmV0dXJuIHByb3RvO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBldmVudHM7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9hcGkuanNcIik7XG4iLCJ2YXIgYXBpID0gZnVuY3Rpb24gKHdobykge1xuXG4gICAgdmFyIF9tZXRob2RzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbSA9IFtdO1xuXG5cdG0uYWRkX2JhdGNoID0gZnVuY3Rpb24gKG9iaikge1xuXHQgICAgbS51bnNoaWZ0KG9iaik7XG5cdH07XG5cblx0bS51cGRhdGUgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0bVtpXVtwXSA9IHZhbHVlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdH07XG5cblx0bS5hZGQgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgaWYgKG0udXBkYXRlIChtZXRob2QsIHZhbHVlKSApIHtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIHJlZyA9IHt9O1xuXHRcdHJlZ1ttZXRob2RdID0gdmFsdWU7XG5cdFx0bS5hZGRfYmF0Y2ggKHJlZyk7XG5cdCAgICB9XG5cdH07XG5cblx0bS5nZXQgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRyZXR1cm4gbVtpXVtwXTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0fTtcblxuXHRyZXR1cm4gbTtcbiAgICB9O1xuXG4gICAgdmFyIG1ldGhvZHMgICAgPSBfbWV0aG9kcygpO1xuICAgIHZhciBhcGkgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIGFwaS5jaGVjayA9IGZ1bmN0aW9uIChtZXRob2QsIGNoZWNrLCBtc2cpIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLmNoZWNrKG1ldGhvZFtpXSwgY2hlY2ssIG1zZyk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QuY2hlY2soY2hlY2ssIG1zZyk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS5jaGVjayhjaGVjaywgbXNnKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkudHJhbnNmb3JtID0gZnVuY3Rpb24gKG1ldGhvZCwgY2Jhaykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkudHJhbnNmb3JtIChtZXRob2RbaV0sIGNiYWspO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLnRyYW5zZm9ybSAoY2Jhayk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS50cmFuc2Zvcm0oY2Jhayk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgdmFyIGF0dGFjaF9tZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kLCBvcHRzKSB7XG5cdHZhciBjaGVja3MgPSBbXTtcblx0dmFyIHRyYW5zZm9ybXMgPSBbXTtcblxuXHR2YXIgZ2V0dGVyID0gb3B0cy5vbl9nZXR0ZXIgfHwgZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIG1ldGhvZHMuZ2V0KG1ldGhvZCk7XG5cdH07XG5cblx0dmFyIHNldHRlciA9IG9wdHMub25fc2V0dGVyIHx8IGZ1bmN0aW9uICh4KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8dHJhbnNmb3Jtcy5sZW5ndGg7IGkrKykge1xuXHRcdHggPSB0cmFuc2Zvcm1zW2ldKHgpO1xuXHQgICAgfVxuXG5cdCAgICBmb3IgKHZhciBqPTA7IGo8Y2hlY2tzLmxlbmd0aDsgaisrKSB7XG5cdFx0aWYgKCFjaGVja3Nbal0uY2hlY2soeCkpIHtcblx0XHQgICAgdmFyIG1zZyA9IGNoZWNrc1tqXS5tc2cgfHwgXG5cdFx0XHQoXCJWYWx1ZSBcIiArIHggKyBcIiBkb2Vzbid0IHNlZW0gdG8gYmUgdmFsaWQgZm9yIHRoaXMgbWV0aG9kXCIpO1xuXHRcdCAgICB0aHJvdyAobXNnKTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICBtZXRob2RzLmFkZChtZXRob2QsIHgpO1xuXHR9O1xuXG5cdHZhciBuZXdfbWV0aG9kID0gZnVuY3Rpb24gKG5ld192YWwpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBnZXR0ZXIoKTtcblx0ICAgIH1cblx0ICAgIHNldHRlcihuZXdfdmFsKTtcblx0ICAgIHJldHVybiB3aG87IC8vIFJldHVybiB0aGlzP1xuXHR9O1xuXHRuZXdfbWV0aG9kLmNoZWNrID0gZnVuY3Rpb24gKGNiYWssIG1zZykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGNoZWNrcztcblx0ICAgIH1cblx0ICAgIGNoZWNrcy5wdXNoICh7Y2hlY2sgOiBjYmFrLFxuXHRcdFx0ICBtc2cgICA6IG1zZ30pO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cdG5ld19tZXRob2QudHJhbnNmb3JtID0gZnVuY3Rpb24gKGNiYWspIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiB0cmFuc2Zvcm1zO1xuXHQgICAgfVxuXHQgICAgdHJhbnNmb3Jtcy5wdXNoKGNiYWspO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cblx0d2hvW21ldGhvZF0gPSBuZXdfbWV0aG9kO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBvcHRzKSB7XG5cdGlmICh0eXBlb2YgKHBhcmFtKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIG1ldGhvZHMuYWRkX2JhdGNoIChwYXJhbSk7XG5cdCAgICBmb3IgKHZhciBwIGluIHBhcmFtKSB7XG5cdFx0YXR0YWNoX21ldGhvZCAocCwgb3B0cyk7XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICBtZXRob2RzLmFkZCAocGFyYW0sIG9wdHMuZGVmYXVsdF92YWx1ZSk7XG5cdCAgICBhdHRhY2hfbWV0aG9kIChwYXJhbSwgb3B0cyk7XG5cdH1cbiAgICB9O1xuXG4gICAgYXBpLmdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWZ9KTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuZ2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX3NldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBnZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIHNldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9zZXR0ZXIgOiBvbl9zZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9nZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgc2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBnZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fZ2V0dGVyIDogb25fZ2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QgPSBmdW5jdGlvbiAobmFtZSwgY2Jhaykge1xuXHRpZiAodHlwZW9mIChuYW1lKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIGZvciAodmFyIHAgaW4gbmFtZSkge1xuXHRcdHdob1twXSA9IG5hbWVbcF07XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbmFtZV0gPSBjYmFrO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHJldHVybiBhcGk7XG4gICAgXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBhcGk7IiwiLy8gaWYgKHR5cGVvZiB0bnQgPT09IFwidW5kZWZpbmVkXCIpIHtcbi8vICAgICBtb2R1bGUuZXhwb3J0cyA9IHRudCA9IHt9XG4vLyB9XG4vLyB0bnQudXRpbHMgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpO1xuLy8gdG50LnRvb2x0aXAgPSByZXF1aXJlKFwidG50LnRvb2x0aXBcIik7XG4vLyB0bnQuYm9hcmQgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL2luZGV4XCIpO1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZSAoXCJ0bnQuYXBpXCIpO1xudmFyIGRlZmVyQ2FuY2VsID0gcmVxdWlyZSAoXCJ0bnQudXRpbHNcIikuZGVmZXJfY2FuY2VsO1xuXG52YXIgYm9hcmQgPSBmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8vLy8gUHJpdmF0ZSB2YXJzXG4gICAgdmFyIHN2ZztcbiAgICB2YXIgZGl2X2lkO1xuICAgIHZhciB0cmFja3MgPSBbXTtcbiAgICB2YXIgbWluX3dpZHRoID0gNTA7XG4gICAgdmFyIGhlaWdodCAgICA9IDA7ICAgIC8vIFRoaXMgaXMgdGhlIGdsb2JhbCBoZWlnaHQgaW5jbHVkaW5nIGFsbCB0aGUgdHJhY2tzXG4gICAgdmFyIHdpZHRoICAgICA9IDkyMDtcbiAgICB2YXIgaGVpZ2h0X29mZnNldCA9IDIwO1xuICAgIHZhciBsb2MgPSB7XG5cdHNwZWNpZXMgIDogdW5kZWZpbmVkLFxuXHRjaHIgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgZnJvbSAgICAgOiAwLFxuICAgICAgICB0byAgICAgICA6IDUwMFxuICAgIH07XG5cbiAgICAvLyBMaW1pdCBjYXBzXG4gICAgdmFyIGNhcHMgPSB7XG4gICAgICAgIGxlZnQgOiB1bmRlZmluZWQsXG4gICAgICAgIHJpZ2h0IDogdW5kZWZpbmVkXG4gICAgfTtcbiAgICB2YXIgY2FwX3dpZHRoID0gMztcblxuXG4gICAgLy8gVE9ETzogV2UgaGF2ZSBub3cgYmFja2dyb3VuZCBjb2xvciBpbiB0aGUgdHJhY2tzLiBDYW4gdGhpcyBiZSByZW1vdmVkP1xuICAgIC8vIEl0IGxvb2tzIGxpa2UgaXQgaXMgdXNlZCBpbiB0aGUgdG9vLXdpZGUgcGFuZSBldGMsIGJ1dCBpdCBtYXkgbm90IGJlIG5lZWRlZCBhbnltb3JlXG4gICAgdmFyIGJnQ29sb3IgICA9IGQzLnJnYignI0Y4RkJFRicpOyAvLyNGOEZCRUZcbiAgICB2YXIgcGFuZTsgLy8gRHJhZ2dhYmxlIHBhbmVcbiAgICB2YXIgc3ZnX2c7XG4gICAgdmFyIHhTY2FsZTtcbiAgICB2YXIgem9vbUV2ZW50SGFuZGxlciA9IGQzLmJlaGF2aW9yLnpvb20oKTtcbiAgICB2YXIgbGltaXRzID0ge1xuICAgICAgICBtaW4gOiAwLFxuICAgICAgICBtYXggOiAxMDAwLFxuICAgICAgICB6b29tX291dCA6IDEwMDAsXG4gICAgICAgIHpvb21faW4gIDogMTAwXG4gICAgfTtcbiAgICB2YXIgZHVyID0gNTAwO1xuICAgIHZhciBkcmFnX2FsbG93ZWQgPSB0cnVlO1xuXG4gICAgdmFyIGV4cG9ydHMgPSB7XG4gICAgICAgIGVhc2UgICAgICAgICAgOiBkMy5lYXNlKFwiY3ViaWMtaW4tb3V0XCIpLFxuICAgICAgICBleHRlbmRfY2FudmFzIDoge1xuICAgICAgICAgICAgbGVmdCA6IDAsXG4gICAgICAgICAgICByaWdodCA6IDBcbiAgICAgICAgfSxcbiAgICAgICAgc2hvd19mcmFtZSA6IHRydWVcbiAgICAgICAgLy8gbGltaXRzICAgICAgICA6IGZ1bmN0aW9uICgpIHt0aHJvdyBcIlRoZSBsaW1pdHMgbWV0aG9kIHNob3VsZCBiZSBkZWZpbmVkXCJ9XG4gICAgfTtcblxuICAgIC8vIFRoZSByZXR1cm5lZCBjbG9zdXJlIC8gb2JqZWN0XG4gICAgdmFyIHRyYWNrX3ZpcyA9IGZ1bmN0aW9uKGRpdikge1xuICAgIFx0ZGl2X2lkID0gZDMuc2VsZWN0KGRpdikuYXR0cihcImlkXCIpO1xuXG4gICAgXHQvLyBUaGUgb3JpZ2luYWwgZGl2IGlzIGNsYXNzZWQgd2l0aCB0aGUgdG50IGNsYXNzXG4gICAgXHRkMy5zZWxlY3QoZGl2KVxuICAgIFx0ICAgIC5jbGFzc2VkKFwidG50XCIsIHRydWUpO1xuXG4gICAgXHQvLyBUT0RPOiBNb3ZlIHRoZSBzdHlsaW5nIHRvIHRoZSBzY3NzP1xuICAgIFx0dmFyIGJyb3dzZXJEaXYgPSBkMy5zZWxlY3QoZGl2KVxuICAgIFx0ICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICBcdCAgICAuYXR0cihcImlkXCIsIFwidG50X1wiICsgZGl2X2lkKVxuICAgIFx0ICAgIC5zdHlsZShcInBvc2l0aW9uXCIsIFwicmVsYXRpdmVcIilcbiAgICBcdCAgICAuY2xhc3NlZChcInRudF9mcmFtZWRcIiwgZXhwb3J0cy5zaG93X2ZyYW1lID8gdHJ1ZSA6IGZhbHNlKVxuICAgIFx0ICAgIC5zdHlsZShcIndpZHRoXCIsICh3aWR0aCArIGNhcF93aWR0aCoyICsgZXhwb3J0cy5leHRlbmRfY2FudmFzLnJpZ2h0ICsgZXhwb3J0cy5leHRlbmRfY2FudmFzLmxlZnQpICsgXCJweFwiKTtcblxuICAgIFx0dmFyIGdyb3VwRGl2ID0gYnJvd3NlckRpdlxuICAgIFx0ICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2dyb3VwRGl2XCIpO1xuXG4gICAgXHQvLyBUaGUgU1ZHXG4gICAgXHRzdmcgPSBncm91cERpdlxuICAgIFx0ICAgIC5hcHBlbmQoXCJzdmdcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3N2Z1wiKVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGgpXG4gICAgXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuICAgIFx0ICAgIC5hdHRyKFwicG9pbnRlci1ldmVudHNcIiwgXCJhbGxcIik7XG5cbiAgICBcdHN2Z19nID0gc3ZnXG4gICAgXHQgICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLDIwKVwiKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9nXCIpO1xuXG4gICAgXHQvLyBjYXBzXG4gICAgXHRjYXBzLmxlZnQgPSBzdmdfZ1xuICAgIFx0ICAgIC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgXHQgICAgLmF0dHIoXCJpZFwiLCBcInRudF9cIiArIGRpdl9pZCArIFwiXzVwY2FwXCIpXG4gICAgXHQgICAgLmF0dHIoXCJ4XCIsIDApXG4gICAgXHQgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCAwKVxuICAgIFx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICBcdCAgICAuYXR0cihcImZpbGxcIiwgXCJyZWRcIik7XG4gICAgXHRjYXBzLnJpZ2h0ID0gc3ZnX2dcbiAgICBcdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgIFx0ICAgIC5hdHRyKFwiaWRcIiwgXCJ0bnRfXCIgKyBkaXZfaWQgKyBcIl8zcGNhcFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieFwiLCB3aWR0aC1jYXBfd2lkdGgpXG4gICAgXHQgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCAwKVxuICAgIFx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodClcbiAgICBcdCAgICAuYXR0cihcImZpbGxcIiwgXCJyZWRcIik7XG5cbiAgICBcdC8vIFRoZSBab29taW5nL1Bhbm5pbmcgUGFuZVxuICAgIFx0cGFuZSA9IHN2Z19nXG4gICAgXHQgICAgLmFwcGVuZChcInJlY3RcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3BhbmVcIilcbiAgICBcdCAgICAuYXR0cihcImlkXCIsIFwidG50X1wiICsgZGl2X2lkICsgXCJfcGFuZVwiKVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGgpXG4gICAgXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuICAgIFx0ICAgIC5zdHlsZShcImZpbGxcIiwgYmdDb2xvcik7XG5cbiAgICBcdC8vICoqIFRPRE86IFdvdWxkbid0IGJlIGJldHRlciB0byBoYXZlIHRoZXNlIG1lc3NhZ2VzIGJ5IHRyYWNrP1xuICAgIFx0Ly8gdmFyIHRvb1dpZGVfdGV4dCA9IHN2Z19nXG4gICAgXHQvLyAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICBcdC8vICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3dpZGVPS190ZXh0XCIpXG4gICAgXHQvLyAgICAgLmF0dHIoXCJpZFwiLCBcInRudF9cIiArIGRpdl9pZCArIFwiX3Rvb1dpZGVcIilcbiAgICBcdC8vICAgICAuYXR0cihcImZpbGxcIiwgYmdDb2xvcilcbiAgICBcdC8vICAgICAudGV4dChcIlJlZ2lvbiB0b28gd2lkZVwiKTtcblxuICAgIFx0Ly8gVE9ETzogSSBkb24ndCBrbm93IGlmIHRoaXMgaXMgdGhlIGJlc3Qgd2F5IChhbmQgcG9ydGFibGUpIHdheVxuICAgIFx0Ly8gb2YgY2VudGVyaW5nIHRoZSB0ZXh0IGluIHRoZSB0ZXh0IGFyZWFcbiAgICBcdC8vIHZhciBiYiA9IHRvb1dpZGVfdGV4dFswXVswXS5nZXRCQm94KCk7XG4gICAgXHQvLyB0b29XaWRlX3RleHRcbiAgICBcdC8vICAgICAuYXR0cihcInhcIiwgfn4od2lkdGgvMiAtIGJiLndpZHRoLzIpKVxuICAgIFx0Ly8gICAgIC5hdHRyKFwieVwiLCB+fihoZWlnaHQvMiAtIGJiLmhlaWdodC8yKSk7XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIHZhciBhcGkgPSBhcGlqcyAodHJhY2tfdmlzKVxuICAgIFx0LmdldHNldCAoZXhwb3J0cylcbiAgICBcdC5nZXRzZXQgKGxpbWl0cylcbiAgICBcdC5nZXRzZXQgKGxvYyk7XG5cbiAgICBhcGkudHJhbnNmb3JtICh0cmFja192aXMuZXh0ZW5kX2NhbnZhcywgZnVuY3Rpb24gKHZhbCkge1xuICAgIFx0dmFyIHByZXZfdmFsID0gdHJhY2tfdmlzLmV4dGVuZF9jYW52YXMoKTtcbiAgICBcdHZhbC5sZWZ0ID0gdmFsLmxlZnQgfHwgcHJldl92YWwubGVmdDtcbiAgICBcdHZhbC5yaWdodCA9IHZhbC5yaWdodCB8fCBwcmV2X3ZhbC5yaWdodDtcbiAgICBcdHJldHVybiB2YWw7XG4gICAgfSk7XG5cbiAgICAvLyB0cmFja192aXMgYWx3YXlzIHN0YXJ0cyBvbiBsb2MuZnJvbSAmIGxvYy50b1xuICAgIGFwaS5tZXRob2QgKCdzdGFydCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gbWFrZSBzdXJlIHRoYXQgem9vbV9vdXQgaXMgd2l0aGluIHRoZSBtaW4tbWF4IHJhbmdlXG4gICAgICAgIGlmICgobGltaXRzLm1heCAtIGxpbWl0cy5taW4pIDwgbGltaXRzLnpvb21fb3V0KSB7XG4gICAgICAgICAgICBsaW1pdHMuem9vbV9vdXQgPSBsaW1pdHMubWF4IC0gbGltaXRzLm1pbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBsb3QoKTtcblxuICAgICAgICAvLyBSZXNldCB0aGUgdHJhY2tzXG4gICAgICAgIGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0cmFja3NbaV0uZykge1xuICAgICAgICAgICAgICAgIC8vICAgIHRyYWNrc1tpXS5kaXNwbGF5KCkucmVzZXQuY2FsbCh0cmFja3NbaV0pO1xuICAgICAgICAgICAgICAgIHRyYWNrc1tpXS5nLnJlbW92ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX2luaXRfdHJhY2sodHJhY2tzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBfcGxhY2VfdHJhY2tzKCk7XG5cbiAgICAgICAgLy8gVGhlIGNvbnRpbnVhdGlvbiBjYWxsYmFja1xuICAgICAgICB2YXIgY29udCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgaWYgKChsb2MudG8gLSBsb2MuZnJvbSkgPCBsaW1pdHMuem9vbV9pbikge1xuICAgICAgICAgICAgICAgIGlmICgobG9jLmZyb20gKyBsaW1pdHMuem9vbV9pbikgPiBsaW1pdHMubWF4KSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYy50byA9IGxpbWl0cy5tYXg7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jLnRvID0gbG9jLmZyb20gKyBsaW1pdHMuem9vbV9pbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBfdXBkYXRlX3RyYWNrKHRyYWNrc1tpXSwgbG9jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb250KCk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgndXBkYXRlJywgZnVuY3Rpb24gKCkge1xuICAgIFx0Zm9yICh2YXIgaT0wOyBpPHRyYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIFx0ICAgIF91cGRhdGVfdHJhY2sgKHRyYWNrc1tpXSk7XG4gICAgXHR9XG4gICAgfSk7XG5cbiAgICB2YXIgX3VwZGF0ZV90cmFjayA9IGZ1bmN0aW9uICh0cmFjaywgd2hlcmUpIHtcbiAgICBcdGlmICh0cmFjay5kYXRhKCkpIHtcbiAgICBcdCAgICB2YXIgdHJhY2tfZGF0YSA9IHRyYWNrLmRhdGEoKTtcbiAgICAgICAgICAgIHZhciBkYXRhX3VwZGF0ZXIgPSB0cmFja19kYXRhO1xuXG4gICAgXHQgICAgZGF0YV91cGRhdGVyLmNhbGwodHJhY2ssIHtcbiAgICAgICAgICAgICAgICAnbG9jJyA6IHdoZXJlLFxuICAgICAgICAgICAgICAgICdvbl9zdWNjZXNzJyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2suZGlzcGxheSgpLnVwZGF0ZS5jYWxsKHRyYWNrLCB3aGVyZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgIH0pO1xuICAgIFx0fVxuICAgIH07XG5cbiAgICB2YXIgcGxvdCA9IGZ1bmN0aW9uKCkge1xuICAgIFx0eFNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcbiAgICBcdCAgICAuZG9tYWluKFtsb2MuZnJvbSwgbG9jLnRvXSlcbiAgICBcdCAgICAucmFuZ2UoWzAsIHdpZHRoXSk7XG5cbiAgICBcdGlmIChkcmFnX2FsbG93ZWQpIHtcbiAgICBcdCAgICBzdmdfZy5jYWxsKCB6b29tRXZlbnRIYW5kbGVyXG4gICAgXHRcdCAgICAgICAueCh4U2NhbGUpXG4gICAgXHRcdCAgICAgICAuc2NhbGVFeHRlbnQoWyhsb2MudG8tbG9jLmZyb20pLyhsaW1pdHMuem9vbV9vdXQtMSksIChsb2MudG8tbG9jLmZyb20pL2xpbWl0cy56b29tX2luXSlcbiAgICBcdFx0ICAgICAgIC5vbihcInpvb21cIiwgX21vdmUpXG4gICAgXHRcdCAgICAgKTtcbiAgICBcdH1cbiAgICB9O1xuXG4gICAgdmFyIF9yZW9yZGVyID0gZnVuY3Rpb24gKG5ld190cmFja3MpIHtcbiAgICAgICAgLy8gVE9ETzogVGhpcyBpcyBkZWZpbmluZyBhIG5ldyBoZWlnaHQsIGJ1dCB0aGUgZ2xvYmFsIGhlaWdodCBpcyB1c2VkIHRvIGRlZmluZSB0aGUgc2l6ZSBvZiBzZXZlcmFsXG4gICAgICAgIC8vIHBhcnRzLiBXZSBzaG91bGQgZG8gdGhpcyBkeW5hbWljYWxseVxuXG4gICAgICAgIHZhciBmb3VuZF9pbmRleGVzID0gW107XG4gICAgICAgIGZvciAodmFyIGo9MDsgajxuZXdfdHJhY2tzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodHJhY2tzW2ldLmlkKCkgPT09IG5ld190cmFja3Nbal0uaWQoKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kX2luZGV4ZXNbaV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyB0cmFja3Muc3BsaWNlKGksMSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICBfaW5pdF90cmFjayhuZXdfdHJhY2tzW2pdKTtcbiAgICAgICAgICAgICAgICBfdXBkYXRlX3RyYWNrKG5ld190cmFja3Nbal0sIHtmcm9tIDogbG9jLmZyb20sIHRvIDogbG9jLnRvfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciB4PTA7IHg8dHJhY2tzLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBpZiAoIWZvdW5kX2luZGV4ZXNbeF0pIHtcbiAgICAgICAgICAgICAgICB0cmFja3NbeF0uZy5yZW1vdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyYWNrcyA9IG5ld190cmFja3M7XG4gICAgICAgIF9wbGFjZV90cmFja3MoKTtcbiAgICB9O1xuXG4gICAgLy8gcmlnaHQvbGVmdC96b29tIHBhbnMgb3Igem9vbXMgdGhlIHRyYWNrLiBUaGVzZSBtZXRob2RzIGFyZSBleHBvc2VkIHRvIGFsbG93IGV4dGVybmFsIGJ1dHRvbnMsIGV0YyB0byBpbnRlcmFjdCB3aXRoIHRoZSB0cmFja3MuIFRoZSBhcmd1bWVudCBpcyB0aGUgYW1vdW50IG9mIHBhbm5pbmcvem9vbWluZyAoaWUuIDEuMiBtZWFucyAyMCUgcGFubmluZykgV2l0aCBsZWZ0L3JpZ2h0IG9ubHkgcG9zaXRpdmUgbnVtYmVycyBhcmUgYWxsb3dlZC5cbiAgICBhcGkubWV0aG9kICgnc2Nyb2xsJywgZnVuY3Rpb24gKGZhY3Rvcikge1xuICAgICAgICB2YXIgYW1vdW50ID0gTWF0aC5hYnMoZmFjdG9yKTtcbiAgICBcdGlmIChmYWN0b3IgPiAwKSB7XG4gICAgXHQgICAgX21hbnVhbF9tb3ZlKGFtb3VudCwgMSk7XG4gICAgXHR9IGVsc2UgaWYgKGZhY3RvciA8IDApe1xuICAgICAgICAgICAgX21hbnVhbF9tb3ZlKGFtb3VudCwgLTEpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnem9vbScsIGZ1bmN0aW9uIChmYWN0b3IpIHtcbiAgICAgICAgX21hbnVhbF9tb3ZlKDEvZmFjdG9yLCAwKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdmaW5kX3RyYWNrJywgZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0cmFja3NbaV0uaWQoKSA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhY2tzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgncmVtb3ZlX3RyYWNrJywgZnVuY3Rpb24gKHRyYWNrKSB7XG4gICAgICAgIHRyYWNrLmcucmVtb3ZlKCk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnYWRkX3RyYWNrJywgZnVuY3Rpb24gKHRyYWNrKSB7XG4gICAgICAgIGlmICh0cmFjayBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8dHJhY2subGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0cmFja192aXMuYWRkX3RyYWNrICh0cmFja1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJhY2tfdmlzO1xuICAgICAgICB9XG4gICAgICAgIHRyYWNrcy5wdXNoKHRyYWNrKTtcbiAgICAgICAgcmV0dXJuIHRyYWNrX3ZpcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QoJ3RyYWNrcycsIGZ1bmN0aW9uICh0cykge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0cmFja3M7XG4gICAgICAgIH1cbiAgICAgICAgX3Jlb3JkZXIodHMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcblxuICAgIC8vXG4gICAgYXBpLm1ldGhvZCAoJ3dpZHRoJywgZnVuY3Rpb24gKHcpIHtcbiAgICBcdC8vIFRPRE86IEFsbG93IHN1ZmZpeGVzIGxpa2UgXCIxMDAwcHhcIj9cbiAgICBcdC8vIFRPRE86IFRlc3Qgd3JvbmcgZm9ybWF0c1xuICAgIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgXHQgICAgcmV0dXJuIHdpZHRoO1xuICAgIFx0fVxuICAgIFx0Ly8gQXQgbGVhc3QgbWluLXdpZHRoXG4gICAgXHRpZiAodyA8IG1pbl93aWR0aCkge1xuICAgIFx0ICAgIHcgPSBtaW5fd2lkdGg7XG4gICAgXHR9XG5cbiAgICBcdC8vIFdlIGFyZSByZXNpemluZ1xuICAgIFx0aWYgKGRpdl9pZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgXHQgICAgZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCkuc2VsZWN0KFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCB3KTtcbiAgICBcdCAgICAvLyBSZXNpemUgdGhlIHpvb21pbmcvcGFubmluZyBwYW5lXG4gICAgXHQgICAgZDMuc2VsZWN0KFwiI3RudF9cIiArIGRpdl9pZCkuc3R5bGUoXCJ3aWR0aFwiLCAocGFyc2VJbnQodykgKyBjYXBfd2lkdGgqMikgKyBcInB4XCIpO1xuICAgIFx0ICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQgKyBcIl9wYW5lXCIpLmF0dHIoXCJ3aWR0aFwiLCB3KTtcbiAgICAgICAgICAgIGNhcHMucmlnaHRcbiAgICAgICAgICAgICAgICAuYXR0cihcInhcIiwgdy1jYXBfd2lkdGgpO1xuXG4gICAgXHQgICAgLy8gUmVwbG90XG4gICAgXHQgICAgd2lkdGggPSB3O1xuICAgICAgICAgICAgeFNjYWxlLnJhbmdlKFswLCB3aWR0aF0pO1xuXG4gICAgXHQgICAgcGxvdCgpO1xuICAgIFx0ICAgIGZvciAodmFyIGk9MDsgaTx0cmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgXHRcdHRyYWNrc1tpXS5nLnNlbGVjdChcInJlY3RcIikuYXR0cihcIndpZHRoXCIsIHcpO1xuICAgICAgICAgICAgICAgIHRyYWNrc1tpXS5kaXNwbGF5KCkuc2NhbGUoeFNjYWxlKTtcbiAgICAgICAgXHRcdHRyYWNrc1tpXS5kaXNwbGF5KCkucmVzZXQuY2FsbCh0cmFja3NbaV0pO1xuICAgICAgICAgICAgICAgIHRyYWNrc1tpXS5kaXNwbGF5KCkuaW5pdC5jYWxsKHRyYWNrc1tpXSwgdyk7XG4gICAgICAgIFx0XHR0cmFja3NbaV0uZGlzcGxheSgpLnVwZGF0ZS5jYWxsKHRyYWNrc1tpXSwgbG9jKTtcbiAgICBcdCAgICB9XG4gICAgXHR9IGVsc2Uge1xuICAgIFx0ICAgIHdpZHRoID0gdztcbiAgICBcdH1cbiAgICAgICAgcmV0dXJuIHRyYWNrX3ZpcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QoJ2FsbG93X2RyYWcnLCBmdW5jdGlvbihiKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGRyYWdfYWxsb3dlZDtcbiAgICAgICAgfVxuICAgICAgICBkcmFnX2FsbG93ZWQgPSBiO1xuICAgICAgICBpZiAoZHJhZ19hbGxvd2VkKSB7XG4gICAgICAgICAgICAvLyBXaGVuIHRoaXMgbWV0aG9kIGlzIGNhbGxlZCBvbiB0aGUgb2JqZWN0IGJlZm9yZSBzdGFydGluZyB0aGUgc2ltdWxhdGlvbiwgd2UgZG9uJ3QgaGF2ZSBkZWZpbmVkIHhTY2FsZVxuICAgICAgICAgICAgaWYgKHhTY2FsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3ZnX2cuY2FsbCggem9vbUV2ZW50SGFuZGxlci54KHhTY2FsZSlcbiAgICAgICAgICAgICAgICAgICAgLy8gLnhFeHRlbnQoWzAsIGxpbWl0cy5yaWdodF0pXG4gICAgICAgICAgICAgICAgICAgIC5zY2FsZUV4dGVudChbKGxvYy50by1sb2MuZnJvbSkvKGxpbWl0cy56b29tX291dC0xKSwgKGxvYy50by1sb2MuZnJvbSkvbGltaXRzLnpvb21faW5dKVxuICAgICAgICAgICAgICAgICAgICAub24oXCJ6b29tXCIsIF9tb3ZlKSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gV2UgY3JlYXRlIGEgbmV3IGR1bW15IHNjYWxlIGluIHggdG8gYXZvaWQgZHJhZ2dpbmcgdGhlIHByZXZpb3VzIG9uZVxuICAgICAgICAgICAgLy8gVE9ETzogVGhlcmUgbWF5IGJlIGEgY2hlYXBlciB3YXkgb2YgZG9pbmcgdGhpcz9cbiAgICAgICAgICAgIHpvb21FdmVudEhhbmRsZXIueChkMy5zY2FsZS5saW5lYXIoKSkub24oXCJ6b29tXCIsIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cmFja192aXM7XG4gICAgfSk7XG5cbiAgICB2YXIgX3BsYWNlX3RyYWNrcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGggPSAwO1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8dHJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdHJhY2sgPSB0cmFja3NbaV07XG4gICAgICAgICAgICBpZiAodHJhY2suZy5hdHRyKFwidHJhbnNmb3JtXCIpKSB7XG4gICAgICAgICAgICAgICAgdHJhY2suZ1xuICAgICAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIC5kdXJhdGlvbihkdXIpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZXhwb3J0cy5leHRlbmRfY2FudmFzLmxlZnQgKyBcIixcIiArIGggKyBcIilcIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRyYWNrLmdcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBleHBvcnRzLmV4dGVuZF9jYW52YXMubGVmdCArIFwiLFwiICsgaCArIFwiKVwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaCArPSB0cmFjay5oZWlnaHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHN2Z1xuICAgICAgICBzdmcuYXR0cihcImhlaWdodFwiLCBoICsgaGVpZ2h0X29mZnNldCk7XG5cbiAgICAgICAgLy8gZGl2XG4gICAgICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQpXG4gICAgICAgICAgICAuc3R5bGUoXCJoZWlnaHRcIiwgKGggKyAxMCArIGhlaWdodF9vZmZzZXQpICsgXCJweFwiKTtcblxuICAgICAgICAvLyBjYXBzXG4gICAgICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQgKyBcIl81cGNhcFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaClcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgbW92ZV90b19mcm9udCh0aGlzKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQgKyBcIl8zcGNhcFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaClcbiAgICAgICAgICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIG1vdmVfdG9fZnJvbnQodGhpcyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAvLyBwYW5lXG4gICAgICAgIHBhbmVcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGggKyBoZWlnaHRfb2Zmc2V0KTtcblxuICAgICAgICByZXR1cm4gdHJhY2tfdmlzO1xuICAgIH07XG5cbiAgICB2YXIgX2luaXRfdHJhY2sgPSBmdW5jdGlvbiAodHJhY2spIHtcbiAgICAgICAgdHJhY2suZyA9IHN2Zy5zZWxlY3QoXCJnXCIpLnNlbGVjdChcImdcIilcbiAgICBcdCAgICAuYXBwZW5kKFwiZ1wiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJhY2tcIilcbiAgICBcdCAgICAuYXR0cihcImhlaWdodFwiLCB0cmFjay5oZWlnaHQoKSk7XG5cbiAgICBcdC8vIFJlY3QgZm9yIHRoZSBiYWNrZ3JvdW5kIGNvbG9yXG4gICAgXHR0cmFjay5nXG4gICAgXHQgICAgLmFwcGVuZChcInJlY3RcIilcbiAgICBcdCAgICAuYXR0cihcInhcIiwgMClcbiAgICBcdCAgICAuYXR0cihcInlcIiwgMClcbiAgICBcdCAgICAuYXR0cihcIndpZHRoXCIsIHRyYWNrX3Zpcy53aWR0aCgpKVxuICAgIFx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHRyYWNrLmhlaWdodCgpKVxuICAgIFx0ICAgIC5zdHlsZShcImZpbGxcIiwgdHJhY2suY29sb3IoKSlcbiAgICBcdCAgICAuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLCBcIm5vbmVcIik7XG5cbiAgICBcdGlmICh0cmFjay5kaXNwbGF5KCkpIHtcbiAgICBcdCAgICB0cmFjay5kaXNwbGF5KClcbiAgICAgICAgICAgICAgICAuc2NhbGUoeFNjYWxlKVxuICAgICAgICAgICAgICAgIC5pbml0LmNhbGwodHJhY2ssIHdpZHRoKTtcbiAgICBcdH1cblxuICAgIFx0cmV0dXJuIHRyYWNrX3ZpcztcbiAgICB9O1xuXG4gICAgdmFyIF9tYW51YWxfbW92ZSA9IGZ1bmN0aW9uIChmYWN0b3IsIGRpcmVjdGlvbikge1xuICAgICAgICB2YXIgb2xkRG9tYWluID0geFNjYWxlLmRvbWFpbigpO1xuXG4gICAgXHR2YXIgc3BhbiA9IG9sZERvbWFpblsxXSAtIG9sZERvbWFpblswXTtcbiAgICBcdHZhciBvZmZzZXQgPSAoc3BhbiAqIGZhY3RvcikgLSBzcGFuO1xuXG4gICAgXHR2YXIgbmV3RG9tYWluO1xuICAgIFx0c3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgMSA6XG4gICAgICAgICAgICBuZXdEb21haW4gPSBbKH5+b2xkRG9tYWluWzBdIC0gb2Zmc2V0KSwgfn4ob2xkRG9tYWluWzFdIC0gb2Zmc2V0KV07XG4gICAgXHQgICAgYnJlYWs7XG4gICAgICAgIFx0Y2FzZSAtMSA6XG4gICAgICAgIFx0ICAgIG5ld0RvbWFpbiA9IFsofn5vbGREb21haW5bMF0gKyBvZmZzZXQpLCB+fihvbGREb21haW5bMV0gLSBvZmZzZXQpXTtcbiAgICAgICAgXHQgICAgYnJlYWs7XG4gICAgICAgIFx0Y2FzZSAwIDpcbiAgICAgICAgXHQgICAgbmV3RG9tYWluID0gW29sZERvbWFpblswXSAtIH5+KG9mZnNldC8yKSwgb2xkRG9tYWluWzFdICsgKH5+b2Zmc2V0LzIpXTtcbiAgICBcdH1cblxuICAgIFx0dmFyIGludGVycG9sYXRvciA9IGQzLmludGVycG9sYXRlTnVtYmVyKG9sZERvbWFpblswXSwgbmV3RG9tYWluWzBdKTtcbiAgICBcdHZhciBlYXNlID0gZXhwb3J0cy5lYXNlO1xuXG4gICAgXHR2YXIgeCA9IDA7XG4gICAgXHRkMy50aW1lcihmdW5jdGlvbigpIHtcbiAgICBcdCAgICB2YXIgY3Vycl9zdGFydCA9IGludGVycG9sYXRvcihlYXNlKHgpKTtcbiAgICBcdCAgICB2YXIgY3Vycl9lbmQ7XG4gICAgXHQgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgXHQgICAgY2FzZSAtMSA6XG4gICAgICAgIFx0XHRjdXJyX2VuZCA9IGN1cnJfc3RhcnQgKyBzcGFuO1xuICAgICAgICBcdFx0YnJlYWs7XG4gICAgICAgIFx0ICAgIGNhc2UgMSA6XG4gICAgICAgIFx0XHRjdXJyX2VuZCA9IGN1cnJfc3RhcnQgKyBzcGFuO1xuICAgICAgICBcdFx0YnJlYWs7XG4gICAgICAgIFx0ICAgIGNhc2UgMCA6XG4gICAgICAgIFx0XHRjdXJyX2VuZCA9IG9sZERvbWFpblsxXSArIG9sZERvbWFpblswXSAtIGN1cnJfc3RhcnQ7XG4gICAgICAgIFx0XHRicmVhaztcbiAgICBcdCAgICB9XG5cbiAgICBcdCAgICB2YXIgY3VyckRvbWFpbiA9IFtjdXJyX3N0YXJ0LCBjdXJyX2VuZF07XG4gICAgXHQgICAgeFNjYWxlLmRvbWFpbihjdXJyRG9tYWluKTtcbiAgICBcdCAgICBfbW92ZSh4U2NhbGUpO1xuICAgIFx0ICAgIHgrPTAuMDI7XG4gICAgXHQgICAgcmV0dXJuIHg+MTtcbiAgICBcdH0pO1xuICAgIH07XG5cblxuICAgIHZhciBfbW92ZV9jYmFrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY3VyckRvbWFpbiA9IHhTY2FsZS5kb21haW4oKTtcbiAgICBcdHRyYWNrX3Zpcy5mcm9tKH5+Y3VyckRvbWFpblswXSk7XG4gICAgXHR0cmFja192aXMudG8ofn5jdXJyRG9tYWluWzFdKTtcblxuICAgIFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0cmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBcdCAgICB2YXIgdHJhY2sgPSB0cmFja3NbaV07XG4gICAgXHQgICAgX3VwZGF0ZV90cmFjayh0cmFjaywgbG9jKTtcbiAgICBcdH1cbiAgICB9O1xuICAgIC8vIFRoZSBkZWZlcnJlZF9jYmFrIGlzIGRlZmVycmVkIGF0IGxlYXN0IHRoaXMgYW1vdW50IG9mIHRpbWUgb3IgcmUtc2NoZWR1bGVkIGlmIGRlZmVycmVkIGlzIGNhbGxlZCBiZWZvcmVcbiAgICB2YXIgX2RlZmVycmVkID0gZGVmZXJDYW5jZWwoX21vdmVfY2JhaywgMzAwKTtcblxuICAgIC8vIGFwaS5tZXRob2QoJ3VwZGF0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyBcdF9tb3ZlKCk7XG4gICAgLy8gfSk7XG5cbiAgICB2YXIgX21vdmUgPSBmdW5jdGlvbiAobmV3X3hTY2FsZSkge1xuICAgIFx0aWYgKG5ld194U2NhbGUgIT09IHVuZGVmaW5lZCAmJiBkcmFnX2FsbG93ZWQpIHtcbiAgICBcdCAgICB6b29tRXZlbnRIYW5kbGVyLngobmV3X3hTY2FsZSk7XG4gICAgXHR9XG5cbiAgICBcdC8vIFNob3cgdGhlIHJlZCBiYXJzIGF0IHRoZSBsaW1pdHNcbiAgICBcdHZhciBkb21haW4gPSB4U2NhbGUuZG9tYWluKCk7XG4gICAgXHRpZiAoZG9tYWluWzBdIDw9IChsaW1pdHMubWluICsgNSkpIHtcbiAgICBcdCAgICBkMy5zZWxlY3QoXCIjdG50X1wiICsgZGl2X2lkICsgXCJfNXBjYXBcIilcbiAgICBcdFx0LmF0dHIoXCJ3aWR0aFwiLCBjYXBfd2lkdGgpXG4gICAgXHRcdC50cmFuc2l0aW9uKClcbiAgICBcdFx0LmR1cmF0aW9uKDIwMClcbiAgICBcdFx0LmF0dHIoXCJ3aWR0aFwiLCAwKTtcbiAgICBcdH1cblxuICAgIFx0aWYgKGRvbWFpblsxXSA+PSAobGltaXRzLm1heCktNSkge1xuICAgIFx0ICAgIGQzLnNlbGVjdChcIiN0bnRfXCIgKyBkaXZfaWQgKyBcIl8zcGNhcFwiKVxuICAgIFx0XHQuYXR0cihcIndpZHRoXCIsIGNhcF93aWR0aClcbiAgICBcdFx0LnRyYW5zaXRpb24oKVxuICAgIFx0XHQuZHVyYXRpb24oMjAwKVxuICAgIFx0XHQuYXR0cihcIndpZHRoXCIsIDApO1xuICAgIFx0fVxuXG5cbiAgICBcdC8vIEF2b2lkIG1vdmluZyBwYXN0IHRoZSBsaW1pdHNcbiAgICBcdGlmIChkb21haW5bMF0gPCBsaW1pdHMubWluKSB7XG4gICAgXHQgICAgem9vbUV2ZW50SGFuZGxlci50cmFuc2xhdGUoW3pvb21FdmVudEhhbmRsZXIudHJhbnNsYXRlKClbMF0gLSB4U2NhbGUobGltaXRzLm1pbikgKyB4U2NhbGUucmFuZ2UoKVswXSwgem9vbUV2ZW50SGFuZGxlci50cmFuc2xhdGUoKVsxXV0pO1xuICAgIFx0fSBlbHNlIGlmIChkb21haW5bMV0gPiBsaW1pdHMubWF4KSB7XG4gICAgXHQgICAgem9vbUV2ZW50SGFuZGxlci50cmFuc2xhdGUoW3pvb21FdmVudEhhbmRsZXIudHJhbnNsYXRlKClbMF0gLSB4U2NhbGUobGltaXRzLm1heCkgKyB4U2NhbGUucmFuZ2UoKVsxXSwgem9vbUV2ZW50SGFuZGxlci50cmFuc2xhdGUoKVsxXV0pO1xuICAgIFx0fVxuXG4gICAgXHRfZGVmZXJyZWQoKTtcblxuICAgIFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0cmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBcdCAgICB2YXIgdHJhY2sgPSB0cmFja3NbaV07XG4gICAgXHQgICAgdHJhY2suZGlzcGxheSgpLm1vdmVyLmNhbGwodHJhY2spO1xuICAgIFx0fVxuICAgIH07XG5cbiAgICAvLyBhcGkubWV0aG9kKHtcbiAgICAvLyBcdGFsbG93X2RyYWcgOiBhcGlfYWxsb3dfZHJhZyxcbiAgICAvLyBcdHdpZHRoICAgICAgOiBhcGlfd2lkdGgsXG4gICAgLy8gXHRhZGRfdHJhY2sgIDogYXBpX2FkZF90cmFjayxcbiAgICAvLyBcdHJlb3JkZXIgICAgOiBhcGlfcmVvcmRlcixcbiAgICAvLyBcdHpvb20gICAgICAgOiBhcGlfem9vbSxcbiAgICAvLyBcdGxlZnQgICAgICAgOiBhcGlfbGVmdCxcbiAgICAvLyBcdHJpZ2h0ICAgICAgOiBhcGlfcmlnaHQsXG4gICAgLy8gXHRzdGFydCAgICAgIDogYXBpX3N0YXJ0XG4gICAgLy8gfSk7XG5cbiAgICAvLyBBdXhpbGlhciBmdW5jdGlvbnNcbiAgICBmdW5jdGlvbiBtb3ZlX3RvX2Zyb250IChlbGVtKSB7XG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChlbGVtKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJhY2tfdmlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gYm9hcmQ7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlIChcInRudC5hcGlcIik7XG52YXIgc3Bpbm5lciA9IHJlcXVpcmUgKFwiLi9zcGlubmVyLmpzXCIpKCk7XG5cbnZhciB0bnRfZGF0YSA9IHt9O1xuXG50bnRfZGF0YS5zeW5jID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHVwZGF0ZV90cmFjayA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB0cmFjay5kYXRhKCkuZWxlbWVudHModXBkYXRlX3RyYWNrLnJldHJpZXZlcigpLmNhbGwodHJhY2ssIG9iai5sb2MpKTtcbiAgICAgICAgb2JqLm9uX3N1Y2Nlc3MoKTtcbiAgICB9O1xuXG4gICAgYXBpanMgKHVwZGF0ZV90cmFjaylcbiAgICAgICAgLmdldHNldCAoJ2VsZW1lbnRzJywgW10pXG4gICAgICAgIC5nZXRzZXQgKCdyZXRyaWV2ZXInLCBmdW5jdGlvbiAoKSB7fSk7XG5cbiAgICByZXR1cm4gdXBkYXRlX3RyYWNrO1xufTtcblxudG50X2RhdGEuYXN5bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHVwZGF0ZV90cmFjayA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgc3Bpbm5lci5vbi5jYWxsKHRyYWNrKTtcbiAgICAgICAgdXBkYXRlX3RyYWNrLnJldHJpZXZlcigpLmNhbGwodHJhY2ssIG9iai5sb2MpXG4gICAgICAgICAgICAudGhlbiAoZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgICAgICB0cmFjay5kYXRhKCkuZWxlbWVudHMocmVzcCk7XG4gICAgICAgICAgICAgICAgb2JqLm9uX3N1Y2Nlc3MoKTtcbiAgICAgICAgICAgICAgICBzcGlubmVyLm9mZi5jYWxsKHRyYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKHVwZGF0ZV90cmFjaylcbiAgICAgICAgLmdldHNldCAoJ2VsZW1lbnRzJywgW10pXG4gICAgICAgIC5nZXRzZXQgKCdyZXRyaWV2ZXInKTtcblxuICAgIHJldHVybiB1cGRhdGVfdHJhY2s7XG59O1xuXG5cbi8vIEEgcHJlZGVmaW5lZCB0cmFjayBkaXNwbGF5aW5nIG5vIGV4dGVybmFsIGRhdGFcbi8vIGl0IGlzIHVzZWQgZm9yIGxvY2F0aW9uIGFuZCBheGlzIHRyYWNrcyBmb3IgZXhhbXBsZVxudG50X2RhdGEuZW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHVwZGF0ZXIgPSB0bnRfZGF0YS5zeW5jKCk7XG5cbiAgICByZXR1cm4gdXBkYXRlcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRudF9kYXRhO1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZSAoXCJ0bnQuYXBpXCIpO1xudmFyIGxheW91dCA9IHJlcXVpcmUoXCIuL2xheW91dC5qc1wiKTtcblxuLy8gRkVBVFVSRSBWSVNcbi8vIHZhciBib2FyZCA9IHt9O1xuLy8gYm9hcmQudHJhY2sgPSB7fTtcbnZhciB0bnRfZmVhdHVyZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaCAoXCJjbGlja1wiLCBcImRibGNsaWNrXCIsIFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIik7XG5cbiAgICAvLy8vLy8gVmFycyBleHBvc2VkIGluIHRoZSBBUElcbiAgICB2YXIgY29uZmlnID0ge1xuICAgICAgICBjcmVhdGUgICA6IGZ1bmN0aW9uICgpIHt0aHJvdyBcImNyZWF0ZV9lbGVtIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIGZlYXR1cmUgb2JqZWN0XCI7fSxcbiAgICAgICAgbW92ZSAgICA6IGZ1bmN0aW9uICgpIHt0aHJvdyBcIm1vdmVfZWxlbSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBmZWF0dXJlIG9iamVjdFwiO30sXG4gICAgICAgIGRpc3RyaWJ1dGUgIDogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIGZpeGVkICAgOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgLy9sYXlvdXQgICA6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBpbmRleCAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgbGF5b3V0ICAgOiBsYXlvdXQuaWRlbnRpdHkoKSxcbiAgICAgICAgY29sb3IgOiAnIzAwMCcsXG4gICAgICAgIHNjYWxlIDogdW5kZWZpbmVkXG4gICAgfTtcblxuXG4gICAgLy8gVGhlIHJldHVybmVkIG9iamVjdFxuICAgIHZhciBmZWF0dXJlID0ge307XG5cbiAgICB2YXIgcmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgIFx0dHJhY2suZy5zZWxlY3RBbGwoXCIudG50X2VsZW1cIikucmVtb3ZlKCk7XG4gICAgICAgIHRyYWNrLmcuc2VsZWN0QWxsKFwiLnRudF9ndWlkZXJcIikucmVtb3ZlKCk7XG4gICAgICAgIHRyYWNrLmcuc2VsZWN0QWxsKFwiLnRudF9maXhlZFwiKS5yZW1vdmUoKTtcbiAgICB9O1xuXG4gICAgdmFyIGluaXQgPSBmdW5jdGlvbiAod2lkdGgpIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcblxuICAgICAgICB0cmFjay5nXG4gICAgICAgICAgICAuYXBwZW5kIChcInRleHRcIilcbiAgICAgICAgICAgIC5hdHRyIChcImNsYXNzXCIsIFwidG50X2ZpeGVkXCIpXG4gICAgICAgICAgICAuYXR0ciAoXCJ4XCIsIDUpXG4gICAgICAgICAgICAuYXR0ciAoXCJ5XCIsIDEyKVxuICAgICAgICAgICAgLmF0dHIgKFwiZm9udC1zaXplXCIsIDExKVxuICAgICAgICAgICAgLmF0dHIgKFwiZmlsbFwiLCBcImdyZXlcIilcbiAgICAgICAgICAgIC50ZXh0ICh0cmFjay5sYWJlbCgpKTtcblxuICAgICAgICBjb25maWcuZml4ZWQuY2FsbCh0cmFjaywgd2lkdGgpO1xuICAgIH07XG5cbiAgICB2YXIgcGxvdCA9IGZ1bmN0aW9uIChuZXdfZWxlbXMsIHRyYWNrLCB4U2NhbGUpIHtcbiAgICAgICAgbmV3X2VsZW1zLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICAgIGlmIChkMy5ldmVudC5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbCh0aGlzLCBkLCBpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld19lbGVtcy5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgaWYgKGQzLmV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbCh0aGlzLCBkLCBpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld19lbGVtcy5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICBpZiAoZDMuZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpc3BhdGNoLmRibGNsaWNrLmNhbGwodGhpcywgZCwgaSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdfZWxlbXMub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgaWYgKGQzLmV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKHRoaXMsIGQsIGkpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gbmV3X2VsZW0gaXMgYSBnIGVsZW1lbnQgdGhlIGZlYXR1cmUgaXMgaW5zZXJ0ZWRcbiAgICAgICAgY29uZmlnLmNyZWF0ZS5jYWxsKHRyYWNrLCBuZXdfZWxlbXMsIHhTY2FsZSk7XG4gICAgfTtcblxuICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbiAobG9jLCBmaWVsZCkge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB2YXIgc3ZnX2cgPSB0cmFjay5nO1xuXG4gICAgICAgIHZhciBlbGVtZW50cyA9IHRyYWNrLmRhdGEoKS5lbGVtZW50cygpO1xuXG4gICAgICAgIGlmIChmaWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlbGVtZW50cyA9IGVsZW1lbnRzW2ZpZWxkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkYXRhX2VsZW1zID0gY29uZmlnLmxheW91dC5jYWxsKHRyYWNrLCBlbGVtZW50cyk7XG5cblxuICAgICAgICBpZiAoZGF0YV9lbGVtcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdmlzX3NlbDtcbiAgICAgICAgdmFyIHZpc19lbGVtcztcbiAgICAgICAgaWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZpc19zZWwgPSBzdmdfZy5zZWxlY3RBbGwoXCIudG50X2VsZW1fXCIgKyBmaWVsZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2aXNfc2VsID0gc3ZnX2cuc2VsZWN0QWxsKFwiLnRudF9lbGVtXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmZpZy5pbmRleCkgeyAvLyBJbmRleGluZyBieSBmaWVsZFxuICAgICAgICAgICAgdmlzX2VsZW1zID0gdmlzX3NlbFxuICAgICAgICAgICAgICAgIC5kYXRhKGRhdGFfZWxlbXMsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25maWcuaW5kZXgoZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHsgLy8gSW5kZXhpbmcgYnkgcG9zaXRpb24gaW4gYXJyYXlcbiAgICAgICAgICAgIHZpc19lbGVtcyA9IHZpc19zZWxcbiAgICAgICAgICAgICAgICAuZGF0YShkYXRhX2VsZW1zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbmZpZy5kaXN0cmlidXRlLmNhbGwodHJhY2ssIHZpc19lbGVtcywgY29uZmlnLnNjYWxlKTtcblxuICAgIFx0dmFyIG5ld19lbGVtID0gdmlzX2VsZW1zXG4gICAgXHQgICAgLmVudGVyKCk7XG5cbiAgICBcdG5ld19lbGVtXG4gICAgXHQgICAgLmFwcGVuZChcImdcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2VsZW1cIilcbiAgICBcdCAgICAuY2xhc3NlZChcInRudF9lbGVtX1wiICsgZmllbGQsIGZpZWxkKVxuICAgIFx0ICAgIC5jYWxsKGZlYXR1cmUucGxvdCwgdHJhY2ssIGNvbmZpZy5zY2FsZSk7XG5cbiAgICBcdHZpc19lbGVtc1xuICAgIFx0ICAgIC5leGl0KClcbiAgICBcdCAgICAucmVtb3ZlKCk7XG4gICAgfTtcblxuICAgIHZhciBtb3ZlciA9IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICBcdHZhciBzdmdfZyA9IHRyYWNrLmc7XG4gICAgXHR2YXIgZWxlbXM7XG4gICAgXHQvLyBUT0RPOiBJcyBzZWxlY3RpbmcgdGhlIGVsZW1lbnRzIHRvIG1vdmUgdG9vIHNsb3c/XG4gICAgXHQvLyBJdCB3b3VsZCBiZSBuaWNlIHRvIHByb2ZpbGVcbiAgICBcdGlmIChmaWVsZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgXHQgICAgZWxlbXMgPSBzdmdfZy5zZWxlY3RBbGwoXCIudG50X2VsZW1fXCIgKyBmaWVsZCk7XG4gICAgXHR9IGVsc2Uge1xuICAgIFx0ICAgIGVsZW1zID0gc3ZnX2cuc2VsZWN0QWxsKFwiLnRudF9lbGVtXCIpO1xuICAgIFx0fVxuXG4gICAgXHRjb25maWcubW92ZS5jYWxsKHRoaXMsIGVsZW1zKTtcbiAgICB9O1xuXG4gICAgdmFyIG10ZiA9IGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChlbGVtKTtcbiAgICB9O1xuXG4gICAgdmFyIG1vdmVfdG9fZnJvbnQgPSBmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgICAgaWYgKGZpZWxkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgc3ZnX2cgPSB0cmFjay5nO1xuICAgICAgICAgICAgc3ZnX2cuc2VsZWN0QWxsKFwiLnRudF9lbGVtX1wiICsgZmllbGQpXG4gICAgICAgICAgICAgICAgLmVhY2goIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbXRmKHRoaXMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIGFwaWpzIChmZWF0dXJlKVxuICAgIFx0LmdldHNldCAoY29uZmlnKVxuICAgIFx0Lm1ldGhvZCAoe1xuICAgIFx0ICAgIHJlc2V0ICA6IHJlc2V0LFxuICAgIFx0ICAgIHBsb3QgICA6IHBsb3QsXG4gICAgXHQgICAgdXBkYXRlIDogdXBkYXRlLFxuICAgIFx0ICAgIG1vdmVyICAgOiBtb3ZlcixcbiAgICBcdCAgICBpbml0ICAgOiBpbml0LFxuICAgIFx0ICAgIG1vdmVfdG9fZnJvbnQgOiBtb3ZlX3RvX2Zyb250XG4gICAgXHR9KTtcblxuICAgIHJldHVybiBkMy5yZWJpbmQoZmVhdHVyZSwgZGlzcGF0Y2gsIFwib25cIik7XG59O1xuXG50bnRfZmVhdHVyZS5jb21wb3NpdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRpc3BsYXlzID0ge307XG4gICAgdmFyIGRpc3BsYXlfb3JkZXIgPSBbXTtcblxuICAgIHZhciBmZWF0dXJlcyA9IHt9O1xuXG4gICAgdmFyIHJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgZm9yICh2YXIgZGlzcGxheSBpbiBkaXNwbGF5cykge1xuICAgICAgICAgICAgaWYgKGRpc3BsYXlzLmhhc093blByb3BlcnR5KGRpc3BsYXkpKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheXNbZGlzcGxheV0ucmVzZXQuY2FsbCh0cmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGluaXQgPSBmdW5jdGlvbiAod2lkdGgpIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgZm9yICh2YXIgZGlzcGxheSBpbiBkaXNwbGF5cykge1xuICAgICAgICAgICAgaWYgKGRpc3BsYXlzLmhhc093blByb3BlcnR5KGRpc3BsYXkpKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheXNbZGlzcGxheV0uc2NhbGUoZmVhdHVyZXMuc2NhbGUoKSk7XG4gICAgICAgICAgICAgICAgZGlzcGxheXNbZGlzcGxheV0uaW5pdC5jYWxsKHRyYWNrLCB3aWR0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgXHRmb3IgKHZhciBpPTA7IGk8ZGlzcGxheV9vcmRlci5sZW5ndGg7IGkrKykge1xuICAgIFx0ICAgIGRpc3BsYXlzW2Rpc3BsYXlfb3JkZXJbaV1dLnVwZGF0ZS5jYWxsKHRyYWNrLCB1bmRlZmluZWQsIGRpc3BsYXlfb3JkZXJbaV0pO1xuICAgIFx0ICAgIGRpc3BsYXlzW2Rpc3BsYXlfb3JkZXJbaV1dLm1vdmVfdG9fZnJvbnQuY2FsbCh0cmFjaywgZGlzcGxheV9vcmRlcltpXSk7XG4gICAgXHR9XG4gICAgICAgIC8vIGZvciAodmFyIGRpc3BsYXkgaW4gZGlzcGxheXMpIHtcbiAgICAgICAgLy8gICAgIGlmIChkaXNwbGF5cy5oYXNPd25Qcm9wZXJ0eShkaXNwbGF5KSkge1xuICAgICAgICAvLyAgICAgICAgIGRpc3BsYXlzW2Rpc3BsYXldLnVwZGF0ZS5jYWxsKHRyYWNrLCB4U2NhbGUsIGRpc3BsYXkpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgfTtcblxuICAgIHZhciBtb3ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgZm9yICh2YXIgZGlzcGxheSBpbiBkaXNwbGF5cykge1xuICAgICAgICAgICAgaWYgKGRpc3BsYXlzLmhhc093blByb3BlcnR5KGRpc3BsYXkpKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheXNbZGlzcGxheV0ubW92ZXIuY2FsbCh0cmFjaywgZGlzcGxheSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGFkZCA9IGZ1bmN0aW9uIChrZXksIGRpc3BsYXkpIHtcbiAgICBcdGRpc3BsYXlzW2tleV0gPSBkaXNwbGF5O1xuICAgIFx0ZGlzcGxheV9vcmRlci5wdXNoKGtleSk7XG4gICAgXHRyZXR1cm4gZmVhdHVyZXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRfZGlzcGxheXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgXHR2YXIgZHMgPSBbXTtcbiAgICBcdGZvciAodmFyIGk9MDsgaTxkaXNwbGF5X29yZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgXHQgICAgZHMucHVzaChkaXNwbGF5c1tkaXNwbGF5X29yZGVyW2ldXSk7XG4gICAgXHR9XG4gICAgXHRyZXR1cm4gZHM7XG4gICAgfTtcblxuICAgIC8vIEFQSVxuICAgIGFwaWpzIChmZWF0dXJlcylcbiAgICAgICAgLmdldHNldChcInNjYWxlXCIpXG4gICAgXHQubWV0aG9kICh7XG4gICAgXHQgICAgcmVzZXQgIDogcmVzZXQsXG4gICAgXHQgICAgdXBkYXRlIDogdXBkYXRlLFxuICAgIFx0ICAgIG1vdmVyICAgOiBtb3ZlcixcbiAgICBcdCAgICBpbml0ICAgOiBpbml0LFxuICAgIFx0ICAgIGFkZCAgICA6IGFkZCxcbiAgICBcdCAgICBkaXNwbGF5cyA6IGdldF9kaXNwbGF5c1xuICAgIFx0fSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZXM7XG59O1xuXG50bnRfZmVhdHVyZS5hcmVhID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmZWF0dXJlID0gdG50X2ZlYXR1cmUubGluZSgpO1xuICAgIHZhciBsaW5lID0gZmVhdHVyZS5saW5lKCk7XG5cbiAgICB2YXIgYXJlYSA9IGQzLnN2Zy5hcmVhKClcbiAgICBcdC5pbnRlcnBvbGF0ZShsaW5lLmludGVycG9sYXRlKCkpXG4gICAgXHQudGVuc2lvbihmZWF0dXJlLnRlbnNpb24oKSk7XG5cbiAgICB2YXIgZGF0YV9wb2ludHM7XG5cbiAgICB2YXIgbGluZV9jcmVhdGUgPSBmZWF0dXJlLmNyZWF0ZSgpOyAvLyBXZSAnc2F2ZScgbGluZSBjcmVhdGlvblxuXG4gICAgZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChwb2ludHMpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG5cbiAgICBcdGlmIChkYXRhX3BvaW50cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgXHQgICAgdHJhY2suZy5zZWxlY3QoXCJwYXRoXCIpLnJlbW92ZSgpO1xuICAgIFx0fVxuXG4gICAgXHRsaW5lX2NyZWF0ZS5jYWxsKHRyYWNrLCBwb2ludHMsIHhTY2FsZSk7XG5cbiAgICBcdGFyZWFcbiAgICBcdCAgICAueChsaW5lLngoKSlcbiAgICBcdCAgICAueTEobGluZS55KCkpXG4gICAgXHQgICAgLnkwKHRyYWNrLmhlaWdodCgpKTtcblxuICAgIFx0ZGF0YV9wb2ludHMgPSBwb2ludHMuZGF0YSgpO1xuICAgIFx0cG9pbnRzLnJlbW92ZSgpO1xuXG4gICAgXHR0cmFjay5nXG4gICAgXHQgICAgLmFwcGVuZChcInBhdGhcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X2FyZWFcIilcbiAgICBcdCAgICAuY2xhc3NlZChcInRudF9lbGVtXCIsIHRydWUpXG4gICAgXHQgICAgLmRhdHVtKGRhdGFfcG9pbnRzKVxuICAgIFx0ICAgIC5hdHRyKFwiZFwiLCBhcmVhKVxuICAgIFx0ICAgIC5hdHRyKFwiZmlsbFwiLCBkMy5yZ2IoZmVhdHVyZS5jb2xvcigpKS5icmlnaHRlcigpKTtcbiAgICB9KTtcblxuICAgIHZhciBsaW5lX21vdmUgPSBmZWF0dXJlLm1vdmUoKTtcbiAgICBmZWF0dXJlLm1vdmUgKGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB2YXIgeFNjYWxlID0gZmVhdHVyZS5zY2FsZSgpO1xuICAgIFx0bGluZV9tb3ZlLmNhbGwodHJhY2ssIHBhdGgsIHhTY2FsZSk7XG5cbiAgICBcdGFyZWEueChsaW5lLngoKSk7XG4gICAgXHR0cmFjay5nXG4gICAgXHQgICAgLnNlbGVjdChcIi50bnRfYXJlYVwiKVxuICAgIFx0ICAgIC5kYXR1bShkYXRhX3BvaW50cylcbiAgICBcdCAgICAuYXR0cihcImRcIiwgYXJlYSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcblxufTtcblxudG50X2ZlYXR1cmUubGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlKCk7XG5cbiAgICB2YXIgeCA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiBkLnBvcztcbiAgICB9O1xuICAgIHZhciB5ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIGQudmFsO1xuICAgIH07XG4gICAgdmFyIHRlbnNpb24gPSAwLjc7XG4gICAgdmFyIHlTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpO1xuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgICAuaW50ZXJwb2xhdGUoXCJiYXNpc1wiKTtcblxuICAgIC8vIGxpbmUgZ2V0dGVyLiBUT0RPOiBTZXR0ZXI/XG4gICAgZmVhdHVyZS5saW5lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbGluZTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS54ID0gZnVuY3Rpb24gKGNiYWspIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiB4O1xuICAgIFx0fVxuICAgIFx0eCA9IGNiYWs7XG4gICAgXHRyZXR1cm4gZmVhdHVyZTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS55ID0gZnVuY3Rpb24gKGNiYWspIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiB5O1xuICAgIFx0fVxuICAgIFx0eSA9IGNiYWs7XG4gICAgXHRyZXR1cm4gZmVhdHVyZTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS50ZW5zaW9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiB0ZW5zaW9uO1xuICAgIFx0fVxuICAgIFx0dGVuc2lvbiA9IHQ7XG4gICAgXHRyZXR1cm4gZmVhdHVyZTtcbiAgICB9O1xuXG4gICAgdmFyIGRhdGFfcG9pbnRzO1xuXG4gICAgLy8gRm9yIG5vdywgY3JlYXRlIGlzIGEgb25lLW9mZiBldmVudFxuICAgIC8vIFRPRE86IE1ha2UgaXQgd29yayB3aXRoIHBhcnRpYWwgcGF0aHMsIGllLiBjcmVhdGluZyBhbmQgZGlzcGxheWluZyBvbmx5IHRoZSBwYXRoIHRoYXQgaXMgYmVpbmcgZGlzcGxheWVkXG4gICAgZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChwb2ludHMpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG5cbiAgICBcdGlmIChkYXRhX3BvaW50cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgXHQgICAgLy8gcmV0dXJuO1xuICAgIFx0ICAgIHRyYWNrLmcuc2VsZWN0KFwicGF0aFwiKS5yZW1vdmUoKTtcbiAgICBcdH1cblxuICAgIFx0bGluZVxuICAgIFx0ICAgIC50ZW5zaW9uKHRlbnNpb24pXG4gICAgXHQgICAgLngoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlKHgoZCkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLnkoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhY2suaGVpZ2h0KCkgLSB5U2NhbGUoeShkKSk7XG4gICAgXHQgICAgfSk7XG5cbiAgICBcdGRhdGFfcG9pbnRzID0gcG9pbnRzLmRhdGEoKTtcbiAgICBcdHBvaW50cy5yZW1vdmUoKTtcblxuICAgIFx0eVNjYWxlXG4gICAgXHQgICAgLmRvbWFpbihbMCwgMV0pXG4gICAgXHQgICAgLy8gLmRvbWFpbihbMCwgZDMubWF4KGRhdGFfcG9pbnRzLCBmdW5jdGlvbiAoZCkge1xuICAgIFx0ICAgIC8vIFx0cmV0dXJuIHkoZCk7XG4gICAgXHQgICAgLy8gfSldKVxuICAgIFx0ICAgIC5yYW5nZShbMCwgdHJhY2suaGVpZ2h0KCkgLSAyXSk7XG5cbiAgICBcdHRyYWNrLmdcbiAgICBcdCAgICAuYXBwZW5kKFwicGF0aFwiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZWxlbVwiKVxuICAgIFx0ICAgIC5hdHRyKFwiZFwiLCBsaW5lKGRhdGFfcG9pbnRzKSlcbiAgICBcdCAgICAuc3R5bGUoXCJzdHJva2VcIiwgZmVhdHVyZS5jb2xvcigpKVxuICAgIFx0ICAgIC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCA0KVxuICAgIFx0ICAgIC5zdHlsZShcImZpbGxcIiwgXCJub25lXCIpO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlIChmdW5jdGlvbiAocGF0aCkge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcblxuICAgIFx0bGluZS54KGZ1bmN0aW9uIChkKSB7XG4gICAgXHQgICAgcmV0dXJuIHhTY2FsZSh4KGQpKTtcbiAgICBcdH0pO1xuICAgIFx0dHJhY2suZy5zZWxlY3QoXCJwYXRoXCIpXG4gICAgXHQgICAgLmF0dHIoXCJkXCIsIGxpbmUoZGF0YV9wb2ludHMpKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxudG50X2ZlYXR1cmUuY29uc2VydmF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyAnSW5oZXJpdCcgZnJvbSBmZWF0dXJlLmFyZWFcbiAgICAgICAgdmFyIGZlYXR1cmUgPSB0bnRfZmVhdHVyZS5hcmVhKCk7XG5cbiAgICAgICAgdmFyIGFyZWFfY3JlYXRlID0gZmVhdHVyZS5jcmVhdGUoKTsgLy8gV2UgJ3NhdmUnIGFyZWEgY3JlYXRpb25cbiAgICAgICAgZmVhdHVyZS5jcmVhdGUgIChmdW5jdGlvbiAocG9pbnRzKSB7XG4gICAgICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgICAgIFx0YXJlYV9jcmVhdGUuY2FsbCh0cmFjaywgZDMuc2VsZWN0KHBvaW50c1swXVswXSksIHhTY2FsZSk7XG4gICAgICAgIH0pO1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG50bnRfZmVhdHVyZS5lbnNlbWJsID0gZnVuY3Rpb24gKCkge1xuICAgIC8vICdJbmhlcml0JyBmcm9tIGJvYXJkLnRyYWNrLmZlYXR1cmVcbiAgICB2YXIgZmVhdHVyZSA9IHRudF9mZWF0dXJlKCk7XG5cbiAgICB2YXIgY29sb3IyID0gXCIjN0ZGRjAwXCI7XG4gICAgdmFyIGNvbG9yMyA9IFwiIzAwQkIwMFwiO1xuXG4gICAgZmVhdHVyZS5maXhlZCAoZnVuY3Rpb24gKHdpZHRoKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgIFx0dmFyIGhlaWdodF9vZmZzZXQgPSB+fih0cmFjay5oZWlnaHQoKSAtICh0cmFjay5oZWlnaHQoKSAgKiAwLjgpKSAvIDI7XG5cbiAgICBcdHRyYWNrLmdcbiAgICBcdCAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ3VpZGVyIHRudF9maXhlZFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieDFcIiwgMClcbiAgICBcdCAgICAuYXR0cihcIngyXCIsIHdpZHRoKVxuICAgIFx0ICAgIC5hdHRyKFwieTFcIiwgaGVpZ2h0X29mZnNldClcbiAgICBcdCAgICAuYXR0cihcInkyXCIsIGhlaWdodF9vZmZzZXQpXG4gICAgXHQgICAgLnN0eWxlKFwic3Ryb2tlXCIsIGZlYXR1cmUuY29sb3IoKSlcbiAgICBcdCAgICAuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMSk7XG5cbiAgICBcdHRyYWNrLmdcbiAgICBcdCAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgIFx0ICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ3VpZGVyIHRudF9maXhlZFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieDFcIiwgMClcbiAgICBcdCAgICAuYXR0cihcIngyXCIsIHdpZHRoKVxuICAgIFx0ICAgIC5hdHRyKFwieTFcIiwgdHJhY2suaGVpZ2h0KCkgLSBoZWlnaHRfb2Zmc2V0KVxuICAgIFx0ICAgIC5hdHRyKFwieTJcIiwgdHJhY2suaGVpZ2h0KCkgLSBoZWlnaHRfb2Zmc2V0KVxuICAgIFx0ICAgIC5zdHlsZShcInN0cm9rZVwiLCBmZWF0dXJlLmNvbG9yKCkpXG4gICAgXHQgICAgLnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDEpO1xuXG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLmNyZWF0ZSAoZnVuY3Rpb24gKG5ld19lbGVtcykge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcblxuICAgIFx0dmFyIGhlaWdodF9vZmZzZXQgPSB+fih0cmFjay5oZWlnaHQoKSAtICh0cmFjay5oZWlnaHQoKSAgKiAwLjgpKSAvIDI7XG5cbiAgICBcdG5ld19lbGVtc1xuICAgIFx0ICAgIC5hcHBlbmQoXCJyZWN0XCIpXG4gICAgXHQgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZSAoZC5zdGFydCk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInlcIiwgaGVpZ2h0X29mZnNldClcbiAgICAvLyBcdCAgICAuYXR0cihcInJ4XCIsIDMpXG4gICAgLy8gXHQgICAgLmF0dHIoXCJyeVwiLCAzKVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgdHJhY2suaGVpZ2h0KCkgLSB+fihoZWlnaHRfb2Zmc2V0ICogMikpXG4gICAgXHQgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmNvbG9yKCkpXG4gICAgXHQgICAgLnRyYW5zaXRpb24oKVxuICAgIFx0ICAgIC5kdXJhdGlvbig1MDApXG4gICAgXHQgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0XHRpZiAoZC50eXBlID09PSAnaGlnaCcpIHtcbiAgICAgICAgXHRcdCAgICByZXR1cm4gZDMucmdiKGZlYXR1cmUuY29sb3IoKSk7XG4gICAgICAgIFx0XHR9XG4gICAgICAgIFx0XHRpZiAoZC50eXBlID09PSAnbG93Jykge1xuICAgICAgICBcdFx0ICAgIHJldHVybiBkMy5yZ2IoZmVhdHVyZS5jb2xvcjIoKSk7XG4gICAgICAgIFx0XHR9XG4gICAgICAgIFx0XHRyZXR1cm4gZDMucmdiKGZlYXR1cmUuY29sb3IzKCkpO1xuICAgIFx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5kaXN0cmlidXRlIChmdW5jdGlvbiAoYmxvY2tzKSB7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgXHRibG9ja3NcbiAgICBcdCAgICAuc2VsZWN0KFwicmVjdFwiKVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHhTY2FsZShkLmVuZCkgLSB4U2NhbGUoZC5zdGFydCkpO1xuICAgIFx0ICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZmVhdHVyZS5tb3ZlIChmdW5jdGlvbiAoYmxvY2tzKSB7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgXHRibG9ja3NcbiAgICBcdCAgICAuc2VsZWN0KFwicmVjdFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4U2NhbGUoZC5zdGFydCk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh4U2NhbGUoZC5lbmQpIC0geFNjYWxlKGQuc3RhcnQpKTtcbiAgICBcdCAgICB9KTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUuY29sb3IyID0gZnVuY3Rpb24gKGNvbCkge1xuICAgIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgXHQgICAgcmV0dXJuIGNvbG9yMjtcbiAgICBcdH1cbiAgICBcdGNvbG9yMiA9IGNvbDtcbiAgICBcdHJldHVybiBmZWF0dXJlO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLmNvbG9yMyA9IGZ1bmN0aW9uIChjb2wpIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiBjb2xvcjM7XG4gICAgXHR9XG4gICAgXHRjb2xvcjMgPSBjb2w7XG4gICAgXHRyZXR1cm4gZmVhdHVyZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG50bnRfZmVhdHVyZS52bGluZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyAnSW5oZXJpdCcgZnJvbSBmZWF0dXJlXG4gICAgdmFyIGZlYXR1cmUgPSB0bnRfZmVhdHVyZSgpO1xuXG4gICAgZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChuZXdfZWxlbXMpIHtcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgXHRuZXdfZWxlbXNcbiAgICBcdCAgICAuYXBwZW5kIChcImxpbmVcIilcbiAgICBcdCAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShmZWF0dXJlLmluZGV4KCkoZCkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4U2NhbGUoZmVhdHVyZS5pbmRleCgpKGQpKTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwieTFcIiwgMClcbiAgICBcdCAgICAuYXR0cihcInkyXCIsIHRyYWNrLmhlaWdodCgpKVxuICAgIFx0ICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZlYXR1cmUuY29sb3IoKSlcbiAgICBcdCAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUubW92ZSAoZnVuY3Rpb24gKHZsaW5lcykge1xuICAgICAgICB2YXIgeFNjYWxlID0gZmVhdHVyZS5zY2FsZSgpO1xuICAgIFx0dmxpbmVzXG4gICAgXHQgICAgLnNlbGVjdChcImxpbmVcIilcbiAgICBcdCAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShmZWF0dXJlLmluZGV4KCkoZCkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4U2NhbGUoZmVhdHVyZS5pbmRleCgpKGQpKTtcbiAgICBcdCAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xuXG59O1xuXG50bnRfZmVhdHVyZS5waW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gJ0luaGVyaXQnIGZyb20gYm9hcmQudHJhY2suZmVhdHVyZVxuICAgIHZhciBmZWF0dXJlID0gdG50X2ZlYXR1cmUoKTtcblxuICAgIHZhciB5U2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIFx0LmRvbWFpbihbMCwwXSlcbiAgICBcdC5yYW5nZShbMCwwXSk7XG5cbiAgICB2YXIgb3B0cyA9IHtcbiAgICAgICAgcG9zIDogZDMuZnVuY3RvcihcInBvc1wiKSxcbiAgICAgICAgdmFsIDogZDMuZnVuY3RvcihcInZhbFwiKSxcbiAgICAgICAgZG9tYWluIDogWzAsMV1cbiAgICB9O1xuXG4gICAgdmFyIHBpbl9iYWxsX3IgPSA1OyAvLyB0aGUgcmFkaXVzIG9mIHRoZSBjaXJjbGUgaW4gdGhlIHBpblxuXG4gICAgYXBpanMoZmVhdHVyZSlcbiAgICAgICAgLmdldHNldChvcHRzKTtcblxuXG4gICAgZmVhdHVyZS5jcmVhdGUgKGZ1bmN0aW9uIChuZXdfcGlucykge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcbiAgICBcdHlTY2FsZVxuICAgIFx0ICAgIC5kb21haW4oZmVhdHVyZS5kb21haW4oKSlcbiAgICBcdCAgICAucmFuZ2UoW3Bpbl9iYWxsX3IsIHRyYWNrLmhlaWdodCgpLXBpbl9iYWxsX3ItMTBdKTsgLy8gMTAgZm9yIGxhYmVsbGluZ1xuXG4gICAgXHQvLyBwaW5zIGFyZSBjb21wb3NlZCBvZiBsaW5lcywgY2lyY2xlcyBhbmQgbGFiZWxzXG4gICAgXHRuZXdfcGluc1xuICAgIFx0ICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgXHQgICAgLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgIFx0ICAgIFx0cmV0dXJuIHhTY2FsZShkW29wdHMucG9zKGQsIGkpXSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYWNrLmhlaWdodCgpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbiAoZCxpKSB7XG4gICAgXHQgICAgXHRyZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICBcdCAgICBcdHJldHVybiB0cmFjay5oZWlnaHQoKSAtIHlTY2FsZShkW29wdHMudmFsKGQsIGkpXSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKGZlYXR1cmUuY29sb3IoKSkoZCk7XG4gICAgICAgICAgICB9KTtcblxuICAgIFx0bmV3X3BpbnNcbiAgICBcdCAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgXHQgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4U2NhbGUoZFtvcHRzLnBvcyhkLCBpKV0pO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cmFjay5oZWlnaHQoKSAtIHlTY2FsZShkW29wdHMudmFsKGQsIGkpXSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInJcIiwgcGluX2JhbGxfcilcbiAgICBcdCAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihmZWF0dXJlLmNvbG9yKCkpKGQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3X3BpbnNcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAuYXR0cihcImZvbnQtc2l6ZVwiLCBcIjEzXCIpXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlKGRbb3B0cy5wb3MoZCwgaSldKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihmZWF0dXJlLmNvbG9yKCkpKGQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQubGFiZWwgfHwgXCJcIjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLmRpc3RyaWJ1dGUgKGZ1bmN0aW9uIChwaW5zKSB7XG4gICAgICAgIHBpbnNcbiAgICAgICAgICAgIC5zZWxlY3QoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLmxhYmVsIHx8IFwiXCI7XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUubW92ZShmdW5jdGlvbiAocGlucykge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdmFyIHhTY2FsZSA9IGZlYXR1cmUuc2NhbGUoKTtcblxuICAgIFx0cGluc1xuICAgIFx0ICAgIC8vLmVhY2gocG9zaXRpb25fcGluX2xpbmUpXG4gICAgXHQgICAgLnNlbGVjdChcImxpbmVcIilcbiAgICBcdCAgICAuYXR0cihcIngxXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShkW29wdHMucG9zKGQsIGkpXSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gdHJhY2suaGVpZ2h0KCk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uIChkLGkpIHtcbiAgICAgICAgXHRcdHJldHVybiB4U2NhbGUoZFtvcHRzLnBvcyhkLCBpKV0pO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICBcdFx0cmV0dXJuIHRyYWNrLmhlaWdodCgpIC0geVNjYWxlKGRbb3B0cy52YWwoZCwgaSldKTtcbiAgICBcdCAgICB9KTtcblxuICAgIFx0cGluc1xuICAgIFx0ICAgIC5zZWxlY3QoXCJjaXJjbGVcIilcbiAgICBcdCAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShkW29wdHMucG9zKGQsIGkpXSk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYWNrLmhlaWdodCgpIC0geVNjYWxlKGRbb3B0cy52YWwoZCwgaSldKTtcbiAgICBcdCAgICB9KTtcblxuICAgICAgICBwaW5zXG4gICAgICAgICAgICAuc2VsZWN0KFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhTY2FsZShkW29wdHMucG9zKGQsIGkpXSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5sYWJlbCB8fCBcIlwiO1xuICAgICAgICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIGZlYXR1cmUuZml4ZWQgKGZ1bmN0aW9uICh3aWR0aCkge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB0cmFjay5nXG4gICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF9maXhlZFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ4MVwiLCAwKVxuICAgICAgICAgICAgLmF0dHIoXCJ4MlwiLCB3aWR0aClcbiAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgdHJhY2suaGVpZ2h0KCkpXG4gICAgICAgICAgICAuYXR0cihcInkyXCIsIHRyYWNrLmhlaWdodCgpKVxuICAgICAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcbiAgICAgICAgICAgIC5zdHlsZShcInN0cm9rZS13aXRoXCIsIFwiMXB4XCIpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZlYXR1cmU7XG59O1xuXG50bnRfZmVhdHVyZS5ibG9jayA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyAnSW5oZXJpdCcgZnJvbSBib2FyZC50cmFjay5mZWF0dXJlXG4gICAgdmFyIGZlYXR1cmUgPSB0bnRfZmVhdHVyZSgpO1xuXG4gICAgYXBpanMoZmVhdHVyZSlcbiAgICBcdC5nZXRzZXQoJ2Zyb20nLCBmdW5jdGlvbiAoZCkge1xuICAgIFx0ICAgIHJldHVybiBkLnN0YXJ0O1xuICAgIFx0fSlcbiAgICBcdC5nZXRzZXQoJ3RvJywgZnVuY3Rpb24gKGQpIHtcbiAgICBcdCAgICByZXR1cm4gZC5lbmQ7XG4gICAgXHR9KTtcblxuICAgIGZlYXR1cmUuY3JlYXRlKGZ1bmN0aW9uIChuZXdfZWxlbXMpIHtcbiAgICBcdHZhciB0cmFjayA9IHRoaXM7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgXHRuZXdfZWxlbXNcbiAgICBcdCAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICBcdFx0Ly8gVE9ETzogc3RhcnQsIGVuZCBzaG91bGQgYmUgYWRqdXN0YWJsZSB2aWEgdGhlIHRyYWNrcyBBUElcbiAgICAgICAgXHRcdHJldHVybiB4U2NhbGUoZmVhdHVyZS5mcm9tKCkoZCwgaSkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICBcdFx0cmV0dXJuICh4U2NhbGUoZmVhdHVyZS50bygpKGQsIGkpKSAtIHhTY2FsZShmZWF0dXJlLmZyb20oKShkLCBpKSkpO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJoZWlnaHRcIiwgdHJhY2suaGVpZ2h0KCkpXG4gICAgXHQgICAgLmF0dHIoXCJmaWxsXCIsIHRyYWNrLmNvbG9yKCkpXG4gICAgXHQgICAgLnRyYW5zaXRpb24oKVxuICAgIFx0ICAgIC5kdXJhdGlvbig1MDApXG4gICAgXHQgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0XHRpZiAoZC5jb2xvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIFx0XHQgICAgcmV0dXJuIGZlYXR1cmUuY29sb3IoKTtcbiAgICAgICAgXHRcdH0gZWxzZSB7XG4gICAgICAgIFx0XHQgICAgcmV0dXJuIGQuY29sb3I7XG4gICAgICAgIFx0XHR9XG4gICAgXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmZWF0dXJlLmRpc3RyaWJ1dGUoZnVuY3Rpb24gKGVsZW1zKSB7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgXHRlbGVtc1xuICAgIFx0ICAgIC5zZWxlY3QoXCJyZWN0XCIpXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBcdFx0cmV0dXJuICh4U2NhbGUoZC5lbmQpIC0geFNjYWxlKGQuc3RhcnQpKTtcbiAgICBcdCAgICB9KTtcbiAgICB9KTtcblxuICAgIGZlYXR1cmUubW92ZShmdW5jdGlvbiAoYmxvY2tzKSB7XG4gICAgICAgIHZhciB4U2NhbGUgPSBmZWF0dXJlLnNjYWxlKCk7XG4gICAgXHRibG9ja3NcbiAgICBcdCAgICAuc2VsZWN0KFwicmVjdFwiKVxuICAgIFx0ICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBcdFx0cmV0dXJuIHhTY2FsZShkLnN0YXJ0KTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgXHRcdHJldHVybiAoeFNjYWxlKGQuZW5kKSAtIHhTY2FsZShkLnN0YXJ0KSk7XG4gICAgXHQgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmVhdHVyZTtcblxufTtcblxudG50X2ZlYXR1cmUuYXhpcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgeEF4aXM7XG4gICAgdmFyIG9yaWVudGF0aW9uID0gXCJ0b3BcIjtcbiAgICB2YXIgeFNjYWxlO1xuXG4gICAgLy8gQXhpcyBkb2Vzbid0IGluaGVyaXQgZnJvbSBmZWF0dXJlXG4gICAgdmFyIGZlYXR1cmUgPSB7fTtcbiAgICBmZWF0dXJlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIFx0eEF4aXMgPSB1bmRlZmluZWQ7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgIFx0dHJhY2suZy5zZWxlY3RBbGwoXCIudGlja1wiKS5yZW1vdmUoKTtcbiAgICB9O1xuICAgIGZlYXR1cmUucGxvdCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIGZlYXR1cmUubW92ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgXHR2YXIgdHJhY2sgPSB0aGlzO1xuICAgIFx0dmFyIHN2Z19nID0gdHJhY2suZztcbiAgICBcdHN2Z19nLmNhbGwoeEF4aXMpO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHhBeGlzID0gdW5kZWZpbmVkO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcdC8vIENyZWF0ZSBBeGlzIGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICAgICAgaWYgKHhBeGlzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHhBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAgICAgICAgIC5zY2FsZSh4U2NhbGUpXG4gICAgICAgICAgICAgICAgLm9yaWVudChvcmllbnRhdGlvbik7XG4gICAgICAgIH1cblxuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICBcdHZhciBzdmdfZyA9IHRyYWNrLmc7XG4gICAgXHRzdmdfZy5jYWxsKHhBeGlzKTtcbiAgICB9O1xuXG4gICAgZmVhdHVyZS5vcmllbnRhdGlvbiA9IGZ1bmN0aW9uIChwb3MpIHtcbiAgICBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIFx0ICAgIHJldHVybiBvcmllbnRhdGlvbjtcbiAgICBcdH1cbiAgICBcdG9yaWVudGF0aW9uID0gcG9zO1xuICAgIFx0cmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIGZlYXR1cmUuc2NhbGUgPSBmdW5jdGlvbiAocykge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB4U2NhbGU7XG4gICAgICAgIH1cbiAgICAgICAgeFNjYWxlID0gcztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxudG50X2ZlYXR1cmUubG9jYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJvdztcbiAgICB2YXIgeFNjYWxlO1xuXG4gICAgdmFyIGZlYXR1cmUgPSB7fTtcbiAgICBmZWF0dXJlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByb3cgPSB1bmRlZmluZWQ7XG4gICAgfTtcbiAgICBmZWF0dXJlLnBsb3QgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICBmZWF0dXJlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJvdyA9IHVuZGVmaW5lZDtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgdHJhY2suZy5zZWxlY3QoXCJ0ZXh0XCIpLnJlbW92ZSgpO1xuICAgIH07XG4gICAgZmVhdHVyZS5tb3ZlciA9IGZ1bmN0aW9uKCkge1xuICAgIFx0dmFyIGRvbWFpbiA9IHhTY2FsZS5kb21haW4oKTtcbiAgICBcdHJvdy5zZWxlY3QoXCJ0ZXh0XCIpXG4gICAgXHQgICAgLnRleHQoXCJMb2NhdGlvbjogXCIgKyB+fmRvbWFpblswXSArIFwiLVwiICsgfn5kb21haW5bMV0pO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLnNjYWxlID0gZnVuY3Rpb24gKHNjKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHhTY2FsZTtcbiAgICAgICAgfVxuICAgICAgICB4U2NhbGUgPSBzYztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIGZlYXR1cmUudXBkYXRlID0gZnVuY3Rpb24gKGxvYykge1xuICAgIFx0dmFyIHRyYWNrID0gdGhpcztcbiAgICBcdHZhciBzdmdfZyA9IHRyYWNrLmc7XG4gICAgXHR2YXIgZG9tYWluID0geFNjYWxlLmRvbWFpbigpO1xuICAgIFx0aWYgKHJvdyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgXHQgICAgcm93ID0gc3ZnX2c7XG4gICAgXHQgICAgcm93XG4gICAgICAgIFx0XHQuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICBcdFx0LnRleHQoXCJMb2NhdGlvbjogXCIgKyBNYXRoLnJvdW5kKGRvbWFpblswXSkgKyBcIi1cIiArIE1hdGgucm91bmQoZG9tYWluWzFdKSk7XG4gICAgXHR9XG4gICAgfTtcblxuICAgIHJldHVybiBmZWF0dXJlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X2ZlYXR1cmU7XG4iLCJ2YXIgYm9hcmQgPSByZXF1aXJlIChcIi4vYm9hcmQuanNcIik7XG5ib2FyZC50cmFjayA9IHJlcXVpcmUgKFwiLi90cmFja1wiKTtcbmJvYXJkLnRyYWNrLmRhdGEgPSByZXF1aXJlIChcIi4vZGF0YS5qc1wiKTtcbmJvYXJkLnRyYWNrLmxheW91dCA9IHJlcXVpcmUgKFwiLi9sYXlvdXQuanNcIik7XG5ib2FyZC50cmFjay5mZWF0dXJlID0gcmVxdWlyZSAoXCIuL2ZlYXR1cmUuanNcIik7XG5ib2FyZC50cmFjay5sYXlvdXQgPSByZXF1aXJlIChcIi4vbGF5b3V0LmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBib2FyZDtcbiIsInZhciBhcGlqcyA9IHJlcXVpcmUgKFwidG50LmFwaVwiKTtcblxuLy8gdmFyIGJvYXJkID0ge307XG4vLyBib2FyZC50cmFjayA9IHt9O1xudmFyIGxheW91dCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIC8vIFRoZSByZXR1cm5lZCBjbG9zdXJlIC8gb2JqZWN0XG4gICAgdmFyIGwgPSBmdW5jdGlvbiAobmV3X2VsZW1zKSAge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICBsLmVsZW1lbnRzKCkuY2FsbCh0cmFjaywgbmV3X2VsZW1zKTtcbiAgICAgICAgcmV0dXJuIG5ld19lbGVtcztcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzKGwpXG4gICAgICAgIC5nZXRzZXQgKCdlbGVtZW50cycsIGZ1bmN0aW9uICgpIHt9KTtcblxuICAgIHJldHVybiBsO1xufTtcblxubGF5b3V0LmlkZW50aXR5ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBsYXlvdXQoKVxuICAgICAgICAuZWxlbWVudHMgKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZTtcbiAgICAgICAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBsYXlvdXQ7XG4iLCJ2YXIgc3Bpbm5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyB2YXIgbiA9IDA7XG4gICAgdmFyIHNwX2VsZW07XG4gICAgdmFyIHNwID0ge307XG5cbiAgICBzcC5vbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRyYWNrID0gdGhpcztcbiAgICAgICAgaWYgKCF0cmFjay5zcGlubmVyKSB7XG4gICAgICAgICAgICB0cmFjay5zcGlubmVyID0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyYWNrLnNwaW5uZXIrKztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhY2suc3Bpbm5lcj09MSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRyYWNrLmc7XG4gICAgICAgICAgICB2YXIgYmdDb2xvciA9IHRyYWNrLmNvbG9yKCk7XG4gICAgICAgICAgICBzcF9lbGVtID0gY29udGFpbmVyXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfc3Bpbm5lclwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIzMHB4XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIzMHB4XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ4bWxzXCIsIFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcInZpZXdCb3hcIiwgXCIwIDAgMTAwIDEwMFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwicHJlc2VydmVBc3BlY3RSYXRpb1wiLCBcInhNaWRZTWlkXCIpO1xuXG5cbiAgICAgICAgICAgIHNwX2VsZW1cbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAnMCcpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ5XCIsICcwJylcbiAgICAgICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIxMDBcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcInJ4XCIsICc1MCcpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJyeVwiLCAnNTAnKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBiZ0NvbG9yKTtcbiAgICAgICAgICAgICAgICAvLy5hdHRyKFwib3BhY2l0eVwiLCAwLjYpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8MTI7IGkrKykge1xuICAgICAgICAgICAgICAgIHRpY2soc3BfZWxlbSwgaSwgYmdDb2xvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIGlmICh0cmFjay5zcGlubmVyPjApe1xuICAgICAgICAgICAgLy8gTW92ZSB0aGUgc3Bpbm5lciB0byBmcm9udFxuICAgICAgICAgICAgdmFyIG5vZGUgPSBzcF9lbGVtLm5vZGUoKTtcbiAgICAgICAgICAgIGlmIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICBub2RlLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc3Aub2ZmID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdHJhY2sgPSB0aGlzO1xuICAgICAgICB0cmFjay5zcGlubmVyLS07XG4gICAgICAgIGlmICghdHJhY2suc3Bpbm5lcikge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRyYWNrLmc7XG4gICAgICAgICAgICBjb250YWluZXIuc2VsZWN0QWxsKFwiLnRudF9zcGlubmVyXCIpXG4gICAgICAgICAgICAgICAgLnJlbW92ZSgpO1xuXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdGljayAoZWxlbSwgaSwgYmdDb2xvcikge1xuICAgICAgICBlbGVtXG4gICAgICAgICAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIFwiNDYuNVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsICc0MCcpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIFwiN1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIyMFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJyeFwiLCBcIjVcIilcbiAgICAgICAgICAgIC5hdHRyKFwicnlcIiwgXCI1XCIpXG4gICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgZDMucmdiKGJnQ29sb3IpLmRhcmtlcigyKSlcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKFwiICsgKDM2MC8xMikqaSArIFwiIDUwIDUwKSB0cmFuc2xhdGUoMCAtMzApXCIpXG4gICAgICAgICAgICAuYXBwZW5kKFwiYW5pbWF0ZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJhdHRyaWJ1dGVOYW1lXCIsIFwib3BhY2l0eVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJmcm9tXCIsIFwiMVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0b1wiLCBcIjBcIilcbiAgICAgICAgICAgIC5hdHRyKFwiZHVyXCIsIFwiMXNcIilcbiAgICAgICAgICAgIC5hdHRyKFwiYmVnaW5cIiwgKDEvMTIpKmkgKyBcInNcIilcbiAgICAgICAgICAgIC5hdHRyKFwicmVwZWF0Q291bnRcIiwgXCJpbmRlZmluaXRlXCIpO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIHNwO1xufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHNwaW5uZXI7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlIChcInRudC5hcGlcIik7XG52YXIgaXRlcmF0b3IgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpLml0ZXJhdG9yO1xuXG5cbnZhciB0cmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBkaXNwbGF5O1xuXG4gICAgdmFyIGNvbmYgPSB7XG4gICAgXHRjb2xvciA6IGQzLnJnYignI0NDQ0NDQycpLFxuICAgIFx0aGVpZ2h0ICAgICAgICAgICA6IDI1MCxcbiAgICBcdC8vIGRhdGEgaXMgdGhlIG9iamVjdCAobm9ybWFsbHkgYSB0bnQudHJhY2suZGF0YSBvYmplY3QpIHVzZWQgdG8gcmV0cmlldmUgYW5kIHVwZGF0ZSBkYXRhIGZvciB0aGUgdHJhY2tcbiAgICBcdGRhdGEgICAgICAgICAgICAgOiB0cmFjay5kYXRhLmVtcHR5KCksXG4gICAgICAgIC8vIGRpc3BsYXkgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgIGxhYmVsICAgICAgICAgICAgOiBcIlwiLFxuICAgICAgICBpZCAgICAgICAgICAgICAgIDogdHJhY2suaWQoKVxuICAgIH07XG5cbiAgICAvLyBUaGUgcmV0dXJuZWQgb2JqZWN0IC8gY2xvc3VyZVxuICAgIHZhciB0ID0ge307XG5cbiAgICAvLyBBUElcbiAgICB2YXIgYXBpID0gYXBpanMgKHQpXG4gICAgXHQuZ2V0c2V0IChjb25mKTtcblxuICAgIC8vIFRPRE86IFRoaXMgbWVhbnMgdGhhdCBoZWlnaHQgc2hvdWxkIGJlIGRlZmluZWQgYmVmb3JlIGRpc3BsYXlcbiAgICAvLyB3ZSBzaG91bGRuJ3QgcmVseSBvbiB0aGlzXG4gICAgdC5kaXNwbGF5ID0gZnVuY3Rpb24gKG5ld19wbG90dGVyKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGRpc3BsYXk7XG4gICAgICAgIH1cblxuICAgICAgICBkaXNwbGF5ID0gbmV3X3Bsb3R0ZXI7XG4gICAgICAgIGlmICh0eXBlb2YgKGRpc3BsYXkpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBkaXNwbGF5LmxheW91dCAmJiBkaXNwbGF5LmxheW91dCgpLmhlaWdodChjb25mLmhlaWdodCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGlzcGxheSkge1xuICAgICAgICAgICAgICAgIGlmIChkaXNwbGF5Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheVtrZXldLmxheW91dCAmJiBkaXNwbGF5W2tleV0ubGF5b3V0KCkuaGVpZ2h0KGNvbmYuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIHQ7XG59O1xuXG50cmFjay5pZCA9IGl0ZXJhdG9yKDEpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmFjaztcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL25ld2ljay5qc1wiKTtcbiIsIi8qKlxuICogTmV3aWNrIGFuZCBuaHggZm9ybWF0cyBwYXJzZXIgaW4gSmF2YVNjcmlwdC5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIEphc29uIERhdmllcyAyMDEwIGFuZCBNaWd1ZWwgUGlnbmF0ZWxsaVxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKlxuICogRXhhbXBsZSB0cmVlIChmcm9tIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTmV3aWNrX2Zvcm1hdCk6XG4gKlxuICogKy0tMC4xLS1BXG4gKiBGLS0tLS0wLjItLS0tLUIgICAgICAgICAgICArLS0tLS0tLTAuMy0tLS1DXG4gKiArLS0tLS0tLS0tLS0tLS0tLS0tMC41LS0tLS1FXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICArLS0tLS0tLS0tMC40LS0tLS0tRFxuICpcbiAqIE5ld2ljayBmb3JtYXQ6XG4gKiAoQTowLjEsQjowLjIsKEM6MC4zLEQ6MC40KUU6MC41KUY7XG4gKlxuICogQ29udmVydGVkIHRvIEpTT046XG4gKiB7XG4gKiAgIG5hbWU6IFwiRlwiLFxuICogICBicmFuY2hzZXQ6IFtcbiAqICAgICB7bmFtZTogXCJBXCIsIGxlbmd0aDogMC4xfSxcbiAqICAgICB7bmFtZTogXCJCXCIsIGxlbmd0aDogMC4yfSxcbiAqICAgICB7XG4gKiAgICAgICBuYW1lOiBcIkVcIixcbiAqICAgICAgIGxlbmd0aDogMC41LFxuICogICAgICAgYnJhbmNoc2V0OiBbXG4gKiAgICAgICAgIHtuYW1lOiBcIkNcIiwgbGVuZ3RoOiAwLjN9LFxuICogICAgICAgICB7bmFtZTogXCJEXCIsIGxlbmd0aDogMC40fVxuICogICAgICAgXVxuICogICAgIH1cbiAqICAgXVxuICogfVxuICpcbiAqIENvbnZlcnRlZCB0byBKU09OLCBidXQgd2l0aCBubyBuYW1lcyBvciBsZW5ndGhzOlxuICoge1xuICogICBicmFuY2hzZXQ6IFtcbiAqICAgICB7fSwge30sIHtcbiAqICAgICAgIGJyYW5jaHNldDogW3t9LCB7fV1cbiAqICAgICB9XG4gKiAgIF1cbiAqIH1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwYXJzZV9uZXdpY2sgOiBmdW5jdGlvbihzKSB7XG5cdHZhciBhbmNlc3RvcnMgPSBbXTtcblx0dmFyIHRyZWUgPSB7fTtcblx0dmFyIHRva2VucyA9IHMuc3BsaXQoL1xccyooO3xcXCh8XFwpfCx8OilcXHMqLyk7XG5cdHZhciBzdWJ0cmVlO1xuXHRmb3IgKHZhciBpPTA7IGk8dG9rZW5zLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV07XG5cdCAgICBzd2l0Y2ggKHRva2VuKSB7XG4gICAgICAgICAgICBjYXNlICcoJzogLy8gbmV3IGJyYW5jaHNldFxuXHRcdHN1YnRyZWUgPSB7fTtcblx0XHR0cmVlLmNoaWxkcmVuID0gW3N1YnRyZWVdO1xuXHRcdGFuY2VzdG9ycy5wdXNoKHRyZWUpO1xuXHRcdHRyZWUgPSBzdWJ0cmVlO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnLCc6IC8vIGFub3RoZXIgYnJhbmNoXG5cdFx0c3VidHJlZSA9IHt9O1xuXHRcdGFuY2VzdG9yc1thbmNlc3RvcnMubGVuZ3RoLTFdLmNoaWxkcmVuLnB1c2goc3VidHJlZSk7XG5cdFx0dHJlZSA9IHN1YnRyZWU7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICcpJzogLy8gb3B0aW9uYWwgbmFtZSBuZXh0XG5cdFx0dHJlZSA9IGFuY2VzdG9ycy5wb3AoKTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJzonOiAvLyBvcHRpb25hbCBsZW5ndGggbmV4dFxuXHRcdGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcblx0XHR2YXIgeCA9IHRva2Vuc1tpLTFdO1xuXHRcdGlmICh4ID09ICcpJyB8fCB4ID09ICcoJyB8fCB4ID09ICcsJykge1xuXHRcdCAgICB0cmVlLm5hbWUgPSB0b2tlbjtcblx0XHR9IGVsc2UgaWYgKHggPT0gJzonKSB7XG5cdFx0ICAgIHRyZWUuYnJhbmNoX2xlbmd0aCA9IHBhcnNlRmxvYXQodG9rZW4pO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuXHRyZXR1cm4gdHJlZTtcbiAgICB9LFxuXG4gICAgcGFyc2Vfbmh4IDogZnVuY3Rpb24gKHMpIHtcblx0dmFyIGFuY2VzdG9ycyA9IFtdO1xuXHR2YXIgdHJlZSA9IHt9O1xuXHR2YXIgc3VidHJlZTtcblxuXHR2YXIgdG9rZW5zID0gcy5zcGxpdCggL1xccyooO3xcXCh8XFwpfFxcW3xcXF18LHw6fD0pXFxzKi8gKTtcblx0Zm9yICh2YXIgaT0wOyBpPHRva2Vucy5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIHRva2VuID0gdG9rZW5zW2ldO1xuXHQgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICAgICAgY2FzZSAnKCc6IC8vIG5ldyBjaGlsZHJlblxuXHRcdHN1YnRyZWUgPSB7fTtcblx0XHR0cmVlLmNoaWxkcmVuID0gW3N1YnRyZWVdO1xuXHRcdGFuY2VzdG9ycy5wdXNoKHRyZWUpO1xuXHRcdHRyZWUgPSBzdWJ0cmVlO1xuXHRcdGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnLCc6IC8vIGFub3RoZXIgYnJhbmNoXG5cdFx0c3VidHJlZSA9IHt9O1xuXHRcdGFuY2VzdG9yc1thbmNlc3RvcnMubGVuZ3RoLTFdLmNoaWxkcmVuLnB1c2goc3VidHJlZSk7XG5cdFx0dHJlZSA9IHN1YnRyZWU7XG5cdFx0YnJlYWs7XG4gICAgICAgICAgICBjYXNlICcpJzogLy8gb3B0aW9uYWwgbmFtZSBuZXh0XG5cdFx0dHJlZSA9IGFuY2VzdG9ycy5wb3AoKTtcblx0XHRicmVhaztcbiAgICAgICAgICAgIGNhc2UgJzonOiAvLyBvcHRpb25hbCBsZW5ndGggbmV4dFxuXHRcdGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcblx0XHR2YXIgeCA9IHRva2Vuc1tpLTFdO1xuXHRcdGlmICh4ID09ICcpJyB8fCB4ID09ICcoJyB8fCB4ID09ICcsJykge1xuXHRcdCAgICB0cmVlLm5hbWUgPSB0b2tlbjtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoeCA9PSAnOicpIHtcblx0XHQgICAgdmFyIHRlc3RfdHlwZSA9IHR5cGVvZiB0b2tlbjtcblx0XHQgICAgaWYoIWlzTmFOKHRva2VuKSl7XG5cdFx0XHR0cmVlLmJyYW5jaF9sZW5ndGggPSBwYXJzZUZsb2F0KHRva2VuKTtcblx0XHQgICAgfVxuXHRcdH1cblx0XHRlbHNlIGlmICh4ID09ICc9Jyl7XG5cdFx0ICAgIHZhciB4MiA9IHRva2Vuc1tpLTJdO1xuXHRcdCAgICBzd2l0Y2goeDIpe1xuXHRcdCAgICBjYXNlICdEJzpcblx0XHRcdHRyZWUuZHVwbGljYXRpb24gPSB0b2tlbjtcblx0XHRcdGJyZWFrO1xuXHRcdCAgICBjYXNlICdHJzpcblx0XHRcdHRyZWUuZ2VuZV9pZCA9IHRva2VuO1xuXHRcdFx0YnJlYWs7XG5cdFx0ICAgIGNhc2UgJ1QnOlxuXHRcdFx0dHJlZS50YXhvbl9pZCA9IHRva2VuO1xuXHRcdFx0YnJlYWs7XG5cdFx0ICAgIGRlZmF1bHQgOlxuXHRcdFx0dHJlZVt0b2tlbnNbaS0yXV0gPSB0b2tlbjtcblx0XHQgICAgfVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHQgICAgdmFyIHRlc3Q7XG5cblx0XHR9XG5cdCAgICB9XG5cdH1cblx0cmV0dXJuIHRyZWU7XG4gICAgfVxufTtcbiIsInZhciBub2RlID0gcmVxdWlyZShcIi4vc3JjL25vZGUuanNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBub2RlO1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgaXRlcmF0b3IgPSByZXF1aXJlKFwidG50LnV0aWxzXCIpLml0ZXJhdG9yO1xuXG52YXIgdG50X25vZGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuLy90bnQudHJlZS5ub2RlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBub2RlID0gZnVuY3Rpb24gKCkge1xuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKG5vZGUpO1xuXG4gICAgLy8gQVBJXG4vLyAgICAgbm9kZS5ub2RlcyA9IGZ1bmN0aW9uKCkge1xuLy8gXHRpZiAoY2x1c3RlciA9PT0gdW5kZWZpbmVkKSB7XG4vLyBcdCAgICBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxuLy8gXHQgICAgLy8gVE9ETzogbGVuZ3RoIGFuZCBjaGlsZHJlbiBzaG91bGQgYmUgZXhwb3NlZCBpbiB0aGUgQVBJXG4vLyBcdCAgICAvLyBpLmUuIHRoZSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIGNoYW5nZSB0aGlzIGRlZmF1bHRzIHZpYSB0aGUgQVBJXG4vLyBcdCAgICAvLyBjaGlsZHJlbiBpcyB0aGUgZGVmYXVsdHMgZm9yIHBhcnNlX25ld2ljaywgYnV0IG1heWJlIHdlIHNob3VsZCBjaGFuZ2UgdGhhdFxuLy8gXHQgICAgLy8gb3IgYXQgbGVhc3Qgbm90IGFzc3VtZSB0aGlzIGlzIGFsd2F5cyB0aGUgY2FzZSBmb3IgdGhlIGRhdGEgcHJvdmlkZWRcbi8vIFx0XHQudmFsdWUoZnVuY3Rpb24oZCkge3JldHVybiBkLmxlbmd0aH0pXG4vLyBcdFx0LmNoaWxkcmVuKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5jaGlsZHJlbn0pO1xuLy8gXHR9XG4vLyBcdG5vZGVzID0gY2x1c3Rlci5ub2RlcyhkYXRhKTtcbi8vIFx0cmV0dXJuIG5vZGVzO1xuLy8gICAgIH07XG5cbiAgICB2YXIgYXBwbHlfdG9fZGF0YSA9IGZ1bmN0aW9uIChkYXRhLCBjYmFrKSB7XG5cdGNiYWsoZGF0YSk7XG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBwbHlfdG9fZGF0YShkYXRhLmNoaWxkcmVuW2ldLCBjYmFrKTtcblx0ICAgIH1cblx0fVxuICAgIH07XG5cbiAgICB2YXIgY3JlYXRlX2lkcyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGkgPSBpdGVyYXRvcigxKTtcblx0Ly8gV2UgY2FuJ3QgdXNlIGFwcGx5IGJlY2F1c2UgYXBwbHkgY3JlYXRlcyBuZXcgdHJlZXMgb24gZXZlcnkgbm9kZVxuXHQvLyBXZSBzaG91bGQgdXNlIHRoZSBkaXJlY3QgZGF0YSBpbnN0ZWFkXG5cdGFwcGx5X3RvX2RhdGEgKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG5cdCAgICBpZiAoZC5faWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGQuX2lkID0gaSgpO1xuXHRcdC8vIFRPRE86IE5vdCBzdXJlIF9pblN1YlRyZWUgaXMgc3RyaWN0bHkgbmVjZXNzYXJ5XG5cdFx0Ly8gZC5faW5TdWJUcmVlID0ge3ByZXY6dHJ1ZSwgY3Vycjp0cnVlfTtcblx0ICAgIH1cblx0fSk7XG4gICAgfTtcblxuICAgIHZhciBsaW5rX3BhcmVudHMgPSBmdW5jdGlvbiAoZGF0YSkge1xuXHRpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm47XG5cdH1cblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cdGZvciAodmFyIGk9MDsgaTxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAvLyBfcGFyZW50P1xuXHQgICAgZGF0YS5jaGlsZHJlbltpXS5fcGFyZW50ID0gZGF0YTtcblx0ICAgIGxpbmtfcGFyZW50cyhkYXRhLmNoaWxkcmVuW2ldKTtcblx0fVxuICAgIH07XG5cbiAgICB2YXIgY29tcHV0ZV9yb290X2Rpc3RzID0gZnVuY3Rpb24gKGRhdGEpIHtcblx0YXBwbHlfdG9fZGF0YSAoZGF0YSwgZnVuY3Rpb24gKGQpIHtcblx0ICAgIHZhciBsO1xuXHQgICAgaWYgKGQuX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZC5fcm9vdF9kaXN0ID0gMDtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIGwgPSAwO1xuXHRcdGlmIChkLmJyYW5jaF9sZW5ndGgpIHtcblx0XHQgICAgbCA9IGQuYnJhbmNoX2xlbmd0aFxuXHRcdH1cblx0XHRkLl9yb290X2Rpc3QgPSBsICsgZC5fcGFyZW50Ll9yb290X2Rpc3Q7XG5cdCAgICB9XG5cdH0pO1xuICAgIH07XG5cbiAgICAvLyBUT0RPOiBkYXRhIGNhbid0IGJlIHJld3JpdHRlbiB1c2VkIHRoZSBhcGkgeWV0LiBXZSBuZWVkIGZpbmFsaXplcnNcbiAgICBub2RlLmRhdGEgPSBmdW5jdGlvbihuZXdfZGF0YSkge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBkYXRhXG5cdH1cblx0ZGF0YSA9IG5ld19kYXRhO1xuXHRjcmVhdGVfaWRzKCk7XG5cdGxpbmtfcGFyZW50cyhkYXRhKTtcblx0Y29tcHV0ZV9yb290X2Rpc3RzKGRhdGEpO1xuXHRyZXR1cm4gbm9kZTtcbiAgICB9O1xuICAgIC8vIFdlIGJpbmQgdGhlIGRhdGEgdGhhdCBoYXMgYmVlbiBwYXNzZWRcbiAgICBub2RlLmRhdGEoZGF0YSk7XG5cbiAgICBhcGkubWV0aG9kICgnZmluZF9hbGwnLCBmdW5jdGlvbiAoY2JhaywgZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0ICAgIGlmIChjYmFrKG4pKSB7XG5cdFx0bm9kZXMucHVzaCAobik7XG5cdCAgICB9XG5cdH0pO1xuXHRyZXR1cm4gbm9kZXM7XG4gICAgfSk7XG4gICAgXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZScsIGZ1bmN0aW9uIChjYmFrLCBkZWVwKSB7XG5cdGlmIChjYmFrKG5vZGUpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXG5cdGlmIChkYXRhLmNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgIGZvciAodmFyIGo9MDsgajxkYXRhLmNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5jaGlsZHJlbltqXSkuZmluZF9ub2RlKGNiYWssIGRlZXApO1xuXHRcdGlmIChmb3VuZCkge1xuXHRcdCAgICByZXR1cm4gZm91bmQ7XG5cdFx0fVxuXHQgICAgfVxuXHR9XG5cblx0aWYgKGRlZXAgJiYgKGRhdGEuX2NoaWxkcmVuICE9PSB1bmRlZmluZWQpKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltpXSkuZmluZF9ub2RlKGNiYWssIGRlZXApXG5cdFx0dmFyIGZvdW5kID0gdG50X25vZGUoZGF0YS5fY2hpbGRyZW5baV0pLmZpbmRfbm9kZShjYmFrLCBkZWVwKTtcblx0XHRpZiAoZm91bmQpIHtcblx0XHQgICAgcmV0dXJuIGZvdW5kO1xuXHRcdH1cblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZpbmRfbm9kZV9ieV9uYW1lJywgZnVuY3Rpb24obmFtZSwgZGVlcCkge1xuXHRyZXR1cm4gbm9kZS5maW5kX25vZGUgKGZ1bmN0aW9uIChub2RlKSB7XG5cdCAgICByZXR1cm4gbm9kZS5ub2RlX25hbWUoKSA9PT0gbmFtZVxuXHR9LCBkZWVwKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd0b2dnbGUnLCBmdW5jdGlvbigpIHtcblx0aWYgKGRhdGEpIHtcblx0ICAgIGlmIChkYXRhLmNoaWxkcmVuKSB7IC8vIFVuY29sbGFwc2VkIC0+IGNvbGxhcHNlXG5cdFx0dmFyIGhpZGRlbiA9IDA7XG5cdFx0bm9kZS5hcHBseSAoZnVuY3Rpb24gKG4pIHtcblx0XHQgICAgdmFyIGhpZGRlbl9oZXJlID0gbi5uX2hpZGRlbigpIHx8IDA7XG5cdFx0ICAgIGhpZGRlbiArPSAobi5uX2hpZGRlbigpIHx8IDApICsgMTtcblx0XHR9KTtcblx0XHRub2RlLm5faGlkZGVuIChoaWRkZW4tMSk7XG5cdFx0ZGF0YS5fY2hpbGRyZW4gPSBkYXRhLmNoaWxkcmVuO1xuXHRcdGRhdGEuY2hpbGRyZW4gPSB1bmRlZmluZWQ7XG5cdCAgICB9IGVsc2UgeyAgICAgICAgICAgICAvLyBDb2xsYXBzZWQgLT4gdW5jb2xsYXBzZVxuXHRcdG5vZGUubl9oaWRkZW4oMCk7XG5cdFx0ZGF0YS5jaGlsZHJlbiA9IGRhdGEuX2NoaWxkcmVuO1xuXHRcdGRhdGEuX2NoaWxkcmVuID0gdW5kZWZpbmVkO1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2lzX2NvbGxhcHNlZCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIChkYXRhLl9jaGlsZHJlbiAhPT0gdW5kZWZpbmVkICYmIGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFzX2FuY2VzdG9yID0gZnVuY3Rpb24obiwgYW5jZXN0b3IpIHtcblx0Ly8gSXQgaXMgYmV0dGVyIHRvIHdvcmsgYXQgdGhlIGRhdGEgbGV2ZWxcblx0biA9IG4uZGF0YSgpO1xuXHRhbmNlc3RvciA9IGFuY2VzdG9yLmRhdGEoKTtcblx0aWYgKG4uX3BhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm4gZmFsc2Vcblx0fVxuXHRuID0gbi5fcGFyZW50XG5cdGZvciAoOzspIHtcblx0ICAgIGlmIChuID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9XG5cdCAgICBpZiAobiA9PT0gYW5jZXN0b3IpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIG4gPSBuLl9wYXJlbnQ7XG5cdH1cbiAgICB9O1xuXG4gICAgLy8gVGhpcyBpcyB0aGUgZWFzaWVzdCB3YXkgdG8gY2FsY3VsYXRlIHRoZSBMQ0EgSSBjYW4gdGhpbmsgb2YuIEJ1dCBpdCBpcyB2ZXJ5IGluZWZmaWNpZW50IHRvby5cbiAgICAvLyBJdCBpcyB3b3JraW5nIGZpbmUgYnkgbm93LCBidXQgaW4gY2FzZSBpdCBuZWVkcyB0byBiZSBtb3JlIHBlcmZvcm1hbnQgd2UgY2FuIGltcGxlbWVudCB0aGUgTENBXG4gICAgLy8gYWxnb3JpdGhtIGV4cGxhaW5lZCBoZXJlOlxuICAgIC8vIGh0dHA6Ly9jb21tdW5pdHkudG9wY29kZXIuY29tL3RjP21vZHVsZT1TdGF0aWMmZDE9dHV0b3JpYWxzJmQyPWxvd2VzdENvbW1vbkFuY2VzdG9yXG4gICAgYXBpLm1ldGhvZCAoJ2xjYScsIGZ1bmN0aW9uIChub2Rlcykge1xuXHRpZiAobm9kZXMubGVuZ3RoID09PSAxKSB7XG5cdCAgICByZXR1cm4gbm9kZXNbMF07XG5cdH1cblx0dmFyIGxjYV9ub2RlID0gbm9kZXNbMF07XG5cdGZvciAodmFyIGkgPSAxOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBsY2Ffbm9kZSA9IF9sY2EobGNhX25vZGUsIG5vZGVzW2ldKTtcblx0fVxuXHRyZXR1cm4gbGNhX25vZGU7XG5cdC8vIHJldHVybiB0bnRfbm9kZShsY2Ffbm9kZSk7XG4gICAgfSk7XG5cbiAgICB2YXIgX2xjYSA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xuXHRpZiAobm9kZTEuZGF0YSgpID09PSBub2RlMi5kYXRhKCkpIHtcblx0ICAgIHJldHVybiBub2RlMTtcblx0fVxuXHRpZiAoaGFzX2FuY2VzdG9yKG5vZGUxLCBub2RlMikpIHtcblx0ICAgIHJldHVybiBub2RlMjtcblx0fVxuXHRyZXR1cm4gX2xjYShub2RlMSwgbm9kZTIucGFyZW50KCkpO1xuICAgIH07XG5cbiAgICBhcGkubWV0aG9kKCduX2hpZGRlbicsIGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gbm9kZS5wcm9wZXJ0eSgnX2hpZGRlbicpO1xuXHR9XG5cdG5vZGUucHJvcGVydHkoJ19oaWRkZW4nLCB2YWwpO1xuXHRyZXR1cm4gbm9kZVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2dldF9hbGxfbm9kZXMnLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgbm9kZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgbm9kZXMucHVzaChuKTtcblx0fSwgZGVlcCk7XG5cdHJldHVybiBub2RlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdnZXRfYWxsX2xlYXZlcycsIGZ1bmN0aW9uIChkZWVwKSB7XG5cdHZhciBsZWF2ZXMgPSBbXTtcblx0bm9kZS5hcHBseShmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKG4uaXNfbGVhZihkZWVwKSkge1xuXHRcdGxlYXZlcy5wdXNoKG4pO1xuXHQgICAgfVxuXHR9LCBkZWVwKTtcblx0cmV0dXJuIGxlYXZlcztcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCd1cHN0cmVhbScsIGZ1bmN0aW9uKGNiYWspIHtcblx0Y2Jhayhub2RlKTtcblx0dmFyIHBhcmVudCA9IG5vZGUucGFyZW50KCk7XG5cdGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgcGFyZW50LnVwc3RyZWFtKGNiYWspO1xuXHR9XG4vL1x0dG50X25vZGUocGFyZW50KS51cHN0cmVhbShjYmFrKTtcbi8vIFx0bm9kZS51cHN0cmVhbShub2RlLl9wYXJlbnQsIGNiYWspO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3N1YnRyZWUnLCBmdW5jdGlvbihub2Rlcywga2VlcF9zaW5nbGV0b25zKSB7XG5cdGlmIChrZWVwX3NpbmdsZXRvbnMgPT09IHVuZGVmaW5lZCkge1xuXHQgICAga2VlcF9zaW5nbGV0b25zID0gZmFsc2U7XG5cdH1cbiAgICBcdHZhciBub2RlX2NvdW50cyA9IHt9O1xuICAgIFx0Zm9yICh2YXIgaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgbiA9IG5vZGVzW2ldO1xuXHQgICAgaWYgKG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdG4udXBzdHJlYW0gKGZ1bmN0aW9uICh0aGlzX25vZGUpe1xuXHRcdCAgICB2YXIgaWQgPSB0aGlzX25vZGUuaWQoKTtcblx0XHQgICAgaWYgKG5vZGVfY291bnRzW2lkXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRub2RlX2NvdW50c1tpZF0gPSAwO1xuXHRcdCAgICB9XG5cdFx0ICAgIG5vZGVfY291bnRzW2lkXSsrXG4gICAgXHRcdH0pO1xuXHQgICAgfVxuICAgIFx0fVxuICAgIFxuXHR2YXIgaXNfc2luZ2xldG9uID0gZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5fY2hpbGRyZW4gPSAwO1xuXHQgICAgaWYgKG5vZGVfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfVxuXHQgICAgZm9yICh2YXIgaT0wOyBpPG5vZGVfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBpZCA9IG5vZGVfZGF0YS5jaGlsZHJlbltpXS5faWQ7XG5cdFx0aWYgKG5vZGVfY291bnRzW2lkXSA+IDApIHtcblx0XHQgICAgbl9jaGlsZHJlbisrO1xuXHRcdH1cblx0ICAgIH1cblx0ICAgIHJldHVybiBuX2NoaWxkcmVuID09PSAxO1xuXHR9O1xuXG5cdHZhciBzdWJ0cmVlID0ge307XG5cdGNvcHlfZGF0YSAoZGF0YSwgc3VidHJlZSwgMCwgZnVuY3Rpb24gKG5vZGVfZGF0YSkge1xuXHQgICAgdmFyIG5vZGVfaWQgPSBub2RlX2RhdGEuX2lkO1xuXHQgICAgdmFyIGNvdW50cyA9IG5vZGVfY291bnRzW25vZGVfaWRdO1xuXHQgICAgXG5cdCAgICAvLyBJcyBpbiBwYXRoXG5cdCAgICBpZiAoY291bnRzID4gMCkge1xuXHRcdGlmIChpc19zaW5nbGV0b24obm9kZV9kYXRhKSAmJiAha2VlcF9zaW5nbGV0b25zKSB7XG5cdFx0ICAgIHJldHVybiBmYWxzZTsgXG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHQgICAgfVxuXHQgICAgLy8gSXMgbm90IGluIHBhdGhcblx0ICAgIHJldHVybiBmYWxzZTtcblx0fSk7XG5cblx0cmV0dXJuIHRudF9ub2RlKHN1YnRyZWUuY2hpbGRyZW5bMF0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGNvcHlfZGF0YSA9IGZ1bmN0aW9uIChvcmlnX2RhdGEsIHN1YnRyZWUsIGN1cnJCcmFuY2hMZW5ndGgsIGNvbmRpdGlvbikge1xuICAgICAgICBpZiAob3JpZ19kYXRhID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25kaXRpb24ob3JpZ19kYXRhKSkge1xuXHQgICAgdmFyIGNvcHkgPSBjb3B5X25vZGUob3JpZ19kYXRhLCBjdXJyQnJhbmNoTGVuZ3RoKTtcblx0ICAgIGlmIChzdWJ0cmVlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzdWJ0cmVlLmNoaWxkcmVuID0gW107XG5cdCAgICB9XG5cdCAgICBzdWJ0cmVlLmNoaWxkcmVuLnB1c2goY29weSk7XG5cdCAgICBpZiAob3JpZ19kYXRhLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9yaWdfZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvcHlfZGF0YSAob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBjb3B5LCAwLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9IGVsc2Uge1xuXHQgICAgaWYgKG9yaWdfZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXHQgICAgY3VyckJyYW5jaExlbmd0aCArPSBvcmlnX2RhdGEuYnJhbmNoX2xlbmd0aCB8fCAwO1xuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmlnX2RhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb3B5X2RhdGEob3JpZ19kYXRhLmNoaWxkcmVuW2ldLCBzdWJ0cmVlLCBjdXJyQnJhbmNoTGVuZ3RoLCBjb25kaXRpb24pO1xuXHQgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBjb3B5X25vZGUgPSBmdW5jdGlvbiAobm9kZV9kYXRhLCBleHRyYUJyYW5jaExlbmd0aCkge1xuXHR2YXIgY29weSA9IHt9O1xuXHQvLyBjb3B5IGFsbCB0aGUgb3duIHByb3BlcnRpZXMgZXhjZXB0cyBsaW5rcyB0byBvdGhlciBub2RlcyBvciBkZXB0aFxuXHRmb3IgKHZhciBwYXJhbSBpbiBub2RlX2RhdGEpIHtcblx0ICAgIGlmICgocGFyYW0gPT09IFwiY2hpbGRyZW5cIikgfHxcblx0XHQocGFyYW0gPT09IFwiX2NoaWxkcmVuXCIpIHx8XG5cdFx0KHBhcmFtID09PSBcIl9wYXJlbnRcIikgfHxcblx0XHQocGFyYW0gPT09IFwiZGVwdGhcIikpIHtcblx0XHRjb250aW51ZTtcblx0ICAgIH1cblx0ICAgIGlmIChub2RlX2RhdGEuaGFzT3duUHJvcGVydHkocGFyYW0pKSB7XG5cdFx0Y29weVtwYXJhbV0gPSBub2RlX2RhdGFbcGFyYW1dO1xuXHQgICAgfVxuXHR9XG5cdGlmICgoY29weS5icmFuY2hfbGVuZ3RoICE9PSB1bmRlZmluZWQpICYmIChleHRyYUJyYW5jaExlbmd0aCAhPT0gdW5kZWZpbmVkKSkge1xuXHQgICAgY29weS5icmFuY2hfbGVuZ3RoICs9IGV4dHJhQnJhbmNoTGVuZ3RoO1xuXHR9XG5cdHJldHVybiBjb3B5O1xuICAgIH07XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCB2aXNpdHMgYWxsIHRoZSBub2Rlc1xuICAgIC8vIGEgbW9yZSBwZXJmb3JtYW50IHZlcnNpb24gc2hvdWxkIHJldHVybiB0cnVlXG4gICAgLy8gdGhlIGZpcnN0IHRpbWUgY2Jhayhub2RlKSBpcyB0cnVlXG4gICAgYXBpLm1ldGhvZCAoJ3ByZXNlbnQnLCBmdW5jdGlvbiAoY2Jhaykge1xuXHQvLyBjYmFrIHNob3VsZCByZXR1cm4gdHJ1ZS9mYWxzZVxuXHR2YXIgaXNfdHJ1ZSA9IGZhbHNlO1xuXHRub2RlLmFwcGx5IChmdW5jdGlvbiAobikge1xuXHQgICAgaWYgKGNiYWsobikgPT09IHRydWUpIHtcblx0XHRpc190cnVlID0gdHJ1ZTtcblx0ICAgIH1cblx0fSk7XG5cdHJldHVybiBpc190cnVlO1xuICAgIH0pO1xuXG4gICAgLy8gY2JhayBpcyBjYWxsZWQgd2l0aCB0d28gbm9kZXNcbiAgICAvLyBhbmQgc2hvdWxkIHJldHVybiBhIG5lZ2F0aXZlIG51bWJlciwgMCBvciBhIHBvc2l0aXZlIG51bWJlclxuICAgIGFwaS5tZXRob2QgKCdzb3J0JywgZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0dmFyIG5ld19jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgbmV3X2NoaWxkcmVuLnB1c2godG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkpO1xuXHR9XG5cblx0bmV3X2NoaWxkcmVuLnNvcnQoY2Jhayk7XG5cblx0ZGF0YS5jaGlsZHJlbiA9IFtdO1xuXHRmb3IgKHZhciBpPTA7IGk8bmV3X2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkYXRhLmNoaWxkcmVuLnB1c2gobmV3X2NoaWxkcmVuW2ldLmRhdGEoKSk7XG5cdH1cblxuXHRmb3IgKHZhciBpPTA7IGk8ZGF0YS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHQgICAgdG50X25vZGUoZGF0YS5jaGlsZHJlbltpXSkuc29ydChjYmFrKTtcblx0fVxuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ2ZsYXR0ZW4nLCBmdW5jdGlvbiAocHJlc2VydmVfaW50ZXJuYWwpIHtcblx0aWYgKG5vZGUuaXNfbGVhZigpKSB7XG5cdCAgICByZXR1cm4gbm9kZTtcblx0fVxuXHR2YXIgZGF0YSA9IG5vZGUuZGF0YSgpO1xuXHR2YXIgbmV3cm9vdCA9IGNvcHlfbm9kZShkYXRhKTtcblx0dmFyIG5vZGVzO1xuXHRpZiAocHJlc2VydmVfaW50ZXJuYWwpIHtcblx0ICAgIG5vZGVzID0gbm9kZS5nZXRfYWxsX25vZGVzKCk7XG5cdCAgICBub2Rlcy5zaGlmdCgpOyAvLyB0aGUgc2VsZiBub2RlIGlzIGFsc28gaW5jbHVkZWRcblx0fSBlbHNlIHtcblx0ICAgIG5vZGVzID0gbm9kZS5nZXRfYWxsX2xlYXZlcygpO1xuXHR9XG5cdG5ld3Jvb3QuY2hpbGRyZW4gPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBkZWxldGUgKG5vZGVzW2ldLmNoaWxkcmVuKTtcblx0ICAgIG5ld3Jvb3QuY2hpbGRyZW4ucHVzaChjb3B5X25vZGUobm9kZXNbaV0uZGF0YSgpKSk7XG5cdH1cblxuXHRyZXR1cm4gdG50X25vZGUobmV3cm9vdCk7XG4gICAgfSk7XG5cbiAgICBcbiAgICAvLyBUT0RPOiBUaGlzIG1ldGhvZCBvbmx5ICdhcHBseSdzIHRvIG5vbiBjb2xsYXBzZWQgbm9kZXMgKGllIC5fY2hpbGRyZW4gaXMgbm90IHZpc2l0ZWQpXG4gICAgLy8gV291bGQgaXQgYmUgYmV0dGVyIHRvIGhhdmUgYW4gZXh0cmEgZmxhZyAodHJ1ZS9mYWxzZSkgdG8gdmlzaXQgYWxzbyBjb2xsYXBzZWQgbm9kZXM/XG4gICAgYXBpLm1ldGhvZCAoJ2FwcGx5JywgZnVuY3Rpb24oY2JhaywgZGVlcCkge1xuXHRpZiAoZGVlcCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICBkZWVwID0gZmFsc2U7XG5cdH1cblx0Y2Jhayhub2RlKTtcblx0aWYgKGRhdGEuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHR2YXIgbiA9IHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pXG5cdFx0bi5hcHBseShjYmFrLCBkZWVwKTtcblx0ICAgIH1cblx0fVxuXG5cdGlmICgoZGF0YS5fY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkgJiYgZGVlcCkge1xuXHQgICAgZm9yICh2YXIgaj0wOyBqPGRhdGEuX2NoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0dmFyIG4gPSB0bnRfbm9kZShkYXRhLl9jaGlsZHJlbltqXSk7XG5cdFx0bi5hcHBseShjYmFrLCBkZWVwKTtcblx0ICAgIH1cblx0fVxuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogTm90IHN1cmUgaWYgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHZpYSBhIGNhbGxiYWNrOlxuICAgIC8vIHJvb3QucHJvcGVydHkgKGZ1bmN0aW9uIChub2RlLCB2YWwpIHtcbiAgICAvLyAgICBub2RlLmRlZXBlci5maWVsZCA9IHZhbFxuICAgIC8vIH0sICduZXdfdmFsdWUnKVxuICAgIGFwaS5tZXRob2QgKCdwcm9wZXJ0eScsIGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG5cdCAgICBpZiAoKHR5cGVvZiBwcm9wKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBwcm9wKGRhdGEpXHRcblx0ICAgIH1cblx0ICAgIHJldHVybiBkYXRhW3Byb3BdXG5cdH1cblx0aWYgKCh0eXBlb2YgcHJvcCkgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgIHByb3AoZGF0YSwgdmFsdWUpOyAgIFxuXHR9XG5cdGRhdGFbcHJvcF0gPSB2YWx1ZTtcblx0cmV0dXJuIG5vZGU7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnaXNfbGVhZicsIGZ1bmN0aW9uKGRlZXApIHtcblx0aWYgKGRlZXApIHtcblx0ICAgIHJldHVybiAoKGRhdGEuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgJiYgKGRhdGEuX2NoaWxkcmVuID09PSB1bmRlZmluZWQpKTtcblx0fVxuXHRyZXR1cm4gZGF0YS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkO1xuICAgIH0pO1xuXG4gICAgLy8gSXQgbG9va3MgbGlrZSB0aGUgY2x1c3RlciBjYW4ndCBiZSB1c2VkIGZvciBhbnl0aGluZyB1c2VmdWwgaGVyZVxuICAgIC8vIEl0IGlzIG5vdyBpbmNsdWRlZCBhcyBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gdGhlIHRudC50cmVlKCkgbWV0aG9kIGNhbGxcbiAgICAvLyBzbyBJJ20gY29tbWVudGluZyB0aGUgZ2V0dGVyXG4gICAgLy8gbm9kZS5jbHVzdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gXHRyZXR1cm4gY2x1c3RlcjtcbiAgICAvLyB9O1xuXG4gICAgLy8gbm9kZS5kZXB0aCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgLy8gICAgIHJldHVybiBub2RlLmRlcHRoO1xuICAgIC8vIH07XG5cbi8vICAgICBub2RlLm5hbWUgPSBmdW5jdGlvbiAobm9kZSkge1xuLy8gICAgICAgICByZXR1cm4gbm9kZS5uYW1lO1xuLy8gICAgIH07XG5cbiAgICBhcGkubWV0aG9kICgnaWQnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfaWQnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdub2RlX25hbWUnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCduYW1lJyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnYnJhbmNoX2xlbmd0aCcsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIG5vZGUucHJvcGVydHkoJ2JyYW5jaF9sZW5ndGgnKTtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdyb290X2Rpc3QnLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBub2RlLnByb3BlcnR5KCdfcm9vdF9kaXN0Jyk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgnY2hpbGRyZW4nLCBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgY2hpbGRyZW4gPSBbXTtcblxuXHRpZiAoZGF0YS5jaGlsZHJlbikge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuY2hpbGRyZW5baV0pKTtcblx0ICAgIH1cblx0fVxuXHRpZiAoKGRhdGEuX2NoaWxkcmVuKSAmJiBkZWVwKSB7XG5cdCAgICBmb3IgKHZhciBqPTA7IGo8ZGF0YS5fY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHRjaGlsZHJlbi5wdXNoKHRudF9ub2RlKGRhdGEuX2NoaWxkcmVuW2pdKSk7XG5cdCAgICB9XG5cdH1cblx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuXHQgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gY2hpbGRyZW47XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kICgncGFyZW50JywgZnVuY3Rpb24gKCkge1xuXHRpZiAoZGF0YS5fcGFyZW50ID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0cmV0dXJuIHRudF9ub2RlKGRhdGEuX3BhcmVudCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbm9kZTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdG50X25vZGU7XG5cbiIsIi8vIGlmICh0eXBlb2YgdG50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4vLyAgICAgbW9kdWxlLmV4cG9ydHMgPSB0bnQgPSB7fVxuLy8gfVxudmFyIHRyZWU7XG5tb2R1bGUuZXhwb3J0cyA9IHRyZWUgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG52YXIgZXZlbnRzeXN0ZW0gPSByZXF1aXJlKFwiYmlvanMtZXZlbnRzXCIpO1xuZXZlbnRzeXN0ZW0ubWl4aW4odHJlZSk7XG4vL3RudC51dGlscyA9IHJlcXVpcmUoXCJ0bnQudXRpbHNcIik7XG4vL3RudC50b29sdGlwID0gcmVxdWlyZShcInRudC50b29sdGlwXCIpO1xuLy90bnQudHJlZSA9IHJlcXVpcmUoXCIuL3NyYy9pbmRleC5qc1wiKTtcblxuIiwidmFyIGFwaWpzID0gcmVxdWlyZSgndG50LmFwaScpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5kaWFnb25hbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZCA9IGZ1bmN0aW9uIChkaWFnb25hbFBhdGgpIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGRpYWdvbmFsUGF0aC5zb3VyY2U7XG4gICAgICAgIHZhciB0YXJnZXQgPSBkaWFnb25hbFBhdGgudGFyZ2V0O1xuICAgICAgICB2YXIgbWlkcG9pbnRYID0gKHNvdXJjZS54ICsgdGFyZ2V0LngpIC8gMjtcbiAgICAgICAgdmFyIG1pZHBvaW50WSA9IChzb3VyY2UueSArIHRhcmdldC55KSAvIDI7XG4gICAgICAgIHZhciBwYXRoRGF0YSA9IFtzb3VyY2UsIHt4OiB0YXJnZXQueCwgeTogc291cmNlLnl9LCB0YXJnZXRdO1xuICAgICAgICBwYXRoRGF0YSA9IHBhdGhEYXRhLm1hcChkLnByb2plY3Rpb24oKSk7XG4gICAgICAgIHJldHVybiBkLnBhdGgoKShwYXRoRGF0YSwgcmFkaWFsX2NhbGMuY2FsbCh0aGlzLHBhdGhEYXRhKSk7XG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAoZClcbiAgICBcdC5nZXRzZXQgKCdwcm9qZWN0aW9uJylcbiAgICBcdC5nZXRzZXQgKCdwYXRoJyk7XG5cbiAgICB2YXIgY29vcmRpbmF0ZVRvQW5nbGUgPSBmdW5jdGlvbiAoY29vcmQsIHJhZGl1cykge1xuICAgICAgXHR2YXIgd2hvbGVBbmdsZSA9IDIgKiBNYXRoLlBJLFxuICAgICAgICBxdWFydGVyQW5nbGUgPSB3aG9sZUFuZ2xlIC8gNDtcblxuICAgICAgXHR2YXIgY29vcmRRdWFkID0gY29vcmRbMF0gPj0gMCA/IChjb29yZFsxXSA+PSAwID8gMSA6IDIpIDogKGNvb3JkWzFdID49IDAgPyA0IDogMyksXG4gICAgICAgIGNvb3JkQmFzZUFuZ2xlID0gTWF0aC5hYnMoTWF0aC5hc2luKGNvb3JkWzFdIC8gcmFkaXVzKSk7XG5cbiAgICAgIFx0Ly8gU2luY2UgdGhpcyBpcyBqdXN0IGJhc2VkIG9uIHRoZSBhbmdsZSBvZiB0aGUgcmlnaHQgdHJpYW5nbGUgZm9ybWVkXG4gICAgICBcdC8vIGJ5IHRoZSBjb29yZGluYXRlIGFuZCB0aGUgb3JpZ2luLCBlYWNoIHF1YWQgd2lsbCBoYXZlIGRpZmZlcmVudFxuICAgICAgXHQvLyBvZmZzZXRzXG4gICAgICBcdHZhciBjb29yZEFuZ2xlO1xuICAgICAgXHRzd2l0Y2ggKGNvb3JkUXVhZCkge1xuICAgICAgXHRjYXNlIDE6XG4gICAgICBcdCAgICBjb29yZEFuZ2xlID0gcXVhcnRlckFuZ2xlIC0gY29vcmRCYXNlQW5nbGU7XG4gICAgICBcdCAgICBicmVhaztcbiAgICAgIFx0Y2FzZSAyOlxuICAgICAgXHQgICAgY29vcmRBbmdsZSA9IHF1YXJ0ZXJBbmdsZSArIGNvb3JkQmFzZUFuZ2xlO1xuICAgICAgXHQgICAgYnJlYWs7XG4gICAgICBcdGNhc2UgMzpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSAyKnF1YXJ0ZXJBbmdsZSArIHF1YXJ0ZXJBbmdsZSAtIGNvb3JkQmFzZUFuZ2xlO1xuICAgICAgXHQgICAgYnJlYWs7XG4gICAgICBcdGNhc2UgNDpcbiAgICAgIFx0ICAgIGNvb3JkQW5nbGUgPSAzKnF1YXJ0ZXJBbmdsZSArIGNvb3JkQmFzZUFuZ2xlO1xuICAgICAgXHR9XG4gICAgICBcdHJldHVybiBjb29yZEFuZ2xlO1xuICAgIH07XG5cbiAgICB2YXIgcmFkaWFsX2NhbGMgPSBmdW5jdGlvbiAocGF0aERhdGEpIHtcbiAgICAgICAgdmFyIHNyYyA9IHBhdGhEYXRhWzBdO1xuICAgICAgICB2YXIgbWlkID0gcGF0aERhdGFbMV07XG4gICAgICAgIHZhciBkc3QgPSBwYXRoRGF0YVsyXTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IE1hdGguc3FydChzcmNbMF0qc3JjWzBdICsgc3JjWzFdKnNyY1sxXSk7XG4gICAgICAgIHZhciBzcmNBbmdsZSA9IGNvb3JkaW5hdGVUb0FuZ2xlKHNyYywgcmFkaXVzKTtcbiAgICAgICAgdmFyIG1pZEFuZ2xlID0gY29vcmRpbmF0ZVRvQW5nbGUobWlkLCByYWRpdXMpO1xuICAgICAgICB2YXIgY2xvY2t3aXNlID0gTWF0aC5hYnMobWlkQW5nbGUgLSBzcmNBbmdsZSkgPiBNYXRoLlBJID8gbWlkQW5nbGUgPD0gc3JjQW5nbGUgOiBtaWRBbmdsZSA+IHNyY0FuZ2xlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmFkaXVzICAgOiByYWRpdXMsXG4gICAgICAgICAgICBjbG9ja3dpc2UgOiBjbG9ja3dpc2VcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGQ7XG59O1xuXG4vLyB2ZXJ0aWNhbCBkaWFnb25hbCBmb3IgcmVjdCBicmFuY2hlc1xudHJlZS5kaWFnb25hbC52ZXJ0aWNhbCA9IGZ1bmN0aW9uICh1c2VBcmMpIHtcbiAgICB2YXIgcGF0aCA9IGZ1bmN0aW9uKHBhdGhEYXRhLCBvYmopIHtcbiAgICAgICAgdmFyIHNyYyA9IHBhdGhEYXRhWzBdO1xuICAgICAgICB2YXIgbWlkID0gcGF0aERhdGFbMV07XG4gICAgICAgIHZhciBkc3QgPSBwYXRoRGF0YVsyXTtcbiAgICAgICAgdmFyIHJhZGl1cyA9IChtaWRbMV0gLSBzcmNbMV0pICogMjAwMDtcblxuICAgICAgICByZXR1cm4gXCJNXCIgKyBzcmMgKyBcIiBBXCIgKyBbcmFkaXVzLHJhZGl1c10gKyBcIiAwIDAsMCBcIiArIG1pZCArIFwiTVwiICsgbWlkICsgXCJMXCIgKyBkc3Q7XG4gICAgICAgIC8vIHJldHVybiBcIk1cIiArIHNyYyArIFwiIExcIiArIG1pZCArIFwiIExcIiArIGRzdDtcbiAgICB9O1xuXG4gICAgdmFyIHByb2plY3Rpb24gPSBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBbZC55LCBkLnhdO1xuICAgIH07XG5cbiAgICByZXR1cm4gdHJlZS5kaWFnb25hbCgpXG4gICAgICBcdC5wYXRoKHBhdGgpXG4gICAgICBcdC5wcm9qZWN0aW9uKHByb2plY3Rpb24pO1xufTtcblxudHJlZS5kaWFnb25hbC5yYWRpYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBhdGggPSBmdW5jdGlvbihwYXRoRGF0YSwgb2JqKSB7XG4gICAgICAgIHZhciBzcmMgPSBwYXRoRGF0YVswXTtcbiAgICAgICAgdmFyIG1pZCA9IHBhdGhEYXRhWzFdO1xuICAgICAgICB2YXIgZHN0ID0gcGF0aERhdGFbMl07XG4gICAgICAgIHZhciByYWRpdXMgPSBvYmoucmFkaXVzO1xuICAgICAgICB2YXIgY2xvY2t3aXNlID0gb2JqLmNsb2Nrd2lzZTtcblxuICAgICAgICBpZiAoY2xvY2t3aXNlKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJNXCIgKyBzcmMgKyBcIiBBXCIgKyBbcmFkaXVzLHJhZGl1c10gKyBcIiAwIDAsMCBcIiArIG1pZCArIFwiTVwiICsgbWlkICsgXCJMXCIgKyBkc3Q7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCJNXCIgKyBtaWQgKyBcIiBBXCIgKyBbcmFkaXVzLHJhZGl1c10gKyBcIiAwIDAsMCBcIiArIHNyYyArIFwiTVwiICsgbWlkICsgXCJMXCIgKyBkc3Q7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHByb2plY3Rpb24gPSBmdW5jdGlvbihkKSB7XG4gICAgICBcdHZhciByID0gZC55LCBhID0gKGQueCAtIDkwKSAvIDE4MCAqIE1hdGguUEk7XG4gICAgICBcdHJldHVybiBbciAqIE1hdGguY29zKGEpLCByICogTWF0aC5zaW4oYSldO1xuICAgIH07XG5cbiAgICByZXR1cm4gdHJlZS5kaWFnb25hbCgpXG4gICAgICBcdC5wYXRoKHBhdGgpXG4gICAgICBcdC5wcm9qZWN0aW9uKHByb2plY3Rpb24pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5kaWFnb25hbDtcbiIsInZhciB0cmVlID0gcmVxdWlyZSAoXCIuL3RyZWUuanNcIik7XG50cmVlLmxhYmVsID0gcmVxdWlyZShcIi4vbGFiZWwuanNcIik7XG50cmVlLmRpYWdvbmFsID0gcmVxdWlyZShcIi4vZGlhZ29uYWwuanNcIik7XG50cmVlLmxheW91dCA9IHJlcXVpcmUoXCIuL2xheW91dC5qc1wiKTtcbnRyZWUubm9kZV9kaXNwbGF5ID0gcmVxdWlyZShcIi4vbm9kZV9kaXNwbGF5LmpzXCIpO1xuLy8gdHJlZS5ub2RlID0gcmVxdWlyZShcInRudC50cmVlLm5vZGVcIik7XG4vLyB0cmVlLnBhcnNlX25ld2ljayA9IHJlcXVpcmUoXCJ0bnQubmV3aWNrXCIpLnBhcnNlX25ld2ljaztcbi8vIHRyZWUucGFyc2Vfbmh4ID0gcmVxdWlyZShcInRudC5uZXdpY2tcIikucGFyc2Vfbmh4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlO1xuXG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciB0cmVlID0ge307XG5cbnRyZWUubGFiZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICB2YXIgZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaCAoXCJjbGlja1wiLCBcImRibGNsaWNrXCIsIFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIilcblxuICAgIC8vIFRPRE86IE5vdCBzdXJlIGlmIHdlIHNob3VsZCBiZSByZW1vdmluZyBieSBkZWZhdWx0IHByZXYgbGFiZWxzXG4gICAgLy8gb3IgaXQgd291bGQgYmUgYmV0dGVyIHRvIGhhdmUgYSBzZXBhcmF0ZSByZW1vdmUgbWV0aG9kIGNhbGxlZCBieSB0aGUgdmlzXG4gICAgLy8gb24gdXBkYXRlXG4gICAgLy8gV2UgYWxzbyBoYXZlIHRoZSBwcm9ibGVtIHRoYXQgd2UgbWF5IGJlIHRyYW5zaXRpb25pbmcgZnJvbVxuICAgIC8vIHRleHQgdG8gaW1nIGxhYmVscyBhbmQgd2UgbmVlZCB0byByZW1vdmUgdGhlIGxhYmVsIG9mIGEgZGlmZmVyZW50IHR5cGVcbiAgICB2YXIgbGFiZWwgPSBmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUsIG5vZGVfc2l6ZSkge1xuICAgICAgICBpZiAodHlwZW9mIChub2RlKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cobm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICBsYWJlbC5kaXNwbGF5KCkuY2FsbCh0aGlzLCBub2RlLCBsYXlvdXRfdHlwZSlcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfdHJlZV9sYWJlbFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdCA9IGxhYmVsLnRyYW5zZm9ybSgpKG5vZGUsIGxheW91dF90eXBlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2xhdGUgKFwiICsgKHQudHJhbnNsYXRlWzBdICsgbm9kZV9zaXplKSArIFwiIFwiICsgdC50cmFuc2xhdGVbMV0gKyBcIilyb3RhdGUoXCIgKyB0LnJvdGF0ZSArIFwiKVwiO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgLy8gVE9ETzogdGhpcyBjbGljayBldmVudCBpcyBwcm9iYWJseSBuZXZlciBmaXJlZCBzaW5jZSB0aGVyZSBpcyBhbiBvbmNsaWNrIGV2ZW50IGluIHRoZSBub2RlIGcgZWxlbWVudD9cbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaC5jbGljay5jYWxsKHRoaXMsIG5vZGUpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKFwiZGJsY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoLmRibGNsaWNrLmNhbGwodGhpcywgbm9kZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHRoaXMsIG5vZGUpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwodGhpcywgbm9kZSlcbiAgICAgICAgICAgIH0pXG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG4gICAgICAgIC5nZXRzZXQgKCd3aWR0aCcsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgd2lkdGggY2FsbGJhY2tcIiB9KVxuICAgICAgICAuZ2V0c2V0ICgnaGVpZ2h0JywgZnVuY3Rpb24gKCkgeyB0aHJvdyBcIk5lZWQgYSBoZWlnaHQgY2FsbGJhY2tcIiB9KVxuICAgICAgICAuZ2V0c2V0ICgnZGlzcGxheScsIGZ1bmN0aW9uICgpIHsgdGhyb3cgXCJOZWVkIGEgZGlzcGxheSBjYWxsYmFja1wiIH0pXG4gICAgICAgIC5nZXRzZXQgKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbiAoKSB7IHRocm93IFwiTmVlZCBhIHRyYW5zZm9ybSBjYWxsYmFja1wiIH0pXG4gICAgICAgIC8vLmdldHNldCAoJ29uX2NsaWNrJyk7XG5cbiAgICByZXR1cm4gZDMucmViaW5kIChsYWJlbCwgZGlzcGF0Y2gsIFwib25cIik7XG59O1xuXG4vLyBUZXh0IGJhc2VkIGxhYmVsc1xudHJlZS5sYWJlbC50ZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYWJlbCA9IHRyZWUubGFiZWwoKTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGFiZWwpXG4gICAgICAgIC5nZXRzZXQgKCdmb250c2l6ZScsIDEwKVxuICAgICAgICAuZ2V0c2V0ICgnZm9udHdlaWdodCcsIFwibm9ybWFsXCIpXG4gICAgICAgIC5nZXRzZXQgKCdjb2xvcicsIFwiIzAwMFwiKVxuICAgICAgICAuZ2V0c2V0ICgndGV4dCcsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZC5kYXRhKCkubmFtZTtcbiAgICAgICAgfSlcblxuICAgIGxhYmVsLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuICAgICAgICB2YXIgbCA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICBpZiAobGF5b3V0X3R5cGUgPT09IFwicmFkaWFsXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChkLnglMzYwIDwgMTgwKSA/IFwic3RhcnRcIiA6IFwiZW5kXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBcInN0YXJ0XCI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGFiZWwudGV4dCgpKG5vZGUpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0eWxlKCdmb250LXNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3IobGFiZWwuZm9udHNpemUoKSkobm9kZSkgKyBcInB4XCI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0eWxlKCdmb250LXdlaWdodCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihsYWJlbC5mb250d2VpZ2h0KCkpKG5vZGUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIGQzLmZ1bmN0b3IobGFiZWwuY29sb3IoKSkobm9kZSkpO1xuXG4gICAgICAgIHJldHVybiBsO1xuICAgIH0pO1xuXG4gICAgbGFiZWwudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcbiAgICAgICAgdmFyIGQgPSBub2RlLmRhdGEoKTtcbiAgICAgICAgdmFyIHQgPSB7XG4gICAgICAgICAgICB0cmFuc2xhdGUgOiBbNSwgNV0sXG4gICAgICAgICAgICByb3RhdGUgOiAwXG4gICAgICAgIH07XG4gICAgICAgIGlmIChsYXlvdXRfdHlwZSA9PT0gXCJyYWRpYWxcIikge1xuICAgICAgICAgICAgdC50cmFuc2xhdGVbMV0gPSB0LnRyYW5zbGF0ZVsxXSAtIChkLnglMzYwIDwgMTgwID8gMCA6IGxhYmVsLmZvbnRzaXplKCkpXG4gICAgICAgICAgICB0LnJvdGF0ZSA9IChkLnglMzYwIDwgMTgwID8gMCA6IDE4MClcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9KTtcblxuXG4gICAgLy8gbGFiZWwudHJhbnNmb3JtIChmdW5jdGlvbiAobm9kZSkge1xuICAgIC8vIFx0dmFyIGQgPSBub2RlLmRhdGEoKTtcbiAgICAvLyBcdHJldHVybiBcInRyYW5zbGF0ZSgxMCA1KXJvdGF0ZShcIiArIChkLnglMzYwIDwgMTgwID8gMCA6IDE4MCkgKyBcIilcIjtcbiAgICAvLyB9KTtcblxuICAgIGxhYmVsLndpZHRoIChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB2YXIgc3ZnID0gZDMuc2VsZWN0KFwiYm9keVwiKVxuICAgICAgICAgICAgLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgMClcbiAgICAgICAgICAgIC5zdHlsZSgndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcblxuICAgICAgICB2YXIgdGV4dCA9IHN2Z1xuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgIC5zdHlsZSgnZm9udC1zaXplJywgZDMuZnVuY3RvcihsYWJlbC5mb250c2l6ZSgpKShub2RlKSArIFwicHhcIilcbiAgICAgICAgICAgIC50ZXh0KGxhYmVsLnRleHQoKShub2RlKSk7XG5cbiAgICAgICAgdmFyIHdpZHRoID0gdGV4dC5ub2RlKCkuZ2V0QkJveCgpLndpZHRoO1xuICAgICAgICBzdmcucmVtb3ZlKCk7XG5cbiAgICAgICAgcmV0dXJuIHdpZHRoO1xuICAgIH0pO1xuXG4gICAgbGFiZWwuaGVpZ2h0IChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihsYWJlbC5mb250c2l6ZSgpKShub2RlKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYWJlbDtcbn07XG5cblxuLy8gc3ZnIGJhc2VkIGxhYmVsc1xudHJlZS5sYWJlbC5zdmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhYmVsID0gdHJlZS5sYWJlbCgpO1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcbiAgICAgICAgLmdldHNldChcImVsZW1lbnRcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkLmRhdGEoKS5lbGVtZW50O1xuICAgICAgICB9KTtcbiAgICBsYWJlbC5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSwgbGF5b3V0X3R5cGUpIHtcbiAgICAgICAgdmFyIG4gPSBsYWJlbC5lbGVtZW50KCkobm9kZSk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQobi5ub2RlKCkpO1xuICAgICAgICByZXR1cm4gbjtcbiAgICB9KTtcbiAgICBsYWJlbC50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuICAgICAgICB2YXIgZCA9IG5vZGUuZGF0YSgpO1xuICAgICAgICB2YXIgdCA9IHtcbiAgICAgICAgICAgIHRyYW5zbGF0ZSA6IFsxMCwgKC1sYWJlbC5oZWlnaHQoKSgpIC8gMildLFxuICAgICAgICAgICAgcm90YXRlIDogMFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChsYXlvdXRfdHlwZSA9PT0gJ3JhZGlhbCcpIHtcbiAgICAgICAgICAgIHQudHJhbnNsYXRlWzBdID0gdC50cmFuc2xhdGVbMF0gKyAoZC54JTM2MCA8IDE4MCA/IDAgOiBsYWJlbC53aWR0aCgpKCkpLFxuICAgICAgICAgICAgdC50cmFuc2xhdGVbMV0gPSB0LnRyYW5zbGF0ZVsxXSArIChkLnglMzYwIDwgMTgwID8gMCA6IGxhYmVsLmhlaWdodCgpKCkpLFxuICAgICAgICAgICAgdC5yb3RhdGUgPSAoZC54JTM2MCA8IDE4MCA/IDAgOiAxODApXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYWJlbDtcbn07XG5cbi8vIEltYWdlIGJhc2VkIGxhYmVsc1xudHJlZS5sYWJlbC5pbWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhYmVsID0gdHJlZS5sYWJlbCgpO1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcbiAgICAgICAgLmdldHNldCAoJ3NyYycsIGZ1bmN0aW9uICgpIHt9KVxuXG4gICAgbGFiZWwuZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG4gICAgICAgIGlmIChsYWJlbC5zcmMoKShub2RlKSkge1xuICAgICAgICAgICAgdmFyIGwgPSBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwiaW1hZ2VcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIGxhYmVsLndpZHRoKCkoKSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBsYWJlbC5oZWlnaHQoKSgpKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieGxpbms6aHJlZlwiLCBsYWJlbC5zcmMoKShub2RlKSk7XG4gICAgICAgICAgICByZXR1cm4gbDtcbiAgICAgICAgfVxuICAgICAgICAvLyBmYWxsYmFjayB0ZXh0IGluIGNhc2UgdGhlIGltZyBpcyBub3QgZm91bmQ/XG4gICAgICAgIHJldHVybiBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAudGV4dChcIlwiKTtcbiAgICB9KTtcblxuICAgIGxhYmVsLnRyYW5zZm9ybSAoZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlKSB7XG4gICAgICAgIHZhciBkID0gbm9kZS5kYXRhKCk7XG4gICAgICAgIHZhciB0ID0ge1xuICAgICAgICAgICAgdHJhbnNsYXRlIDogWzEwLCAoLWxhYmVsLmhlaWdodCgpKCkgLyAyKV0sXG4gICAgICAgICAgICByb3RhdGUgOiAwXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGxheW91dF90eXBlID09PSAncmFkaWFsJykge1xuICAgICAgICAgICAgdC50cmFuc2xhdGVbMF0gPSB0LnRyYW5zbGF0ZVswXSArIChkLnglMzYwIDwgMTgwID8gMCA6IGxhYmVsLndpZHRoKCkoKSksXG4gICAgICAgICAgICB0LnRyYW5zbGF0ZVsxXSA9IHQudHJhbnNsYXRlWzFdICsgKGQueCUzNjAgPCAxODAgPyAwIDogbGFiZWwuaGVpZ2h0KCkoKSksXG4gICAgICAgICAgICB0LnJvdGF0ZSA9IChkLnglMzYwIDwgMTgwID8gMCA6IDE4MClcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxhYmVsO1xufTtcblxuLy8gTGFiZWxzIG1hZGUgb2YgMisgc2ltcGxlIGxhYmVsc1xudHJlZS5sYWJlbC5jb21wb3NpdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhYmVscyA9IFtdO1xuXG4gICAgdmFyIGxhYmVsID0gZnVuY3Rpb24gKG5vZGUsIGxheW91dF90eXBlLCBub2RlX3NpemUpIHtcbiAgICAgICAgdmFyIGN1cnJfeG9mZnNldCA9IDA7XG5cbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPGxhYmVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGRpc3BsYXkgPSBsYWJlbHNbaV07XG5cbiAgICAgICAgICAgIChmdW5jdGlvbiAob2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheS50cmFuc2Zvcm0gKGZ1bmN0aW9uIChub2RlLCBsYXlvdXRfdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdHN1cGVyID0gZGlzcGxheS5fc3VwZXJfLnRyYW5zZm9ybSgpKG5vZGUsIGxheW91dF90eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHQgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2xhdGUgOiBbb2Zmc2V0ICsgdHN1cGVyLnRyYW5zbGF0ZVswXSwgdHN1cGVyLnRyYW5zbGF0ZVsxXV0sXG4gICAgICAgICAgICAgICAgICAgICAgICByb3RhdGUgOiB0c3VwZXIucm90YXRlXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0O1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KShjdXJyX3hvZmZzZXQpO1xuXG4gICAgICAgICAgICBjdXJyX3hvZmZzZXQgKz0gMTA7XG4gICAgICAgICAgICBjdXJyX3hvZmZzZXQgKz0gZGlzcGxheS53aWR0aCgpKG5vZGUpO1xuXG4gICAgICAgICAgICBkaXNwbGF5LmNhbGwodGhpcywgbm9kZSwgbGF5b3V0X3R5cGUsIG5vZGVfc2l6ZSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsYWJlbClcblxuICAgIGFwaS5tZXRob2QgKCdhZGRfbGFiZWwnLCBmdW5jdGlvbiAoZGlzcGxheSwgbm9kZSkge1xuICAgICAgICBkaXNwbGF5Ll9zdXBlcl8gPSB7fTtcbiAgICAgICAgYXBpanMgKGRpc3BsYXkuX3N1cGVyXylcbiAgICAgICAgICAgIC5nZXQgKCd0cmFuc2Zvcm0nLCBkaXNwbGF5LnRyYW5zZm9ybSgpKTtcblxuICAgICAgICBsYWJlbHMucHVzaChkaXNwbGF5KTtcbiAgICAgICAgcmV0dXJuIGxhYmVsO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCAoJ3dpZHRoJywgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciB0b3Rfd2lkdGggPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGxhYmVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRvdF93aWR0aCArPSBwYXJzZUludChsYWJlbHNbaV0ud2lkdGgoKShub2RlKSk7XG4gICAgICAgICAgICAgICAgdG90X3dpZHRoICs9IHBhcnNlSW50KGxhYmVsc1tpXS5fc3VwZXJfLnRyYW5zZm9ybSgpKG5vZGUpLnRyYW5zbGF0ZVswXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0b3Rfd2lkdGg7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIG1heF9oZWlnaHQgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGxhYmVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjdXJyX2hlaWdodCA9IGxhYmVsc1tpXS5oZWlnaHQoKShub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAoIGN1cnJfaGVpZ2h0ID4gbWF4X2hlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICBtYXhfaGVpZ2h0ID0gY3Vycl9oZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1heF9oZWlnaHQ7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBsYWJlbDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHRyZWUubGFiZWw7XG4iLCIvLyBCYXNlZCBvbiB0aGUgY29kZSBieSBLZW4taWNoaSBVZWRhIGluIGh0dHA6Ly9ibC5vY2tzLm9yZy9rdWVkYS8xMDM2Nzc2I2QzLnBoeWxvZ3JhbS5qc1xuXG52YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciBkaWFnb25hbCA9IHJlcXVpcmUoXCIuL2RpYWdvbmFsLmpzXCIpO1xudmFyIHRyZWUgPSB7fTtcblxudHJlZS5sYXlvdXQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgdmFyIGNsdXN0ZXIgPSBkMy5sYXlvdXQuY2x1c3RlcigpXG4gICAgXHQuc29ydChudWxsKVxuICAgIFx0LnZhbHVlKGZ1bmN0aW9uIChkKSB7cmV0dXJuIGQubGVuZ3RoO30gKVxuICAgIFx0LnNlcGFyYXRpb24oZnVuY3Rpb24gKCkge3JldHVybiAxO30pO1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzIChsKVxuICAgIFx0LmdldHNldCAoJ3NjYWxlJywgdHJ1ZSlcbiAgICBcdC5nZXRzZXQgKCdtYXhfbGVhZl9sYWJlbF93aWR0aCcsIDApXG4gICAgXHQubWV0aG9kIChcImNsdXN0ZXJcIiwgY2x1c3RlcilcbiAgICBcdC5tZXRob2QoJ3lzY2FsZScsIGZ1bmN0aW9uICgpIHt0aHJvdyBcInlzY2FsZSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIjt9KVxuICAgIFx0Lm1ldGhvZCgnYWRqdXN0X2NsdXN0ZXJfc2l6ZScsIGZ1bmN0aW9uICgpIHt0aHJvdyBcImFkanVzdF9jbHVzdGVyX3NpemUgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCI7IH0pXG4gICAgXHQubWV0aG9kKCd3aWR0aCcsIGZ1bmN0aW9uICgpIHt0aHJvdyBcIndpZHRoIGlzIG5vdCBkZWZpbmVkIGluIHRoZSBiYXNlIG9iamVjdFwiO30pXG4gICAgXHQubWV0aG9kKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7dGhyb3cgXCJoZWlnaHQgaXMgbm90IGRlZmluZWQgaW4gdGhlIGJhc2Ugb2JqZWN0XCI7fSk7XG5cbiAgICBhcGkubWV0aG9kKCdzY2FsZV9icmFuY2hfbGVuZ3RocycsIGZ1bmN0aW9uIChjdXJyKSB7XG4gICAgXHRpZiAobC5zY2FsZSgpID09PSBmYWxzZSkge1xuICAgIFx0ICAgIHJldHVybjtcbiAgICBcdH1cblxuICAgIFx0dmFyIG5vZGVzID0gY3Vyci5ub2RlcztcbiAgICBcdHZhciB0cmVlID0gY3Vyci50cmVlO1xuXG4gICAgXHR2YXIgcm9vdF9kaXN0cyA9IG5vZGVzLm1hcCAoZnVuY3Rpb24gKGQpIHtcbiAgICBcdCAgICByZXR1cm4gZC5fcm9vdF9kaXN0O1xuICAgIFx0fSk7XG5cbiAgICBcdHZhciB5c2NhbGUgPSBsLnlzY2FsZShyb290X2Rpc3RzKTtcbiAgICBcdHRyZWUuYXBwbHkgKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgXHQgICAgbm9kZS5wcm9wZXJ0eShcInlcIiwgeXNjYWxlKG5vZGUucm9vdF9kaXN0KCkpKTtcbiAgICBcdH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGw7XG59O1xuXG50cmVlLmxheW91dC52ZXJ0aWNhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGF5b3V0ID0gdHJlZS5sYXlvdXQoKTtcbiAgICAvLyBFbGVtZW50cyBsaWtlICdsYWJlbHMnIGRlcGVuZCBvbiB0aGUgbGF5b3V0IHR5cGUuIFRoaXMgZXhwb3NlcyBhIHdheSBvZiBpZGVudGlmeWluZyB0aGUgbGF5b3V0IHR5cGVcbiAgICBsYXlvdXQudHlwZSA9IFwidmVydGljYWxcIjtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGF5b3V0KVxuICAgIFx0LmdldHNldCAoJ3dpZHRoJywgMzYwKVxuICAgIFx0LmdldCAoJ3RyYW5zbGF0ZV92aXMnLCBbMjAsMjBdKVxuICAgIFx0Lm1ldGhvZCAoJ2RpYWdvbmFsJywgZGlhZ29uYWwudmVydGljYWwpXG4gICAgXHQubWV0aG9kICgndHJhbnNmb3JtX25vZGUnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBcdCAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnkgKyBcIixcIiArIGQueCArIFwiKVwiO1xuICAgIFx0fSk7XG5cbiAgICBhcGkubWV0aG9kKCdoZWlnaHQnLCBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgXHRyZXR1cm4gKHBhcmFtcy5uX2xlYXZlcyAqIHBhcmFtcy5sYWJlbF9oZWlnaHQpO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCgneXNjYWxlJywgZnVuY3Rpb24gKGRpc3RzKSB7XG4gICAgXHRyZXR1cm4gZDMuc2NhbGUubGluZWFyKClcbiAgICBcdCAgICAuZG9tYWluKFswLCBkMy5tYXgoZGlzdHMpXSlcbiAgICBcdCAgICAucmFuZ2UoWzAsIGxheW91dC53aWR0aCgpIC0gMjAgLSBsYXlvdXQubWF4X2xlYWZfbGFiZWxfd2lkdGgoKV0pO1xuICAgIH0pO1xuXG4gICAgYXBpLm1ldGhvZCgnYWRqdXN0X2NsdXN0ZXJfc2l6ZScsIGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICBcdHZhciBoID0gbGF5b3V0LmhlaWdodChwYXJhbXMpO1xuICAgIFx0dmFyIHcgPSBsYXlvdXQud2lkdGgoKSAtIGxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aCgpIC0gbGF5b3V0LnRyYW5zbGF0ZV92aXMoKVswXSAtIHBhcmFtcy5sYWJlbF9wYWRkaW5nO1xuICAgIFx0bGF5b3V0LmNsdXN0ZXIuc2l6ZSAoW2gsd10pO1xuICAgIFx0cmV0dXJuIGxheW91dDtcbiAgICB9KTtcblxuICAgIHJldHVybiBsYXlvdXQ7XG59O1xuXG50cmVlLmxheW91dC5yYWRpYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxheW91dCA9IHRyZWUubGF5b3V0KCk7XG4gICAgLy8gRWxlbWVudHMgbGlrZSAnbGFiZWxzJyBkZXBlbmQgb24gdGhlIGxheW91dCB0eXBlLiBUaGlzIGV4cG9zZXMgYSB3YXkgb2YgaWRlbnRpZnlpbmcgdGhlIGxheW91dCB0eXBlXG4gICAgbGF5b3V0LnR5cGUgPSAncmFkaWFsJztcblxuICAgIHZhciBkZWZhdWx0X3dpZHRoID0gMzYwO1xuICAgIHZhciByID0gZGVmYXVsdF93aWR0aCAvIDI7XG5cbiAgICB2YXIgY29uZiA9IHtcbiAgICBcdHdpZHRoIDogMzYwXG4gICAgfTtcblxuICAgIHZhciBhcGkgPSBhcGlqcyAobGF5b3V0KVxuICAgIFx0LmdldHNldCAoY29uZilcbiAgICBcdC5nZXRzZXQgKCd0cmFuc2xhdGVfdmlzJywgW3IsIHJdKSAvLyBUT0RPOiAxLjMgc2hvdWxkIGJlIHJlcGxhY2VkIGJ5IGEgc2Vuc2libGUgdmFsdWVcbiAgICBcdC5tZXRob2QgKCd0cmFuc2Zvcm1fbm9kZScsIGZ1bmN0aW9uIChkKSB7XG4gICAgXHQgICAgcmV0dXJuIFwicm90YXRlKFwiICsgKGQueCAtIDkwKSArIFwiKXRyYW5zbGF0ZShcIiArIGQueSArIFwiKVwiO1xuICAgIFx0fSlcbiAgICBcdC5tZXRob2QgKCdkaWFnb25hbCcsIGRpYWdvbmFsLnJhZGlhbClcbiAgICBcdC5tZXRob2QgKCdoZWlnaHQnLCBmdW5jdGlvbiAoKSB7IHJldHVybiBjb25mLndpZHRoOyB9KTtcblxuICAgIC8vIENoYW5nZXMgaW4gd2lkdGggYWZmZWN0IGNoYW5nZXMgaW4gclxuICAgIGxheW91dC53aWR0aC50cmFuc2Zvcm0gKGZ1bmN0aW9uICh2YWwpIHtcbiAgICBcdHIgPSB2YWwgLyAyO1xuICAgIFx0bGF5b3V0LmNsdXN0ZXIuc2l6ZShbMzYwLCByXSk7XG4gICAgXHRsYXlvdXQudHJhbnNsYXRlX3Zpcyhbciwgcl0pO1xuICAgIFx0cmV0dXJuIHZhbDtcbiAgICB9KTtcblxuICAgIGFwaS5tZXRob2QgKFwieXNjYWxlXCIsICBmdW5jdGlvbiAoZGlzdHMpIHtcblx0cmV0dXJuIGQzLnNjYWxlLmxpbmVhcigpXG5cdCAgICAuZG9tYWluKFswLGQzLm1heChkaXN0cyldKVxuXHQgICAgLnJhbmdlKFswLCByXSk7XG4gICAgfSk7XG5cbiAgICBhcGkubWV0aG9kIChcImFkanVzdF9jbHVzdGVyX3NpemVcIiwgZnVuY3Rpb24gKHBhcmFtcykge1xuICAgIFx0ciA9IChsYXlvdXQud2lkdGgoKS8yKSAtIGxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aCgpIC0gMjA7XG4gICAgXHRsYXlvdXQuY2x1c3Rlci5zaXplKFszNjAsIHJdKTtcbiAgICBcdHJldHVybiBsYXlvdXQ7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGF5b3V0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5sYXlvdXQ7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciB0cmVlID0ge307XG5cbnRyZWUubm9kZV9kaXNwbGF5ID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIG4gPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICB2YXIgcHJveHk7XG4gICAgICAgIHZhciB0aGlzUHJveHkgPSBkMy5zZWxlY3QodGhpcykuc2VsZWN0KFwiLnRudF90cmVlX25vZGVfcHJveHlcIik7XG4gICAgICAgIGlmICh0aGlzUHJveHlbMF1bMF0gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHByb3h5ID0gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfbm9kZV9wcm94eVwiKTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJveHkgPSB0aGlzUHJveHk7XG4gICAgICAgIH1cblxuICAgIFx0bi5kaXNwbGF5KCkuY2FsbCh0aGlzLCBub2RlKTtcbiAgICAgICAgdmFyIHNpemUgPSBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcbiAgICAgICAgcHJveHlcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCAoLXNpemUpKVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsICgtc2l6ZSkpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIChzaXplICogMikpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCAoc2l6ZSAqIDIpKVxuICAgIH07XG5cbiAgICB2YXIgYXBpID0gYXBpanMgKG4pXG4gICAgXHQuZ2V0c2V0KFwic2l6ZVwiLCA0LjQpXG4gICAgXHQuZ2V0c2V0KFwiZmlsbFwiLCBcImJsYWNrXCIpXG4gICAgXHQuZ2V0c2V0KFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcbiAgICBcdC5nZXRzZXQoXCJzdHJva2Vfd2lkdGhcIiwgXCIxcHhcIilcbiAgICBcdC5nZXRzZXQoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRocm93IFwiZGlzcGxheSBpcyBub3QgZGVmaW5lZCBpbiB0aGUgYmFzZSBvYmplY3RcIjtcbiAgICAgICAgfSk7XG4gICAgYXBpLm1ldGhvZChcInJlc2V0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgICAuc2VsZWN0QWxsKFwiKjpub3QoLnRudF90cmVlX25vZGVfcHJveHkpXCIpXG4gICAgICAgICAgICAucmVtb3ZlKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbjtcbn07XG5cbnRyZWUubm9kZV9kaXNwbGF5LmNpcmNsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbiA9IHRyZWUubm9kZV9kaXNwbGF5KCk7XG5cbiAgICBuLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgXHRkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfbm9kZV9kaXNwbGF5X2VsZW1cIik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbjtcbn07XG5cbnRyZWUubm9kZV9kaXNwbGF5LnNxdWFyZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbiA9IHRyZWUubm9kZV9kaXNwbGF5KCk7XG5cbiAgICBuLmRpc3BsYXkgKGZ1bmN0aW9uIChub2RlKSB7XG5cdHZhciBzID0gZDMuZnVuY3RvcihuLnNpemUoKSkobm9kZSk7XG5cdGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiAtcztcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gLXM7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBzKjI7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gcyoyO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKG4uZmlsbCgpKShub2RlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlKCkpKG5vZGUpO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQzLmZ1bmN0b3Iobi5zdHJva2Vfd2lkdGgoKSkobm9kZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfbm9kZV9kaXNwbGF5X2VsZW1cIik7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbjtcbn07XG5cbnRyZWUubm9kZV9kaXNwbGF5LnRyaWFuZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcblxuICAgIG4uZGlzcGxheSAoZnVuY3Rpb24gKG5vZGUpIHtcblx0dmFyIHMgPSBkMy5mdW5jdG9yKG4uc2l6ZSgpKShub2RlKTtcblx0ZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgIC5hcHBlbmQoXCJwb2x5Z29uXCIpXG4gICAgICAgIC5hdHRyKFwicG9pbnRzXCIsICgtcykgKyBcIiwwIFwiICsgcyArIFwiLFwiICsgKC1zKSArIFwiIFwiICsgcyArIFwiLFwiICsgcylcbiAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihuLmZpbGwoKSkobm9kZSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gZDMuZnVuY3RvcihuLnN0cm9rZSgpKShub2RlKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkMy5mdW5jdG9yKG4uc3Ryb2tlX3dpZHRoKCkpKG5vZGUpO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X25vZGVfZGlzcGxheV9lbGVtXCIpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG47XG59O1xuXG4vLyB0cmVlLm5vZGVfZGlzcGxheS5jb25kID0gZnVuY3Rpb24gKCkge1xuLy8gICAgIHZhciBuID0gdHJlZS5ub2RlX2Rpc3BsYXkoKTtcbi8vXG4vLyAgICAgLy8gY29uZGl0aW9ucyBhcmUgb2JqZWN0cyB3aXRoXG4vLyAgICAgLy8gbmFtZSA6IGEgbmFtZSBmb3IgdGhpcyBkaXNwbGF5XG4vLyAgICAgLy8gY2FsbGJhY2s6IHRoZSBjb25kaXRpb24gdG8gYXBwbHkgKHJlY2VpdmVzIGEgdG50Lm5vZGUpXG4vLyAgICAgLy8gZGlzcGxheTogYSBub2RlX2Rpc3BsYXlcbi8vICAgICB2YXIgY29uZHMgPSBbXTtcbi8vXG4vLyAgICAgbi5kaXNwbGF5IChmdW5jdGlvbiAobm9kZSkge1xuLy8gICAgICAgICB2YXIgcyA9IGQzLmZ1bmN0b3Iobi5zaXplKCkpKG5vZGUpO1xuLy8gICAgICAgICBmb3IgKHZhciBpPTA7IGk8Y29uZHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgICAgICAgIHZhciBjb25kID0gY29uZHNbaV07XG4vLyAgICAgICAgICAgICAvLyBGb3IgZWFjaCBub2RlLCB0aGUgZmlyc3QgY29uZGl0aW9uIG1ldCBpcyB1c2VkXG4vLyAgICAgICAgICAgICBpZiAoZDMuZnVuY3Rvcihjb25kLmNhbGxiYWNrKS5jYWxsKHRoaXMsIG5vZGUpID09PSB0cnVlKSB7XG4vLyAgICAgICAgICAgICAgICAgY29uZC5kaXNwbGF5LmNhbGwodGhpcywgbm9kZSk7XG4vLyAgICAgICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH1cbi8vICAgICB9KTtcbi8vXG4vLyAgICAgdmFyIGFwaSA9IGFwaWpzKG4pO1xuLy9cbi8vICAgICBhcGkubWV0aG9kKFwiYWRkXCIsIGZ1bmN0aW9uIChuYW1lLCBjYmFrLCBub2RlX2Rpc3BsYXkpIHtcbi8vICAgICAgICAgY29uZHMucHVzaCh7IG5hbWUgOiBuYW1lLFxuLy8gICAgICAgICAgICAgY2FsbGJhY2sgOiBjYmFrLFxuLy8gICAgICAgICAgICAgZGlzcGxheSA6IG5vZGVfZGlzcGxheVxuLy8gICAgICAgICB9KTtcbi8vICAgICAgICAgcmV0dXJuIG47XG4vLyAgICAgfSk7XG4vL1xuLy8gICAgIGFwaS5tZXRob2QoXCJyZXNldFwiLCBmdW5jdGlvbiAoKSB7XG4vLyAgICAgICAgIGNvbmRzID0gW107XG4vLyAgICAgICAgIHJldHVybiBuO1xuLy8gICAgIH0pO1xuLy9cbi8vICAgICBhcGkubWV0aG9kKFwidXBkYXRlXCIsIGZ1bmN0aW9uIChuYW1lLCBjYmFrLCBuZXdfZGlzcGxheSkge1xuLy8gICAgICAgICBmb3IgKHZhciBpPTA7IGk8Y29uZHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgICAgICAgIGlmIChjb25kc1tpXS5uYW1lID09PSBuYW1lKSB7XG4vLyAgICAgICAgICAgICAgICAgY29uZHNbaV0uY2FsbGJhY2sgPSBjYmFrO1xuLy8gICAgICAgICAgICAgICAgIGNvbmRzW2ldLmRpc3BsYXkgPSBuZXdfZGlzcGxheTtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfVxuLy8gICAgICAgICByZXR1cm4gbjtcbi8vICAgICB9KTtcbi8vXG4vLyAgICAgcmV0dXJuIG47XG4vL1xuLy8gfTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gdHJlZS5ub2RlX2Rpc3BsYXk7XG4iLCJ2YXIgYXBpanMgPSByZXF1aXJlKFwidG50LmFwaVwiKTtcbnZhciB0bnRfdHJlZV9ub2RlID0gcmVxdWlyZShcInRudC50cmVlLm5vZGVcIik7XG5cbnZhciB0cmVlID0gZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2ggKFwiY2xpY2tcIiwgXCJkYmxjbGlja1wiLCBcIm1vdXNlb3ZlclwiLCBcIm1vdXNlb3V0XCIsIFwibG9hZFwiKTtcblxuICAgIHZhciBjb25mID0ge1xuICAgICAgICBkdXJhdGlvbiAgICAgICAgIDogNTAwLCAgICAgIC8vIER1cmF0aW9uIG9mIHRoZSB0cmFuc2l0aW9uc1xuICAgICAgICBub2RlX2Rpc3BsYXkgICAgIDogdHJlZS5ub2RlX2Rpc3BsYXkuY2lyY2xlKCksXG4gICAgICAgIGxhYmVsICAgICAgICAgICAgOiB0cmVlLmxhYmVsLnRleHQoKSxcbiAgICAgICAgbGF5b3V0ICAgICAgICAgICA6IHRyZWUubGF5b3V0LnZlcnRpY2FsKCksXG4gICAgICAgIC8vIG9uX2NsaWNrICAgICAgICAgOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgLy8gb25fZGJsX2NsaWNrICAgICA6IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICAvLyBvbl9tb3VzZW92ZXIgICAgIDogZnVuY3Rpb24gKCkge30sXG4gICAgICAgIGJyYW5jaF9jb2xvciAgICAgOiAnYmxhY2snLFxuICAgICAgICBpZCAgICAgICAgICAgICAgIDogZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkLl9pZDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBLZWVwIHRyYWNrIG9mIHRoZSBmb2N1c2VkIG5vZGVcbiAgICAvLyBUT0RPOiBXb3VsZCBpdCBiZSBiZXR0ZXIgdG8gaGF2ZSBtdWx0aXBsZSBmb2N1c2VkIG5vZGVzPyAoaWUgdXNlIGFuIGFycmF5KVxuICAgIC8vIHZhciBmb2N1c2VkX25vZGU7XG5cbiAgICAvLyBFeHRyYSBkZWxheSBpbiB0aGUgdHJhbnNpdGlvbnMgKFRPRE86IE5lZWRlZD8pXG4gICAgdmFyIGRlbGF5ID0gMDtcblxuICAgIC8vIEVhc2Ugb2YgdGhlIHRyYW5zaXRpb25zXG4gICAgdmFyIGVhc2UgPSBcImN1YmljLWluLW91dFwiO1xuXG4gICAgLy8gVGhlIGlkIG9mIHRoZSB0cmVlIGNvbnRhaW5lclxuICAgIHZhciBkaXZfaWQ7XG5cbiAgICAvLyBUaGUgdHJlZSB2aXN1YWxpemF0aW9uIChzdmcpXG4gICAgdmFyIHN2ZztcbiAgICB2YXIgdmlzO1xuICAgIHZhciBsaW5rc19nO1xuICAgIHZhciBub2Rlc19nO1xuXG4gICAgLy8gVE9ETzogRm9yIG5vdywgY291bnRzIGFyZSBnaXZlbiBvbmx5IGZvciBsZWF2ZXNcbiAgICAvLyBidXQgaXQgbWF5IGJlIGdvb2QgdG8gYWxsb3cgY291bnRzIGZvciBpbnRlcm5hbCBub2Rlc1xuICAgIHZhciBjb3VudHMgPSB7fTtcblxuICAgIC8vIFRoZSBmdWxsIHRyZWVcbiAgICB2YXIgYmFzZSA9IHtcbiAgICAgICAgdHJlZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgZGF0YSA6IHVuZGVmaW5lZCxcbiAgICAgICAgbm9kZXMgOiB1bmRlZmluZWQsXG4gICAgICAgIGxpbmtzIDogdW5kZWZpbmVkXG4gICAgfTtcblxuICAgIC8vIFRoZSBjdXJyIHRyZWUuIE5lZWRlZCB0byByZS1jb21wdXRlIHRoZSBsaW5rcyAvIG5vZGVzIHBvc2l0aW9ucyBvZiBzdWJ0cmVlc1xuICAgIHZhciBjdXJyID0ge1xuICAgICAgICB0cmVlIDogdW5kZWZpbmVkLFxuICAgICAgICBkYXRhIDogdW5kZWZpbmVkLFxuICAgICAgICBub2RlcyA6IHVuZGVmaW5lZCxcbiAgICAgICAgbGlua3MgOiB1bmRlZmluZWRcbiAgICB9O1xuXG4gICAgLy8gVGhlIGNiYWsgcmV0dXJuZWRcbiAgICB2YXIgdCA9IGZ1bmN0aW9uIChkaXYpIHtcbiAgICBcdGRpdl9pZCA9IGQzLnNlbGVjdChkaXYpLmF0dHIoXCJpZFwiKTtcblxuICAgICAgICB2YXIgdHJlZV9kaXYgPSBkMy5zZWxlY3QoZGl2KVxuICAgICAgICAgICAgLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAgICAgLnN0eWxlKFwid2lkdGhcIiwgKGNvbmYubGF5b3V0LndpZHRoKCkgKyAgXCJweFwiKSlcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ3JvdXBEaXZcIik7XG5cbiAgICBcdHZhciBjbHVzdGVyID0gY29uZi5sYXlvdXQuY2x1c3RlcjtcblxuICAgIFx0dmFyIG5fbGVhdmVzID0gY3Vyci50cmVlLmdldF9hbGxfbGVhdmVzKCkubGVuZ3RoO1xuXG4gICAgXHR2YXIgbWF4X2xlYWZfbGFiZWxfbGVuZ3RoID0gZnVuY3Rpb24gKHRyZWUpIHtcbiAgICBcdCAgICB2YXIgbWF4ID0gMDtcbiAgICBcdCAgICB2YXIgbGVhdmVzID0gdHJlZS5nZXRfYWxsX2xlYXZlcygpO1xuICAgIFx0ICAgIGZvciAodmFyIGk9MDsgaTxsZWF2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbGFiZWxfd2lkdGggPSBjb25mLmxhYmVsLndpZHRoKCkobGVhdmVzW2ldKSArIGQzLmZ1bmN0b3IgKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkobGVhdmVzW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAobGFiZWxfd2lkdGggPiBtYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4ID0gbGFiZWxfd2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgIFx0ICAgIH1cbiAgICBcdCAgICByZXR1cm4gbWF4O1xuICAgIFx0fTtcblxuICAgICAgICB2YXIgbWF4X2xlYWZfbm9kZV9oZWlnaHQgPSBmdW5jdGlvbiAodHJlZSkge1xuICAgICAgICAgICAgdmFyIG1heCA9IDA7XG4gICAgICAgICAgICB2YXIgbGVhdmVzID0gdHJlZS5nZXRfYWxsX2xlYXZlcygpO1xuICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPGxlYXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlX2hlaWdodCA9IGQzLmZ1bmN0b3IoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKShsZWF2ZXNbaV0pICogMjtcbiAgICAgICAgICAgICAgICB2YXIgbGFiZWxfaGVpZ2h0ID0gZDMuZnVuY3Rvcihjb25mLmxhYmVsLmhlaWdodCgpKShsZWF2ZXNbaV0pO1xuXG4gICAgICAgICAgICAgICAgbWF4ID0gZDMubWF4KFttYXgsIG5vZGVfaGVpZ2h0LCBsYWJlbF9oZWlnaHRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtYXg7XG4gICAgICAgIH07XG5cbiAgICBcdHZhciBtYXhfbGFiZWxfbGVuZ3RoID0gbWF4X2xlYWZfbGFiZWxfbGVuZ3RoKGN1cnIudHJlZSk7XG4gICAgXHRjb25mLmxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aChtYXhfbGFiZWxfbGVuZ3RoKTtcblxuICAgIFx0dmFyIG1heF9ub2RlX2hlaWdodCA9IG1heF9sZWFmX25vZGVfaGVpZ2h0KGN1cnIudHJlZSk7XG5cbiAgICBcdC8vIENsdXN0ZXIgc2l6ZSBpcyB0aGUgcmVzdWx0IG9mLi4uXG4gICAgXHQvLyB0b3RhbCB3aWR0aCBvZiB0aGUgdmlzIC0gdHJhbnNmb3JtIGZvciB0aGUgdHJlZSAtIG1heF9sZWFmX2xhYmVsX3dpZHRoIC0gaG9yaXpvbnRhbCB0cmFuc2Zvcm0gb2YgdGhlIGxhYmVsXG4gICAgXHQvLyBUT0RPOiBTdWJzdGl0dXRlIDE1IGJ5IHRoZSBob3Jpem9udGFsIHRyYW5zZm9ybSBvZiB0aGUgbm9kZXNcbiAgICBcdHZhciBjbHVzdGVyX3NpemVfcGFyYW1zID0ge1xuICAgIFx0ICAgIG5fbGVhdmVzIDogbl9sZWF2ZXMsXG4gICAgXHQgICAgbGFiZWxfaGVpZ2h0IDogbWF4X25vZGVfaGVpZ2h0LFxuICAgIFx0ICAgIGxhYmVsX3BhZGRpbmcgOiAxNVxuICAgIFx0fTtcblxuICAgIFx0Y29uZi5sYXlvdXQuYWRqdXN0X2NsdXN0ZXJfc2l6ZShjbHVzdGVyX3NpemVfcGFyYW1zKTtcblxuICAgIFx0dmFyIGRpYWdvbmFsID0gY29uZi5sYXlvdXQuZGlhZ29uYWwoKTtcbiAgICBcdHZhciB0cmFuc2Zvcm0gPSBjb25mLmxheW91dC50cmFuc2Zvcm1fbm9kZTtcblxuICAgIFx0c3ZnID0gdHJlZV9kaXZcbiAgICBcdCAgICAuYXBwZW5kKFwic3ZnXCIpXG4gICAgXHQgICAgLmF0dHIoXCJ3aWR0aFwiLCBjb25mLmxheW91dC53aWR0aCgpKVxuICAgIFx0ICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGNvbmYubGF5b3V0LmhlaWdodChjbHVzdGVyX3NpemVfcGFyYW1zKSArIDMwKVxuICAgIFx0ICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIik7XG5cbiAgICBcdHZpcyA9IHN2Z1xuICAgIFx0ICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgXHQgICAgLmF0dHIoXCJpZFwiLCBcInRudF9zdF9cIiArIGRpdl9pZClcbiAgICBcdCAgICAuYXR0cihcInRyYW5zZm9ybVwiLFxuICAgIFx0XHQgIFwidHJhbnNsYXRlKFwiICtcbiAgICBcdFx0ICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMF0gK1xuICAgIFx0XHQgIFwiLFwiICtcbiAgICBcdFx0ICBjb25mLmxheW91dC50cmFuc2xhdGVfdmlzKClbMV0gK1xuICAgIFx0XHQgIFwiKVwiKTtcblxuICAgIFx0Y3Vyci5ub2RlcyA9IGNsdXN0ZXIubm9kZXMoY3Vyci5kYXRhKTtcbiAgICBcdGNvbmYubGF5b3V0LnNjYWxlX2JyYW5jaF9sZW5ndGhzKGN1cnIpO1xuICAgIFx0Y3Vyci5saW5rcyA9IGNsdXN0ZXIubGlua3MoY3Vyci5ub2Rlcyk7XG5cbiAgICBcdC8vIExJTktTXG4gICAgXHQvLyBBbGwgdGhlIGxpbmtzIGFyZSBncm91cGVkIGluIGEgZyBlbGVtZW50XG4gICAgXHRsaW5rc19nID0gdmlzXG4gICAgXHQgICAgLmFwcGVuZChcImdcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua3NcIik7XG4gICAgXHRub2Rlc19nID0gdmlzXG4gICAgXHQgICAgLmFwcGVuZChcImdcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZXNcIik7XG5cbiAgICBcdC8vdmFyIGxpbmsgPSB2aXNcbiAgICBcdHZhciBsaW5rID0gbGlua3NfZ1xuICAgIFx0ICAgIC5zZWxlY3RBbGwoXCJwYXRoLnRudF90cmVlX2xpbmtcIilcbiAgICBcdCAgICAuZGF0YShjdXJyLmxpbmtzLCBmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZi5pZChkLnRhcmdldCk7XG4gICAgICAgICAgICB9KTtcblxuICAgIFx0bGlua1xuICAgIFx0ICAgIC5lbnRlcigpXG4gICAgXHQgICAgLmFwcGVuZChcInBhdGhcIilcbiAgICBcdCAgICAuYXR0cihcImNsYXNzXCIsIFwidG50X3RyZWVfbGlua1wiKVxuICAgIFx0ICAgIC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24oZCkge1xuICAgIFx0ICAgIFx0cmV0dXJuIFwidG50X3RyZWVfbGlua19cIiArIGRpdl9pZCArIFwiX1wiICsgY29uZi5pZChkLnRhcmdldCk7XG4gICAgXHQgICAgfSlcbiAgICBcdCAgICAuc3R5bGUoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZDMuZnVuY3Rvcihjb25mLmJyYW5jaF9jb2xvcikodG50X3RyZWVfbm9kZShkLnNvdXJjZSksIHRudF90cmVlX25vZGUoZC50YXJnZXQpKTtcbiAgICBcdCAgICB9KVxuICAgIFx0ICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XG5cbiAgICBcdC8vIE5PREVTXG4gICAgXHQvL3ZhciBub2RlID0gdmlzXG4gICAgXHR2YXIgbm9kZSA9IG5vZGVzX2dcbiAgICBcdCAgICAuc2VsZWN0QWxsKFwiZy50bnRfdHJlZV9ub2RlXCIpXG4gICAgXHQgICAgLmRhdGEoY3Vyci5ub2RlcywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25mLmlkKGQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICBcdHZhciBuZXdfbm9kZSA9IG5vZGVcbiAgICBcdCAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG4gICAgXHQgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihuKSB7XG4gICAgICAgIFx0XHRpZiAobi5jaGlsZHJlbikge1xuICAgICAgICBcdFx0ICAgIGlmIChuLmRlcHRoID09PSAwKSB7XG4gICAgICAgICAgICBcdFx0XHRyZXR1cm4gXCJyb290IHRudF90cmVlX25vZGVcIjtcbiAgICAgICAgXHRcdCAgICB9IGVsc2Uge1xuICAgICAgICAgICAgXHRcdFx0cmV0dXJuIFwiaW5uZXIgdG50X3RyZWVfbm9kZVwiO1xuICAgICAgICBcdFx0ICAgIH1cbiAgICAgICAgXHRcdH0gZWxzZSB7XG4gICAgICAgIFx0XHQgICAgcmV0dXJuIFwibGVhZiB0bnRfdHJlZV9ub2RlXCI7XG4gICAgICAgIFx0XHR9XG4gICAgICAgIFx0fSlcbiAgICBcdCAgICAuYXR0cihcImlkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgXHRcdHJldHVybiBcInRudF90cmVlX25vZGVfXCIgKyBkaXZfaWQgKyBcIl9cIiArIGQuX2lkO1xuICAgIFx0ICAgIH0pXG4gICAgXHQgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgdHJhbnNmb3JtKTtcblxuICAgIFx0Ly8gZGlzcGxheSBub2RlIHNoYXBlXG4gICAgXHRuZXdfbm9kZVxuICAgIFx0ICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuICAgICAgICBcdFx0Y29uZi5ub2RlX2Rpc3BsYXkuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKGQpKTtcbiAgICBcdCAgICB9KTtcblxuICAgIFx0Ly8gZGlzcGxheSBub2RlIGxhYmVsXG4gICAgXHRuZXdfbm9kZVxuICAgIFx0ICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuICAgIFx0ICAgIFx0Y29uZi5sYWJlbC5jYWxsKHRoaXMsIHRudF90cmVlX25vZGUoZCksIGNvbmYubGF5b3V0LnR5cGUsIGQzLmZ1bmN0b3IoY29uZi5ub2RlX2Rpc3BsYXkuc2l6ZSgpKSh0bnRfdHJlZV9ub2RlKGQpKSk7XG4gICAgXHQgICAgfSk7XG5cbiAgICAgICAgbmV3X25vZGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTpjbGlja1wiLCBteV9ub2RlKTtcbiAgICAgICAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdfbm9kZS5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmRibGNsaWNrXCIsIG15X25vZGUpO1xuICAgICAgICAgICAgZGlzcGF0Y2guZGJsY2xpY2suY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5ld19ub2RlLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmhvdmVyXCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBuZXdfbm9kZS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOm1vdXNlb3V0XCIsIHRudF90cmVlX25vZGUobm9kZSkpO1xuICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGlzcGF0Y2gubG9hZCgpO1xuXG4gICAgXHQvLyBVcGRhdGUgcGxvdHMgYW4gdXBkYXRlZCB0cmVlXG4gICAgICAgIGFwaS5tZXRob2QgKCd1cGRhdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRyZWVfZGl2XG4gICAgICAgICAgICAgICAgLnN0eWxlKFwid2lkdGhcIiwgKGNvbmYubGF5b3V0LndpZHRoKCkgKyBcInB4XCIpKTtcbiAgICBcdCAgICBzdmcuYXR0cihcIndpZHRoXCIsIGNvbmYubGF5b3V0LndpZHRoKCkpO1xuXG4gICAgXHQgICAgdmFyIGNsdXN0ZXIgPSBjb25mLmxheW91dC5jbHVzdGVyO1xuICAgIFx0ICAgIHZhciBkaWFnb25hbCA9IGNvbmYubGF5b3V0LmRpYWdvbmFsKCk7XG4gICAgXHQgICAgdmFyIHRyYW5zZm9ybSA9IGNvbmYubGF5b3V0LnRyYW5zZm9ybV9ub2RlO1xuXG4gICAgXHQgICAgdmFyIG1heF9sYWJlbF9sZW5ndGggPSBtYXhfbGVhZl9sYWJlbF9sZW5ndGgoY3Vyci50cmVlKTtcbiAgICBcdCAgICBjb25mLmxheW91dC5tYXhfbGVhZl9sYWJlbF93aWR0aChtYXhfbGFiZWxfbGVuZ3RoKTtcblxuICAgIFx0ICAgIHZhciBtYXhfbm9kZV9oZWlnaHQgPSBtYXhfbGVhZl9ub2RlX2hlaWdodChjdXJyLnRyZWUpO1xuXG4gICAgXHQgICAgLy8gQ2x1c3RlciBzaXplIGlzIHRoZSByZXN1bHQgb2YuLi5cbiAgICBcdCAgICAvLyB0b3RhbCB3aWR0aCBvZiB0aGUgdmlzIC0gdHJhbnNmb3JtIGZvciB0aGUgdHJlZSAtIG1heF9sZWFmX2xhYmVsX3dpZHRoIC0gaG9yaXpvbnRhbCB0cmFuc2Zvcm0gb2YgdGhlIGxhYmVsXG4gICAgICAgIFx0Ly8gVE9ETzogU3Vic3RpdHV0ZSAxNSBieSB0aGUgdHJhbnNmb3JtIG9mIHRoZSBub2RlcyAocHJvYmFibHkgYnkgc2VsZWN0aW5nIG9uZSBub2RlIGFzc3VtaW5nIGFsbCB0aGUgbm9kZXMgaGF2ZSB0aGUgc2FtZSB0cmFuc2Zvcm1cbiAgICBcdCAgICB2YXIgbl9sZWF2ZXMgPSBjdXJyLnRyZWUuZ2V0X2FsbF9sZWF2ZXMoKS5sZW5ndGg7XG4gICAgXHQgICAgdmFyIGNsdXN0ZXJfc2l6ZV9wYXJhbXMgPSB7XG4gICAgICAgIFx0XHRuX2xlYXZlcyA6IG5fbGVhdmVzLFxuICAgICAgICBcdFx0bGFiZWxfaGVpZ2h0IDogbWF4X25vZGVfaGVpZ2h0LFxuICAgICAgICBcdFx0bGFiZWxfcGFkZGluZyA6IDE1XG4gICAgXHQgICAgfTtcbiAgICBcdCAgICBjb25mLmxheW91dC5hZGp1c3RfY2x1c3Rlcl9zaXplKGNsdXN0ZXJfc2l6ZV9wYXJhbXMpO1xuXG4gICAgICAgICAgICBzdmdcbiAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgLmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG4gICAgICAgICAgICAgICAgLmVhc2UoZWFzZSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBjb25mLmxheW91dC5oZWlnaHQoY2x1c3Rlcl9zaXplX3BhcmFtcykgKyAzMCk7IC8vIGhlaWdodCBpcyBpbiB0aGUgbGF5b3V0XG5cbiAgICBcdCAgICB2aXNcbiAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgLmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIixcbiAgICAgICAgICAgICAgICBcInRyYW5zbGF0ZShcIiArXG4gICAgICAgICAgICAgICAgY29uZi5sYXlvdXQudHJhbnNsYXRlX3ZpcygpWzBdICtcbiAgICAgICAgICAgICAgICBcIixcIiArXG4gICAgICAgICAgICAgICAgY29uZi5sYXlvdXQudHJhbnNsYXRlX3ZpcygpWzFdICtcbiAgICAgICAgICAgICAgICBcIilcIik7XG5cbiAgICAgICAgICAgIGN1cnIubm9kZXMgPSBjbHVzdGVyLm5vZGVzKGN1cnIuZGF0YSk7XG4gICAgICAgICAgICBjb25mLmxheW91dC5zY2FsZV9icmFuY2hfbGVuZ3RocyhjdXJyKTtcbiAgICAgICAgICAgIGN1cnIubGlua3MgPSBjbHVzdGVyLmxpbmtzKGN1cnIubm9kZXMpO1xuXG4gICAgXHQgICAgLy8gTElOS1NcbiAgICBcdCAgICB2YXIgbGluayA9IGxpbmtzX2dcbiAgICAgICAgXHRcdC5zZWxlY3RBbGwoXCJwYXRoLnRudF90cmVlX2xpbmtcIilcbiAgICAgICAgXHRcdC5kYXRhKGN1cnIubGlua3MsIGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29uZi5pZChkLnRhcmdldCk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIE5PREVTXG4gICAgXHQgICAgdmFyIG5vZGUgPSBub2Rlc19nXG4gICAgICAgIFx0XHQuc2VsZWN0QWxsKFwiZy50bnRfdHJlZV9ub2RlXCIpXG4gICAgICAgIFx0XHQuZGF0YShjdXJyLm5vZGVzLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25mLmlkKGQpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgXHQgICAgdmFyIGV4aXRfbGluayA9IGxpbmtcbiAgICAgICAgXHRcdC5leGl0KClcbiAgICAgICAgXHRcdC5yZW1vdmUoKTtcblxuICAgIFx0ICAgIGxpbmtcbiAgICAgICAgXHRcdC5lbnRlcigpXG4gICAgICAgIFx0XHQuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICBcdFx0LmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX2xpbmtcIilcbiAgICAgICAgXHRcdC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgXHRcdCAgICByZXR1cm4gXCJ0bnRfdHJlZV9saW5rX1wiICsgZGl2X2lkICsgXCJfXCIgKyBjb25mLmlkKGQudGFyZ2V0KTtcbiAgICAgICAgXHRcdH0pXG4gICAgICAgIFx0XHQuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBcdFx0ICAgIHJldHVybiBkMy5mdW5jdG9yKGNvbmYuYnJhbmNoX2NvbG9yKSh0bnRfdHJlZV9ub2RlKGQuc291cmNlKSwgdG50X3RyZWVfbm9kZShkLnRhcmdldCkpO1xuICAgICAgICBcdFx0fSlcbiAgICAgICAgXHRcdC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XG5cbiAgICBcdCAgICBsaW5rXG4gICAgXHQgICAgXHQudHJhbnNpdGlvbigpXG4gICAgICAgIFx0XHQuZWFzZShlYXNlKVxuICAgIFx0ICAgIFx0LmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG4gICAgXHQgICAgXHQuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG5cbiAgICBcdCAgICAvLyBOb2Rlc1xuICAgIFx0ICAgIHZhciBuZXdfbm9kZSA9IG5vZGVcbiAgICAgICAgXHRcdC5lbnRlcigpXG4gICAgICAgIFx0XHQuYXBwZW5kKFwiZ1wiKVxuICAgICAgICBcdFx0LmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihuKSB7XG4gICAgICAgIFx0XHQgICAgaWYgKG4uY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIFx0XHRcdGlmIChuLmRlcHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwicm9vdCB0bnRfdHJlZV9ub2RlXCI7XG4gICAgICAgICAgICBcdFx0XHR9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImlubmVyIHRudF90cmVlX25vZGVcIjtcbiAgICAgICAgICAgIFx0XHRcdH1cbiAgICAgICAgXHRcdCAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibGVhZiB0bnRfdHJlZV9ub2RlXCI7XG4gICAgICAgIFx0XHQgICAgfVxuICAgICAgICBcdFx0fSlcbiAgICAgICAgXHRcdC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgXHRcdCAgICByZXR1cm4gXCJ0bnRfdHJlZV9ub2RlX1wiICsgZGl2X2lkICsgXCJfXCIgKyBkLl9pZDtcbiAgICAgICAgXHRcdH0pXG4gICAgICAgIFx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm0pO1xuXG4gICAgXHQgICAgLy8gRXhpdGluZyBub2RlcyBhcmUganVzdCByZW1vdmVkXG4gICAgXHQgICAgbm9kZVxuICAgICAgICBcdFx0LmV4aXQoKVxuICAgICAgICBcdFx0LnJlbW92ZSgpO1xuXG4gICAgICAgICAgICBuZXdfbm9kZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6Y2xpY2tcIiwgbXlfbm9kZSk7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbCh0aGlzLCBteV9ub2RlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbmV3X25vZGUub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBteV9ub2RlID0gdG50X3RyZWVfbm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICB0cmVlLnRyaWdnZXIoXCJub2RlOmRibGNsaWNrXCIsIG15X25vZGUpO1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoLmRibGNsaWNrLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG5ld19ub2RlLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG15X25vZGUgPSB0bnRfdHJlZV9ub2RlKG5vZGUpO1xuICAgICAgICAgICAgICAgIHRyZWUudHJpZ2dlcihcIm5vZGU6aG92ZXJcIiwgdG50X3RyZWVfbm9kZShub2RlKSk7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwodGhpcywgbXlfbm9kZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG5ld19ub2RlLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbXlfbm9kZSA9IHRudF90cmVlX25vZGUobm9kZSk7XG4gICAgICAgICAgICAgICAgdHJlZS50cmlnZ2VyKFwibm9kZTptb3VzZW91dFwiLCB0bnRfdHJlZV9ub2RlKG5vZGUpKTtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKHRoaXMsIG15X25vZGUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICBcdCAgICAvLyAvLyBXZSBuZWVkIHRvIHJlLWNyZWF0ZSBhbGwgdGhlIG5vZGVzIGFnYWluIGluIGNhc2UgdGhleSBoYXZlIGNoYW5nZWQgbGl2ZWx5IChvciB0aGUgbGF5b3V0KVxuICAgIFx0ICAgIC8vIG5vZGUuc2VsZWN0QWxsKFwiKlwiKS5yZW1vdmUoKTtcbiAgICBcdCAgICAvLyBuZXdfbm9kZVxuICAgIFx0XHQvLyAgICAgLmVhY2goZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgXHQvLyBcdFx0Y29uZi5ub2RlX2Rpc3BsYXkuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKGQpKTtcbiAgICBcdFx0Ly8gICAgIH0pO1xuICAgICAgICAgICAgLy9cbiAgICBcdCAgICAvLyAvLyBXZSBuZWVkIHRvIHJlLWNyZWF0ZSBhbGwgdGhlIGxhYmVscyBhZ2FpbiBpbiBjYXNlIHRoZXkgaGF2ZSBjaGFuZ2VkIGxpdmVseSAob3IgdGhlIGxheW91dClcbiAgICBcdCAgICAvLyBuZXdfbm9kZVxuICAgIFx0XHQvLyAgICAgLmVhY2ggKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIFx0Ly8gXHRcdGNvbmYubGFiZWwuY2FsbCh0aGlzLCB0bnRfdHJlZV9ub2RlKGQpLCBjb25mLmxheW91dC50eXBlLCBkMy5mdW5jdG9yKGNvbmYubm9kZV9kaXNwbGF5LnNpemUoKSkodG50X3RyZWVfbm9kZShkKSkpO1xuICAgIFx0XHQvLyAgICAgfSk7XG5cbiAgICAgICAgICAgIHQudXBkYXRlX25vZGVzKCk7XG5cbiAgICBcdCAgICBub2RlXG4gICAgICAgIFx0XHQudHJhbnNpdGlvbigpXG4gICAgICAgIFx0XHQuZWFzZShlYXNlKVxuICAgICAgICBcdFx0LmR1cmF0aW9uKGNvbmYuZHVyYXRpb24pXG4gICAgICAgIFx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm0pO1xuXG4gICAgXHR9KTtcblxuICAgICAgICBhcGkubWV0aG9kKCd1cGRhdGVfbm9kZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IG5vZGVzX2dcbiAgICAgICAgICAgICAgICAuc2VsZWN0QWxsKFwiZy50bnRfdHJlZV9ub2RlXCIpO1xuXG4gICAgICAgICAgICAvLyByZS1jcmVhdGUgYWxsIHRoZSBub2RlcyBhZ2FpblxuICAgICAgICAgICAgLy8gbm9kZS5zZWxlY3RBbGwoXCIqXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgbm9kZVxuICAgICAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uZi5ub2RlX2Rpc3BsYXkucmVzZXQuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbm9kZVxuICAgICAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coY29uZi5ub2RlX2Rpc3BsYXkoKSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbmYubm9kZV9kaXNwbGF5LmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIHJlLWNyZWF0ZSBhbGwgdGhlIGxhYmVscyBhZ2FpblxuICAgICAgICAgICAgbm9kZVxuICAgICAgICAgICAgICAgIC5lYWNoIChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25mLmxhYmVsLmNhbGwodGhpcywgdG50X3RyZWVfbm9kZShkKSwgY29uZi5sYXlvdXQudHlwZSwgZDMuZnVuY3Rvcihjb25mLm5vZGVfZGlzcGxheS5zaXplKCkpKHRudF90cmVlX25vZGUoZCkpKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gQVBJXG4gICAgdmFyIGFwaSA9IGFwaWpzICh0KVxuICAgIFx0LmdldHNldCAoY29uZik7XG5cbiAgICAvLyBuIGlzIHRoZSBudW1iZXIgdG8gaW50ZXJwb2xhdGUsIHRoZSBzZWNvbmQgYXJndW1lbnQgY2FuIGJlIGVpdGhlciBcInRyZWVcIiBvciBcInBpeGVsXCIgZGVwZW5kaW5nXG4gICAgLy8gaWYgbiBpcyBzZXQgdG8gdHJlZSB1bml0cyBvciBwaXhlbHMgdW5pdHNcbiAgICBhcGkubWV0aG9kICgnc2NhbGVfYmFyJywgZnVuY3Rpb24gKG4sIHVuaXRzKSB7XG4gICAgICAgIGlmICghdC5sYXlvdXQoKS5zY2FsZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF1bml0cykge1xuICAgICAgICAgICAgdW5pdHMgPSBcInBpeGVsXCI7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHZhbDtcbiAgICAgICAgbGlua3NfZy5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAocCkge1xuICAgICAgICAgICAgICAgIGlmICh2YWwpIHJldHVybjtcbiAgICAgICAgICAgICAgICB2YXIgZCA9IHRoaXMuZ2V0QXR0cmlidXRlKFwiZFwiKTtcblxuICAgICAgICAgICAgICAgIHZhciBwYXRoUGFydHMgPSBkLnNwbGl0KC9bTUxBXS8pO1xuICAgICAgICAgICAgICAgIHZhciB0b1N0ciA9IHBhdGhQYXJ0cy5wb3AoKTtcbiAgICAgICAgICAgICAgICB2YXIgZnJvbVN0ciA9IHBhdGhQYXJ0cy5wb3AoKTtcblxuICAgICAgICAgICAgICAgIHZhciBmcm9tID0gZnJvbVN0ci5zcGxpdChcIixcIik7XG4gICAgICAgICAgICAgICAgdmFyIHRvID0gdG9TdHIuc3BsaXQoXCIsXCIpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGRlbHRhWCA9IHRvWzBdIC0gZnJvbVswXTtcbiAgICAgICAgICAgICAgICB2YXIgZGVsdGFZID0gdG9bMV0gLSBmcm9tWzFdO1xuICAgICAgICAgICAgICAgIHZhciBwaXhlbHNEaXN0ID0gTWF0aC5zcXJ0KGRlbHRhWCpkZWx0YVggKyBkZWx0YVkqZGVsdGFZKTtcblxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2UgPSBwLnNvdXJjZTtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gcC50YXJnZXQ7XG5cbiAgICAgICAgICAgICAgICB2YXIgYnJhbmNoRGlzdCA9IHRhcmdldC5fcm9vdF9kaXN0IC0gc291cmNlLl9yb290X2Rpc3Q7XG4gICAgICAgICAgICAgICAgaWYgKGJyYW5jaERpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU3VwcG9zaW5nIHBpeGVsc0Rpc3QgaGFzIGJlZW4gcGFzc2VkXG4gICAgICAgICAgICAgICAgICAgIGlmICh1bml0cyA9PT0gXCJwaXhlbFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSAoYnJhbmNoRGlzdCAvIHBpeGVsc0Rpc3QpICogbjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh1bml0cyA9PT0gXCJ0cmVlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IChwaXhlbHNEaXN0IC8gYnJhbmNoRGlzdCkgKiBuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH0pO1xuXG4gICAgLy8gVE9ETzogUmV3cml0ZSBkYXRhIHVzaW5nIGdldHNldCAvIGZpbmFsaXplcnMgJiB0cmFuc2Zvcm1zXG4gICAgYXBpLm1ldGhvZCAoJ2RhdGEnLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBiYXNlLmRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgb3JpZ2luYWwgZGF0YSBpcyBzdG9yZWQgYXMgdGhlIGJhc2UgYW5kIGN1cnIgZGF0YVxuICAgICAgICBiYXNlLmRhdGEgPSBkO1xuICAgICAgICBjdXJyLmRhdGEgPSBkO1xuXG4gICAgICAgIC8vIFNldCB1cCBhIG5ldyB0cmVlIGJhc2VkIG9uIHRoZSBkYXRhXG4gICAgICAgIHZhciBuZXd0cmVlID0gdG50X3RyZWVfbm9kZShiYXNlLmRhdGEpO1xuXG4gICAgICAgIHQucm9vdChuZXd0cmVlKTtcbiAgICAgICAgYmFzZS50cmVlID0gbmV3dHJlZTtcbiAgICAgICAgY3Vyci50cmVlID0gYmFzZS50cmVlO1xuXG4gICAgICAgIHRyZWUudHJpZ2dlcihcImRhdGE6aGFzQ2hhbmdlZFwiLCBiYXNlLmRhdGEpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogVGhpcyBpcyBvbmx5IGEgZ2V0dGVyXG4gICAgYXBpLm1ldGhvZCAoJ3Jvb3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjdXJyLnRyZWU7XG4gICAgfSk7XG5cbiAgICAvLyBhcGkubWV0aG9kICgnc3VidHJlZScsIGZ1bmN0aW9uIChjdXJyX25vZGVzLCBrZWVwU2luZ2xldG9ucykge1xuICAgIC8vICAgICB2YXIgc3VidHJlZSA9IGJhc2UudHJlZS5zdWJ0cmVlKGN1cnJfbm9kZXMsIGtlZXBTaW5nbGV0b25zKTtcbiAgICAvLyAgICAgY3Vyci5kYXRhID0gc3VidHJlZS5kYXRhKCk7XG4gICAgLy8gICAgIGN1cnIudHJlZSA9IHN1YnRyZWU7XG4gICAgLy9cbiAgICAvLyAgICAgcmV0dXJuIHRoaXM7XG4gICAgLy8gfSk7XG5cbiAgICAvLyBhcGkubWV0aG9kICgncmVyb290JywgZnVuY3Rpb24gKG5vZGUsIGtlZXBTaW5nbGV0b25zKSB7XG4gICAgLy8gICAgIC8vIGZpbmRcbiAgICAvLyAgICAgdmFyIHJvb3QgPSB0LnJvb3QoKTtcbiAgICAvLyAgICAgdmFyIGZvdW5kX25vZGUgPSB0LnJvb3QoKS5maW5kX25vZGUoZnVuY3Rpb24gKG4pIHtcbiAgICAvLyAgICAgICAgIHJldHVybiBub2RlLmlkKCkgPT09IG4uaWQoKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gICAgIHZhciBzdWJ0cmVlID0gcm9vdC5zdWJ0cmVlKGZvdW5kX25vZGUuZ2V0X2FsbF9sZWF2ZXMoKSwga2VlcFNpbmdsZXRvbnMpO1xuICAgIC8vXG4gICAgLy8gICAgIHJldHVybiBzdWJ0cmVlO1xuICAgIC8vIH0pO1xuXG4gICAgcmV0dXJuIGQzLnJlYmluZCAodCwgZGlzcGF0Y2gsIFwib25cIik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0cmVlO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvaW5kZXguanNcIik7XG4iLCIvLyByZXF1aXJlKCdmcycpLnJlYWRkaXJTeW5jKF9fZGlybmFtZSArICcvJykuZm9yRWFjaChmdW5jdGlvbihmaWxlKSB7XG4vLyAgICAgaWYgKGZpbGUubWF0Y2goLy4rXFwuanMvZykgIT09IG51bGwgJiYgZmlsZSAhPT0gX19maWxlbmFtZSkge1xuLy8gXHR2YXIgbmFtZSA9IGZpbGUucmVwbGFjZSgnLmpzJywgJycpO1xuLy8gXHRtb2R1bGUuZXhwb3J0c1tuYW1lXSA9IHJlcXVpcmUoJy4vJyArIGZpbGUpO1xuLy8gICAgIH1cbi8vIH0pO1xuXG4vLyBTYW1lIGFzXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcbnV0aWxzLnJlZHVjZSA9IHJlcXVpcmUoXCIuL3JlZHVjZS5qc1wiKTtcbnV0aWxzLnBuZyA9IHJlcXVpcmUoXCIuL3BuZy5qc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IHV0aWxzO1xuIiwidmFyIHBuZyA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBkb2N0eXBlID0gJzw/eG1sIHZlcnNpb249XCIxLjBcIiBzdGFuZGFsb25lPVwibm9cIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgXCItLy9XM0MvL0RURCBTVkcgMS4xLy9FTlwiIFwiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkXCI+JztcblxuICAgIHZhciBzY2FsZV9mYWN0b3IgPSAxO1xuICAgIC8vIHZhciBmaWxlbmFtZSA9ICdpbWFnZS5wbmcnO1xuXG4gICAgLy8gUmVzdHJpY3QgdGhlIGNzcyB0byBhcHBseSB0byB0aGUgZm9sbG93aW5nIGFycmF5IChocmVmcylcbiAgICAvLyBUT0RPOiBzdWJzdGl0dXRlIHRoaXMgYnkgYW4gYXJyYXkgb2YgcmVnZXhwXG4gICAgdmFyIGNzczsgLy8gSWYgdW5kZWZpbmVkLCB1c2UgYWxsIHN0eWxlc2hlZXRzXG4gICAgLy8gdmFyIGlubGluZV9pbWFnZXNfb3B0ID0gdHJ1ZTsgLy8gSWYgdHJ1ZSwgaW5saW5lIGltYWdlc1xuXG4gICAgdmFyIGltZ19jYmFrID0gZnVuY3Rpb24gKCkge307XG5cbiAgICB2YXIgcG5nX2V4cG9ydCA9IGZ1bmN0aW9uIChmcm9tX3N2Zykge1xuICAgICAgICBmcm9tX3N2ZyA9IGZyb21fc3ZnLm5vZGUoKTtcbiAgICAgICAgLy8gdmFyIHN2ZyA9IGRpdi5xdWVyeVNlbGVjdG9yKCdzdmcnKTtcblxuICAgICAgICB2YXIgaW5saW5lX2ltYWdlcyA9IGZ1bmN0aW9uIChjYmFrKSB7XG4gICAgICAgICAgICB2YXIgaW1hZ2VzID0gZDMuc2VsZWN0KGZyb21fc3ZnKVxuICAgICAgICAgICAgICAgIC5zZWxlY3RBbGwoJ2ltYWdlJyk7XG5cbiAgICAgICAgICAgIHZhciByZW1haW5pbmcgPSBpbWFnZXNbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNiYWsoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW1hZ2VzXG4gICAgICAgICAgICAgICAgLmVhY2ggKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGltYWdlID0gZDMuc2VsZWN0KHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICAgICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSBpbWcud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1nLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1cmkgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlLmF0dHIoJ2hyZWYnLCB1cmkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtYWluaW5nLS07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2JhaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpbWcuc3JjID0gaW1hZ2UuYXR0cignaHJlZicpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIG1vdmVfY2hpbGRyZW4gPSBmdW5jdGlvbiAoc3JjLCBkZXN0KSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBzcmMuY2hpbGRyZW4gfHwgc3JjLmNoaWxkTm9kZXM7XG4gICAgICAgICAgICB3aGlsZSAoY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuWzBdO1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSAhPT0gMS8qTm9kZS5FTEVNRU5UX05PREUqLykgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVzdC5hcHBlbmRDaGlsZChjaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgc3R5bGluZyA9IGZ1bmN0aW9uIChkb20pIHtcbiAgICAgICAgICAgIHZhciB1c2VkID0gXCJcIjtcbiAgICAgICAgICAgIHZhciBzaGVldHMgPSBkb2N1bWVudC5zdHlsZVNoZWV0cztcbiAgICAgICAgICAgIC8vIHZhciBzaGVldHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxzaGVldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgaHJlZiA9IHNoZWV0c1tpXS5ocmVmIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgaWYgKGNzcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2tpcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGM9MDsgYzxjc3MubGVuZ3RoOyBjKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChocmVmLmluZGV4T2YoY3NzW2NdKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2tpcCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChza2lwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcnVsZXMgPSBzaGVldHNbaV0uY3NzUnVsZXMgfHwgW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBydWxlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcnVsZSA9IHJ1bGVzW2pdO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mKHJ1bGUuc3R5bGUpICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbGVtcyA9IGRvbS5xdWVyeVNlbGVjdG9yQWxsKHJ1bGUuc2VsZWN0b3JUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlZCArPSBydWxlLnNlbGVjdG9yVGV4dCArIFwiIHsgXCIgKyBydWxlLnN0eWxlLmNzc1RleHQgKyBcIiB9XFxuXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGFyZSA8ZGVmcz4gYWxyZWFkeVxuICAgICAgICAgICAgdmFyIGRlZnMgPSBkb20ucXVlcnlTZWxlY3RvcihcImRlZnNcIikgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGVmcycpO1xuICAgICAgICAgICAgdmFyIHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgICAgICAgcy5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dC9jc3MnKTtcbiAgICAgICAgICAgIHMuaW5uZXJIVE1MID0gXCI8IVtDREFUQVtcXG5cIiArIHVzZWQgKyBcIlxcbl1dPlwiO1xuXG4gICAgICAgICAgICAvLyB2YXIgZGVmcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RlZnMnKTtcbiAgICAgICAgICAgIGRlZnMuYXBwZW5kQ2hpbGQocyk7XG4gICAgICAgICAgICByZXR1cm4gZGVmcztcbiAgICAgICAgfTtcblxuICAgICAgICBpbmxpbmVfaW1hZ2VzIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyB2YXIgc3ZnID0gZGl2LnF1ZXJ5U2VsZWN0b3IoJ3N2ZycpO1xuICAgICAgICAgICAgdmFyIG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHZhciBjbG9uZSA9IGZyb21fc3ZnLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KGNsb25lLmdldEF0dHJpYnV0ZSgnd2lkdGgnKSk7XG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gcGFyc2VJbnQoY2xvbmUuZ2V0QXR0cmlidXRlKCdoZWlnaHQnKSk7XG5cbiAgICAgICAgICAgIGNsb25lLnNldEF0dHJpYnV0ZShcInZlcnNpb25cIiwgXCIxLjFcIik7XG4gICAgICAgICAgICBjbG9uZS5zZXRBdHRyaWJ1dGUoXCJ4bWxuc1wiLCBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIpO1xuICAgICAgICAgICAgY2xvbmUuc2V0QXR0cmlidXRlKFwieG1sbnM6eGxpbmtcIiwgXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIpO1xuICAgICAgICAgICAgY2xvbmUuc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgd2lkdGggKiBzY2FsZV9mYWN0b3IpO1xuICAgICAgICAgICAgY2xvbmUuc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIGhlaWdodCAqIHNjYWxlX2ZhY3Rvcik7XG4gICAgICAgICAgICB2YXIgc2NhbGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJnXCIpO1xuICAgICAgICAgICAgc2NhbGluZy5zZXRBdHRyaWJ1dGUoXCJ0cmFuc2Zvcm1cIiwgXCJzY2FsZShcIiArIHNjYWxlX2ZhY3RvciArIFwiKVwiKTtcbiAgICAgICAgICAgIGNsb25lLmFwcGVuZENoaWxkKG1vdmVfY2hpbGRyZW4oY2xvbmUsIHNjYWxpbmcpKTtcbiAgICAgICAgICAgIG91dGVyLmFwcGVuZENoaWxkKGNsb25lKTtcblxuICAgICAgICAgICAgY2xvbmUuaW5zZXJ0QmVmb3JlIChzdHlsaW5nKGNsb25lKSwgY2xvbmUuZmlyc3RDaGlsZCk7XG5cbiAgICAgICAgICAgIHZhciBzdmcgPSBkb2N0eXBlICsgb3V0ZXIuaW5uZXJIVE1MO1xuICAgICAgICAgICAgc3ZnID0gc3ZnLnJlcGxhY2UgKFwibm9uZVwiLCBcImJsb2NrXCIpOyAvLyBJbiBjYXNlIHRoZSBzdmcgaXMgbm90IGJlaW5nIGRpc3BsYXllZCwgaXQgaXMgaWdub3JlZCBpbiBGRlxuICAgICAgICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG5cbiAgICAgICAgICAgIGltYWdlLnNyYyA9ICdkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LCcgKyB3aW5kb3cuYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoc3ZnKSkpO1xuICAgICAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGltYWdlLndpZHRoO1xuICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgMCwgMCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgc3JjID0gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XG4gICAgICAgICAgICAgICAgaW1nX2NiYWsgKHNyYyk7XG4gICAgICAgICAgICAgICAgLy8gdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICAgICAgLy8gYS5kb3dubG9hZCA9IGZpbGVuYW1lO1xuICAgICAgICAgICAgICAgIC8vIGEuaHJlZiA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xuICAgICAgICAgICAgICAgIC8vIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7XG4gICAgICAgICAgICAgICAgLy8gYS5jbGljaygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuICAgIHBuZ19leHBvcnQuc2NhbGVfZmFjdG9yID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NhbGVfZmFjdG9yO1xuICAgICAgICB9XG4gICAgICAgIHNjYWxlX2ZhY3RvciA9IGY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBwbmdfZXhwb3J0LmNhbGxiYWNrID0gZnVuY3Rpb24gKGNiYWspIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gaW1nX2NiYWs7XG4gICAgICAgIH1cbiAgICAgICAgaW1nX2NiYWsgPSBjYmFrO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcG5nX2V4cG9ydC5zdHlsZXNoZWV0cyA9IGZ1bmN0aW9uIChyZXN0cmljdENzcykge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjc3M7XG4gICAgICAgIH1cbiAgICAgICAgY3NzID0gcmVzdHJpY3RDc3M7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvLyBwbmdfZXhwb3J0LmZpbGVuYW1lID0gZnVuY3Rpb24gKGYpIHtcbiAgICAvLyBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIC8vIFx0ICAgIHJldHVybiBmaWxlbmFtZTtcbiAgICAvLyBcdH1cbiAgICAvLyBcdGZpbGVuYW1lID0gZjtcbiAgICAvLyBcdHJldHVybiBwbmdfZXhwb3J0O1xuICAgIC8vIH07XG5cbiAgICByZXR1cm4gcG5nX2V4cG9ydDtcbn07XG5cbnZhciBkb3dubG9hZCA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBmaWxlbmFtZSA9ICdpbWFnZS5wbmcnO1xuICAgIHZhciBtYXhfc2l6ZSA9IHtcbiAgICAgICAgbGltaXQ6IEluZmluaXR5LFxuICAgICAgICBvbkVycm9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImltYWdlIHRvbyBsYXJnZVwiKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcG5nX2V4cG9ydCA9IHBuZygpXG4gICAgICAgIC5jYWxsYmFjayAoZnVuY3Rpb24gKHNyYykge1xuICAgICAgICAgICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICBhLmRvd25sb2FkID0gZmlsZW5hbWU7XG4gICAgICAgICAgICBhLmhyZWYgPSBzcmM7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xuXG4gICAgICAgICAgICBpZiAoYS5ocmVmLmxlbmd0aCA+IG1heF9zaXplLmxpbWl0KSB7XG4gICAgICAgICAgICAgICAgYS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGEpO1xuICAgICAgICAgICAgICAgIG1heF9zaXplLm9uRXJyb3IoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYS5jbGljaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyAgICAgYS5jbGljaygpO1xuICAgICAgICAgICAgLy8gfSwgMzAwMCk7XG4gICAgICAgIH0pO1xuXG4gICAgcG5nX2V4cG9ydC5maWxlbmFtZSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWxlbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBmaWxlbmFtZSA9IGZuO1xuICAgICAgICByZXR1cm4gcG5nX2V4cG9ydDtcbiAgICB9O1xuXG4gICAgcG5nX2V4cG9ydC5saW1pdCA9IGZ1bmN0aW9uIChsKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG1heF9zaXplO1xuICAgICAgICB9XG4gICAgICAgIG1heF9zaXplID0gbDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJldHVybiBwbmdfZXhwb3J0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZG93bmxvYWQ7XG4iLCJ2YXIgcmVkdWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzbW9vdGggPSA1O1xuICAgIHZhciB2YWx1ZSA9ICd2YWwnO1xuICAgIHZhciByZWR1bmRhbnQgPSBmdW5jdGlvbiAoYSwgYikge1xuXHRpZiAoYSA8IGIpIHtcblx0ICAgIHJldHVybiAoKGItYSkgPD0gKGIgKiAwLjIpKTtcblx0fVxuXHRyZXR1cm4gKChhLWIpIDw9IChhICogMC4yKSk7XG4gICAgfTtcbiAgICB2YXIgcGVyZm9ybV9yZWR1Y2UgPSBmdW5jdGlvbiAoYXJyKSB7cmV0dXJuIGFycjt9O1xuXG4gICAgdmFyIHJlZHVjZSA9IGZ1bmN0aW9uIChhcnIpIHtcblx0aWYgKCFhcnIubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gYXJyO1xuXHR9XG5cdHZhciBzbW9vdGhlZCA9IHBlcmZvcm1fc21vb3RoKGFycik7XG5cdHZhciByZWR1Y2VkICA9IHBlcmZvcm1fcmVkdWNlKHNtb290aGVkKTtcblx0cmV0dXJuIHJlZHVjZWQ7XG4gICAgfTtcblxuICAgIHZhciBtZWRpYW4gPSBmdW5jdGlvbiAodiwgYXJyKSB7XG5cdGFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG5cdCAgICByZXR1cm4gYVt2YWx1ZV0gLSBiW3ZhbHVlXTtcblx0fSk7XG5cdGlmIChhcnIubGVuZ3RoICUgMikge1xuXHQgICAgdlt2YWx1ZV0gPSBhcnJbfn4oYXJyLmxlbmd0aCAvIDIpXVt2YWx1ZV07XHQgICAgXG5cdH0gZWxzZSB7XG5cdCAgICB2YXIgbiA9IH5+KGFyci5sZW5ndGggLyAyKSAtIDE7XG5cdCAgICB2W3ZhbHVlXSA9IChhcnJbbl1bdmFsdWVdICsgYXJyW24rMV1bdmFsdWVdKSAvIDI7XG5cdH1cblxuXHRyZXR1cm4gdjtcbiAgICB9O1xuXG4gICAgdmFyIGNsb25lID0gZnVuY3Rpb24gKHNvdXJjZSkge1xuXHR2YXIgdGFyZ2V0ID0ge307XG5cdGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG5cdCAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KHByb3ApKSB7XG5cdFx0dGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuXHQgICAgfVxuXHR9XG5cdHJldHVybiB0YXJnZXQ7XG4gICAgfTtcblxuICAgIHZhciBwZXJmb3JtX3Ntb290aCA9IGZ1bmN0aW9uIChhcnIpIHtcblx0aWYgKHNtb290aCA9PT0gMCkgeyAvLyBubyBzbW9vdGhcblx0ICAgIHJldHVybiBhcnI7XG5cdH1cblx0dmFyIHNtb290aF9hcnIgPSBbXTtcblx0Zm9yICh2YXIgaT0wOyBpPGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgdmFyIGxvdyA9IChpIDwgc21vb3RoKSA/IDAgOiAoaSAtIHNtb290aCk7XG5cdCAgICB2YXIgaGlnaCA9IChpID4gKGFyci5sZW5ndGggLSBzbW9vdGgpKSA/IGFyci5sZW5ndGggOiAoaSArIHNtb290aCk7XG5cdCAgICBzbW9vdGhfYXJyW2ldID0gbWVkaWFuKGNsb25lKGFycltpXSksIGFyci5zbGljZShsb3csaGlnaCsxKSk7XG5cdH1cblx0cmV0dXJuIHNtb290aF9hcnI7XG4gICAgfTtcblxuICAgIHJlZHVjZS5yZWR1Y2VyID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gcGVyZm9ybV9yZWR1Y2U7XG5cdH1cblx0cGVyZm9ybV9yZWR1Y2UgPSBjYmFrO1xuXHRyZXR1cm4gcmVkdWNlO1xuICAgIH07XG5cbiAgICByZWR1Y2UucmVkdW5kYW50ID0gZnVuY3Rpb24gKGNiYWspIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gcmVkdW5kYW50O1xuXHR9XG5cdHJlZHVuZGFudCA9IGNiYWs7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJlZHVjZS52YWx1ZSA9IGZ1bmN0aW9uICh2YWwpIHtcblx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gdmFsdWU7XG5cdH1cblx0dmFsdWUgPSB2YWw7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJlZHVjZS5zbW9vdGggPSBmdW5jdGlvbiAodmFsKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHNtb290aDtcblx0fVxuXHRzbW9vdGggPSB2YWw7XG5cdHJldHVybiByZWR1Y2U7XG4gICAgfTtcblxuICAgIHJldHVybiByZWR1Y2U7XG59O1xuXG52YXIgYmxvY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlZCA9IHJlZHVjZSgpXG5cdC52YWx1ZSgnc3RhcnQnKTtcblxuICAgIHZhciB2YWx1ZTIgPSAnZW5kJztcblxuICAgIHZhciBqb2luID0gZnVuY3Rpb24gKG9iajEsIG9iajIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICdvYmplY3QnIDoge1xuICAgICAgICAgICAgICAgICdzdGFydCcgOiBvYmoxLm9iamVjdFtyZWQudmFsdWUoKV0sXG4gICAgICAgICAgICAgICAgJ2VuZCcgICA6IG9iajJbdmFsdWUyXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICd2YWx1ZScgIDogb2JqMlt2YWx1ZTJdXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8vIHZhciBqb2luID0gZnVuY3Rpb24gKG9iajEsIG9iajIpIHsgcmV0dXJuIG9iajEgfTtcblxuICAgIHJlZC5yZWR1Y2VyKCBmdW5jdGlvbiAoYXJyKSB7XG5cdHZhciB2YWx1ZSA9IHJlZC52YWx1ZSgpO1xuXHR2YXIgcmVkdW5kYW50ID0gcmVkLnJlZHVuZGFudCgpO1xuXHR2YXIgcmVkdWNlZF9hcnIgPSBbXTtcblx0dmFyIGN1cnIgPSB7XG5cdCAgICAnb2JqZWN0JyA6IGFyclswXSxcblx0ICAgICd2YWx1ZScgIDogYXJyWzBdW3ZhbHVlMl1cblx0fTtcblx0Zm9yICh2YXIgaT0xOyBpPGFyci5sZW5ndGg7IGkrKykge1xuXHQgICAgaWYgKHJlZHVuZGFudCAoYXJyW2ldW3ZhbHVlXSwgY3Vyci52YWx1ZSkpIHtcblx0XHRjdXJyID0gam9pbihjdXJyLCBhcnJbaV0pO1xuXHRcdGNvbnRpbnVlO1xuXHQgICAgfVxuXHQgICAgcmVkdWNlZF9hcnIucHVzaCAoY3Vyci5vYmplY3QpO1xuXHQgICAgY3Vyci5vYmplY3QgPSBhcnJbaV07XG5cdCAgICBjdXJyLnZhbHVlID0gYXJyW2ldLmVuZDtcblx0fVxuXHRyZWR1Y2VkX2Fyci5wdXNoKGN1cnIub2JqZWN0KTtcblxuXHQvLyByZWR1Y2VkX2Fyci5wdXNoKGFyclthcnIubGVuZ3RoLTFdKTtcblx0cmV0dXJuIHJlZHVjZWRfYXJyO1xuICAgIH0pO1xuXG4gICAgcmVkdWNlLmpvaW4gPSBmdW5jdGlvbiAoY2Jhaykge1xuXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0ICAgIHJldHVybiBqb2luO1xuXHR9XG5cdGpvaW4gPSBjYmFrO1xuXHRyZXR1cm4gcmVkO1xuICAgIH07XG5cbiAgICByZWR1Y2UudmFsdWUyID0gZnVuY3Rpb24gKGZpZWxkKSB7XG5cdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHQgICAgcmV0dXJuIHZhbHVlMjtcblx0fVxuXHR2YWx1ZTIgPSBmaWVsZDtcblx0cmV0dXJuIHJlZDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJlZDtcbn07XG5cbnZhciBsaW5lID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciByZWQgPSByZWR1Y2UoKTtcblxuICAgIHJlZC5yZWR1Y2VyICggZnVuY3Rpb24gKGFycikge1xuXHR2YXIgcmVkdW5kYW50ID0gcmVkLnJlZHVuZGFudCgpO1xuXHR2YXIgdmFsdWUgPSByZWQudmFsdWUoKTtcblx0dmFyIHJlZHVjZWRfYXJyID0gW107XG5cdHZhciBjdXJyID0gYXJyWzBdO1xuXHRmb3IgKHZhciBpPTE7IGk8YXJyLmxlbmd0aC0xOyBpKyspIHtcblx0ICAgIGlmIChyZWR1bmRhbnQgKGFycltpXVt2YWx1ZV0sIGN1cnJbdmFsdWVdKSkge1xuXHRcdGNvbnRpbnVlO1xuXHQgICAgfVxuXHQgICAgcmVkdWNlZF9hcnIucHVzaCAoY3Vycik7XG5cdCAgICBjdXJyID0gYXJyW2ldO1xuXHR9XG5cdHJlZHVjZWRfYXJyLnB1c2goY3Vycik7XG5cdHJlZHVjZWRfYXJyLnB1c2goYXJyW2Fyci5sZW5ndGgtMV0pO1xuXHRyZXR1cm4gcmVkdWNlZF9hcnI7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVkO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjZTtcbm1vZHVsZS5leHBvcnRzLmxpbmUgPSBsaW5lO1xubW9kdWxlLmV4cG9ydHMuYmxvY2sgPSBibG9jaztcblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpdGVyYXRvciA6IGZ1bmN0aW9uKGluaXRfdmFsKSB7XG5cdHZhciBpID0gaW5pdF92YWwgfHwgMDtcblx0dmFyIGl0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICByZXR1cm4gaSsrO1xuXHR9O1xuXHRyZXR1cm4gaXRlcjtcbiAgICB9LFxuXG4gICAgc2NyaXB0X3BhdGggOiBmdW5jdGlvbiAoc2NyaXB0X25hbWUpIHsgLy8gc2NyaXB0X25hbWUgaXMgdGhlIGZpbGVuYW1lXG5cdHZhciBzY3JpcHRfc2NhcGVkID0gc2NyaXB0X25hbWUucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyk7XG5cdHZhciBzY3JpcHRfcmUgPSBuZXcgUmVnRXhwKHNjcmlwdF9zY2FwZWQgKyAnJCcpO1xuXHR2YXIgc2NyaXB0X3JlX3N1YiA9IG5ldyBSZWdFeHAoJyguKiknICsgc2NyaXB0X3NjYXBlZCArICckJyk7XG5cblx0Ly8gVE9ETzogVGhpcyByZXF1aXJlcyBwaGFudG9tLmpzIG9yIGEgc2ltaWxhciBoZWFkbGVzcyB3ZWJraXQgdG8gd29yayAoZG9jdW1lbnQpXG5cdHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpO1xuXHR2YXIgcGF0aCA9IFwiXCI7ICAvLyBEZWZhdWx0IHRvIGN1cnJlbnQgcGF0aFxuXHRpZihzY3JpcHRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZvcih2YXIgaSBpbiBzY3JpcHRzKSB7XG5cdFx0aWYoc2NyaXB0c1tpXS5zcmMgJiYgc2NyaXB0c1tpXS5zcmMubWF0Y2goc2NyaXB0X3JlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NyaXB0c1tpXS5zcmMucmVwbGFjZShzY3JpcHRfcmVfc3ViLCAnJDEnKTtcblx0XHR9XG4gICAgICAgICAgICB9XG5cdH1cblx0cmV0dXJuIHBhdGg7XG4gICAgfSxcblxuICAgIGRlZmVyX2NhbmNlbCA6IGZ1bmN0aW9uIChjYmFrLCB0aW1lKSB7XG4gICAgICAgIHZhciB0aWNrO1xuXG4gICAgICAgIHZhciBkZWZlcl9jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGljayk7XG4gICAgICAgICAgICB0aWNrID0gc2V0VGltZW91dCAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNiYWsuYXBwbHkgKHRoYXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSwgdGltZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGRlZmVyX2NhbmNlbDtcbiAgICB9XG59O1xuIiwidmFyIGFwaWpzID0gcmVxdWlyZShcInRudC5hcGlcIik7XG52YXIgZGVmZXJfY2FuY2VsID0gcmVxdWlyZShcInRudC51dGlsc1wiKS5kZWZlcl9jYW5jZWw7XG5cbnZhciB0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoIChcImRyYWdcIik7XG5cbiAgICB2YXIgbm9fdHJhY2sgPSB0cnVlO1xuICAgIHZhciBkaXZfaWQ7XG5cbiAgICAvLyBEZWZhdWx0c1xuICAgIHZhciB0cmVlX2NvbmYgPSB7XG4gICAgICAgIHRyZWU6IHVuZGVmaW5lZCxcbiAgICAgICAgdHJhY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0ID0gdG50LmJvYXJkLnRyYWNrKClcbiAgICAgICAgICAgICAgICAuY29sb3IoXCIjRUJGNUZGXCIpXG4gICAgICAgICAgICAgICAgLmRhdGEodG50LmJvYXJkLnRyYWNrLmRhdGEoKVxuICAgICAgICAgICAgICAgICAgICAudXBkYXRlKHRudC5ib2FyZC50cmFjay5yZXRyaWV2ZXIuc3luYygpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmV0cmlldmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICAgIC5kaXNwbGF5KHRudC5ib2FyZC50cmFjay5mZWF0dXJlLmJsb2NrKClcbiAgICAgICAgICAgICAgICAgICAgLmNvbG9yKFwic3RlZWxibHVlXCIpXG4gICAgICAgICAgICAgICAgICAgIC5pbmRleChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQuc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIHQ7XG4gICAgICAgIH0sXG4gICAgICAgIGJvYXJkOiB1bmRlZmluZWQsXG4gICAgICAgIHRvcDogdW5kZWZpbmVkLFxuICAgICAgICBib3R0b206IHVuZGVmaW5lZCxcbiAgICAgICAga2V5OiB1bmRlZmluZWQsXG4gICAgfTtcblxuICAgIHZhciB0cmVlX2Fubm90ID0gZnVuY3Rpb24gKGRpdikge1xuICAgICAgICBkaXZfaWQgPSBkMy5zZWxlY3QoZGl2KVxuICAgICAgICAgICAgLmF0dHIoXCJpZFwiKTtcblxuICAgICAgICB2YXIgZ3JvdXBfZGl2ID0gZDMuc2VsZWN0KGRpdilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfZ3JvdXBEaXZcIik7XG5cbiAgICAgICAgdmFyIHRyZWVfZGl2ID0gZ3JvdXBfZGl2XG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgICAgICAuYXR0cihcImlkXCIsIFwidG50X3RyZWVfY29udGFpbmVyX1wiICsgZGl2X2lkKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInRudF90cmVlX2NvbnRhaW5lclwiKTtcblxuICAgICAgICB2YXIgYW5ub3RfZGl2ID0gZ3JvdXBfZGl2XG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgICAgICAuYXR0cihcImlkXCIsIFwidG50X2Fubm90X2NvbnRhaW5lcl9cIiArIGRpdl9pZClcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ0bnRfYW5ub3RfY29udGFpbmVyXCIpO1xuXG4gICAgICAgIHZhciBkcmFnID0gYW5ub3RfZGl2XG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgICAgICAuYXR0cihcImlkXCIsIFwidG50X2Fubm90X2RyYWdcIik7XG5cbiAgICAgICAgLy8gRHJhZ2dpbmdcbiAgICAgICAgZHJhZy5vbihcIm1vdXNlZG93blwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVzaXppbmdfcG9zID0gZDMuZXZlbnQuY2xpZW50WDtcblxuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXJfY2FuY2VsKGZ1bmN0aW9uIG1vdXNlbW92ZShjbGllbnRYKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRfcG9zID0gY2xpZW50WDtcbiAgICAgICAgICAgICAgICB2YXIgZGlmZiA9IGN1cnJlbnRfcG9zIC0gcmVzaXppbmdfcG9zO1xuICAgICAgICAgICAgICAgIHZhciBjdXJyX3RyZWVfd2lkdGggPSB0cmVlX2NvbmYudHJlZS5sYXlvdXQoKS53aWR0aCgpO1xuICAgICAgICAgICAgICAgIHRyZWVfY29uZi50cmVlLmxheW91dCgpLndpZHRoKGN1cnJfdHJlZV93aWR0aCArIGRpZmYpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJfYm9hcmRfd2lkdGggPSB0cmVlX2NvbmYuYm9hcmQud2lkdGgoKTtcbiAgICAgICAgICAgICAgICB0cmVlX2NvbmYuYm9hcmQud2lkdGgoY3Vycl9ib2FyZF93aWR0aCAtIGRpZmYpO1xuXG4gICAgICAgICAgICAgICAgdHJlZV9jb25mLnRyZWUudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgdHJlZV9jb25mLmJvYXJkLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIHJlc2l6aW5nX3BvcyA9IGN1cnJlbnRfcG9zO1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoLmRyYWcuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG5cbiAgICAgICAgICAgIHZhciB3ID0gZDMuc2VsZWN0KHdpbmRvdylcbiAgICAgICAgICAgICAgICAub24oXCJtb3VzZW1vdmVcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZChkMy5ldmVudC5jbGllbnRYKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5vbihcIm1vdXNldXBcIiwgbW91c2V1cCk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIG1vdXNldXAoKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogRG9lcyB0aGlzIHJlbW92ZSBvdGhlciBsaXN0ZW5lcnMgb24gdGhlIHdpbmRvdz9cbiAgICAgICAgICAgICAgICB3Lm9uKFwibW91c2Vtb3ZlXCIsIG51bGwpLm9uKFwibW91c2V1cFwiLCBudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdHJlZV9jb25mLnRyZWUodHJlZV9kaXYubm9kZSgpKTtcblxuICAgICAgICAvLyB0cmFja3NcbiAgICAgICAgdmFyIGxlYXZlcyA9IHRyZWVfY29uZi50cmVlLnJvb3QoKS5nZXRfYWxsX2xlYXZlcygpO1xuICAgICAgICB2YXIgdHJhY2tzID0gW107XG5cbiAgICAgICAgdmFyIGhlaWdodCA9IHRyZWVfY29uZi50cmVlLmxhYmVsKCkuaGVpZ2h0KCk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZWF2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIC8vIEJsb2NrIFRyYWNrMVxuICAgICAgICAgICAgKGZ1bmN0aW9uIChsZWFmKSB7XG4gICAgICAgICAgICAgICAgdG50LmJvYXJkLnRyYWNrLmlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHJlZV9jb25mLmtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVhZi5pZCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKHRyZWVfY29uZi5rZXkpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJlZV9jb25mLmtleShsZWFmKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVhZi5wcm9wZXJ0eSh0cmVlX2NvbmYua2V5KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciB0cmFjayA9IHRyZWVfY29uZi50cmFjayhsZWF2ZXNbaV0pXG4gICAgICAgICAgICAgICAgICAgIC5oZWlnaHQoaGVpZ2h0KTtcblxuICAgICAgICAgICAgICAgIHRyYWNrcy5wdXNoKHRyYWNrKTtcbiAgICAgICAgICAgIH0pKGxlYXZlc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHJlZV9jb25mLmJvYXJkKSB7XG4gICAgICAgICAgICBpZiAodHJlZV9jb25mLnRvcCkge1xuICAgICAgICAgICAgICAgIHRyZWVfY29uZi5ib2FyZFxuICAgICAgICAgICAgICAgICAgICAuYWRkX3RyYWNrKHRyZWVfY29uZi50b3ApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmVlX2NvbmYuYm9hcmRcbiAgICAgICAgICAgICAgICAuYWRkX3RyYWNrKHRyYWNrcyk7XG5cbiAgICAgICAgICAgIGlmICh0cmVlX2NvbmYuYm90dG9tKSB7XG4gICAgICAgICAgICAgICAgdHJlZV9jb25mLmJvYXJkXG4gICAgICAgICAgICAgICAgICAgIC5hZGRfdHJhY2sodHJlZV9jb25mLmJvdHRvbSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyZWVfY29uZi5ib2FyZChhbm5vdF9kaXYubm9kZSgpKTtcbiAgICAgICAgICAgIHRyZWVfY29uZi5ib2FyZC5zdGFydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXBpLm1ldGhvZCgndXBkYXRlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdHJlZV9jb25mLnRyZWUudXBkYXRlKCk7XG5cbiAgICAgICAgICAgIGlmICh0cmVlX2NvbmYuYm9hcmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGVhdmVzID0gdHJlZV9jb25mLnRyZWUucm9vdCgpLmdldF9hbGxfbGVhdmVzKCk7XG4gICAgICAgICAgICAgICAgdmFyIG5ld190cmFja3MgPSBbXTtcblxuICAgICAgICAgICAgICAgIGlmICh0cmVlX2NvbmYudG9wKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0b3AgaGVpZ2h0IGlzLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRyZWVfY29uZi50b3AuaGVpZ2h0KCkpO1xuICAgICAgICAgICAgICAgICAgICBuZXdfdHJhY2tzLnB1c2godHJlZV9jb25mLnRvcCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZWF2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgZmlyc3Qgc2VlIGlmIHdlIGhhdmUgYSB0cmFjayBmb3IgdGhlIGxlYWY6XG4gICAgICAgICAgICAgICAgICAgIHZhciBpZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyZWVfY29uZi5rZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBsZWF2ZXNbaV0uaWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgKHRyZWVfY29uZi5rZXkpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IHRyZWVfY29uZi5rZXkobGVhdmVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gbGVhdmVzW2ldLnByb3BlcnR5KHRyZWVfY29uZi5rZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyX3RyYWNrID0gdHJlZV9jb25mLmJvYXJkLmZpbmRfdHJhY2soaWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3Vycl90cmFjayA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBOZXcgbGVhZiAtLSBubyB0cmFjayBmb3IgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbiAobGVhZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRudC5ib2FyZC50cmFjay5pZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRyZWVfY29uZi5rZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxlYWYuaWQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mICh0cmVlX2NvbmYua2V5KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyZWVfY29uZi5rZXkobGVhZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxlYWYucHJvcGVydHkodHJlZV9jb25mLmtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyX3RyYWNrID0gdHJlZV9jb25mLnRyYWNrKGxlYXZlc1tpXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmhlaWdodChoZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkobGVhdmVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuZXdfdHJhY2tzLnB1c2goY3Vycl90cmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0cmVlX2NvbmYuYm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld190cmFja3MucHVzaCh0cmVlX2NvbmYuYm90dG9tKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cmVlX2NvbmYuYm9hcmQudHJhY2tzKG5ld190cmFja3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdHJlZV9hbm5vdDtcbiAgICB9O1xuXG4gICAgdmFyIGFwaSA9IGFwaWpzKHRyZWVfYW5ub3QpXG4gICAgICAgIC5nZXRzZXQodHJlZV9jb25mKTtcblxuICAgIC8vIFRPRE86IFJld3JpdGUgd2l0aCB0aGUgYXBpIGludGVyZmFjZVxuICAgIHRyZWVfYW5ub3QudHJhY2sgPSBmdW5jdGlvbiAobmV3X3RyYWNrKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRyZWVfY29uZi50cmFjaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZpcnN0IHRpbWUgaXQgaXMgc2V0XG4gICAgICAgIGlmIChub190cmFjaykge1xuICAgICAgICAgICAgdHJlZV9jb25mLnRyYWNrID0gbmV3X3RyYWNrO1xuICAgICAgICAgICAgbm9fdHJhY2sgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB0cmVlX2Fubm90O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgaXQgaXMgcmVzZXQgLS0gYXBwbHkgdGhlIGNoYW5nZXNcbiAgICAgICAgdmFyIHRyYWNrcyA9IHRyZWVfY29uZi5ib2FyZC50cmFja3MoKTtcbiAgICAgICAgLy8gdmFyIHN0YXJ0X2luZGV4ID0gKHRyZWVfY29uZi5ydWxlciA9PT0gJ2JvdGgnIHx8IHRyZWVfY29uZi5ydWxlciA9PT0gJ3RvcCcpID8gMSA6IDA7XG4gICAgICAgIC8vIHZhciBlbmRfaW5kZXggPSAodHJlZV9jb25mLnJ1bGVyID09PSAnYm90aCcgfHwgdHJlZV9jb25mLnJ1bGVyID09PSAnYm90dG9tJykgPyAxIDogMDtcblxuICAgICAgICB2YXIgc3RhcnRfaW5kZXggPSAwO1xuICAgICAgICB2YXIgbl9pbmRleCA9IDA7XG5cbiAgICAgICAgaWYgKHRyZWVfY29uZi50b3AgJiYgdHJlZV9jb25mLmJvdHRvbSkge1xuICAgICAgICAgICAgc3RhcnRfaW5kZXggPSAxO1xuICAgICAgICAgICAgbl9pbmRleCA9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAodHJlZV9jb25mLnRvcCkge1xuICAgICAgICAgICAgc3RhcnRfaW5kZXggPSAxO1xuICAgICAgICAgICAgbl9pbmRleCA9IDE7XG4gICAgICAgIH0gZWxzZSBpZiAodHJlZV9jb25mLmJvdHRvbSkge1xuICAgICAgICAgICAgbl9pbmRleCA9IDE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiAodHJlZV9jb25mLnJ1bGVyID09PSBcImJvdGhcIikge1xuICAgICAgICAvLyAgICAgc3RhcnRfaW5kZXggPSAxO1xuICAgICAgICAvLyAgICAgbl9pbmRleCA9IDI7XG4gICAgICAgIC8vIH0gZWxzZSBpZiAodHJlZV9jb25mLnJ1bGVyID09PSBcInRvcFwiKSB7XG4gICAgICAgIC8vICAgICBzdGFydF9pbmRleCA9IDE7XG4gICAgICAgIC8vICAgICBuX2luZGV4ID0gMTtcbiAgICAgICAgLy8gfSBlbHNlIGlmICh0cmVlX2NvbmYucnVsZXIgPT09IFwiYm90dG9tXCIpIHtcbiAgICAgICAgLy8gICAgIG5faW5kZXggPSAxO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gUmVzZXQgdG9wIHRyYWNrIC0tIGF4aXNcbiAgICAgICAgaWYgKHN0YXJ0X2luZGV4ID4gMCkge1xuICAgICAgICAgICAgdHJhY2tzWzBdLmRpc3BsYXkoKS5yZXNldC5jYWxsKHRyYWNrc1swXSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmVzZXQgYm90dG9tIHRyYWNrIC0tIGF4aXNcbiAgICAgICAgaWYgKG5faW5kZXggPiBzdGFydF9pbmRleCkge1xuICAgICAgICAgICAgdmFyIG4gPSB0cmFja3MubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIHRyYWNrc1tuXS5kaXNwbGF5KCkucmVzZXQuY2FsbCh0cmFja3Nbbl0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IHN0YXJ0X2luZGV4OyBpIDw9ICh0cmFja3MubGVuZ3RoIC0gbl9pbmRleCk7IGkrKykge1xuICAgICAgICAgICAgdmFyIHQgPSB0cmFja3NbaV07XG4gICAgICAgICAgICB0LmRpc3BsYXkoKS5yZXNldC5jYWxsKHQpO1xuICAgICAgICAgICAgdmFyIGxlYWY7XG4gICAgICAgICAgICB0cmVlX2NvbmYudHJlZS5yb290KCkuYXBwbHkoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5pZCgpID09PSB0LmlkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGVhZiA9IG5vZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZhciBuX3RyYWNrO1xuICAgICAgICAgICAgKGZ1bmN0aW9uIChsZWFmKSB7XG4gICAgICAgICAgICAgICAgdG50LmJvYXJkLnRyYWNrLmlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHJlZV9jb25mLmtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVhZi5pZCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKHRyZWVfY29uZi5rZXkgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJlZV9jb25mLmtleShsZWFmKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGVhZi5wcm9wZXJ0eSh0cmVlX2NvbmYua2V5KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG5fdHJhY2sgPSBuZXdfdHJhY2sobGVhZilcbiAgICAgICAgICAgICAgICAgICAgLmhlaWdodCh0cmVlX2NvbmYudHJlZS5sYWJlbCgpLmhlaWdodCgpKTtcbiAgICAgICAgICAgIH0pKGxlYWYpO1xuXG4gICAgICAgICAgICB0cmFja3NbaV0gPSBuX3RyYWNrO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZV9jb25mLnRyYWNrID0gbmV3X3RyYWNrO1xuICAgICAgICB0cmVlX2NvbmYuYm9hcmQuc3RhcnQoKTtcbiAgICB9O1xuXG4gICAgLy8gcmV0dXJuIHRyZWVfYW5ub3Q7XG4gICAgcmV0dXJuIGQzLnJlYmluZCAodHJlZV9hbm5vdCwgZGlzcGF0Y2gsIFwib25cIik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSB0YTtcbiJdfQ==

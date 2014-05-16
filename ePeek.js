/** 
@fileOverview e!Peek is a genome browser javascript plug-in. It is very easy to embed in client web pages and configure. The genomic information comes from {@link http://www.ensembl.org|Ensembl} via its {@link http://beta.rest.ensembl.org|REST API}.<br /><br />
e!Peek typically consists of two components: the <i>core</i> plug-in and a <i>theme</i> that interacts with it. Here you will find the API of the core plugin and several of the themes provided by default.
<br />
<ul>
<li><a href="ePeek.html">ePeek</li>
<li><a href="epeek.eRest.html">epeek.eRest</li>
</ul>
<br />

@example
    // Typically, the plug-in is used as follows:
    var gB = epeek().width(920); // other methods can be included here
    var gBTheme = epeek_theme(); // other methods can be included here
    gBTheme(gB, document.getElementById('DOM_element_id');
@author Miguel Pignatelli
*/

"use strict";
var epeek = {};

d3.selection.prototype.move_to_front = function() { 
  return this.each(function() { 
    this.parentNode.appendChild(this); 
  }); 
};


d3.selection.prototype.selectAncestor = function(type) {

    type = type.toLowerCase();

    var selfNode = this.node();
    if (selfNode.parentNode === null) {
	console.log("No more parents");
	return undefined
    }

    var tagName = selfNode.parentNode.tagName;

    if ((tagName !== undefined) && (tagName.toLowerCase() === type)) {
	return d3.select(selfNode.parentNode);
    } else {
	return d3.select(selfNode.parentNode).selectAncestor(type);
    }
};

// inspired on http://james.padolsey.com/javascript/monitoring-dom-properties/
d3.selection.prototype.watch = function(id, fn) {
    return this.each(function() {
	var self = d3.select(this);
	var oldVal = self.style(id);
	self.watch_timer = setInterval(function(){
	    if(self.style(id) !== oldVal) {
		fn.call(self, oldVal, self.style(id));
		oldVal = self.style(id);
	    }
	}, 1000);
    });
    return;
};
epeek.utils = {};

epeek.utils.iterator = function(init_val) {
    var i = init_val || 0;
    var iter = function () {
	return i++;
    };
    return iter;
};

epeek.utils.script_path = function (script_name) { // script_name is the filename
    var script_scaped = script_name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    var script_re = new RegExp(script_scaped + '$');
    var script_re_sub = new RegExp('(.*)' + script_scaped + '$');

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
};

epeek.utils.defer_cancel = function (cbak, time) {
    var tick;

    var defer_cancel = function () {
	clearTimeout(tick);
	tick = setTimeout(cbak, time);
    }

    return defer_cancel;
};

epeek.utils.reduce = function () {
    var smooth = 5;
    var value = 'val';
    var redundant = function (a, b) {
	if (a < b) {
	    return ((b-a) <= (b * .2));
	}
	return ((a-b) <= (a * .2));
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
	};
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

epeek.utils.reduce.block = function () {

    var reduce = epeek.utils.reduce()
	.value('start');

    var value2 = 'end';

    var join = function (obj1, obj2) {
        return {
            'object' : {
                'start' : obj1.object[reduce.value()],
                'end'   : obj2[value2]
            },
            'value'  : obj2[value2]
        }
    };

    // var join = function (obj1, obj2) { return obj1 };

    reduce.reducer( function (arr) {
	var value = reduce.value();
	var redundant = reduce.redundant();
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
	return reduce;
    };

    reduce.value2 = function (field) {
	if (!arguments.length) {
	    return value2;
	}
	value2 = field;
	return reduce;
    };

    return reduce;
};

epeek.utils.reduce.line = function () {
    var reduce = epeek.utils.reduce();

    reduce.reducer ( function (arr) {
	var redundant = reduce.redundant();
	var value = reduce.value();
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

    return reduce;

};

epeek.utils.api = function (who) {

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
		reg[method] = value
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

		for (var i=0; i<checks.length; i++) {
		    if (!checks[i].check(x)) {
			var msg = checks[i].msg || 
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
		attach_method (p, opts)
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
	}

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
epeek.utils.png = function () {

    var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

    var scale_factor = 1;
    var filename = 'image.png';

    var exporter = function (div) {
	var svg = div.querySelector('svg');

	var inline_images = function (cbak) {
	    var images = d3.select(svg)
		.selectAll('image');

	    var remaining = images[0].length;
	    if (remaining === 0) {
		cbak();
	    }

	    images
		.each (function () {
		    var image = d3.select(this);
		    var img = new Image();
		    img.src = image.attr('href');
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
		    }
		});
	}

	var move_children = function (src, dest) {
	    while (src.children.length > 0) {
		var child = src.children[0];
		dest.appendChild(child);
	    }
	    return dest;
	};

	var styling = function (dom) {
	    var used = "";
	    var sheets = document.styleSheets;
	    for (var i = 0; i < sheets.length; i++) {
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

	    var s = document.createElement('style');
	    s.setAttribute('type', 'text/css');
	    s.innerHTML = "<![CDATA[\n" + used + "\n]]>";

	    var defs = document.createElement('defs');
	    defs.appendChild(s);
	    return defs;
	};

	inline_images (function () {
	    var svg = div.querySelector('svg');
	    var outer = document.createElement("div");
	    var clone = svg.cloneNode(true);
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
	    var image = new Image();
	    image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
	    image.onload = function() {
		var canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;
		var context = canvas.getContext('2d');
		context.drawImage(image, 0, 0);
		
		var a = document.createElement('a');
		a.download = filename;
		a.href = canvas.toDataURL('image/png');
		document.body.appendChild(a);
		a.click();
	    };
	});

    }
    exporter.scale_factor = function (f) {
	if (!arguments.length) {
	    return scale_factor;
	}
	scale_factor = f;
	return exporter;
    };

    exporter.filename = function (f) {
	if (!arguments.length) {
	    return filename;
	}
	filename = f;
	return exporter;
    };

    return exporter;
};
"use strict"

epeek.track = function() {

    //// Private vars
    var svg;
    var div_id;
    var tracks = [];
    var min_width = 500;
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
	// limits        : function () {throw "The limits method should be defined"}	
    };

    // The returned closure / object
    var track_vis = function(div) {
	div_id = d3.select(div).attr("id");

	// The original div is classed with the ePeek class
	d3.select(div)
	    .classed("ePeek", true);

	// TODO: Move the styling to the scss?
	var browserDiv = d3.select(div)
	    .append("div")
	    .attr("id", "ePeek_" + div_id)
	    .style("position", "relative")
	    .style("border", "2px solid")
	    .style("border-radius", "20px")
	    .style("-webkit-border-radius", "20px")
	    .style("-moz-border-radius", "20px")
	    .style("width", (width + cap_width*2 + exports.extend_canvas.right + exports.extend_canvas.left) + "px")

	var groupDiv = browserDiv
	    .append("div")
	    .attr("class", "ePeek_groupDiv");

	// The SVG
	svg = groupDiv
	    .append("svg")
	    .attr("class", "ePeek_svg")
	    .attr("width", width)
	    .attr("height", height);

	var svg_g = svg
	    .append("g")
            .attr("transform", "translate(0,20)")
            .append("g")
	    .attr("class", "ePeek_g");

	// caps
	svg_g
	    .append("rect")
	    .attr("id", "ePeek_" + div_id + "_5pcap")
	    .attr("x", 0)
	    .attr("y", 0)
	    .attr("width", 0)
	    .attr("height", height)
	    .attr("fill", "red");
	svg_g
	    .append("rect")
	    .attr("id", "ePeek_" + div_id + "_3pcap")
	    .attr("x", width-cap_width)
	    .attr("y", 0)
	    .attr("width", 0)
	    .attr("height", height)
	    .attr("fill", "red");

	// The Zooming/Panning Pane
	pane = svg_g
	    .append("rect")
	    .attr("class", "ePeek_pane")
	    .attr("id", "ePeek_" + div_id + "_pane")
	    .attr("width", width)
	    .attr("height", height)
	    .style("fill", bgColor);

	// ** TODO: Wouldn't be better to have these messages by track?
	var tooWide_text = svg_g
	    .append("text")
	    .attr("class", "ePeek_wideOK_text")
	    .attr("id", "ePeek_" + div_id + "_tooWide")
	    .attr("fill", bgColor)
	    .text("Region too wide");

	// TODO: I don't know if this is the best way (and portable) way
	// of centering the text in the text area
	var bb = tooWide_text[0][0].getBBox();
	tooWide_text
	    .attr("x", ~~(width/2 - bb.width/2))
	    .attr("y", ~~(height/2 - bb.height/2));
    };

    // API
    var api = epeek.utils.api (track_vis)
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
		tracks[i].display().reset.call(tracks[i]);
	    } else {
		_init_track(tracks[i]);
	    }
	}

	_place_tracks();

	// The continuation callback
	var cont = function (resp) {
	    limits.right = resp;

	    zoomEventHandler.xExtent([limits.left, limits.right]);
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

    var _update_track = function (track, where) {
	var data_updater = track.data().update();
	data_updater({
	    'loc' : where,
	    'on_success' : function () {
		track.display().update.call(track, xScale);
	    }
	});
    };

    var plot = function() {

	xScale = d3.scale.linear()
	    .domain([loc.from, loc.to])
	    .range([0, width]);

	if (drag_allowed) {
	    pane.call( zoomEventHandler
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
	    d3.select("#ePeek_" + div_id).select("svg").attr("width", w);
	    // Resize the zooming/panning pane
	    d3.select("#ePeek_" + div_id).style("width", (parseInt(w) + cap_width*2) + "px");
	    d3.select("#ePeek_" + div_id + "_pane").attr("width", w);

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
		pane.call( zoomEventHandler.x(xScale)
			   .xExtent([0, limits.right])
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
		    .attr("transform", "translate(0," + h + ")");
	    } else {
		track.g
		    .attr("transform", "translate(0," + h + ")");
	    }

	    h += track.height();
	}

	// svg
	svg.attr("height", h + height_offset);

	// div
	d3.select("#ePeek_" + div_id)
	    .style("height", (h + 10 + height_offset) + "px");

	// caps
	d3.select("#ePeek_" + div_id + "_5pcap")
	    .attr("height", h)
	    .move_to_front();
	d3.select("#ePeek_" + div_id + "_3pcap")
	    .attr("height", h)
	    .move_to_front();

	// pane
	pane
	    .attr("height", h + height_offset);

	// tooWide_text. TODO: Is this still needed?
	var tooWide_text = d3.select("#ePeek_" + div_id + "_tooWide");
	var bb = tooWide_text[0][0].getBBox();
	tooWide_text
	    .attr("y", ~~(h/2) - bb.height/2);

	return track_vis;
    }

    var _init_track = function (track) {
	track.g = svg.select("g").select("g")
	    .append("g")
	    .attr("class", "ePeek_track")
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

	track.display().init.call(track, width);
	
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
    var _deferred = epeek.utils.defer_cancel(_move_cbak, 300);

    var _move = function (new_xScale) {
	if (new_xScale !== undefined && drag_allowed) {
	    zoomEventHandler.x(new_xScale);
	}

	// Check if we are in the edges
	var domain = xScale.domain();
	if (domain[0] <= 5) {
	    d3.select("#ePeek_" + div_id + "_5pcap")
		.attr("width", cap_width)
		.transition()
		.duration(200)
		.attr("width", 0);
	}

	if (domain[1] >= (limits.right)-5) {
	    d3.select("#ePeek_" + div_id + "_3pcap")
		.attr("width", cap_width)
		.transition()
		.duration(200)
		.attr("width", 0);
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

    return track_vis;
};

"use strict";

epeek.track.id = epeek.utils.iterator(1);

epeek.track.track = function () {

    var read_conf = {
	// Unique ID for this track
	id : epeek.track.id()
    };

    var display;

    var conf = {
	// foreground_color : d3.rgb('#000000'),
	background_color : d3.rgb('#CCCCCC'),
	height           : 250,
	// data is the object (normally a epeek.track.data object) used to retrieve and update data for the track
	data             : epeek.track.data.empty()
    };

    // The returned object / closure
    var track = function() {
    };

    // API
    var api = epeek.utils.api (track)
	.getset (conf)
	.get (read_conf);

    // TODO: This means that height should be defined before display
    // we shouldn't rely on this
    track.display = function (new_plotter) {
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

	return track;
    };

    return track;

};
"use strict";

epeek.track.data = function() {

    var track_data = function () {
    };

    // Getters / Setters
    epeek.utils.api (track_data)
	    .getset ('label', "")
	    .getset ('elements', [])
	    .getset ('update', function () {});


    // The retrievers. They need to access 'elements'
    epeek.track.retriever = {};

    epeek.track.retriever.sync = function() {
	var update_track = function(obj) {
        // Object has a location and a plug-in defined callback
            track_data.elements(update_track.retriever()(obj.loc));
            obj.on_success();
	};

	epeek.utils.api (update_track)
	    .getset ('retriever', function () {})

	return update_track;
    };

    epeek.track.retriever.async = function () {
	var url = '';

	var update_track = function (obj) {
	    d3.json(url, function (err, resp) {
		track_data.elements(resp);
		obj.on_success();
	    }); 
	};

	epeek.utils.api (update_track)
	    .getset ('url', '');

	return update_track;
    };

    epeek.track.retriever.ensembl = function() {
	var success = [function () {}];
	var endpoint;
	var eRest = epeek.eRest();
	var update_track = function(obj) {
            // Object has loc and a plug-in defined callback
            var loc         = obj.loc;
            var plugin_cbak = obj.on_success;
            eRest.call({url     : eRest.url[update_track.endpoint()](loc),
			success : function (resp) {
                            track_data.elements(resp);

                        // User-defined
                            for (var i=0; i<success.length; i++) {
				success[i](resp);
                            };

                        // Plug-in defined
                            plugin_cbak();
			}
                       });

	};

	epeek.utils.api(update_track)
	    .getset('endpoint');

    // TODO: We don't have a way of resetting the success array
    // TODO: Should this also be included in the sync retriever?
    // Still not sure this is the best option to support more than one callback
	update_track.success = function (callback) {
            if (!arguments.length) {
		return success;
            }
            success.push(callback);
            return update_track;
	};

	return update_track;
    };


    return track_data;
};


// A predefined track for genes
epeek.track.data.gene = function () {
    var track = epeek.track.data();
	// .index("ID");

    var updater = epeek.track.retriever.ensembl()
	.endpoint("region")
    // TODO: If success is defined here, means that it can't be user-defined
    // is that good? enough? API?
    // UPDATE: Now success is backed up by an array. Still don't know if this is the best option
	.success(function(genes) {
	    for (var i = 0; i < genes.length; i++) {
		if (genes[i].strand === -1) {  
		    genes[i].display_label = "<" + genes[i].external_name;
		} else {
		    genes[i].display_label = genes[i].external_name + ">";
		}
	    }
	});

    return track.update(updater);
}

// A predefined track displaying no external data
// it is used for location and axis tracks for example
epeek.track.data.empty = function () {

    var track = epeek.track.data();
    var updater = epeek.track.retriever.sync();
    track.update(updater);

    return track;
};

epeek.track.layout = {};

epeek.track.layout.identity = function () {
    // vars exposed in the API:
    var elements;

    // The returned closure / object
    var l = function (new_elements) {
	elements = new_elements;
    }

    var api = epeek.utils.api (l)
	.method ({ height   : function () {},
		   elements : function () {return elements}
		 });

    return l;
};

// The overlap detector used for genes
epeek.track.layout.feature = function() {
    // Private vars
    var max_slots;

    // vars exposed in the API:
    var conf = {
	height   : 150,
	scale    : undefined,
    };

    var conf_ro = {
	elements : []
    };

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
    var genes_layout = function (new_genes, scale) {

	// We make sure that the genes have name
	for (var i = 0; i < new_genes.length; i++) {
	    if (new_genes[i].external_name === null) {
		new_genes[i].external_name = "";
	    }
	}

	max_slots = ~~(conf.height / slot_types.expanded.slot_height) - 1;

	if (scale !== undefined) {
	    genes_layout.scale(scale);
	}

	slot_keeper(new_genes, conf_ro.elements);
	var needed_slots = collition_detector(new_genes);
	if (needed_slots > max_slots) {
	    current_slot_type = 'collapsed';
	} else {
	    current_slot_type = 'expanded';
	}

	conf_ro.elements = new_genes;
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

	for (var i = 0; i < genes_to_place.length; i++) {
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
	    if (query_gene.ID === subj_gene.ID) {
		continue;
	    }
            var y_label_end = subj_gene.display_label.length * 8 + conf.scale(subj_gene.start); // TODO: It may be better to have a fixed font size (instead of the hardcoded 16)?
            var y1  = conf.scale(subj_gene.start);
            var y2  = conf.scale(subj_gene.end) > y_label_end ? conf.scale(subj_gene.end) : y_label_end;
	    var x_label_end = query_gene.display_label.length * 8 + conf.scale(query_gene.start);
            var x1 = conf.scale(query_gene.start);
            var x2 = conf.scale(query_gene.end) > x_label_end ? conf.scale(query_gene.end) : x_label_end;
            if ( ((x1 < y1) && (x2 > y1)) ||
		 ((x1 > y1) && (x1 < y2)) ) {
		return false;
            }
	}
	return true;
    };

    var slot_keeper = function (genes, prev_genes) {
	var prev_genes_slots = genes2slots(prev_genes);

	for (var i = 0; i < genes.length; i++) {
            if (prev_genes_slots[genes[i].ID] !== undefined) {
		genes[i].slot = prev_genes_slots[genes[i].ID];
            }
	}
    };

    var genes2slots = function (genes_array) {
	var hash = {};
	for (var i = 0; i < genes_array.length; i++) {
            var gene = genes_array[i];
            hash[gene.ID] = gene.slot;
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
    var api = epeek.utils.api (genes_layout)
	.getset (conf)
	.get (conf_ro)
	.method ({
	    gene_slot : gene_slot
	});

    return genes_layout;
};

// FEATURE VIS
epeek.track.feature = function () {

    ////// Vars exposed in the API
    var exports = {
	create  : function () {throw "create_elem is not defined in the base feature object"},
	mover   : function () {throw "move_elem is not defined in the base feature object"},
	updater : function () {},
	info    : function () {},
	guider  : function () {},
	index   : undefined,
	layout  : epeek.track.layout.identity(),
	foreground_color : '#000'
    };


    // The returned object
    var feature = {};

    var reset = function () {
    	var track = this;
    	track.g.selectAll(".ePeek_elem").remove();
    };

    var init = function (width) {
	var track = this;
	exports.guider.call(track, width);
    };

    var plot = function (new_elems, track, xScale) {
	new_elems.on("click", exports.info);
	// new_elem is a g element where the feature is inserted
	exports.create.call(track, new_elems, xScale);
    };

    var update = function (xScale, field) {
	var track = this;
	var svg_g = track.g;
	var layout = exports.layout;

	var elements = track.data().elements();
	if (field !== undefined) {
	    elements = elements[field];
	}

	layout(elements, xScale);
	var data_elems = layout.elements();

	var vis_elems;
	if (field !== undefined) {
	    vis_elems = svg_g.selectAll(".ePeek_elem_" + field)
		.data(data_elems, exports.index);
	} else {
	    vis_elems = svg_g.selectAll(".ePeek_elem")
		.data(data_elems, function (d) {
		    if (d !== undefined) {
			return exports.index(d);
		    }
		})
		// .data(data_elems, exports.index);
	}

	exports.updater.call(track, vis_elems, xScale);

	var new_elem = vis_elems
	    .enter();

	new_elem
	    .append("g")
	    .attr("class", "ePeek_elem")
	    .classed("ePeek_elem_" + field, field)
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
	    elems = svg_g.selectAll(".ePeek_elem_" + field);
	} else {
	    elems = svg_g.selectAll(".ePeek_elem");
	}

	exports.mover.call(this, elems, xScale);
    };

    var move_to_front = function (field) {
	if (field !== undefined) {
	    var track = this;
	    var svg_g = track.g;
	    svg_g.selectAll(".ePeek_elem_" + field).move_to_front();
	}
    };

    // API
    epeek.utils.api (feature)
	.getset (exports)
	.method ({
	    reset  : reset,
	    plot   : plot,
	    update : update,
	    move   : move,
	    init   : init,
	    move_to_front : move_to_front
	});

    return feature;
};

epeek.track.feature.composite = function () {
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

    // API
    epeek.utils.api (features)
	.method ({
	    reset  : reset,
	    update : update,
	    move   : move,
	    init   : init,
	    add    : add
	});


    return features;
};

epeek.track.feature.sequence = function () {
    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature();

    var seq = function (d) {
	return d.sequence;
    };

    feature.sequence = function (cbak) {
	if (!arguments.length) {
	    return seq;
	}
	seq = cbak;
	return feature;
    };

    feature.create (function (new_nts, xScale) {
	var track = this;

	new_nts
	    .append("text")
	    .attr("fill", track.background_color())
	    .attr('fontsize', 10)
	    .attr("x", function (d) {
		return xScale (d.pos);
	    })
	    .attr("y", function (d) {
		return ~~(track.height() / 2) + 5; 
	    })
	    .text(feature.sequence())
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

epeek.track.feature.gene = function () {

    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature()
	.layout(epeek.track.layout.feature())
	.index(function (d) {
	    return d.ID;
	});

    var tooltip = function () {
        var tooltip = epeek.tooltip.table();
        var gene_tooltip = function(gene) {
            var obj = {};
            obj.header = {
                label : "HGNC Symbol",
                value : gene.external_name
            };
            obj.rows = [];
            obj.rows.push( {
                label : "Name",
                value : "<a href=''>" + gene.ID  + "</a>"
            });
            obj.rows.push( {
                label : "Gene Type",
                value : gene.biotype
            });
            obj.rows.push( {
                label : "Location",
                value : "<a href=''>" + gene.seq_region_name + ":" + gene.start + "-" + gene.end  + "</a>"
            });
            obj.rows.push( {
                label : "Strand",
                value : (gene.strand === 1 ? "Forward" : "Reverse")
            });
            obj.rows.push( {
                label : "Description",
                value : gene.description
            });

            tooltip.call(this, obj);
        };

        return gene_tooltip;
    };


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
		    return d.color
		}
	    });

	new_elems
	    .append("text")
	    .attr("class", "ePeek_name")
	    .attr("x", function (d) {
		return xScale(d.start);
	    })
	    .attr("y", function (d) {
		return (feature.layout().gene_slot().slot_height * d.slot) + 25;
	    })
	    .attr("fill", track.background_color())
	    .text(function (d) {
		if (feature.layout().gene_slot().show_label) {
		    return d.display_label
		} else {
		    return ""
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
	    })
    });

    epeek.utils.api (feature)
	.method ({
	    tooltip : tooltip
	});


    return feature;
};

epeek.track.feature.area = function () {
    var feature = epeek.track.feature.line();
    var line = feature.line();

    var area = d3.svg.area()
	.interpolate(line.interpolate())
	.tension(feature.tension());

    var data_points;

    var line_create = feature.create(); // We 'save' line creation
    feature.create (function (points, xScale) {
	var track = this;

	if (data_points !== undefined) {
	    // return;
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
	    .attr("class", "ePeek_area")
	    .classed("ePeek_elem", true)
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
	    .select(".ePeek_area")
	    .datum(data_points)
	    .attr("d", area);
    });

    return feature;

};

epeek.track.feature.line = function () {
    var feature = epeek.track.feature();

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

    feature.tension = function (t) {
	if (!arguments.length) {
	    return tension;
	}
	tension = t;
	return feature;
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
	    .x(function (d) {return xScale(x(d))})
	    .y(function (d) {return track.height() - yScale(y(d))})

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
	    .attr("class", "ePeek_elem")
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

epeek.track.feature.conservation = function () {
    // 'Inherit' from epeek.track.feature.area
    var feature = epeek.track.feature.area();

    var area_create = feature.create(); // We 'save' area creation
    feature.create  (function (points, xScale) {
	var track = this;

	area_create.call(track, d3.select(points[0][0]), xScale)
    });

    return feature;
};

epeek.track.feature.ensembl = function () {
    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature();

    feature.guider (function (width) {
	var track = this;
	var height_offset = ~~(track.height() - (track.height()  * .8)) / 2;

	track.g
	    .append("line")
	    .attr("x1", 0)
	    .attr("x2", width)
	    .attr("y1", height_offset)
	    .attr("y2", height_offset)
	    .style("stroke", feature.foreground_color())
	    .style("stroke-width", 1);

	track.g
	    .append("line")
	    .attr("x1", 0)
	    .attr("x2", width)
	    .attr("y1", track.height() - height_offset)
	    .attr("y2", track.height() - height_offset)
	    .style("stroke", feature.foreground_color())
	    .style("stroke-width", 1);

    });

    feature.create (function (new_elems, xScale) {
	var track = this;

	var height_offset = ~~(track.height() - (track.height()  * .8)) / 2;

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
		    return feature.foreground_color();
		}
		return d3.rgb(feature.foreground_color()).brighter(); //.brighter();
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

    return feature;
};

epeek.track.feature.vline = function () {
    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature();

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

epeek.track.feature.block = function () {
    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature();

    feature.create(function (new_elems, xScale) {

	var track = this;
	new_elems
	    .append("rect")
	    .attr("x", function (d) {
		// TODO: start, end should be adjustable via the tracks API
		return xScale(d.start);
	    })
	    .attr("y", 0)
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
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

epeek.track.feature.pin = function () {
    // The path to the current ePeek.js script. Needed to reach the pngs
    var path = epeek.utils.script_path("ePeek.js");
    var pin_color = "red";
//    var pin_url = path + "lib/pins/pin_red.png";
    var pins_icons = [path + "lib/pins/pin_red.png",
                      path + "lib/pins/pin_blue.png",
                      path + "lib/pins/pin_green.png",
                      path + "lib/pins/pin_yellow.png",
                      path + "lib/pins/pin_magenta.png",
                      path + "lib/pins/pin_gray.png"];


    // 'Inherit' from epeek.track.feature
    var feature = epeek.track.feature();

    feature.pin_color = function(c) {
        if (!arguments.length) {
            return pin_color;
        }
        pin_color = c;
        if (c === "red") {
            feature.pin_url (pins_icons[0]);
        }
        if (c === "blue") {
            feature.pin_url (pins_icons[1]);
        }
        if (c === "green") {
            feature.pin_url (pins_icons[2]);
        }
        return feature;
    };


    feature.create(function (new_elems, xScale) {
	var track = this;
	new_elems
	    .append("image")
	    .attr("xlink:href", feature.pin_url())
	    .attr("x", function (d) {
		return xScale(d.pos)
	    })
	    .attr("y", track.height() - 25)
	    .attr("width", "20px")
	    .attr("height", "20px");
    });

    feature.mover(function (pins, xScale) {
	pins
	    .select("image")
	    .attr("x", function (d) {
		return xScale(d.pos);
	    });
    });

    epeek.utils.api (feature)
	.getset ('pin_url', path + "lib/pins/pin_red.png");

    return feature;
};

epeek.track.feature.axis = function () {
    var xAxis;
    var orientation = "top";

    // Axis doesn't inherit from epeek.track.feature
    var feature = {};
    feature.reset = function () {
	xAxis = undefined;
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

epeek.track.feature.location = function () {
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

"use strict"

epeek.track.genome = function() {

    // Private vars
    var ens_re = /^ENS\w+\d+$/;
    var eRest = epeek.eRest();
    var chr_length;

    // Vars exposed in the API
    var conf = {
	gene           : undefined,
	xref_search    : function () {},
	ensgene_search : function () {},
    };
    var gene;
    var limits = {
        left : 0,
	right : undefined,
	zoom_out : eRest.limits.region,
	zoom_in  : 200
    };


    // We "inherit" from track
    var genome_browser = epeek.track();

    // The location and axis track
    var location_track = epeek.track.track()
	.height(20)
	.background_color("white")
	.data(epeek.track.data.empty())
	.display(epeek.track.feature.location());

    var axis_track = epeek.track.track()
	.height(20)
	.background_color("white")
	.data(epeek.track.data.empty())
	.display(epeek.track.feature.axis());

    genome_browser
	.add_track(location_track)
	.add_track(axis_track);

    // Default location:
    genome_browser.species("human");
    genome_browser.chr(7);
    genome_browser.from(139424940);
    genome_browser.to(141784100);

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

	    eRest.call({url : eRest.url.chr_info ({species : where.species,
						   chr     : where.chr
						  }),
			success : function (resp) {
			    done(resp.length);
			}
		       });
	});
	genome_browser._start();
    };

     var homologues = function (ensGene, callback)  {
	eRest.call({url : eRest.url.homologues ({id : ensGene}),
		    success : function(resp) {
			var homologues = resp.data[0].homologies;
			if (callback !== undefined) {
			    var homologues_obj = split_homologues(homologues)
			    callback(homologues_obj);
			}
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
	    eRest.call({url : eRest.url.xref ({ species : where.species,
						name    : where.gene 
					      }
					     ),
			success : function(resp) {
			    resp = resp.filter(function(d) {
				return !d.id.indexOf("ENS");
			    });
			    if (resp[0] !== undefined) {
				conf.xref_search(resp);
				get_ensGene(resp[0].id)
			    } else {
				genome_browser.start();
			    }
			}
		       }
		      );
	}
    };

    var get_ensGene = function (id) {
	eRest.call({url     : eRest.url.gene ({id : id}),
		    success : function(resp) {
			conf.ensgene_search(resp);

			genome_browser
			    .species(resp.species)
			    .chr(resp.seq_region_name)
			    .from(resp.start)
			    .to(resp.end);

			genome_browser.start( { species : resp.species,
					  chr     : resp.seq_region_name,
					  from    : resp.start,
					  to      : resp.end
					} );
		    }
		   });
    };

    var split_homologues = function (homologues) {
	var orthoPatt = /ortholog/;
	var paraPatt = /paralog/;

	var orthologues = homologues.filter(function(d){return d.type.match(orthoPatt)});
	var paralogues  = homologues.filter(function(d){return d.type.match(paraPatt)});

	return {'orthologues' : orthologues,
		'paralogues'  : paralogues};
    };

    var api = epeek.utils.api(genome_browser)
	.getset (conf);

    api.method ({
	start      : start,
	homologues : homologues
    });

    return genome_browser;
};


epeek.eRest = function() {

    // Prefixes to use the REST API.
    // These are modified in the localREST setter
    var prefix = "http://beta.rest.ensembl.org";
    var prefix_region = prefix + "/feature/region/";
    var prefix_ensgene = prefix + "/lookup/id/";
    var prefix_xref = prefix + "/xrefs/symbol/";
    var prefix_homologues = prefix + "/homology/id/";
    var prefix_chr_info = prefix + "/assembly/info/";
    var prefix_aln_region = prefix + "/alignment/block/region/";
    var prefix_gene_tree = prefix + "/genetree/id/";

    // Number of connections made to the database
    var connections = 0;

    /** eRest gets a new object to interact with the Ensembl REST server
	@namespace
	@alias epeek.eRest
	@example
	var eRest = epeek.eRest();
	eRest.call( {
	   url     : eRest.url("species_gene", {species : "human", gene_name : "BRCA1"}),
       success : function (resp) {
	   // resp contains the response from the REST server
	   }
	} );
    */
    var eRest = function() {
    };

    // Limits imposed by the ensembl REST API
    eRest.limits = {
	region : 5000000
    };

    var api = epeek.utils.api (eRest);


    /** <strong>localREST</strong> points the queries to a local REST service to debug.
	TODO: This method should be removed in "production"
    */
    api.method ('localREST', function() {
	prefix = "http://127.0.0.1:3000";
	prefix_region = prefix + "/feature/region/";
	prefix_ensgene = prefix + "/lookup/id/";
	prefix_xref = prefix + "/xrefs/symbol/";
	prefix_homologues = prefix + "/homology/id/";

	return eRest;
    });

    /** <strong>call</strong> makes an asynchronous call to the ensembl REST service.
	@param {Object} object - A literal object containing the following fields:
	<ul>
	<li>url => The rest URL. This is returned by {@link eRest.url}</li>
	<li>success => A callback to be called when the REST query is successful (i.e. the response from the server is a defined value and no error has been returned)</li>
	<li>error => A callback to be called when the REST query returns an error
	</ul>
    */
    api.method ('call', function (obj) {
	var url = obj.url;
	var on_success = obj.success;
	var on_error   = obj.error;
	connections++;
	d3.json (url, function (error, resp) {
	    connections--;
	    if (resp !== undefined && error === null && on_success !== undefined) {
		on_success(resp);
	    }
	    if (error !== null && on_error !== undefined) {
		on_error(error);
	    }
	});
    });


    eRest.url = {};
    var url_api = epeek.utils.api (eRest.url);
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
	return prefix_region +
	    obj.species +
	    "/" +
	    obj.chr +
	    ":" + 
	    obj.from + 
	    "-" + obj.to + 
	    ".json?feature=gene";
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
	return prefix_xref +
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
	return prefix_homologues +
	    obj.id + 
	    ".json?format=condensed;sequence=none;type=all";
    });

	/** eRest.url.<strong>gene</strong> returns the ensembl REST url to retrieve the ensembl gene associated with
	    the given ID
	    @param {object} obj - An object literal with the following fields:<br />
<ul>
<li>id : The name of the gene</li>
</ul>
            @returns {string} - The url to query the Ensembl REST server. For an example of output of these urls see the {@link http://beta.rest.ensembl.org/lookup/ENSG00000139618.json?format=full|Ensembl REST API example}
	    @example
eRest.call ( url     : eRest.url.gene ({ id : "ENSG00000139618" }),
             success : callback,
             error   : callback
	   );
	 */
    url_api.method ('gene', function(obj) {
	return prefix_ensgene +
	    obj.id +
	    ".json?format=full";
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
	return prefix_chr_info +
	    obj.species +
	    "/" +
	    obj.chr +
	    ".json?format=full";
    });

	// TODO: For now, it only works with species_set and not species_set_groups
	// Should be extended for wider use
    url_api.method ('aln_block', function (obj) {
	var url = prefix_aln_region + 
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

    url_api.method ('gene_tree', function (obj) {
	return prefix_gene_tree +
	    obj.id + 
	    ".json?sequence=" +
	    ((obj.sequence || obj.aligned) ? 1 : "none") +
	    (obj.aligned ? '&aligned=1' : '');
    });

    api.method ('connections', function() {
	return connections;
    });

    return eRest;
};
epeek.tree = function () {
 "use strict";

    var conf = {
	duration         : 500,      // Duration of the transitions
	label            : epeek.tree.label.text(),
	layout           : epeek.tree.layout.vertical(),
	node_info        : function () {},
	node_dbl_info    : function () {},
	link_color       : 'steelblue',
	node_color       : 'steelblue',
	node_circle_size : 4.5,
    };

    // Extra delay in the transitions (TODO: Needed?)
    var delay = 0;

    // Ease of the transitions
    var ease = "cubic-in-out";

    // If labels should be skipped
    // TODO: Replace this with a valid epeek.tree.label that does nothing
    // var skip_labels = false;

    // TODO: Don't know if this is useful or not
    // Probably this can go and see if this can be set with the API
    var curr_species = "Homo_sapiens";

    // By node data
    var sp_counts = {};
 
    var scale = false;

    // The id of the tree container
    var div_id;

    // The tree visualization (svg)
    var svg;
    var vis;

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
    var tree = function (div) {
	div_id = d3.select(div).attr("id");

        var tree_div = d3.select(div)
            .append("div")
	    .attr("class", "ePeek_groupDiv");

	var cluster = conf.layout.cluster;

	var n_leaves = curr.tree.get_all_leaves().length;

	var max_leaf_label_length = function (tree) {
	    var max = 0;
	    var leaves = tree.get_all_leaves();
	    for (var i=0; i<leaves.length; i++) {
		var label_width = conf.label.width()(leaves[i].data());
		if (label_width > max) {
		    max = label_width;
		}
	    }
	    return max;
	};


	var max_label_length = max_leaf_label_length(curr.tree);
	conf.layout.max_leaf_label_width(max_label_length);

	// Cluster size is the result of...
	// total width of the vis - transform for the tree - max_leaf_label_width - horizontal transform of the label
	// TODO: Substitute 15 by the horizontal transform of the nodes
	var cluster_size_params = {
	    n_leaves : n_leaves,
	    label_height : d3.functor(conf.label.height())(),
	    label_padding : 15
	};

// 	cluster.size([n_leaves * conf.label.height()(),
// 		      (conf.layout.width() - conf.layout.max_leaf_label_width() - conf.layout.translate_vis[0]) - 15]);

	conf.layout.adjust_cluster_size(cluster_size_params);

	var diagonal = conf.layout.diagonal();
	var transform = conf.layout.transform_node;

	svg = tree_div
	    .append("svg")
	    .attr("width", conf.layout.width())
//	    .attr("height", (n_leaves * label.height()()) + 20)
	    .attr("height", conf.layout.height(cluster_size_params) + 30)
	    .attr("fill", "none");

	vis = svg
	    .append("g")
	    .attr("id", "ePeek_st_" + div_id)
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
	var link = vis.selectAll("path.ePeek_tree_link")
	    .data(curr.links, function(d){return d.target._id});
	link
	    	.enter()
		.append("path")
	    	.attr("class", "ePeek_tree_link")
	    	.attr("id", function(d) {
	    	    return "ePeek_tree_link_" + div_id + "_" + d.target._id;
	    	})
	    	.attr("fill", "none")
	    	.style("stroke", conf.link_color)
		.attr("d", diagonal);	    

	// NODES
	var node = vis.selectAll("g.ePeek_tree_node")
	    .data(curr.nodes, function(d) {return d._id});

	var new_node = node
	    .enter().append("g")
	    .attr("class", function(n) {
		if (n.children) {
		    if (n.depth == 0) {
			return "root ePeek_tree_node"
		    } else {
			return "inner ePeek_tree_node"
		    }
		} else {
		    return "leaf ePeek_tree_node"
		}
	    })
	    .attr("id", function(d) {
		return "ePeek_tree_node_" + div_id + "_" + d._id
	    })
	    .attr("transform", transform);

	// new_node.on("click", tree.node_info_callback);

	new_node
	    .append('circle')
	    .attr("r", conf.node_circle_size)
	    .attr('fill', conf.node_color)
	    .attr('stroke', '#369')
	    .attr('stroke-width', '2px');

	new_node.on("click", conf.node_info);
	new_node.on("dblclick", conf.node_dbl_info);

	new_node
	    .each(conf.label);

	// Node labels only on leaves
	// But only if skip_labels is false
// 	if (!skip_labels) {
// 	    // LABELS
// 	    new_node
// 		.append("text")
// 		.attr("class", "ePeek_tree_label")
// 		.style("fill", function(d) {return d.children === undefined ? fgColor : bgColor})
// 	    // .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
// 	    // .attr("transform", function(d) {return "translate(10 5)" + layout === "vertical" ? "" : ("rotate(" + (d.x < 180 ? 0 : 180) + ")")})
// 		.attr("transform", function(d) { return "translate(10 5)" })
// 		.text(function(d) {var label = d.name.replace(/_/g, ' ');
// 				   var species_name = d.name.charAt(0).toLowerCase() + d.name.slice(1);
// 				   label = label + ((sp_counts[species_name] !== undefined)  ?
// 						    " [" + (sp_counts[species_name].length) + "]" :
// 						    "");
// 				   return label;})
	    
// 	}

	// Update plots an updated tree
	api.method ('update', function() {
	    var cluster = conf.layout.cluster;
	    var diagonal = conf.layout.diagonal();
	    var transform = conf.layout.transform_node;

	    // var max_leaf_label_length = function (tree) {
	    // 	var max = 0;
	    // 	var leaves = tree.get_all_leaves();
	    // 	for (var i=0; i<leaves.length; i++) {
	    // 	    var label_width = conf.label.width()(leaves[i].data());
	    // 	    if (label_width > max) {
	    // 		max = label_width;
	    // 	    }
	    // 	}
	    // 	return max;
	    // };


	    var max_label_length = max_leaf_label_length(curr.tree);
	    conf.layout.max_leaf_label_width(max_label_length);

	    // Cluster size is the result of...
	    // total width of the vis - transform for the tree - max_leaf_label_width - horizontal transform of the label
	// TODO: Substitute 15 by the transform of the nodes (probably by selecting one node assuming all the nodes have the same transform
	    var n_leaves = curr.tree.get_all_leaves().length;
	    var cluster_size_params = {
		n_leaves : n_leaves,
		label_height : d3.functor(conf.label.height())(),
		label_padding : 15
	    };
	    conf.layout.adjust_cluster_size(cluster_size_params);
// 	    cluster.size([n_leaves * conf.label.height()(),
// 			  (layout.width() - layout.max_leaf_label_width() - layout.translate_vis[0]) - 15]);

	    svg
		.transition()
		.duration(conf.duration)
		.ease(ease)
		.attr("height", conf.layout.height(cluster_size_params) + 30); // height is in the layout
//		.attr("height", (n_leaves * label.height()()) + 20);

	    vis
		.transition()
		.duration(conf.duration)
		.attr("transform",
		      "translate(" +
		      conf.layout.translate_vis()[0] +
		      "," +
		      conf.layout.translate_vis()[1] +
		      ")");
	    
	    // Set up the current tree
	    // var nodes = curr.tree.cluster(cluster).nodes();
	    // var links = cluster.links(nodes);
	    // curr.nodes = curr.tree.cluster(cluster).nodes();
	    curr.nodes = cluster.nodes(curr.data);
	    conf.layout.scale_branch_lengths(curr);
	    // scale_branch_lengths();
	    // phylo(curr.nodes[0], 0);
	    curr.links = cluster.links(curr.nodes);

            // NODES
	    var node = vis.selectAll("g.ePeek_tree_node")
		.data(curr.nodes, function(d) {return d._id});

	    // LINKS
	    var link = vis.selectAll("path.ePeek_tree_link")
		.data(curr.links, function(d){return d.target._id});
	    
	    var exit_link = link
		.exit()
		.remove();
	    

	    // New links are inserted in the prev positions
	    link
		.enter()
		.append("path")
		.attr("class", "ePeek_tree_link")
		.attr("id", function (d) {
		    return "ePeek_tree_link_" + div_id + "_" + d.target._id;
		})
		.attr("fill", "none")
		.attr("stroke", conf.link_color)
		.attr("d", diagonal);

	    // Move the links to their final position, but keeping the integrity of the tree
// 	    link
// 	    	.filter(select_links_to_be_pushed)
// 	    	.each(function(d) {pull_parent.call(this, d, 0)});

	    link
	    //  TODO: Here we will be moving links that have been already moved in the previous filter
	    //  if transitions are slow, this is a good place to optimize
	    	.transition()
		.ease(ease)
	    	.duration(conf.duration)
//	    	.delay((max_depth_exit_node + entering_links) * conf.duration) // TODO: I changed this (from 1). Not sure it is correct
//		.delay(get_new_link_delay)
	    	.attr("d", diagonal);


	    // New nodes are created without radius
	    // The radius is created after the links
	    var new_node = node
		.enter()
		.append("g")
		.attr("class", function(n) {
		    if (n.children) {
			if (n.depth == 0) {
			    return "root ePeek_tree_node"
			} else {
			    return "inner ePeek_tree_node"
			}
		    } else {
			return "leaf ePeek_tree_node"
		    }
		})
		.attr("id", function (d) {
		    return "ePeek_tree_node_" + div_id + "_" + d._id;
		})
		.attr("transform", transform);
   
	    new_node
		.append('circle')
		.attr("r", 1e-6)
		.attr('stroke', '#369')
		.attr('stroke-width', '2px')
		.transition()
		.duration(conf.duration)
		.attr("r", conf.node_circle_size);

	    new_node.on("click", conf.node_info);
	    new_node.on("dblclick", conf.node_dbl_info);

	    node.each(conf.label.remove);
	    node.each(conf.label);

	    // node color is a dynamic property
	    node.select("circle").attr('fill', conf.node_color);
	    
	    // Node labels only on leaves
	    // But only if skip_labels is false
// 	    if (!skip_labels) {
// 		new_node
// 		    .append("text")
// 		    .attr("class", "ePeek_tree_label")
// 		    .style("fill", function(d) {return d.children === undefined ? fgColor : bgColor})
// 		// .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
// 		// .attr("transform", function(d) {return "translate(10 5)" + layout === "vertical" ? "" : ("rotate(" + (d.x < 180 ? 0 : 180) + ")")})
// 		    .attr("transform", function(d) { return "translate(10 5)" })
// 		    .text("")
// 		    .transition()
// 		    .duration(conf.duration)
// //		    .delay((max_depth_exit_node + entering_links + 1) * conf.duration)
// 		    .text(function(d) {var label = d.name.replace(/_/g, ' ');
// 				       var species_name = d.name.charAt(0).toLowerCase() + d.name.slice(1);
// 				       label = label + ((sp_counts[species_name] !== undefined)  ?
// 							" [" + (sp_counts[species_name].length) + "]" :
// 							"");
// 				       return label;})
// 	    }

	    node
		.transition()
		.ease(ease)
		.duration(conf.duration)
		.attr("transform", transform);

	    // Exiting nodes are just removed
	    node
		.exit()
		.remove();
	});
    };

    // API
    var api = epeek.utils.api (tree)
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
	var newtree = epeek.tree.tree(base.data);

	// The nodes are marked because we want to be able to join data after selecting a subtree
	// var i = epeek.misc.iteratorInt();
	// newtree.apply(function(d) {d.property('__epeek_id__', i())});
	// newtree.apply(function(d) {d.property('__inSubTree__', {prev : true, curr : true})});

	tree.tree(newtree);
	return tree;
    });

    // TODO: Rewrite tree using getset / finalizers & transforms
    api.method ('tree', function (t) {
    	if (!arguments.length) {
    	    return base.tree;
    	}

	// The original tree is stored as the base, prev and curr tree
    	base.tree = t;
	curr.tree = base.tree;
//	prev.tree = base.tree;
    	return tree;
    });

    api.method ('subtree', function (curr_nodes) {
	// var curr_nodes = [];
	// var orig_tree = tree.tree();
	// var orig_data = tree.data();
	// for (var i=0; i<node_names.length; i++) {
	//     var node = orig_tree.find_node_by_name(node_names[i]);
	//     curr_nodes.push(orig_tree.find_node_by_name(node_names[i]));
	// }
	var subtree = base.tree.subtree(curr_nodes);
	curr.data = subtree.data();
	curr.tree = subtree;

	return tree;
    });

    api.method ('toggle_node', function (node_data) {
	tree.tree().toggle_node(node_data);
	return tree;
    });

    api.method ('focus_node', function (node_data) {
	// find 
	var found_node = tree.tree().find_node_by_field(node_data._id, '_id');
	tree.subtree(found_node.get_all_leaves());

	return tree;
    });

//     tree.subtree = function (node_names) {
// 	// We have to first clean the previous subtree (if any)
// 	// This means un-marking the nodes in the subtree:
// 	base.tree.apply(function(d){
// 	    d.property('__inSubTree__').prev = d.property('__inSubTree__').curr
// 	})
// 	base.tree.apply(function(d){
// 	    d.property('__inSubTree__').curr = false
// 	});

// 	var orig_tree = tree.tree();
// 	var orig_data = tree.data();

// 	//  We set up the prev data and tree
// // 	var prev_data = copy_node(curr.data);
// // 	for (var i=0; i<curr.data.children.length; i++) {
// // 	    copy_data (curr.data.children[i], prev_data, function(d) {return true});
// // 	}
// // 	prev.data = prev_data;
// // 	prev.tree = epeek.tree(prev.data);

// 	//  We set up the curr data and tree
// 	var curr_nodes = [];
// 	for (var i=0; i<node_names.length; i++) {
// 	    curr_nodes.push(orig_tree.find_node_by_name(orig_data,node_names[i]));
// 	}

// 	for (var i=0; i<curr_nodes.length; i++) {
// 	    orig_tree.upstream(curr_nodes[i], function(d) {
// 		d.property('__inSubTree__').curr = true
// 	    });
// 	}
	
// 	var curr_data = copy_node(orig_data);
// 	for (var i=0; i<orig_data.children.length; i++) {
//             copy_data (orig_data.children[i], curr_data, function(d) {
// 		return ((d.__inSubTree__.curr) && (!is_singleton(d)));
// 	    });
// 	}

// 	curr.data = curr_data;
// 	curr.tree = epeek.tree.tree(curr.data);

// 	return tree;
//     };


    // TODO: copy_data is not a good name for this
//     var copy_data = function (orig_data, sub_data, condition) {
// 	if (orig_data === undefined) {
// 	    return;
// 	}

// 	if (condition(orig_data)) {
// 	    var copy = copy_node(orig_data);

// 	    if (sub_data.children === undefined) {
// 		sub_data.children = [];
// 	    }
// 	    sub_data.children.push(copy);
// 	    if (orig_data.children === undefined) {
// 		return;
// 	    }
// 	    for (var i = 0; i < orig_data.children.length; i++) {
// 		copy_data (orig_data.children[i], copy, condition);
// 	    }
// 	} else {
// 	    if (orig_data.children === undefined) {
// 		return;
// 	    }
// 	    for (var i = 0; i < orig_data.children.length; i++) {
// 		copy_data(orig_data.children[i], sub_data, condition);
// 	    }
// 	}
//     };

//     var is_singleton = function (node) {
// 	var n_children = 0;
// 	if (node.children === undefined) {
// 	    return false;
// 	}

// 	for (var i = 0; i < node.children.length; i++) {
// 	    if (node.children[i].property('__inSubTree__').curr) {
// 		n_children++;
// 	    }
// 	}

// 	if (n_children === 1) {
// 	    node.property('__inSubTree__').curr = false;
// 	}

// 	return n_children === 1;
//     };

//     var copy_node = function (node) {
// 	var copy = {};
// 	for (var param in node) {
// 	    if ((param === "children") || (param === "children") || (param === "parent")) {
// 		continue;
// 	    }
// 	    if (node.hasOwnProperty(param)) {
// 		copy[param] = node[param];
// 	    }
// 	}
// 	return copy;
//     };

    var swap_nodes = function (src, dst) {
	var copy = copy_node (dst);
	dst = src;
	src = copy;
	return;
    };

    api.method ('tooltip', function () {
	// var tooltip = epeek.tooltip().type("table");
	var tooltip = epeek.tooltip.table();
	var tree_tooltip = function (node) {
	    var obj = {};
	    obj.header = {
		label : "Name",
		value : node.name
	    };
	    obj.rows = [];
	    obj.rows.push({
		label : "_id",
		value : node._id
	    });
	    obj.rows.push({
		label : "Depth",
		value : node.depth
	    });
	    obj.rows.push({
		label : "Length",
		value : node.length
	    });
	    obj.rows.push({
		label : "N.Children",
		value : node.children ? node.children.length : 0
	    });

	tooltip.call(this, obj);
	};

	return tree_tooltip;
    });

    // tree.update = function() {

    // 	var t = function(sp_counts) {
    // 	    reset_tree(species_tree);
    // 	    var sp_names = get_names_of_present_species(sp_counts);
    // 	    var present_nodes  = get_tree_nodes_by_names(species_tree, sp_names);
    // 	    var lca_node = epeek_tree.lca(present_nodes)

    // 	    decorate_tree(lca_node);
    // 	    nodes_present(species_tree, present_nodes);

    // 	    vis.selectAll("path.link")
    // 		.data(cluster.links(epeek_tree))
    // 		.transition()
    // 		.style("stroke", function(d){
    // 	    	    if (d.source.real_present === 1) {
    // 	    		return fgColor;
    // 	    	    }
    // 	    	    if (d.source.present_node === 1) {
    // 	    		return bgColor;
    // 	    	    }
    // 	    	    return "fff";
    // 		});

    // 	    vis.selectAll("circle")
    // 		.data(epeek_tree.filter(function(n) { return n.x !== undefined; }))
    // 		.attr("class", function(d) {
    // 		    if (d.real_present) {
    // 			return "present";
    // 		    }
    // 		    if (d.present_node) {
    // 			return "dubious";
    // 		    }
    // 		    return "absent";
    // 		})

    // 	    var labels = vis.selectAll("text")
    // 		.data(epeek_tree.filter(function(d) { return d.x !== undefined && !d.children; }))
    // 		.transition()
    // 		.style("fill", function (d) {
    // 		    if (d.name === tree.species()) {
    // 			return "red";
    // 		    }
    // 		    if (d.real_present === 1) {
    // 			return fgColor;
    // 		    }
    // 		    return bgColor;
    // 		    // return d.name === tree.species() ? "red" : "black"
    // 		})
    // 		.text(function(d) { var label = d.name.replace(/_/g, ' ');
    // 				    var species_name = d.name.charAt(0).toLowerCase() + d.name.slice(1);
    // 				    label = label + " [" + (sp_counts[species_name] === undefined ? 0 : sp_counts[species_name].length) + "]";
    // 				    return label;
    // 				  });
    // 	    };

    // 	return t;
    // };


    // var decorate_tree = function (node) {
    // 	if (node !== undefined) {
    // 	    epeek_tree.apply(node, function(n) {n.present_node = 1});
    // 	}
    // };

    // var reset_tree = function (node) {
    // 	if (node !== undefined) {
    // 	    epeek_tree.apply(node, function(n) {n.present_node = 0; n.real_present = 0;});
    // 	}
    // }


    var nodes_present = function (tree, nodes) {
	for (var i = 0; i < nodes.length; i++) {
	    var tree_node = epeek_tree.find_node_by_name(tree, nodes[i].name);
	    if (tree_node === undefined) {
		console.log("NO NODE FOUND WITH NAME " + nodes[i]);
	    } else {
		tree_node.real_present = 1;
	    }
	}

	// TODO: Highly inefficient algorithm ahead
	var max_depth = max_tree_depth(tree);
	for (var i = 0; i < max_depth; i++) {
	    var children_present = function(node) {
		if (node.children !== undefined) {
		    if (check_children_present(node)) {
			node.real_present = 1;
		    }
		    for (var i = 0; i < node.children.length; i++) {
			children_present(node.children[i]);
		    }
		}
	    };
	    children_present(tree);
	}
    };

    var check_children_present = function(node) {
	var n_present = 0;
	for (var i = 0; i < node.children.length; i++) {
	    if (node.children[i].real_present === 1) {
		n_present++;
	    }
	}
	if (node.children.length === n_present) {
	    return true;
	}
	return false;
    }

    var max_tree_depth = function (tree, max) {
	if (max === undefined) {
	    max = 0
	}
	var this_depth = tree.depth;
	if (tree.children !== undefined) {
	    for (var i = 0; i < tree.children.length; i++) {
		return max_tree_depth(tree.children[i], this_depth > max ? this_depth : max)
	    }
	}
	return max;
    };

    var get_names_of_present_species = function (sp_nodes) {
	var names = [];
	for (var i in sp_nodes) {
	    if (sp_nodes.hasOwnProperty(i)) {
		names.push(i.charAt(0).toUpperCase() + i.slice(1));
	    }
	}
	return names;
    };

    api.method ('get_tree_nodes_by_names', function (names) {
	var nodes = [];
	for (var i = 0; i < names.length; i++) {
	    var node = tree.tree().find_node_by_name(names[i]);
	    if (node !== undefined) {
		nodes.push(node);
	    }
	}
	return nodes;
    });

    return tree;
};

//var newick_species_tree_big = "(((((((((((((((((((Escherichia_coli_EDL933:0.00000,Escherichia_coli_O157_H7:0.00000)96:0.00044,((Escherichia_coli_O6:0.00000,Escherichia_coli_K12:0.00022)76:0.00022,(Shigella_flexneri_2a_2457T:0.00000,Shigella_flexneri_2a_301:0.00000)100:0.00266)75:0.00000)100:0.00813,((Salmonella_enterica:0.00000,Salmonella_typhi:0.00000)100:0.00146,Salmonella_typhimurium:0.00075)100:0.00702)100:0.03131,((Yersinia_pestis_Medievalis:0.00000,(Yersinia_pestis_KIM:0.00000,Yersinia_pestis_CO92:0.00000)31:0.00000)100:0.03398,Photorhabdus_luminescens:0.05076)61:0.01182)98:0.02183,((Blochmannia_floridanus:0.32481,Wigglesworthia_brevipalpis:0.35452)100:0.08332,(Buchnera_aphidicola_Bp:0.27492,(Buchnera_aphidicola_APS:0.09535,Buchnera_aphidicola_Sg:0.10235)100:0.10140)100:0.06497)100:0.15030)100:0.02808,((Pasteurella_multocida:0.03441,Haemophilus_influenzae:0.03754)94:0.01571,Haemophilus_ducreyi:0.05333)100:0.07365)100:0.03759,((((Vibrio_vulnificus_YJ016:0.00021,Vibrio_vulnificus_CMCP6:0.00291)100:0.01212,Vibrio_parahaemolyticus:0.01985)100:0.01536,Vibrio_cholerae:0.02995)100:0.02661,Photobacterium_profundum:0.06131)100:0.05597)81:0.03492,Shewanella_oneidensis:0.10577)100:0.12234,((Pseudomonas_putida:0.02741,Pseudomonas_syringae:0.03162)100:0.02904,Pseudomonas_aeruginosa:0.03202)100:0.14456)98:0.04492,((Xylella_fastidiosa_700964:0.01324,Xylella_fastidiosa_9a5c:0.00802)100:0.10192,(Xanthomonas_axonopodis:0.01069,Xanthomonas_campestris:0.00934)100:0.05037)100:0.24151)49:0.02475,Coxiella_burnetii:0.33185)54:0.03328,((((Neisseria_meningitidis_A:0.00400,Neisseria_meningitidis_B:0.00134)100:0.12615,Chromobacterium_violaceum:0.09623)100:0.07131,((Bordetella_pertussis:0.00127,(Bordetella_parapertussis:0.00199,Bordetella_bronchiseptica:0.00022)67:0.00006)100:0.14218,Ralstonia_solanacearum:0.11464)100:0.08478)75:0.03840,Nitrosomonas_europaea:0.22059)100:0.08761)100:0.16913,((((((Agrobacterium_tumefaciens_Cereon:0.00000,Agrobacterium_tumefaciens_WashU:0.00000)100:0.05735,Rhizobium_meliloti:0.05114)100:0.05575,((Brucella_suis:0.00102,Brucella_melitensis:0.00184)100:0.08660,Rhizobium_loti:0.09308)51:0.02384)100:0.08637,(Rhodopseudomonas_palustris:0.04182,Bradyrhizobium_japonicum:0.06346)100:0.14122)100:0.05767,Caulobacter_crescentus:0.23943)100:0.11257,(Wolbachia_sp._wMel:0.51596,(Rickettsia_prowazekii:0.04245,Rickettsia_conorii:0.02487)100:0.38019)100:0.12058)100:0.12365)100:0.06301,((((Helicobacter_pylori_J99:0.00897,Helicobacter_pylori_26695:0.00637)100:0.19055,Helicobacter_hepaticus:0.12643)100:0.05330,Wolinella_succinogenes:0.11644)100:0.09105,Campylobacter_jejuni:0.20399)100:0.41390)82:0.04428,((Desulfovibrio_vulgaris:0.38320,(Geobacter_sulfurreducens:0.22491,Bdellovibrio_bacteriovorus:0.45934)43:0.04870)69:0.04100,(Acidobacterium_capsulatum:0.24572,Solibacter_usitatus:0.29086)100:0.20514)64:0.04214)98:0.05551,((Fusobacterium_nucleatum:0.45615,(Aquifex_aeolicus:0.40986,Thermotoga_maritima:0.34182)100:0.07696)35:0.03606,(((Thermus_thermophilus:0.26583,Deinococcus_radiodurans:0.29763)100:0.24776,Dehalococcoides_ethenogenes:0.53988)35:0.04370,((((Nostoc_sp._PCC_7120:0.12014,Synechocystis_sp._PCC6803:0.15652)98:0.04331,Synechococcus_elongatus:0.13147)100:0.05040,(((Synechococcus_sp._WH8102:0.06780,Prochlorococcus_marinus_MIT9313:0.05434)100:0.04879,Prochlorococcus_marinus_SS120:0.10211)74:0.04238,Prochlorococcus_marinus_CCMP1378:0.16170)100:0.20442)100:0.07646,Gloeobacter_violaceus:0.23764)100:0.24501)39:0.04332)51:0.02720)74:0.03471,((((Gemmata_obscuriglobus:0.36751,Rhodopirellula_baltica:0.38017)100:0.24062,((Leptospira_interrogans_L1-130:0.00000,Leptospira_interrogans_56601:0.00027)100:0.47573,((Treponema_pallidum:0.25544,Treponema_denticola:0.16072)100:0.19057,Borrelia_burgdorferi:0.42323)100:0.20278)95:0.07248)42:0.04615,(((Tropheryma_whipplei_TW08/27:0.00009,Tropheryma_whipplei_Twist:0.00081)100:0.44723,Bifidobacterium_longum:0.29283)100:0.14429,(((((Corynebacterium_glutamicum_13032:0.00022,Corynebacterium_glutamicum:0.00000)100:0.03415,Corynebacterium_efficiens:0.02559)100:0.03682,Corynebacterium_diphtheriae:0.06479)100:0.13907,(((Mycobacterium_bovis:0.00067,(Mycobacterium_tuberculosis_CDC1551:0.00000,Mycobacterium_tuberculosis_H37Rv:0.00000)98:0.00022)100:0.03027,Mycobacterium_leprae:0.05135)97:0.01514,Mycobacterium_paratuberculosis:0.02091)100:0.11523)100:0.09883,(Streptomyces_avermitilis:0.02680,Streptomyces_coelicolor:0.02678)100:0.16707)91:0.06110)100:0.26800)23:0.03480,((Fibrobacter_succinogenes:0.51984,(Chlorobium_tepidum:0.37204,(Porphyromonas_gingivalis:0.11304,Bacteroides_thetaiotaomicron:0.13145)100:0.34694)100:0.09237)62:0.04841,(((Chlamydophila_pneumoniae_TW183:0.00000,(Chlamydia_pneumoniae_J138:0.00000,(Chlamydia_pneumoniae_CWL029:0.00000,Chlamydia_pneumoniae_AR39:0.00000)37:0.00000)44:0.00000)100:0.10482,Chlamydophila_caviae:0.05903)98:0.04170,(Chlamydia_muridarum:0.01938,Chlamydia_trachomatis:0.02643)100:0.06809)100:0.60169)32:0.04443)67:0.04284)66:0.02646,((Thermoanaerobacter_tengcongensis:0.17512,((Clostridium_tetani:0.10918,Clostridium_perfringens:0.11535)78:0.03238,Clostridium_acetobutylicum:0.11396)100:0.15056)100:0.11788,(((((Mycoplasma_mobile:0.27702,Mycoplasma_pulmonis:0.28761)100:0.28466,((((Mycoplasma_pneumoniae:0.10966,Mycoplasma_genitalium:0.11268)100:0.31768,Mycoplasma_gallisepticum:0.24373)100:0.14180,Mycoplasma_penetrans:0.34890)94:0.06674,Ureaplasma_parvum:0.33874)100:0.19177)100:0.07341,Mycoplasma_mycoides:0.37680)100:0.12541,Phytoplasma_Onion_yellows:0.47843)100:0.09099,(((((Listeria_monocytogenes_F2365:0.00063,Listeria_monocytogenes_EGD:0.00144)90:0.00235,Listeria_innocua:0.00248)100:0.13517,((Oceanobacillus_iheyensis:0.13838,Bacillus_halodurans:0.09280)91:0.02676,(((Bacillus_cereus_ATCC_14579:0.00342,Bacillus_cereus_ATCC_10987:0.00123)100:0.00573,Bacillus_anthracis:0.00331)100:0.08924,Bacillus_subtilis:0.07876)96:0.01984)100:0.03907)69:0.02816,((Staphylococcus_aureus_MW2:0.00000,(Staphylococcus_aureus_N315:0.00022,Staphylococcus_aureus_Mu50:0.00022)61:0.00022)100:0.02479,Staphylococcus_epidermidis:0.03246)100:0.17366)64:0.02828,(((((((Streptococcus_agalactiae_III:0.00110,Streptococcus_agalactiae_V:0.00155)100:0.01637,(Streptococcus_pyogenes_M1:0.00134,(Streptococcus_pyogenes_MGAS8232:0.00045,(Streptococcus_pyogenes_MGAS315:0.00000,Streptococcus_pyogenes_SSI-1:0.00022)100:0.00110)87:0.00066)100:0.02250)100:0.01360,Streptococcus_mutans:0.04319)99:0.01920,(Streptococcus_pneumoniae_R6:0.00119,Streptococcus_pneumoniae_TIGR4:0.00124)100:0.03607)100:0.04983,Lactococcus_lactis:0.11214)100:0.08901,Enterococcus_faecalis:0.07946)100:0.03958,(Lactobacillus_johnsonii:0.20999,Lactobacillus_plantarum:0.14371)100:0.06763)100:0.08989)100:0.08905)92:0.09540)54:0.04315)Bacteria:1.34959,(((((Thalassiosira_pseudonana:0.33483,(Cryptosporidium_hominis:0.25048,Plasmodium_falciparum:0.28267)100:0.14359)42:0.03495,(((Oryza_sativa:0.07623,Arabidopsis_thaliana:0.09366)100:0.15770,Cyanidioschyzon_merolae:0.38319)96:0.08133,(Dictyostelium_discoideum:0.34685,(((Eremothecium_gossypii:0.07298,Saccharomyces_cerevisiae:0.07619)100:0.21170,Schizosaccharomyces_pombe:0.24665)100:0.15370,(((Anopheles_gambiae:0.10724,Drosophila_melanogaster:0.10233)100:0.09870,((Takifugu_rubripes:0.03142,Danio_rerio:0.05230)100:0.04335,(((Rattus_norvegicus:0.03107,Mus_musculus:0.01651)91:0.00398,(Homo_sapiens:0.00957,Pan_troglodytes:0.03864)100:0.01549)99:0.01629,Gallus_gallus:0.04596)100:0.01859)100:0.09688)95:0.03693,(Caenorhabditis_elegans:0.01843,Caenorhabditis_briggsae:0.01896)100:0.24324)100:0.09911)85:0.04004)41:0.02708)44:0.02636)87:0.06455,Leishmania_major:0.45664)100:0.10129,Giardia_lamblia:0.55482)100:0.57543,((Nanoarchaeum_equitans:0.81078,(((Sulfolobus_tokodaii:0.17389,Sulfolobus_solfataricus:0.18962)100:0.33720,Aeropyrum_pernix:0.43380)94:0.09462,Pyrobaculum_aerophilum:0.55514)100:0.12018)100:0.15444,((Thermoplasma_volcanium:0.10412,Thermoplasma_acidophilum:0.09785)100:0.66151,((((Methanobacterium_thermautotrophicum:0.36583,Methanopyrus_kandleri:0.35331)99:0.07446,(Methanococcus_maripaludis:0.28592,Methanococcus_jannaschii:0.13226)100:0.23828)100:0.06284,((Pyrococcus_horikoshii:0.02786,Pyrococcus_abyssi:0.02179)100:0.02239,Pyrococcus_furiosus:0.02366)100:0.36220)51:0.04469,(Archaeoglobus_fulgidus:0.34660,(Halobacterium_sp._NRC-1:0.61597,(Methanosarcina_acetivorans:0.02602,Methanosarcina_mazei:0.03087)100:0.30588)100:0.12801)100:0.10395)62:0.06815)99:0.11833)100:0.43325):0.88776);";
epeek.tree.label = function () {
"use strict";

    // TODO: Not sure if we should be removing by default prev labels
    // or it would be better to have a separate remove method called by the vis
    // on update
    // We also have the problem that we may be transitioning from
    // text to img labels and we need to remove the label of a different type
    var label = function (node) {
	label.display().call(this, node)
	    .attr("class", "ePeek_tree_label")
	    .attr("transform", "translate (" + label.transform()()[0] + " " + label.transform()()[1] + ")");
    };

    var api = epeek.utils.api (label)
	.getset ('width', function () { throw "Need a width callback" })
	.getset ('height', function () { throw "Need a height callback" })
	.getset ('display', function () { throw "Need a display callback" })
	.getset ('transform', function () { return [10, 5] });

    api.method ('remove', function () {
	d3.select(this)
	    .selectAll(".ePeek_tree_label")
	    .remove();
    });

    return label;
};

// Text based labels
epeek.tree.label.text = function () {
    var label = epeek.tree.label();

    var api = epeek.utils.api (label)
	.getset ('fontsize', 10)
	.getset ('color', "#000")
	.getset ('text', function (d) {
	    return d.name;
	})

    label.display (function (node) {
	var l = d3.select(this)
	    .append("text")
	    .text(function(d){
		return label.text()(d)
	    })
	    .style('font-size', label.fontsize() + "px")
	    .style('fill', d3.functor(label.color()));

	return l;
    });

    label.width (function (node) {
	var svg = d3.select("body")
	    .append("svg")
	    .attr("height", 0)
	    .style('visibility', 'hidden');

	var text = svg
	    .append("text")
	    .text(label.text()(node));

	var width = text.node().getBBox().width;
	svg.remove();

	return width;
    });

    label.height (function (node) {
	return label.fontsize();
    });

    return label;
};

// Image based labels
epeek.tree.label.img = function () {
    var label = epeek.tree.label();

    var api = epeek.utils.api (label)
	.getset ('src', function () {})

    label.display (function (node) {
	if (label.src()(node)) {
	    var l = d3.select(this)
		.append("image")
		.attr("width", label.width()())
		.attr("height", label.height()())
		.attr("xlink:href", label.src()(node));
	    return l;
	}
	// TODO:
	return d3.select(this)
	    .append("text");
    });

    label.transform (function () {
	return ([10, -(label.height()() / 2)]);
    });

    return label;
};

// Labels made of 2+ simple labels
epeek.tree.label.composite = function () {

    var labels = [];

    var label = function (node) {
	for (var i=0; i<labels.length; i++) {
	    labels[i].call(this, node);
	}
    };

    var api = epeek.utils.api (label)

    api.method ('add_label', function (display) {
	var curr_labels = [];
	for (var i=0; i<labels.length; i++) {
	    curr_labels.push(labels[i]);
	}

	display._super_ = {};
	epeek.utils.api (display._super_)
	    .get ('transform', display.transform());

	display.transform( function (node) {
	    var curr_offset = 0;
	    for (var i=0; i<curr_labels.length; i++) {
		curr_offset += curr_labels[i].width()(node);
		curr_offset += curr_labels[i].transform()(node)[0];
	    }
	    return ([curr_offset + display._super_.transform()(node)[0], display._super_.transform()(node)[1]]);
	});

	labels.push(display);
	return label;
    });

    api.method ('width', function () {
	return function (node) {
	    var tot_width = 0;
	    for (var i=0; i<labels.length; i++) {
		tot_width += parseInt(labels[i].width()(node));
		tot_width += parseInt(labels[i]._super_.transform()(node)[0]);
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

    api.method ('remove', function (node) {
	for (var i=0; i<labels.length; i++) {
	    labels[i].remove.call(this, node);
	}
    });

    return label;
};
epeek.tree.diagonal = function () {

    var d = function (diagonalPath) {
	var source = diagonalPath.source;
        var target = diagonalPath.target;
        var midpointX = (source.x + target.x) / 2;
        var midpointY = (source.y + target.y) / 2;
        var pathData = [source, {x: target.x, y: source.y}, target];
	pathData = pathData.map(d.projection());
	return d.path()(pathData, radial_calc.call(this,pathData))
    };

    var api = epeek.utils.api (d)
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
	var rotation = 0;
	var largeArc = 0;
	var sweep;
	var curr_sweep = d3.select(this).attr("__sweep");
	if (curr_sweep === null) {
	    sweep = (clockwise ? 0 : 1);
	    d3.select(this).attr("__sweep", sweep);
	} else {
	    sweep = curr_sweep;
	}
	return {
	    rotation : rotation,
	    largeArc : largeArc,
	    radius   : radius,
	    sweep    : sweep
	};
    };

    return d;
};


// vertical diagonal for bezier links
// var vertical_diagonal = d3.svg.diagonal()
// 	  .projection(function (d) {
// 	      return [d.y, d.x]});

// vertical diagonal for rect branches
epeek.tree.diagonal.vertical = function () {
    var projection = function(d) { 
	return [d.y, d.x];
    }

    var path = function(pathData, obj) {
	var src = pathData[0];
	var mid = pathData[1];
	var dst = pathData[2];

	return "M" + src + ' ' +
	    "A" + src + ' 0 0,' + obj.sweep + ' ' + src +
	    "L" + mid + ' ' +
	    "L" + dst;
    };

    return epeek.tree.diagonal()
      	.path(path)
      	.projection(projection);
};

// radial diagonal for bezier links
// var radial_diagonal = d3.svg.diagonal.radial()
// 	      .projection(function(d) {
// 	  	  return [d.y, d.x / 180 * Math.PI];
// 	      });

epeek.tree.diagonal.radial = function () {
    var path = function(pathData, obj) {
      	var src = pathData[0];
      	var mid = pathData[1];
      	var dst = pathData[2];
	var radius = obj.radius;
	var rotation = obj.rotation;
	var largeArc = obj.largeArc;
	var sweep = obj.sweep;

      	return 'M' + src + ' ' +
      	    "A" + [radius,radius] + ' ' + rotation + ' ' + largeArc+','+sweep + ' ' + mid +
      	    'L' + dst +
	    'L' + dst;
    };

    var projection = function(d) {
      	var r = d.y, a = (d.x - 90) / 180 * Math.PI;
      	return [r * Math.cos(a), r * Math.sin(a)];
    };

    return epeek.tree.diagonal()
      	.path(path)
      	.projection(projection)
};
// Based on the code by Ken-ichi Ueda in http://bl.ocks.org/kueda/1036776#d3.phylogram.js

epeek.tree.layout = function () {

    var l = function () {
    };

    var cluster = d3.layout.cluster()
	.sort(null)
	.value(function (d) {return d.length} )
	// .children(function (d) {return d.branchset})
	.separation(function () {return 1});

    var api = epeek.utils.api (l)
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

epeek.tree.layout.vertical = function () {
    var layout = epeek.tree.layout();

    var api = epeek.utils.api (layout)
	.getset ('width', 360)
	.get ('translate_vis', [20,20])
	.method ('diagonal', epeek.tree.diagonal.vertical)
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

epeek.tree.layout.radial = function () {
    var layout = epeek.tree.layout();
    var default_width = 360;
    var r = default_width / 2;

    var conf = {
    	width : 360
    };

    var api = epeek.utils.api (layout)
	.getset (conf)
	.getset ('translate_vis', [r, r*1.3]) // TODO: 1.3 should be replaced by a sensible value
	.method ('transform_node', function (d) {
	    return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
	})
	.method ('diagonal', epeek.tree.diagonal.radial)
	.method ('height', function () { return conf.width });

    // Changes in width affect changes in r
    layout.width.transform (function (val) {
    	r = val / 2;
    	layout.cluster.size([360, r-120])
    	layout.translate_vis([r, r*1.3]);
    	return val;
    });

    api.method ("yscale",  function (dists) {
	return d3.scale.linear()
	    .domain([0,d3.max(dists)])
	    .range([0, r]);
    });

    api.method ("adjust_cluster_size", function (params) {
	return;
    });

    return layout;
};
epeek.tree.tree = function (data) {
    "use strict";

    var node = function () {
    };

    var api = epeek.utils.api (node);

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
	var i = epeek.utils.iterator(1);
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
		if (d.length) {
		    l = d.length
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

    api.method ('find_node_by_field', function(value, field) {
	if (typeof (field) === 'function') {
	    if (field (data) === value) {
		return node;
	    }
	} else {
	    if (data[field] === value) {
		return node;
	    }
	}
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		var n = epeek.tree.tree(data.children[i]);
		var found = n.find_node_by_field(value, field);
		if (found !== undefined) {
		    return found;
		}
	    }
	}
    });

    api.method ('find_node_by_name', function(name) {
	return node.find_node_by_field(name, 'name');
    });

    api.method ('toggle_node', function(node_data) {
	if (node_data) {
	    if (node_data.children) {
		node_data._children = node_data.children;
		node_data.children = undefined;
	    } else {
		node_data.children = node_data._children;
		node_data._children = undefined;
	    }
	}
		// return node;	
    });

    api.method ('is_collapsed', function () {
	return (data._children !== undefined && data.children === undefined);
    });

    var has_ancestor = function(n, ancestor) {
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
	return epeek.tree.tree(lca_node);
    });

    var _lca = function(node1, node2) {
	if (node1 === node2) {
	    return node1;
	}
	if (has_ancestor(node1, node2)) {
	    return node2;
	}
	return _lca(node1, node2._parent);
    };


    api.method ('get_all_leaves', function () {
	var leaves = [];
	node.apply(function (n) {
	    if (n.is_leaf()) {
		leaves.push(n);
	    }
	});
	return leaves;
    });

    api.method ('upstream', function(cbak) {
	cbak(node);
	var parent = node.parent();
	if (parent !== undefined) {
	    parent.upstream(cbak);
	}
//	epeek.tree.tree(parent).upstream(cbak);
// 	node.upstream(node._parent, cbak);
    });

    api.method ('subtree', function(nodes) {
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

	var copy_data = function (orig_data, subtree, condition) {
            if (orig_data === undefined) {
		return;
            }

            if (condition(orig_data)) {
		var copy = copy_node(orig_data);
		if (subtree.children === undefined) {
                    subtree.children = [];
		}
		subtree.children.push(copy);
		if (orig_data.children === undefined) {
                    return;
		}
		for (var i = 0; i < orig_data.children.length; i++) {
                    copy_data (orig_data.children[i], copy, condition);
		}
            } else {
		if (orig_data.children === undefined) {
                    return;
		}
		for (var i = 0; i < orig_data.children.length; i++) {
                    copy_data(orig_data.children[i], subtree, condition);
		}
            }
	};

	var copy_node = function (node_data) {
	    var copy = {};
	    // copy all the own properties excepts links to other nodes or depth
	    for (var param in node_data) {
		if ((param === "children") ||
		    (param === "children") ||
		    (param === "_parent") ||
		    (param === "depth")) {
		    continue;
		}
		if (node_data.hasOwnProperty(param)) {
		    copy[param] = node_data[param];
		}
	    }
	    return copy;
	};

	var subtree = {};
	copy_data (data, subtree, function (node_data) {
	    var node_id = node_data._id;
	    var counts = node_counts[node_id];

	    if (counts === undefined) {
	    	return false;
	    }
// 	    if ((node.children !== undefined) && (node.children.length < 2)) {
// 		return false;
// 	    }
	    if ((counts > 1) && (!is_singleton(node_data))) {
		return true;
	    }
	    if ((counts > 0) && (node_data.children === undefined)) {
		return true;
	    }
	    return false;
	});

	return epeek.tree.tree(subtree.children[0]);
    });

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
    // and should return -1,0,1
    api.method ('sort', function (cbak) {
	if (data.children === undefined) {
	    return;
	}

	var new_children = [];
	for (var i=0; i<data.children.length; i++) {
	    new_children.push(epeek.tree.tree(data.children[i]));
	}

	new_children.sort(cbak);
	data.children = [];
	for (var i=0; i<new_children.length; i++) {
	    data.children.push(new_children[i].data());
	}

	for (var i=0; i<data.children.length; i++) {
	    epeek.tree.tree(data.children[i]).sort(cbak);
	}
    });

    api.method ('apply', function(cbak) {
	cbak(node);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		var n = epeek.tree.tree(data.children[i])
		n.apply(cbak);
	    }
	}
    });

    api.method ('property', function(prop, value) {
	if (arguments.length === 1) {
	    return data[prop]
	}
	data[prop] = value;
	return node;
    });

    api.method ('is_leaf', function() {
	return data.children === undefined;
    });

    // It looks like the cluster can't be used for anything useful here
    // It is now included as an optional parameter to the epeek.tree() method call
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

    api.method ('root_dist', function () {
	return node.property('_root_dist');
    });

    api.method ('children', function () {
	if (data.children === undefined) {
	    return;
	}
	var children = [];
	for (var i=0; i<data.children.length; i++) {
	    children.push(epeek.tree.tree(data.children[i]));
	}
	return children;
    });

    api.method ('parent', function () {
	if (data._parent === undefined) {
	    return undefined;
	}
	return epeek.tree.tree(data._parent);
    });

    return node;

};


epeek.tree_annot = function () {
"use strict";

    // Defaults
    var tree_conf = {
	tree : undefined,
	track : function (leaf) {
	    var t = epeek.track.track()
		.background_color("#EBF5FF")
		.data(epeek.track.data()
		      .index('start')
		      .update(epeek.track.retriever.sync()
			      .retriever (function () {
				  return  []
			      })
			     ))
		.display(epeek.track.feature.block()
			 .foreground_color("steelblue")
			);

	    return t;
	},
	annotation : undefined,
	ruler : "none",
	key   : undefined
    };

    var tree_annot = function (div) {

	var group_div = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_groupDiv");

	var tree_div = group_div
	    .append("div")
	    .attr("class", "ePeek_tree_container");

	var annot_div = group_div
	    .append("div")
	    .attr("class", "ePeek_annot_container");

	tree_conf.tree (tree_div.node());

	// tracks
	var leaves = tree_conf.tree.tree().get_all_leaves();
	var tracks = [];

	var height = tree_conf.tree.label().height();

	for (var i=0; i<leaves.length; i++) {
            // Block Track1
	    (function  (leaf) {
		epeek.track.id = function () {
		    if (tree_conf.key === undefined) {
			return  leaf.id();
		    }
		    return leaf.property(tree_conf.key);
		};
		var track = tree_conf.track(leaves[i].data())
		    .height(height);

		tracks.push (track);

	    })(leaves[i]);

        }

	// An axis track
	epeek.track.id = function () {
	    return "axis-top";
	};
	var axis_top = epeek.track.track()
	    .height(0)
	    .background_color("white")
	    .display(epeek.track.feature.axis()
		     .orientation("top")
		    );

	epeek.track.id = function () {
	    return "axis-bottom";
	};
	var axis = epeek.track.track()
            .height(18)
            .background_color("white")
            .display(epeek.track.feature.axis()
                     .orientation("bottom")
		    );

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

	api.method('update', function () {
	    tree_conf.tree.update();
	    var leaves = tree_conf.tree.tree().get_all_leaves();
	    var new_tracks = [];

	    if (tree_conf.ruler === 'both' || tree_conf.ruler === 'top') {
		new_tracks.push(axis_top);
	    }

	    for (var i=0; i<leaves.length; i++) {
		// We first see if we have a track for the leaf:
		var curr_track = tree_conf.annotation.find_track_by_id(tree_conf.key===undefined ? leaves[i].id() : leaves[i].property(tree_conf.key));
		if (curr_track === undefined) {
		    // New leaf -- no track for it
		    (function (leaf) {
			epeek.track.id = function () {
			    if (tree_conf.key === undefined) {
				return leaf.id();
			    }
			    return leaf.property(tree_conf.key);
			};
			curr_track = tree_conf.track(leaves[i].data())
			    .height(height);
		    })(leaves[i]);
		}
		new_tracks.push(curr_track);
	    }
	    if (tree_conf.ruler === 'both' || tree_conf.ruler === 'bottom') {
		new_tracks.push(axis);
	    }

	    tree_conf.annotation.reorder(new_tracks);
	});

	return tree_annot;
    };

    var api = epeek.utils.api (tree_annot)
	.getset (tree_conf);
    
    return tree_annot;
};
/**
 * Newick format parser in JavaScript.
 *
 * Copyright (c) Jason Davies 2010.
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
 *   children: [
 *     {name: "A", length: 0.1},
 *     {name: "B", length: 0.2},
 *     {
 *       name: "E",
 *       length: 0.5,
 *       children: [
 *         {name: "C", length: 0.3},
 *         {name: "D", length: 0.4}
 *       ]
 *     }
 *   ]
 * }
 *
 * Converted to JSON, but with no names or lengths:
 * {
 *   children: [
 *     {}, {}, {
 *       children: [{}, {}]
 *     }
 *   ]
 * }
 */

epeek.tree.parse_newick = function (s) {
    var ancestors = [];
    var tree = {};
    var tokens = s.split(/\s*(;|\(|\)|,|:)\s*/);
    for (var i=0; i<tokens.length; i++) {
	var token = tokens[i];
	switch (token) {
	case '(': // new children
	    var subtree = {};
	    tree.children = [subtree];
	    ancestors.push(tree);
		tree = subtree;
	    break;
        case ',': // another branch
	    var subtree = {};
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
		tree.length = parseFloat(token);
	    }	
	}
    }
    return tree;
};

epeek.tree.parse_nhx = function(s) {
    var ancestors = [];
    var tree = {};
    // var tokens = s.split(/\s*(;|\(|\)|,|:)\s*/);
    //[&&NHX:D=N:G=ENSG00000139618:T=9606]
    var tokens = s.split( /\s*(;|\(|\)|\[|\]|,|:|=)\s*/ );
    for (var i=0; i<tokens.length; i++) {
      var token = tokens[i];
      switch (token) {
        case '(': // new children
          var subtree = {};
          tree.children = [subtree];
          ancestors.push(tree);
          tree = subtree;
          break;
        case ',': // another branch
          var subtree = {};
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
          // var x2 = tokens[i-2];
          if (x == ')' || x == '(' || x == ',') {
            tree.name = token;
          } 
          else if (x == ':') {
            var test_type = typeof token;
            if(!isNaN(token)){
              tree.branch_length = parseFloat(token);
            }
            // tree.length = parseFloat(token);
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
                   
            }
          }
          else {
            var test;

          }
      }
    }
    return tree;
  };



epeek.tooltip = function() {
    "use strict";

    var path = epeek.utils.script_path("ePeek.js");

    // Style options
    var bgColor;
    var fgColor;

    var drag = d3.behavior.drag();
    var allow_drag = true;
    var tooltip_div;

    var fill = function () { throw 'Base object does not have fill method' };

    var tooltip = function (data) {
	drag
	    .origin(function(){
		return {x:parseInt(d3.select(this).style("left")),
			y:parseInt(d3.select(this).style("top"))
		       }
	    })
	    .on("drag", function() {
		if (allow_drag) {
		    d3.select(this)
			.style("left", d3.event.x + "px")
			.style("top", d3.event.y + "px")
		}
	    });


	// TODO: Why do we need the div element?
	// It looks like if we anchor the tooltip in the "body"
	// The tooltip is not located in the right place (appears at the bottom)
	// See clients/tooltips_test.html for an example
	var container = d3.select(this).selectAncestor("div");
	if (container === undefined) {
	    // We require a div element at some point to anchor the tooltip
	    return
	};

	tooltip_div = container
	    .append("div")
	    .attr("class", "ePeek_gene_info")
 	    .classed("ePeek_gene_info_active", true)  // TODO: Is this needed/used???
	    .call(drag);

	tooltip_div
	    .style("left", d3.mouse(container.node())[0] + "px")
	    .style("top", d3.mouse(container.node())[1] + "px");

	// Close
	tooltip_div.append("span")
	    .style("position", "absolute")
	    .style("right", "-10px")
	    .style("top", "-10px")
	    .append("img")
	    .attr("src", path + "lib/close.png")
	    .attr("width", "20px")
	    .attr("height", "20px")
	    .on("click", function() {d3.select(this).node().parentNode.parentNode.remove();});

	fill.call(tooltip_div, data);

	// tooltip[type](data);

	// Is it correct / needed to return self here?
	return tooltip;

    };

    tooltip.filler = function (cbak) {
	if (!arguments.length) {
	    return fill;
	}
	fill = cbak;
	return tooltip;
    };

    tooltip.header = function(obj) {
	tooltip_div
	    .append("div")
	    .attr("height", "15px")
	    .append("text")
	    .text(obj.header);

	tooltip_div
	    .append("div")
	    .html(obj.data);
    };

    tooltip.background_color = function (color) {
	if (!arguments.length) {
	    return bgColor;
	}
	bgColor = color;
	return tooltip;
    };

    tooltip.foreground_color = function (color) {
	if (!arguments.length) {
	    return fgColor;
	}
	fgColor = color;
	return tooltip;
    };

    tooltip.allow_drag = function (bool) {
	if (!arguments.length) {
	    return allow_drag;
	}
	allow_drag = bool;
	return tooltip;
    };

    return tooltip;
};

epeek.tooltip.table = function () {
    // table tooltips are based on general tooltips
    var tooltip = epeek.tooltip();

    tooltip.filler (function (obj) {
	var tooltip_div = this;

	var obj_info_table = tooltip_div
	    .append("table")
	    .attr("class", "ePeek_zmenu")
	    .attr("border", "solid")
	    .style("border-color", tooltip.foreground_color());
    
	// Tooltip header
	obj_info_table
	    .append("tr")
	    .attr("class", "ePeek_gene_info_header")
	    .append("th")
	    .style("background-color", tooltip.foreground_color())
	    .style("color", tooltip.background_color())
	    .attr("colspan", 2)
	    .text(obj.header.label + ": " + obj.header.value);

	// Tooltip rows
	var table_rows = obj_info_table.selectAll(".ePeek_tooltip_rows")
	    .data(obj.rows)
	    .enter()
	    .append("tr")
	    .attr("class", "ePeek_tooltip_rows");

	table_rows
	    .append("th")
	    .style("border-color", tooltip.foreground_color())
	    .html(function(d,i) {return obj.rows[i].label});
	
	table_rows
	    .append("td")
	    .html(function(d,i) {return obj.rows[i].value});


    });

    return tooltip;
};

epeek.tooltip.plain = function () {
    // table tooltips are based on general tooltips
    var tooltip = epeek.tooltip();

    tooltip.filler (function (obj) {
	var tooltip_div = this;
	tooltip_div
	    .append("div")
	    .html(obj);
    });

    return tooltip;
}

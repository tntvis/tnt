var tnt_track_render = function () {

    var xScale; // = axis_zoom.x();
    var curr_x0; // = xScale.invert(0);
    var curr_xmax; // = xScale.invert(track_svg.attr("width"));
    var render; // null by default

    var tracks_svg;
    var img_div;
    var axis_zoom;

    // var svg_to_png_cbak = function (src) {
    // 	img_div.select("img")
    // 	    .remove();
    // 	img_div.append("img")
    // 	    .attr("src", src)
    // 	img_div
    // 	    .style("left", "0px");
    // };

    // var svg_to_png = tnt.utils.png().callback (svg_to_png_cbak);

    var rend = {};
    rend.move = function () {
	// var rend = function () {
	var img = img_div.select("img");
	var this_x0 = xScale(curr_x0);
	var this_xmax = xScale(curr_xmax);
 	img_div
	    .style ("left", this_x0 + "px");
	img_div
	    .select("img")
	    .attr("width", (this_xmax - this_x0))
	    .attr("height", tracks_svg.attr("height"));
    };

    rend.update = function (conf) {
	console.log("CREATING NEW IMG");
	tracks_svg
	    .style("display", "none");

	curr_x0 = xScale.invert(0);
	curr_xmax = xScale.invert(tracks_svg.attr("width"));

	var start = window.performance.now();
	render(conf);
	var stop = window.performance.now();
        console.log ("New image in " + ((stop-start)/1000).toFixed(3) + "secs")

	tracks_svg.remove(); //
    };

    rend.callback = function (img_data) {
	img_div
	    .select("img")
	    .remove()
	img_div
	    .append("img")
	    .attr("src", img_data);
	img_div
	    .style("left", "0px");
    };

    rend.msg = function (conf) {
	console.log(JSON.stringify(conf));
	return JSON.stringify(conf);
    };

    rend.render = function (r) {
	if (!arguments.length) {
	    return render
	}
	render = r;
	return rend;
    };

    rend.conf = function (obj) {
	tracks_svg = obj.tracks_svg;
	img_div = obj.img_div;
	axis_zoom = obj.zoom;
	xScale = axis_zoom.x();
	curr_x0 = xScale.invert(0);
	curr_xmax = xScale.invert(obj.tracks_svg.attr("width"));
    };

    rend.zoom = function (new_zoom) {
	if (!arguments.length) {
	    return axis_zoom;
	}
	axis_zoom = new_zoom;
	xScale = axis_zoom.x();
	curr_x0 = xScale.invert(0);
	curr_xmax = xScale.invert(tracks_svg.attr("width"));
	return rend;
    };

    rend.tracks_svg = function () {
	return tracks_svg;
    };

    return rend;
};


// Namespace
tnt.track.render = {};

// Client-side rendering
tnt.track.render.client = function () {
    var r = tnt_track_render();

    var svg_to_png = tnt.utils.png()
	.callback(r.callback);

    r.render (function () {
	svg_to_png (r.tracks_svg());
    });

    return r;
};

// HTTP rendering
tnt.track.render.http = function () {
    var endpoint = "board";
    var xhr = d3.xhr("/" + endpoint)
	.header('Content-Type', 'application/json');

    var r = tnt_track_render();

    r.render (function (conf) {
	var msg = r.msg(conf);
	xhr.post (msg, function (ok, resp) {
	    r.callback(resp.response);
	});
    });

    return r;
};

// Websocket rendering
tnt.track.render.websocket = function () {
    var curr_wsconn;
    var hostname = location.hostname;
    var port = location.port;
    var endpoint = "boardws";
    var wsconn = new WebSocket('ws://' + hostname + ':' + port + '/' + endpoint);
    var msg;

    var r = tnt_track_render();
    r.render (function (conf) {
	msg = r.msg(conf);

	console.log("WS STATE: " + wsconn.readyState + ":: WS OPEN: " + WebSocket.OPEN);
	if (wsconn.readyState === WebSocket.OPEN) {
	    wsconn.send(msg);
 	}
    });

    wsconn.onopen = function () {
	console.log("WebSocket connection stablished");
	wsconn.send(msg);
    };

    wsconn.onmessage = function (resp) {
	console.log("Sending data through websocket");
	r.callback(resp.data);
    };

    if (curr_wsconn === undefined) {
	curr_wsconn = wsconn;
    }

    wsconn.onclose = function () {
	console.log("Websocket connection closed");
    };

    return r
};

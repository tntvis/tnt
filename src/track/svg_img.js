tnt.track.zoom_img = function (track_svg, img_div, axis_zoom, svg_to_png_cbak) {
    // var origin_translate = 0;

    var use_server = false;
    var use_websocket = false;
    // var is_server = false;
    var curr_xhr;
    var curr_wsconn;

    // x-zoom the image
    var xScale = axis_zoom.x();
    var curr_x0 = xScale.invert(0);
    var curr_xmax = xScale.invert(track_svg.attr("width"));

    // Default value for svg_to_png_cbak
    if (svg_to_png_cbak === undefined) {
	svg_to_png_cbak = function (src) {
            img_div.select ("img") 
		.remove();
            img_div.append ("img")
		.attr ("src", src)
	    img_div
		.style ("left", "0px");

	};
    }

    var svg_to_png = tnt.utils.png().callback (svg_to_png_cbak)

    var z = function () {
	var img = img_div.select("img");
	var this_x0 = xScale(curr_x0);
	var this_xmax = xScale(curr_xmax);
	img_div
	    .style ("left", this_x0 + "px");
	img_div
	    .select("img")
	    .attr("width", (this_xmax - this_x0))
	    .attr("height", track_svg.attr("height"));
    };

    z.get_backup_img = function (conf) {
	console.log ("CREATING NEW IMG");
	track_svg
	    .style ("display", "none");

	curr_x0 = xScale.invert(0);
	curr_xmax = xScale.invert(track_svg.attr("width"));
	// origin_translate = xScale (curr_x0);

	var start = window.performance.now();

	// Server side image rendering
	if (z.use_server()) {
	    if ((z.use_websocket()) && ('WebSocket' in window)) {
		console.log("USING WEBSOCKET");
		// Open a new websocket if it is not one already
		if (curr_wsconn === undefined) {
		    // This info has to be taken from an object (tnt.utils.websocket?)
		    var wsconn = new WebSocket('ws://' + location.hostname + ':' + location.port + '/boardws') 
		    wsconn.onopen = function () {
			console.log("WebSocket connection stablished");
			wsconn.send(JSON.stringify(conf));
		    }
		    wsconn.onmessage = function (resp) {
			svg_to_png_cbak(resp.data);
		    };
		    // wsconn.onmessage = function (resp) {
		    // 	console.log(resp.data);
		    // 	// TODO: This is dup in http connection. Abstract out
		    // 	img_div
	    	    // 	    .select("img")
	    	    // 	    .remove();
		    // 	img_div.append("img")
	    	    // 	    .attr("src", resp.data);
	    	    // 	img_div
	    	    // 	    .style ("left", "0px");
		    // };
		    wsconn.onclose = function () {
			wsconn = undefined;
			console.log("WebSocket connection closed");
		    }
		    curr_wsconn = wsconn
		} else {
		    curr_wsconn.send(JSON.stringify(conf));
		}
		
	    } else {
		// if (z.is_server()) {
		// I'm the server in server mode -- I create an image and pass it to the client
	        // console.log ("I'm the server in server mode -- I create an image and pass it to the client")
		// svg_to_png (track_svg);
		// } else {
		// I'm the client in server mode -- I ask the server to provide an image
		console.log ("I'm the client in server mode -- I ask the server to provide an image");
		// TODO: url has to be a parameter adjustbale via API
		var xhr = d3.xhr('/board')
                // .mimeType('image/png');
		    .header('Content-Type', 'application/json')
		// .header ('Content-Type', "application/x-www-form-urlencoded")
		// .mimeType('application/json');

		// if (curr_xhr) {
		// 	curr_xhr.abort();
		// }

		var conf_str = JSON.stringify(conf);
		console.log(conf_str);
		xhr
		    .post (conf_str, function (ok, resp) {
			console.log(ok);
			console.log(resp.response)
			// console.log(JSON.parse(resp.response));
			svg_to_png_cbak(resp.response);
			// img_div
	    		//     .select("img")
	    		//     .remove();
			// img_div.append("img")
	    		//     .attr("src", resp.response);
	    		// img_div
	    		//     .style ("left", "0px");
	    	    })

		curr_xhr = xhr;
	    }
	} else {
	    // I'm the client in client mode -- I create a image on my own
	    console.log("I am the client in client mode -- I have to provide a png");
	    svg_to_png (track_svg);
	}

	var stop = window.performance.now();
	console.log ("New image in " + ((stop-start)/1000).toFixed(3) + "secs");

	track_svg.remove();
    };

    // move to api (needs to be a transform?)
    z.png_callback = function (cbak) {
	if (!arguments.length) {
	    return svg_to_png.callback();
	}
	svg_to_png.callback(cbak);

	return z;
    };

    // move to api
    z.use_server = function (bool) {
	if (!arguments.length) {
	    return use_server;
	}
	use_server = bool;
	return z;
    };

    // move to api
    z.use_websocket = function (bool) {
	if (!arguments.length) {
	    return use_websocket;
	}
	use_websocket = bool;
	return z;
    };

    // move to api
    // z.is_server = function (bool) {
    // 	if (!arguments.length) {
    // 	    return is_server;
    // 	}
    // 	is_server = bool;
    // 	return z;
    // };

    return z;
};

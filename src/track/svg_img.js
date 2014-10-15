tnt.track.zoom_img = function (track_svg, img_div, axis_zoom) {
    var origin_translate = 0;

    // x-zoom the image
    var xScale = axis_zoom.x();
    var curr_x0 = xScale.invert(0);
    var curr_xmax = xScale.invert(track_svg.attr("width"));


    var svg_to_png_cbak = function (src) {
        img_div.select ("img")
            .remove();
        img_div.append ("img")
	    .attr ("src", src);
    };

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

    z.get_backup_img = function () {
	console.log ("CREATING NEW IMG");
	track_svg
	    .style ("display", "none");

	curr_x0 = xScale.invert(0);
	curr_xmax = xScale.invert(track_svg.attr("width"));
	origin_translate = xScale (curr_x0);
	img_div
	    .style ("left", "0px");

	var start = window.performance.now();
	svg_to_png (track_svg);
	var stop = window.performance.now();
	d3.select("#time_to_execute")
	    .text("New image ... " + ((stop-start)/1000).toFixed(3) + "secs");
	// track_svg.remove();
    };

    return z;
};

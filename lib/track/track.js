"use strict";

epeek.track.id = epeek.utils.iterator(1);

epeek.track.track = function () {
    // height is the vertical dimension of the track
    // width should be global because we don't allow different tracks to have different widths
    var height = 250;

    // Unique ID for this track
    var id = epeek.track.id();

    // fg_color is the foreground color of the track
    var fg_color = d3.rgb('#000000');

    // bg_color is the background color of the track
    var bg_color = d3.rgb('#CCCCCC');

    // display is the object (normally a epeek.track.display object) used to plot the track
    var display;

    // data is the object (normally a epeek.track.data object) used to retrieve and update data for the track
    var data = epeek.track.data.empty();

    var track = function() {
    };

    // API

    // id only getter
    track.id = function () {
	return id;
    };

    track.foreground_color = function (color) {
        if (!arguments.length) {
            return fg_color;
        }
        fg_color = color;
        return track;
    };

    track.background_color = function (color) {
        if (!arguments.length) {
            return bg_color;
        }
        bg_color = color;
        return track;
    };

    track.height = function (h) {
        if (!arguments.length) {
            return height;
        }
        height = h;
        return track;
    };

    track.display = function (new_plotter) {
	if (!arguments.length) {
	    return display;
	}
	display = new_plotter;
	display.layout && display.layout().height(height);
	return track;
    };

    track.data = function (new_data) {
	if (!arguments.length) {
	    return data;
	}
	data = new_data;
	return track;
    };

    return track;

};

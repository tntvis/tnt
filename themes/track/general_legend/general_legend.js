var tnt_legend = function (div) {

    var opts = {
	row_height : 20,
	header_fontsize : 19,
	fontsize   : 12
    };

    var id = tnt.utils.iterator(1);
    var legend_cols = [];

    var legend = function () {};

    var api = tnt.utils.api (legend)
	.getset(opts);

    api.method ('add_column', function (width, height) {
	var div_id = d3.select(div)
	    .style("display", "table")
	    .style("height", height)
	    .attr("id");

	var new_div = d3.select(div)
	    .append("div")
	    .attr("id", div_id + "_" + id())
	    .style("display", "table-cell");

	var new_board = tnt.board()
	    .from (1)
	    .to (2)
	    .allow_drag (false)
	    .width (width);

	new_board.add_row = new_board.add_track;

	legend_cols.push ({
	    'div' : new_div.node(),
	    'board' : new_board
	});

	return new_board;
    });

    api.method ('header', function (text) {
	var feature = tnt.track.feature();

	feature.create (function (g, xScale) {
	    var track = this;
	    g
		.append("text")
		.attr("fill", "black")
		.attr("font-size", opts.header_fontsize)
		.attr("x", xScale(1.5))
		.attr("y", ~~track.height()/2)
		.text(text);
	});

	var track = tnt.track()
	    .height(30)
	    .background_color("white")
	    .data (tnt.track.data()
		   .update(
		       tnt.track.retriever.sync()
			   .retriever (function () {
			       return [text];
			   })
		   )
		  )
	    .display (feature);

	return track;
    });

    api.method ('line', function (color, desc) {
	var feature = tnt.track.feature();

	feature.create (function (g, xScale) {
	    var track = this;
	    g
		.append("line")
		.attr("stroke", color)
		.attr("stroke-width", 2)
		.attr("x1", 5)
		.attr("x2", 35)
		.attr("y1", ~~(track.height()/2))
		.attr("y2", ~~(track.height()/2))

	    g
		.append("text")
		.attr("fill", "black")
		.attr("font-size", opts.fontsize)
		.attr("x", 40)
		.attr("y", ~~(track.height()/2) + 4)
		.text(desc);
	});

	var track = tnt.track()
	    .height(opts.row_height)
	    .background_color("white")
	    .data (tnt.track.data()
		   .update(
		       tnt.track.retriever.sync()
			   .retriever (function () {
			       return [desc];
			   })
		   )
		  )
	    .display (feature);

	return track;

    });

    api.method ('empty', function (color, desc) {
	var track = tnt.track()
	    .height(opts.row_height)
	    .background_color("white")
	    .data(null)
	    .display(null);

	return track;
    });

    api.method ('square', function (color, desc) {

    });

    api.method ('show', function () {
	for (var i=0; i<legend_cols.length; i++) {
	    var col = legend_cols[i];
	    col.board(col.div);
	    col.board.start();
	}
    });

    return legend;
};

var tnt_legend = function (div) {

    var opts = {
	row_height : 20,
	width      : 140,
	fontsize   : 12
    };

    var id = tnt.utils.iterator(1);
    var legend_cols = [];

    var legend = function () {};

    var api = tnt.utils.api (legend)
	.getset(opts);

    api.method ('add_column', function () {
	var div_id = d3.select(div)
	    .style("display", "table")
	    .attr("id");

	var new_div = d3.select(div)
	    .append("div")
	    .attr("id", div_id + "_" + id())
	    .style("display", "table-cell");

	var new_board = tnt.board()
	    .right(2)
	    .from (1)
	    .to (2)
	    .allow_drag (false)
	    .width (opts.width);

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
		.attr("font-size", track.fontsize())
		.attr("x", xScale(1))
		.attr("y", ~~track.height()/2)
		.attr("font-weight", "bold")
		.text(track.text());
	});

	var track = legend_track()
	    .display (feature);

	return track;
    });

    api.method ('line', function () {
	var feature = tnt.track.feature();

	feature.create (function (g, xScale) {
	    var track = this;
	    g
		.append("line")
		.attr("stroke", track.color())
		.attr("stroke-width", 2)
		.attr("x1", 5)
		.attr("x2", 35)
		.attr("y1", ~~(track.height()/2))
		.attr("y2", ~~(track.height()/2))

	    g
		.append("text")
		.attr("fill", "black")
		.attr("font-size", track.fontsize())
		.attr("x", 40)
		.attr("y", ~~(track.height()/2) + 4)
		.text(track.text());
	});

	var track = legend_track()
	    .display (feature);

	return track;

    });

    api.method ('square', function () {

	var feature = tnt.track.feature();
	feature.create (function (g, xScale) {
	    var track = this;
	    var w_h = ~~(track.height()*0.8);
	    g
		.append("rect")
		.attr("x", 5)
		.attr("y", 2)
		.attr("width", w_h)
		.attr("height", w_h)
		.attr("fill", track.color());

	    g
		.append("text")
		.attr("fill", "black")
		.attr("font-size", track.fontsize())
		.attr("x", 40)
		.attr("y", ~~(track.height()/2 + 4))
		.text(track.text())
	});

	var track = legend_track()
	    .display (feature);

	return track;
    });

    api.method ('circle', function () {
	var feature = tnt.track.feature()
	feature.create (function (g, xScale) {
	    var track = this;
	    var rad = ~~(track.height()/2);
	    g
		.append("circle")
		.attr("cx", rad)
		.attr("cy", ~~(rad/2))
		.attr("r", rad)
		.attr("fill", track.color());
	    g
		.append("text")
		.attr("fill", "black")
		.attr("font-size", track.fontsize())
		.attr("x", 40)
		.attr("y", ~~(track.height()/2 + 4))
		.text(track.text());
	});

	var track = legend_track()
	    .display (feature);

	return track;
    });

    api.method ('gradient', function () {
	var feature = tnt.track.feature()
	feature.create (function (g, xScale) {
	    var grad_width = 100;
	    var track = this;
	    var gradient = g
		.append("linearGradient")
		.attr("x1", "0%")
		.attr("x2", "100%")
		.attr("y1", "0%")
		.attr("y2", "0%")
		.attr("id", d3.select(div).attr("id") + "_gradient");

	    gradient
		.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", track.color1())
		.attr("stop-opacity", 1);

	    gradient
		.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", track.color2())
		.attr("stop-opacity", 1);

	    var scale = d3.scale.linear()
		.domain([track.from(), track.to()])
		.range([0,grad_width]);
	    var axis = d3.svg.axis().scale(scale).tickSize(0).ticks(2);
	    var grad_g = g
		.append("g")
		.attr("transform", "translate(5,0)");

	    var axis_g = g
		.append("g")
		.attr("transform", "translate(5," + (track.height()-15) + ")")
		.call(axis);

	    grad_g
		.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", grad_width)
		.attr("height", ~~(track.height()-15))
		.attr("fill", "url(#" + d3.select(div).attr("id") + "_gradient)");

	    grad_g
		.append("text")
		.attr("fill", "black")
		.attr("font-size", track.fontsize())
		.attr("x", 110)
		.attr("y", ~~(track.height()/2 - 3))
		.text(track.text());
	});

	// the general track
	var track = legend_track()
	    .display (feature);
	track.color = undefined;
	var api = tnt.utils.api(track);
	api
	    .getset ("color1", "yellow")
	    .getset ("color2", "red")
	    .getset ("from", 0)
	    .getset ("to", 100)

	return track;
    });


    api.method ('range', function () {
	var feature = tnt.track.feature()
	feature.create (function (g, xScale) {
	    var track = this;
	    var grad_width = 100;
	    var gradient = g
		.append("linearGradient")
		.attr("x1", "0%")
		.attr("x2", "100%")
		.attr("y1", "0%")
		.attr("y2", "0%")
		.attr("id", d3.select(div).attr("id") + "_range");
	    gradient
		.append("stop")
		.attr("offset", "0%")
		.attr("stop-color", track.color1())
		.attr("stop-opacity", 1);
	    gradient
		.append("stop")
		.attr("offset", "100%")
		.attr("stop-color", track.color2())
		.attr("stop-opacity", 1);

	    var scale = d3.scale.linear()
		.domain([track.from(), track.to()])
		.range([0, grad_width]);

	    var brush = d3.svg.brush()
		.x(scale)
		.extent(0, 1)
		.on("brushstart", brushstart)
		.on("brush", brushmove)
		.on("brushend", brushend);

	    var arc = d3.svg.arc()
		.outerRadius (track.height()/1.5)
		.startAngle (0)
		.endAngle (function (d, i) { return i ? -Math.PI : Math.PI });

	    var brushg = g
		.append("g")
		.attr("transform", "translate(5,0)")
		.call (brush);

// 	    brushg.selectAll (".resize").append("path")
// 		.attr("transform", "translate(0," + track.height() / 3.5 + ")")
// 		.attr("fill", "gray")
// 		.attr("d", arc);
	    brushg.selectAll ("rect")
		.attr("height", track.height()/2)
		.attr("fill", "url(#" + d3.select(div).attr("id") + "_range)");

	    brushstart();
	    brushmove();

	    var axis = d3.svg.axis().scale(scale).tickSize(0).ticks(2);
	    var axis_g = g
		.append("g")
		.attr("transform", "translate(5," + (track.height()-15) + ")")
		.call(axis);

	    function brushstart () {
	    }
	    function brushmove () {
		brushg.selectAll ("rect")
		    .attr("fill", "url(#" + d3.select(div).attr("id") + "_range)");
	    }
	    function brushend () {
		console.log("END!");
		console.log(brush.extent());
	    }
	});

	var track = legend_track()
	    .display (feature);
	track.color = undefined;
	var api = tnt.utils.api(track);
	api
	    .getset ("color1", "yellow")
	    .getset ("color2", "red")
	    .getset ("from", 0)
	    .getset ("to", 100);

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

    api.method ('show', function () {
	for (var i=0; i<legend_cols.length; i++) {
	    var col = legend_cols[i];
	    col.board(col.div);
	    col.board.start();
	}
    });

    var legend_track = function () {
	var track = tnt.track();

	var api = tnt.utils.api (track)
	    .getset ('color', 'black')
	    .getset ('text', '')
	    .getset ('height', opts.row_height)
	    .getset ('fontsize', opts.fontsize);

	track
	    .height (track.height())
	    .background_color ("white")
	    .data (tnt.track.data()
		   .update(
		       tnt.track.retriever.sync()
			   .retriever (function () {
			       return [{}];
			   })
		       )
		  )
	    .display (null);


	return track;
    };

    return legend;
};

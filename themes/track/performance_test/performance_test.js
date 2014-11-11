var tnt_theme = tnt_theme_track_performance_test = function () {
    // loc.searchObject.tracks && loc.searchObject.elements
    var loc = parse_url(document.URL);

    var performance;
    if ((loc.searchObject.performance === "false") || (loc.searchObject.performance == 0)) {
	performance = false;
    } else {
	performance = true;
    }

    // Blocks
    var nblocks = 10;
    var blocks = get_blocks(nblocks, d3.scale.linear().range([0,1000]).domain([0,nblocks]));

    // Track
    var track = function (i) {
	return tnt.track()
	    .height (+loc.searchObject.height || 20)
	    .track_name ("track_"+i)
	    .foreground_color("steelblue")
	    .data (tnt.track.data()
		   .update (tnt.track.retriever.sync()
			    .retriever (function () {
				return blocks;
			    })
			   )
		  )
	    .display (tnt.track.feature.block()
		      .index (function (d) {
			  return d.start;
		      })
		     );
    };

    var theme = function (board, div) {
	board
	    .axis(true)
	    .use_image(true)
	    .use_server(true)
	    .from(0)
	    .width(800)
	    .to(1000)
	    .right(1000);

	for (var i=0; i<20; i++) {
	    board
		.add_track (track(i));
	}

	board(div);
	board.start();
    };

    return theme;
};

var get_blocks = function (n, scale) {
    var blocks = [];
    for (var i=0; i<n; i++) {
	blocks.push ({
	    start : scale(i),
	    end   : scale(i)+1
	});
    }
    return blocks;
};

// uri parser
var parse_url = function (url) {
    var parser = document.createElement('a'),
    searchObject = {},
    queries, split, i;
    // Let the browser do the work
    parser.href = url;
    // Convert query string to object
    queries = parser.search.replace(/^\?/, '').split('&');
    for( i = 0; i < queries.length; i++ ) {
        split = queries[i].split('=');
        searchObject[split[0]] = split[1];
    }
    return {
        protocol: parser.protocol,
        host: parser.host,
        hostname: parser.hostname,
        port: parser.port,
        pathname: parser.pathname,
        search: parser.search,
        searchObject: searchObject,
        hash: parser.hash
    };
};

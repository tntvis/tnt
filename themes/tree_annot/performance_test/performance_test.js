var tnt_theme_tree_performance_test = function () {
    // loc.searchObject.leaves && loc.searchObject.elements
    var loc = parse_url(document.URL);
    var newick = make_newick(loc.searchObject.leaves);

    var performance;
    if ((loc.searchObject.performance === "false") || (loc.searchObject.performance == 0)) {
	performance = false;
    } else {
	performance = true;
    }

    var ta = tnt.tree_annot();
    var tree = tnt.tree();
    var annot = tnt.board().axis(true).performance(performance);

    var theme = function (div) {
	// Create a text with time / performance data
	var text = d3.select(div)
	    .append ("text")
	    .attr("id", "time_to_execute")
	    .text("");

	// Tree
	tree
	    .data (tnt.tree.parse_newick (newick))
	    .layout (tnt.tree.layout.vertical()
		     .width(400)
		     .scale(false)
		    )
	    .label (tnt.tree.label.text()
		    .height(+loc.searchObject.height || 20))
	    .on_click (function (node) {
		node.toggle()
		var start = window.performance.now();
		ta.update();
		text.text("Collapsing... " + ((window.performance.now() - start)/1000).toFixed(2) + " secs");
	    });

	// Annot
	annot
	    .from(0)
	    .width(800)
	    .to(1000)
	    .right(1000);

	var blocks = get_blocks(loc.searchObject.elements, d3.scale.linear().range([0,1000]).domain([0,loc.searchObject.elements]));
	// Track
	var track = function (leaf_node) {
	    var leaf = leaf_node.data();
	    return tnt.track()
		.data (tnt.track.data()
		       .update (tnt.track.retriever.sync()
				.retriever (function () {
				    if (leaf_node.is_collapsed()) {
					return [];
				    }
				    return blocks;
				})
			       )
		      )
		.display (tnt.track.feature.block()
			  .foreground_color("steelblue")
			  .index (function (d) {
			      return d.start;
			  })
			 );
	};

	ta
	    .tree(tree)
	    .annotation(annot)
	    .track(track);

	ta(div);
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

var make_newick = function (n) {
    if (!n || n<2) {
	n = 2;
    }
    var newick = "0";
    for (var i=1; i<n; i++) {
	newick = "(" + newick;
	newick = newick + "," + i + ")";
    };
    return newick;
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

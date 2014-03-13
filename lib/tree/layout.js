epeek.tree.layout = function () {

    var scale = false;

    var l = function () {
    };

    l.cluster = d3.layout.cluster()
	.sort(null)
	.value(function (d) {return d.length} )
	.children(function (d) {return d.branchset})
	.separation(function () {return 1});

    l.scale = function (bool) {
	if (!arguments.length) {
	    return scale;
	}
	scale = bool;
	return l;
    };

    l.yscale = function() {};  // Placeholder. This has to be defined by the 'subclasses'

    l.scale_branch_lengths = function (curr) {
	if (scale === false) {
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
    };

    return l;
};

epeek.tree.layout.vertical = function () {
    var layout = epeek.tree.layout();
    var width = 360;
    layout.translate_vis = [20,20];
    layout.transform_node = function (d) {
	return "translate(" + d.y + "," + d.x + ")"
    };
    layout.diagonal = epeek.tree.diagonal.vertical;

    layout.width = function (val) {
	if (!arguments.length) {
	    return width;
	}
	width = val;
	layout.cluster.size([width, width/1.3]);
	return layout;
    };

    layout.yscale = function (dists) {
	return d3.scale.linear()
	    .domain([0, d3.max(dists)])
	    .range([0, width-20]);
    };

    return layout;
};

epeek.tree.layout.radial = function () {
    var layout = epeek.tree.layout();
    var width = 360;
    var r = width / 2;
    layout.translate_vis = [r, r*1.3]; // TODO: 1.3 should be replaced by a sensible value
    layout.transform_node = function (d) {
	return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
    };
    layout.diagonal = epeek.tree.diagonal.radial;
    layout.width = function (val) {
	if (!arguments.length) {
	    return width;
	}
	width = val;
	var r = width / 2
	layout.cluster.size([360, r-120]);
	layout.translate_vis = [r, r*1.3];
	return layout;
    };
    layout.yscale = function (dists) {
	return d3.scale.linear()
	    .domain([0,d3.max(dists)])
	    .range([0, r]);
    };

    return layout;
};

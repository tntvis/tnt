// Based on the code by Ken-ichi Ueda in http://bl.ocks.org/kueda/1036776#d3.phylogram.js

epeek.tree.layout = function () {

    var max_width = 0;

    var l = function () {
    };

    var cluster = d3.layout.cluster()
	.sort(null)
	.value(function (d) {return d.length} )
	// .children(function (d) {return d.branchset})
	.separation(function () {return 1});

    epeek.utils.api (l)
	.getset ('scale')
	.method ({
	    cluster : cluster,
	});

    l.yscale = function() {throw "yscale is not defined in base object"};  // Placeholder. This has to be defined by the 'subclasses'
    l.adjust_cluster_size = function () {throw "adjust_cluster_size is not defined in base object"};
    l.width = function () {throw "width is not defined in the base object"};
    l.height = function () {throw "height is not defined in the base object"};

    l.scale_branch_lengths = function (curr) {
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
    };

    l.max_leaf_label_width = function (val) {
	if (!arguments.length) {
	    return max_width;
	}
	max_width = val;
	return l;
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
	return layout;
    };

    // height is only a getter
    // defines the height depending on the number of leaves
    // and the height of the labels
    layout.height = function (params) {
	return (params.n_leaves * params.label_height);
    };

    layout.yscale = function (dists) {
	return d3.scale.linear()
	    .domain([0, d3.max(dists)])
	    .range([0, width-20-layout.max_leaf_label_width()]);
    };

    layout.adjust_cluster_size = function (params) {
	var h = layout.height(params);
	var w = layout.width() - layout.max_leaf_label_width() - layout.translate_vis[0] - params.label_padding;
	layout.cluster.size([h,w]);
	return layout;
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
	var r = width / 2;
	layout.cluster.size([360, r-120]);
	layout.translate_vis = [r, r*1.3]; // TODO: Can we get rid of this if this is set in adjust_cluster_size?
	return layout;
    };

    layout.height = function () {
	return width;
    };

    layout.yscale = function (dists) {
	return d3.scale.linear()
	    .domain([0,d3.max(dists)])
	    .range([0, r]);
    };

    layout.adjust_cluster_size = function (params) {
	return;
    };

    return layout;
};

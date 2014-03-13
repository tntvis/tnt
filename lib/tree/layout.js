epeek.tree.layout = function () {

    var l = function () {
    };

    l.cluster = d3.layout.cluster()
	.sort(null)
	.value(function (d) {return d.length} )
	.children(function (d) {return d.branchset})
	.separation(function () {return 1});

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

    return layout;
};

epeek.tree.label = function () {
"use strict";

    // TODO: Not sure if we should be removing by default prev labels
    // or it would be better to have a separate remove method called by the vis
    // on update
    // We also have the problem that we may be transitioning from
    // text to img labels and we need to remove the label of a different type
    var label = function (node) {
	label.display().call(this, node)
	    .attr("class", "ePeek_tree_label")
	    .attr("transform", "translate (" + label.transform()()[0] + " " + label.transform()()[1] + ")");
    };

    var api = epeek.utils.api (label)
	.getset ('width', function () { throw "Need a width callback" })
	.getset ('height', function () { throw "Need a height callback" })
	.getset ('display', function () { throw "Need a display callback" })
	.getset ('transform', function () { return [10, 5] });

    api.method ('remove', function () {
	d3.select(this)
	    .selectAll(".ePeek_tree_label")
	    .remove();
    });

    return label;
};

// Text based labels
epeek.tree.label.text = function () {
    var label = epeek.tree.label();

    var api = epeek.utils.api (label)
	.getset ('fontsize', 10)
	.getset ('text', function (d) {
	    return d.name;
	})

    label.display (function (node) {
	var l = d3.select(this)
	    .append("text")
	    .text(function(d){
		return label.text()(d)
	    })
	    .style('font-size', label.fontsize() + "px");

	return l;
    });

    label.width (function (node) {
    	// var test_label = label;
    	// var test_text = label.text();
	return label.text()(node).length * label.fontsize();
    });

    label.height (function (node) {
	return label.fontsize();
    });

    return label;
};

// Image based labels
epeek.tree.label.img = function () {
    var label = epeek.tree.label();

    var api = epeek.utils.api (label)
	.getset ('src', function () {})

    label.display (function (node) {
	var l = d3.select(this)
	    .append("image")
	    .attr("width", label.width()())
	    .attr("height", label.height()())
	    .attr("xlink:href", label.src()(node));
	return l;
    });

    label.transform (function () {
	return ([10, -(label.height()() / 2)]);
    });

    return label;
};

// Labels made of 2+ simple labels
epeek.tree.label.composite = function () {

    var labels = [];

    var label = function (node) {
	for (var i=0; i<labels.length; i++) {
	    labels[i].call(this, node);
	}
    };

    var api = epeek.utils.api (label)

    api.method ('add_label', function (display) {
	var curr_labels = [];
	for (var i=0; i<labels.length; i++) {
	    curr_labels.push(labels[i]);
	}
	var curr_transform = display.transform();
	display.transform( function (node) {
	    var curr_offset = 0;
	    for (var i=0; i<curr_labels.length; i++) {
		curr_offset += curr_labels[i].width()(node);
		curr_offset += curr_labels[i].transform()(node)[0];
	    }
	    return ([curr_offset + curr_transform(node)[0], curr_transform(node)[1]]);
	});

	labels.push(display);
	return label;
    });

    api.method ('width', function () {
	return function (node) {
	    var tot_width = 0;
	    for (var i=0; i<labels.length; i++) {
		tot_width = tot_width + parseInt(labels[i].width()(node));
		tot_width = tot_width + parseInt(labels[i].transform()(node)[0]);
	    }

	    return tot_width;
	}
    });

    api.method ('height', function () {
	return function (node) {
	    var max_height = 0;
	    for (var i=0; i<labels.length; i++) {
		var curr_height = labels[i].height()(node);
		if ( curr_height > max_height) {
		    max_height = curr_height;
		}
	    }
	    return max_height;
	}
    });

    api.method ('remove', function (node) {
	for (var i=0; i<labels.length; i++) {
	    labels[i].remove.call(this, node);
	}
    });

    return label;
};

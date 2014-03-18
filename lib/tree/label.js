epeek.tree.label = function () {
"use strict";

    // TODO: Not sure if we should be removing by default prev labels
    // or it would be better to have a separate remove method called by the vis
    // on update
    // We also have the problem that we may be transitioning from
    // text to img labels and we need to remove the label of a different type
    var label = function (node) {
	display_cbak.call(this, node)
	    .attr("class", "ePeek_tree_label")
	    .attr("transform", "translate (" + transform_cbak()[0] + " " + transform_cbak()[1] + ")");
    };

    // Placeholders. They should be overwritten by 'subclasses'
    var width_cbak = function () {};
    var display_cbak = function () {};
    var transform_cbak = function () { return [10, 5] };

    // Getters / Setters
    label.width = function (cbak) {
	if (!arguments.length) {
	    return width_cbak;
	}
	width_cbak = cbak;
	return label;
    };

    label.transform = function (cbak) {
	if (!arguments.length) {
	    return transform_cbak;
	}
	transform_cbak = cbak;
	return label;
    };

    // TODO: This is the default of epeek.tree.label.text
    // I'm not sure if it should be also the default of the general
    // epeek.tree.label
    label.display = function (cbak) {
	if (!arguments.length) {
	    return display_cbak;
	}
	display_cbak = cbak;
	return label;
    }

    label.remove = function () {
	d3.select(this)
	    .selectAll(".ePeek_tree_label")
	    .remove();
    };

    return label;
};

// Text based labels
epeek.tree.label.text = function () {
    var label = epeek.tree.label();

    var text = function (d) {
	return d.name;
    };

    label.display(function (node) {
	var l = d3.select(this)
	    .append("text")
	    .text(function(d){return label.text()(d)});
	return l;
    });

    label.text = function (cbak) {
	if (!arguments.length) {
	    return text;
	}
	text = cbak;
	return label;
    };

    label.width(function (node) {
	return label.text()(node).length;
    })

    return label;
};

// Image based labels
epeek.tree.label.img = function () {
    var label = epeek.tree.label();

    // No defaults
    var src = function () {};
    var height_cbak = function () {};

    label.display(function (node) {
	var l = d3.select(this)
	    .append("image")
	    .attr("width", label.width()())
	    .attr("height", label.height()())
	    .attr("xlink:href", src(node));
	return l;
    });

    label.transform(function () {
	return ([10, -(label.height()() / 2)]);
    });

    // Getters / Setters
    label.src = function (cbak) {
	if (!arguments.length) {
	    return src;
	}
	src = cbak;
	return label;
    };

    label.height = function (cbak) {
	if (!arguments.length) {
	    return height_cbak;
	}
	height_cbak = cbak;
	return label;
    };

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

    label.add_label = function (display) {
	labels.push(display);

	return label;
    }

    label.width = function () {
	return function (node) {
	    var tot_width = 0;
	    for (var i=0; i<labels.length; i++) {
		tot_width += labels[i].width()(node);
	    }
	    return tot_width;
	}
    }

    label.remove = function () {
	d3.select(this)
	    .selectAll(".ePeek_tree_label")
	    .remove();
    };

    return label;
};

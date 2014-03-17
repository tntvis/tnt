epeek.tree.label = function () {
"use strict";

    var label = function () {
    };

    var width_cbak = function (node) {
	if (node === undefined) {
	    return 0;
	}
	return node.name.length;
    };

    label.width = function (cbak) {
	if (!arguments.length) {
	    return width_cbak;
	}
	width_cbak = cbak;
	return label;
    };

    label.show = function (node) {
	display_cbak.call(this, node)
	    .attr("class", "ePeek_tree_label")
	    .attr("transform", "translate(10 5)");
    };

    // TODO: This is the default of epeek.tree.label.text
    // I'm not sure if it should be also the default of the general
    // epeek.tree.label
    var display_cbak = function (node) {
	var l = d3.select(this)
	    .append("text")
	    .text(function (d) {return d.name});
	return l;
    };

    label.display = function (cbak) {
	if (!arguments.length) {
	    return display_cbak;
	}
	display_cbak = cbak;
	return label;
    }

    return label;
};

epeek.tree.label.text = function () {
    var label = epeek.tree.label();

    label.display(function (node) {
	var l = d3.select(this)
	    .append("text")
	    .text(function(d){return label.text()(d)});
	return l;
    });

    var text = function (d) {
	return d.name;
    };

    label.text = function (cbak) {
	if (!arguments.length) {
	    return text;
	}
	text = cbak;
	return label;
    };

    return label;
};
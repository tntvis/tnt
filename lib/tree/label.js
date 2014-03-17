epeek.tree.label = function () {
"use strict";

    // TODO: Not sure if we should be removing by default prev labels
    // or it would be better to have a separate remove method called by the vis
    // on update
    var label = function (node) {
	remove_cbak.call(this, node);
	display_cbak.call(this, node)
	    .attr("class", "ePeek_tree_label")
	    .attr("transform", "translate (10 5)");
    };

    // Placeholders. They should be overwritten by 'subclasses'
    var width_cbak = function () {};
    var remove_cbak = function () {};
    var display_cbak = function () {};

    // Getters / Setters
    label.width = function (cbak) {
	if (!arguments.length) {
	    return width_cbak;
	}
	width_cbak = cbak;
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

    label.remove = function (cbak) {
	if (!arguments.length) {
	    return remove_cbak;
	}
	remove_cbak = cbak;
	return label;
    };

    return label;
};

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

    label.remove(function (node) {
	var l = d3.select(this).select("text").remove()
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


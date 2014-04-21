epeek.tree_annot = function () {
"use strict";

    var tree_conf = {
	tree : undefined,
	annot : undefined
    };

    var div_id;

    var tree_annot = function (div) {
	div_id = d3.select(div)
	    .attr("id");

	var group_div = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_groupDiv");

	var tree_div = group_div
	    .append("div")
	    .attr("class", "ePeek_tree_container");

	var annot_div = group_div
	    .append("div")
	    .attr("class", "ePeek_annot_container");

	tree_conf.tree (tree_div.node());
	
    };

    var api = epeek.utils.api (tree_annot)
	.getset (tree_conf);

    return tree_annot;
};

var tnt_theme_tree_tooltip_async = function() {
    "use strict";

    var ensRest = tnt.eRest();

    var tree_theme = function (tree_vis, div) {

	var newick = "((Homo_sapiens, Pan_troglodytes), Mus_musculus)";

	tree_vis
	    .data(tnt.tree.parse_newick(newick))
	    .duration(2000)
	    .layout(tnt.tree.layout.radial()
		    .width(600)
		    .scale(false))
	    .on_click(tree_vis.tooltip());

	var t = tnt.tooltip.table()
	    .position("auto")
	    .width(180);


	var tree_tooltip = function (node) {
	    ensRest.call({
		url : ensRest.url.assembly({
		    species : node.node_name()
		}),
		success : function (resp) {
		    console.log(resp);
		    var obj = {};
		    obj.header = {
			label : "Name",
			value : node.node_name()
		    };
		    obj.rows = [];
		    obj.rows.push({
			label : "Assembly",
			value : resp.assembly_name
		    })
		    t.call (this, obj);
		}
	    });
	};

	// tree_vis.label().on_click(tree_tooltip);
	tree_vis.on_click(tree_tooltip);

	// The visualization is started at this point
	tree_vis(div);
    };

    return tree_theme;
};

var epeek_theme_tree_cafe_tree = function() {
    "use strict";

    var theme = function (tree, div) {

        var label = epeek.tree.label.text()
            .text(function (node) {
                if (node.children) {
                    return node.n_members;
                } else {
                    return node.n_members + " " + node.tax.scientific_name;
                }
            })
            .fontsize(10)
	    .height(15);

	// var tooltip = epeek.tooltip.table();

	d3.json('/themes/cafe_trees/ENSGT00550000074414.json',
		function (err, resp) {
		    deploy_vis(resp);
		});

	// TREE SIDE
	var deploy_vis = function (tree_obj) {
	    tree
		.data (tree_obj.tree)
		.layout (epeek.tree.layout.vertical()
			 .width(630)
			 .scale(false)
			)
		.label (label)
		.link_color (function (link) {
		    var target_node = link.target;
		    if (target_node && target_node.is_node_significant) {
			if (target_node.is_expansion) {
			    return "red";
			} else {
			    return "green";
			}
		    }
		    if (target_node.n_members === 0) {
			return "lightgrey";
		    }
		    return "black";
		})
		.node_color (function (node) {
		    if (node.n_members === 0) {
			return 'lightgrey';
		    }
		    return 'steelblue';
		})
		.node_info (tree.tooltip());


	    tree(div);
	}
    }

    return theme;
};

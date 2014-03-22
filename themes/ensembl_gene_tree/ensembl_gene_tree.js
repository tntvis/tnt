var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {
	// In the div, we set up a "select" to transition between a radial and a vertical tree
	var menu_pane = d3.select(div)
	    .append("div")
	    .append("span")
	    .text("Layout:  ");

	var sel = menu_pane
	    .append("select")
	    .on("change", function(d) {
		switch (this.value) {
		case "unscaled" :
		    sT.layout().scale(false);
		    break;
		case "scaled" :
		    sT.layout().scale(true);
		    break;
		};
		sT.update();
	    });

	sel
	    .append("option")
	    .attr("value", "unscaled")
	    .attr("selected", 1)
	    .text("Unscaled");
	sel
	    .append("option")
	    .attr("value", "scaled")
	    .text("Scaled");

	var label = epeek.tree.label.text()
	    .text(function (node) {
		if (node.children) {
		    return "";
		} else {
		    console.log(node);
		    return node.id.accession
		}
	    });

	sT
	    .layout(epeek.tree.layout.vertical().width(600).scale(false))
	    .label(label);

	var rest = epeek.eRest();

	var gene_tree_id = "ENSGT00390000003602";
	var gene_tree_url = rest.url.gene_tree({
	    id : gene_tree_id
	});
	rest.call ({url : gene_tree_url,
		    success : function (tree) {
			sT.data(tree.tree);
			sT(div);
		    }
		   });
    };

    return tree_theme;
};

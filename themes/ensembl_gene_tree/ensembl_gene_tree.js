var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {

	var label = epeek.tree.label.text()
	    .text(function (node) {
		if (node.children) {
		    return "";
		} else {
		    return node.id.accession
		}
	    })
	    .fontsize(10);

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

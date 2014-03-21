var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {

// 	var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,mus_musculus:95)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;"

	var newick = "((homo_sapiens,pan_troglodytes),mus_musculus);";

	var data = epeek.tree.parse_newick(newick);
	var tree = epeek.tree.tree(data);

	sT
	    .data(data)
	    .duration(2000)
	    .layout(epeek.tree.layout.vertical().width(600).scale(false));

	// The visualization is started at this point
	sT(div);

	setTimeout(function() {
	    tree.sort(function (node) {
		return node.id() === 5;
	    });
	    sT.update();
	}, 2000);

    };

    return tree_theme;
};

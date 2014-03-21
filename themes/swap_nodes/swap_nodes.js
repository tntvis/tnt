var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {

// 	var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,mus_musculus:95)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;"

	// var newick = "((homo_sapiens,pan_troglodytes),mus_musculus);";

	var newick = "(((2,4),(5,1)),3)";

	var data = epeek.tree.parse_newick(newick);

	sT
	    .data(data)
	    .duration(2000)
	    .layout(epeek.tree.layout.vertical().width(600).scale(false));

	var tree = sT.tree();

	// The visualization is started at this point
	sT(div);

	setTimeout(function() {

            // Helper function to get the lowest value in                                                   
            // the subnode -- this is used in the sort cbak
            var get_lowest_val = function (node) {
                var lowest = 1000;
		node.apply(function (n) {
                    if (n.node_name() === "") {
			return;
                    }
                    var val = parseInt(n.node_name());
                    if (val < lowest) {
                        lowest = val;
                    }
                });
                return lowest;
            };

            tree.sort(function (node1, node2) {
                var lowest1 = get_lowest_val(node1);
                var lowest2 = get_lowest_val(node2);
                if (lowest1 < lowest2) return -1;
                if (lowest1 > lowest2) return 1;
                return 0;
            });


	    // tree.sort(function (node1, node2) {
	    // 	if (node1.present(function (n) {
            //         return n.id() === 5;
            //     })) {
            //         return -1;
	    // 	}
            //     if (node2.present(function (n) {
            //         return n.id() === 5;
            //     })) {
            //         return 1
            //     }
            //     return 0
	    // });

	    // tree.sort(function (node) {
	    // 	return node.id() === 5;
	    // });
	    sT.update();
	}, 2000);

    };

    return tree_theme;
};

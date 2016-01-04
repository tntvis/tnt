var tnt_theme_tree_compare = function () {

    // The height of tree labels and tracks
    var height = 30;

    // Create tree and annot
    var tree = tnt.tree();
    var annot = tnt.board();
    var label_now;


    var theme = function (ta, div) {


    var newick = "(((((homo_sapiens,pan_troglodytes),callithrix_jacchus),mus_musculus),taeniopygia_guttata),danio_rerio);";

    var newick2 = "(((((mus_musculus,homo_sapiens),taeniopygia_guttata),danio_rerio);";


	var label_en = tnt.tree.label.text()
            .text(function (node) {
                if (node.children) {
                    return "";
                } else {
                    return node.id.accession;
                }
            })
            .fontsize(10)
	    .height(height);

	var sel = d3.select(div)
	    .append("select")
	    .on("change", function () {
    		var cond;
    		if (this.value === 'Example Tree') {
    		    tree
    	    		.data (tnt.tree.parse_newick (newick))
    	    		.layout (tnt.tree.layout.vertical()
                        .width(430)
                        .scale(false))
    	    		.label (tnt.tree.label.text()
                        .height(height)
                    );
    		}

            if (this.value === 'Example Tree 2') {
                tree
                    .data (tnt.tree.parse_newick (newick2))
                    .layout (tnt.tree.layout.vertical()
                        .width(430)
                        .scale(false)
                    )
                    .label (tnt.tree.label.text()
                        .height(height)
                    );
            }

    		ta.update();
	    });


	sel
	    .append("option")
	    .attr("selected", 1)
	    .text("Example Tree ");

	sel
	    .append("option")
	    .text("Example Tree 2");

	tree
	    .data (tnt.tree.parse_newick (newick))
	    .layout (tnt.tree.layout.vertical()
		     .width(430)
		     .scale(false)
         )
	    .label (tnt.tree.label.text()
		    .height(height)
        );


	// collapse nodes on click
    tree.on("click", (function(node){
        node.toggle();
        ta.update();
    }));

	// TRACK SIDE
	annot
	    .from(0)
	    .to(1000)
	    .width(300)
	    .max(1000);

	var track = function (leaf_node) {
	    var leaf = leaf_node.data();
	    var sp = leaf.name;
        return tnt.board.track()
            .color("#EBF5FF")
            .data (tnt.board.track.data.sync()
                .retriever (function () {
                    return data[sp] || [];
                })
            )
            .display(tnt.board.track.feature.ensembl()
                .color("green")
                .index(function (d) {
                    return d.start;
                })
            );
	};

	ta.tree(tree);
//	ta.key(function (node) { return node.data().name });
	ta.key('name');
	ta.annotation(annot);
	ta.ruler("both");
	ta.track(track);

	ta(div);
    };

    return theme;
};


var data = {
    'homo_sapiens' : [
	{
	    type  : 'high',
	    start : 700,
	    end   : 800
	},
	{
	    start : 350,
	    end   : 423
	}
    ],
    'pan_troglodytes' : [
	{
	    start : 153,
	    end   : 160
	},
	{
	    start : 250,
	    end   : 333
	},
	{
	    start : 550,
	    end   : 633
	}
    ],
    'callithrix_jacchus' : [
	{
	    type  : 'high',
	    start : 250,
	    end   : 333
	}
    ],
    'mus_musculus' : [
	{
	    type  : 'high',
	    start : 24,
	    end   : 123
	},
	{
	    start : 553,
	    end   : 564
	}
    ],
    'taeniopygia_guttata' : [
	{
	    start : 450,
	    end   : 823
	}
    ],
    'danio_rerio' : [
	{
	    start : 153,
	    end   : 165
	}
    ]

};

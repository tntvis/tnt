var epeek_theme_tree_ensembl_genetree_annot = function() {
    "use strict";

    var height = 30;

    var tree = epeek.tree();
    var annot = epeek.track();

    var theme = function (ta, div) {

        var label = epeek.tree.label.text()
            .text(function (node) {
                if (node.children) {
                    return "";
                } else {
                    return node.id.accession
                }
            })
            .fontsize(10)
	    .height(height);

	var rest = epeek.eRest();

	var gene_tree_id = "ENSGT00390000003602";
	var gene_tree_url = rest.url.gene_tree ({
	    id : gene_tree_id,
	    aligned : true
	});

	rest.call ({url : gene_tree_url,
		    success : function (resp) {
			deploy_vis(resp)
		    }
		   });

	// TREE SIDE
	var deploy_vis = function (tree_obj) {
	    tree
		.data (tree_obj.tree)
		.layout (epeek.tree.layout.vertical()
			 .width(430)
			 .scale(false)
			)
		.label (label);

	    // var reduce = function (raw) {
	    // 	var obj = {};

	    // 	for (var i=0; i<raw[0].length; i++) {

	    // 	}

	    // };

	    var process_aln = function (seqs) {
		var cons_seqs = {};
		for (var i=0; i<seqs.length; i++) {
		    cons_seqs[seqs[i].data()._id] = [];
		}

		for (var i=0; i<seqs[0].data().sequence.mol_seq.seq.length; i++) {
		    var cons = {};
		    for (var j=0; j<seqs.length; j++) {
			var p = seqs[j].data();
			if (cons[p.sequence.mol_seq.seq[i]] === undefined) {
			    cons[p.sequence.mol_seq.seq[i]] = 0;
			}
			cons[p.sequence.mol_seq.seq[i]]++;
		    }

		    for (var j=0; j<seqs.length; j++) {
			var val = cons[seqs[j].data().sequence.mol_seq.seq[i]] / seqs.length;
			var f = 0;
			if (val > 0.33 && val < 0.66) {
			    f = 1;
			}
			if (val > 0.66) {
			    f = 2;
			}
			cons_seqs[seqs[j].data()._id].push(f);
		    }
		}

		console.log(cons_seqs);
	    };

	    process_aln(tree.tree().get_all_leaves());

	    // TRACK SIDE
	    annot
		.from(0)
		.to(1000)
		.width(300)
		.right(1000);

	    var track = function (leaf) {
		var sp = leaf.name;
		return epeek.track.track()
                    .foreground_color("steelblue")
                    .background_color("#EBF5FF")
                    .data (epeek.track.data()
			   .index("start")
			   .update ( epeek.track.retriever.sync()
				     .retriever (aln_process)
				   )
			  )
		    .display(epeek.track.feature.ensembl());
            };

	    ta.tree(tree);
	    ta.annotation(annot);
	    ta.ruler("both");
	    ta.track(track);
	    
	    ta(div);
	}
    }

    return theme;
};

var data = {
    'homo_sapiens' : [
        {
            type  : 'high',
            start : 233,
            end   : 260
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

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


	d3.json('/themes/ensembl_genetree_annot/ENSGT00390000003602.json', function (err, resp) {
	    deploy_vis(resp);
	});

	// rest.call ({url : gene_tree_url,
	// 	    success : function (resp) {
	// 		deploy_vis(resp)
	// 	    }
	// 	   });

	// TREE SIDE
	var deploy_vis = function (tree_obj) {
	    tree
		.data (tree_obj.tree)
		.layout (epeek.tree.layout.vertical()
			 .width(430)
			 .scale(false)
			)
		.label (label);

	    var reduce_row = function (row) {
		var data = [];
		var curr = {
		    streak : 0,
		    val    : undefined,
		    start  : 1
		};
		var curr_streak = 0;
		for (var i=0; i<row.length; i++) {
		    if (curr.val === undefined) {
			curr.val = row[i];
		    }
		    if (row[i] === curr.val) {
			curr.streak++;
		    } else {
			if (curr.val > 0 && curr.streak > 5) {
			    data.push ({ start : curr.start,
					 end   : i,
					 type  : (curr.val > 1) ? 'high' : 'low'
				      });
			}
			curr.streak = 1;
			curr.val    = row[i];
			curr.start  = i;
		    }
		}
		if (curr.val > 0) {
		    data.push ({ start : curr.start,
				end   : row.length,
				 type  : (curr.val > 1) ? 'high' : 'low'
			      });
		}

		return data;
	    };

	    var reduce = function (rows) {
		var obj = {};

		var red = epeek.utils.reduce();
		for (var id in rows) {
		    if (rows.hasOwnProperty (id)) {
			// obj[id] = reduce_row(rows[id]);
			obj[id] = red(rows[id]);
		    }
		}

		return obj;
	    };

	    var process_aln = function (seqs) {
		var cons_seqs = {};
		var conservation = {};
		for (var i=0; i<seqs.length; i++) {
		    cons_seqs[seqs[i].data()._id] = [];
		}

		for (var i=0; i<seqs.length; i++) {
		    conservation[seqs[i].data()._id] = [];
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
			conservation[seqs[j].data()._id].push({
			    pos : i,
			    val : val
			})
		    }
		}

		// var processed = reduce (cons_seqs);
		// return processed;
		return reduce (conservation);
	    };

	    var leaves = tree.tree().get_all_leaves();
	    var data = process_aln(leaves);

	    // TRACK SIDE
	    annot
		.from(0)
		.width(300);

	    var track = function (leaf) {
		var id = leaf._id;
		return epeek.track.track()
                    .foreground_color("steelblue")
                    .background_color("#EBF5FF")
                    .data (epeek.track.data()
			   .update ( epeek.track.retriever.sync()
				     .retriever (function () {
					 return data[id] || [];
				     })
				   )
			  )
		    .display(epeek.track.feature.area()
			     .index(function (d) {
				 return d.pos;
			     }));
            };

	    var max_val = d3.max(leaves, function (d) {return d.data().sequence.mol_seq.seq.length});

	    ta.tree(tree);
	    ta.annotation(annot
			  .to(max_val)
			  .right(max_val)
			  .zoom_out(max_val)
			 );
	    ta.ruler("both");
	    ta.track(track);
	    
	    ta(div);
	}
    }

    return theme;
};

"use strict";
var tnt_theme_tree_hog = function () {

    var height = 30;
    var curr_taxa = '';
    var annot;
    // var collapsed_nodes = [];

    var theme = function (ta, div) {
	/////////////
	// TREE /////
	/////////////

	// Nodes shapes / colors
	var collapsed_node = tnt.tree.node_display.triangle()
	    .fill("grey")
	    .size(4);
	var leaf_node = tnt.tree.node_display.circle()
	    .fill("black")
	    .size(4);
	var int_node = tnt.tree.node_display.circle()
	    .fill("black")
	    .size(2);
	var highlight_node = tnt.tree.node_display.circle()
	    .fill("brown")
	    .size(6);
	var node_display = tnt.tree.node_display.cond()
	    .add ("highlight", function (node) {
		return false;
	    }, highlight_node)
	    .add ("collapsed", function (node) {
		return node.is_collapsed()
	    }, collapsed_node)
	    .add ("leaf", function (node) {
		return node.is_leaf();
	    }, leaf_node)
	    .add ("internal", function (node) {
		return !node.is_leaf();
	    }, int_node);

	// mouse over a node
	var mouse_over_node = function (node) {
	    // Update annotation board
	    var name = node.node_name();
	    curr_taxa = name;
	    annot.update();

	    
	    var highlight_condition = function (n) {
		return node.id() === n.id();
	    };
	    node_display.update("highlight", highlight_condition, highlight_node);

	    ta.update();
	};

	var tree = tnt.tree()
	    .data (tnt.tree.parse_newick (tree_newick3))
	    .layout (tnt.tree.layout.vertical()
		     .width(400)
		     .scale(false)
		    )
	    .label (tnt.tree.label.text()
		    .fontsize(12)
		    .height(height)
		    .text (function (node) {
			var data = node.data();
			if (node.is_collapsed()) {
			    return "[" + node.n_hidden() + " hidden taxa]";
			}
			return data.name.replace (/_/g, ' ');
		    })
		    .color (function (node) {
			if (node.is_collapsed()) {
			    return 'grey';
			}
			return 'black';
		    })
		   )
	    .link_color ("black")
	    .on_mouseover (mouse_over_node)
	    .node_display(node_display)
	    .link_color ("black");

	curr_taxa = tree.root().node_name();

	/////////////////////////
	//// PARSE HOG INFO /////
	/////////////////////////
	var maxs = get_maxs(per_species3);

	// TnT doesn't have the features we need, so create ower own
	var hog_feature = tnt.track.feature()
	    .index (function (d) {
	    	return d.id;
	    })
	    .create (function (new_hog, x_scale) {
		var track = this;
	    	var padding = ~~(track.height() - (track.height() * 0.8)) / 2; // TODO: can this be factored out??
	    	// otherwise it is repeated with every create event

		var new_boundary = new_hog
		    .append ("line")
		    .attr ("class", "hog_boundary")
		    .attr ("x1", function (d, i) {
			return (d.total_genes * track.height()) + (d.hog * 20) + 10;
		    })
		    .attr ("x2", function (d, i) {
			return (d.total_genes * track.height()) + (d.hog * 20) + 10;
		    })
		    .attr("y1", 0)
		    .attr("y2", track.height())
		    .attr("stroke-width", 2)
		    .attr("stroke", "black");
	    })
	    .updater (function (hogs, x_scale) {
		var track = this;
	    	var padding = ~~(track.height() - (track.height() * 0.8)) / 2; // TODO: can this be factored out??

		hogs.select("line")
		    .transition()
		    .attr("x1", function (d, i) {
			return (d.total_genes * track.height()) + (d.hog * 20) + 10;
		    })
		    .attr("x2", function (d, i) {
			return (d.total_genes * track.height()) + (d.hog * 20) + 10;
		    })
	    })

	var hog_gene_feature = tnt.track.feature()
	    .index (function (d) {
		return d.id;
	    })
	    .create (function (new_elems, x_scale) {
	    	var track = this;
	    	var padding = ~~(track.height() - (track.height() * 0.8)) / 2; // TODO: can this be factored out??
	    	// otherwise it is repeated with every create event
	    	var side = track.height() - ~~(padding * 2);

	    	new_elems
	    	    .append ("rect")
	    	    .attr ("class", "hog_gene")
	    	    .attr ("x", function (d) {
			return (d.pos * track.height()) + (d.hog * 20) + padding
    		    })
	    	    .attr ("y", padding)
	    	    .attr ("width", side)
	    	    .attr ("height", side)
	    	    .attr ("fill", "grey")
	    })

	    .updater (function (elems, x_scale) {
		var track = this;
	    	var padding = ~~(track.height() - (track.height() * 0.8)) / 2; // TODO: can this be factored out??
	    	// otherwise it is repeated with every create event
	    	var side = track.height() - ~~(padding * 2);

		elems.select ("rect")
		    .transition()
		    .attr("x", function (d) {
			return (d.pos * track.height()) + (d.hog * 20) + padding;
		    });
	    });

	annot = tnt.board()
	    .from(0)
	    .zoom_in(1)
	    .allow_drag(false)
	    .to(5)
	    .width(800) // TODO: This shouldn't be hardcoded?
	    .right(5);

	var track = function (leaf) {
	    var sp = leaf.node_name();
	    return tnt.track()
		.background_color('#E8E8E8')
		.data (tnt.track.data()
		       .update ( tnt.track.retriever.sync()
				 .retriever (function () {
				     // return _.flatten(per_species2[sp].Vertebrates);
				     // return per_species2[sp].Vertebrates;
				     if (per_species3[sp] === undefined) {
					 return {
					     genes : [],
					     hogs : []
					 };
				     }
				     return genes_2_xcoords (per_species3[sp][curr_taxa], maxs[curr_taxa]);
				 })
			       )
		      )
		.display (tnt.track.feature.composite()
			  .add ("genes", hog_gene_feature)
			  .add ("hogs", hog_feature)
			 )
	};

	var genes_2_xcoords = function (arr, maxs) {
	    if (arr === undefined) {
		return {
		    genes : [],
		    hogs : []
		};
	    }
	    var genes = [];
	    var hogs_boundaries = [];
	    var total_pos = 0;
	    for (var hog=0; hog<arr.length; hog++) {
		var hog_gene_names = [];
		var hog_genes = arr[hog];
		var max_in_hog = maxs[hog];
		for (var gene_pos=0; gene_pos<max_in_hog; gene_pos++) { // TODO: wasting cycles (up to max_in_hog)
		    var gene = hog_genes[gene_pos];
		    if (gene !== undefined) {
			genes.push ({
			    id : gene,
			    hog : hog,
			    pos : total_pos,
			    max_in_hog : maxs[hog],
			    pos_in_hog : gene_pos
			});
			hog_gene_names.push (gene);
		    }
		    total_pos++;		    
		}
		hogs_boundaries.push({
		    total_genes : total_pos,
		    hog : hog,
		    id  : hog_gene_names.length ? hog_gene_names.join('_') : ("hog_" + hog)
		});
	    }

	    return {
		"genes" : genes,
		"hogs"  : hogs_boundaries
	    }
	};

	ta.tree(tree);
	ta.annotation(annot);
	ta.track(track);
	ta(div);

    };

    // converts the argument into an arrays
    // if the argument is already an array, just returns it
    // NOTE: AFAIK, this is not used now
    var obj2array = function (o) {
	if (o === undefined) {
	    return [];
	}

	if (Object.prototype.toString.call(o) === '[object Array]') {
	    return o;
	}

	return [o];
    };

    // get maximum number of genes per hog accross species
    var get_maxs = function (ps2) {
	var maxs = {};
	var i, sp, internal;
	for (sp in ps2) {
	    if (ps2.hasOwnProperty(sp)) {
		var sp_data = ps2[sp];
		for (internal in sp_data) {
		    if (maxs[internal] === undefined) {
			maxs[internal] = [];
		    }
		    if (sp_data.hasOwnProperty(internal)) {
			var internal_data = sp_data[internal];
			for (i=0; i<internal_data.length; i++) {
			    if ((maxs[internal][i] === undefined) ||
				(maxs[internal][i] < internal_data[i].length)) {
				maxs[internal][i] = internal_data[i].length;
			    }
			}
		    }
		}
	    }
	}
	return maxs;
    };

    return theme;
};

var tree_newick = '((((Human, Chimp)Primates, (Rat, Mouse)Rodents)Euarchontoglires, Dog)Mammals, Frog)Vertebrates';
var tree_newick3 = '(((((((Human, Chimp)Primates, (Rat, Mouse)Rodents)Euarchontoglires, Dog)Mammals, Frog)Tetrapoda, (Zebrafish, Pufferfish)Neopterygii)Vertebrates,(CionaS, CionaI)Ciona)Chordata';

var per_species3 = {
    'Human' : {
	'Human'            : [[1], [2], [3], [4], [5, 6]],
	'Primates'         : [[1], [2], [3], [4], [5, 6]],
	'Euarchontoglires' : [[1, 2], [3], [4, 5, 6]],
	'Mammals'          : [[1, 2, 3], [4, 5, 6], []],
	'Tetrapoda'        : [[1, 2, 3], [4, 5, 6], []],
	'Vertebrates'      : [[1, 2, 3, 4, 5, 6], []],
	'Chordata'         : [[1, 2, 3, 4, 5, 6], [], []]
    },
    'Chimp' : {
	'Chimp'            : [[11], [12], [13], [14], [15, 16, 17]],
	'Primates'         : [[11], [12], [13], [14], [15, 16, 17]],
	'Euarchontoglires' : [[11, 12], [13], [14, 15, 16], [17]],
	'Mammals'          : [[11, 12, 13], [14, 15, 16, 17], []],
	'Tetrapoda'        : [[11, 12, 13], [14, 15, 16, 17], []],
	'Vertebrates'      : [[11, 12, 13, 14, 15, 16, 17], []],
	'Chordata'         : [[11, 12, 13, 14, 15, 16, 17], [], []]
    },
    'Mouse' : {
	'Mouse'            : [[21], [22], [23, 24, 25], [26], [27],[28]],
	'Rodents'          : [[21], [22], [23, 24, 25], [26], [27],[28]],
	'Euarchontoglires' : [[21, 22], [], [23, 24, 25], [26], [27, 28]],
	'Mammals'          : [[21, 22], [23, 24, 25, 26], [27, 28]],
	'Tetrapoda'        : [[21, 22], [23, 24, 25, 26], [27, 28]],
	'Vertebrates'      : [[21, 22, 23, 24, 25, 26], [27, 28]],
	'Chordata'         : [[21, 22, 23, 24, 25, 26], [27, 28], []]
    },
    'Rat' : {
	'Rat'              : [[31], [32], [33, 34, 35], [36], [37]],
	'Rodents'          : [[31], [32], [33, 34, 35], [36], [37]],
	'Euarchontoglires' : [[31, 32], [], [33, 34, 35], [36], [37]],
	'Mammals'          : [[31, 32], [33, 34, 35, 36], [37]],
	'Tetrapoda'        : [[31, 32], [33, 34, 35, 36], [37]],
	'Vertebrates'      : [[31, 32, 33, 34, 35, 36], [37]],
	'Chordata'         : [[31, 32, 33, 34, 35, 36], [37], []]
    },
    'Dog' : {
	'Dog'              : [[41], [42, 43]],
	'Mammals'          : [[41], [42, 43], []],
	'Tetrapoda'        : [[41], [42, 43], []],
	'Vertebrates'      : [[41, 42, 43], []],
	'Chordata'         : [[41, 42, 43], [], []]
    },
    'Frog' : {
	'Frog'             : [[51], [52]],
	'Tetrapoda'        : [[51], [52], []],
	'Vertebrates'      : [[51, 52], []],
	'Chordata'         : [[51, 52], [], []]
    },
    'Zebrafish' : {
	'Zebrafish'        : [[61, 62], [63], [64, 65]],
	'Neopterygii'      : [[61, 62], [63], [64, 65]],
	'Vertebrates'      : [[61, 62], [63, 64, 65]],
	'Chordata'         : [[61, 62], [63, 64, 65], []]
    },
    'Pufferfish' : {
	'Pufferfish'       : [[71, 72], [73]],
	'Neopterygii'      : [[71, 72], [], [73]],
	'Vertebrates'      : [[71, 72], [73]],
	'Chordata'         : [[71, 72], [73], []]
    },
    'CionaS' : {
	'CionaS'           : [[81, 82, 83, 84, 85], [86], [87, 88, 89]],
	'Ciona'            : [[81, 82, 83, 84, 85], [86], [87, 88, 89]],
	'Chordata'         : [[81, 82, 83, 84, 85], [], [86, 87, 88, 89]]
    },
    'CionaI' : {
	'CionaI'           : [[91, 92], [93, 94, 95]],
	'Ciona'            : [[91, 92], [], [93, 94, 95]],
	'Chordata'         : [[91, 92], [], [94, 95, 96]]
    }
};

// var per_species2 = {
//     'Human' : {
// 	'Vertebrates'      : [[1], [2], [3]],
// 	'Mammals'          : [[1], [2], [3]],
// 	'Euarchontoglires' : [[1], [2], [3], []],
// 	'Primates'         : [[1], [2], [3], []]
//     },
//     'Chimp' : {
// 	'Vertebrates'      : [[11], [12], [13, 14]],
// 	'Mammals'          : [[11], [12], [13, 14]],
// 	'Euarchontoglires' : [[11], [12], [13], [14]],
// 	'Primates'         : [[11], [12], [13], [14]]
//     },
//     'Mouse' : {
// 	'Vertebrates'      : [[31], [32], [33, 34]],
// 	'Mammals'          : [[31], [32], [33, 34]],
// 	'Euarchontoglires' : [[31], [32], [33], [34]],
// 	'Rodents'          : [[31], [32], [33], [34]]
//     },
//     'Rat' : {
// 	'Vertebrates'      : [[41], [], []],
// 	'Mammals'          : [[41], [], []],
// 	'Euarchontoglires' : [[41], [], [], []],
// 	'Rodents'          : [[41], [], [], []]
//     },
//     'Dog' : {
// 	'Vertebrates'      : [[21], [22], [23]],
// 	'Mammals'          : [[21], [22], [23]]
//     },
//     'Frog' : {
// 	'Vertebrates'      : [[51], [], [53]]
//     }
// };

// var per_species = {
//     'Vertebrates' : [
// 	{
// 	    'GeneRef' : {
// 		'Human' : [1],
// 		'Chimp' : [11],
// 		'Mouse' : [31],
// 		'Rat'   : [41],
// 		'Dog'   : [21],
// 		'Frog'  : [51]
// 	    }
// 	},
// 	{
// 	    'GeneRef' : {
// 		'Human' : [2],
// 		'Chimp' : [12],
// 		'Mouse' : [32],
// 		'Rat'   : [],
// 		'Dog'   : [22],
// 		'Frog'  : []
// 	    }
// 	},
// 	{
// 	    'GeneRef' : {
// 		'Human' : [3],
// 		'Chimp' : [13, 14],
// 		'Mouse' : [33, 34],
// 		'Rat'   : [],
// 		'Dog'   : [23],
// 		'Frog'  : [53]
// 	    }
// 	}
//     ],
//     'Mammals' : [
// 	{
// 	    'GeneRef' : {
// 		'Human' : [1],
// 		'Chimp' : [11],
// 		'Mouse' : [31],
// 		'Rat'   : [41],
// 		'Dog'   : [21]
// 	    }
// 	},
// 	{
// 	    'GeneRef' : {
// 		'Human' : [2],
// 		'Chimp' : [12],
// 		'Mouse' : [32],
// 		'Rat'   : [],
// 		'Dog'   : [22]
// 	    }
// 	},
// 	{
// 	    'GeneRef' : {
// 		'Human' : [3],
// 		'Chimp' : [13, 14],
// 		'Mouse' : [33, 34],
// 		'Rat'   : [],
// 		'Dog'   : [23]
// 	    }
// 	}	
//     ],
//     'Euarchontoglires' : [
// 	{
// 	    'GeneRef' : {
// 		'Human' : [1],
// 		'Chimp' : [11],
// 		'Mouse' : [31],
// 		'Rat'   : [41]
// 	    }
// 	},
// 	{
// 	    'GeneRef' : {
// 		'Human' : [2],
// 		'Chimp' : [12],
// 		'Mouse' : [32],
// 		'Rat'   : []
// 	    }
// 	},
// 	{
// 	    'GeneRef' : {
// 		'Human' : [3],
// 		'Chimp' : [13],
// 		'Mouse' : [],
// 		'Rat'   : []
// 	    }
// 	},
// 	{
// 	    'GeneRef' : {
// 		'Human' : [],
// 		'Chimp' : [14],
// 		'Mouse' : [34],
// 		'Rat'   : []
// 	    }
// 	}
//     ],
// };


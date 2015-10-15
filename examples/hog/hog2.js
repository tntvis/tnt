"use strict";
var tree_hog = function () {

    var label_height = 30;
    var curr_taxa = '';
    var annot;
    var is_node_frozen = false;
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

        var highlight_condition = function () {
            return false;
        };

        var node_display = tnt.tree.node_display()
            .display (function (node) {
                if (highlight_condition(node)) {
                    highlight_node.display().call(this, node);
                } else if (node.is_collapsed()) {
                    collapsed_node.display().call(this, node);
                } else if (node.is_leaf()) {
                    leaf_node.display().call(this, node);
                } else if (!node.is_leaf()) {
                    int_node.display().call(this, node);
                }
            });


        //// TOOLTIPS
        var click_node = function (node) {
            var obj = {};
            obj.header = node.node_name();
            obj.rows = [];
            obj.rows.push({
                label: 'Freeze',
                link: function () {
                    is_node_frozen = !is_node_frozen;
                },
                obj: node,
                value: is_node_frozen ? "Unfreeze tree node" : "Freeze tree node"
            });

            if (node.is_collapsed()) {
                obj.rows.push({
                    label: 'Action',
                    link: function (node) {
                        node.toggle();
                        ta.update();
                    },
                    obj: node,
                    value: "Uncollapse subtree"
                });
            }

            if (!node.is_leaf()) {
                obj.rows.push({
                    label: 'Action',
                    link: function (node) {
                        node.toggle();
                        ta.update();
                    },
                    obj: node,
                    value: "Collapse subtree"
                });
            }
            tnt.tooltip.table().call(this, obj);
        };

        // mouse over a node
        var mouse_over_node = function (node) {
            // Update annotation board
            if (is_node_frozen){
                return;
            }
            var name = node.node_name();
            curr_taxa = name;
            annot.update();

            highlight_condition = function (n) {
                return node.id() === n.id();
            };
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
    		    .height(label_height)
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
            .on ("click", click_node)
    	    .on ("mouseover", mouse_over_node)
    	    .node_display(node_display)
    	    .branch_color ("black");

    	curr_taxa = tree.root().node_name();

    	/////////////////////////
    	//// PARSE HOG INFO /////
    	/////////////////////////
    	var maxs = get_maxs(per_species3);

    	// TnT doesn't have the features we need, so create ower own
    	var hog_feature = tnt.board.track.feature()
    	    .index (function (d) {
    	    	return d.id;
    	    })
    	    .create (function (new_hog, x_scale) {
        		var track = this;
        	    var padding = ~~(track.height() - (track.height() * 0.8)) / 2; // TODO: can this be factored out??
        	    	// otherwise it is repeated with every create event

                var height = track.height() - ~~(padding * 2);
                var dom1 = x_scale.domain()[1];

        		new_hog
        		    .append ("line")
        		    .attr ("class", "hog_boundary")
        		    .attr ("x1", function (d) {
                        var width = d3.min([x_scale(dom1/d.max), height]);
                        // var x = x_scale((dom1/d.max) * d.max_in_hog);
                        // var xnext = x_scale((dom1/d.max) * (d.max_in_hog + 1));
                        var x = width * (d.max_in_hog-1);
                        var xnext = width * d.max_in_hog;
                        return x + (xnext - x + width)/2 + ~~(padding/2)-1;

                        //return (x + width) + ~~(padding/2) - 1;
            			//return (d.total_genes * track.height()) + (d.hog * 20) + 10;
        		    })
        		    .attr ("x2", function (d, i) {
                        var width = d3.min([x_scale(dom1/d.max), height]);
                        // var x = x_scale((dom1/d.max) * d.max_in_hog);
                        // var xnext = x_scale((dom1/d.max) * (d.max_in_hog + 1));
                        var x = width * (d.max_in_hog-1);
                        var xnext = width * d.max_in_hog;
                        return x + (xnext - x + width)/2 + ~~(padding/2)-1;

                        // return (x + width) + ~~(padding/2) - 1;

            			//return (d.total_genes * track.height()) + (d.hog * 20) + 10;
        		    })
        		    .attr("y1", 0)
        		    .attr("y2", track.height())
        		    .attr("stroke-width", 2)
        		    .attr("stroke", "black");
        	})
        	.updater (function (hogs, x_scale) {
            	var track = this;
            	var padding = ~~(track.height() - (track.height() * 0.8)) / 2; // TODO: can this be factored out??

                var height = track.height() - ~~(padding * 2);
                var dom1 = x_scale.domain()[1];

            	hogs.select("line")
            	    .transition()
            	    .attr("x1", function (d) {
                        var width = d3.min([x_scale(dom1/d.max), height]);
                        // var x = x_scale((dom1/d.max) * d.max_in_hog);
                        // var xnext = x_scale((dom1/d.max) * (d.max_in_hog + 1));
                        var x = width * (d.max_in_hog-1);
                        var xnext = width * d.max_in_hog;

                        return x + (xnext - x + width)/2 + ~~(padding/2)-1;
            	    })
            	    .attr("x2", function (d) {
                        var width = d3.min([x_scale(dom1/d.max), height]);
                        // var x = x_scale((dom1/d.max) * d.max_in_hog);
                        // var xnext = x_scale((dom1/d.max) * (d.max_in_hog + 1));
                        var x = width * (d.max_in_hog-1);
                        var xnext = width * d.max_in_hog;

                        return x + (xnext - x + width)/2 + ~~(padding/2)-1;
            	    });
        	});

    	var hog_gene_feature = tnt.board.track.feature()
    	    .index (function (d) {
        		return d.id;
    	    })
    	    .create (function (new_elems, x_scale) {
    	    	var track = this;
    	    	var padding = ~~(track.height() - (track.height() * 0.8)) / 2; // TODO: can this be factored out??
    	    	// otherwise it is repeated with every create event
    	    	var height = track.height() - ~~(padding * 2);
                var dom1 = x_scale.domain()[1];

                new_elems
                    .append ("rect")
                    .attr ("class", "hog_gene")
                    .attr ("x", function (d) {
                        //return (d.pos * track.height()) + (d.hog * 20) + padding;
                        var width = d3.min([x_scale(dom1 / d.max), height]);
                        console.log(" 1--" + x_scale(dom1/d.max) + " -- " + height);
                        var x = width * d.pos;
                        //var x = x_scale((dom1 / d.max) * d.pos);
                        return x + padding;
                    })
                    .attr ("y", padding)
                    .attr ("width", function (d) {
                        var width = d3.min([x_scale(dom1 / d.max), height]);
                        return width - 2*padding;
                    })
                    .attr ("height", height)
                    .attr ("fill", "grey");
    	    })
    	    .updater (function (elems, x_scale) {
        		var track = this;
        	    var padding = ~~(track.height() - (track.height() * 0.8)) / 2; // TODO: can this be factored out??
        	    // otherwise it is repeated with every create event
                var height = track.height() - ~~(padding * 2);
                var dom1 = x_scale.domain()[1];

        		elems.select ("rect")
        		    .transition()
        		    .attr("x", function (d) {
                        var width = d3.min([x_scale(dom1 / d.max), height]);
                        var x = width * d.pos;
                        //var x = x_scale((dom1 / d.max) * d.pos);
                        return x + padding;
        		    })
                    .attr("width", function (d) {
                        //var width = x_scale(dom1 / d.max);
                        var width = d3.min([x_scale(dom1 / d.max), height]);
                        return width - 2*padding;
                    });
        	});

    	annot = tnt.board()
    	    .from(0)
    	    .zoom_in(1)
    	    .allow_drag(false)
    	    .to(5)
    	    .width(500) // TODO: This shouldn't be hardcoded?
    	    .right(5);

        var track = function (leaf) {
            var sp = leaf.node_name();
            return tnt.board.track()
                //.background_color('#E8E8E8')
                .data (tnt.board.track.data()
                    .update ( tnt.board.track.data.retriever.sync()
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
                .display (tnt.board.track.feature.composite()
                    .add ("genes", hog_gene_feature)
                    .add ("hogs", hog_feature)
                );
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
                            max : d3.sum(maxs),
            			    max_in_hog : maxs[hog],
            			    pos_in_hog : gene_pos,
            			});
            			hog_gene_names.push (gene);
        		    }
        		    total_pos++;
        		}
        		hogs_boundaries.push({
                    max : d3.sum(maxs),
                    max_in_hog : total_pos,
            		hog : hog,
            		id  : hog_gene_names.length ? hog_gene_names.join('_') : ("hog_" + hog)
                });
    	    }


    	    return {
                "genes" : genes,
        		"hogs"  : hogs_boundaries
    	    };
    	};

    	ta.tree(tree);
    	ta.annotation(annot);
    	ta.track(track);
    	ta(div);

    };

    // get maximum number of genes per hog accross species
    var get_maxs = function (ps2) {
        var total_max = 0;
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

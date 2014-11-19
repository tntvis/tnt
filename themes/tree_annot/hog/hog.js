var tnt_theme_tree_hog = function () {

    // height for nodes and tracks
    var height = 30;

    var newick = "(((((Otaria_byronia:0.2, Arctocephalus_pusillus:0.2)anc1:0.6, ((Neophoca_cinerea:0.2, Phocarctos_hookeri:0.2)anc2:0.3, (extra_taxon1:0.1, extra_taxon2:0.1)anc3:0.4)anc4:0.7)anc5:0.2, (Eumetopias_jubatus:0.3, Zalophus_californianus:0.3)anc6:0.9, Callorhinus_ursinus:1.2)anc7:0.1, Odobenus_rosmarus:1.5, (extra_taxon3:0.2, extra_taxon4:0.2)anc8:1.3)anc9:0.2, (extra_taxon5:0.2, extra_taxon6:0.2)anc10:1.1)anc11:0.2";

    var theme = function (ta, div) {

	/////////////////////////
	// TREE /////////////////
	/////////////////////////

	// Tooltips
	var node_tooltip = function (node) {
	    var obj = {};
	    obj.header = {
		label : "Name",
		value : node.node_name()
	    };
	    obj.rows = [];
	    obj.rows.push ({
		label : 'Distance to root',
		value : node.root_dist()
	    });

	    if (node.is_collapsed()) {
		obj.rows.push ({
		    label : 'Action',
		    link : function (node) {
			node.toggle();
			ta.update();
		    },
		    obj : node,
		    value : "Uncollapse subtree"
		});
	    }

	    if (!node.is_leaf()) {
		obj.rows.push ({
		    label : 'Action',
		    link : function (node) {
			node.toggle();
			ta.update();
		    },
		    obj : node,
		    value : "Collapse subtree"
		});
		// obj.rows.push ({
		//     label : 'Action',
		//     link : function (node) {
		// 	var leaves = node.get_all_leaves();
		// 	selected_leaves = _.map(leaves, function (leaf) {
		// 	    return leaf.node_name();
		// 	});

			// ta.update();
			// ta.track(track);
		    // },
		    // obj : node,
		    // value : 'Show Annotation'
		// });
	    }

	    tnt.tooltip.table().call (this, obj);
	};


	// Nodes shapes and colors
	var collapsed_node = tnt.tree.node_display.triangle()
	    .size(4)
	    .fill("grey");
	var leaf_node = tnt.tree.node_display.circle()
	    .size(4)
	    .fill("black");
	var int_node = tnt.tree.node_display.circle()
	    .size(2)
	    .fill("black");
	var highlight_node = tnt.tree.node_display.circle()
	    .fill("brown")
	    .size(6);
	var node_display = tnt.tree.node_display.cond()
	    .add ("highlight", function (node) {
		return false;
	    }, highlight_node)
	    .add ("collapsed", function (node) {
		return node.is_collapsed();
	    }, collapsed_node)
	    .add ("leaf", function (node) {
		return node.is_leaf();
	    }, leaf_node)
	    .add ("internal", function (node) {
		return !node.is_leaf();
	    }, int_node);


	var mouse_over_node = function (node) {
	    d3.selectAll(".hog_gene")
		.classed ("brown", false)
		.classed ("green", false)
		.classed ("grey", true);

	    var ns = node.get_all_nodes();
	    for (var i=0; i<ns.length; i++) {
		var genes = [];
		var n = ns[i];
		var name = n.node_name();
		if (n.is_leaf()) {
		    d3.selectAll ("." + name)
			.classed ("grey", false)
			.classed ("green", true);
		} else {
		    d3.selectAll ("." + name)
			.classed ("grey", false)
			.classed ("brown", true);
		}
		// if (data["oma"][name] !== undefined) {
		// 	for (var j=0; j<data["oma"][name].length; j++) {
		// 	    d3.selectAll("." + data["oma"][name][j].name)
		// 		.classed ("grey", false)
		// 		.classed ("brown", true);
		// 	}
		// }
	    }

	    var highlight_condition = function (n) {
		return node.id() === n.id();
	    };
	    node_display.update("highlight", highlight_condition, highlight_node);

	    ta.update();
	}

	// Define the tree part
	var tree = tnt.tree()
	    .data (tnt.tree.parse_newick (newick))
	    .layout (tnt.tree.layout.vertical()
		     .width (400)
		     .scale (true))
	    .label (tnt.tree.label.text()
		    .fontsize (12)
		    .height (height)
		    .text (function (node) {
			if (typeof (node) !== 'function') {
			    throw(node);
			}
			var data = node.data();
			if (node.is_collapsed()) {
			    return "[" + node.n_hidden() + ' hidden taxa]';
			}
			return data.name.replace(/_/g, ' ');
		    })
		    .color (function (node) {
		    	if (node.is_collapsed()) {
		    	    return 'grey';
		    	}
		    	return 'black';
		    })
		   )
	    .link_color("black")
	    .node_display (node_display)
	    .on_click (node_tooltip)
	    .on_mouseover (mouse_over_node);

	// var selected_leaves = _.map (tree.root().get_all_leaves(), function (leaf) {
	//     return leaf.node_name();
	// });

	/////////////////////////
	// TRACKS ///////////////
	/////////////////////////

	// Annotation select
	var select = d3.select(div)
	    .append("select")
	    .on ("change", function () {
		var track = setup_annotation (annot, this.value);
		ta.track(track);
		ta.update();
	    });

	select
	    .append("option")
	    .attr("selected", 1)
	    .attr("value", "oma")
	    .text("OMA");

	select
	    .append("option")
	    .attr("value", "ensembl")
	    .attr("disabled", true)
	    .text("Ensembl Compara");


	// Tooltips on HOGs
	var hog_tooltip = function (hog) {
	    var obj = {};
	    obj.header = {
		label : "Name",
		value : hog.name
	    };
	    obj.rows = [];
	    obj.rows.push ({
		label : "Desc",
		value : hog.desc
	    });

	    tnt.tooltip.table().call (this, obj);
	};

	var get_node_from_name = function (tree, name) {
	    var nodes = tree.root().get_all_nodes();
	    for (var i=0; i<nodes.length; i++) {
		if (nodes[i].node_name() === name) {
		    return nodes[i];
		}
	    }
	};

	// TnT doesn't have a square feature, so we are creating one
	// in the theme using the tnt.track.featur interface
	var square_features = tnt.track.feature()
	    .create (function (new_elems, x_scale) {
		var track = this;
		var padding = ~~(track.height() - (track.height() * 0.8)) / 2;

		new_elems
		    .append("rect")
		    .attr ("class", function (d) {return d.born})
		    .classed ("hog_gene", true)
		    .attr("x", function (d,i) {
			return x_scale (i) + padding;
		    })
		    .attr("y", padding)
		    .attr("width", track.height() - ~~(padding * 2))
		    .attr("height", track.height() - ~~(padding * 2))
		    .attr("fill", "grey")
	    })
	    .on_click (hog_tooltip)
	    .on_mouseover (function (d) {
		var node = get_node_from_name (tree, d.born);
		mouse_over_node(node);
	    });

	var annot = tnt.board()
	    .from(0)
	    .zoom_in(1)
	    .allow_drag(false);

	var max_items = function (source) {
	    var max = 0;
	    var leaves = tree.root().get_all_leaves();
	    for (var i=0; i<leaves.length; i++) {
		var leaf = leaves[i];
		var n = 0;
		leaf.upstream(function (node) {
		    var d = data[source][node.node_name()];
		    if (d !== undefined) {
			n += d.length
		    }
		});
		if (n > max) {
		    max = n;
		}
	    }
	    return max;
	};

	var get_upstream_genes = function (node, source) {
	    var genes = [];

	    node.upstream (function (node) {
		if (data[source][node.node_name()] !== undefined) {
		    genes.push (data[source][node.node_name()]);
		}
	    });

	    // return _.flatten(genes.reverse());
	    return _.flatten (genes);
	}

	var setup_annotation = function (annot, source) {
	    var l = max_items(source);
	    // var max_items = _.max(data[source], function (d) {
	    // 	return d.length;
	    // });
	    // var l = max_items

	    // Define the annotation part
	    annot
		.to(l)
		.width(l * height)
		.right(l);

	    track = function (leaf) {
		var sp = leaf.name;
		return tnt.track()
		    .background_color('#E8E8E8')
		    .data (tnt.track.data()
			   .update (tnt.track.retriever.sync()
				    .retriever (function () {
					var genes = get_upstream_genes (leaf, source);
					return genes;
				    })
				   )
			  )
		    .display (square_features);
	    };
	    return track
	}

	// We start with OMA annotation
	var track = setup_annotation(annot, 'oma');

	/////////////////////////
	// TREES + ANNOT ////////
	/////////////////////////
	ta.tree(tree);
	ta.annotation(annot);
	ta.track(track);
	ta (div);
    };

    return theme;
};

// var data = {
//    "version": "0.3",
//    "origin": "Family Analyzer Testcase",
//    "originVersion": "0.2",
//    "notes": "Example Notes without meaning",
//    "species": [
//       {
//          "name": "HUMAN",
//          "NCBITaxId": "9601",
//          "database": {
//             "name": "HUMANfake",
//             "version": "0.1",
//             "genes": {
//                "gene": [
//                   {
//                      "id": "1",
//                      "protId": "HUMAN1",
//                      "geneId": "HUMANg1"
//                   },
//                   {
//                      "id": "2",
//                      "protId": "HUMAN2",
//                      "geneId": "HUMANg2"
//                   },
//                   {
//                      "id": "3",
//                      "protId": "HUMAN3",
//                      "geneId": "HUMANg3"
//                   },
//                   {
//                      "id": "5",
//                      "protId": "HUMAN5",
//                      "geneId": "HUMANg5"
//                   }
//                ]
//             }
//          }
//       },
//       {
//          "name": "PANTR",
//          "NCBITaxId": "9483",
//          "database": {
//             "name": "PANTRfake",
//             "version": "0.1",
//             "genes": {
//                "gene": [
//                   {
//                      "id": "11",
//                      "protId": "PANTR1",
//                      "geneId": "PANTRg1"
//                   },
//                   {
//                      "id": "12",
//                      "protId": "PANTR2",
//                      "geneId": "PANTRg2"
//                   },
//                   {
//                      "id": "13",
//                      "protId": "PANTR3",
//                      "geneId": "PANTRg3"
//                   },
//                   {
//                      "id": "14",
//                      "protId": "PANTR4",
//                      "geneId": "PANTRg4"
//                   }
//                ]
//             }
//          }
//       },
//       {
//          "name": "CANFA",
//          "NCBITaxId": "9615",
//          "database": {
//             "name": "CANFAfake",
//             "version": "0.1",
//             "genes": {
//                "gene": [
//                   {
//                      "id": "21",
//                      "protId": "CANFA1",
//                      "geneId": "CANFAg1"
//                   },
//                   {
//                      "id": "22",
//                      "protId": "CANFA2",
//                      "geneId": "CANFAg2"
//                   },
//                   {
//                      "id": "23",
//                      "protId": "CANFA3",
//                      "geneId": "CANFAg3"
//                   }
//                ]
//             }
//          }
//       },
//       {
//          "name": "MOUSE",
//          "NCBITaxId": "10090",
//          "database": {
//             "name": "MOUSEfake",
//             "version": "0.1",
//             "genes": {
//                "gene": [
//                   {
//                      "id": "31",
//                      "protId": "MOUSE1",
//                      "geneId": "MOUSEg1"
//                   },
//                   {
//                      "id": "32",
//                      "protId": "MOUSE2",
//                      "geneId": "MOUSEg2"
//                   },
//                   {
//                      "id": "33",
//                      "protId": "MOUSE3",
//                      "geneId": "MOUSEg3"
//                   },
//                   {
//                      "id": "34",
//                      "protId": "MOUSE4",
//                      "geneId": "MOUSEg4"
//                   }
//                ]
//             }
//          }
//       },
//       {
//          "name": "RATNO",
//          "NCBITaxId": "10116",
//          "database": {
//             "name": "RATNOfake",
//             "version": "0.1",
//             "genes": {
//                "gene": [
//                   {
//                      "id": "41",
//                      "protId": "RATNO1",
//                      "geneId": "RATNOg1"
//                   },
//                   {
//                      "id": "43",
//                      "protId": "RATNO3",
//                      "geneId": "RATNOg3"
//                   }
//                ]
//             }
//          }
//       },
//       {
//          "name": "XENTR",
//          "NCBITaxId": "1",
//          "database": {
//             "name": "XENTRfake",
//             "version": "0.1",
//             "genes": {
//                "gene": [
//                   {
//                      "id": "51",
//                      "protId": "XENTR1",
//                      "geneId": "XENTRg1"
//                   },
//                   {
//                      "id": "53",
//                      "protId": "XENTR3",
//                      "geneId": "XENTRg3"
//                   }
//                ]
//             }
//          }
//       }
//    ],
//    "groups": {
//       "orthologGroup": [
//          {
//             "id": "1",
//             "property": {
//                "name": "TaxRange",
//                "value": "Vertebrata"
//             },
//             "geneRef": {
//                "id": "51"
//             },
//             "orthologGroup": {
//                "property": {
//                   "name": "TaxRange",
//                   "value": "Mammalia"
//                },
//                "geneRef": {
//                   "id": "21"
//                },
//                "orthologGroup": {
//                   "property": {
//                      "name": "TaxRange",
//                      "value": "Euarchontoglires"
//                   },
//                   "orthologGroup": [
//                      {
//                         "property": {
//                            "name": "TaxRange",
//                            "value": "Primates"
//                         },
//                         "geneRef": [
//                            {
//                               "id": "1"
//                            },
//                            {
//                               "id": "11"
//                            }
//                         ]
//                      },
//                      {
//                         "property": {
//                            "name": "TaxRange",
//                            "value": "Rodents"
//                         },
//                         "geneRef": [
//                            {
//                               "id": "31"
//                            },
//                            {
//                               "id": "41"
//                            }
//                         ]
//                      }
//                   ]
//                }
//             }
//          },
//          {
//             "id": "2",
//             "property": {
//                "name": "TaxRange",
//                "value": "Mammalia"
//             },
//             "geneRef": {
//                "id": "22"
//             },
//             "orthologGroup": {
//                "property": {
//                   "name": "TaxRange",
//                   "value": "Euarchontoglires"
//                },
//                "orthologGroup": {
//                   "property": {
//                      "name": "TaxRange",
//                      "value": "Primates"
//                   },
//                   "geneRef": [
//                      {
//                         "id": "2"
//                      },
//                      {
//                         "id": "12"
//                      }
//                   ]
//                },
//                "geneRef": {
//                   "id": "32"
//                }
//             }
//          },
//          {
//             "id": "3",
//             "property": {
//                "name": "TaxRange",
//                "value": "Vertebrata"
//             },
//             "geneRef": {
//                "id": "53"
//             },
//             "orthologGroup": {
//                "property": {
//                   "name": "TaxRange",
//                   "value": "Mammalia"
//                },
//                "geneRef": {
//                   "id": "23"
//                },
//                "paralogGroup": [
//                   "orthologGroup": {
//                         "property": {
//                            "name": "TaxRange",
//                            "value": "Euarchontoglires"
//                         },
//                         "geneRef": {
//                            "id": "33"
//                         },
//                         "orthologGroup": {
//                            "property": {
//                               "name": "TaxRange",
//                               "value": "Primates"
//                            },
//                            "geneRef": [
//                               {
//                                  "id": "3"
//                               },
//                               {
//                                  "id": "13"
//                               }
//                            ]
//                         }
//                      },
//                      {
//                         "property": {
//                            "name": "TaxRange",
//                            "value": "Euarchontoglires"
//                         },
//                         "geneRef": [
//                            {
//                               "id": "34"
//                            },
//                            {
//                               "id": "14"
//                            }
//                         ]
//                      }
//                ]
//             }
//          }
//       ]
//    }
// };


var data = {
    'oma' : {
	// 'anc1' : [],
	// 'anc5' : [],
	// 'anc2' : [],
	// 'anc4' : [],
	// 'anc6' : [
	//     {
	// 	name : 'NU4LM_ARCPU-ANC61',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     },
	//     {
	// 	name : 'NU4LM_ARCPU-ANC62',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     },
	//     {
	// 	name : 'NU4LM_ARCPU-ANC63',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     },
	//     {
	// 	name : 'NU4LM_ARCPU-ANC64',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     },
	//     {
	// 	name : 'NU4LM_ARCPU-ANC65',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     }
	// ],
	// 'anc7' : [
	//     {
	// 	name : 'NU4LM_ARCPU-ANC71',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     }	    
	// ],
	// 'anc8' : [
	// ],
	// 'anc9' : [
	//     {
	// 	name : 'NU4LM_ARCPU-ANC91',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     },
	//     {
	// 	name : 'NU4LM_ARCPU-ANC92',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     },	    
	//     {
	// 	name : 'NU4LM_ARCPU-ANC93',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     },
	//     {
	// 	name : 'NU4LM_ARCPU-ANC94',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     },	    
	//     {
	// 	name : 'NU4LM_ARCPU-ANC95',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     },
	//     {
	// 	name : 'NU4LM_ARCPU-ANC96',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     }
	// ],
	// 'anc10' : [
	//     {
	// 	name : 'NU4LM_ARCPU-ANC101',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     },
	//     {
	// 	name : 'NU4LM_ARCPU-ANC102',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     },	    	    
	// ],
	// 'anc11' : [
	//     {
	// 	name : 'NU4LM_ARCPU-ANC111',
	// 	desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	//     }
	// ],
	'Otaria_byronia' : [
	    {
		name : 'NU4LM_ARCPU-OB1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Otaria_byronia'
	    },
	    {
		name : 'NU4LM_ARCPU-OB2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Otaria_byronia'
	    },
	    {
		name : 'NU4LM_ARCPU-OB3',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Otaria_byronia'
	    },
	    {
		name : 'NU4LM_ARCPU-OB4-ANC1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc1'
	    },
	    {
		name : 'NU4LM_ARCPU-OB5-ANC5',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc5'
	    }
	],
	'Arctocephalus_pusillus' : [
	    {
		name : 'NU4LM_ARCPU-AP1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Arctocephalus_pusillus'
	    },
	    {
		name : 'NU4LM_ARCPU-AP2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Arctocephalus_pusillus'
	    },
	    {
		name : 'NU4LM_ARCPU-AP3',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Arctocephalus_pusillus'
	    },
	    {
		name : 'NU4LM_ARCPU-AP4-ANC1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc1'
	    },
	    {
		name : 'NU4LM_ARCPU-AP5-ANC5',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc5'
	    }
	],
	'Neophoca_cinerea' : [
	    {
		name : 'NU4LM_ARCPU-NC1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Neophoca_cinerea'
	    },
	    {
		name : 'NU4LM_ARCPU-NC2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Neophoca_cinerea'
	    },
	    {
		name : 'NU4LM_ARCPU-NC3-ANC2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc2'
	    },
	    {
		name : 'NU4LM_ARCPU-NC4-ANC2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc2'
	    },
	    {
		name : 'NU4LM_ARCPU-NC5-ANC2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc2'
	    },
	    {
		name : 'NU4LM_ARCPU-NC6-ANC2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc2'
	    },
	    {
		name : 'NU4LM_ARCPU-NC7-ANC4',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc4'
	    },
	    {
		name : 'NU4LM_ARCPU-NC8-ANC5',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc5'
	    },
	    {
		name : 'NU4LM_ARCPU-NC8-ANC5',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc5'
	    }
	],
	'Phocarctos_hookeri' : [
	    {
		name : 'NU4LM_ARCPU-PH1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Phocarctos_hookeri'
	    },
	    {
		name : 'NU4LM_ARCPU-PH2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Phocarctos_hookeri'
	    },
	    {
		name : 'NU4LM_ARCPU-PH3-ANC2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc2'
	    },
	    {
		name : 'NU4LM_ARCPU-PH4-ANC2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc2'
	    },
	    {
		name : 'NU4LM_ARCPU-PH5-ANC2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc2'
	    },
	    {
		name : 'NU4LM_ARCPU-PH6-ANC2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc2'
	    },
	    {
		name : 'NU4LM_ARCPU-PH7-ANC4',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc4'
	    },
	    {
		name : 'NU4LM_ARCPU-PH8-ANC5',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc5'
	    },
	    {
		name : 'NU4LM_ARCPU-PH9-ANC5',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc5'
	    }
	],
	'extra_taxon1' : [
	    {
		name : 'NU4LM_ARCPU-ET11',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'extra_taxon1'
	    },
	    {
		name : 'NU4LM_ARCPU-ET12-ANC4',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc4'
	    },
	    {
		name : 'NU4LM_ARCPU-ET13-ANC5',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc5'
	    }
	],
	'extra_taxon2' : [
	    {
		name : 'NU4LM_ARCPU-ET21',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'extra_taxon2'
	    },
	    {
		name : 'NU4LM_ARCPU-ET22-ANC4',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc4'
	    },
	    {
		name : 'NU4LM_ARCPU-ET23-ANC5-1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'anc5'
	    }
	],
	'Eumetopias_jubatus' : [
	    {
		name : 'NU4LM_ARCPU-EJ1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Eumetopias_jubatus'
	    },
	    {
		name : 'NU4LM_ARCPU-EJ2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Eumetopias_jubatus'
	    }
	],
	'Zalophus_californianus' : [
	    {
		name : 'NU4LM_ARCPU-ZF1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Zalophus_californianus'
	    }
	],
	'Callorhinus_ursinus' : [
	    {
		name : 'NU4LM_ARCPU-CU1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Callorhinus_ursinus'
	    },
	    {
		name : 'NU4LM_ARCPU-CU2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Callorhinus_ursinus'
	    }
	],
	'Odobenus_rosmarus' : [
	    {
		name : 'NU4LM_ARCPU-OR1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Odobenus_rosmarus'
	    },
	    {
		name : 'NU4LM_ARCPU-OR2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'Odobenus_rosmarus'
	    }	
	],
	'extra_taxon3' : [
	    {
		name : 'NU4LM_ARCPU-ET3',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'extra_taxon3'
	    }
	],
	'extra_taxon4' : [
	    {
		name : 'NU4LM_ARCPU-ET4',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'extra_taxon4'
	    }
	],
	'extra_taxon5' : [
	    {
		name : 'NU4LM_ARCPU-ET5',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'extra_taxon5'
	    }
	],
	'extra_taxon6' : [
	    {
		name : 'NU4LM_ARCPU-ET6',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L',
		born : 'extra_taxon6'
	    }
	]
    },
    'ensembl' : {
	'Otaria_byronia' : [
	    {
		name : 'NU4LM_ARCPU-OB1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-OB2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-OB3',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-OB4',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-OB5',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	],
	'Arctocephalus_pusillus' : [
	    {
		name : 'NU4LM_ARCPU-AP1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-AP2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-AP3',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-AP4',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-AP5',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	],
	'Neophoca_cinerea' : [
	    {
		name : 'NU4LM_ARCPU-NC1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-NC2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-NC3',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-NC4',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	],
	'Phocarctos_hookeri' : [
	    {
		name : 'NU4LM_ARCPU-PH1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-PH1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	],
	'extra_taxon1' : [
	    {
		name : 'NU4LM_ARCPU-ET1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	],
	'extra_taxon2' : [
	    {
		name : 'NU4LM_ARCPU-ET2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	],
	'Eumetopias_jubatus' : [
	    {
		name : 'NU4LM_ARCPU-EJ1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-EJ2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	],
	'Zalophus_californianus' : [
	    {
		name : 'NU4LM_ARCPU-ZF1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	],
	'Callorhinus_ursinus' : [
	    {
		name : 'NU4LM_ARCPU-CU1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-CU2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	],
	'Odobenus_rosmarus' : [
	    {
		name : 'NU4LM_ARCPU-OR1',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    },
	    {
		name : 'NU4LM_ARCPU-OR2',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }	
	],
	'extra_taxon3' : [
	    {
		name : 'NU4LM_ARCPU-ET3',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	],
	'extra_taxon4' : [
	    {
		name : 'NU4LM_ARCPU-ET4',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	],
	'extra_taxon5' : [
	    {
		name : 'NU4LM_ARCPU-ET5',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	],
	'extra_taxon6' : [
	    {
		name : 'NU4LM_ARCPU-ET6',
		desc : 'NADH-ubiquinone oxidoreductase chain 4L'
	    }
	]
    }
};


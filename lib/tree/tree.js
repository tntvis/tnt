epeek.tree.tree = function (data) {
    "use strict";

   // cluster is an optional parameter 
//     var cluster;
//     var nodes;

    var eTree = function () {
    };


    // API
//     eTree.nodes = function() {
// 	if (cluster === undefined) {
// 	    cluster = d3.layout.cluster()
// 	    // TODO: length and children should be exposed in the API
// 	    // i.e. the user should be able to change this defaults via the API
// 	    // children is the defaults for parse_newick, but maybe we should change that
// 	    // or at least not assume this is always the case for the data provided
// 		.value(function(d) {return d.length})
// 		.children(function(d) {return d.children});
// 	}
// 	nodes = cluster.nodes(data);
// 	return nodes;
//     };

    var apply_to_data = function (data, cbak) {
	cbak(data);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		apply_to_data(data.children[i], cbak);
	    }
	}
    };

    var create_ids = function () {
	var i = epeek.utils.iterator(1);
	// We can't use apply because apply creates new trees on every node
	// We should use the direct data instead
	apply_to_data (data, function (d) {
	    if (d._id === undefined) {
		d._id = i();
		// TODO: Not sure _inSubTree is strictly necessary
		// d._inSubTree = {prev:true, curr:true};
	    }
	});
    };

    var link_parents = function (data) {
	if (data === undefined) {
	    return;
	}
	if (data.children === undefined) {
	    return;
	}
	for (var i=0; i<data.children.length; i++) {
	    // _parent?
	    data.children[i]._parent = data;
	    link_parents(data.children[i]);
	}
    };

    var compute_root_dists = function (data) {
	apply_to_data (data, function (d) {
	    var l;
	    if (d._parent === undefined) {
		d._root_dist = 0;
	    } else {
		var l = 0;
		if (d.length) {
		    l = d.length
		}
		d._root_dist = l + d._parent._root_dist;
	    }
	});
    };

    eTree.data = function(new_data) {
	if (!arguments.length) {
	    return data
	}
	data = new_data;
	create_ids();
	link_parents(data);
	compute_root_dists(data);
	return eTree;
    };
    // We bind the data that has been passed
    eTree.data(data);

//     eTree.cluster = function(c) {
// 	if (!arguments.length) {
// 	    return cluster
// 	}
// 	cluster = c;
// 	return eTree;
//     };

//     eTree.tree = function() {
//         return tree;
//     };

    eTree.find_node_by_field = function(field, value) {
	if (data[field] === value) {
	    return eTree;
	}
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		var node = epeek.tree.tree(data.children[i]);
		var found = node.find_node_by_field(field, value);
		if (found !== undefined) {
		    return found;
		}
	    }
	}
    };

    eTree.find_node_by_name = function(name) {
	return eTree.find_node_by_field("name", name);
    };

    eTree.toggle_node = function(node_data) {
			if (node_data) {
				if (node_data.children) {
					node_data._children = node_data.children;
					node_data.children = undefined;
				} else {
				node_data.children = node_data._children;
				node_data._children = undefined;
				}
			}
			// return eTree;	
	};

    var has_ancestor = function(node, ancestor) {
	if (node._parent === undefined) {
	    return false
	}
	node = node._parent
	for (;;) {
	    if (node === undefined) {
		return false;
	    }
	    if (node === ancestor) {
		return true;
	    }
	    node = node._parent;
	}
    };

    // This is the easiest way to calculate the LCA I can think of. But it is very inefficient too.
    // It is working fine by now, but in case it needs to be more performant we can implement the LCA
    // algorithm explained here:
    // http://community.topcoder.com/tc?module=Static&d1=tutorials&d2=lowestCommonAncestor
    eTree.lca = function (nodes) {
	if (nodes.length === 1) {
	    return nodes[0];
	}
	var lca_node = nodes[0];
	for (var i = 1; i<nodes.length; i++) {
	    lca_node = _lca(lca_node, nodes[i]);
	}
	return epeek.tree.tree(lca_node);
    };

    var _lca = function(node1, node2) {
	if (node1 === node2) {
	    return node1;
	}
	if (has_ancestor(node1, node2)) {
	    return node2;
	}
	return _lca(node1, node2._parent);
    };


    eTree.get_all_leaves = function () {
	var leaves = [];
	eTree.apply(function (node) {
	    if (node.is_leaf()) {
		leaves.push(node);
	    }
	});
	return leaves;
    };

    eTree.upstream = function(cbak) {
	cbak(eTree);
	var parent = eTree.parent();
	if (parent !== undefined) {
	    parent.upstream(cbak);
	}
//	epeek.tree.tree(parent).upstream(cbak);
// 	eTree.upstream(node._parent, cbak);
    };

    eTree.subtree = function(nodes) {
    	var node_counts = {};
    	for (var i=0; i<nodes.length; i++) {
	    var node = nodes[i];
	    if (node !== undefined) {
		node.upstream(function(node){
		    var id = node.id();
		    if (node_counts[id] === undefined) {
			node_counts[id] = 0;
		    }
		    node_counts[id]++
    		});
	    }
    	}
    

	var is_singleton = function (node) {
	    var n_children = 0;
	    if (node.children === undefined) {
		return false;
	    }
	    for (var i=0; i<node.children.length; i++) {
		var id = node.children[i]._id;
		if (node_counts[id] > 0) {
		    n_children++;
		}
	    }
	    return n_children === 1;
	};

	var copy_data = function (orig_data, subtree, condition) {
            if (orig_data === undefined) {
		return;
            }

            if (condition(orig_data)) {
		var copy = copy_node(orig_data);
		if (subtree.children === undefined) {
                    subtree.children = [];
		}
		subtree.children.push(copy);
		if (orig_data.children === undefined) {
                    return;
		}
		for (var i = 0; i < orig_data.children.length; i++) {
                    copy_data (orig_data.children[i], copy, condition);
		}
            } else {
		if (orig_data.children === undefined) {
                    return;
		}
		for (var i = 0; i < orig_data.children.length; i++) {
                    copy_data(orig_data.children[i], subtree, condition);
		}
            }
	};

	var copy_node = function (node) {
	    var copy = {};
	    // copy all the own properties excepts links to other nodes or depth
	    for (var param in node) {
		if ((param === "children") ||
		    (param === "children") ||
		    (param === "_parent") ||
		    (param === "depth")) {
		    continue;
		}
		if (node.hasOwnProperty(param)) {
		    copy[param] = node[param];
		}
	    }
	    return copy;
	};

	var subtree = {};
	copy_data (data, subtree, function (node) {
	    var node_id = node._id;
	    var counts = node_counts[node_id];

	    if (counts === undefined) {
	    	return false;
	    }
// 	    if ((node.children !== undefined) && (node.children.length < 2)) {
// 		return false;
// 	    }
	    if ((counts > 1) && (!is_singleton(node))) {
		return true;
	    }
	    if ((counts > 0) && (node.children === undefined)) {
		return true;
	    }
	    return false;
	});

	return epeek.tree.tree(subtree.children[0]);
    };

    // TODO: This method visits all the nodes
    // a more performant version should return true
    // the first time cbak(node) is true
    eTree.present = function (cbak) {
	// cbak should return true/false
	var isTrue = false;
	eTree.apply(function (node) {
	    if (cbak(node) === true) {
		isTrue = true;
	    }
	});
	return isTrue;
    };

    // cbak is called with two nodes
    // and should return -1,0,1
    eTree.sort = function (cbak) {
	if (data.children === undefined) {
	    return;
	}

	var new_children = [];
	for (var i=0; i<data.children.length; i++) {
	    new_children.push(epeek.tree.tree(data.children[i]));
	}

	new_children.sort(cbak);
	data.children = [];
	for (var i=0; i<new_children.length; i++) {
	    data.children.push(new_children[i].data());
	}

	for (var i=0; i<data.children.length; i++) {
	    epeek.tree.tree(data.children[i]).sort(cbak);
	}
    };

    // eTree.sort = function (cbak) {
    // 	if (data.branchset === undefined) {
    // 	    return;
    // 	}
    // 	var new_branchset = [];
    // 	for (var i=0; i<data.branchset.length; i++) {
    // 	    var subtree = epeek.tree.tree(data.branchset[i]);
    // 	    if (subtree.present(cbak)) {
    // 		new_branchset.unshift(subtree.data());
    // 	    } else {
    // 		new_branchset.push(subtree.data());
    // 	    }
    // 	}
    // 	data.branchset = new_branchset;
    // 	for (var i=0; i<data.branchset.length; i++) {
    // 	    epeek.tree.tree(data.branchset[i]).sort(cbak);
    // 	}
    // };

    eTree.apply = function(cbak) {
	cbak(eTree);
	if (data.children !== undefined) {
	    for (var i=0; i<data.children.length; i++) {
		var node = epeek.tree.tree(data.children[i])
		node.apply(cbak);
	    }
	}
    };

    eTree.property = function(prop, value) {
	if (arguments.length === 1) {
	    return data[prop]
	}
	data[prop] = value;
	return eTree;
    };

    eTree.is_leaf = function() {
	return data.children === undefined;
    };

    // It looks like the cluster can't be used for anything useful here
    // It is now included as an optional parameter to the epeek.tree() method call
    // so I'm commenting the getter
    // eTree.cluster = function() {
    // 	return cluster;
    // };

    // eTree.depth = function (node) {
    //     return node.depth;
    // };

//     eTree.name = function (node) {
//         return node.name;
//     };

    eTree.id = function () {
	return eTree.property('_id');
    };

    eTree.node_name = function () {
	return eTree.property('name');
    };

    eTree.root_dist = function () {
	return eTree.property('_root_dist');
    };

    eTree.children = function () {
	if (data.children === undefined) {
	    return;
	}
	var children = [];
	for (var i=0; i<data.children.length; i++) {
	    children.push(epeek.tree.tree(data.children[i]));
	}
	return children;
    };

    eTree.parent = function () {
	if (data._parent === undefined) {
	    return undefined;
	}
	return epeek.tree.tree(data._parent);
    };

    return eTree;

};



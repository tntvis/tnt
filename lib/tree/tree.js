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
// 	    // TODO: length and branchset should be exposed in the API
// 	    // i.e. the user should be able to change this defaults via the API
// 	    // branchset is the defaults for parse_newick, but maybe we should change that
// 	    // or at least not assume this is always the case for the data provided
// 		.value(function(d) {return d.length})
// 		.children(function(d) {return d.branchset});
// 	}
// 	nodes = cluster.nodes(data);
// 	return nodes;
//     };

    var apply_to_data = function (data, cbak) {
	cbak(data);
	if (data.branchset !== undefined) {
	    for (var i=0; i<data.branchset.length; i++) {
		apply_to_data(data.branchset[i], cbak);
	    }
	}
    };

    var create_ids = function () {
	var i = epeek.misc.iteratorInt(1);
	// We can't use apply because apply creates new trees on every node
	// We should use the direct data instead
	apply_to_data (data, function (d) {
	    if (d._id === undefined) {
		d._id = i();
		d._inSubTree = {prev:true, curr:true};
	    }
	});
    };

    var link_parents = function (data) {
	if (data === undefined) {
	    return;
	}
	if (data.branchset === undefined) {
	    return;
	}
	for (var i=0; i<data.branchset.length; i++) {
	    // _parent?
	    data.branchset[i]._parent = data;
	    link_parents(data.branchset[i]);
	}
    };
    create_ids();
    link_parents(data);

    eTree.data = function(new_data) {
	if (!arguments.length) {
	    return data
	}
	data = new_data;
	create_ids();
	link_parents(data);
	return eTree;
    };

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
	if (data.branchset !== undefined) {
	    for (var i=0; i<data.branchset.length; i++) {
		var node = epeek.tree.tree(data.branchset[i]);
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
	    node.upstream(function(node){
		var id = node.id();
		if (node_counts[id] === undefined) {
		    node_counts[id] = 0;
		}
		node_counts[id]++
    	    });
    	}

	var subtree;
	copy_data (data, subtree, function (node) {
	    var node_id = node._id;
	    if (node_counts[node_id] === undefined) {
	    	return false;
	    }
	    var counts = node_counts[node_id];
	    if (counts > 1) {
		return true;
	    }
	    if ((counts > 0) && (node.branchset === undefined)) {
		return true;
	    }
	    return false;
	});

	console.log("SUBTREE:");
	console.log(subtree);

	return epeek.tree.tree(subtree);
    };

    var copy_data = function (orig_data, copied_data, condition) {
        if (orig_data === undefined) {
            return;
        }

	// if (condition(orig_data)) {
	//     var copy = copy_node(orig_data);
	//     if (copied_data === undefined) { // first node
	// 	copied_data = copy;
	//     }
	// }

        if (condition(orig_data)) {
            var copy = copy_node(orig_data);
	    if (copied_data === undefined ) { // first node
		copied_data = copy;
	    } else {
		if (copied_data.branchset === undefined) {
                    copied_data.branchset = [];
		}
		copied_data.branchset.push(copy);
		if (orig_data.branchset === undefined) {
                    return;
		}
		for (var i = 0; i < orig_data.branchset.length; i++) {
                    copy_data (orig_data.branchset[i], copy, condition);
		}
	    }
        } else {
            if (orig_data.branchset === undefined) {
                return;
            }
            for (var i = 0; i < orig_data.branchset.length; i++) {
                copy_data(orig_data.branchset[i], copied_data, condition);
            }
        }
    };


    var copy_node = function (node) {
	var copy = {};
	// copy all the own properties excepts links to other nodes or depth
	for (var param in node) {
	    if ((param === "branchset") ||
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


    eTree.apply = function(cbak) {
	cbak(eTree);
	if (data.branchset !== undefined) {
	    for (var i=0; i<data.branchset.length; i++) {
		var node = epeek.tree.tree(data.branchset[i])
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
	return data.branchset === undefined;
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

    eTree.children = function () {
	if (data.branchset === undefined) {
	    return;
	}
	var children = [];
	for (var i=0; i<data.branchset.length; i++) {
	    children.push(epeek.tree.tree(data.branchset[i]));
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



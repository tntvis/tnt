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


    var link_parents = function (data) {
	if (data.branchset === undefined) {
	    return;
	}
	for (var i=0; i<data.branchset.length; i++) {
	    // _parent?
	    data.branchset[i]._parent = data;
	    link_parents(data.branchset[i]);
	}
    };
    link_parents(data);

    eTree.data = function(new_data) {
	if (!arguments.length) {
	    return data
	}
	data = new_data;
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

    eTree.apply = function(cbak) {
	cbak(eTree);
	if (data.branchset !== undefined) {
	    for (var i=0; i<data.branchset.length; i++) {
		var subtree = epeek.tree.tree(data.branchset[i])
		subtree.apply(cbak);
	    }
	}
    };

    eTree.upstream = function(node, cbak) {
	if (node === undefined) {
	    return;
	}
	cbak(node);
	eTree.upstream(node._parent, cbak);
    };

    eTree.property = function(prop, value) {
	if (arguments.length === 1) {
	    return data[prop]
	}
	data[prop] = value;
	return eTree;
    }

    eTree.is_leaf = function() {
	return data.branchset === undefined;
    };

    // It looks like the cluster can't be used for anything useful here
    // It is now included as an optional parameter to the epeek.tree() method call
    // so I'm commenting the getter
    // eTree.cluster = function() {
    // 	return cluster;
    // };

    eTree.depth = function (node) {
        return node.depth;
    };

//     eTree.name = function (node) {
//         return node.name;
//     };

    eTree.children = function (node) {
	return node.branchset;
    };

    eTree.parent = function (node) {
	return node._parent;
    };

    return eTree;

};



epeek.tree = function (data) {
    "use strict";

    // TODO: newick shouldn't be here
    // we don't have a way of getting a newick out of data yet
    // and we have parse_newick to convert newick string into data
    var newick;

   // cluster is an optional parameter 
    var cluster;
    var nodes;

    var eTree = function () {
    };

    // API
    eTree.nodes = function() {
	if (cluster === undefined) {
	    cluster = d3.layout.cluster()
	    // TODO: length and branchset should be exposed in the API
	    // i.e. the user should be able to change this defaults via the API
	    // branchset is the defaults for parse_newick, but maybe we should change that
	    // or at least not assume this is always the case for the data provided
		.value(function(d) {return d.length})
		.children(function(d) {return d.branchset});
	}
	nodes = cluster.nodes(data);
	return nodes;
    };

    eTree.data = function() {
	return data;
    };

    // TODO: eTree doesn't know how to deal with a newick tree
    // we have parse_newick as an independent method
    eTree.newick = function(s) {
	if (!arguments.length) {
	    return newick
	}
	newick = s;
	return eTree;
    };

    eTree.cluster = function(c) {
	if (!arguments.length) {
	    return cluster
	}
	cluster = c;
	return eTree;
    };


    eTree.tree = function() {
        return tree;
    };

    eTree.find_node_by_name = function(mytree, name) {
	if (mytree === undefined) {
	    mytree = data;
	}
	if (mytree.name === name) {
	    return mytree;
	}
	if (mytree.children === undefined) {
	    return;
	}
	for (var i=0; i<mytree.children.length; i++) {
	    var node = eTree.find_node_by_name(mytree.children[i], name);
	    if (node !== undefined) {
		return node;
	    }
	}
    };

    var has_ancestor = function(node, ancestor) {
	if (node.parent === undefined) {
	    return false
	}
	node = node.parent
	for (;;) {
	    if (node === undefined) {
		return false;
	    }
	    if (node === ancestor) {
		return true;
	    }
	    node = node.parent;
	}
    };

    // This is the easiest way to calculate the LCA I can think of. But it is very inefficient too.
    // It would be better to implement a better LCA algorithm. For example see:
    // http://community.topcoder.com/tc?module=Static&d1=tutorials&d2=lowestCommonAncestor
    eTree.lca = function (nodes) {
	if (nodes.length === 1) {
	    return nodes[0];
	}
	var lca_node = nodes[0];
	for (var i = 1; i<nodes.length; i++) {
	    lca_node = _lca(lca_node, nodes[i]);
	}
	return lca_node;
    };

    var _lca = function(node1, node2) {
	if (node1 === node2) {
	    return node1;
	}
	if (has_ancestor(node1, node2)) {
	    return node2;
	}
	return _lca(node1, node2.parent);
    };

    eTree.apply = function(mytree, cbak) {
	if (mytree === undefined) {
	    return;
	}
	cbak(mytree);
	if (mytree.branchset !== undefined) {
	    for (var i=0; i<mytree.branchset.length; i++) {
		eTree.apply(mytree.branchset[i], cbak);
	    }
	}
	return eTree;
    };

    eTree.upstream = function(node, cbak) {
	if (node === undefined) {
	    return;
	}
	cbak(node);
	eTree.upstream(node.parent, cbak);
    };

    eTree.is_leaf = function(node) {
	return node.branchset === undefined;
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

    eTree.name = function (node) {
        return node.name;
    };

    eTree.children = function (node) {
	return node.children;
    };

    eTree.parent = function (node) {
	return node.parent;
    };

    return eTree;

};



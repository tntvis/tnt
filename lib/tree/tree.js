
   // cluster is an optional paramter 
    var eTree = function (newick) {
	tree = parse_newick(newick);
	if (cluster === undefined) {
	    cluster = d3.layout.cluster()
		.value(function(d) {return d.length})
		.children(function(d) {return d.branchset});
	}
	var nodes = cluster.nodes(tree);
	return nodes;
    }(newick);

    // API
    eTree.newick = function() {
	return newick;
    };

    eTree.tree = function() {
        return tree;
    };

    eTree.find_node_by_name = function(mytree, name) {
	if (mytree === undefined) {
	    mytree = tree;
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
	    lca_node = lca2(lca_node, nodes[i]);
	}
	return lca_node;
    };

    var lca2 = function(node1, node2) {
	if (node1 === node2) {
	    return node1;
	}
	if (has_ancestor(node1, node2)) {
	    return node2;
	}
	return lca2(node1, node2.parent);
    };

    eTree.apply = function(mytree, cbak) {
	if (mytree === undefined) {
	    return;
	}
	cbak(mytree);
	if (mytree.children !== undefined) {
	    for (var i=0; i<mytree.children.length; i++) {
		eTree.apply(mytree.children[i], cbak);
	    }
	}
	return eTree;
    };

    eTree.is_leaf = function(node) {
	return node.children === undefined;
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


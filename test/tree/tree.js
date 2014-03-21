describe('ePeek Tree', function () {
    it("Exists and is called tree", function () {
        assert.isDefined(epeek.tree);
    })

    var newick = "((human, chimp), mouse)";
    var tree = epeek.tree.parse_newick(newick);

    // Newick
    describe('Newick reader', function () {
	it("Exists and is called tree.parse_newick", function () {
	    assert.isDefined(epeek.tree.parse_newick);
	});

	it("Can read a simple tree", function () {
	    assert.isDefined(tree);
	});
	it("The returned tree has the correct structure", function () {
	    assert.property(tree, "name");
	    assert.property(tree, "children");
	    assert.property(tree.children[0], "name");
	    assert.property(tree.children[0], "children");
	    assert.strictEqual(tree.children[0].children[0].name, "human");
	    assert.notProperty(tree.children[0].children[0], "children");
	});

	it("Reads the branch lenghts", function () {
	    var newick = "((human:0.2,chimp:0.3),mouse:0.5)";
	    var tree = epeek.tree.parse_newick(newick);
	    assert.closeTo(tree.children[1].length, 0.5, 0.05);
	    assert.closeTo(tree.children[0].children[0].length, 0.2, 0.05);
	    assert.closeTo(tree.children[0].children[1].length, 0.3, 0.05);
	});
    });

    describe('ePeek.tree.tree', function () {
	var mytree = epeek.tree.tree(tree);
	it("Can create trees", function () {
	    assert.isDefined(mytree);
	})
	it("Can return the original data", function () {
	    var mytree = epeek.tree.parse_newick("((human,chimp)anc1,mouse)anc2");
	    var mynewtree = epeek.tree.tree(mytree);
	    assert.property(mytree, "name");
	    var orig_data = mynewtree.data();
	    assert.deepEqual(mytree, orig_data);
	    assert.strictEqual(mynewtree.data().name, "anc2");
	});

	it('Inserts ids in all the nodes', function () {
	    var nodes_with_ids = 0;
	    var nodes = 0;
	    mytree.apply(function (node) {
		nodes++;
		if (node.property('_id') !== undefined) {
		    nodes_with_ids++;
		}
	    });
	    assert.strictEqual(nodes_with_ids, nodes);
	});

	it("Doesn't override ids", function () {
	    var node = mytree.find_node_by_name('human');
	    assert.notEqual(node.property('_id'), 1);
	    assert.strictEqual(node.property('_id'), 3);
	});

	it("Can retrieve ids", function () {
	    assert.property(mytree, "id");
	    var id = mytree.id();
	    assert.isDefined(id);
	    assert.strictEqual(id, 1);
	});

	it("Can retrieve names", function () {
	    assert.property(mytree, "node_name");
	    var root_name = mytree.node_name();
	    assert.strictEqual(root_name, "");
	    var node = mytree.find_node_by_name('chimp');
	    var node_name = node.node_name();
	    assert.strictEqual(node_name, 'chimp');
	});

	it('Has the correct number of parents', function () {
	    var parents = 0;
	    var nodes = 0;
	    mytree.apply(function (node) {
		nodes++;
		if (node.property('_parent') !== undefined) {
		    parents++;
		}
	    });
	    assert.strictEqual(parents+1, nodes);
	});

	it('Inserts correct distances to root', function () {
	    var newick = "((human:0.2,chimp:0.3):0.2,mouse:0.5)";
	    var data = epeek.tree.parse_newick(newick);
	    var tree = epeek.tree.tree(data);
	    assert.isDefined(tree.root_dist);
	    assert.isFunction(tree.root_dist);
	    var root_dists = [];
	    tree.apply(function (node) {
		root_dists.push(node.root_dist());
	    });
	    var undef_dists = _.filter(root_dists, function(d) {return d === undefined});
	    assert.strictEqual(undef_dists.length, 0);
	    var human = tree.find_node_by_name('human');
	    assert.closeTo(human.root_dist(),0.4, 0.01);
	});

	describe('API', function () {
	    describe('find_node_by_name', function () {
		var newtree = epeek.tree.parse_newick("((human,chimp)anc1,mouse)anc2");
		var mynewtree = epeek.tree.tree(newtree);

		it("Returns the correct node", function () {
		    assert.isDefined(newtree);
		    var node = mytree.find_node_by_name("human");
		    assert.isDefined(node);
		    assert.strictEqual(node.data().name, "human");
		    var node2 = mytree.find_node_by_name("mouse");
		    assert.isDefined(node2);
		    assert.strictEqual(node2.data().name, "mouse");
		})
		it("Can search for the root", function () {
		    assert.isDefined(mynewtree);
		    var root = mynewtree.find_node_by_name("anc2");
		    assert.isDefined(root);
		    assert.strictEqual(root.data().name, "anc2");
		})
		it("Returns nodes that are epeek.tree.tree's", function () {
		    var node = mynewtree.find_node_by_name('anc1');
		    assert.property(node, 'find_node_by_name');
		})
	    });

	    describe('apply', function () {
		it("Sets a new property on each downstream node", function () {
		    mytree.apply(function (node) {node.property('__test__', 1)})
		    var tested = 0;
		    var with_prop = 0;
		    mytree.apply(function (node) {
			tested++;
			if (node.property('__test__') !== undefined) {
			    with_prop++;
			}
		    });
		    assert.strictEqual(tested, with_prop);
		    assert.strictEqual(with_prop, 5);
		})
	    });

	    describe('lca', function () {
		var newtree = epeek.tree.parse_newick("((human,chimp)anc1,mouse)anc2");
		var mynewtree = epeek.tree.tree(newtree);

		it("Finds the correct lca node", function () {
		    var nodes = [];
		    nodes.push(mynewtree.find_node_by_name('human').data());
		    nodes.push(mynewtree.find_node_by_name('chimp').data());
		    var lca = mynewtree.lca(nodes);
		    assert.isDefined(lca);
		    assert.property(lca, "find_node_by_name");
		})
	    });

	    describe('is_leaf', function () {
		var newtree = epeek.tree.parse_newick("((human,chimp)anc1,mouse)anc2");
		var mynewtree = epeek.tree.tree(newtree);
		it("Returns the correct number of leaves", function () {
		    var leaves = 0;
		    mynewtree.apply(function(node) {
			if (node.is_leaf()) {
			    leaves++;
			}
		    });
		    assert.strictEqual(leaves, 3);
		});
	    });

	    describe('parent', function () {
		var newtree = epeek.tree.parse_newick("((human,chimp)anc1,mouse)anc2");
		var mynewtree = epeek.tree.tree(newtree);
		var node = mynewtree.find_node_by_name("anc1");
		var parent = node.parent();
		it("Can take parents from nodes", function () {
		    assert.isDefined(parent);
		});
		it("Returns the right node", function () {
		    assert.strictEqual(parent.data().name, "anc2");
		});
		it("Returns an epeek.tree.tree object", function () {
		    assert.property(parent, "is_leaf");
		});
		it("Returns undefined parent on root", function () {
		    var node = mynewtree.parent();
		    assert.isUndefined(node);
		});
	    });

	    describe('children', function () {
		var newtree = epeek.tree.parse_newick("((human,chimp)anc1,mouse)anc2");
		var mynewtree = epeek.tree.tree(newtree);
		var node = mynewtree.find_node_by_name("anc1");
		var children = node.children();
		it("Can take children from nodes", function () {
		    assert.isDefined(children);
		});
		it("Returns a list of children", function () {
		    assert.isArray(children);
		});
		it("Returns a list of epeek.tree.tree's", function () {
		    _.each(children, function (el) {
			assert.property(el, "is_leaf");
		    });
		});
		it("Returns undefined children on leaves", function () {
		    var node = mynewtree.find_node_by_name("mouse");
		    var children = node.children();
		    assert.isUndefined(children);
		});
	    });

	    describe('upstream', function() {
		var mytree = epeek.tree.parse_newick("((human,chimp)anc1,mouse)anc2");
		var mynewtree = epeek.tree.tree(mytree);
		var node = mynewtree.find_node_by_name('human');
		it("Visits the correct number of antecesors", function () {
		    var visited_parents = [];
		    node.upstream(function (el) {
			visited_parents.push(el.property('name'));
		    });
		    assert.strictEqual(visited_parents.length, 3);
		    assert.isTrue(_.contains(visited_parents, "human"));
		    assert.isTrue(_.contains(visited_parents, "anc2"));
		    assert.isTrue(_.contains(visited_parents, "anc1"));
		});
		it("Sets properties in the antecesors", function () {
		    node.upstream(function (el) {
			el.property('visited_node', 1);
		    });
		    var visited_nodes = [];
		    mynewtree.apply(function (node) {
			if (node.property('visited_node') === 1) {
			    visited_nodes.push(node.data().name);
			}
		    });
		    assert.strictEqual(visited_nodes.length, 3);
		    assert.isTrue(_.contains(visited_nodes, "human"));
		    assert.isTrue(_.contains(visited_nodes, "anc2"));
		    assert.isTrue(_.contains(visited_nodes, "anc1"));
		});
	    });

	    describe("get_all_leaves", function () {
		it("Returns all the leaves", function () {
		    var leaves = mytree.get_all_leaves();
		    assert.isArray(leaves);
		    assert.lengthOf(leaves, 3);
		});
	    });

	    describe("subtree", function () {
		var subtree;
		it("Creates subtrees", function () {
		    var nodes = [];
		    nodes.push(mytree.find_node_by_name('human'));
		    nodes.push(mytree.find_node_by_name('mouse'));
		    subtree = mytree.subtree(nodes)
		    assert.isDefined(subtree);
		});

		it("Prunes the tree correctly", function () {
		    var ids_in_subtree = [];
		    subtree.apply(function (node) {
			ids_in_subtree.push(node.id());
		    });
		    assert.isArray(ids_in_subtree);
		    assert.lengthOf(ids_in_subtree, 3);
		    assert.isTrue(_.contains(ids_in_subtree, 1));
		    assert.isTrue(_.contains(ids_in_subtree, 3));
		    assert.isTrue(_.contains(ids_in_subtree, 5));
		});

		it("Prunes correcly trees that doesn't include the root", function () {
		    var nodes = [];
		    nodes.push(mytree.find_node_by_name('human'));
		    nodes.push(mytree.find_node_by_name('chimp'));
		    var subtree = mytree.subtree(nodes);
		    assert.isDefined(subtree);
		    var ids_in_subtree = [];
		    subtree.apply(function (node) {
			ids_in_subtree.push(node.id());
		    });
		    assert.isArray(ids_in_subtree);
		    assert.lengthOf(ids_in_subtree, 3);
		    assert.strictEqual(subtree.id(), 2);
		    assert.isTrue(_.contains(ids_in_subtree, 2));
		    assert.isTrue(_.contains(ids_in_subtree, 3));
		    assert.isTrue(_.contains(ids_in_subtree, 4));
		});

		it("Returns an identical copy on a subtree with all the leaves", function () {
		    var leaves = mytree.get_all_leaves();
		    var subtree = mytree.subtree(leaves);
		    assert.isDefined(subtree);
		    var tree_nodes = [];
		    mytree.apply(function (node) {
			tree_nodes.push(node);
		    });
		    var subtree_nodes = [];
		    subtree.apply(function (node) {
			subtree_nodes.push(node);
		    });
		    assert.strictEqual(tree_nodes.length, subtree_nodes.length);
		});
	    });

	    describe("node_present", function () {
		it("Returns true if node is present", function () {
		    var present = mytree.present(function (node) {
			return node.id() === 5;
		    });
		    assert.strictEqual(present, true);
		});

		it("Returns false if node is absent", function () {
		    var present = mytree.present(function (node) {
			return node._id === -1;
		    });
		    assert.strictEqual(present, false);
		});

	    });

	    describe("sort", function () {
		it("Swaps two leaves", function () {
		    var ids = [];
		    mytree.apply(function (node) {
			ids.push(node.id());
		    });

		    // Lets sort
		    mytree.sort(function (node1, node2) {
			if (node1.present(function (n) {
			    return n.id() === 5;
			})) {
			    return -1;
			}
			if (node2.present(function (n) {
			    return n.id() === 5;
			})) {
			    return 1
			}
			return 0
		    });

		    var sorted = [];
		    mytree.apply(function (node) {
			sorted.push(node.id());
		    });
		    assert.notEqual(ids[1], sorted[1]);
		    assert.equal(ids[1], 2);
		    assert.equal(sorted[1], 5);
		});

		it("Sorts based on a numerical value", function () {
		    var newick = "(((2,1),(5,4)),3)";
		    var data = epeek.tree.parse_newick(newick);
		    var tree = epeek.tree.tree(data);
		    var ids = [];
		    tree.apply(function (node) {
			ids.push(node.id());
		    });

		    // Helper function to get the lowest value in
		    // the subnode -- this is used in the sort cbak
		    var get_lowest_val = function (node) {
			var lowest = 1000;
			node.apply(function (n) {
			    if (node.node_name() < lowest) {
				lowest = node.node_name();
			    }
			});
			return lowest;
		    };

		    tree.sort(function (node1, node2) {
			var lowest1 = get_lowest_val(node1);
			var lowest2 = get_lowest_val(node2);
			if (lowest1 < lowest2) return -1;
			if (lowest1 > lowest2) return 1;
			return 0;
		    });

		    var sorted_ids = [];
		    tree.apply(function (node) {
			sorted_ids.push(node.id());
		    });

		    assert.notEqual(ids[3], sorted_ids[3]);
		    assert.strictEqual(ids[3], 4);
		    assert.strictEqual(sorted_ids[3], 5);
		});
	    });

	});

    });
})

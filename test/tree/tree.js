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
	})

	it("Can read a simple tree", function () {
	    assert.isDefined(tree);
	})
	it("The returned tree has the correct structure", function () {
	    assert.property(tree, "name");
	    assert.property(tree, "branchset");
	    assert.property(tree.branchset[0], "name");
	    assert.property(tree.branchset[0], "branchset");
	    assert.strictEqual(tree.branchset[0].branchset[0].name, "human");
	    assert.notProperty(tree.branchset[0].branchset[0], "branchset");
	})
    })

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
	})


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

	    describe('nodes have parents', function () {
		it('has the correct number of parents', function () {
		    var parents = 0;
		    var nodes = 0;
		    mytree.apply(function(node) {
			nodes++;
			if (node.property('_parent') !== undefined) {
			    parents++;
			}
		    });
		    assert.strictEqual(parents+1, nodes);
		});
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
		it("Sets a new property on each upstream node");
	    });

	});

    });
})

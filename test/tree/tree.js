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
    })
})

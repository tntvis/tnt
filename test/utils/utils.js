describe("epeek.utils", function () {
    it("Exists", function () {
	assert.isDefined(epeek.utils);
	assert.isObject(epeek.utils);
    });

    describe("epeek.utils.iteratorInt", function () {
	it("Exists and is a method", function () {
	    assert.isDefined(epeek.utils.iteratorInt);
	    assert.isFunction(epeek.utils.iteratorInt);
	});

	it("Returns a callback", function () {
	    assert.isDefined(epeek.utils.iteratorInt());
	    assert.isFunction(epeek.utils.iteratorInt());
	});

	var i = epeek.utils.iteratorInt();
	it("Returns a callback", function () {
	    assert.isDefined(i);
	    assert.isFunction(i);
	});

	it("Starts with 0 by default", function () {
	    assert.strictEqual(i(), 0);
	});

	it("Creates new values", function () {
	    assert.strictEqual(i(), 1);
	});

	it("Can start from custom values", function () {
	    var j = epeek.utils.iteratorInt(100);
	    assert.strictEqual(j(), 100);
	});
    });

    describe("epeek.utils.script_path", function () {
	it("Exists and is a method", function () {
	    assert.isDefined(epeek.utils.script_path);
	    assert.isFunction(epeek.utils.script_path);
	});

	it("Finds the absolute path to a script", function () {
	    var path = epeek.utils.script_path("ePeek.js");
	    assert.isDefined(path);
	    assert.notEqual(path, "");
	});
    });

});

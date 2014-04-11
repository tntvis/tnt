describe ("epeek.utils", function () {
    it ("Exists", function () {
	assert.isDefined(epeek.utils);
	assert.isObject(epeek.utils);
    });

    describe ("epeek.utils.iterator", function () {
	it ("Exists and is a method", function () {
	    assert.isDefined(epeek.utils.iterator);
	    assert.isFunction(epeek.utils.iterator);
	});

	it ("Returns a callback", function () {
	    assert.isDefined(epeek.utils.iterator());
	    assert.isFunction(epeek.utils.iterator());
	});

	var i = epeek.utils.iterator();
	it ("Returns a callback", function () {
	    assert.isDefined(i);
	    assert.isFunction(i);
	});

	it ("Starts with 0 by default", function () {
	    assert.strictEqual(i(), 0);
	});

	it ("Creates new values", function () {
	    assert.strictEqual(i(), 1);
	});

	it ("Can start from custom values", function () {
	    var j = epeek.utils.iterator(100);
	    assert.strictEqual(j(), 100);
	});
    });

    describe ("epeek.utils.script_path", function () {
	it ("Exists and is a method", function () {
	    assert.isDefined(epeek.utils.script_path);
	    assert.isFunction(epeek.utils.script_path);
	});

	it ("Finds the absolute path to a script", function () {
	    var path = epeek.utils.script_path("ePeek.js");
	    assert.isDefined(path);
	    assert.notEqual(path, "");
	});
    });

    describe ("epeek.utils.api", function () {
	it ("Exists and is a method", function () {
	    assert.isDefined(epeek.utils.api);
	    assert.isFunction(epeek.utils.api);
	});

	// Namespace to attach getters/setters
	var namespace = {};
	var api = epeek.utils.api(namespace);

	describe ("Getter/Setter", function () {
	    var props = {
	    	prop1 : 1,
	    	prop2 : "two",
	    	prop3 : function () {return 3}
	    };

	    it("Stores default values", function () {
		api.getset('property1', 5);
		assert.strictEqual(namespace.property1(), 5);
	    });

	    it("Allows to retrieve the method name", function () {
		assert.strictEqual(namespace.property1.method_name, 'property1');
	    });

	    it ("Sets properties in batches", function () {
	    	api.getset(props);
	    	assert.isDefined(namespace.prop1);
	    	assert.strictEqual(namespace.prop1(), 1);
	    	assert.strictEqual(namespace.prop2(), "two");
	    	assert.isFunction(namespace.prop3());
	    });

	    it ("Allows api properties to be accessed from the properties object", function () {
	    	assert.strictEqual(namespace.prop1(), props.prop1);
	    	namespace.prop1(2);
	    	assert.strictEqual(namespace.prop1(), 2);
	    	assert.strictEqual(namespace.prop1(), props.prop1);
	    });

	    it ("Allows api properties to be changed from the properties object", function () {
		assert.strictEqual(namespace.prop1(), props.prop1);
		props.prop1 = 2000;
		assert.strictEqual(namespace.prop1(), 2000);
		assert.strictEqual(namespace.prop1(), props.prop1);
	    });

	    it ("Masks properties with new ones", function () {
		var props = {
		    prop1 : 2
		};
		api.getset(props);
		assert.strictEqual(namespace.prop1(), 2);
		props.prop1 = 1000;
		api.getset(props);
		assert.strictEqual(namespace.prop1(), 1000);
	    });

	});

	describe ("Getter", function () {
	    it ("Stores default values", function () {
	    	api.get('ro_property1', "a given value");
	    	assert.strictEqual(namespace.ro_property1(), "a given value");
	    });

	    it ("Complains on setting", function () {
		assert.throws(function () {
		    namespace.ro_property1("another value")
		}, /is defined only as a getter/);
	    });
	});

	describe ("Setter", function () {
	    it ("Stores default values", function () {
	    	api.set('wo_property1', "a hidden value");
	    });

	    it ("Complains on getting", function () {
		assert.throws(function () {
		    namespace.wo_property1()
		}, /is defined only as a setter/);
	    });

	    it ("Allows to get the values from the object", function () {
	    	wo_methods = {
	    	    my_property : 5
	    	};
		api.set(wo_methods);
	    	namespace.my_property("changed");
	    	assert.strictEqual(wo_methods.my_property, "changed");
	    });
	});

	describe ("Check", function () {
	    it ("Stores and run checks by method name", function () {
		api.check('prop1', function (val) { return val > 0 });

		assert.doesNotThrow (function () {
		    namespace.prop1(10);
		});

		assert.throws (function () {
		    namespace.prop1(-1);
		}, /doesn't seem to be valid for this method/);

		assert.strictEqual(namespace.prop1(), 10);
	    });

	    it ("Stores and run checks by method", function () {
		api.check(namespace.prop1, function (val) { return val < 100});

		assert.doesNotThrow (function () {
		    namespace.prop1(20);
		});

		assert.throws (function () {
		    namespace.prop1(200);
		}, /doesn't seem to be valid for this method/);

		assert.strictEqual(namespace.prop1(), 20);
	    });

	    it ("Works with chai's assert", function () {
		api.check(namespace.prop2, function (val) { assert.isNumber (val) });
		assert.throws (function () {
		    namespace.prop2("not a number");
		}, /expected 'not a number' to be a number/);
	    });

	    it ("Accepts an optional argument with the error message", function () {
		api.check(namespace.prop3,
			  function (val) { return typeof (val) === 'function' },
			  'Argument should be a function');

		assert.throws (function () {
		    namespace.prop3("not a function");
		}, 'Argument should be a function');
		
	    });

	    it ("Can be attached via the method interface", function () {
		api.getset("kk", 1);
		namespace.kk.check(function (val) {return val > 0});
		assert.strictEqual(namespace.kk(), 1);
		assert.throws(function () {
		    namespace.kk(-1);
		}, /doesn't seem to be valid for this method/);
	    });

	    it ("Registers checks on multiple methods at the same time", function () {
		api.getset({
		    one : 1,
		    two : 2,
		    three : 3
		});
		api.check(['one', 'two', 'three'], function (x) {return x>0});
		assert.throws (function () {
		    namespace.one(-1);
		}, /doesn't seem to be valid for this method/);

		assert.throws (function () {
		    namespace.two(-1);
		}, /doesn't seem to be valid for this method/);

		assert.doesNotThrow (function () {
		    namespace.one(10);
		});
		assert.strictEqual(namespace.one(), 10);
	    });

	});

	describe ("Transform", function () {

	    it ("Stores and run transforms by method name", function () {
		api.getset('another_prop', 1);
		api.check('another_prop', function (val) { return val < 10 });
		assert.throws (function () {
		    namespace.another_prop(20);
		}, /doesn't seem to be valid for this method/);
		api.transform('another_prop', function (val) { return val % 10 });
		assert.doesNotThrow (function () {
		    namespace.another_prop(20);
		});
	    });

	    it ("Stores and run transforms by method", function () {
		api.getset('another_prop2', 1);
		api.check('another_prop2', function (val) { return val < 10 });
		assert.throws (function () {
		    namespace.another_prop2(20);
		}, /doesn't seem to be valid for this method/);
		api.transform(namespace.another_prop2, function (val) { return val % 10 });
		assert.doesNotThrow (function () {
		    namespace.another_prop2(20);
		});
	    });

	    it ("Can be attached via the method interface", function () {
		namespace.kk.transform (function (val) {return Math.abs(val)});
		assert.strictEqual (namespace.kk(), 1);
		assert.doesNotThrow (function () {
		    namespace.kk(-10);
		});
		assert.strictEqual(namespace.kk(), 10);
	    });

	    it ("Registers transforms on multiple methods at the same time", function () {
		api.transform(['one', 'two', 'three'], function (x) {return Math.abs(x)});

		assert.doesNotThrow (function () {
		    namespace.one(-10);
		});
 		assert.strictEqual(namespace.one(), 10);

		assert.doesNotThrow (function () {
		    namespace.two(-20);
		});
		assert.strictEqual(namespace.two(), 20);
	    });

	});

    });

});

epeek.utils.api = function (who) {

    var _methods = function () {
	var m = [];

	m.add_batch = function (obj) {
	    m.unshift(obj);
	};

	m.update = function (method, value) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			m[i][p] = value;
			return true;
		    }
		}
	    }
	    return false;
	};

	m.add = function (method, value) {
	    if (m.update (method, value) ) {
	    } else {
		var reg = {};
		reg[method] = value
		m.add_batch( reg );
	    }
	};

	m.get = function (method) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			return m[i][p];
		    }
		}
	    }
	};

	return m;
    };

    var _checks = function () {
	var c = {};

	c.add = function (method, cbak, msg) {
	    if (c[method] === undefined) {
		c[method] = [];
	    }
	    c[method].push({check : cbak,
			    msg   : msg});

	    return c;
	}

	return c;
    }

    var _transforms = function () {
	var t = {};

	t.add = function (method, cbak) {
	    if (t[method] === undefined) {
		t[method] = [];
	    }
	    t[method].push(cbak);

	    return t;
	}

	return t;
    };

    var methods    = _methods();
    var checks     = _checks();
    var transforms = _transforms();

    var api = function () {};

    api.check = function (method, check, msg) {
	if (typeof (method) === 'function') {
	    var name = method.method_name;
	    checks.add(name, check, msg);
	} else {
	    checks.add(method, check, msg);
	}
	return api;
    };

    api.transform = function (method, cbak) {
	if (typeof (method) === 'function') {
	    var name = method.method_name;
	    transforms.add(name, cbak);
	} else {
	    transforms.add(method, cbak);
	}
	return api;
    };

    var attach_method = function (method, opts) {
	var getter = opts.on_getter || function () {
	    return methods.get(method);
	};

	var setter = opts.on_setter || function (x) {
	    if (transforms[method] !== undefined) {
		for (var i=0; i<transforms[method].length; i++) {
		    x = transforms[method][i](x);
		}
	    }

	    if (checks[method] !== undefined) {
		for (var i=0; i<checks[method].length; i++) {
		    if (!checks[method][i].check(x)) {
			var msg = checks[method][i].msg || 
			    ("Value " + x + " doesn't seem to be valid for this method");
			throw (msg);
		    }
		}
	    }
	    methods.add(method, x);
	};

	var new_method = function (new_val) {
	    if (!arguments.length) {
		return getter();
	    }
	    setter(new_val);
	    return who; // Return this?
	};
	new_method.method_name = method;
	new_method.check = function (cbak) {
	    checks.add(method, cbak);
	};
	new_method.transform = function (cbak) {
	    transforms.add(method, cbak);
	};

	who[method] = new_method;
    };

    var getset = function (param, opts) {
	if (typeof (param) === 'object') {
	    methods.add_batch(param);
	    for (var p in param) {
		attach_method(p, opts)
	    }
	} else {
	    methods.add(param, opts.default_value);
	    attach_method(param, opts);
	}
    };

    api.getset = function (param, def) {
	getset(param, {default_value : def});

	return api;
    };

    api.get = function (param, def) {
	var on_setter = function () {
	    throw (name + " is defined only as a getter (you are trying to use it as a setter");
	};

	getset(param, {default_value : def,
		       on_setter : on_setter}
	      );

	return api;
    };

    api.set = function (param, def) {
	var on_getter = function () {
	    throw (name + " is defined only as a setter (you are trying to use it as a getter");
	}

	getset(param, {default_value : def,
		       on_getter : on_getter}
	      );

	return api;
    };

    return api;
    
};

epeek.utils.api = function (who) {

    var methods = function () {
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

    var checks = function () {
	var c = {};

	c.add = function (method, cbak) {
	    if (c[method] === undefined) {
		c[method] = [];
	    }
	    c[method].push(cbak);

	    return c;
	}

	return c;
    }

    var mm = methods();
    var cc = checks();

    var api = function () {};

    api.check = function (method, check) {
	if (typeof (method) === 'function') {
	    var name = method.name();
	    cc.add(name, check);
	} else {
	    cc.add(method, check);
	}
	return api;
    };

    var attach_method = function (method, opts) {
	var getter = opts.on_getter || function () {
	    return mm.get(method);
	};

	var setter = opts.on_setter || function (x) {
	    if (cc[method] !== undefined) {
		for (var i=0; i<cc[method].length; i++) {
		    if (!cc[method][i](x)) {
			throw ("Value " + x + " doesn't seem to be valid for this method")
		    }
		}
	    }
	    mm.add(method, x);
	};

	who[method] = function (new_val) {
	    if (!arguments.length) {
		return getter();
	    }
	    setter(new_val);
	    return who; // Return this?
	}
    };

    var getset = function (param, opts) {
	if (typeof (param) === 'object') {
	    mm.add_batch(param);
	    for (var p in param) {
		attach_method(p, opts)
	    }
	} else {
	    mm.add(param, opts.default_value);
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

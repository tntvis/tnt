epeek.utils.getset = function (who) {
    var g = function () {
    };

    g.getset = function (name, def) {
	var val = def;
	who[name] = function (x) {
	    if (!arguments.length) {
		return val;
	    }

// 	    if (typeof(x) === 'function') {
// 		val = x.call(who);
// 	    } else {
	    val = x;
//	    }

	    return who;
	};

	return g;
    };

    g.get = function (name, def) {
	var val = def;
	who[name] = function () {
	    if (arguments.length) {
		throw (name + " is defined only as a getter (you are trying to use it as a setter");
	    }
	    return val;
	}
    };

    g.set = function (name, def) {
	var val = def;
	who[name] = function (x) {
	    if (!arguments.length) {
		throw (name + " is defined only as a setter (you are trying to use it as a getter");
	    }
	    var val = x;
	    return who;
	};
    };

    return g;
    
};

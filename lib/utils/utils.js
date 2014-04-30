epeek.utils = {};

epeek.utils.iterator = function(init_val) {
    var i = init_val || 0;
    var iter = function () {
	return i++;
    };
    return iter;
};

epeek.utils.script_path = function (script_name) { // script_name is the filename
    var script_scaped = script_name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    var script_re = new RegExp(script_scaped + '$');
    var script_re_sub = new RegExp('(.*)' + script_scaped + '$');

    var scripts = document.getElementsByTagName('script');
    var path = "";  // Default to current path
    if(scripts !== undefined) {
        for(var i in scripts) {
            if(scripts[i].src && scripts[i].src.match(script_re)) {
                return scripts[i].src.replace(script_re_sub, '$1');
            }
        }
    }
    return path;
};

epeek.utils.defer_cancel = function (cbak, time) {
    var tick;

    var defer_cancel = function () {
	clearTimeout(tick);
	tick = setTimeout(cbak, time);
    }

    return defer_cancel;
};

epeek.utils.reduce = function () {

    var smooth = 5;
    var key = 'val';
    var redundant = function (a, b) {
	if (a < b) {
	    return ((b-a) <= (b * .2));
	}
	return ((a-b) <= (a * .2));
    };

    var reduce = function (arr) {
	var smoothed = perform_smooth(arr);
	var reduced  = perform_reduce(smoothed);
	return reduced;
    };

    var median = function (v, arr) {
	arr.sort(function (a, b) {
	    return a[key] - b[key];
	});
	if (arr.length % 2) {
	    v[key] = arr[~~(arr.length / 2)][key];	    
	} else {
	    var n = ~~(arr.length / 2) - 1;
	    v[key] = (arr[n][key] + arr[n+1][key]) / 2;
	}

	return v;
    };

    var perform_smooth = function (arr) {
	if (smooth === 0) { // no smooth
	    return arr;
	}
	var smooth_arr = [];
	for (var i=0; i<arr.length; i++) {
	    var low = (i < smooth) ? 0 : (i - smooth);
	    var high = (i > (arr.length - smooth)) ? arr.length : (i + smooth);
	    smooth_arr[i] = median(arr[i], arr.slice(low,high+1));
	};
	return smooth_arr;
    };

    var perform_reduce = function (arr) {
	var reduced_arr = [];
	var curr = arr[0];
	for (var i=1; i<arr.length-1; i++) {
	    if (redundant (arr[i][key], curr[key])) {
		continue;
	    }
	    reduced_arr.push (curr);
	    curr = arr[i];
	}
	reduced_arr.push(curr);
	reduced_arr.push(arr[arr.length-1]);
	return reduced_arr;
    };

    reduce.redundant = function (cbak) {
	if (!arguments.length) {
	    return redundant;
	}
	redundant = cbak;
	return reduce;
    };

    reduce.key = function (val) {
	if (!arguments.length) {
	    return key;
	}
	key = val;
	return reduce;
    };

    reduce.smooth = function (val) {
	if (!arguments.length) {
	    return smooth;
	}
	smooth = val;
	return reduce;
    };

    return reduce;
};




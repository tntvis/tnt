epeek.misc = {};
epeek.misc.iteratorInt = function(init_val) {
    var i = init_val || 0;
    var iter = function () {
	return i++;
    };
    return iter;
};

epeek.utils = {};
epeek.utils.iteratorInt = function(init_val) {
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



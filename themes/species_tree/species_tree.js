
var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {
	sT.layout("radial");
	sT(div);
	var t = sT.tree();
	console.log(t.find_node_by_name(t, "human"));
	setTimeout(function(){
	    sT.layout("vertical");
	    sT.update();
	}, 2000);
    };

    return tree_theme;
};

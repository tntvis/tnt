
var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {
	sT.layout("radial");
	var t = sT(div);
	console.log(t.find_node_by_name(t, "Homo_sapiens"));
	setTimeout(function(){
	    sT.layout("vertical");
	    sT.update();
	}, 2000);
    };

    return tree_theme;
};

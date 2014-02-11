
var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {
	sT.layout("radial");
	sT(div);
	setTimeout(function(){
// 	    sT.layout("vertical");
	    sT.subtree(["Mus_musculus", "Bos_taurus"])
 	    sT.update();
	}, 2000);
    };

    return tree_theme;
};

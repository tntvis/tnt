
var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {
	sT.layout("vertical");
	sT(div);
	setTimeout(function(){
// 	    sT.layout("vertical");
	    sT.subtree(["Mus_musculus", "Bos_taurus", "Homo_sapiens"])
 	    sT.update();
	}, 2000);
    };

    return tree_theme;
};

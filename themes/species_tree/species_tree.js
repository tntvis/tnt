
var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {
	sT.layout("vertical");
	sT(div);
	sT.transition();
	setTimeout(function(){
	    sT.layout("radial");
	    sT.transition();
	}, 2000);
    };

    return tree_theme;
};

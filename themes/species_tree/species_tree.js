
var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {
	sT.layout("vertical");
	sT(div);
	setTimeout(function(){
	    console.log("GO");
// 	    sT.layout("vertical");
	    sT.subtree(["kk1", "chimp", "human", "fish", "?Papio_hamadryas", "o2", "Danio_rerio"]);
//	    sT.subtree(["Homo_sapiens", "Mus_musculus", "Gorilla_gorilla"]);
//	    sT.subtree(["human","fish"]);
 	    sT.update();
	}, 2000);
	setTimeout(function(){
	    console.log("GO");
	    sT.subtree(["human", "mouse", "chimp", "fish"]);
	    sT.update();
	}, 6000);
    };

    return tree_theme;
};

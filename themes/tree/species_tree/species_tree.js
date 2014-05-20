
var epeek_theme_tree_species_tree = function() {
    "use strict";

    var tree_theme = function (sT, div) {
	sT.layout("radial");
	sT(div);
	setTimeout(function(){
	    console.log("GO");
// 	    sT.layout("vertical");
//	    sT.subtree(["chimp", "human", "fly"]);
//	    sT.subtree(["mouse", "human", "zebrafish"]);
//	    sT.subtree(["Homo_sapiens", "Mus_musculus", "Gorilla_gorilla"]);
	    sT.subtree(["human","fish"]);
//	    sT.subtree(["Microbat","Flying fox","Hedgehog","Shrew","Panda","Dog","Ferret","Cat","Cow","Pig","Alpaca","Dolphin","Horse"]);
 	    sT.update();
	}, 2000);
	setTimeout(function(){
	    console.log("GO");
//	    sT.subtree(["human", "mouse", "chimp", "fish", "fly"]);
	    sT.subtree(["mouse", "human", "zebrafish", "fugu"]);
//	    sT.subtree(["Microbat","Flying fox","Hedgehog","Shrew","Panda","Dog","Ferret","Cat","Cow","Pig","Alpaca","Dolphin","Horse","Sheep"]);
	    sT.update();
	}, 8000);
    };

// 	setTimeout(function(){
// 	    console.log("GO");
// // 	    sT.layout("vertical");
// 	    sT.subtree(["kk1", "chimp", "human", "fish", "?Papio_hamadryas", "o2", "Danio_rerio"]);
// //	    sT.subtree(["Homo_sapiens", "Mus_musculus", "Gorilla_gorilla"]);
// //	    sT.subtree(["human","fish"]);
//  	    sT.update();
// 	}, 2000);
// 	setTimeout(function(){
// 	    console.log("GO");
// 	    sT.subtree(["human", "mouse", "chimp", "fish"]);
// 	    sT.update();
// 	}, 6000);
//     };

    return tree_theme;
};

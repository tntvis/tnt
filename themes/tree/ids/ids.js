var tnt_theme_tree_ids = function() {
    "use strict";

    var tnt_theme = function (tree_vis, div) {

	d3.select(div)
	    .append("button")
	    .text("Switch")
	    .on("click", function () {
		tree_vis.data(tnt.tree.parse_newick(newick2));
		tree_vis.update();
	    });

	tree_vis
	    .data(tnt.tree.parse_newick(newick))
	    // .id("name")
	    .node_display(tree_vis.node_display().size(4).fill("orange"))
	    .layout(tnt.tree.layout.vertical()
		    .width(650)
		    .scale(false)
		   )
	    .duration(1000);

	tree_vis(div);
    };

    return tnt_theme;
};

var newick = "((human, dog, chicken)anc1, mouse)root";
var newick2 = "(((human, dog)anc1, chicken)anc1.1, mouse)root";

// newick tree
// var newick = "(((C.elegans,Fly),(((((((((Tasmanian Devil,Wallaby,Opossum),((Armadillo,Sloth),(Rock hyrax,Tenrec,Elephant),(((Rabbit,Pika),(((Rat,Mouse),Kangaroo rat,Squirrel),Guinea Pig)),((Mouse lemur,Bushbaby),((((((Chimp,Human,Gorilla),Orangutan),Gibbon),Macaque),Marmoset),Tarsier)),Tree Shrew),((Microbat,Flying fox),(Hedgehog,Shrew),((Panda,Dog,Domestic ferret),Cat),((Cow,Sheep),Pig,Alpaca,Dolphin),Horse))),Platypus),((((Collared flycatcher,Zebra finch),(Chicken,Turkey),Duck),Chinese softshell turtle),Anole lizard)),Xenopus),Coelacanth),(((Zebrafish,Cave fish),((((Medaka,Platyfish),Stickleback),(Fugu,Tetraodon),Tilapia),Cod)),Spotted gar)),Lamprey),(C.savignyi,C.intestinalis))),S.cerevisiae);";

// var newick2 = "(((C.elegans,Fly),(((((((((Tasmanian Devil,Wallaby,Opossum),((Armadillo,Sloth),(Rock hyrax,Tenrec,Elephant),(((Rabbit,Pika),(((Rat,Mouse),Kangaroo rat,Squirrel),Guinea Pig)),((Mouse lemur,Bushbaby),((((((Chimp,Human,Gorilla),Orangutan),Gibbon),Macaque),Marmoset),Tarsier)),Tree Shrew),((Microbat,Flying fox),(Hedgehog,Shrew),((Panda,Dog,Domestic ferret),Cat),((Sheep,Cow),Pig,Alpaca,Dolphin),Horse))),Platypus),((((Collared flycatcher,Zebra finch),(Chicken,Turkey),Duck),Chinese softshell turtle),Anole lizard)),Xenopus),Coelacanth),(((Zebrafish,Cave fish),((((Medaka,Platyfish),Stickleback),(Fugu,Tetraodon),Tilapia),Cod)),Spotted gar)),Lamprey),(C.savignyi,C.intestinalis))),S.cerevisiae);";
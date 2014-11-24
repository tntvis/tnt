var tnt_theme_tree_tooltip_tipsy = function() {
    "use strict";

    var tree_theme = function (tree_vis, div) {
	var newick = "(((C.elegans,Fly),(((((((((Tasmanian Devil,Wallaby,Opossum),((Armadillo,Sloth),(Rock hyrax,Tenrec,Elephant),(((Rabbit,Pika),(((Rat,Mouse),Kangaroo rat,Squirrel),Guinea Pig)),((Mouse lemur,Bushbaby),((((((Chimp,Human,Gorilla),Orangutan),Gibbon),Macaque),Marmoset),Tarsier)),Tree Shrew),((Microbat,Flying fox),(Hedgehog,Shrew),((Panda,Dog,Domestic ferret),Cat),((Cow,Sheep),Pig,Alpaca,Dolphin),Horse))),Platypus),((((Collared flycatcher,Zebra finch),(Chicken,Turkey),Duck),Chinese softshell turtle),Anole lizard)),Xenopus),Coelacanth),(((Zebrafish,Cave fish),((((Medaka,Platyfish),Stickleback),(Fugu,Tetraodon),Tilapia),Cod)),Spotted gar)),Lamprey),(C.savignyi,C.intestinalis))),S.cerevisiae);"

	tree_vis
	    .data(tnt.tree.parse_newick(newick))
	    .duration(2000)
	    .layout(tnt.tree.layout.vertical()
		    .width(600)
		    .scale(false))

	tree_vis

	tree_vis.root().apply(function (node) {
	    node.property('title', node.property('name'));
	});

	// The visualization is started at this point
	tree_vis(div);

	$('#mytree').tipsy({fade:true});
    };

    return tree_theme;
};

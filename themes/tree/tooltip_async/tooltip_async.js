var tnt_theme_tree_tooltip_async = function() {
    "use strict";

    var ensRest = tnt.eRest();

    var tree_theme = function (tree_vis, div) {

	var newick = "(((C.elegans,Fly),(((((((((Tasmanian Devil,Wallaby,Opossum),((Armadillo,Sloth),(Rock hyrax,Tenrec,Elephant),(((Rabbit,Pika),(((Rat,Mouse),Kangaroo rat,Squirrel),Guinea Pig)),((Mouse lemur,Bushbaby),((((((Chimp,Human,Gorilla),Orangutan),Gibbon),Macaque),Marmoset),Tarsier)),Tree Shrew),((Microbat,Flying fox),(Hedgehog,Shrew),((Panda,Dog,Domestic ferret),Cat),((Cow,Sheep),Pig,Alpaca,Dolphin),Horse))),Platypus),((((Collared flycatcher,Zebra finch),(Chicken,Turkey),Duck),Chinese softshell turtle),Anole lizard)),Xenopus),Coelacanth),(((Zebrafish,Cave fish),((((Medaka,Platyfish),Stickleback),(Fugu,Tetraodon),Tilapia),Cod)),Spotted gar)),Lamprey),(C.savignyi,C.intestinalis))),S.cerevisiae);"

	tree_vis
	    .data(tnt.tree.parse_newick(newick))
	    .duration(2000)
	    .layout(tnt.tree.layout.radial()
		    .width(800)
		    .scale(false))
	    .on_click(tree_vis.tooltip());

	
	var tree_tooltip = function (node) {
	    var t = tnt.tooltip.table()
		.position("auto")
		.width(180);

	    var s = tnt.tooltip.plain()
		.position("auto")
		.width(180)
		.show_closer(false)
		.allow_drag(false);

	    // Save the clicked element
	    var event = d3.event;
	    var elem = this;

	    ensRest.call({
		url : ensRest.url.assembly({
		    species : node.node_name()
		}),
		success : function (resp) {
		    // s.close();
		    var obj = {};
		    obj.header = "Name: " + node.node_name();
		    obj.rows = [];
		    obj.rows.push({
			label : "Assembly",
			value : resp.assembly_name
		    })
		    // Pass the clicked element (this is not the element here anymore)
		    t.call (elem, obj, event);
		}
	    });
	    s.call(elem, {header : "Name: " + node.node_name(),
			  body : "<img height='20' src='./spinner.gif'/>"
			 });
	};

	// Attach on-click events to the nodes
	tree_vis.on_click(tree_tooltip);

	// Attach on-click events to the labels
	// tree_vis.label().on_click(tree_tooltip);


	// The visualization is started at this point
	tree_vis(div);
    };

    return tree_theme;
};

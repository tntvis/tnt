var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {

	var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,mus_musculus:95)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;"

	var path = epeek.utils.script_path("labels.js");
	var pics_path = path + "/pics/";

	var scientific_to_common = {
	    "homo_sapiens" : "human",
	    "pan_troglodytes" : "chimpanzee",
	    "callithrix_jacchus" : "marmoset",
	    "mus_musculus" : "mouse",
	    "taeniopygia_guttata" : "zebra finch",
	    "danio_rerio" : "zebrafish"
	};

	var names_to_pics = {
	    "homo_sapiens" : pics_path + "homo_sapiens.png",
	    "pan_troglodytes" : pics_path + "pan_troglodytes.png",
	    "callithrix_jacchus" : pics_path + "callithrix_jacchus.png",
	    "mus_musculus" : pics_path + "mus_musculus.png",
	    "taeniopygia_guttata" : pics_path + "taeniopygia_guttata.png",
	    "danio_rerio" : pics_path + "danio_rerio.png"
	};

	// Different labels

	// The empty label shows no label
	var empty_label = epeek.tree.label.text()
	    .text(function (d) {
		return "";
	    })

	// The original label shows the name of the node (default)
	var original_label = epeek.tree.label.text(); // Default options (ie. unchanged names)

	// The clean label shows the names substituting underscores with spaces
	var clean_label = epeek.tree.label.text() // Same as default but without underscores
	    .text(function (d) {
		return d.name.replace(/_/g, ' ');
	    });

	// The prefix label shows the first 7 characters of the labels appending '...' at the end
	var prefix_label = epeek.tree.label.text() // Showing only 7 characters
	    .text(function (d) {
		return d.name.substr(0,6) + "...";
	    });

	// The common label shows the common name of the species
	var common_label = epeek.tree.label.text()
	    .text(function (d) {
		return scientific_to_common[d.name]
	    });

	// The image label shows a picture of the species
	var image_label = epeek.tree.label.img()
	    .src(function (d) {
		return names_to_pics[d.name];
	    })
	    .width(function () {
		return 50;
	    })
	    .height(function () {
		return 50;
	    });

	// The mixed label shows a picture for the leaves and the name of the internal nodes
	// var mixed_label = function (node) {
	//     if (node.branchset !== undefined) { // internal node
	// 	original_label.call(this, node);
	//     } else { // leaf
	// 	image_label.call(this, node);
	//     }
	// }
	// mixed_label.remove = image_label.remove;

	// var internal_label = epeek.tree.label.text()
	//     .text(function (node) {
	// 	if (node.is_leaf()) {
	// 	    return ""
	// 	}
	// 	return node.name;
	//     })
	//     .width(function (node) {
	// 	console.log("NODE:");
	// 	console.log(node);
	// 	if (node.children === undefined) {
	// 	    return 0;
	// 	}
	// 	return node.name.length * this.fontsize();
	//     });
	// var mixed_label = epeek.tree.label.composite()
	//     .add_label(original_label)
	//     .add_label(image_label);

	// The joined label shows a picture + the common name
	var joined_label = epeek.tree.label.composite()
	    .add_label(image_label)
	// This is the same 'common label' as the one above
	// but we are not reusing that one because add_label
	// adjusts automatically the transform of the labels
	    .add_label(epeek.tree.label.text()
		       .text(function (d) {
			   return scientific_to_common[d.name]
		       }));

	// The menu to change the labels dynamically
	var menu_pane = d3.select(div)
	    .append("div")
	    .append("span")
	    .text("Label display:   ");

	var label_type_menu = menu_pane
	    .append("select")
	    .on("change", function (d) {
		switch (this.value) {
		case "empty" :
		    sT.label(empty_label);
		    break;
		case "original" :
		    sT.label(original_label);
		    break;
		case "clean" :
		    sT.label(clean_label);
		    break;
		case "prefix" :
		    sT.label(prefix_label);
		    break;
		case "common" :
		    sT.label(common_label);
		    break;
		case "image" :
		    sT.label(image_label);
		    break;
		// case "mixed" :
		//     sT.label(mixed_label);
		//     break;
		case "joined" :
		    sT.label(joined_label);
		    break;
		}

		sT.update();
	    });

	label_type_menu
	    .append("option")
	    .attr("value", "empty")
	    .text("empty");

	label_type_menu
	    .append("option")
	    .attr("value", "original")
	    .attr("selected", 1)
	    .text("original");

	label_type_menu
	    .append("option")
	    .attr("value", "clean")
	    .text("clean");

	label_type_menu
	    .append("option")
	    .attr("value", "prefix")
	    .text("prefix");

	label_type_menu
	    .append("option")
	    .attr("value", "common")
	    .text("common name");

	label_type_menu
	    .append("option")
	    .attr("value", "image")
	    .text("species image");

	// label_type_menu
	//     .append("option")
	//     .attr("value", "mixed")
	//     .text("text + image");

	label_type_menu
	    .append("option")
	    .attr("value", "joined")
	    .text("joined img + text");

	sT
	    .data(epeek.tree.parse_newick(newick))
	    .duration(2000)
	    .layout(epeek.tree.layout.vertical().width(600).scale(false))
	    .label(original_label);

	// The visualization is started at this point
	sT(div);
    };

    return tree_theme;
};

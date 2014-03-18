var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {

	var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,mus_musculus:95)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;"

	var path = epeek.scriptPath("labels.js");
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
	var empty_label = epeek.tree.label.text()
	    .text(function (d) {
		return "";
	    })
	var original_label = epeek.tree.label.text(); // Default options (ie. unchanged names)
	var clean_label = epeek.tree.label.text() // Same as default but without underscores
	    .text(function (d) {
		return d.name.replace(/_/g, ' ');
	    });
	var prefix_label = epeek.tree.label.text() // Showing only 7 characters
	    .text(function (d) {
		return d.name.substr(0,6) + "...";
	    });
	var common_label = epeek.tree.label.text()
	    .text(function (d) {
		return scientific_to_common[d.name]
	    });
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
	var mixed_label = function (node) {
	    if (node.branchset !== undefined) { // internal nodew
		original_label.call(this, node);
	    } else { // leaf
		image_label.call(this, node);
	    }
	}

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
		case "mixed" :
		    sT.label(mixed_label);
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

	label_type_menu
	    .append("option")
	    .attr("value", "mixed")
	    .text("text + image");
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

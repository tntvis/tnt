var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {
	// In the div, we set up a "select" to transition between a radial and a vertical tree
	// var menu_pane = d3.select(div)
	//     .append("div")
	//     .append("span")
	//     .text("Layout:  ");

	// var sel = menu_pane
	//     .append("select")
	//     .on("change", function(d) {
	// 	switch (this.value) {
	// 	case "unscaled" :
	// 	    sT.layout().scale(false);
	// 	    break;
	// 	case "scaled" :
	// 	    sT.layout().scale(true);
	// 	    break;
	// 	};
	// 	sT.update();
	//     });

	// sel
	//     .append("option")
	//     .attr("value", "unscaled")
	//     .attr("selected", 1)
	//     .text("Unscaled");
	// sel
	//     .append("option")
	//     .attr("value", "scaled")
	//     .text("Scaled");


	var newick = "(((((homo_sapiens:9,pan_troglodytes:9)207598:34,callithrix_jacchus:43)314293:52,mus_musculus:95)314146:215,taeniopygia_guttata:310)32524:107,danio_rerio:417)117571:135;"

	var scientific_to_common = {
	    "homo_sapiens" : "human",
	    "pan_troglodytes" : "chimpanzee",
	    "callithrix_jacchus" : "marmoset",
	    "mus_musculus" : "mouse",
	    "taeniopygia_guttata" : "zebra finch",
	    "danio_rerio" : "zebrafish"
	};
	var common_to_scientific = {
	    "human" : "homo_sapiens",
	    "chimpanzee" : "pan_troglodytes",
	    "marmoset" : "callithrix_jacchus",
	    "mouse" : "mus_musculus",
	    "zebra finch" : "taeniopygia_guttata",
	    "zebrafish" : "danio_rerio"
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

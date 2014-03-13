var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {
	// In the div, we set up a "select" to transition between a radial and a vertical tree
	var menu_pane = d3.select(div)
	    .append("div")
	    .append("span")
	    .text("Layout:  ");

	var sel = menu_pane
	    .append("select")
	    .on("change", function(d) {
		switch (this.value) {
		case "unscaled" :
		    sT.layout().scale(false);
		    break;
		case "scaled" :
		    sT.layout().scale(true);
		    break;
		};
		sT.update();
	    });

	sel
	    .append("option")
	    .attr("value", "unscaled")
	    .attr("selected", 1)
	    .text("Unscaled");
	sel
	    .append("option")
	    .attr("value", "scaled")
	    .text("Scaled");


	var newick = "(((Crotalus_oreganus_oreganus_cytochrome_b:0.00800,Crotalus_horridus_cytochrome_b:0.05866):0.04732,(Thamnophis_elegans_terrestris_cytochrome_b:0.00366,Thamnophis_atratus_cytochrome_b:0.00172):0.06255):0.00555,(Pituophis_catenifer_vertebralis_cytochrome_b:0.00552,Lampropeltis_getula_cytochrome_b:0.02035):0.05762,((Diadophis_punctatus_cytochrome_b:0.06486,Contia_tenuis_cytochrome_b:0.05342):0.01037,Hypsiglena_torquata_cytochrome_b:0.05346):0.00779);";

	sT
	    .data(epeek.tree.parse_newick(newick))
	    .duration(2000)
	    .layout(epeek.tree.layout.vertical().width(600).scale(false));
	    // .scale(false);

	// The visualization is started at this point
	sT(div);
    };

    return tree_theme;
};

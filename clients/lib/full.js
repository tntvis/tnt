
var epeek_theme = function() {
    "use strict";

    var div_id;
    var gene_info_pane_id;
    var gene_orthologues_tree_id;

    var gBrowser;
    var orthologues_tree;

    var gBrowserTheme = function (gB, div) {
	set_div_id(div);

	// We save the passed genome browser for later use
	gBrowser = gB;

	// Set the gBrowser's callbacks
	gBrowser.gene_info_callback   = gene_info_callback;
	gBrowser.homologues_callback  = homologues_cbak;

	d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_orthologues_tree")
	    .attr("id", gene_orthologues_tree_id);

	orthologues_tree = epeek_tree();
	orthologues_tree(document.getElementById(gene_orthologues_tree_id));

	gBrowser.startOnOrigin();

	////////////////////////////////////////////////
	// Here we have to include the genome browser //
	////////////////////////////////////////////////
	gBrowser(div);

    };

    var set_div_id = function(div) {
	div_id = d3.select(div).attr("id");
	// gene_info_pane_id = "ePeek_" + div_id + "_gene_info";
	gene_orthologues_tree_id = "ePeek_" + div_id + "_orthologues_tree_info";
    };

    var gene_info_callback = function (gene) {
    	// We unhighlight previous highlighted genes
    	gBrowser.unhighlight_gene(function(d){return true});
    	gBrowser.highlight_gene(function(d){return d.ID === gene.ID});

    	gBrowser.homologues(gene.ID);
    };

    var homologues_cbak = function (homologues) {
	var homologues_obj = gBrowser.split_homologues(homologues);

	var orthologues_by_species = classify_orthologues_by_species(homologues_obj);

	orthologues_tree.update(orthologues_by_species);
    };

    var classify_orthologues_by_species = function (homs) {
	var orths = homs.orthologues;
	var orths_by_species = {};
	for (var i = 0; i < orths.length; i++) {
	    if (orths_by_species[orths[i].species] === undefined) {
		orths_by_species[orths[i].species] = [];
	    }
	    orths_by_species[orths[i].species].push(orths[i]);
	}
	return orths_by_species;
    };

    return gBrowserTheme;

}

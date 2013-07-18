
var epeek_theme = function() {
    "use strict";

    var div_id;
    var gene_info_pane_id;
    var gene_orthologues_tree_id;

    var gBrowser;

    var gBrowserTheme = function (gB, div) {
	set_div_id(div);

	// We save the passed genome browser for later use
	gBrowser = gB;

	// Set the gBrowser's callbacks
	gBrowser.gene_info_callback   = gene_info_callback;
	gBrowser.homologues_callback  = homologues_cbak;

	/////////////////////////////////////////
	// Here we have to include the browser //
	/////////////////////////////////////////

	// The Browser div
	gBrowser(div);
	
	// General info pane
	var info_pane = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_info_pane");

	// The GeneInfo Panel
	// TODO: The geneInfo panel doesn't need to have full width.
	info_pane
	    .append("div")
	    .attr("class", "ePeek_gene_info")
	    .attr("id", gene_info_pane_id);

	info_pane
	    .append("div")
	    .attr("class", "ePeek_orthologues_tree")
	    .attr("id", gene_orthologues_tree_id)

	gBrowser.startOnOrigin();

    };

    var set_div_id = function(div) {
	div_id = d3.select(div).attr("id");
	gene_info_pane_id = "ePeek_" + div_id + "_gene_info";
	gene_orthologues_tree_id = "ePeek_" + div_id + "_orthologues_tree_info";
    };


    var populate_gene_info_row = function (table, data) {
	var gene_info_row = table
	    .append("tr");
	gene_info_row
	    .append("td")
	    .text(data.name)
	gene_info_row
	    .append("td")
	    .text(data.value);
    };

    var populate_gene_info_table = function (table, gene) {
	var data = [{name:"Name"         , value:gene.external_name},
		    {name:"Ensembl ID"   , value:gene.ID},
		    {name:"Biotype"      , value:gene.biotype},
		    {name:"Description"  , value:gene.description},
		    {name:"Feature type" , value:gene.feature_type},
		    {name:"Logic name"   , value:gene.logic_name},
		    {name:"Source"       , value:gene.source},
		    {name:"Length"       , value:(gene.end - gene.start) + "bp"},
		    {name:"Chr"          , value:gene.seq_region_name},
		    {name:"Start"        , value:gene.start},
		    {name:"End"          , value:gene.end},
		    {name:"Strand"       , value:gene.strand}];

	for (var i = 0; i < data.length; i++) {
	    populate_gene_info_row(table, data[i])
	}
    };

    var gene_info_callback = function (gene) {
	// We unhighlight previous highlighted genes
	gBrowser.unhighlight_gene(function(d){return true});
	gBrowser.highlight_gene(function(d){return d.ID === gene.ID});

	// We remove the info of the previously selected gene (if any)
	d3.selectAll("#" + gene_info_pane_id + " *").remove();
	d3.selectAll("#" + gene_orthologues_tree_id + " *").remove();

	// We populate the gene info panel
	var gene_info_pane = d3.select("#" + gene_info_pane_id);

	gene_info_pane
	    .append("h1")
	    .text(gene.external_name);
	var gene_info_table = gene_info_pane
	    .append("table")
	    .attr("class", "ePeek_gene_info_table");
	populate_gene_info_table(gene_info_table, gene);

	// We populate the species tree
	var cluster = d3.layout.cluster()
	    .size([360, 1])
	    .sort(null)
	    .value(function(d) { return d.length; })
	    .children(function(d) { return d.branchset; })
	    .separation(function(a, b) { return 1; });


	gBrowser.homologues(gene.ID);
    };

    var homologues_cbak = function (homologues) {
	var homologues_obj = gBrowser.split_homologues(homologues);

	console.log("HOMOLOGUES OBJ:");
	console.log(homologues_obj);

	var orthologues_by_species = classify_orthologues_by_species(homologues_obj);

	var orthologues_tree = epeek_tree().species_counts(orthologues_by_species);
	orthologues_tree(document.getElementById(gene_orthologues_tree_id));
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
	console.log("ORTHS_BY_SPECIES:");
	console.log(orths_by_species);
	return orths_by_species;
    };

    return gBrowserTheme;

}

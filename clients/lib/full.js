var epeek_theme = function() {
    "use strict";
    console.log("eo");
    var div_id;
    var gene_info_pane_id;

    var gBrowser;

    var gBrowserTheme = function (gB, div) {
	set_div_id(div);

	// We save the passed genome browser for later use
	gBrowser = gB;

	// How to respond to gene selection
	gBrowser.gene_info_callback   = gene_info_callback;

	/////////////////////////////////////////
	// Here we have to include the browser //
	/////////////////////////////////////////

	// The Browser div
	gBrowser(div);
	
	// The GeneInfo Panel
	d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_gene_info")
	    .attr("id", gene_info_pane_id)
	    .style("width", gBrowser.width() + "px");

	

	gBrowser.startOnOrigin();

    };

    var set_div_id = function(div) {
	div_id = d3.select(div).attr("id");
	gene_info_pane_id = "ePeek_" + div_id + "_gene_info";
    };

    var gene_info_callback = function (gene) {
	console.log("GENE:");
	console.log(gene);
	var gene_info_pane = d3.select("#" + gene_info_pane_id);
	gene_info_pane
	    .append("p")
	    .attr("class", "ePeek_gene_info_paragraph")
	    .html(function() {
		return "<h1>" + gene.external_name + "</h1>" +
		    "Ensembl ID: <i>" + gene.ID + "</i><br />" +
		    "Description: <i>" + gene.description + "</i><br />" +
		    "Source: <i>" + gene.logic_name + "</i><br />" +
		    "loc: <i>" + gene.seq_region_name + ":" + gene.start + "-" + gene.end + " (Strand: " + gene.strand + ")</i><br />";
	    });
    };

    return gBrowserTheme;

}

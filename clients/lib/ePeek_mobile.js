function getLoc() {
    var url = document.createElement("a");
    url.href=document.URL;
    var loc = url.search;
    if (loc.indexOf("loc=") === 1) {   <!-- Search term starts by "loc=" -->
				       loc = loc.substring(5);
				       console.log("LOC TO PARSE IS: " + loc);
				   }
    return loc;
}

function getGB(w) {
    var gB = genomeBrowser()
        .show_options(false)
        .show_title(false)
        .show_links(false)
        .background_color("#FFFFFF")
        .foreground_color("#7389A5")
        .width(w-20)
        .orthologues_elem_id("ePeek_ext_orth_select")
        .ensGenes_elem_id("ePeek_ext_ensGenes_select")
        .n_orthologues_elem_id("ePeek_ext_n_orthologues")
        .n_ensGenes_elem_id("ePeek_ext_n_ensGenes")
    return gB;
}


Zepto(function($){

    var w = document.documentElement.clientWidth;

    var gB = getGB(w);
    var loc = getLoc();

    if (gB.isLocation(loc)) {
        gB.parseLocation(loc);
    } else {
        gB.gene(loc);
    }

    gB(document.getElementById("GenomeBrowser"));

    d3.select("#ePeek_origin")
        .text(loc);

    d3.select("#return_to_last_search")
        .on("click", function(){gB.startOnOrigin()});

    // Firefox 4 Android doesn't understand window.onorientationchange
    // So we need this alternative
    var mqOrientation = window.matchMedia("(orientation: portrait)");
    mqOrientation.addListener(function() { 
        var w=window.innerWidth
            || document.documentElement.clientWidth
            || document.body.clientWidth;

        gB.resize(w-20);
    });

    gB.highlight = function(gene) {
	d3.select("#gene_info div").remove();
	d3.select("#gene_info ul").remove();

	var gene_info = d3.select("#gene_info");

	var gene_info_toolbar = gene_info
	    .append("div")
	    .attr("class", "toolbar");

	gene_info_toolbar
	    .append("h1")
	    .text(gene.external_name);

	gene_info_toolbar
	    .append("a")
	    .attr("href", "#browser")
	    .attr("class", "button back")
	    .text("Browser")

	var gene_info_items_list = gene_info
	    .append("ul")
	    .attr("class", "edgetoedge scroll");

	gene_info_items_list
	    .append("li")
	    .attr("class", "sep")
	    .text("Gene Info")

	gene_info_items_list
	    .append("li")
	    .attr("class", "rounded")
	    .html("<em>Ensembl ID: </em>" + gene.ID);

	gene_info_items_list
	    .append("li")
	    .attr("class", "rounded")
	    .html("<em>Description: </em>" + gene.description);

	gene_info_items_list
	    .append("li")
	    .attr("class", "rounded")
	    .html("<em>Source: </em>" + gene.logic_name);

	gene_info_items_list
	    .append("li")
	    .attr("class", "sep")
	    .html("Location");

	gene_info_items_list
	    .append("li")
	    .attr("class", "rounded")
	    .html("<em>Current species: </em>" + gB.species());

	gene_info_items_list
	    .append("li")
	    .attr("class", "rounded")
	    .html("<em>Location: </em>" + gene.seq_region_name + ":" + gene.start + "-" + gene.end + " (Strand: " + (gene.strand === "1" ? "+" : "-") + ")");

	gene_info_items_list
	    .append("li")
	    .attr("class", "sep")
	    .html("Open " + gene.external_name + " in...");

	gene_info_items_list
	    .append("li")
	    .attr("class", "arrow")
	    .append("a")
	    .attr("href", gB.buildEnsemblGeneLink(gene.ID))
	    .attr("target", "_blank")
	    .append("img")
	    .attr("src", "ensembl_logo_small.png")


	// TODO: This way of getting to the gene_info div prevents the use of
	// transitions. We may find a better way!
	window.location.href="#gene_info";
    };


    // Default Android browser based on the WebKit engine
    // which also powers the Safari browser on desktops, laptops and Apple's iOS-based mobile devices
    // doesn't seem to understand window.matchMedia, so we need to use this alternative.
    window.onorientationchange = function() {
	// Strangely enough, default android browser reverses clientWidth and clientHeight?
	// TODO: Post a question somewhere? (StackOverflow?) -> DONE
	// TODO: It seems that introducing a short delay (500ms) the clientWidth and clientHeight are properly set
        setTimeout(function() {
	    // This may be needed for IE for mobiles?
	    //        var w=window.innerWidth
	    //           || document.documentElement.clientWidth
	    //           || document.body.clientWidth;
	    
            var w = document.documentElement.clientWidth;
            gB.resize(w-20);
        }, 500);
	
    };
    
});

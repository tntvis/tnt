var theme = function() {
    "use strict";

    // Default species and genome location
    var gene; // undefined
    var species = "human";
    var chr = 7;
    var fromPos = 139424940;
    var toPos = 141784100;

    // orig species and coords, so we can always return there
    var origSpecies, origChr, origFromPos, origToPos;

    // Regular expressions for user input
    // TODO: species:gene?
    var loc_re = /^(\w+):(\w+):(\d+)-(\d+)$/;
    var ens_re = /^ENS\w+\d+$/;

    // Display elements options that can be overridden by setters
    // (so they are exposed in the API)
    var show_options = true;
    var show_title   = true;
    var show_links   = true;
    var title   = "e!Peek";

    var genomeBrowserTheme = function() {
	// We set the original data so we can always come back
	origSpecies = species;
	origChr     = chr;
	origFromPos = fromPos;
	origToPos   = toPos;

	// The Options pane
	var opts_pane = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_options_pane")
	    .style("display", function() {
		if (show_options) {
		    return "block"
		} else {
		    return "none"
		}
	    });

	opts_pane = opts_pane
	    .append("span")
	    .text("Jump to: ");

	var ensGeneLabel = opts_pane
	    .append("span")
	    .attr("class", "ePeek_option_label")
	    .html("Ensembl Genes[<span id='ePeek_" + div_id + "_n_ensGenes'></span>]")
	    .on("click", function(){toggle(d3.select("#ePeek_" + div_id + "_ensGene_option"))});

	var orthologuesLabel = opts_pane
	    .append("span")
	    .attr("class", "ePeek_option_label")
	    .html("Orthologues[<span id='ePeek_" + div_id + "_n_orthologues'></span>]")
	    .on("click", function(){toggle(d3.select("#ePeek_" + div_id + "_ortho_option"))});

	var searchLabel = opts_pane
	    .append("span")
	    .attr("class", "ePeek_option_label")
	    .text("New gene")
	    .on("click", function(){toggle(d3.select("#ePeek_" + div_id + "_search_option"))});

	var origLabel = opts_pane
	    .append("span")
	    .attr("class", "ePeek_option_label")
	    .text("Return to orig")
	    .on("click", function(){gBrowser.startOnOrigin()});

	var ensGeneBox = opts_pane
	    .append("div")
	    .attr("class", "ePeek_TabBlock")
	    .attr("id", "ePeek_" + div_id + "_ensGene_option")
	    .style("width", width + "px")
	    .style("background-color", bgColor);

	var orthoBox = opts_pane
	    .append("div")
	    .attr("class", "ePeek_TabBlock")
	    .attr("id", "ePeek_" + div_id + "_ortho_option")
	    .style("width", width + "px")
	    .style("background-color", bgColor);

	var searchBox = opts_pane
	    .append("div")
	    .attr("class", "ePeek_TabBlock")
	    .attr("id", "ePeek_" + div_id + "_search_option")
	    .style("width", width + "px")
	    .style("background-color", bgColor);

	// The SearchBox
	var p = searchBox
	    .append("p")
	    .attr("class", "ePeek_top_option")
	    .text("Gene name or location")
	p
	    .append("input")
	    .attr("id", "ePeek_" + div_id + "_gene_name_input")
	    .attr("type", "text")
	    .attr("name", "gene");
	p
	    .append("input")
	    .attr("type", "button")
	    .attr("value", "Jump!")
	    .on("click", goSearch);
	p
	    .append("text")
	    .text("examples: ENSG00000139618, SNORD73 or human:5:1533225-1555555");

	/////////////////////////////////////////
	// Here we have to include the browser //
	/////////////////////////////////////////

	// The QRtag div
	var qrtag_div = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_TabBlock")
	    .attr("id", "ePeek_" + div_id + "_qrtag_div")
	    .style("margin-top", "-120px");

	// Links div
	var links_pane = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_links_pane")
	    .style("display", function() {if (show_links) {return "block"} else {return "none"}});

	links_pane = links_pane
	    .append("span")
	    .text("Links: ");

	// ePeek-web
	var epeekweb = links_pane
	    .append("span")
	    .attr("class", "ePeek_link_label")
	    .text("Open in a new window")
	    .on("click", function() {var link = buildLink("desktop"); window.open(link, "_blank")});

	// ensembl
	var ensemblLoc = links_pane
	    .append("span")
	    .attr("class", "ePeek_link_label")
	    .text("Open region in Ensembl")
	    .on("click", function() {var link = buildEnsemblLink(); window.open(link, "_blank")});

	// QRtag label
	var qrtagLabel = links_pane
	    .append("span")
	    .attr("class", "ePeek_qrtag_label") // both needed?
	    .attr("id", "ePeek_" + div_id + "_qrtag_label")
	    .text("QR code")
	    .on("click", function(){
		toggle(d3.select("#ePeek_" + div_id + "_qrtag_div"));
		create_QRtag()
	    });


    };

///*********************////
/// RENDERING FUNCTIONS ////
///*********************////
    // Private functions

    var create_QRtag = function() {
	// We remove previously created QRtag
	d3.select("#ePeek_" + div_id + "_QRcode").remove();

	var qrtag = new QRtag();
	qrtag.data(buildLink("mobile"));
	qrtag.border(10);
	qrtag.color(fgColor);
	qrtag.bgcolor(bgColor);
	qrtag.target("ePeek_" + div_id + "_qrtag_div");
	qrtag.id("ePeek_" + div_id + "_QRcode");
	qrtag.image();

	return;
    };

    var toggle = function(sel) {
	var curr_on_display = sel.classed("ePeek_TabBlock_active");

	// We hide all elements
	d3.selectAll(".ePeek_TabBlock")
	    .classed("ePeek_TabBlock_active", false);

	if (!curr_on_display) {
	    sel.classed("ePeek_TabBlock_active", true);
	} 

	return;
    };

    var goSearch = function() {
	d3.select("#ePeek_" + div_id + "_ensGene_select").remove();
	var ensGeneBox = d3.select("#" + ensGenes_div_id);
	var search_term = document.getElementById("ePeek_" + div_id + "_gene_name_input").value;
	if (gBrowser.isLocation(search_term)) {
	    gBrowser.parseLocation(search_term);
	    start();
	} else if (isEnsemblGene(search_term)) {
	    ensGene_lookup(search_term, ensGeneBox);
	} else {
	    get_gene(search_term, ensGeneBox);
	}
    };

    var gene_select = function(gene_array, div) {
	var ensGene_sel = div
	    .append("select")
	    .attr("class", "ePeek_top_option")
	    .attr("id", "ePeek_" + div_id + "_ensGene_select");
	
	ensGene_sel.selectAll("option")
	    .data(gene_array)
	    .enter()
	    .append("option")
	    .attr("class", "ePeek_gene_option")
	    .attr("value", function(d) {return d.id})
	    .text(function(d) {return d.id});

	// We add the number of ensGenes to the corresponding tab label
	d3.select(n_ensGenes_div_id)
	    .text(gene_array.length);

	return ensGene_sel;
    };

    // Public Functions (API)

    /** <strong>highlight</strong> shows the gene info pane
        This function can be shadowed by a custom - user created method
        to display the gene information in a different way -- or html element
        Its argument is a literal object having the following information:
	<ul>
	<li>external_name   => External name of the gene</li>
	<li>ID              => Ensembl ID of the gene</li>
        <li>description     => A short description of the gene</li>
        <li>logic_name      => The source of the gene</li>
        <li>feature_type    => This is always set to gene</li>
        <li>seq_region_name => The chromosome or region name the gene is located</li>
        <li>start           => The start coordinate in the seq_region_name</li>
        <li>end             => The end coordinate in the seq_region_name</li>
        <li>strand          => The strand in the seq_region_name</li>
	</ul>
    */
    gBrowser.highlight = function (gene) {
	var sel = d3.select("#ePeek_" + div_id + "_gene_info");

	sel
	    .classed("ePeek_gene_info_active", true)
	    .append("p")
	    .attr("class", "ePeek_gene_info_paragraph")
	    .style("color", fgColor)
	    .style("background-color", bgColor)
	    .html(function () {
		return "<h1>" + gene.external_name + "</h1>" +
		    "Ensembl ID: <i>" + gene.ID + "</i><br />" +
		    "Description: <i>" + gene.description + "</i><br />" +
		    "Source: <i>" + gene.logic_name + "</i><br />" +
		    "loc: <i>" + gene.seq_region_name + ":" + gene.start + "-" + gene.end + " (Strand: " + gene.strand + ")</i><br />"
	    });

	sel.append("span")
	    .attr("class", "ePeek_text_rotated")
	    .style("top", ~~height/2 + "px")
	    .style("background-color", fgColor)
	    .append("text")
	    .attr("class", "ePeek_link")
	    .style("color", bgColor)
	    .text("[Close]")
	    .on("click", function() {d3.select("#ePeek_" + div_id + "_gene_info" + " p").remove();
				     d3.select("#ePeek_" + div_id + "_gene_info" + " span").remove();
				     sel.classed("ePeek_gene_info_active", false)});

    };

    var get_orthologues = function (ensGene) {
	var div = d3.select("#" + orth_div_id);
	var orth_select = div
	    .append("select")
	    .attr("class", "ePeek_top_option")
	    .attr("id", "ePeek_" + div_id + "_orth_select");

	orth_select
	    .append("option")
	    .attr("class", "ePeek_orth_option")
	    .text("-- Go to ortholog --");

	orth_select.selectAll("option2")
	    .data(resp.data[0].homologies, function(d){return d.id})
	    .enter()
	    .append("option")
	    .attr("class", "ePeek_orth_option")
	    .attr("value", function(d) {return d.id})
	    .text(function(d) {return d.id + " (" + d.species + " - " + d.type + ")"});

	orth_select.on("change", function() {
	    d3.select("#ePeek_" + div_id + "_ensGene_select").remove();
	    ensGene_lookup(this.value, div);
	});

	// We fill the number of orthologues in the tab label
	d3.select("#" + n_orth_div_id)
	    .text(resp === undefined ? 0 : resp.data[0].homologies.length);
    };

        var get_gene = function(gene_name, div) {
	var url = prefix_gene + species + "/" + gene_name + ".json?object=gene";
	console.log(url);
	d3.json(url, function (error, resp) {
	    resp = resp.filter(function(d){return !d.id.indexOf("ENS")}); // To avoid LRG genes (maybe the REST Service doesn't return those now)?
	    console.log("RESP:");
	    console.log(resp);

	    var ensGene_sel = gene_select(resp, div);

	    ensGene_sel.on("change", function(){
		ensGene_lookup(this.value, div);
	    });

	    if (resp[0] !== undefined) {
		ensGene_lookup(resp[0].id, div);
	    } else {
		start();
	    }

	});
    };


    return genomeBrowserTheme;
};







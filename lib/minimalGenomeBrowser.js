var genomeBrowser = function () {
//    "use strict";

    // Default species and genome location
    var gene; // undefined
    var species = "human";
    var chr = 7;
    var fromPos = 139424940;
    var toPos = 141784100;

    // orig species and coords, so we can always return there
    var origSpecies, origChr, origFromPos, origToPos;

    // Prefixes to use the REST API.
    // These are modified in the localREST setter
    var prefix = "http://beta.rest.ensembl.org";
    var prefix_region = prefix + "/feature/region/";
    var prefix_ensgene = prefix + "/lookup/";
    var prefix_gene = prefix + "/xrefs/symbol/";
    var prefix_orthologs = prefix + "/homology/id/";

    // The REST response in general view
    var genes  = [];

    // Regular expressions for user input
    // TODO: species:gene?
    var loc_re = /^(\w+):(\w+):(\d+)-(\d+)$/;
    var ens_re = /^ENS\w+\d+$/;

    // Display elements options that can be overridden by setters
    // (so they are exposed in the API)
    var min_width = 300;
    var width     = 600;
    var height    = 150;
    var show_options = true;
    var show_title   = true;
    var show_links   = true;
    var title   = "e!Peek";
    var bgColor = '#DDDDDD'; //#F8FBEF
    var fgColor = '#000000';

    // Display elements (not directly exposed in the API)
    var svg_g;
    var pane;
    var xScale;
    var xAxis;
    var refresh;
//    var top = 60;
    var dur = 500;
//    var durFill = 300;

    // div_ids to display different elements
    // most of these are exposed in the API
    // See ePeek_mobile.html for an example of how to use them
    var div_id            = undefined;
    var orth_div_id       = undefined;
    var ensGenes_div_id   = undefined;
    var n_ensGenes_div_id = undefined;
    var n_orth_div_id     = undefined;

    /** The returned closure
	@alias ePeek
	@namespace 
    */
     var gBrowser = function (div) {
	//
	set_div_id(div);

	// We set the original data so we can always come back
	origSpecies = species;
	origChr     = chr;
	origFromPos = fromPos;
	origToPos   = toPos;

	// The original div is classed with the ePeek class
	d3.select(div)
//	    .attr("class", "ePeek");
	    .classed("ePeek", true);

	// The Options pane
	var opts_pane = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_options_pane")
	    .style("display", function() {if (show_options) {return "block"} else {return "none"}});

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


	// The Browser div
	var browserDiv = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_toplevel");

	var browser_title = browserDiv
	    .append("div")
	    .attr("class", "ePeek_toolbar")
	    .append("h1")
	    .text(title)
	    .style("color", fgColor)
	    .style("display", function(){if (show_title) {return "auto"} else {return "none"}});

	var locRow = browserDiv
	    .append("div")
	    .attr("class", "ePeek_locRow");

	var groupDiv = browserDiv
	    .append("div")
	    .attr("class", "ePeek_groupDiv");

	// The SVG
	svg_g = groupDiv
	    .append("svg")
	    .attr("class", "ePeek_svg")
	    .attr("width", width)
	    .attr("height", height)
	    .style("background-color", bgColor)
	    .append("g")
            .attr("transform", "translate(0,20)")
            .append("g")
	    .attr("class", "ePeek_g");

	// The GeneInfo Panel
	groupDiv
	    .append("div")
	    .attr("class", "ePeek_gene_info")
	    .attr("id", "ePeek_" + div_id + "_gene_info") // Both needed?
	    .style("width", width+"px");

	// The Zooming/Panning Pane
	pane = svg_g
	    .append("rect")
	    .attr("class", "ePeek_pane")
	    .attr("id", "ePeek_" + div_id + "_pane")
	    .attr("width", width)
	    .attr("height", height)
	    .style("fill", fgColor);

	// The locRow
	locRow
	    .append("span")
	    .text("Current location: ");
	locRow
	    .append("span")
	    .attr("id", "ePeek_" + div_id + "_species")
	    .text(species);
	locRow
	    .append("span")
	    .text(" (");
	locRow
	    .append("span")
	    .attr("id", "ePeek_" + div_id + "_chr")
	    .text(chr);
	locRow
	    .append("span")
	    .text(":");
	locRow
	    .append("span")
	    .attr("id", "ePeek_" + div_id + "_from")
	    .text(fromPos);
	locRow
	    .append("span")
	    .text("-");
	locRow
	    .append("span")
	    .attr("id", "ePeek_" + div_id + "_to")
	    .text(toPos);
	locRow
	    .append("span")
	    .text(")");

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
	    .on("click", function(){toggle(d3.select("#ePeek_" + div_id + "_qrtag_div")); create_QRtag()});

	// We get the gene/location to render
	gBrowser.startOnOrigin();

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


    var start = function () {
        var url = get_url();
        d3.json(url, function (error, resp) {
            genes = resp;
            plot();
            update();
        });
    };

    var plot = function () {
        xScale = d3.scale.linear()
            .domain([fromPos, toPos])
            .range([0, width]);

        xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("top");

        // zoom
        pane.call(d3.behavior.zoom().x(xScale).on("zoom", zoom));
    };

    var update = function () {
       svg_g.call(xAxis);
        var rects = svg_g.selectAll(".ePeek_gene")
            .data(genes, function (d) {
                return d.ID
	    })
            .attr("x", function (d) {
                return (xScale(d.start))
	    })
            .attr("width", function (d) {
                return (xScale(d.end) - xScale(d.start))
	    });

        rects.enter()
            .append("rect")
            .attr("class", function(d) {return "ePeek_gene ePeek_" + d.ID})
            .attr("x", function (d) {
                return (xScale(d.start))
	    })
            .attr("y", 10)
            .attr("width", function (d) {
                return (xScale(d.end) - xScale(d.start))
	    })
            .attr("height", 10)
            .attr("fill", bgColor)
            .transition().duration(dur).attr("fill", fgColor);

        rects.exit().remove();

        rects.on("click", function(d) {gBrowser.highlight(d)});
        // rects.on("mouseout",  function(d) {highlight(this, d, false)});

        // labels
        var names = svg_g.selectAll(".ePeek_name")
            .data(genes, function (d) {
                return d.ID
	    })
            .attr("x", function (d) {
                return (xScale(d.start))
	    })

        names.enter()
            .append("text")
            .attr("class", function(d) {return "ePeek_name ePeek_" + d.ID})
            .attr("x", function (d) {
                return xScale(d.start)
	    })
            .attr("y", 35)
            .attr("fill", bgColor)
            .text(function (d) {
                return d.external_name
	    })
            .transition().duration(dur).attr("fill", fgColor);

        names.exit().remove();

        names.on("click", function(d) {gBrowser.highlight(d)});
//        names.on("mouseout",  function(d) {highlight(this, d, false)});

	// loc_row
	var xScale_domain = xScale.domain();
	d3.select("#ePeek_" + div_id + "_species")
	    .text(species); // Only if cross-species is allowed! This can only change if Jumped from searchBox or ortholog selection
	d3.select("#ePeek_" + div_id + "_chr")
	    .text(chr);
	d3.select("#ePeek_" + div_id + "_from")
	    .text(~~xScale_domain[0]);
	d3.select("#ePeek_" + div_id + "_to")
	    .text(~~xScale_domain[1]);
    };

    var zoom = function () {
        window.clearTimeout(refresh);
        refresh = window.setTimeout(function(){
            gBrowser.from(~~xScale.invert(0));
            gBrowser.to(~~xScale.invert(width));
            console.log("New Pos:" + fromPos + "-" + toPos);
            var url = get_url();
            console.log(url);
            d3.json(url, function (error, resp) {
		if (error !== null) {
		    d3.select("#ePeek_" + div_id + "_pane")
			.classed("ePeek_dark_pane", true);
		} else {
		    d3.select("#ePeek_" + div_id + "_pane")
			.classed("ePeek_dark_pane", false);
                    genes = resp;
                    update();
		}
            });
	}, 300);
	
        update();
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

    // resize takes a new width (in pixels) for the genome view and resizes it accordingly
    gBrowser.resize = function(w) {
	// Resize the svg
	d3.select(".ePeek_svg").attr("width", w);
	// Resize the zooming/panning pane
	d3.select("#ePeek_" + div_id + "_pane").attr("width", w);
	// Set the new width
	gBrowser.width(w);

	// Replot
	plot();
	update();
    };

    // startOnOrigin sets the genome view to its recorded origin in its original species.
    // This can be a gene or a location
    gBrowser.startOnOrigin = function() {
	// We get the gene/location to render
	species = origSpecies;
	if (gene !== undefined) {
	    get_gene(gene, d3.select("#" + ensGenes_div_id));
	} else {
	    chr     = origChr;
	    fromPos = origFromPos;
	    toPos   = origToPos;
	    start();
	}

    };


///*********************////
/// DATA RETRIEVERS     ////
///*********************////
    // Private methods
    var get_orthologs = function(ensGene) {
	var div = d3.select("#" + orth_div_id);
	var url = prefix_orthologs + ensGene + ".json?format=condensed;sequence=none;type=orthologues";
	console.log(url);

	d3.json(url, function (error, resp) {
	    console.log("ORTH RESP:");
	    console.log(resp);
	    if (resp !== undefined) {
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
	    }

	    // We fill the number of orthologues in the tab label
	    d3.select("#" + n_orth_div_id)
	    	.text(resp === undefined ? 0 : resp.data[0].homologies.length);
	});
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
    
    var ensGene_lookup = function (gene_name, div) {
	d3.select("#ePeek_" + div_id + "_orth_select").remove();
        var url = prefix_ensgene + gene_name + ".json?format=full";
	console.log("MY URL:");
	console.log(url);
        d3.json(url, function (error, resp) {
            console.log(resp);
            gBrowser.species(resp.species).chr(resp.seq_region_name).from(resp.start).to(resp.end);
	    get_orthologs(gene_name);
            start();
        });
        return gBrowser;
    };

///*********************///
/// GETTERS & SETTERS:  ///
///*********************///
    // private methods
    var set_div_id = function(div) {
	div_id = d3.select(div).attr("id");
	if (orth_div_id === undefined) {
	    gBrowser.orthologues_elem_id("ePeek_" + div_id + "_ortho_option");
	}
	if (ensGenes_div_id === undefined) {
	    gBrowser.ensGenes_elem_id("ePeek_" + div_id + "_ensGene_option");
	}
	if (n_ensGenes_div_id === undefined) {
	    gBrowser.n_ensGenes_elem_id("ePeek_" + div_id + "_n_ensGenes");
	}
	if (n_orth_div_id === undefined) {
	    gBrowser.n_orthologues_elem_id("ePeek_" + div_id + "_n_orthologues");
	}
    };


    // Public methods

    // parseLocation takes a string as input and guesses a location
    // The expected location should be on the form:
    //   species:chr:from-to
    // TODO: What happens on error? i.e. if the string is not a valid location
    // TODO: We can make it smarter? allowing for examples species:gene?
    gBrowser.parseLocation = function(loc) {
	console.log(loc);
	var loc_arr = loc_re.exec(loc);
	species = loc_arr[1];
	chr     = loc_arr[2];
	fromPos = loc_arr[3];
	toPos   = loc_arr[4];
//	gene    = undefined;

	return gBrowser;
    };

    // show_options tells the widget to show or hide the top options pane
    // Its argument is evaluated to 'true' or 'false'
    gBrowser.show_options = function(b) {
	show_options = b;
	return gBrowser;
    };

    // show_title tells the widget to show or hide the title field
    // Its argument is evaluated to 'true' or 'false'
    gBrowser.show_title = function(b) {
	show_title = b;
	return gBrowser;
    };

    // show_links tells the widget to show or hide the bottom links pane
    // Its argument is evaluated to 'true' or 'false'
    gBrowser.show_links = function(b) {
	show_links = b;
	return gBrowser;
    };

    // orthologues_elem_id to sets a different html element (typically a "div" element)
    // to display the orthologues selection
    // This is used for example in ePeek_mobile, where we want this select in its own place of the page
    // The expected argument is the id of the html element.
    gBrowser.orthologues_elem_id = function(id) {
	if (!arguments.length) {
	    return orth_div_id;
	}
	orth_div_id = id;
	return gBrowser;
    };

    // ensGenes_elem_id sets a different html element (typically a "div" element) to display
    // the ensembl genes associated with the selected external name.
    // This is used for example in ePeek_mobile, where we want this select in its own place of the page
    // The expected argument is the id of the html element.
    gBrowser.ensGenes_elem_id = function(id) {
	if (!arguments.length) {
	    return ensGenes_div_id;
	}
	ensGenes_div_id = id;
	return gBrowser;
    };

    // n_ensGenes_elem_id sets a different html element to display the number of ensembl genes
    // associated with the selected external name
    // This is used for example in ePeek_mobile.html
    // The expected argument is the id of the html element.
    gBrowser.n_ensGenes_elem_id = function(id) {
	if (!arguments.length) {
	    return n_ensGenes_div_id;
	}
	n_ensGenes_div_id = id;
	return gBrowser;
    };

    // n_orthologues_elem_id sets a different html element to display the number of orthologues
    // for a given gene
    // This is used for example in ePeek_mobile.html
    // The expected argument is the id of the html element.
    gBrowser.n_orthologues_elem_id = function(id) {
	if (!arguments.length) {
	    return n_orth_div_id;
	}
	n_orth_div_id = id;
	return gBrowser;
    };

    // title overrides the default title of the widget ("e!Peek") with the argument provided
    gBrowser.title = function (s) {
	if (!arguments.length) {
	    return title;
	}
	title = s;
	return gBrowser;
    };

    // width sets the width (in pixels) of the genomic view using the argument provided
    // The argument should be only the number of pixels (without any suffix like "px")
    // To re-set this width lively use the "resize" method.
    // TODO: Allow suffixes like "1000px"
    // TODO: Test wrong formats
    gBrowser.width = function (w) {
	if (!arguments.length) {
	    return width;
	}
	// At least min-width
	if (w < min_width) {
	    w = min_width
	}
	width = w;
	return gBrowser;
    };

    // background_color sets the background color for several parts of the widget
    // It can be used to match the color schema used in the host page
    // Its argument is a color in any valid format (hex, string, etc...)
    gBrowser.background_color = function (hex) {
	if (!arguments.length) {
	    return bgColor;
	}
	bgColor = hex;
	return gBrowser;
    };

    // foreground_color sets the color of several parts of the widget (not all the parts will have this color)
    // It can be used to match the color schema used in the host page
    // Its argument is a color in any valid format (hex, string, etc...)
    gBrowser.foreground_color = function (hex) {
	if (!arguments.length) {
	    return fgColor;
	}
	fgColor = hex;
	return gBrowser;
    };

    // species sets the species that will be used for the next search (gene or location)
    // Common names are allowed (human, chimp, gorilla, mouse, etc...)
    // Binary scientific names are also allowed with and without underscores (for example "mus_musculus" and "mus musculus")
    // Case is ignored.
    gBrowser.species = function (sp) {
        if (!arguments.length) {
            return species
        }
        species = sp;
        return gBrowser;
    };

    // chr sets the chromosome that will be used for the next coordinates-based location
    // Strictly, not only chromosome names are allowed, but also other seq_region_names (for example "GeneScaffold_1468")
    // but we adopted this method name for simplicity.
    gBrowser.chr = function (c) {
        if (!arguments.length) {
            return chr;
        }
        chr = c;
        return gBrowser;
    };

    // from sets the start position for the next coordinates-base location to the given argument
    // Commas or dots in numbers are not allowed (32,341,674 or 32.341.674)
    // TODO: Allow them?
    gBrowser.from = function (p) {
        if (!arguments.length) {
            return fromPos;
        }
        fromPos = p;
        return gBrowser;
    };

    // to sets the end position for the next coordinates-based location to the given argument
    // Commas or dots in numbers are not allowed (32,341,674 or 32.341.674)
    // TODO: Allow them?
    gBrowser.to = function (p) {
        if (!arguments.length) {
            return toPos;
        }
        toPos = p;
        return gBrowser;
    };
    
    // gene sets the gene name for the next gene-based location
    // gene-based locations have higher preference over coordinates-based locations
    // So for example, using:
    // gB.species("human").chr(13).from(35009587).to(35214822).gene("LINC00457");
    // will show the correct location even if the gene name is spelled wrong or is not recognized by Ensembl
    // External gene names (BRCA2) and ensembl gene identifiers (ENSG00000139618) are both allowed.
    gBrowser.gene = function(g) {
	if (!arguments.length) {
	    return gene;
	}
	gene = g;
	return gBrowser;
    };

    // localREST points the queries to a local REST service to debug.
    // This method should be removed in "production"
    gBrowser.localREST = function() {
	prefix = "http://127.0.0.1:3000";
	prefix_region = prefix + "/feature/region/";
	prefix_ensgene = prefix + "/lookup/id/";
	prefix_gene = prefix + "/xrefs/symbol/";
	prefix_orthologs = prefix + "/homology/id/";

	return gBrowser;
    };

///*********************////
/// UTILITY METHODS     ////
///*********************////
    // Private methods
    var buildLink = function(platform) {
	var url = "http://www.ebi.ac.uk/~mp/ePeek/clients/ePeek";
	var postfix = "";
	if (platform === "desktop") {
	    url = url + ".html";
	} else if (platform === "mobile") {
	    url = url + "_mobile.html";
	    postfix = "#browser";
	}
	url = url + "?loc=" + species + ":" + chr + ":" + fromPos + "-" + toPos + postfix;
	return url;
    };

    var buildEnsemblLink = function() {
	var url = "http://www.ensembl.org/" + species + "/Location/View?r=" + chr + "%3A" + fromPos + "-" + toPos;
	return url;
    };

    var isEnsemblGene = function(term) {
	if (term.match(ens_re)) {
	    return true;
	} else {
	    return false;
	}
    };

    var get_url = function () {
        var url = prefix_region + species + "/" + chr + ":" + fromPos + "-" + toPos + ".json?feature=gene";
        return url;
    };
    

    // Public methods

    // isLocation returns true if the argument looks like a location of the form
    // species:chr:from-to or false otherwise
    gBrowser.isLocation = function(term) {
	if (term.match(loc_re)) {
	    return true;
	} else {
	    return false;
	}
    };

    // buildEnsemblGeneLink returns the Ensembl url pointing to the gene summary given in as argument
    // The gene id shouuld be a valid ensembl gene id of the form "ENSG......XXXX"
    gBrowser.buildEnsemblGeneLink = function(ensID) {
	//"http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000139618"
	var url = "http://www.ensembl.org/" + species + "/Gene/Summary?g=" + ensID;
	return url;
    };

    return gBrowser;
};

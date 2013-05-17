var epeek = function() {
    "use strict";
 
   // Default species and genome location
    var gene; // undefined
    var species = "human";
    var chr = 7;
    var fromPos = 139424940;
    var toPos = 141784100;

    // Prefixes to use the REST API.
    // These are modified in the localREST setter
    var prefix = "http://beta.rest.ensembl.org";
    var prefix_region = prefix + "/feature/region/";
    var prefix_ensgene = prefix + "/lookup/";
    var prefix_gene = prefix + "/xrefs/symbol/";
    var prefix_orthologues = prefix + "/homology/id/";

    // The REST response in general view
    var genes  = [];

    // Display elements options that can be overridden by setters
    // (so they are exposed in the API)
    var min_width = 300;
    var width     = 600;
    var height    = 150;
    var bgColor = d3.rgb('#DDDDDD'); //#F8FBEF
    var fgColor = d3.rgb('#000000');

    // Display elements (not directly exposed in the API)
    var svg_g;
    var pane;
    var xScale;
    var xAxis;
    var refresh;
    var dur = 500;

    // The id of the div element the plug-in connects to
    // undefined by default
    var div_id;

    /** The returned closure
	@alias ePeek
	@namespace 
    */
    var gBrowser = function(div) {
	div_id = d3.select(div).attr("id");

	// The original div is classed with the ePeek class
	d3.select(div)
	    .classed("ePeek", true);

	// The Browser div
	var browserDiv = d3.select(div);

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

    };

    /** <strong>startOnOrigin</strong>
     */
    gBrowser.startOnOrigin = function () {
	if (gBrowser.gene() !== undefined) {
	    gBrowser.get_gene(gBrowser.gene());
	} else {
	    gBrowser.start();
	}
	return;

    };

    /** <strong>start</strong> plots the genome browser and starts listening for mouse events on it.
     */
    gBrowser.start = function () {
        var url = get_url();
	console.log("URL: ");
	console.log(url);
        d3.json(url, function (error, resp) {
	    console.log("RESP: ");
	    console.log(resp);
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

    // public methods (API)

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

    /** <strong>get_gene</strong> retrieves the gene from the remote server
	returning the Ensembl genes associated with that external name
	@param {string} gene_name The gene external name to look up
	@param {callback} callback Callback to execute when the search is done. The ensembl genes will be passed to the callback as arguments.
	@returns {Array} Ensembl genes associated with the query gene
     */
    gBrowser.get_gene = function(gene_name) {
	var url = prefix_gene + species + "/" + gene_name + ".json?object=gene";
	console.log("URL: " + url);
	d3.json(url, function(error, resp) {
	    resp = resp.filter(function(d) {
		return !d.id.indexOf("ENS"); // To avoid LRG genes (maybe the REST service doesn't return those now?
	    }); 
	    console.log("RESP:");
	    console.log(resp);
	    if (resp[0] !== undefined) {
		gBrowser.ensGenes_callback(resp);
		
		gBrowser.ensGene_lookup(resp[0].id);
		//  Fill here the orthologues?
		// or should this be done by the callback? ++
	    } else {
		gBrowser.start();
	    }
	});
    };


///*********************////
/// DATA RETRIEVERS     ////
///*********************////
    /** <strong>orthologues</strong> look for orthologues on a given gene.
	Once the orthologues are retrieved, it calls the method orthologues_callback passing the array of orthologues as its argument.
	@param {string} ensGene The id of the gene to look for orthologues
     */
    gBrowser.orthologues = function(ensGene) {
	var url = prefix_orthologues + ensGene + ".json?format=condensed;sequence=none;type=orthologues";
	console.log(url);

	d3.json(url, function (error, resp) {
	    console.log("ORTH RESP: ");
	    console.log(resp);
	    if (resp !== undefined) { // Needed because if there are not orthologues we get an error -- We are trying to change this in REST API
		gBrowser.orthologues_callback(resp.data[0].homologies);
	    }
	});
    };

    /** <strong>ensGene_lookup</strong> retrieves the coordinates of a Ensembl gene from
	the remote server
	@param {string} ensembl_gene_id The id of the gene to look for
	@returns {Object} The coordinates of the ensembl gene
     */
    gBrowser.ensGene_lookup = function (gene_name) {
	gBrowser.orthologues(gene_name);
	var url = prefix_ensgene + gene_name + ".json?format=full";
	console.log("lookup url:");
	console.log(url);

	d3.json(url, function(error, resp) {
	    console.log("RESP:");
	    console.log(resp);
	    gBrowser
		.species(resp.species)
		.chr(resp.seq_region_name)
		.from(resp.start)
		.to(resp.end);
	    gBrowser.start();
	});

    };
	
    // DEPRECATED
    // var ensGene_lookup = function (gene_name, div) {
    // 	d3.select("#ePeek_" + div_id + "_orth_select").remove();
    //     var url = prefix_ensgene + gene_name + ".json?format=full";
    // 	console.log("MY URL:");
    //     d3.json(url, function (error, resp) {
    //         console.log(resp);
    //         gBrowser.species(resp.species).chr(resp.seq_region_name).from(resp.start).to(resp.end);
    // 	    get_orthologs(gene_name);
    //         start();
    //     });
    //     return gBrowser;
    // };

///***********************////
/// Setters & Getters     ////
///***********************////
    gBrowser.species = function (sp) {
	if (!arguments.length) {
	    return species;
	}
	species = sp;
	return gBrowser;
    };

    gBrowser.chr  = function (c) {
	if (!arguments.length) {
	    return chr;
	}
	chr = c;
	return gBrowser;
    };

    gBrowser.from = function (n) {
	if (!arguments.length) {
	    return fromPos;
	}
	fromPos = n;
	return gBrowser;
    };

    gBrowser.to = function (n) {
	if (!arguments.length) {
	    return toPos;
	}
	toPos = n;
	return gBrowser;
    };

    /** <strong>gene</strong> sets the gene name for the next gene-based location
	gene-based locations have higher preference over coordinates-based locations
	So for example, using:
	gB.species("human").chr(13).from(35009587).to(35214822).gene("LINC00457");
	will show the correct location even if the gene name is spelled wrong or is not recognized by Ensembl
	External gene names (BRCA2) and ensembl gene identifiers (ENSG00000139618) are both allowed.
    */
    gBrowser.gene = function(g) {
	if (!arguments.length) {
	    return gene;
	}
	gene = g;
	return gBrowser;
    };


    gBrowser.height = function (h) {
	// TODO: Allow suffixes like "1000px"?
	// TODO: Test wrong formats
	if (!arguments.length) {
	    return height;
	}
	height = h;
	return gBrowser;
    };

    /** <strong>width</strong> sets the width (in pixels) of the genomic view using the argument provided
	The argument should be only the number of pixels (without any suffix like "px")
	To re-set this width lively use the "resize" method.
    */
    gBrowser.width = function (w) {
	// TODO: Allow suffixes like "1000px"?
	// TODO: Test wrong formats
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

    gBrowser.background_color = function (hex) {
	if (!arguments.length) {
	    return bgColor;
	}
	bgColor = d3.rgb(hex);
	return gBrowser;
    };

    gBrowser.foreground_color = function (hex) {
	if (!arguments.length) {
	    return fgColor;
	}
	fgColor = d3.rgb(hex);
	return gBrowser;
    };

    /** <strong>localREST</strong> points the queries to a local REST service to debug.
	This method should be removed in "production"
    */
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
    var get_url = function () {
        var url = prefix_region + species + "/" + chr + ":" + fromPos + "-" + toPos + ".json?feature=gene";
        return url;
    };

    // Default callbacks

    // gBrowser.highlight
    // This is default action on gene selection
    // TODO: This shouldn't be exported?
    gBrowser.highlight = function() {};
    gBrowser.ensGenes_callback = function() {};
    gBrowser.orthologues_callback = function() {};

    return gBrowser;
};

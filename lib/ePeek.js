var epeek = function() {
    "use strict";

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
    var bgColor = '#DDDDDD'; //#F8FBEF
    var fgColor = '#000000';

    // Display elements (not directly exposed in the API)
    var svg_g;
    var pane;
    var xScale;
    var xAxis;
    var refresh;
    var dur = 500;

    var gBrowser = function(div) {
	// The original div is classed with the ePeek class
	d3.select(div)
	    .classed("ePeek", true);

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

	gBrowser.startOnOrigin();
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
	return;
    };

///*********************////
/// DATA RETRIEVERS     ////
///*********************////
    // Private methods

    gBrowser.orthologues = function(ensGene) { // Is ensGene needed?
	var url = prefix_orthologues + ensGene + ".json?format=condensed;sequence=none;type=orthologues";
	console.log(url);

	d3.json(url, function (error, resp) {
	    console.log("ORTH RESP: ");
	    console.log(resp);
	    if (resp !== undefined) { // Needed because if there are not orthologues we get an error -- We are trying to change this in REST API
		return resp.data[0].homologies;
	    } else {
		return [];
	    }
	});
    };

    gBrowser.ensGene_lookup = function (gene_name) {
	var url = prefix_ensgene + gene_name + ".json?format=full";
	console.log("lookup url:");
	console.log(url);
    };
	
    var ensGene_lookup = function (gene_name, div) {
	d3.select("#ePeek_" + div_id + "_orth_select").remove();
        var url = prefix_ensgene + gene_name + ".json?format=full";
	console.log("MY URL:");
        d3.json(url, function (error, resp) {
            console.log(resp);
            gBrowser.species(resp.species).chr(resp.seq_region_name).from(resp.start).to(resp.end);
	    get_orthologs(gene_name);
            start();
        });
        return gBrowser;
    };


    return gBrowser;
};
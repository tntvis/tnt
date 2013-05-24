var epeek = function() {
    "use strict";
 
   // Default species and genome location
    var gene; // undefined
    var ensGene; // undefined
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
    var bgColor        = d3.rgb('#DDDDDD'); //#F8FBEF
    var fgColor        = d3.rgb('#000000');
    var highlightColor = d3.rgb('#000000');

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
	@example
	// Typically, the plug-in is used as follows:
	var gB = epeek().width(920); // other methods can be included here
	var gBTheme = epeek_theme(); // other methods can be included here
	gBTheme(gB, document.getElementById('DOM_element_id');
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

    /** <strong>startOnOrigin</strong> decides if the plug-in needs to be started based on a 
	gene or genome location. If centered in a gene, it tries to fetch the genomic
	coordinates associated with the given gene.
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
	It always uses genomic coordinates, so if the coordinates associated with a given gene
	needs to be taken into account, {@link ePeek.startOnOrigin} has to be used instead.
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
	    .attr("class", "ePeek_gene")
//	    .attr("id", function(d) {return "ePeek_gene_" + div_id + "_" + d.ID})
            .attr("x", function (d) {
                return (xScale(d.start))
	    })
            .attr("y", 10)
            .attr("width", function (d) {
                return (xScale(d.end) - xScale(d.start))
	    })
            .attr("height", 10)
            .attr("fill", bgColor)
//            .transition().duration(dur).attr("fill", fgColor);
	    .transition().duration(dur).attr("fill", function (d) {
		if ((ensGene !== undefined) && (ensGene === d.ID) ) {
		    return highlightColor
		} else {
		    return fgColor;
		}
	    });

        rects.exit().remove();
//	$(".ePeek_gene").bind("tap", $(".ePeek_gene").click);
	// We wire "tap" events with "click" events -- needed for mobile touch events
	rects.on("tap", rects.on("click"));
        rects.on("click", function(d) {gBrowser.gene_info_callback(d)});

        // labels
        var labels = svg_g.selectAll(".ePeek_name")
            .data(genes, function (d) {
                return d.ID
	    })
            .attr("x", function (d) {
                return (xScale(d.start))
	    })

        labels.enter()
            .append("text")
	    .attr("class", "ePeek_name")
//	    .attr("id", function(d) {return "ePeek_label_" + div_id + "_" + d.ID})
            .attr("x", function (d) {
                return xScale(d.start)
	    })
            .attr("y", 35)
            .attr("fill", bgColor)
            .text(function (d) {
                return d.external_name
	    })
//            .transition().duration(dur).attr("fill", fgColor);
	    .style ("font-weight", function (d) {
		if ((ensGene !== undefined) && (ensGene === d.ID) ) {
		    return "bold";
		} else {
		    return "normal";
		}
	    })
	    .transition().duration(dur).attr("fill", function (d) {
		if ((ensGene !== undefined) && (ensGene === d.ID) ) {
		    return highlightColor
		} else {
		    return fgColor;
		}
	    });


        labels.exit().remove();

	labels.on("tap", labels.on("click"));
        labels.on("click", function(d) {gBrowser.gene_info_callback(d)});

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

    /** <strong>resize</strong> takes a new width (in pixels) for the genome view and resizes it accordingly. It can be used to resize the view lively. For example it is used by the mobile theme to respond to orientation changes in the device
	@param {Number} width New width (in pixels)
     */
    gBrowser.resize = function (w) {
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

    /** <strong>get_gene</strong> retrieves the gene from the remote (REST) server
	returning the Ensembl genes associated with the given external name
	If the response of the REST server is defined, the {@link ePeek.ensGenes_callback} callback is invoked passing the found Ensembl genes as its argument.
	If the response of the REST server is undefined, the plug-in is started with the current
	genomic coordinates
	@param {string} gene_name The gene external name to look up
     */
    gBrowser.get_gene = function (gene_name) {
	var url = prefix_gene + species + "/" + gene_name + ".json?object=gene";
	console.log("URL: " + url);
	d3.json(url, function(error, resp) {
	    resp = resp.filter(function(d) {
		return !d.id.indexOf("ENS"); // To avoid LRG genes (maybe the REST service doesn't return those now?
	    }); 
	    console.log("RESP:");
	    console.log(resp);
	    if (resp[0] !== undefined) {
		set_ensGene(resp[0].id);
		gBrowser.ensGenes_callback(resp);
		gBrowser.ensGene_lookup(resp[0].id);
	    } else {
		gBrowser.start();
	    }
	});
    };


///*********************////
/// DATA RETRIEVERS     ////
///*********************////
    /** <strong>orthologues</strong> looks for orthologues of the given gene.
	Once the orthologues are retrieved, the {@link ePeek.orthologues_callback} callback is invoked passing the array of orthologues as its argument.
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
	the remote server. The plug-in is then initialized via the {@link ePeek.start} method.
	@param {string} gene_name The id of the Ensembl gene to look for
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
	

///***********************////
/// Setters & Getters     ////
///***********************////

    var set_ensGene = function (ens) {
	if (!arguments.length) {
	    return ensGene;
	}
	ensGene = ens;
	return gBrowser;
    };

    /** <strong>species</strong> gets/sets the species used in the REST queries.
	See for example {@link ePeek.get_gene}.
	If no argument is provided, returns the current species.
	Common names are allowed (human, chimp, gorilla, mouse, etc...)
	Binary scientific names are also allowed with and without underscores (for example "mus_musculus" or "mus musculus")
	Case is ignored.
	@param {String} [species] The new species
	@returns {ePeek} The original object allowing method chaining
     */
    gBrowser.species = function (sp) {
	if (!arguments.length) {
	    return species;
	}
	species = sp;
	return gBrowser;
    };

    /** <strong>chr</strong> gets/sets the chr used in the next genome coordinates-based query.
	If no argument is provided, returns the current chr or the default one if no one has been set before.
	Strictly speaking, the arguments expects a seq_region_name, i.e. "scaffolds", etc are also considered chromosomes.
	This value is used by {@link ePeek.start} to set the genomic coordinates in the plug-in view
	@param {String} [chr] The new chr
	@returns {ePeek} The original object allowing method chaining
     */
    gBrowser.chr  = function (c) {
	if (!arguments.length) {
	    return chr;
	}
	chr = c;
	return gBrowser;
    };

    /** <strong>from</strong> gets/sets the start coordinate for the next genome coordinates-based query.
	If no argument is provided, returns the current start coordinate or the default one if none has been set before.
	This value is used by {@link ePeek.start} to set the genomic coordinates in the plug-in view
	@param {Number} [coordinte] The new start coordinate. Commas or dots are not allowed (32,341,674 or 32.341.674)
	@returns {ePeek} The original object allowing method chaining
     */
    gBrowser.from = function (n) {
	// TODO: Allow commas and dots in numbers? eg: 32,341,674 or 32.341.674
	if (!arguments.length) {
	    return fromPos;
	}
	fromPos = n;
	return gBrowser;
    };

    /** <strong>to</strong> gets/sets the end coordinate for the next genome coordinates-based query.
	If no argument is provided, returns the current end coordinate or the default one if none has been set before.
	This value is used by {@link ePeek.start} to set the genomic coordinates in the plug-in view
	@param {Number} [coordinate] The new end coordinate. Commas or dots are not allowed (32,341,674 or 32.341.674)
	@returns {ePeek} The original object allowing method chaining
     */
    gBrowser.to = function (n) {
	// TODO: Allow commas and dots in numbers? eg: 32,341,674 or 32.341.674
	if (!arguments.length) {
	    return toPos;
	}
	toPos = n;
	return gBrowser;
    };

    /** <strong>gene</strong> sets the gene name for the next gene-based location.
	External gene names (BRCA2) and ensembl gene identifiers (ENSG00000139618) are both allowed.
	Gene-based locations have higher preference over coordinates-based locations.
	@example
	// Will show the correct location even if the gene name is spelled wrong
	// or is not recognized by Ensembl
	gB.species("human").chr(13).from(35009587).to(35214822).gene("LINC00457");
	@returns {ePeek} The original object allowing method chaining
    */
    gBrowser.gene = function(g) {
	if (!arguments.length) {
	    return gene;
	}
	gene = g;
	return gBrowser;
    };


    /** <strong>height</strong> gets/sets the height of the plug-in.
	If no argument is provided, returns the current height.
	The argument should be only the number of pixels (without any suffix like "px")
	@param {Number} [height] The new height (in pixels)
	@returns {ePeek} The original object allowing method chaining
     */
    gBrowser.height = function (h) {
	// TODO: Allow suffixes like "1000px"?
	// TODO: Test wrong formats
	if (!arguments.length) {
	    return height;
	}
	height = h;
	return gBrowser;
    };

    /** <strong>width</strong> gets/sets the width (in pixels) of the plug-in.
	If no argument is provided, returns the current height.
	The argument should be only the number of pixels (without any suffix like "px")
	To re-set the width lively use the {@link ePeek.resize} method.
	@param {Number} [width] The new width (in pixels)
	@returns {ePeek} The original object allowing method chaining	
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

    /** <strong>background_color</strong> gets/sets the background color for the view.
	If no argument is provided, returns the current background color.
	The argument should be a valid hexadecimal number (including the "#" prefix)
	The color is internally converted to a {@link https://github.com/mbostock/d3/wiki/Colors#wiki-d3_rgb|d3.rgb} format
	@param {String} [color] The new color in hexadecimal format (including the leading "#")
	@returns {ePeek} The original object allowing method chaining	
    */
    gBrowser.background_color = function (hex) {
	if (!arguments.length) {
	    return bgColor;
	}
	bgColor = d3.rgb(hex);
	return gBrowser;
    };

    /** <strong>foreground_color</strong> gets/sets the foreground color for the view.
	If no argument is provided, returns the current foreground color.
	The argument should be a valid hexadecimal number (including the "#" prefix)
	The color is internally converted to a {@link https://github.com/mbostock/d3/wiki/Colors#wiki-d3_rgb|d3.rgb} format
	@param {String} [color] The new color in hexadecimal format (including the leading "#")
	@returns {ePeek} The original object allowing method chaining	
    */
    gBrowser.foreground_color = function (hex) {
	if (!arguments.length) {
	    return fgColor;
	}
	fgColor = d3.rgb(hex);
	return gBrowser;
    };

    /** <strong>highlight_color</strong> gets/sets the color to be used for a highlighted gene in the view.
	If no argument is provided, returns the current color for highlighting.
	The argument should be a valid hexadecimal number (including the "#" prefix)
	The color is internally converted to a {@link https://github.com/mbostock/d3/wiki/Colors#wiki-d3_rgb|d3.rgb} format
	@param {String} [color] The new color in hexadecimal format (including the leading "#")
	@returns {ePeek} The original object allowing method chaining	
    */
    gBrowser.highlight_color = function (hex) {
	if (!arguments.length) {
	    return highlightColor;
	}
	highlightColor = d3.rgb(hex);
	return gBrowser;
    }

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

    /** <strong>gene_info_callback</strong> is a callback called when a gene is selected.
	It should be used to respond to mouse clicks on the genes or their names (labels).
	Its default behaviour is to do nothing.
        This function can be overwritten by a theme to display the gene information
	in a custom way and place for example.
	@param {Object} object A literal object containing the following fields:
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
    gBrowser.gene_info_callback = function() {};

    /** <strong>ensGenes_callback</strong> is a callback called every time a gene is searched in the 
	REST server in the {@link ePeek.get_gene} method.
	Its default behaviour is to do nothing.
	This method can be used by a theme to run some arbitrary code when a gene is found in the REST
	server.
	@param {Array} genes An array of genes found in the last gene-based search. Each gene is an object having the following fields:
	<ul>
	<li>id    => The Ensembl gene id associated with the gene</li>
	<li>type  => This should be "gene"
	</ul>
     */
    gBrowser.ensGenes_callback = function() {};

    /** <strong>orthologues_callback</strong> is a callback called every time the orthologues of a gene
	are found in the REST server in the {@link ePeek.orthologues} method.
	Its default behaviour is to do nothing.
	This method can be used by a theme to do run some arbitrary code when orthologues are found in the REST server.
	@param {Array} homologies An array of object literals representing homologies having the following fields:
	<ul>
	<li>id          => The Ensembl Gene ID of the ortholog</li>
	<li>protein_id  => The Ensembl Protein ID of the ortholog</li>
	<li>species     => The species name of the ortholog</li>
	<li>subtype     => The subtype of the homology relantionship</li>
	<li>type        => The type of orthology</li>
	</ul>
     */
    gBrowser.orthologues_callback = function() {};

    return gBrowser;
};

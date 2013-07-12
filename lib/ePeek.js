var epeek = function() {
    "use strict";
 
    // Default species and genome location
    // TODO: Encapsulate this information in an object
    var gene; // undefined
    var ensGene; // undefined
    var species = "human";
    var chr = 7;
    var fromPos = 139424940;
    var toPos = 141784100;
    var chr_length; // undefined

    // Prefixes to use the REST API.
    // These are modified in the localREST setter
    // TODO: Encapsulate this information in an object
    var prefix = "http://beta.rest.ensembl.org";
    var prefix_region = prefix + "/feature/region/";
    var prefix_ensgene = prefix + "/lookup/";
    var prefix_gene = prefix + "/xrefs/symbol/";
    var prefix_homologues = prefix + "/homology/id/";
    var prefix_chr_info = prefix + "/assembly/info/";

    // The REST response in general view
    var genes  = [];

    // Display elements options that can be overridden by setters
    // (so they are exposed in the API)
    // TODO: Encapsulate this information in an object
    var min_width = 300;
    var width     = 600;
    var height    = 150;
    var bgColor        = d3.rgb('#DDDDDD'); //#F8FBEF
    var fgColor        = d3.rgb('#000000');
    var highlightColor = d3.rgb('#000000');
    var drag_allowed   = true;
    var curr_ease = d3.ease("cubic-in-out");

    // Display elements (not directly exposed in the API)
    // TODO: Encapsulate this information in an object
    var svg_g;
    var pane;
    var xScale;
    var xAxis;
    var refresh;
    var dur = 500;

    // Closure to layout the genes in the view
    // var genes_layout = epeek_genes().height(height);

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
	gBrowser.genes_layout.height(height); //genes_layout;

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

	var tooWide_text = svg_g
	    .append("text")
	    .attr("class", "ePeek_wideOK_text")
	    .attr("id", "ePeek_" + div_id + "_tooWide")
	    .attr("fill", bgColor)
	    .text("Region too wide");
	// TODO: I don't know if this is the best way (and portable) way
	// of centering the text in the text
	var bb = tooWide_text[0][0].getBBox();
	tooWide_text
	    .attr("x", ~~(width/2 - bb.width/2))
	    .attr("y", ~~(height/2 - bb.height/2));

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
	// We get the chromosome length, this is done async, but I assume that 
	// the response will be available on time in the interactive process
	getChrLength();
        d3.json(url, function (error, resp) {
	    console.log("RESP: ");
	    console.log(resp);
	    genes = resp;
            plot();
            update_layout();
        });
    };

    var plot = function () {
        xScale = d3.scale.linear()
            .domain([fromPos, toPos])
            .range([0, width]);
        gBrowser.genes_layout(genes, xScale);

        xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("top");

        // zoom
	if (drag_allowed) {
            pane.call( d3.behavior.zoom().x(xScale).on("zoom", zoom) );
	}
    };

    var update_layout = function () {
	var newdata = gBrowser.genes_layout.genes();
	var g_genes = svg_g.selectAll(".ePeek_gs")
	    .data(newdata, function (d) {
		return d.ID
	    });

	g_genes.selectAll(".ePeek_gene")
	// The data needs to be re-joint for all the sub-elements?
	    .data(newdata, function (d) {return d.ID})
	    .transition()
	    .duration(500)
	    .attr("y", function (d) {
		return gBrowser.genes_layout.gene_slot().slot_height * d.slot;
	    })
	    .attr("height", gBrowser.genes_layout.gene_slot().gene_height)

	g_genes.selectAll(".ePeek_name")
	// The data needs to be re-joint for all the sub-elements?
	    .data(newdata, function (d) {return d.ID})
	    .transition()
	    .duration(500)
	    // .each(function() {console.log(d3.select(this).style('font-size'))})
	    .attr("y", function (d) {
		return (gBrowser.genes_layout.gene_slot().slot_height * d.slot) + 25
	    })
	    .text(function (d) {
		if (gBrowser.genes_layout.gene_slot().show_label) {
		    return d.external_name;
		} else {
		    return "";
		}
	    });
	
	g_genes
	    .enter()
	    .append("g")
	    .attr("class", "ePeek_gs")
	    .call(plot_gene)

	g_genes.exit().remove();

	g_genes.on("click", function (d) {gBrowser.gene_info_callback(d)});

	update();
    };

    var plot_gene = function (new_gene) {
	new_gene
	    .append("rect")
	    .attr("class", "ePeek_gene")
	    .attr("x", function (d) {
		return (xScale(d.start));
	    })
	    .attr("y", function (d) {
		console.log("D.SLOT:" + d.slot);
		console.log("SLOT_HEIGHT:" + gBrowser.genes_layout.gene_slot().slot_height);
		return gBrowser.genes_layout.gene_slot().slot_height * d.slot;
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    })
	    .attr("height", gBrowser.genes_layout.gene_slot().gene_height)  // This has to be dynamic now
	    .attr("fill", bgColor)
	    .transition().duration(dur).attr("fill", function (d) {
		if ((ensGene !== undefined) && (ensGene === d.ID) ) {
		    return highlightColor
		} else {
		    return fgColor;
		}
	    });

	new_gene
	    .append("text")
	    .attr("class", "ePeek_name")
	    .attr("x", function (d) {
		return (xScale(d.start));
	    })
	    .attr("y", function (d) {
		return (gBrowser.genes_layout.gene_slot().slot_height * d.slot) + 25 // TODO: This 25 is artificial. It is supposed to give enough room for the label
		                                                // i.e. the font vertical size is less than 25.
		                                                // Maybe it would be better to have a fixed font-size at least?
	    })
	    .attr("fill", bgColor)
	    .text(function (d) {
		if (gBrowser.genes_layout.gene_slot().show_label) {
		    return d.external_name
		} else {
		    return ""
		}
	    })
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

    };

    var update = function () {
	svg_g.call(xAxis);

	var g_genes = svg_g.selectAll(".ePeek_gs");

	g_genes.select(".ePeek_gene")
	    .attr("x", function (d) {
		return (xScale(d.start))
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start))
	    });
	

	g_genes.select(".ePeek_name")
	    .attr("x", function (d) {
		return (xScale(d.start));
	    });

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

    /** <strong>zoom</strong> zooms in or out
     */
    gBrowser.zoom = function (factor) {
	move(factor, 0);
    };


    var move = function (factor, direction) {
	var oldDomain = xScale.domain();

	var span = oldDomain[1] - oldDomain[0];
	var offset = (span * factor) - span;

	var newDomain;
	switch (direction) {
	case -1 :
	    newDomain = [(~~oldDomain[0] - offset), ~~(oldDomain[1] - offset)];
	    break;
	case 1 :
	    newDomain = [(~~oldDomain[0] + offset), ~~(oldDomain[1] - offset)];
	    break;
	case 0 :
	    newDomain = [oldDomain[0] - ~~(offset/2), oldDomain[1] + (~~offset/2)];
	}

	var interpolator = d3.interpolateNumber(oldDomain[0], newDomain[0]);
	var ease = gBrowser.ease();

	var x = 0;
	d3.timer(function(d) {
	    var curr_start = interpolator(ease(x));
	    var curr_end;
	    switch (direction) {
	    case -1 :
		curr_end = curr_start + span;
		break;
	    case 1 :
		curr_end = curr_start + span;
		break;
	    case 0 :
		curr_end = oldDomain[1] + oldDomain[0] - curr_start;
		break;
	    }

	    var currDomain = [curr_start, curr_end];
	    xScale.domain(currDomain);
	    zoom();
	    x+=0.02;
	    return x>1;
	});
    };

    gBrowser.right = function (factor) {
	// It doesn't make sense factors < 1 for left/right moves
	if (factor > 0) {
	    move(factor, 1);
	}
    };

    gBrowser.left = function (factor) {
	// It doesn't make sense factors < 1 for left/right moves
	if (factor > 0) {
	    move(factor, -1);
	}
    };

    var zoom = function () {
	// This fixes before-the-beginning panning
	var currDomain = xScale.domain();
	if (currDomain[0] < 0) {
	    var bestEnd = currDomain[1] < 1000 ? 1000 : ~~currDomain[1];
	    xScale.domain([0,bestEnd]);
	}

	// This fixes pass-the-ending panning
	if (currDomain[1] > chr_length) {
	    var bestStart = currDomain[0] > (chr_length - 1000) ? (chr_length - 1000) : ~~currDomain[0] < 0 ? 0 : ~~currDomain[0];
	    xScale.domain([bestStart,chr_length]);
	}

        window.clearTimeout(refresh);
        refresh = window.setTimeout(function(){
	    var currDomain = xScale.domain();
	    gBrowser.from(~~currDomain[0]);
	    gBrowser.to(~~currDomain[1]);
            console.log("New Pos:" + fromPos + "-" + toPos);
            var url = get_url();
            console.log(url);
            d3.json(url, function (error, resp) {
		if (error !== null) {
		    d3.select("#ePeek_" + div_id + "_pane")
			.classed("ePeek_dark_pane", true);
		    d3.select("#ePeek_" + div_id + "_tooWide")
		    	.classed("ePeek_tooWide_text", true)
			.moveToFront();
		} else {
		    d3.select("#ePeek_" + div_id + "_pane")
			.classed("ePeek_dark_pane", false);
		    d3.select("#ePeek_" + div_id + "_tooWide")
		    	.classed("ePeek_tooWide_text", false)

                    gBrowser.genes_layout(resp, xScale);
		    update_layout();
		}
            });
	}, 300); //
	
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
    /** <strong>homologues</strong> looks for homologues of the given gene.
	Once the homologues are retrieved, the {@link ePeek.homologues_callback} callback is invoked passing the array of homologues as its argument.
	@param {string} ensGene The id of the gene to look for homologues
     */
    gBrowser.homologues = function(ensGene) {
	var url = prefix_homologues + ensGene + ".json?format=condensed;sequence=none;type=all";
	console.log(url);

	d3.json(url, function (error, resp) {
	    console.log("HOMOLOGUES RESP: ");
	    console.log(resp);
	    if (resp !== undefined) { // / Needed because if there are not homologues we get an error -- We are trying to change this in the REST API
		gBrowser.homologues_callback(resp.data[0].homologies);
	    }
	});
    }

    /** <strong>ensGene_lookup</strong> retrieves the coordinates of a Ensembl gene from
	the remote server. The plug-in is then initialized via the {@link ePeek.start} method.
	@param {string} gene_name The id of the Ensembl gene to look for
     */
    gBrowser.ensGene_lookup = function (gene_name) {
	gBrowser.homologues(gene_name);
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

    var getChrLength = function () {
	var url = prefix_chr_info + species + "/" + chr;
	d3.json(url, function(error, resp) {
	    chr_length = resp.length;
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
	@param {String} [name] The name of the gene
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
	// TODO: Make highlight_color optional, defaulting to either the foreground color or a .darker() version of it
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
	prefix_homologues = prefix + "/homology/id/";

	return gBrowser;
    };


    gBrowser.ease = function(e) {
	if (!arguments.length) {
	    return curr_ease;
	}
	curr_ease = d3.ease(e);
	return gBrowser;
    };

    gBrowser.allow_drag = function(b) {
	if (!arguments.length) {
	    return drag_allowed;
	}
	drag_allowed = b;
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

    /** <strong>split_homologues</strong> split an array of homologues into an object containing an array of orthologues (under the 'orthologues' field)
	and an array of paralogues (under the 'paralogues' field)
	@param {Array} [homologues] The array containing homologues objects
	@returns {Object} An object containing an array of orthologues and an array of paralogues
    */
    gBrowser.split_homologues = function (homologues) {
	var orthoPatt = /ortholog/;
	var paraPatt = /paralog/;

	var orthologues = homologues.filter(function(d){return d.type.match(orthoPatt)});
	var paralogues  = homologues.filter(function(d){return d.type.match(paraPatt)});

	return {'orthologues' : orthologues,
		'paralogues'  : paralogues};
    };

    // Default callbacks

    /** <strong>genes_layout</strong> specifies how to layout the genes.
	The default layout avoid clashing between genes, hiding the labels when there are too many elements to display, etc...
	The layout closure has to have several methods in its API.
	@param {Callback} [callback] The callback to call to get/set the gene layout
    */
    gBrowser.genes_layout = epeek_genes(); //genes_layout;

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

    /** <strong>homologues_callback</strong> is a callback called every time the homologues (orthologues + paralogues) of a gene
	are found in the REST server in the {@link ePeek.homologues} method.
	Its default behaviour is to do nothing.
	This method can be used by a theme to do run some arbitrary code when homologues are found for this gene.
	@param {Array} homologies An array of object literals representing homologies having the following fields:
	<ul>
	<li>id          => The Ensembl Gene ID of the homolog</li>
	<li>protein_id  => The Ensembl Protein ID of the homolog</li>
	<li>species     => The species name of the homolog</li>
	<li>subtype     => The subtype of the homology relantionship</li>
	<li>type        => The type of homology</li>
	</ul>
     */
    gBrowser.homologues_callback = function() {};

    return gBrowser;
};


// The collision detector
var epeek_genes = function() {
    "use strict";

    var height = 150; // Default value

    var genes     = [];

    var xScale;
    var max_slots;

    var slot_types = {
	'expanded'   : {
	    slot_height : 30,
	    gene_height : 10,
	    show_label  : true
	},
	'collapsed' : {
	    slot_height : 5,
	    gene_height : 3,
	    show_label  : false
	}
    };
    var current_slot_type = 'expanded';


    var genes_layout = function (new_genes, scale) {
	// We make sure that the genes have name
	for (var i = 0; i < new_genes.length; i++) {
	    if (new_genes[i].external_name === null) {
		new_genes[i].external_name = "";
	    }
	}

	max_slots = ~~(height / slot_types.expanded.slot_height) - 1;

	if (scale !== undefined) {
	    genes_layout.scale(scale);
	}

	slot_keeper(new_genes, genes);
	var needed_slots = collition_detector(new_genes);
	if (needed_slots > max_slots) {
	    current_slot_type = 'collapsed';
	    shrink_slots(height, needed_slots);
	} else {
	    current_slot_type = 'expanded';
	}

	genes = new_genes;
    };

    genes_layout.genes = function () {
	return genes;
    }

    genes_layout.gene_slot = function () {
	return slot_types[current_slot_type];
    };

    genes_layout.height = function (h) {
	if (!arguments.length) {
	    return height;
	}
	height = h;
	return genes_layout;
    };


    genes_layout.scale = function (x) {
	if (!arguments.length) {
	    return xScale;
	}
	xScale = x;
	return genes_layout;
    };


    var collition_detector = function (genes) {
	var genes_placed = [];
	var genes_to_place = genes; // was []
	var needed_slots = 0;
	for (var i = 0; i < genes.length; i++) {
            if (genes[i].slot > needed_slots && genes[i].slot < max_slots) {
		needed_slots = genes[i].slot
            }
	}

	for (var i = 0; i < genes_to_place.length; i++) {
            var genes_by_slot = sort_genes_by_slot(genes_placed);
	    var this_gene = genes_to_place[i];
	    if (this_gene.slot !== undefined && this_gene.slot < max_slots) {
		if (slot_has_space(this_gene, genes_by_slot[this_gene.slot])) {
		    genes_placed.push(this_gene);
		    continue;
		}
	    }
            var slot = 0;
            OUTER: while (true) {  //
		if (slot_has_space(this_gene, genes_by_slot[slot])) {
		    this_gene.slot = slot;
		    genes_placed.push(this_gene);
		    if (slot > needed_slots) {
			needed_slots = slot;
		    }
		    break;
		}
		slot++;
	    }
	}
	return needed_slots + 1;
    };


    var slot_has_space = function (query_gene, genes_in_this_slot) {
	if (genes_in_this_slot === undefined) {
	    return true;
	}
	for (var j = 0; j < genes_in_this_slot.length; j++) {
            var subj_gene = genes_in_this_slot[j];
	    if (query_gene.ID === subj_gene.ID) {
		continue;
	    }
            var y_label_end = subj_gene.external_name.length * 8 + xScale(subj_gene.start); // TODO: It may be better to have a fixed font size (instead of the hardcoded 16)?
            var y1  = xScale(subj_gene.start);
            var y2  = xScale(subj_gene.end) > y_label_end ? xScale(subj_gene.end) : y_label_end;
	    var x_label_end = query_gene.external_name.length * 8 + xScale(query_gene.start);
            var x1 = xScale(query_gene.start);
            var x2 = xScale(query_gene.end) > x_label_end ? xScale(query_gene.end) : x_label_end;
            if ( ((x1 < y1) && (x2 > y1)) ||
		 ((x1 > y1) && (x1 < y2)) ) {
		return false;
            }
	}
	return true;
    };

    var slot_keeper = function (genes, prev_genes) {
	var prev_genes_slots = genes2slots(prev_genes);

	for (var i = 0; i < genes.length; i++) {
            if (prev_genes_slots[genes[i].ID] !== undefined) {
		genes[i].slot = prev_genes_slots[genes[i].ID];
            }
	}
    };

    var genes2slots = function (genes_array) {
	var hash = {};
	for (var i = 0; i < genes_array.length; i++) {
            var gene = genes_array[i];
            hash[gene.ID] = gene.slot;
	}
	return hash;
    }

    var shrink_slots = function (height, needed_slots) {
	// slot_types.collapsed.slot_height = ~~(height/needed_slots);
	return;
    };

    var sort_genes_by_slot = function (genes) {
	var slots = [];
	for (var i = 0; i < genes.length; i++) {
            if (slots[genes[i].slot] === undefined) {
		slots[genes[i].slot] = [];
            }
            slots[genes[i].slot].push(genes[i]);
	}
	return slots;
    };

    return genes_layout;
   
}

d3.selection.prototype.moveToFront = function() { 
  return this.each(function() { 
    this.parentNode.appendChild(this); 
  }); 
};

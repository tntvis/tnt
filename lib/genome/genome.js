"use strict"

epeek.genome = function() {

    var ens_re = /^ENS\w+\d+$/;

    // Default species and genome location
    // TODO: Encapsulate this information in an object. The object should have at least instances
    // for the current position and the origin
    var gene; // undefined
    var loc = {
	species  : "human",
	chr      : 7,
	from     : 139424940,
	to       : 141784100
    };

    var chr_length; // undefined

    var eRest = epeek.eRest();
    var path = epeek.scriptPath("ePeek.js");
    // The REST response in general view
    var genes  = [];

    // Display elements options that can be overridden by setters
    // (so they are exposed in the API)
    // TODO: Encapsulate this information in an object?
    var min_width = 300;
    var width     = 600;
    var height    = 150;
    var bgColor        = d3.rgb('#DDDDDD'); //#F8FBEF
    var fgColor        = d3.rgb('#000000');
    var drag_allowed   = true;
    var curr_ease = d3.ease("cubic-in-out");

    // Display elements (not directly exposed in the API)
    // TODO: Encapsulate this information in an object
    var svg_g;
    var pane;
    var xScale;
    var zoomEventHandler = d3.behavior.zoom();
    var limits = {
	left : 0,
	right : undefined,
	zoomOut : eRest.limits.region,
	zoomIn  : 200
    };
    var cap_width = 3;
    var xAxis;
    var refresh;
    var dur = 500;

    // Closure to layout the genes in the view
    // var genes_layout = epeek_genes().height(height);
    var genes_layout = epeek.genome.layout(); //genes_layout;

    // The id of the div element the plug-in connects to
    // undefined by default
    var div_id;

    /** The returned closure
	@namespace
	@alias ePeek
	@example
	// Typically, the plug-in is used as follows:
	var gB = epeek().width(920); // other methods can be included here
	var gBTheme = epeek_theme(); // other methods can be included here
	gBTheme(gB, document.getElementById('DOM_element_id');
    */
    var gBrowser = function(div) {

	div_id = d3.select(div).attr("id");

	var browserDiv = d3.select(div)
	    .append("div")
	    .attr("id", "ePeek_" + div_id)
	    .style("position", "relative")
	    .style("border", "2px solid")
	    .style("border-radius", "20px")
	    .style("-webkit-border-radius", "20px")
	    .style("-moz-border-radius", "20px");


	genes_layout.height(height); //genes_layout;

	// The original div is classed with the ePeek class
	d3.select(div)
	    .classed("ePeek", true);

	// The Browser div
	//var browserDiv = d3.select(div);

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

	// caps
	svg_g
	    .append("rect")
	    .attr("id", "ePeek_" + div_id + "5pcap")
	    .attr("x", 0)
	    .attr("y", 0)
	    .attr("width", 0)
	    .attr("height", height)
	    .attr("fill", "red");
	svg_g
	    .append("rect")
	    .attr("id", "ePeek_" + div_id + "3pcap")
	    .attr("x", width-cap_width)
	    .attr("y", 0)
	    .attr("width", 0)
	    .attr("height", height)
	    .attr("fill", "red");

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
	    .text(loc.species);
	locRow
	    .append("span")
	    .text(" (");
	locRow
	    .append("span")
	    .attr("id", "ePeek_" + div_id + "_chr")
	    .text(loc.chr);
	locRow
	    .append("span")
	    .text(":");
	locRow
	    .append("span")
	    .attr("id", "ePeek_" + div_id + "_from")
	    .text(loc.from);
	locRow
	    .append("span")
	    .text("-");
	locRow
	    .append("span")
	    .attr("id", "ePeek_" + div_id + "_to")
	    .text(loc.to);
	locRow
	    .append("span")
	    .text(")");
	locRow
	    .append("img")
	    .attr("class", "ePeek_activity_signal")
	    .attr("id", "ePeek_" + div_id + "_activity_signal")
	    .attr("src", path + "lib/green_button_small.png")
 	    .style("position", "absolute")
	    .style("left", (width-20) + "px");
    };

    /** <strong>startOnOrigin</strong> decides if the plug-in needs to be started based on a 
	gene or genome location. If centered in a gene, it tries to fetch the genomic
	coordinates associated with the given gene.
    */
//     gBrowser.startOnOrigin = function () {
// 	loc.species = gBrowser.origin.species;
// 	loc.chr     = gBrowser.origin.chr;
// 	loc.from    = gBrowser.origin.from;
// 	loc.to      = gBrowser.origin.to;

// 	gBrowser.start();
//     };

    var new_genes = function(genes_arr) {
	genes = genes_arr;
	gBrowser.genes_callback(genes);
	return;
    };

    /** <strong>start</strong> plots the genome browser and starts listening for mouse events on it.
	It always uses genomic coordinates, so if the coordinates associated with a given gene
	needs to be taken into account, {@link ePeek.startOnOrigin} has to be used instead.
    */
    gBrowser.start = function (where) {
	// TODO:  Not sure if we should fall back to a default
	start_activity();
	if (where !== undefined) {
	    if (where.gene !== undefined) {
		get_gene(where);
		return;
	    } else {
		if (where.species === undefined) {
		    where.species = loc.species;
		}
		if (where.chr === undefined) {
		    where.chr = loc.chr;
		}
		if (where.from === undefined) {
		    where.from = loc.from;
		}
		if (where.to === undefined) {
		    where.to = loc.to;
		}
	    }
	} else { // where is undef so look for gene or loc
	    if (gBrowser.gene() !== undefined) {
		get_gene({ species : gBrowser.species(),
			   gene    : gBrowser.gene()
			 });
		return;
	    } else {
		where.species = loc.species,
		where.chr     = loc.chr,
		where.from    = loc.from,
		where.to      = loc.to
	    }
	}
	console.log("WHERE:");
	console.log(where);

	// Get the chromosome length
	eRest.call({url : eRest.url.chr_info ({species : where.species,
					       chr     : where.chr
					      }),
		    success : function (resp) {
			stop_activity();
			chr_length = resp.length;
			limits.right = chr_length;
			zoomEventHandler.xExtent([0, limits.right]);

			// We respect limits.zoomIn and limits.right
			// TODO: We assume that we don't have any scaffold or contig
			// with length < limits.zoomIn
			if ((where.to - where.from) < limits.zoomIn) {
			    if ((where.from + limits.zoomIn) > limits.right) {
				where.from = limits.right - limits.zoomIn;
				where.to = limits.right;
			    } else {
				where.to = where.from + limits.zoomIn;
			    }
			}

			eRest.call({url : eRest.url.region({species : where.species,
							    chr     : where.chr,
							    from    : where.from,
							    to      : where.to
							   }),
				    success : function (resp) {
					stop_activity();
					new_genes(resp);
					plot();
					update_layout();
				    }
				   }
				  );
		    }
		   }
		  );
    };

    var plot = function () {
	xScale = d3.scale.linear()
            .domain([loc.from, loc.to])
            .range([0, width]);

	genes_layout(genes, xScale);

	xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("top");

	// zoom
	if (drag_allowed) {
            pane.call( zoomEventHandler
		       .x(xScale)
		       .scaleExtent([(loc.to-loc.from)/(limits.zoomOut-1), (loc.to-loc.from)/limits.zoomIn])
		       .on("zoom", zoom) 
		     );
	}
    };

    var update_layout = function () {
	var newdata = genes_layout.genes();
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
		return genes_layout.gene_slot().slot_height * d.slot;
	    })
	    .attr("height", genes_layout.gene_slot().gene_height)

	g_genes.selectAll(".ePeek_name")
	// The data needs to be re-joint for all the sub-elements?
	    .data(newdata, function (d) {return d.ID})
	    .transition()
	    .duration(500)
	    .attr("y", function (d) {
		return (genes_layout.gene_slot().slot_height * d.slot) + 25
	    })
	    .text(function (d) {
		if (genes_layout.gene_slot().show_label) {
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

	g_genes.on("click", gBrowser.gene_info_callback);

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
		return genes_layout.gene_slot().slot_height * d.slot;
	    })
	    .attr("width", function (d) {
		return (xScale(d.end) - xScale(d.start));
	    })
	    .attr("height", genes_layout.gene_slot().gene_height)  // This has to be dynamic now
	    .attr("fill", bgColor)
	    .transition().duration(dur).attr("fill", function (d) {
		if (d.color === undefined) {
		    return fgColor;
		} else {
		    return d.color;
		}
	    });

	new_gene
	    .append("text")
	    .attr("class", "ePeek_name")
	    .attr("x", function (d) {
		return (xScale(d.start));
	    })
	    .attr("y", function (d) {
		return (genes_layout.gene_slot().slot_height * d.slot) + 25 // TODO: This 25 is artificial. It is supposed to give enough room for the label
		// i.e. the font vertical size is less than 25.
		// Maybe it would be better to have a fixed font-size at least?
	    })
	    .attr("fill", bgColor)
	    .text(function (d) {
		if (genes_layout.gene_slot().show_label) {
		    return d.external_name
		} else {
		    return ""
		}
	    })
	    .style ("font-weight", function () {
		return "normal";
	    })
	    .transition().duration(dur).attr("fill", function () {
		return fgColor;
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
	    .text(loc.species); // Only if cross-species is allowed! This can only change if Jumped from searchBox or ortholog selection
	d3.select("#ePeek_" + div_id + "_chr")
	    .text(loc.chr);
	d3.select("#ePeek_" + div_id + "_from")
	    .text(~~xScale_domain[0]);
	d3.select("#ePeek_" + div_id + "_to")
	    .text(~~xScale_domain[1]);
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
	d3.timer(function() {
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
	    zoom(xScale);
	    x+=0.02;
	    return x>1;
	});
    };

    /** <strong>right</strong> pans the genome browser to the right. This method is exposed to allow external buttons, etc to interact with the genome browser.
	@param {Number} factor The amount of panning (i.e. 1.2 means 20% panning)
    */
    gBrowser.right = function (factor) {
	// It doesn't make sense factors < 1 for left/right moves
	if (factor > 0) {
	    move(factor, 1);
	}
    };

    /** <strong>left</strong> pans the genome browser to the left. This method is exposed to allow external buttons, etc to interact with the genome browser.
	@param {Number} factor The amount of panning (i.e. 1.2 means 20% panning)
    */
    gBrowser.left = function (factor) {
	// It doesn't make sense factors < 1 for left/right moves
	if (factor > 0) {
	    move(factor, -1);
	}
    };

    /** <strong>zoom</strong> zooms in/out the genome browser. This method is exposed to allow external buttons, etc to interact with the genome browser.
	@param {Number} factor The amount of zooming (i.e. 1.2 means zooming in 20% and 0.8 means zooming out 20%)
    */
    gBrowser.zoom = function (factor) {
	move(factor, 0);
    };


    // We still have to make sure that button-based panning/zooming works in this version (also at the edges)
    var zoom = function (new_xScale) {
	if (new_xScale !== undefined && drag_allowed) {
	    zoomEventHandler.x(new_xScale);
	}

	var domain = xScale.domain();
	if (domain[0] <= 5) {
	    d3.select("#ePeek_" + div_id + "5pcap")
		.attr("width", cap_width)
		.transition()
		.duration(200)
		.attr("width", 0);
	}

	if (domain[1] >= chr_length-5) {
	    d3.select("#ePeek_" + div_id + "3pcap")
		.attr("width", cap_width)
		.transition()
		.duration(200)
		.attr("width", 0);
	}

	window.clearTimeout(refresh);
	refresh = window.setTimeout(function(){
	    var currDomain = xScale.domain();
	    gBrowser.from(~~currDomain[0]);
	    gBrowser.to(~~currDomain[1]);

	    start_activity();
	    eRest.call({url : eRest.url.region({species : loc.species,
						chr     : loc.chr,
						from    : loc.from,
						to      : loc.to
					       }),
			success : function(resp) {
			    stop_activity();
			    d3.select("#ePeek_" + div_id + "_pane")
				.classed("ePeek_dark_pane", false);
			    d3.select("#ePeek_" + div_id + "_tooWide")
		    		.classed("ePeek_tooWide_text", false)
			    new_genes(resp);
			    genes_layout(resp, xScale);
			    update_layout();
			},

			error : function() {
			    stop_activity();
			    d3.select("#ePeek_" + div_id + "_pane")
				.classed("ePeek_dark_pane", true);
			    d3.select("#ePeek_" + div_id + "_tooWide")
		    		.classed("ePeek_tooWide_text", true)
				.moveToFront();
			}
		       }
		      );
	}, 300); //
	
	update();
    };


    // public methods (API)


    /** <strong>resize</strong> takes a new width (in pixels) for the genome view and resizes it accordingly. It can be used to resize the view lively. For example it is used by the mobile theme to respond to orientation changes in the device
	@param {Number} width New width (in pixels)
    */
    // TODO: Remove this method and make gBrowser.width live?
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

    var isEnsemblGene = function(term) {
	if (term.match(ens_re)) {
            return true;
        } else {
            return false;
        }
    };

    var get_gene = function (where) {
	start_activity();
	if (isEnsemblGene(where.gene)) {
	    get_ensGene(where.gene)
	} else {
	    eRest.call({url : eRest.url.species_gene ({ species   : where.species,
							gene_name : where.gene 
						      }
						     ),
			success : function(resp) {
			    stop_activity();
			    resp = resp.filter(function(d) {
				return !d.id.indexOf("ENS");
			    });
			    if (resp[0] !== undefined) {
				gBrowser.gene_search_callback(resp);
				get_ensGene(resp[0].id)
			    } else {
				gBrowser.start();
			    }
			}
		       }
		      );
	}
    };

    ///*********************////
    /// DATA RETRIEVERS     ////
    ///*********************////
    /** <strong>homologues</strong> looks for homologues of the given gene.
	Once the homologues are retrieved, the optional callback given as the second argument is invoked passing the array of homologues as its argument. These homologues have the following information:
	<ul>
	<li>id          => The Ensembl Gene ID of the homolog</li>
	<li>protein_id  => The Ensembl Protein ID of the homolog</li>
	<li>species     => The species name of the homolog</li>
	<li>subtype     => The subtype of the homology relantionship</li>
	<li>type        => The type of homology</li>
	</ul>
	@param {string} ensGene The id of the gene to look for homologues
	@param {Callback} [callback] The callback to be called on the array of homologues
    */
    gBrowser.homologues = function (ensGene, callback)  {
	start_activity();
	eRest.call({url : eRest.url.homologues ({gene_id : ensGene}),
		    success : function(resp) {
			stop_activity();
			var homologues = resp.data[0].homologies;
			if (callback !== undefined) {
			    var homologues_obj = split_homologues(homologues)
			    console.log("PASSING HOMOLOGUES TO CBAK:");
			    console.log(homologues_obj);
			    callback(homologues_obj);
			}
		    }
		   });
    }

    var get_ensGene = function (gene_id) {
	start_activity();
	eRest.call({url     : eRest.url.gene ({gene_id : gene_id}),
		    success : function(resp) {
			stop_activity();

			gBrowser.ensgene_search_callback(resp);

			gBrowser
			    .species(resp.species)
			    .chr(resp.seq_region_name)
			    .from(resp.start)
			    .to(resp.end);

			gBrowser.start( { species : resp.species,
					  chr     : resp.seq_region_name,
					  from    : resp.start,
					  to      : resp.end
					} );
		    }
		   });
    };


    ///***********************////
    /// Setters & Getters     ////
    ///***********************////

    /** <strong>species</strong> gets/sets the species used in the REST queries.
	If no argument is provided, returns the current species.
	Common names are allowed (human, chimp, gorilla, mouse, etc...)
	Binary scientific names are also allowed with and without underscores (for example "mus_musculus" or "mus musculus")
	Case is ignored.
	@param {String} [species] The new species
	@returns {ePeek} The original object allowing method chaining
    */
    gBrowser.species = function (sp) {
	if (!arguments.length) {
	    return loc.species;
	}
	loc.species = sp;
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
	    return loc.chr;
	}
	loc.chr = c;
	return gBrowser;
    };

    /** <strong>from</strong> gets/sets the start coordinate to start the genome browser with
	If no argument is provided, returns the current start coordinate or the default one if none has been set before.
	This value is used by {@link ePeek.start} to set the genomic coordinates in the plug-in view
	@param {Number} [coordinte] The new start coordinate. Commas or dots are not allowed (32,341,674 or 32.341.674)
	@returns {ePeek} The original object allowing method chaining
    */
    gBrowser.from = function (pos) {
	// TODO: Allow commas and dots in numbers? eg: 32,341,674 or 32.341.674
	if (!arguments.length) {
	    return loc.from;
	}
	loc.from = pos;
	return gBrowser;
    };

    /** <strong>to</strong> gets/sets the end coordinate to start the genome browser with
	If no argument is provided, returns the current end coordinate or the default one if none has been set before.
	This value is used by {@link ePeek.start} to set the genomic coordinates in the plug-in view
	@param {Number} [coordinate] The new end coordinate. Commas or dots are not allowed (32,341,674 or 32.341.674)
	@returns {ePeek} The original object allowing method chaining
    */
    gBrowser.to = function (pos) {
	// TODO: Allow commas and dots in numbers? eg: 32,341,674 or 32.341.674
	if (!arguments.length) {
	    return loc.to;
	}
	loc.to = pos;
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

    gBrowser.genes = function() {
	return genes;
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
	if (drag_allowed) {
	    // When this method is called on the object before starting the simulation, we don't have defined xScale
	    if (xScale !== undefined) {
		pane.call( zoomEventHandler.x(xScale)
			   .xExtent([0, limits.right])
			   .scaleExtent([(loc.to-loc.from)/(limits.zoomOut-1), (loc.to-loc.from)/limits.zoomIn])
			   .on("zoom", zoom) );
	    }
	} else {
	    // We create a new dummy scale in x to avoid dragging the previous one
	    // There may be a cheaper way of doing this?
	    zoomEventHandler.x(d3.scale.linear()).on("zoom", null);
	}
	return gBrowser;
    };

    ///*********************////
    /// UTILITY METHODS     ////
    ///*********************////

    /** <strong>split_homologues</strong> split an array of homologues into an object containing an array of orthologues (under the 'orthologues' field)
	and an array of paralogues (under the 'paralogues' field)
	@param {Array} [homologues] The array containing homologues objects
	@returns {Object} An object containing an array of orthologues and an array of paralogues
    */
    var split_homologues = function (homologues) {
	var orthoPatt = /ortholog/;
	var paraPatt = /paralog/;

	var orthologues = homologues.filter(function(d){return d.type.match(orthoPatt)});
	var paralogues  = homologues.filter(function(d){return d.type.match(paraPatt)});

	return {'orthologues' : orthologues,
		'paralogues'  : paralogues};
    };


    // Default callbacks

    /** <strong>gene_info_callback</strong> is a callback called when a gene is selected.
	It should be used to respond to mouse clicks on the genes or their names (labels).
	Its default behaviour is to do nothing.
	This function can be overwritten by a theme to display the gene information
	in, for example, a custom way and/or place.
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

    /** <strong>gene_search_callback</strong> is a callback called every time a gene is searched in the
	REST server.
	Its default behaviour is to do nothing.
	This method can be used by a theme to run some arbitrary code when a gene is found in the REST
	server.
	@param {Array} genes An array of genes found in the last gene-based search. Each gene is an object having the following fields:
	<ul>
	<li>id    => The Ensembl gene id associated with the gene</li>
	<li>type  => This should be "gene"
	</ul>
    */
    gBrowser.gene_search_callback = function() {};

    gBrowser.ensgene_search_callback = function() {};

    /** <strong>genes_callback</strong> is a callback executed after the REST server is called as a result of a drag/pan event.
	This callback can be used by themes to run code on the data returned by the REST server.
	@param {Array} genes An array of genes returned by the REST server. Each gene is represented by an object having the same fields described in the {@link ePeek.gene_info_callback} method.
    */
    gBrowser.genes_callback = function() {};

    var stop_activity = function() {
	if (!eRest.connections()) {
	    d3.select("#ePeek_" + div_id + "_activity_signal").attr("src", path + "lib/green_button_small.png");
	}
    };

    var start_activity = function() {
	d3.select("#ePeek_" + div_id + "_activity_signal").attr("src", path + "lib/red_button_small.png");
    };

    return gBrowser;
};

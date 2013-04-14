d3.jsonp = function (url, callback) {
    function rand() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        c = '',
        i = -1;
        while (++i < 15) c += chars.charAt(Math.floor(Math.random() * 52));
        return c;
    }

    function create(url) {
        var e = url.match(/callback=d3.jsonp.(\w+)/),
        c = e ? e[1] : rand();
        d3.jsonp[c] = function (data) {
            callback(data);
            delete d3.jsonp[c];
            script.remove();
        };
        return 'd3.jsonp.' + c;
    }

    var cb = create(url),
    script = d3.select('head')
        .append('script')
        .attr('type', 'text/javascript')
        .attr('src', url.replace(/(\{|%7B)callback(\{|%7D)/, cb));
};

var genomeBrowser = function () {
    // Default species and genome location
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
    var prefix_orthologs = prefix + "/homology/id/";

    var gene; // undefined
    var genes = [];
    var loc_re = /^(\w+):(\w+):(\d+)-(\d+)$/;
    var ens_re = /^ENS\w+\d+$/;

    // Display elements options
    var width = 600;
    var height = 150;

    var show_options = true;
    var show_title   = true;
    var show_links   = true;

    var bgColor = '#DDDDDD'; //#F8FBEF

    var svg_g;
    var pane;
    var xScale;
    var xAxis;
    var refresh;
    var top = 60;
    var dur = 500;
    var durFill = 300;

    var orth_div_id = "ePeek_ortho_option";
    var ensGenes_div_id = "ePeek_ensGene_option";

// Returned closure
    var gBrowser = function (div) {
	//
	d3.select(div)
	    .attr("class", "ePeek");

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
	    .text("Ensembl Gene")
	    .on("click", function(){gBrowser.toggle(d3.select("#ePeek_ensGene_option"))});

	var orthologsLabel = opts_pane
	    .append("span")
	    .attr("class", "ePeek_option_label")
	    .text("Ortholog")
	    .on("click", function(){gBrowser.toggle(d3.select("#ePeek_ortho_option"))});

	var searchLabel = opts_pane
	    .append("span")
	    .attr("class", "ePeek_option_label")
	    .text("New gene")
	    .on("click", function(){gBrowser.toggle(d3.select("#ePeek_search_option"))});

	var ensGeneBox = opts_pane
	    .append("div")
	    .attr("class", "ePeek_option")
	    .attr("id", "ePeek_ensGene_option");

	var orthoBox = opts_pane
	    .append("div")
	    .attr("class", "ePeek_option")
	    .attr("id", "ePeek_ortho_option");

	var searchBox = opts_pane
	    .append("div")
	    .attr("class", "ePeek_option")
	    .attr("id", "ePeek_search_option");

	// The Browser div
	var browserDiv = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_toplevel");

	var browser_title = browserDiv
	    .append("div")
	    .attr("class", "ePeek_toolbar")
	    .append("h1")
	    .text("e!Peek")
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
	    .append("g")
            .attr("transform", "translate(0,20)")
            .append("g")
	    .attr("class", "ePeek_g");

	// The GeneInfo Panel
	groupDiv
	    .append("div")
	    .attr("id", "ePeek_gene_info") // Both needed?
	    .attr("class", "ePeek_gene_info")
	    .style("top", function() {return top + "px"});

	// The Zooming/Panning Pane
	pane = svg_g
	    .append("rect")
	    .attr("class", "ePeek_pane")
	    .attr("width", width)
	    .attr("height", height);


	// The SearchBox
	var p = searchBox
	    .append("p")
	    .attr("class", "ePeek_search_p")
	    .text("Gene name or location")
	p
	    .append("input")
	    .attr("id", "ePeek_gene_name_input")
	    .attr("type", "text")
	    .attr("name", "gene");
	p
	    .append("input")
	    .attr("type", "button")
	    .attr("value", "Jump!")
	    .on("click", gBrowser.goSearch);
	p
	    .append("text")
	    .text("examples: ENSG00000139618, SNORD73 or human:5:1533225-1555555");


	// The locRow
	locRow
	    .append("span")
	    .text("Current location: ");
	locRow
	    .append("span")
	    .attr("id", "ePeek_species")
	    .text(species);
	locRow
	    .append("span")
	    .text(" (");
	locRow
	    .append("span")
	    .attr("id", "ePeek_chr")
	    .text(chr);
	locRow
	    .append("span")
	    .text(":");
	locRow
	    .append("span")
	    .attr("id", "ePeek_from")
	    .text(fromPos);
	locRow
	    .append("span")
	    .text("-");
	locRow
	    .append("span")
	    .attr("id", "ePeek_to")
	    .text(toPos);
	locRow
	    .append("span")
	    .text(")");

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
	    .on("click", function() {var link = gBrowser.buildLink("desktop"); window.open(link, "_blank")});

	// ensembl
	var ensemblLoc = links_pane
	    .append("span")
	    .attr("class", "ePeek_link_label")
	    .text("Open region in Ensembl")
	    .on("click", function() {var link = gBrowser.buildEnsemblLink(); window.open(link, "_blank")});

	// QRtag div
	var qrtagLabel = links_pane
	    .append("span")
	    .attr("class", "ePeek_qrtag_label") // both needed?
	    .attr("id", "ePeek_qrtag_label")
	    .text("QR code")
	    .on("click", function(){gBrowser.toggle(d3.select("#ePeek_qrtag_div")); gBrowser.create_QRtag()});

	var qrtag_div = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_option")
	    .attr("id", "ePeek_qrtag_div");

	// We get the gene/location to render
	if (gene !== undefined) {
	    gBrowser.get_gene(gene, d3.select("#" + ensGenes_div_id));
	} else {
	    gBrowser.start();
	}

    };

/// RENDERING FUNCTIONS
    gBrowser.create_QRtag = function() {
	// We remove previously created QRtag
	d3.select("#ePeek_QRcode").remove();

	var qrtag = new QRtag();
	qrtag.data(gBrowser.buildLink("mobile"));
	qrtag.border(10);
	qrtag.target("ePeek_qrtag_div");
	qrtag.id("ePeek_QRcode");
	qrtag.image();

	return;
    };

    gBrowser.toggle = function(sel) {
	var curr_display = sel.style("display");

	// We hide all elements
	d3.selectAll(".ePeek_option")
	    .style("display", "none");

	if (curr_display === "none") {
	    sel.style("display", "block");
	}

	return;
    };

    gBrowser.goSearch = function() {
	d3.select("#ePeek_ensGene_select").remove();
//	var ensGeneBox = d3.select("#ePeek_ensGene_option");
	var ensGeneBox = d3.select("#" + ensGenes_div_id);
	var search_term = document.getElementById("ePeek_gene_name_input").value;
	if (gBrowser.isLocation(search_term)) {
	    gBrowser.parseLocation(search_term);
	    gBrowser.start();
	} else if (gBrowser.isEnsemblGene(search_term)) {
	    gBrowser.ensGene(search_term, ensGeneBox);
	} else {
	    gBrowser.get_gene(search_term, ensGeneBox);
	}
    };


    gBrowser.start = function () {
        var url = gBrowser.url();
        console.log(url)
        d3.jsonp(url, function (resp) {
            genes = resp;
            gBrowser.plot();
            gBrowser.update()
        });
    };

    gBrowser.plot = function () {
        xScale = d3.scale.linear()
            .domain([fromPos, toPos])
            .range([0, width]);

        xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("top");

        // zoom
        pane.call(d3.behavior.zoom().x(xScale).on("zoom", gBrowser.zoom));
    };

    gBrowser.update = function () {
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
            .attr("x", function (d) {
                return (xScale(d.start))
	    })
            .attr("y", 10)
            .attr("width", function (d) {
                return (xScale(d.end) - xScale(d.start))
	    })
            .attr("height", 10)
            .attr("fill", bgColor)
            .transition().duration(dur).attr("fill", "black");

        rects.exit().remove();
            
        rects.on("mouseover", function (gene) {
            d3.select(this).transition().duration(durFill).attr("fill", "orange");
            d3.select("#ePeek_gene_info")
                .append("p")
                .html(function () {
		    return gene.ID + "<br />" +
                        gene.external_name + "<br />" +
                        gene.description + "<br />" +
                        gene.logic_name + "<br />" +
                        gene.feature_type + "<br />" +
                        "loc: " + gene.seq_region_name + ":" + gene.start + "-" + gene.end + " (Strand: " + gene.strand + ")<br />"
                })
        });

        rects.on("mouseout", function () {
            d3.select(this).transition().duration(durFill).attr("fill", "black");
            d3.selectAll("#ePeek_gene_info p").remove();
        });

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
            .attr("class", "ePeek_name")
            .attr("x", function (d) {
                return xScale(d.start)
	    })
            .attr("y", 35)
            .attr("fill", bgColor)
            .text(function (d) {
                return d.external_name
	    })
            .transition().duration(dur).attr("fill", "black");

        names.exit().remove();

	// loc_row
	xScale_domain = xScale.domain();
	d3.select("#ePeek_species")
	    .text(species); // Only if cross-species is allowed! This can only change if Jumped from searchBox or ortholog selection
	d3.select("#ePeek_chr")
	    .text(chr);
	d3.select("#ePeek_from")
	    .text(~~xScale_domain[0]);
	d3.select("#ePeek_to")
	    .text(~~xScale_domain[1]);
    };

    gBrowser.zoom = function () {
        window.clearTimeout(refresh);
        refresh = window.setTimeout(function(){
            gBrowser.from(~~xScale.invert(0));
            gBrowser.to(~~xScale.invert(width));
            console.log("New Pos:" + fromPos + "-" + toPos);
            var url = gBrowser.url();
            console.log(url);
            d3.jsonp(url, function (resp) {
                genes = resp;
                gBrowser.update();
            });
	}, 300);
	
        gBrowser.update();
    };

    gBrowser.gene_select = function(gene_array, div) {
	var ensGene_sel = div
	    .append("select")
	    .attr("class", "ePeek_ensGene_select")
	    .attr("id", "ePeek_ensGene_select");
	
	ensGene_sel.selectAll("option")
	    .data(gene_array)
	    .enter()
	    .append("option")
	    .attr("class", "ePeek_gene_option")
	    .attr("value", function(d) {return d.id})
	    .text(function(d) {return d.id});

	return ensGene_sel;
    };


/// DATA RETRIEVERS
    gBrowser.get_orthologs = function(ensGene) {
//	var div = d3.select("#ePeek_ortho_option");
	var div = d3.select("#" + orth_div_id);
	var url = prefix_orthologs + ensGene + ".jsonp?format=condensed;sequence=none;type=orthologues;callback=d3.jsonp." + gBrowser.rand();
	console.log(url);
	d3.jsonp(url, function (resp) {
	    console.log("ORTH RESP:");
	    console.log(resp);
	    var orth_select = div
		.append("select")
		.attr("class", "ePeek_orth_select")
		.attr("id", "ePeek_orth_select");

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
		d3.select("#" + "ePeek_ensGene_select").remove();
		gBrowser.ensGene(this.value, div);
	    });

	});
    };

    gBrowser.get_gene = function(gene_name, div) {
	var url = prefix_gene + species + "/" + gene_name + ".jsonp?object=gene;callback=d3.jsonp." + gBrowser.rand();
	console.log(url);
	d3.jsonp(url, function (resp) {
	    resp = resp.filter(function(d){return !d.id.indexOf("ENS")}); // To avoid LRG genes (maybe the REST Service doesn't return those now)?
	    console.log("RESP:");
	    console.log(resp);

	    var ensGene_sel = gBrowser.gene_select(resp, div);

	    ensGene_sel.on("change", function(){
		gBrowser.ensGene(this.value, div);
	    });

	    gBrowser.ensGene(resp[0].id, div);

	});
    };
    
    gBrowser.ensGene = function (gene_name, div) {
	d3.select("#ePeek_orth_select").remove();
        var url = prefix_ensgene + gene_name + ".jsonp?format=full&callback=d3.jsonp." + gBrowser.rand();
	console.log("MY URL:");
        console.log(url);
        d3.jsonp(url, function (resp) {
            console.log(resp);
	    species = resp.species;
            resp.start = resp.start;
            resp.end = resp.end;
            resp.chr = resp.seq_region_name;

            gBrowser.chr(resp.chr).from(resp.start).to(resp.end);
	    gBrowser.get_orthologs(gene_name);
            gBrowser.start();
        });
        return gBrowser;
    };

/// GETTERS & SETTERS:
    gBrowser.parseLocation = function(loc) {
	console.log(loc);
	var loc_arr = loc_re.exec(loc);
	species = loc_arr[1];
	chr     = loc_arr[2];
	fromPos = loc_arr[3];
	toPos   = loc_arr[4];
	gene    = undefined;

	return gBrowser;
    };

    gBrowser.show_options = function(b) {
	show_options = b;
	return gBrowser;
    };

    gBrowser.show_title = function(b) {
	show_title = b;
	return gBrowser;
    };

    gBrowser.show_links = function(b) {
	show_links = b;
	return gBrowser;
    };

    gBrowser.orthologues_div_id = function(id) {
	if (!arguments.length) {
	    return orth_div_id;
	}
	orth_div_id = id;
	return gBrowser;
    };

    gBrowser.ensGenes_div_id = function(id) {
	if (!arguments.length) {
	    return ensGenes_div_id;
	}
	ensGenes_div_id = id;
	return gBrowser;
    };

    gBrowser.width = function (w) {
	if (!arguments.length) {
	    return width;
	}
	width = w;
	return gBrowser;
    };

    gBrowser.from = function (p) {
        if (!arguments.length) {
            return fromPos;
        }
        fromPos = p;
        return gBrowser;
    };

    gBrowser.to = function (p) {
        if (!arguments.length) {
            return toPos;
        }
        toPos = p;
        return gBrowser;
    };

    gBrowser.species = function (sp) {
        if (!arguments.length) {
            return species
        }
        species = sp;
        return gBrowser;
    };

    gBrowser.chr = function (c) {
        if (!arguments.length) {
            return chr;
        }
        chr = c;
        return gBrowser;
    };
    
    gBrowser.gene = function(g) {
	if (!arguments.length) {
	    return gene_name;
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


/// UTILITY FUNCTIONS:
    gBrowser.buildLink = function(platform) {
	var url = "http://www.ebi.ac.uk/~mp/ePeek/clients/ePeek";
	if (platform === "desktop") {
	    url = url + ".html";
	} else if (platform === "mobile") {
	    url = url + "_mobile.html";
	}
	url = url + "?loc=" + species + ":" + chr + ":" + fromPos + "-" + toPos;
	return url;
    };

    gBrowser.buildEnsemblLink = function() {
	var url = "http://www.ensembl.org/" + species + "/Location/View?r=" + chr + "%3A" + fromPos + "-" + toPos;
	return url;
    };

    gBrowser.isLocation = function(term) {
	if (term.match(loc_re)) {
	    return true;
	} else {
	    return false;
	}
    };

    gBrowser.isEnsemblGene = function(term) {
	if (term.match(ens_re)) {
	    return true;
	} else {
	    return false;
	}
    };

    gBrowser.url = function () {
        var url = prefix_region + species + "/" + chr + ":" + fromPos + "-" + toPos + ".jsonp?feature=gene;callback=d3.jsonp." + gBrowser.rand();
        return url;
    };

    gBrowser.rand = function() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        var c = '';
        var i = -1;
        while (++i < 15) {
            c += chars.charAt(Math.floor(Math.random() * 52));
        }
        return c;
    };

    return gBrowser;
};

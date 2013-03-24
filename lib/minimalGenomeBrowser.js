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
    var species = "human";
    var chr = 7;
    var fromPos = 139424940;
    var toPos = 141784100;
    var prefix_region = "http://beta.rest.ensembl.org/feature/region/";
    var prefix_ensgene = "http://beta.rest.ensembl.org/lookup/";
    var prefix_gene = "http://beta.rest.ensembl.org/xrefs/symbol/";
    var gene; // undefined
    var genes = [];
    var loc_re = /^(\w+):(\d+)-(\d+)$/;

    var div_id;
    var searchBox = false;
    var width = 600;
    var height = 150;
    var g;
    var pane;
    var xScale;
    var xAxis;
    var refresh;
    var bgColor = '#F8FBEF';
    var top = 60;

    var gBrowser = function (div) {
	div_id = d3.select(div).attr("id");
	if (searchBox) {
	    top += 40;
	    var p = d3.select(div)
		.append("p")
		.text("Gene name");
	    p
		.append("input")
		.attr("id", div_id + "_gene_name")
		.attr("type", "text")
		.attr("name", "gene");

	    p
		.append("input")
		.attr("type", "button")
		.attr("value", "Jump!")
		.on("click", function(d) {
		    d3.select("#" + div_id + "_gene_select").remove();
		    var search_term = document.getElementById(div_id + "_gene_name").value;
		    if (search_term.match(loc_re)) {
			var loc_arr = loc_re.exec(search_term);
			console.log(loc_arr);
			chr = loc_arr[1];
			fromPos = loc_arr[2];
			toPos = loc_arr[3];
			gene = undefined;
			gBrowser.start();
		    } else {
			gBrowser.get_gene(document.getElementById(div_id + "_gene_name").value, div);
		    }
		});

	    p
		.append("text")
		.text("(example: ENSG00000139618,  SNORD73 or 5:1533225-1555555)");
	}

	g = d3.select(div)
	    .attr("class", "genomeBrowserDiv")
	    .append("svg")
	    .attr("class", "genomeBrowser")
	    .attr("width", width)
	    .attr("height", height)
	    .append("g")
	    .attr("transform", "translate(0,20)")
	    .append("g")
	    .attr("class", "gbrowser");

	d3.select(div)
	    .append("div")
	    .attr("id", div_id + "_gene_info")
	    .attr("class", "gene_info")
	    .style("top", function() {return top + "px"});
//	    .attr("class", function() {if(searchBox) {return "gene_info_searchBox"} else {return "gene_info"}}); // TODO: Insert here the style. Don't change the class!

	pane = g.append("rect")
	    .attr("class", "pane")
	    .attr("width", width)
	    .attr("height", height);

	if (gene !== undefined) {
	    gBrowser.get_gene(gene, div);
	} else {
	    gBrowser.start();
	}
	
    };

/// RENDERING FUNCTIONS
    
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
        g.call(xAxis);
        var rects = g.selectAll(".gene")
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
            .attr("class", "gene")
            .attr("x", function (d) {
                return (xScale(d.start))
	    })
            .attr("y", 10)
            .attr("width", function (d) {
                return (xScale(d.end) - xScale(d.start))
	    })
            .attr("height", 10)
            .attr("fill", bgColor)
            .transition().duration(1000).attr("fill", "black");

        rects.exit().remove();
            
        rects.on("mouseover", function (gene) {
            d3.select(this).transition().duration(300).attr("fill", "orange");
            d3.select("#" + div_id + "_gene_info")
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
            d3.select(this).transition().duration(300).attr("fill", "black");
            d3.selectAll("#" + div_id + "_gene_info p").remove();
        });

            // labels
        var names = g.selectAll(".name")
            .data(genes, function (d) {
                return d.ID
	    })
            .attr("x", function (d) {
                return (xScale(d.start))
	    })

        names.enter()
            .append("text")
            .attr("class", "name")
            .attr("x", function (d) {
                return xScale(d.start)
	    })
            .attr("y", 35)
            .attr("fill", "white")
            .text(function (d) {
                return d.external_name
	    })
            .transition().duration(1000).attr("fill", "black");

        names.exit().remove();
    };

    gBrowser.zoom = function () {
        window.clearTimeout(refresh);
        refresh = window.setTimeout(function(){
            gBrowser.from(~~xScale.invert(0));
            gBrowser.to(~~xScale.invert(width));
            console.log("New Pos:" + fromPos + "-" + toPos);
            var url = gBrowser.url("cbak1");
            console.log(url);
            d3.jsonp(url, function (resp) {
                genes = resp;
                gBrowser.update();
            });}, 300);

        gBrowser.update();
    };


/// DATA RETRIEVERS

    gBrowser.get_gene = function(gene_name, div) {
	var url = prefix_gene + species + "/" + gene_name + ".jsonp?object=gene;callback=d3.jsonp." + gBrowser.rand();
	console.log(url);
	d3.jsonp(url, function (resp) {
	    console.log("RESP: ");
	    console.log(resp);
	    var sel = d3.select(div)
	    .append("select")
		.attr("class", function() { return div_id + "_gene_select" })
		.attr("id", function(){ return div_id + "_gene_select" });

	    sel.selectAll("option")
	    .data(resp)
	    .enter()
	    .append("option")
	    .attr("class", "gene_option")
	    .attr("value", function(d) {return d.id})
	    .text(function(d) {return d.id});

	    sel.on("change", function(){
		gBrowser.ensGene(this.value);
	    });

	    gBrowser.ensGene(resp[0].id);
	});
    };
    
    gBrowser.ensGene = function (gene_name) {
        var url = prefix_ensgene + gene_name + ".jsonp?callback=d3.jsonp." + gBrowser.rand();
        console.log(url);
        d3.jsonp(url, function (resp) {
            console.log(resp);
            resp.start = 32889611;
            resp.end = 32973805;
            resp.chr = 13; // This goes here because the REST API doesn't provide this info in the lookup queries
            gBrowser.chr(resp.chr).from(resp.start).to(resp.end);
            gBrowser.start();
        });
        return gBrowser;
    };

/// GETTERS & SETTERS:
    gBrowser.searchBox = function (sB) {
        searchBox = sB;
        return gBrowser;
    };

    gBrowser.width = function(w) {
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


/// UTILITY FUNCTIONS:
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

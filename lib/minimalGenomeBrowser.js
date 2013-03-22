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
    var prefix_gene = "http://beta.rest.ensembl.org/lookup/";
    var genes = [];

    var divElem; // undefined by default
    var searchBox = false;
    var width = 600;
    var height = 150;
    var g;
    var pane;
    var xScale;
    var xAxis;
    var refresh;
    var bgColor = '#F8FBEF';

    var gBrowser = function () {};

    gBrowser.rand = function() {
	var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        c = '',
        i = -1;
        while (++i < 15) c += chars.charAt(Math.floor(Math.random() * 52));
        return c;
    };
    
    gBrowser.start = function () {
        var url = gBrowser.url("cback3");
        console.log(url)
        d3.jsonp(url, function (resp) {
            genes = resp;
            gBrowser.plot();
            gBrowser.update()
        });
    };

    gBrowser.url = function (cback) {
        var url = prefix_region + species + "/" + chr + ":" + fromPos + "-" + toPos + ".jsonp?feature=gene;callback=d3.jsonp." + gBrowser.rand(); //cback;
        return url;
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
                d3.select("#" + divElem + "_gene_info")
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
                d3.selectAll("#" + divElem + "_gene_info p").remove();
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
    
    gBrowser.rand = function() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        var c = '';
        var i = -1;
        while (++i < 15) {
            c += chars.charAt(Math.floor(Math.random() * 52));
        }
        return c;
    };
    
    gBrowser.gene = function (gene_name) {
        var url = prefix_gene + gene_name + ".jsonp?callback=d3.jsonp.cback";
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

    gBrowser.searchBox = function (sB) {
        searchBox = sB;
        return gBrowser;
    }
    
    gBrowser.div = function (d) {
        if (!arguments.length) {
            return divElem;
        }
        divElem = d;
        if (searchBox) {
            var p = d3.select("#" + divElem)
		.append("p")
		.text("Gene name");
            p
		.append("input")
		.attr("id", divElem + "_gene_name")
		.attr("type", "text")
		.attr("name", "gene");
            p
		.append("input")
		.attr("id", "jump")
		.attr("type", "button")
		.attr("value", "Jump!")
		.on("click", function(d){gBrowser.gene(document.getElementById(divElem + "_gene_name").value)});
            p
		.append("text")
		.text("(example: ENSG00000139618)");
        }
        
        g = d3.select("#" + divElem)
            .attr("class", "genomeBrowserDiv")
            .append("svg")
            .attr("class", "genomeBrowser")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(0, 20)")
            .append("g")
            .attr("class", "gbrowser");
        
	d3.select("#" + divElem)
            .append("div")
            .attr("id", divElem+"_gene_info")
	    .attr("class", function() { if(searchBox) {return "gene_info_searchBox"} else {return "gene_info"}})
       
        pane = g.append("rect")
            .attr("class", "pane")
            .attr("width", width)
            .attr("height", height);

        return gBrowser;
    };

    return gBrowser;
};

var epeek_theme = function() {

    var colors = {
	"protein coding"       : d3.rgb('#A00000'),
	"pseudogene"           : d3.rgb('#666666'),
	"processed transcript" : d3.rgb('#0033FF'),
	"ncRNA"                : d3.rgb('#8B668B'),
	"antisense"            : d3.rgb('#CBDD8B'),
    };

    var biotype_to_legend = {
	"protein_coding"       : "protein coding",
	"pseudogene"           : "pseudogene",
	"processed_transcript" : "processed transcript",
	"miRNA"                : "ncRNA",
	"lincRNA"              : "ncRNA",
	"misc_RNA"             : "ncRNA",
	"snoRNA"               : "ncRNA",
	"snRNA"                : "ncRNA",
	"rRNA"                 : "ncRNA",
	"antisense"            : "antisense",
	"sense_intronic"       : "antisense"
    };

    var theme = function(gB, div) {
	
	gB.background_color("#FFFFFF")
	gB(div);

	var legend_div = d3.select(div)
	    .append("div")
	    .attr("class", "ePeek_legend_div");

	legend_div
	    .append("text")
	    .text("Gene legend:");

	d3.selectAll("ePeek_biotype")
	    .data(gB.genes());

	gB.genes_callback = function (genes) {
	    // We set the color of the gene explicitely.
	    genes.map(gene_color);

	    // And we setup/update the legend
	    var biotypes_array = genes.map(function(e){return biotype_to_legend[e.biotype]});
	    var biotypes_hash = {};
	    for (var i=0; i<biotypes_array.length; i++) {
		biotypes_hash[biotypes_array[i]] = 1;
	    }
	    var biotypes = [];
	    for (var p in biotypes_hash) {
		if (biotypes_hash.hasOwnProperty(p)) {
		    biotypes.push(p);
		}
	    }
	    var biotype_legend = legend_div.selectAll(".ePeek_biotype_legend")
		.data(biotypes, function(d){return d});

	    var new_legend = biotype_legend
		.enter()
		.append("div")
		.attr("class", "ePeek_biotype_legend")
		.style("display", "inline");

	    new_legend
		.append("div")
		.style("display", "inline-block")
		.style("margin", "0px 2px 0px 15px")
		.style("width", "10px")
		.style("height", "10px")
		.style("border", "1px solid #000")
		.style("background", function(d){console.log("D: " + d); return colors[d]});
	    new_legend
		.append("text")
		.text(function(d){return d});
	    biotype_legend
		.exit()
		.remove();
		
	};

	var gene_color =  function (gene) {
	    console.log("BIOTYPE: " + gene.biotype);
	    console.log("biotype_to_legend: " + biotype_to_legend[gene.biotype]);
	    console.log("COLORS: " + colors[biotype_to_legend[gene.biotype]]);

	    gene.color = colors[biotype_to_legend[gene.biotype]];
	    return;
	};

 	gB.startOnOrigin();
	
    };

    return theme;
};
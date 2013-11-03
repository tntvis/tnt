epeek.tooltip = function() {
    "use strict";
    var path = epeek.scriptPath("ePeek.js");

    // Style options
    var bgColor;
    var fgColor;

    var tooltip = function(gene) {
	console.log(gene);
	var parent_elem = this;

//	var sel = d3.select("#ePeek_" + div_id + "_gene_info");
	var drag = d3.behavior.drag()
	    .origin(function(){
		var d = d3.select(this);
		return {x:parseInt(d3.select(this).style("left")),
			y:parseInt(d3.select(this).style("top"))
		       }
	    })
	    .on("drag", function(d) {
		var coords = d3.mouse(this);
		d3.select(this)
		    .style("left", d3.event.x + "px")
		    .style("top", d3.event.y + "px")
	    });


	var sel = d3.select(".ePeek_groupDiv")
	    .append("div")
	    .attr("class", "ePeek_gene_info")
 	    .classed("ePeek_gene_info_active", true)
	    .call(drag);
	sel
	    .style("left", d3.mouse(this)[0] + "px")
	    .style("top", d3.mouse(this)[1] + "px");


	var gene_info_table = sel 
	    .append("table")
	    .attr("class", "ePeek_zmenu")
	    .style("border-color", fgColor)
	gene_info_table
	    .append("tr")
	    .attr("class", "ePeek_gene_info_header")
	    .append("th")
	    .style("background-color", fgColor)
	    .style("color", bgColor)
	    .attr("colspan", 2)
	    .text("HGNC Symbol: " + gene.external_name);
	var gene_tr = gene_info_table
	    .append("tr")
	gene_tr
	    .append("th")
	    .style("border-color", fgColor)
	    .text("Gene");
	gene_tr
	    .append("td")
	    .append("a")
	    .attr("href", "kk")
	    .text(gene.ID);
	var type_tr = gene_info_table
	    .append("tr");
	type_tr
	    .append("th")
	    .text("Gene Type");
	type_tr
	    .append("td")
	    .text(gene.biotype);
	var location_tr = gene_info_table
	    .append("tr");
	location_tr
	    .append("th")
	    .text("Location");
	location_tr
	    .append("td")
	    .append("a")
	    .attr("href", "kk")
	    .text(gene.seq_region_name + ":" + gene.start + "-" + gene.end);
	var strand_tr = gene_info_table
	    .append("tr")
	strand_tr
	    .append("th")
	    .text("Strand")
	strand_tr
	    .append("td")
	    .text(function(){return gene.strand === 1 ? "Forward" : "Reverse"});
	var description_tr = gene_info_table
	    .append("tr")
	description_tr
	    .append("th")
	    .text("Description")
	description_tr
	    .append("td")
	    .text(gene.description);

	// Close
	sel.append("span")
	    .style("position", "absolute")
	    .style("right", "-10px")
	    .style("top", "-10px")
	    .append("img")
	    .attr("src", path + "close.png")
	    .attr("width", "20px")
	    .attr("height", "20px")
	    .on("click", function() {d3.select(this).node().parentNode.parentNode.remove();});
//     sel.classed("ePeek_gene_info_active", false)});

    };

    tooltip.background_color = function(color) {
	if (!arguments.length) {
	    return bgColor;
	}
	bgColor = color;
	return tooltip;
    };

    tooltip.foreground_color = function(color) {
	if (!arguments.length) {
	    return fgColor;
	}
	fgColor = color;
	return tooltip;
    };

    return tooltip;
};

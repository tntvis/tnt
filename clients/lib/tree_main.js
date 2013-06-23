var species_tree = {
    "name": "root",
    "children": [
	{
	    "name": "N1",
	    "children": [
		{
		    "name": "N2",
		    "children": [
			{"species": "Human", "gene": "BRCA1"},
			{"species": "Mouse", "gene": "BRCA1"},
			{"species": "Rat", "gene" : "BRCA1"}
		    ]
		},
		{
		    "name": "N3",
		    "children": [
			{"species": "Gorilla", "gene": "BRCA1"},
			{"species": "Chimpanzee", "gene": "BRCA1"}
		    ]
		}
	    ]
	}
    ]
};

function plotTree(div) {
    var width = 1200;
    var height = 500;

    var cluster = d3.layout.cluster().size([500,500]).nodeSize([70,50]);

    var nodes = cluster.nodes(species_tree);
    var links = cluster.links(nodes);

    var svg = d3.select(div)
	.append("svg")
	.attr("width", width)
	.attr("height", height)
	.append("g")
	.attr("transform", "translate(40,250)");

    var link = svg.selectAll(".link")
	.data(links)
	.enter().append("path")
	.attr("class", "link")
	.attr("d", elbow);

    var node = svg.selectAll(".node")
	.data(nodes)
	.enter().append("g")
	.attr("class", "node")
	.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    var label = node.append("g")
	.attr("class", "label");

    label.append("circle")
	.attr("r", 4.5);

    label.append("text")
	.attr("x", function(d) {return 8})
	.text(function(d) {return d.species});

    function elbow(d, i) {
	return "M" + d.source.y + "," + d.source.x
	    + "V" + d.target.x + "H" + d.target.y;
    }
}

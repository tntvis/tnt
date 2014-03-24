var epeek_theme = function() {
    "use strict";

    var tree_theme = function (sT, div) {
	// In the div, we set up a "select" to transition between a radial and a vertical tree
	var menu_pane = d3.select(div)
	    .append("div")
	    .append("span")
	    .text("Layout:  ");

	var sel = menu_pane
	    .append("select")
	    .on("change", function(d) {
		switch (this.value) {
		case "unscaled" :
		    sT.layout().scale(false);
		    break;
		case "scaled" :
		    sT.layout().scale(true);
		    break;
		};
		sT.update();
	    });

	sel
	    .append("option")
	    .attr("value", "unscaled")
	    .attr("selected", 1)
	    .text("Unscaled");
	sel
	    .append("option")
	    .attr("value", "scaled")
	    .text("Scaled");


	var newick = "(((Crotalus_oreganus_oreganus_cytochrome_b:0.00800,Crotalus_horridus_cytochrome_b:0.05866):0.04732,(Thamnophis_elegans_terrestris_cytochrome_b:0.00366,Thamnophis_atratus_cytochrome_b:0.00172):0.06255):0.00555,(Pituophis_catenifer_vertebralis_cytochrome_b:0.00552,Lampropeltis_getula_cytochrome_b:0.02035):0.05762,((Diadophis_punctatus_cytochrome_b:0.06486,Contia_tenuis_cytochrome_b:0.05342):0.01037,Hypsiglena_torquata_cytochrome_b:0.05346):0.00779);";

	sT
	    .data(epeek.tree.parse_newick(newick))
	    .duration(2000)
	    .layout(epeek.tree.layout.vertical().width(600).scale(false));

	sT
	    .label().height(function(){return 50});

	// The visualization is started at this point
	sT(div);
    };

    return tree_theme;
};

var species_data = {
    'Homo sapiens' : {
	'Chromosome pairs' : 23,
	'Protein-coding genes' : 20805,
	'Genome length' : 3.1,
	'Ensembl date' : new Date(2001, 07),
	'Cuteness factor' : 6
    },
    'Tetraodon nigroviridis' : {
	'Chromosome pairs' : 21,
	'Protein-coding genes' : 19602,
	'Genome length' : 0.36,
	'Ensembl date' : new Date(2004, 09),
	'Cuteness factor' : 10
    },
    'Monodelphis domestica' : {
	'Chromosome pairs' : 11,
	'Protein-coding genes' : 21327,
	'Genome length' : 3.6,
	'Ensembl date' : new Date(2005, 11),
	'Cuteness factor' : 9
    },
    'Drosophila melanogaster' : {
	'Chromosome pairs' : 4,
	'Protein-coding genes' : 13937,
	'Genome length' : 0.17,
	'Ensembl date' : new Date(2003,02),
	'Cuteness factor' : 2
    },
    'Mus musculus' : {
	'Chromosome pairs' : 20,
	'Protein-coding genes' : 23148,
	'Genome length' : 2.7,
	'Ensembl date' : new Date(2002,01),
	'Cuteness factor' : 7
    },
    'Ornithorhynchus anatinus' : {
	'Chromosome pairs' : 26,
	'Protein-coding genes' : 21698,
	'Genome length' : 2.1,
	'Ensembl date' : new Date(2006,12),
	'Cuteness factor' : 9
    },
    'Pan troglodytes' : {
	'Chromosome pairs' : 24,
	'Protein-coding genes' : 18759,
	'Genome length' : 3.3,
	'Ensembl date' : new Date(2004,05),
	'Cuteness factor' : 6
    },
    'Macaca mulatta' : {
	'Chromosome pairs' : 21,
	'Protein-coding genes' : 21905,
	'Genome length' : 3.1,
	'Ensembl date' : new Date(2005,12),
	'Cuteness factor' : 6
    },
    'Ovis aries' : {
	'Chromosome pairs' : 27,
	'Protein-coding genes' : 20921,
	'Genome length' : 2.6,
	'Ensembl date' : new Date(2013,12),
	'Cuteness factor' : 6
    },
    'Sus scrofa' : {
	'Chromosome pairs' : 19,
	'Protein-coding genes' : 21630,
	'Genome length' : 2.8,
	'Ensembl date' : new Date(2009,09),
	'Cuteness factor' : 5
    },
    'Ciona intestinalis' : {
	'Chromosome pairs' : 14,
	'Protein-coding genes' : 16658,
	'Genome length' : 0.1,
	'Ensembl date' : new Date(2005,05),
	'Cuteness factor' : 3
    },
    'Rattus norvegicus' : {
	'Chromosome pairs' : 21,
	'Protein-coding genes' : 22941,
	'Genome length' : 2.9,
	'Ensembl date' : new Date(2002,11),
	'Cuteness factor' : 5
    },
    'Anolis carolinensis' : {
	'Chromosome pairs' : 14,
	'Protein-coding genes' : 18596,
	'Genome length' : 1.8,
	'Ensembl date' : new Date(2009,03),
	'Cuteness factor' : 7
    },
    'Bos taurus' : {
	'Chromosome pairs' : 30,
	'Protein-coding genes' : 19994,
	'Genome length' : 2.7,
	'Ensembl date' : new Date(2005,07),
	'Cuteness factor' : 6
    },
    'Danio rerio' : {
	'Chromosome pairs' : 25,
	'Protein-coding genes' : 26247,
	'Genome length' : 1.4,
	'Ensembl date' : new Date(2002,03),
	'Cuteness factor' : 3
    },
    'Pongo abelii' : {
	'Chromosome pairs' : 24,
	'Protein-coding genes' : 20424,
	'Genome length' : 3.4,
	'Ensenbl date' : new Date(2011,04),
	'Cuteness factor' : 8
    },
    'Callithrix jacchus' : {
	'Chromosome pairs' : 23,
	'Protein-coding genes' : 20993,
	'Genome length' : 2.9,
	'Ensembl date' : new Date(2009,09),
	'Cuteness factor' : 8
    },
    'Equus caballus' : {
	'Chromosome pairs' : 32,
	'Protein-coding genes' : 20449,
	'Genome length' : 2.5,
	'Ensembl date' : new Date(2008,03),
	'Cuteness factor' : 6
    },
    'Canorhabditis elegans' : {
	'Chromosome pairs' : 6,
	'Protein-coding genes' : 20532,
	'Genome length' : 0.1,
	'Ensembl date' : new Date(2003,02),
	'Cuteness factor' : 1
    },
    'Saccharomyzes cerevisiae' : {
	'Chromosome pairs' : 16,
	'Protein-coding genes' : 6692,
	'Genome length' : 0.01,
	'Ensembl date' : new Date(2007,12),
	'Cuteness factor' : 6
    },
    'Oryzias latipes' : {
	'Chromosome pairs' : 24,
	'Protein-coding genes' : 19699,
	'Genome length' : 0.87,
	'Ensembl date' : new Date(2006,10),
	'Cuteness factor' : 4
    },
    'Taeniopygia guttata' : {
	'Chromosome pairs' : 40,
	'Protein-coding genes' : 17488,
	'Genome length' : 1.2,
	'Ensembl date' : new Date(2009,03),
	'Cuteness factor' : 8
    },
    'Gasterosteus aculeatus' : {
	'Chromosome pairs' : 22,
	'Protein-coding genes' : 20787,
	'Genome length' : 0.46,
	'Ensembl date' : new Date(2006,08),
	'Cuteness factor' : 3
    },
    'Gallus gallus' : {
	'Chromosome pairs' : 39,
	'Protein-coding genes' : 15508,
	'Genome length' : 1,
	'Ensembl date' : new Date(2004,06),
	'Cuteness factor' : 4
    },
    'Felis catus' : {
	'Chromosome pairs' : 19,
	'Protein-coding genes' : 19493,
	'Genome length' : 2.5,
	'Ensembl date' : new Date(2007,02),
	'Cuteness factor' : 9
    },
    'Gorilla gorilla' : {
	'Chromosome pairs' : 24,
	'Protein-coding genes' : 20962,
	'Genome length' : 3,
	'Ensembl date' : new Date(2008,12),
	'Cuteness factor' : 4
    },
    'Oryctolagus cuniculus' : {
	'Chromosome pairs' : 22,
	'Protein-coding genes' : 19293,
	'Genome length' : 2.7,
	'Ensembl date' : new Date(2006,08),
	'Cuteness factor' : 10
    },
    'Meleagris gallopavo' : {
	'Chromosome pairs' : 40,
	'Protein-coding genes' : 14125,
	'Genome length' : 1.1,
	'Ensembl date' : new Date(2010,03),
	'Cuteness factor' : 2
    },
    'Canis familiaris' : {
	'Chromosome pairs' : 39,
	'Protein-coding genes' : 19856,
	'Genome length' : 2.4,
	'Ensembl date' : new Date(2004,12),
	'Cuteness factor' : 6
    }

};

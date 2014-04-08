epeek.track.layout = {};

epeek.track.layout.identity = function () {
    // vars exposed in the API:
    var elements;

    // The returned closure / object
    var l = function (new_elements) {
	elements = new_elements;
    }

    l.height = function(){}

    l.elements = function () {
	return elements;
    }

    return l;
};

// The overlap detector used for genes
epeek.track.layout.feature = function() {
    // Private vars
    var max_slots;

    // vars exposed in the API:
    var height = 150; // Default value
    var genes     = [];
    var xScale;
    var slot_types = {
	'expanded'   : {
	    slot_height : 30,
	    gene_height : 10,
	    show_label  : true
	},
	'collapsed' : {
	    slot_height : 10,
	    gene_height : 7,
	    show_label  : false
	}
    };
    var current_slot_type = 'expanded';

    // The returned closure / object
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
	} else {
	    current_slot_type = 'expanded';
	}

	genes = new_genes;
    };

    genes_layout.elements = function () {
	return genes;
    }

    genes_layout.gene_slot = function () {
	return slot_types[current_slot_type];
    };

    var collition_detector = function (genes) {
	var genes_placed = [];
	var genes_to_place = genes;
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
            OUTER: while (true) {
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
            var y_label_end = subj_gene.display_label.length * 8 + xScale(subj_gene.start); // TODO: It may be better to have a fixed font size (instead of the hardcoded 16)?
            var y1  = xScale(subj_gene.start);
            var y2  = xScale(subj_gene.end) > y_label_end ? xScale(subj_gene.end) : y_label_end;
	    var x_label_end = query_gene.display_label.length * 8 + xScale(query_gene.start);
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


    return genes_layout;
};

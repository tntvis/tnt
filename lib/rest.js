var rest = function() {

    // Prefixes to use the REST API.
    // These are modified in the localREST setter
    // TODO: Encapsulate this information in an object
    var prefix = "http://beta.rest.ensembl.org";
    var prefix_region = prefix + "/feature/region/";
    var prefix_ensgene = prefix + "/lookup/";
    var prefix_gene = prefix + "/xrefs/symbol/";
    var prefix_homologues = prefix + "/homology/id/";
    var prefix_chr_info = prefix + "/assembly/info/";

    var eRest = function() {
    };


    eRest.call = function (url, on_success, on_error) {
	console.log("URL:" + url);
	d3.json (url, function (error, resp) {
	    console.log("RESP:");
	    console.log(resp);
	    if (resp !== undefined && error === null) {
		on_success(resp);
	    }
	    if (error !== null) {
		on_error();
	    }
	});
    };

    eRest.url = function (key, obj) {
	if (key === "region") {
	    return prefix_region + obj.species + "/" + obj.chr + ":" + obj.fromPos + "-" + obj.toPos + ".json?feature=gene";
	}
	if (key === "species_gene") {
	    return prefix_gene + obj.species + "/" + obj.gene_name + ".json?object=gene";	    
	}
	if (key === "homologues") {
	    return prefix_homologues + obj.gene_name + ".json?format=condensed;sequence=none;type=all";
	}
	if (key === "gene") {
	    return prefix_ensgene + obj.gene_name + ".json?format=full";
	}
	if (key === "chr_info") {
	    return prefix_chr_info + obj.species + "/" + obj.chr;
	}
    };

    return eRest;
};
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

    /** <strong>localREST</strong> points the queries to a local REST service to debug.
	This method should be removed in "production"
    */
    eRest.localREST = function() {
	prefix = "http://127.0.0.1:3000";
	prefix_region = prefix + "/feature/region/";
	prefix_ensgene = prefix + "/lookup/id/";
	prefix_gene = prefix + "/xrefs/symbol/";
	prefix_homologues = prefix + "/homology/id/";

	return eRest;
    };

    eRest.call = function (obj) {
	var url = obj.url;
	var on_success = obj.success;
	var on_error   = obj.error;
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
	    return prefix_gene + obj.species + "/" + obj.gene_name + ".json?object_type=gene";	    
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
"use strict"

epeek.track.genome = function() {

    var ens_re = /^ENS\w+\d+$/;

    // Default species and genome location
    // TODO: Encapsulate this information in an object
    var gene; // undefined

    var chr_length; // undefined

    var eRest = epeek.eRest();

    var limits = {
        left : 0,
	right : undefined,
	zoom_out : eRest.limits.region,
	zoom_in  : 200
    };


    // We "inherit" from track
    var gBrowser = epeek.track();

    // The location and axis track
    var location_track = epeek.track.track.empty()
	.height(20)
	.foreground_color("black")
	.background_color("white")
	.plotter(epeek.track.feature.location());

    var axis_track = epeek.track.track.empty()
	.height(20)
	.foreground_color("black")
	.background_color("white")
	.plotter(epeek.track.feature.axis());

    gBrowser
	.add_track(location_track)
	.add_track(axis_track);

    // Default location:
    gBrowser.species("human");
    gBrowser.chr(7);
    gBrowser.from(139424940);
    gBrowser.to(141784100);

    // We save 'super' start method
    gBrowser._start = gBrowser.start;

    // We hijack parent's start method
    gBrowser.start = function (where) {
	// TODO:  Not sure if we should fall back to a default
	// start_activity();
	if (where !== undefined) {
	    if (where.gene !== undefined) {
		get_gene(where);
		return;
	    } else {
		if (where.species === undefined) {
		    where.species = gBrowser.species();
		} else {
		    gBrowser.species(where.species);
		}
		if (where.chr === undefined) {
		    where.chr = gBrowser.chr();
		} else {
		    gBrowser.chr(where.chr);
		}
		if (where.from === undefined) {
		    where.from = gBrowser.from();
		} else {
		    gBrowser.from(where.from)
		}
		if (where.to === undefined) {
		    where.to = gBrowser.to();
		} else {
		    gBrowser.to(where.to);
		}
	    }
	} else { // "where" is undef so look for gene or loc
	    if (gBrowser.gene() !== undefined) {
		get_gene({ species : gBrowser.species(),
			   gene    : gBrowser.gene()
			 });
		return;
	    } else {
		where = {};
		where.species = gBrowser.species(),
		where.chr     = gBrowser.chr(),
		where.from    = gBrowser.from(),
		where.to      = gBrowser.to()
	    }
	}

	gBrowser.limits(function (done) {

	    // Get the chromosome length
	    eRest.call({url : eRest.url.chr_info ({species : where.species,
						   chr     : where.chr
						  }),
			success : function (resp) {
			    done({
				right : resp.length,
				left  : 0,
				zoom_in : 200,
				zoom_out : eRest.limits.region
			    });
			}
		       });
	});
	gBrowser._start();
    };

    var isEnsemblGene = function(term) {
	if (term.match(ens_re)) {
            return true;
        } else {
            return false;
        }
    };

    var get_gene = function (where) {
	// start_activity();
	if (isEnsemblGene(where.gene)) {
	    get_ensGene(where.gene)
	} else {
	    eRest.call({url : eRest.url.xref ({ species : where.species,
						name    : where.gene 
					      }
					     ),
			success : function(resp) {
			    // stop_activity();
			    resp = resp.filter(function(d) {
				return !d.id.indexOf("ENS");
			    });
			    if (resp[0] !== undefined) {
				gBrowser.xref_search_callback(resp);
				get_ensGene(resp[0].id)
			    } else {
				gBrowser.start();
			    }
			}
		       }
		      );
	}
    };

    ///*********************////
    /// DATA RETRIEVERS     ////
    ///*********************////
    /** <strong>homologues</strong> looks for homologues of the given gene.
	Once the homologues are retrieved, the optional callback given as the second argument is invoked passing the array of homologues as its argument. These homologues have the following information:
	<ul>
	<li>id          => The Ensembl Gene ID of the homolog</li>
	<li>protein_id  => The Ensembl Protein ID of the homolog</li>
	<li>species     => The species name of the homolog</li>
	<li>subtype     => The subtype of the homology relantionship</li>
	<li>type        => The type of homology</li>
	</ul>
	@param {string} ensGene The id of the gene to look for homologues
	@param {Callback} [callback] The callback to be called on the array of homologues
    */
    gBrowser.homologues = function (ensGene, callback)  {
	// start_activity();
	eRest.call({url : eRest.url.homologues ({id : ensGene}),
		    success : function(resp) {
			// stop_activity();
			var homologues = resp.data[0].homologies;
			if (callback !== undefined) {
			    var homologues_obj = split_homologues(homologues)
			    callback(homologues_obj);
			}
		    }
		   });
    }

    var get_ensGene = function (id) {
	// start_activity();
	eRest.call({url     : eRest.url.gene ({id : id}),
		    success : function(resp) {
			// stop_activity();

			gBrowser.ensgene_search_callback(resp);

			gBrowser
			    .species(resp.species)
			    .chr(resp.seq_region_name)
			    .from(resp.start)
			    .to(resp.end);

			gBrowser.start( { species : resp.species,
					  chr     : resp.seq_region_name,
					  from    : resp.start,
					  to      : resp.end
					} );
		    }
		   });
    };


    ///***********************////
    /// Setters & Getters     ////
    ///***********************////

    /** <strong>gene</strong> sets the gene name for the next gene-based location.
	External gene names (BRCA2) and ensembl gene identifiers (ENSG00000139618) are both allowed.
	Gene-based locations have higher preference over coordinates-based locations.
	@example
	// Will show the correct location even if the gene name is spelled wrong
	// or is not recognized by Ensembl
	gB.species("human").chr(13).from(35009587).to(35214822).gene("LINC00457");
	@param {String} [name] The name of the gene
	@returns {ePeek} The original object allowing method chaining
    */
    gBrowser.gene = function(g) {
	if (!arguments.length) {
	    return gene;
	}
	gene = g;
	return gBrowser;
    };


    ///*********************////
    /// UTILITY METHODS     ////
    ///*********************////

    /** <strong>split_homologues</strong> split an array of homologues into an object containing an array of orthologues (under the 'orthologues' field)
	and an array of paralogues (under the 'paralogues' field)
	@param {Array} [homologues] The array containing homologues objects
	@returns {Object} An object containing an array of orthologues and an array of paralogues
    */
    var split_homologues = function (homologues) {
	var orthoPatt = /ortholog/;
	var paraPatt = /paralog/;

	var orthologues = homologues.filter(function(d){return d.type.match(orthoPatt)});
	var paralogues  = homologues.filter(function(d){return d.type.match(paraPatt)});

	return {'orthologues' : orthologues,
		'paralogues'  : paralogues};
    };


    /** <strong>xref_search_callback</strong> is a callback called every time a gene is searched in the
	REST server.
	Its default behaviour is to do nothing.
	This method can be used by a theme to run some arbitrary code when a gene is found in the REST
	server.
	@param {Array} genes An array of genes found in the last gene-based search. Each gene is an object having the following fields:
	<ul>
	<li>id    => The Ensembl gene id associated with the gene</li>
	<li>type  => This should be "gene"
	</ul>
    */
    gBrowser.xref_search_callback = function() {};

    gBrowser.ensgene_search_callback = function() {};

    // var stop_activity = function() {
    // 	if (!eRest.connections()) {
    // 	    d3.select("#ePeek_" + div_id + "_activity_signal").attr("src", path + "lib/green_button_small.png");
    // 	}
    // };

    // var start_activity = function() {
    // 	d3.select("#ePeek_" + div_id + "_activity_signal").attr("src", path + "lib/red_button_small.png");
    // };


    return gBrowser;
};


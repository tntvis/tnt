"use strict"

epeek.track.genome = function() {

    var ens_re = /^ENS\w+\d+$/;

    var gene;

    var chr_length;

    var eRest = epeek.eRest();

    var xref_search_cbak = function () {};
    var ensgene_search_cbak = function () {};

    var limits = {
        left : 0,
	right : undefined,
	zoom_out : eRest.limits.region,
	zoom_in  : 200
    };


    // We "inherit" from track
    var genome_browser = epeek.track();

    // The location and axis track
    var location_track = epeek.track.track()
	.height(20)
	.foreground_color("black")
	.background_color("white")
	.data(epeek.track.data.empty())
	.display(epeek.track.feature.location());

    var axis_track = epeek.track.track()
	.height(20)
	.foreground_color("black")
	.background_color("white")
	.data(epeek.track.data.empty())
	.display(epeek.track.feature.axis());

    genome_browser
	.add_track(location_track)
	.add_track(axis_track);

    // Default location:
    genome_browser.species("human");
    genome_browser.chr(7);
    genome_browser.from(139424940);
    genome_browser.to(141784100);

    // We save the start method of the 'parent' object
    genome_browser._start = genome_browser.start;

    // We hijack parent's start method
    genome_browser.start = function (where) {
	if (where !== undefined) {
	    if (where.gene !== undefined) {
		get_gene(where);
		return;
	    } else {
		if (where.species === undefined) {
		    where.species = genome_browser.species();
		} else {
		    genome_browser.species(where.species);
		}
		if (where.chr === undefined) {
		    where.chr = genome_browser.chr();
		} else {
		    genome_browser.chr(where.chr);
		}
		if (where.from === undefined) {
		    where.from = genome_browser.from();
		} else {
		    genome_browser.from(where.from)
		}
		if (where.to === undefined) {
		    where.to = genome_browser.to();
		} else {
		    genome_browser.to(where.to);
		}
	    }
	} else { // "where" is undef so look for gene or loc
	    if (genome_browser.gene() !== undefined) {
		get_gene({ species : genome_browser.species(),
			   gene    : genome_browser.gene()
			 });
		return;
	    } else {
		where = {};
		where.species = genome_browser.species(),
		where.chr     = genome_browser.chr(),
		where.from    = genome_browser.from(),
		where.to      = genome_browser.to()
	    }
	}

	genome_browser.limits(function (done) {
	    // Get the chromosome length and use it as the 'right' limit
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
	genome_browser._start();
    };

    var isEnsemblGene = function(term) {
	if (term.match(ens_re)) {
            return true;
        } else {
            return false;
        }
    };

    var get_gene = function (where) {
	if (isEnsemblGene(where.gene)) {
	    get_ensGene(where.gene)
	} else {
	    eRest.call({url : eRest.url.xref ({ species : where.species,
						name    : where.gene 
					      }
					     ),
			success : function(resp) {
			    resp = resp.filter(function(d) {
				return !d.id.indexOf("ENS");
			    });
			    if (resp[0] !== undefined) {
				xref_search_cbak(resp);
				get_ensGene(resp[0].id)
			    } else {
				genome_browser.start();
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
    genome_browser.homologues = function (ensGene, callback)  {
	eRest.call({url : eRest.url.homologues ({id : ensGene}),
		    success : function(resp) {
			var homologues = resp.data[0].homologies;
			if (callback !== undefined) {
			    var homologues_obj = split_homologues(homologues)
			    callback(homologues_obj);
			}
		    }
		   });
    }

    var get_ensGene = function (id) {
	eRest.call({url     : eRest.url.gene ({id : id}),
		    success : function(resp) {
			ensgene_search_cbak(resp);

			genome_browser
			    .species(resp.species)
			    .chr(resp.seq_region_name)
			    .from(resp.start)
			    .to(resp.end);

			genome_browser.start( { species : resp.species,
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
    genome_browser.gene = function(g) {
	if (!arguments.length) {
	    return gene;
	}
	gene = g;
	return genome_browser;
    };


    ///*********************////
    /// UTILITY METHODS     ////
    ///*********************////

    var split_homologues = function (homologues) {
	var orthoPatt = /ortholog/;
	var paraPatt = /paralog/;

	var orthologues = homologues.filter(function(d){return d.type.match(orthoPatt)});
	var paralogues  = homologues.filter(function(d){return d.type.match(paraPatt)});

	return {'orthologues' : orthologues,
		'paralogues'  : paralogues};
    };

    genome_browser.xref_search = function (cbak) {
	if (!arguments.length) {
	    return xref_search_cbak;
	}
	xref_search_cbak = cbak;
	return genome_browser;
    };

    genome_browser.ensgene_search = function (cbak) {
	if (!arguments.length) {
	    return ensgene_search_cbak;
	}
	ensgene_search_cbak = cbak;
	return genome_browser;
    };

    return genome_browser;
};


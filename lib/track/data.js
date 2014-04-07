"use strict";

epeek.track.data = function() {

    // The label for the track. If empty, no label is displayed in the track
    var label = "";

    // elements is the data to display in the track
    var elements  = [];

    // index is the field to index the elements for d3 (data-joining)
    // Can be numeric or string (ie. a position in the array of elements
    // or an object field
    var index = 0;

    // This is the function that is called on update
    var updater = function(){};

    var track_data = function() {
    };


    // API
    track_data.label = function (n) {
	if (!arguments.length) {
	    return label;
	}
	label = n;
	return track_data;
    };

    track_data.index = function (i) {
	if (!arguments.length) {
	    return index;
	}
	index = i;
	return track_data;
    };

    track_data.elements = function (elms) {
	if (!arguments.length) {
	    return elements;
	}
	elements = elms;
	return track_data;
    };

    track_data.update = function (callback) {
	if (!arguments.length) {
	    return updater;
	}
	updater = callback;
	return track_data;
    };


    // The retrievers. They need to access 'elements'
    epeek.track.retriever = {};

    epeek.track.retriever.sync = function() {
	var retriever = function () { };

	var update_track = function(obj) {
        // Object has a location and a plug-in defined callback
            elements = retriever(obj.loc);
            obj.on_success();
	};

	update_track.retriever = function (cbak) {
            if (!arguments.length) {
		return retriever;
            }
            retriever = cbak;
            return update_track;
	};

	return update_track;
    };

    epeek.track.retriever.async = function () {
	var url = '';
	var callback   = function () { throw 'The callback should be defined' };

	var update_track = function (obj) {
	    console.log("ISSUEING XHR");
	    d3.xhr(url, callback); 
	};

	update_track.url = function (str) {
	    if (!arguments.length) {
		return url;
	    }
	    url = str;
	    return update_track;
	};

	// https://github.com/mbostock/d3/wiki/Requests#d3_xhr
	// [...] the callback is invoked with two arguments: the error, if any, and the XMLHttpRequest object representing the response.
	update_track.callback = function (cbak) {
	    if (!arguments.length) {
		return callback;
	    }
	    callback = cbak;
	    return update_track;
	};

	return update_track;
    };

    epeek.track.retriever.ensembl = function() {
	var success = [function () {}];
	var fail = function () {};
	var endpoint;
	var eRest = epeek.eRest();
	var update_track = function(obj) {
            // Object has loc and a plug-in defined callback
            var loc         = obj.loc;
            var plugin_cbak = obj.on_success;
            eRest.call({url     : eRest.url[endpoint](loc),
			success : function (resp) {
                            elements = resp;

                        // User-defined
                            for (var i=0; i<success.length; i++) {
				success[i](resp);
                            };

                        // Plug-in defined
                            plugin_cbak();
			}
                       });

	};

	update_track.endpoint = function (u) {
            if (!arguments.length) {
		return endpoint;
            }
            endpoint = u;
            return update_track;
	};

    // TODO: We don't have a way of resetting the success array
    // TODO: Should this also be included in the sync retriever?
    // Still not sure this is the best option to support more than one callback
	update_track.success = function (callback) {
            if (!arguments.length) {
		return success;
            }
            success.push(callback);
            return update_track;
	};

	update_track.fail = function (callback) {
            if (!arguments.length) {
		return fail;
            }
            fail = callback;
            return update_track;
	}
	return update_track;
    };


    return track_data;
};


// A predefined track for genes
epeek.track.data.gene = function () {
    var track = epeek.track.data()
	.index("ID");

    var updater = epeek.track.retriever.ensembl()
	.endpoint("region")
    // TODO: If success is defined here, means that it can't be user-defined
    // is that good? enough? API?
    // Now success is backed up by an array
	.success(function(genes) {
	    for (var i = 0; i < genes.length; i++) {
		if (genes[i].strand === -1) {  
		    genes[i].display_label = "<" + genes[i].external_name;
		} else {
		    genes[i].display_label = genes[i].external_name + ">";
		}
	    }
	});

    return track.update(updater);
}


// A predefined track displaying no external data
// it is used for location and axis tracks for example
epeek.track.data.empty = function () {

    var track = epeek.track.data();
    var updater = epeek.track.retriever.sync();
    track.update(updater);

    return track;
};


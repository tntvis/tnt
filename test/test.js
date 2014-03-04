// var assert = require("assert")
// describe('Array', function(){
//   describe('#indexOf()', function(){
//     it('should return -1 when the value is not present', function(){
//       assert.equal(-1, [1,2,3].indexOf(5));
//       assert.equal(-1, [1,2,3].indexOf(0));
//     })
//   })
// })

// var assert = require("chai").assert;
// var d3     = require("../lib/d3.min").d3;
// var epeek  = require("../ePeek").epeek;

describe("DOM Tests", function () {
    var el = document.createElement("div");
    el.id = "myDiv";
    el.innerHTML = "Hi there!";
    el.style.background = "#ccc";
    document.body.appendChild(el);
 
    var myEl = document.getElementById('myDiv');
    it("is in the DOM", function () {
	assert.notEqual(myEl, null);
        // expect(myEl).to.not.equal(null);
    });
 
    it("is a child of the body", function () {
	assert.equal(myEl.parentElement, document.body);
        // expect(myEl.parentElement).to.equal(document.body);
    });
 
    it("has the right text", function () {
	assert.equal(myEl.innerHTML, "Hi there!", "Correct text");
        // expect(myEl.innerHTML).to.equal("Hi there!");
    });
 
    it("has the right background", function () {
	assert.equal(myEl.style.background, "rgb(204, 204, 204)", "Correct background color");
        // expect(myEl.style.background).to.equal("rgb(204, 204, 204)");
    });
});

describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    })
  })
})

describe('ePeek', function () {
    // ePeek REST
    describe('ePeek REST', function () {
	it("Exists and is called eRest", function () {
	    assert.isDefined(epeek.eRest);
	})
	var rest = epeek.eRest();
	it("Has a region limit", function () {
	    assert.isDefined(rest.limits);
	    assert.isDefined(rest.limits.region);
	})

	it("Has a url submodule", function () {
	    assert.isDefined(rest.url)
	})

	describe('Data retrieval', function () {
	    describe('Ensembl Gene Ids', function () {
		it("Has a url.gene field", function () {
		    assert.isDefined(rest.url.gene)
		})
		var gene_url = rest.url.gene({id:"ENSG00000139618"});
		it("Has the correct url", function () {
		    assert.equal(gene_url, "http://beta.rest.ensembl.org/lookup/id/ENSG00000139618.json?format=full")
		})
		it("Retrieves gene from ensembl ID", function (done) {
		    rest.call ({ url : gene_url,
				 success : function (resp) {
				     assert.equal(resp.id, "ENSG00000139618");
				     assert.equal(resp.display_name, "BRCA2");
				     assert.equal(resp.species, "homo_sapiens");
				     assert.equal(resp.object_type, "Gene");
				     assert.equal(resp.biotype, "protein_coding");
				     assert.equal(resp.strand, 1);
				     assert.equal(resp.seq_region_name, 13);
				     done();
				 }
				})
		})
		it("Fires the error callback on wrong url", function (done) {
		    rest.call( { url : gene_url + "xxxxx", // wrong url
				 error : function (err) {
				     assert.isDefined(err);
				     assert.equal(err.status, 400);
				     assert.equal(err.readyState, 4);
				     assert.equal(err.statusText, "Bad Request");
				     done();
				     }
			       });
		    assert.isTrue(rest.connections() > 0);
		})
	    })

	    describe("Ensembl Region", function () {
		it("Has a url.region field", function () {
		    assert.isDefined(rest.url.region);
		})
		var region_url = rest.url.region({"species" : "homo_sapiens",
						  "chr"     : 13,
						  "from"    : 32889611,
						  "to"      : 32973805
						 });
		it ("Has the correct url", function () {
		    assert.equal(region_url, "http://beta.rest.ensembl.org/feature/region/homo_sapiens/13:32889611-32973805.json?feature=gene");
		})
		it("Retrieves regions correctly", function (done) {
		    rest.call( { url : region_url,
			         success : function (resp) {
				     assert.isArray(resp);
				     var ids = _.pluck(resp, 'id');
				     assert.isArray(ids);
				     assert.equal(ids.length, resp.length);
				     done();
				 }
			       });
		})
		it("Fires the error callback on wrong url", function (done) {
		    rest.call( { url : region_url + "xxxxx", // wrong url
				 error : function (err) {
				     assert.isDefined(err);
				     assert.equal(err.status, 400);
				     assert.equal(err.readyState, 4);
				     assert.equal(err.statusText, "Bad Request");
				     done();
				     }
			       });
		    assert.isTrue(rest.connections() > 0);
		})
	    })
	})
    })
  
    // ePeek Genome
    describe('ePeek Genome', function () {
	before (function () {
	    // Creation of the container
	    var container = document.createElement("div");
	    container.id = "genomeBrowser";
	    document.body.appendChild(container);
	})

	var gbrowser = epeek.genome();

	// API

	// General tests
	it('creates a genome browser', function () {
	    gbrowser(document.getElementById('genomeBrowser'));
	});
    })
})


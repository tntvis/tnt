// var assert = require("assert")
// describe('Array', function(){
//   describe('#indexOf()', function(){
//     it('should return -1 when the value is not present', function(){
//       assert.equal(-1, [1,2,3].indexOf(5));
//       assert.equal(-1, [1,2,3].indexOf(0));
//     })
//   })
// })

var assert = require("chai").assert;
var d3     = require("../lib/d3.min").d3;
var epeek  = require("../ePeek").epeek;

describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    })
  })
})

describe('ePeek', function () {
    var gbrowser = epeek.genome();
    it('creates a genome browser', function () {
	gbrowser(document.getElementById('genome_browser'));
    });
})
/** 
@fileOverview e!Peek is a genome browser javascript plug-in. It is very easy to embed in client web pages and configure. The genomic information comes from {@link http://www.ensembl.org|Ensembl} via its {@link http://beta.rest.ensembl.org|REST API}.<br /><br />
e!Peek typically consists of two components: the <i>core</i> plug-in and a <i>theme</i> that interacts with it. Here you will find the API of the core plugin and several of the themes provided by default.
<br />
<ul>
<li><a href="ePeek.html">ePeek</li>
<li><a href="epeek.eRest.html">epeek.eRest</li>
</ul>
<br />

@example
    // Typically, the plug-in is used as follows:
    var gB = epeek().width(920); // other methods can be included here
    var gBTheme = epeek_theme(); // other methods can be included here
    gBTheme(gB, document.getElementById('DOM_element_id');
@author Miguel Pignatelli
*/

"use strict";
var epeek = {};

d3.selection.prototype.moveToFront = function() { 
  return this.each(function() { 
    this.parentNode.appendChild(this); 
  }); 
};

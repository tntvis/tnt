var express = require("express");
var logger = require("morgan");
var bodyParser = require('body-parser');
var path = require('path');
var port = parseInt(process.env.PORT, 10) || 1337;

// canvas server-side
var img = require('./canvas/canvas_server');

var server = express();

server.use(logger('dev'));
server.use(bodyParser.json());
server.use(express.static(__dirname + "/.."));


// image
server.route('/board/')
    .post (function (req, res) {
	console.log("IN ROUTE BOARD");
	console.log(req.body.from);
	console.log(req.body.to);

	// Image creation
	img.width(req.body.width);
	img.height(req.body.height);
	// TODO: bgColor?
	img.tracks(req.body.tracks);

	img(req.body.from, req.body.to);

	// Answer to the client
	res.header('Content-Type', 'application/json');
	res.send ({"response": "back"});
    });


server.listen(port);

console.log("Server running at http://localhost:" + port + "/")

var express = require('express');
var socket = require('socket.io');
var http = require('http');
// var fs = require('fs');
var fs = require('graceful-fs');
var path = require('path');
var app = express();
var server = http.createServer(app)
var io = require('socket.io').listen(server);
var THREE = require('three');
// Read and eval library
filedata = fs.readFileSync('./node_modules/three/examples/js/loaders/STLLoader.js','utf8');
eval(filedata)

// Disable Debug Logging
io.set('log level', 1);

var extension = 'ES';
var clustering = undefined;

function startServer() {
	// Create Clustering Object with mesh name indices list
	getMeshNameIndices(function(meshNameIndices) {
		var Clustering = require('./js/server/Clustering');
		clustering = new Clustering(meshNameIndices);
	});
	loadAllMeshesAsync(startListening);
}

function startListening() {
	getMeshNameIndices();
	// Configure the server to use static content
	app.configure(function () {
		app.use(
			"/", //the URL throught which you want to access to you static content
			express.static(__dirname) //where your static content is located in your filesystem
		);
	});

	server.listen(8081);
	console.log("Started listening on Port 8081");

	// Handle Client connection
	io.sockets.on('connection', function (socket) {
		socket.on('myEvent', function (data) {
			console.log(data);
		});

		socket.on('requestMeshFileNames', function (data) {
			getMeshFileNamesAsync(function(files) {
				socket.emit('getMeshFileNames', files);
			});
		});
		
		socket.on('requestStlFile', function(filename){
			getMeshFileAsync(filename, function(data) {
				socket.emit('getStlFile', data);
			});
		});

		socket.on('debug', function(){
			//console.log(allMeshes);
			console.log(Object.keys(allMeshes).length);
		});

		socket.on('requestClustering', function(emittedData, name) {
			// Clustering
			//console.log(emittedData);
			clustering.cluster(emittedData, function(output, data) {
				var result = {};
				result.clusters = output;
				result.emittedData = data;
				socket.emit('getClustering', result);
			});
		});

		socket.on('dumpMeshArray', function() {
			dumpMeshesToJSON();
		});

		socket.on('requestGlobalMeanShape', function(){
			console.log("Processing Request: requestGlobalMeanShape");
			//console.log(getGlobalMeanShape());
			socket.emit('getGlobalMeanShape', JSON.stringify(getGlobalMeanShape()));
		});

		socket.on('requestMeanShape', function(emittedData){
			console.log("Processing Request: requestMeanShape");
			console.log("elements.domId: " + emittedData.domId);
			var mean = getMeanShape(emittedData.elements);
			// var mean = getGlobalMeanShape();
			var result = {};
			result.mean = mean;
			result.domId = emittedData.domId;
			result.settings = emittedData.settings;
			console.log("Emitting getMeanShape");
			socket.emit('getMeanShape', result);
		});
	});
}

var getMeshFileAsync = function(filename, callback) {
	fs.readFile('./data/COR_ES/' + filename, 'utf8', function (err,data) {
		if (err)
			return console.log(err);
		else
			callback(data, filename);
	});
}

var getSHIPDatasetAsync = function(callback) {
	fs.readFile('./data/ship-data/data/shipdata/SHIP_2012_D_S2_20121129/SHIP_2012_D_S2_20121129.json', 'utf8', function (err,data) {
		if (err)
			return console.log(err);
		else
			callback(JSON.parse(data));
	});
}

var getMeshFileNamesAsync = function(callback) {
	fs.readdir('./data/COR_ES/', function(err, files) {
		if (err)
			return console.log(err);
		else
		{
			// Filter STL Files
			for (var i in files)
				if(path.extname(files[i]) != ".stl")
					files.splice(i, 1);

			callback(files);
		}
	});
}

var getMeshNameIndices = function(callback) {
	getMeshFileNamesAsync(function(files) {
		var meshNameIndices = {};
		meshNameIndices.shipToMatlab = {};
		meshNameIndices.matlabToShip = {};
		for (var i = 0; i < files.length; i++){
			var shipId = files[i].split('_MESH_COR_ES.')[0];
			// Tracks which Name has which ID (for Clustering)
			meshNameIndices.shipToMatlab[shipId] = i + 1;
			meshNameIndices.matlabToShip[i + 1] = shipId;
		}
		// Run Callback
		if (callback != undefined)
			callback(meshNameIndices);
	});
}
// Mesh Processing
var loadAllMeshesAsync = function(callback) {
	// Get SHIP Dataset to know which subjects need to be loaded
	getSHIPDatasetAsync(function(ship) {
		// Convert to Index Dataset
		var validIds = {};
		for (var i = 0; i < ship['zz_nr'].data.length; i++)
			validIds[ship['zz_nr'].data[i]] = true;
		
		getMeshFileNamesAsync(function(files) {
			// preprocess files array to only include meshes needed
			validFiles = [];
			for (var i = 0; i < files.length; i++)
				if (validIds.hasOwnProperty(files[i].split('_MESH_COR_ES.')[0]))
					validFiles.push(files[i]);
			files = validFiles;
			
			counter = 0; // Keeps track on how many files 
			allMeshes = {};
			var loader = new THREE.STLLoader();
			for (var i = 0; i < files.length; i++) {
				getMeshFileAsync(files[i], function(data, filename){
					allMeshes[filename.split('_MESH_COR_ES.')[0]] = loader.parseASCII(data);
					counter = counter + 1;
					console.log(counter + "/" + files.length + " meshes parsed");
					if (counter == files.length)
					// if (counter == 100)
						callback();
				});
			}
		});
	});
}

var getMeanShape = function(elements) {
	/* Elements Array should be a list of the Subject IDs */

	var mean = new THREE.Geometry;
	var meshNameArray = Object.keys(allMeshes);
	mean.faces = allMeshes[meshNameArray[0]].faces;
	// initialize mean with empty vectors
	for (var i = 0; i < allMeshes[meshNameArray[0]].vertices.length; i++)
		mean.vertices.push(new THREE.Vector3());

	var meshCount = 0;
	for (var i = 0; i < elements.length; i++) { // Parse all Files
		if (allMeshes.hasOwnProperty(elements[i])){
			meshCount = meshCount + 1;
			for (var j = 0; j < mean.vertices.length; j++) { // Parse all Vertices
				mean.vertices[j].x = mean.vertices[j].x + allMeshes[elements[i]].vertices[j].x;
				mean.vertices[j].y = mean.vertices[j].y + allMeshes[elements[i]].vertices[j].y;
				mean.vertices[j].z = mean.vertices[j].z + allMeshes[elements[i]].vertices[j].z;
			}
		}
	}
	for (var j = 0; j < mean.vertices.length; j++) { // Parse all Vertices
		mean.vertices[j].x = mean.vertices[j].x / meshCount;
		mean.vertices[j].y = mean.vertices[j].y / meshCount;
		mean.vertices[j].z = mean.vertices[j].z / meshCount;
	}

	console.log("MeshCount: " + meshCount);
	return mean;
}

var getGlobalMeanShape = function() {
	var mean = new THREE.Geometry;
	var meshNameArray = Object.keys(allMeshes);
	mean.faces = allMeshes[meshNameArray[0]].faces;
	// initialize mean with empty vectors
	for (var i = 0; i < allMeshes[meshNameArray[0]].vertices.length; i++)
		mean.vertices.push(new THREE.Vector3());

	for (var i = 0; i < meshNameArray.length; i++) { // Parse all Files
		for (var j = 0; j < mean.vertices.length; j++) { // Parse all Vertices
			mean.vertices[j].x = mean.vertices[j].x + allMeshes[meshNameArray[i]].vertices[j].x;
			mean.vertices[j].y = mean.vertices[j].y + allMeshes[meshNameArray[i]].vertices[j].y;
			mean.vertices[j].z = mean.vertices[j].z + allMeshes[meshNameArray[i]].vertices[j].z;
		}
	}

	for (var j = 0; j < mean.vertices.length; j++) { // Parse all Vertices
		mean.vertices[j].x = mean.vertices[j].x / meshNameArray.length;
		mean.vertices[j].y = mean.vertices[j].y / meshNameArray.length;
		mean.vertices[j].z = mean.vertices[j].z / meshNameArray.length;
	}

	// mean.computeFaceNormals();
	// mean.computeVertexNormals();
	// mean.computeBoundingBox();
	return mean;
}

var dumpMeshesToJSON = function() {
	var outputFilename = './data/meshes.json';

	// fs.writeFile(outputFilename, JSON.stringify(allMeshes, null, 4), function(err) {
	fs.writeFile(outputFilename, JSON.stringify(allMeshes), function(err) {
		if(err)
			console.log(err);
		else
			console.log("Dumped JSON to " + outputFilename);
	}); 
}

startServer();
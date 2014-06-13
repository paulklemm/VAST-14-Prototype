function MasterRenderer () {
	this._camera = new THREE.PerspectiveCamera( 45, 1, 1, 1000 );
	this._target = new THREE.Vector3();
	this._geometryList = {};
	this._rendererList = {};
	this._meshToRendererAssociation = {};
	this._RendererToMeshAssociation = {};
	this._currentReferenceMesh = undefined;
	// Save Time on Mouse Down for renderer - used for click logic
	this._mouseDownTime = 0;
}

MasterRenderer.prototype.calculateGlobalMean = function() {
	var elements = [];
	for (var i = 0; i < myApp._data.zz_nr.data.length; i++)
		elements.push(myApp._data.zz_nr.data[i]);

	myApp._serverCommunication.getMeanShapeAsync(elements, undefined, undefined, function(result) {
		this._geometryList['globalMean'] = result.mean;
		this._currentReferenceMesh = this._geometryList['globalMean'];
		console.log("Calculating global mean done");
	}.bind(this));
}

//myApp._masterRenderer.setNewReferenceMesh(myApp._masterRenderer._geometryList['#vis0 #renderWindow_0'])
MasterRenderer.prototype.setNewReferenceMesh = function(mesh) {
	if (mesh != undefined) {
		// Set to Mean Mesh if the given Mesh is the same!
		if (mesh.id == this._currentReferenceMesh.id)
			this._currentReferenceMesh = this._geometryList['globalMean'];
		else
			this._currentReferenceMesh = mesh;

		debug = false;
		if (debug) console.log("Reference ID: " + mesh.id);
		var material = new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
		var geometryKeys = Object.keys(this._geometryList);
		for (var i = 0; i < geometryKeys.length; i++) {
			if (geometryKeys[i] != 'globalMean') {
				if (debug) console.log(geometryKeys[i] + " ID: " + this._geometryList[geometryKeys[i]].id);
				this.setDifferenceVertexColors(this._geometryList[geometryKeys[i]], this._currentReferenceMesh);
				this._rendererList[ this._meshToRendererAssociation[geometryKeys[i]] ].replaceGeometry(this._geometryList[geometryKeys[i]]);
			}
		}
	}
}

MasterRenderer.prototype.calculateMean = function(elements, domId, settings) {
	// console.log("elements");
	// console.log(elements);
	myApp._serverCommunication.getClusteringAsync(elements, domId, settings, function(result) {
		// console.log("Printing Clustering Result");
		// console.log(result);
		//myApp.addClusteringResultToDataset(result.clusters, result.emittedData.variables);
		// console.log("Clustering: Put Name " + result.emittedData.settings.name);
		myApp.addClusteringResultToDataset(result.clusters, result.emittedData.settings.name);
	});

	// console.log("Calculating Mean for domId " + domId);
	myApp._serverCommunication.getMeanShapeAsync(elements, domId, settings, function(result) {
		// Create Renderer
		this._geometryList[result.domId] = result.mean;

		// Calculate Color Scale if wanted
		if (result.settings != undefined && result.settings.calculateMean != undefined)
			this.setDifferenceVertexColors(this._geometryList[result.domId], this._geometryList[result.settings.calculateMean]);
		else // Set Color from differences to global mean
			this.setDifferenceVertexColors(this._geometryList[result.domId], this._currentReferenceMesh);
		
		var myRenderer = new Renderer(result.domId, result.mean, undefined, undefined, result.settings.vis, 'renderer_' + Object.keys(this._rendererList).length);
		// Add it to Renderer List
		this._rendererList[myRenderer._renderer.domElement.getAttribute('id')] = myRenderer;
		this._RendererToMeshAssociation[myRenderer._renderer.domElement.getAttribute('id')] = result.domId;
		this._meshToRendererAssociation[result.domId] = myRenderer._renderer.domElement.getAttribute('id');

	// TODO: Calculate differences in Odds Ratios!
	if(myApp._calculateOddsRatios)
		console.log(myApp._oddsRatioTableMatrix.compare(new OddsRatioTableMatrix(elements, myApp._data)));
	// console.log(myApp._statistics.getCramerRankingList(myApp._data, elements));
	}.bind(this));
}

MasterRenderer.prototype.setDifferenceVertexColors = function(geometry1, geometry2) {
	if (geometry1 != undefined && geometry2 != undefined) {
	// Create Color Scale
	var colorScale = d3.scale.linear().domain([0,4]).range(["blue","red"]);
	for (var i = 0; i < geometry1.faces.length; i++) { // Parse all Vertices
		var differenceA = 0;
		var differenceB = 0;
		var differenceC = 0;
		// geometry1.faces[i].vertexColors[0]
		differenceA = differenceA + Math.abs(geometry1.vertices[geometry1.faces[i].a].x - geometry2.vertices[geometry2.faces[i].a].x);
		differenceA = differenceA + Math.abs(geometry1.vertices[geometry1.faces[i].a].y - geometry2.vertices[geometry2.faces[i].a].y);
		differenceA = differenceA + Math.abs(geometry1.vertices[geometry1.faces[i].a].z - geometry2.vertices[geometry2.faces[i].a].z);
		geometry1.faces[i].vertexColors[0] = new THREE.Color(colorScale(differenceA / 3));
		// geometry2.faces[i].vertexColors[0] = new THREE.Color(colorScale(differenceA / 3));

		differenceB = differenceB + Math.abs(geometry1.vertices[geometry1.faces[i].b].x - geometry2.vertices[geometry2.faces[i].b].x);
		differenceB = differenceB + Math.abs(geometry1.vertices[geometry1.faces[i].b].y - geometry2.vertices[geometry2.faces[i].b].y);
		differenceB = differenceB + Math.abs(geometry1.vertices[geometry1.faces[i].b].z - geometry2.vertices[geometry2.faces[i].b].z);
		geometry1.faces[i].vertexColors[1] = new THREE.Color(colorScale(differenceB / 3));
		// geometry2.faces[i].vertexColors[1] = new THREE.Color(colorScale(differenceB / 3));

		differenceC = differenceC + Math.abs(geometry1.vertices[geometry1.faces[i].c].x - geometry2.vertices[geometry2.faces[i].c].x);
		differenceC = differenceC + Math.abs(geometry1.vertices[geometry1.faces[i].c].y - geometry2.vertices[geometry2.faces[i].c].y);
		differenceC = differenceC + Math.abs(geometry1.vertices[geometry1.faces[i].c].z - geometry2.vertices[geometry2.faces[i].c].z);
		geometry1.faces[i].vertexColors[2] = new THREE.Color(colorScale(differenceC / 3));
		// geometry2.faces[i].vertexColors[2] = new THREE.Color(colorScale(differenceC / 3));
	}

	geometry1.colorsNeedUpdate = true;
	geometry2.colorsNeedUpdate = true;

	var result = {};
	result.geometry1 = geometry1
	result.geometry2 = geometry2
	return result;
	}
}
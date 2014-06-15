// Constructor
function Renderer(containerId, geometry, width, height, vis, name){
	this._containerId = containerId;
	this._geometry = this.processOlderGeometry(geometry);
	this._width = width;
	this._height = height;
	this._vis = vis;
	this._name = name;
	this._enlarged = false;
	this._scene = undefined;
	this._controls = undefined;
	this.init();
}

Renderer.prototype.removeMesh = function() { 
	this._scene.remove(this._scene.getObjectByName('meanmesh'));
}

Renderer.prototype.replaceGeometry = function(geometry) {
	this.removeMesh();
	this._geometry = this.processOlderGeometry(geometry);
	var material = new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );

	var mesh = new THREE.Mesh(this._geometry, material);
	mesh.rotation.set( 90, 0, - Math.PI / 2);
	mesh.name = "meanmesh";
	debugMeshList.push(mesh);
	this._scene.add( mesh );
	this.render();
}

Renderer.prototype.processOlderGeometry = function(geometry) {
	var newGeometry = new THREE.Geometry;
	newGeometry.faces = geometry.faces;
	newGeometry.vertices = geometry.vertices;
	return newGeometry;
}

Renderer.prototype.init = function(){
	var debug = false;
	var angularSpeed = 0.2; 
	var lastTime = 0;

	// this function is executed on each animation frame
	// function animate(){
	// 	// update
	// 	var time = (new Date()).getTime();
	// 	var timeDiff = time - lastTime;
	// 	var angleChange = angularSpeed * timeDiff * 2 * Math.PI / 1000;
	// 	// cube.rotation.y += angleChange;
	// 	// mesh.rotation.y += angleChange;
	// 	mesh.rotation.z += angleChange;
	// 	lastTime = time;

	// 	// render
	// 	renderer.render(scene, camera);

	// 	// request new frame
	// 	requestAnimationFrame(function(){
	// 		animate();
	// 	});
	// }

	function animate() {

		requestAnimationFrame( animate );
		controls.update();

	}

	function render() {

		mesh.geometry.colorsNeedUpdate = true;
		renderer.render( scene, camera );
		//stats.update();

	}


	// renderer
	var renderer = new THREE.WebGLRenderer({ alpha: true });
	renderer.setClearColor( 0x000000, 0 ); // Make it transparent
	var width = undefined;
	var size = 0;
	if ($(this._containerId).height() > $(this._containerId).width())
		size = $(this._containerId).width();
	else
		size = $(this._containerId).height();

	// Override if it is for barcharts
	if (this._vis == "barchart") {
		size = $(this._containerId).width();
	}

	if (this._width == undefined)
		// width = $(this._containerId).width();
		// width = $(this._containerId).height();
		width = size;
	else
		width = this._width;
	var height = undefined;
	if (this._height == undefined)
		// height = $(this._containerId).height();
		height = size;
	else
		height = this._height;
	// var height = $(this._containerId).width();//%$(this._containerId).height();
	renderer.setSize(width, height);
	debugDOM = renderer.domElement;

	// camera
	var camera = myApp._masterRenderer._camera;
	// var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
	//var camera = new THREE.OrthographicCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
	// camera = new THREE.PerspectiveCamera( 45, width / height, 1, 1000 )
	// var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
	camera.aspect = 1;
	camera.updateProjectionMatrix();

	camera.position.z = 250;
	debugCamera = camera;

	var controls = new THREE.TrackballControls( camera, renderer.domElement, myApp._masterRenderer._target );
	// var controls = new THREE.OrbitControls( camera, renderer.domElement );

	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [ 65, 83, 68 ];

	this.render = render;

	controls.addEventListener( 'change', render );

	var scene = new THREE.Scene();
	if (debug) console.log("Scene: " + scene.id + " belongs to " + this._containerId);
	if (debugScene == undefined)
		debugScene = scene;

	// add subtle blue ambient lighting
	var ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight);
	// directional lighting
	// var directionalLight = new THREE.DirectionalLight(0xffffff);
	// directionalLight.position.set(1, 1, 1).normalize();
	// scene.add(directionalLight);

	// var loader = new THREE.STLLoader();
	// var material = new THREE.MeshPhongMaterial( { ambient: 0xff5533, color: 0xff5533, specular: 0x111111, shininess: 200 } );
	var material = new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
	// var materials = [
	// 	new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } ),
	// 	new THREE.MeshBasicMaterial( { color: 0x000000, shading: THREE.FlatShading, wireframe: true, transparent: true } )
	// ];
	// console.log(geometry);
	var mesh = new THREE.Mesh(this._geometry, material);
	mesh.rotation.set( 90, 0, - Math.PI / 2);
	mesh.name = "meanmesh";
	debugMeshList.push(mesh);
	scene.add( mesh );
	// // mesh.scale.set( 3, 3, 1 );
	// mesh.scale.set( 1, 1, 1 );

	drawGrid = false;
	if (drawGrid)
	{
		// Grid

		var _geometry = new THREE.Geometry();
		_geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( - 500, 0, 0 ) ) );
		_geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( 500, 0, 0 ) ) );
		for ( var i = 0; i <= 50; i ++ ) {

			var line = new THREE.Line( _geometry, new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } ) );
			line.position.z = ( i * 10 ) - 100;
			// line.position.y = ( j * 20);
			// scene.add( line );

			var line = new THREE.Line( _geometry, new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } ) );
			line.position.x = ( i * 10 ) - 100;
			line.rotation.y = 90 * Math.PI / 180;
			scene.add( line );

		}
		for ( var i = 0; i <= 50; i ++ ) {

			var line = new THREE.Line( _geometry, new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } ) );
			line.position.y = ( i * 10 ) - 100;
			// line.position.y = ( j * 20);
			// scene.add( line );

			var line = new THREE.Line( _geometry, new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } ) );
			line.position.y = ( i * 10 ) - 100;
			line.rotation.x = 90 * Math.PI / 180;
			scene.add( line );

		}
	}
	animate();
	$(this._containerId).append(renderer.domElement);
	myRenderer = renderer;
	this._renderer = renderer;
	this._renderer.domElement.setAttribute('id', this._name);
	this._width = parseInt(this._renderer.domElement.getAttribute('width'));
	this._height = parseInt(this._renderer.domElement.getAttribute('height'));
	this._scene = scene;
	this._controls = controls;
	this.appendMouseEvents(this._renderer);
}

Renderer.prototype.appendMouseEvents = function(renderer) {
	
	renderer.domElement.addEventListener('dblclick', function(e) { 
		var rendererName = e.toElement.getAttribute('id');
		var thisMeshName = myApp._masterRenderer._RendererToMeshAssociation[rendererName];
		var thisMesh = myApp._masterRenderer._geometryList[thisMeshName];
		myApp._masterRenderer.setNewReferenceMesh(thisMesh);

		var foreignObject = e.toElement.parentNode;
		// Now check whether it is a Treeview or a Barchart
		if (foreignObject.getAttribute('vis-type') == 'Barchart') {
			var variable = foreignObject.getAttribute('var');
			var value = foreignObject.getAttribute('id');
			// Create Filter
			var select = {};
			select[variable] = [value];
			myApp._masterFilter.updateFilter(select);
		}
		else {
			var select = {};
			select[foreignObject.getAttribute('var_x')] = [foreignObject.getAttribute('id_x')];
			select[foreignObject.getAttribute('var_y')] = [foreignObject.getAttribute('id_y')];
			myApp._masterFilter.updateFilter(select);
		}
	});

	renderer.domElement.addEventListener('mousedown', function(e) { 
		myApp._masterRenderer._mouseDownTime = new Date().getTime();
	});

	renderer.domElement.addEventListener('mouseup', function(e) {
		// Check if it was a click or a camera movement depending on the time passed
		// between mousedown and mouseup event
		var currentTime = new Date().getTime();
		if (currentTime - myApp._masterRenderer._mouseDownTime < 400) {
			var rendererName = e.toElement.getAttribute('id');
			var _renderer = myApp._masterRenderer._rendererList[rendererName];
			var width = _renderer._width;
			var height = _renderer._height;
			if (_renderer._enlarged) {
				_renderer._renderer.setSize(width,height);
				_renderer._enlarged = false;
			}
			else {
				_renderer._renderer.setSize(300,300);
				_renderer._enlarged = true;
			}
			_renderer.render();
		}
	});
}
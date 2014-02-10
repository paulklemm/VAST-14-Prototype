// Constructor
function Renderer(containerId, geometry){
	this._containerId = containerId;
	this._geometry = this.processOlderGeometry(geometry);
	console.log(this._geometry);
	console.log("Renderer " +  this._containerId);
	this.init();
}

Renderer.prototype.processOlderGeometry = function(geometry) {
	var newGeometry = new THREE.Geometry;
	newGeometry.faces = geometry.faces;
	newGeometry.vertices = geometry.vertices;
	return newGeometry;
}

Renderer.prototype.init = function(){
	var angularSpeed = 0.2; 
	var lastTime = 0;

	// this function is executed on each animation frame
	function animate(){
		// update
		var time = (new Date()).getTime();
		var timeDiff = time - lastTime;
		var angleChange = angularSpeed * timeDiff * 2 * Math.PI / 1000;
		// cube.rotation.y += angleChange;
		// mesh.rotation.y += angleChange;
		mesh.rotation.z += angleChange;
		lastTime = time;

		// render
		renderer.render(scene, camera);

		// request new frame
		requestAnimationFrame(function(){
			animate();
		});
	}

	// renderer
	var renderer = new THREE.WebGLRenderer({ alpha: true });
	renderer.setClearColor( 0x000000, 0 ); // Make it transparent
	var width = $(this._containerId).width();
	var height = $(this._containerId).height();
	renderer.setSize(width, height);
	$(this._containerId).append(renderer.domElement);

	// camera
	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.z = 250;

	var scene = new THREE.Scene();

	// add subtle blue ambient lighting
	var ambientLight = new THREE.AmbientLight(0x000044);
	scene.add(ambientLight);
	// directional lighting
	var directionalLight = new THREE.DirectionalLight(0xffffff);
	directionalLight.position.set(1, 1, 1).normalize();
	scene.add(directionalLight);

	var loader = new THREE.STLLoader();
	var material = new THREE.MeshPhongMaterial( { ambient: 0xff5533, color: 0xff5533, specular: 0x111111, shininess: 200 } );
	// console.log(geometry);
	var mesh = new THREE.Mesh(this._geometry, material);

	mesh.rotation.set( 90, 0, - Math.PI / 2);
	mesh.scale.set( 3, 3, 1 );

	// mesh.castShadow = true;
	// mesh.receiveShadow = true;

	scene.add( mesh );

	animate();
}
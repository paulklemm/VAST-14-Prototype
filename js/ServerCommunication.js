var ServerCommunicationHelper = {};

// Constructor
function ServerCommunication(serverAddress){
	this._socket = io.connect(serverAddress);
}

ServerCommunication.prototype.helperEmitCommand = function(emitter, listener, callback, emitterData) {
	// Disconnect old listener functions
	this._socket.removeAllListeners(listener);
	// Connect new listener function
	this._socket.on(listener, callback);
	// Emit signal to Node Server
	if (emitterData == undefined)
		this._socket.emit(emitter);
	else
		this._socket.emit(emitter, emitterData);
};

ServerCommunication.prototype.getMeshFileNamesAsync = function(callback){
	// Callback Variables: 'data': contains all filenames as Array
	this.helperEmitCommand('requestMeshFileNames', 'getMeshFileNames', callback);
};

ServerCommunication.prototype.getStlFileAsync = function(filename, callback){
	this.helperEmitCommand('requestStlFile', 'getStlFile', callback, filename);
};

ServerCommunication.prototype.getGlobalMeanShapeAsync = function(callback){
	this.helperEmitCommand('requestGlobalMeanShape', 'getGlobalMeanShape', callback);
};

ServerCommunication.prototype.getMeanShapeAsync = function(elements, domId, callback){
	var emitterData = {};
	emitterData.elements = elements;
	emitterData.domId = domId;
	this.helperEmitCommand('requestMeanShape', 'getMeanShape', callback, emitterData);
};
function PivotTable (containerSelector, data, dataVariables) {
	this._container = containerSelector;
	this._data = data;
	this._dataVariables = dataVariables;
	this.update(dataVariables);
	
	// if (dataVariables != undefined)
	// 	this._pivotUI = this.create(this.convertDataset(data, dataVariables));
}

PivotTable.prototype.update = function(dataVariables) {
	if (dataVariables == undefined)
		return;
	// Get Configuration
	if (this._pivotUI != undefined) {
		var configuration = this._pivotUI.data().pivotUIOptions;
		// Remove Pivot Table
		$(this._container + " table").remove();
		// and create the new one
		this._dataVariables = this._dataVariables.concat(dataVariables);
		this._pivotUI = this.create(this.convertDataset(this._data, this._dataVariables), configuration.rows, configuration.cols);
	}
	else {
		this._dataVariables = dataVariables;
		this._pivotUI = this.create(this.convertDataset(this._data, this._dataVariables));
	}
}

PivotTable.prototype.convertDataset = function(dataset, dataKeys) {
	// var dataKeys = Object.keys(dataset);
	var pivotDataset = new Array(dataset[dataKeys[0]].data.length);
	for (var i = 0; i < pivotDataset.length; i++)
		pivotDataset[i] = {};

	for (var i = 0; i < dataKeys.length; i++)
		for (var j = 0; j < pivotDataset.length; j++)
			// pivotDataset[j][dataset[dataKeys[i]].description.detail] = dataset[dataKeys[i]].description.dictionary[dataset[dataKeys[i]].data[j]];
		pivotDataset[j][dataset[dataKeys[i]].name] = dataset[dataKeys[i]].description.dictionary[dataset[dataKeys[i]].data[j]];
	return pivotDataset;
}

PivotTable.prototype.create = function(data, rows, columns) {
	if (rows == undefined)
		rows = [];
	if (columns == undefined)
		columns = [];
	return $(this._container).pivotUI(data, { rows: rows, cols: columns });
}
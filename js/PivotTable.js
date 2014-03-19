function PivotTable (containerSelector, data) {
	this._container = containerSelector;
	this.create(this.convertDataset(data, ["S2_CHRO_22A", "SEX_SHIP2", "S2_ALKO_02"]));
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

PivotTable.prototype.create = function(data) {
	$(this._container).pivotUI(data, { rows: ["S2_CHRO_22A"], cols: ["SEX_SHIP2"] });
}
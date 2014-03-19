function OddsRatioTableMatrix(subjects, data) {
	this._matrix = this.getOddsRatioTableMatrix(subjects, data)
}

OddsRatioTableMatrix.prototype.getOddsRatioTableMatrix = function(subjects, data) {
	var variables = Object.keys(data);
	var result = [];
	for (var i = 0; i < variables.length; i++)
		for (var j = 0; j < variables.length; j++)
			if (i != j && j > i) {
				var oddsTable = myApp._statistics.getOddsRatioTable(data[variables[i]], data[variables[j]], subjects);
				// if (oddsTable != undefined && oddsTable.length == 1) {
				// 	console.log("i = " + data[variables[i]].name + "; j = " + data[variables[j]].name);
				// 	console.log("Debug Me!");
				// }
				result.push({'x': variables[i], 'y': variables[j], 'oddsTable': oddsTable});
			}

	//if (subjects == undefined)
		// use all subjects
	return result;
}

OddsRatioTableMatrix.prototype.compare = function(otherOddsRatioTableMatrix) {
	var result = [];
	var cannotCompareCounter = 0;
	for (var i = 0; i < this._matrix.length; i++) {
		var matrixEntryThis = this._matrix[i];
		var matrixEntryOther = otherOddsRatioTableMatrix._matrix[i];
		
		var difference = myApp._statistics.getOddsRatioTableDifference(matrixEntryThis.oddsTable, matrixEntryOther.oddsTable)
		if (difference == -1)
		// if (difference == 0)
			cannotCompareCounter = cannotCompareCounter + 1;
		else
			result.push({'x': matrixEntryThis.x, 'y': matrixEntryThis.y, 'difference': difference});
	}
	console.log("cannotCompareCounter: " + cannotCompareCounter);
	var sorted = result.sort(function(a, b) {return d3.descending(a.difference.difference, b.difference.difference);});
	return sorted;
}
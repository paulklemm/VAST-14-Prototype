function Statistics() {
	this._variablesToIgnore = {"GEBURTSTAG_SHIP2":true, "EXDATE_SHIP2":true, "S2_SOZIO_13":true, "zz_nr":true};
}

Statistics.prototype.createBinsForAllMetricVariables = function(data) {
	var keys = Object.keys(data);
	for (var i = 0; i < keys.length; i++)
		if (data[keys[i]].description.dataType == 'metric')
			this.createBins(data[keys[i]], 4);
}

Statistics.prototype.createBins = function(variable, numberOfBins, debug) {
	if (variable.description.dataType == 'metric') {
		// For metric variables it can be assumed that all entries of the Data Dictionary
		// stand for error Values
		// Might have to check for dictionary here
		var dictionary = variable.description.dictionary;
		// Collect valid entries in the data set
		var validEntries = [];
		variable.invalidIndices = [];
		variable.binnedData = {}; // Attach Object which holds Information about the binning
		variable.binnedData.data = [];
		// If we don't have a Dictionary, the data set is assumed to be valid
		if (dictionary == undefined) // convert entries to Float
			for (var i = 0; i < variable.data.length; i++)
				validEntries.push(parseFloat(variable.data[i]));

		else {
			// iterate over all datasets
			for (var i = 0; i < variable.data.length; i++) {
				var valueAsFloat = parseFloat(variable.data[i]);
				if (!(valueAsFloat in dictionary))
					validEntries.push(valueAsFloat);
				else
					variable.invalidIndices[i] = true;
			}
		}

		var minimum = d3.min(validEntries);
		var maximum = d3.max(validEntries);
		var binSteps = (maximum - minimum) / numberOfBins;
		// Store Description about the bins
		var dictionary = {};
		for (var i = 0; i < numberOfBins; i++)
			dictionary[i] = minimum + (i * binSteps) + " - " + (minimum + ((i + 1) * binSteps));

		// Store the infrormation about the bins
		variable.binnedData.minimum = minimum;
		variable.binnedData.maximum = maximum;
		variable.binnedData.steps = binSteps;
		variable.binnedData.binNumber = numberOfBins;
		variable.binnedData.dictionary = dictionary;


		for (var i = 0; i < variable.data.length; i++)
			if (variable.invalidIndices[i] == undefined)
				// The formula for calculating the bins would be equal to numberOfBins
				// for the highest value, so we intercept this case and set it hard
				if (variable.data[i] == maximum)
					variable.binnedData.data[i] = numberOfBins - 1;
				else
					variable.binnedData.data[i] = parseInt((parseFloat(variable.data[i]) - minimum) / binSteps);

		if (debug != undefined && debug == true) {
			for (var i = 0; i < variable.data.length; i++) {
				console.log("[" + i + "] Binned entry " + variable.data[i] + " to bin " + variable.binnedData.data[i]);
			}
			console.log("Binning " + variable.name + ", " + validEntries.length + "/" + variable.data.length + " entries are valid.");
			console.log("Minimum: " + minimum + ", Maximum: " + maximum + "; Binsteps: " + binSteps);
			console.log("variable.invalidIndices:");
			console.log(variable.invalidIndices);
		}
	}
}

// Statistics.prototype.compareCramersVList = function(listX, listY) {
// 	var result = [];
// 	for (var i = 0; i < listX.length; i++) {
// 		var currentX = listX[i];
// 		var Other = otherOddsRatioTableMatrix._matrix[i];
		
// 		var difference = myApp._statistics.getOddsRatioTableDifference(currentX.oddsTable, Other.oddsTable)
// 		if (difference == -1)
// 		// if (difference == 0)
// 		else
// 			result.push({'x': currentX.x, 'y': currentX.y, 'difference': difference});
// 	}
// 	var sorted = result.sort(function(a, b) {return d3.descending(a.difference.difference, b.difference.difference);});
// 	return sorted;
// }

// Usage
// matrix = myApp._statistics.getCramerVMatrix(myApp._data)
// myApp._statistics.sortCramerVMatrix(matrix, undefined, "vis0renderWindow_1")
Statistics.prototype.sortCramerVMatrix = function(matrix, mode, variable) {
	var sorted;
	if (mode == undefined)
		mode = "descending";
	
	var dimension = matrix[variable];
	var dimensionEntries = d3.entries(dimension);
	// Remove all NaN Values
	for (var i = 0; i < dimensionEntries.length; i++)
		if (isNaN(dimensionEntries[i].value))
			dimensionEntries[i] = undefined;
	
	if (mode == "descending")
		sorted = dimensionEntries.sort(function(a, b) {return d3.ascending(a.value, b.value);});
	return sorted;
}

Statistics.prototype.getCramerVMatrix = function(data, subjects) {
	var variables = Object.keys(data);
	var matrix = {};
	var result = [];
	for (var i = 0; i < variables.length; i++) {
		console.log("Processing Variable " + variables[i]);
		if (this._variablesToIgnore[variables[i]] == undefined)
			for (var j = 0; j < variables.length; j++) {
				// Create Entries for on the very first loop
				if (matrix[variables[j]] == undefined) 
					matrix[variables[j]] = {};

				if (i != j && j > i) {
					var craimersV = this.getCramersVIncremental(data[variables[i]], data[variables[j]], 10, subjects);
					matrix[variables[i]][variables[j]] = craimersV;
					matrix[variables[j]][variables[i]] = craimersV; // Mirror!
					// if (variables[j] == "vis0renderWindow_2")
					// 	console.log(matrix[variables[j]][variables[i]]);

					// if (variables[j] == "vis0renderWindow_2") {
					// 	console.log("matrix[" + variables[j] + "][" + variables[i] + "]");
					// 	console.log(matrix[variables[j]][variables[i]]);
					// }
				}
			}
	}
	// return result;
	return matrix;
}

Statistics.prototype.getCramerRankingList = function(data, subjects) {
	var variables = Object.keys(data);
	console.log(variables);
	var result = [];
	var pair = {'x': undefined, 'y': undefined, 'craimersV': 0};
	for (var i = 0; i < variables.length; i++){
		for (var j = 0; j < variables.length; j++){
			if (i != j && j > i)
			{
				var craimersV = this.getCramersV(data[variables[i]], data[variables[j]], subjects);
				if (!isNaN(craimersV)){
					result.push({'x': variables[i], 'y': variables[j], 'craimersV': craimersV});
					if (craimersV > 0.3)
						// if (variables[j].description.detail == undefined || variables[i].description.detail == undefined)
						// 	console.log({'x': variables[i], 'y': variables[j], 'craimersV': craimersV});
						//else
							console.log({'x': variables[i], 'y': variables[j], 'craimersV': craimersV, 'xDesc': myApp._data[variables[i]].description.detail, 'yDesc': myApp._data[variables[j]].description.detail});
				}
			}
		}
	}
	console.log("Sorting ...");
	var sorted = result.sort(function(a, b) {return d3.descending(a.craimersV, b.craimersV);});
	console.log("Sorting d");
	// return result;
	return sorted;
}

Statistics.prototype.removeFaultyData = function(_data) {
	for (key in _data) {
		var currentElement = _data[key];
		// Do this only if data is not metric!
		if (currentElement.description.dataType != 'metric') {
			currentElement.invalidIndices = new Array();
			for (var j = 0; j < currentElement.data.length; j++) {
				var currentValue = currentElement.data[j];
				// TODO: This needs no be less hacky
				if (currentValue == '9 - noData' || parseFloat(currentValue) > 900 || currentValue.toString() == 'NaN') {
					currentElement.invalidIndices[j] = true;
				}
			}
		}
	}
	return _data;
}

Statistics.prototype.getDimensionsList = function(x) {
	var dimensionsListX = new Array();
	for (var i = 0; i < x.length; i++)
		if (dimensionsListX.indexOf(x[i]) === -1)
			dimensionsListX.push(x[i]);
	return dimensionsListX;
}

Statistics.prototype.getContingencyTable = function(x, y) {
	// Create Count Table (Contingency Table) which makes further calculations easier
	// The Multidimensional array will look like this:
	//          Yes     No     < y
	// ------|-------|-------|
	//  Male |  23   |  12   |
	// Female|  20   |  16   |
	//   ^
	//   x
	//
	// [0][0] = 23; [0][1] = 12; [1][0] = 20; [1][1] = 16;

	// Calculate the number of Dimensions
	var dimensionsListX = this.getDimensionsList(x);
	var dimensionsListY = this.getDimensionsList(y);

	var countTable = new Array();
	for (var i = 0; i < dimensionsListX.length; i++)
	{
		countTable[i] = new Array(dimensionsListY.length);
		for (var j = 0; j < dimensionsListY.length; j++)
			countTable[i][j] = 0;
	}
	// Now start counting
	for (var i = 0; i < x.length; i++)
	{
		var positionX = dimensionsListX.indexOf(x[i]);
		var positionY = dimensionsListY.indexOf(y[i]);
		countTable[positionX][positionY]++;
	}

	// Calculate Totals for Rows and Columns
	var rowTotals = new Array(dimensionsListX.length);
	for (var i = 0; i < dimensionsListX.length; i++)
	{
		rowTotals[i] = 0;
		for (var j = 0; j < dimensionsListY.length; j++)
		 rowTotals[i] += countTable[i][j];
	}
	var columnTotals = new Array(dimensionsListY.length);
	for (var i = 0; i < dimensionsListY.length; i++)
	{
		columnTotals[i] = 0;
		for (var j = 0; j < dimensionsListX.length; j++)
		 columnTotals[i] += countTable[j][i];
	}

	return {"countTable": countTable,
					"rowTotals": rowTotals, 
					"columnTotals": columnTotals,
					"dimensionsListX": dimensionsListX,
					"dimensionsListY": dimensionsListY};
}

Statistics.prototype.getOddsRatioTableDifference = function(tableX, tableY) {
	// Lots of bad things can happen here, so we have to handle with special cases
	// 1. Tables can be undefined - for example if Variable has to many manifestations
	// and therefore the table calculations are way to computation heavy
	if (tableX == undefined || tableY == undefined || tableX.length == 0 || tableY.length == 0)
		return -1;

	// 2. It is also possible that a list is empty - this happens when so many elements are
	// removed that the variable has only one manifestation left 
	//          Yes  
	// ------|-------
	//  Male |  23   
	// Female|  20   
	if ((tableX.length == 1 && tableX[0].length == 0) || (tableY.length == 1 && tableY[0].length == 0))
		return -1;

	var elementsAreMissing = false;
	if (tableX.length != tableY.length || tableX[0].length != tableY[0].length)
		elementsAreMissing = true;

	var lengthX = 0;
	var lengthY = 0;
	if (tableX.length < tableY.length)
		lengthX = tableX.length;
	else 
		lengthX = tableY.length;
	if (tableX[0].length < tableY[0].length)
		lengthY = tableX[0].length;
	else 
		lengthY= tableY[0].length;

	// 3. Elements in the Table can be NaN - which happens when a division 0/0 happens
	// E.g.: [ [12, 11] [0, 0] ] (12 * 0) / (11 * 0)
	// Problem is that Number + NaN = NaN so we have to handle that!
	var difference = 0;
	var cannotCompareCounter = 0;
	for (var i = 0; i < lengthX; i++)
		for (var j = 0; j < lengthY; j++) {
			var currentDifference = Math.abs(tableX[i][j] - tableY[i][j]);
			if (currentDifference == Infinity || isNaN(currentDifference))
				cannotCompareCounter = cannotCompareCounter + 1;
			else
				difference = difference + currentDifference;
		}

	// if (difference == -1 || isNaN(difference) || difference == Infinity)
	if (difference == -1 || isNaN(difference) || difference == Infinity)
		console.log("This is weird!");

	// var numberOfElements = tableX.length * tableX[0].length;
	var numberOfElements = (lengthX * lengthY) - cannotCompareCounter;

	// 4. If all table differences include invalid elements like Infinity or NaN it is
	// possible that difference is 0 and numberOfElements is also 0 and 
	// results in a 0/0 division which needs to be captured
	if (difference == 0 && numberOfElements == 0)
		return -1;

	return {"difference": difference / numberOfElements,
					"elementsAreMissing": elementsAreMissing,
					'tableX': tableX,
					'tableY': tableY};
}

// ToDo Implement different Error types!
Statistics.prototype.getOddsRatioTable = function(x, y, subjects, debug) {
	var matchingValidData = this.getValidMatchingData(x, y, subjects);
	var variableXValid = matchingValidData.variableXValid;
	var variableYValid = matchingValidData.variableYValid;

	var contingency = this.getContingencyTable(variableXValid, variableYValid);
	
	var countTable = contingency.countTable;
	var rowTotals = contingency.rowTotals;
	var columnTotals = contingency.columnTotals;
	var dimensionsListX = contingency.dimensionsListX;
	var dimensionsListY = contingency.dimensionsListY;

	// If Variable has to many manifestations and therefore
	// the table calculations are way to computation heavy
	if (dimensionsListX.length > 50) {
		// console.log(x.name + " has more than 50 elements (" + dimensionsListX.length + "). Aborting Ration Table caluclation");
		return;
	}
		if (dimensionsListY.length > 50) {
		// console.log(x.name + " has more than 50 elements (" + dimensionsListY.length + "). Aborting Ration Table caluclation");
		return;
	}

	var oddsRatioTableDimensionX = 0;
	var oddsRatioTableDimensionY = 0;
	// Dimension is sum of Dimension length - 1
	// For Example: Dimension = 4. Table Length is 3 + 2 + 1 = 6
	for (var i = 1; i < dimensionsListX.length; i++)
		oddsRatioTableDimensionX = oddsRatioTableDimensionX + i;
	for (var i = 1; i < dimensionsListY.length; i++)
		oddsRatioTableDimensionY = oddsRatioTableDimensionY + i;
	
	var oddsRatioTable = new Array(oddsRatioTableDimensionX);
	for (var i = 0; i < oddsRatioTableDimensionX; i++)
		oddsRatioTable[i] = new Array(oddsRatioTableDimensionY);

	if (debug) {
		console.log(" --- Get odds Ratio ---");
		console.log(" Dimension List X");
		console.log(dimensionsListX);
		console.log(" Dimension List Y");
		console.log(dimensionsListY);
		console.log(" Odds Ratio Table Dimension X: " + oddsRatioTableDimensionX);
		console.log(" Odds Ratio Table Dimension Y: " + oddsRatioTableDimensionY);
	}

	tablePositionX = -1;
	tablePositionY = -1;

	for (var x1 = 0; x1 < dimensionsListX.length; x1++) {
		for(var x2 = 0; x2 < dimensionsListX.length; x2++) {
			if (x1 != x2 && x2 > x1) {
				tablePositionX = tablePositionX + 1;
				tablePositionY = -1;
				for (var y1 = 0; y1 < dimensionsListY.length; y1++) {
					for(var y2 = 0; y2 < dimensionsListY.length; y2++) {
						if (y1 != y2 && y2 > y1) {
							tablePositionY = tablePositionY + 1;
							//          Yes     No     < y
							// ------|-------|-------|
							//  Male |  23   |  12   |
							// Female|  20   |  16   |
							//   ^
							//   x
							// Odds Ratio = 23 * 16 / 20 * 12
							var oddRatio = (countTable[x1][y1] * countTable[x2][y2]) / (countTable[x1][y2] * countTable[x2][y1]);
							oddsRatioTable[tablePositionX][tablePositionY] = oddRatio;

							if (debug) {
								console.log("x1: " + dimensionsListX[x1] + ", x2: " + dimensionsListX[x2] + "; y1: " + dimensionsListY[y1] + ", y2: " + dimensionsListY[y2]);
								console.log("[" + tablePositionX + ";" + tablePositionY + "] (" + countTable[x1][y1] + " * " + countTable[x2][y2] + ") / (" + countTable[x2][y1] + " * " + countTable[x1][y2] + ") = " + oddRatio);
							}
						}
					}
				}
			}
		}
	}
	return oddsRatioTable;
}

// Both Variables need to have the same dimensions!
Statistics.prototype.calculateChiSquare = function(x, y, debug, yatesCorrection, returnPValue)
{
	// https://onlinecourses.science.psu.edu/stat500/node/56
	// Null Hypothesis will be that the categrorical variables are independent
	// Χ²=∑(O−E)² / E
	// E = (row total × column total) / sample size

	var contingency = this.getContingencyTable(x, y);
	
	var countTable = contingency.countTable;
	var rowTotals = contingency.rowTotals;
	var columnTotals = contingency.columnTotals;
	var dimensionsListX = contingency.dimensionsListX;
	var dimensionsListY = contingency.dimensionsListY;
	
	if (debug){
		console.log("Chi-Square-CountTable");
		console.log(countTable);
		console.log("Row totals");
		console.log(rowTotals);
		console.log("Column totals");
		console.log(columnTotals);
	}

	var sampleSize = x.length;
	// We have our Data Table, let's apply the formula to it

	// Apply Chi Square Formula
	var chiSquare = 0;
	// Also check for the suitability (http://www.quantpsy.org/chisq/chisq.htm)
	var suitability = new Object();
	suitability.isSuitable = true;
	suitability.expectedSmallerFiveCount = 0;
	suitability.reason = "";

	for (var i = 0; i < dimensionsListX.length; i++)
	{
		for(var j = 0; j < dimensionsListY.length; j++)
		{
			// E = (row total × column total) / sample size
			var E = (rowTotals[i] * columnTotals[j]) / sampleSize;
			if (E < 1 && suitability.isSuitable) {
				suitability.isSuitable = false;
				suitability.reason += "One expected Value is smaller than one! ";
			}
			if (E < 5) // if expected Value is smaller than five, increase the counter
				suitability.expectedSmallerFiveCount++;
			// Yates Correction can only be applied for 2x2 contingency tables!
			// Χ²=∑(O−E)² / E
			if (yatesCorrection == true)
				 //Χ²yates=∑(|O−E| - 0.5)² / E
				chiSquare += Math.pow(Math.abs(countTable[i][j] - E) - 0.5, 2) / E
			else
				chiSquare += Math.pow(countTable[i][j] - E, 2) / E
		}
	}

	var degreesOfFreedom = (dimensionsListX.length - 1) * (dimensionsListY.length - 1);
	var pValue = this.calculatePValue(degreesOfFreedom, chiSquare)

	// When Expected Value is smaller than 5 in 20% of the cells, mark test inappropriate
	suitability.percentOfExpectedSmallerFive = (suitability.expectedSmallerFiveCount / (dimensionsListX.length * dimensionsListY.length)) * 100;
	if (suitability.percentOfExpectedSmallerFive >= 20) {
		suitability.isSuitable = false;
		suitability.reason +=  suitability.percentOfExpectedSmallerFive + "% of expected Values are smaller than 5";
	}

	if (!suitability.isSuitable && pValue < 0.01 && pValue != 0 && debug)
		console.log(suitability.reason + "; pValue: " + pValue);

	if (suitability.isSuitable) {
		if (returnPValue)
			return pValue;
		else
			return chiSquare;
	}
}

// ToDo This should be deleted soon
Statistics.prototype.testOddsRatioWithAllVariables = function(data) {
	var variables = Object.keys(data);
	var result = [];
	for (var i = 0; i < variables.length; i++){
		for (var j = 0; j < variables.length; j++){
			// console.log("Calculating "+ data[variables[i]].name + " with " + data[variables[j]].name);
			if (i != j && j > i) {
				if (data[variables[i]].name != "GEBURTSTAG_SHIP2" && data[variables[j]].name != "GEBURTSTAG_SHIP2"){
					var oddsTable = this.getOddsRatioTable(data[variables[i]], data[variables[j]]);
					result.push({'x': variables[i], 'y': variables[j], 'oddsTable': oddsTable});
				}
			}
		}
		// console.log("Calculating "+ data[variables[i]].name + " done");
	}
	console.log(result);
	// TODO HIER WEITERMACHEN!

}
// ToDo This is broken
Statistics.prototype.testOddsRatio = function(x, y) {
	var variableXValid = new Array();
	var variableYValid = new Array();

	for (var k = 0; k < x.data.length; k++) {
		if (x.invalidIndices[k] == undefined && y.invalidIndices[k] == undefined)
		{
			if(x.description.dataType == 'metric') {
				variableXValid.push((x.binnedData.data[k]).toString());
			}
			else
				variableXValid.push(x.data[k]);
			
			if(y.description.dataType == 'metric') {
				variableYValid.push((y.binnedData.data[k]).toString());
			}
			else
				variableYValid.push(y.data[k]);
		}
	}
	// Only every second Element!
	var variableXValid2 = new Array();
	var variableYValid2 = new Array();

	for (var k = 0; k < x.data.length; k++) {
		if (k % 2 == 1) {
			if (x.invalidIndices[k] == undefined && y.invalidIndices[k] == undefined)
			{
				if(x.description.dataType == 'metric') {
					variableXValid2.push((x.binnedData.data[k]).toString());
				}
				else
					variableXValid2.push(x.data[k]);
				
				if(y.description.dataType == 'metric') {
					variableYValid2.push((y.binnedData.data[k]).toString());
				}
				else
					variableYValid2.push(y.data[k]);
			}
		}
	}

	console.log("variableXValid.length:  " + variableXValid.length);
	console.log("variableYValid.length:  " + variableYValid.length);
	console.log("variableXValid2.length: " + variableXValid2.length);
	console.log("variableYValid2.length: " + variableYValid2.length);
	console.log("variableXValid");
	console.log(variableXValid);
	console.log("variableYValid");
	console.log(variableYValid);
	console.log("variableXValid2");
	console.log(variableXValid2);
	console.log("variableYValid2");
	console.log(variableYValid2);
	var oddsTable1 = this.getOddsRatioTable(variableXValid, variableYValid, false);
	var oddsTable2 = this.getOddsRatioTable(variableXValid2, variableYValid2, false);
	console.log("oddsTable1");
	console.log(oddsTable1);
	console.log("oddsTable2");
	console.log(oddsTable2);
	var oddsTableDifference = this.getOddsRatioTableDifference(oddsTable1, oddsTable2);
	console.log("oddsTableDifference: " + oddsTableDifference.difference + ", Elements are missing: " + oddsTableDifference.elementsAreMissing);
}

Statistics.prototype.getValidMatchingDataOld = function(x, y, elements) {
	var variableXValid = [];
	var variableYValid = [];

	for (var k = 0; k < x.data.length; k++) {
		if (x.invalidIndices[k] == undefined && y.invalidIndices[k] == undefined)
		{
			if(x.description.dataType == 'metric') {
				variableXValid.push((x.binnedData.data[k]).toString());
			}
			else
				variableXValid.push(x.data[k]);
			
			if(y.description.dataType == 'metric') {
				variableYValid.push((y.binnedData.data[k]).toString());
			}
			else
				variableYValid.push(y.data[k]);
		}
	}

	return {"variableXValid": variableXValid, "variableYValid": variableYValid}
}

Statistics.prototype.getValidMatchingData = function(x, y, subjects) {
	var variableXValid = [];
	var variableYValid = [];
	var validSubjects = [];
	if (subjects != undefined)
		for (var i = 0; i < subjects.length; i++) {
			var currentSubject = subjects[i];
			// var currentSubjectPosition = myApp._data.zz_nr.data.indexOf(currentSubject + '');
			var currentSubjectPosition = myApp._zz_nrHash[currentSubject];
			validSubjects[currentSubjectPosition] = true;
		}
	for (var k = 0; k < x.data.length; k++) {
		if (subjects == undefined || validSubjects[k] == true) {
			if (x.invalidIndices[k] == undefined && y.invalidIndices[k] == undefined) {
				if(x.description.dataType == 'metric') {
					variableXValid.push((x.binnedData.data[k]).toString());
				}
				else
					variableXValid.push(x.data[k]);
				
				if(y.description.dataType == 'metric') {
					variableYValid.push((y.binnedData.data[k]).toString());
				}
				else
					variableYValid.push(y.data[k]);
			}
		}
	}

	return {"variableXValid": variableXValid, "variableYValid": variableYValid}
}

Statistics.prototype.getCramersV = function(x, y, subjects, debug) {
	
	var matchingValidData = this.getValidMatchingData(x, y, subjects);
	var variableXValid = matchingValidData.variableXValid;
	var variableYValid = matchingValidData.variableYValid;

	//https://de.wikipedia.org/wiki/Kontingenzkoeffizient
	var chiSquareCoefficient = this.calculateChiSquare(variableXValid, variableYValid, debug, false);
	// n: Gesamtzahl der Fälle (Stichprobenumfang)
	var n = variableXValid.length;
	// min[r,c] ist der kleinere der beiden Werte "Zahl der Zeilen (rows)" und "Zahl der Spalten (columns)"
	var lengthX = this.getDimensionsList(variableXValid).length;
	var lengthY = this.getDimensionsList(variableYValid).length;
	var minLength = 0;
	if (lengthX < lengthY)
		minLength = lengthX;
	else
		minLength = lengthY;

	if (debug) {
		console.log("x: " + x.name);
		console.log("y: " + y.name);
		console.log(variableXValid);
		console.log(variableYValid);
		console.log("chiSquareCoefficient: " + chiSquareCoefficient);
		console.log("variableXValid.length: " + variableXValid.length);
		console.log("variableYValid.length: " + variableYValid.length);
	}

	return Math.sqrt(chiSquareCoefficient / (n * (minLength - 1)));
}

Statistics.prototype.getCramersVIncremental = function(x, y, maximumNumberOfRemovedManifestations, subjects, debug) {
	
	var matchingValidData = this.getValidMatchingData(x, y, subjects);
	var variableXValid = matchingValidData.variableXValid;
	var variableYValid = matchingValidData.variableYValid;
	var gotValidValue = false;
	var numberOfManifestationsTrashed = -1;
	var cramersV = undefined;
	var contingencyTable = undefined;
	var manifestationCountList = undefined;

	// Stay in this loop as long as valid value can be calculated
	while (!gotValidValue) {

		numberOfManifestationsTrashed = numberOfManifestationsTrashed + 1;
		// stop if the counter is beyond the limit of maximum removed manifestations
		if (maximumNumberOfRemovedManifestations != undefined && numberOfManifestationsTrashed > maximumNumberOfRemovedManifestations)
			return NaN;
		// do nothing of this for the first run through since nothing needs to be removed
		if (numberOfManifestationsTrashed > 0 && contingencyTable == undefined) { //Calculate contingency Table
			// Get List Sorted list of Variables and their counts
			// [ valueName: "2", count: 475, dimension: "x"} valueName: "1", count: 300, dimension: "y"} ... ]
			contingencyTable = this.getContingencyTable(variableXValid, variableYValid);
			var _manifestationCountList = [];
			for (var i = 0; i < contingencyTable.dimensionsListX.length; i++)
				_manifestationCountList.push({'valueName': contingencyTable.dimensionsListX[i], 'count': contingencyTable.rowTotals[i], 'dimension': 'x'});
			for (var i = 0; i < contingencyTable.dimensionsListY.length; i++)
				_manifestationCountList.push({'valueName': contingencyTable.dimensionsListY[i], 'count': contingencyTable.columnTotals[i], 'dimension': 'y'});

			manifestationCountList = _manifestationCountList.sort(function(a, b) {return d3.ascending(a.count, b.count);});
		}

		// do nothing of this for the first run through since nothing needs to be removed
		if (numberOfManifestationsTrashed > 0){
			// Create new Empty Valid Variable Arrays
			var newVariableXValid = [];
			var newVariableYValid = [];
			// Get manifestation with lowest count
			lowestManifestionCount = manifestationCountList[numberOfManifestationsTrashed - 1];
			if (lowestManifestionCount == undefined) // this happens when there are no values left to compare!
				return NaN;
			// Remove Elements of the lowest manifestation
			if (lowestManifestionCount.dimension == 'x')
				for (var i = 0; i < variableXValid.length; i++)
					if (variableXValid[i] != lowestManifestionCount.valueName) {
						newVariableXValid.push(variableXValid[i]);
						newVariableYValid.push(variableYValid[i]);
					}
			if (lowestManifestionCount.dimension == 'y')
				for (var i = 0; i < variableYValid.length; i++)
					if (variableYValid[i] != lowestManifestionCount.valueName) {
						newVariableXValid.push(variableXValid[i]);
						newVariableYValid.push(variableYValid[i]);
					}
			// now we have our cleaned Variables and can proceed as usual
			variableXValid = newVariableXValid;
			variableYValid = newVariableYValid;
		}
		//https://de.wikipedia.org/wiki/Kontingenzkoeffizient
		var chiSquareCoefficient = this.calculateChiSquare(variableXValid, variableYValid, debug, false);
		// n: Gesamtzahl der Fälle (Stichprobenumfang)
		var n = variableXValid.length;
		// min[r,c] ist der kleinere der beiden Werte "Zahl der Zeilen (rows)" und "Zahl der Spalten (columns)"
		var lengthX = this.getDimensionsList(variableXValid).length;
		var lengthY = this.getDimensionsList(variableYValid).length;
		var minLength = 0;
		if (lengthX < lengthY)
			minLength = lengthX;
		else
			minLength = lengthY;

		if (debug) {
			console.log("numberOfManifestationsTrashed: " + numberOfManifestationsTrashed);
			console.log("lowestManifestionCount");
			console.log(lowestManifestionCount);
			console.log("x: " + x.name);
			console.log("y: " + y.name);
			console.log(variableXValid);
			console.log(variableYValid);
			console.log("chiSquareCoefficient: " + chiSquareCoefficient);
			console.log("variableXValid.length: " + variableXValid.length);
			console.log("variableYValid.length: " + variableYValid.length);
		}

		cramersV = Math.sqrt(chiSquareCoefficient / (n * (minLength - 1)));
		if (cramersV != undefined && !isNaN(cramersV))
			gotValidValue = true;

		// if (numberOfManifestationsTrashed - 1 >= manifestationCountList.length) // Also do nothing the numbers of manifestations are reached
		// 	gotValidValue = true;
	}
	return cramersV;
}

// http://www.codeproject.com/Articles/432194/How-to-Calculate-the-Chi-Squared-P-Value
Statistics.prototype.calculatePValue = function(Dof, Cv)
{
	if (Cv < 0 || Dof < 1)
	{
		return 0.0;
	}
	var K = Dof * 0.5;
	var X = Cv * 0.5;
	if (Dof === 2)
	{
		return Math.exp(-1.0 * X);
	}
	var PValue = this.helperIgf(K, X);
	if (isNaN(PValue) || PValue <= 1e-8)
	{
		return 1e-14;
	}

	PValue /= this.helperGamma(K);
	return (1.0 - PValue);
}

Statistics.prototype.helperIgf = function(S, Z)
{
	if (Z < 0.0)
	{
		return 0.0;
	}
	var Sc = (1.0 / S);
	Sc *= Math.pow(Z, S);
	Sc *= Math.exp(-Z);
	var Sum = 1.0;
	var Nom = 1.0;
	var Denom = 1.0;
	for (var I = 0; I < 200; I++)
	{
		Nom *= Z;
		S++;
		Denom *= S;
		Sum += (Nom / Denom);
	}
	return Sum * Sc;
}

Statistics.prototype.helperGamma = function(N)
{
	var A = 15
	var SQRT2PI = 2.5066282746310005024157652848110452530069867406099383;

	var Z = N;
	var Sc = Math.pow((Z + A), (Z + 0.5));
	Sc *= Math.exp(-1.0 * (Z + A));
	Sc /= Z;

	var F = 1.0;
	var Ck;
	var Sum = SQRT2PI;

	for (var K = 1; K < A; K++)
	{
		Z++;
		Ck = Math.pow(A - K, K - 0.5);
		Ck *= Math.exp(A - K);
		Ck /= F;

		Sum += (Ck / Z);

		F *= (-1.0 * K);
	}

	return Sum * Sc;
}
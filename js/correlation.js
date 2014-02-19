var correlation = {};
var correlationHelperFunctions = {};

// used from jStat
// Returns the incomplete beta function I_x(a,b)
function ibeta(x, a, b) {
	// Factors in front of the continued fraction.
	var bt = (x === 0 || x === 1) ?  0 :
    Math.exp(jStat.gammaln(a + b) - jStat.gammaln(a) -
    jStat.gammaln(b) + a * Math.log(x) + b *
    Math.log(1 - x));
  if(x < 0 || x > 1) return false;
  if(x < (a + 1) / (a + b + 2))
    // Use continued fraction directly.
    return bt * jStat.betacf(x, a, b) / a;
  // else use continued fraction after making the symmetry transformation.
  return 1 - bt * jStat.betacf(1 - x, b, a) / b;
}

function criticalFValue(x, df1, df2) {
  return 1 - (ibeta((df1 * x) / (df1 * x + df2), df1 / 2, df2 / 2));
}

// Both Variables need to have the same dimensions!
correlation.calculateAnova = function(categorical, numerical) {
	// Check it with excel: https://www.youtube.com/watch?v=Ke9ttUj7AQc
	// Calculate Sum of Squares
	// Total Sum Of Squares = Sum of Squares Between Groups + Sum of Squares Within Groups

	// Get a List of all categories
	var dimensionsListCategorical = new Array();
	for (var i = 0; i < categorical.length; i++)
		if (dimensionsListCategorical.indexOf(categorical[i]) === -1)
			dimensionsListCategorical.push(categorical[i]);

	// Calculate Array which contains Arrays of Groups
	// [group1[ 2, 23, 1, 27.5 ], group1[ 3, 1, 33, 11 ], ...]
	groupArray = Array(dimensionsListCategorical.length);
	for (var i = 0; i < groupArray.length; i++) // Create empty Arrays
		groupArray[i] = new Array();
	for (var i = 0; i < numerical.length; i++) { // Fill the Arrays
		categoryIndexOfCurrentEntry = dimensionsListCategorical.indexOf(categorical[i]);
		groupArray[categoryIndexOfCurrentEntry].push(numerical[i]);
	}

	// Calculate Sum of Squares within Groups
	var sumOfSquaresWithinGroups = 0;
	var meanOfGroups = new Array(dimensionsListCategorical.length);
	var squaresWithinGroups = new Array(dimensionsListCategorical.length);
	for (var i = 0; i < squaresWithinGroups.length; i++) {
		squaresWithinGroups[i] = 0; // Initial Value
		meanOfGroups[i] = correlationHelperFunctions.meanOfArray(groupArray[i]);
		for (var j = 0; j < groupArray[i].length; j++)
			// sumOfSquaresOfGroup = ∑(Value - Mean)²
			squaresWithinGroups[i] += Math.pow(groupArray[i][j] - meanOfGroups[i], 2);
		// We calculated the Sum for the Group so we can add it!
		sumOfSquaresWithinGroups += squaresWithinGroups[i];
	}

	// Calculate total Sum of Squares (of all groups!)
	var totalMean = correlationHelperFunctions.meanOfArray(numerical);
	var totalSumOfSquares = 0;
	for (var i = 0; i < numerical.length; i++)
		totalSumOfSquares += Math.pow(numerical[i] - totalMean, 2);

	// Calculate Sum of Squares between the Groups
	var sumOfSquaresBetweenGroups = 0;
	for (var i = 0; i < meanOfGroups.length; i++){
		sumOfSquaresBetweenGroups += Math.pow(meanOfGroups[i] - totalMean, 2) * groupArray[i].length;
	}

	// Sum of Squares between groups / degrees of freedom between groups
	var degreesOfFreedomNumerator = dimensionsListCategorical.length - 1;
	sumOfSquaresBetweenGroups = sumOfSquaresBetweenGroups / degreesOfFreedomNumerator;
	// Sum of Squares within groups / degrees of freedom within groups
	// degrees of freedom within groups = observations - groups
	var degreesOfFreedomDenominator = numerical.length - dimensionsListCategorical.length;
	sumOfSquaresWithinGroups = sumOfSquaresWithinGroups / degreesOfFreedomDenominator;

	var fScore = sumOfSquaresBetweenGroups / sumOfSquaresWithinGroups;
	// console.log("F Score = " + fScore);

	var pValue = criticalFValue(fScore, degreesOfFreedomNumerator, degreesOfFreedomDenominator);
	// console.log("P-Value = " + pValue);
	return pValue;
}
correlationHelperFunctions.meanOfArray = function(array)
{
	var sum = 0;
	for (var i = 0; i < array.length; i++)
		sum += array[i];

	return sum / array.length;
}

correlationHelperFunctions.getDimensionsList = function(x) {
	var dimensionsListX = new Array();
	for (var i = 0; i < x.length; i++)
			if (dimensionsListX.indexOf(x[i]) === -1)
				dimensionsListX.push(x[i]);
	return dimensionsListX;
}

var chiSquareInappropriateCount = 0;
// Both Variables need to have the same dimensions!
correlation.calculateChiSquare = function(x, y, debug, yatesCorrection)
{
	// https://onlinecourses.science.psu.edu/stat500/node/56
	// Null Hypothesis will be that the categrorical variables are independent
	// Χ²=∑(O−E)² / E
	// E = (row total × column total) / sample size

	// Calculate the number of Dimensions
	var dimensionsListX = correlationHelperFunctions.getDimensionsList(x);
	var dimensionsListY = correlationHelperFunctions.getDimensionsList(y);
	// var dimensionsListX = new Array();
	// var dimensionsListY = new Array();
	// for (var i = 0; i < x.length; i++)
	// 	if (dimensionsListX.indexOf(x[i]) === -1)
	// 		dimensionsListX.push(x[i]);
	// for (var i = 0; i < y.length; i++)
	// 	if (dimensionsListY.indexOf(y[i]) === -1)
	// 		dimensionsListY.push(y[i]);

	// Create Count Table which makes further calculations easier
	// The Multidimensional array will look like this:
	//          Yes     No     < y
	// ------|-------|-------|
	//  Male |  23   |  12   |
	// Female|  20   |  16   |
	//   ^
	//   x
	//
	// [0][0] = 23; [0][1] = 12; [1][0] = 20; [1][1] = 16;
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
	var sampleSize = x.length;
	console.log(countTable);
	// We have our Data Table, let's apply the formula to it
	// console.log(countTable)

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
			// Χ²=∑(O−E)² / E
			if (yatesCorrection == true)
				 //Χ²yates=∑(|O−E| - 0.5)² / E
				chiSquare += Math.pow(Math.abs(countTable[i][j] - E) - 0.5, 2) / E
			else
				chiSquare += Math.pow(countTable[i][j] - E, 2) / E
		}
	}
	
	//var degreesOfFreedom = dimensionsListY.length - 1;

	var degreesOfFreedom = (dimensionsListX.length - 1) * (dimensionsListY.length - 1);
	console.log("chiSquare: " + chiSquare);
	var pValue = calculatePValue(degreesOfFreedom, chiSquare)
	// if (pValue > 0.05 && pValue != 0)
	// 	console.log("degreesOfFreedom: " + degreesOfFreedom + ", chiSquare: " + chiSquare);
	// console.log(chiSquare);

	// When Expected Value is smaller than 5 in 20% of the cells, mark test inappropriate
	suitability.percentOfExpectedSmallerFive = (suitability.expectedSmallerFiveCount / (dimensionsListX.length * dimensionsListY.length)) * 100;
	if ( suitability.percentOfExpectedSmallerFive >= 20) {
		suitability.isSuitable = false;
		suitability.reason +=  suitability.percentOfExpectedSmallerFive + "% of expected Values are smaller than 5";
	}

	if (!suitability.isSuitable && pValue < 0.01 && pValue != 0){
	// if (!suitability.isSuitable && debug == true) {
		//pValue = 0;
		console.log(suitability.reason + "; pValue: " + pValue);
		chiSquareInappropriateCount++;
	}
	if (suitability.isSuitable)
		//return pValue;
	return chiSquare;
	// return pValue;
}

correlation.getCraimersV = function(x, y) {
	//https://de.wikipedia.org/wiki/Kontingenzkoeffizient
	var chiSquareCoefficient = correlation.calculateChiSquare(x, y, false, false);
	// n: Gesamtzahl der Fälle (Stichprobenumfang)
	var n = x.length;
	// min[r,c] ist der kleinere der beiden Werte "Zahl der Zeilen (rows)" und "Zahl der Spalten (columns)"
	var lengthX = correlationHelperFunctions.getDimensionsList(x).length;
	var lengthY = correlationHelperFunctions.getDimensionsList(y).length;
	var minLength = 0;
	if (lengthX < lengthY)
		minLength = lengthX;
	else
		minLength = lengthY;

	return Math.sqrt(chiSquareCoefficient / n * (minLength - 1));
}

function calculateOddsRatio(x, y) {

}

// http://www.codeproject.com/Articles/432194/How-to-Calculate-the-Chi-Squared-P-Value
function calculatePValue(Dof, Cv)
{
	if(Cv < 0 || Dof < 1)
	{
		return 0.0;
	}
	var K = Dof * 0.5;
	var X = Cv * 0.5;
	if(Dof === 2)
	{
		return Math.exp(-1.0 * X);
	}
	var PValue = igf(K, X);
	if(isNaN(PValue) || PValue <= 1e-8)
	{
		return 1e-14;
	}

	PValue /= gamma(K);
	return (1.0 - PValue);
}

function igf(S, Z)
{
	if(Z < 0.0)
	{
		return 0.0;
	}
	var Sc = (1.0 / S);
	Sc *= Math.pow(Z, S);
	Sc *= Math.exp(-Z);
	var Sum = 1.0;
	var Nom = 1.0;
	var Denom = 1.0;
	for(var I = 0; I < 200; I++)
	{
		Nom *= Z;
		S++;
		Denom *= S;
		Sum += (Nom / Denom);
	}
	return Sum * Sc;
}

function gamma(N)
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

	for(var K = 1; K < A; K++)
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

correlation.getPurity = function(x, y)
{
	if (x.length != y.length)
	{
		console.error("x and y have to be the same dimension for calculating purity");
		return;
	}

	dimensionsListX = new Object();
	for (var i = 0; i < x.length; i++)
		if (!dimensionsListX.hasOwnProperty(x[i]))
			dimensionsListX[x[i]] = new Object();
	// Now we have an Object for each Value in X
	for (var i = 0; i < x.length; i++)
	{
		if(!dimensionsListX[x[i]].hasOwnProperty(y[i]))
		{
			dimensionsListX[x[i]][y[i]] = new Object();
			dimensionsListX[x[i]][y[i]].count = 1;
		}
		else
			dimensionsListX[x[i]][y[i]].count++;
	}
	// Now we have tha data structure we can use to calculate purity
	// correlation.getPurity(dimensionList.GEBURTSTAG_SHIP2, dimensionList.SEX_SHIP2)
	// Iterate over all Dimensions of X

	var purity = 0;
	var numberOfItems = 0;
	for (var currentXDimension in dimensionsListX)
	{
		var largestElement = 0;
		// Look for largest elements
		for (var currentYDimension in dimensionsListX[currentXDimension])
		{
			if (dimensionsListX[currentXDimension][currentYDimension].count > largestElement)
				largestElement = dimensionsListX[currentXDimension][currentYDimension].count;
			numberOfItems++;
		}
		localPurity = largestElement / numberOfItems;
		purity += localPurity;
	}
	console.dir(dimensionsListX);
	console.dir(purity);
	purity = purity / numberOfItems;
	console.dir(purity);
}

correlation.getPearsonsCorrelation = function(x, y) 
{
	// console.log(x);
	// console.log(y);
	var shortestArrayLength = 0;
	if(x.length == y.length)
	{
		shortestArrayLength = x.length;
	}
	else if(x.length > y.length)
	{
		shortestArrayLength = y.length;
		console.error('x has more items in it, the last ' + (x.length - shortestArrayLength) + ' item(s) will be ignored');
	}
	else
	{
		shortestArrayLength = x.length;
		console.error('y has more items in it, the last ' + (y.length - shortestArrayLength) + ' item(s) will be ignored');
	}
 
	var xy = [];
	var x2 = [];
	var y2 = [];
 
	for(var i=0; i<shortestArrayLength; i++)
	{
		xy.push(x[i] * y[i]);
		x2.push(x[i] * x[i]);
		y2.push(y[i] * y[i]);
	}
 
	var sum_x = 0;
	var sum_y = 0;
	var sum_xy = 0;
	var sum_x2 = 0;
	var sum_y2 = 0;
 
	for(var i=0; i<shortestArrayLength; i++)
	{
		sum_x += x[i];
		sum_y += y[i];
		sum_xy += xy[i];
		sum_x2 += x2[i];
		sum_y2 += y2[i];
	}
 
	var step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
	var step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
	var step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
	var step4 = Math.sqrt(step2 * step3);
	console.dir(step1);
	console.dir(step2);
	console.dir(step3);
	console.dir(step4);
	var answer = step1 / step4;
 
	return answer;
}
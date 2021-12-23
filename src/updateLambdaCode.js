const AWS = require('aws-sdk');
const AdmZip = require('adm-zip');
const path = require('path');
const {
	sleep
} = require('./sleep');

async function _processBatch(batch) {
	var lambdaPromises = [];

	for (var i = 0; i < batch.length; i++) {
		lambdaPromises.push(new Promise((resolve, reject) => {
			var newZip = new AdmZip();

			var fileNames = batch[i].sourceList;

			fileNames.forEach(file => {
				newZip.addLocalFile(file, path.dirname(file));
			});

			newZip.writeZip(`${batch[i].name}.zip`);

			var lambda = new AWS.Lambda({
				apiVersion: '2015-03-31',
				region: 'us-east-2'
			});

			var params = {
				FunctionName: batch[i].name,
				ZipFile: newZip.toBuffer()
			};

			lambda.updateFunctionCode(params, function (err, data) {
				if (err) {
					console.log(err, err.stack);
					reject(err);
				} else {
					resolve(data);
				}
			});
		}));
	}

	await Promise.all(lambdaPromises);
}

async function update(functions) {
	var batchSize = 5;
	var numberOfFunctions = functions.length;

	if (numberOfFunctions >= batchSize) {
		var mod = numberOfFunctions % batchSize;
		var evenBatch = numberOfFunctions - mod;
		for (var x = 0; x < evenBatch; x += batchSize) {
			await _processBatch(functions.slice(x, x + batchSize));
			sleep(3);
		}

		if (mod != 0) {
			await _processBatch(functions.slice(evenBatch, functions.length));
		}
	} else {
		await _processBatch(functions);
	}
};

module.exports = {
	update
};
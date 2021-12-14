#!/usr/bin/env node

const program = require('commander');
const updateLambdaCode = require('./src/updateLambdaCode');

program.command('update-lambda-code')
	.description('Update a single Lambda\'s code by function name and source list or multiple Lambdas using a config file (see documentation for format).')
	.alias('ulc')
	.option('-f, --functionName <name>', 'Name of function that requires code to be updated (not required when using -c option)')
	.option('-s, --sourceList <list>', 'Comma seperate list of paths to source files required to be deployed with Lambda code (not required when using -c option)')
	.option('-c, --configFile <filePath>', 'Path to a specially formatted config file to get function names along with source listing that need updated')
	.action((options) => {
		var functions = [];

		if (options.configFile) {
			var config = require(options.configFile);
			functions = config.functions;
		} else if (options.functionName && options.sourceList) {
			functions = [{
				name: options.functionName,
				sourceList: options.sourceList.split(',')
			}]
		} else {
			throw new Error('Config file or function name and source list required!');
		}

		try {
			updateLambdaCode.update(functions);
		} catch (error) {
			console.log(error.stack);
			process.exit(1);
		}
	});

program.parse(process.argv);
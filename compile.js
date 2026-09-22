const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

const buildPath = path.resolve(__dirname, 'build/contracts');
fs.removeSync(buildPath);
fs.ensureDirSync(buildPath);

const prestamosFactoryPath = path.resolve(__dirname, 'contracts', 'PRESTAMOS_FACTORY.sol');
const source = fs.readFileSync(prestamosFactoryPath, 'UTF-8');

const safeMathPath = path.resolve(__dirname, 'node_modules', '@openzeppelin', 'contracts', 'utils', 'math', 'SafeMath.sol');
const safeMathSource = fs.readFileSync(safeMathPath, 'utf8');

const combinedSource = `${safeMathSource}\n\n${source}`;

var input = {
    language: 'Solidity',
    sources: {
        'PRESTAMOS_FACTORY.sol' : {
            content: combinedSource
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': [ '*' ]
            }
        }
    }
}; 

//ELIMINAR LICENCIA , COMPILADOR, E IMPORT YA QUE LA FORMA DE LEER EL CONTRTO ES COMO SI FUESE UNA EXTENSION DE SAFEMATH
//pas 2  exportar para test
const contractsCompiled = JSON.parse(solc.compile(JSON.stringify(input))).contracts['PRESTAMOS_FACTORY.sol'];

for (let contract in contractsCompiled) {
	fs.outputJsonSync(
		path.resolve(buildPath, contract+'.json'),
		contractsCompiled[contract]);	
}


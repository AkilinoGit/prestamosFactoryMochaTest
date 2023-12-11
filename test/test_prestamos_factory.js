const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const prestamosFactoryBuild = require ('../build/contracts/PrestamosFactory.json');
const prestamoCursandoBuild = require ('../build/contracts/PrestamoCursando.json');


//Test en distinto proyecto debido al conflicto de versión de web3 y su constructor
describe('Prestamos factory test', () => {

    before( async() => {  
        accounts = await web3.eth.getAccounts();
        factory = await new web3.eth.Contract(prestamosFactoryBuild.abi)
            .deploy({data: prestamosFactoryBuild.evm.bytecode.object})
            .send({ from: accounts[0], gas: 6721975});
        
        console.log('contract address:'+ factory.options.address);
        console.log('Owner: ' + accounts[0]);
        
        
    } );

    it('deploys a contract', () => {
		assert.ok(factory.options.address); 
	});

    it('onlyOwner', async () => {
        try{
            factory.methods.getBalance().call({from: accounts[1]});
            assert.fail(new TypeError('Only owner'));
        } catch (error) {
        }
    });
    
    it('invertir wei', async () => {
        await factory.methods.invertir().send({
            from: accounts[0],
            value: web3.utils.toHex(10000)
        });
        var expected = await web3.eth.getBalance(factory.options.address);
        assert.equal(expected,10000);
    });

    it('get Balance', async () => {
        var expected = await web3.eth.getBalance(factory.options.address);
        var actual = await factory.methods.getBalance().call({from: accounts[0]});
        assert.equal(expected,actual);
    });

    it('get empty clientes', async () => {
        let clientes = await factory.methods.getClientes().call({from: accounts[0]});
        assert.equal(clientes.length,0);
    });

    it('recolectar fondos', async () => {
        await factory.methods.recolectarFondos(1000).send({
            from: accounts[0]
        });
        var expected = await web3.eth.getBalance(factory.options.address);
        assert.equal(expected,9000);
    });

    it('get empty tipos contrato', async () => {
        let tiposContrato = await factory.methods.verTiposContrato().call({from: accounts[0]});
        assert.equal(tiposContrato.length,0);
    });

    it('get empty contratos en curso', async () => {
        let contratosCursando = await factory.methods.verContratos(accounts[0]).call({from: accounts[0]});
        assert.equal(contratosCursando.length,0);
    });

    it('get error getting contracts from diferrent account', async () => {
        try {
            let contratosCursando = await factory.methods.verContratos(accounts[1]).call({from: accounts[0]});
            assert.fail(new TypeError('Top Secret'));
        }
        catch(error) {}
        
    });

    it('definir prestamo wrong porcentage penalizacion', async() => {
        try {
             await factory.methods.definirPrestamo(1000,1000,10,10).send({from: accounts[0]});
             assert.fail(new TypeError('Wrong porentage'));
        }
        catch(error) {}
        
    })
    it('definir prestamo wrong porcentage interes', async() => {
        try {
            await factory.methods.definirPrestamo(10,1000,10,10000).send({from: accounts[0],
            gas: web3.utils.toHex(20000)});
            assert.fail(new TypeError('Wrong porentage'));
       }
       catch(error) {}

    });

    it('definir prestamo', async() => {
        const result = await factory.methods.definirPrestamo(10,1000,2,10).send({from: accounts[0],
            gas: web3.utils.toHex(2000000)});
        const events = result.events;
        const eventoDefinido = events['PrestamoDefinido'];
        assert.ok(eventoDefinido);
        
    });

    it('get tipos contrato', async () => {
        
        var expected = {
            index: '0',
            porcentajeInteres: '10',
            cantidad: '1000',
            deudaTotal: '1100',
            cuotas: '10',
            penalizacionImpago: '10'};

        let tiposContrato = await factory.methods.verTiposContrato().call({from: accounts[0]});
        assert.equal(tiposContrato.length,1);
        assert.equal(tiposContrato[0].index, expected.index);
        assert.equal(tiposContrato[0].deudaTotal, expected.deudaTotal);

    });

    it('contratarPrestamo from another account', async() => {
        try {
            await factory.methods.contratarPrestamo(accounts[1],0).send({from: accounts[2]});
            assert.fail(new TypeError('Error en dirección'));

        } catch (error){
            console.log(error.message) 

        }
    });

    it('contratarPrestamo from another account', async() => {
         await factory.methods.definirPrestamo(10,999999,10,10).send({from: accounts[0],
            gas: web3.utils.toHex(2000000)});

        try {
            await factory.methods.contratarPrestamo(accounts[1],1).send({from: accounts[1]});
            assert.fail(new TypeError('No hay suficientes fondos para el prestamo'));

        } catch (error){
            console.log(error.message) 
        }
    });

    it('contratarPrestamo', async() => {
        var result = await factory.methods.contratarPrestamo(accounts[1],0).send({from: accounts[1],
            gas: web3.utils.toHex(2000000)});
        var eventoDefinido = result.events['NuevoPrestamoCursando'];
        assert.ok(eventoDefinido);
        console.log(eventoDefinido);
        result = await factory.methods.contratarPrestamo(accounts[2],0).send({from: accounts[2],
             gas: web3.utils.toHex(2000000)});
        eventoDefinido = result.events['NuevoPrestamoCursando'];
        assert.ok(eventoDefinido);
        console.log(eventoDefinido);

    });

    it('verContratos', async() => {
        var contratos = await factory.methods.verContratos(accounts[1]).call({from: accounts[1]});
        assert.equal(contratos.length,1);
        contratos = await factory.methods.verContratos(accounts[2]).call({from: accounts[2]});
        assert.equal(contratos.length,1);
    });

    it('eliminar contrato no finalizado', async() => {
        try{
            await factory.methods.eliminarPrestamoFinalizado(accounts[1],0).send({from: contratoEliminar});
            assert.fail(new TypeError('Deuda pendiente'));
            } catch (error){
                console.log(error.message);
            }
    });


    });


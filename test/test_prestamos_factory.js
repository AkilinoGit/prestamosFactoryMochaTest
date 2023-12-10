const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const prestamosFactoryBuild = require ('../build/contracts/PrestamosFactory.json');


//Test en distinto proyecto debido al conflicto de versión de web3 y su constructor
describe('Prestamos factory test', () => {

    before( async() => {  
        accounts = await web3.eth.getAccounts();
        web3.set
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
        const result = await factory.methods.definirPrestamo(10,1000,10,10).send({from: accounts[0],
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








    




});

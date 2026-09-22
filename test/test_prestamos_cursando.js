const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const prestamosFactoryBuild = require ('../build/contracts/PrestamosFactory.json');
const prestamoCursandoBuild = require ('../build/contracts/PrestamoCursando.json');


describe('Prestamos Cursando test', async () => {
    //INICIALIZAR PRESTAMOS EN CURSO
    before(async() => {  
        //Inicializar cuentas
        accounts = await web3.eth.getAccounts();
        
        
        //Inicializar contract factory
        factory = await new web3.eth.Contract(prestamosFactoryBuild.abi)
            .deploy({data: prestamosFactoryBuild.evm.bytecode.object})
            .send({ from: accounts[0], gas: 6721975});
            

        //Invertir para poder crear nuevos contratos
        await factory.methods.invertir().send({
                from: accounts[0],
                value: web3.utils.toHex(10000)
            });
        //Definir préstamo
        await factory.methods.definirPrestamo(10,1000,2,10).send({from: accounts[0],
            gas: web3.utils.toHex(2000000)});
        //Contratar prestamos
        await factory.methods.contratarPrestamo(accounts[1],0).send({from: accounts[1],
            gas: web3.utils.toHex(2000000)});
        await factory.methods.contratarPrestamo(accounts[2],0).send({from: accounts[2],
            gas: web3.utils.toHex(2000000)});

        [prestamo1address]=await factory.methods.verContratos(accounts[1]).call({from: accounts[1]});
        [prestamo2address]=await factory.methods.verContratos(accounts[2]).call({from: accounts[2]});
        
        prestamo1 = await new web3.eth.Contract(prestamoCursandoBuild.abi,prestamo1address);
        prestamo2 = await new web3.eth.Contract(prestamoCursandoBuild.abi,prestamo2address);
        
        
        console.log('Factory address:'+ factory.options.address);
        console.log('Owner: ' + accounts[0]);
        console.log('Prestamo1: '+ prestamo1.options.address);
        
        console.log('--------');
        console.log('||TEST||');
        console.log('--------');
        
    });

    it('mostrar info desde cuenta externa', async() => {
        try{
            await prestamo1.methods.mostrarInfo().call({from: accounts[2]});
            assert.fail(new TypeError('Sin acceso'));
        }catch (error){
            
        }
    });

    it('Mostrar info', async() => {
        var expected = {
            _direccion: '0xe08d37dF20bEad7007f406C847c99E367AFF4ea1',
            _index: '0',
            _prestatario: '0x9a9d0e305D5F97b5881055E12a9240AA1C0E8E4e',
            _state: '1',
            _cantidadPrestada: '1000',
            _deudaRestante: '1100',
            _cuotaMensual: '550',
            _cuotasRestantes: '2',
            _penalizacionImpago: '10',
            _ultimoCheckeo: '1702318784'};

        var acutalInfo = await prestamo1.methods.mostrarInfo().call({from: accounts[1]});
        assert.equal(expected._cantidadPrestada,acutalInfo._cantidadPrestada);
        assert.equal(expected._state,acutalInfo._state);
        assert.equal(expected._cuotaMensual,acutalInfo._cuotaMensual);
        assert.ok(acutalInfo._prestatario);
        assert.ok(acutalInfo._direccion);
            
            
    });

    it('Chequeo mensual temprano', async() => {
        try{
            await prestamo1.methods.checkeoMensual().send({from: accounts[0],
                gas: web3.utils.toHex(2000000)});
            assert.fail(new TypeError('No ha pasado tiempo suficiente'));
        }
        catch(error){}

    }); 

    it('Pago Mensual', async() => {
        await prestamo1.methods.pagarMensualidad().send({from: accounts[1],
            gas: web3.utils.toHex(2000000), value: web3.utils.toHex(550)});
        prestamoPagado = await prestamo1.methods.mostrarInfo().call({from: accounts[1]});

        assert.equal(prestamoPagado._cuotasRestantes,1);
        assert.equal(prestamoPagado._deudaRestante, 550);
        assert.equal(prestamoPagado._state, 0);

    });

    it('Transferir fondos a factory', async() => {
        //Inversion inicial : 10000 wei
        //Cantidad prestada : dos prestamos de 1000 wei = 2000 wei
        //Cantidad devuelta :  Una cuota pagada del prestamo1 = 550 wei
        //El contrato prestamo debe de tener 0 wei y el contrato factory 10000-2000+550 = 8550 wei

        var balanceFactory = await factory.methods.getBalance().call({from: accounts[0],
            gas: web3.utils.toHex(2000000)});
        assert.equal(balanceFactory,8550);
    })
   

    it('Chequeo mensual', async() => {
        //Me aseguro que pasa el tiempo suficiente para volver a realizar el chequeo
        await esperar10Segundos();
        //Realizo chequeo
        await prestamo1.methods.checkeoMensual().send({from: accounts[0],
            gas: web3.utils.toHex(2000000)});
         //Compruebo que el estado del prestamo ha pasado de 'PAGADO'  a 'PRESTAMO'
        var expectedState = 1;
        var actualState = await prestamo1.methods.mostrarEstado().call();
        assert.equal(actualState, expectedState);
        
        //Compruebo la penalización del prestamo no pagado
        var expectedDeudaRestante = 1000 + (1000 * 0.1);
        var prestamoNoPagado = await prestamo2.methods.mostrarInfo().call({from: accounts[2]});
        assert.equal(prestamoNoPagado._deudaRestante, expectedDeudaRestante);
    

    });

    it('Eliminación contrato finalizado', async() => {
        //Pago ultima cuota de prestamo1
        await prestamo1.methods.pagarMensualidad().send({from: accounts[1],
            gas: web3.utils.toHex(2000000), value: web3.utils.toHex(550)});
        prestamoPagado = await prestamo1.methods.mostrarInfo().call({from: accounts[1]});
        //Compruebo que sus estado está en finalizado
        assert.equal(prestamoPagado._state,2);
        //Realizo el chequeo mensual y este llama a la función de eliminar
        await esperar10Segundos();
        await prestamo1.methods.checkeoMensual().send({from: accounts[0],
            gas: web3.utils.toHex(2000000)});
        
        //Compruebo que no existe ni el el prestamo finalizado ni su usuario el cual no tiene más prestamos en el sistema
        
        var vacio = await factory.methods.verContratos(accounts[1]).call({from: accounts[1],
            gas: web3.utils.toHex(2000000)});
        //No existe contrato para la cuenta del contrato finalizado
        assert.equal(vacio.length,0);
        
        
        //Solo existe un cliente que es el del contrato no pagado
        var clientes = await factory.methods.getClientes().call({from: accounts[0],
            gas: web3.utils.toHex(2000000)});
        assert.equal(clientes.length,1);

    });



});
async function esperar10Segundos() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('Se puede realizar otro chequeo mensual');
      }, 10000);
    });
  }
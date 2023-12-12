# <pre>             PRESTAMOS FACTORY<br>             MOCHA TEST  
                     
## COMPILACIÓN
Test creados en otro proyecto a parte debido que estaba siguiendo la clase de Oriol y tenía conflictos con el proyecto debido
a la versión de Web3.
- [compile.js](https://github.com/AkilinoGit/prestamosFactoryMochaTest/blob/main/compile.js)
Fichero mínimamente modificado al de la clase para añadir el import de "SafeMath.sol" de una manera no muy óptima que haciendo
que mis contratos sean una continuación de este.
## TEST
- [test_prestamos_cursando.js](https://github.com/AkilinoGit/prestamosFactoryMochaTest/blob/main/test/test_prestamos_cursando.js)
- [test_prestamos_factory.js](https://github.com/AkilinoGit/prestamosFactoryMochaTest/blob/main/test/test_prestamos_factory.js)
La forma de realizar los test no está realizada de una manera muy profesional sino como una forma de ir haciendo un flujo
casi idéntico al de la demo comprobando distintas posiblidades para forzar errores y evitar brechas

El problema con "SetIndex()" fue descubierto en fase de Testing

El timeOut de mocha tuvo que ser subdo a 12 segundos debido al modifier aplicado al checkeo mensual necesitando una espera en la 
ejecución de 10 segundos. La verdad  que intente simular el tiempo en la evm temporal de ganache pero no lo conseguí.





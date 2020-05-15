
# SS Products Service.

Micro-serviço para gerenciamento de lojas e produtos, condicionado ao usuário ser gerente ou staff da loja para criação/alteração.


## Instalação

Usando docker:
``` bash
git clone https://github.com/dmkorb/ss-products-service.git
cd ss-products-service
docker-compose build
```
Localmente:  *requisitos: Node 14+ e MongoDB instalados*
``` bash
git clone https://github.com/dmkorb/ss-products-service.git
cd ss-products-service
yarn install
```

### Utilização

``` bash
# Com docker:
$ docker-compose build

# com yarn
$ yarn start
```

O servidor roda automaticamente na porta 3000, porém pode ser alterado modificando a variável de ambiente `PORT`.
Navegue para [http://localhost:3000](http://localhost:3000) para conferir se está no ar. 

Sem a variável `NODE_ENV` setada como `"prod"`, o app uma loja com dois produtos no banco de dados, assim como três usuários - dois com permissão de acesso à loja, e outro sem.
Estes dados podem ser verificados, pelo browser, em [http://localhost:3000/api/stores](http://localhost:3000/api/stores) ou [http://localhost:3000/api/products](http://localhost:3000/api/products)
O usuário normal pode, porém, criar uma nova loja - se tornando assim gerente dela.

 1. Gerente:
	 Email: gerente@mail.com
	 Senha: '123456'
	
 2. Staff
	 Email: staff@mail.com
  	 Senha: '123456'
  	 
 3. Usuário
	 Email: usuario@mail.com
	 Senha: '123456'

### API
A documentação da API e seus endpoints pode ser encontrada neste link:
https://documenter.getpostman.com/view/2773219/Szmk1Fi4

### Arquitetura

API construída com o framework [Express](https://expressjs.com/) em [Node.js](https://nodejs.org/), com conexão à um banco de dados [mongoDB](https://www.mongodb.com/) através do [Mongoose](https://mongoosejs.com/), e autenticação JWT através do [Passport.js](http://www.passportjs.org/)

### Testes
Para rodar os testes com [Jest](https://jestjs.io/):
````
$ yarn test
````
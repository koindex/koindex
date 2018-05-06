# Koindex


## Installation

Install `yo`, `gulp-cli`, and `generator-angular-fullstack`:
```
npm install -g yo gulp-cli generator-angular-fullstack
```
__Please note__: If you run into trouble compiling native add-ons during the installation, follow [`node-gyp`](https://github.com/nodejs/node-gyp)'s short guide on [required compilation tools](https://github.com/nodejs/node-gyp#installation).

## Usage

```sh
gulp serve
```

The following generators can be used to create templates:

* App
    - [angular-fullstack](https://angular-fullstack.github.io/generators/app/)
* Server Side
    - [angular-fullstack:endpoint](https://angular-fullstack.github.io/generators/endpoint)
* Client Side (via [generator-ng-component](https://github.com/DaftMonk/generator-ng-component))
    - [angular-fullstack:route](https://angular-fullstack.github.io/generators/route)
    - [angular-fullstack:component](https://angular-fullstack.github.io/generators/component)
    - [angular-fullstack:controller](https://angular-fullstack.github.io/generators/controller)
    - [angular-fullstack:filter](https://angular-fullstack.github.io/generators/filter)
    - [angular-fullstack:directive](https://angular-fullstack.github.io/generators/directive)
    - [angular-fullstack:service](https://angular-fullstack.github.io/generators/service)
    - [angular-fullstack:provider](https://angular-fullstack.github.io/generators/service)
    - [angular-fullstack:factory](https://angular-fullstack.github.io/generators/service)
    - [angular-fullstack:decorator](https://angular-fullstack.github.io/generators/decorator)
* Deployment
    - [angular-fullstack:openshift](https://angular-fullstack.github.io/generators/openshift)
    - [angular-fullstack:heroku](https://angular-fullstack.github.io/generators/heroku)

Example: 
```
yo angular-fullstack:endpoint newEndPointName
```

**See the [Getting Started](https://angular-fullstack.github.io/get-started/) guide for more information.**


## Supported Configurations

**General**

* Build Systems: `Gulp`
* Testing: 
  * `Jasmine`
  * `Mocha + Chai + Sinon`
    * Chai assertions:
      * `Expect`
      * `Should`

**Client**

* Scripts: `JavaScript (Babel)`, `TypeScript`
* Module Systems: `Webpack`
* Markup:  `HTML`, `Pug`
* Stylesheets: `CSS`, `Stylus`, `Sass`, `Less`
* Angular Routers: `ngRoute`, `ui-router`
* CSS Frameworks: `Bootstrap`
  * Option to include `UI Bootstrap`

**Server**

* Scripts: `JavaScript (Babel)`, `TypeScript` (planned)
* Database:
  * `None`,
  * `MongoDB`, `SQL`
    * Authentication boilerplate: `Yes`, `No`
    * oAuth integrations: `Facebook`, `Twitter`, `Google`
    * Socket.io integration: `Yes`, `No`


## Add New Database Configurations

Configure database parameters in `server/config/environment/index.js`, 

An example of postgres database configuration added into variable `all`

postgres: {      
    
    uri: process.env.POSTGRES_URL ||
         
         'postgres://username:password@localhost:5432/database',
         
          options: {
            
             db: {
            
                 safe: true
            
                }
            
            }
    
    },
    
    database: 'example',
    
    username: 'example',
    
    password: 'example',
    
    seedDB: true,

};

Configure database parameters in `server/config/environment/development.js`, `server/config/environment/production.js`,

sequelize: {

uri: process.env.POSTGRES_URL || 'postgres://username:password@localhost:5432/database',

};

The function to test DB connection: 

  function testDB(){

    sqldb.sequelize

    .authenticate()

    .then(() => {

      console.log('Connection has been established successfully.');

    })

    .catch(err => {

      console.error('Unable to connect to the database:', err);

    });

  }



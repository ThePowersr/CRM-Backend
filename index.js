
const { ApolloServer } =require('apollo-server');
const resolvers = require('./db/resolvers');
const typeDefs = require('./db/schema');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });
const { ApolloServerPluginLandingPageGraphQLPlayground } = require ('apollo-server-core/dist/plugin/landingPage/graphqlPlayground');

const conectarDB = require('./config/db.js')

conectarDB();

// Servidor 
const server = new ApolloServer({
    typeDefs, 
    resolvers,
    context:({req}) =>{
        // console.log(req.headers['authorization'])
        const token = req.headers['authorization'] || '';
        if(token){
            try {
                const usuario = jwt.verify(token, process.env.SECRETA )
                console.log(usuario) 
                return {
                    usuario
                }
            } catch (error) {
                console.log('Hubo un error');
                console.log(error)
            }
        }
    },
    plugins:[ApolloServerPluginLandingPageGraphQLPlayground()],
});

// Arrancar el servidor
server.listen().then( ({url}) => {
    console.log(`Servidor listo en la URL ${url}`)
} )

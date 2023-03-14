
const { ApolloServer } =require('apollo-server')
const resolvers = require('./db/resolvers')
const typeDefs = require('./db/schema')
const { ApolloServerPluginLandingPageGraphQLPlayground } = require ('apollo-server-core/dist/plugin/landingPage/graphqlPlayground');

const conectarDB = require('./config/db.js')

conectarDB();

// Servidor 
const server = new ApolloServer({
    typeDefs, 
    resolvers,
    context: () => {
        const miContext = "Hola";
        
        return {
            miContext
        }
    },
    plugins:[ApolloServerPluginLandingPageGraphQLPlayground()],
});

// Arrancar el servidor
server.listen().then( ({url}) => {
    console.log(`Servidor listo en la URL ${url}`)
} )

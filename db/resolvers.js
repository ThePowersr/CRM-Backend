const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente')
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: 'variables.env' });

const crearToken = (usuario, secreta, expiresIn) => {
    console.log(usuario);
    const { id, email, nombre, apellido} = usuario;

    return jwt.sign( {id, email, nombre, apellido}, secreta, {expiresIn} )
}

// Resolvers
const resolvers ={
    Query:{
        obtenerUsuario: async (_, { token }) => {
            const usuarioId = await jwt.verify(token, process.env.SECRETA)

            return usuarioId;
        },
        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerProducto: async (_, { id }) => {
            // revisar si el producto existe
            const producto = await Producto.findById(id);

            if(!producto) {
                throw new Error('Producto no encontrado');
            }

            return producto;
        },

        obtenerClientes: async() => {
            try {
                const clientes = await Cliente.find({});
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerClientesVendedor: async(_, {}, ctx) => {
            try {
                const clientes = await Cliente.find({vendedor: ctx.usuario.id.toString() });
                return clientes ;
            } catch (error) {
                console.log(error)
            }
        },
        obtenerCliente: async(_, {id}, ctx)=>{
            // revisar si cliente existe
            const cliente = await Cliente.findById(id);
            if(!cliente) {
                throw new Error('Cliente no encontrado');
            }
            // Quien lo creo puede verlo
            if(cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales')
            }
            return cliente;
        }
    },
    Mutation: {
        nuevoUsuario: async (_, {input} ) => {
            
            const { email, password} = input;

            // Revisar si el usuario esta registrado
            const existeUsuario = await Usuario.findOne({email});
            if (existeUsuario){
                throw new Error('El usuario ya esta registrado')
            }

            // Hashear su password
            const salt = bcryptjs.genSaltSync(10);
            input.password = bcryptjs.hashSync(password, salt);

            // Guardar en la base de datos

            try{
                const usuario = new Usuario(input);
                usuario.save(); // Guardarlo en db
                return usuario;
            } catch (error){
                console.log(error);
            }
        },
        autenticarUsuario: async (_, {input}) => {
            const { email, password} = input;
            
            // Si el usuario existe
            const existeUsuario = await Usuario.findOne({email});
            if (!existeUsuario){
                throw new Error('El usuario no existe')
            }

            // Revisar password correcto o no 
            const passwordCorrecto = await bcryptjs.compare( password, existeUsuario.password );
            if(!passwordCorrecto){
                throw new Error('El password es Incorrecto')
            }

            // Crear el token
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '24h')
            }
        },
        nuevoProducto: async (_, { input })=> {
            try {
                const nuevoProducto = new Producto(input);

                // almacenar en la bd
                const producto = await nuevoProducto.save();
                return producto;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarProducto: async (_, {id, input}) => {
            // revisar si el producto existe
            let producto = await Producto.findById(id);

            if(!producto) {
                throw new Error('Producto no encontrado');
            }

            // guardarlo en la base de datos
            producto = await Producto.findOneAndUpdate({ _id: id }, input, { new: true });
            return producto;
        },
        eliminarProducto: async(_,{id})=>{
            // revisar si el producto existe
            let producto = await Producto.findById(id);

            if(!producto) {
                throw new Error('Producto no encontrado');
            }

            // Eliminar
            await Producto.findOneAndDelete({_id : id});
            return "Producto Eliminado";
        },
        nuevoCliente: async(_, { input }, ctx)=>{
            // Verificar si el cliente ya esta registrado
            const {email} = input;
            const existeCliente = await Cliente.findOne({email});
            if (existeCliente){
                throw new Error('El cliente ya existe');
            }

            const nuevoCliente = new Cliente(input);
            // asignar el vendedor
            nuevoCliente.vendedor = ctx.usuario.id;

            // guardarlo en la base de datos

            try {
                const guardar = await nuevoCliente.save();
                return guardar;
            } catch (error) {
                console.log(error)    
            }
        },
        actualizarCliente: async(_, {id, input}, ctx)=> {
            // Revisar si el cliente existe.
            let cliente = await Cliente.findById(id)
            if(!cliente){
                throw new Error('Cliente no existe')
            }
            // Verificar si el vendedor es el que edita
            if(cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales')
            }
            cliente = await Cliente.findOneAndUpdate({ _id: id }, input, { new: true });
            return cliente
        },
        eliminarCliente: async(_, {id}, ctx)=> {
            // encontrar cliente 
            let cliente = await Cliente.findById(id)
            if(!cliente) {
                throw new Error('Cliente no existe');
            }
            // verificar si el vendedor es quien elimina
            if(cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales')
            }
            // Eliminar cliente
            await Cliente.findOneAndDelete({_id : id});
            return "Cliente Eliminado";
        }
    }
}

module.exports= resolvers;
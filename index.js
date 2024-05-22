const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require("express");
const { db } = require('./firebaseConfig');
const app = express();
const { doc, setDoc } = require("firebase/firestore");


// Middleware para parsear JSON
app.use(express.json());

const getUserEmail = async (username) => {
    try {
        console.log(username)
        // Buscar el usuario en la base de datos
        const userRef = db.collection('users').doc(username);
        const doc = await userRef.get();

        if (!doc.exists) {
            throw new Error("Usuario no encontrado");
        }

        const user = doc.data();
        console.log( user.email)
        return user.email;
    } catch (error) {
        throw new Error("Error al obtener el correo del usuario: " + error.message);
    }
};
app.post("/getUserEmail", async (req, res) => {
    const { username } = req.body;
    console.log(username);

    try {
        const email = await getUserEmail(username);
        res.send({ message: "Correo obtenido exitosamente", email });
        console.log({ message: "Correo obtenido exitosamente", email });
    } catch (error) {
        logger.error("Error al obtener el correo del usuario", error);
        res.status(500).send({ message: "Error al obtener el correo del usuario", error: error.message });
    }
});
app.post("/register", async (req, res) => {
    const { email, username, password } = req.body;
    console.log(email, username, password);

    try {
        // Verificar si el nombre de usuario ya existe
        const userDoc = await db.collection('users').doc(username).get();
        if (userDoc.exists) {
            return res.status(400).send({ message: "El nombre de usuario ya está en uso" });
        }

        // Verificar si el correo electrónico ya está en uso
        const emailQuery = await db.collection('users').where('email', '==', email).get();
        if (!emailQuery.empty) {
            return res.status(400).send({ message: "El correo electrónico ya está en uso" });
        }

        // Crear un nuevo documento en la colección 'users'
        await db.collection('users').doc(username).set({
            email,
            username,
            password  // Nota: En un entorno real, nunca deberías almacenar contraseñas en texto plano.
        });

        res.send({ message: "Usuario registrado con éxito", user: { email, username } });
    } catch (error) {
        logger.error("Error en el registro", error);
        res.status(500).send({ message: "Error registrando usuario", error });
    }
});


app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);

    try {
        // Buscar el usuario en la base de datos
        const userRef = db.collection('users').doc(username);
        const doc = await userRef.get();
        
        if (!doc.exists) {
            return res.status(400).send({ message: "Usuario no encontrado" });
        }

        const user = doc.data();

        // Verificar la contraseña (en un entorno real, usa bcrypt para comparar contraseñas hasheadas)
        if (user.password !== password) {
            return res.status(400).send({ message: "Contraseña incorrecta" });
        }

        res.send({ message: "Inicio de sesión exitoso", user: { username } });
        console.log({ message: "Inicio de sesión exitoso", user: { username } })
    } catch (error) {
        logger.error("Error en el inicio de sesión", error);
        res.status(500).send({ message: "Error en el inicio de sesión", error });
    }
});
app.post("/storeBmiData", async (req, res) => {
    const { username, peso, altura, imc, fecha } = req.body;

    if (!username || !peso || !altura || !imc || !fecha) {
        return res.status(400).send({ message: "Todos los campos son requeridos." });
    }

    try {
        // Reference to the BMI data collection
        const bmiCollectionRef = db.collection('bmiData');

        // Data to be stored
        const bmiData = {
            username,
            peso,
            altura,
            imc,
            fecha:fecha // Convert date string to Firestore Timestamp
        };

        // Store the data in Firestore with a generated ID
        await bmiCollectionRef.add(bmiData);

        res.send({ message: "Datos de IMC almacenados con éxito" });
    } catch (error) {
        logger.error("Error al almacenar datos de IMC", error);
        res.status(500).send({ message: "Error al almacenar datos de IMC", error: error.message });
    }
});
exports.api = onRequest(app);

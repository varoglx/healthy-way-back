const admin = require('firebase-admin');
const serviceAccount = require('./service/service-account-file.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://healthy-way-f7636.firebaseio.com"
});

const firestore = admin.firestore();

async function testFirestore() {
    try {
        const usersCollection = firestore.collection('users');
        
        // Crear un documento de prueba en la colección 'users'
        await usersCollection.doc('testUser').set({
            username: 'testUser',
            password: 'testPassword'
        });
        
        console.log('Firestore está funcionando correctamente y se creó la colección "users"');
    } catch (error) {
        console.error('Error probando Firestore:', error);
    }
}

testFirestore();

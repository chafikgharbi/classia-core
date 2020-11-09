import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
import "firebase/auth";
import "firebase/database";

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.firebaseApiKey,
  authDomain: process.env.firebaseAuthDomain,
  databaseURL: process.env.firebaseDatabaseURL,
  projectId: process.env.firebaseProjectId,
  storageBucket: process.env.firebaseStorageBucket,
  messagingSenderId: process.env.firebaseMessagingSenderId,
  appId: process.env.firebaseAppId,
  measurementId: process.env.firebaseMeasurementId,
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);

  firebase.firestore().settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  });

  //firebase.firestore().enablePersistence();
}

firebase.auth().languageCode = "fr";

export default firebase;
export var firestore = firebase.firestore()
export var database = firebase.database()
export var storage = firebase.storage()

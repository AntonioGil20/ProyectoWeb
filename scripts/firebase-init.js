// firebase-init.js (usa type="module")
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB_yszsrG6VgYg2Dt9tnSTXBjD0zNPixRE",
  authDomain: "tacosypapasdb.firebaseapp.com",
  databaseURL: "https://tacosypapasdb-default-rtdb.firebaseio.com",
  projectId: "tacosypapasdb",
  storageBucket: "tacosypapasdb.appspot.com",
  messagingSenderId: "977630886123",
  appId: "1:977630886123:web:40f8b2dbe551e6ff3266ae",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };

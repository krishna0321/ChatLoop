import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideStorage, getStorage } from '@angular/fire/storage';

const firebaseConfig = {
   apiKey: "AIzaSyAPF9vlJuj1GMrWZMTz1f1l1PgOYB_2JpU",
    authDomain: "chatloop-e7f8e.firebaseapp.com",
    projectId: "chatloop-e7f8e",
    storageBucket: "chatloop-e7f8e.appspot.com",
    messagingSenderId: "195312912930",
    appId: "1:195312912930:web:e171a6e8afc3f5bb80187b"
};

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage()),
  ],
});

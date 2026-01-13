import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';

import { ThemeService } from './app/core/services/theme.service';
import { getStorage, provideStorage } from '@angular/fire/storage';

const themeService = new ThemeService();
themeService.initTheme();


bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()), provideFirebaseApp(() => initializeApp({"projectId":"chatloop-e7f8e","appId":"1:195312912930:web:e171a6e8afc3f5bb80187b","storageBucket":"chatloop-e7f8e.firebasestorage.app","apiKey":"AIzaSyAPF9vlJuj1GMrWZMTz1f1l1PgOYB_2JpU","authDomain":"chatloop-e7f8e.firebaseapp.com","messagingSenderId":"195312912930","measurementId":"G-BRNN63YSF8","projectNumber":"195312912930","version":"2"})), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideStorage(() => getStorage()),
  ],
}).catch(console.error);

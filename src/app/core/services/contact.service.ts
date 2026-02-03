import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from '@angular/fire/firestore';

export interface Contact {
  id?: string;
  name: string;
  phone: string;
  uid?: string;
  photoURL?: string;  
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private firestore: Firestore) {}

  listenContacts(myUid: string, cb: (list: Contact[]) => void) {
    const ref = collection(this.firestore, `users/${myUid}/contacts`);

    return onSnapshot(ref, (snap) => {
      const list: Contact[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      cb(list);
    });
  }

  addContact(myUid: string, contact: Contact) {
    const ref = collection(this.firestore, `users/${myUid}/contacts`);

    return addDoc(ref, {
      name: contact.name || '',
      phone: contact.phone || '',
      uid: contact.uid || '',
      createdAt: serverTimestamp(),
    });
  }

  deleteContact(myUid: string, contactId: string) {
    const ref = doc(this.firestore, `users/${myUid}/contacts/${contactId}`);
    return deleteDoc(ref);
  }
}

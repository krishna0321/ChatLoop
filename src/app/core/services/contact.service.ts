import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc
} from '@angular/fire/firestore';

export interface Contact {
  id?: string;
  name: string;
  phone: string;
  uid?: string; // if contact is registered user
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private firestore: Firestore) {}

  listenContacts(myUid: string, cb: (list: Contact[]) => void) {
    const ref = collection(this.firestore, `users/${myUid}/contacts`);
    const q = query(ref, orderBy('createdAt', 'desc'));

    return onSnapshot(q, snap => {
      cb(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Contact[]);
    });
  }

  addContact(myUid: string, data: Contact) {
    return addDoc(collection(this.firestore, `users/${myUid}/contacts`), {
      ...data,
      createdAt: serverTimestamp()
    });
  }

  deleteContact(myUid: string, contactId: string) {
    return deleteDoc(
      doc(this.firestore, `users/${myUid}/contacts/${contactId}`)
    );
  }
}

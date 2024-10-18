import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';

interface UserData {
  email: string;
  profileImageUrl?: string;
}

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage implements OnInit {
  user: firebase.User | null = null;
  userProfileImageUrl: string | null = null;
  userEmail: string | null = null;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    public router: Router
  ) {}

  ngOnInit() {
    // Cargar los datos del usuario desde localStorage o Firebase
    this.userProfileImageUrl = localStorage.getItem('userProfileImageUrl');
    this.userEmail = localStorage.getItem('userEmail');
    
    // Si no hay datos en localStorage, obtenerlos de Firestore
    if (!this.userProfileImageUrl || !this.userEmail) {
      this.afAuth.authState.subscribe(user => {
        if (user) {
          this.loadUserData(user.uid);
        } else {
          this.router.navigateByUrl('/login');
        }
      });
    }
  }

  // Cargar los datos del usuario desde Firestore y actualizar localStorage
  private async loadUserData(uid: string) {
    try {
      const userDoc = await this.firestore.collection('users').doc(uid).get().toPromise();
      if (userDoc?.exists) {
        const userData = userDoc.data() as UserData;
        this.userProfileImageUrl = userData.profileImageUrl || null;
        this.userEmail = userData.email;

        // Guardar los datos en localStorage
        localStorage.setItem('userProfileImageUrl', this.userProfileImageUrl || '');
        localStorage.setItem('userEmail', this.userEmail);
      } else {
        console.error('No se encontraron datos del usuario en Firestore');
      }
    } catch (error) {
      console.error('Error al obtener los datos del usuario:', error);
    }
  }

  async logout() {
    try {
      await this.afAuth.signOut();
      localStorage.clear(); // Limpiar localStorage al cerrar sesión
      this.router.navigateByUrl('/home');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  entradaSede() {
    console.log('Entrada Sede registrada');
  }

  salidaSede() {
    console.log('Salida Sede registrada');
  }

  entradaClases() {
    console.log('Entrada Clases registrada');
  }

  salidaClases() {
    console.log('Salida Clases registrada');
  }
}



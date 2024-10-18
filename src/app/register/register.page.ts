import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { finalize } from 'rxjs/operators';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  registerForm: FormGroup;
  selectedImage: string | ArrayBuffer | null = null; 
  imageFile: File | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private afAuth: AngularFireAuth,
    private router: Router,
    private storage: AngularFireStorage,
    private firestore: AngularFirestore
  ) {
    // El email solo requiere un validador de email y patrón, minlength en password se ajusta a 8
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  // Método para seleccionar y leer una imagen de archivo
  async selectImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      this.imageFile = file;
      this.readFile(file);
    };
    input.click();
  }

  private readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.selectedImage = reader.result as string; // Convierte el resultado a base64
    };
    reader.readAsDataURL(file);
  }

  async register() {
    if (this.registerForm.valid && this.imageFile) {
      try {
        const { email, password } = this.registerForm.value;
        const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);

        const filePath = `users/${userCredential.user?.uid}/profile_image`;
        const fileRef = this.storage.ref(filePath);
        const uploadTask = this.storage.upload(filePath, this.imageFile);

        uploadTask.snapshotChanges().pipe(
          finalize(async () => {
            const downloadURL = await fileRef.getDownloadURL().toPromise();
            await this.saveUserData(userCredential.user?.uid!, email, downloadURL); // ! asegura que uid no es undefined
            this.router.navigateByUrl('/inicio');
          })
        ).subscribe();
      } catch (error) {
        console.error('Error en el registro:', error);
      }
    }
  }

  private async saveUserData(uid: string, email: string, imageUrl: string) {
    try {
      await this.firestore.collection('users').doc(uid).set({
        email,
        profileImageUrl: imageUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid
      });
    } catch (error) {
      console.error('Error al guardar los datos en Firestore:', error);
    }
  }

  // Métodos de validación simplificados y específicos para mensajes de error
  getEmailError(): string {
    const emailControl = this.registerForm.get('email');
    if (emailControl?.hasError('required')) return 'El correo es obligatorio.';
    if (emailControl?.hasError('email')) return 'El formato del correo es inválido.';
    if (emailControl?.hasError('pattern')) return 'El correo debe terminar en @gmail.com.';
    return '';
  }

  getPasswordError(): string {
    const passwordControl = this.registerForm.get('password');
    if (passwordControl?.hasError('required')) return 'La contraseña es obligatoria.';
    if (passwordControl?.hasError('minlength')) return 'La contraseña debe tener al menos 8 caracteres.';
    return '';
  }
}




import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private readonly FORM_SUBMIT_URL = 'https://formsubmit.co/ajax/generalovshura9@gmail.com';

  async submitOrder(payload: Record<string, unknown>): Promise<boolean> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    try {
      await firstValueFrom(
        this.http.post(this.FORM_SUBMIT_URL, payload, { headers })
      );
      return true;
    } catch (error) {
      console.error('Ошибка отправки:', error);
      return false;
    }
  }
}

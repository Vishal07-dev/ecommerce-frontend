// services/chat.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private baseUrl = 'https://ecommerce-backend-n4tk.onrender.com/api/chat'; // adjust as needed

  constructor(private http: HttpClient) {}

  sendMessage(message: string) {
    return this.http.post<{ reply: string }>(this.baseUrl, { message });
  }
}

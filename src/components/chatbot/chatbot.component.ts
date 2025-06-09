import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chatbot',
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  userInput = '';
  messages: { from: 'user' | 'bot', text: string, timestamp?: Date }[] = [];
  isOpen = false;
  isTyping = false;
  hasNewMessage = false;
  unreadCount = 0;

  constructor(private http: HttpClient) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.hasNewMessage = false;
      this.unreadCount = 0;
      // Focus on input when chat opens
      setTimeout(() => {
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    }
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.isTyping) return;

    // Add user message
    this.messages.push({ 
      from: 'user', 
      text, 
      timestamp: new Date() 
    });
    this.userInput = '';
    this.isTyping = true;

    // Simulate typing delay for better UX
    setTimeout(() => {
      this.http.post<any>('https://fjdhhqtq-2000.inc1.devtunnels.ms/api/chat', { message: text }).subscribe(
        (res) => {
          this.isTyping = false;
          this.messages.push({ 
            from: 'bot', 
            text: res.reply || 'I received your message!',
            timestamp: new Date()
          });
          
          // Show notification if chat is closed
          if (!this.isOpen) {
            this.hasNewMessage = true;
            this.unreadCount++;
          }
        },
        (error) => {
          this.isTyping = false;
          this.messages.push({ 
            from: 'bot', 
            text: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
            timestamp: new Date()
          });
          
          // Show notification if chat is closed
          if (!this.isOpen) {
            this.hasNewMessage = true;
            this.unreadCount++;
          }
        }
      );
    }, 800); // Small delay to show typing indicator
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.log('Could not scroll to bottom');
      }
    }
  }
}
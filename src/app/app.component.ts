import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from './order.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private orderService = inject(OrderService);

  public readonly DELIVERY_FEE = 50;
  public readonly SMALL_PRICE = 40;
  public readonly LARGE_PRICE = 60;

  public smallQty = signal(0);
  public largeQty = signal(0);

  public smallCost = computed(() => this.smallQty() * this.SMALL_PRICE);
  public largeCost = computed(() => this.largeQty() * this.LARGE_PRICE);
  public total = computed(() => this.DELIVERY_FEE + this.smallCost() + this.largeCost());

  public modalOpen = signal(false);
  public formStatus = signal<'idle' | 'sending' | 'success' | 'error'>('idle');
  public formStatusMessage = signal('');

  public bannerVisible = true;

  public formData = {
    name: '',
    phone: '',
    email: '',
    address: '',
    time: '',
    comment: ''
  };

  public increment(type: 'small' | 'large') {
    if (type === 'small') this.smallQty.update(v => v + 1);
    else this.largeQty.update(v => v + 1);
  }

  public decrement(type: 'small' | 'large') {
    if (type === 'small') this.smallQty.update(v => Math.max(0, v - 1));
    else this.largeQty.update(v => Math.max(0, v - 1));
  }

  public openModal() {
    this.modalOpen.set(true);
    this.formStatus.set('idle');
  }

  public closeModal() {
    this.modalOpen.set(false);
    this.formStatus.set('idle');
    this.resetForm();
  }

  public resetForm() {
    this.formData = { name: '', phone: '', email: '', address: '', time: '', comment: '' };
  }

  public async onSubmit() {
    if (!this.formData.name || !this.formData.phone || !this.formData.email ||
        !this.formData.address || !this.formData.time) {
      this.formStatus.set('error');
      this.formStatusMessage.set('❌ Пожалуйста, заполните все обязательные поля!');
      return;
    }

    if (!this.formData.email.includes('@') || !this.formData.email.includes('.')) {
      this.formStatus.set('error');
      this.formStatusMessage.set('❌ Введите корректный email адрес!');
      return;
    }

    this.formStatus.set('sending');
    this.formStatusMessage.set('📨 Отправляем заявку...');

    const messageText = this.buildMessage();
    const payload = {
      name: this.formData.name,
      phone: this.formData.phone,
      email: this.formData.email,
      address: this.formData.address,
      time: this.formData.time,
      smallBags: this.smallQty(),
      largeBags: this.largeQty(),
      total: this.total() + ' ₽',
      comment: this.formData.comment || 'Нет',
      message: messageText,
      _subject: `🚛 Новая заявка на вывоз мусора от ${this.formData.name}`,
      _template: 'table'
    };

    const success = await this.orderService.submitOrder(payload);

    if (success) {
      this.formStatus.set('success');
      this.formStatusMessage.set('✅ Заявка успешно отправлена! Я свяжусь с вами в ближайшее время.');
      this.smallQty.set(0);
      this.largeQty.set(0);
      setTimeout(() => this.closeModal(), 3000);
    } else {
      this.formStatus.set('error');
      this.formStatusMessage.set('❌ Ошибка отправки. Попробуйте позвонить по телефону.');
    }
  }

  private buildMessage(): string {
    const smallCost = this.smallCost();
    const largeCost = this.largeCost();
    const dateStr = new Date().toLocaleString('ru-RU');
    return `
      🚛 НОВАЯ ЗАЯВКА НА ВЫВОЗ МУСОРА
      ━━━━━━━━━━━━━━━━━━━━━━━━

      👤 ИНФОРМАЦИЯ О КЛИЕНТЕ:
      Имя: ${this.formData.name}
      📞 Телефон: ${this.formData.phone}
      📧 Email: ${this.formData.email}
      🏠 Адрес: ${this.formData.address}
      ⏰ Желаемое время: ${this.formData.time}

      📦 ДЕТАЛИ ЗАКАЗА:
      • Пакетов до 30л (40₽/шт): ${this.smallQty()} шт = ${smallCost}₽
      • Пакетов 30-60л (60₽/шт): ${this.largeQty()} шт = ${largeCost}₽
      • Выезд курьера: ${this.DELIVERY_FEE}₽

      💰 ПРЕДВАРИТЕЛЬНАЯ СУММА: ${this.total()}₽

      💬 КОММЕНТАРИЙ КЛИЕНТА:
      ${this.formData.comment || 'Не указан'}

      ━━━━━━━━━━━━━━━━━━━━━━━━
      📅 Дата заявки: ${dateStr}
      📍 Город: Псков
    `;
  }
}

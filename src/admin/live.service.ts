import { Injectable, computed, inject, signal } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';
import { AdminNotification, AdminService } from './admin.service';

const SEEN_KEY = 'kora.admin.seen';
const POLL_MS = 30_000;

/**
 * Keeps the admin panel live: polls notifications every 30 seconds while the
 * tab is visible, counts the unread ones, and toasts a new order the moment
 * it shows up. Pages subscribe to `tick` to refresh their own data on the
 * same beat.
 */
@Injectable({ providedIn: 'root' })
export class AdminLiveService {
  private admin = inject(AdminService);
  private toast = inject(HotToastService);

  readonly items = signal<AdminNotification[]>([]);
  readonly lastSync = signal<Date | null>(null);
  readonly offline = signal(false);
  /** Increments on every poll; pages refresh when it changes. */
  readonly tick = signal(0);
  private readonly seenAt = signal<number>(this.readSeen());
  readonly unread = computed(() => this.items().filter(n => new Date(n.at).getTime() > this.seenAt()).length);
  isUnread = (n: AdminNotification) => new Date(n.at).getTime() > this.seenAt();

  private timer?: ReturnType<typeof setInterval>;
  private known = new Set<string>();
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    this.poll(true);
    this.timer = setInterval(() => { if (document.visibilityState === 'visible') this.poll(false); }, POLL_MS);
    document.addEventListener('visibilitychange', this.onVisible);
  }

  stop(): void {
    clearInterval(this.timer);
    document.removeEventListener('visibilitychange', this.onVisible);
    this.started = false;
  }

  refresh(): void { this.poll(false); }

  markAllRead(): void {
    const now = Date.now();
    this.seenAt.set(now);
    try { localStorage.setItem(SEEN_KEY, String(now)); } catch { /* storage blocked */ }
  }

  private onVisible = () => { if (document.visibilityState === 'visible') this.poll(false); };

  private poll(first: boolean): void {
    this.admin.notifications().subscribe({
      next: res => {
        // Toast orders that arrived since the last poll (not on first load).
        if (!first) {
          res.items.filter(n => n.kind === 'order' && !this.known.has(n.id))
            .forEach(n => this.toast.success(`${n.title} from ${n.detail}`, { duration: 6000 }));
        }
        res.items.forEach(n => this.known.add(n.id));
        this.items.set(res.items);
        this.lastSync.set(new Date());
        this.offline.set(false);
        this.tick.update(t => t + 1);
      },
      error: () => this.offline.set(true),
    });
  }

  private readSeen(): number {
    try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; }
  }
}

import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { HotToastService } from '@ngxpert/hot-toast';
import { Observable, Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService, ROLE_HELP, ROLE_LABEL, Team, TeamInvite, TeamMember, TeamRole, adminError } from '../admin.service';
import { closeDialog, openDialog } from '../../ui/dialog';

type Pending =
  | { kind: 'role'; member: TeamMember; role: TeamRole }
  | { kind: 'remove'; member: TeamMember };

const ROLES: TeamRole[] = ['owner', 'admin', 'staff'];
const ACTION_TEXT: Record<string, string> = {
  granted: 'gave access to', changed: 'changed the role of', removed: 'removed access for',
  invited: 'created an invite for', 'invite-revoked': 'cancelled the invite for', 'invite-accepted': 'invite accepted by',
};

/** Team: who can use Studio, and how they got access. Owners only. */
@Component({
  selector: 'app-team',
  imports: [DatePipe],
  templateUrl: './team.component.html',
})
export class TeamComponent {
  private admin = inject(AdminService);
  private toast = inject(HotToastService);
  private addDialog = viewChild.required<ElementRef<HTMLDialogElement>>('addDialog');
  private inviteDialog = viewChild.required<ElementRef<HTMLDialogElement>>('inviteDialog');
  private confirmDialog = viewChild.required<ElementRef<HTMLDialogElement>>('confirmDialog');

  readonly roles = ROLES;
  readonly roleLabel = ROLE_LABEL;
  readonly roleHelp = ROLE_HELP;
  readonly team = signal<Team | null>(null);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly formError = signal<string | null>(null);

  // Add an existing account
  private search$ = new Subject<string>();
  readonly results = signal<{ _id: string; name: string; email: string; createdAt: string }[]>([]);
  readonly searched = signal(false);
  readonly picked = signal<{ _id: string; name: string; email: string } | null>(null);
  readonly addRole = signal<TeamRole>('staff');

  // Invite
  readonly inviteRole = signal<TeamRole>('staff');
  readonly inviteNote = signal('');
  readonly created = signal<TeamInvite | null>(null);

  // Change role / remove
  readonly pending = signal<Pending | null>(null);

  readonly owners = computed(() => (this.team()?.members ?? []).filter(m => m.role === 'owner').length);

  constructor() {
    inject(Title).setTitle('Team — KŌRA Studio');
    this.load();
    this.search$.pipe(
      debounceTime(250), distinctUntilChanged(),
      switchMap(q => this.admin.searchAccounts(q)),
      takeUntilDestroyed(),
    ).subscribe({ next: r => { this.results.set(r.accounts); this.searched.set(true); } });
  }

  load(): void {
    this.admin.team().subscribe({
      next: t => { this.team.set(t); this.error.set(null); },
      error: e => this.error.set(adminError(e, 'Couldn’t load the team.').message),
    });
  }

  isMe(m: TeamMember): boolean { return m._id === this.team()?.me; }
  activity(a: { action: string; actorName?: string; targetName?: string; role?: string; previousRole?: string }): string {
    const who = a.actorName ? cap(a.actorName) : 'Someone';
    const role = a.role && a.role !== 'user' ? ` (${ROLE_LABEL[a.role as TeamRole] ?? a.role})` : '';
    if (a.action === 'invite-accepted') return `${cap(a.targetName ?? 'Someone')} joined from an invite${role}`;
    if (a.action === 'changed') return `${who} changed ${cap(a.targetName ?? '')} from ${ROLE_LABEL[a.previousRole as TeamRole] ?? a.previousRole} to ${ROLE_LABEL[a.role as TeamRole] ?? a.role}`;
    return `${who} ${ACTION_TEXT[a.action] ?? a.action} ${a.targetName ?? ''}${a.action === 'removed' ? '' : role}`;
  }
  hoursLeft(iso: string): string {
    const h = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000));
    return h <= 1 ? 'under an hour' : `${h} hours`;
  }

  // --- Add an existing account -----------------------------------------------
  openAdd(): void {
    this.formError.set(null); this.picked.set(null); this.results.set([]); this.searched.set(false); this.addRole.set('staff');
    openDialog(this.addDialog().nativeElement);
    setTimeout(() => document.getElementById('team-search')?.focus(), 50);
  }
  onSearch(v: string): void { this.picked.set(null); this.searched.set(false); this.search$.next(v.trim()); }
  submitAdd(password: string): void {
    const p = this.picked();
    if (!p) { this.formError.set('Choose the account to add.'); return; }
    if (!password) { this.formError.set('Enter your password to confirm.'); return; }
    this.busy.set(true);
    this.admin.addMember(p._id, this.addRole(), password).subscribe({
      next: m => { this.busy.set(false); closeDialog(this.addDialog().nativeElement); this.toast.success(`${cap(m.name)} is now ${ROLE_LABEL[m.role]}.`); this.load(); },
      error: e => { this.busy.set(false); this.formError.set(adminError(e, 'Couldn’t add that person.').message); },
    });
  }

  // --- Invite by link --------------------------------------------------------
  openInvite(): void {
    this.formError.set(null); this.created.set(null); this.inviteRole.set('staff'); this.inviteNote.set('');
    openDialog(this.inviteDialog().nativeElement);
  }
  submitInvite(password: string): void {
    if (!password) { this.formError.set('Enter your password to confirm.'); return; }
    this.busy.set(true);
    this.admin.createInvite(this.inviteRole(), this.inviteNote(), password).subscribe({
      next: inv => { this.busy.set(false); this.created.set(inv); this.formError.set(null); this.load(); },
      error: e => { this.busy.set(false); this.formError.set(adminError(e, 'Couldn’t create the invite.').message); },
    });
  }
  copy(link: string): void {
    navigator.clipboard?.writeText(link).then(
      () => this.toast.success('Link copied. Send it to them however you like.'),
      () => this.toast.error('Couldn’t copy. Select the link and copy it.'),
    );
  }
  whatsapp(inv: TeamInvite): string {
    const text = `You're invited to KŌRA Studio as ${ROLE_LABEL[inv.role]}. Open this link within 48 hours to set up your access: ${inv.link}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  revoke(inv: TeamInvite): void {
    this.admin.revokeInvite(inv._id).subscribe({
      next: r => { this.toast.success(r.message); this.load(); },
      error: e => this.toast.error(adminError(e, 'Couldn’t cancel the invite.').message),
    });
  }

  // --- Change role / remove --------------------------------------------------
  askRole(m: TeamMember, role: TeamRole, select: HTMLSelectElement): void {
    select.value = m.role; // the change only happens after confirming
    if (role === m.role) return;
    this.pending.set({ kind: 'role', member: m, role });
    this.formError.set(null);
    openDialog(this.confirmDialog().nativeElement);
  }
  askRemove(m: TeamMember): void {
    this.pending.set({ kind: 'remove', member: m });
    this.formError.set(null);
    openDialog(this.confirmDialog().nativeElement);
  }
  submitConfirm(password: string): void {
    const p = this.pending();
    if (!p) return;
    if (!password) { this.formError.set('Enter your password to confirm.'); return; }
    this.busy.set(true);
    const req: Observable<unknown> = p.kind === 'role' ? this.admin.changeRole(p.member._id, p.role, password) : this.admin.removeMember(p.member._id, password);
    req.subscribe({
      next: () => {
        this.busy.set(false);
        closeDialog(this.confirmDialog().nativeElement);
        this.toast.success(p.kind === 'role' ? `${cap(p.member.name)} is now ${ROLE_LABEL[p.role]}.` : `${cap(p.member.name)} no longer has Studio access.`);
        this.load();
      },
      error: e => { this.busy.set(false); this.formError.set(adminError(e, 'Couldn’t make that change.').message); },
    });
  }

  close(d: HTMLDialogElement): void { closeDialog(d); }
  cap(s: string): string { return cap(s); }
}

function cap(s: string): string { return s.replace(/\b\p{L}/gu, c => c.toUpperCase()); }

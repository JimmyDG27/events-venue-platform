'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, updateProfile, updateNotifications } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { NotificationPreferences, UserProfile } from '@/lib/types';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const { token, login } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    bookingUpdates: true,
    viewingReminders: true,
    marketingEmails: false,
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    getProfile(token)
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
        setPhone(data.phone ?? '');
        if (data.notificationPreferences) {
          setNotifPrefs(data.notificationPreferences);
        }
      })
      .catch(() => {});
  }, [token]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      const updated = await updateProfile(token, {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || null,
      });
      setProfile(updated);
      // Update AuthContext user
      login(token, { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone });
      setProfileSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('409')) setProfileError(t('emailTaken'));
      else setProfileError(t('errorGeneric'));
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleNotifToggle(key: keyof NotificationPreferences, value: boolean) {
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    if (!token) return;
    setNotifLoading(true);
    setNotifSuccess(false);
    try {
      const updated = await updateNotifications(token, next);
      if (updated.notificationPreferences) {
        setNotifPrefs(updated.notificationPreferences);
      }
      setNotifSuccess(true);
    } catch {
      // revert
      setNotifPrefs(notifPrefs);
    } finally {
      setNotifLoading(false);
    }
  }

  if (!profile) {
    return (
      <p className="font-body text-sm text-muted">{t('loading')}</p>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-light text-fg">{t('title')}</h1>
        <p className="mt-1 font-body text-sm text-muted">{t('subtitle')}</p>
      </div>

      {/* Profile form */}
      <section className="border border-border bg-surface p-6">
        <h2 className="mb-6 font-body text-xs uppercase tracking-widest text-muted">{t('personalInfo')}</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-md">
          <Input label={t('nameLabel')} name="name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t('emailLabel')} name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label={t('phoneLabel')} name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} helperText={t('phoneOptional')} />

          {profileError && <p className="text-sm text-red-600">{profileError}</p>}
          {profileSuccess && <p className="text-sm text-green-700">{t('saveSuccess')}</p>}

          <Button type="submit" variant="primary" size="md" disabled={profileLoading}>
            {profileLoading ? t('saving') : t('save')}
          </Button>
        </form>
      </section>

      {/* Notifications */}
      <section className="border border-border bg-surface p-6">
        <h2 className="mb-6 font-body text-xs uppercase tracking-widest text-muted">{t('notificationsTitle')}</h2>
        <div className="space-y-4 max-w-md">
          {(
            [
              { key: 'bookingUpdates', label: t('notifBooking'), desc: t('notifBookingDesc') },
              { key: 'viewingReminders', label: t('notifViewing'), desc: t('notifViewingDesc') },
              { key: 'marketingEmails', label: t('notifMarketing'), desc: t('notifMarketingDesc') },
            ] as const
          ).map(({ key, label, desc }) => (
            <label key={key} className="flex cursor-pointer items-start gap-4">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={!!notifPrefs[key]}
                  onChange={(e) => handleNotifToggle(key, e.target.checked)}
                  disabled={notifLoading}
                />
                <div
                  className={`h-5 w-9 rounded-full transition-colors duration-200 ${notifPrefs[key] ? 'bg-accent' : 'bg-border'}`}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${notifPrefs[key] ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </div>
              </div>
              <div>
                <p className="font-body text-sm text-fg">{label}</p>
                <p className="font-body text-xs text-muted">{desc}</p>
              </div>
            </label>
          ))}

          {notifSuccess && <p className="text-sm text-green-700">{t('notifSaved')}</p>}
        </div>
      </section>
    </div>
  );
}

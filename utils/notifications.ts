// utils/notifications.ts

export type UserRole = 'technician' | 'customer' | 'admin';

interface NotificationPayload {
  title: string;
  body: string;
  targetRole: UserRole;
  tag?: string;
}

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendRoleNotification = async (
  payload: NotificationPayload, 
  currentUserRole: UserRole
) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  if (currentUserRole === 'admin' || currentUserRole === payload.targetRole) {
    new Notification(payload.title, {
      body: payload.body,
      tag: payload.tag || 'hoistec-alert',
    });
  }
};

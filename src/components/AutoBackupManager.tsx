import React, { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { backupToDrive } from '../utils/backupToDrive';

interface AutoBackupManagerProps {
  users: any[];
  setUsers: (users: any[]) => void;
  getBackupData: () => any;
  logActivity: (action: string, details: string) => void;
  currentUserRole?: string;
}

export const AutoBackupManager: React.FC<AutoBackupManagerProps> = ({ users, setUsers, getBackupData, logActivity, currentUserRole }) => {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkBackup = async () => {
      const driveConfigUser = users.find(u => u.id === 'drive_backup_config');
      if (!driveConfigUser) return;

      const frequency = driveConfigUser.backupFrequency || 'manual';
      if (frequency === 'manual') return;

      const lastBackupDate = driveConfigUser.lastBackupDate;
      const customDays = driveConfigUser.customDays || 1;

      let daysRequired = 0;
      switch (frequency) {
        case 'daily': daysRequired = 1; break;
        case 'weekly': daysRequired = 7; break;
        case 'monthly': daysRequired = 30; break;
        case 'custom': daysRequired = customDays; break;
      }

      if (daysRequired > 0) {
        let shouldBackup = false;
        if (!lastBackupDate) {
          shouldBackup = true;
        } else {
          const lastDate = new Date(lastBackupDate).getTime();
          const now = new Date().getTime();
          const daysSince = (now - lastDate) / (1000 * 60 * 60 * 24);
          if (daysSince >= daysRequired) {
            shouldBackup = true;
          }
        }

        if (shouldBackup) {
          try {
            // First check if we have a token (this throws if not authenticated)
            const backupData = getBackupData();
            await backupToDrive(backupData);
            
            // Success
            const newCount = (driveConfigUser.backupCount || 0) + 1;
            const newDate = new Date().toISOString();
            
            const updatedUsers = users.map(u => 
              u.id === 'drive_backup_config' 
                ? { ...u, backupCount: newCount, lastBackupDate: newDate } 
                : u
            );
            setUsers(updatedUsers);
            
            toast.success('تم أخذ النسخة الاحتياطية التلقائية بنجاح على Google Drive');
            logActivity('نسخ احتياطي تلقائي', 'تم أخذ نسخة احتياطية تلقائية بنجاح إلى Google Drive');
          } catch (err: any) {
            // Only toast if we haven't toasted recently about this
            const lastToast = sessionStorage.getItem('last_auto_backup_auth_toast');
            const nowTime = new Date().getTime();
            if (!lastToast || (nowTime - parseInt(lastToast)) > 12 * 60 * 60 * 1000) {
              const isDesktop = window.innerWidth >= 1024;
              const isAdmin = currentUserRole === 'admin';
              const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
              
              if (err.message && err.message.includes('Not authenticated')) {
                 if (isDesktop && isAdmin && !isPWA) {
                   toast.error('النسخ الاحتياطي التلقائي معلق: يرجى تسجيل الدخول لـ Google Drive عبر مركز قواعد البيانات.', { duration: 8000, id: 'auto-backup-auth' });
                 }
              } else {
                 if (isDesktop && isAdmin && !isPWA) {
                   toast.error('فشل النسخ الاحتياطي التلقائي: ' + err.message, { id: 'auto-backup-fail' });
                 }
              }
              sessionStorage.setItem('last_auto_backup_auth_toast', nowTime.toString());
            }
          }
        }
      }
    };

    // Check immediately on mount, then every 1 hour
    checkBackup();
    checkIntervalRef.current = setInterval(checkBackup, 60 * 60 * 1000);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [users, setUsers, getBackupData, logActivity, currentUserRole]);

  return null;
};

import { getAccessToken } from './googleDriveAuth';

export const backupToDrive = async (data: any): Promise<string> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google Drive. Please sign in first.');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const metadata = {
    name: `AL_RIYADA_BACKUP_${dateStr}.json`,
    mimeType: 'application/json',
  };

  const fileContent = JSON.stringify(data, null, 2);

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to upload to Google Drive: ${errorData}`);
  }

  const result = await response.json();
  return result.id;
};

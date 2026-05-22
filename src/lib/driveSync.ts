import { getAccessToken } from './auth';

const FILE_NAME = 'study-helper-data.json';
const MIME_TYPE = 'application/json';

// Return ID of the file if exists
const findSyncFile = async (accessToken: string): Promise<string | null> => {
  const query = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to search Drive');
  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id; // assume first match is ours
  }
  return null;
};

// Create a new file
const createSyncFile = async (accessToken: string, content: string): Promise<string> => {
  const metadata = {
    name: FILE_NAME,
    mimeType: MIME_TYPE,
  };

  const body = new FormData();
  body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  body.append('file', new Blob([content], { type: 'application/json' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: body,
  });
  if (!res.ok) throw new Error('Failed to create file on Drive');
  const data = await res.json();
  return data.id;
};

// Update an existing file
const updateSyncFile = async (accessToken: string, fileId: string, content: string): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: content,
  });
  if (!res.ok) throw new Error('Failed to update file on Drive');
};

// Download file content
const downloadSyncFile = async (accessToken: string, fileId: string): Promise<any> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to download file from Drive');
  return await res.json();
};

export const syncDataToDrive = async (data: any): Promise<void> => {
  const accessToken = await getAccessToken();
  if (!accessToken) return; // Silent return if not authed, you might want to raise error
  try {
    const fileId = await findSyncFile(accessToken);
    const content = JSON.stringify(data);
    if (fileId) {
      await updateSyncFile(accessToken, fileId, content);
    } else {
      await createSyncFile(accessToken, content);
    }
  } catch (error) {
    console.error('Drive sync failed', error);
  }
};

export const syncDataFromDrive = async (): Promise<any | null> => {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;
  try {
    const fileId = await findSyncFile(accessToken);
    if (fileId) {
      return await downloadSyncFile(accessToken, fileId);
    }
  } catch (error) {
    console.error('Drive load failed', error);
  }
  return null;
};

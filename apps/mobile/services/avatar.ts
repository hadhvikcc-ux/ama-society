import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from './api';
import { useAuthStore } from '../stores/authStore';

/** Output size of the square profile picture, in pixels. */
const AVATAR_SIZE = 320;
/** Must stay under the API's limit (AVATAR_MAX_LENGTH in packages/api/src/auth/dto). */
const MAX_DATA_URL_LENGTH = 400_000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file could not be read as an image.'));
    img.src = src;
  });
}

/** Browser only: centre-crop to a square and scale to AVATAR_SIZE, as a JPEG data URL. */
async function squareJpegOnWeb(src: string): Promise<string> {
  const img = await loadImage(src);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not process the image.');
  ctx.fillStyle = '#FFFFFF'; // transparent PNGs get a white background in the JPEG
  ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  ctx.drawImage(
    img,
    (img.naturalWidth - side) / 2,
    (img.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Browser file chooser that also settles when the dialog is closed without a choice.
 * (expo-image-picker's web picker only listens for 'change', so cancelling left it
 * waiting forever and the avatar spinner never stopped.)
 */
function chooseImageFileOnWeb(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.style.display = 'none';
    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(file);
    };
    input.addEventListener('change', () => finish(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => finish(null));
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Lets the user choose a photo and returns it as a small square JPEG data URL,
 * or null if they cancelled.
 */
export async function pickAvatarImage(): Promise<string | null> {
  if (Platform.OS === 'web') {
    const file = await chooseImageFileOnWeb();
    if (!file) return null;
    if (!file.type.startsWith('image/')) throw new Error('Please choose a JPEG, PNG or WebP image.');
    const objectUrl = URL.createObjectURL(file);
    try {
      return await squareJpegOnWeb(objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Allow photo access in Settings to choose a profile picture.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const dataUrl = `data:${asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg'};base64,${asset.base64}`;

  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new Error('That photo is too large. Please choose a smaller one.');
  }
  return dataUrl;
}

/**
 * Saves (or, with null, removes) the signed-in user's profile picture on the server,
 * then updates the local session so every screen shows it.
 */
export async function saveAvatar(avatar: string | null): Promise<void> {
  try {
    const res = await api.patch('/auth/me/avatar', { avatar }, { timeout: 30_000 });
    useAuthStore.getState().updateUser({ avatarUrl: res.data?.avatarUrl ?? undefined });
  } catch (error: any) {
    if (error?.code === 'ECONNABORTED') {
      throw new Error('The upload timed out. Check your connection and try again.');
    }
    const message = error?.response?.data?.message;
    throw new Error(
      Array.isArray(message) ? message[0] : message || 'Could not save your profile picture. Please try again.',
    );
  }
}

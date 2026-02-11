import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const MAX_WIDTH = 1080;
const JPEG_QUALITY = 0.7;

export async function pickImages(): Promise<ImagePicker.ImagePickerAsset[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 1,
  });

  if (result.canceled) return [];
  return result.assets;
}

export async function compressImage(uri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return manipulated.uri;
}

export async function uploadWorkoutImage(
  userId: string,
  imageUri: string,
): Promise<string> {
  const compressedUri = await compressImage(imageUri);

  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const response = await fetch(compressedUri);
  const blob = await response.blob();
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const { error } = await supabase.storage
    .from('workout-images')
    .upload(fileName, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('workout-images').getPublicUrl(fileName);

  return publicUrl;
}

export async function uploadMultipleImages(
  userId: string,
  assets: ImagePicker.ImagePickerAsset[],
): Promise<string[]> {
  const urls = await Promise.all(
    assets.map((asset) => uploadWorkoutImage(userId, asset.uri)),
  );
  return urls;
}

export async function pickSingleImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    quality: 1,
  });

  if (result.canceled || !result.assets.length) return null;
  return result.assets[0];
}

export async function uploadAvatar(
  userId: string,
  imageUri: string,
): Promise<string> {
  const compressedUri = await compressImage(imageUri);

  const fileName = `${userId}/avatar-${Date.now()}.jpg`;

  const response = await fetch(compressedUri);
  const blob = await response.blob();
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(fileName);

  return publicUrl;
}

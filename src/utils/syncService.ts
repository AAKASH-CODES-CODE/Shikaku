export interface UserProfileData {
  userId: string;
  level: number;
  updatedAt?: any;
}

export async function saveUserProfileToCloud(
  userId: string,
  data: {
    level: number;
  }
): Promise<void> {
  // Safe local-only stub
}

export async function getUserProfileFromCloud(userId: string): Promise<UserProfileData | null> {
  return null;
}

export async function signInWithGoogle(): Promise<any> {
  return null;
}

export async function logOutUser(): Promise<void> {
  // Safe local-only stub
}

export function subscribeUserProfile(
  userId: string,
  onUpdate: (data: UserProfileData | null) => void,
  onError?: (err: any) => void
) {
  onUpdate(null);
  return () => {};
}

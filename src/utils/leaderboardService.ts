import { Difficulty } from '../types';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, query, collection, where, getDocs, orderBy, limit } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export interface LeaderboardEntry {
  id?: string;
  date: string;
  playerName: string;
  completionTime: number; // in seconds
  difficulty: Difficulty;
  userId: string;
  createdAt: string; // ISO String
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture: string;
  userId: string;
  idToken?: string;
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const isFirebaseAvailable = true;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to determine if an OIDC JWT ID Token is expired
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (!parsed.exp) return true;
    const currentTime = Math.floor(Date.now() / 1000);
    // Use a 10 seconds buffer
    return parsed.exp < (currentTime + 10);
  } catch {
    return true;
  }
}

// Kick off Firebase Auth session automatically
export async function initializeAuthSession(): Promise<any> {
  const googleProfile = getGoogleProfile();
  if (googleProfile && googleProfile.idToken) {
    if (isTokenExpired(googleProfile.idToken)) {
      console.log("Cached Google ID token is expired. Keeping visitor state local.");
      // Silently remove token reference to prevent infinite expiry loops, keeping profile name for local displays
      try {
        const stored = getGoogleProfile();
        if (stored && stored.idToken === googleProfile.idToken) {
          delete stored.idToken;
          localStorage.setItem('shikaku_google_user', JSON.stringify(stored));
        }
      } catch (e) {}
      return null;
    }

    try {
      const credential = GoogleAuthProvider.credential(googleProfile.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      console.log("Firebase Auth signed in with Google:", userCredential.user.uid);
      localStorage.setItem('shikaku_player_uid', userCredential.user.uid);
      return userCredential.user;
    } catch (err) {
      console.error("Firebase auth login with Google credential failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      
      const isStaleOrInvalid = errMsg.includes('stale') || 
                               errMsg.includes('auth/invalid-credential') || 
                               errMsg.includes('expired') || 
                               errMsg.includes('auth/argument-error');
      
      if (!isStaleOrInvalid) {
        window.dispatchEvent(new CustomEvent('shikaku_auth_error', { detail: { error: errMsg } }));
      } else {
        // Silently clear the invalid token from profile
        try {
          const stored = getGoogleProfile();
          if (stored && stored.idToken === googleProfile.idToken) {
            delete stored.idToken;
            localStorage.setItem('shikaku_google_user', JSON.stringify(stored));
          }
        } catch (e) {}
      }
    }
  }
  return null;
}

// Fire off session startup immediately on import
initializeAuthSession().catch(err => console.error("Initial auth setup failed:", err));

export { isFirebaseAvailable, auth, db };

// Retrieve the Google Client ID safely with a fallback to the user's provided credentials
export const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "137048695523-ffkb3hpqhhrbqhh23g0gf1nl9e7curlr.apps.googleusercontent.com";

// JWT decoder callback
export function decodeJwt(token: string): GoogleUserProfile | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      email: parsed.email || "",
      name: parsed.name || "Google Solver",
      picture: parsed.picture || "",
      userId: parsed.sub || ""
    };
  } catch (err) {
    console.error("JWT Decode failed:", err);
    return null;
  }
}

// State helpers for local Google auth
export function getAuthUserId(): string {
  // 1. Authoritative active Firebase Auth user identifier
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }

  // 2. Local Google Profile (corresponds to logged-in Google credentials)
  const googleProfile = getGoogleProfile();
  if (googleProfile) {
    const stored = localStorage.getItem('shikaku_player_uid');
    if (stored && !stored.startsWith('shikaku_player_')) {
      return stored;
    }
    return 'google_' + googleProfile.userId;
  }

  // 3. Fallback to cached ID or generate a stable guest identifier
  let stored = localStorage.getItem('shikaku_player_uid');
  if (!stored) {
    stored = 'shikaku_player_' + Math.floor(Math.random() * 1000000);
    localStorage.setItem('shikaku_player_uid', stored);
  }
  return stored;
}

export function getGoogleProfile(): GoogleUserProfile | null {
  try {
    const str = localStorage.getItem('shikaku_google_user');
    if (!str) return null;
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function saveGoogleProfile(profile: GoogleUserProfile) {
  localStorage.setItem('shikaku_google_user', JSON.stringify(profile));
  localStorage.setItem('shikaku_player_name', profile.name);
  
  if (profile.idToken) {
    const credential = GoogleAuthProvider.credential(profile.idToken);
    signInWithCredential(auth, credential)
      .then((userCred) => {
        console.log("Successfully logged in to Firebase via Google standard button:", userCred.user.uid);
        localStorage.setItem('shikaku_player_uid', userCred.user.uid);
        window.dispatchEvent(new Event('shikaku_auth_changed'));
      })
      .catch((err) => {
        console.error("Firebase Auth Google link failed:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        window.dispatchEvent(new CustomEvent('shikaku_auth_error', { detail: { error: errMsg } }));
        localStorage.setItem('shikaku_player_uid', 'google_' + profile.userId);
        window.dispatchEvent(new Event('shikaku_auth_changed'));
      });
  } else {
    localStorage.setItem('shikaku_player_uid', 'google_' + profile.userId);
    window.dispatchEvent(new Event('shikaku_auth_changed'));
  }
}

export function logoutGoogleProfile() {
  localStorage.removeItem('shikaku_google_user');
  localStorage.removeItem('shikaku_player_name');
  localStorage.removeItem('shikaku_player_uid');
  
  // Clear game-specific progress upon logout to prevent multi-account bleed
  localStorage.removeItem('shikaku_campaign_level');
  localStorage.removeItem('shikaku_stats');
  localStorage.removeItem('shikaku_coins');
  
  // Clear any daily completed flags
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('shikaku_daily_completed_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.error("Error clearing daily flags on logout:", e);
  }

  // Sign out of Firebase Auth - DO NOT automatically login anonymously on logout
  auth.signOut().then(() => {
    console.log("Firebase Auth signed out successfully.");
    window.dispatchEvent(new Event('shikaku_auth_changed'));
  }).catch((err) => {
    console.error("Firebase Auth sign out error:", err);
    window.dispatchEvent(new Event('shikaku_auth_changed'));
  });
}

export async function ensureAnonymousUser(): Promise<any> {
  return null;
}

export function onAuthChanged(callback: (user: any) => void) {
  return auth.onAuthStateChanged((user) => {
    callback(user);
  });
}

const LOCAL_LEADERBOARD_KEY = 'shikaku_local_leaderboard';

function getLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Local leaderboard read failed:", err);
    return [];
  }
}

function saveLocalLeaderboard(entries: LeaderboardEntry[]) {
  try {
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error("Local leaderboard save failed:", err);
  }
}

const MOCK_NAMES = ['Atsushi', 'Kenji', 'Sora', 'Mei', 'Yuki', 'Ren', 'Haru', 'Aoi', 'Tatsu', 'Hina'];
function ensureMockDataForLocal(date: string, difficulty: Difficulty): LeaderboardEntry[] {
  let entries = getLocalLeaderboard();
  const currentDateEntries = entries.filter(e => e.date === date && e.difficulty === difficulty);
  
  if (currentDateEntries.length === 0) {
    // Generate 5 stable, reproducible simulated entries based on a date seed
    const mockSeed = date + '_' + difficulty;
    let seedValue = 0;
    for (let i = 0; i < mockSeed.length; i++) {
      seedValue = mockSeed.charCodeAt(i) + ((seedValue << 5) - seedValue);
    }
    seedValue = Math.abs(seedValue);

    const generated: LeaderboardEntry[] = [];
    // Easy typically 10-30s, Medium 30-100s, Hard 90-300s
    const baseSeconds = difficulty === 'easy' ? 12 : difficulty === 'medium' ? 45 : 110;
    const paddingMultiplier = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 12 : 30;

    for (let i = 0; i < 6; i++) {
      const nameIndex = (seedValue + i * 7) % MOCK_NAMES.length;
      const secondsOffset = (seedValue + i * 13) % paddingMultiplier;
      const finalTime = baseSeconds + secondsOffset + (i * 4);
      generated.push({
        date,
        playerName: MOCK_NAMES[nameIndex],
        completionTime: finalTime,
        difficulty,
        userId: 'simulated_player_' + i,
        createdAt: new Date(Date.now() - (i * 3600000)).toISOString()
      });
    }

    // Combine and save
    entries = [...entries, ...generated];
    saveLocalLeaderboard(entries);
  }

  return entries.filter(e => e.date === date && e.difficulty === difficulty);
}

export async function getDailyLeaderboard(date: string, difficulty: Difficulty): Promise<LeaderboardEntry[]> {
  try {
    const q = query(
      collection(db, 'daily_leaderboard'),
      where('date', '==', date),
      where('difficulty', '==', difficulty),
      orderBy('completionTime', 'asc'),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() } as LeaderboardEntry);
    });
    
    if (entries.length > 0) {
      return entries;
    }
  } catch (err) {
    console.warn("Failed to fetch official leaderboard from Firestore, falling back to local backend:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      try {
        handleFirestoreError(err, OperationType.LIST, 'daily_leaderboard');
      } catch (detailedErr) {
        console.error("Structured Firestore error details:", detailedErr);
      }
    }
  }

  try {
    const res = await fetch(`/api/leaderboard?date=${encodeURIComponent(date)}&difficulty=${encodeURIComponent(difficulty)}`);
    if (!res.ok) {
      throw new Error(`Server returned status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch official daily leaderboard from backend, using simulated fallback:", err);
    // Fallback gracefully so game remains robust
    const allFiltered = ensureMockDataForLocal(date, difficulty);
    return allFiltered.sort((a, b) => a.completionTime - b.completionTime).slice(0, 10);
  }
}

export async function submitDailyScore(
  date: string,
  playerName: string,
  completionTime: number,
  difficulty: Difficulty
): Promise<void> {
  // Resolve most descriptive player name
  let cleanPlayerName = playerName.trim();
  if (!cleanPlayerName || cleanPlayerName === 'Player' || cleanPlayerName === 'Anonymous Solver' || cleanPlayerName === 'Anonymous') {
    const googleProfile = getGoogleProfile();
    const profileName = googleProfile?.name || auth.currentUser?.displayName;
    const profileEmail = googleProfile?.email || auth.currentUser?.email;
    
    if (profileName && profileName !== 'Google Solver') {
      cleanPlayerName = profileName;
    } else if (profileEmail) {
      cleanPlayerName = profileEmail.split('@')[0];
    } else {
      cleanPlayerName = localStorage.getItem('shikaku_player_name') || '';
    }
  }
  if (!cleanPlayerName || cleanPlayerName === 'Player' || cleanPlayerName === 'Anonymous Solver' || cleanPlayerName === 'Anonymous') {
    cleanPlayerName = auth.currentUser?.isAnonymous ? 'Guest' : 'Player';
  }

  const userId = getAuthUserId();
  localStorage.setItem('shikaku_player_uid', userId);

  // Still save locally for backup/instant feel
  const entries = getLocalLeaderboard();
  const newEntry: LeaderboardEntry = {
    date,
    playerName: cleanPlayerName,
    completionTime,
    difficulty,
    userId,
    createdAt: new Date().toISOString()
  };
  entries.push(newEntry);
  saveLocalLeaderboard(entries);

  // Submit to Firestore only if Firebase auth user session is loaded
  if (auth.currentUser) {
    try {
      const entryId = `${userId}_${date}_${difficulty}`.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const data = {
        date,
        playerName: cleanPlayerName,
        completionTime: Math.floor(completionTime),
        difficulty,
        userId,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'daily_leaderboard', entryId), data);
      console.log("Successfully logged score to Firestore!", entryId);
    } catch (err) {
      console.error("Failed to write score to Firestore:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
        try {
          handleFirestoreError(err, OperationType.WRITE, 'daily_leaderboard');
        } catch (detailedErr) {
          console.error("Structured Firestore write error details:", detailedErr);
        }
      }
    }
  } else {
    console.log("Not signed in to Firebase Auth. Skipping direct Firestore submission (Global API used instead).");
  }

  // Submit to actual manual backend database globally!
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date,
        playerName: cleanPlayerName,
        completionTime,
        difficulty,
        userId
      })
    });
    if (!res.ok) {
      console.error("Backend manual DB rejected global score submission");
    }
  } catch (err) {
    console.error("Failed to connect to backend manual DB for global score sync:", err);
  }
}

export interface UserProgressData {
  exists: boolean;
  campaignLevel?: number;
  stats?: any;
  dailyChallengesCompleted?: string[];
  playerId?: string;
  displayName?: string;
  friends?: string[];
  coins?: number;
  currentStreak?: number;
  bestStreak?: number;
}

// Upload current local progress for backup and syncing
export async function uploadUserProgress(
  userId: string,
  campaignLevel: number,
  stats: any,
  displayName?: string
): Promise<void> {
  const activeUserId = getAuthUserId();
  if (!activeUserId) return;

  // Scan localStorage for any daily completed entries
  const completedDaily: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('shikaku_daily_completed_')) {
        if (localStorage.getItem(key) === 'true') {
          completedDaily.push(key.replace('shikaku_daily_completed_', ''));
        }
      }
    }
  } catch (e) {
    console.error("Error building daily completed list", e);
  }

  // Robustly resolve display name and email fallback
  const googleProfile = getGoogleProfile();
  const profileName = googleProfile?.name || auth.currentUser?.displayName;
  const profileEmail = googleProfile?.email || auth.currentUser?.email;

  let resolvedName = displayName?.trim();
  if (!resolvedName || resolvedName === 'Player' || resolvedName === 'Anonymous' || resolvedName === 'Anonymous Solver') {
    resolvedName = profileName || localStorage.getItem('shikaku_player_name');
  }
  if ((!resolvedName || resolvedName === 'Player' || resolvedName === 'Anonymous') && profileEmail) {
    resolvedName = profileEmail.split('@')[0];
  }
  if (!resolvedName || resolvedName === 'Player' || resolvedName === 'Anonymous') {
    resolvedName = auth.currentUser?.isAnonymous ? 'Guest' : 'Player';
  }

  const cleanIdSeed = (resolvedName && resolvedName !== 'Player' && resolvedName !== 'Guest') ? resolvedName : 'player';
  const playerId = cleanIdSeed.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase() + '_' + activeUserId.substring(0, 4).toUpperCase();

  // Upload to Firestore only if Firebase user is authenticated
  const coinsStr = localStorage.getItem('shikaku_coins') || '100';
  const coinsNum = parseInt(coinsStr, 10) || 100;

  const currentStreak = stats?.currentStreak || 0;
  const bestStreak = stats?.bestStreak || 0;

  if (auth.currentUser) {
    try {
      const userDocRef = doc(db, 'users', activeUserId);
      const docData = {
        userId: activeUserId,
        campaignLevel: campaignLevel || 1,
        stats: stats || {},
        currentStreak,
        bestStreak,
        dailyChallengesCompleted: completedDaily,
        displayName: resolvedName,
        playerId: playerId,
        coins: coinsNum,
        updatedAt: new Date().toISOString()
      };
      await setDoc(userDocRef, docData);
      console.log("Successfully backed up user progress to Firestore!");
    } catch (err) {
      console.error("Failed to write user progress to Firestore:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
        try {
          handleFirestoreError(err, OperationType.WRITE, `users/${activeUserId}`);
        } catch (detailedErr) {
          console.error("Structured Firestore user write error:", detailedErr);
        }
      }
    }
  } else {
    console.log("Not signed in to Firebase Auth. Skipping direct Firestore user progress backup.");
  }

  try {
    const payload: any = {
      userId: activeUserId,
      campaignLevel,
      stats,
      currentStreak,
      bestStreak,
      dailyChallengesCompleted: completedDaily,
      displayName: resolvedName,
      coins: coinsNum
    };

    const res = await fetch("/api/user/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error("Failed to update user progress on server map");
    }
  } catch (err) {
    console.error("Network error updating user progress:", err);
  }
}

// Download synchronized user progress from server
export async function fetchUserProgress(userId: string): Promise<UserProgressData | null> {
  const activeUserId = getAuthUserId();
  if (!activeUserId) return null;

  // Download from Firestore only if Firebase user is authenticated
  if (auth.currentUser) {
    try {
      const docRef = doc(db, 'users', activeUserId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const mergedStats = {
          currentStreak: data.currentStreak !== undefined ? data.currentStreak : (data.stats && data.stats.currentStreak) || 0,
          bestStreak: data.bestStreak !== undefined ? data.bestStreak : (data.stats && data.stats.bestStreak) || 0,
          ...(data.stats || {})
        };
        // Explicitly force them within mergedStats structure
        mergedStats.currentStreak = data.currentStreak !== undefined ? data.currentStreak : mergedStats.currentStreak;
        mergedStats.bestStreak = data.bestStreak !== undefined ? data.bestStreak : mergedStats.bestStreak;

        return {
          exists: true,
          campaignLevel: data.campaignLevel || 1,
          stats: mergedStats,
          currentStreak: mergedStats.currentStreak,
          bestStreak: mergedStats.bestStreak,
          dailyChallengesCompleted: data.dailyChallengesCompleted || [],
          playerId: data.playerId || activeUserId.substring(0, 6).toUpperCase(),
          displayName: data.displayName || 'Unknown Player',
          friends: data.friends || [],
          coins: data.coins !== undefined ? data.coins : 100
        };
      }
    } catch (err) {
      console.error("Failed to fetch user progress from Firestore:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
        try {
          handleFirestoreError(err, OperationType.GET, `users/${activeUserId}`);
        } catch (detailedErr) {
          console.error("Structured Firestore user get error:", detailedErr);
        }
      }
    }
  } else {
    console.log("Not signed in to Firebase Auth. Skipping direct Firestore fetch for user progress (falling back to server API/local).");
  }

  try {
    const res = await fetch(`/api/user/progress?userId=${encodeURIComponent(activeUserId)}`);
    if (!res.ok) {
      throw new Error(`Server status ${res.status}`);
    }
    const data = await res.json();
    if (data && data.exists) {
      const mergedStats = {
        currentStreak: data.currentStreak !== undefined ? data.currentStreak : (data.stats && data.stats.currentStreak) || 0,
        bestStreak: data.bestStreak !== undefined ? data.bestStreak : (data.stats && data.stats.bestStreak) || 0,
        ...(data.stats || {})
      };
      mergedStats.currentStreak = data.currentStreak !== undefined ? data.currentStreak : mergedStats.currentStreak;
      mergedStats.bestStreak = data.bestStreak !== undefined ? data.bestStreak : mergedStats.bestStreak;

      return {
        ...data,
        stats: mergedStats,
        currentStreak: mergedStats.currentStreak,
        bestStreak: mergedStats.bestStreak,
      };
    }
    return data;
  } catch (err) {
    console.error("Failed to fetch synced user progress from server API:", err);
    return null;
  }
}

// Search for a player by PlayerID
export async function fetchPlayerProfile(playerId: string): Promise<any | null> {
  try {
    const res = await fetch(`/api/players/${encodeURIComponent(playerId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch player profile", err);
    return null;
  }
}

// Add a friend
export async function addFriend(userId: string, friendPlayerId: string): Promise<string[] | null> {
  const activeUserId = getAuthUserId();
  try {
    const res = await fetch(`/api/user/friends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: activeUserId, friendPlayerId })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.friends;
  } catch (err) {
    console.error("Failed to add friend", err);
    return null;
  }
}

// Fetch friends details
export async function fetchFriendsList(userId: string): Promise<any[]> {
  const activeUserId = getAuthUserId();
  try {
    const res = await fetch(`/api/user/friends?userId=${encodeURIComponent(activeUserId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch friends", err);
    return [];
  }
}

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

const DB_FILE = path.join(process.cwd(), "data", "leaderboard.json");
const USER_DB_FILE = path.join(process.cwd(), "data", "user_progress.json");

// Establish/verify manual database setup on startup
function initDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]), "utf-8");
  }
}

function initUserDb() {
  const dir = path.dirname(USER_DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(USER_DB_FILE)) {
    fs.writeFileSync(USER_DB_FILE, JSON.stringify({}), "utf-8");
  }
}

// Get user progress map
function getUserProgressMap(): Record<string, any> {
  initUserDb();
  try {
    const raw = fs.readFileSync(USER_DB_FILE, "utf-8");
    const map = JSON.parse(raw);
    
    // Auto-deduplicate old transitional google_ accounts
    let changed = false;
    const keys = Object.keys(map);
    const googleKeys = keys.filter(k => k.startsWith('google_'));
    const normalKeys = keys.filter(k => !k.startsWith('google_'));

    for (const gKey of googleKeys) {
      const gUser = map[gKey];
      if (!gUser || !gUser.displayName || gUser.displayName === 'Player' || gUser.displayName === 'Guest') {
        continue;
      }
      
      // Find a normal (Firebase Auth) user with the same display name
      const matchingNormalKey = normalKeys.find(nKey => {
        const nUser = map[nKey];
        return nUser && nUser.displayName && nUser.displayName.toLowerCase() === gUser.displayName.toLowerCase();
      });

      if (matchingNormalKey) {
        console.log(`Deduplicating and merging transitional user '${gKey}' into Firebase account '${matchingNormalKey}'`);
        const nUser = map[matchingNormalKey];
        
        // Merge campaign level (use highest)
        nUser.campaignLevel = Math.max(nUser.campaignLevel || 1, gUser.campaignLevel || 1);
        
        // Merge daily completed challenges arrays
        const mergedChallenges = new Set([
          ...(Array.isArray(nUser.dailyChallengesCompleted) ? nUser.dailyChallengesCompleted : []),
          ...(Array.isArray(gUser.dailyChallengesCompleted) ? gUser.dailyChallengesCompleted : [])
        ]);
        nUser.dailyChallengesCompleted = Array.from(mergedChallenges);

        // Merge stats fields
        if (gUser.stats) {
          nUser.stats = nUser.stats || {};
          nUser.stats.puzzlesSolved = Math.max(nUser.stats.puzzlesSolved || 0, gUser.stats.puzzlesSolved || 0);
          nUser.stats.easySolved = Math.max(nUser.stats.easySolved || 0, gUser.stats.easySolved || 0);
          nUser.stats.mediumSolved = Math.max(nUser.stats.mediumSolved || 0, gUser.stats.mediumSolved || 0);
          nUser.stats.hardSolved = Math.max(nUser.stats.hardSolved || 0, gUser.stats.hardSolved || 0);
          nUser.stats.currentStreak = Math.max(nUser.stats.currentStreak || 0, gUser.stats.currentStreak || 0);
          nUser.stats.bestStreak = Math.max(nUser.stats.bestStreak || 0, gUser.stats.bestStreak || 0);
          
          if (gUser.stats.history && Array.isArray(gUser.stats.history)) {
            const currentHistory = nUser.stats.history || [];
            const historyIds = new Set(currentHistory.map((h: any) => h.id));
            gUser.stats.history.forEach((hEntry: any) => {
              if (hEntry && hEntry.id && !historyIds.has(hEntry.id)) {
                currentHistory.push(hEntry);
              }
            });
            nUser.stats.history = currentHistory;
          }
        }
        
        // Remove the transitioned duplicate key from map
        delete map[gKey];
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(USER_DB_FILE, JSON.stringify(map, null, 2), "utf-8");
    }

    return map;
  } catch (err) {
    console.error("User Progress DB Read Error:", err);
    return {};
  }
}

// Save user progress map
function saveUserProgressMap(map: Record<string, any>) {
  initUserDb();
  try {
    fs.writeFileSync(USER_DB_FILE, JSON.stringify(map, null, 2), "utf-8");
  } catch (err) {
    console.error("User Progress DB Write Error:", err);
  }
}

// Get raw scores array
function getLeaderboardData(): any[] {
  initDb();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Manual DB Read Error:", err);
    return [];
  }
}

// Save scores array
function saveLeaderboardData(data: any[]) {
  initDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Manual DB Write Error:", err);
  }
}

// Firestore integration config & Google Cloud Platform Helpers
const FIREBASE_CONFIG_FILE = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseProjectId = "photos-6e67c"; // Fallback default
let firestoreAccessible = true; // Graceful fallback circuit breaker if 403 status is encountered

try {
  if (fs.existsSync(FIREBASE_CONFIG_FILE)) {
    const configRaw = fs.readFileSync(FIREBASE_CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(configRaw);
    if (parsed.projectId) {
      firebaseProjectId = parsed.projectId;
    }
  }
} catch (err) {
  console.error("Error loading firebase-applet-config.json in server:", err);
}

async function getGcpAccessToken(): Promise<string | null> {
  try {
    const res = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", {
      headers: { "Metadata-Flavor": "Google" }
    });
    if (res.ok) {
      const data: any = await res.json();
      return data.access_token || null;
    }
  } catch (err) {
    // Expected during local development
  }
  return null;
}

async function deleteFirestoreUserDoc(userId: string) {
  if (!firestoreAccessible) {
    return;
  }
  try {
    const token = await getGcpAccessToken();
    if (!token) {
      console.log(`Local development / no token. Skipping Firestore sync deletion for userId '${userId}'.`);
      return;
    }

    const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/users/${encodeURIComponent(userId)}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      console.log(`Successfully deleted Firestore document for userId '${userId}'.`);
    } else {
      if (res.status === 403) {
        firestoreAccessible = false;
        console.log(`Firestore API is not accessible (403 Forbidden). Subsequent Firestore sync operations will be skipped. Local database will continue to operate normally in offline mode.`);
      } else {
        console.warn(`Firestore REST deletion failed for userId '${userId}'. Status: ${res.status}`);
      }
    }
  } catch (err) {
    console.error(`Error deleting Firestore document for '${userId}':`, err);
  }
}

async function syncFirestoreDeletions(progressMap: Record<string, any>): Promise<boolean> {
  if (!firestoreAccessible) {
    return false;
  }
  const token = await getGcpAccessToken();
  if (!token) {
    return false; // Skip sync check if auth token is not available (such as running locally)
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/users?pageSize=300`;
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 403) {
        firestoreAccessible = false;
        console.log(`Firestore API is not accessible (403 Forbidden). Subsequent Firestore sync operations will be skipped. Local database will continue to operate normally in offline mode.`);
      } else {
        console.error(`Failed to retrieve Firestore users for deletion sync. Status: ${res.status}`);
      }
      return false;
    }

    const data: any = await res.json();
    const activeFirestoreIds = new Set<string>();

    if (data && Array.isArray(data.documents)) {
      data.documents.forEach((doc: any) => {
        if (doc.name) {
          const parts = doc.name.split('/');
          const docId = parts[parts.length - 1];
          if (docId) {
            activeFirestoreIds.add(docId);
          }
        }
      });
    }

    let mapChanged = false;
    const localKeys = Object.keys(progressMap);

    for (const userId of localKeys) {
      // Exclude guest/anonymous local IDs from synchronization checks
      const isGuest = userId.startsWith("shikaku_player_");
      if (!isGuest) {
        // Authenticated users should possess a Firestore document. If not, they are deleted in Firestore.
        if (!activeFirestoreIds.has(userId)) {
          console.log(`Sync: User progress document '${userId}' is missing from Firestore. Deleting locally.`);
          const userPlayerId = progressMap[userId].playerId;
          delete progressMap[userId];

          // Prune standard bidirectional references from other files
          if (userPlayerId) {
            Object.keys(progressMap).forEach((uid) => {
              if (Array.isArray(progressMap[uid].friends)) {
                progressMap[uid].friends = progressMap[uid].friends.filter(
                  (fid: string) => fid !== userPlayerId
                );
              }
            });
          }

          mapChanged = true;
        }
      }
    }

    if (mapChanged) {
      // Correct corresponding leaderboard instances
      try {
        const existingLeaderboard = getLeaderboardData();
        const activeLocalUserIds = new Set(Object.keys(progressMap));
        const filteredLeaderboard = existingLeaderboard.filter(e => {
          const isGuest = e.userId.startsWith("shikaku_player_") || e.userId.startsWith("simulated_player_") || e.userId.startsWith("guest_");
          if (isGuest) return true;
          return activeLocalUserIds.has(e.userId);
        });

        if (filteredLeaderboard.length !== existingLeaderboard.length) {
          saveLeaderboardData(filteredLeaderboard);
          console.log(`Sync: Pruned ${existingLeaderboard.length - filteredLeaderboard.length} leaderboard records.`);
        }
      } catch (err) {
        console.error("Sync leaderboard cleaner error:", err);
      }
    }

    return mapChanged;
  } catch (err) {
    console.error("Error checking Firestore deletions:", err);
    return false;
  }
}

// Global Stable Seed Names
const MOCK_NAMES = ['Atsushi', 'Kenji', 'Sora', 'Mei', 'Yuki', 'Ren', 'Haru', 'Aoi', 'Tatsu', 'Hina'];

function ensureMockDataOnServer(date: string, difficulty: string, currentEntries: any[]): any[] {
  const matched = currentEntries.filter(e => e.date === date && e.difficulty === difficulty);
  if (matched.length > 0) {
    return currentEntries;
  }

  // Generate 6 stable simulated mock entries for daily challenge competition
  const mockSeed = `${date}_${difficulty}`;
  let seedValue = 0;
  for (let i = 0; i < mockSeed.length; i++) {
    seedValue = mockSeed.charCodeAt(i) + ((seedValue << 5) - seedValue);
  }
  seedValue = Math.abs(seedValue);

  const generated: any[] = [];
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

  const updatedList = [...currentEntries, ...generated];
  saveLeaderboardData(updatedList);
  return updatedList;
}

// API: Get daily leaderboard
app.get("/api/leaderboard", (req, res) => {
  const { date, difficulty } = req.query;
  if (!date || !difficulty) {
    return res.status(400).json({ error: "Missing date or difficulty parameters" });
  }

  const strDate = String(date);
  const strDifficulty = String(difficulty);

  let currentEntries = getLeaderboardData();
  // Ensure seed data is generated if this slot is empty
  currentEntries = ensureMockDataOnServer(strDate, strDifficulty, currentEntries);

  const matches = currentEntries
    .filter(e => e.date === strDate && e.difficulty === strDifficulty)
    .sort((a, b) => a.completionTime - b.completionTime)
    .slice(0, 10);

  res.json(matches);
});

// API: Submit a score globally
app.post("/api/leaderboard", (req, res) => {
  const { date, playerName, completionTime, difficulty, userId } = req.body;
  if (!date || !playerName || typeof completionTime !== "number" || !difficulty || !userId) {
    return res.status(400).json({ error: "Missing required properties" });
  }

  const originalEntries = getLeaderboardData();
  const cleanPlayerName = String(playerName).trim() || 'Anonymous Solver';

  const newEntry = {
    date: String(date),
    playerName: cleanPlayerName,
    completionTime,
    difficulty: String(difficulty),
    userId: String(userId),
    createdAt: new Date().toISOString()
  };

  originalEntries.push(newEntry);
  saveLeaderboardData(originalEntries);

  res.json({ success: true, entry: newEntry });
});

// API: Get user progress sync data
app.get("/api/user/progress", (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId parameter" });
  }

  const progressMap = getUserProgressMap();
  const userProgress = progressMap[String(userId)];

  if (!userProgress) {
    return res.json({ exists: false });
  }

  res.json({
    exists: true,
    campaignLevel: userProgress.campaignLevel || 1,
    coins: userProgress.coins !== undefined ? userProgress.coins : 100,
    stats: userProgress.stats || null,
    dailyChallengesCompleted: userProgress.dailyChallengesCompleted || [],
    playerId: userProgress.playerId || generatePlayerId(String(userId), progressMap),
    displayName: userProgress.displayName || 'Unknown Player',
    friends: userProgress.friends || []
  });
});

function generatePlayerId(userId: string, progressMap: Record<string, any>): string {
  // Try to find if user already has one (in case we mutate later)
  if (progressMap[userId] && progressMap[userId].playerId) return progressMap[userId].playerId;
  let id = Math.random().toString(36).substring(2, 8).toUpperCase();
  // Ensure uniqueness
  while (Object.values(progressMap).some(p => p.playerId === id)) {
    id = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  return id;
}

// API: Sync user progress sync data
app.post("/api/user/progress", (req, res) => {
  const { userId, campaignLevel, coins, stats, dailyChallengesCompleted, displayName } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in body" });
  }

  const progressMap = getUserProgressMap();
  const existing = progressMap[String(userId)] || {};
  
  progressMap[String(userId)] = {
    ...existing,
    campaignLevel: typeof campaignLevel === "number" ? campaignLevel : existing.campaignLevel || 1,
    coins: typeof coins === "number" ? coins : (existing.coins !== undefined ? existing.coins : 100),
    stats: stats || existing.stats || {},
    dailyChallengesCompleted: Array.isArray(dailyChallengesCompleted) ? dailyChallengesCompleted : existing.dailyChallengesCompleted || [],
    displayName: displayName || existing.displayName || 'Player',
    playerId: existing.playerId || generatePlayerId(String(userId), progressMap),
    friends: existing.friends || [],
    updatedAt: new Date().toISOString()
  };

  saveUserProgressMap(progressMap);
  res.json({ success: true });
});

// API: Get Player Profile by PlayerId (for searching)
app.get("/api/players/:playerId", (req, res) => {
  const { playerId } = req.params;
  const progressMap = getUserProgressMap();
  const user = Object.values(progressMap).find(p => p.playerId === playerId.toUpperCase());
  
  if (!user) {
    return res.status(404).json({ error: "Player not found" });
  }
  
  res.json({
    playerId: user.playerId,
    displayName: user.displayName,
    campaignLevel: user.campaignLevel,
    stats: user.stats
  });
});

// API: Add a friend
app.post("/api/user/friends", (req, res) => {
  const { userId, friendPlayerId } = req.body;
  if (!userId || !friendPlayerId) return res.status(400).json({ error: "Missing parameters" });

  const progressMap = getUserProgressMap();
  const currentUser = progressMap[String(userId)];
  if (!currentUser) return res.status(404).json({ error: "User not found" });

  const friend = Object.values(progressMap).find(p => p.playerId === friendPlayerId.toUpperCase());
  if (!friend) return res.status(404).json({ error: "Friend not found" });

  if (friend.playerId === currentUser.playerId) return res.status(400).json({ error: "Cannot add yourself" });

  const currentFriends = currentUser.friends || [];
  if (!currentFriends.includes(friend.playerId)) {
    currentUser.friends = [...currentFriends, friend.playerId];
    saveUserProgressMap(progressMap);
  }

  res.json({ success: true, friends: currentUser.friends });
});

// API: Get friends' profiles
app.get("/api/user/friends", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const progressMap = getUserProgressMap();
  const currentUser = progressMap[String(userId)];
  if (!currentUser) return res.json([]);

  const friendsList = (currentUser.friends || []).map((fid: string) => {
    const friend = Object.values(progressMap).find(p => p.playerId === fid);
    if (!friend) return null;
    return {
      playerId: friend.playerId,
      displayName: friend.displayName,
      campaignLevel: friend.campaignLevel,
      stats: friend.stats
    };
  }).filter(Boolean);

  res.json(friendsList);
});

// Vite Middleware integration for local development asset building & hot serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend Server manual database listening on http://localhost:${PORT}`);
  });
}

startServer();

export default app;

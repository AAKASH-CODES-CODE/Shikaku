import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Users, Search, Target, UserPlus, UserCircle, PlaySquare, Medal, LogIn } from 'lucide-react';
import { fetchUserProgress, fetchPlayerProfile, addFriend, fetchFriendsList, uploadUserProgress } from '../utils/leaderboardService';
import { signInWithGoogle } from '../utils/syncService';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any | null; // Google profile
}

export default function PlayerProfileModal({ isOpen, onClose, userProfile }: PlayerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'friends'>('profile');
  
  // My Profile data
  const [profileData, setProfileData] = useState<any>(null);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Friends Data
  const [friends, setFriends] = useState<any[]>([]);
  const [searchId, setSearchId] = useState('');
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchMyProfileData = async () => {
    if (!userProfile?.userId) return;
    const data = await fetchUserProgress(userProfile.userId);
    if (data) {
      setProfileData(data);
      setDisplayNameInput(data.displayName || 'Player');
    }
  };

  const fetchMyFriends = async () => {
    if (!userProfile?.userId) return;
    const friendsList = await fetchFriendsList(userProfile.userId);
    setFriends(friendsList);
  };

  useEffect(() => {
    if (isOpen && userProfile?.userId) {
      fetchMyProfileData();
      fetchMyFriends();
    }
    // reset state
    setSearchedUser(null);
    setSearchId('');
    setSearchError('');
    setIsEditingName(false);
  }, [isOpen, userProfile, activeTab]);

  const handleCopyId = () => {
    if (!profileData?.playerId) return;
    navigator.clipboard.writeText(profileData.playerId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveName = async () => {
    if (!userProfile?.userId || !profileData) return;
    // update via upload progress
    const campaignLevel = profileData.campaignLevel || 1;
    const stats = profileData.stats || {};
    await uploadUserProgress(userProfile.userId, campaignLevel, stats, displayNameInput);
    
    // refresh
    setProfileData(prev => ({ ...prev, displayName: displayNameInput }));
    setIsEditingName(false);
  };

  const handleSearchFriend = async () => {
    if (!searchId.trim()) return;
    setSearchError('');
    setSearchedUser(null);
    setIsSearching(true);
    
    const user = await fetchPlayerProfile(searchId.trim());
    setIsSearching(false);
    
    if (!user) {
      setSearchError('Player not found. Check the ID.');
    } else if (user.playerId === profileData?.playerId) {
      setSearchError('You cannot add yourself!');
    } else {
      setSearchedUser(user);
    }
  };

  const handleAddFriend = async () => {
    if (!userProfile?.userId || !searchedUser) return;
    const friendList = await addFriend(userProfile.userId, searchedUser.playerId);
    if (friendList) {
      fetchMyFriends();
      setSearchedUser(null);
      setSearchId('');
    } else {
      setSearchError('Failed to add friend.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pr-14 md:pr-4 sm:p-6 select-none pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-[#1C1C1E] rounded-3xl sm:rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden pointer-events-auto border border-neutral-100 dark:border-white/5 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <UserCircle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-sans tracking-tight">
                      Social Hub
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Player Profiles & Friends</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
                >
                  <X className="w-5 h-5 stroke-2" />
                </button>
              </div>

              {!userProfile ? (
                 <div className="p-8 text-center flex flex-col items-center">
                   <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                     <Users className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                   </div>
                   <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Connect to see friends</h3>
                   <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-[250px]">
                     Sign in to create your player profile, search for friends, and compare stats.
                   </p>
                   <button
                     onClick={() => {
                        signInWithGoogle().then(() => {
                            window.dispatchEvent(new Event('shikaku_auth_changed'));
                        });
                     }}
                     className="px-6 py-3 bg-[#1C1C1E] dark:bg-white text-white dark:text-black rounded-xl font-bold tracking-tight text-sm shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                   >
                     <LogIn className="w-4 h-4" />
                     Sign In
                   </button>
                 </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex px-4 pt-4 pb-2 border-b border-neutral-100 dark:border-white/5 gap-2">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all ${
                        activeTab === 'profile' 
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm'
                          : 'bg-transparent text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('friends')}
                      className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'friends' 
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm'
                          : 'bg-transparent text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      Friends
                      {friends.length > 0 && (
                        <span className="w-5 h-5 rounded-md bg-neutral-800 dark:bg-neutral-200 text-white dark:text-black text-[10px] flex items-center justify-center leading-none">
                          {friends.length}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && profileData && (
                      <div className="space-y-6">
                        <div className="bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5 rounded-2xl p-5 relative overflow-hidden">
                          {/* Background decor */}
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                          
                          <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                              <img src={userProfile?.picture} alt="Avatar" className="w-16 h-16 rounded-2xl shadow-sm bg-neutral-200 object-cover" />
                              <div className="flex-1">
                                {isEditingName ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={displayNameInput}
                                      onChange={(e) => setDisplayNameInput(e.target.value)}
                                      className="flex-1 bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-sm font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                      autoFocus
                                      maxLength={16}
                                    />
                                    <button 
                                      onClick={handleSaveName}
                                      className="p-1.5 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{profileData.displayName}</h3>
                                    <button 
                                      onClick={() => setIsEditingName(true)}
                                      className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white py-1 px-2.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                )}
                                <div className="text-sm font-mono text-neutral-500 mt-1 flex items-center gap-2">
                                  ID: <span className="font-bold text-neutral-800 dark:text-neutral-200 tracking-widest">{profileData.playerId}</span>
                                  <button onClick={handleCopyId} className="hover:text-neutral-900 dark:hover:text-white" title="Copy Player ID">
                                    {copiedId ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="bg-white dark:bg-[#1C1C1E] p-3 rounded-xl border border-neutral-100 dark:border-white/5 flex flex-col items-center justify-center shadow-sm">
                                  <Target className="w-5 h-5 text-orange-500 mb-1" />
                                  <span className="text-[10px] font-bold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase font-mono mb-0.5">Campaign Lvl</span>
                                  <span className="text-lg font-bold text-neutral-900 dark:text-white leading-none">{profileData.campaignLevel || 1}</span>
                                </div>
                                <div className="bg-white dark:bg-[#1C1C1E] p-3 rounded-xl border border-neutral-100 dark:border-white/5 flex flex-col items-center justify-center shadow-sm">
                                  <Medal className="w-5 h-5 text-yellow-500 mb-1" />
                                  <span className="text-[10px] font-bold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase font-mono mb-0.5">Puzzles Solved</span>
                                  <span className="text-lg font-bold text-neutral-900 dark:text-white leading-none">{profileData.stats?.puzzlesSolved || 0}</span>
                                </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5 rounded-2xl p-5">
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                            <ShareLinkIcon /> Share Player ID
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                            Give your Player ID to friends so they can add you and compare progress.
                          </p>
                          <button
                            onClick={handleCopyId}
                            className="w-full py-2.5 bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors shadow-sm"
                          >
                            {copiedId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            {copiedId ? 'Copied ID' : 'Copy My Player ID'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* FRIENDS TAB */}
                    {activeTab === 'friends' && (
                      <div className="space-y-6">
                        {/* Search Bar */}
                        <div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input 
                                type="text" 
                                placeholder="Enter Player ID (e.g. U7X9P2)" 
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                                maxLength={8}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchFriend()}
                                className="w-full bg-neutral-100 dark:bg-white/5 border border-transparent focus:border-orange-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold font-mono tracking-widest text-neutral-900 dark:text-white placeholder:font-sans placeholder:tracking-normal placeholder:font-medium focus:outline-none transition-all"
                              />
                            </div>
                            <button
                              onClick={handleSearchFriend}
                              disabled={!searchId.trim() || isSearching}
                              className="px-4 bg-[#1C1C1E] dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm disabled:opacity-50 transition-opacity"
                            >
                              Find
                            </button>
                          </div>
                          {searchError && (
                            <p className="text-red-500 font-medium text-xs mt-2 ml-1">{searchError}</p>
                          )}
                        </div>

                        {/* Search Result */}
                        {searchedUser && (
                          <div className="mt-4 p-4 border border-orange-500/30 bg-orange-500/5 rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="font-bold text-neutral-900 dark:text-white">{searchedUser.displayName}</p>
                              <p className="text-xs text-neutral-500 font-mono mt-0.5">Lvl {searchedUser.campaignLevel || 1} • ID: {searchedUser.playerId}</p>
                            </div>
                            {friends.some(f => f.playerId === searchedUser.playerId) ? (
                              <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md">Already Added</span>
                            ) : (
                              <button 
                                onClick={handleAddFriend}
                                className="p-2 bg-orange-500 text-white rounded-xl shadow-md hover:bg-orange-600 transition-colors"
                              >
                                <UserPlus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Friend List */}
                        <div>
                          <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3">My Friends List</h4>
                          {friends.length === 0 ? (
                            <div className="text-center py-8 border border-neutral-100 dark:border-white/5 border-dashed rounded-2xl">
                              <Users className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                              <p className="text-sm font-medium text-neutral-500">No friends added yet.<br/>Search their ID above!</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {friends.map((friend) => (
                                <div key={friend.playerId} className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02]">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-500">
                                      {friend.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-bold text-neutral-900 dark:text-white text-sm">{friend.displayName}</p>
                                      <p className="text-[10px] font-mono text-neutral-500 mt-0.5 tracking-wider">{friend.playerId}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center justify-end gap-1">
                                      Lvl {friend.campaignLevel || 1}
                                    </p>
                                    <p className="text-[10px] text-neutral-500 mt-0.5">{friend.stats?.puzzlesSolved || 0} solved</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}

function ShareLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
       <circle cx="18" cy="5" r="3"></circle>
       <circle cx="6" cy="12" r="3"></circle>
       <circle cx="18" cy="19" r="3"></circle>
       <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
       <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
  );
}

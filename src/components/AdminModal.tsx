import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, RefreshCw, ChevronUp, ChevronDown, Save, Search, User, Lock, Trash2 } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<number>(1);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Search input focus & responsive animation states
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(min-width: 640px)');
      setIsLargeScreen(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setIsLargeScreen(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin users data", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated) {
        fetchUsers();
      }
    } else {
      setEditingUserId(null);
      setDeletingUserId(null);
      setSearchQuery('');
      setPasswordInput('');
      setIsAuthenticated(false);
    }
  }, [isOpen, isAuthenticated]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPasswordInput(val);
    if (val === '4035') {
      setIsAuthenticated(true);
    }
  };

  const handleUpdateLevel = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/level`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: editingLevel })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.userId === userId ? { ...u, campaignLevel: editingLevel } : u));
        setEditingUserId(null);
      }
    } catch (err) {
      console.error("Failed to update user level", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.userId !== userId));
        setDeletingUserId(null);
      }
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.playerId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.userId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              className="bg-white dark:bg-[#1C1C1E] rounded-3xl sm:rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden pointer-events-auto border border-neutral-100 dark:border-white/5 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <Shield className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-sans tracking-tight">
                      Admin Dashboard
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Manage Players & Game State</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAuthenticated && (
                    <button
                      onClick={fetchUsers}
                      className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
                      title="Refresh Data"
                    >
                      <RefreshCw className={`w-5 h-5 stroke-2 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
                  >
                    <X className="w-5 h-5 stroke-2" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col gap-4 overflow-hidden h-full">
                {!isAuthenticated ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-12">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6">
                      <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Restricted Access</h3>
                    <p className="text-sm font-medium text-red-500 mb-8 uppercase tracking-widest bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full">Only for Admin</p>
                    
                    <div className="w-full max-w-xs">
                      <input
                        type="password"
                        placeholder="Enter 4-digit PIN"
                        value={passwordInput}
                        onChange={handlePasswordChange}
                        maxLength={4}
                        autoFocus
                        className="w-full text-center text-3xl tracking-[1em] font-mono bg-neutral-100 dark:bg-white/5 border-2 border-transparent focus:border-red-500/50 rounded-2xl py-4 text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-700 placeholder:text-xl placeholder:tracking-normal focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <motion.div 
                        initial={false}
                        animate={{ 
                          width: isLargeScreen ? (isSearchFocused ? "420px" : "220px") : "100%" 
                        }}
                        transition={{ type: "spring", stiffness: 350, damping: 26 }}
                        className="relative"
                      >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Search by ID or Name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => setIsSearchFocused(true)}
                          onBlur={() => setIsSearchFocused(false)}
                          className="w-full bg-neutral-100 dark:bg-white/5 border border-transparent focus:border-red-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold text-neutral-900 dark:text-white placeholder:font-medium focus:outline-none transition-all"
                        />
                      </motion.div>
                      <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-xl font-bold text-sm tracking-tight w-full sm:w-auto text-center shrink-0">
                        Total Users: {users.length}
                      </div>
                    </div>

                    {/* Table container */}
                    <div className="flex-1 overflow-auto rounded-2xl border border-neutral-200 dark:border-white/5">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-neutral-100/50 dark:bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider text-xs uppercase">Player</th>
                            <th className="px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider text-xs uppercase">Player ID</th>
                            <th className="px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider text-xs uppercase text-center">Level</th>
                            <th className="px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider text-xs uppercase text-center">Solved</th>
                            <th className="px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider text-xs uppercase">Google UID (Internal)</th>
                            <th className="px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider text-xs uppercase text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                                {loading ? 'Loading content...' : 'No users found.'}
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((u) => (
                              <tr key={u.userId} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                                      {u.displayName ? u.displayName.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <span className="font-bold text-neutral-900 dark:text-white max-w-[120px] truncate">{u.displayName || 'Unknown Player'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-xs text-neutral-600 dark:text-neutral-300">
                                    {u.playerId || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {editingUserId === u.userId ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <button onClick={() => setEditingLevel(Math.max(1, editingLevel - 1))} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500"><ChevronDown className="w-3 h-3" /></button>
                                      <input 
                                        type="number" 
                                        className="w-12 text-center bg-transparent border-b border-red-500 font-bold focus:outline-none" 
                                        value={editingLevel} 
                                        onChange={(e) => setEditingLevel(parseInt(e.target.value) || 1)}
                                        min={1}
                                      />
                                      <button onClick={() => setEditingLevel(editingLevel + 1)} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500"><ChevronUp className="w-3 h-3" /></button>
                                    </div>
                                  ) : (
                                    <span className="font-bold text-neutral-900 dark:text-white">{u.campaignLevel || 1}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-neutral-600 dark:text-neutral-400">{u.stats?.puzzlesSolved || 0}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-mono text-[10px] text-neutral-400 max-w-[150px] truncate block" title={u.userId}>
                                    {u.userId}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {deletingUserId === u.userId ? (
                                    <div className="flex items-center justify-end gap-2 animate-fade-in">
                                      <span className="text-xs font-bold text-red-500 mr-1">Really Delete?</span>
                                      <button 
                                        onClick={() => setDeletingUserId(null)} 
                                        className="text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 py-1 rounded transition-colors"
                                      >
                                        No
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteUser(u.userId)} 
                                        className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded text-xs font-bold transition-colors"
                                      >
                                        Yes
                                      </button>
                                    </div>
                                  ) : editingUserId === u.userId ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <button onClick={() => setEditingUserId(null)} className="text-xs text-neutral-500 hover:text-neutral-700">Cancel</button>
                                      <button onClick={() => handleUpdateLevel(u.userId)} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                        <Save className="w-3 h-3" /> Save
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-2">
                                      <button 
                                        onClick={() => {
                                          setEditingUserId(u.userId);
                                          setEditingLevel(u.campaignLevel || 1);
                                          setDeletingUserId(null);
                                        }} 
                                        className="text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
                                      >
                                        Edit Level
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setDeletingUserId(u.userId);
                                          setEditingUserId(null);
                                        }} 
                                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete User"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}

/**
 * Storage Manager - handles local data persistence
 * Uses localStorage with JSON serialization
 */

class StorageManager {
  constructor(prefix = 'carbontrack_') {
    this.prefix = prefix;
  }

  _key(name) {
    return `${this.prefix}${name}`;
  }

  set(name, data) {
    try {
      localStorage.setItem(this._key(name), JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      return true;
    } catch (e) {
      console.error('Storage write failed:', e);
      return false;
    }
  }

  get(name) {
    try {
      const raw = localStorage.getItem(this._key(name));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.data;
    } catch (e) {
      console.error('Storage read failed:', e);
      return null;
    }
  }

  remove(name) {
    localStorage.removeItem(this._key(name));
  }

  clear() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  // User profile
  saveProfile(profile) {
    return this.set('user_profile', {
      ...profile,
      updated_at: new Date().toISOString()
    });
  }

  getProfile() {
    return this.get('user_profile');
  }

  // Footprint logs
  saveFootprintEntry(entry) {
    const logs = this.getFootprintLogs();
    logs.push({
      id: `entry_${Date.now()}`,
      date: new Date().toISOString(),
      ...entry
    });
    return this.set('footprint_logs', logs);
  }

  getFootprintLogs() {
    return this.get('footprint_logs') || [];
  }

  // Get trend data (last N entries)
  getTrend(n = 10) {
    const logs = this.getFootprintLogs();
    return logs.slice(-n).map(log => ({
      date: log.date,
      total: log.result?.total || 0,
      breakdown: log.result?.breakdown || {}
    }));
  }

  // Goals
  saveGoal(goal) {
    const goals = this.getGoals();
    const existing = goals.findIndex(g => g.id === goal.id);
    if (existing >= 0) {
      goals[existing] = { ...goals[existing], ...goal };
    } else {
      goals.push({ id: `goal_${Date.now()}`, created_at: new Date().toISOString(), ...goal });
    }
    return this.set('goals', goals);
  }

  getGoals() {
    return this.get('goals') || [];
  }

  // Badges
  unlockBadge(badgeId) {
    const badges = this.get('earned_badges') || [];
    if (!badges.find(b => b.id === badgeId)) {
      badges.push({ id: badgeId, earned_at: new Date().toISOString() });
      this.set('earned_badges', badges);
      return true; // newly unlocked
    }
    return false;
  }

  getEarnedBadges() {
    return this.get('earned_badges') || [];
  }

  // Stats
  incrementStat(stat) {
    const stats = this.get('stats') || {};
    stats[stat] = (stats[stat] || 0) + 1;
    return this.set('stats', stats);
  }

  getStat(stat) {
    const stats = this.get('stats') || {};
    return stats[stat] || 0;
  }

  // Check if first visit
  isFirstVisit() {
    const visited = this.get('visited');
    if (!visited) {
      this.set('visited', true);
      return true;
    }
    return false;
  }
}

const storage = new StorageManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageManager, storage };
} else {
  window.StorageManager = StorageManager;
  window.storage        = storage;
}

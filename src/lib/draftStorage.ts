/**
 * User-scoped draft storage utilities
 * Prevents cross-account data leakage by associating drafts with specific users
 */

const DRAFT_KEY_PREFIX = "recipient_application_data";

interface DraftMetadata {
  version: number;
  updatedAt: string;
  ownerScope: "user" | "anon";
  ownerUserId: string | null;
}

interface DraftData {
  metadata: DraftMetadata;
  data: Record<string, unknown>;
}

/**
 * Get the scoped storage key for the current user
 */
export const getScopedStorageKey = (userId: string | null): string => {
  if (userId) {
    return `${DRAFT_KEY_PREFIX}:${userId}`;
  }
  // For anonymous users, use a device-specific key
  let deviceId = sessionStorage.getItem("anon_device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    sessionStorage.setItem("anon_device_id", deviceId);
  }
  return `${DRAFT_KEY_PREFIX}:anon:${deviceId}`;
};

/**
 * Save draft data with user scope
 */
export const saveScopedDraft = (
  userId: string | null,
  data: Record<string, unknown>
): void => {
  try {
    const key = getScopedStorageKey(userId);
    const draftData: DraftData = {
      metadata: {
        version: 1,
        updatedAt: new Date().toISOString(),
        ownerScope: userId ? "user" : "anon",
        ownerUserId: userId,
      },
      data,
    };
    localStorage.setItem(key, JSON.stringify(draftData));
  } catch (e) {
    console.error("Failed to save draft:", e);
  }
};

/**
 * Load draft data only if it belongs to the current user scope
 */
export const loadScopedDraft = (
  userId: string | null
): Record<string, unknown> | null => {
  try {
    const key = getScopedStorageKey(userId);
    const saved = localStorage.getItem(key);
    
    if (!saved) return null;
    
    const parsed: DraftData = JSON.parse(saved);
    
    // Validate ownership
    if (userId && parsed.metadata.ownerUserId !== userId) {
      // Draft belongs to a different user - don't load it
      console.warn("Draft belongs to different user, not loading");
      return null;
    }
    
    if (!userId && parsed.metadata.ownerScope !== "anon") {
      // Anonymous user trying to load a user-scoped draft
      return null;
    }
    
    return parsed.data;
  } catch (e) {
    console.error("Failed to load draft:", e);
    return null;
  }
};

/**
 * Clear draft for current user scope
 */
export const clearScopedDraft = (userId: string | null): void => {
  try {
    const key = getScopedStorageKey(userId);
    localStorage.removeItem(key);
  } catch (e) {
    console.error("Failed to clear draft:", e);
  }
};

/**
 * Clear all application drafts (used on logout)
 */
export const clearAllDrafts = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    
    // Also clear the old global key if it exists
    localStorage.removeItem("recipient_application_data");
  } catch (e) {
    console.error("Failed to clear all drafts:", e);
  }
};

/**
 * Check if an anonymous draft exists (for prompting user on login)
 */
export const hasAnonymousDraft = (): boolean => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${DRAFT_KEY_PREFIX}:anon:`)) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
};

/**
 * Get the anonymous draft key if it exists
 */
export const getAnonymousDraftKey = (): string | null => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${DRAFT_KEY_PREFIX}:anon:`)) {
        return key;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Transfer anonymous draft to user (when user chooses to resume)
 */
export const transferAnonymousDraftToUser = (userId: string): boolean => {
  try {
    const anonKey = getAnonymousDraftKey();
    if (!anonKey) return false;
    
    const anonData = localStorage.getItem(anonKey);
    if (!anonData) return false;
    
    const parsed: DraftData = JSON.parse(anonData);
    
    // Save to user's key
    saveScopedDraft(userId, parsed.data);
    
    // Remove anonymous draft
    localStorage.removeItem(anonKey);
    
    return true;
  } catch (e) {
    console.error("Failed to transfer draft:", e);
    return false;
  }
};

/**
 * Clear anonymous drafts (when user chooses to discard)
 */
export const clearAnonymousDrafts = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${DRAFT_KEY_PREFIX}:anon:`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.error("Failed to clear anonymous drafts:", e);
  }
};

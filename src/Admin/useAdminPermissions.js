'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAdminUserById } from '../ApiService/action';

/**
 * Custom hook to verify Role-Based Access Control (RBAC) permissions for the current logged-in administrator.
 * Automatically synchronizes with live permissions across browser tabs, focus events, and background polling.
 * 
 * Usage:
 * const { isSuperAdmin, can, currentUser } = useAdminPermissions();
 * if (can('analytics', 'export_analytics_data')) { ... }
 */
export default function useAdminPermissions() {
    const [currentUser, setCurrentUser] = useState(null);
    const [isMounted, setIsMounted] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Sync from local storage
    const syncFromLocalStorage = useCallback(() => {
        try {
            const stored = localStorage.getItem("loginDetails");
            if (stored) {
                const parsed = JSON.parse(stored);
                setCurrentUser(parsed);
            }
        } catch (e) {
            console.error("Error parsing loginDetails from localStorage:", e);
        }
    }, []);

    // Live sync from backend API
    const syncLiveFromBackend = useCallback(async () => {
        try {
            const stored = localStorage.getItem("loginDetails");
            if (!stored) return;
            const user = JSON.parse(stored);
            if (!user?.id) return;

            const res = await getAdminUserById(user.id);
            if (res?.data?.success && res.data.data) {
                const fresh = res.data.data;
                const freshPermsStr = typeof fresh.permissions === 'object' ? JSON.stringify(fresh.permissions) : (fresh.permissions || '{}');
                const currPermsStr = typeof user.admin_permissions === 'object' ? JSON.stringify(user.admin_permissions) : (user.admin_permissions || typeof user.permissions === 'object' ? JSON.stringify(user.permissions) : (user.permissions || '{}'));

                // If permissions, role or super_admin status changed, immediately update
                if (
                    freshPermsStr !== currPermsStr ||
                    fresh.role_title !== (user.admin_role_title || user.role_title) ||
                    fresh.is_super_admin !== user.is_super_admin
                ) {
                    const merged = {
                        ...user,
                        ...fresh,
                        admin_permissions: fresh.permissions,
                        admin_role_title: fresh.role_title,
                        admin_department: fresh.department,
                        is_super_admin: fresh.is_super_admin
                    };
                    setCurrentUser(merged);
                    localStorage.setItem("loginDetails", JSON.stringify(merged));
                    window.dispatchEvent(new CustomEvent('admin_permissions_updated', { detail: merged }));
                }
            }
        } catch (e) {
            // Silently fail network hiccups without disrupting UI
        }
    }, []);

    useEffect(() => {
        setIsMounted(true);
        syncFromLocalStorage();
        setLoaded(true);

        // Initial live sync
        syncLiveFromBackend();

        // 1. Cross-tab storage change listener
        const handleStorage = (e) => {
            if (e.key === 'loginDetails' || e.key === 'admin_perms_timestamp') {
                syncFromLocalStorage();
                syncLiveFromBackend();
            }
        };

        // 2. In-window custom event listener
        const handleCustomUpdate = (e) => {
            if (e.detail) {
                syncFromLocalStorage();
            } else {
                syncLiveFromBackend();
            }
        };

        // 3. Tab focus listener (when switching tabs back to sub-admin view)
        const handleFocus = () => {
            syncFromLocalStorage();
            syncLiveFromBackend();
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('admin_permissions_updated', handleCustomUpdate);
        window.addEventListener('focus', handleFocus);

        // 4. Background polling interval (every 2.5 seconds for instant reflection)
        const intervalId = setInterval(() => {
            syncLiveFromBackend();
        }, 2500);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('admin_permissions_updated', handleCustomUpdate);
            window.removeEventListener('focus', handleFocus);
            clearInterval(intervalId);
        };
    }, [syncFromLocalStorage, syncLiveFromBackend]);

    const isSuperAdmin = useMemo(() => {
        if (!currentUser) return true;
        // Strict check: if explicitly marked non-super-admin (0 or false), return false
        if (currentUser.is_super_admin === 0 || currentUser.is_super_admin === false) {
            return false;
        }
        // Master Super Admin (ID 1), or is_super_admin === 1 / true default to Super Admin
        return true;
    }, [currentUser]);

    const userPermissions = useMemo(() => {
        const raw = currentUser?.admin_permissions || currentUser?.permissions;
        if (!raw) return null;
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
            return null;
        }
    }, [currentUser]);

    /**
     * Checks if the current admin is permitted to perform an action or view a module.
     * @param {string} moduleId - e.g. 'analytics', 'recruiters', 'plans', 'job_posts', etc.
     * @param {string} [actionId] - e.g. 'export_analytics_data', 'user_growth_analysis', etc.
     * @returns {boolean}
     */
    const can = useMemo(() => {
        return (moduleId, actionId) => {
            // Full Super Admin has master unrestricted clearance
            if (isSuperAdmin) return true;
            if (!userPermissions) return false;

            const modPerms = userPermissions[moduleId];
            if (!modPerms) return false;

            // If no specific action specified, check if module has view permission or any active permission
            if (!actionId) {
                if (modPerms.view) return true;
                return typeof modPerms === 'object' && Object.values(modPerms).some(v => v === true);
            }

            // Check specific fine-grained action
            return Boolean(modPerms[actionId]);
        };
    }, [isSuperAdmin, userPermissions]);

    return {
        currentUser,
        isSuperAdmin,
        userPermissions,
        can,
        hasPermission: can,
        loaded,
        isMounted,
        refreshPermissions: syncLiveFromBackend
    };
}

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/spacing';
import { User, Package, MapPin, Bell, LogOut, ChevronRight, Heart, Gift, Award, Shield, AlertCircle, Phone, HelpCircle, Lock } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../lib/api';

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { token, logout } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/account/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDashboard();
  }, [token]);

  const menuItems = [
    { id: 'Orders', title: 'My Orders', icon: Package, description: 'View tracking details & history' },
    { id: 'Wishlist', title: 'My Wishlist', icon: Heart, description: 'Your saved items' },
    { id: 'Coupons', title: 'My Coupons', icon: Gift, description: 'Available discounts' },
    { id: 'Rewards', title: 'My Rewards', icon: Award, description: 'Points & loyalty' },
    { id: 'Addresses', title: 'Saved Addresses', icon: MapPin, description: 'Manage shipping locations' },
    { id: 'Notifications', title: 'Notifications', icon: Bell, description: 'Alerts & offers' },
    { id: 'Settings', title: 'Settings', icon: User, description: 'Account & preferences' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  const user = data?.user || { firstName: 'User', lastName: '', email: '', phone: '' };
  const initials = user.firstName ? user.firstName.charAt(0) : 'U';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            {user.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
            {user.memberTier && <Text style={{...typography.caption, color: colors.secondary, fontWeight: '700', marginTop: 4}}>{user.memberTier} MEMBER</Text>}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.menuItem} 
                onPress={() => navigation.navigate(item.id)}
              >
                <View style={styles.menuIconContainer}>
                  <Icon size={24} color={colors.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => logout()}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...typography.h2, color: colors.primary },
  userInfo: { marginLeft: spacing.md, flex: 1 },
  userName: { ...typography.h3, color: colors.primary, marginBottom: 2 },
  userEmail: { ...typography.caption, color: colors.text, marginBottom: 2 },
  userPhone: { ...typography.caption, color: colors.textMuted },
  menuContainer: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  menuTextContainer: { flex: 1, marginLeft: spacing.md },
  menuTitle: { ...typography.body, fontWeight: '600', color: colors.primary, marginBottom: 2 },
  menuDescription: { ...typography.caption, color: colors.textMuted },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', padding: spacing.md, borderRadius: 12, marginTop: spacing.xl },
  logoutText: { ...typography.body, fontWeight: '700', color: '#EF4444', marginLeft: spacing.sm },
});

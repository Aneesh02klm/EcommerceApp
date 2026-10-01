import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/spacing';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../lib/api';

export const ComplaintsScreen = () => {
  const { token } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    const fetchApi = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/account/complaints`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          // If dashboard, extract recentOrders as an example fallback, else data
          const list = json.data?.recentOrders || (Array.isArray(json.data) ? json.data : []);
          setData(list);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchApi();
    
  }, [token]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No records found.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, idx) => idx.toString()}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardText}>{JSON.stringify(item).substring(0, 100)}...</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { ...typography.h3, color: colors.textMuted },
  card: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: 8, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardText: { ...typography.body, color: colors.primary },
});

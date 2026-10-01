import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/spacing';
import { Filter, SlidersHorizontal, ArrowLeft } from 'lucide-react-native';
import { API_URL } from '../lib/api';

export const ProductListScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const sortParam = route.params?.sort; // "Offers" for deals

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/products`);
        const json = await res.json();
        const data = json.success ? json.data : json;
        
        let processed = data.map((p: any) => ({
            ...p,
            mrp: p.mrp ?? p.MRP ?? 0,
            finalprice: p.finalPrice ?? p.finalprice ?? 0,
            discount: p.discount ?? p.Discount ?? 0,
            imageurl: p.images?.[0]?.imageUrl || p.imageurl,
        }));

        if (sortParam === 'Offers') {
            processed = processed.filter((p: any) => p.discount >= 15);
        }

        setProducts(processed);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [sortParam]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <View>
                <Text style={styles.title}>{sortParam === 'Offers' ? 'Exclusive Deals' : 'All Products'}</Text>
                <Text style={styles.subtitle}>{products.length} Items found</Text>
            </View>
        </View>
      </View>

      {sortParam !== 'Offers' && (
        <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterButton}>
            <SlidersHorizontal size={18} color={colors.text} />
            <Text style={styles.filterText}>Sort</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.filterButton}>
            <Filter size={18} color={colors.text} />
            <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
        </View>
      )}

      {loading ? (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={colors.secondary} />
          </View>
      ) : (
        <FlatList
            data={products}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.list}
            columnWrapperStyle={styles.row}
            renderItem={({ item }) => (
            <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Products', { screen: 'ProductDetail', params: { slug: item.slug || item.id } })}
                style={styles.productCard}
            >
                <View style={styles.productImageContainer}>
                    {item.imageurl ? (
                        <Image source={{uri: `${API_URL}${item.imageurl}`}} style={styles.productImage} resizeMode="contain" />
                    ) : (
                        <View style={styles.productImagePlaceholder} />
                    )}
                    {item.discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{item.discount}% OFF</Text>
                        </View>
                    )}
                </View>
                <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap'}}>
                    <Text style={styles.productPrice}>₹{item.finalprice.toLocaleString('en-IN')}</Text>
                    {item.mrp > item.finalprice && (
                        <Text style={styles.productOriginal}>₹{item.mrp.toLocaleString('en-IN')}</Text>
                    )}
                </View>
                </View>
            </TouchableOpacity>
            )}
            ListEmptyComponent={
                <View style={{padding: 40, alignItems: 'center'}}>
                    <Text style={{color: colors.textMuted}}>No products found.</Text>
                </View>
            }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 4, marginRight: 12 },
  title: { ...typography.h2, color: colors.primary },
  subtitle: { ...typography.caption, color: colors.textMuted },
  filterRow: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.sm },
  filterText: { marginLeft: spacing.sm, ...typography.body, fontWeight: '500' },
  divider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  list: { padding: spacing.sm },
  row: { justifyContent: 'space-between' },
  productCard: { width: '48%', backgroundColor: colors.surface, borderRadius: 8, marginBottom: spacing.md, overflow: 'hidden', borderColor: colors.border, borderWidth: 1 },
  productImageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#F8FAFC', position: 'relative', padding: spacing.sm },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#F1F5F9' },
  discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  productInfo: { padding: spacing.sm },
  productName: { ...typography.caption, fontWeight: '600', color: colors.primary, marginBottom: spacing.xs },
  productPrice: { ...typography.body, fontWeight: '800', color: colors.primary, marginRight: 6 },
  productOriginal: { fontSize: 10, color: colors.textMuted, textDecorationLine: 'line-through' },
});

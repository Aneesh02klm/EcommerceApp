import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/spacing';
import { Search, ArrowRight } from 'lucide-react-native';
import { API_URL } from '../lib/api';

const { width } = Dimensions.get('window');

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [banners, setBanners] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Hero Carousel State
  const [activeHero, setActiveHero] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannersRes, productsRes] = await Promise.all([
            fetch(`${API_URL}/api/cms/banners`),
            fetch(`${API_URL}/api/v1/products`)
        ]);
        
        const bannersData = await bannersRes.json();
        const productsData = await productsRes.json();

        if (Array.isArray(bannersData)) setBanners(bannersData);
        if (productsData.success) {
            setProducts(productsData.data.map((p: any) => ({
                ...p,
                mrp: p.mrp ?? p.MRP ?? 0,
                finalprice: p.finalPrice ?? p.finalprice ?? 0,
                discount: p.discount ?? p.Discount ?? 0,
                imageurl: p.images?.[0]?.imageUrl || p.imageurl,
            })));
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const heroBanners = banners.filter(b => !b.section || b.section === 'Hero');
  const dealsBanners = banners.filter(b => b.section === 'DealOfTheDay');
  const latestBanners = banners.filter(b => b.section === 'LatestLaunches');
  
  const bestSellers = [...products].sort((a: any, b: any) => (b.finalprice ?? 0) - (a.finalprice ?? 0)).slice(0, 6);
  const newArrivals = [...products].reverse().slice(0, 6);

  const categories = ['Washing Machines', 'Refrigerators', 'Televisions', 'Air Conditioners'];

  const onHeroScroll = (e: any) => {
    const slideSize = e.nativeEvent.layoutMeasurement.width;
    const index = e.nativeEvent.contentOffset.x / slideSize;
    setActiveHero(Math.round(index));
  };

  const navigateTo = (url: string) => {
      if (!url) return;
      if (url.startsWith('/deals')) {
          navigation.navigate('Products', { sort: 'Offers' });
      } else if (url.startsWith('/products/')) {
          const slug = url.split('/').pop();
          navigation.navigate('Products', { screen: 'ProductDetail', params: { slug } });
      } else {
          navigation.navigate('Products');
      }
  };

  if (loading) {
     return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color={colors.secondary} /></View>;
  }

  const ProductCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Products', { screen: 'ProductDetail', params: { slug: item.slug || item.id } })}
        style={styles.productCard}
    >
        <View style={styles.productImageContainer}>
            {item.imageurl ? (
                <Image source={{uri: item.imageurl.startsWith('http') ? item.imageurl : `${API_URL}${item.imageurl}`}} style={styles.productImage} resizeMode="contain" />
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
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.logo}>MALIEAKAL</Text>
          <Text style={styles.logoSub}>ELECTRONICS</Text>
        </View>
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Products')}>
          <Search size={20} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search for appliances...</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Carousel - Pure Images */}
      {heroBanners.length > 0 && (
        <View style={styles.heroContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={onHeroScroll}
            scrollEventThrottle={16}
          >
            {heroBanners.map((b, index) => (
              <TouchableOpacity activeOpacity={0.9} key={b.id || index} onPress={() => navigateTo(b.targetUrl || b.targeturl)} style={styles.heroSlide}>
                <Image source={{uri: (b.imageUrl || b.imageurl).startsWith('http') ? (b.imageUrl || b.imageurl) : `${API_URL}${b.imageUrl || b.imageurl}`}} style={styles.heroBg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          {heroBanners.length > 1 && (
            <View style={styles.pagination}>
              {heroBanners.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeHero && styles.activeDot]} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Deal of the Day - Multi Column */}
      {dealsBanners.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionSubtitle}>EXCLUSIVE OFFERS</Text>
                    <Text style={styles.sectionTitle}>Secondary Banners</Text>
                </View>
                <TouchableOpacity onPress={() => navigateTo('/deals')}>
                    <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.md }}>
                {dealsBanners.map((b, idx) => (
                    <TouchableOpacity activeOpacity={0.8} key={b.id || idx} onPress={() => navigateTo(b.targetUrl || b.targeturl)} style={styles.promoBanner}>
                        <Image source={{uri: (b.imageUrl || b.imageurl).startsWith('http') ? (b.imageUrl || b.imageurl) : `${API_URL}${b.imageUrl || b.imageurl}`}} style={styles.promoImage} resizeMode="cover" />
                        <View style={styles.promoOverlay} />
                        <View style={styles.promoContent}>
                            <Text style={styles.promoTitle}>{b.title}</Text>
                            <Text style={styles.promoSubtitle}>{b.subtitle}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
      )}

      {/* Lightning Deals / Best Sellers */}
      {bestSellers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionSubtitle}>HOT RIGHT NOW</Text>
                    <Text style={styles.sectionTitle}>Lightning Deals</Text>
                </View>
                <TouchableOpacity onPress={() => navigateTo('/products')}>
                    <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.md }}>
                {bestSellers.map((item) => (
                    <View key={item.id} style={{ width: 160, marginRight: spacing.md }}>
                        <ProductCard item={item} />
                    </View>
                ))}
            </ScrollView>
          </View>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
          <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionSubtitle}>JUST DROPPED</Text>
                    <Text style={styles.sectionTitle}>New Arrivals</Text>
                </View>
                <TouchableOpacity onPress={() => navigateTo('/products')}>
                    <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.md }}>
                {newArrivals.map((item) => (
                    <View key={item.id} style={{ width: 160, marginRight: spacing.md }}>
                        <ProductCard item={item} />
                    </View>
                ))}
            </ScrollView>
          </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat, idx) => (
            <TouchableOpacity key={idx} style={styles.categoryCard}>
              <View style={styles.categoryIcon} />
              <Text style={styles.categoryText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Infinite Vertical Grid at the Bottom */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { marginBottom: spacing.lg }]}>
            <View>
                <Text style={styles.sectionSubtitle}>GENERAL CATALOG</Text>
                <Text style={styles.sectionTitle}>Discover More</Text>
            </View>
        </View>
        <View style={styles.gridContainer}>
            {products.slice(0, 20).map((item) => (
                <View key={item.id} style={styles.gridItem}>
                    <ProductCard item={item} />
                </View>
            ))}
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: spacing.md, backgroundColor: colors.primary, paddingBottom: spacing.lg },
  headerTop: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.md },
  logo: { ...typography.h2, color: colors.secondary, fontWeight: '800', letterSpacing: -0.5 },
  logoSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600', marginLeft: 4, letterSpacing: 1 },
  searchBar: { flexDirection: 'row', backgroundColor: colors.surface, padding: spacing.sm, borderRadius: 8, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  searchPlaceholder: { color: colors.textMuted, marginLeft: spacing.sm, ...typography.body },
  
  heroContainer: { position: 'relative' },
  heroSlide: { width, height: 280, position: 'relative' },
  heroBg: { width: '100%', height: '100%', position: 'absolute' },
  
  pagination: { flexDirection: 'row', position: 'absolute', bottom: 12, alignSelf: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 4 },
  activeDot: { backgroundColor: colors.secondary, width: 16 },

  section: { padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.md },
  sectionSubtitle: { fontSize: 9, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  sectionTitle: { ...typography.h2, color: colors.primary, fontWeight: '800' },
  viewAll: { color: colors.secondary, fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  
  promoBanner: { width: 280, height: 160, borderRadius: 12, overflow: 'hidden', marginRight: spacing.md },
  promoImage: { width: '100%', height: '100%', position: 'absolute' },
  promoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  promoContent: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  promoTitle: { color: colors.surface, fontSize: 18, fontWeight: '800', marginBottom: 2 },
  promoSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },

  categoryScroll: { marginTop: spacing.xs },
  categoryCard: { alignItems: 'center', marginRight: spacing.lg, width: 80 },
  categoryIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, marginBottom: spacing.sm },
  categoryText: { ...typography.caption, color: colors.primary, textAlign: 'center', fontWeight: '600' },

  productCard: { width: '100%', backgroundColor: colors.surface, borderRadius: 8, marginBottom: spacing.md, overflow: 'hidden', borderColor: colors.border, borderWidth: 1 },
  productImageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#F8FAFC', position: 'relative', padding: spacing.sm },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#F1F5F9' },
  discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  productInfo: { padding: spacing.sm },
  productName: { ...typography.caption, fontWeight: '600', color: colors.primary, marginBottom: spacing.xs },
  productPrice: { ...typography.body, fontWeight: '800', color: colors.primary, marginRight: 6 },
  productOriginal: { fontSize: 10, color: colors.textMuted, textDecorationLine: 'line-through' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 2 },
  gridItem: { width: '48%', marginBottom: 8 }
});

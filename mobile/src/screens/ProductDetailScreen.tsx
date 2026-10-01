import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/spacing';
import { Button } from '../components/Button';
import { Star, Truck, ShieldCheck, Heart, MapPin, ArrowLeft } from 'lucide-react-native';
import { API_URL } from '../lib/api';

const { width } = Dimensions.get('window');

export const ProductDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const slug = route.params?.slug;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/products/slug/${slug}`);
        const json = await res.json();
        if (json.success) {
            const prod = json.data;
            setProduct(prod);
            
            // Fetch related
            try {
                const relRes = await fetch(`${API_URL}/api/v1/products`);
                const relJson = await relRes.json();
                if (relJson.success) {
                    setRelatedProducts(relJson.data.filter((p:any) => p.categoryId === json.data.categoryId && p.id !== json.data.id).slice(0, 8));
                }
            } catch(e) {}
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color={colors.secondary} /></View>;
  if (!product) return <View style={[styles.container, styles.centered]}><Text>Product not found</Text></View>;

  const activePrice = selectedVariant ? (product.finalPrice + selectedVariant.additionalPrice) : product.finalPrice;
  const discountAmount = product.mrp - activePrice;
  const discountPercent = Math.round((discountAmount / product.mrp) * 100);

  const images = selectedVariant && selectedVariant.imageUrl 
                 ? [{ imageUrl: selectedVariant.imageUrl, isPrimary: true }, ...(product.images || [])] 
                 : (product.images || []);

  const richMedia = product.richMedia || [];

  const checkPincode = () => {
    if (pincode.length === 6) {
      setDeliveryInfo('Delivery available in 2-3 business days.');
    } else {
      setDeliveryInfo('Enter a valid 6-digit pincode.');
    }
  };

  const ProductCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => navigation.push('Products', { screen: 'ProductDetail', params: { slug: item.slug || item.id } })}
        style={styles.productCard}
    >
        <View style={styles.productImageContainer}>
            {item.images && item.images.length > 0 ? (
                <Image source={{uri: item.images[0].imageUrl.startsWith('http') ? item.images[0].imageUrl : `${API_URL}${item.images[0].imageUrl}`}} style={styles.productImageSmall} resizeMode="contain" />
            ) : item.imageurl ? (
                <Image source={{uri: item.imageurl.startsWith('http') ? item.imageurl : `${API_URL}${item.imageurl}`}} style={styles.productImageSmall} resizeMode="contain" />
            ) : <View style={styles.productImagePlaceholder} />}
        </View>
        <View style={styles.productInfo}>
            <Text style={styles.productNameSmall} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productPriceSmall}>₹{(item.finalPrice ?? item.finalprice ?? 0).toLocaleString('en-IN')}</Text>
        </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 4}}><ArrowLeft size={24} color={colors.primary} /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        <View style={styles.galleryContainer}>
            <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}
                scrollEventThrottle={16}
            >
                {images.length > 0 ? images.map((img:any, i:number) => (
                    <View key={i} style={styles.slide}>
                        <Image source={{uri: img.imageUrl.startsWith('http') ? img.imageUrl : `${API_URL}${img.imageUrl}`}} style={styles.slideImage} resizeMode="contain" />
                    </View>
                )) : <View style={styles.slide}><View style={styles.placeholderImage}/></View>}
            </ScrollView>
            {images.length > 1 && (
                <View style={styles.pagination}>
                    {images.map((_:any, i:number) => (
                        <View key={i} style={[styles.dot, i === activeImage && styles.activeDot]} />
                    ))}
                </View>
            )}
            <View style={styles.favoriteButton}><Heart color={colors.textMuted} size={20} /></View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{product.name}</Text>
          
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Star color={colors.surface} fill={colors.surface} size={12} />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
            <Text style={styles.reviewText}>124 Ratings</Text>
            <View style={{width: 1, height: 12, backgroundColor: colors.border, marginHorizontal: 8}} />
            <Text style={[styles.reviewText, {color: product.stock > 0 ? colors.success : colors.error, fontWeight: '700'}]}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{activePrice.toLocaleString('en-IN')}</Text>
            {product.mrp > activePrice && (
                <>
                    <Text style={styles.originalPrice}>₹{product.mrp.toLocaleString('en-IN')}</Text>
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                    </View>
                </>
            )}
          </View>
          <Text style={styles.taxText}>Inclusive of all taxes</Text>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
              <View style={styles.variantsSection}>
                  <Text style={styles.variantsLabel}>Available Options</Text>
                  <View style={styles.variantsRow}>
                      {product.variants.map((v:any) => (
                          <TouchableOpacity 
                            key={v.id} 
                            onPress={() => setSelectedVariant(v)}
                            style={[styles.variantPill, selectedVariant?.id === v.id && styles.variantPillActive]}
                          >
                              <Text style={[styles.variantPillText, selectedVariant?.id === v.id && styles.variantPillTextActive]}>
                                  {v.name}
                              </Text>
                          </TouchableOpacity>
                      ))}
                  </View>
              </View>
          )}

          {/* Delivery Pincode */}
          <View style={styles.pincodeBox}>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                  <MapPin size={16} color={colors.primary} />
                  <Text style={styles.pincodeTitle}>Delivery Options</Text>
              </View>
              <View style={styles.pincodeRow}>
                  <TextInput 
                      style={styles.pincodeInput} 
                      placeholder="Enter Pincode" 
                      value={pincode}
                      onChangeText={setPincode}
                      keyboardType="numeric"
                      maxLength={6}
                  />
                  <TouchableOpacity style={styles.pincodeBtn} onPress={checkPincode}>
                      <Text style={styles.pincodeBtnText}>CHECK</Text>
                  </TouchableOpacity>
              </View>
              {deliveryInfo && <Text style={styles.pincodeMsg}>{deliveryInfo}</Text>}
          </View>

          {/* Highlights */}
          {product.highlights && (
              <View style={styles.highlightsSection}>
                  <Text style={styles.highlightsTitle}>Key Highlights</Text>
                  {product.highlights.split('|').map((h:string, i:number) => (
                      <View key={i} style={styles.highlightRow}>
                          <Text style={styles.highlightBullet}>•</Text>
                          <Text style={styles.highlightText}>{h.trim()}</Text>
                      </View>
                  ))}
              </View>
          )}

          <View style={styles.benefitsRow}>
            <View style={styles.benefitItem}>
              <Truck color={colors.secondary} size={24} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Free Delivery</Text>
                <Text style={styles.benefitDesc}>All over Kerala</Text>
              </View>
            </View>
            <View style={styles.benefitItem}>
              <ShieldCheck color={colors.secondary} size={24} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Warranty</Text>
                <Text style={styles.benefitDesc}>Brand Assured</Text>
              </View>
            </View>
          </View>
          
          {/* Tabs */}
          <View style={styles.tabsRow}>
              {['description', 'specs', 'features'].map(t => (
                  <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}>
                      <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t.toUpperCase()}</Text>
                  </TouchableOpacity>
              ))}
          </View>

          <View style={styles.tabContent}>
              {activeTab === 'description' && <Text style={styles.description}>{product.description}</Text>}
              {activeTab === 'specs' && (() => {
                  let parsedSpecs: Record<string, Record<string, string>> = {};
                  try {
                      if (product.specificationJson && product.specificationJson !== '{}') {
                          parsedSpecs = JSON.parse(product.specificationJson);
                      }
                  } catch { /* invalid JSON */ }
                  const groups = Object.entries(parsedSpecs);
                  if (groups.length === 0) return <Text style={styles.description}>No technical specifications available.</Text>;
                  return (
                      <>
                          {groups.map(([group, specsForGroup]) => {
                              const rows = Object.entries(specsForGroup).filter(([, val]) => val !== null && val !== undefined && String(val).trim() !== '');
                              if (rows.length === 0) return null;
                              return (
                                  <View key={group} style={{marginBottom: spacing.md}}>
                                      <Text style={{fontSize: 11, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.border}}>{group}</Text>
                                      {rows.map(([key, val], i) => (
                                          <View key={i} style={styles.specRow}>
                                              <Text style={styles.specName}>{key}</Text>
                                              <Text style={styles.specVal}>{String(val)}</Text>
                                          </View>
                                      ))}
                                  </View>
                              );
                          })}
                      </>
                  );
              })()}
              {activeTab === 'features' && <Text style={styles.description}>{product.features}</Text>}
          </View>

          {/* Rich Media */}
          {richMedia.length > 0 && (
              <View style={styles.richMediaContainer}>
                  {richMedia.map((rm:any) => (
                      <View key={rm.id} style={styles.rmBox}>
                          <Image source={{uri: rm.mediaUrl.startsWith('http') ? rm.mediaUrl : `${API_URL}${rm.mediaUrl}`}} style={styles.rmImage} resizeMode="cover" />
                          <View style={styles.rmOverlay}>
                              {rm.title && <Text style={styles.rmTitle}>{rm.title}</Text>}
                              {rm.description && <Text style={styles.rmDesc}>{rm.description}</Text>}
                          </View>
                      </View>
                  ))}
              </View>
          )}

          {/* Related */}
          {relatedProducts.length > 0 && (
              <View style={styles.relatedSection}>
                  <Text style={styles.relatedTitle}>Related Products</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingRight: spacing.md}}>
                      {relatedProducts.map(rp => (
                          <View key={rp.id} style={{width: 150, marginRight: 16}}>
                              <ProductCard item={rp} />
                          </View>
                      ))}
                  </ScrollView>
              </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button title="Add to Cart" variant="outline" style={styles.bottomButton} />
        <Button title="Buy Now" variant="primary" style={styles.bottomButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  
  galleryContainer: { width, height: width, backgroundColor: '#F8FAFC' },
  slide: { width, height: width },
  slideImage: { width: '100%', height: '100%' },
  placeholderImage: { flex: 1, backgroundColor: '#F1F5F9' },
  favoriteButton: { position: 'absolute', right: spacing.md, top: spacing.md, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  pagination: { flexDirection: 'row', position: 'absolute', bottom: 16, alignSelf: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)', marginHorizontal: 4 },
  activeDot: { backgroundColor: colors.primary, width: 12 },

  content: { backgroundColor: colors.surface },
  title: { ...typography.h3, color: colors.primary, marginBottom: spacing.xs, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, paddingHorizontal: spacing.md },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ratingText: { color: colors.surface, fontWeight: '700', fontSize: 12, marginLeft: 4 },
  reviewText: { color: colors.textMuted, marginLeft: spacing.sm, ...typography.caption },
  
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2, paddingHorizontal: spacing.md },
  price: { ...typography.h1, color: colors.primary, lineHeight: 32 },
  originalPrice: { ...typography.body, color: colors.textMuted, textDecorationLine: 'line-through', marginLeft: spacing.sm, marginBottom: 2 },
  discountBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4, marginLeft: spacing.sm, marginBottom: 4 },
  discountText: { color: colors.success, fontWeight: '700', fontSize: 10 },
  taxText: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg, paddingHorizontal: spacing.md },

  variantsSection: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  variantsLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 8 },
  variantsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  variantPillActive: { borderColor: colors.secondary, backgroundColor: '#FFFBEB' },
  variantPillText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  variantPillTextActive: { color: '#B45309' },

  pincodeBox: { marginHorizontal: spacing.md, padding: spacing.md, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  pincodeTitle: { fontSize: 10, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', marginLeft: 6 },
  pincodeRow: { flexDirection: 'row', gap: 8 },
  pincodeInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  pincodeBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 4 },
  pincodeBtnText: { color: colors.surface, fontSize: 10, fontWeight: '800' },
  pincodeMsg: { marginTop: 8, fontSize: 11, color: colors.success, fontWeight: '600' },

  highlightsSection: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  highlightsTitle: { fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 8 },
  highlightRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
  highlightBullet: { color: colors.secondary, fontSize: 14, marginRight: 6, lineHeight: 18 },
  highlightText: { fontSize: 13, color: colors.textMuted, flex: 1, lineHeight: 18 },

  benefitsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  benefitItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  benefitTextContainer: { marginLeft: spacing.sm },
  benefitTitle: { ...typography.caption, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', fontSize: 10 },
  benefitDesc: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
  
  tabsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: '#F8FAFC' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: colors.secondary, backgroundColor: colors.surface },
  tabText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  tabContent: { padding: spacing.md, minHeight: 150 },
  description: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
  specRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  specName: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.textMuted },
  specVal: { flex: 1, fontSize: 12, color: colors.primary, fontWeight: '500' },

  richMediaContainer: { padding: spacing.md },
  rmBox: { width: '100%', height: 300, borderRadius: 12, overflow: 'hidden', marginBottom: spacing.md, backgroundColor: '#000' },
  rmImage: { width: '100%', height: '100%', opacity: 0.8 },
  rmOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  rmTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  rmDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },

  relatedSection: { padding: spacing.md, paddingBottom: 40 },
  relatedTitle: { ...typography.h3, color: colors.primary, marginBottom: spacing.md },

  productCard: { width: '100%', backgroundColor: colors.surface, borderRadius: 8, overflow: 'hidden', borderColor: colors.border, borderWidth: 1 },
  productImageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#F8FAFC', padding: 8 },
  productImageSmall: { width: '100%', height: '100%' },
  productImagePlaceholder: { flex: 1, backgroundColor: '#E2E8F0' },
  productInfo: { padding: spacing.sm },
  productNameSmall: { fontSize: 11, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  productPriceSmall: { fontSize: 13, fontWeight: '800', color: colors.primary },

  bottomBar: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  bottomButton: { flex: 1, marginHorizontal: spacing.xs },
});

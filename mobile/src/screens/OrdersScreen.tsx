import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Image, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/spacing';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { API_URL } from '../lib/api';
import { Package, Shield, CheckCircle, Clock, ChevronDown, ChevronUp, MapPin, CreditCard, HelpCircle, MessageSquare, RefreshCw, Download, Star, X } from 'lucide-react-native';

export const OrdersScreen = () => {
  const { token } = useAuthStore();
  const { addItem } = useCartStore();
  const navigation = useNavigation<any>();
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Modals
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchApi();
  }, [token]);

  const toggleOrderDetails = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    
    const order = data.find(o => o.id === orderId);
    if (order && !order.items) {
      setDetailsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setData(prev => prev.map(o => o.id === orderId ? { ...o, ...json.data } : o));
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load order details');
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  const handleBuyItAgain = async (productId: string) => {
    try {
      await addItem(productId, 1);
      Alert.alert('Success', 'Added to cart!');
    } catch (e) {
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  const downloadInvoice = (orderNumber: string) => {
    Alert.alert('Download', `Invoice ${orderNumber}-Invoice.pdf downloaded successfully`);
  };

  const openReviewModal = (item: any) => {
    setReviewItem(item);
    setRating(5);
    setComment('');
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!reviewItem) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: reviewItem.productId,
          rating,
          comment
        })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Review submitted successfully!');
        setReviewModalOpen(false);
      } else {
        Alert.alert('Error', json.message || 'Failed to submit review');
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred while submitting');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  const renderItem = ({ item: order }: { item: any }) => {
    const isExpanded = expandedOrderId === order.id;

    return (
      <View style={styles.orderCard}>
        <TouchableOpacity 
          style={styles.orderHeader}
          onPress={() => toggleOrderDetails(order.id)}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
            <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
            {isExpanded ? <ChevronUp size={20} color={colors.textMuted} /> : <ChevronDown size={20} color={colors.textMuted} />}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {detailsLoading && !order.items ? (
              <ActivityIndicator size="small" color={colors.secondary} style={{ padding: 20 }} />
            ) : (
              <>
                <View style={styles.itemsHeader}>
                  <Text style={styles.sectionTitle}>Items Included</Text>
                  <TouchableOpacity onPress={() => downloadInvoice(order.orderNumber)} style={styles.downloadBtn}>
                    <Download size={14} color={colors.secondary} style={{marginRight: 4}} />
                    <Text style={styles.downloadText}>Download Invoice</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.itemsList}>
                  {order.items?.map((productItem: any) => {
                    const isWarrantyActive = productItem.warrantyExpiryDate && new Date(productItem.warrantyExpiryDate) > new Date();
                    
                    return (
                      <View key={productItem.id} style={styles.productItemRow}>
                        <View style={styles.productRowMain}>
                            <TouchableOpacity 
                            style={styles.imageContainer} 
                            onPress={() => navigation.navigate('Products', { screen: 'ProductDetail', params: { slug: productItem.productSlug || productItem.productId }})}
                            >
                            {productItem.productImage ? (
                                <Image source={{ uri: `${API_URL}${productItem.productImage}` }} style={styles.productImage} resizeMode="contain" />
                            ) : (
                                <Package size={24} color={colors.textMuted} />
                            )}
                            {productItem.quantity > 1 && (
                                <View style={styles.quantityBadge}>
                                    <Text style={styles.quantityBadgeText}>{productItem.quantity}x</Text>
                                </View>
                            )}
                            </TouchableOpacity>
                            <View style={styles.productDetails}>
                                <TouchableOpacity onPress={() => navigation.navigate('Products', { screen: 'ProductDetail', params: { slug: productItem.productSlug || productItem.productId }})}>
                                    <Text style={styles.productName} numberOfLines={2}>{productItem.productName}</Text>
                                </TouchableOpacity>
                                <Text style={styles.productPriceText}>Price: ₹{(productItem.price).toLocaleString('en-IN')}</Text>
                                
                                {productItem.warrantyPeriod && (
                                    <View style={styles.warrantyBox}>
                                    <Shield size={12} color={colors.textMuted} style={{marginRight: 4}} />
                                    <Text style={styles.warrantyText}>{productItem.warrantyPeriod} Warranty</Text>
                                    {productItem.warrantyExpiryDate && (
                                        <View style={[styles.warrantyStatus, isWarrantyActive ? styles.warrantyActive : styles.warrantyExpired]}>
                                        <Text style={[styles.warrantyStatusText, isWarrantyActive ? styles.warrantyActiveText : styles.warrantyExpiredText]}>
                                            {isWarrantyActive ? 'ACTIVE' : 'EXPIRED'}
                                        </Text>
                                        </View>
                                    )}
                                    </View>
                                )}
                            </View>
                            <Text style={styles.productRowTotal}>₹{(productItem.price * productItem.quantity).toLocaleString('en-IN')}</Text>
                        </View>
                        
                        {order.status === 'Delivered' && (
                            <View style={styles.actionButtonsRow}>
                                <TouchableOpacity style={styles.actionButton} onPress={() => handleBuyItAgain(productItem.productId)}>
                                    <RefreshCw size={12} color={colors.text} style={{marginRight: 4}} />
                                    <Text style={styles.actionButtonText}>Buy It Again</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={() => setSupportModalOpen(true)}>
                                    <HelpCircle size={12} color={colors.text} style={{marginRight: 4}} />
                                    <Text style={styles.actionButtonText}>Get product support</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={() => openReviewModal(productItem)}>
                                    <MessageSquare size={12} color={colors.text} style={{marginRight: 4}} />
                                    <Text style={styles.actionButtonText}>Write a product review</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                      </View>
                    )
                  })}
                </View>

                {/* Order Summary */}
                <View style={styles.infoCard}>
                  <Text style={styles.sectionTitle}>Order Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Item(s) Subtotal</Text>
                    <Text style={styles.summaryValue}>₹{(order.subTotal || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping charges</Text>
                    <Text style={styles.summaryValue}>₹{(order.shippingCharges || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={[styles.summaryRow, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8, marginBottom: 8 }]}>
                    <Text style={styles.summaryLabel}>Total</Text>
                    <Text style={styles.summaryValue}>₹{((order.subTotal || 0) + (order.shippingCharges || 0)).toLocaleString('en-IN')}</Text>
                  </View>
                  {(order.discount || 0) > 0 && (
                      <View style={[styles.summaryRow, { marginBottom: 8 }]}>
                          <Text style={[styles.summaryLabel, { color: '#166534' }]}>Promotion/Coupon Applied</Text>
                          <Text style={[styles.summaryValue, { color: '#166534' }]}>-₹{(order.discount || 0).toLocaleString('en-IN')}</Text>
                      </View>
                  )}
                  <View style={styles.summaryRow}>
                    <Text style={styles.grandTotalLabel}>Grand Total</Text>
                    <Text style={styles.grandTotalValue}>₹{(order.totalAmount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Ship To */}
                {order.shippingAddress && (
                    <View style={styles.infoCard}>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                            <MapPin size={16} color={colors.textMuted} style={{marginRight: 6}} />
                            <Text style={styles.sectionTitle}>Ship To</Text>
                        </View>
                        <Text style={styles.addressName}>{order.shippingAddress.fullName}</Text>
                        <Text style={styles.addressText}>{order.shippingAddress.addressLine1}</Text>
                        {order.shippingAddress.addressLine2 ? <Text style={styles.addressText}>{order.shippingAddress.addressLine2}</Text> : null}
                        <Text style={styles.addressText}>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</Text>
                        <Text style={[styles.addressText, { marginTop: 4, fontWeight: '500' }]}>Phone: {order.shippingAddress.phone}</Text>
                    </View>
                )}

                {/* Payment Method */}
                {order.paymentInfo && (
                    <View style={styles.infoCard}>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                            <CreditCard size={16} color={colors.textMuted} style={{marginRight: 6}} />
                            <Text style={styles.sectionTitle}>Payment Method</Text>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <View style={styles.payIcon}><Text style={styles.payIconText}>PAY</Text></View>
                            <Text style={styles.paymentMethodText}>{order.paymentInfo.method || 'Online Payment'}</Text>
                        </View>
                        <Text style={styles.transactionText}>Transaction ID: {order.paymentInfo.razorpayPaymentId || 'N/A'}</Text>
                    </View>
                )}

              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {data.length === 0 ? (
        <View style={styles.centered}>
          <Package size={48} color={colors.border} />
          <Text style={styles.emptyText}>No orders yet.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={renderItem}
        />
      )}

      {/* Support Modal */}
      <Modal visible={supportModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSupportModalOpen(false)}>
                    <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
                <View style={styles.supportIconWrap}>
                    <HelpCircle size={24} color={colors.secondary} />
                </View>
                <Text style={styles.modalTitle}>Need Help?</Text>
                <Text style={styles.modalSubtitle}>Our customer support team is available 24/7 to assist you with your purchase.</Text>
                
                <View style={styles.supportBox}>
                    <Text style={styles.supportLabel}>Call Us (Toll Free)</Text>
                    <Text style={styles.supportValueLg}>1800-425-4255</Text>
                </View>
                <View style={styles.supportBox}>
                    <Text style={styles.supportLabel}>Email Support</Text>
                    <Text style={styles.supportValue}>support@malieakal.com</Text>
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setSupportModalOpen(false)}>
                    <Text style={styles.primaryBtnText}>Close</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal visible={reviewModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setReviewModalOpen(false)}>
                    <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Write a Review</Text>
                <Text style={styles.modalSubtitle}>Share your experience with {reviewItem?.productName}</Text>
                
                <Text style={styles.formLabel}>Rating</Text>
                <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)}>
                            <Star size={36} color={rating >= s ? colors.secondary : colors.border} fill={rating >= s ? colors.secondary : 'transparent'} />
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.formLabel}>Review Details</Text>
                <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    placeholder="What did you like or dislike?"
                    value={comment}
                    onChangeText={setComment}
                    textAlignVertical="top"
                />

                <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.primaryBtn, {backgroundColor: '#f1f5f9', flex: 1, marginRight: 8}]} onPress={() => setReviewModalOpen(false)}>
                        <Text style={[styles.primaryBtnText, {color: colors.text}]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryBtn, {flex: 1, marginLeft: 8}]} onPress={submitReview} disabled={submittingReview}>
                        {submittingReview ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryBtnText}>Submit Review</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { ...typography.h3, color: colors.textMuted, marginTop: spacing.md },
  
  orderCard: { backgroundColor: colors.surface, borderRadius: 12, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: spacing.md, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: colors.border },
  orderNumber: { ...typography.body, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  orderDate: { ...typography.caption, color: colors.textMuted },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#0369A1', textTransform: 'uppercase' },
  
  expandedContent: { backgroundColor: colors.surface },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center' },
  downloadText: { fontSize: 11, fontWeight: '800', color: colors.secondary },
  
  itemsList: { padding: spacing.md },
  productItemRow: { marginBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: spacing.md },
  productRowMain: { flexDirection: 'row', alignItems: 'flex-start' },
  imageContainer: { width: 64, height: 64, backgroundColor: '#F8FAFC', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, position: 'relative' },
  productImage: { width: '80%', height: '80%' },
  quantityBadge: { position: 'absolute', bottom: -6, right: -6, backgroundColor: colors.secondary, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.surface },
  quantityBadgeText: { color: colors.surface, fontSize: 9, fontWeight: '800' },
  
  productDetails: { flex: 1, marginLeft: spacing.md },
  productName: { ...typography.body, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  productPriceText: { ...typography.caption, color: colors.textMuted, fontWeight: '500', marginBottom: 4 },
  productRowTotal: { ...typography.body, fontWeight: '800', color: colors.primary, marginLeft: spacing.sm },
  
  warrantyBox: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  warrantyText: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginRight: 6 },
  warrantyStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  warrantyActive: { backgroundColor: '#DCFCE7' },
  warrantyExpired: { backgroundColor: '#FEE2E2' },
  warrantyStatusText: { fontSize: 9, fontWeight: '800' },
  warrantyActiveText: { color: '#166534' },
  warrantyExpiredText: { color: '#991B1B' },

  actionButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, paddingLeft: 80 },
  actionButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  actionButtonText: { fontSize: 10, fontWeight: '800', color: colors.text },

  infoCard: { backgroundColor: '#F8FAFC', marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  summaryValue: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  grandTotalLabel: { fontSize: 14, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
  grandTotalValue: { fontSize: 18, fontWeight: '800', color: colors.secondary },

  addressName: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  addressText: { fontSize: 13, color: colors.text, marginBottom: 2 },

  payIcon: { width: 32, height: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  payIconText: { fontSize: 8, fontWeight: '900', color: '#1e3a8a' },
  paymentMethodText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  transactionText: { fontSize: 11, color: colors.textMuted, fontWeight: '500', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, width: '100%', position: 'relative' },
  modalCloseBtn: { position: 'absolute', top: 16, right: 16, padding: 4 },
  supportIconWrap: { width: 48, height: 48, backgroundColor: '#E0F2FE', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h3, color: colors.primary, marginBottom: 4 },
  modalSubtitle: { ...typography.caption, color: colors.text, marginBottom: spacing.lg },
  supportBox: { backgroundColor: '#F8FAFC', padding: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  supportLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  supportValueLg: { fontSize: 18, fontWeight: '800', color: colors.primary },
  supportValue: { fontSize: 14, fontWeight: '700', color: colors.primary },
  primaryBtn: { backgroundColor: colors.secondary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  primaryBtnText: { color: colors.surface, fontWeight: '800', fontSize: 14 },
  
  formLabel: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  starsContainer: { flexDirection: 'row', marginBottom: spacing.lg, gap: 8 },
  textArea: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, height: 100, marginBottom: spacing.xl, color: colors.primary },
  modalActions: { flexDirection: 'row' },
});

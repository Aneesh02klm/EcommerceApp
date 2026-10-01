import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/spacing';
import { Button } from '../components/Button';
import { Minus, Plus, Trash2 } from 'lucide-react-native';

export const CartScreen = () => {
  const cartItems = [
    { id: '1', name: 'LG 9 Kg 5 Star Fully Automatic Front Load Washing Machine', price: 34990, originalPrice: 45000, quantity: 1 },
    { id: '2', name: 'Samsung 324L 3 Star Frost Free Double Door Refrigerator', price: 28500, originalPrice: 35000, quantity: 1 },
  ];

  const totalMRP = cartItems.reduce((acc, item) => acc + (item.originalPrice * item.quantity), 0);
  const finalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = totalMRP - finalPrice;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        
        {cartItems.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.itemPrice}>₹{item.price.toLocaleString('en-IN')}</Text>
                <Text style={styles.itemOriginalPrice}>₹{item.originalPrice.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.actionRow}>
                <View style={styles.quantityControl}>
                  <TouchableOpacity style={styles.qtyButton}><Minus size={16} color={colors.text} /></TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyButton}><Plus size={16} color={colors.text} /></TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.deleteButton}>
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Price Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price ({cartItems.length} items)</Text>
            <Text style={styles.summaryValue}>₹{totalMRP.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>- ₹{discount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>Free</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{finalPrice.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotal}>₹{finalPrice.toLocaleString('en-IN')}</Text>
          <Text style={styles.bottomSavings}>View Price Details</Text>
        </View>
        <Button title="Checkout" variant="primary" style={styles.checkoutButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  headerTitle: { ...typography.h2, color: colors.primary, marginBottom: spacing.md },
  cartItem: { flexDirection: 'row', backgroundColor: colors.surface, padding: spacing.sm, borderRadius: 8, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  itemImage: { width: 80, height: 80, backgroundColor: '#F1F5F9', borderRadius: 6 },
  itemDetails: { flex: 1, marginLeft: spacing.sm, justifyContent: 'space-between' },
  itemName: { ...typography.caption, fontWeight: '500', color: colors.primary },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  itemPrice: { ...typography.body, fontWeight: '700', color: colors.primary },
  itemOriginalPrice: { ...typography.caption, color: colors.textMuted, textDecorationLine: 'line-through', marginLeft: spacing.sm },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  quantityControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 4 },
  qtyButton: { padding: 6, backgroundColor: colors.surface },
  qtyText: { paddingHorizontal: 12, ...typography.caption, fontWeight: '600' },
  deleteButton: { padding: spacing.xs },
  summaryCard: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm },
  summaryTitle: { ...typography.h3, color: colors.primary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm, marginBottom: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryLabel: { ...typography.body, color: colors.text },
  summaryValue: { ...typography.body, fontWeight: '500', color: colors.primary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { ...typography.h3, color: colors.primary },
  totalValue: { ...typography.h2, color: colors.primary },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  bottomTotal: { ...typography.h2, color: colors.primary },
  bottomSavings: { ...typography.caption, color: colors.secondary, fontWeight: '600' },
  checkoutButton: { width: 150 },
});

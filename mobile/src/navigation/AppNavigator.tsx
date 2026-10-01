import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { ProductListScreen } from '../screens/ProductListScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { WishlistScreen } from '../screens/WishlistScreen';
import { CouponsScreen } from '../screens/CouponsScreen';
import { RewardsScreen } from '../screens/RewardsScreen';
import { AddressesScreen } from '../screens/AddressesScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="ProductList" component={ProductListScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
  </Stack.Navigator>
);

const CartStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CartMain" component={CartScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ 
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: colors.surface,
  }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'My Account' }} />
    <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
    <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'My Wishlist' }} />
    <Stack.Screen name="Coupons" component={CouponsScreen} options={{ title: 'My Coupons' }} />
    <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: 'My Rewards' }} />
    <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: 'Addresses' }} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Home') return <Home color={color} size={size} />;
            if (route.name === 'Products') return <ShoppingBag color={color} size={size} />;
            if (route.name === 'Cart') return <ShoppingCart color={color} size={size} />;
            if (route.name === 'Profile') return <User color={color} size={size} />;
          },
          tabBarActiveTintColor: colors.secondary,
          tabBarInactiveTintColor: colors.textMuted,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface,
          tabBarStyle: {
            backgroundColor: colors.primary,
            borderTopColor: colors.primary,
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} />
        <Tab.Screen name="Products" component={ProductListScreen} options={{ title: 'All Products' }} />
        <Tab.Screen name="Cart" component={CartStack} options={{ title: 'Shopping Cart' }} />
        <Tab.Screen name="Profile" component={ProfileStack} options={{ headerShown: false }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

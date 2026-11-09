// Navigation: a stack navigator that contains the bottom tabs + detail screens.
//
//  Not logged in:  Welcome -> SignUp
//  Logged in:      Tabs (Home, Print, Cart, Orders, Profile)
//                  + StoreMenu, ProductDetails, Checkout, Tracking, Wallet
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { cartCount } from '../utils/pricing';
import { colors } from '../theme';

import WelcomeScreen from '../screens/WelcomeScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import StoreMenuScreen from '../screens/StoreMenuScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import PrintScreen from '../screens/PrintScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import TrackingScreen from '../screens/TrackingScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WalletScreen from '../screens/WalletScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'storefront',
  Print: 'print',
  Cart: 'cart',
  Orders: 'receipt',
  Profile: 'person',
};

const headerStyle = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.primary,
  headerTitleStyle: { fontWeight: '700', color: colors.text },
  headerShadowVisible: false,
};

function MainTabs() {
  const { cart } = useApp();
  const count = cartCount(cart.items);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => (
          <Icon name={focused ? TAB_ICONS[route.name] : `${TAB_ICONS[route.name]}-outline`} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'CampusGo' , tabBarLabel: 'Stores' }} />
      <Tab.Screen name="Print" component={PrintScreen} options={{ title: 'Printing Service', tabBarLabel: 'Print' }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'My Cart', tabBarBadge: count > 0 ? count : undefined }}
      />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { loading, user } = useApp();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={headerStyle}>
      {user ? (
        <>
          <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="StoreMenu" component={StoreMenuScreen} options={({ route }) => ({ title: route.params.storeName })} />
          <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product' }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
          <Stack.Screen name="Tracking" component={TrackingScreen} options={{ title: 'Order Tracking' }} />
          <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Campus Wallet' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Create account' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/core/store';
import { colors } from './src/core/theme';

import WelcomeScreen from './src/modules/welcome/WelcomeScreen';
import TableScreen from './src/modules/tables/TableScreen';
import ScannerScreen from './src/modules/tables/ScannerScreen';
import LoginScreen from './src/modules/auth/LoginScreen';
import MenuScreen from './src/modules/menu/MenuScreen';
import CartScreen from './src/modules/cart/CartScreen';
import OrderStatusScreen from './src/modules/order/OrderStatusScreen';
import InvoiceScreen from './src/modules/order/InvoiceScreen';
import PaymentScreen from './src/modules/payment/PaymentScreen';
import AdminScreen from './src/modules/admin/AdminScreen';
import AdminManualOrderScreen from './src/modules/admin/AdminManualOrderScreen';
import AdminMenuScreen from './src/modules/admin/AdminMenuScreen';
import AdminInventoryScreen from './src/modules/admin/AdminInventoryScreen';
import AdminStaffScreen from './src/modules/admin/AdminStaffScreen';
import AdminClubScreen from './src/modules/admin/AdminClubScreen';
import AdminReportScreen from './src/modules/admin/AdminReportScreen';
import AdminSurveysScreen from './src/modules/admin/AdminSurveysScreen';
import AdminBackupScreen from './src/modules/admin/AdminBackupScreen';
import KitchenScreen from './src/modules/kitchen/KitchenScreen';
import PlansScreen from './src/modules/plans/PlansScreen';
import SpinScreen from './src/modules/loyalty/SpinScreen';
import ProfileScreen from './src/modules/loyalty/ProfileScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Tables: undefined;
  Scan: undefined;
  Login: undefined;
  Menu: undefined;
  Cart: undefined;
  OrderStatus: { orderId: number };
  Invoice: { orderId: number };
  Payment: { orderId: number };
  Admin: undefined;
  AdminManualOrder: undefined;
  AdminMenu: undefined;
  AdminInventory: undefined;
  AdminStaff: undefined;
  AdminClub: undefined;
  AdminReport: undefined;
  AdminSurveys: undefined;
  AdminBackup: undefined;
  Kitchen: undefined;
  Plans: undefined;
  Spin: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.green },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            headerBackTitle: 'بازگشت',
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Tables" component={TableScreen} options={{ title: 'انتخاب میز' }} />
          <Stack.Screen name="Scan" component={ScannerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'ورود / ثبت‌نام' }} />
          <Stack.Screen name="Menu" component={MenuScreen} options={{ title: 'منوی کافه' }} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'سبد خرید' }} />
          <Stack.Screen name="OrderStatus" component={OrderStatusScreen} options={{ title: 'وضعیت سفارش', headerBackVisible: false }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'پرداخت' }} />
          <Stack.Screen name="Invoice" component={InvoiceScreen} options={{ title: 'فاکتور' }} />
          <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'پنل مدیریت' }} />
          <Stack.Screen name="AdminManualOrder" component={AdminManualOrderScreen} options={{ title: 'سفارش دستی' }} />
          <Stack.Screen name="AdminMenu" component={AdminMenuScreen} options={{ title: 'مدیریت منو' }} />
          <Stack.Screen name="AdminInventory" component={AdminInventoryScreen} options={{ title: 'انبارداری' }} />
          <Stack.Screen name="AdminStaff" component={AdminStaffScreen} options={{ title: 'مدیریت پرسنل' }} />
          <Stack.Screen name="AdminClub" component={AdminClubScreen} options={{ title: 'باشگاه مشتریان + پیامک' }} />
          <Stack.Screen name="AdminReport" component={AdminReportScreen} options={{ title: 'گزارش‌ها' }} />
          <Stack.Screen name="AdminSurveys" component={AdminSurveysScreen} options={{ title: 'نظرسنجی‌ها' }} />
          <Stack.Screen name="AdminBackup" component={AdminBackupScreen} options={{ title: 'پشتیبان‌گیری' }} />
          <Stack.Screen name="Kitchen" component={KitchenScreen} options={{ title: 'نمایشگر آشپزخانه' }} />
          <Stack.Screen name="Plans" component={PlansScreen} options={{ title: 'پلن‌ها و تعرفه‌ها' }} />
          <Stack.Screen name="Spin" component={SpinScreen} options={{ title: 'چرخ شانس' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'پروفایل' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}

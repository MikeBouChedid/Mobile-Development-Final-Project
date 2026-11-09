import { Alert, Platform } from 'react-native';

// Alert.alert has no buttons on the web preview, so we fall back to the
// browser dialogs there. On a phone (Expo Go) the native Alert is used.

export function showMessage(title, message = '') {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

export function confirmAction(title, message, onConfirm, confirmText = 'OK') {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}

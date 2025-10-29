import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const PIN_KEY = 'user_pin';

// Guardar PIN de manera segura
export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

// Verificar si existe un PIN configurado
export async function hasPin(): Promise<boolean> {
  const pin = await SecureStore.getItemAsync(PIN_KEY);
  return pin !== null;
}

// Verificar PIN
export async function verifyPin(inputPin: string): Promise<boolean> {
  const storedPin = await SecureStore.getItemAsync(PIN_KEY);
  return storedPin === inputPin;
}

// Eliminar PIN
export async function deletePin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

// Verificar si el dispositivo soporta biometría
export async function hasBiometricHardware(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

// Autenticar con biometría
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autenticar para acceder',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (error) {
    console.error('Error en autenticación biométrica:', error);
    return false;
  }
}

import * as SecureStore from 'expo-secure-store';

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

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { hasPin, verifyPin, savePin } from '../security';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [pin, setPin] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'input' | 'confirm'>('input');

  useEffect(() => {
    checkSetup();
  }, []);

  async function checkSetup() {
    const pinExists = await hasPin();
    setIsSettingUp(!pinExists);
  }

  async function handleSubmit() {
    if (isSettingUp) {
      // Configurando nuevo PIN
      if (step === 'input') {
        if (pin.length < 4) {
          Alert.alert('Error', 'El PIN debe tener al menos 4 dígitos');
          return;
        }
        setStep('confirm');
      } else {
        // Confirmar PIN
        if (pin !== confirmPin) {
          Alert.alert('Error', 'Los PINs no coinciden');
          setPin('');
          setConfirmPin('');
          setStep('input');
          return;
        }
        await savePin(pin);
        Alert.alert('Éxito', 'PIN configurado correctamente');
        onAuthenticated();
      }
    } else {
      // Verificando PIN existente
      const isValid = await verifyPin(pin);
      if (isValid) {
        onAuthenticated();
      } else {
        Alert.alert('Error', 'PIN incorrecto');
        setPin('');
      }
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>
          {isSettingUp ? 'Configura tu PIN' : 'Ingresa tu PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {isSettingUp 
            ? step === 'input' 
              ? 'Protege tus datos con un PIN de seguridad'
              : 'Confirma tu PIN'
            : 'Necesitas autenticarte para acceder'}
        </Text>

        <TextInput
          style={styles.input}
          value={step === 'input' ? pin : confirmPin}
          onChangeText={step === 'input' ? setPin : setConfirmPin}
          placeholder={step === 'input' ? 'Ingresa PIN (min 4 dígitos)' : 'Confirma tu PIN'}
          secureTextEntry
          keyboardType='numeric'
          maxLength={6}
          autoFocus
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>
            {isSettingUp 
              ? step === 'input' ? 'Continuar' : 'Confirmar'
              : 'Ingresar'}
          </Text>
        </TouchableOpacity>

        {isSettingUp && (
          <Text style={styles.infoText}>
            💡 Tu PIN se guardará de forma segura en tu dispositivo
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#4c9',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '700',
  },
  button: {
    width: '100%',
    backgroundColor: '#4c9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});

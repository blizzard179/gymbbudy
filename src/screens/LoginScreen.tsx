import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (message.includes('already registered') || message.includes('already been registered')) return 'Cet email est déjà utilisé.';
  if (message.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (message.includes('invalid format') || message.includes('valid email')) return 'Adresse email invalide.';
  if (message.includes('Email not confirmed')) return 'Confirme ton email avant de te connecter.';
  return 'Une erreur est survenue. Réessaie.';
}

interface Props {
  onGoToRegister: () => void;
}

export function LoginScreen({ onGoToRegister }: Props) {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Remplis tous les champs.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(translateError(e?.message ?? ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / titre */}
          <View style={styles.header}>
            <Text style={styles.logo}>GymBuddy</Text>
            <Text style={styles.tagline}>Connecte-toi pour accéder à tes séances</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={v => { setEmail(v); setError(null); }}
                placeholder="ton@email.com"
                placeholderTextColor="#444"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={v => { setPassword(v); setError(null); }}
                placeholder="••••••••"
                placeholderTextColor="#444"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSignIn}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.btnText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Lien inscription */}
          <TouchableOpacity onPress={onGoToRegister} activeOpacity={0.7} style={styles.switchRow}>
            <Text style={styles.switchText}>Pas encore de compte ? </Text>
            <Text style={styles.switchLink}>S'inscrire</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    color: '#f5c842',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 10,
  },
  tagline: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
  },

  form: {
    gap: 16,
    marginBottom: 32,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },

  error: {
    color: '#e05c5c',
    fontSize: 13,
    textAlign: 'center',
    marginTop: -4,
  },

  btn: {
    backgroundColor: '#f5c842',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    color: '#555',
    fontSize: 14,
  },
  switchLink: {
    color: '#f5c842',
    fontSize: 14,
    fontWeight: '700',
  },
});

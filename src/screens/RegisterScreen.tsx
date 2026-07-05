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
  if (message.includes('already registered') || message.includes('already been registered')) return 'Cet email est déjà utilisé.';
  if (message.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (message.includes('invalid format') || message.includes('valid email')) return 'Adresse email invalide.';
  return 'Une erreur est survenue. Réessaie.';
}

interface Props {
  onGoToLogin: () => void;
}

export function RegisterScreen({ onGoToLogin }: Props) {
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirm) {
      setError('Remplis tous les champs.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password);
      setSuccess(true);
    } catch (e: any) {
      setError(translateError(e?.message ?? ''));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#111" />
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Compte créé !</Text>
          <Text style={styles.successText}>
            Tu peux maintenant te connecter avec ton email et mot de passe.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={onGoToLogin} activeOpacity={0.8}>
            <Text style={styles.btnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Titre */}
          <View style={styles.header}>
            <Text style={styles.logo}>GymBuddy</Text>
            <Text style={styles.tagline}>Crée ton compte pour sauvegarder tes séances</Text>
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
                placeholder="6 caractères minimum"
                placeholderTextColor="#444"
                secureTextEntry
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <TextInput
                style={[styles.input, confirm && password !== confirm && styles.inputError]}
                value={confirm}
                onChangeText={v => { setConfirm(v); setError(null); }}
                placeholder="••••••••"
                placeholderTextColor="#444"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSignUp}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.btnText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Lien connexion */}
          <TouchableOpacity onPress={onGoToLogin} activeOpacity={0.7} style={styles.switchRow}>
            <Text style={styles.switchText}>Déjà un compte ? </Text>
            <Text style={styles.switchLink}>Se connecter</Text>
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
  inputError: {
    borderColor: '#e05c5c',
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

  // Success state
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  successIcon: {
    fontSize: 52,
    color: '#f5c842',
    fontWeight: '800',
    marginBottom: 8,
  },
  successTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  successText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
});

import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';

export default function CreateAccount({ onAccountCreated, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bikeNickname, setBikeNickname] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleStartRide = async () => {
    if (!email || !password || !bikeNickname) {
      Alert.alert('Missing details', 'Please fill in all fields to register your e-bike!');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { nickname: bikeNickname.trim() } },
    });
    setBusy(false);

    if (error) {
      Alert.alert('Could not create account', error.message);
      return;
    }

    if (data.session) {
      onAccountCreated(data.user);
    } else {
      Alert.alert('Check your e-mail', 'We sent you a link to confirm your account. Then log in.');
      onBackToLogin();
    }
  };

  return (
    <ImageBackground
      source={require('../assets/background.jpg.jpeg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Register Your Ride</Text>
        <Text style={styles.subtitle}>Let's connect to your bike!</Text>

        <TextInput
          style={styles.inputField}
          placeholder="E-mail Address"
          placeholderTextColor="gray"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.inputField}
          placeholder="Create Password (6+ characters)"
          placeholderTextColor="gray"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
        <Text style={styles.showPasswordText}>{showPassword ? 'Hide password' : 'Show password'}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>PERSONALISE YOUR VEHICLE</Text>

        <TextInput
          style={styles.inputField}
          placeholder="Give a nickname for your bike"
          placeholderTextColor="gray"
          value={bikeNickname}
          onChangeText={setBikeNickname}
        />

        <TouchableOpacity style={styles.button} onPress={handleStartRide} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Start the Ride</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onBackToLogin}>
          <Text style={styles.backText}>Already registered? Log in</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  sectionLabel: {
    color: 'orange',
    fontWeight: 'bold',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginLeft: '8%',
    marginBottom: 8,
    letterSpacing: 1,
  },
  divider: {
    width: '85%',
    height: 1,
    backgroundColor: 'white',
    marginVertical: 20,
  },
  inputField: {
    width: '85%',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: 'white',
    color: 'black',
  },
  button: {
    backgroundColor: 'orange',
    paddingVertical: 14,
    borderRadius: 25,
    width: '85%',
    alignItems: 'center',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 10,
    marginTop: 15,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  showPasswordText: {
color: 'black',
  fontWeight: 'bold',
  fontSize: 18,
  },
});
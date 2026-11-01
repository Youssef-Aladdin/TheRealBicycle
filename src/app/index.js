import CreateAccount from '@/components/CreateAccount';
import Dashboard from '@/components/Dashboard';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';

export default function Page() {

  const [currentScreen, setCurrentScreen] = useState('loading');
  const [profile, setProfile] = useState(null); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loadProfile = async (user) => {
    const { data } = await supabase
      .from('profiles')
      .select('nickname, phone, use_miles')
      .eq('id', user.id)
      .maybeSingle();

    setProfile({
      id: user.id,
      email: user.email,
      nickname: data?.nickname || 'TheRealBicycle',
      phone: data?.phone || '',
      useMiles: data?.use_miles || false,
    });
    setCurrentScreen('dashboard');
  };


  useEffect(() => {

    const giveUp = setTimeout(() => {
      setCurrentScreen((screen) => (screen === 'loading' ? 'login' : screen));
    }, 6000);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) return loadProfile(data.session.user);
        setCurrentScreen('login');
      })
      .catch(() => setCurrentScreen('login'))
      .finally(() => clearTimeout(giveUp));
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Enter your e-mail and password.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);

    if (error) {
      Alert.alert('Login failed', error.message);
      return;
    }
    await loadProfile(data.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setPassword('');
    setCurrentScreen('login');
  };

  if (currentScreen === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="orange" />
      </View>
    );
  }

  if (currentScreen === 'dashboard') {
    return (
      <Dashboard
        userId={profile?.id}
        customNickname={profile?.nickname}
        email={profile?.email}
        savedPhone={profile?.phone}
        savedUseMiles={profile?.useMiles}
        onLogout={handleLogout}
      />
    );
  }

  if (currentScreen === 'register') {
    return (
      <CreateAccount
        onAccountCreated={loadProfile}
        onBackToLogin={() => setCurrentScreen('login')}
      />
    );
  }

  return (
    <ImageBackground
      source={require('../assets/background.jpg.jpeg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.text}>Welcome to TheRealBicycle!</Text>


        <TextInput
          style={styles.inputField}
          placeholder="E-mail"
          placeholderTextColor="gray"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.inputField}
          placeholder="Password"
          placeholderTextColor="gray"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
  <Text style={styles.showPasswordText}>{showPassword ? 'Hide password' : 'Show password'}</Text>
</TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Log in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setCurrentScreen('register')}>
          <Text style={styles.text2}>Create Account?</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  text: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 205,
    marginTop: 200,
  },
  text2: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    paddingBottom: 10,
  },
  button: {
    backgroundColor: 'orange',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    width: '85%',
    alignItems: 'center',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 30,
    marginTop: 10,
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  inputField: {
    width: '85%',
    height: 50,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: 'white',
    color: 'black',
  },
  showPasswordText: {
  color: 'orange',
  fontWeight: 'bold',
  fontSize: 18,
  },
});
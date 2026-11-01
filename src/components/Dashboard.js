import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';

function Screen({ children }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export default function Dashboard({ userId, customNickname, email, savedPhone, savedUseMiles, onLogout,}) 
{
  const [subView, setSubView] = useState('home');
  const [bikeName, setBikeName] = useState(customNickname || 'TheRealBicycle');
  const [emailValue, setEmailValue] = useState(email || '');
  const [phoneNumber, setPhoneNumber] = useState(savedPhone || '');
  const [photoUri, setPhotoUri] = useState(null);
  const [useMiles, setUseMiles] = useState(savedUseMiles || false);
  const [saving, setSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null); 
  const connected = connectedDevice !== null;
  const [bikeData, setBikeData] = useState(null);
  const simRef = useRef({ speed: 0, target: 25, battery: 92, lat: 30.0444, lng: 31.2357 });
  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and your saved profile. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('delete_my_account');
            if (error) {
              Alert.alert('Could not delete account', error.message);
              return;
            }
            onLogout();
          },
        },
      ]
    );
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        nickname: bikeName.trim(),
        phone: phoneNumber.trim(),
        use_miles: useMiles,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    setSaving(false);

    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    setSubView('home');
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const startBluetoothScan = () => {
    setIsScanning(true);
    setDiscoveredDevices([]);

    setTimeout(() => {
      setIsScanning(false);
      setDiscoveredDevices([
        { id: '1', name: '🚲 TheRealBicycle_BLE_v1', rssi: '-56 dBm' },
        { id: '2', name: '🎧 Wireless Audio Pro', rssi: '-82 dBm' },
      ]);
    }, 2500);
  };

  const connectToDevice = (device) => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setConnectedDevice(device.name);
      setSubView('home');
    }, 1500);
  };

  const disconnectBike = () => {
    setConnectedDevice(null);
    setDiscoveredDevices([]);
  };


  useEffect(() => {
    let interval;
    if (connected) {
      const fetchTelemetry = () => {
        const sim = simRef.current;
        if (Math.random() < 0.25) sim.target = 10 + Math.random() * 30; 
        sim.speed += (sim.target - sim.speed) * 0.3; 
        sim.battery = Math.max(0, sim.battery - 0.05); 
        const step = sim.speed * 0.000005; 
        sim.lat += step;
        sim.lng += step;
        const nextLat = sim.lat;
        const nextLng = sim.lng;

        setBikeData({
          speed_kmh: Math.round(sim.speed * 10) / 10,
          battery: Math.round(sim.battery),
          location: { latitude: nextLat, longitude: nextLng },
        });

      };

      fetchTelemetry();
      interval = setInterval(fetchTelemetry, 2000);
    } else {
      setBikeData(null);
    }

    return () => clearInterval(interval);
  }, [connected]);


  if (subView === 'bluetooth') {
    return (
      <Screen>
        <Text style={styles.title}>Bluetooth</Text>
        <Text style={styles.subtitle}>Connect to your bike</Text>

        {connected ? (
          <View style={styles.connectedBox}>
            <Text style={styles.connectedText}>Connected to</Text>
            <Text style={styles.connectedName}>{connectedDevice}</Text>
            <TouchableOpacity style={styles.disconnectButton} onPress={disconnectBike}>
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={startBluetoothScan}
              disabled={isScanning || isConnecting}
            >
              <Text style={styles.buttonText}>
                {isScanning ? 'Scanning...' : 'Scan for nearby bikes'}
              </Text>
            </TouchableOpacity>

            {isScanning && (
              <View style={styles.scanLoaderBox}>
                <ActivityIndicator size="small" color="orange" />
                <Text style={styles.waitingText}>Searching for Bluetooth devices...</Text>
              </View>
            )}

            {isConnecting && (
              <View style={styles.scanLoaderBox}>
                <ActivityIndicator size="small" color="orange" />
                <Text style={styles.waitingText}>Connecting...</Text>
              </View>
            )}

            {!isScanning && !isConnecting && discoveredDevices.length === 0 && (
              <Text style={styles.waitingText}>
                Waiting for a connection.{'\n'}Tap scan to look for your bike.
              </Text>
            )}

            <View style={{ width: '100%', marginTop: 20 }}>
              {discoveredDevices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={styles.deviceCard}
                  onPress={() => connectToDevice(device)}
                  disabled={isConnecting}
                >
                  <Text style={styles.deviceNameText}>{device.name}</Text>
                  <Text style={styles.deviceSubText}>Signal strength: {device.rssi}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => setSubView('home')}>
          <Text style={styles.backButtonText}>⬅ Back to dashboard</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  if (subView === 'profile') {
    return (
      <Screen>
        <Text style={styles.title}>Profile</Text>

        <TouchableOpacity style={styles.avatarWrapper} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarLabel}>🚲</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={pickPhoto}>
          <Text style={styles.changePhotoText}>
            {photoUri ? 'Change photo' : 'Add a photo or logo'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Bike nickname</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Bike nickname"
          placeholderTextColor="gray"
          value={bikeName}
          onChangeText={setBikeName}
        />

        <Text style={styles.sectionLabel}>Email (your login)</Text>
        <TextInput
          style={[styles.inputField, styles.inputReadOnly]}
          placeholder="Email address"
          placeholderTextColor="gray"
          keyboardType="email-address"
          autoCapitalize="none"
          value={emailValue}
          editable={false}
        />

        <Text style={styles.sectionLabel}>Mobile number</Text>
        <TextInput
          style={styles.inputField}
          placeholder="Add mobile number"
          placeholderTextColor="gray"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <Text style={styles.sectionLabel}>Speed unit</Text>
        <View style={styles.unitRow}>
          <TouchableOpacity
            style={[styles.unitButton, !useMiles && styles.unitButtonActive]}
            onPress={() => setUseMiles(false)}
          >
            <Text style={styles.buttonText}>km/h</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, useMiles && styles.unitButtonActive]}
            onPress={() => setUseMiles(true)}
          >
            <Text style={styles.buttonText}>mph</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveProfileButton} onPress={saveProfile} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Save changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => setSubView('home')}>
          <Text style={styles.backButtonText}>⬅ Back to dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={confirmDeleteAccount}>
          <Text style={styles.deleteAccountText}>Delete my account</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{bikeName}</Text>
        <TouchableOpacity style={styles.profileToggleIcon} onPress={() => setSubView('profile')}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.headerAvatar} />
          ) : (
            <Text style={{ fontSize: 20 }}>⚙</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.statusBadge, { backgroundColor: connected ? 'mediumseagreen' : 'tomato' }]}
        onPress={() => setSubView('bluetooth')}
      >
        <Text style={styles.statusText}>
          {connected ? 'Live with bike' : ' Not connected: tap to pair'}
        </Text>
      </TouchableOpacity>

      {connected && bikeData ? (
        <View style={styles.dataContainer}>
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeOuterRing}>
              <Text style={styles.speedValue}>
                {(useMiles ? bikeData.speed_kmh * 0.621371 : bikeData.speed_kmh).toFixed(1)}
              </Text>
              <Text style={styles.unitText}>{useMiles ? 'mph' : 'km/h'}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { width: '100%' }]}>
              <Text style={styles.statLabel}> Battery</Text>
              <Text style={styles.statValue}>{bikeData.battery}%</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${bikeData.battery}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.mapWrapper}>
            <Text style={styles.mapLabel}> Live GPS position</Text>
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderIcon}></Text>
              <Text style={styles.mapPlaceholderTitle}>Map coming soon...</Text>
              <Text style={styles.mapPlaceholderText}>
                Live bike tracking arrives with the 4G and GPS update.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.disconnectButton} onPress={disconnectBike}>
            <Text style={styles.buttonText}>Disconnect your bike</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.waitingBox}>
          <ActivityIndicator size="large" color="orange" />
          <Text style={styles.waitingText}>
            Waiting for your bike.{'\n'}Tap the red badge above to connect over Bluetooth.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Log out</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  container: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: 'white' 
  },
  subtitle: { 
    fontSize: 13, 
    color: 'gray', 
    marginBottom: 20 
  },
  profileToggleIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'orange',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'black',
    overflow: 'hidden',
  },
  headerAvatar: { 
    width: 44, 
    height: 44 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  scanButton: {
    backgroundColor: 'orange',
    paddingVertical: 14,
    borderRadius: 25,
    width: '85%',
    alignItems: 'center',
    marginTop: 10,
  },
  saveProfileButton: {
    backgroundColor: 'orange',
    paddingVertical: 14,
    borderRadius: 25,
    width: '85%',
    alignItems: 'center',
    marginTop: 20,
  },
  disconnectButton: {
    backgroundColor: 'dimgrey',
    paddingVertical: 12,
    borderRadius: 25,
    width: '85%',
    alignItems: 'center',
    marginTop: 20,
  },
  backButton: { 
    marginTop: 20, 
    padding: 10 
  },
  backButtonText: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  logoutButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'tomato',
  },
  logoutButtonText: { 
    color: 'tomato', 
    fontSize: 15, 
    fontWeight: '600' 
  },
  scanLoaderBox: { 
    alignItems: 'center', 
    marginTop: 20 
  },
  deviceCard: {
    backgroundColor: 'black',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'black',
    padding: 16,
    marginBottom: 10,
  },
  deviceNameText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  deviceSubText: { 
    color: 'gray', 
    fontSize: 12, 
    marginTop: 4 
  },
  connectedBox: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'mediumseagreen',
    padding: 24,
    marginTop: 10,
  },
  connectedText: { 
    color: 'mediumseagreen', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  connectedName: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 6 
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'black',
    borderWidth: 2,
    borderColor: 'orange',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 20,
  },
  avatarImage: { 
    width: 110, 
    height: 110 
  },
  avatarLabel: { 
    fontSize: 44 
  },
  changePhotoText: { 
    color: 'orange', 
    fontSize: 14, 
    fontWeight: '600', 
    marginTop: 10, 
    marginBottom: 10 
  },
  sectionLabel: {
    color: 'orange',
    fontSize: 13,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: '8%',
    marginTop: 12,
    marginBottom: 6,
  },
  inputField: {
    width: '85%',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'white',
    color: 'black',
  },
  inputReadOnly: { 
    backgroundColor: 'black', 
    color: 'darkgray' 
  },
  unitRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '85%' 
  },
  unitButton: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'black',
    borderWidth: 1,
    borderColor: 'darkgray',
  },
  unitButtonActive: { 
    backgroundColor: 'orange', 
    borderColor: 'orange' 
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: { 
    color: 'white', 
    fontSize: 13, 
    fontWeight: 'bold' 
  },
  dataContainer: { 
    width: '100%', 
    alignItems: 'center' 
  },
  gaugeContainer: { 
    alignItems: 'center', 
    marginVertical: 10 
  },
  gaugeOuterRing: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 6,
    borderColor: 'saddlebrown',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedValue: { 
    fontSize: 52, 
    fontWeight: 'bold', 
    color: 'orange' 
  },
  unitText: { 
    fontSize: 16, 
    color: 'silver', 
    marginTop: 2 
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'black',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'dimgray',
    padding: 14,
  },
  statLabel: { 
    color: 'gray', 
    fontSize: 13, 
    marginBottom: 8 
  },
  statValue: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'white',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: { 
    height: 6, 
    backgroundColor: 'mediumseagreen', 
    borderRadius: 3 
  },
  mapWrapper: {
    width: '100%',
    backgroundColor: 'gray',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'dimgray',
    padding: 10,
    marginTop: 20,
    overflow: 'hidden',
  },
  mapLabel: { 
    color: 'black', 
    fontSize: 13, 
    marginBottom: 8, 
    marginLeft: 4 
  },
  mapPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: 'black',
    borderWidth: 1,
    borderColor: 'dimgray',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  mapPlaceholderIcon: { fontSize: 36 },
  mapPlaceholderTitle: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginTop: 8 
  },
  mapPlaceholderText: { 
    color: 'gray', 
    fontSize: 12, 
    textAlign: 'center', 
    marginTop: 6 
  },
  waitingBox: { 
    alignItems: 'center', 
    marginTop: 50 
  },
  waitingText: { 
    color: 'gray', 
    fontSize: 14, 
    textAlign: 'center', 
    marginTop: 14, 
    lineHeight: 20 
  },
  deleteAccountText: {
    color: 'tomato',
    fontSize: 14,
    marginTop: 24,
    textDecorationLine: 'underline',
  },
});
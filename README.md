# TheRealBicycle

This is the phone app for my electric bicycle project. The bike is a 48V prototype that should reach about 45 km/h. The app is where you log in, connect to the bike over Bluetooth, and watch your speed and battery.

I'm building it as a portfolio project and to learn React Native, so I want to be upfront about one thing: the bike isn't connected yet. The Bluetooth scan, the speed and the battery are all pretend for now. The accounts and the profile saving are real.

## Screenshots

| Login | Bluetooth pairing | Dashboard | Profile |
|---|---|---|---|
| ![Login](docs/screenshots/login.jpeg) | ![Pairing](docs/screenshots/pairing.jpeg) | ![Pairing](docs/screenshots/pairing2.jpeg) | ![Pairing](docs/screenshots/pairing3.jpeg) | ![Dashboard](docs/screenshots/dashboard.jpeg) | ![Profile](docs/screenshots/profile.jpeg) |

## What works and what doesn't yet

Works for real:

- Sign up, log in and log out. The app keeps you logged in after you close it.
- The nickname you give your bike is saved with your account.
- A profile page where you can change the nickname, add a phone number, pick km/h or mph and choose a photo. The photo only stays on your phone for now.
- Deleting your account from inside the app.

Demo for now:

- The Bluetooth scan and connection. It finds a pretend bike called TheRealBicycle_BLE_v1.
- Speed and battery. They're made-up numbers that move smoothly so the dashboard looks alive.
- The map. It just says "coming soon".

## The idea

When you're next to the bike, the app talks to it over Bluetooth. When you're far away, it would go through the internet instead, with a 4G and GPS module on the bike.

```
phone app --- Bluetooth (close by) -------------> bike
phone app --- internet --- server --- 4G + GPS --> bike (far away)
```

The long term dream is that I'm at university, my bike is at home, and I press a button and it comes to me. That's a long way off. Bluetooth only reaches tens of meters, so anything far away will need the bike to have its own internet connection.

## How it's built

React Native with Expo, and Expo Router for the screens. Supabase handles the accounts and the database. There's a profiles table where each person can only see their own row, a trigger that creates your profile when you sign up, and a function that deletes your account. AsyncStorage keeps you logged in, and expo-image-picker handles the photo.

## Run it yourself

1. Install the packages:
   ```
   npm install
   ```
2. Make a free project on supabase.com. In its SQL editor, run `profiles.sql` and then `delete_account.sql` from the `supabase` folder.
3. Create a file called `.env` in the main folder with your own project details:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-project-url
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```
   Don't upload this file anywhere, and never put the secret key in the app.
4. Start it and scan the QR code with Expo Go:
   ```
   npx expo start
   ```
   If Expo Go says the SDK version doesn't match, install the Expo Go version that matches this project.

## What I want to do next

- Connect over real Bluetooth. That needs a development build instead of Expo Go.
- Add the 4G and GPS part and a live map.
- Save the profile photo online.
- Put it on Google Play.

Made by Youssef Alaa.
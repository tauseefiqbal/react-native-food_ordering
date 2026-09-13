# Fast Food Ordering App

A React Native food-ordering application built with Expo, NativeWind, Zustand, and Appwrite.

## Table of Contents

- [Features](#features)
  - [Authentication](#authentication)
  - [Food Discovery](#food-discovery)
  - [Cart](#cart)
  - [Monitoring](#monitoring)
- [Tech Stack](#tech-stack)
- [Deployment](#deployment)
  - [App Live URL](#app-live-url)
  - [Local Development](#local-development)
  - [Database Seeding](#database-seeding)
- [Test And Admin Users Credentials](#test-and-admin-users-credentials)
  - [Test User](#test-user)
  - [Admin User](#admin-user)
- [How To Use App For Regular User](#how-to-use-app-for-regular-user)
- [How To Use App For Admin User](#how-to-use-app-for-admin-user)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Validation](#validation)
- [Pending Work](#pending-work)

## Features

### Authentication

- ✅ Create a user account with name, email, and password.
- ✅ Sign in and sign out using Appwrite Account.
- ✅ Automatically create or recover a user profile document.
- ✅ Persist authenticated session state with Zustand.

### Food Discovery

- ✅ Browse menu items in a two-column layout.
- ✅ Filter menu items by category.
- ✅ Search menu items by name.
- ✅ Display food images, prices, ratings, calories, and protein data.
- ✅ Display available categories and customizations from Appwrite.

### Cart

- ✅ Add menu items to the cart.
- ✅ Keep separate cart entries for different customization combinations.
- ✅ Increase, decrease, and remove cart items.
- ✅ Calculate item totals and customization prices.
- ✅ Display subtotal, delivery fee, discount, and total summary.

### Monitoring

- ✅ Capture application errors with Sentry.
- ✅ Show loading and empty states during authentication and menu requests.

## Tech Stack

- **Mobile framework:** React Native 0.86 with Expo SDK 57
- **Routing:** Expo Router
- **Language:** TypeScript
- **Styling:** NativeWind and Tailwind CSS
- **State management:** Zustand
- **Backend:** Appwrite Account, Databases, and Storage
- **Error monitoring:** Sentry React Native
- **Package manager:** npm

## Deployment

### App Live URL

**Live app URL:** [APP URL](APP URL)

Replace `APP URL` with the deployed web or store URL when available.

### Local Development

Install dependencies and start Expo:

```powershell
npm install
npm start
```

Useful platform commands:

```powershell
npm run android
npm run ios
npm run web
```

### Database Seeding

The test data is defined in [`lib/data.ts`](lib/data.ts) and loaded by [`scripts/seed.mjs`](scripts/seed.mjs).

Run the seeder from the project root:

```powershell
node --experimental-strip-types scripts/seed.mjs
```

The seeder clears existing menu-related test data before inserting the categories, customizations, menu items, and menu-customization links. Use it only with a development database.

## Test And Admin Users Credentials

Do not commit real passwords or private credentials to this repository. Store test credentials in a secure password manager or deployment secret store.

### Test User

- **Email:** `TEST_USER_EMAIL`
- **Password:** `TEST_USER_PASSWORD`

### Admin User

- **Email:** `ADMIN_USER_EMAIL`
- **Password:** `ADMIN_USER_PASSWORD`

The repository currently contains regular-user authentication. An admin role, admin account, and admin-only workflow still need to be configured in Appwrite and implemented in the application.

## How To Use App For Regular User

1. Launch the application.
2. Select **Sign Up** and create an account, or select **Sign In** with an existing account.
3. Browse available food offers from the home screen.
4. Open the search tab to search by menu item name.
5. Select a category filter to narrow the menu.
6. Select **Add to Cart** for a menu item.
7. Open the cart tab to review items and totals.
8. Use the plus and minus controls to update quantities.
9. Select **Order Now** when ordering functionality is connected.
10. Open the profile tab to review the signed-in account and sign out.

## How To Use App For Admin User

Admin functionality is not currently implemented in the mobile application.

When an admin workflow is added, it should allow authorized administrators to:

1. Sign in with an Appwrite account assigned an admin role.
2. Manage categories, customizations, and menu records.
3. Upload and manage menu images in Appwrite Storage.
4. Review and manage orders.
5. Update menu availability and pricing.

Admin permissions should be enforced by Appwrite permissions or server-side functions, not only by hiding screens in the client.

## Environment Configuration

Create a local `.env` file with the Appwrite values used by the application and seeder:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
EXPO_PUBLIC_APPWRITE_PLATFORM=com.ti.foodordering
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
EXPO_PUBLIC_APPWRITE_BUCKET_ID=your-bucket-id
EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID=your-user-collection-id
EXPO_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID=your-categories-collection-id
EXPO_PUBLIC_APPWRITE_MENU_COLLECTION_ID=your-menu-collection-id
EXPO_PUBLIC_APPWRITE_CUSTOMIZATIONS_COLLECTION_ID=your-customizations-collection-id
EXPO_PUBLIC_APPWRITE_MENU_CUSTOMIZATIONS_COLLECTION_ID=your-menu-customizations-collection-id
```

Do not commit `.env` files or Appwrite secrets.

## Project Structure

```text
app/          Expo Router screens and layouts
components/   Reusable React Native components
constants/    Images and application constants
lib/          Appwrite client, hooks, seed data, and seed logic
scripts/      Node-based database seeding script
store/        Zustand authentication and cart stores
assets/       Fonts, icons, and images
```

## Validation

Run the project checks before submitting changes:

```powershell
npx tsc --noEmit
npm run lint
npx expo-doctor
```

## Pending Work

- Connect the **Order Now** button to an order workflow.
- Implement admin authentication and role-based access control.
- Add order history and order status tracking.
- Add payment processing when the payment provider is selected.
- Add automated unit and end-to-end tests.
- Replace the `APP URL` placeholder with the deployed application URL.
- Document the final test and admin account process without committing passwords.

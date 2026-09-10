import fs from 'node:fs';
import path from 'node:path';
import dummyData from '../lib/data.ts';

// 1. Load environment configuration from .env
const envPath = path.resolve('.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at project root');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [k, ...v] = trimmed.split('=');
  env[k.trim()] = v.join('=').trim();
}

const endpoint = env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const project = env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const platform = env.EXPO_PUBLIC_APPWRITE_PLATFORM || 'com.ti.foodordering';
const databaseId = env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const bucketId = env.EXPO_PUBLIC_APPWRITE_BUCKET_ID;

const categoriesCol = env.EXPO_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID;
const menuCol = env.EXPO_PUBLIC_APPWRITE_MENU_COLLECTION_ID;
const customizationsCol = env.EXPO_PUBLIC_APPWRITE_CUSTOMIZATIONS_COLLECTION_ID;
const menuCustomizationsCol = env.EXPO_PUBLIC_APPWRITE_MENU_CUSTOMIZATIONS_COLLECTION_ID;

const headers = {
  'X-Appwrite-Project': project,
  'X-Appwrite-Platform': platform,
  'Content-Type': 'application/json',
};

async function apiRequest(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  const contentType = res.headers.get('content-type') || '';
  let body = null;
  if (contentType.includes('application/json')) {
    body = await res.json();
  }

  if (!res.ok) {
    const errorMsg = body?.message || res.statusText;
    throw new Error(`[${res.status}] ${errorMsg}`);
  }

  return body;
}

async function clearCollection(colId, name) {
  if (!colId) return;
  try {
    const res = await apiRequest(
      `${endpoint}/databases/${databaseId}/collections/${colId}/documents?queries[]={"method":"limit","values":[100]}`
    );
    if (res?.documents?.length > 0) {
      process.stdout.write(`  Clearing ${res.documents.length} old documents from ${name}... `);
      for (const doc of res.documents) {
        await apiRequest(
          `${endpoint}/databases/${databaseId}/collections/${colId}/documents/${doc.$id}`,
          { method: 'DELETE' }
        );
      }
      console.log('done.');
    }
  } catch (err) {
    console.warn(`  ⚠️ Skip clear for ${name}: ${err.message}`);
  }
}

async function uploadImage(imageUrl) {
  if (!bucketId) return imageUrl;
  try {
    const fetchRes = await fetch(imageUrl);
    if (!fetchRes.ok) return imageUrl;
    const blob = await fetchRes.blob();

    const formData = new FormData();
    formData.append('fileId', 'unique()');
    const fileName = imageUrl.split('/').pop()?.split('?')[0] || `food-${Date.now()}.png`;
    formData.append('file', blob, fileName);

    const uploadRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files`, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': project,
        'X-Appwrite-Platform': platform,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      return imageUrl;
    }

    const file = await uploadRes.json();
    return `${endpoint}/storage/buckets/${bucketId}/files/${file.$id}/view?project=${project}`;
  } catch (err) {
    return imageUrl;
  }
}

async function runSeed() {
  console.log('====================================================');
  console.log('🚀 Starting Appwrite Database Seeding...');
  console.log(`📦 Project: ${project}`);
  console.log(`🗄️ Database: ${databaseId}`);
  console.log('====================================================');

  // Step 1: Clear collections in reverse dependency order
  console.log('\n🧹 Clearing old collection documents...');
  await clearCollection(menuCustomizationsCol, 'Menu Customizations');
  await clearCollection(menuCol, 'Menu');
  await clearCollection(customizationsCol, 'Customizations');
  await clearCollection(categoriesCol, 'Categories');

  // Step 2: Seed Categories
  console.log('\n📁 Seeding Categories...');
  const categoryMap = {};
  for (const cat of dummyData.categories) {
    const res = await apiRequest(
      `${endpoint}/databases/${databaseId}/collections/${categoriesCol}/documents`,
      {
        method: 'POST',
        body: JSON.stringify({
          documentId: 'unique()',
          data: {
            name: cat.name,
            description: cat.description,
          },
        }),
      }
    );
    categoryMap[cat.name] = res.$id;
    console.log(`  ✓ Category: ${cat.name} (${res.$id})`);
  }

  // Step 3: Seed Customizations
  console.log('\n🧂 Seeding Customizations...');
  const customizationMap = {};
  for (const cus of dummyData.customizations) {
    const res = await apiRequest(
      `${endpoint}/databases/${databaseId}/collections/${customizationsCol}/documents`,
      {
        method: 'POST',
        body: JSON.stringify({
          documentId: 'unique()',
          data: {
            name: cus.name,
            price: cus.price,
            type: cus.type,
          },
        }),
      }
    );
    customizationMap[cus.name] = res.$id;
    console.log(`  ✓ Customization: ${cus.name} - $${cus.price} (${cus.type})`);
  }

  // Step 4: Seed Menu Items & Menu Customizations
  console.log('\n🍔 Seeding Menu Items...');
  let menuCount = 0;
  let linkedCount = 0;

  for (const item of dummyData.menu) {
    process.stdout.write(`  Uploading/processing "${item.name}"... `);
    const imageUrl = await uploadImage(item.image_url);

    const res = await apiRequest(
      `${endpoint}/databases/${databaseId}/collections/${menuCol}/documents`,
      {
        method: 'POST',
        body: JSON.stringify({
          documentId: 'unique()',
          data: {
            name: item.name,
            description: item.description,
            image_url: imageUrl,
            price: item.price,
            rating: item.rating,
            calories: item.calories,
            protein: item.protein,
            categories: categoryMap[item.category_name] || null,
          },
        }),
      }
    );
    menuCount++;
    console.log('✓');

    // Link customizations
    if (item.customizations && menuCustomizationsCol) {
      for (const cusName of item.customizations) {
        const cusId = customizationMap[cusName];
        if (cusId) {
          await apiRequest(
            `${endpoint}/databases/${databaseId}/collections/${menuCustomizationsCol}/documents`,
            {
              method: 'POST',
              body: JSON.stringify({
                documentId: 'unique()',
                data: {
                  menu: res.$id,
                  customizations: cusId,
                },
              }),
            }
          );
          linkedCount++;
        }
      }
    }
  }

  console.log('\n====================================================');
  console.log('🎉 Seeding Completed Successfully!');
  console.log(`   - Categories created: ${Object.keys(categoryMap).length}`);
  console.log(`   - Customizations created: ${Object.keys(customizationMap).length}`);
  console.log(`   - Menu Items created: ${menuCount}`);
  console.log(`   - Menu-Customization links created: ${linkedCount}`);
  console.log('====================================================\n');
}

runSeed().catch((err) => {
  console.error('\n❌ Seeding failed with error:', err);
  process.exit(1);
});

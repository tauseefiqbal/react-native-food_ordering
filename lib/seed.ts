import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";

interface Category {
    name: string;
    description: string;
}

interface Customization {
    name: string;
    price: number;
    type: "topping" | "side" | "size" | "crust" | string; // extend as needed
}

interface MenuItem {
    name: string;
    description: string;
    image_url: string;
    price: number;
    rating: number;
    calories: number;
    protein: number;
    category_name: string;
    customizations: string[]; // list of customization names
}

interface DummyData {
    categories: Category[];
    customizations: Customization[];
    menu: MenuItem[];
}

// ensure dummyData has correct shape
const data = dummyData as DummyData;

async function clearAll(collectionId: string): Promise<void> {
    try {
        const list = await databases.listDocuments(
            appwriteConfig.databaseId,
            collectionId
        );

        await Promise.all(
            list.documents.map((doc) =>
                databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)
            )
        );
    } catch (e) {
        console.log(`clearAll skipped for ${collectionId}:`, e);
    }
}

async function clearStorage(): Promise<void> {
    try {
        const list = await storage.listFiles(appwriteConfig.bucketId);

        await Promise.all(
            list.files.map((file) =>
                storage.deleteFile(appwriteConfig.bucketId, file.$id)
            )
        );
    } catch (e) {
        console.log("clearStorage skipped:", e);
    }
}

async function uploadImageToStorage(imageUrl: string): Promise<string> {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        const fileObj = {
            name: imageUrl.split("/").pop()?.split("?")[0] || `file-${Date.now()}.png`,
            type: blob.type || "image/png",
            size: blob.size,
            uri: imageUrl,
        };

        const file = await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            fileObj
        );

        const fileUrl = storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
        return fileUrl.toString();
    } catch (err) {
        console.warn(`Storage upload failed for ${imageUrl}, falling back to remote URL:`, err);
        return imageUrl;
    }
}

async function seed(): Promise<void> {
    console.log("⏳ Seeding started...");

    // 1. Clear in reverse dependency order
    await clearAll(appwriteConfig.menuCustomizationsCollectionId);
    await clearAll(appwriteConfig.menuCollectionId);
    await clearAll(appwriteConfig.customizationsCollectionId);
    await clearAll(appwriteConfig.categoriesCollectionId);
    await clearStorage();

    // 2. Create Categories
    console.log("📁 Creating categories...");
    const categoryMap: Record<string, string> = {};
    for (const cat of data.categories) {
        const doc = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId,
            ID.unique(),
            cat
        );
        categoryMap[cat.name] = doc.$id;
    }

    // 3. Create Customizations
    console.log("🧂 Creating customizations...");
    const customizationMap: Record<string, string> = {};
    for (const cus of data.customizations) {
        const doc = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.customizationsCollectionId,
            ID.unique(),
            {
                name: cus.name,
                price: cus.price,
                type: cus.type,
            }
        );
        customizationMap[cus.name] = doc.$id;
    }

    // 4. Create Menu Items
    console.log("🍔 Creating menu items...");
    const menuMap: Record<string, string> = {};
    for (const item of data.menu) {
        const uploadedImage = await uploadImageToStorage(item.image_url);

        const doc = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            ID.unique(),
            {
                name: item.name,
                description: item.description,
                image_url: uploadedImage,
                price: item.price,
                rating: item.rating,
                calorie: item.calories,
                protein: item.protein,
                categories: categoryMap[item.category_name],
            }
        );

        menuMap[item.name] = doc.$id;

        // 5. Create menu_customizations
        for (const cusName of item.customizations) {
            const cusId = customizationMap[cusName];
            if (cusId) {
                await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.menuCustomizationsCollectionId,
                    ID.unique(),
                    {
                        menu: doc.$id,
                        customizations: cusId,
                    }
                );
            }
        }
    }

    console.log("✅ Seeding complete.");
}

export default seed;

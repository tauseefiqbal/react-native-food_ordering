import { Account, Avatars, Client, Databases, ID, Query, Storage } from "react-native-appwrite";
import { CreateUserParams, GetMenuParams, SignInParams } from "@/type";

export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    platform: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM || "com.ti.foodordering",
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '68629ae60038a7c61fe4',
    bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID || '68643e170015edaa95d7',
    userCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID || '68629b0a003d27acb18f',
    categoriesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID || '68643a390017b239fa0f',
    menuCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MENU_COLLECTION_ID || '68643ad80027ddb96920',
    customizationsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CUSTOMIZATIONS_COLLECTION_ID || '68643c0300297e5abc95',
    menuCustomizationsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MENU_CUSTOMIZATIONS_COLLECTION_ID || '68643cd8003580ecdd8f'
}

export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform)

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const avatars = new Avatars(client);

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === "object" && error !== null && "message" in error) {
        return String(error.message);
    }
    return String(error);
};

export const createUser = async ({ email, password, name }: CreateUserParams) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, name)
        if (!newAccount) throw Error;

        await signIn({ email, password });

        const avatarUrl = avatars.getInitialsURL(name).toString();

        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            { email, name, accountId: newAccount.$id, avatar: avatarUrl }
        );
    } catch (e) {
        throw new Error(getErrorMessage(e));
    }
}

export const signIn = async ({ email, password }: SignInParams) => {
    try {
        try {
            // Appwrite prohibits creating a session if one is already active on the device.
            // Clear any lingering session first.
            await account.deleteSession("current");
        } catch {
            // No active session found to delete, safe to proceed.
        }

        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (e: any) {
        throw new Error(getErrorMessage(e));
    }
}

export const signOut = async () => {
    try {
        await account.deleteSession("current");
    } catch (e: any) {
        throw new Error(getErrorMessage(e));
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        if (!currentAccount) return null;

        try {
            const currentUser = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                [Query.equal('accountId', currentAccount.$id)]
            );

            if (currentUser && currentUser.documents.length > 0) {
                return currentUser.documents[0];
            }

            // If user exists in Auth but not in database collection, auto-create document
            try {
                const avatarUrl = avatars.getInitialsURL(currentAccount.name || currentAccount.email);
                const newDoc = await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.userCollectionId,
                    ID.unique(),
                    {
                        email: currentAccount.email,
                        name: currentAccount.name || currentAccount.email.split('@')[0],
                        accountId: currentAccount.$id,
                        avatar: avatarUrl.toString(),
                    }
                );
                return newDoc;
            } catch (createErr) {
                console.warn("Could not auto-create user document in database:", createErr);
            }
        } catch (dbErr) {
            console.warn("Could not query user collection in database:", dbErr);
        }

        // Fallback: The user IS validly authenticated with Appwrite Auth.
        // Return a constructed User object so the user is not kicked back to the login screen.
        const avatarUrl = avatars.getInitialsURL(currentAccount.name || currentAccount.email);
        return {
            $id: currentAccount.$id,
            $collectionId: appwriteConfig.userCollectionId,
            $databaseId: appwriteConfig.databaseId,
            $createdAt: currentAccount.$createdAt,
            $updatedAt: currentAccount.$updatedAt,
            $permissions: [],
            name: currentAccount.name || currentAccount.email.split('@')[0],
            email: currentAccount.email,
            avatar: avatarUrl.toString(),
        } as any;
    } catch (error) {
        console.log("getCurrentUser: No active session or failed to get account:", error);
        return null;
    }
}

export const getMenu = async ({ category, query }: GetMenuParams) => {
    try {
        const queries: string[] = [];

        if (category) queries.push(Query.equal('categories', category));

        const menus = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries,
        )

        if (!query?.trim()) return menus.documents;

        const normalizedQuery = query.trim().toLowerCase();
        return menus.documents.filter((menu) =>
            String(menu.name ?? '').toLowerCase().includes(normalizedQuery)
        );
    } catch (e) {
        throw new Error(getErrorMessage(e));
    }
}

export const getCategories = async () => {
    try {
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId,
        )

        return categories.documents;
    } catch (e) {
        throw new Error(getErrorMessage(e));
    }
}

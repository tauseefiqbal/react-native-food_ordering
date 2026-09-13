import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { images } from "@/constants";
import { signOut } from "@/lib/appwrite";
import useAuthStore from "@/store/auth.store";

const Profile = () => {
    const { user, setIsAuthenticated, setUser } = useAuthStore();

    const handleSignOut = async () => {
        try {
            await signOut();
            setUser(null);
            setIsAuthenticated(false);
            router.replace("/sign-in");
        } catch (error) {
            Alert.alert(
                "Unable to sign out",
                error instanceof Error ? error.message : "Please try again."
            );
        }
    };

    const displayName = user?.name || "Food lover";
    const email = user?.email || "No email available";

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView contentContainerClassName="px-5 pb-32">
                <View className="flex-row items-center justify-between py-5">
                    <Text className="h3-bold text-dark-100">My Profile</Text>
                    <Pressable
                        accessibilityLabel="Edit profile"
                        className="profile-edit"
                        onPress={() => Alert.alert("Coming soon", "Profile editing is not available yet.")}
                    >
                        <Image source={images.pencil} className="size-4" resizeMode="contain" />
                    </Pressable>
                </View>

                <View className="items-center rounded-2xl bg-white-100 px-5 py-8">
                    <Image
                        source={user?.avatar ? { uri: user.avatar } : images.avatar}
                        className="profile-avatar"
                        resizeMode="cover"
                    />
                    <Text className="base-bold mt-4 text-dark-100">{displayName}</Text>
                    <Text className="body-regular mt-1 text-gray-200">{email}</Text>
                </View>

                <View className="mt-6 gap-3">
                    <ProfileField icon={images.envelope} label="Email" value={email} />
                    <ProfileField
                        icon={images.location}
                        label="Delivery location"
                        value="Croatia"
                    />
                </View>

                <Pressable
                    accessibilityRole="button"
                    className="mt-8 flex-row items-center justify-center gap-2 rounded-full border border-error py-4"
                    onPress={handleSignOut}
                >
                    <Image source={images.logout} className="size-5" resizeMode="contain" tintColor="#F14141" />
                    <Text className="paragraph-bold text-error">Sign Out</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
};

const ProfileField = ({
    icon,
    label,
    value,
}: {
    icon: typeof images.envelope;
    label: string;
    value: string;
}) => (
    <View className="profile-field rounded-xl border border-gray-200 p-4">
        <View className="profile-field__icon">
            <Image source={icon} className="size-5" resizeMode="contain" tintColor="#FE8C00" />
        </View>
        <View className="flex-1">
            <Text className="small-bold text-gray-200">{label}</Text>
            <Text className="paragraph-semibold mt-1 text-dark-100">{value}</Text>
        </View>
    </View>
);

export default Profile

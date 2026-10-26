import { Alert, View, Text, FlatList } from 'react-native'
import {SafeAreaView} from "react-native-safe-area-context";
import {useCartStore} from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import cn from "clsx";
import CustomButton from "@/components/CustomButton";
import CartItem from "@/components/CartItem";
import { PaymentInfoStripeProps } from "@/type";
import { useState } from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createCheckoutSession } from "@/lib/appwrite";

const PaymentInfoStripe = ({ label,  value,  labelStyle,  valueStyle, }: PaymentInfoStripeProps) => (
    <View className="flex-between flex-row my-1">
        <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>
            {label}
        </Text>
        <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>
            {value}
        </Text>
    </View>
);

const Cart = () => {
    const { items, getTotalItems, getTotalPrice, clearCart } = useCartStore();

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();
    const orderTotal = totalPrice + 5 - 0.5;

    const [isPaying, setIsPaying] = useState(false);

    const handleOrder = async () => {
        if (items.length === 0) {
            Alert.alert("Your cart is empty", "Add an item before placing an order.");
            return;
        }

        setIsPaying(true);
        try {
            // Stripe sends the browser back to this deep link after payment or cancel.
            const redirectUrl = Linking.createURL("payment-result");
            const checkoutUrl = await createCheckoutSession(items, redirectUrl);
            const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, redirectUrl);

            if (result.type === "success" && Linking.parse(result.url).queryParams?.status === "success") {
                clearCart();
                Alert.alert("Order placed", "Payment received. Your order has been placed successfully.");
            } else {
                Alert.alert("Payment not completed", "Your order was not placed. You can try again.");
            }
        } catch (e: any) {
            Alert.alert("Payment failed", e?.message ?? "Something went wrong. Please try again.");
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <SafeAreaView className="bg-white h-full">
            <FlatList
                data={items}
                renderItem={({ item }) => <CartItem item={item} />}
                keyExtractor={(item) => `${item.id}-${(item.customizations ?? []).map(({ id }) => id).sort().join('-')}`}
                contentContainerClassName="pb-28 px-5 pt-5"
                ListHeaderComponent={() => <CustomHeader title="Your Cart" />}
                ListEmptyComponent={() => <Text>Cart Empty</Text>}
                ListFooterComponent={() => totalItems > 0 && (
                    <View className="gap-5">
                        <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                            <Text className="h3-bold text-dark-100 mb-5">
                                Payment Summary
                            </Text>

                            <PaymentInfoStripe
                                label="Subtotal"
                                value={`$${totalPrice.toFixed(2)}`}
                            />
                            <PaymentInfoStripe
                                label={`Delivery Fee`}
                                value={`$5.00`}
                            />
                            <PaymentInfoStripe
                                label={`Discount`}
                                value={`- $0.50`}
                                valueStyle="!text-success"
                            />
                            <View className="border-t border-gray-300 my-2" />
                            <PaymentInfoStripe
                                label={`Total`}
                                value={`$${orderTotal.toFixed(2)}`}
                                labelStyle="base-bold !text-dark-100"
                                valueStyle="base-bold !text-dark-100 !text-right"
                            />
                        </View>

                        <CustomButton title="Order Now" onPress={handleOrder} isLoading={isPaying} />
                    </View>
                )}
            />
        </SafeAreaView>
    )
}

export default Cart

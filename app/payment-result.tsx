import { Redirect } from "expo-router";

// Stripe Checkout returns to fastfood://payment-result; the cart screen handles the outcome.
const PaymentResult = () => <Redirect href="/cart" />;

export default PaymentResult;

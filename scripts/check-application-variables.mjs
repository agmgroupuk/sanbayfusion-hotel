for (const name of ["STRIPE_SECRET_KEY", "DATABASE_URL", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET", "MEMBERSHIP_ADMIN_EMAILS", "GOOGLE_MAPS_SERVER_API_KEY"]) {
 const value = process.env[name];
 const wrong = name === "STRIPE_SECRET_KEY" && value && !value.startsWith("sk_test_") || name === "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" && value && !value.startsWith("pk_test_");
 console.log(`${name}: ${value === undefined ? "MISSING" : !value.trim() ? "EMPTY" : wrong ? "WRONG MODE" : "PRESENT"}`);
}

package com.nikahpathway.app.billing;

import android.app.Activity;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Collections;
import java.util.List;

/**
 * Thin bridge to Android's Play Billing Library. Deliberately does not
 * acknowledge purchases itself (Google's own recommendation for apps with a
 * backend): it hands the raw (productId, purchaseToken) pair back to the
 * web layer, which verifies and acknowledges server-side via
 * verifyGooglePlayPurchase — the same "server is the source of truth"
 * pattern the existing Stripe webhook already uses.
 */
@CapacitorPlugin(name = "GooglePlayBilling")
public class GooglePlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build();
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {}

            @Override
            public void onBillingServiceDisconnected() {}
        });
    }

    private void ensureReady(Runnable onReady, PluginCall callToRejectOnFailure) {
        if (billingClient.isReady()) {
            onReady.run();
            return;
        }
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    onReady.run();
                } else {
                    callToRejectOnFailure.reject(billingResult.getDebugMessage(), "BILLING_UNAVAILABLE");
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                callToRejectOnFailure.reject("Billing service disconnected", "BILLING_UNAVAILABLE");
            }
        });
    }

    @PluginMethod
    public void purchaseSubscription(PluginCall call) {
        String productId = call.getString("productId");
        String basePlanId = call.getString("basePlanId");
        String obfuscatedAccountId = call.getString("obfuscatedAccountId");
        if (productId == null || basePlanId == null || obfuscatedAccountId == null) {
            call.reject("Missing productId, basePlanId or obfuscatedAccountId", "INVALID_ARGS");
            return;
        }
        if (pendingPurchaseCall != null) {
            call.reject("A purchase is already in progress", "BUSY");
            return;
        }

        ensureReady(() -> {
            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()
                ))
                .build();

            billingClient.queryProductDetailsAsync(params, (billingResult, queryResult) -> {
                List<ProductDetails> productDetailsList = queryResult.getProductDetailsList();
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK
                        || productDetailsList.isEmpty()) {
                    call.reject("Could not load this plan: " + billingResult.getDebugMessage(), "PRODUCT_NOT_FOUND");
                    return;
                }
                ProductDetails details = productDetailsList.get(0);
                String offerToken = null;
                List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
                if (offers != null) {
                    for (ProductDetails.SubscriptionOfferDetails offer : offers) {
                        if (basePlanId.equals(offer.getBasePlanId())) {
                            offerToken = offer.getOfferToken();
                            break;
                        }
                    }
                }
                if (offerToken == null) {
                    call.reject("This plan is not available right now", "PRODUCT_NOT_FOUND");
                    return;
                }

                BillingFlowParams.ProductDetailsParams pdParams = BillingFlowParams.ProductDetailsParams
                    .newBuilder()
                    .setProductDetails(details)
                    .setOfferToken(offerToken)
                    .build();
                launch(call, pdParams, obfuscatedAccountId);
            });
        }, call);
    }

    @PluginMethod
    public void purchaseOneTime(PluginCall call) {
        String productId = call.getString("productId");
        String obfuscatedAccountId = call.getString("obfuscatedAccountId");
        if (productId == null || obfuscatedAccountId == null) {
            call.reject("Missing productId or obfuscatedAccountId", "INVALID_ARGS");
            return;
        }
        if (pendingPurchaseCall != null) {
            call.reject("A purchase is already in progress", "BUSY");
            return;
        }

        ensureReady(() -> {
            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build()
                ))
                .build();

            billingClient.queryProductDetailsAsync(params, (billingResult, queryResult) -> {
                List<ProductDetails> productDetailsList = queryResult.getProductDetailsList();
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK
                        || productDetailsList.isEmpty()) {
                    call.reject("Could not load this plan: " + billingResult.getDebugMessage(), "PRODUCT_NOT_FOUND");
                    return;
                }
                BillingFlowParams.ProductDetailsParams pdParams = BillingFlowParams.ProductDetailsParams
                    .newBuilder()
                    .setProductDetails(productDetailsList.get(0))
                    .build();
                launch(call, pdParams, obfuscatedAccountId);
            });
        }, call);
    }

    private void launch(PluginCall call, BillingFlowParams.ProductDetailsParams pdParams, String obfuscatedAccountId) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("App is not in the foreground", "NO_ACTIVITY");
            return;
        }
        BillingFlowParams flowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(Collections.singletonList(pdParams))
            .setObfuscatedAccountId(obfuscatedAccountId)
            .build();
        call.setKeepAlive(true);
        pendingPurchaseCall = call;
        billingClient.launchBillingFlow(activity, flowParams);
    }

    @PluginMethod
    public void queryPurchases(PluginCall call) {
        ensureReady(() -> {
            JSArray results = new JSArray();
            QueryPurchasesParams subsParams = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build();
            billingClient.queryPurchasesAsync(subsParams, (subsResult, subsPurchases) -> {
                appendPurchases(results, subsPurchases);

                QueryPurchasesParams inappParams = QueryPurchasesParams.newBuilder()
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build();
                billingClient.queryPurchasesAsync(inappParams, (inappResult, inappPurchases) -> {
                    appendPurchases(results, inappPurchases);
                    JSObject ret = new JSObject();
                    ret.put("purchases", results);
                    call.resolve(ret);
                });
            });
        }, call);
    }

    private void appendPurchases(JSArray results, List<Purchase> purchases) {
        for (Purchase purchase : purchases) {
            if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) continue;
            for (String productId : purchase.getProducts()) {
                JSObject entry = new JSObject();
                entry.put("productId", productId);
                entry.put("purchaseToken", purchase.getPurchaseToken());
                results.put(entry);
            }
        }
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        PluginCall call = pendingPurchaseCall;
        pendingPurchaseCall = null;
        if (call == null) return;

        int code = billingResult.getResponseCode();
        if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            call.reject("Purchase cancelled", "USER_CANCELED");
            return;
        }
        if (code == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            call.reject("Item already owned", "ITEM_ALREADY_OWNED");
            return;
        }
        if (code != BillingClient.BillingResponseCode.OK || purchases == null || purchases.isEmpty()) {
            call.reject("Purchase failed: " + billingResult.getDebugMessage(), "PURCHASE_FAILED");
            return;
        }

        Purchase purchase = purchases.get(0);
        JSObject result = new JSObject();
        result.put("productId", purchase.getProducts().isEmpty() ? "" : purchase.getProducts().get(0));
        result.put("purchaseToken", purchase.getPurchaseToken());
        call.resolve(result);
    }
}

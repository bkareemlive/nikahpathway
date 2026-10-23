import Foundation
import Capacitor
import StoreKit

/// Native StoreKit 2 bridge for the membership screen (src/lib/capacitor-billing.ts).
/// It only runs purchases and reports transaction ids; the server decides
/// whether a purchase is real by asking Apple (src/lib/app-store.ts).
@objc(AppStoreBillingPlugin)
public class AppStoreBillingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppStoreBillingPlugin"
    public let jsName = "AppStoreBilling"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise)
    ]

    private var updatesTask: Task<Void, Never>?

    public override func load() {
        // Transactions that arrive outside a purchase flow (renewals, Ask to
        // Buy approvals) must still be finished. The server learns about them
        // through App Store Server Notifications, not from here.
        updatesTask = Task.detached {
            for await result in Transaction.updates {
                if case .verified(let transaction) = result {
                    await transaction.finish()
                }
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let ids = call.getArray("productIds", String.self) else {
            call.reject("Missing productIds", "INVALID_ARGUMENT")
            return
        }
        Task {
            do {
                let products = try await Product.products(for: ids)
                let mapped: [[String: Any]] = products.map {
                    ["productId": $0.id, "displayPrice": $0.displayPrice]
                }
                call.resolve(["products": mapped])
            } catch {
                call.reject(error.localizedDescription, "PRODUCTS_FAILED", error)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"),
              let tokenString = call.getString("appAccountToken"),
              let accountToken = UUID(uuidString: tokenString) else {
            call.reject("Missing or invalid arguments", "INVALID_ARGUMENT")
            return
        }
        Task {
            do {
                guard let product = try await Product.products(for: [productId]).first else {
                    call.reject("Product not found", "PRODUCT_NOT_FOUND")
                    return
                }
                let result = try await product.purchase(options: [.appAccountToken(accountToken)])
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        let transactionId = String(transaction.id)
                        await transaction.finish()
                        call.resolve(["status": "success", "transactionId": transactionId])
                    case .unverified:
                        call.reject("The purchase could not be verified.", "UNVERIFIED")
                    }
                case .userCancelled:
                    call.resolve(["status": "cancelled"])
                case .pending:
                    call.resolve(["status": "pending"])
                @unknown default:
                    call.reject("Unknown purchase result", "PURCHASE_FAILED")
                }
            } catch {
                call.reject(error.localizedDescription, "PURCHASE_FAILED", error)
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                var ids: [String] = []
                for await result in Transaction.currentEntitlements {
                    if case .verified(let transaction) = result, transaction.revocationDate == nil {
                        ids.append(String(transaction.id))
                    }
                }
                call.resolve(["transactionIds": ids])
            } catch {
                call.reject(error.localizedDescription, "RESTORE_FAILED", error)
            }
        }
    }
}

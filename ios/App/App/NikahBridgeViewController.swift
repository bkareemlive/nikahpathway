import UIKit
import Capacitor

/// Capacitor's bridge, plus the app-local StoreKit billing plugin (plugins
/// that live in the app target aren't auto-registered).
class NikahBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppStoreBillingPlugin())
    }
}

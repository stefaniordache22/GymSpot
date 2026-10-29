import Capacitor

class GymSpotViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(GymSpotHealthPlugin())
    }
}

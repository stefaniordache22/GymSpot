import Foundation
import Capacitor
import HealthKit

@objc(GymSpotHealthPlugin)
public class GymSpotHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GymSpotHealthPlugin"
    public let jsName = "GymSpotHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestAccess", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readWorkouts", returnType: CAPPluginReturnPromise)
    ]
    private let store = HKHealthStore()

    @objc func requestAccess(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("Apple Health is not available on this device.")
            return
        }
        // Read-only: GymSpot never writes to Health or requests unrelated metrics.
        store.requestAuthorization(toShare: [], read: [HKObjectType.workoutType()]) { completed, error in
            if let error = error { call.reject(error.localizedDescription); return }
            guard completed else { call.reject("The Health permission request did not complete."); return }
            // Apple deliberately does not disclose whether read permission was granted.
            call.resolve(["promptCompleted": true])
        }
    }

    @objc func readWorkouts(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { call.reject("Health is unavailable."); return }
        let days = min(365, max(1, call.getInt("days") ?? 30))
        let end = Date()
        guard let start = Calendar.current.date(byAdding: .day, value: -days, to: end) else {
            call.reject("Could not calculate the Health date range."); return
        }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let query = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: predicate,
                                  limit: HKObjectQueryNoLimit,
                                  sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, samples, error in
            if let error = error { call.reject(error.localizedDescription); return }
            let formatter = DateFormatter()
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.calendar = Calendar(identifier: .gregorian)
            formatter.dateFormat = "yyyy-MM-dd"
            let workouts: [[String: Any]] = (samples as? [HKWorkout] ?? []).map { workout in
                ["healthId": "healthkit:" + workout.uuid.uuidString,
                 "type": Self.label(for: workout.workoutActivityType),
                 "minutes": (workout.duration / 60 * 10).rounded() / 10,
                 "date": formatter.string(from: workout.startDate),
                 "source": "Apple Health"]
            }
            call.resolve(["workouts": workouts])
        }
        store.execute(query)
    }

    private static func label(for activity: HKWorkoutActivityType) -> String {
        switch activity {
        case .running: return "Running"
        case .walking: return "Walking"
        case .cycling: return "Cycling"
        case .traditionalStrengthTraining, .functionalStrengthTraining: return "Strength"
        case .highIntensityIntervalTraining: return "HIIT"
        case .yoga, .flexibility: return "Mobility"
        case .swimming: return "Swimming"
        default: return "Workout"
        }
    }
}

import { useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Info,
  Zap,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [pulseInterval, setPulseInterval] = useState("30");
  const [gpsAccuracy, setGpsAccuracy] = useState("high");
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  const Toggle = ({ on, toggle }: { on: boolean; toggle: () => void }) => (
    <button
      onClick={toggle}
      className="transition-colors rounded-lg p-1"
      style={{ color: on ? "var(--thor-safe)" : "var(--thor-text-disabled)" }}
    >
      {on ? (
        <ToggleRight className="w-6 h-6" />
      ) : (
        <ToggleLeft className="w-6 h-6" />
      )}
    </button>
  );

  const SettingCard = ({ icon: Icon, title, description, children }: any) => (
    <div
      className="rounded-18 p-6 transition-all hover:shadow-lg"
      style={{
        background: "var(--thor-surface-2)",
        border: "1px solid var(--thor-border)",
        boxShadow: "var(--thor-shadow-sm)",
      }}
    >
      <div className="flex items-start gap-3 mb-5">
        {Icon && (
          <div
            className="p-3 rounded-lg"
            style={{ background: "var(--thor-brand)" + "15" }}
          >
            <Icon className="w-5 h-5" style={{ color: "var(--thor-brand)" }} />
          </div>
        )}
        <div className="flex-1">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--thor-text)" }}
          >
            {title}
          </h3>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--thor-text-muted)" }}
          >
            {description}
          </p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const SettingItem = ({ label, description, control }: any) => (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-lg transition-all"
      style={{
        background: "var(--thor-surface)" + "60",
        border: "1px solid var(--thor-border)" + "40",
      }}
    >
      <div>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--thor-text)" }}
        >
          {label}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--thor-text-muted)" }}
        >
          {description}
        </p>
      </div>
      {control}
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="p-3 rounded-xl"
            style={{ background: "var(--thor-brand)" + "20" }}
          >
            <Zap className="w-5 h-5" style={{ color: "var(--thor-brand)" }} />
          </div>
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--thor-text)" }}
            >
              Settings
            </h1>
            <p
              className="text-sm mt-1 font-medium"
              style={{ color: "var(--thor-text-muted)" }}
            >
              Personalize your THOR experience
            </p>
          </div>
        </div>
      </div>

      {/* Safety Settings */}
      <SettingCard
        icon={Shield}
        title="Safety Configuration"
        description="Configure how THOR monitors and alerts you about safety"
      >
        <SettingItem
          label="Safety Pulse Interval"
          description="How often to receive automated safety check-ins"
          control={
            <select
              value={pulseInterval}
              onChange={(e) => setPulseInterval(e.target.value)}
              className="input text-sm py-2 px-3"
              style={{ width: "auto", maxWidth: "150px" }}
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </select>
          }
        />
        <SettingItem
          label="GPS Accuracy"
          description="Higher accuracy provides better precision but uses more battery"
          control={
            <select
              value={gpsAccuracy}
              onChange={(e) => setGpsAccuracy(e.target.value)}
              className="input text-sm py-2 px-3"
              style={{ width: "auto", maxWidth: "150px" }}
            >
              <option value="high">High (5m)</option>
              <option value="balanced">Balanced (15m)</option>
              <option value="low">Low (50m)</option>
            </select>
          }
        />
      </SettingCard>

      {/* Notification Settings */}
      <SettingCard
        icon={Bell}
        title="Notification Preferences"
        description="Control how and when you receive alerts"
      >
        <SettingItem
          label="Push Notifications"
          description="Critical safety alerts and emergency notifications"
          control={
            <Toggle
              on={notifications}
              toggle={() => setNotifications(!notifications)}
            />
          }
        />
        <SettingItem
          label="Sound Alerts"
          description="Audible alerts for hazard warnings"
          control={
            <Toggle
              on={soundAlerts}
              toggle={() => setSoundAlerts(!soundAlerts)}
            />
          }
        />
        <SettingItem
          label="Email Updates"
          description="Weekly summary of your travels and safety metrics"
          control={
            <Toggle
              on={emailUpdates}
              toggle={() => setEmailUpdates(!emailUpdates)}
            />
          }
        />
      </SettingCard>

      {/* Appearance Settings */}
      <SettingCard
        icon={Monitor}
        title="Appearance & Theme"
        description="Customize how THOR looks"
      >
        <div className="grid grid-cols-3 gap-3 pl-0">
          {[
            { label: "Light", icon: Sun, value: "light" },
            { label: "Dark", icon: Moon, value: "dark" },
          ].map((option) => {
            const OptionIcon = option.icon;
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={toggleTheme}
                className="p-4 rounded-xl border-2 transition-all text-center"
                style={{
                  borderColor: isActive
                    ? "var(--thor-brand)"
                    : "var(--thor-border)",
                  backgroundColor: isActive
                    ? "var(--thor-brand)" + "15"
                    : "var(--thor-surface-2)",
                }}
              >
                <OptionIcon
                  className="w-5 h-5 mx-auto mb-2"
                  style={{
                    color: isActive
                      ? "var(--thor-brand)"
                      : "var(--thor-text-muted)",
                  }}
                />
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: isActive ? "var(--thor-brand)" : "var(--thor-text)",
                  }}
                >
                  {option.label}
                </p>
              </button>
            );
          })}
        </div>
      </SettingCard>

      {/* System Settings */}
      <SettingCard
        icon={Globe}
        title="System Region"
        description="Location and language preferences"
      >
        <SettingItem
          label="Region"
          description="India"
          control={
            <ChevronRight
              className="w-4 h-4"
              style={{ color: "var(--thor-text-muted)" }}
            />
          }
        />
        <SettingItem
          label="Language"
          description="English, Hindi, Tamil, Telugu supported"
          control={
            <ChevronRight
              className="w-4 h-4"
              style={{ color: "var(--thor-text-muted)" }}
            />
          }
        />
      </SettingCard>

      {/* About & Legal */}
      <SettingCard
        icon={Info}
        title="About & Support"
        description="App information and resources"
      >
        <div className="space-y-2 pl-0">
          <div
            className="flex justify-between py-2 px-3"
            style={{ backgroundColor: "var(--thor-surface-2)" + "40" }}
          >
            <p
              className="text-sm"
              style={{ color: "var(--thor-text-muted)", fontWeight: 500 }}
            >
              App Version
            </p>
            <p
              className="text-sm font-mono"
              style={{ color: "var(--thor-text)" }}
            >
              1.0.0
            </p>
          </div>
          <div
            className="flex justify-between py-2 px-3"
            style={{ backgroundColor: "var(--thor-surface-2)" + "40" }}
          >
            <p
              className="text-sm"
              style={{ color: "var(--thor-text-muted)", fontWeight: 500 }}
            >
              Build
            </p>
            <p
              className="text-sm font-mono"
              style={{ color: "var(--thor-text)" }}
            >
              24.Q1
            </p>
          </div>
        </div>
      </SettingCard>

      {/* Footer Note */}
      <div
        className="text-center py-4 rounded-xl"
        style={{
          backgroundColor: "var(--thor-info)" + "10",
          border: "1px solid var(--thor-info)" + "20",
        }}
      >
        <p className="text-xs" style={{ color: "var(--thor-text-muted)" }}>
          THOR Safety Platform keeps you secure on every journey
        </p>
      </div>
    </div>
  );
}
